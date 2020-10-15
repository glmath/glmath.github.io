import React, { Component } from "react";
import { Container , Modal, Button} from "react-bootstrap";
import {
    HashRouter,
    Switch,
    Route,
    Link,
    Redirect,
    useParams,
} from "react-router-dom";

class LessonBrowser extends Component {

    constructor(props) {
        super(props);

        this.state = {
            newLessonInput: "", //
            lessonTree: { children: [] }, // where the lesson tree is storeed
            showingUploadModal: false,
        };

        if (this.props.isAdmin) {
            this.refreshLessonsFromServer(); // load the lesson tree from the server
        } else {
            this.getFromGithub();
        }
    }
    componentDidMount() {
    }


    createNewLesson = () => {

        let lessonName = this.state.newLessonInput;
        // create lesson id using time and name
        let lessonId = lessonName.trim().replace(/\s+/g, "") + new Date().getTime();

        // send request to server to create new lesson
        fetch(this.props.url + "/post/create/lesson/", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: lessonId,
                name: lessonName,
                content: "",
                parentId: "root",
                children: [],
            })
        }).then(() => {
            this.refreshLessonsFromServer();
        });

    }


    refreshLessonsFromServer = () => {
        fetch(this.props.url + "/get/lesson-tree/root", {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        }).then(response => response.json())

            .then(data => {
                this.setState({
                    lessonTree: data,
                })
            });

    }
    getFromGithub = () => {
        let url = this.props.clientUrl + "/lessons/lessontree.json";

        fetch(url, {
            // headers: {
            //   "pragma": "no-cache",
            //   'Cache-Control': 'no-cache'
            // }
        })
            .then(function (response) {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Error in getting lesson.');
            })
            .then(function (data) {
                console.log(data);
                this.setState({
                    lessonTree: data,
                });
            }.bind(this))
            .catch(function (err) {
                console.log("failed to load ", url, err.message);
            });

    }
    saveToGithub = () => {
        this.setState({ showingUploadModal: true });

        fetch(this.props.url + "/post/lesson-tree-to-github/", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
            })
        })
    }

    render() {
        return (
            <div>
                Lesson Browser
                <div className="lesson-links">

                    {this.props.isAdmin ? <div>
                        <button onClick={() => {
                            this.setState({ showingUploadModal: true });
                            this.saveToGithub();
                        }}> Publish lesson tree to main site </button>
                        <UploadToServerModal isShowing={this.state.showingUploadModal} close={() => this.setState({ showingUploadModal: false })} /> </div> : ""
                        }


                    {<LessonListing lesson={this.state.lessonTree} />}

                    <input type="text"
                        value={this.state.newLessonInput}
                        onChange={(e) => this.setState({ newLessonInput: e.target.value })} />

                    <button onClick={this.createNewLesson}> create </button>

                </div>

            </div>
        );
    }


}

// this is a recursive componenet, that recursivly displays its children untill it runs out
function LessonListing(props) {
    return (
        <div>
            <Link to={"/math/" + props.lesson.id}>
                <li key={props.lesson.id}>{props.lesson.name}</li>
            </Link>

            <ul>
                {props.lesson.children.map(child => {
                    return (<LessonListing key={child.id} lesson={child} />);
                })}
            </ul>
        </div>
    )
}

function UploadToServerModal(props) {

    const handleClose = () => props.close();

    return (
        <Modal show={props.isShowing} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Published to everyone!</Modal.Title>
            </Modal.Header>
            <Modal.Body>This lesson tree has been published to everyone! However it might take a few minutes to show up on the regular website.</Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
          </Button>
            </Modal.Footer>
        </Modal>
    );
}


export default LessonBrowser;

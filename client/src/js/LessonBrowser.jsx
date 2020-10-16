import React, { Component } from "react";
import { Container, Modal, Button } from "react-bootstrap";
import {
    HashRouter,
    Switch,
    Route,
    Link,
    Redirect,
    useParams,
} from "react-router-dom";
import Nestable from 'react-nestable';

class LessonBrowser extends Component {

    constructor(props) {
        super(props);

        this.state = {
            newLessonInput: "", //
            lessonTree: [{ id: '', name: '' }], // where the lesson tree is storeed
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

    saveLessonToServer = (id, parentId) => {

        console.log("telling server to move id", id, " to parent ", parentId);
        fetch(this.props.url + "/post/lesson/", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: id,
                parentId: parentId,
            })
        })
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
    lessonTreeNestChange = (tree, item) => {
        console.log(JSON.stringify(item));
        console.log(tree);

        // bfs to look for parent 
        let queue = [];
        queue.push(tree[0]);
        let parentId = null
        while(queue.length > 0){
            let poppedItem = queue.pop();
            if(poppedItem.children.length < 1){
                continue;
            }
            queue.push(...poppedItem.children);
            // if this current node has the item we want as a child, then it must be the parerent so we save that
            let searchItem = poppedItem.children.find(i => item.id === i.id);

            if(searchItem != undefined && searchItem != null){
                console.log("FOUND", searchItem);
                parentId = poppedItem.id; // we have it as a child so must be parent
                break;
            }
        }

        if(parentId != null){
            this.saveLessonToServer(item.id, parentId);
        }else{
            console.error("Parent not found!");
        }
        

    }

    render() {
        console.log(this.state.lessonTree)
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


                    <Nestable
                        items={this.state.lessonTree}
                        renderItem={LessonListing}
                        onChange={this.lessonTreeNestChange}
                    />
                    {/* {<LessonListing lesson={this.state.lessonTree} />} */}

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
            {/* {props} */}
            <Link to={"/math/" + props.item.id}>
                <span className="lesson-browser-lesson-text" key={props.item.id}>{props.item.name}</span>
            </Link>

            {/* <ul>
                {props.lesson.children.map(child => {
                    return (<LessonListing key={child.id} lesson={child} />);
                })}
            </ul> */}
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

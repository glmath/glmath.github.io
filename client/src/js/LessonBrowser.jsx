import React, { Component } from "react";
import { Container } from "react-bootstrap";
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
            newLessonInput: "",
            lessonTree: { children: [] },
        };

        this.refreshLessonsFromServer();
    }
    componentDidMount() {
    }

    getFromServer = () => {
        fetch(this.props.url + "/get/lesson/" + this.props.id, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        }).then(response => response.json())
            .then(data => {
                this.setState({
                    starting_value: data.lesson.content,
                    raw_content: data.lesson.content,
                })
            });
    }



    createNewLesson = () => {
        let lessonName = this.state.newLessonInput;
        // create lesson id using time and name
        let lessonId = lessonName.trim().replace(/\s+/g, "") + new Date().getTime();
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
        fetch(this.props.url + "/get/lesson-tree/root" + this.props.id, {
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

    render() {
        // let tree = <div></div>;
        // let stack = [];
        // stack.push(this.state.lessonTree);
        // while (stack.length > 0) {

        //     let lesson = stack.pop();
        // }

        return (
            <div>
                Lesson Browser
                <div className="lesson-links">
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


export default LessonBrowser;

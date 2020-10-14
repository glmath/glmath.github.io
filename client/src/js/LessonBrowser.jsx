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
        console.log(this.state.lessonTree);
        // let tree = <div></div>;
        // let stack = [];
        // stack.push(this.state.lessonTree);
        // while (stack.length > 0) {

        //     let lesson = stack.pop();
        // }

                console.log(this.state.lessonTree);
        return (
            <div>
                Lesson Browser
                <div className="lesson-links">
                    {<LessonListing  lesson={this.state.lessonTree} />}

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
            <li key={props.lesson.id}>{props.lesson.name}</li>
            <ul>
                {props.lesson.children.map(child => {
                    console.log(child);
                    return(<LessonListing key={child.id} lesson={child} />);
                })}
            </ul>
        </div>
    )
}


export default LessonBrowser;

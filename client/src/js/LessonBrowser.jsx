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
    };
  }

  getFromServer = () => {
    console.log(this.props);
    fetch(this.props.url + "/get/lesson/" + this.props.id, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }).then(response => response.json())
      .then(data => {
        this.setState({ 
          starting_value: data.lesson.content ,
          raw_content: data.lesson.content,
        })
        console.log(data);
      });
  }



  createNewLesson = () => {
      let lessonName = this.state.newLessonInput;
      // create lesson id using time and name
      let lessonId = lessonName.trim().replace(/\s+/g, "") + new Date().getTime();
      console.log(lessonId)

  }

  render(){
      return (
          <div>
                Lesson Browser
                <div className="lesson-links">
                    {/* <Link to="/math/one">To One</Link> */}
                    <input type="text" 
                       value={this.state.newLessonInput} 
                       onChange={(e) => this.setState({newLessonInput: e.target.value})}/>
                    <button onClick={this.createNewLesson}> create </button>

                </div>

          </div>
      );
  }


}



export default LessonBrowser;

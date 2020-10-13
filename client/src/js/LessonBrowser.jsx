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

  render(){
      return (
          <div>
                Lesson Browser
                <div className="lesson-links">
                    <Link to="/math/one">To One</Link>
                </div>

          </div>
      );
  }


}



export default LessonBrowser;

import React, {Component} from "react";
import {Container} from "react-bootstrap";
import {
  HashRouter,
  Switch,
  Route,
  Link,
  Redirect,
  useParams,
} from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';

import Login from "./Login.jsx";
import CreateAccount from "./CreateAccount.jsx";

import Lesson from "./Lesson.jsx"
import LessonBrowser from "./LessonBrowser.jsx"
class LMath extends Component {

  constructor(props){
    super(props);
  }

  render(){
    return (
      <Container >

      <HashRouter>
        <Switch>
          <Route path="/login">
            <Login url={this.props.url} />
          </Route>

          <Route path="/create-account">
            <CreateAccount url={this.props.url}/>
          </Route>
          <Route path="/math/:id" children={ <LessonLoader url={this.props.url} /> }></Route>

          <Route path="/browser">
            <LessonBrowser url={this.props.url} />
          </Route>

          <Route path="/">
            <Redirect to="/browser" />
          </Route>


        </Switch>

      </HashRouter>

    </Container>
    );
  }

}

function LessonLoader(props){
  let { id } = useParams();

  return (
    <div>
      <Lesson id={id} url={props.url}/>
    </div>
  );
}

export default LMath;

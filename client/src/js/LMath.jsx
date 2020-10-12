import React, {Component} from "react";
import {Container} from "react-bootstrap";
import {
  HashRouter,
  Switch,
  Route,
  Link,
  Redirect,
} from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';

import Login from "./Login.jsx";
import CreateAccount from "./CreateAccount.jsx";

import Lesson from "./Lesson.jsx"
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
          <Route path="/math">
            <Lesson></Lesson>
          </Route>
          <Route path="/">
            <Redirect to="/math" />
          </Route>


        </Switch>

      </HashRouter>

    </Container>
    );
  }

}

export default LMath;

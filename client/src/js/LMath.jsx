import React, {Component} from "react";
import {Container, Button} from "react-bootstrap";
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

import Cookies from 'universal-cookie';
const cookies = new Cookies();

class LMath extends Component {

  constructor(props){
    super(props);
    // TEMP FOR TESTING 
    let admin = cookies.get("isAdmin") == "true";

    this.state = {
      isAdmin: admin,
    }
  }

  render(){
    return (
      <Container >

        <Button variant="dark" onClick={() => {
          cookies.set("isAdmin", !this.state.isAdmin ? "true" : "false");
          this.setState({
            isAdmin: !this.state.isAdmin,
          })
          // window.location.reload(); 
        }
        }>Admin {this.state.isAdmin ? "yes" : "no"}</Button>

      <HashRouter>
        <Switch>
          <Route path="/login">
            <Login url={this.props.url} />
          </Route>

          <Route path="/create-account">
            <CreateAccount url={this.props.url}/>
          </Route>
          <Route path="/math/:id" children={ <LessonLoader isAdmin={this.state.isAdmin} url={this.props.url} clientUrl={this.props.clientUrl}/> }></Route>

          <Route path="/browser">
            <LessonBrowser  url={this.props.url} clientUrl={this.props.clientUrl} isAdmin={this.state.isAdmin}/>
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
      <Lesson id={id} url={props.url}  isAdmin={props.isAdmin} clientUrl={props.clientUrl}/>
    </div>
  );
}

export default LMath;

import React, { Component } from "react";
import { Container, Button } from "react-bootstrap";
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

  constructor(props) {
    super(props);
    // TEMP FOR TESTING 
    let admin = cookies.get("isAdmin") == "true";

    this.state = {
      isAdmin: admin,
    }
  }
  loginButtonClicked = () => {
    let password = prompt("Enter password");

    fetch(this.props.url + "/login", {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: password,
      })
    }).then(res => res.json())
      .then(res => {
        console.log(res);
        if(res.status == "success"){
          this.setState({isAdmin:true});
          cookies.set("isAdmin", "true")
        }else{
          alert("Incorrect password!");
        }
      });
  }

  logoutButtonClicked = () => {
    fetch(this.props.url + "/logout", {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }).then(res => res.json())
      .then(res => {
        console.log(res);
      });
      this.setState({isAdmin: false});
      cookies.set("isAdmin", "false")

      location.reload();
  }
  render() {
    return (
      <Container fluid>


        <HashRouter>
          <Switch>


            <Route path="/math/:id" children={
              <div className="lesson-page-wrapper row">
                <LessonBrowser defaultCollapsed={false}  loginButton={this.loginButtonClicked} logoutButton={this.logoutButtonClicked} className="col-3" url={this.props.url} clientUrl={this.props.clientUrl} isAdmin={this.state.isAdmin} />
                <LessonLoader loginButton={this.loginButtonClicked} logoutButton={this.logoutButtonClicked} isAdmin={this.state.isAdmin} url={this.props.url} clientUrl={this.props.clientUrl} />
              </div>
            }></Route>

            {/* <Route path="/browser">
              <Button variant="dark" onClick={() => {
                cookies.set("isAdmin", !this.state.isAdmin ? "true" : "false");
                this.setState({
                  isAdmin: !this.state.isAdmin,
                })
                // window.location.reload(); 
              }
              }>Admin {this.state.isAdmin ? "yes" : "no"}</Button>
              <LessonBrowser defaultCollapsed={true} url={this.props.url} clientUrl={this.props.clientUrl} isAdmin={this.state.isAdmin} />
            </Route> */}

            <Route path="/">
              <Redirect to="/math/root" />
            </Route>


          </Switch>

        </HashRouter>

      </Container>
    );
  }

}


function LessonLoader(props) {
  let { id } = useParams();

  return (
    <div className="lesson-loader-wrapper col-9">
      <Lesson loginButton={props.loginButton} logoutButton={props.logoutButton} key={id} id={id} url={props.url} isAdmin={props.isAdmin} clientUrl={props.clientUrl} />
    </div>
  );
}

export default LMath;

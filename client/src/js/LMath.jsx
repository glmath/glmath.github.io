import React, { Component, useState } from "react";
import { Container, Button, Modal, Spinner, Form } from "react-bootstrap";
import {
  HashRouter,
  Switch,
  Route,
  Link,
  Redirect,
  useParams,
  useLocation,
} from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';

import Login from "./Login.jsx";
import CreateAccount from "./CreateAccount.jsx";

import Lesson from "./Lesson.jsx"
import LessonBrowser from "./LessonBrowser.jsx"

import Cookies from 'universal-cookie';
import loader from "sass-loader";
const cookies = new Cookies();

class LMath extends Component {

  constructor(props) {
    super(props);
    // TEMP FOR TESTING 
    let admin = cookies.get("isAdmin") == "true";
    let sessionId = cookies.get("sessionId");

    this.state = {
      isAdmin: admin,
      sessionId: sessionId,
      showingModal: false,
      modalType: "loading",
      shouldShowCloseButton: true,
      closeButtonText: "Cancel",
      modalContent: "",
      lastUpdateLessonBrowser: "",
      shouldReloadLessonBrowser: false,
    } 
    this.lessonBrowserRef = React.createRef();
  }
  loginButtonClicked = () => {
    this.setState({ showingModal: true, modalType: "login" });
  }

  loginModalSubmit = (password) => {
    this.setState({ modalType: "loading", shouldShowCloseButton: true, closeButtonText: "Cancel" })


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
        if (res.status == "success") {
          this.setState({ isAdmin: true, sessionId: res.sessionId, showingModal: false });
          cookies.set("isAdmin", "true");
          cookies.set("sessionId", res.sessionId);
        } else {
          this.setState({ modalType: "content", modalContent: "Incorrect Password!", shouldShowCloseButton: true, closeButtonText: "Close" })
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
    this.setState({ isAdmin: false });
    cookies.set("isAdmin", "false")

    location.reload();
  }


  setShouldReloadLessonBrowser = (value) => {
    // if(value == true){
    //   this.setState({shouldReloadLessonBrowser: Date.now()});
    // }else{
    //   this.setState({shouldReloadLessonBrowser: "reloaded"});
    // }
  }

  reloadLessonBrowser = () => {
    // window.location.assign(window.location.href.split("?")[0]);
    // this.setShouldReloadLessonBrowser(true);
  }

  render() {

    return (
      <Container fluid> {this.state.showingModal ?
        <LoginModal
          type={this.state.modalType}
          content={this.state.modalContent}
          closeButton={true}
          onSubmit={this.loginModalSubmit}
          close={() => this.setState({ showingModal: false })}
          shouldShowCloseButton={this.state.shouldShowCloseButton}
          closeButtonText={this.state.closeButtonText}
        />
        : ""
      }

        <HashRouter>
          <Switch>


            <Route path="/:id" children={
              <div className="lesson-page-wrapper row">
                <LessonBrowser setShouldReload={this.setShouldReloadLessonBrowser}   sessionId={this.state.sessionId} defaultCollapsed={false} loginButton={this.loginButtonClicked} logoutButton={this.logoutButtonClicked} className="col-3" url={this.props.url} clientUrl={this.props.clientUrl} isAdmin={this.state.isAdmin} />
                <LessonLoader reloadLessonBrowser={this.reloadLessonBrowser} sessionId={this.state.sessionId} loginButton={this.loginButtonClicked} logoutButton={this.logoutButtonClicked} isAdmin={this.state.isAdmin} url={this.props.url} clientUrl={this.props.clientUrl} />
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
              <Redirect to="/root" />
            </Route>


          </Switch>

        </HashRouter>

      </Container>
    );
  }

}



function LessonLoader(props) {
  let {id} = useParams();
  let location = useLocation();
  let shouldReload = new URLSearchParams(location.search).get("shouldReload");

  console.log(shouldReload);
  if(shouldReload){
    // props.reloadLessonBrowser();
    // console.log(window.location);
    // location.reload();
  }


  return (
    <div className="lesson-loader-wrapper col-9">
      <Lesson reloadLessonBrowser={props.reloadLessonBrowser} sessionId={props.sessionId} loginButton={props.loginButton} logoutButton={props.logoutButton} key={id} id={id} url={props.url} isAdmin={props.isAdmin} clientUrl={props.clientUrl} />
    </div>
  );
}

function LoginModal({ close, onSubmit, content, type = "loading", shouldShowCloseButton, closeButtonText = "Cancel" }) {

  const handleClose = () => close();

  const [password, setPassword] = useState("");


  return (

    <Modal show={true} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title></Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {type == "loading" ?
          <div>
            <div className="starting-up-server-span">Starting up server, this might take a while if the server has been inactive...</div>
            <Spinner className="spinner spinner-sm" animation="border" role="status">
            </Spinner>
          </div> :
          content
        }
        {type == "login" ?

          <Form>
            <Form.Group controlId="formBasicPassword">
              <Form.Control type="password" value={password} onChange={(e) => { setPassword(e.target.value) }} placeholder="Password" />
            </Form.Group>
          </Form>




          : ""}

      </Modal.Body>



      <Modal.Footer>
        {shouldShowCloseButton ?
          <Button variant="secondary" onClick={handleClose}>
            {closeButtonText}
          </Button> : ""}


        {type == "login" ?
          <Button variant="primary" onClick={() => onSubmit(password)}>
            Login
                </Button> : ""}

      </Modal.Footer>
    </Modal>
  );
}

export default LMath;
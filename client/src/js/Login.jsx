import React, {Component} from "react";
import {Redirect, Link} from "react-router-dom";
import Cookies from 'universal-cookie';

import {Form, Button, Card} from "react-bootstrap"; 
const cookies = new Cookies();

class Login extends Component {

  constructor(props){
    super(props);
    this.state = {
      username:"",
      password:"",
      usernameInvalid:false,
      passwordInvalid:false,
      goToCreateAccount: false,
      shoulUpdate: false,
      goToEditPage: false,
    }
  }

  passswordChange = (event) => {
    this.setState({password: event.target.value, /*passwordInvalid: false*/});
  }
  usernameChange = (event) => {
    this.setState({username: event.target.value});

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: event.target.value}),
      credentials: 'include'
    };
    fetch(this.props.url + "/userExists", requestOptions)
      .then(response => {return response.json()})
      .then(response => {
        console.log(response);
        this.setState({usernameInvalid: !response.exists})
      });
  }
  submitButtonClicked = (event) => {
    event.preventDefault();
    if(this.state.usernameInvalid || this.state.username == "") {
      return;
    }
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: this.state.username, password:this.state.password}),
      credentials: 'include'
    };
    fetch(this.props.url + "/loginUser", requestOptions).then(response => response.json()).then(response => {
      console.log(response);
      if(response.correctPass){
        cookies.set('loggedIn', 'true', { path: '/' });
        cookies.set('userId', this.state.username.toLowerCase(), { path: '/' });
        this.setState({goToEditPage: true})
      }else{
        this.setState({passwordInvalid: true});
      }
    });

    this.setState(this.state);

  }

  render(){

    if(cookies.get('loggedIn') == 'true' || this.state.goToEditPage){
      return(<Redirect to="/plan" /> );
    }
    if(this.state.goToCreateAccount){
      return(<Redirect to="/create-account" /> );
    }

    return (
      <div className="d-flex align-items-center justify-content-center align-items-center account-wrapper ">
        <Card className="">
          <Card.Body>
            <Card.Title>Login</Card.Title>
            <Form>

              <Form.Group controlId="formBasicEmail">
                <Form.Label>Login</Form.Label>
                <Form.Control isInvalid={this.state.usernameInvalid}  value={this.state.username} onChange={this.usernameChange} type="username" placeholder="Enter Username" />
                <Form.Control.Feedback type="invalid">
                  Username not found. Did you want to go to <Link to={"/create-account"}>{"Create account page?"}</Link>
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group controlId="formBasicPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control isInvalid={this.state.passwordInvalid} onKeyDown={() => this.setState({passwordInvalid: false}) } value={this.state.password} onChange={this.passswordChange} type="password" className="" placeholder="Password" />
                <Form.Control.Feedback type="invalid">
                  Incorrect Password!
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="">
                <Button variant="primary" type="submit" className={ "login-button" + (this.state.usernameInvalid ? " disabled " : "")}  onClick={this.submitButtonClicked}>
                  Login
                </Button>

                <Button variant="info" type="" className="login-button" onClick={ () =>{
                  this.setState({goToCreateAccount: true});
                  event.preventDefault();
                }}>
                  Go to Create Account Page
                </Button>
              </Form.Group>
            </Form> 
          </Card.Body>
        </Card>
      </div> 
    );
  }

}

export default Login;

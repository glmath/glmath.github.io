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
import Plan from "./Plan.jsx";

class NowPlan extends Component {

  constructor(props){
    super(props);
  }

  render(){
    return (<Container fluid>

      <HashRouter>
        <Switch>
          <Route path="/login">
            <Login url={this.props.url} />
          </Route>

          <Route path="/create-account">
            <CreateAccount url={this.props.url}/>
          </Route>
          <Route path="/plan">
            <Plan url={this.props.url} />
          </Route>
          <Route path="/">
            <Redirect to="/login" />
          </Route>


        </Switch>

      </HashRouter>

    </Container>
    );
  }

}

export default NowPlan;

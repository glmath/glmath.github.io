import React, {Component} from 'react'
import {Button, ListGroup} from 'react-bootstrap';
import Cookies from 'universal-cookie';
import {Redirect, Link} from "react-router-dom";
import PlanList from "./PlanList.jsx";
import NewList from "./NewList.jsx";

const cookies = new Cookies();

class ListViewer extends Component{
  constructor(props){
    super(props);
    this.state = {
    }
  }

  componentDidMount () {
  }

  render(){

    if(this.props.shouldUpdate){
    }

    return (
      <ListGroup className="side-menu-list col-3 list-viewer ">

        <ListGroup.Item>
          <NewList url={this.props.url} userId={this.props.userId} auth={this.props.auth} onNew={ this.props.onNewListAdded }/>
        </ListGroup.Item>

        {
          Object.keys(this.props.listIds).map( (id) =>  
            <ListGroup.Item 
              onClick={ () => this.props.setCurrentListIdSelected(id) } 
              key={id}
              active={this.props.currentListIdSelected === id}
            > {this.props.listIds[id]} </ListGroup.Item>
          )
        }
      </ListGroup>
    );
  }

}

export default ListViewer;


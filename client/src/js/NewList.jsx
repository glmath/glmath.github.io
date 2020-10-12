import React, {Component} from 'react'
import {Button} from 'react-bootstrap';
import Cookies from 'universal-cookie';
import {Redirect, Link} from "react-router-dom";

const cookies = new Cookies();

class NewList extends Component{

  constructor(props){
    super(props);
    this.state = {
      currNewListName: "",
    };
  }

  newList = () => {
    console.log("this was called");
    let listName = this.state.currNewListName;
    let listId = listName + "--" + cookies.get("userId") + "--" + Date.now();
    if(listName === ""){
      return;
    }


    fetch(this.props.url +"/post/list/" + encodeURIComponent(listId) + "/", {
      method:'post',
      credentials: 'include',
      headers: new Headers({
        Authorization: this.props.auth,
        "Content-Type": "application/json",
        "userid":cookies.get("userId"),
      }),
      body:JSON.stringify( {
        list: 
        {
          id:listId,
          _id:listId,
          name: listName,
          items: {},
        }
      })

    }).then( res => res.json()).then( result => {
    });


    this.props.onNew({id: listId, name: listName});
  }

  render(){
    return (
      <div>
        <input 
          className="new-list-name-field" 
          type="text" 
          placeholder="Enter new list name." 
          onChange={ (e) => this.setState({currNewListName: e.target.value})} 
        />  

        <Button onClick={this.newList}> Create new list </Button>

        <Button onClick={ () => {
          cookies.set('loggedIn', 'false', { path: '/' });
          this.forceUpdate();
          window.location.reload();
        }}> Log Out </Button>

      </div>
    );
  }
}

export default NewList;


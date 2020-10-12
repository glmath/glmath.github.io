import React, {Component} from 'react';
import {Button} from 'react-bootstrap';
import Cookies from 'universal-cookie';
import {Redirect, Link} from "react-router-dom";
import PlanList from "./PlanList.jsx";
import NewList from "./NewList.jsx";
import ListViewer from "./ListViewer.jsx";

const cookies = new Cookies();

class Plan extends Component{
  constructor(props){
    super(props);
    this.state = {
      userId:"",
      auth:"",
      shouldUpdateLists: false,
      currentListIdSelected: "",
      listIds:{},
    };
    this.updateData();

  }
  componentDidMount(){
    let currentListIdSelected = cookies.get("currentListIdSelected");
    if(currentListIdSelected && currentListIdSelected !== "undefined" ){ // check if we dont have the list id selected ( it will never be undefined since list ids always have many diffrente parametes (even if list name is undefined) );
      console.log(currentListIdSelected);
      this.setState({currentListIdSelected: currentListIdSelected});
    }

    this.setState({
      userId: cookies.get("userId"), 
      auth: "authToken", 
    });
    this.updateData();
  }

  onNewListAdded = (newListIdAndName) => {
    //temperarily add it so we can see it in the board instantly
    let listIds = this.state.listIds; 
    console.log(newListIdAndName.id);
    listIds[newListIdAndName.id] = newListIdAndName[newListIdAndName.name];
    this.setCurrentListIdSelected(newListIdAndName.id);

    setTimeout(this.updateData, 100); // get connected to the data base again
    this.forceUpdate();
  }
  setCurrentListIdSelected = (id) => {
    this.setState({currentListIdSelected: id});
    cookies.set("currentListIdSelected", id, {path: "/"} );
  }

  updateData = () => {
    fetch(this.props.url + "/get/all-user-list-id/", {
      method:'get',
      credentials: 'include',
      headers: new Headers({
        Authorization: this.props.auth,
        'Accept': 'application/json',
        "userid":cookies.get("userId"),
      }),

    }).then( res => res.json()).then( res => {
      this.setState({listIds:res.listIds});

      if(this.state.currentListIdSelected === "" ){ // if the user hasent selected soemthing pick the first one for them
        this.setCurrentListIdSelected(Object.keys(this.state.listIds)[0]);
      }
    });

    console.log("updated data");
  }

  deleteList = (id) => {
    let listIds = this.state.listIds;
    console.log("removing list with id" + id);

    fetch(this.props.url +"/post/remove/list/" + encodeURIComponent(id) + "/", {
      method:'post',
      headers: new Headers({
        Authorization: this.props.auth,
        "Content-Type": "application/json",
        "userid":cookies.get("userId"),
      }),

      body:JSON.stringify( {
      })

    }).then(res => res.json()).then( res => {
      console.log(res);
    });

    // Manually remove the list from the interface since it will take time for the backend to update
    /*let listIds = this.state.listIds;*/

    this.setCurrentListIdSelected(Object.keys(listIds)[ Object.keys(listIds).indexOf(id) - 1 ]);// set it to the one above
    delete listIds[id];

    this.setState({ listIds: listIds, shouldUpdateLists: true} );
    setTimeout(this.updateData, 1000); // add a 0.1 second delay so the data base has updated befroe we update
    //this.forceUpdate();
  }

  listNameChange = (newList) => {
    // this is only here so we can temporarily set the list name in the side bar after a rename(until the database is updated)
    let listIds = this.state.listIds;
    listIds[newList.id] = newList.name;
    this.setState({listIds: listIds});
  }

  render(){
    if(cookies.get("loggedIn") !== "true"){
      return(<Redirect to="/login" /> );
    }

    return (
      <div className="row">
        <ListViewer 
          shouldUpdate={this.state.shouldUpdateLists} 
          onListUpdated={ () => this.setState( {shouldUpdateLists: false} ) } 
          url={this.props.url} 
          userId={this.state.userId} 
          auth={this.state.auth}
          currentListIdSelected={this.state.currentListIdSelected}
          setCurrentListIdSelected={this.setCurrentListIdSelected}
          onNewListAdded={this.onNewListAdded}
          listIds={this.state.listIds}
        />


        
        {this.state.currentListIdSelected ? 
        <PlanList 
          url={this.props.url} 
          listId={this.state.currentListIdSelected} 
          userId={this.props.userId} 
          auth={this.props.auth} 
          key={this.state.currentListIdSelected}
          deleteList={this.deleteList}
          listName={this.state.listIds[this.state.currentListIdSelected]} // this is just so there is no lag on initial list creation in reality the db overides this quickly
          listNameChange={this.listNameChange}
        /> : "" }

      </div>


    );
  }
}

export default Plan;


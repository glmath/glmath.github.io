import React, {Component, CreateRef} from 'react'
import {Button, Form} from 'react-bootstrap';
import Cookies from 'universal-cookie';
import {Redirect, Link} from "react-router-dom";
import EditableText from './EditableText.jsx';

const cookies = new Cookies();

class ListItem extends Component{
  static defaultProps = {
    isAddNewItem: false,
    placeholder: "",
  }

  constructor(props){
    super(props);
  }

  componentDidMount(){
    if(this.props.isFocused){
      //this.inputRef.current.focus();
    }
  }

  render(){
    return (
      <div className="" >
        <div className=" plan-list-item" > {/* from-group */}

          <Form.Check 
            checked={this.props.item.isComplete ? true : false} 
            className={"plan-list-completed-checkbox " + (this.props.isAddNewItem ? " invisible " : "")} 
            type="checkbox" 
            onChange={ (e) => this.props.checkBoxChange(this.props.item.id, e.target.checked) } 
            tabIndex="-1" // so it cant be selected with tab
          />

          <EditableText 
            onChange={(event) => this.props.onChange(this.props.item.id, event.target.value)}
            key={this.props.item.item + "" + this.props.isFocused}
            value={this.props.item.value}
            className=" plan-list-item-name" 
            label={ <div> {this.props.item.value} {this.props.isAddNewItem ? "Type here to add a new item." : "" }</div> }
            isEditing={this.props.isFocused} // if we are focused on this one we should be editing
            shouldFocus={!this.props.isAddNewItem} // if we are the special last one we dont want to focus
            placeholder={this.props.placeholder} // the placeholder for the input field 
          />

            <Button 
              className={"list-item-remove-buttom " + (this.props.isAddNewItem ? " invisible " : "")}
              variant=""
              onClick={() => this.props.onRemoveButton(this.props.item.id)}
            > X </Button>


          {/* form-control */ }
          {/* <input  */}
          {/*   key={this.props.item.id}  */}
          {/*   type="text"  */}
          {/*   onChange={(event) => this.props.onChange(this.props.item.id, event.target.value)} */}
          {/*   value={this.props.item.value} */}
          {/*   ref={this.inputRef} */}
          {/*   className="form-control plan-list-item-name" */}
          {/* />  */}

        </div>
      </div>
    );
  }
}

export default ListItem;


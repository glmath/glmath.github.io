import React, {Component} from 'react'
import {Button} from 'react-bootstrap';
class EditableText extends Component{

  static defaultProps = {
    isEditing: false, // used so you can start it in edit mode
    placeholder: "", // placeholder for the input field
    shouldFocus: true, //  whether we want it to auto focus if we are editing
    className: "",
  }

  constructor(props){
    super(props);
    this.state = {
      isEditing: this.props.isEditing, // used to manage if we are in edit mode
      clicked: true, // used for knowing if the used wanted to put focus (with a click)
    };
    this.ref = React.createRef();
  }

  onKeyDown = (e) => { // finish edit if key is pressed
    if(e.key == "Enter" || e.key == "Escape"){
      this.setState({isEditing: false});
    }
  }

  componentDidUpdate(){
    this.handleFocusUpdate();
  }
  componentDidMount(){
    this.handleFocusUpdate();
  }

  // this is for focusing on the input field at the right time
  handleFocusUpdate = () => {
    // handle case when we are editing and we have the shouldFocus prop
    if((this.state.isEditing) && this.props.shouldFocus && this.ref.current != null){
      this.ref.current.focus();
    }

    // handle special case where we clicked but we dont want defualt focus 
    if(this.state.clicked && this.ref.current != null){
      this.ref.current.focus();
      this.setState({clicked: false});
    }

  }

  render(){
    if(!this.state.isEditing){
      return (
        <div className={"editable-text-normal " + this.props.className} onClick={() => this.setState({isEditing: true, clicked:  true}) } > 
          {this.props.label}
        </div>
      );
    }

    return(
      <input 
        ref={this.ref} 
        onKeyDown={this.onKeyDown} 
        className={"editable-text-edit " + this.props.className} 
        value={this.props.value} 
        onChange={this.props.onChange} 
        onBlur={() => {console.log("blur  called"); this.setState({isEditing: false})} }
        placeholder={this.props.placeholder}
        {...this.props.otherProps}
      />
    )
  }
}

export default EditableText;


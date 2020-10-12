import React, {Component} from "react";
import {Container} from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';


class Lesson extends Component {

  constructor(props){
    super();
    this.state = {
      raw_content: "testing"
    };
  }

  render(){
    return (
      <div>
        Lesson Page

        <LessonViewer raw_content={this.state.raw_content}></LessonViewer>
        <LessonEditor raw_content_set={this.rawContentSet} raw_content={this.state.raw_content} />
      </div>
    );
  }
  
  rawContentSet = (newContent) => {
    this.setState({raw_content: newContent});
  }

}

function LessonViewer(props){
  return(<div > 
    <div className="lesson-viewer">
    {props.raw_content}

    </div>
    
    </div>)
}

function LessonEditor(props) {

  return (<div>
    <textarea
      onChange={(e) => props.raw_content_set(e.target.value)}
      type="textarea"
      value={props.raw_content}
      className="lesson-editor"
    />
    </div>)
}

export default Lesson;

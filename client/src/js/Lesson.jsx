import React, { Component } from "react";
import { Container } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import ReactMarkdown from "react-markdown"
import Editor from "rich-markdown-editor";
import { MathfieldComponent } from "react-mathlive";


class Lesson extends Component {

  constructor(props) {
    super();
    this.state = {
      raw_content: "testing",
    };
  }
  editorOnChange = (value) =>{
  }

  saveToServer = (value) =>{
    console.log(value);
  }

  render() {
    return (
      <div>
        lesson page
        {/* <button onClick={() => { this.setState({isView : !this.state.isView})}}>Toggle View</button> */}
        {/* <LessonViewer raw_content={this.state.raw_content}></LessonViewer> */}
        {/* <LessonEditor raw_content_set={this.rawContentSet} raw_content={this.state.raw_content} /> */}
      </div>
    );
  }

  set_new_value = (newValue) =>{
    this.setState({editor_value: newValue});
  }

  rawContentSet = (newContent) => {
    this.setState({ raw_content: newContent });
  }

}

function LessonViewer(props) {
  return (<div >
    <div className="lesson-viewer">
      {props.raw_content}
      <ReactMarkdown source={props.raw_content} />
    </div>

  </div>)
}


function MathLiveEditor(props){
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


class YoutubeEmbed extends React.Component {
  render() {
    const { attrs } = this.props;
    const videoId = attrs.matches[1];

    return (
      <iframe
      allowfullscreen="true"
        className={this.props.isSelected ? "ProseMirror-selectednode" : ""}
        src={`https://www.youtube.com/embed/${videoId}?modestbranding=1`}
      />
    );
  }
}


// basically the math acts as a sort of a fake link
class MathEmbed extends React.Component {
  render() {
    console.log(this.props);
    const { attrs } = this.props;
    const latex = attrs.href; // workaround since href actually stores the latex
    let oldValue = attrs.matches.old_value;
    console.log(latex);
    return (
      <div> 
        
        <MathfieldComponent
        initialLatex={latex}
        onChange={(value) => {
          let news = oldValue.replace(this.props.href, latex);
          console.log(news);
          attrs.matches.set_new_value(news);
          
        }} 
      /> 
        
        </div>
    );
  }
}
export default Lesson;

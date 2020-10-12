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
      isView: false,
      last_save_timeout: "",
    };
  }
  editorOnChange = (value) =>{
    clearTimeout(this.state.last_save_timeout);
    let newTimeout = setTimeout(() => this.saveToServer(value()), 1000);
    this.setState({last_save_timeout: newTimeout})
  }

  saveToServer = (value) =>{
    console.log(value);
  }

  render() {
    return (
      <div>
        Lesson Page
        <button onClick={() => { this.setState({isView : !this.state.isView})}}>Toggle View</button>
        <Editor className="editor"
          defaultValue=""
          readOnly={this.state.isView}
          onChange={this.editorOnChange}

          embeds={[
            {
              title: "YouTube",
              keywords: "youtube video tube google",
              icon: () => (
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/7/75/YouTube_social_white_squircle_%282017%29.svg"
                  width={24}
                  height={24}
                />
              ),
              matcher: url => {
                return url.match(
                  /(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([a-zA-Z0-9_-]{11})$/i
                );
              },
              component: YoutubeEmbed,
            },
            {
              title: "Math (Latex)",
              keywords: "math latex math",
              icon: () => (
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/7/75/YouTube_social_white_squircle_%282017%29.svg"
                  width={24}
                  height={24}
                />
              ),
              matcher: url => {
                return url.match(
                  /(\$+)(?:(?!\1)[\s\S])*\1/i
                );
              },
              component: MathEmbed,
            },
          ]}
          dark
        />
        {/* <LessonViewer raw_content={this.state.raw_content}></LessonViewer> */}
        {/* <LessonEditor raw_content_set={this.rawContentSet} raw_content={this.state.raw_content} /> */}
      </div>
    );
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

class MathEmbed extends React.Component {
  render() {
    const { attrs } = this.props;
    const latex = attrs.matches[0];
    <MathfieldComponent
    initialLatex="f(x)=\\log _10 x"
    onChange={this.onMathChange}
  />
    return (
      <div> 
        <MathfieldComponent
        initialLatex="f(x)=\\log _10 x"
        onChange={(value) => {}}
      /> 
        
        </div>
    );
  }
}
export default Lesson;

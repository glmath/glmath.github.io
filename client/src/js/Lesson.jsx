import React, { Component } from "react";
import { Container } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import ReactMarkdown from "react-markdown"
import SunEditor from 'suneditor-react';
import katex from "katex";
import 'suneditor/dist/css/suneditor.min.css'; // Import Sun Editor's CSS File
import 'katex/dist/katex.min.css'

class Lesson extends Component {

  constructor(props) {
    super(props);

    this.state = {
      raw_content: "",
      isView: false,
      starting_value: "",
      last_save_timeout: "",
    };
    console.log(props.id);
    this.getFromServer();
  }

  editorOnChange = (value) => {
    clearTimeout(this.state.last_save_timeout);
    let timeout = setTimeout(() => {
      this.saveToServer(value);
    }, 250);;

    this.setState({
      raw_content: value,
      last_save_timeout: timeout,
    });

  }

  saveToServer = (value) => {
    fetch(this.props.url + "/post/lesson/" + this.props.id, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: this.props.id,
        lesson: {
          id: this.props.id,
          content: value
        },
      })
    })
    console.log(value);
  }

  getFromServer = () => {
    console.log(this.props);
    fetch(this.props.url + "/get/lesson/" + this.props.id, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }).then(response => response.json())
      .then(data => {
        this.setState({ 
          starting_value: data.lesson.content ,
          raw_content: data.lesson.content,
        });
        console.log(data);
      });


  }

  render() {
    return (
      <div>
        lesson page
        <button onClick={() => {
          this.setState({
            isView: !this.state.isView,
            starting_value: this.state.raw_content,
          })
        }


        }>Toggle View</button>
        {this.state.isView ?
          <SunEditor
            setContents={this.state.starting_value}

            setOptions={{
              height: 200,
              katex: { // Custom option
                src: katex,
                options: {
                  /** default options **
                  * throwOnError: false,
                  */
                  maxSize: 4
                }
              },

              buttonList: [
                ['undo', 'redo'],
                ['font', 'fontSize', 'formatBlock'],
                // ['paragraphStyle', 'blockquote'],
                ['bold', 'underline', 'italic', 'strike', 'subscript', 'superscript'],
                // ['fontColor', 'highliteColor', 'textStyle'],
                ['removeFormat'],
                ['outdent', 'indent'],
                ['align', 'horizontalRule', 'list', 'lineHeight'],
                ['table', 'link', 'image', 'video', 'math'], // You must add the 'katex' library at options to use the 'math' plugin.
                // ['imageGallery'], // You must add the "imageGalleryUrl".
                // ['fullScreen', 'showBlocks', 'codeView'],
                ['preview', 'print'],
                // ['save', 'template'], 
              ],
            }}
            onChange={this.editorOnChange}
          /> :
          <div className={"sun-editor-editable"} dangerouslySetInnerHTML={{ __html: this.state.raw_content }} />
        }

        {/* <LessonViewer raw_content={this.state.raw_content}></LessonViewer> */}
        {/* <LessonEditor raw_content_set={this.rawContentSet} raw_content={this.state.raw_content} /> */}
      </div>
    );
  }

  set_new_value = (newValue) => {
    this.setState({ editor_value: newValue });
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


function MathLiveEditor(props) {
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

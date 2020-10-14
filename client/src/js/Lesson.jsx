import React, { Component } from "react";
import { Container, Spinner} from "react-bootstrap";
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
      serverLesson: null,
      isView: false,
      startingValue: "",
      lastSaveTimeout: "",
    };
    console.log(props.id);
    this.getFromServer();
  }

  editorOnChange = (value) => {
    clearTimeout(this.state.lastSaveTimeout);
    let timeout = setTimeout(() => {
      this.saveToServer(value);
    }, 250);

    let lesson = this.state.serverLesson;
    lesson.content = value;

    this.setState({
      serverLesson: lesson,
      lastSaveTimeout: timeout,
    });

  }

  saveToServer = (value) => {
    fetch(this.props.url + "/post/lesson/", {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: this.props.id,
        content: value,
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
          serverLesson: data,
          startingValue: data.content,
        });
      });
  }



  render() {
    if (this.state.serverLesson == null) {
      return (
        <Spinner className="spinner" animation="border" role="status">
          <span className="sr-only">Loading...</span>
        </Spinner>
      );
    }

    return (
      <div>
        <LessonName name={this.state.serverLesson.name} />


        <button onClick={() => {
          this.setState({
            isView: !this.state.isView,
            startingValue: this.state.serverLesson.content,
          })
        }


        }>Toggle View</button>
        {this.state.isView ?
          <SunEditor
            setContents={this.state.startingValue}

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
                ['fontColor', 'hiliteColor', 'textStyle'],
                ['removeFormat'],
                ['outdent', 'indent'],
                ['align', 'horizontalRule', 'list', 'lineHeight'],
                ['table', 'link', 'image', 'video', 'math'], // You must add the 'katex' library at options to use the 'math' plugin.
                // ['imageGallery'], // You must add the "imageGalleryUrl".
                ['fullScreen', 'showBlocks', 'codeView'],
                ['preview', 'print'],
                ['save', 'template'],
              ],
            }}
            onChange={this.editorOnChange}
          /> :
          <div className={"sun-editor-editable"} dangerouslySetInnerHTML={{ __html: this.state.serverLesson.content }} />
        }
        {/* <LessonViewer rawContent={this.state.rawContent}></LessonViewer> */}
        {/* <LessonEditor rawContent_set={this.rawContentSet} rawContent={this.state.rawContent} /> */}

      </div>
    );
  }

 

}


function LessonViewer(props) {
  return (<div >
    <div className="lesson-viewer">
      {props.rawContent}
      <ReactMarkdown source={props.rawContent} />
    </div>

  </div>)
}


function LessonName(props) {
  return <h1> {props.name} </h1>
}

function LessonEditor(props) {

  return (<div>
    <textarea
      onChange={(e) => props.rawContent_set(e.target.value)}
      type="textarea"
      value={props.rawContent}
      className="lesson-editor"
    />
  </div>)
}






export default Lesson;

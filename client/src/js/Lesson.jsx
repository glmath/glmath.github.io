import 'bootstrap/dist/css/bootstrap.min.css';
import mathquill4quill from 'mathquill4quill';
import 'mathquill4quill/mathquill4quill.css';
import React, { Component, useState } from "react";
import { Button, Modal, Spinner } from "react-bootstrap";
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  Link
} from "react-router-dom";



class Lesson extends Component {

  constructor(props) {
    super(props);

    this.reactQuill = React.createRef();
    this.haveLoadedQuill = false;

    this.state = {
      serverLesson: null, // the lesson from the server
      isEditor: false, // whetor we should show an editor or not
      startingValue: "", // the starting value of the editor, for when converting between the two
      lastSaveTimeout: "", // used to keep track of the last save
      showingUploadModal: false,
      editorState: "",

    };

    console.log("test");
    this.checkFromServerDependingOnAdmin();

  }

  checkFromServerDependingOnAdmin = () => {
    // update with inital data from the server
    if (this.props.isAdmin) {
      this.getFromServer();
    } else {
      this.getFromGithub();
    }
  }


  componentDidMount() {
    if (this.reactQuill.current == null) {
      return;
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.isAdmin != this.props.isAdmin) {
      this.checkFromServerDependingOnAdmin();
    }

    if (!this.haveLoadedQuill && this.state.isEditor) {
      const enableMathQuillFormulaAuthoring = mathquill4quill({ Quill });
      enableMathQuillFormulaAuthoring(this.reactQuill.current.editor, {
        operators: [["\\pm", "\\pm"], ["\\sqrt{x}", "\\sqrt"], ["\\sqrt[n]{x}", "\\nthroot"], ["\\frac{x}{y}", "\\frac"],
        ["\\sum^{s}_{x}{d}", "\\sum"], ["\\prod^{s}_{x}{d}", "\\prod"], ["\\coprod^{s}_{x}{d}", "\\coprod"],
        ["\\int^{s}_{x}{d}", "\\int"], ["\\binom{n}{k}", "\\binom"]],

        displayHistory: true, // defaults to false
        historyCacheKey: '__my_app_math_history_cachekey_', // optional
        historySize: 20 // optional (defaults to 10)
      });

      

      // console.log(this.reactQuill.current.editor);
      // var toolbar = this.reactQuill.current.editor.getModule('toolbar');
      // toolbar.addHandler('omega', function () {
      //   console.log('omega')
      // });



      var customButton = document.querySelector('.ql-ytembed');
      customButton.addEventListener('click', () => {
        var range = this.reactQuill.current.editor.getSelection();
        if (range) {
          this.reactQuill.current.editor.insertText(range.index, "Ω");
        }
      });


      this.haveLoadedQuill = true;
    }
  }

  editorOnChange = (value) => {

    // We do not want to constantly save, so only call the server save function after 0.250 seconds of not typing (this is sort of like debounce function from underscore js)
    clearTimeout(this.state.lastSaveTimeout);
    let timeout = setTimeout(() => {
      this.saveToServer(this.state.value);
    }, 250);


    // use this temp to update the content field of the serverLesson
    let lesson = this.state.serverLesson;
    lesson.content = this.state.value;

    this.setState({
      serverLesson: lesson,
      lastSaveTimeout: timeout,
      editorState: value,
    });

  }

  saveToServer = () => {
    fetch(this.props.url + "/post/lesson/", {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: this.props.id,
        content: this.state.editorState,
      })
    })
  }

  saveToGithub = () => {
    this.setState({ showingUploadModal: true });

    fetch(this.props.url + "/post/lesson-to-github/", {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: this.props.id,
        content: this.state.editorState,
      })
    })
  }

  // Old way of getting from database
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
          editorState: data.content,
        });
      });
  }

  getFromGithub = () => {
    let url = this.props.clientUrl + "/lessons/" + this.props.id + ".json";

    fetch(url, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': 0
      }
    })
      .then(function (response) {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Error in getting lesson.');
      })
      .then(function (data) {
        console.log(data);
        this.setState({
          serverLesson: data,
          editorState: data.content,
        });
      }.bind(this))
      .catch(function (err) {
        console.log("failed to load ", url, err.message);
      });

  }



  render() {

    var toolbarOptions = {
      container: [
        ['formula', 'bold', 'italic', 'underline', 'strike', 'blockquote'],        // toggled buttons
        ['link'],
        ['ytembed'],

        // [{ 'header': 1 }, { 'header': 2 }],               // custom button values
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        // [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
        [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
        // [{ 'direction': 'rtl' }],                         // text direction

        [{ 'size': ['small', "medium", 'large', 'huge'] }],  // custom dropdown
        // [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

        [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
        [{ 'font': [] }],
        [{ 'align': [] }],

        ['clean']                                         // remove formatting button
      ],
      handlers: {
        // 'omega': () => {
        //     // var range = this.reactQuill.current.editor.getSelection();
        //     // if (range) {
        //     //   this.reactQuill.current.editor.insertText(range.index, "Ω");
        //     // }

        // }
      }

    }


    // if we have not loaded yet, display spinner
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


        <UploadToServerModal
          isShowing={this.state.showingUploadModal}
          close={() => this.setState({ showingUploadModal: false })} />

        <Link to={"../browser"}>
          <Button variant="dark" >Back</Button>
        </Link>



        {this.props.isAdmin ? <div>
          <Button variant="dark" onClick={() => {
            this.saveToGithub();
          }
          }>Publish To Everyone</Button>


          <Button variant="dark" onClick={() => {
            this.setState({
              isEditor: !this.state.isEditor,
              startingValue: this.state.serverLesson.content,
            })
          }
          }>Toggle Edit</Button> </div> : ""}

        {this.state.isEditor ?
          <ReactQuill
            ref={this.reactQuill}
            theme="snow"
            value={this.state.editorState}
            onChange={this.editorOnChange}
            modules={{
              formula: true,
              toolbar: toolbarOptions,
            }}
          />
          :

          <ReactQuill
            ref={this.reactQuill}
            theme="bubble"
            value={this.state.editorState}
            readOnly={true}
          />
        }
        {/* {this.state.isEditor ? */}
        {/* :<div className={"sun-editor-editable"} dangerouslySetInnerHTML={{ __html: this.state.serverLesson.content }} /> */}
        {/* } */}
        {/* <LessonViewer rawContent={this.state.rawContent}></LessonViewer> */}
        {/* <LessonEditor rawContent_set={this.rawContentSet} rawContent={this.state.rawContent} /> */}

      </div>
    );
  }



}



function Editor(props) {
  const [value, setValue] = useState('');
  return (
    <ReactQuill ref={props.eref} theme="snow" value={value} onChange={setValue} />
  );
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



function LessonViewer(props) {
  return (<div >
    <div className="lesson-viewer">
      {props.rawContent}
      <ReactMarkdown source={props.rawContent} />
    </div>

  </div>)
}




function UploadToServerModal(props) {

  const handleClose = () => props.close();

  return (
    <Modal show={props.isShowing} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Published to everyone!</Modal.Title>
      </Modal.Header>
      <Modal.Body>This lesson has been published to everyone! However it might take a few minutes to show up on the regular website.</Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
          </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default Lesson;

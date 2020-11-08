import 'bootstrap/dist/css/bootstrap.min.css';
import mathquill4quill from 'mathquill4quill';
import 'mathquill4quill/mathquill4quill.css';
import React, { Component, useState } from "react";
import { Button, Modal, Spinner, Alert } from "react-bootstrap";
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Footer from "./Footer.jsx"
import {
  Link
} from "react-router-dom";

import getVideoId from 'get-video-id';
import EditableText from "./EditableText.jsx";

import Cookies from 'universal-cookie';
const cookies = new Cookies();


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
      imageUploaded: null,

    };

    this.checkFromServerDependingOnAdmin();


  }

  checkFromServerDependingOnAdmin = () => {
    // update with inital data from the server
    if (this.props.isAdmin) {

      //(since locally we cant make cross origin request to github servers, sometimes the first migh give error but it still calls the callback)
      this.getFromGithub(() => {
        this.getFromServer();
      });

    } else {
      this.getFromGithub(() => { });
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


        displayHistory: true,
        historyCacheKey: '__my_app_math_history_cachekey_',
        historySize: 20
      });

      this.setUpYtEmbed();
      this.setupImageEmbed();
      this.haveLoadedQuill = true;
    }
  }


  setUpYtEmbed = () => {
    var customButton = document.querySelector('.ql-ytembed');

    customButton.addEventListener('click', () => {

      let url = prompt("Please Enter a youtube link: ");
      let ytinfo = getVideoId(url);
      if (ytinfo.service != "youtube" || ytinfo.id == null) {
        alert("Please enter a valid Youtube lin");
        return;
      }
      let videoId = ytinfo.id;

      let editor = this.reactQuill.current.editor;

      var currentCaretPos = editor.getSelection();
      if (currentCaretPos) {
        // The youtube embed code: setting the playist to video id for looping
        // const value = `<iframe width="500" height="500" class="ytvideo-embed-iframe" src="https:/www.youtube-nocookie.com/embed/${videoId}?playlist=${videoId}&loop=1&rel=0" frameborder="0" allow="accelerometer; modestbranding; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
        const embedCode = '<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/' + videoId + '?rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen modestbranding></iframe>'
        // editor.clipboard.dangerouslyPasteHTML(currentCaretPos.index, value);
        editor.clipboard.dangerouslyPasteHTML(currentCaretPos.index, embedCode);
      } else {
        alert("Please Click somewhere in the text first!")
      }

    });

    $('iframe').on("load", function () {
      $('iframe').contents().find("head")
        .append($("<style type='text/css'> .ytp-pause-overlay {display: none; !important} </style>"));
    });

  }


  setUpYtEmbed = () => {
    var customButton = document.querySelector('.ql-ytembed');
    customButton.addEventListener('click', () => {
      
    });
  }


  editorOnChange = (value) => {
    // use this temp to update the content field of the serverLesson
    let lesson = this.state.serverLesson;
    lesson.content = this.state.value;

    this.setState({
      serverLesson: lesson,
      editorState: value,
    });

    this.saveToServerDebounced()
  }


  // We do not want to constantly save, so only call the server save function after 0.250 seconds of not typing (this is sort of like debounce function from underscore js)
  saveToServerDebounced = () => {
    clearTimeout(this.state.lastSaveTimeout);
    let timeout = setTimeout(() => {
      this.saveToServer();
    }, 250);

    this.setState({
      lastSaveTimeout: timeout,
    });
  }

  saveToServer = () => {
    let lastUpdated = Date.now();
    let oldLesson = this.state.serverLesson;
    oldLesson.lastUpdated = lastUpdated;
    this.setState({ serverLesson: oldLesson });


    fetch(this.props.url + "/post/lesson/", {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        "SessionId": this.props.sessionId,
      },
      body: JSON.stringify({
        id: this.props.id,
        content: this.state.editorState,
        name: this.state.serverLesson.name,
        lastUpdated: lastUpdated,
      })
    }).then(res => res.json()).then(res => {
      logoutIfBadAuth(res);


    });

  }

  saveToGithub = () => {
    this.setState({ showingUploadModal: true });

    fetch(this.props.url + "/post/lesson-to-github/", {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        "SessionId": this.props.sessionId,
      },
      body: JSON.stringify({
        id: this.props.id,
        content: this.state.editorState,
        lastUpdated: Date.now(),
      })
    }).then(res => res.json()).then((res) => {
      logoutIfBadAuth(res);
      this.getFromGithub(() => { this.getFromServer() });
    });
  }



  // Old way of getting from database
  getFromServer = () => {
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


  getFromGithub = (callback) => {
    let url = this.props.clientUrl + "/lessons/" + this.props.id + ".json";

    fetch(url, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': 0
      },
      cache: "no-store"
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Error in getting lesson.');
      })
      .then(data => {
        console.log(data);
        this.setState({
          serverLesson: data,
          editorState: data.content,
          githubLastUpdated: data.lastUpdated,
        });
        callback();
      })
      .catch(err => {
        console.log("failed to load ", url, err.message);
        callback();
      });

  }



  handleLessonNameChange = (e) => {
    let newName = e.target.value;
    let lesson = this.state.serverLesson;
    lesson.name = newName;
    this.setState({ serverLesson: lesson });
    this.saveToServerDebounced(true);
  }

  uploadImageToServer = () => {
    let image = this.state.imageUploaded;

    let form = new FormData();
    form.append('name', 'image');   //append the values with key, value pair
    form.append('image', image);

    fetch(this.props.url + '/upload-image', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        "SessionId": this.props.sessionId,
      },
      body: form
    }).then(res => res.json()).then(res => {
      logoutIfBadAuth(res);
      if(res.status == "failed" || res.status != "image-uploaded"){
        alert("Failed to upload image!!");
      }

      console.log("url = ", res.url);

      console.log('res of fetch', res)


    });


  }

  render() {

    // if we have not loaded yet, display spinner
    if (this.state.serverLesson == null) {
      return (<>
        <Spinner className="spinner" animation="border" role="status">
          <span className="sr-only">Loading...</span>
        </Spinner>
        <Footer isAdmin={this.props.isAdmin} loginButton={this.props.loginButton} logoutButton={this.props.logoutButton} />
      </>
      );
    }

    var toolbarOptions = {
      container: [
        ['formula', 'bold', 'italic', 'underline', 'strike', 'blockquote'],        // toggled buttons
        ['link'],
        ['ytembed'],
        ['image-embed'],

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





    return (
      <div>
        <input
          type="file"
          onChange={(e) => this.setState({ imageUploaded: e.target.files[0] })}
          accept='image/*'
        />
        <Button className="btn btn-upload-image" onClick={this.uploadImageToServer} >Upload Image</Button>

        <LessonName name={this.state.serverLesson.name} onChange={this.handleLessonNameChange} isAdmin={this.props.isAdmin} />




        <UploadToServerModal
          isShowing={this.state.showingUploadModal}
          close={() => this.setState({ showingUploadModal: false })} />

        {/* <Link to={"../browser"}>
          <Button variant="dark" >Back</Button>
        </Link> */}



        {this.props.isAdmin ? <div>

          {(this.state.serverLesson.lastUpdated != this.state.githubLastUpdated ?
            <Alert variant={'danger'}>
              This lesson has been saved, however your changes are not on the public website yet. When you are ready, Click <b>Publish</b> to publish them to the main website! (Note: that it will take a few minutes after clicking publish for this message to go away)
          </Alert> : "")}


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


        <Footer isAdmin={this.props.isAdmin} loginButton={this.props.loginButton} logoutButton={this.props.logoutButton} />
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
  return <h1><EditableText
    label={props.name}
    value={props.name}
    onChange={props.onChange}
    readOnly={!props.isAdmin}
    className={props.isAdmin ? " is-admin " : ""}
    onBlur={() => { setTimeout(() => location.reload(), 200); }}
  /> </h1>
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




function logoutIfBadAuth(res) {
  if (res.status == "invalid-login") {
    cookies.set("isAdmin", "false");
    location.reload();
  }
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

import 'bootstrap/dist/css/bootstrap.min.css';
import mathquill4quill from 'mathquill4quill';
import 'mathquill4quill/mathquill4quill.css';
import React, { Component, useState } from "react";
import { Button, Modal, Spinner, Alert } from "react-bootstrap";
import ReactQuill, { Quill } from 'react-quill';
import ImageResize from 'quill-image-resize-module';
Quill.register('modules/imageResize', ImageResize);

import 'react-quill/dist/quill.snow.css';
import Footer from "./Footer.jsx"
import {
  Link, Redirect
} from "react-router-dom";

import getVideoId from 'get-video-id';
import EditableText from "./EditableText.jsx";

import Cookies from 'universal-cookie';
const cookies = new Cookies();


import {UploadToServerModal, DeleteConfirmModal, UploadImageModal } from "./Modals.jsx";

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
      showingImageModal: false,
      uploadingImageSpinner: false,
      showingDeleteModal: false,
      shouldRedirectToRoot: false,

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
        ["\\int^{s}_{x}{d}", "\\int"], ["\\binom{n}{k}", "\\binom"], ["\\lim_{k→n}", "\\lim"]],


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


  setupImageEmbed = () => {
    var customButton = document.querySelector('.ql-image-embed');


    customButton.addEventListener('click', () => {
      this.setState({ showingImageModal: true });
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
    let editor = this.reactQuill.current.editor;
    var currentCaretPos = editor.getSelection();

    if (!currentCaretPos) {
      alert("Please click somewhere in the lesson first!");
      this.setState({ showingImageModal: false });
      return;
    }
    if (!image) {
      alert("Please select an image first!");
      return;
    }


    let form = new FormData();
    form.append('name', 'image');   //append the values with key, value pair
    form.append('image', image);

    this.setState({ uploadingImageSpinner: true });
    fetch(this.props.url + '/post/upload-image', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        "SessionId": this.props.sessionId,
      },
      body: form
    }).then(res => res.json()).then(res => {
      logoutIfBadAuth(res);
      if (res.status == "failed" || res.status != "image-uploaded") {
        alert("Failed to upload image!!");
      }

      console.log("url = ", res.url);

      if (currentCaretPos) {
        editor.insertEmbed(currentCaretPos.index, 'image', res.url, Quill.sources.USER);
        this.setState({ showingImageModal: false, uploadingImageSpinner: false });

      }



      console.log('res of fetch', res)


    });


  }


  deleteLesson = () => {
    let c = confirm("Are you 100% sure you want to delete this lesson and all its children?");
    if (!c) {
      this.setState({ showingDeleteModal: false });
      return;
    }
    console.log("Deleting Lesson!");

    fetch(this.props.url + "/post/delete/", {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        "SessionId": this.props.sessionId,
      },
      body: JSON.stringify({
        id: this.props.id,
      })
    }).then(res => res.json()).then(res => {
      logoutIfBadAuth(res);
      // force the lesson browser to refresh with the query param
      // window.location.assign("/client/#/" + this.state.serverLesson.parentId);
      // window.location.assign("/client/#/?shouldReload=true" + this.state.serverLesson.parentId);
      // this.props.reloadLessonBrowser();

      // for some weird reason in react router, the above lines dont actually refresh, so settling for a full refresh like this for now
      window.location.href = "/client/";
    });
  }

  render() {

    if (this.state.shouldRedirectToRoot) {
      // return <Redirect to={'/math/'+this.state.serverLesson.parentId}  />
    }
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
        // ['image'],

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

        <LessonName name={this.state.serverLesson.name} onChange={this.handleLessonNameChange} isAdmin={this.props.isAdmin} />


        <UploadImageModal
          isShowing={this.state.showingImageModal}
          close={() => this.setState({ showingImageModal: false })}
          setImageState={(img) => this.setState({ imageUploaded: img })}
          uploadImageToServer={this.uploadImageToServer}
          spinner={this.state.uploadingImageSpinner}
        />

        <UploadToServerModal
          isShowing={this.state.showingUploadModal}
          close={() => this.setState({ showingUploadModal: false })} />

        <DeleteConfirmModal
          isShowing={this.state.showingDeleteModal}
          close={() => this.setState({ showingDeleteModal: false })}
          delete={this.deleteLesson}
          lessonId={this.state.serverLesson.id}
          lessonName={this.state.serverLesson.name}
        />

        {/* <Link to={"../browser"}>
          <Button variant="dark" >Back</Button>
        </Link> */}



        {this.props.isAdmin ? <div>

          {(this.state.serverLesson.lastUpdated != this.state.githubLastUpdated ?
            <Alert variant={'danger'}>
              This lesson has been saved, however your changes are not on the public website yet. When you are ready, Click <b>Publish</b> to publish them to the main website! (Note: that it will take a few minutes after clicking publish for this message to go away)
          </Alert> : "")}

          <Button variant="danger" onClick={() => {
            this.setState({ showingDeleteModal: true });
          }
          }>Delete</Button>

        
          <Button variant="dark" onClick={() => {
            this.saveToGithub();
          }
          }>Publish To Everyone</Button>



          <Button variant="dark" onClick={() => {
            if(this.haveLoadedQuill){
              this.haveLoadedQuill = false;
            }
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
              imageResize: true,
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


function logoutIfBadAuth(res) {
  if (res.status == "invalid-login") {
    cookies.set("isAdmin", "false");
    alert("Logging you out since your session has expired! Please login again!")
    location.reload();
  }
}

export default Lesson;

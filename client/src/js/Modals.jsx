
import React, { Component, useState } from "react";
import { Button, Modal, Spinner, Alert } from "react-bootstrap";

function UploadImageModal(props) {

  const handleClose = () => props.close();

  return (
    <Modal show={props.isShowing} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Upload Image</Modal.Title>
      </Modal.Header>
      <Modal.Body>

        <p> Select a file to upload. You may also select a pdf, however it will get converted to an image before being embedded. It will not work if there is a massive number of pages in the pdf. (Eg. No Textbooks)</p>
        <input
          type="file"
          onChange={(e) => props.setImageState(e.target.files[0])}
          accept='image/*,application/pdf'
        />
      </Modal.Body>

      <Modal.Footer>
        {props.spinner ? <Spinner className="spinner spinner-sm" animation="border" role="status">
          <span className="sr-only">Loading...</span>
        </Spinner> : <>

            <Button variant="secondary" onClick={handleClose}>
              Close
          </Button>
            <Button className="btn btn-upload-image" onClick={props.uploadImageToServer} >Upload Image</Button></>}

      </Modal.Footer>
    </Modal>
  );
}

function DeleteConfirmModal(props) {

  const handleClose = () => props.close();

  return (
    <Modal show={props.isShowing} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Delete Lesson</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Are you sure you want to delete lesson: <br /> <span className="text-info">{props.lessonName} <br />(id: {props.lessonId})</span><br /> and all its children?
        <br />
          <span className="text-danger">This action is <b>PERMANENT</b> and will also DELETE ALL THE CHILDREN OF THIS LESSON!</span>
        </p>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
          </Button>
        <Button variant="danger" onClick={props.delete}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );
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


function ChangingContentModal({ close, isShowing, content, closeButton = true }) {

    const handleClose = () => close();

    return (
        <Modal show={isShowing} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title></Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {content}
            </Modal.Body>



            <Modal.Footer>
                {closeButton ?
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                </Button> : ""}
            </Modal.Footer>
        </Modal>
    );
}
export {UploadToServerModal, DeleteConfirmModal, UploadImageModal, ChangingContentModal}
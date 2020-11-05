import React, { Component } from "react";
import { Container, Modal, Button, ButtonGroup , Spinner} from "react-bootstrap";
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'universal-cookie';
const cookies = new Cookies();

import {
    HashRouter,
    Switch,
    Route,
    Link,
    Redirect,
    withRouter,
} from "react-router-dom";
import Nestable from 'react-nestable';

class LessonBrowser extends Component {

    constructor(props) {
        super(props);
        this.state = {
            newLessonInput: "", //
            lessonTree: [{ id: '', name: '' }], // this tree can be reduced depending on the selection
            fullTree: [{ id: '', name: '' }], // this cannot be reduced any further
            showingUploadModal: false,
            modalContent: "",
        };
        this.refNestable = React.createRef();
        this.updateTreeIfAdmin();

    }
    componentDidMount() {
        this.prevNestebleRef = this.refNestable.current;
    }

    setNewrootFromOldTree = (newRootId) => {
        let newRootElement = this.findElementInTreeWithId(newRootId);
        if (newRootElement == null || newRootId == null || newRootId == "") {
            this.setState({
                lessonTree: this.state.fullTree,
            })
            return;
        }

        this.setState({
            lessonTree: [newRootElement],
        })
    }

    setCorrectCollapse = (isTimeout) => {


        if (this.refNestable.current && this.state.lessonTree.length == 1 && this.state.lessonTree) { // make sure we are not root, since thats a special case( root has more than one top node)
            let childrenOfTop = this.state.lessonTree[0].children;
            this.refNestable.current.collapse("NONE");

            let arrayToCollapse = [];
            childrenOfTop.forEach(child => {
                arrayToCollapse.push(child.id);
            });
            this.refNestable.current.collapse(arrayToCollapse);

            // this is very hacky but its to ovverid a bug in the Nestable libray, basciallay for somereason the collapse doesnt rerender when we give it multiple things ot collapse, so we do this hacky thing
            if (isTimeout != true) {
                setTimeout(() => {
                    this.setCorrectCollapse(true);
                }, 100);
            }
        }
    }

    findElementInTreeWithId = (id) => {
        // do a modified bfs/dps
        let stack = [];
        stack.push(...this.state.fullTree);
        while (stack.length > 0) {
            let element = stack.pop();

            if (element.id == id) {
                return element;
            }

            if (element.children && element.children.length > 0) {
                stack.push(...element.children);
            }
        }
    }
    setCorrectTreeRoot = () => {
        let currentElement = this.findElementInTreeWithId(this.props.match.params.id);
        if (!currentElement) {
            return;
        }
        if (currentElement.children.length > 0) {
            this.setNewrootFromOldTree(currentElement.id);
        } else {
            let parent = this.findParentFromChildIdInTree(this.props.match.params.id, this.state.fullTree);
            if (parent == null) {
                this.setNewrootFromOldTree("root")
            } else {
                this.setNewrootFromOldTree(parent.id);
            }
        }


    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.lessonTree != prevState.lessonTree) {
            this.setCorrectCollapse();
        }



        if (prevProps == this.props) {
            return;
        }
        this.setCorrectTreeRoot();

        if (prevProps.isAdmin != this.props.isAdmin) {
            this.updateTreeIfAdmin();
        }
    }

    updateTreeIfAdmin = () => {
        if (this.props.isAdmin) {
            this.refreshLessonsFromServer(); // load the lesson tree from the server
        } else {
            this.getFromGithub();
        }
    }

    goUpButtonClicked = () => {
        let parent = this.findParentFromChildIdInTree(this.state.lessonTree[0].id, this.state.fullTree);
        if (parent == null) {
            this.setNewrootFromOldTree("root")
        } else {
            this.setNewrootFromOldTree(parent.id);
        }
    }

    saveLessonToServer = (id, parentId, tree, order) => {

        console.log("telling server to move id", id, " to parent ", parentId);
        this.setState({
            showingUploadModal: true,
            modalContent: "Loading",
            shouldModalHaveClose: false,
            // this is temp just while were waiting for the server
            lessonTree: tree,
        });


        fetch(this.props.url + "/post/lesson/", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                "SessionId": this.props.sessionId,
            },
            body: JSON.stringify({
                id: id,
                parentId: parentId,
                order: order,
            })
        }).then(response => response.json())
            .then(data => {
                if (data != undefined && data.status == "success") {
                    logoutIfBadAuth(data);
                    this.setState({});
                    this.refreshLessonsFromServer();
                }
            });
    }
    createNewLesson = () => {

        let lessonName = prompt("Enter new lesson name: ");
        if (lessonName == null) {
            return;
        }


        let parentId = "root";
        let parentOfTopLesson = this.findParentFromChildIdInTree(this.state.lessonTree[0].id, this.state.fullTree);
        if (this.state.lessonTree.length == 1) { // we are in one of the child lessons, so set the parent to that
            parentId = this.state.lessonTree[0].id;
        }


        // create lesson id using time and name
        // let lessonId = lessonName.trim().replace(/\s+/g, "") + new Date().getTime();

        // make id from base36 of time
        let lessonId = (Date.now()).toString(36);

        // // send request to server to create new lesson
        fetch(this.props.url + "/post/create/lesson/", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                "SessionId": this.props.sessionId,
            },
            body: JSON.stringify({
                id: lessonId,
                name: lessonName,
                content: "",
                parentId: parentId,
                children: [],
            })
        }).then(res => res.json()).then((data) => {
            logoutIfBadAuth(data);
            this.refreshLessonsFromServer();
        });

    }


    refreshLessonsFromServer = () => {
        fetch(this.props.url + "/get/lesson-tree/root", {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        }).then(response => response.json())

            .then(data => {
                this.setState({

                    // we dont really want the root to display
                    lessonTree: data[0].children,
                    fullTree: data[0].children,
                    showingUploadModal: false
                })
                this.setCorrectTreeRoot();
                this.setCorrectCollapse();
            });


    }
    getFromGithub = () => {
        let url = this.props.clientUrl + "/lessons/lessontree.json?" + Date.now(); // just to override cache

        fetch(url, {
            headers: {
                "pragma": "no-cache",
                'Cache-Control': 'no-cache'
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
                this.setState({
                    // we dont really want the root to display
                    lessonTree: data[0].children,
                    fullTree: data[0].children,
                });
                this.setCorrectTreeRoot();
                this.setCorrectCollapse();
            })
            .catch(err => {
                console.log("failed to load ", url, err.message);
            });

    }

    saveToGithub = () => {
        this.setState({
            showingUploadModal: true,
            modalContent: "This lesson tree has been published to everyone! However it might take a few minutes to show up on the regular website."
        });

        fetch(this.props.url + "/post/lesson-tree-to-github/", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                "SessionId": this.props.sessionId,
            },
            body: JSON.stringify({
            })
        }).then(res => res.json()).then((res) => {
            logoutIfBadAuth(res);
        });
    }

    // this is to make sure we dont move root or the destination parent
    nestableConfirmChange = (dragItem, destinationParent) => {
        if (!this.props.isAdmin) {
            return false;
        }

        // if (dragItem.id == "root" || destinationParent == null) {
        //     return false;
        // }
        return true;
    }

    findParentFromChildIdInTree = (id, tree) => {
        if (tree == null) {
            tree = this.state.fullTree;
        }
        // bfs to look for parent 
        let queue = [];
        // push all the elements of it to the back of the queue
        queue.push(...tree);
        let parentId = null
        let parentElementObject = null;

        while (queue.length > 0) {
            let poppedItem = queue.pop();
            if (poppedItem.children.length < 1) {
                continue;
            }
            queue.push(...poppedItem.children);
            // if this current node has the item we want as a child, then it must be the parerent so we save that
            let searchItem = poppedItem.children.find(i => id === i.id);

            if (searchItem != undefined && searchItem != null) {
                parentId = poppedItem.id; // we have it as a child so must be parent
                parentElementObject = poppedItem;
                break;
            }
        }

        return parentElementObject;

    }
    lessonTreeNestChange = (tree, item) => {


        let parentElementObject = this.findParentFromChildIdInTree(item.id, tree);
        let parentId = "root";
        if (parentElementObject != null) {
            parentId = parentElementObject.id;
        }


        let arrayOfChildren = tree;
        if (parentId != "root") {
            arrayOfChildren = parentElementObject.children;
        }

        if (parentId != null) {
            // to set order, send request for each child with correct ordere
            for (let i = 0; i < arrayOfChildren.length; i++) {
                // TODO: to optimize this, make it so it doesnt update the parnet id on the server
                this.saveLessonToServer(arrayOfChildren[i].id, parentId, tree, i);
            }
        } else {
            console.error("Parent not found!");
        }


    }

    render() {

        // we have not loaded the lesson browser yet
        if (this.state.lessonTree == null || this.state.lessonTree[0].id == "") {
            return (
                <div className="lesson-browser-wrapper">
                    <Spinner className="spinner spinner-sm" animation="border" role="status"> 
                    </Spinner>
                </div >
            );
        }

        return (
            <div className="lesson-browser-wrapper">
                <div className="lesson-links">
                    <ButtonGroup>
                        <Button className="btn-submit btn go-up-button" onClick={this.goUpButtonClicked}>Up </Button>

                        {this.props.isAdmin ? <>
                            <Button className="btn-info btn" onClick={() => {
                                this.setState({ showingUploadModal: true });
                                this.saveToGithub();
                            }}> Publish lesson tree to main site </Button>
                            <UploadToServerModal
                                closeButton={this.state.shouldModalHaveClose}
                                content={this.state.modalContent}
                                isShowing={this.state.showingUploadModal}
                                close={() => this.setState({ showingUploadModal: false })}
                            />

                            <Button className="btn-success btn create-lesson-button" onClick={this.createNewLesson}>New</Button>

                        </> : ""
                        }
                    </ButtonGroup>

                    <Nestable
                        items={this.state.lessonTree}
                        renderItem={LessonListing}
                        onChange={this.lessonTreeNestChange}
                        collapsed={this.state.lessonTree.length != 1} // if it equals 1, then we are not root and we dont want to be collapsed, however if it is not 1, we must be root so set collapsed
                        renderCollapseIcon={({ isCollapsed }) => isCollapsed ? "+" : "-"}
                        confirmChange={this.nestableConfirmChange}
                        ref={this.refNestable}
                    />
                    {/* {<LessonListing lesson={this.state.lessonTree} />} */}



                </div>

            </div>
        );
    }


}


function LessonListing(props) {
    // TODO: inorder to find if were selected, parse the url our self

    // this is used for highlighting the selected lesson
    const id = window.location.hash.split("/")[window.location.hash.split("/").length - 1];


    return (

        <div className={"lesson-listing-wrapper" + (id == props.item.id ? " lesson-listing-selected" : "")}>
            <div className="list-collapse-icon">
                {props.collapseIcon}
            </div>

            <Link className={"lesson-listing-link-wrapper"} to={"/math/" + props.item.id}>
                <div className={"lesson-listing-name"}  >
                    <span className="lesson-browser-lesson-text" key={props.item.id}>{props.item.name}</span>
                </div>
            </Link>

        </div >
    )
}

function UploadToServerModal({ close, isShowing, content, closeButton = true }) {

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

function logoutIfBadAuth(res) {
    if (res.status == "invalid-login") {
        cookies.set("isAdmin", "false");
        location.reload();
    }
}

export default withRouter(LessonBrowser);

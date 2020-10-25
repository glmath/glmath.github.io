import React, { Component } from "react";
import { Container, Modal, Button, ButtonGroup } from "react-bootstrap";

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
        this.updateTreeIfAdmin();

    }
    componentDidMount() {
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
    setCorrectTreeRoot = () =>{
        let currentElement = this.findElementInTreeWithId(this.props.match.params.id);
        if(currentElement.children.length > 0){
            this.setNewrootFromOldTree(currentElement.id);
        }else{
            let parent = this.findParentFromChildIdInTree(this.props.match.params.id, this.state.fullTree);
            if(parent == null){
                this.setNewrootFromOldTree("root")
            }else{
                this.setNewrootFromOldTree(parent.id);
            }
        }
    }

    componentDidUpdate(prevProps) {
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
            },
            body: JSON.stringify({
                id: id,
                parentId: parentId,
                order: order,
            })
        }).then(response => response.json())
            .then(data => {
                if (data != undefined && data.status == "success") {
                    this.setState({});
                    this.refreshLessonsFromServer();
                }
            });
    }
    createNewLesson = () => {

        let lessonName = this.state.newLessonInput;
        // create lesson id using time and name
        let lessonId = lessonName.trim().replace(/\s+/g, "") + new Date().getTime();

        // send request to server to create new lesson
        fetch(this.props.url + "/post/create/lesson/", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: lessonId,
                name: lessonName,
                content: "",
                parentId: "root",
                children: [],
            })
        }).then(() => {
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
            .then(function (response) {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Error in getting lesson.');
            })
            .then(function (data) {
                this.setState({
                    // we dont really want the root to display
                    lessonTree: data[0].children,
                    fullTree: data[0].children,
                });
                setCorrectTreeRoot();
            }.bind(this))
            .catch(function (err) {
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
            },
            body: JSON.stringify({
            })
        })
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

        console.log("FOUND PARENT OBJECT ", parentElementObject);
        console.log("parent id is", parentId);

        let arrayOfChildren = tree;
        if (parentId != "root") {
            console.log("setting to the actualyl children");
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
        return (
            <div className="lesson-browser-wrapper">
                <div className="lesson-links">
                    <ButtonGroup>

                        {this.props.isAdmin ? <div>
                            <Button className="btn-submit btn" onClick={() => {
                                this.setState({ showingUploadModal: true });
                                this.saveToGithub();
                            }}> Publish lesson tree to main site </Button>
                            <UploadToServerModal
                                closeButton={this.state.shouldModalHaveClose}
                                content={this.state.modalContent}
                                isShowing={this.state.showingUploadModal}
                                close={() => this.setState({ showingUploadModal: false })}
                            /> </div> : ""
                        }
                        <Button className="btn-submit btn go-up-button" onClick={this.goUpButtonClicked}>Up </Button>
                    </ButtonGroup>

                    <Nestable
                        items={this.state.lessonTree}
                        renderItem={LessonListing}
                        onChange={this.lessonTreeNestChange}
                        collapsed={this.props.defaultCollapsed}
                        renderCollapseIcon={({ isCollapsed }) => isCollapsed ? "+" : "-"}
                        confirmChange={this.nestableConfirmChange}
                        ref={el => this.refNestable = el}
                    />
                    {/* {<LessonListing lesson={this.state.lessonTree} />} */}


                    <input type="text"
                        value={this.state.newLessonInput}
                        onChange={(e) => this.setState({ newLessonInput: e.target.value })} />

                    <button onClick={this.createNewLesson}> create </button>

                </div>

            </div>
        );
    }


}


function LessonListing(props) {
    // TODO: inorder to find if were selected, parse the url our self

    const params = new URLSearchParams(window.location.search);
    let treeRoot = params.get('treeRoot'); // bar
    if(treeRoot == null){
        treeRoot = "";
    }

    let extraQuery = "?treeRoot=" + ((props.item.children.length > 0) ? props.item.id : treeRoot);

    return (
        <div>
            {/* {props} */}
            <div className={"lesson-listing-wrapper " + (props.isSelected ? "lesson-listing-selected" : "")}  >
                <div className="list-collapse-icon">
                    {props.collapseIcon}
                </div>
                <Link to={"/math/" + props.item.id + extraQuery }>
                    <span className="lesson-browser-lesson-text" key={props.item.id}>{props.item.name}</span>
                </Link>
            </div>

            {/* <ul>
                {props.lesson.children.map(child => {
                    return (<LessonListing key={child.id} lesson={child} />);
                })}
            </ul> */}
        </div>
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


export default withRouter(LessonBrowser);

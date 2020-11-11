import React, { Component } from "react";

import {
    Link,
} from "react-router-dom";

export default function LessonListing(props) {
    // TODO: inorder to find if were selected, parse the url our self

    // this is used for highlighting the selected lesson
    const id = window.location.hash.split("/")[window.location.hash.split("/").length - 1];


    return (

        <div className={"lesson-listing-wrapper" + (id == props.item.id ? " lesson-listing-selected" : "")}>
            <div className="list-collapse-icon">
                {props.collapseIcon}
            </div>

            <Link className={"lesson-listing-link-wrapper"} to={"/" + props.item.id}>
                <div className={"lesson-listing-name"}  >
                    <span className="lesson-browser-lesson-text" key={props.item.id}>{props.item.name}</span>
                </div>
            </Link>

        </div >
    )
}
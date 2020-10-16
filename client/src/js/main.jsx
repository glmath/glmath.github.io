import React from "react";
import ReactDOM from "react-dom";

import LMath from "./LMath.jsx";
const wrapper = document.getElementById("container");

ReactDOM.render(
        <div>
          <LMath url="http://glmath.herokuapp.com" clientUrl={"https://glmath.github.io/client"} />
        </div>
, wrapper);




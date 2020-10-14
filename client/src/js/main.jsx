import React from "react";
import ReactDOM from "react-dom";

import LMath from "./LMath.jsx";
const wrapper = document.getElementById("container");

ReactDOM.render(
        <div>
          <LMath url="http://127.0.0.1:7772" clientUrl={"https://glmath.github.io/client"} />
        </div>
, wrapper);




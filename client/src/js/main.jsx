import React from "react";
import ReactDOM from "react-dom";

import LMath from "./LMath.jsx";
const wrapper = document.getElementById("container");

ReactDOM.render(
        <div>
          <LMath url="https://glmathserver.xyz" clientUrl={"https://glmath.github.io/client"} ad/>
          {/* <LMath url="" clientUrl={"https://glmath.github.io/client"} ad/> */}
        </div>
, wrapper);




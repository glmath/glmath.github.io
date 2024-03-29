import React from "react";
import ReactDOM from "react-dom";

import LMath from "./LMath.jsx";
const wrapper = document.getElementById("container");

ReactDOM.render(
  <div>
    <LMath
      url="https://shahanneda.xyz/glmath"
      clientUrl={"https://glmath.github.io/client"}
    />
    {/* <LMath url="" clientUrl={"https://glmath.github.io/client"} ad/> */}
  </div>,
  wrapper
);

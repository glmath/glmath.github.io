import React from "react";
import ReactDOM from "react-dom";

import NowPlan from "./NowPlan.jsx";
const wrapper = document.getElementById("container");

ReactDOM.render(
        <div>
          <NowPlan url="http://18.216.129.53/plannow"/>
        </div>
, wrapper);




// import React, { Component } from "react";
// import ReactDOM from "react-dom";
import ReactDOM, { useState } from "./kreact/react-dom_3";
import Component from "./kreact/Component";

import "./index.css";

class ClassComponent extends Component {
  render() {
    return (
      <div className="border">
        <p>{this.props.name}</p>
      </div>
    );
  }
}

// function FunctionComponent(props) {
//   return (
//     <div className="border">
//       <p>{props.name}</p>
//     </div>
//   );
// }
function FunctionComponent(props) {
  const [count, setCount] = useState(0);
  return (
    <div className="border">
      <button
        onClick={() => {
          console.log("count", count); //sy-log
          setCount(count + 1);
        }}
      >
        {count + ""}
      </button>
      {count % 2 ? <p>{props.name}</p> : <span>omg</span>}
    </div>
  );
}

const jsx = (
  <div className="border">
    <p>React</p>
    <a href="https://github.com/zhaoyun02/react-source-code" target="blank">
      源码
    </a>
    <FunctionComponent name="函数组件" />
    <ClassComponent name="类组件" />

    {/* <ul>
      {[1, 2, 3].map(item => (
        <React.Fragment key={item}>
          <li>111</li>
          <li>222</li>
        </React.Fragment>
      ))}
    </ul> */}

    {/* <>
      <h1>111</h1>
      <h1>222</h1>
    </> */}
  </div>
);

ReactDOM.render(jsx, document.getElementById("root"));

// import React, { Component } from "react";
// import ReactDOM from "react-dom";
import ReactDOM from "./kreact/react-dom";
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

function FunctionComponent(props) {
  return (
    <div className="border">
      <p>{props.name}</p>
    </div>
  );
}

const jsx = (
  <div className="border">
    <p>React</p>
    <a href="https://github.com/zhaoyun02/react-source-code" target="blank">源码</a>
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

    <>
      <h1>111</h1>
      <h1>222</h1>
    </>
  </div>
);

ReactDOM.render(jsx, document.getElementById("root"));

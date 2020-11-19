const render = (vnode, container) => {
  wipRoot = {
    stateNode: container,
    props: { children: vnode },
  };

  nextUnitOfWork = wipRoot;
};

// 处理节点属性，如果是children，则创建并追加到node上
const dealProps = (node, props) => {
  for (const key in props) {
    if (key !== "children") {
      node[key] = props[key];
    } else {
      if (typeof props.children === "string") {
        const textNode = document.createTextNode(props.children);
        node.appendChild(textNode);
      }
    }
  }
};

const createNode = (workInProcess) => {
  const { type, props } = workInProcess;
  let node = null;
  if (typeof type === "string") {
    node = document.createElement(type);
  }
  dealProps(node, props);
  return node;
};

// children的结构可以是：对象｜数组｜字符串 处理孩子，形成fiber结构
const dealChildren = (workInProcess, children) => {
  if (workInProcess.props && typeof children === "string") {
    return;
  }
  // 整合children为数组统一处理
  let prveFiber = null;
  const newChildren = Array.isArray(children) ? children : [children];
  for (let index = 0; index < newChildren.length; index++) {
    const child = newChildren[index];
    const nextFiber = {
      child: null,
      sibling: null,
      return: workInProcess,
      stateNode: null,
      type: child.type,
      props: child.props,
    };
    if (index === 0) {
      workInProcess.child = nextFiber;
    } else {
      prveFiber.sibling = nextFiber;
    }
    prveFiber = nextFiber;
  }
};

const createNativeCompenent = (workInProcess) => {
  if (!workInProcess.stateNode) {
    workInProcess.stateNode = createNode(workInProcess);
  }
  dealChildren(workInProcess, workInProcess.props.children);
  console.log("workInProcess", workInProcess); //sy-log
};

// 函数组件
// 执行函数
function updateFunctionComponent(workInProcess) {
  const { type, props } = workInProcess;

  const children = type(props);

  dealChildren(workInProcess, children);
}

// 类组件
// 先实例化 再执行render函数
function updateClassComponent(workInProcess) {
  const { type, props } = workInProcess;
  // 1.实例化累组件
  const instance = new type(props);
  // 2.执行render获取children
  const children = instance.render();
  // 3.协调children
  dealChildren(workInProcess, children);
}
// fiber结构：child->孩子[0] sibling->兄弟 return->父级 stateNode->Dom节点
const performUnitWork = (workInProcess) => {
  console.log(11111, workInProcess);
  // 1.执行fiber (构建fiber结构)
  const { type } = workInProcess;
  if (typeof type === "function") {
    type.isReactComponent
      ? updateClassComponent(workInProcess)
      : updateFunctionComponent(workInProcess);
  } else {
    // 原生标签
    createNativeCompenent(workInProcess);
  }

  // 2.返回下一个fiber
  if (workInProcess.child) {
    return workInProcess.child;
  }
  let nextFiber = workInProcess;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    // 没有兄弟节点时向上查找
    nextFiber = nextFiber.return;
  }
};
let nextUnitOfWork = null;
let wipRoot = null;
const workLoop = (IdleDeadline) => {
  while (nextUnitOfWork && IdleDeadline.timeRemaining() > 1) {
    // 执行fiber 返回下一个fiber
    nextUnitOfWork = performUnitWork(nextUnitOfWork);
  }

  // 提交
  if (!nextUnitOfWork && wipRoot) {
    commit();
  }
};

const commit = () => {
  commitWork(wipRoot.child);
  wipRoot = null;
};
const commitWork = (workInProcess) => {
  if (!workInProcess) {
    return;
  }
  let parentFiber = workInProcess.return;
  // 找父级，找到为止
  while (!parentFiber.stateNode) {
    parentFiber = parentFiber.return;
  }
  //将自己加到父级下面
  if (workInProcess.stateNode) {
    parentFiber.stateNode.appendChild(workInProcess.stateNode);
  }
  commitWork(workInProcess.child);
  commitWork(workInProcess.sibling);
};
requestIdleCallback(workLoop);

export default { render };

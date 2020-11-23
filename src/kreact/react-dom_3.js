import { UPDATE, PLACEMENT, DELETION } from "./const";

let  deletions = null;
let currentRoot = null; //当前工作的root 本例子中是从根开始更新的（前提），源码中是从当前fiber向下更新
const render = (vnode, container) => {
  // console.log(vnode);
  wipRoot = {
    stateNode: container,
    props: { children: vnode },
  };

  nextUnitOfWork = wipRoot;
  deletions = [];
};

// 处理节点属性，如果是children，则创建并追加到node上
// const dealProps = (node, props) => {
//   for (const key in props) {
//     if (key !== "children") {
//       if (key.slice(0, 2) === "on") {
//         const eventName = key.slice(2).toLocaleLowerCase();
//         node.addEventListener(eventName, props[key]);
//       } else {
//         node[key] = props[key];
//       }
//     } else {
//       if (typeof props.children === "string") {
//         const textNode = document.createTextNode(props.children);
//         node.appendChild(textNode);
//       }
//     }
//   }
// };
function dealProps(node, preVal, nextVal) {
  Object.keys(preVal).forEach((k) => {
    if (k === "children") {
      if (typeof nextVal.children === "string") {
        node.innerHTML = "";
      }
    } else {
      // 源码当中事件是合成事件，利用了事件委托，react17之前是把事件添加到document上，react17是添加到了container
      // 但是今天不写这么复杂了，这里瞎写一下事件
      if (k.slice(0, 2) === "on") {
        let eventName = k.slice(2).toLowerCase();
        node.removeEventListener(eventName, preVal[k]);
      } else {
        //  老的有 新的没有
        if (!(k in nextVal)) {
          node[k] = "";
        }
      }
    }
  });

  Object.keys(nextVal).forEach((k) => {
    if (k === "children") {
      if (typeof nextVal.children === "string") {
        node.innerHTML = nextVal.children;
      }
    } else {
      // 源码当中事件是合成事件，利用了事件委托，react17之前是把事件添加到document上，react17是添加到了container
      // 但是今天不写这么复杂了，这里瞎写一下事件
      if (k.slice(0, 2) === "on") {
        let eventName = k.slice(2).toLowerCase();
        node.addEventListener(eventName, nextVal[k]);
      } else {
        node[k] = nextVal[k];
      }
    }
  });
}

const createNode = (workInProcess) => {
  const { type, props } = workInProcess;
  let node = null;
  if (typeof type === "string") {
    node = document.createElement(type);
  }
  dealProps(node, {}, props);
  return node;
};

// children的结构可以是：对象｜数组｜字符串 处理孩子，形成fiber结构
const dealChildren = (workInProcess, children) => {
  if (workInProcess.props && typeof children === "string") {
    return;
  }
  // 整合children为数组统一处理
  let prveFiber = null;
  let oldFiber = workInProcess.base && workInProcess.base.child;
  const newChildren = Array.isArray(children) ? children : [children];
  for (let index = 0; index < newChildren.length; index++) {
    const child = newChildren[index];
    const same = oldFiber && child && oldFiber.type === child.type;
    let nextFiber = null;
    if (same) {
      // 更新
      nextFiber = {
        child: null,
        sibling: null,
        return: workInProcess,
        stateNode: oldFiber.stateNode, //真实dom直接复用
        type: child.type,
        props: child.props,
        base: oldFiber,
        effectTag: UPDATE,
      };
    }
    if (!same && child) {
      // 创建
      nextFiber = {
        child: null,
        sibling: null,
        return: workInProcess,
        stateNode: null,
        type: child.type,
        props: child.props,
        base: oldFiber,
        effectTag: PLACEMENT,
      };
    }
    if (!same && oldFiber) {
      // todo 删除
      oldFiber.effectTag = DELETION;
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }
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
};

// 函数组件
// 执行函数
function updateFunctionComponent(workInProcess) {
  const { type, props } = workInProcess;
  //初始化当前的fiber 以供useState使用
  wipFiber = workInProcess;
  wipFiber.hooks = [];
  wipFiber.hookIndex = 0;
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
    // 执行fiber 返回下一个fiber(生成fiber结构)
    nextUnitOfWork = performUnitWork(nextUnitOfWork);
  }

  // 提交 （根据fiber结构创建节点或更新props）
  if (!nextUnitOfWork && wipRoot) {
    commit();
  }
  requestIdleCallback(workLoop);
};

const commit = () => {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
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
  const parentNode = parentFiber.stateNode;
  if (workInProcess.stateNode && workInProcess.effectTag === PLACEMENT) {
    parentNode.appendChild(workInProcess.stateNode);
  } else if (workInProcess.effectTag === UPDATE && workInProcess.stateNode) {
    dealProps(
      workInProcess.stateNode,
      workInProcess.base.props,
      workInProcess.props
    );
  }else if (
    workInProcess.effectTag === DELETION &&
    workInProcess.stateNode
  ) {
    commitDeletion(workInProcess, parentNode);
  }

  commitWork(workInProcess.child);
  commitWork(workInProcess.sibling);
};
requestIdleCallback(workLoop);

function commitDeletion(workInProcess, parentNode) {
  // removeChild
  if (workInProcess.stateNode) {
    // workInProgress有真实dom节点
    parentNode.removeChild(workInProcess.stateNode);
  } else {
    commitDeletion(workInProcess.child, parentNode);
  }
}

let wipFiber = null; //当前正在工作的fiber wipFiber.hooks->{state,queue} state:初值 queue: 批量更新的值

export function useState(init) {
  const oldHook = wipFiber.base && wipFiber.base.hooks[wipFiber.hookIndex];
  // 当前hook
  const hook = oldHook
    ? { state: oldHook.state, queue: oldHook.queue }
    : { state: init, queue: [] };
  // 模拟批量更新
  hook.queue.forEach((state) => {
    hook.state = state;
  });
  const setState = (state) => {
    // 存最新的state,
    hook.queue.push(state);
    //更新
    wipRoot = {
      stateNode: currentRoot.stateNode,
      props: currentRoot.props,
      base: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };
  wipFiber.hooks.push(hook);
  wipFiber.hookIndex++;
  return [hook.state, setState];
}

export default { render };

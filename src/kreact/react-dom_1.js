const render = (vnode, container) => {
  // 1.vnode->node
  const node = createNode(vnode);
  // 2.node insert into container
  container.appendChild(node);
};

const createNode = (vnode) => {
  const { type, props } = vnode;
  let node;
  if (typeof type === "string") {
    node = createNativeComponent(vnode);
  } else if (typeof type === "function") {
    node = type.isReactComponent
      ? createClassComponent(vnode)
      : createFuncComponent(vnode);
  } else if (typeof type === "symbol") {
    // 创建文档片段，其会被所有子元素替代
    node = document.createDocumentFragment();
    // 将孩子加到文档片段中
    dealChildren(props.children, node);
  }
  return node;
};

const createNativeComponent = (vnode) => {
  const { type, props } = vnode;
  const node = document.createElement(type);
  if (typeof props.children === "string") {
    const child = document.createTextNode(props.children);
    node.appendChild(child);
  } else {
    dealChildren(props.children, node);
  }
  // 处理样式
  dealStyle(node, props);
  return node;
};

const createFuncComponent = (vnode) => {
  const { type, props } = vnode;
  const vvnode = type(props);
  const node = createNode(vvnode);
  return node;
};
const createClassComponent = (vnode) => {
  const { type, props } = vnode;
  const instance = new type(props);
  const vvnode = instance.render();
  const node = createNode(vvnode);
  return node;
};
const dealStyle = (node, props) => {
  for (const key in props) {
    if (key !== "children") {
      node[key] = props[key];
    }
  }
};
const dealChildren = (children, node) => {
  if (Array.isArray(children)) {
    for (let index = 0; index < children.length; index++) {
      const child = children[index];
      render(child, node);
    }
  } else {
    render(children, node);
  }
};
export default { render };

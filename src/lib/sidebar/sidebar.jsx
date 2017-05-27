// export class Sidebar extends React.Component {
//   render() {
//     return <h2>Sidebar</h2>;
//   }
// }
//
// ReactDOM.render(<Sidebar/>, document.getElementById('sidebar'));

import Tree from 'react-ui-tree';
import cx from 'classnames';
import {tree} from './tree_example';

export class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      active: null,
      tree: tree,
    };

    this.renderNode = this.renderNode.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.updateTree = this.updateTree.bind(this);
    this.onClickNode = this.onClickNode.bind(this);
  }

  renderNode(node) {
    return (
      <span className={cx('node', {
        'is-active': node === this.state.active,
        })} onClick={this.onClickNode.bind(null, node)}>
        {node.module}
      </span>
    );
  }

  onClickNode(node) {
    this.setState({
      active: node,
    });
    console.log(node);
  }

  render() {
    return (
      <div className="app">
        <div className="tree">
          <Tree
            paddingLeft={20}
            tree={this.state.tree}
            onChange={this.handleChange}
            isNodeCollapsed={this.isNodeCollapsed}
            renderNode={this.renderNode}
          />
        </div>
        <div className="inspector">
          <button onClick={this.updateTree}>update tree</button>
         </div>
      </div>
    );
  }

  handleChange(tree) {
    this.setState({
      tree: tree,
    });
  }

  updateTree() {
    const tree = this.state.tree;
    tree.children.push({module: 'test'});
    this.setState({
      tree: tree,
    });
  }
}

ReactDOM.render(<Sidebar/>, document.getElementById('sidebar'));

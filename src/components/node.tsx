import * as React from 'react';
import * as ReactDOM from 'react-dom';

interface INodeProps {
  image: Element;
  name: string;
}

class Node extends React.Component<INodeProps> {}

export default Node;

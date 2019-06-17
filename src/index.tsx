import * as React from 'react';
import * as ReactDOM from 'react-dom';
import appConfig from '../config/appconfig.json';
import {Fetch, IStatus, IService} from './fetchData';
import serverImage from '../images/Home-Server-icon.png';
import {
  DragEventCallbackOptions,
  EndpointOptions,
  Defaults,
  jsPlumb,
  jsPlumbInstance,
} from 'jsPlumb';
import CRMNode from './components/node/crmNode';
import APINode from './components/node/apiNode';
import DBNode from './components/node/dbNode';
import {NodeType} from './components/node';

interface IDiagramState {
  services: IService[];
}

class Diagram extends React.Component<{}, IDiagramState> {
  jsPlumbInstance: jsPlumbInstance;
  services: IService[];
  constructor(props: any) {
    super(props);
    this.state = {services: []};
  }

  componentDidMount() {
    fetch('/services')
      .then(res => res.json())
      .then(res => {
        this.setState({services: res});
      });
  }

  componentWillMount() {
    let defaults: Defaults = {
      Connector: 'Bezier',
      Anchors: ['Left', 'BottomRight'],
    };
    this.jsPlumbInstance = jsPlumb.getInstance(defaults);
    this.jsPlumbInstance.setContainer('hello');
  }

  onDragStop(params: DragEventCallbackOptions) {
    console.log('params');
    console.log(params);

    let pos: number[] = params.pos;
    let x: number = pos[0];
    let y: number = pos[1];
    let serviceToUpdate: IService = this.state.services.find(
      (element: IService) => {
        return element.id === params.el.id;
      },
    );
    console.log('service');
    console.log(serviceToUpdate);
    serviceToUpdate.uiProps.top = y;
    serviceToUpdate.uiProps.left = x;
    this.setState(this.state);

    console.log(JSON.stringify(this.state.services));
    fetch('/services', {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'PUT',
      body: JSON.stringify(this.state),
    });
  }

  createNodeBasedOnType(service: IService) {
    let el: JSX.Element;
    switch (service.type) {
      case NodeType.CRM:
        el = (
          <CRMNode
            service={service}
            jsPlumb={this.jsPlumbInstance}
            events={{stopDrag: this.onDragStop.bind(this)}}
          />
        );
        break;
      case NodeType.API:
        el = (
          <APINode
            service={service}
            jsPlumb={this.jsPlumbInstance}
            events={{stopDrag: this.onDragStop.bind(this)}}
          />
        );
        break;
      case NodeType.DB:
        el = (
          <DBNode
            service={service}
            jsPlumb={this.jsPlumbInstance}
            events={{stopDrag: this.onDragStop.bind(this)}}
          />
        );
        break;
    }

    return el;
  }

  renderNodes(services: IService[]) {
    let id: number = 0;
    let results: JSX.Element[] = services.map(service => {
      return this.createNodeBasedOnType(service);
    });
    return results;
  }

  render() {
    return (
      <div id="hello" style={{position: 'absolute'}}>
        {this.renderNodes(this.state.services)}
      </div>
    );
  }
}

ReactDOM.render(<Diagram />, document.getElementById('diagram'));

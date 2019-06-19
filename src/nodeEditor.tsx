import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {IService} from './fetchData';
import $ from 'jquery';

interface INodeEditorProps {
  id: string;
  show: boolean;
  node: IService;
}
export default class NodeEditor extends React.Component<INodeEditorProps, {}> {
  constructor(props: INodeEditorProps) {
    super(props);
  }

  componentDidUpdate() {
    if (this.props.show) $('#' + this.props.id).modal('show');
  }

  render() {
    console.log('rendered');
    return (
      <div
        className="modal fade"
        id={this.props.id}
        tabIndex={-1}
        role="dialog"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">
                Edit Node
              </h5>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <form>
                <div className="form-group">
                  <label htmlFor="recipient-name" className="col-form-label">
                    Name:
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="recipient-name"
                    value={this.props.node.name}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="message-text" className="col-form-label">
                    Uri:
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="message-text"
                    value={this.props.node.uri}
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-dismiss="modal">
                Cancel
              </button>
              <button type="button" className="btn btn-primary">
                Ok
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

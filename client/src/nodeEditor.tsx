import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {IService} from '@dataTypes';
import $ from 'jquery';

interface IOnConfirm {
  (service: IService): void;
}
interface INodeEditorState {
  service: IService;
}
interface INodeEditorProps {
  id: string;
  show: boolean;
  node: IService;
  onConfirm: IOnConfirm;
}

export default class NodeEditor extends React.Component<
  INodeEditorProps,
  INodeEditorState
> {
  constructor(props: INodeEditorProps) {
    super(props);
    this.onOk = this.onOk.bind(this);
    this.handleInput = this.handleInput.bind(this);
    this.state = {service: this.props.node};
  }

  handleInput(e: any) {
    let service: IService = JSON.parse(JSON.stringify(this.state.service));

    Object.assign(service, this.state.service);

    const target = e.currentTarget;
    const id = target.id;

    switch (id) {
      case 'name':
        service.name = target.value;
        break;
      case 'uri':
        service.uri = target.value;
        break;
      case 'timeout':
        service.timeout = parseInt(target.value);
        break;
      case 'categories':
        service.categories = target.value.split(',');
        break;
      case 'type':
        service.type = target.value;
        break;
    }
    this.setState({service: service});
  }

  onOk(e: React.MouseEvent<HTMLElement>) {
    e.preventDefault();
    $('#' + this.props.id).modal('hide');
    this.props.onConfirm(this.state.service);
  }

  componentDidMount() {
    if (this.props.show) $('#' + this.props.id).modal('show');
  }

  render() {
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
                {this.state.service.id ? 'Edit Node' : 'Add Node'}
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
                  <label htmlFor="name" className="col-form-label">
                    Name:
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    value={this.state.service.name}
                    onChange={this.handleInput}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="uri" className="col-form-label">
                    Uri:
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="uri"
                    value={this.state.service.uri}
                    onChange={this.handleInput}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="timeout" className="col-form-label">
                    Timeout:
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="timeout"
                    value={this.state.service.timeout}
                    onChange={this.handleInput}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="categories" className="col-form-label">
                    Categories:
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="categories"
                    value={this.state.service.categories}
                    onChange={this.handleInput}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="type" className="col-form-label">
                    Type:
                  </label>
                  <select
                    className="form-control"
                    id="type"
                    onChange={this.handleInput}
                    value={this.state.service.type}>
                    <option value="CRM">CRM</option>
                    <option value="DB">DB</option>
                    <option value="API">API</option>
                  </select>
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
              <button
                type="button"
                className="btn btn-primary"
                onClick={this.onOk}>
                Ok
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

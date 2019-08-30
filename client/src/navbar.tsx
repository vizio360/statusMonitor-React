import * as React from 'react';
import * as ReactDOM from 'react-dom';

interface ICallback {
  (): void;
}

interface INavBarProps {
  dataChanged: boolean;
  onEdit?: ICallback;
  onCancel?: ICallback;
  onSave?: ICallback;
  onAddNode?: ICallback;
}

interface INavBarState {
  isEditing: boolean;
}

export default class NavBar extends React.Component<
  INavBarProps,
  INavBarState
> {
  constructor(props: INavBarProps) {
    super(props);
    this.state = {
      isEditing: false,
    };
    this.onSave = this.onSave.bind(this);
    this.addNode = this.addNode.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.toggleEditing = this.toggleEditing.bind(this);
  }

  onSave(e: React.MouseEvent<HTMLElement>) {
    e.preventDefault();
    if (this.props.onSave) this.props.onSave();
  }

  onCancel(e: React.MouseEvent<HTMLElement>) {
    e.preventDefault();
    this.toggleEditing();
  }

  addNode(e: React.MouseEvent<HTMLElement>) {
    e.preventDefault();
    if (this.props.onAddNode) this.props.onAddNode();
  }

  toggleEditing() {
    let isEditing = !this.state.isEditing;
    this.setState({isEditing: isEditing});
    if (isEditing && this.props.onEdit) this.props.onEdit();
    else if (!isEditing && this.props.onCancel) this.props.onCancel();
  }

  render() {
    return (
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <a className="navbar-brand" href="#">
          Monitor
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation">
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          {!this.state.isEditing ? (
            <ul className="navbar-nav mr-auto">
              <li className="nav-item active">
                <button
                  className="btn btn-primary mr-sm-2"
                  type="button"
                  onClick={this.toggleEditing}>
                  Edit
                </button>
              </li>
            </ul>
          ) : (
            <ul className="navbar-nav mr-auto">
              <li className="nav-item active">
                <button
                  className="btn btn-primary mr-sm-2"
                  type="button"
                  onClick={this.addNode}>
                  Add Node
                </button>
              </li>
              <li className="nav-item">
                <button
                  className="btn btn-primary mr-sm-2"
                  type="button"
                  onClick={this.onSave}
                  disabled={!this.props.dataChanged}>
                  Save
                </button>
              </li>
              <li className="nav-item">
                <button
                  className="btn btn-primary mr-sm-2"
                  type="button"
                  onClick={this.onCancel}>
                  Cancel
                </button>
              </li>
            </ul>
          )}
        </div>
      </nav>
    );
  }
}

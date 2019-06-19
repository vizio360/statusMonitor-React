import * as React from 'react';
import * as ReactDOM from 'react-dom';

interface ISaveDiagram {
  (): void;
}
interface INavBarProps {
  dataChanged: boolean;
  onSave?: ISaveDiagram;
}

export default class NavBar extends React.Component<INavBarProps, {}> {
  constructor(props: INavBarProps) {
    super(props);
    this.onSave = this.onSave.bind(this);
  }

  onSave(e: React.MouseEvent<HTMLElement>) {
    e.preventDefault();
    if (this.props.onSave) this.props.onSave();
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
          <ul className="navbar-nav mr-auto">
            <li className="nav-item active">
              <button className="btn btn-primary mr-sm-2" type="button">
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
          </ul>
        </div>
      </nav>
    );
  }
}

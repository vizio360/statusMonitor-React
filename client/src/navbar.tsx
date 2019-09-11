import React, {useState, useEffect} from 'react';
import * as ReactDOM from 'react-dom';

export interface INavBarProps {
  editing: boolean;
  dataChanged: boolean;
  onEdit?(): void;
  onCancel?(): void;
  onSave?(): void;
  onAddNode?(): void;
}

export default function NavBar(props: INavBarProps) {
  let onSave = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    if (props.onSave) props.onSave();
  };

  let onCancel = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    toggleEditing();
  };

  let addNode = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    if (props.onAddNode) props.onAddNode();
  };

  let toggleEditing = () => {
    let isEditing = !props.editing;
    if (isEditing && props.onEdit) props.onEdit();
    else if (!isEditing && props.onCancel) props.onCancel();
  };

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
        {!props.editing ? (
          <ul className="navbar-nav mr-auto">
            <li className="nav-item active">
              <button
                className="btn btn-primary mr-sm-2"
                type="button"
                onClick={toggleEditing}>
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
                onClick={addNode}>
                Add Node
              </button>
            </li>
            <li className="nav-item">
              <button
                className="btn btn-primary mr-sm-2"
                type="button"
                onClick={onSave}
                disabled={!props.dataChanged}>
                Save
              </button>
            </li>
            <li className="nav-item">
              <button
                className="btn btn-primary mr-sm-2"
                type="button"
                onClick={onCancel}>
                Cancel
              </button>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
}

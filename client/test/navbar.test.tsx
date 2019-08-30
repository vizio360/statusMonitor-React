import React from 'react';
import renderer from 'react-test-renderer';
import NavBar from '@app/navbar';
import {render, fireEvent, waitForElement} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

describe('Nav Bar', () => {
  it('initiliases correctly with the edit button only visible', () => {
    let navBar = renderer.create(<NavBar dataChanged={false} />);
    let navBarJson = navBar.toJSON();
    expect(navBarJson).toMatchSnapshot();
  });

  it('renders the editor menu when starting editing', () => {
    const {getByText, asFragment} = render(<NavBar dataChanged={false} />);
    fireEvent.click(getByText('Edit'));
    expect(asFragment()).toMatchSnapshot();
  });

  it('exists editing if cancelled', () => {
    const {getByText, asFragment} = render(<NavBar dataChanged={false} />);
    fireEvent.click(getByText('Edit'));
    fireEvent.click(getByText('Cancel'));
    expect(asFragment()).toMatchSnapshot();
  });

  it('disables the Save button if in edit mode and no changes have been made', () => {
    const onEditCB = jest.fn();
    const {getByText, asFragment} = render(<NavBar dataChanged={false} />);
    fireEvent.click(getByText('Edit'));
    expect(getByText('Save')).toBeDisabled();
  });

  it('enables the Save button is in edit mode and changes have been made', () => {
    const onEditCB = jest.fn();
    const {getByText, asFragment} = render(<NavBar dataChanged={true} />);
    fireEvent.click(getByText('Edit'));
    expect(getByText('Save')).toBeEnabled();
  });

  it('notifies the onEdit callback when editing starts', () => {
    const onEditCB = jest.fn();
    const {getByText, asFragment} = render(
      <NavBar dataChanged={false} onEdit={onEditCB} />,
    );
    fireEvent.click(getByText('Edit'));
    expect(onEditCB).toHaveBeenCalled();
  });

  it('notifies the onCancel callback when editing is cancelled', () => {
    const onCancelCB = jest.fn();
    const {getByText, asFragment} = render(
      <NavBar dataChanged={false} onCancel={onCancelCB} />,
    );
    fireEvent.click(getByText('Edit'));
    fireEvent.click(getByText('Cancel'));
    expect(onCancelCB).toHaveBeenCalled();
  });

  it('notifies the onSave callback when editing is saved', () => {
    const onSaveCB = jest.fn();
    const {getByText, asFragment} = render(
      <NavBar dataChanged={true} onSave={onSaveCB} />,
    );
    fireEvent.click(getByText('Edit'));
    fireEvent.click(getByText('Save'));
    expect(onSaveCB).toHaveBeenCalled();
  });

  it('notifies the onAddNode callback when editing and adding a node', () => {
    const onAddNodeCB = jest.fn();
    const {getByText, asFragment} = render(
      <NavBar dataChanged={false} onAddNode={onAddNodeCB} />,
    );
    fireEvent.click(getByText('Edit'));
    fireEvent.click(getByText('Add Node'));
    expect(onAddNodeCB).toHaveBeenCalled();
  });
});

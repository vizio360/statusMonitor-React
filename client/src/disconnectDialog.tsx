import React, {useState, useEffect} from 'react';
import $ from 'jquery';

interface IDisconnectDialogProps {
  visible: boolean;
  onReconnect(): void;
}

export default function DisconnectDialog(props: IDisconnectDialogProps) {
  useEffect(() => {
    if (props.visible) {
      $('#disconnectedDialog').modal('show');
    }
  });

  let close = () => {
    $('#disconnectedDialog').modal('hide');
    props.onReconnect();
  };

  return (
    <div
      id="disconnectedDialog"
      className="modal"
      tabIndex={-1}
      role="dialog"
      data-backdrop="static"
      data-keyboard="false">
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Modal title</h5>
          </div>
          <div className="modal-body">
            <p>Connection lost!</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-primary" onClick={close}>
              Reconnect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

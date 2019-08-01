export const bind = jest.fn();
export const setContainer = jest.fn();
export const addEndpoint = jest.fn();
export const draggable = jest.fn();
export const getEndpoints = jest.fn().mockReturnValue(['source', 'target']);
export const connect = jest.fn();
export const reset = jest.fn();
const obj = {
  bind: bind,
  setContainer: setContainer,
  addEndpoint: addEndpoint,
  draggable: draggable,
  getEndpoints: getEndpoints,
  connect: connect,
  reset: reset,
};

export const getInstance = jest.fn().mockImplementation(() => {
  return obj;
});

export const jsPlumb = {
  getInstance: getInstance,
};

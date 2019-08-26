import pages from './ducks/pages.js';

const reducer = window.Redux.combineReducers({
  pages,
});

export const store = window.Redux.createStore(reducer);
WebextRedux.wrapStore(store);

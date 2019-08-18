import pages from './ducks/pages.js';

const reducer = window.Redux.combineReducers({
  pages: pages.reducer,
});

export const store = window.Redux.createStore(reducer);

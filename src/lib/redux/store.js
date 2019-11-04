import pages from './ducks/pages.js';
import {localStorage} from './local_storage.js';

const storageConfig = {
  key: 'pages',
  storage: localStorage,
};

const reducer = window.Redux.combineReducers({
  pages: window.ReduxPersist.persistReducer(storageConfig, pages),
});

export const store = window.Redux.createStore(reducer);
window.ReduxPersist.persistStore(store);
window.WebextRedux.wrapStore(store);

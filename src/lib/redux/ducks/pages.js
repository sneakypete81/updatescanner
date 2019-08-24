const ADD_PAGE = 'pages/ADD_PAGE';
const ADD_FOLDER = 'pages/ADD_FOLDER';
const DELETE_ITEM = 'pages/DELETE_ITEM';
const EDIT_PAGE = 'pages/EDIT_PAGE';
const EDIT_FOLDER = 'pages/EDIT_FOLDER';

const type = {
  PAGE: 'page',
  FOLDER: 'folder',
};

export const status = {
  NO_CHANGE: 'no_change',
  CHANGED: 'changed',
  ERROR: 'error',
};

const initialState = {0: {title: 'root', type: type.FOLDER, children: []}};

/**
 * @param {object} state - Current state.
 * @param {object} action - Action to apply.
 * @returns {object} - New state.
 */
export default function reducer(state=initialState, action) {
  const actionHandlers = {
    [ADD_PAGE]: handleAddPage,
    [ADD_FOLDER]: handleAddFolder,
    [DELETE_ITEM]: handleDeleteItem,
    [EDIT_PAGE]: handleEditPage,
    [EDIT_FOLDER]: handleEditFolder,
  };

  const actionHandler = actionHandlers[action.type];
  if (actionHandler === undefined) {
    return state;
  }
  return actionHandler(state, action);
}

/**
 * Action to add a new page to the store.
 *
 * @param {object} page - Page object to add.
 * @returns {object} Action to dispatch.
 */
export function addPage({page, parentId}) {
  return {type: ADD_PAGE, page, parentId};
}

const handleAddPage = (state, action) => {
  const id = getNextId(state);
  return {
    ...addChild(state, action.parentId, id),
    [id]: {...action.page, type: type.PAGE},
  };
};

const handleAddFolder = (state, action) => {
  const id = getNextId(state);
  const newFolder = {...action.folder, type: type.FOLDER, children: []};
  return {
    ...addChild(state, action.parentId, id),
    [id]: newFolder,
  };
};

const handleDeleteItem = (state, action) => {
  const id = action.id;
  const parentId = findParentId(state, id);
  const newState = removeChild(state, parentId, id);

  mutateToDeleteItem(newState, id);
  return newState;
};

/**
 * Action to edit an existing page.
 *
 * @param {integer} id - ID of the page to edit.
 * @param {object} page - Object whose properties will be used to update
 * the page.
 * @returns {object} Action to dispatch.
 */
export function editPage(id, page) {
  return {type: EDIT_PAGE, id, page};
}

const handleEditPage = (state, action) => {
  const id = action.id;
  const newPage = {...state[id], ...action.page};
  return {...state, [id]: newPage};
};

const handleEditFolder = (state, action) => {
  const id = action.id;
  const newPage = {
    ...state[id],
    ...action.folder,
    children: state[id].children,
  };
  return {...state, [id]: newPage};
};


const getState = (state) => state.pages;

export const getPage = (state, id) => getState(state)[id];

export const getPageIds = window.Reselect.createSelector(
  getState,
  (state) => Object.keys(state).filter(
    (id) => state[id].type === type.PAGE
  ),
);

export const getChangedPageIds = window.Reselect.createSelector(
  getState, getPageIds,
  (state, pageIds) => pageIds.filter(
    (id) => state[id].status === status.CHANGED
  ),
);

export const getDescendentPageIds = (state, itemId) => {
  const reducer = (accumulator, id) => {
    const item = state.pages[id];

    if (item.type === type.FOLDER) {
      const descendentPageIds = item.children.reduce(reducer, []);
      return accumulator.concat(descendentPageIds);

    } else if (item.type === type.PAGE) {
      accumulator.push(id);
      return accumulator;
    }
    return accumulator;
  };

  return [itemId].reduce(reducer, []);
};

const getNextId = (state) => Math.max(...Object.keys(state)) + 1;

const addChild = (state, parentId, childId) => {
  const newChildren = [...state[parentId].children, childId];
  const newParent = {...state[parentId], children: newChildren};
  return {...state, [parentId]: newParent};
};

const removeChild = (state, parentId, childId) => {
  const parent = state[parentId];
  const newChildren = parent.children.filter((id) => id !== childId);
  const newParent = {...parent, children: newChildren};
  return {...state, [parentId]: newParent};
};

const mutateToDeleteItem = (mutableState, id) => {
  const item = mutableState[id];
  delete mutableState[id];
  if (Object.prototype.hasOwnProperty.call(item, 'children')) {
    item.children.forEach(
      (childId) => mutateToDeleteItem(mutableState, childId)
    );
  }
};

const findParentId = (state, id) =>
  getFolderIds(state).find((folderId) => state[folderId].children.includes(id));

const getFolderIds = (state) =>
  Object.keys(state).filter(
    (id) => Object.prototype.hasOwnProperty.call(state[id], 'children')
  );

const ADD_PAGE = 'pages/ADD_PAGE';
const ADD_FOLDER = 'pages/ADD_FOLDER';
const DELETE_ITEM = 'pages/DELETE_ITEM';
const EDIT_PAGE = 'pages/EDIT_PAGE';
const EDIT_FOLDER = 'pages/EDIT_FOLDER';

const addPage = (state, action) => {
  const id = getNextId(state);
  return {
    ...addChild(state, action.payload.parentId, id),
    [id]: action.payload.page,
  };
};

const addFolder = (state, action) => {
  const id = getNextId(state);
  const newFolder = {...action.payload.folder, children: []};
  return {
    ...addChild(state, action.payload.parentId, id),
    [id]: newFolder,
  };
};

const deleteItem = (state, action) => {
  const id = action.payload.id;
  const parentId = findParentId(state, id);
  const newState = removeChild(state, parentId, id);

  mutateToDeleteItem(newState, id);
  return newState;
};

const editPage = (state, action) => {
  const id = action.payload.id;
  const newPage = {...state[id], ...action.payload.page};
  return {...state, [id]: newPage};
};

const editFolder = (state, action) => {
  const id = action.payload.id;
  const newPage = {
    ...state[id],
    ...action.payload.folder,
    children: state[id].children,
  };
  return {...state, [id]: newPage};
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


const initialState = {0: {title: 'root', children: []}};

const pages = {
  reducer: (state=initialState, action) => {
    const actionHandlers = {
      [ADD_PAGE]: addPage,
      [ADD_FOLDER]: addFolder,
      [DELETE_ITEM]: deleteItem,
      [EDIT_PAGE]: editPage,
      [EDIT_FOLDER]: editFolder,
    };

    const actionHandler = actionHandlers[action.type];
    if (actionHandler === undefined) {
      return state;
    }
    return actionHandler(state, action);
  },
};

export {pages as default};

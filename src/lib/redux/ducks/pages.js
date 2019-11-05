import {type} from './type.js';
import {validatePage, validatePageWithDefaults, status} from './page.js';
export {status};
import {createSelector} from '/dependencies/module/reselect/src/index.js';
import {PageStore} from '/lib/page/page_store.js';

const ADD_PAGE = 'pages/ADD_PAGE';
const ADD_FOLDER = 'pages/ADD_FOLDER';
const DELETE_ITEM = 'pages/DELETE_ITEM';
const EDIT_PAGE = 'pages/EDIT_PAGE';
const EDIT_FOLDER = 'pages/EDIT_FOLDER';

export const ROOT_ID = '0';

const initialPages = {
  [ROOT_ID]: {title: 'root', type: type.FOLDER, children: []},
  nextId: '1',
};

/**
 * @param {object} pages - Current pages state.
 * @param {object} action - Action to apply.
 * @returns {object} - New pages state.
 */
export default function reducer(pages=initialPages, action) {
  const actionHandlers = {
    [ADD_PAGE]: handleAddPage,
    [ADD_FOLDER]: handleAddFolder,
    [DELETE_ITEM]: handleDeleteItem,
    [EDIT_PAGE]: handleEditPage,
    [EDIT_FOLDER]: handleEditFolder,
  };

  const actionHandler = actionHandlers[action.type];
  if (actionHandler === undefined) {
    return pages;
  }
  return actionHandler(pages, action);
}

/**
 * Action to add a new page to the store.
 *
 * @param {object} args - Arguments object.
 * @param {object} args.page - Page object to add.
 * @param {string} args.parentId - ID of the parent folder for the page.
 * @returns {object} Action to dispatch.
 */
export function addPage({page, parentId}) {
  return {
    type: ADD_PAGE,
    page: validatePageWithDefaults(page),
    parentId};
}

const handleAddPage = (pages, action) => {
  const id = String(pages.nextId);
  const parentId = String(action.parentId);

  // Delete any residual HTML associated with the ID
  PageStore.deleteHtml(id);

  return {
    ...addChild(pages, parentId, id),
    [id]: {...action.page},
    nextId: String(Number(id) + 1),
  };
};

/**
 * Action to add a new folder to the store.
 *
 * @param {object} args - Arguments object.
 * @param {object} args.title - Folder title.
 * @param {string} args.parentId - ID of the parent folder for the folder.
 * @returns {object} Action to dispatch.
 */
export function addFolder({title, parentId}) {
  return {
    type: ADD_FOLDER,
    title,
    parentId};
}

const handleAddFolder = (pages, action) => {
  const id = String(pages.nextId);
  const parentId = String(action.parentId);
  const newFolder = {title: action.title, type: type.FOLDER, children: []};
  return {
    ...addChild(pages, parentId, id),
    [id]: newFolder,
    nextId: String(Number(id) + 1),
  };
};

/**
 * Action to delete a page or folder from the store.
 *
 * @param {string} id - ID of the item to delete.
 * @returns {object} Action to dispatch.
 */
export function deleteItem(id) {

  // Delete any residual HTML associated with the ID
  PageStore.deleteHtml(id);

  return {
    type: DELETE_ITEM,
    id,
  };
}

const handleDeleteItem = (pages, action) => {
  const id = String(action.id);
  const parentId = findParentId(pages, id);
  const newPages = removeChild(pages, parentId, id);

  mutateToDeleteItem(newPages, id);
  return newPages;
};

/**
 * Action to edit an existing page.
 *
 * @param {string} id - ID of the page to edit.
 * @param {object} page - Object whose properties will be used to update
 * the page.
 * @returns {object} Action to dispatch.
 */
export function editPage(id, page) {
  return {
    type: EDIT_PAGE,
    id,
    page: validatePage(page),
  };
}

const handleEditPage = (pages, action) => {
  const id = String(action.id);
  const page = pages[id];
  if (!isPage(page)) {
    return pages;
  }

  const newPage = {...page, ...action.page};
  return {...pages, [id]: newPage};
};

/**
 * Action to edit an existing Folder.
 *
 * @param {string} id - ID of the folder to edit.
 * @param {string} title - New folder title.
 * @returns {object} Action to dispatch.
 */
export function editFolder(id, title) {
  return {
    type: EDIT_FOLDER,
    id,
    title,
  };
}

const handleEditFolder = (pages, action) => {
  const id = String(action.id);
  const folder = pages[id];
  if (!isFolder(folder)) {
    return pages;
  }

  const newFolder = {...folder, title: action.title};
  return {...pages, [id]: newFolder};
};


const getPages = (state) => state.pages;

const pageIds = (pages) =>
  Object.keys(pages).filter(
    (id) => isPage(pages[id]),
  );

const folderIds = (pages) =>
  Object.keys(pages).filter(
    (id) => isFolder(pages[id]),
  );

const addChild = (pages, parentId, childId) => {
  const newChildren = [...pages[parentId].children, childId];
  const newParent = {...pages[parentId], children: newChildren};
  return {...pages, [parentId]: newParent};
};

const removeChild = (pages, parentId, childId) => {
  const parent = pages[parentId];
  const newChildren = parent.children.filter((id) => id !== childId);
  const newParent = {...parent, children: newChildren};
  return {...pages, [parentId]: newParent};
};

const mutateToDeleteItem = (mutablePages, id) => {
  const item = mutablePages[id];
  delete mutablePages[id];
  if (isFolder(item)) {
    item.children.forEach(
      (childId) => mutateToDeleteItem(mutablePages, childId),
    );
  }
};

const findParentId = (pages, id) =>
  folderIds(pages).find((folderId) => pages[folderId].children.includes(id));


export const isPage = (item) => item.type == type.PAGE;
export const isFolder = (item) => item.type == type.FOLDER;

export const getItem = (state, id) => getPages(state)[id];
export const getNextId = (state) => getPages(state).nextId;

export const getPageIds = createSelector(getPages, pageIds);

export const getFolderIds = createSelector(getPages, folderIds);

export const getChangedPageIds = createSelector(
  getPages,
  getPageIds,
  (pages, pageIds) => pageIds.filter(
    (id) => pages[id].status == status.CHANGED,
  ),
);

export const getDescendentPageIds = (state, itemId) => {
  const pages = getPages(state);

  const reducer = (accumulator, id) => {
    const item = pages[id];

    if (isFolder(item)) {
      const descendentPageIds = item.children.reduce(reducer, []);
      return accumulator.concat(descendentPageIds);

    } else if (isPage(item)) {
      accumulator.push(id);
      return accumulator;
    }
    return accumulator;
  };

  return [String(itemId)].reduce(reducer, []);
};

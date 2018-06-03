// Copy dependencies from node_modules

const dependencies = [
  'dialog-polyfill/dialog-polyfill.js',
  'file-dialog/index.js',
  'idb-file-storage/src/idb-file-storage.js',
  'jquery/dist/jquery.min.js',
  'jstree/dist/jstree.min.js',
];

module.exports = {
  dependencies: {
    files: [{
      expand: true,
      cwd: 'node_modules/',
      src: dependencies,
      dest: 'src/dependencies/',
      nonull: true,
    }],
  },
};

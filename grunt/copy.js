// Copy dependencies from node_modules

const includeDependencies = [
  'dialog-polyfill/dialog-polyfill.js',
  'file-dialog/index.js',
  'jquery/dist/jquery.min.js',
  'jstree/dist/jstree.min.js',
];

const moduleDependencies = [
  'idb-file-storage/src/idb-file-storage.js',
];

const devDependencies = [
  'jasmine-data-provider/src/index.js',
  'jasmine-jquery/lib/jasmine-jquery.js',
];

module.exports = {
  dependencies: {
    files: [
      {
        src: includeDependencies,
        dest: 'src/dependencies/include',
        cwd: 'node_modules/',
        expand: true,
        nonull: true,
      },
      {
        src: moduleDependencies,
        dest: 'src/dependencies/module',
        cwd: 'node_modules/',
        expand: true,
        nonull: true,
      },
      {
        src: devDependencies,
        dest: 'test/dependencies/',
        cwd: 'node_modules/',
        expand: true,
        nonull: true,
      },
    ],
  },
};

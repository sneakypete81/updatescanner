console.log('Copying dependencies...');

const fs = require('fs');

const includeDependencies = [
  {dirs: ['jquery', 'dist'], file: 'jquery.min.js'},
  {dirs: ['jstree', 'dist'], file: 'jstree.min.js'},
  {dirs: ['redux', 'dist'], file: 'redux.min.js'},
  {dirs: ['webext-redux', 'dist'], file: 'webext-redux.min.js'},
];

const moduleDependencies = [
  {dirs: ['dialog-polyfill', 'dist'], file: 'dialog-polyfill.esm.js'},
  {dirs: ['idb-file-storage', 'src'], file: 'idb-file-storage.js'},
  {dirs: ['reselect', 'src'], file: 'index.js'},
];

const testDependencies = [
  {dirs: ['jasmine-data-provider', 'src'], file: 'index.js'},
  {dirs: ['jasmine-jquery', 'lib'], file: 'jasmine-jquery.js'},
];

/**
 * Copy a single dependency, creating parent directories where necessary.
 *
 * @param {string} dependency - Dependency to copy.
 * @param {string} src - Source directory.
 * @param {string} dest - Destination directory.
 */
function copyDependency(dependency, src, dest) {
  let fullPath = '';
  for (const dir of dependency.dirs) {
    fullPath += '/' + dir;
    fs.mkdirSync(dest + '/' + fullPath, {recursive: true});
  }
  fullPath += '/' + dependency.file;
  fs.copyFileSync(src + '/' + fullPath, dest + '/' + fullPath);
}

for (const dependency of includeDependencies) {
  copyDependency(dependency, 'node_modules', 'src/dependencies/include');
}
for (const dependency of moduleDependencies) {
  copyDependency(dependency, 'node_modules', 'src/dependencies/module');
}
for (const dependency of testDependencies) {
  copyDependency(dependency, 'node_modules', 'test/dependencies');
}

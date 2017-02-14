# Update Scanner
Monitors webpages for updates

# Development
You'll need:
* [Node.js](https://nodejs.org/)
* [npm](https://www.npmjs.com/)

Clone the source and install all dependencies:

    git clone <<insert_repo_here>>
    cd updatescanner
    npm install
    npm install grunt-cli --global

# TODO
* [x] Popup
* [x] Diffing
* [x] Header for main.html
* [x] Hook up Old/New/Diff
* [x] New/Edit Page
* [ ] Handle main view when Old/New HTML don't exist
* [ ] Dialog should use Ok/Cancel and return a Promise
* [ ] Consider modifying New Page URL in case of reloads. Make it a POST?
* [x] Notification on storage change
* [x] MVCify popup.js
* [x] MVCify main.js
* [ ] ES6 Modules everywhere - remove classes as needed
  * [ ] Default Exports where possible
  * [ ] Filenames to match export names
  * [ ] async/await
* [ ] Use "for [key, value] of object.entries()" or "for key of object.keys()"
* [ ] Sidebar support (once implemented in FF)
* [ ] E2E testing

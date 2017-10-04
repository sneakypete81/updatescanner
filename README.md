# Update Scanner

[![Greenkeeper badge](https://badges.greenkeeper.io/sneakypete81/updatescanner4.svg)](https://greenkeeper.io/)
Monitors webpages for updates

# Development
You'll need:
* [Node.js](https://nodejs.org/)
* [npm](https://www.npmjs.com/)

Clone the source and install all dependencies:

    git clone https://github.com/sneakypete81/updatescanner.git
    cd updatescanner
    npm install
    npm install grunt-cli --global

Build, lint and test the webextension:

    grunt

Other useful actions:

    grunt run        # Run in Firefox, rebuilding and updating when files changes
    grunt test       # Run all tests
    grunt test:watch # Run all tests automatically whenever files change
    grunt sign       # Sign the webextension using credentials in .build_settings.json

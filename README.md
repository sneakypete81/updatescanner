# Update Scanner

Firefox addon to monitors web pages for updates.

**Documentation Website: http://sneakypete81.github.io/updatescanner**

# Development [![Build Status](https://travis-ci.org/sneakypete81/updatescanner.svg?branch=master)](https://travis-ci.org/sneakypete81/updatescanner)

You'll need [Node.js](https://nodejs.org/) installed.

Clone the source and install all dependencies:

    git clone https://github.com/sneakypete81/updatescanner.git
    cd updatescanner
    npm install
    npm install grunt-cli --global

Build, lint and test the webextension:

    grunt

Other useful actions:

    grunt run        # Run in Firefox, rebuilding and updating when files change
    grunt test       # Run all tests
    grunt test:watch # Run all tests automatically whenever files change

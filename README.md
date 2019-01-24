# Update Scanner

Firefox addon to monitors web pages for updates.

**Documentation Website: http://sneakypete81.github.io/updatescanner**

# Development [![Build Status](https://travis-ci.org/sneakypete81/updatescanner.svg?branch=master)](https://travis-ci.org/sneakypete81/updatescanner)

You'll need [Node.js](https://nodejs.org/) installed.

Clone the source and install all dependencies:

    git clone https://github.com/sneakypete81/updatescanner.git
    cd updatescanner
    npm install

Build, lint and test the webextension:

    npm run all

Other useful actions:

    npm run run        # Run in Firefox, rebuilding and updating when files change
    npm run test       # Run all tests
    npm run test:watch # Run all tests automatically whenever files change
    npm run lint       # Run all lint checks

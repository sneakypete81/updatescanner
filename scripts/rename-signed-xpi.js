const fs = require('fs');
const oldSuffix = '-an+fx.xpi';
const newSuffix = '-an.fx.xpi';

exports.rename = function() {
    for (const file of fs.readdirSync('dist')) {
        if (file.endsWith(oldSuffix)) {
            const newFile = file.replace(oldSuffix, newSuffix);
            fs.renameSync('dist/' + file, 'dist/' + newFile);
            console.log('Renamed to ' + newFile);
        }
    }
};

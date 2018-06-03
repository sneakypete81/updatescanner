(function (global) {
    'use strict';

    const fileDialog = (...args) => {
        const input = document.createElement('input')

        // Set config
        if(typeof args[0] === 'object') {
            if(args[0].multiple === true) input.setAttribute('multiple','')
            if(args[0].accept !== undefined) input.setAttribute('accept',args[0].accept)
        }
        input.setAttribute('type', 'file')

        // IE10/11 Addition
        input.style.display = 'none';
        input.setAttribute('id', 'hidden-file')
        document.body.appendChild(input)

        // Return promise/callvack
        return new Promise((resolve, reject) => {
            input.addEventListener('change', e => {
                resolve(input.files)
                const lastArg = args[args.length - 1]
                if (typeof lastArg === "function") lastArg(input.files)

                // IE10/11 Addition
                document.body.removeChild(input)
            })

            // Simluate click event
            const evt = document.createEvent('MouseEvents');
            evt.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
            input.dispatchEvent(evt);
        })
    }
    // Set either CommonJS/AMD/Global
    if (typeof define === 'function' && define.amd) {
        define(function () { return fileDialog; });
    } else if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = fileDialog;
        }
        exports.fileDialog = fileDialog;
    } else {
        global.fileDialog = fileDialog;
    }
})(this);

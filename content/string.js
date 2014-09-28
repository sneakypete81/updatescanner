// From http://javascript.crockford.com/remedial.html
// There is no license, but the website states:
//   "You can put these functions in your code library
//    and copy them individually into your projects as you need them."

// example:
// param = {domain: 'valvion.com', media: 'http://media.valvion.com/'};
// url = supplant("{media}logo.gif", param);

UpdateScanner.supplant = function (str, o) {
    return str.replace(/{([^{}]*)}/g,
        function (a, b) {
            var r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
};

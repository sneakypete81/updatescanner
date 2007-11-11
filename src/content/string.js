// From http://javascript.crockford.com/remedial.html
// There is no license, but the website states:
//   "You can put these functions in your code library 
//    and copy them individually into your projects as you need them."

// example:
// param = {domain: 'valvion.com', media: 'http://media.valvion.com/'};
// url = "{media}logo.gif".supplant(param);

String.prototype.USc_supplant = function (o) {
    return this.replace(/{([^{}]*)}/g,
        function (a, b) {
            var r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
};

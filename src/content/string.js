// Fromhttp://javascript.crockford.com/remedial.html

// example:
// param = {domain: 'valvion.com', media: 'http://media.valvion.com/'};
// url = "{media}logo.gif".supplant(param);

String.prototype.supplant = function (o) {
    return this.replace(/{([^{}]*)}/g,
        function (a, b) {
            var r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
};

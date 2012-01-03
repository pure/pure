//test from https://gist.github.com/729432

var doc           = require('jsdom').jsdom(),
    window        = doc.createWindow(),
    jQueryElement = doc.createElement('script'),
    pureElement   = doc.createElement('script'),
    body          = doc.getElementsByTagName('body').item(0),
    directive     = { 'span.who': 'who' },
    data          = { 'who': 'Hello Wrrrld' };

body.innerHTML = '<div id="template"><div class="hello">\
<span class="who"></span>\
</div></div>';

// Load up jQuery
jQueryElement.src = 'http://code.jquery.com/jquery-1.4.4.js';
doc.head.appendChild(jQueryElement);

// Load up PURE
pureElement.src = 'http://beebole.com/pure/wp-content/themes/BeeBole-pure/libs/pure.js';
doc.head.appendChild(pureElement);


http.createServer(function (req, res) {

	window.jQuery('div#template').render(data, directive);

}).listen(1234, '127.0.0.1');




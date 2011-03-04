var http = require('http'),
	fs    = require('fs'), // to load html/js templates
	window = require("jsdom").jsdom().createWindow(), // DOM/BOM
	jQuery = require('jquery'), // for selectors
	$p = require('pure').$p,
	templates = {};
	
http.createServer(function (req, res) {


	res.writeHead(200, {'Content-Type': 'text/html'});
	res.end('jQuery: ' + typeof(jQuery) + ' - pure: ' + typeof($p));


}).listen(1234, "127.0.0.1");
console.log('Server running at http://127.0.0.1:1234/'); 



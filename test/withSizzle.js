$p.plugins.find = function(n, sel){
	return Sizzle(sel, n);
};

/* Hello world */
$p( 'div.hello' ).autoRender( data1 );

/* Auto Rendering (overwritten with a simple directive) */
$p('div.friends').autoRender( data2, {'.who':'who2'} );

/* Nested table */
$p('div.scoreBoard').render( data3, directive3 );

/* Recursion */
var countries = $p('ul.treeItem').compile(directive4);
Sizzle('div.htmlDoc')[0].innerHTML = countries(data4);
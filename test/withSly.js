$p.plugins.find = function(n, sel){
	return Sly(sel, n);
};

/* Hello world */
$p( 'div.hello' ).autoRender( data1 );

/* Auto Rendering (overwritten with a simple directive) */
$p('div.friends').autoRender( data2, {'.who':'who2'} );

/* Loop on table with events */
$p('table.playerList').render( data2a, directive2a );

/* Nested table */
$p('div.scoreBoard').render( data3, directive3 );

/* Recursion */
var countries = $p('ul.treeItem').compile(directive4);
Sly('div.htmlDoc', document)[0].innerHTML = countries(data4);
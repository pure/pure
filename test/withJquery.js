//set jquery functions
jQuery.fn.extend({
	compile:function(directive, ctxt){
		return $p(this[0]).compile(directive, ctxt);
	}, 
	render:function(ctxt, directive){
		return $p(this[0]).render(ctxt, directive);
	}, 
	autoRender:function(ctxt, directive){
		return $p(this[0]).autoRender(ctxt, directive);
	}
});

// set the find if not native
if (typeof document.querySelector === 'undefined'){
	$p.plugins.find = function(n, sel){
		return $(n).find(sel);
	};
}

/* Hello world */
$( 'div.hello' ).autoRender( data1 );

/* Auto Rendering (overwritten with a simple directive) */
$('div.friends').autoRender( data2, {'.who':'who2'} );

/* Nested table */
$('div.scoreBoard').render( data3, directive3 );

/* Recursion */
var n = $('ul.treeItem');
var countries = n.compile(directive4);
$('div.htmlDoc').get(0).innerHTML = countries(data4);

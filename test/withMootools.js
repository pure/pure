Element.implement({
	compile:function(directive, ctxt){
		return $p(this).compile(directive, ctxt);
	}, 
	render:function(ctxt, directive){
		return $p(this).render(ctxt, directive);
	}, 
	autoRender:function(ctxt, directive){
		return $p(this).autoRender(ctxt, directive);
	}
});

if (typeof document.querySelector === 'undefined'){
	$p.plugins.find = function(n, sel){
		return [$(n).getElement(sel)];
	};
}

/* Hello world */
$(document).getElement('div.hello' ).autoRender( data1 );

/* Auto Rendering (overwritten with a simple directive) */
$(document).getElement('div.friends').autoRender( data2, {'.who':'who2'} );

/* Loop on table with events */
$(document).getElement('table.playerList').render( data2a, directive2a );

/* Nested table */
$(document).getElement('div.scoreBoard').render( data3, directive3 );

/* Recursion */
var n = $(document).getElement('ul.treeItem');
var countries = n.compile(directive4);
$(document).getElement('div.htmlDoc').innerHTML = countries(data4);

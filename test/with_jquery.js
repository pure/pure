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
if ( typeof document.querySelector === 'undefined' ){
	$p.plugins.find = function(n, sel){
		return $(n).find(sel);
	};
}

function runLib(ex, debug){

	switch(ex.id){
		case 'ex01':
			/* Hello world AutoRendering*/
			$( ex.template ).autoRender( ex.data );
		break;
		case 'ex02':
			/* Hello world Render*/
			$( ex.template ).autoRender( ex.data , ex.directive);
		break;
		case 'ex03':
			/* Auto Rendering (overwritten with a simple directive) */
			$(ex.template).autoRender( ex.data, ex.directive );
		break;
		case 'ex04':
			/* Loop on table with events */
			$(ex.template).render( ex.data, ex.directive );
		break;
		case 'ex05':
			/* Loop on table with events */
			$(ex.template).render( ex.data, ex.directive1 ).render( ex.data, ex.directive2 );
		break;
		case 'ex06':
			/* Nested table */
			$(ex.template).render( ex.data, ex.directive );
		break;
		case 'ex07':
			/* Recursion */
			countries = $(ex.template).compile( ex.directive );
			$( ex.template )[0].parentNode.innerHTML = countries( ex.data );
		break;
		default:
			alert('Example ' + ex.id + ' does not exist');
	}
}
var countries;
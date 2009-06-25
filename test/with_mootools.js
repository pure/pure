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
		return $(n).getElements(sel);
	};
}

function runLib(ex, debug){

	switch(ex.id){
		case 'ex01':
			/* Hello world AutoRendering*/
			$(document).getElement( ex.template ).autoRender( ex.data );
		break;
		case 'ex02':
			/* Hello world Render*/
			$(document).getElement( ex.template ).autoRender( ex.data , ex.directive );
		break;
		case 'ex03':
			/* Auto Rendering (overwritten with a simple directive) */
			$(document).getElement( ex.template ).autoRender( ex.data, ex.directive );
		break;
		case 'ex04':
			/* Loop on table with events */
			$(document).getElement( ex.template ).render( ex.data, ex.directive );
		break;
		case 'ex05':
			/* Loop on table with events */
			$(document).getElement( ex.template ).render( ex.data, ex.directive1 ).render( ex.data, ex.directive2 );
		break;
		case 'ex06':
			/* Nested table */
			$(document).getElement( ex.template ).render( ex.data, ex.directive );
		break;
		case 'ex07':
			/* Recursion */
			countries = $(document).getElement(ex.template).compile( ex.directive );
			$(document).getElement( ex.template ).parentNode.innerHTML = countries( ex.data );
		break;
		default:
			alert('Example ' + ex.id + ' does not exist');
	}
}
var countries;

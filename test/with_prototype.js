Element.addMethods({
	compile:function(element, directive, ctxt){
		return $p(element).compile(directive, ctxt);
	}, 
	render:function(element, ctxt, directive){
		return $p(element).render(ctxt, directive);
	}, 
	autoRender:function(element, ctxt, directive){
		return $p(element).autoRender(ctxt, directive);
	}
});

if (typeof document.querySelector === 'undefined'){
	$p.plugins.find = function(n, sel){
		if(n === document){
			n = n.body;
		}
		return typeof n === 'string' ? $$(n) : $(n).select(sel);
	};
}

function runLib(ex, debug){

	switch(ex.id){
		case 'ex01':
			/* Hello world AutoRendering*/
			$$( ex.template )[0].autoRender( ex.data );
		break;
		case 'ex02':
			/* Hello world Render*/
			$$( ex.template )[0].autoRender( ex.data , ex.directive );
		break;
		case 'ex03':
			/* Auto Rendering (overwritten with a simple directive) */
			$$( ex.template )[0].autoRender( ex.data, ex.directive );
		break;
		case 'ex04':
			/* Loop on table with events */
			$$( ex.template )[0].render( ex.data, ex.directive );
		break;
		case 'ex05':
			/* Loop on table with events */
			$$( ex.template )[0].render( ex.data, ex.directive1 ).render( ex.data, ex.directive2 );
		break;
		case 'ex06':
			/* Nested table */
			$$( ex.template )[0].render( ex.data, ex.directive );
		break;
		case 'ex07':
			/* Recursion */
			countries = $$(ex.template)[0].compile( ex.directive );
			$$( ex.template )[0].parentNode.innerHTML = countries( ex.data );
		break;
		default:
			alert('Example ' + ex.id + ' does not exist');
	}
}
var countries;
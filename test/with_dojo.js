// set the find if not native
if ( typeof document.querySelector === 'undefined' ){
	$p.plugins.find = function(n, sel){
		return dojo.query(sel, n);
	};
}
function runLib(ex, debug){

	switch(ex.id){
		case 'ex01':
			/* Hello world AutoRendering*/
			$p( ex.template ).autoRender( ex.data );
		break;
		case 'ex02':
			/* Hello world Render*/
			$p( ex.template ).autoRender( ex.data , ex.directive );
		break;
		case 'ex03':
			/* Auto Rendering (overwritten with a simple directive) */
			$p( ex.template ).autoRender( ex.data, ex.directive );
		break;
		case 'ex04':
			/* Loop on table with events */
			$p( ex.template ).render( ex.data, ex.directive );
		break;
		case 'ex05':
			/* Loop on table with events */
			$p( ex.template ).render( ex.data, ex.directive1 ).render( ex.data, ex.directive2 );
		break;
		case 'ex06':
			/* Nested table */
			$p( ex.template ).render( ex.data, ex.directive );
		break;
		case 'ex07':
			/* Recursion */
			countries = $p(ex.template).compile( ex.directive );
			$p( ex.template )[0].parentNode.innerHTML = countries( ex.data );
		break;
		default:
			alert('Example ' + ex.id + ' does not exist');
	}
}
var countries;
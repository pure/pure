// global functions
var loadLib, runAll, run;

(function(){

	var currLib = '';

	loadLib = function(lib){
		currLib = lib;
		document.getElementById( 'chooseLib' ).innerHTML = '<div id="libLoaded"> Loading... '+  lib + '</div>';
		if(lib === 'pure'){
			showExamples();
			return;
		}
		loadScript([ 'libs/' + lib + '.js'], showExamples);
	};

	//load scripts in sequence
	function loadScript(srcs, done, howMany) {
		if (srcs.length === 0) { return; }
		howMany = howMany || srcs.length;

		var s = document.createElement('script'), clunky = false;
		var almostDone = function() {
			if ( !clunky || (clunky && (s.readyState === 'complete' || s.readyState === 'loaded') ) ) {
				loadScript(srcs, done, --howMany);
				done();
			}
		};

		s.charset = "UTF-8";
		s.src = srcs.shift();

		if (typeof s.addEventListener !== 'undefined') {
			s.addEventListener('load', almostDone, false);
		} else if (typeof s.attachEvent !== 'undefined') {
			clunky = true;
			s.attachEvent('onreadystatechange', almostDone);
		}

		document.body.appendChild(s);
	}

	function showExamples(){
		//initialise the lib
		currLib !== 'pure' && $p.libs[currLib]();

		document.getElementById( 'libLoaded' ).innerHTML = '<b>'+ currLib + '</b> is loaded<br />You can run the examples below individually or <a href="#" onclick="runAll(this)">all at once</a>';
		document.getElementById( 'examples' ).style.display = 'block';

		var lis = $p( 'ul.exampleList li' ),
			lii,
			cn,
			span;
		for(var i = 0, ii = lis.length; i < ii; i++){
			lii = lis[i];
			if(!(/^ex[0-9]+$/).test(lis[i].className)){ 
				continue; 
			}

			var h = $p('h3', lii);
			if(h[0]){
				h = h[0];
				if(!(/SPAN/).test(h.nextSibling.tagName)){
					span = document.createElement( 'SPAN' );
					h.parentNode.insertBefore(span, h.nextSibling);
				}else{
					span = h.nextSibling;
				}
				var cn = lis[i].className;
				window[cn].id = cn;
				span.id = cn;
				span.innerHTML = 
					'<a class="run"   href="#" onclick="run(this, '+cn+');return false;">Run</a>'+
					'<a class="debug" href="#" onclick="run(this, '+cn+', true);return false;">Debug</a>';
			}
		}
	}

	// run all examples at once
	runAll = function(a){
		a.onclick = null;
		var lis = $p( 'ul.exampleList li' ),
			lii;
		for(var i = 0, ii = lis.length; i < ii; i++){
			lii = lis[i];
			if(!(/^ex[0-9]+$/).test(lis[i].className)){ 
				continue; 
			}
			run( $p('a.run', lii)[0], window[lii.className] );
		}

	};
	
	//example of plugin to debug a transformation
	$p.plugins.compileDebug = function(directive, ctxt, template){
	  debugger;
	  var rfn = this._compiler( ( template || this[0] ).cloneNode( true ), directive, ctxt);
	  var json;
	  return function(data){
	    json = json || data;
	    return rfn( { data: data, json:json } );
	  };
	};


	// choose between run or debug
	run = function(elm, fn, debug){
		if(!elm){return;}
		elm.parentNode.innerHTML = '';
		if(debug === true){
			$p.plugins.__compile = $p.plugins.compile;
			$p.plugins.compile = $p.plugins.compileDebug;
		}

		transform(fn, debug);

		if(debug === true){
			$p.plugins.compile = $p.plugins.__compile;
		}
	};

	// run a transformation
	function transform(ex, debug){
		var template;
		if(typeof ex === 'function'){
			return ex();
		}

		switch(currLib){
			case 'domassistant':
			case 'jquery':
				template = $( ex.template );
			break;
			case 'mootools':
				template = $(document).getElement( ex.template );
			case 'prototype':
				template = $$( ex.template )[0];
			default:
				template = $p( ex.template );
		}

		switch(ex.id){
			case 'ex01':
			case 'ex02':
			case 'ex03':
			case 'ex04':
			case 'ex06':
				//autoRender with data (and directives)
				template.autoRender( ex.data , ex.directive );
			break;

			case 'ex05':
				/* double rendering */
				template.render( ex.data, ex.directive1 ).render( ex.data, ex.directive2 );
			break;

			case 'ex07':
				/* Recursion */
				var rfn = template.compile( ex.directive );

				if(typeof rfn[0] === 'function'){ //DOMAssistant sends back an array?
					rfn = rfn[0];
				}
				ex.rfn = rfn;
				//some libs send back an array, some send the node
				( template[0] || template ).parentNode.innerHTML = rfn( ex.data );
			break;

			default:
				// default rendering with data and directive
				template.render( ex.data, ex.directive );
		}

	}

}());

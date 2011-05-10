// global functions for cross site example
var loadLib, runAll, run, transform;

(function(){
	var currLib = 'jquery'; //default lib

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

		document.getElementById( 'libLoaded' ).innerHTML = '<b>'+ currLib + '</b> is loaded<br />You can run the examples below individually or <a href="javascript:void(0)" onclick="runAll(this);">all at once</a><br />';
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
				cn = lis[i].className;
				window[cn].id = cn;
				span.id = cn;
				span.innerHTML = 
					'<a class="run"   href="javascript:void(0)" onclick="run(this, '+cn+');">Run</a>';
			}
		}
	}

	// run all examples at once
	runAll = function(a){
		a.onclick = function(){return false;};
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
		elm.innerHTML = 'Show Source';
		elm.onclick = function(){
			showSource(fn, this);
			return false;
		};
		
		if(debug === true){
			$p.plugins.__compile = $p.plugins.compile;
			$p.plugins.compile = $p.plugins.compileDebug;
		}

		transform(fn, debug);

		if(debug === true){
			$p.plugins.compile = $p.plugins.__compile;
		}
	};
	function showSource(o, a){
		var li = $p('li.' + o.id + ' div.template')[0],
			old = document.getElementById('sourceCodes'),
			src = document.createElement('DIV'),
			srcNb = 0,
			txtShow = 'Show Source',
			txtHide = 'Hide Source',
			addSrc = function(title, source){
				srcNb++;
				var t = document.createElement('DIV'),
					tt = document.createElement('DIV');
				t.className = 'sourceTitle';
				t.innerHTML = title;
				tt.className = 'sourceCode';
				tt.innerHTML = '<pre>'+source+'</pre>';
				tt.insertBefore(t, tt.firstChild);
				src.appendChild(tt);
			};
		if(old){
			$p('a', old.parentNode)[0].innerHTML = txtShow;
			old.parentNode.removeChild(old);
		}
		src.id = 'sourceCodes';
		if(typeof o === 'function'){
			addSrc('Function', o.toString());
		}else{
			o.template && addSrc('HTML', o.original.replace(/\</g,'&lt;').replace(/\>/g,'&gt;').replace(/\t/g, '  '));
			o.directive && addSrc('Directive', JSON.stringify(o.directive, null, 2));
			o.data && addSrc('Data', JSON.stringify(o.data, null, 2));
		};
		src.className = 'cols' + srcNb;
		li.parentNode.insertBefore(src, li);
		var oldClick = a.onclick;
		a.innerHTML = txtHide;
		a.onclick = function(){
			a.innerHTML = txtShow;
			try{li.parentNode.removeChild(src);}catch(e){};//IE fails sometimes on it
			a.onclick = oldClick;
			return false;
		};
	};
	// run a transformation
	transform = function(ex, debug){
		var template;
		if(typeof ex === 'function'){
			ex();
		}else{
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
		
			//keep a copy of the template
			var dv = document.createElement('DIV');
			dv.appendChild((template[0] || template).cloneNode(true));
			ex.original = dv.innerHTML;
		
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
	};

}());

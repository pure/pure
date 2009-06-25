function loadLib(lib){
	document.getElementById('chooseLib').innerHTML += ' Loading' + lib;
	loadScript(['../libs/'+lib+'.js', 'with'+lib+'.js']);
	var cnt = 0;
	function loadScript(srcs){
		if(srcs.length > 0){
			var src = srcs.shift(),
				s = document.createElement("script");
			s.charset = "UTF-8";
			s.src = src;
			document.body.appendChild(s);
			s.onreadystatechange = function() {
			    loadScript(srcs);
				(++cnt === 2) && done();
			};
			s.onload = function(){
				loadScript(srcs);
				(++cnt === 2) && done();
			};
		}
	}
	function done(){
		document.getElementById('chooseLib').innerHTML = lib + ' loaded. You can now run the examples below.';
		document.getElementById('examples').style.display = 'block';
		var lis = $p('ul.exampleList li'),
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
				span = document.createElement('SPAN');
				h.parentNode.insertBefore(span, h.nextSibling);
				var cn = lis[i].className;
				window[cn].id = cn;
				span.innerHTML = 
					'<a class="run"   href="#" onclick="run(this, '+cn+');return false;">Run</a>'+
					'<a class="debug" href="#" onclick="run(this, '+cn+', true);return false;">Debug</a>';
			}
		}
	}
}

$p.plugins.compileDebug = function(directive, ctxt){
	debugger;
	var rfn = this._compiler(this[0].cloneNode(true), directive, ctxt);
	return function(data){
		return rfn({data: data});
	};
};

function run(elm, fn, debug){
	var otherA = elm.className === 'run' ? elm.nextSibling : elm.previousSibling;
	otherA.parentNode.removeChild(otherA);
	elm.parentNode.removeChild(elm);
	if(debug === true){
		$p.plugins.__compile = $p.plugins.compile;
		$p.plugins.compile = $p.plugins.compileDebug;
	}
	runLib(fn, debug);
	if(debug === true){
		$p.plugins.compile = $p.plugins.__compile;
	}
}

/* * * * * * * * * * * * * * * * * * * * * * * * * *

    PURE Unobtrusive Rendering Engine for HTML

    Licensed under the MIT licenses.
    More information at: http://www.opensource.org

    Copyright (c) 2009 Michael Cvilic - BeeBole.com

	Thanks to Rog Peppe for the functional JS jump
    revision: 2.05

* * * * * * * * * * * * * * * * * * * * * * * * * */

var $p = pure = function(){
	var sel = arguments[0], 
		ctxt = false;

	if(typeof sel === 'string'){
		ctxt = arguments[1] || false;
	}
	return $p.core(sel, ctxt);
};

$p.core = function(sel, ctxt, plugins){
	//get an instance of the plugins
	var plugins = getPlugins(),
		templates = [];

	//search for the template node(s)
	if(typeof sel === 'string'){
		templates = plugins.find(ctxt || document, sel);
	}else if(typeof sel === 'object'){
		templates = [sel];
	}else{
		error('No templates found. Review your selector');
	}
	
	for(var i = 0, ii = templates.length; i < ii; i++){
		plugins[i] = templates[i];
	}
	plugins.length = ii;

	// set the signature string that will be replaced at render time
	var Sig = '_s' + Math.floor( Math.random() * 1000000 ) + '_';
	
	// keep the json data root
	var json;
	
	return plugins;


	/* * * * * * * * * * * * * * * * * * * * * * * * * *
		core functions
	 * * * * * * * * * * * * * * * * * * * * * * * * * */


	// error utility
	function error(e){
		alert(e);
		if(typeof console !== 'undefined'){
			console.log(e);
			debugger;
		}
		throw('pure error: ' + e);
	}
	
	//return a new instance of plugins
	function getPlugins(){
		var plugins = $p.plugins;
		function f(){}
		f.prototype = plugins;

		// do not overwrite functions if external definition
		f.prototype.compile    = plugins.compile || compile;
		f.prototype.render     = plugins.render || render;
		f.prototype.autoRender = plugins.autoRender || autoRender;
		f.prototype.find       = plugins.find || find;
		
		// give the compiler and the error handling to the plugin context
		f.prototype._compiler  = compiler;
		f.prototype._error     = error;
 
		return new f();
	}
	
	// returns the outer HTML of a node
	function outerHTML(node){
		// if IE take the internal method otherwise build one
		return node.outerHTML || (function(node){
        	var div = document.createElement('div');
	        div.appendChild(node.cloneNode(true));
	        return div.innerHTML;})(node);
	}

	// check if the argument is an array
	function isArray(o){
		return Object.prototype.toString.call( o ) === "[object Array]";
	}
	
	// returns the string generator function
	function wrapquote(qfn, f){
		return function(ctxt){
			return qfn('' + f(ctxt));
		};
	}

	// convert a JSON HTML structure to a dom node and returns the leaf
	function domify(ns, pa){
		pa = pa || document.createDocumentFragment();
		var nn, leaf;
		for(var n in ns){
			nn = document.createElement(n);
			pa.appendChild(nn);
			if(typeof ns[n] === 'object'){
				leaf = domify(ns[n], nn);
			}else{
				leaf = document.createElement(ns[n]);
				nn.appendChild(leaf);
			}
		}
		return leaf;
	};
	
		// default find using querySelector when available on the browser
	function find(n, sel){
		if(typeof n === 'string'){
			sel = n;
			n = false;
		}
		if(typeof document.querySelectorAll !== 'undefined'){
			return (n||document).querySelectorAll( sel );
		}else{
			error('You can test PURE standalone with: iPhone, FF3.5+, Safari4+ and IE8+\n\nWith your current browser version, you need a JS library with a selector engine to run PURE');
		}
	}
	
	// create a function that concatenates constant string
	// sections (given in parts) and the results of called
	// functions to fill in the gaps between parts (fns).
	// fns[n] fills in the gap between parts[n-1] and parts[n];
	// fns[0] is unused.
	// this is the inner template evaluation loop.
	function concatenator(parts, fns){
		return function(ctxt){
			var strs = [parts[0]];
			var n = parts.length;
			for(var i = 1; i < n; i++){
				strs[strs.length] = fns[i](ctxt);
				strs[strs.length] = parts[i];
			}
			return strs.join('');
		};
	}

	// parse and check the loop directive
	function parseloopspec(p){
		var m = p.match(/^(\w+)\s*<-\s*(\S+)$/);
		if(m === null){
			error('bad loop spec: "' + p + '"');
		}
		return {name: m[1], sel: m[2]};
	}

	// parse a data selector and return a function that
	// can traverse the data accordingly, given a context.
	function dataselectfn(sel){
		if(typeof(sel) === 'function'){
			return sel;
		}
		var m = sel.match(/^(\w+)(\.(\w+))*$/);
		if(m === null){
			var found = false, 
				s = sel,
				parts = [],
				pfns = [],
				i = 0;
			// check if literal
			if(/\'|\"/.test( s.charAt(0) )){
				if(/\'|\"/.test( s.charAt(s.length-1) )){
					var retStr = s.substring(1, s.length-1);
					return function(){ return retStr; };
				}
			}else{
				// check if literal + #{var}
				while((m = s.match(/#\{([^{}]+)\}/)) !== null){
					found = true;
					parts[i++] = s.slice(0, m.index);
					pfns[i] = dataselectfn(m[1]);
					s = s.slice(m.index + m[0].length, s.length);
				}
			}
			if(!found){
				error('bad data selector syntax: ' + sel);
			}
			parts[i] = s;
			return concatenator(parts, pfns);
		}
		m = sel.split('.');
		return function(ctxt){
			var data = ctxt.data;
			if(!data){
				return '';
			}
			var v = ctxt[m[0]];
			var i = 0;
			if(v){
				data = v.item;
				i += 1;
			}
			var n = m.length;
			for(; i < n; i++){
				if(!(data = data[m[i]])){
					return '';
				}
			}
			return data;
		};
	}

	// wrap in an object the target node/attr and their properties
	function gettarget(dom, sel, isloop){
		var osel, prepend, selector, attr, append, target = [];
		if( typeof sel === 'string' ){
			osel = sel;
			// e.g. "+tr.foo[class]"
			var m = sel.match(/^\s*([\+=])?(((\+[^\[])|[^\[\+])*)(\[([^\]]*)\])?([\+=])?\s*$/);
			if( !m ){
				error( 'bad selector: ' + sel );
			}
			
			prepend = m[1];
			selector = m[2];
			attr = m[6];
			append = m[7];
			
			if(selector === '.' || ( selector === '' && typeof attr !== 'undefined' ) ){
				target[0] = dom;
			}else{
				target = plugins.find(dom, selector);
			}
			if(!target || target.length === 0){
				return {attr: null, nodes: target, set: null, sel: osel};
			}
		}else{
			// autoRender node
			prepend = sel.prepend;
			attr = sel.attr;
			append = sel.append;
			target = [dom];
		}
		
		if( prepend || append ){
			if( prepend && append ){
				error('append/prepend cannot take place at the same time');
			}else if( isloop ){
				error('no append/prepend/replace modifiers allowed for loop target');
			}else if( append && isloop ){
				error('cannot append with loop (sel: ' + osel + ')');
			}
		}
		// we need 'root' selector because CSS search never finds the root element.
		var setstr, getstr, quotefn;
		if(attr){
			getstr = function(node){ 
				if((/^style$/i).test(attr)){
					var css = node.style.cssText;
					node.removeAttribute( 'style' );
					return css;
				}else{
					return node.getAttribute(attr); 					
				}
			};
			setstr = function(node, s){
				if((/^style$/i).test(attr)){
					node.setAttribute( attr + Math.floor( Math.random() * 100000 ), s );
				}else{
					node.setAttribute(attr, s);
				};
			};
			quotefn = function(s){
				return s.replace(/\"/g, '&quot;').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
			};
		}else{
			if(isloop){
				setstr = function(node, s){
					// we can have a null parent node
					// if we get overlapping targets.
					var pn = node.parentNode;
					if(pn){
						//replace node with s
						var t = document.createTextNode(s);
						node.parentNode.insertBefore(t, node.nextSibling);
						node.parentNode.removeChild(node);
					}
				};
			}else{
				getstr = function(node){ return node.innerHTML; };
				setstr = function(node, s){ node.innerHTML = s; };
			}
			quotefn = function(s){ return s; };
		}
		var setfn;
		if(prepend){
			setfn = function(node, s){ setstr( node, s + getstr( node ) );};
		}else if(append){
			setfn = function(node, s){ setstr( node, getstr( node ) + s );};
		}else{
			setfn = function(node, s){ setstr( node, s );};
		}
		return {attr: attr, nodes: target, set: setfn, sel: osel, quotefn: quotefn};
	}

	function setsig(target, n){
		var sig = Sig + n + ':';
		for(var i = 0; i < target.nodes.length; i++){
			// could check for overlapping targets here.
			target.set( target.nodes[i], sig );
		}
	}

	// read de loop data, and pass it to the inner rendering function
	function loopfn(name, dselect, inner){
		return function(ctxt){
			var a = dselect(ctxt),
				n = (a && a.length) || 0,
				loopCtxt={ json:ctxt.json },
				strs = [];
			loopCtxt[name] = { items:a };

			for(var i = 0; i < n; i++){
				loopCtxt.data = ctxt.data;
				loopCtxt.pos = loopCtxt[ name ].pos = i;
				loopCtxt.item = loopCtxt[ name ].item = a[ i ];
				strs.push( inner( loopCtxt ) );
			}

			return strs.join('');

		};
	}

	// generate the template for a loop node
	function loopgen(dom, sel, loop, fns){
		var already = false;
		var p;
		for(var i in loop){
			if(loop.hasOwnProperty(i)){
				if(already){
					error('cannot have more than one loop on a target');
				}
				p = i;
				already = true;
			}
		}
		if(!p){
			error('no loop spec');
		}
		var dsel = loop[p];
		// if it's a simple data selector then we default to contents, not replacement.
		if(typeof(dsel) === 'string' || typeof(dsel) === 'function'){
			loop = {};
			loop[p] = {root: dsel};
			return loopgen(dom, sel, loop, fns);
		}
		var spec = parseloopspec(p);
		var itersel = dataselectfn(spec.sel);
		var target = gettarget(dom, sel, true);
		var nodes = target.nodes;
		for(i = 0; i < nodes.length; i++){
			var node = nodes[i];
			// could check for overlapping loop targets here by checking that
			// root is still ancestor of node.
			var inner = compiler(node, dsel);
			fns[fns.length] = wrapquote(target.quotefn, loopfn(spec.name, itersel, inner));
			target.nodes = [node];		// N.B. side effect on target.
			setsig(target, fns.length - 1);
		}
	}
	
	function getAutoNodes(n, data){
		var ns = n.getElementsByTagName('*'),
			an = [],
			openLoops = {a:[],l:{}},
			cspec,
			i, ii, j, jj, ni, cs, cj;
			ns = Array.prototype.slice.call(ns);
			ns.push(n);
		for(i = 0, ii = ns.length; i < ii; i++){
			ni = ns[i];
			if(ni.nodeType === 1 && ni.className !== ''){
				cs = ni.className.split(' ');
				for(j = 0, jj=cs.length;j<jj;j++){
					cj = cs[j];
					cspec = checkClass(cj, data);
					if(cspec !== false){
						an.push({n:ni, cspec:cspec});
					}
				}
			}
		}
		return an;
		
		function checkClass(c){
			var ca = c.match(/^(\+)?([^\@\+]+)\@?(\w+)?(\+)?$/),
				cspec = {prepend:!!ca[1], prop:ca[2], attr:ca[3], append:!!ca[4], sel:c},
				val = isArray(data) ? data[0][cspec.prop] : data[cspec.prop],
				i, ii, loopi;
			if(typeof val === 'undefined'){
				for(i = openLoops.a.length-1; i >= 0; i--){
					loopi = openLoops.a[i];
					val = loopi.l[0][cspec.prop];
					if(typeof val !== 'undefined'){
						cspec.prop = loopi.p + '.' + cspec.prop;
						if(openLoops.l[cspec.prop] === true){
							val = val[0];
						}
						break;
					}
				}
			}
			if(typeof val === 'undefined'){
				return false;
			}
			cspec.sel = (ca[1]||'') + cspec.prop + (c.indexOf('@') > -1 ? ('[' + cspec.attr + ']'):'') + (ca[4]||'');
			if(isArray(val)){
				openLoops.a.push({l:val, p:cspec.prop});
				openLoops.l[cspec.prop] = true;
				cspec.t = 'loop';
			}else{
				cspec.t = 'str';
			}
			return cspec;
		}
	}

	// returns a function that, given a context argument,
	// will render the template defined by dom and directive.
	function compiler(dom, directive, data, ans){
		var fns = [];
		ans = ans || data && getAutoNodes(dom, data);
		if(data){
			var j, jj, cspec, n, target, nodes, itersel, node, inner;
			while(ans.length > 0){
				cspec = ans[0].cspec;
				n = ans[0].n;
				ans.splice(0, 1);
				if(cspec.t === 'str'){
					target = gettarget(n, cspec, false);
					setsig(target, fns.length);
					fns[fns.length] = wrapquote(target.quotefn, dataselectfn(cspec.prop));
				}else{
					itersel = dataselectfn(cspec.sel);
					target = gettarget(n, cspec, true);
					nodes = target.nodes;
					for(j = 0, jj = nodes.length; j < jj; j++){
						node = nodes[j];
						inner = compiler(node, false, data, ans);
						fns[fns.length] = wrapquote(target.quotefn, loopfn(cspec.sel, itersel, inner));
						target.nodes = [node];
						setsig(target, fns.length - 1);
					}
				}
			}
		}

		var target, dsel;
		for(var sel in directive){
			if(directive.hasOwnProperty(sel)){
				dsel = directive[sel];
				if(typeof(dsel) === 'function' || typeof(dsel) === 'string'){
					target = gettarget(dom, sel, false);
					setsig(target, fns.length);
					fns[fns.length] = wrapquote(target.quotefn, dataselectfn(dsel));
				}else{
					loopgen(dom, sel, dsel, fns);
				}
			}
		}
		
		var h = outerHTML( dom ),
			checkStyle = new RegExp( 'style[0-9]+="?' + Sig ),
			pfns = [];

		// style attribute cannot be set using setAttribute
		if( checkStyle.test( h ) ){
			h = h.replace( checkStyle, 'style="' + Sig );
		}

		var parts = h.split( Sig ), p;
		for(var i = 1; i < parts.length; i++){
			p = parts[i];
			// part is of the form "fn-number:..." as placed there by setsig.
			pfns[i] = fns[parseInt(p, 10)];
			parts[i] = p.substring(p.indexOf(':')+1);
		}
		return concatenator(parts, pfns);
	}
	// compile the template with directive
	// if a context is passed, the autoRendering is triggered automatically
	// return a function waiting the data as argument
	function compile(directive, ctxt, template){
		var rfn = compiler( ( template || this[0] ).cloneNode(true), directive, ctxt);
		var json;
		return function(data){
			json = json || data;
			return rfn({data: data, json:json});
		};
	}
	//compile with the directive as argument
	// run the template function on the context argument
	// return an HTML string 
	// should replace the template and return this
	function render(ctxt, directive){
		for(var i = 0, ii = this.length; i < ii; i++){
			this[i] = replaceWith( this[i], plugins.compile( directive, false, this[i] )( ctxt ));
		}
		return this;
	}

	// compile the template with autoRender
	// run the template function on the context argument
	// return an HTML string 
	function autoRender(ctxt, directive){
		for(var i = 0, ii = this.length; i < ii; i++){
			this[i] = replaceWith( this[i], plugins.compile( directive, ctxt, this[i] )( ctxt ));
		}
		return this;
	}
	
	function replaceWith(elm, html){
		var div = document.createElement('DIV'),
			tagName = elm.tagName.toLowerCase(),
			ne, pa;

		if((/td|tr|th/).test(tagName)){
			var parents = {	tr:{table:'tbody'}, td:{table:{tbody:'tr'}}, th:{table:{thead:'tr'}} };
			pa = domify( parents[ tagName ] );
		}else if( ( /tbody|thead|tfoot/ ).test( tagName )){
			pa = document.createElement('table');
		}else{
			pa = document.createElement('div');
		}

		var ep = elm.parentNode;
		// avoid IE mem leak
		ep.insertBefore(pa, elm);
		ep.removeChild(elm);
		pa.innerHTML = html;
		ne = pa.firstChild;
		ep.insertBefore(ne, pa);
		ep.removeChild(pa);
		elm = ne;

		pa = ne = ep = null;
		return elm;
	}
};

$p.plugins = {};

$p.libs = {
	dojo:function(){
		if(typeof document.querySelector === 'undefined'){
			$p.plugins.find = function(n, sel){
				return dojo.query(sel, n);
			};
		}
	},
	domassistant:function(){
		if(typeof document.querySelector === 'undefined'){
			$p.plugins.find = function(n, sel){
				return $(n).cssSelect(sel);
			};
		}
		DOMAssistant.attach({ 
			publicMethods : [ 'compile', 'render', 'autoRender'],
			compile:function(directive, ctxt){ return $p(this).compile(directive, ctxt); },
			render:function(ctxt, directive){ return $( $p(this).render(ctxt, directive) )[0]; },
			autoRender:function(ctxt, directive){ return $( $p(this).autoRender(ctxt, directive) )[0]; }
		});
	},
	jquery:function(){
		if(typeof document.querySelector === 'undefined'){
			$p.plugins.find = function(n, sel){
				return $(n).find(sel);
			};
		}
		jQuery.fn.extend({
			compile:function(directive, ctxt){ return $p(this[0]).compile(directive, ctxt); },
			render:function(ctxt, directive){ return jQuery( $p( this[0] ).render( ctxt, directive ) ); },
			autoRender:function(ctxt, directive){ return jQuery( $p( this[0] ).autoRender( ctxt, directive ) ); }
		});
	},
	mootools:function(){
		if(typeof document.querySelector === 'undefined'){
			$p.plugins.find = function(n, sel){
				return $(n).getElements(sel);
			};
		}
		Element.implement({
			compile:function(directive, ctxt){ return $p(this).compile(directive, ctxt); },
			render:function(ctxt, directive){ return $p(this).render(ctxt, directive); },
			autoRender:function(ctxt, directive){ return $p(this).autoRender(ctxt, directive); }
		});
	},
	prototype:function(){
		if(typeof document.querySelector === 'undefined'){
			$p.plugins.find = function(n, sel){
				n = n === document ? n.body : n;
				return typeof n === 'string' ? $$(n) : $(n).select(sel);
			};
		}
		Element.addMethods({
			compile:function(element, directive, ctxt){ return $p(element).compile(directive, ctxt); }, 
			render:function(element, ctxt, directive){ return $p(element).render(ctxt, directive); }, 
			autoRender:function(element, ctxt, directive){ return $p(element).autoRender(ctxt, directive); }
		});
	},
	sizzle:function(){
		if(typeof document.querySelector === 'undefined'){
			$p.plugins.find = function(n, sel){
				return Sizzle(sel, n);
			};
		}
	},
	sly:function(){
		if(typeof document.querySelector === 'undefined'){  
			$p.plugins.find = function(n, sel){
				return Sly(sel, n);
			};
		}
	}
};

// get a lib config if available
(function(){
	var libkey = 
		typeof dojo         !== 'undefined' && 'dojo' || 
		typeof DOMAssistant !== 'undefined' && 'domassistant' ||
		typeof jQuery       !== 'undefined' && 'jquery' || 
		typeof MooTools     !== 'undefined' && 'mootools' ||
		typeof Prototype    !== 'undefined' && 'prototype' || 
		typeof Sizzle       !== 'undefined' && 'sizzle' ||
		typeof Sly          !== 'undefined' && 'sly';
		
	libkey && $p.libs[libkey]();
})();
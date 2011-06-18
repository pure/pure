/*!
	PURE Unobtrusive Rendering Engine for HTML

	Dual licensed under GPL Version 2 or the MIT licenses
	More information at: http://www.opensource.org

	Copyright (c) 2011 Michael Cvilic - BeeBole.com

	revision: 3.*
*/
var $p, pure = $p = function(){
	var sel = arguments[0], 
		ctxt = false;

	if(typeof sel === 'string'){
		ctxt = arguments[1] || false;
	}else if(sel && !sel[0] && !sel.length){
		sel = [sel];
	}
	return new $p.core(sel, ctxt);
};

$p.core = function(sel, ctxt, plugins){
	//default find method
	var selRx = /^(\+)?([^\@\+]+)?\@?([^\+]+)?(\+)?$/,
	// check if the argument is an array - thanks salty-horse (Ori Avtalion)
	isArray = Array.isArray ?
		function(o) {
			return Array.isArray(o);
		} :
		function(o) {
			return Object.prototype.toString.call(o) === "[object Array]";
		},
	find = function(n, sel){
		//a node set is passed
		if(typeof sel !== 'string'){
			return sel;
		}
		if(typeof n === 'string'){
			sel = n;
			n = false;
		}
		if(typeof document.querySelectorAll !== 'undefined'){
			return (n||document).querySelectorAll( sel );
		}else{
			return error('You can test PURE standalone with: iPhone, FF3.5+, Safari4+ and IE8+\n\nTo run PURE on your browser, you need a JS library/framework with a CSS selector engine');
		}
	},
	
	// error utility
	error = function(e){
		if(typeof console !== 'undefined'){
			console.log(e);
			debugger;
		}
		throw('pure error: ' + e);
	},
	
	//find all nodes for the selector
	targets = find(ctxt || document, sel),
	i = this.length = targets.length,
	transform;
	
	//fill an array of the nodes attachted to $p
	while(i--){
		this[i] = targets[i];
	}
	
	transform = function(node, data, directive){
		var selector,
		loopNode = function(node, data, directive){
			var parseLoopSpec = function(p){
					var m = p.match( /^(\w+)\s*<-\s*(\S+)?$/ );
					if(m === null){
						error('"' + p + '" must have the format loopItem<-loopArray');
					}
					if(m[1] === 'item'){
						error('"item<-..." is a reserved word for the current running iteration.\n\nPlease choose another name for your loop.');
					}
					if( !m[2] || (m[2] && (/context/i).test(m[2]))){ //undefined or space(IE) 
						m[2] = function(data){return data.context;};
					}
					return {itemName: m[1], arrayName: m[2]};
				},
				getLoopDef = function(directive){
					var loopProp,
						already = false,
						loopDef = {/*
							filter, sort, loopSpec, directive
						*/};
					for(loopString in directive){
						switch(loopString){
							case 'filter':
								loopDef.filter = directive[ loopString ];
							break;
							case 'sort':
								loopDef.sorter = directive[ loopString ];
							break;
							default:
								if( already ){
									error( 'cannot have a second loop declared for the same node:' + loopString );
								}
								loopDef.loopSpec = parseLoopSpec( loopString );
								if( loopDef.loopSpec ){
									loopDef.directive = directive[ loopString ];
								}
								already = true;
						}
					}
					return loopDef;
				},

				loopDef = getLoopDef( directive );
				
				var dfrag = document.createDocumentFragment(),
					items = readData(loopDef.loopSpec.arrayName, data),
					i = 0, ii = items.length,
					tempCtxt = {context:ctxt},
					loopCtxt = tempCtxt[loopDef.loopSpec.itemName] = {};

				tempCtxt.items = loopCtxt.items = items;

				for( ; i < ii; i++ ){
					tempCtxt.item = loopCtxt.item = items[i];
					tempCtxt.node = loopCtxt.node = node.cloneNode(true);
					tempCtxt.pos  = loopCtxt.pos  = i;
					dfrag.appendChild( transform( tempCtxt.node, tempCtxt, loopDef.directive ) );
				}

				node.parentNode.replaceChild( dfrag.cloneNode( true ), node );
			},
			getAction = function(selSpec){
				
				var isStyle, isClass, attName, attSet, get;

				if(selSpec.attr){
					isStyle = (/^style$/i).test( selSpec.attr );
					isClass = (/^class$/i).test( selSpec.attr );
					attName = isClass ? 'className' : selSpec.attr;
					attSet = function(node, s) {
						if(!s && s !== 0){
							if (attName in node && !isStyle) {
								try{
									node[attName] = ''; //needed for IE to properly remove some attributes
								}catch(e){} //FF4 gives an error sometimes -> try/catch
							} 
							//no more nodeType check since 
							node.removeAttribute(attName);
						}else{
							node.setAttribute(attName, s);
						}
					};
					if ( isStyle ) { //IE
						get = function(n){
							return n.style.cssText;
						};
					}else if ( isClass ) { //IE
						get = function( n ){
							return n.className;
						};
					}else {
						get = function(n){ 
							return n.getAttribute( selSpec.attr );
						};
					}

					if(selSpec.prepend){
						return function(node, s){ 
							attSet( node, s + ( get( node ) || '' ) ); 
						};
					}else if(selSpec.append){
						return function(node, s){ 
							attSet( node, ( get( node ) || '' ) + s ); 
						};
					}else{
						return attSet;
					}
				}else{
					if (selSpec.prepend) {
						return function(node, s) { node.insertBefore( document.createTextNode(s), node.firstChild );	};
					} else if (selSpec.append) {
						return function(node, s) { node.appendChild( document.createTextNode(s) );};
					} else {
						return function(node, s) {
							while (node.firstChild) { node.removeChild(node.firstChild); }
							node.appendChild( document.createTextNode(s) );
						};
					}
				}
			},
			readData = function(path, data){
				var m = path.split('.'),
					v = data[m[0]],
					i = 0;
				if(v && v.item){
					i += 1;
					if(m[i] === 'pos'){
						//allow pos to be kept by string. Tx to Adam Freidin
						return v.pos;
					}else{
						data = v.item;
					}
				}
				var n = m.length;
				for(; i < n; i++){
					if(!data){break;}
					data = data[m[i]];
				}
				return (!data && data !== 0) ? '':data;
			},
			forEachSel = function(sel, directive, fn){
				var sels = sel.split(/\s*,\s*/), //allow selector separation by quotes
					m,
					selSpec,
					i = sels.length;
				while(i--){
					m = sels[i].match(selRx);
					if( !m ){
						error( 'bad selector syntax: ' + sel );
					}

					selSpec = {
						prepend: m[1],
						selector: m[2],
						attr: m[3],
						append: m[4]
					};
				
					fn(directive, node, selSpec);
				}
			},
			stringValue = function(path, data){
				return ( '' + readData(path, data) ) || path;
			};
		for( selector in directive ){
			forEachSel( 
				selector,
				directive[ selector ],
				function( directive, root, selSpec ){
				
					var nodes = selSpec.selector && selSpec.selector !== '.' ? find( root, selSpec.selector ) : [ root ],
						i = nodes.length,
						node;
				
					if(i === 0){
						error( 'The selector "' + selSpec.selector + '" was not found in the template:\n' + root );
					}
					
					while(i--){
						node = nodes[ i ];
						if(typeof directive === 'object'){
							loopNode( node, data, directive );
						}else{
							getAction( selSpec )( 
								node, typeof directive === 'string' ?
									//if no value found, it's just a string
									( '' + readData( directive, data ) ) || directive:
									directive.call( data.item || data, {context:data} )
							);
						}
					}
				}
			);
		}
		return node;
	};
	// clone the node by default
	var clone = function(node){ 
		return node.cloneNode(true);
	};
	this.noClone = function(){
		//but if requested work directly on the template node
		clone = function(node){ 
			return node;
		};
		return this;
	};
	this.render = function(data, directive){
		if(typeof directive !== 'object'){
			return this.error('No more functions in version 3, only DOM');
		}
		var i = this.length;
		while(i--){
			this[i] = transform( clone( this[i] ), data, directive);
		}
		return this;
	};
	return this;
};
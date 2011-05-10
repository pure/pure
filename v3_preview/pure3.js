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
	
	//read a JSON from a path like prop1.prop2
	dataReader = function(path){
		// or read the data
		var m = path.split('.');
		return function(ctxt){
			var data = ctxt.context || ctxt,
				v = ctxt[m[0]],
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
		};
	},
	
	compiler = function(root, directive, data){
		var selector,
			actions = [],
			forEachSel = function(sel, change, fn){
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
					
					fn(selSpec, change, root);
				}
			},
			showNode = function(node){
				return (node.outerHTML || ( node.tagName + ':' + node.innerHTML )).replace(/\t/g,'  ');
			},
			getAction = function(makeAction, change, node){
				if(typeof change === 'function'){
					return function(ctxt){
						var fnCtxt = ctxt.context ? ctxt : {context:ctxt};
						fnCtxt.node = node;
						makeAction( node, change.call(ctxt.item || ctxt, fnCtxt));
					};
				}else if(typeof change === 'string'){
					var getData = dataReader(change);
					return function(ctxt){
						makeAction( node, getData(ctxt) || change);
					};
				}
			},
			setActions = function(selSpec, change, node){
				var makeAction,
					isStyle, isClass, attName, attSet, get;

				if(selSpec.attr){
					isStyle = (/^style$/i).test(selSpec.attr);
					isClass = (/^class$/i).test(selSpec.attr);
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
					if (isStyle || isClass) {//IE no quotes special care
						get = isStyle ? function(n){ return n.style.cssText; } : function(n){ return n.className;};
					}else {
						get = function(n){ 
							return n.getAttribute(selSpec.attr);
						};
					}

					if(selSpec.prepend){
						makeAction = function(node, s){ 
							attSet( node, s + get( node )); 
						};
					}else if(selSpec.append){
						makeAction = function(node, s){ 
							attSet( node, get( node ) + s); 
						};
					}else{
						makeAction = attSet;
					}
				}else{
					if (selSpec.prepend) {
						makeAction = function(node, s) { node.insertBefore( document.createTextNode(s), node.firstChild );	};
					} else if (selSpec.append) {
						makeAction = function(node, s) { node.appendChild( document.createTextNode(s) );};
					} else {
						makeAction = function(node, s) {
							while (node.firstChild) { node.removeChild(node.firstChild); }
							node.appendChild( document.createTextNode(s) );
						};
					}
				}
				actions.push( getAction( makeAction, change, node ) );
			},
			loopNode = function(change, node){
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
					getLoopDef = function(change){
						var loopProp,
							already = false,
							loopDef = {/*
								filter, sort, loopSpec, loopChange
							*/};
						for(loopString in change){
							switch(loopString){
								case 'filter':
									loopDef.filter = change[ loopString ];
								break;
								case 'sort':
									loopDef.sorter = change[ loopString ];
								break;
								default:
									if( already ){
										error( 'cannot have a second loop declared for the same node:' + loopString );
									}
									loopDef.loopSpec = parseLoopSpec( loopString );
									if( loopDef.loopSpec ){
										loopDef.change = change[ loopString ];
									}
									already = true;
							}
						}
						return loopDef;
					},

					loopDef = getLoopDef( change ),
					nodeToLoop = node.cloneNode(true),
					innerCompiled = compiler( nodeToLoop, loopDef.change ),
					getLoopCtxt = dataReader( loopDef.loopSpec.arrayName ),
					
					makeAction = function( ctxt, node, pa ){
						var dfrag = document.createDocumentFragment(),
							items = getLoopCtxt(ctxt),
							i = 0, ii = items.length,
							tempCtxt = {context:ctxt},
							saved = {
								item:  ctxt.item,
								items: ctxt.items,
								pos:   ctxt.pos
							},
							loopCtxt = tempCtxt[loopDef.loopSpec.itemName] = {};
							tempCtxt.items = loopCtxt.items = items;

						for( ; i < ii; i++ ){
							tempCtxt.item = loopCtxt.item = items[i];
							tempCtxt.node = loopCtxt.node = node;
							tempCtxt.pos  = loopCtxt.pos  = i;
							dfrag.appendChild( innerCompiled.call( tempCtxt.item, tempCtxt, true ) );
						}
						pa.replaceChild( dfrag.cloneNode( true ), node );
					};
				
				actions.push( function( ctxt ){
					var dfrag = document.createDocumentFragment(),
						items = getLoopCtxt(ctxt),
						i = 0, ii = items.length,
						tempCtxt = {context:ctxt},
						loopCtxt = tempCtxt[loopDef.loopSpec.itemName] = {},
						innerCompiled = compiler( nodeToLoop.cloneNode(true), loopDef.change );

					tempCtxt.items = loopCtxt.items = items;

					for( ; i < ii; i++ ){
						tempCtxt.item = loopCtxt.item = items[i];
						tempCtxt.node = loopCtxt.node = node;
						tempCtxt.pos  = loopCtxt.pos  = i;
						dfrag.appendChild( innerCompiled( tempCtxt ) );
					}

					node.parentNode.replaceChild( dfrag.cloneNode( true ), node );

				});
			};
			
		for( selector in directive ){
			forEachSel( 
				selector,
				directive[ selector ],
				function( selSpec, change, root ){
				
					var nodes = selSpec.selector && selSpec.selector !== '.' ? find( root, selSpec.selector ) : [ root ],
						i = nodes.length;
				
					if(i === 0){
						error( 'The selector "' + selSpec.selector + '" was not found in the template:\n' + showNode( root ) );
					}
					
					while(i--){
						if(typeof change === 'object'){
							loopNode( change, nodes[ i ].cloneNode(true), nodes[i]);
						}else{
							setActions( selSpec, change, nodes[ i ] );
						}
					}
				}
			);
		}
		return function( data ){
			var i = 0,
				ii = actions.length;
			for( ; i < ii; i++ ){
				actions[ i ]( data );
			}
			return root;
		};
	},
	
	//find all nodes for the selector
	targets = find(ctxt || document, sel),
	i = this.length = targets.length;
	
	//fill an array of the nodes attachted to $p
	while(i--){
		this[i] = targets[i];
	}
	
	this.compile = function(directive, dataToCompile, node){
		var rfn = compiler( this[0], directive, dataToCompile);
		return function(data){
			return rfn(data);
		};
	};
	
	this.render = function(data, directive){
		var fn = typeof directive === 'function' && directive,
			i = this.length;
		while(i--){
			this[i] = (fn || this.compile( directive, false, this[i] ))( data, false );
		}
		return this;
	};
	return this;
};
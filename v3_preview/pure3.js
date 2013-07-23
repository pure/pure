/*!
	PURE Unobtrusive Rendering Engine for HTML

	Dual licensed under GPL Version 2 or the MIT licenses
	More information at: http://www.opensource.org

	Copyright (c) 2012 Michael Cvilic - BeeBole.com

	revision: 3.*
*/
var $p = function(sel, doc){
	if(typeof sel === 'string'){
		doc = doc || false;
	}else if(sel && !sel[0] && !sel.length){
		sel = [sel];
	}
	return new $p.core(sel, doc);
};

$p.core = function(sel, doc, plugins){
	//default find method
	var selRx = /^(\+)?([^\@\+]+)?\@?([^\+]+)?(\+)?$/,
	
	// error utility
	error = function(e){
		if(typeof console !== 'undefined'){
			console.log(e);
		}
		throw('pure error: ' + e);
	},

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
	
	//find all nodes for the selector
	targets = find(doc || document, sel),
	i = this.length = targets.length,
	ctxt;
	
	//fill an array of the nodes attachted to $p
	while(i--){
		this[i] = targets[i];
	}
	this.compile = function(directive){
		var root = this[0],
			allNodes = root.getElementsByTagName('*'),
			selectedNodes = {count:0},
			nodeRefs = [],
			selector,
			actions = [],
			parseLoopSpec = function(p){
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
					*/},
					loopString;
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
			readData = function(path, data){
				var m = path.split('.'),
					v = data[m[0]],
					i,
					n;
				if(v && v.item){
					i += 1;
					if(m[i] === 'pos'){
						//allow pos to be kept by string. Tx to Adam Freidin
						return v.pos;
					}else{
						data = v.item;
					}
				}
				n = m.length;
				for(i = 0; i < n; i++){
					if(!data){break;}
					data = data[m[i]];
				}
				return (!data && data !== 0) ? '' : data;
			},
			getAction = function(node, selSpec, actionSpec){
				

				// take an index of all querySelectorAll nodes in the template
				// and note the references of selected nodes for fast reuse


				var isStyle, isClass, attName, attSet, get, set, init;

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
							node.removeAttribute( attName );
						}else{
							node.setAttribute( attName, s );
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
						init = get( node ) || '';
						set = function(s){ 
							attSet( node, s + init ); 
						};
					}else if(selSpec.append){
						init = get( node ) || '';
						set = function(s){ 
							attSet( node, init + s ); 
						};
					}else{
						set = function(s){ 
							attSet( node, s ); 
						};
					}
				}else{
					if (selSpec.prepend) {
						set = function(s) { node.insertBefore( document.createTextNode(s), node.firstChild );	};
					} else if (selSpec.append) {
						set = function(s) { node.appendChild(  document.createTextNode(s) );};
					} else {
						set = function(s) {
							while (node.firstChild) { node.removeChild(node.firstChild); }
							node.appendChild( document.createTextNode(s) );
						};
					}
				}
				return function(data){
					set( String( readData( actionSpec, data ) ) || actionSpec );
				};
			},
			forEachTarget = function(sel, directive, doFn){
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

					doFn(directive, root, selSpec);
				}
			},
			loopNode = function(node, directive){

				var loopDef = getLoopDef( directive ),
					dfrag = document.createDocumentFragment(),
					arr = [],
					templateNode = node.cloneNode(true),
					parentNode = node.parentNode,
					compiled = $p( templateNode ).compile( loopDef.directive );

				return function(data){
					
					var items = readData( loopDef.loopSpec.arrayName, data ),
						il = items.length,
						newNode,
						al = arr.length,
						tempCtxt = { context:ctxt },
						loopCtxt = tempCtxt[ loopDef.loopSpec.itemName ] = {},
						innerLoop = function(dfrag, tempCtxt, loopCtxt, item, node, pos){
							//for each entry prepare the parameters for function directives, and sub templates
							tempCtxt.item = loopCtxt.item = item;
							tempCtxt.node = loopCtxt.node = node;
							tempCtxt.pos  = loopCtxt.pos  = pos;
							
							//call the compiled template on item context, and return the resulting node
							return dfrag.appendChild( compiled( tempCtxt ).cloneNode(true) );
						},
						pos;

					tempCtxt.items = loopCtxt.items = items;
					
					if( isArray(items) ){
						for( pos = 0 ; pos < il; pos++ ){
							arr.push( innerLoop(dfrag, tempCtxt, loopCtxt, items[pos], node, pos) );
						}
					}else{
						for(pos in items){
							arr.push( innerLoop(dfrag, tempCtxt, loopCtxt, items[pos], node, pos) );
						}
					}
					
					//insert the loop elements in the fresh loop template
					parentNode.replaceChild( dfrag, node );

				};
			},
			setTarget = function( actionSpec, root, selSpec ){
				var nodes = selSpec.selector && selSpec.selector !== '.' ? find( root, selSpec.selector ) : [root],
					i = -1,
					l = nodes.length,
					action;

				if(l === 0){
					error( 'The selector "' + selSpec.selector + '" didn\'t match any node in:\n' + ( root.outerHTML || (root.tagName + root.className) ) );
				}
				while(++i < l){
					action = typeof actionSpec === 'object' ?
						loopNode( nodes[i], actionSpec ) :
						getAction(nodes[i], selSpec, actionSpec );

					actions.push( action );
					selectedNodes[ nodes[i] ] = action;
					selectedNodes.count++;
				}
			},
			setNodeRefs = function(allNodes, selectedNodes){
				var l = allNodes.length,
					nodeRefs = [],
					action,
					i;

				for(i = 0; i < l; i++){
					action = selectedNodes[ allNodes[l] ];
					if( action ){
						nodeRefs.push([l, action]);
						selectedNodes.count--;
						if( selectedNodes.count <= 0 ){
							//no need to go further, all selected nodes were referenced
							break;
						}
					}
				}

				return nodeRefs;
			};
				

		for( selector in directive ){
			forEachTarget( selector, directive[ selector ], setTarget );
		}

		nodeRefs = setNodeRefs( allNodes, selectedNodes );
		
		return function(data){
			ctxt = ctxt || data;
			var i = -1, l = actions.length;
			while( ++i < l ){
				actions[i](data);
			}
			return root;
		};

	};
	this.render = function(data, directive){
		var i = -1, l = this.length,
			compiled = typeof directive === 'function' ? directive : this.compile(directive);
		while( ++i < l ){
			this[i] = compiled(data);
		}
		return this;
	};
	return this;
};
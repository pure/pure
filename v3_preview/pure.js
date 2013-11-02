/*!
	Pure Unobtrusive Rendering Engine for HTML

	Dual licensed under GPL Version 2 or the MIT licenses
	More information at: http://www.opensource.org

	Copyright (c) 2013 Michael Cvilic - http://beebole.com

	revision: 3.0
*/
var $p = function( sel, doc ){
	if( typeof sel === 'string' ){
		doc = doc || false;
	}else if( sel && !sel[0] && !sel.length ){
		sel = [ sel ];
	}
	return new $p.core( sel, doc );
};

$p.core = function(sel, doc){
	// error utility
	var error = function(e){
		if( console !== undefined ){
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
		if( document.querySelectorAll !== undefined ){
			return (n||document).querySelectorAll( sel );
		}
		//else
		return error('querySelectorAll not supported');
		
	},
	buildTargets = function(that, sel, doc){
		//find all nodes for the selector
		var targets = find(doc || document, sel),
			i,
			l = targets.length;
		
		//fill an array of the nodes attached to $p
		for( i = 0; i < l; i++ ){
			that[i] = targets[i];
		}
		//give an array like length
		that.length = l;

		return that;
	},
	ctxt;
	
	this.compile = function(directives){
		var selector,
			root = this[0],
			allNodes = root.getElementsByTagName('*'),
			actions = [],
			setAction = function(root, directive, selSpec){
				var nodes = selSpec.selector && selSpec.selector !== '.' ? find( root, selSpec.selector ) : [root],
					i,
					l = nodes.length,
					

					readData = function(data, path){
						var p = path.split( '.' ),
							v = data[ p[0] ],
							i = 0,
							n = p.length;

						if(v && v.item){
							i += 1;
							if( p[ i ] === 'pos' ){
								//allow pos to be kept by string. Tx to Adam Freidin
								return v.pos;
							} //else
							data = v.item;
						}

						while( i < n ){
							if(!data){break;}
							data = data[ p[ i++ ] ];
						}
						
						//return an empty string if no value found
						return ( !data && data !== 0 ) ? '' : data;
					},

					getIndex = function(node, allNodes){

						var l = allNodes.length;
						while(l--){
							if( allNodes[ l ] === node ){
								break;
							}
						}
						return l;
					},
					nodeIndex,

					loop = function(nodeIndex, directive){

						var node = allNodes[ nodeIndex ],
							getLoopDef = function( directive ){

								var loopDef = {/*
										filter, sort, loopSpec, directive
									*/},
									parseLoopSpec = function(p){
										var m = p.match( /^(\w+)\s*<-\s*(\S+)?$/ );
										if(m === null){
											error('"' + p + '" must have the format row<-rows');
										}
										if(m[1] === 'item'){
											error('"item<-..." is a reserved word for the current running iteration.\n\nPlease choose another name for your loop.');
										}
										if( !m[2] || (m[2] && (/context/i).test(m[2]))){ //undefined or space(IE) 
											m[2] = function(data){return data.context;};
										}
										return {itemName: m[1], arrayName: m[2]};
									},
									ds,
									sel;

								for(sel in directive){
									
									ds = directive[ sel ];
									if( sel === 'filter'){

										loopDef.filter = ds;

									}else if( sel === 'sort'){

										loopDef.sorter = ds;

									}else{

										loopDef.loopSpec = parseLoopSpec( sel );
										if( loopDef.loopSpec ){
											loopDef.directive = ds;
										}else{
											error( sel + ' is not a valid loop property: row<-rows, filter,' );
										}

									}
								}

								return loopDef;

							},
							loopDef = getLoopDef( directive ),
							dfrag = document.createDocumentFragment(),
							arr = [],
							templateNode = node.cloneNode( true ),
							parentNode = node.parentNode,
							compiled = $p( templateNode ).compile( loopDef.directive );

						return function(data){
							
							var items = readData( data, loopDef.loopSpec.arrayName ),
								il = items.length,
								tempCtxt = { context:ctxt },
								innerLoop = function(dfrag, tempCtxt, loopCtxt, item, node, pos){
									//for each entry prepare the parameters for function directives, and sub templates
									tempCtxt.item = loopCtxt.item = item;
									tempCtxt.node = loopCtxt.node = node;
									tempCtxt.pos  = loopCtxt.pos  = pos;
									
									//call the compiled template on item context, and return the resulting node
									return dfrag.appendChild( compiled( tempCtxt ).cloneNode(true) );
								},
								loopCtxt,
								pos;

							loopCtxt = tempCtxt[ loopDef.loopSpec.itemName ] = {};
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
					
					single = function(nodeIndex, directive, sel){

						var node = allNodes[ nodeIndex ],
							isStyle, isClass, attName, attSet, get, set, init;

						if(sel.attr){
							isStyle = sel.attr.toLowerCase() === 'style';
							isClass = sel.attr.toLowerCase() === 'class';
							attName = isClass ? 'className' : sel.attr;
							attSet = function(node, s) {
								if(!s && s !== 0){
									if (attName in node && !isStyle) {
										try{
											node[attName] = ''; //needed for IE to properly remove some attributes
										}catch(e){ error(e); } //FF4 gives an error sometimes -> try/catch
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
									return n.getAttribute( sel.attr );
								};
							}

							if(sel.prepend){
								init = get( node ) || '';
								set = function(s){ 
									attSet( node, s + init ); 
								};
							}else if(sel.append){
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
							if (sel.prepend) {
								set = function(s) { node.insertBefore( document.createTextNode(s), node.firstChild );	};
							} else if (sel.append) {
								set = function(s) { node.appendChild(  document.createTextNode(s) );};
							} else {
								set = function(s) {
									while (node.firstChild) { node.removeChild(node.firstChild); }
									node.appendChild( document.createTextNode(s) );
								};
							}
						}
						return function(data, nodeIndex){
							set( String( readData( data, directive ) ) || directive );
						};
					};

				if(l === 0){
					error( 'Selector "' + sel.selector + '" do not match any node in the template' );
				}

				for(i = 0; i < l; i++ ){
					nodeIndex = getIndex( nodes[i], allNodes );
					actions.push( 
						( typeof directive === 'object' ? loop : single )( nodeIndex, directive, selSpec )
					);
				}

			},

			forEachSelected = function(root, sel, directive, setAction){
				var sels = sel.split( /\s*,\s*/ ), //allow selector separation by quotes
					selRx = /^(\+)?([^\@\+]+)?\@?([^\+]+)?(\+)?$/, //valid selector check
					s,
					selSpec,
					i = sels.length;
				
				while( i-- ){
				
					s = sels[ i ].match( selRx );
					if( !s ){
						error( 'bad selector syntax: ' + sel );
					}

					selSpec = {
						prepend: s[1],
						selector: s[2],
						attr: s[3],
						append: s[4]
					};

					setAction(root, directive, selSpec);
			
				}

			};

		for( selector in directives ){
			forEachSelected( root, selector, directives[ selector ], setAction );
		}

		return function( data ){
			ctxt = ctxt || data;
			var i,
				l = actions.length;

			for( i = 0; i < l; i++ ){
				actions[nodeIndex](data, nodeIndex);				
			}

			return root;

		};
	};

	this.render = function(data, directive){
		var i = -1, l = this.length,
			compiled = typeof directive === 'function' ? directive : this.compile( directive );
		while( ++i < l ){
			this[ i ] = compiled( data );
		}
		return this;
	};

	return buildTargets( this, sel, doc );
};
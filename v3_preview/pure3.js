/*!
	PURE Unobtrusive Rendering Engine for HTML

	Licensed under the MIT licenses.
	More information at: http://www.opensource.org

	Copyright (c) 2011 Michael Cvilic - BeeBole.com

	revision: 3.0
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

	function find(n, sel){
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
	}

	var targets = find(ctxt || document, sel),
		i = this.length = targets.length,
		selRx = /^(\+)?([^\@\+]+)?\@?([^\+]+)?(\+)?$/;
	while(i--){
		this[i] = targets[i];
	}

	function dataReader(path){
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
	}
	
	function action(target, sel, node){
		// execute the function directive
		
		if(typeof sel === 'function'){
			return function(ctxt){
				return sel.call(ctxt, {context:ctxt, node:node});
			};
		}else if(typeof sel === 'string'){
			var getData = dataReader(sel);
			return function(ctxt){
				target.set( node, getData(ctxt));
			};
		}
	}
	
	function compiler(root, directive, data){
		var prop,
			actions = [],
			forEachSel = function(sel, change, fn){
				var sels = sel.split(/\s*,\s*/); //allow selector separation by quotes
				i = sels.length;
				while(i--){
					fn(sels[i], change, find(root, sel));
				}
			},
			setActions = function(sel, change, nodes){
				var i = nodes.length,
					m = sel.match(selRx),
					prepend = m[1],
					selector = m[2],
					attr = m[3],
					append = m[4],
					target = {},
					
					isStyle, isClass, attName;

				if(attr){
					isStyle = (/^style$/i).test(attr);
					isClass = (/^class$/i).test(attr);
					attName = isClass ? 'className' : attr;
					target.set = function(node, s) {
						if(!s && s !== 0){
							if (attName in node && !isStyle) {
								try{node[attName] = '';}catch(e){} //FF4 gives an error sometimes
							} 
							if (node.nodeType === 1) {
								node.removeAttribute(attr);
								isClass && node.removeAttribute(attName);
							}
						}else{
							node.setAttribute(attName, s);
						}
					};
					if (isStyle || isClass) {//IE no quotes special care
						target.get = isStyle ? function(n){ return n.style.cssText; } : function(n){ return n.className;};
					}else {
						target.get = function(n){ return n.getAttribute(attr); };
					}

					if(prepend){
						target.set = function(node, s){ target.set( node, s + target.get( node )); };
					}else if(append){
						target.set = function(node, s){ target.set( node, target.get( node ) + s); };
					}
				}else{
/*					if (isloop) {
						setfn = function(node, s) {
							var pn = node.parentNode;
							if (pn) {
								//replace node with s
								pn.insertBefore(document.createTextNode(s), node.nextSibling);
								pn.removeChild(node);
							}
						};
					} else {*/
						if (prepend) {
							target.set = function(node, s) { node.insertBefore(document.createTextNode(s), node.firstChild);	};
						} else if (append) {
							target.set = function(node, s) { node.appendChild(document.createTextNode(s));};
						} else {
							target.set = function(node, s) {
								while (node.firstChild) { node.removeChild(node.firstChild); }
								node.appendChild(document.createTextNode(s));
							};
						}
/*					}*/
				}
				
				while(i--){
					actions.push( action(target, change, nodes[i]) );
				}
			};
		for(prop in directive){
			forEachSel(prop, directive[prop], function(sel, change, nodes){
				if(nodes.length === 0){
					//error bad selector
				}
				if(typeof (/function|string/).test(change)){
					setActions(sel, change, nodes);
				}else{
					
				}
			});
		}
		return function(data){
			var i = 0; ii = actions.length;
			for(;i<ii;i++){
				if(typeof actions[i] === 'function'){
					actions[i](data);
				}else{
					
				}
			}
			return root;
		};
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
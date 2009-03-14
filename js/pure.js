/* * * * * * * * * * * * * * * * * * * * * * * * * *

    PURE Unobtrusive Rendering Engine for HTML

    Licensed under the MIT licenses.
    More information at: http://www.opensource.org

    Copyright (c) 2009 Michael Cvilic - BeeBole.com

    revision: 2.00 - Plugins Architecture

* * * * * * * * * * * * * * * * * * * * * * * * * */
var $p = pure = function(_o){
	return new pureFunctions(_o);};

function pureFunctions(_o){
	//register a dataset to bind it with a view
	this.bind = function(binder){
		binder = binder || {};
		this._bindedTo = binder.name || ('t'+Math.random(1000)).replace(/0\./,'');
		this._binder = {};
		this._binder.data = binder.data || {};
		this._binder._$c = utils._$c;
		this._binder._$a = utils._$a;
		
		return this;};

	//apply directives to the HTML
	this.compile = function(options){
		this._binder.directives = options.directives;
		this._binder.data = options.data;
		this._binder.compiled = utils.compile(utils.map(this.elm, options.directives), options.data);
		return this;};

	//render function
	this.render = function(options){
		options = options || {};
		if(!this._binder.compiled){
			this.compile({data:options.data, directives:options.directives});}
			
		var html = this._binder.compiled.call(this._binder, this._binder.data);
		if(options.html === true){
			//innerHTML of the element
			this.elm.innerHTML = html;}
		else{
			//replace the element node
			this.elm = utils.replaceWithAndReturnNew( this.elm, html );}
		return this;};
	
	//take a closure reference of pureFunctions "this"
	var that = this;
	
	var utils = {
		//constants
 		CLASSNAME:/MSIE\s+(6|7)/.test(navigator.userAgent)? 'className':'class',
		NS:/MSIE/.test(navigator.userAgent) ? 'pure_':'pure:',
		PURECLASS:/MSIE/.test(navigator.userAgent) ? 'pure_class':'pure:class',
		AUTO:/MSIE/.test(navigator.userAgent) ? 'pure_autoRender':'pure:autoRender',
		REPEAT:/MSIE/.test(navigator.userAgent) ? 'pure_repeat':'pure:repeat',
		NODEVALUE:/MSIE/.test(navigator.userAgent) ? 'pure_nodeValue':'pure:nodeValue',
		DEBUG_SCRIPT:'pureTemplatesDebug',

		//function directives registry
		$f:{ cnt:0 },

		// launch a find and take the first element only
		singleFind:function(selector, context, elmArray){
			var elms = that.find(selector, context, elmArray);
			if(typeof elms[0] !== 'undefined'){
				return elms[0];}},
		
		//check if it's an array (douglas crockford)
		isTypeOfArray:function(obj){
            return typeof obj.length === 'number' && !(obj.propertyIsEnumerable('length')) && typeof obj.splice === 'function';},

		//check if this is an append(selector+) / prepend(+selector) notation
		ap_check: function(str){
			var prepend, append;
			str = (prepend = /^\+/.test(str)) ? str.slice(1) : (append = /\+$/.test(str)) ? str.slice(0, -1) : str;
			return {type:(append) ? 'a' : (prepend) ? 'p' : false, clean:str};},
		
		//prepare the append/prepend for the compilation
		ap_format: function(attValue, attName, node, ap){
			if (ap){
				if (!attName) {attName = this.NODEVALUE;}
				var fixAtt = attName == 'class' ? this.CLASSNAME : attName;
				var original = node.getAttribute(fixAtt) || (this.NODEVALUE == attName ? this.NODEVALUE : null);
				if (original){
					return original + '|' + ap + '|' + attValue;}}
				return attValue;},

		//remove the attribute (some attribute are not delete properly in IE)
		removeAtt:function(node, att){
			if (att == 'class') { att = this.CLASSNAME; }
			try{ 
				node[att] = ''; 
				node.removeAttribute(att);}catch(e){}},

		//get the HTML string from an element
		outerHTML:function(elm){
			return elm.outerHTML || (function(elm){
				var div = document.createElement('div');
				div.appendChild(elm);
				return div.innerHTML;})(elm);},

		map:function(html, directives){
			// a directive is a tuple{ dom selector, value }
			// returns the html with the directives as pure:<attr>="..."
			if(!html[0] && html.length == 0){
				this.msg('no_HTML_selected');
				return false;}

			var fnId, multipleDir=[], currentDir, clone, ap,isAttr, target, attName, repetition, parentName, selector, i, autoRender, classToDelete=[];

			//take a copy to leave the original clean
			clone = html.cloneNode(true);
			
			//autorender abuse the class attribute to map automatically the data
			autoRender = clone.getAttribute(this.AUTO)||false;

			for (selector in directives){ 
				if(directives.hasOwnProperty(selector)){
					currentDir = directives[selector];
					
					//check if an array of directives is provided
					if(this.isTypeOfArray(currentDir)){
						multipleDir = currentDir;}
					else{
						multipleDir = []; 
						multipleDir.push(currentDir);}
					
					// for each directive set the corresponding pure:<attr>
					for(i = 0; i<multipleDir.length;i++){
						currentDir = multipleDir[i];
						ap = this.ap_check(selector);
						selector = ap.clean;
						
						// match a [...] meaning an attribute in PURE
						isAttr = selector.match(/\[[^\]]*\]/);
						
						target = (/^\[|^\.$/.test(selector)) ? 
							//attribute of the root node or itself . (dot)
							clone :
							isAttr ? 
								//if an attribute, select its element
								this.singleFind(selector.substr(0, isAttr.index), clone):
								//select the element
								this.singleFind(selector, clone);

						if ( target ){
							//target found
							if (typeof currentDir == 'function'){
								//the directive is a function store its reference
								fnId = 'f'+this.$f.cnt++;
								this.$f[fnId] = currentDir;
								currentDir = '$f['+fnId+']';}

							//defaults
							attName = 'nodeValue';
							repetition = -1;
							if (isAttr){
								//the directive points to an attribute
								attName = selector.substring(isAttr.index+1,isAttr[0].length+isAttr.index-1);}
							else{
								//check if the directive is a repetition
								repetition = currentDir.search(/w*<-w*/);
								if(repetition > -1) {attName = 'repeat';}}

							//escape any quotes by \'
							currentDir = currentDir.replace(/^"|"$|\'|\\\'/g, '\\\'');
							
							//check for an append: dir+ or prepend: +dir
							currentDir = this.ap_format(currentDir, attName, target, ap.type);
							
							//set the PURE attribute in the HTML
							target.setAttribute( this.NS + attName, currentDir);

							if(isAttr){
								//if an attribute, remove the original, the pure:attName will replace it at the compilation
								if (attName !== 'class'){ 
									this.removeAtt(target, attName);}
								else if (autoRender !== 'true'){
										//if not autoRender, leave the class to allow the .selector to work until the end of the mapping
								  		classToDelete.push(target);}}}

						else{
							// target not found, log an error
							parentName = [clone.nodeName];
							if(clone.id !== '') {parentName.push('#' + clone.id);}
							if(clone.className !== '') {parentName.push('#' + clone.className);}
							this.msg( 'element_to_map_not_found', [selector, parentName.join('')], clone);}}}}

			//remove class attribute only at the end to allow .selector to work regardless of the order of directives
			if (classToDelete.length>0){ 
				for (i=0;i<classToDelete.length;i++){
					this.removeAtt(classToDelete[i], 'class');}}
			return clone;},


		domCleaningRules:[
			//put all absolute links( img.src ) of window.location relative to the root
			{what:window ? new RegExp(window.location.toString().substring(0, window.location.toString().indexOf(window.location.pathname)), 'g'):'', by:''},
			//remove multiple spaces between >..< (IE 6) 
			{what:/\>\s+</g, by:'> <'},
			//may be too strong check with pre, textarea,...
			{what:/\r|\n/g, by:''},
			//escape apostrophe
			{what:/\\\'|\'/g, by:'\\\''},
			//IE does not remove some attr, ticket #20
			{what:/\s+[^\=]+\=\"\"(?=[^\>]|\>)/ig, by:''},
			//clean leading white spaces in the html
			{what:/^\s+/, by:''}],

		autoMap: function(n, autoRender, context, openArray){
			var toMap, k, j, att, repeatPrefix, prop, attValue, ap;
			if (autoRender === 'true') {
				attValue = n.getAttribute(this.CLASSNAME);
				if (attValue) {
					toMap = attValue.replace(/^\d|\s\d/g,'').split(/\s+/);//remove numeric classes as they mess up the array reference
					for (j = 0; j < toMap.length; j++) {
						repeatPrefix = '';
						ap = this.ap_check(toMap[j]);
						att = ap.clean.split(/@/);
						if(openArray.length > 0) {
							for (k = openArray.length-1; k>=0; k--) {
								prop = openArray[k] == 'context' ? context[0][att[0]] : this._$c(context[openArray[k]][0], att[0], true);
								if (prop || prop == 0) {//found a repetition field, break, specific case when 0 is returned as a value
									repeatPrefix = openArray[k];
									break;}}}

						if(!prop && prop != 0){
							prop = att[0] != 'context' ? this._$c(context, att[0], true) : !(/context/).test(openArray.join('')) ? context: true;}
							
						if (prop || prop==0) {
							if (typeof prop.length === 'number' && !(prop.propertyIsEnumerable('length')) && typeof prop.splice === 'function') { //Douglas Crockford check if array
								openArray.push(att[0]);
								n.setAttribute(this.REPEAT, att[0] + '<-' + att[0]);}
							else {
								if(repeatPrefix !== ''){
									att[0] = repeatPrefix + '[\'' + att[0] + '\']';}
								if(!att[1]){ //not an attribute
									att.push('nodeValue');}
								if(ap.type){ //append or prepend ?
									att[0] = this.ap_format(att[0], att[1], n, ap.type);}
								if (att[1]!='nodeValue'){ // remove the existing attribute if any
									this.removeAtt(n, att[1]);}
								if (!n.getAttribute(this.NS + att[1])) { //don't overwrite a directive if any
									n.setAttribute(this.NS + att[1], att[0]);}}}}
					if (n.getAttribute(this.PURECLASS) && n.getAttribute(this.CLASSNAME)){
						n.removeAttribute(this.CLASSNAME);}}}

			//flag the nodeValue and repeat attributes
			var isNodeValue = n.getAttribute(this.NODEVALUE);
			if (isNodeValue) {this.nodeValues.push(n);}
			var isRepeat = n.getAttribute(this.REPEAT);
			if (isRepeat) {this.repeats.push(n);}},


		nodeWalk:function(node, context){
			this.repeats = []; this.nodeValues = [];
			var autoRender = typeof context !== 'undefined' ? 'true' : node.getAttribute(this.AUTO);
			node.removeAttribute(this.AUTO);
			var openArray=[];
			//memory safe non-recursive tree traverse
			var c = node, n = null;
			do {
				if (c.nodeType == 1) {
					this.autoMap(c, autoRender, context, openArray);}
				n = c.firstChild;
				if (n === null) {
					n = c.nextSibling;}
				var tmp = c;
				if (n === null) {
					tmp = c;
					do {
						n = tmp.parentNode ? tmp.parentNode:node;
						if (n == node) {break;}
						tmp = n;
						n = n.nextSibling;}
					while (n === null);}
				c = n;}
			while (c != node);
			//post process the repeat and nodeValue for easier compiling
			var replaced, replacer, replacedSrc, nodeValueSrc, str = false;
			for (var j = this.nodeValues.length-1; j >= 0; j--) {
				try {
					n = this.nodeValues[j];
					nodeValueSrc = n.getAttribute(this.NODEVALUE); // put the node value in place
					if (nodeValueSrc) {
						var ap = nodeValueSrc.match(/\|(a|p)\|/);
						if (ap) {
							if (ap[1] == 'a'){
								n.innerHTML += this.NODEVALUE + '="' + nodeValueSrc.substring(ap.index+3) + '"';}
							else{
								n.innerHTML = this.NODEVALUE + '="' + nodeValueSrc.substring(ap.index+3) + '"' + n.innerHTML;}}
						else{
							n.innerHTML = this.NODEVALUE + '="' + nodeValueSrc + '"';}
						
						n.removeAttribute(this.NODEVALUE);}} 
				catch (e) {}}
			for(var i=this.repeats.length-1; i>=0;i--){
				n = this.repeats[i];//go inside out of the tree
				try {
					replacedSrc = n.getAttribute(this.REPEAT); //wrap in tags for easy string find
					if (replacedSrc) {
						replaced = n.cloneNode(true);
						replaced.removeAttribute(this.REPEAT);
						replacer = document.createElement(this.REPEAT);
						replacer.appendChild(replaced);
						replacer.setAttribute('source', "" + replacedSrc);
						if(node == n){
							str = this.outerHTML(replacer);}
						else{
							n.parentNode.replaceChild(replacer, n);}}}
				catch (e2) {}}
				return (str) ? str : false;},

		html2str:function(html, context){
			var clone = html[0] && !html.nodeType ? html[0].cloneNode(true) : html.cloneNode(true);
			//node manipulation before conversion to string
			var str = this.nodeWalk(clone, context);
			//convert the HTML to a string
			if(!str) {str = this.outerHTML( clone );}
			//avoid shifting lines remove the > and </ around pure:repeat tags
			str = str.replace(new RegExp('<\/?:?'+this.REPEAT, 'gi'), this.REPEAT);// :? -> from bug in IE
			//clean the dom string, based on rules in $p.domCleaningRules
			var rules = this.domCleaningRules;
			for(var i=0;i<rules.length;i++){
				str = str.replace(rules[i].what||'' ,rules[i].by);}
			return str.split(this.NS);},

		strOut:function (content){ 
			return ['output.push(', "'", content, "');"].join('');},

		arrayName:function(pName){
			var name=pName.match(/\w*/)[0] || ''; 
			// take the tail and replace [ ] by ''
			var subIndex= pName.substring(name.length).replace(/\[\s*\]/,'');
			if(/\./.test(subIndex)){
				subIndex = subIndex.replace(/^\./, '[\'').replace(/\./g,'\'][\'') + '\']';}
			return name + '[' + name + 'Index]' + subIndex.replace(/\\\'/g,"'");},

		//check if it is an array reference either [] or an open loop
		isArray:function (attValue, openArrays){ 
			var arrIndex = /\[[^\]]*\]/.test(attValue);
			var objProp  = attValue.replace(/(")|(')/g,'').split(/\./);
			return arrIndex || openArrays[objProp[0]] ? true: false;},

		contextOut:function(path){ 
			return 'this._$c(context, ' + path + ')';},

		out:function(content){ 
			return ['output.push(', content, ');'].join('');},
		
		
		outputFn:function (attValue, currentLoop){
			if (currentLoop){
				return attValue + '({context:context, items:' + currentLoop + ',pos:'+currentLoop+'Index==\'0\'?0:parseInt(' + currentLoop + 'Index)||'+currentLoop+'Index, item:' + currentLoop + '['+currentLoop+'Index==\'0\'?0:parseInt(' + currentLoop + 'Index)||'+currentLoop+'Index]})';}
			else{
				return attValue + '({context:context})';}},
			
/*			return !currentLoop ? attValue + '({context:context})' :
				[attValue, '({context:context, items:', currentLoop, ',pos:', currentLoop, 'Index==\'0\'?0:parseInt(', currentLoop, 'Index)||', currentLoop, 
				'Index, item:', currentLoop, '[', currentLoop, 'Index==\'0\'?0:parseInt(', currentLoop, 'Index)||', currentLoop, 'Index]})'].join();},*/
		
		compile: function(html, context){
			var aStr = this.html2str(html, context),
				fname = that._bindedTo,
				js, wrkStr, rTag = false, rSrc, openArrays=[], cnt=1, subSrc='', fnId, attOut, spc, suffix, currentLoop, 
				isNodeValue, max, curr, key, offset, attName = '', attValue = '', attValues=[], arrSrc, fullAtt,
				aJS = ['{var output = [];'];

			if(aStr[0]!=="") {aJS.push(this.strOut(aStr[0]));}
			for(var j = 1;j < aStr.length; j++){
				wrkStr = aStr[j] || aStr[++j];
				if (/^repeat[^\>]*\>/i.test(wrkStr)){
					rTag = wrkStr.match(/^repeat[^\>]*>/i);
					rSrc = rTag[0].match(/"[^"]*"/);
					if (rSrc){ //start a loop
						rSrc = rSrc[0].replace(/&lt;/,'<').replace(/"/g,'').replace(/\s/g,'');
						subSrc = rSrc.split(/<-/);
						currentLoop = subSrc[0];
						arrSrc = subSrc[1] || '';
						if ( this.isArray(arrSrc, openArrays) ){
							//reference to an open array
							aJS.push('var ' + currentLoop + '=' + this.arrayName(arrSrc) + ';');}
						else{
							if (/context/i.test(arrSrc) || arrSrc.length == 0) {
								if (!(/context/i).test(currentLoop)){ // avoid var context = context 
									aJS.push('var ' + currentLoop + '= context;');}}
							else{ 
								aJS.push('var ' + currentLoop + '= this._$c(context, "' + arrSrc + '");');}}
						aJS.push('for(var '+currentLoop+'Index in '+currentLoop+'){if ('+currentLoop+'.hasOwnProperty('+currentLoop+'Index)){'); 		
						aJS.push(this.strOut(wrkStr.substring(rTag[0].length)));
						openArrays[currentLoop] = cnt++;}
	
					else{ //end of loop;
						aJS.push('}}');
						delete openArrays[currentLoop];
						max = 0;
						for (key in openArrays){
							if(openArrays.hasOwnProperty(key)){
							curr = openArrays[key];
							if( curr > max){
							max = curr;
							currentLoop = key;}}}
						aJS.push(this.strOut(wrkStr.substring(rTag[0].length, wrkStr.length)));}

					rTag = false;
					continue;}
				else{
					attName = wrkStr.substring(0, wrkStr.indexOf('='));
					attValue = wrkStr.match(/\=""?[^"]*""?/)[0].substr(2).replace(/"$/,'');
					offset = attName.length + attValue.length + 3;
					if (/&quot;/.test(attValue)) {
						attValue = attValue.replace(/&quot;/g, '"');
						wrkStr = wrkStr.replace(/&quot;/, '"').replace(/&quot;/, '"');}

					isNodeValue = /^nodeValue/i.test(wrkStr);	
					fullAtt = isNodeValue ? []: ['\''+attName+'="\''];

					attOut = attValue.match(/\|(a|p)\|/);
					suffix = ''; 
					spc = attName !== 'class'  ? '':' '; //at some point we should use 'tag[class]+':' #{prop}' instead and deprecate the auto space for class
					if (attOut) {
						if(attOut[1] =='a'){
							fullAtt.push('\''+attValue.substring(0, attOut.index)+spc+'\'');}
						else{ // |p|
							suffix = attValue.substring(0, attOut.index);}
						attValue = attValue.substring(attOut.index + 3);}

					if(/\$f\[(f[0-9]+)\]/.test(attValue)){ //function reference
						fnId = attValue.match(/\[(f[0-9]+)/)[1];
						that._binder['$'+fnId]=this.$f[fnId];
						delete this.$f[fnId];this.$f.cnt--;
						fullAtt.push(this.outputFn('this.$'+fnId, currentLoop));
						if(suffix !== '') {fullAtt.push('\''+spc+suffix+'\'');}}
					else if(/^\\\'|&quot;/.test(attValue)){ //a string, strip the quotes
						fullAtt.push('\''+ attValue.replace(/^\\\'|\\\'$/g,'')+'\'');
						if(suffix !== '') {fullAtt.push('\''+spc+suffix+'\'');}}
					else{
						if (!(/MSIE/).test(navigator.userAgent)) {
							attValues = attValue.split(/(#\{[^\}]*\})/g);}
						else { //IE:(
							var ie = attValue.match(/#\{[^\}]*\}/);
							attValues = ie ? [] : [attValue];
							while (ie) {
								if (ie.index > 0) {attValues.push(attValue.substring(0, ie.index));}
								attValues.push(ie[0]);
								attValue = attValue.substring(ie.lastIndex);
								ie = attValue.match(/#\{[^\}]*\}/);
								if (!ie && attValue !== '') {attValues.push(attValue);}}}

						for(var atts = 0; atts<attValues.length; atts++){
							attValue = attValues[atts];
							if(/\#\{/.test(attValue) || attValues.length == 1){
								attValue = attValue.replace(/^\#\{/, '').replace(/\}$/,'');
								if(this.isArray(attValue, openArrays)){ //iteration reference
									fullAtt.push(this.arrayName(attValue));}
								else{ //context data
									fullAtt.push(this.contextOut("'"+attValue+"'"));}}
							else if(attValue !== ''){
								fullAtt.push('\''+attValue+'\'');}

							if(suffix !== ''){ fullAtt.push('\''+spc+suffix+'\'');}}}

					if (!isNodeValue) { //close the attribute string
						fullAtt.push('\'"\'');}}
					aJS.push(this.out(fullAtt.length > 1 ? 'this._$a(['+fullAtt.join(',')+'])':fullAtt[0]));
		
				//output the remaining if any	
				wrkStr = wrkStr.substr(offset);
				if(wrkStr !== '') {
					aJS.push(this.strOut(wrkStr));}}
			aJS.push( 'return output.join("");}' );
			js = aJS.join('');
			try{
				return new Function('context', js);} 
			catch (e){
				this.msg('parsing_error', [e.message, js]);
				return false;}},

		//replace a node by an HTML string
		replaceWithAndReturnNew:function(elm, html){
			var div = document.createElement('div'),
				replaced = elm,
				parent = replaced.parentNode;
			parent.insertBefore(div, replaced);//avoid IE mem leak, place it before filling
			div.innerHTML = html;
			var replacers = div.childNodes,
				newThis = [];
			for (var i = replacers.length - 1; i >= 0; i--) {
				newThis.push(replaced.parentNode.insertBefore(replacers[i], replaced.nextSibling));}
			parent.removeChild(replaced);
			parent.removeChild(div);
			return newThis.length > 1 ? newThis:newThis[0];},

			//context reader
			_$c : function(context, path, nullMode){
				if(path == 'context'){return context;}
				if(typeof context == 'object'){
					//context is a JSON
					var aPath = path.split(/\./);
					var value = context[aPath[0]];
					for (var i=1; i<aPath.length; i++){
						if (!value){ break;}
						value = value[aPath[i]];}}
					if (!value && value!=0) {value = nullMode ? null :'';}
				return value;},

			//remove the attribute if empty
			_$a : function(content){
				var att = content.join('');
				return (/\=\"\"/.test(att)) ? '' : att;},


		//put the compiled template in a script tag to debug it at render time
		debug:function(src){
			var fn = typeof that._binder.compiled === 'function' ? 
				that._binder.compiled.toString().replace(/anonymous/i, that._bindedTo).replace(/\{/, '{debugger;'):
				'function '+that._bindedTo + '(context)' + src;
			
			var s = document.getElementById(this.DEBUG_SCRIPT);
			if(s){
				src = s.src + fn;
				s.parentNode.removeChild(s);}
			s = document.createElement("script");
			s.id = this.DEBUG_SCRIPT;
			s.charset = "UTF-8";
			s.innerHTML = fn;
			document.body.appendChild(s);},

		//output messages
		messages:{
			'wrong_html_source':'The source HTML provided to autoRender does not exist. Check your selector syntax.',
			'element_to_map_not_found':"PURE - Cannot find the element \"&\" in \"&\"",
			'place_runtime_container':'To collect the PURE runtime, place a <textarea id=\"pureMsg\"></textarea> somewhere in your document.',
			'no_HTML_selected':'The map function didn\'t receive a valid HTML element',
			'no_HTML_name_set_for_parsing':'A name is needed when parsing the HTML: &',
			'HTML_does_not_exist':'The HTML: & does not exist or is not yet compiled',
			'library_needed':'In order to run PURE, you need a JS library such as: dojo, domAssistant, jQuery, mootools, prototype,...',
			'parsing_error':'Parsing error: \"&\" in: &'},

		msg:function(msgId, msgParams, where){
			// find the msg in local labels repository or in this.messages
			var msg = this.messages[msgId] || msgId;
			var re = /&/, i;
			if(msg != msgId && msgParams){
				if (typeof msgParams == 'string'){
					msg = msg.replace(re, msgParams);}
				else{
					for(i=0; i<msgParams.length;i++ ){
						msg = msg.replace(re, msgParams[i]);}}}

			var elm = document.getElementById('pureMsg');
			if(elm){
				elm.innerHTML = [msg, '\n', elm.innerHTML].join('');}
				else{ alert(msg);}}};

		//if a selector is provided initially, find the elements
		if(typeof _o.selector !== 'undefined'){
			this.elm = utils.singleFind(_o.selector, _o.context, _o.elmArray);}
		
		//build a default binder per template if not provided
		this.bind();};

pureFunctions.prototype.find = function(selector, context, elmArray){
	return Sizzle(selector, context, elmArray);};
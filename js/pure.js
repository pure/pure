/* * * * * * * * * * * * * * * * * * * * * * * * * *

    PURE Unobtrusive Rendering Engine for HTML

    Licensed under the MIT licenses.
    More information at: http://www.opensource.org

    Copyright (c) 2009 Michael Cvilic - BeeBole.com

    revision: 1.34

* * * * * * * * * * * * * * * * * * * * * * * * * */
var $p, pure;
$p = pure = {
	find: function(selector, context){
		try{
			return (context||document).querySelector( selector );}
		catch(e){
			this.msg('library_needed');};},
				
	getRuntime: function(){
		//build the runtime to be exported as a JS file
		var src = ['var $p, pure;$p = pure = {', '$outAtt:', this.$outAtt.toString(), ',', '$c:', this.$c.toString(), ',', 'render:', this.render.toString(), ',', 'compiledFunctions:[], msg:'+this.msg.toString()+'};'];
		for (var fName in this.compiledFunctions){
			if(this.compiledFunctions.hasOwnProperty(fName)){
			var htmlFunction = '$p.compiledFunctions[\'' + fName + '\']';
			src.push(htmlFunction+'={};'+htmlFunction+'.compiled=');
			src.push(this.compiledFunctions[fName].compiled.toString()+';');
			for (var fi in this.compiledFunctions[fName]){
				if(fi != 'compiled'){
					src.push('$p.compiledFunctions[\''+fName+'\'].'+fi+'='+this.compiledFunctions[fName][fi].toString()+';');}}}}
	var elm = document.getElementById('pureMsg');
	if (elm) {
		elm.value = src.join('');
		elm.select();}
	else{
		this.msg('place_runtime_container');}},

	$f:{cnt:0},

	$c:function(context, path, nullMode){
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

	render: function(/*html, context, directives || context, compiledName, directives*/){
		var fn, html, context, directives = arguments[2];
		if (typeof arguments[1] === 'string'){//a compiled HTML is passed
			html = arguments[1];
			context = arguments[0];}
		else{
			html = arguments[0];
			context = arguments[1];}
		if (typeof html != 'string'){
			var mapped = directives ? this.map(directives, html):html.cloneNode(true);
			fn = this.compiledFunctions.length || 0;
			this.compile(mapped, fn, context, false);}
		else{ // call to an already compiled f()
			fn = html;}
		if (this.compiledFunctions[fn]){
			return this.compiledFunctions[fn].compiled(context);} //transform and return an html string
		else{
			this.msg('HTML_does_not_exist', fn);}},

	autoRender:function(html, context, directives){
		if (typeof html != 'string') {
			if (!html) { this.msg('wrong_html_source'); return false;}
			html.setAttribute(this.utils.AUTO, 'true');}
		return this.render(html, context, directives);},

	compiledFunctions:{},

	$outAtt:function(content){
			(/\"/).test(content[1]) && (content[1] = content[1].replace(/\\\"|\"/g, '&quot;'));
			var att = content.join('');
			return (/\=\"\"/.test(att)) ? '' : att;},
 	utils:{
 		CLASSNAME:/MSIE\s+(6|7)/.test(navigator.userAgent)? 'className':'class',
		NS:/MSIE/.test(navigator.userAgent) ? 'pure_':'pure:',
		PURECLASS:/MSIE/.test(navigator.userAgent) ? 'pure_class':'pure:class',
		AUTO:/MSIE/.test(navigator.userAgent) ? 'pure_autoRender':'pure:autoRender',
		REPEAT:/MSIE/.test(navigator.userAgent) ? 'pure_repeat':'pure:repeat',
		NODEVALUE:/MSIE/.test(navigator.userAgent) ? 'pure_nodeValue':'pure:nodeValue',
		nodeValues:[],
		repeats:[],
		autoRenderAtts:[],
		isTypeOfArray:function(obj){
            return typeof obj.length === 'number' && !(obj.propertyIsEnumerable('length')) && typeof obj.splice === 'function';},
		autoMap: function(n, autoRender, context, openArray){
			var toMap, k, j, att, repeatPrefix, prop, attValue, ap;
			if (autoRender == 'true') {
				attValue = n.getAttribute(this.CLASSNAME);
				if (attValue) {
					toMap = attValue.replace(/^\d|\s\d/g,'').split(/\s+/);//remove numeric classes as they mess up the array reference
					for (j = 0; j < toMap.length; j++) {
						repeatPrefix = '';
						ap = this.ap_check(toMap[j]);
						att = ap.clean.split(/@/);
						if(openArray.length > 0) {
							for (k = openArray.length-1; k>=0; k--) {
								prop = openArray[k] == 'context' ? $p.$c(context[0], att[0], true) : $p.$c(context[openArray[k]][0], att[0], true);
								if ((prop || prop == 0) && att[0] !== 'context') {//found a repetition field, break, specific case when 0 is returned as a value
									repeatPrefix = openArray[k];
									break;}}}

						if(!prop && prop != 0){
							prop = att[0] != 'context' ? $p.$c(context, att[0], true) : !(/context/).test(openArray.join('')) ? context: true;}
							
						if (prop || prop==0) {
							if (typeof prop.length === 'number' && !(prop.propertyIsEnumerable('length')) && typeof prop.splice === 'function') { //Douglas Crockford check if array
								openArray.push(att[0]);
								n.setAttribute(this.REPEAT, att[0] + '<-' + att[0]);}
							else {
								if(repeatPrefix !== ''){
									att[0] = repeatPrefix + '[\'' + att[0].replace(/\./g, '\'][\'') + '\']';}
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
			var auto = this.AUTO;
			this.repeats = []; this.nodeValues = [];
			var autoRender = node.getAttribute(auto);
			node.removeAttribute(auto);
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
				
		ap_format: function(attValue, attName, node, ap){
			if (ap){
				if (!attName) {attName = 'nodeValue';}
				var fixAtt = attName == 'class' ? this.CLASSNAME : attName;
				var original = node.getAttribute(fixAtt) || ('nodeValue' == attName ? 'nodeValue' : null);
				if (original){
					return original + '|' + ap + '|' + attValue;}}
				return attValue;},
							
		ap_check: function(str){
			var prepend, append;
			str = (prepend = /^\+/.test(str)) ? str.slice(1) : (append = /\+$/.test(str)) ? str.slice(0, -1) : str;
			return {type:(append) ? 'a' : (prepend) ? 'p' : false, clean:str};},

		removeAtt:function(node, att){
			if (att == 'class') {att = this.CLASSNAME;}
			try{ 
				node[att] = ''; 
				node.removeAttribute(att);
			}catch(e){}},

		out:function(content){ return ['output.push(', content, ');'].join('');},
		strOut:function (content){ return ['output.push(', "'", content, "');"].join('');},
		outputFn:function (attValue, currentLoop){
			if (currentLoop){
				return attValue + '({context:context, items:' + currentLoop + ',pos:'+currentLoop+'Index==\'0\'?0:parseInt(' + currentLoop + 'Index)||'+currentLoop+'Index, item:' + currentLoop + '['+currentLoop+'Index==\'0\'?0:parseInt(' + currentLoop + 'Index)||'+currentLoop+'Index]})';}
			else{
				return attValue + '({context:context})';}},
		contextOut:function(path){ return '$p.$c(context, ' + path + ')';},

		isArray:function (attValue, openArrays){ //check if it is an array reference either [] or an open loop
			var arrIndex = /\[[^\]]*\]/.test(attValue);
			var objProp  = attValue.replace(/(")|(')/g,'').split(/\./);
			return arrIndex || openArrays[objProp[0]] ? true: false;},

		arrayName:function(pName){
			var name=pName.match(/\w*/)[0] || ''; 
			var subIndex= pName.substring(name.length).replace(/\[\s*\]/,''); // take the tail and replace [ ] by ''
			if(/\./.test(subIndex)){
				subIndex = subIndex.replace(/^\./, '[\'').replace(/\./g,'\'][\'') + '\']';}
			return name + '[' + name + 'Index]' + subIndex.replace(/\\\'/g,"'");},
		domCleaningRules:[
			{what:window ? new RegExp(window.location.toString().substring(0, window.location.toString().indexOf(window.location.pathname)), 'g'):'', by:''},//put all absolute links( img.src ) of window.location relative to the root
			{what:/\>\s+</g, by:'> <'}, //remove multiple spaces between >..< (IE 6) 
			{what:/\r|\n/g, by:''},//may be too strong check with pre, textarea,...
			{what:/\\\'|\'/g, by:'\\\''}, //escape apostrophe
			{what:/\s+[^\s]+\=\"\"(?=[^\>]|\>)/ig, by:''}, //IE does not remove some attr, ticket #20
			{what:/^\s+/, by:''}],//clean leading white spaces in the html
		outerHTML:function(elm){
			return elm.outerHTML || (function(elm){
				var div = document.createElement('div');
				div.appendChild(elm);
				return div.innerHTML;})(elm);},
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
			return str.split(this.NS);}},

	autoCompile:function(html, fName, context, noEval){
		html.setAttribute(this.utils.AUTO, 'true');
		return this.compile(html, fName, context, noEval);},

	compile: function(html, fName, context, noEval){
		var aStr = this.utils.html2str(html, context);
				
		if(!fName && typeof fName != 'number'){
			this.msg( 'no_HTML_name_set_for_parsing', aStr.join(''), html);
			return false;}

		//start the js generation
		var js, wrkStr, rTag = false, rSrc, openArrays=[], cnt=1, subSrc='', fnId, attOut, spc, suffix, currentLoop, isNodeValue, max, curr, key, offset, attName = '', attValue = '', attValues=[], arrSrc, fullAtt;

		this.compiledFunctions[fName]={}; //clean the fct place if any
		var aJS = ['{var output = [];'];

		if(aStr[0]!=="") {aJS.push(this.utils.strOut(aStr[0]));}
		for(var j = 1;j < aStr.length; j++){
			wrkStr = aStr[j];
			if (/^repeat[^\>]*\>/i.test(wrkStr)){
				rTag = wrkStr.match(/^repeat[^\>]*>/i);
				rSrc = rTag[0].match(/"[^"]*"/);
				if (rSrc){ //start a loop
					rSrc = rSrc[0].replace(/&lt;/,'<').replace(/"/g,'').replace(/\s/g,'');
					subSrc = rSrc.split(/<-/);
					currentLoop = subSrc[0];
					arrSrc = subSrc[1] || '';
					if ( this.utils.isArray(arrSrc, openArrays) ){
						//reference to an open array
						aJS.push('var ' + currentLoop + '=' + this.utils.arrayName(arrSrc) + ';');}
					else{
						if (/context/i.test(arrSrc) || arrSrc.length == 0) {
							if (!(/context/i).test(currentLoop)){ // avoid var context = context 
								aJS.push('var ' + currentLoop + '= context;');}}
						else{ 
							aJS.push('var ' + currentLoop + '= $p.$c(context, "' + arrSrc + '");');}}
					aJS.push('for(var '+currentLoop+'Index in '+currentLoop+'){if ('+currentLoop+'.hasOwnProperty('+currentLoop+'Index)){'); 		
					aJS.push(this.utils.strOut(wrkStr.substring(rTag[0].length)));
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
					aJS.push(this.utils.strOut(wrkStr.substring(rTag[0].length, wrkStr.length)));}

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
					this.compiledFunctions[fName]['$'+fnId]=this.$f[fnId];
					delete this.$f[fnId];this.$f.cnt--;
					fullAtt.push(this.utils.outputFn('this.$'+fnId, currentLoop));
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
							if(this.utils.isArray(attValue, openArrays)){ //iteration reference
								fullAtt.push(this.utils.arrayName(attValue));}
							else{ //context data
								fullAtt.push(this.utils.contextOut("'"+attValue+"'"));}}
						else if(attValue !== ''){
							fullAtt.push('\''+attValue+'\'');}
	
						if(suffix !== ''){ fullAtt.push('\''+spc+suffix+'\'');}}}

				if (!isNodeValue) { //close the attribute string
					fullAtt.push('\'"\'');}}
				aJS.push(this.utils.out(fullAtt.length > 1 ? '$p.$outAtt(['+fullAtt.join(',')+'])':fullAtt[0]));
				
			//output the remaining if any	
			wrkStr = wrkStr.substr(offset);
			if(wrkStr !== '') {aJS.push(this.utils.strOut(wrkStr));}}
		aJS.push( 'return output.join("");}' );
		js = aJS.join('');
		if(!noEval){
			try{
				this.compiledFunctions[fName].compiled = new Function('context', js);} 
			catch (e){
				this.msg('parsing_error', [e.message, js]);
				return false;}}
		return js;},

	map:function(directives, html, noClone){
		// a directive is a tuple{ dom selector, value }
		// returns the html with the directives as pure:<attr>="..."
		if(!html[0] && html.length == 0){
			this.msg('no_HTML_selected');
			return false;}

		var fnId, multipleDir=[], currentDir, clone, ap,isAttr, target, attName, repetition, parentName, selector, i, autoRender, classToDelete=[];
		if (noClone){
			clone = html[0] && !html.nodeType ? html[0] : html;}
		else{
			clone = html[0] && !html.nodeType ? html[0].cloneNode(true) : html.cloneNode(true);}
			
		autoRender = clone.getAttribute(this.utils.AUTO)||false;
		for (selector in directives){ // for each directive set the corresponding pure:<attr>
			if(directives.hasOwnProperty(selector)){
				currentDir = directives[selector];
				if(this.utils.isTypeOfArray(currentDir)){//check if an array of directives is provided
					multipleDir = currentDir;}
				else{
					multipleDir = []; 
					multipleDir.push(currentDir);}
				for(i = 0; i<multipleDir.length;i++){
					currentDir = multipleDir[i];
					ap = this.utils.ap_check(selector);
					selector = ap.clean;
					isAttr = selector.match(/\[[^\]]*\]/); // match a [...]
					if(/^\[|^\.$/.test(selector)){ //attribute of the selected node or itself . (dot)
						target = clone;}
					else{
						target = this.find(selector, clone);
						if (!target && isAttr){
							//if the attribute does not exist yet, select its containing element
							target = this.find(selector.substr(0, isAttr.index), clone);}}

					if ( target ){  //target found
						if (typeof currentDir == 'function'){
							fnId = 'f'+this.$f.cnt++;
							this.$f[fnId] = currentDir;
							currentDir = '$f['+fnId+']';}

						attName = 'nodeValue'; //default
						repetition = -1;
						if (isAttr){
							//the directive points to an attribute
							attName = selector.substring(isAttr.index+1,isAttr[0].length+isAttr.index-1);
						if(attName.indexOf(this.utils.NS) > -1){
							attName = attName.substring(this.utils.NS.length);}}
						else{
							//check if the directive is a repetition
							repetition = currentDir.search(/w*<-w*/);
							if(repetition > -1) {attName = 'repeat';}}

						currentDir = currentDir.replace(/^"|"$|\'|\\\'/g, '\\\''); //escape any quotes by \'
						currentDir = this.utils.ap_format(currentDir, attName, target, ap.type);
						target.setAttribute( this.utils.NS + attName, currentDir);

						if(isAttr){
							if (attName != 'class'){ 
								this.utils.removeAtt(target, attName);}
							else if (autoRender != 'true'){ 
							  		classToDelete.push(target);}}}

					else{ // target not found
						parentName = [clone.nodeName];
						if(clone.id !== '') {parentName.push('#' + clone.id);}
						if(clone.className !== '') {parentName.push('#' + clone.className);}
						this.msg( 'element_to_map_not_found', [selector, parentName.join('')], clone);}}}}
		if (classToDelete.length>0){ //remove class attribute only at the end to allow .selector to work regardless of the order of directives
			for (i=0;i<classToDelete.length;i++){
				this.utils.removeAtt(classToDelete[i], 'class');}}
		return clone;},

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
			else{ alert(msg);}},
	libs:{
		mapDirective:function(elm, directives){
			return $p.map(directives, elm);},

		compile:function(elm, fName, directives, context){
			var html = elm;
			if(context) {html.setAttribute($p.utils.AUTO, 'true');}
			if(directives) {html = $p.map( directives, elm);}
			return $p.compile(html, fName, context||false, false);},//return the compiled JS

		render:function(elm, context, directives, html, auto){
			var source = elm;
			if(typeof html !== 'undefined'){
				source = typeof html !== 'string' && html[0] || html;} //either a lib object or a node or a template name
			else if(typeof directives !== 'undefined' && (directives.jquery || directives.cssSelect || directives.nodeType || typeof directives=== 'string')){
				//the directive is the template 
				source = (directives.jquery || directives.cssSelect) ? directives[0]:directives;
				directives = null;}
			return this.replaceWithAndReturnNew(elm, auto === true ? $p.autoRender(source, context, directives):$p.render(source, context, directives));},

		replaceWithAndReturnNew: function(elm, html){
			var div = document.createElement('div');
			var replaced = elm;
			var parent = replaced.parentNode;
			parent.insertBefore(div, replaced);//avoid IE mem leak, place it before filling
			div.innerHTML = html;
			var replacers = div.childNodes;
			var newThis = [];
			for (var i = replacers.length - 1; i >= 0; i--) {
				newThis.push(replaced.parentNode.insertBefore(replacers[i], replaced.nextSibling));}
			parent.removeChild(replaced);
			parent.removeChild(div);
			return newThis.length > 1 ? newThis:newThis[0];}}};

if(typeof jQuery !== 'undefined'){ 
	//patch jQuery to read namespaced attributes see Ticket #3023
	if(jQuery.parse) {jQuery.parse[0] = /^(\[) *@?([\w:\-]+) *([!*$\^~=]*) *('?"?)(.*?)\4 *\]/;}
	$p.utils.domCleaningRules.push({ what: /\s?jQuery[^\s]+\=\"null\"/gi, by: ''});
	if (typeof document.querySelector === 'undefined') {$p.find = function(selector, context){
		var found = jQuery.find(selector, context);
		return found[0] || false;};}
	// jQuery chaining functions
	jQuery.fn.mapDirective = function(directives){
		return jQuery($p.libs.mapDirective(this[0], directives));};
	jQuery.fn.compile = function(fName, directives, context){
		$p.libs.compile(this[0], fName, directives, context);
		return this;};
	jQuery.fn.render = function(context, directives, html){
		return jQuery($p.libs.render(this[0], context, directives, html));};
	jQuery.fn.autoRender = function(context, directives, html){
		return jQuery($p.libs.render(this[0], context, directives, html, true));};}

else if (typeof DOMAssistant !== 'undefined') { //Thanks to Lim Cheng Hong from DOMAssistant who did it
	if (typeof document.querySelector === 'undefined') {$p.find = function (selector, context) {
		var found = $(context).cssSelect(selector);
		return found[0] || false;};}	
	DOMAssistant.attach({
		publicMethods : [ 'mapDirective', 'compile', 'render', 'autoRender'],
		mapDirective : function (directives) {
			return $($p.libs.mapDirective(this, directives));},
		compile : function (fName, directives, context) {
			$p.libs.compile(this, fName, directives, context);
			return this;},
		render : function (context, directives, html) {
			return $($p.libs.render(this, context, directives, html));},
		autoRender : function (context, directives, html) {
			return $($p.libs.render(this, context, directives, html, true));}});}

else if (typeof MooTools !== 'undefined') {//Thanks to Carlos Saltos
	if (typeof document.querySelector === 'undefined'){$p.find = function (selector, context) {
		var found = $(context).getElement(selector);
		return found || false;};}

	Element.implement({
	mapDirective: function (directives) {
		return $($p.libs.mapDirective(this, directives));},
	
	compile: function (fName, directives, context) {
		$p.libs.compile(this, fName, directives, context);
		return this;},
	
	render: function (context, directives, html) {
		return $($p.libs.render(this, context, directives, html));},
	
	autoRender: function (context, directives, html) {
		return $($p.libs.render(this, context, directives, html, true));}});}
			
else if (typeof Prototype !== 'undefined'){ //Thanks to Carlos Saltos and Borja Vasquez
	// Implement the find function for pure using the prototype
	// select function
	if (typeof document.querySelector === 'undefined'){ $p.find = function (selector, context) {		
		var found = $(context).select(selector);
		// patch prototype when using selector with id's and cloned nodes in IE
		// maybe in next releases of prototype this is fixed
		if (!found || found === '') {
			var pos = selector.indexOf('#');
			if (pos > -1) { 				
				var id = selector.substr(pos+1);								
				var els = context.getElementsByTagName('*');
        		for (var i = 0, el; el = els[i]; i++) {
        			if (el.id == id) {
        				return el;}}}}
		return found[0] || false;
	};}
	// Add more methods to the prototype element's objects for
	// supporting pure calls
	// Add these extended methods using the prototype element object
	Element.addMethods({
		mapDirective: function (element, directives) {
			return $($p.libs.mapDirective(element, directives));},

		compile: function (element, fName, directives, context) {
			$p.libs.compile(element, fName, directives, context);
			return this;},

		render: function (element, context, directives, html) {
			return $($p.libs.render(element, context, directives, html));},

		autoRender: function (element, context, directives, html) {
			return $($p.libs.render(element, context, directives, html, true));}});}
			
else if (typeof Sizzle !== 'undefined') {
		if (typeof document.querySelector === 'undefined'){ $p.find = function(selector, context){
		var found = Sizzle(selector, context);
		return found[0] || false;};}
		
	$p.sizzle = function(selector, context){
		selector = selector || document;
		var ret  = selector.nodeType ? [selector]:Sizzle(selector, context);
		var sizzle = ret;
		sizzle.mapDirective = function(directives){
			sizzle[0] = $p.libs.mapDirective(sizzle[0], directives);
			return sizzle;};

		sizzle.compile = function(fName, directives, context){
			$p.libs.compile(sizzle[0], fName, directives, context);
			return sizzle;};

		sizzle.render = function(context, directives, html){
			sizzle[0] = $p.libs.render(sizzle[0], context, directives, html);
			return sizzle;};

		sizzle.autoRender = function(context, directives, html){
			sizzle[0] = $p.libs.render(sizzle[0], context, directives, html, true);
			return sizzle;};
		return sizzle;};}
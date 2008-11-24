/* * * * * * * * * * * * * * * * * * * * * * * * * *

    PURE Unobtrusive Rendering Engine for HTML

    Licensed under the MIT licenses.
    More information at: http://www.opensource.org

    Copyright (c) 2008 Michael Cvilic - BeeBole.com

    revision: 1.10 

* * * * * * * * * * * * * * * * * * * * * * * * * */

var pure  = window.$p = window.pure ={
	find: function(selector, context){
		if (Sizzle === 'undefined') {
			this.msg('library_needed');
			return false;}
		else{
			var results=[];
			Sizzle.find(selector, context, results);
			return result}},
	
	getRuntime: function(){
		//build the runtime to be exported as a JS file
		var src = ['var pure =window.$p = window.pure ={', '$outAtt:', this.$outAtt.toString(), ',', '$c:', this.$c.toString(), ',', 'render:', this.render.toString(), ',', 'compiledFunctions:[]};'];
		for (var fName in this.compiledFunctions){
			var htmlFunction = '$p.compiledFunctions[\'' + fName + '\']';
			src.push(htmlFunction+'={};'+htmlFunction+'.compiled=');
			src.push(this.compiledFunctions[fName].compiled.toString()+';');
			for (var fi in this.compiledFunctions[fName]){
				if(fi != 'compiled')
					src.push('$p.compiledFunctions[\''+fName+'\'].'+fi+'='+this.compiledFunctions[fName][fi].toString()+';');}}
	var elm = document.getElementById('pureMsg');
	if (elm) {
		elm.value = src.join('');
		elm.select();}
	else 
		this.msg('place_runtime_container');},

	$f:{cnt:0},

	$c:function(context, path, nullMode){
		if(path == 'context') return context;
		if(typeof context == 'object'){
			//context is a JSON
			var aPath = path.split(/\./);
			var value = context[aPath[0]];
			if(value == 'undefined') value = window[aPath[0]];

			for (var i=1; i<aPath.length; i++){
				if (!value) break;
				value = value[aPath[i]];}}
			if (!value && value!=0) value = nullMode ? null :'';
		return value;},

	render: function(html, context, directives){
		var fn;
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
			if (!html) { this.msg('wrong_html_source');return false;};
			html.setAttribute(this.utils.AUTO, 'true');}
		return this.render(html, context, directives);},

	compiledFunctions:{},

	$outAtt:function(content){
			var att = content.join('');
			return (/\=\"\"/.test(att)) ? '' : att;},
 	utils:{
 		CLASSNAME:/MSIE/.test(navigator.userAgent)? 'className':'class',
		NS:/MSIE/.test(navigator.userAgent) ? 'pure_':'pure:',
		CLASS:/MSIE/.test(navigator.userAgent) ? 'pure_class':'pure:class',
		AUTO:/MSIE/.test(navigator.userAgent) ? 'pure_autoRender':'pure:autoRender',
		REPEAT:/MSIE/.test(navigator.userAgent) ? 'pure_repeat':'pure:repeat',
		NODEVALUE:/MSIE/.test(navigator.userAgent) ? 'pure_nodeValue':'pure:nodeValue',
		nodeValues:[],
		repeats:[],
		autoRenderAtts:[],
		isTypeOfArray:function(obj){
            return typeof obj.length === 'number' && !(obj.propertyIsEnumerable('length')) && typeof obj.splice === 'function';},
		autoMap: function(n, autoRender, context, openArray){
			var replaced, replacer, replacedSrc, nodeValueSrc, toMap, k, j, i, att, repeatPrefix, prop, attValue, ap;
			if (autoRender == 'true') {
				attValue = n.getAttribute(this.CLASSNAME);
				if (attValue) {
					toMap = attValue.replace(/^\d|\s\d/g,'').split(/\s+/);//remove numeric classes as they mess up the array reference
					for (j = 0; j < toMap.length; j++) {
						repeatPrefix = '';
						ap = this.appendPrepend.check(toMap[j]);
						att = ap.clean.split(/@/);
						prop = att[0] != 'context' ? $p.$c(context, att[0], true) : !/context/.test(openArray.join('')) ? context: true;						
						if(!prop && openArray.length > 0) {
							for (k = openArray.length-1; k>=0; k--) {
								prop = openArray[k] == 'context' ? context[0][att[0]] : $p.$c(context[openArray[k]][0], att[0], true);
								if (prop || prop == 0) {//found a repetition field, break, specific case when 0 is returned as a value
									repeatPrefix = openArray[k];
									break;}}}
							
						if (prop || prop==0) {
							if (typeof prop.length === 'number' && !(prop.propertyIsEnumerable('length')) && typeof prop.splice === 'function') { //Douglas Crockford check if array
								openArray.push(att[0]);
								n.setAttribute(this.REPEAT, att[0] + '<-' + att[0]);}
							else {
								if(repeatPrefix != '') 
									att[0] = repeatPrefix + '[\'' + att[0] + '\']';
								if(!att[1]) //not an attribute
									att.push('nodeValue');
								if(ap.type) //append or prepend ?
									att[0] = this.appendPrepend.format(att[0], att[1], n, ap.type);
								if (att[1]!='nodeValue') // remove the existing attribute if any
									this.removeAtt(n, att[1]);
								if (!n.getAttribute(this.NS + att[1])) { //don't overwrite a directive if any
									n.setAttribute(this.NS + att[1], att[0]);}}}}
					if (n.getAttribute(this.CLASS) && n.getAttribute(this.CLASSNAME))
						n.removeAttribute(this.CLASSNAME);}}

			//flag the nodeValue and repeat attributes
			var isNodeValue = n.getAttribute(this.NODEVALUE);
			if (isNodeValue) this.nodeValues.push(n);
			var isRepeat = n.getAttribute(this.REPEAT);
			if (isRepeat) this.repeats.push(n);},

		nodeWalk:function(node, context){
			var auto = this.AUTO;
			this.repeats = []; this.nodeValues = [];
			var autoRender = node.getAttribute(auto);
			node.removeAttribute(auto);
			var openArray=[];
			//memory safe non-recursive tree traverse
			var c = node, n = null;
			do {
				if (c.nodeType == 1) 
					this.autoMap(c, autoRender, context, openArray);
				n = c.firstChild;
				if (n == null) {
					n = c.nextSibling;}
				if (n == null) {
					var tmp = c;
					do {
						n = tmp.parentNode;
						if (n == node) break;
						tmp = n;
						n = n.nextSibling;}
					while (n == null)}
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
							if (ap[1] == 'a')
								n.innerHTML += this.NODEVALUE + '="' + nodeValueSrc.substring(ap.index+3) + '"';
							else
								n.innerHTML = this.NODEVALUE + '="' + nodeValueSrc.substring(ap.index+3) + '"' + n.innerHTML;}
						else 	n.innerHTML = this.NODEVALUE + '="' + nodeValueSrc + '"';
						
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
						if(node == n) 
							str = $p.outerHTML(replacer);
						else
							n.parentNode.replaceChild(replacer, n);}}
				catch (e) {}}
				return (str) ? str : false;},
		appendPrepend: {
			format:function(attValue, attName, node, ap){
					if(!attName) attName = 'nodeValue';
					if (ap) {
						var fixAtt = /MSIE/.test(navigator.userAgent) && attName == 'class' ? 'className' : attName;
						var original = node.getAttribute(fixAtt) || ('nodeValue' == attName ? 'nodeValue' : false);
						if (original) 
							return original + '|' + ap + '|' + attValue;}
						else
							return attValue;},
							
			check: function(str){
				var prepend, append;
				str = (prepend = /^\+/.test(str)) ? str.substring(1, str.length) : (append = /\+$/.test(str)) ? str.substring(0, str.length - 1) : str;
				return {type:(append) ? 'a' : (prepend) ? 'p' : false, clean:str}
			}
		},
		removeAtt:function(node, att){
			if (att == 'class') att = this.CLASSNAME; 
			try{ node.removeAttribute(att);}catch(e){}}, //cross browser

		out:function(content){ return ['output.push(', content, ');'].join('')},
		strOut:function (content){ return ['output.push(', "'", content, "');"].join('')},
		outputFn:function (attValue, currentLoop){
			if (currentLoop) 
				return attValue + '({context:context, items:' + currentLoop + ',pos:parseInt(' + currentLoop + 'Index), item:' + currentLoop + '[parseInt(' + currentLoop + 'Index)]})';
			else
				return attValue + '({context:context})';},
		contextOut:function(path){ return '$p.$c(context, ' + path + ')'},

		isArray:function (attValue, openArrays){ //check if it is an array reference either [] or an open loop
			var arrIndex = /\[[^\]]*]/.test(attValue);
			var objProp  = attValue.replace(/(")|(')/g,'').split(/\./);
			return arrIndex || openArrays[objProp[0]] ? true: false;},

		arrayName:function(pName){
			var name=pName.match(/\w*/)[0] || ''; 
			var subIndex= pName.substring(name.length).replace(/\[\s*]/,''); // take the tail and replace [ ] by ''
			if(/\./.test(subIndex)) 
				subIndex = subIndex.replace(/^\./, '[\'').replace(/\./g,'\'][\'') + '\']';
			return name + '[' + name + 'Index]' + subIndex.replace(/\\\'/g,"'");},
		domCleaningRules:[
			{what:new RegExp(window.location.toString().substring(0, window.location.toString().indexOf(window.location.pathname)), 'g'), by:''},//put all absolute links( img.src ) of window.location relative to the root
			{what:/\>\s+\</g, by:'><'}, //remove spaces between >..< (IE 6) 
			{what:/^\s+/, by:''},//clean leading white spaces in the html
			{what:/\n/g, by:''},//may be too strong check with and pre, textarea,...
			{what:/\<\?xml:namespace[^>]*beebole[^\>]*\>/gi, by:''}],//remove pure ns (IE)
		outerHTML:function(elm){
			return elm.outerHTML || (function(){
				var div = document.createElement('div');
				div.appendChild(elm);
				return div.innerHTML;})();},
		html2str:function(html, context){
			var clone = html[0] && !html.nodeType ? html[0].cloneNode(true) : html.cloneNode(true);
			//node manipulation before conversion to string
			var str = this.nodeWalk(clone, context);
			//convert the HTML to a string
			if(!str) str = this.outerHTML( clone );
			//avoid shifting lines remove the > and </ around pure:repeat tags
			str = str.replace(new RegExp('\<\/?:?'+this.REPEAT, 'gi'), this.REPEAT);// :? -> from bug in IE
			//clean the dom string, based on rules in $p.domCleaningRules
			var rules = this.domCleaningRules;
			for(i in rules){
				str = str.replace(rules[i].what ,rules[i].by);}
			return str.split(this.NS);}},

	autoCompile:function(html, fName, context, noEval){
		html.setAttribute(this.utils.AUTO, 'true');
		return this.compile(html, fName, context, noEval);},

	compile: function(html, fName, context, noEval){
		var aDom = this.utils.html2str(html, context);
				
		if(!fName && typeof fName != 'number'){
			this.msg( 'no_HTML_name_set_for_parsing', str, html);
			return false}

		//start the js generation
		this.compiledFunctions[fName]={}; //clean the fct place if any
		var aJS = [[ '$p.compiledFunctions["', fName, '"].compiled = function(context){var output = [];' ].join('')];

		var js, wrkStr, rTag = false, rSrc, openArrays=[], usedFn=[], cnt=1, subSrc='', fnId, attOut, spc, suffix, currentLoop, isNodeValue, max, curr, key, offset, isStr = false, attName = '', attValue = '', attValues=[], arrSrc, fullAtt;
		for(var j = 0;j < aDom.length; j++){
			wrkStr = aDom[j];
			if (j==0){
				//push the first line as it is HTML
				if(wrkStr!="") aJS.push(this.utils.strOut(wrkStr.substring(0, wrkStr.length)));}
			else{
				if (/^repeat[^\>]*\>/i.test(wrkStr)){
					rTag = wrkStr.match(/^repeat[^\>]*>/i);
					rSrc = rTag[0].match(/"[^"]*"/);
					if (rSrc){ //start a loop
						rSrc = rSrc[0].replace(/&lt;/,'<').replace(/"/g,'').replace(/\s/g,'');
						subSrc = rSrc.split(/\<-/);
						currentLoop = subSrc[0];
						arrSrc = subSrc[1] || '';
						if ( this.utils.isArray(arrSrc, openArrays) ){
							//reference to an open array
							aJS.push('var ' + currentLoop + '=' + this.utils.arrayName(arrSrc) + ';');}
						else{
							if (/context/i.test(arrSrc) || arrSrc.length == 0) {
								if (!/context/i.test(currentLoop)) // avoid var context = context 
									aJS.push('var ' + currentLoop + '= context;');}
							else 
								aJS.push('var ' + currentLoop + '= $p.$c(context, "' + arrSrc + '");');}
						aJS.push('if('+currentLoop+') for(var '+currentLoop+'Index=0;'+currentLoop+'Index < '+currentLoop+'.length;'+currentLoop+'Index++){');
						aJS.push(this.utils.strOut(wrkStr.substring(rTag[0].length)));
						openArrays[currentLoop] = cnt++;}
				
					else{ //end of loop;
						aJS.push('}');
						delete openArrays[currentLoop];
						max = 0;
						for (key in openArrays){
							curr = openArrays[key];
							if( curr > max){
							max = curr;
							currentLoop = key;}}
						aJS.push(this.utils.strOut(wrkStr.substring(rTag[0].length, wrkStr.length)));}

					rTag = false;
					continue;}
				else{
					attName = wrkStr.substring(0, wrkStr.indexOf('='));
					attValue = wrkStr.match(/=""?[^"]*""?/)[0].substr(2).replace(/"$/,'');
					offset = attName.length + attValue.length + 3;
					if (/&quot;/.test(attValue)) {
						attValue = attValue.replace(/&quot;/g, '"');
						wrkStr = wrkStr.replace(/&quot;/, '"').replace(/&quot;/, '"')}

					isNodeValue = /^nodeValue/i.test(wrkStr);	
					fullAtt = isNodeValue ? []: ['\''+attName+'="\''];

					attOut = attValue.match(/\|(a|p)\|/);
					suffix = false; 
					spc = isNodeValue ? '':' ';
					if (attOut) {
						if(attOut[1] =='a') 
							fullAtt.push('\''+attValue.substring(0, attOut.index)+spc+'\'');
						else // |p|
							suffix = attValue.substring(0, attOut.index);
						attValue = attValue.substring(attOut.index + 3);}

					if(/\$f\[(f[0-9]+)]/.test(attValue)){ //function reference
						fnId = attValue.match(/\[(f[0-9]+)/)[1];
						this.compiledFunctions[fName]['$'+fnId]=this.$f[fnId];
						delete this.$f[fnId];this.$f.cnt--;
						fullAtt.push(this.utils.outputFn('this.$'+fnId, currentLoop));
						if(suffix!='') fullAtt.push('\''+spc+suffix+'\'');}
					else if(/^\\\'|&quot;/.test(attValue)){ //a string, strip the quotes
						fullAtt.push('\''+ attValue.replace(/^\\\'|\\\'$/g,'')+'\'');
						if(suffix!='') fullAtt.push('\''+spc+suffix+'\'');}
					else{
						if (!/MSIE/.test(navigator.userAgent)) {
							attValues = attValue.split(/(#{[^\}]*})/g);}
						else { //IE:(
							var ie = attValue.match(/#{[^\}]*}/);
							attValues = ie ? [] : [attValue];
							while (ie) {
								if (ie.index > 0) attValues.push(attValue.substring(0, ie.index));
								attValues.push(ie[0]);
								attValue = attValue.substring(ie.lastIndex);
								ie = attValue.match(/#{[^\}]*}/);
								if (!ie && attValue != '') attValues.push(attValue);}};

						for(var atts = 0; atts<attValues.length; atts++){
							attValue = attValues[atts];
							if(/\#{/.test(attValue) || attValues.length == 1){
								attValue = attValue.replace(/^\#\{/, '').replace(/\}$/,'');
								if(this.utils.isArray(attValue, openArrays)){ //iteration reference
									fullAtt.push(this.utils.arrayName(attValue));}
								else{ //context data
									fullAtt.push(this.utils.contextOut("'"+attValue+"'"));}}
							else if(attValue != ''){
								fullAtt.push('\''+attValue+'\'');};
		
							if(suffix!='') fullAtt.push('\''+spc+suffix+'\'');}}

					if (!isNodeValue) { //close the attribute string
						fullAtt.push('\'"\'');}}
					aJS.push(this.utils.out(fullAtt.length > 1 ? '$p.$outAtt(['+fullAtt.join(',')+'])':fullAtt[0]));
					
				//output the remaining if any	
				wrkStr = wrkStr.substr(offset);
				if(wrkStr != '') aJS.push(this.utils.strOut(wrkStr));}}
		aJS.push( 'return output.join("");}' );
		js = aJS.join('');
		if(!noEval){
			try{
				eval(js);} 
			catch (e){
				this.msg('parsing_error', [e.message, js]);
				return false;}}
		return js;},

	map:function(directives, html, noClone){
		// a directive is a tuple{ dom selector, value }
		// returns the html with the directives as pure:<attr>="..."
		if(!html[0] && html.length == 0){
			this.msg('no_template_found');
			return false;}

		var fnId, multipleDir=[], currentDir, clone, ap,isAttr, target, attName, repetition, fixAtt, original, parentName, selector, i, autoRender;
		if (noClone){
			clone = html[0] && !html.nodeType ? html[0] : html;}
		else{
			clone = html[0] && !html.nodeType ? html[0].cloneNode(true) : html.cloneNode(true);}
			
		autoRender = clone.getAttribute(this.utils.AUTO)||false;
		for (selector in directives){ // for each directive set the corresponding pure:<attr>
			currentDir = directives[selector];
			if(this.utils.isTypeOfArray(currentDir)){//check if an array of directives is provided
				multipleDir = currentDir;}
			else{
				multipleDir = []; 
				multipleDir.push(currentDir);}
			for(i = 0; i<multipleDir.length;i++){
				currentDir = multipleDir[i];
				ap = this.utils.appendPrepend.check(selector);
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
					if(attName.indexOf(this.utils.NS) > -1) 
						attName = attName.substring(this.utils.NS.length);}
					else{
						//check if the directive is a repetition
						repetition = currentDir.search(/w*<-w*/);
						if(repetition > -1) attName = 'repeat';}

					currentDir = currentDir.replace(/^"|"$|\'|\\\'/g, '\\\''); //escape any quotes by \'
					currentDir = this.utils.appendPrepend.format(currentDir, attName, target, ap.type);
					target.setAttribute( this.utils.NS + attName, currentDir);

					if(isAttr && !(attName=='class' && autoRender=='true'))
						this.utils.removeAtt(target, attName)}
				else{ // target not found
					parentName = [clone.nodeName];
					if(clone.id != '') parentName.push('#' + clone.id);
					if(clone.className !='') parentName.push('#' + clone.className);
					this.msg( 'element_to_map_not_found', [selector, parentName.join('')], clone);}}}

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
		var re = /&/, i, msgDiv;
		if(msg != msgId && msgParams){
			if (typeof msgParams == 'string'){
				msg = msg.replace(re, msgParams);}
			else{
				for(i=0; i<msgParams.length;i++ ){
					msg = msg.replace(re, msgParams[i]);}}}

		var elm = document.getElementById('pureMsg');
		if(elm){
			elm.innerHTML = [msg, '<br />', elm.innerHTML].join('');}
			else{ alert(msg);}},
	libs:{
		mapDirective:function(elm, directives){
			return $p.map(directives, elm);},

		compile:function(elm, fName, directives, context){
			if(directives) $p.map( directives, elm, true);
			if(context) elm.setAttribute($p.utils.AUTO, 'true');
			return $p.compile(elm, fName, context||false, false);},//return the compiled JS

		render:function(elm, context, directives, html){
			if (typeof directives == 'string') { //a compiled template is passed
				html = directives;
				directives = false;}
			var source = html ? html : elm;
			return this.replaceWithAndReturnNew(elm, $p.render(source, context, directives));},

		replaceWithAndReturnNew: function(elm, html){
			var div, replaced, parent, replacers, i, newThis = [];
			div = document.createElement('div');
			replaced = elm;
			parent = replaced.parentNode;
			parent.insertBefore(div, replaced);//avoid IE mem leak, place it before filling
			div.innerHTML = html;
			replacers = div.childNodes;
			for (i = replacers.length - 1; i >= 0; i--) {
				newThis.push(replaced.parentNode.insertBefore(replacers[i], replaced.nextSibling));}
			parent.removeChild(replaced);
			parent.removeChild(div);
			return elm;},
		autoRender:function(elm, context, directives, html){
			var replaced = elm;
			directives = directives || false;
			html = html || false;
			if (!html && directives && directives.jquery || directives.nodeType) { //template is provided instead of directives
				html = directives[0] || directives; //ok for jQuery obj or html node
				directives = false;}
			var source = html ? html : replaced;//if no target, self replace
			return this.replaceWithAndReturnNew(elm, $p.autoRender(source, context, directives));},
		find: function(selector, context, results){
			Sizzle.find(selector, context, results);
			return results[0];}}};

if(typeof jQuery !== 'undefined'){ 
	//patch jQuery to read namespaced attributes see Ticket #3023
	jQuery.parse[0] = /^(\[) *@?([\w:-]+) *([!*$^~=]*) *('?"?)(.*?)\4 *\]/;
	$p.utils.domCleaningRules.push({ what: /\s?jQuery[^\s]+\=\"null\"/gi, by: ''});
	$p.find = function(selector, context){
		var found = jQuery.find(selector, context);
		return found[0] || false;};
	// jQuery chaining functions
	$.fn.mapDirective = function(directives){
		return $($p.libs.mapDirective(this, directives));};
	
	$.fn.compile = function(fName, directives, context){
		$p.libs.compile(this[0], fName, directives, context);
		return this;};

	$.fn.render = function(context, directives, html){
		return $($p.libs.render(this[0], context, directives, html));};
		
	$.fn.autoRender = function(context, directives, html){
		return $($p.libs.autoRender(this[0], context, directives, html));}}

else if (typeof DOMAssistant !== 'undefined') { //Thanks to Lim Cheng Hong from DOMAssistant who did it
	$p.find = function (selector, context) {
		var found = $(context).cssSelect(selector);
		return found[0] || false;};	

	DOMAssistant.attach({
		publicMethods : [
			'mapDirective',
			'compile',
			'render',
			'autoRender',],
		mapDirective : function (directives) {
			return $($p.libs.mapDirective(this, directives));},
		compile : function (fName, directives, context) {
			$p.libs.compile(this, fName, directives, context);
			return this;},
		render : function (context, directives, html) {
			return $($p.libs.render(this, context, directives, html));},
		autoRender : function (context, directives, html) {
			return $($p.libs.autoRender(this, context, directives, html));}});}
			
if (typeof Prototype !== 'undefined'){ //Thanks to Carlos Saltos and Borja Vasquez
	// Implement the find function for pure using the prototype
	// select function
	$p.find = function (selector, context) {		
		var found = $(context).select(selector);
		// patch prototype when using selector with id's and cloned nodes in IE
		// maybe in next releases of prototype this is fixed
		if (!found || found == "") {
			var pos = selector.indexOf('#');
			if (pos > -1) { 				
				var id = selector.substr(pos+1);								
				var els = context.getElementsByTagName('*');
        		for (var i = 0, el; el = els[i]; i++) {
        			if (el.id == id) {
        				return el;}}}}
		return found[0] || false;
	};
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
			return $($p.libs.autoRender(element, context, directives, html));}});}


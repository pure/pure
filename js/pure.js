/* * * * * * * * * * * * * * * * * * * * * * * * * *

    PURE Unobtrusive Rendering Engine for HTML

    Licensed under the MIT licenses.
    More information at: http://www.opensource.org

    Copyright (c) 2008 Michael Cvilic - BeeBole.com

    version: 1.5+

* * * * * * * * * * * * * * * * * * * * * * * * * */

var pure  = window.$p = window.pure ={
	find: function(){
		this.msg('library_needed')},
	
	getRuntime: function(){
		//build the runtime to be exported as a JS file
		var src = ['var pure =window.$p = window.pure ={', '$c:', this.$c.toString(), ',', '$f:[', this.$f.toString(), '],', 'render:', this.render.toString(), ',', 'compiledFunctions:[]};'];
		for (var fName in this.compiledFunctions){
		var htmlFunction = '$p.compiledFunctions[\'' + fName + '\']';
		src.push(htmlFunction+'={};'+htmlFunction+'.compiled=');
		src.push(this.compiledFunctions[fName].compiled.toString()+';');}

	var runtime = src.join('');
	var txt = document.getElementById('pureRuntime');
	if (txt){
		txt.value = runtime;
		txt.select();}
	else{
		txt = document.createElement('TEXTAREA');
		txt.value = runtime;
		txt.id = 'pureRuntime';
		document.body.appendChild(txt);
		txt.select();}},

	ns: /MSIE/.test(navigator.userAgent) ? 'pure_':'pure:', //IE namespace :(

	$f:{cnt:0},

	$c:function(context, path){
		if(path == 'context') return context;
		if(typeof context == 'object'){
			//context is a JSON
			var aPath = path.split(/\./);
			var value = context[aPath[0]];
			if(value == 'undefined') value = window[aPath[0]];

			for (var i=1; i<aPath.length; i++){
				if (!value){
					i = aPath.length;
					continue;}

				value = value[aPath[i]];}}

			if (!value && value!=0) value = '""';
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

	autoRenderAtt: /MSIE/.test(navigator.userAgent) ? 'className':'class',
	autoRender:function(html, context, directives){
		if (typeof html != 'string') {
			if (!html) { this.msg('wrong_html_source');return false;};
			html.setAttribute(this.ns + 'autoRender', 'true');}
		return this.render(html, context, directives);},

	compiledFunctions:{},

	domCleaningRules:[
		{what:new RegExp(window.location.toString().substring(0, window.location.toString().indexOf(window.location.pathname)), 'g'), by:''},//put all absolute links( img.src ) of window.location relative to the root
		{what:/\>\s+\</g, by:'><'}, //remove spaces between >..< (IE 6) 
		{what:/^\s+/, by:''},//clean leading white spaces in the html
		{what:/\n/g, by:''},//may be too strong check with and pre, textarea,...
		{what:/\<\?xml:namespace[^>]*beebole[^\>]*\>/gi, by:''}],//remove pure ns (IE)

	utils:{
		nodeValues:[],
		repeats:[],
		autoRenderAtts:[],
		isTypeOfArray:function(obj){
            return typeof obj.length === 'number' && !(obj.propertyIsEnumerable('length')) && typeof obj.splice === 'function';},
		autoMap: function(n, ns, autoRender, context, autoRenderAtt, openArray){
			var repeatAtt = ns + 'repeat';
			var nodeValueAtt = ns + 'nodeValue';
			var replaced, replacer, replacedSrc, nodeValueSrc, toMap, k, j, i, att, repeatPrefix, prop, attValue, ap;
			if (autoRender == 'true') {
				attValue = n.getAttribute(autoRenderAtt);
				if (attValue) {
					toMap = attValue.replace(/^\d|\s\d/g,'').split(/\s+/);//remove numeric classes as they mess up the array reference
					for (j = 0; j < toMap.length; j++) {
						repeatPrefix = '';
						ap = this.appendPrepend.check(toMap[j]);
						att = ap.clean.split(/@/);
						prop = att[0] != 'context' ? $p.$c(context, att[0]) : !/context/.test(openArray.join('')) ? context: true;						
						if(prop=='""'){
							if (openArray.length > 0) {
								for (k = 0; k < openArray.length; k++) {
									prop = openArray[k] == 'context' ? context[0][att[0]] : $p.$c(context[openArray[k]][0], att[0]);
									if (prop || prop == 0) {//found a repetition field, break, specific case when 0 is returned as a value
										repeatPrefix = openArray[k];
										break;}}}}
							
						if ((prop || prop==0) && prop!='""') {
							if (typeof prop.length === 'number' && !(prop.propertyIsEnumerable('length')) && typeof prop.splice === 'function') { //Douglas Crockford check if array
								openArray.push(att[0]);
								n.setAttribute(ns + 'repeat', att[0] + '<-' + att[0]);}
							else {
								if(repeatPrefix != '') 
									att[0] = repeatPrefix + '.' + att[0];
								if(!att[1]) //not an attribute
									att.push('nodeValue');
								if(ap.type) //append or prepend ?
									att[0] = this.appendPrepend.format(att[0], att[1], n, ap.type);
								if (att[1]!='nodeValue') // remove the existing attribute if any
									this.removeAtt(n, att[1]);
								if (!n.getAttribute(ns + att[1])) { //don't overwrite a directive if any
									n.setAttribute(ns + att[1], att[0]);}}}}
					var fixAtt =  /MSIE/.test(navigator.userAgent) &&  autoRenderAtt == 'className' ? 'class':autoRenderAtt; //clean the auto-rendering att
					if (n.getAttribute(ns+fixAtt) && n.getAttribute(autoRenderAtt))
							n.removeAttribute(autoRenderAtt);
				}}
			//flag the nodeValue and repeat attributes
			var isNodeValue = n.getAttribute(nodeValueAtt);
			if (isNodeValue) this.nodeValues.push(n);
			var isRepeat = n.getAttribute(repeatAtt);
			if (isRepeat) this.repeats.push(n);},

		nodeWalk:function(node, ns, context, autoRenderAtt){
			this.repeats = []; this.nodeValues = [];
			var autoRender = node.getAttribute(ns + 'autoRender');
			node.removeAttribute(ns + 'autoRender');
			var openArray=[];
			//memory safe non-recursive tree traverse
			var c = node, n = null;
			do {
				if (c.nodeType == 1) 
					this.autoMap(c, ns, autoRender, context, autoRenderAtt, openArray);
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
			var repeatAtt = ns + 'repeat';
			var nodeValueAtt = ns + 'nodeValue';
			var replaced, replacer, replacedSrc, nodeValueSrc, str = false;
			for (var j = this.nodeValues.length-1; j >= 0; j--) {
				try {
					n = this.nodeValues[j];
					nodeValueSrc = n.getAttribute(nodeValueAtt); // put the node value in place
					if (nodeValueSrc) {
						var ap = nodeValueSrc.match(/\|(a|p)\|/);
						if (ap) {
							if (ap[1] == 'a')
								n.innerHTML += nodeValueAtt + '="' + nodeValueSrc.substring(ap.index+3) + '"';
							else
								n.innerHTML = nodeValueAtt + '="' + nodeValueSrc.substring(ap.index+3) + '"' + n.innerHTML;}
						else 	n.innerHTML = nodeValueAtt + '="' + nodeValueSrc + '"';
						
						n.removeAttribute(nodeValueAtt);}} 
				catch (e) {}}
			for(var i=this.repeats.length-1; i>=0;i--){
				n = this.repeats[i];//go inside out of the tree
				try {
					replacedSrc = n.getAttribute(repeatAtt); //wrap in tags for easy string find
					if (replacedSrc) {
						replaced = n.cloneNode(true);
						replaced.removeAttribute(repeatAtt);
						replacer = document.createElement(repeatAtt);
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
			try{ node.removeAttribute(att);}catch(e){}}, //cross browser

		out:function(content){ return ['output.push(', content, ');'].join('')},
		strOut:function (content){ return ['output.push(', "'", content, "');"].join('')},
		outputFn:function (attValue, currentLoop){
			if (currentLoop) 
				return this.out(attValue + '({context:context, items:' + currentLoop + ',pos:parseInt(' + currentLoop + 'Index), item:' + currentLoop + '[parseInt(' + currentLoop + 'Index)]})');
			else
				return this.out(attValue + '({context:context})');},
		contextOut:function(path){ return ['output.push($p.$c(context, ', path, '));'].join('')},

		isArray:function (attValue, openArrays){ //check if it is an array reference either [] or an open loop
			var arrIndex = /\[[^\]]*]/.test(attValue);
			var objProp  = attValue.replace(/(")|(')/g,'').split(/\./);
			return arrIndex || openArrays[objProp[0]] ? true: false;},

		arrayName:function(pName){
			var name=pName.match(/\w*/)[0] || ''; 
			var subIndex= pName.substring(name.length).replace(/\[\s*]/,''); // take the tail and replace [ ] by ''
			return name + '[' + name + 'Index]' + subIndex;}},
	autoCompile:function(html, fName, context, noEval){
		html.setAttribute(this.ns + 'autoRender', 'true');
		return this.compile(html, fName, context, noEval);
	},
	compile: function(html, fName, context, noEval){
		//DOM is slow, innerHTML is fast -> compile. Once browsers will be ok, no compilation will be needed anymore
		var clone = html[0] ? html[0].cloneNode(true) : html.cloneNode(true);
		
		//node manipulation before conversion to string
		var ns = this.ns;
		var str = this.utils.nodeWalk(clone, ns, context, this.autoRenderAtt);
		//convert the HTML to a string
		if(!str) str = this.outerHTML( clone );

		//avoid shifting lines remove the > and </ around pure:repeat tags
		str = str.replace(new RegExp('\<\/?:?'+ns+'repeat', 'gi'), ns+'repeat');// :? -> from bug in IE
		
		//clean the dom string, based on rules in $p.domCleaningRules
		var rules = this.domCleaningRules;
		for(i in rules){
		str = str.replace(rules[i].what ,rules[i].by);}
		
		if(!fName && typeof fName != 'number'){
			this.msg( 'no_HTML_name_set_for_parsing', str, html);
			return false}
		//start the js generation
		this.compiledFunctions[fName]={}; //clean the fct place if any
		var aJS = [[ '$p.compiledFunctions["', fName, '"].compiled = function(context){var output = [];' ].join('')];
		var aDom = str.split(ns);

		var js, wrkStr, rTag = false, rSrc, openArrays=[], usedFn=[], cnt=1, subSrc='', fnId, attOut, spc, suffix, currentLoop, isNodeValue, max, curr, key, offset, isStr = false, attName = '', attValue = '', arrSrc;
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
					isNodeValue ? attName = 'nodeValue': aJS.push(this.utils.strOut(attName + '="'));

					attOut = attValue.match(/\|(a|p)\|/);
					suffix = false; 
					spc = isNodeValue ? '':' ';
					if (attOut) {
						if(attOut[1] =='a') 
							aJS.push(this.utils.strOut(attValue.substring(0, attOut.index)+spc));
						else // |p|
							suffix = attValue.substring(0, attOut.index);
						attValue = attValue.substring(attOut.index + 3);}

					if(/\$f\[(f[0-9]+)]/.test(attValue)){ //function reference
						fnId = attValue.match(/\[(f[0-9]+)/)[1];
						this.compiledFunctions[fName]['$'+fnId]=this.$f[fnId];
						delete this.$f[fnId];this.$f.cnt--;
						aJS.push(this.utils.outputFn('this.$'+fnId, currentLoop));}
						
					else if(/^("|'|&quot;)(.*)("|'|&quot;)/.test(attValue)){ //a string, strip the quotes
						aJS.push(this.utils.strOut(attValue.substr(1, attValue.length-2)));}
					else if(this.utils.isArray(attValue, openArrays)){ //iteration reference
						aJS.push(this.utils.out(this.utils.arrayName(attValue)));}
					else{ //context data
						aJS.push(this.utils.contextOut("'"+attValue+"'"));}

					if(suffix!='') aJS.push(this.utils.strOut(spc+suffix));

					if (!isNodeValue) { //close the attribute string
						aJS.push(this.utils.strOut('"'));}}
					
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

	outerHTML:function(elm){
		// cross browser outerHTML
		return elm.outerHTML || (function(){
		var div = document.createElement('div');
		div.appendChild(elm);
		return div.innerHTML;})();},

	map:function(directives, html, noClone){
		// a directive is a tuple{ dom selector, value }
		// returns the html with the directives as pure:<attr>="..."
		if(!html[0] && html.length == 0){
			this.msg('no_template_found');
			return false;}

		var fnId, multipleDir=[], currentDir, clone, ap,isAttr, target, attName, repetition, fixAtt, original, parentName, selector, i;
		if (noClone){
			clone = html[0] ? html[0] : html;}
		else{
			clone = html[0] ? html[0].cloneNode(true) : html.cloneNode(true);}
			
		autoRender = clone.getAttribute(this.ns + 'autoRender')||false;
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
					repetition = -1, ns = this.ns;
					if (isAttr){
						//the directive points to an attribute
						attName = selector.substring(isAttr.index+1,isAttr[0].length+isAttr.index-1);
					if(attName.indexOf(ns) > -1) 
						attName = attName.substring(ns.length);}
					else{
						//check if the directive is a repetition
						repetition = currentDir.search(/w*<-w*/);
						if(repetition > -1) attName = 'repeat';}

					if (/^"/.test(currentDir) && /"$/.test(currentDir)){ //assume a string value is passed, replace " by '
						currentDir = '\'' + currentDir.substring(1, currentDir.length-1) + '\''}

					currentDir = this.utils.appendPrepend.format(currentDir, attName, target, ap.type);

					target.setAttribute( ns + attName, currentDir);

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
		'place_runtime_container':'To collect the PURE runtime, place a <textarea id=\"pureRuntime\"></textarea> in your document.',
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

		msgDiv = document.getElementById('pureMsg');
		if(msgDiv){
			msgDiv.innerHTML = [msg, '<br />', msgDiv.innerHTML].join('');}
			else{ alert(msg);}}};

try{ if (jQuery) {
	//patch jQuery to read namespaced attributes see Ticket #3023
	jQuery.parse[0] = /^(\[) *@?([\w:-]+) *([!*$^~=]*) *('?"?)(.*?)\4 *\]/;
	$p.domCleaningRules.push({ what: /\s?jQuery[^\s]+\=\"[^\"]+\"/gi, by: ''});
	$p.find = function(selector, context){
		var found = jQuery.find(selector, context);
		return found[0] ? found[0] : false;};
	
	// jQuery chaining functions
	$.fn.$pMap = $.fn.mapDirective = function(directives){
		return $($p.map(directives, this));};
	
	$.fn.$pCompile = $.fn.compile = function(fName, directives, context){
		if(directives) $p.map( directives, this, true);
		if(context) this[0].setAttribute($p.ns + 'autoRender', 'true');
		$p.compile(this, fName, context||false, false);
		return this;};

	$.fn.replaceWithAndReturnNew = function(html){
		var div, replaced, parent, replacers, i;
		div = document.createElement('div');
		replaced = this[0];
		parent = replaced.parentNode;
		parent.insertBefore(div, replaced);//avoid IE mem leak
		div.innerHTML = html;
		replacers = div.childNodes;
		for (i=replacers.length-1; i>=0; i--) {
			replaced.parentNode.insertBefore(replacers[i], replaced.nextSibling);
		}
		parent.removeChild(replaced);
		parent.removeChild(div);}		
	$.fn.$pRender =$.fn.render = function(context, directives, html){
		if (typeof directives == 'string') { // a compiled template is passed
			html = directives;
			directives = false;}
		var source = html ? html : this[0];
		return this.replaceWithAndReturnNew($p.render(source, context, directives));};
		
	$.fn.autoRender = function(context, directives, html){
		var replaced = this[0];
		directives = directives || false;
		html = html || false;
		if (!html && directives && directives.jquery || directives.nodeType) { //template is provided instead of directives
			html = directives[0] || directives; //ok for jQuery obj or html node
			directives = false;}
		var source = html ? html : replaced;//if no target, self replace
		return this.replaceWithAndReturnNew( $p.autoRender(source, context, directives));}}

}catch(e){ try{ if (DOMAssistant) {
	DOMAssistant.pure = function () {
		return {
			publicMethods : [
				'mapDirective',
				'compile',
				'render',
				'autoRender',
				'$pMap',
				'$pCompile',
				'$pRender'
			],
			
			init : function () {
				$p.find = function (selector, context) {
					var found = $(context).cssSelect(selector);
					return found[0] || false;
				};
			},
			
			mapDirective : function (directives) {
				return $($p.map(directives, this));
			},

			compile : function (fName, directives, context) {
				if (directives) $p.map(directives, this, true);
				if (context) (this[0] || this).setAttribute($p.ns + 'autoRender', 'true');
				$p.compile(this, fName, context || false, false);
				return this;
			},

			render : function (context, directives, html) {
				if (typeof directives === 'string') { // a compiled template is passed
					html = directives;
					directives = false;
				}
				var source = html || this[0] || this;
				return $(this).replace($p.render(source, context, directives), true);
			},

			autoRender : function (context, directives, html) {
				directives = directives || false;
				html = html || false;
				if (!html && directives && directives.cssSelect || directives.nodeType) {
					html = directives[0] || directives;
					directives = false;}
				var source = html || this[0] || this;
				return $(this).replace($p.autoRender(source, context, directives), true);
			}
		};	
	}();
	DOMAssistant.attach(DOMAssistant.pure);}
}catch(e){ try{ if (MooTools){}
}catch(e){ try{ if (Prototype){}
}catch(e){}}}}
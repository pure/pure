/* * * * * * * * * * * * * * * * * * * * * * * * * *

    PURE Unobtrusive Rendering Engine for HTML

    Licensed under the MIT licenses.
    More information at: http://www.opensource.org

    Copyright (c) 2008 Michael Cvilic - BeeBole.com

    version: 1.4

* * * * * * * * * * * * * * * * * * * * * * * * * */

var pure  = window.$p = window.pure ={
	ns: (/MSIE/.test(navigator.userAgent))? 'pure_':'pure:', //IE namespace :(
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

	$f:[],

	$c:function(context, path){
	if(!context) context ={};
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
			var mapped = (directives)? this.map(directives, html):html.cloneNode(true);
			fn = this.compiledFunctions.length || 0;
			this.compile(mapped, fn, context, false);}
		else{ // call to an already compiled f()
			fn = html;}
		if (this.compiledFunctions[fn]){
			return this.compiledFunctions[fn].compiled(context);} //transform and return an html string
		else{
			this.msg('HTML_does_not_exist', fName);}},

	autoRenderAtt: (/MSIE/.test(navigator.userAgent))? 'className':'class',
	autoRender:function(html, context, directives){
		if (typeof html != 'string') {
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
			var replaced, replacer, replacedSrc, nodeValueSrc, toMap, k, j, i, att, repeatPrefix, prop, attValue;
			if (autoRender == 'true') {
				attValue = n.getAttribute(autoRenderAtt);
				if (attValue) {
					toMap = attValue.replace(/^\d|\s\d/g,'').split(/\s+/);//remove numeric classes as they mess up the array reference
					for (j = 0; j < toMap.length; j++) {
						repeatPrefix = '';
						att = toMap[j].split(/@/);
						prop = context[att[0]];
						if(!prop){
							if (openArray.length > 0) {
								for (k = 0; k < openArray.length; k++) {
									prop = (openArray[k] == 'context')?context[0][att[0]]:context[openArray[k]][0][att[0]];
									if (prop) {//found a repetition field, break
										repeatPrefix = openArray[k];
										break;}
									else if (/context/i.test(att[0])){ //check if not root context field
										prop = true; 
										j=100;}}}
							else if (/context/i.test(att[0])){ //check if repeat on the context
								prop = context;}}
							
						if (prop) {
							if (typeof prop.length === 'number' && !(prop.propertyIsEnumerable('length')) && typeof prop.splice === 'function') { //Douglas Crockford check if array
								openArray.push(att[0]);
								n.setAttribute(ns + 'repeat', att[0] + '<-' + att[0]);}
							else {
								if (att[1]) {
									try {
										n.removeAttribute(att[1]);} 
									catch (e) {}}
								else {
									att.push('nodeValue')};
								if (!n.getAttribute(ns + att[1])) {
									(repeatPrefix == '') ? n.setAttribute(ns + att[1], att[0]) : n.setAttribute(ns + att[1], repeatPrefix + '.' + att[0]);}}}}
					var fixAtt =  (/MSIE/.test(navigator.userAgent) &&  autoRenderAtt == 'className')? 'class':autoRenderAtt;
					if (/\|(a|p)\|/.test(n.getAttribute(ns + fixAtt))) n.removeAttribute(autoRenderAtt);
				}}
			//flag the nodeValue and repeat attributes
			var isNodeValue = n.getAttribute(ns+'nodeValue');
			if (isNodeValue) this.nodeValues.push(n);
			var isRepeat = n.getAttribute(ns+'repeat');
			if (isRepeat) this.repeats.push(n);},

		nodeWalk:function(node, ns, context, autoRenderAtt){
			this.repeats = []; this.nodeValues = [];
			var autoRender = node.getAttribute(ns + 'autoRender');
			node.removeAttribute(ns + 'autoRender');
			var openArray=[];
			//memory safe tree traverse
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
			var replaced, replacer, replacedSrc, nodeValueSrc;
			for (var j = 0; j < this.nodeValues.length; j++) {
				try {
					n = this.nodeValues[j];
					nodeValueSrc = n.getAttribute(nodeValueAtt); // put the node value in place
					if (nodeValueSrc) {
						n.innerHTML = nodeValueAtt + '="' + nodeValueSrc + '"';
						n.removeAttribute(nodeValueAtt);}} 
				catch (e) {}}
			for(var i=0; i<this.repeats.length;i++){
				n = this.repeats[this.repeats.length -i -1];//go inside out of the tree
				try {
					replacedSrc = n.getAttribute(repeatAtt); //wrap in tags for easy string find
					if (replacedSrc) {
						replaced = n.cloneNode(true);
						replaced.removeAttribute(repeatAtt);
						replacer = document.createElement(repeatAtt);
						replacer.appendChild(replaced);
						replacer.setAttribute('source', "" + replacedSrc);
						n.parentNode.replaceChild(replacer, n);}}
				catch (e) {}}},

		out:function(content){ return ['output.push(', content, ');'].join('')},
		strOut:function (content){ return ['output.push(', "'", content, "');"].join('')},
		outputFn:function (attValue, currentLoop){ return this.out(attValue + '(context,' + currentLoop + ',parseInt(' + currentLoop + 'Index))')},
		contextOut:function(path){ return ['output.push($p.$c(context, ', path, '));'].join('')},

		isArray:function (attValue, openArrays){ //check if it is an array reference either [] or an open loop
			var arrIndex = /\[[^\]]*]/.test(attValue);
			var objProp  = attValue.replace(/(")|(')/g,'').split(/\./);
			return (arrIndex || openArrays[objProp[0]]) ? true: false;},

		arrayName:function(pName){
			var name=pName.match(/\w*/)[0] || ''; 
			var subIndex= pName.substring(name.length).replace(/\[\s*]/,''); // take the tail and replace [ ] by ''
			return name + '[' + name + 'Index]' + subIndex;}},

	compile: function(HTML, fName, context, noEval){
		//DOM is slow, innerHTML is fast -> compile. Once browsers will be ok, no compilation will be needed anymore
		var clone = (HTML[0])? HTML[0].cloneNode(true) : HTML.cloneNode(true);
		
		//node manipulation before conversion to string
		var ns = this.ns;
		this.utils.nodeWalk(clone, ns, context, this.autoRenderAtt);
		
		//convert the HTML to a string
		var str = this.outerHTML( clone );
		//avoid shifting lines remove the > and </ around pure:repeat tags
	    str = str.replace(new RegExp('\<\/?:?'+ns+'repeat', 'gi'), ns+'repeat');// :? -> from bug in IE
		
		//clean the dom string, based on rules in $p.domCleaningRules
		var rules = this.domCleaningRules;
		for(i in rules){
		str = str.replace(rules[i].what ,rules[i].by);}
		
		if(!fName && typeof fName != 'number'){
			this.msg( 'no_HTML_name_set_for_parsing', str, HTML);
			return false}
		//start the js generation
		this.compiledFunctions[fName]={}; //clean the fct place if any
		var aJS = [[ '$p.compiledFunctions["', fName, '"].compiled = function(context){var output = [];' ].join('')];
		var aDom = str.split(ns);

		var wrkStr, rTag = false, rSrc, openArrays=[], cnt=1, subSrc='', currentLoop, isNodeValue, offset, isStr = false, attName = '', attValue = '';
		for(var j = 0;j < aDom.length; j++){
			wrkStr = aDom[j];
			if (j==0){
				//push the first line as it is HTML
				aJS.push(this.utils.strOut(wrkStr.substring(0, wrkStr.length)));}
			else{
				if (/^repeat[^\>]*\>/i.test(wrkStr)){
					rTag = wrkStr.match(/^repeat[^\>]*>/i);
					rSrc = rTag[0].match(/"[^"]*"/);
					if (rSrc){ //start a loop
						rSrc = rSrc[0].replace(/&lt;/,'<').replace(/"/g,'').replace(/\s/g,'');
						subSrc = rSrc.split(/\<-/);
						currentLoop = subSrc[0];
						var arrSrc = subSrc[1] || '';
						if ( this.utils.isArray(arrSrc, openArrays) ){
							//reference to an open array
							aJS.push('var ' + currentLoop + '=' + this.utils.arrayName(arrSrc) + ';');}
						else{
							if (arrSrc.search(/context/i) > -1 || arrSrc.length == 0)
								aJS.push('var ' + currentLoop + '= context;');
							else 
								aJS.push('var ' + currentLoop + '= $p.$c(context, "' + arrSrc + '");');}
						
						aJS.push('for('+currentLoop+'Index in '+currentLoop+'){');
						aJS.push(this.utils.strOut(wrkStr.substring(rTag[0].length)));
						openArrays[currentLoop] = cnt++;}
				
					else{ //end of loop;
						aJS.push('}');
						delete openArrays[currentLoop];
						var max = 0, curr, key;
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
					isStr = /^("|'|&quot;)(.*)("|'|&quot;)/.test(attValue);
					if (/&quot;/.test(attValue)) {
						attValue = attValue.replace(/&quot;/g, '"');
						wrkStr = wrkStr.replace(/&quot;/, '"').replace(/&quot;/, '"')}

					isNodeValue = /^nodeValue/i.test(wrkStr);	
					(isNodeValue) ? attName = 'nodeValue': aJS.push(this.utils.strOut(attName + '="'));

					var attOut = attValue.match(/\|(a|p)\|/);
					var suffix = false; 
					var spc = (isNodeValue)?'':' ';
					if (attOut) {
						if(attOut[1] =='a') 
							aJS.push(this.utils.strOut(attValue.substring(0, attOut.index)+spc));
						else // |p|
							suffix = attValue.substring(0, attOut.index);
						attValue = attValue.substring(attOut.index + 3);}

					if(/\$f\[([0-9]+)]/.test(attValue)){ //function reference
						var fnId = attValue.match(/\[([0-9]+)/)[1];
						this.compiledFunctions[fName]['$f'+fnId]=this.$f[fnId];
						this.$f.splice(fnId,1);
						aJS.push(this.utils.outputFn('this.$f'+fnId, currentLoop));}
						
					else if(isStr){ //a string, strip the quotes
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
		var js = aJS.join('');
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

	map:function(directives, HTML, noClone){
		// a directive is a tuple{ dom selector, value }
		// returns the HTML with the directives as pure:<attr>="..."
		if(!HTML[0] && HTML.length == 0){
			this.msg('no_template_found');
			return false;}

		var fnId, multipleDir=[], currentDir, autoRenderAtt = this.autoRenderAtt;

		var clone;
		if (noClone){
			clone = (HTML[0])? HTML[0] : HTML;}
		else{
			clone = (HTML[0])? HTML[0].cloneNode(true) : HTML.cloneNode(true);}
			
		for (var selector in directives){ // for each directive set the corresponding pure:<attr>
			currentDir = directives[selector];
			if(this.utils.isTypeOfArray(currentDir)){//check if an array of directives is provided
				multipleDir = currentDir;}
			else{
				multipleDir = []; 
				multipleDir.push(currentDir);}
			for(var i = 0; i<multipleDir.length;i++){
				currentDir = multipleDir[i];
				var prepend, append;
				if( prepend = /^\+/.test(selector)){
					selector = selector.substring(1, selector.length)};
				if(append = /\+$/.test(selector)){
					selector = selector.substring(0,selector.length-1)};

				var isAttr = selector.match(/\[[^\]]*\]/); // match a [...]
				if(/^\[/.test(selector)){ //attribute of the selected node
					target = clone;}
				else{
					var target = this.find(selector, clone);
					if (!target && isAttr){
						//if the attribute does not exist yet, select its containing element
						target = this.find(selector.substr(0, isAttr.index), clone);}}

				if ( target ){  //target found
					if (typeof currentDir == 'function'){
						fnId = this.$f.push(currentDir) -1;
						currentDir = '$f['+fnId+']';}

					var attName = 'nodeValue'; //default
					var repetition = -1, ns = this.ns;
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
					var fixAtt = (/MSIE/.test(navigator.userAgent) && attName == 'class')? 'className':attName;
					var original = target.getAttribute(fixAtt);
					if(append && original){
						currentDir = original + '|a|' + currentDir;}
					else if(prepend && original){
						currentDir = original + '|p|' + currentDir;}

					target.setAttribute( ns + attName, currentDir);
					if(isAttr && attName != 'nodeValue' && repetition < 0 && !append && !prepend){
						try{ //some cross browser attributes issues -> try catch nothing
							target.removeAttribute(attName);}
						catch(e){}}}

				else{ // target not found
					var parentName = [clone.nodeName];
					if(clone.id != '') parentName.push('#' + clone.id);
					if(clone.className !='') parentName.push('#' + clone.className);
					this.msg( 'element_to_map_not_found', [selector, parentName.join('')], clone);}}}

		return clone;},

	messages:{
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
		var re = /&/;
		if(msg != msgId && msgParams){
			if (typeof msgParams == 'string'){
				msg = msg.replace(re, msgParams);}
			else{
				for(var i=0; i<msgParams.length;i++ ){
					msg = msg.replace(re, msgParams[i]);}}}

		var msgDiv = document.getElementById('pureMsg');
		if(msgDiv){
			msgDiv.innerHTML = [msg, '<br />', msgDiv.innerHTML].join('');}
			else{ alert(msg);}}};

try{ if (jQuery) {
	//patch jQuery to read namespaced attributes see Ticket #3023 and clean html
	jQuery.parse[0] = /^(\[) *@?([\w:-]+) *([!*$^~=]*) *('?"?)(.*?)\4 *\]/;
	$p.domCleaningRules.push({ what: /\s?jQuery[^\s]+\=\"[^\"]+\"/gi, by: ''});
	$p.find = function(selector, context){
		var found = jQuery.find(selector, context);
		return (found[0]) ? found[0] : false;};
	// jQuery chaining functions
	$.fn.$pMap = function(directives){
		return $($p.map(directives, $(this)));};
	$.fn.$pCompile = function(fName, noEval){
		return $p.compile($(this), fName, false, noEval);};
	$.fn.$pRender =$.fn.render = function(context, directives, html){
		var source = (html) ? html : $(this)[0];
		return $(this).replaceWith($p.autoRender(source, context, directives));};
		
	$.fn.autoRender = function(context, directives, html){
		directives = directives || false;
		html = html || false;
		if (!html && directives && directives.jquery || directives.nodeType) { //template is provided instead of directives
			html = directives[0] || directives; //ok for jQuery obj or html node
			directives = false;}
		var source = (html) ? html : $(this)[0];//if no target, self replace
		return $(this).replaceWith($p.autoRender(source, context, directives));}}

}catch(e){ try{ if (MooTools){
	// not implemented - please collaborate with us to make it working
	$p.find = function(selector, context){
		var found = $(context).getElements(selector);
		return (found[0]) ? found[0]:false}}

}catch(e){ try{ if (Prototype){
	// not implemented - please collaborate with us to make it working
	function $$(){
		//make the $$ use another context than document if provided as first parameter(not working...)
		var args = $A(arguments);
		var context = args[0];
		(typeof context == 'string') ? context = document : args.splice(0,1);
		return Selector.findChildElements(context, args);};

	$p.find = function(selector, context){
		var found = $$(context, selector);
		return (found[0]) ? found[0]:false}}}catch(e){}}}
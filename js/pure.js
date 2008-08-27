/* * * * * * * * * * * * * * * * * * * * * * * * * *

    PURE Unobtrusive Rendering Engine for HTML

    Licensed under the MIT licenses.
    More information at: http://www.opensource.org

    Copyright (c) 2008 Michael Cvilic - BeeBole.com

    version: 1.3

* * * * * * * * * * * * * * * * * * * * * * * * * */

var pure  = window.$p = window.pure = {
    ns: 'pure:',
    find: function(){
		pure.msg('library_needed')},
		
    getRuntime: function(){
		//build the runtime to be exported as a JS file
		var src = ['var pure =window.$p = window.pure = {', '$c:', this.$c.toString(), ',', 'render:', this.render.toString(), ',', 'compiledFunctions:[]};'];
		for (fName in this.compiledFunctions) {
			var htmlFunction = '$p.compiledFunctions[\'' + fName + '\']';
			src.push(htmlFunction+'={};'+htmlFunction+'.compiled=');
			src.push(this.compiledFunctions[fName].compiled.toString()+';');
		}
		var runtime = src.join('');
		var txt = document.getElementById('pureRuntime');
		if (txt) {
			txt.value = runtime;
			txt.select();}
		else{
			txt = document.createElement('TEXTAREA');
			txt.value = runtime;
			txt.id = 'pureRuntime';
			document.body.appendChild(txt);
			txt.select();}},
			
	$c:function(context, path){
  		if(!context) context = {};
        if(typeof context == 'object'){
            //context is a JSON
            var aPath = path.split(/\./);
			var value = context[aPath[0]];
			if(value == 'undefined') value = window[aPath[0]];
			
            for (var i=1; i<aPath.length; i++){
				if (!value) {
					i = aPath.length;
					continue;}
					
                value = value[aPath[i]];}
				
//      //TODO: XPath if xml context
//      }else if(typeof context ~~ 'xml'){

        }
        if (!value && value!=0)
            value = '""';
        return value;
    },

    render: function(fName, context, target) {
        // apply the HTML to the context and return the innerHTML string
        if (typeof fName != 'string'){
			//an HTML element is passed to render, so first compile it
            var HTML = fName;
            fName = this.compiledFunctions.length || 0;
            this.compile(HTML, fName);
        }
        if(this.compiledFunctions[fName]){
            var str = this.compiledFunctions[fName].compiled(context);
            if(target) target.innerHTML = str;
			//if temp compilation delete it
			if(HTML) delete this.compiledFunctions[fName];
            return str;}
        else{
            pure.msg('HTML_does_not_exist', fName);
        }
    },

    compiledFunctions:{},
    domCleaningRules:[
        //put all absolute links( img.src ) of window.location relative to the root
        {what:new RegExp(window.location.toString().substring(0, window.location.toString().indexOf(window.location.pathname)), 'g'), by:''},
        //remove spaces between >..< (IE 6)
        {what:/\>\s+\</g, by:'><'}, 
        //clean leading white spaces in the html
        {what:/^\s+/, by:''},
		//may be too strong check with and pre, textarea,...
        {what:/\n/g, by:''},
        //remove pure ns (IE)
        {what:/\<\?xml:namespace[^>]*beebole[^\>]*\>/gi, by:''}],

    compile: function(HTML, fName, noEval){
        // Why compiling instead of DOM ?
        // 1) innerHTML is way faster than DOM manipulation on today's browser
        // 2) once the compiledFunctions are compiled they can be collected, gzipped in a single js file, then cached by the browser

        function out(content) { return ['output.push(', content, ');'].join('')};
        function strOut(content) { return ['output.push(', "'", content, "');"].join('')};
		function outputFn(attValue, currentLoop){ return out(attValue.substring(1, attValue.length - 1) + '(context,' + currentLoop + ',parseInt(' + currentLoop + 'Index))')};
        function contextOut(path){ return ['output.push(pure.$c(context, ', path, '));'].join('')};
        function att2node(obj, ns){
            // find on [pure:repeat] alone does not work, so look all nodes and filter
            var allNodes = obj.getElementsByTagName('*');
            var repeats = [], node;
			var repeatAtt = ns+'repeat';
			var nodeValueAtt = ns+'nodeValue';
            var replaced, replacer, replacedSrc, nodeValueSrc;
            for (var i = 0; i<allNodes.length;i++){
                try{
                    node = allNodes[i];
                    replacedSrc = node.getAttribute(repeatAtt); //wrap to find the end easily
                    if (replacedSrc) {
                        replaced = node.cloneNode(true);
                        replaced.removeAttribute(repeatAtt);
                        replacer = document.createElement(repeatAtt);
                        replacer.appendChild(replaced);
                        replacer.setAttribute( 'source', "" + replacedSrc);
                        node.parentNode.replaceChild(replacer, node);}
                    nodeValueSrc = node.getAttribute(nodeValueAtt); // put the node value in place
                    if (nodeValueSrc){
                        node.innerHTML = nodeValueAtt+'="'+nodeValueSrc+'"';
                        node.removeAttribute(nodeValueAtt);}
                }catch(e){}}}
                
		function arrayName(pName){
			var name=pName, subIndex='';
			var pos = pName.indexOf('[');
			if (pos > -1){
				name = pName.substring(0, pos);
				subIndex = pName.substring(pos);
				if (subIndex == '[]') subIndex = '';}
				
			return name + '[' + name + 'Index]' + subIndex;}
				
        //convert to string, clean the HTML and convert to a js function
        var clone = (HTML[0])? HTML[0].cloneNode(true) : HTML.cloneNode(true);

        //convert pure:repeat attributes in nodes for easy split
        att2node(clone, this.ns);

        //convert the HTML to a string
        var str = this.outerHTML( clone );
        //avoid shifting lines remove the > and </ around pure:repeat tags
        str = str.replace(/\<pure:repeat/gi, 'pure:repeat').replace(/\<\/pure:repeat/gi, 'pure:repeat');

        //clean the dom string, based on rules in pure.domCleaningRules
        var rules = this.domCleaningRules;
        for(i in rules){
            str = str.replace(rules[i].what ,rules[i].by);}

        if(!fName && typeof fName != 'number'){
	        this.msg( 'no_HTML_name_set_for_parsing', str, HTML);
	        return false}
        //start the js generation
        var aJS = [[ 'pure.compiledFunctions["', fName, '"]={};pure.compiledFunctions["', fName, '"].compiled = function(context){var output = [];' ].join('')];
        var aDom = str.split('pure:');
        var pos = 0, wrkStr, rTag = false, rSrc, next, openArrays=[], cnt=1, subSrc='', currentLoop, swap='';
        for(var j = 0;j < aDom.length; j++){
            wrkStr = aDom[j];
            if (wrkStr.match(/^repeat[^\>]*\>/i)){
                rTag = wrkStr.match(/^repeat[^\>]*>/i);
                rSrc = rTag[0].match(/"[^"]*"/);
                if (rSrc){
					//some browsers replace the < by &lt; replace it and strip spaces
                    rSrc = rSrc[0].replace(/&lt;/,'<').replace(/"/g,'').replace(/\s/g,'');
                    subSrc = rSrc.split(/\<-/);
					currentLoop = subSrc[0];
					var arrSrc = subSrc[1] || '';
                    if (arrSrc.indexOf('[') > -1) {
						//reference to an open array
						aJS.push('var ' + currentLoop + '=' + arrayName(arrSrc) + ';');}
					else{
						if (arrSrc.search(/context/i) > -1 || arrSrc.length == 0)
							aJS.push('var ' + currentLoop + '= context;');
						else 
							aJS.push('var ' + currentLoop + '= pure.$c(context, "' + arrSrc + '");');}

                    aJS.push('for('+currentLoop+'Index in '+currentLoop+'){');
                    aJS.push(strOut(wrkStr.substring(rTag[0].length)));
                    openArrays[currentLoop] = cnt++;}

                else{
                    //end of loop;
                    aJS.push('}');
                    delete openArrays[currentLoop];
                    var max = 0, curr, key;
                    for (key in openArrays){
                        curr = openArrays[key];
                        if( curr > max) {
                            max = curr;
                            currentLoop = key;}
                    }
                    aJS.push(strOut(wrkStr.substring(rTag[0].length, wrkStr.length)));
                }
                rTag = false;
                continue; }

            if (j==0){
                //push the first line as it is HTML
                aJS.push(strOut(wrkStr.substring(0, wrkStr.length)));}
            else{
                //find the first abc="def"
                var attr = wrkStr.match(/[^=]*="[^"]*"/)[0] || false;
                //check if the value is a string to avoid context overhead process
                var isStr = attr.search(/(=\s*\"'|=\s*'\"|=\s*\"\s*&quot;)/) || false;
                //look for the name of the attribute
                var attName = attr.match(/[^=]*/)[0] || false;
                //look for the value of the atttribute
                var attValue = attr.match(/"[^"]*"/)[0] || false;
                //check if it is a function call: assume abc(...) or (...) is a function
                var isFn = attValue.search(/[^\s]*\(|^\(/);
                //prepare array directive
                var isArrayRef = false;

                if (isFn > -1) {
					attValue = attValue.replace(/&quot;/g, "'");}
				else{ //not a function try if an array
					var arrIndex = attValue.match(/\[[^\]]*]/);
					if(arrIndex || openArrays[attValue.substring(1,attValue.length-1)]){ // "[0-9]" or "[a-Z]" or current loop ok
						//should be a reference to an open loop
						attValue = arrayName(attValue.substring(1,attValue.length-1));
						isArrayRef = true}
					else{
						isArrayRef=false;}}

				if (isStr > -1){
					attValue = attValue.replace(/(^\"&quot;|&quot;\"\Z)/g, "'");
					attValue = '"'+attValue.substring( 2, attValue.length-2 )+'"'}

				var pos = 0;
				if ( attName.search(/nodeValue/i) > -1 ){
					var attrRight = wrkStr.substring(attr.length);
					//do not read context if string, function or array reference
					if( isFn > -1){
						aJS.push(outputFn(attValue, currentLoop))}
					else if (isStr > -1 || isArrayRef){
						aJS.push(out(attValue));}
					else{
						aJS.push(contextOut(attValue));}

					aJS.push(strOut(attrRight));}
				else{
					if (isStr > -1) { //a string leave it as is
						aJS.push(strOut(attName + '=' + attValue));
					}
					else {
						aJS.push(strOut(attName + '='));
						if (isFn > -1){ //a function remove the quotes for evaluation
							aJS.push(strOut('"') + outputFn(attValue, currentLoop) + strOut('"'));}
						else if(isArrayRef){//an array reference
							aJS.push(strOut('"')+out(attValue)+strOut('"'));}
						else //context data
                            aJS.push(contextOut(attValue));}
                    //push the after attribute string
                    aJS.push(strOut(wrkStr.substr(attr.length, wrkStr.length)));}}}

        aJS.push( 'return output.join("");}' );
        var js = aJS.join('');

        if(!noEval){
            try {
                eval(js);
                this.mergeContext( clone, {fName:fName});
            } catch (e) {
	            this.msg('parsing_error', [e.message, js]);
	            return false;}}
        return js;},

    outerHTML:function(elm){
        // cross browser outerHTML
        return elm.outerHTML || (function(){
            var div = document.createElement('div');
            div.appendChild(elm);
            return div.innerHTML;})();},

    map:function(directives, HTML){
        // apply the directive to the HTML for parsing
        // a directive is a tuple { dom selector, value }
        // returns the HTML with the directives as pure:<attr>="..."
		if(!HTML[0] && HTML.length == 0) {
			this.msg('no_template_found');
			return false;
		};
        var clone = (HTML[0])? HTML[0].cloneNode(true) : HTML.cloneNode(true);
		for (var selector in directives){ // for each directive set the corresponding pure:<attr>
			var currentDir = directives[selector];

			//if a function is provided transform it to a string if anonymous, otherwise get the string of the call and wrap it in an anonymous call
			if(typeof currentDir == 'function'){ 
				var dirStr = directives.toString().replace(/\t|\n|\r/g,'');
				currentDir = directives[selector] = currentDir.toString().replace(/\t|\n|\r/g,'');
				var fname=/\W*function\s+([\w\$]+)\(/i.exec(currentDir);//Tx2 Geoffrey Summerhayes
				if(fname)
					currentDir = 'function(context, items, pos){ return ' + fname[1] + '(context, items, pos)}';}

			var target = this.find(selector, clone);
	        var isAttr = selector.match(/\[[^\]]*\]/); // match a [...]
	        if (!target && isAttr){
	            //if the attribute does not exist yet, select its containing element
	            target = this.find(selector.substr(0, isAttr.index), clone);}
				
	        if ( target ){  //target found
				var attName = 'nodeValue'; //default
				if (isAttr){
					//the directive points to an attribute
					attName = selector.substring(isAttr.index+1,isAttr[0].length+isAttr.index-1);
					if(attName.indexOf(this.ns) > -1) 
						attName = attName.substring(this.ns.length);}
				else{
					//check if the directive is a repetition
					var repetition = currentDir.search(/w*<-w*/);
					if(repetition > -1) attName = 'repeat';}
					
				target.setAttribute( this.ns + attName, currentDir);
                if(repetition < 0){
					if(isAttr && attName != 'nodeValue'){
						try{ //some special attributes do not like it so try & catch
							target[attName]=''; //IE
							target.removeAttribute(attName);}
						catch(e){}}}}
					
	        else{ // target not found
				var parentName = [clone.nodeName];
				if(clone.id != '') parentName.push('#' + clone.id);
				if(clone.className !='') parentName.push('#' + clone.className);
				pure.msg( 'element_to_map_not_found', [selector, parentName.join('')], clone);}}

		//target = null;
		return clone;},

    merge:function merge(target, source){
    //merge the obj source and target, target is overwritten
      for (var key in source){
        var s = source[key];
        var t = target[key];
        if (typeof s == 'object') target[key] = merge(t, s);}
      return target;},

    mergeContext:function(HTML, context){
        // extend the context attribute of the nearest parent having
        // a context by the one provided as parameter
        // useful for setting default parameters

        var found = false;
        var parent = HTML;
        while(parent.parentNode && !found && parent.parentNode.nodeName != 'BODY'){
            parent = parent.parentNode;
            if (parent[this.ns+'context']) found = true;}

        if(found)
            $.extend(parent[this.ns+'context'], context);
        else
            HTML[this.ns+'context'] = context;

        parent = null;
        return HTML;},

    messages:{
        'element_to_map_not_found':"PURE - Cannot map the element \"&\" in \"&\"",
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
            msg = msg.replace(re, msgParams);
          }else{
	        for(var i=0; i<msgParams.length;i++ ){
                msg = msg.replace(re, msgParams[i]);}}}

        var msgDiv = document.getElementById('pureMsg');
        if(msgDiv){
          msgDiv.innerHTML = [msg, '<br />', msgDiv.innerHTML].join('');
        }else{
          alert(msg);}}};

try{
    if (jQuery) {
		//patch jQuery to read namespaced attributes see Ticket #3023 and clean html
        jQuery.parse[0] = /^(\[) *@?([\w:-]+) *([!*$^~=]*) *('?"?)(.*?)\4 *\]/;
        $p.domCleaningRules.push( {what:/\s?jQuery[^\s]+\=\"[^\"]+\"/gi, by:''});
        $p.find = function(selector, context){
            var found = jQuery.find(selector, context);
            return (found[0]) ? found[0]:false}}

    // jQuery chaining functions
    $.fn.$pMap = function(directives) {
      return $($p.map(directives, $(this)));};

    $.fn.$pMergeContext = function(context) {
      return $p.mergeContext($(this), context);};

    $.fn.$pCompile = function(fName, noEval) {
      return $p.compile($(this), fName, noEval);};

    $.fn.$pRender = function(context, target) {
      return $p.render($(this), context, target);
}

}catch(e){ try{
    if (MooTools){
        // mootools selector
        pure.find = function(selector, context){
        var found = $(context).getElements(selector);
        return (found[0]) ? found[0]:false}}

}catch(e){ try{
    if (Prototype){
        function $$() {
            //make the $$ use another context than document if provided as first parameter
            var args = $A(arguments);
            var context = args[0];
            (typeof context == 'string') ? context = document : args.splice(0,1);
            return Selector.findChildElements(context, args);
        }
        pure.find = function(selector, context){
            var found = $$(context, selector);
            return (found[0]) ? found[0]:false}}
    }catch(e){}}}


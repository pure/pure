/* * * * * * * * * * * * * * * * * * * * * *
 *     E X A M P L E      1 
 * * * * * * * * * * * * * * * * * * * * * */			
	function render1(){
		$('#hello').autoRender({ "who": "Mary" });}

	/* Note: 
	  All the notation below are possible with different results:				

		a) as above. replacing the html by itself transformed with the data
			$('#hello').autoRender({ "who": "Mary" })

		b) replacing the target by the html transformed
			$('#hello').autoRender({ "who": "Mary" }, $('#target1'));
		
		
		c) Replacing the content of a target
			$('#target1').html( $p.autoRender($('#hello')[0], { "who": "Mary" }));


		d) same as c) but without js framework (jQuery)
			var target = document.getElementById('target1'); 
			var html = document.getElementById('hello');
			var data = { "who": "Mary" };
			target.innerHTML = $p.autoRender( html, data );
	*/


/* * * * * * * * * * * * * * * * * * * * * *
 *     E X A M P L E      2 
 * * * * * * * * * * * * * * * * * * * * * */			
	function render2(){
		var context = ["Alice Keasler", "Charles LeGrand", "Gary Bitemning", "Helen Moren"];
		$('table.players.1').autoRender(context);}

/* * * * * * * * * * * * * * * * * * * * * *
 *     E X A M P L E      3 
 * * * * * * * * * * * * * * * * * * * * * */			
	function render3(){
		var context = {
			"id": "3456",
			sites: [{ 
				"name": "Beebole","url": "http://beebole.com"}, {
				"name": "BeeLit", "url": "http://beeLit.com"}, {
				"name": "PURE",	  "url": "http://beebole.com/pure"}]};
		
		$('ol.teamList').autoRender( context);}

	/* Note: 
	 	to access the attributes of the root of the html use a directive as above for the id.
		Only the name of the attribute is provided between brackets
		For auto-rendering use the @ symbol as: property@attribute
		i.e: url@href
	*/

/* * * * * * * * * * * * * * * * * * * * * *
 *     E X A M P L E      4 
 * * * * * * * * * * * * * * * * * * * * * */			
	function swapStyle(obj, inOut){
		obj.className = (inOut) ? 'player hover' : 'player';};
 
	function clickLine(obj){ 
		alert(obj.innerHTML)};

	function render4(button){
		// simulate a ajax-jsonp call, that will load here a static js, and call the example4CallBack function
		button.value = 'loading data...';
		var script = (button.id == 'b4_2') ? 'js/jsonBig.js':'js/jsonSmall.js';
		$.getJSON(script, function(context){

			var directive = {
			'tbody tr td[onclick]':'"clickLine(this)"',
			'tbody tr td[onmouseover]': '"swapStyle(this, true);"', 
			'tbody tr td[onmouseout]' : '"swapStyle(this, false);"',
			'tbody tr td[style]':'\'cursor:pointer\'',
			
			'tbody tr[class]': 
				function(context, items, pos){
					var oddEven =  (pos % 2 == 0) ? 'even' : 'odd';
					var firstLast = (pos == 0) ? 'first': (pos == items.length -1) ? 'last':'';
					return oddEven + ' ' + firstLast; }}
	
			$('table.players.2').autoRender(context, directive);
	
			button.value = 'Refresh the page to render again.';});}

	/*Note: 
		by default a directive replace the content of the selected node or attribute
		If an append or prepend is necessary we use +
		+<selector> means prepend the directive to the existing selected content
		<selector>+ means append the directive to the existing selected content

		Here as well is an example of attaching events to the HTML.
		Not sure if there is another way of passing such objects to the transformation.
		It has de advantage of not having to parse again the html to attach events after the transformation.
	 */

/* * * * * * * * * * * * * * * * * * * * * *
 *     E X A M P L E      5 
 * * * * * * * * * * * * * * * * * * * * * */			
	var row = {
		odd: 'odd',
		even:'even',
		decorator: function(context, items, pos){
			return (pos % 2 == 1) ? this.even : this.odd;}}
			
	function lineNb(context, items, pos){
		return pos+1;}

	function render5(){
		var context = {
			'list': [['Cats', 
						[["Alice Keasler", 14], ["Charles LeGrand", 13],["Gary Bitemning", 20],["Helen Moren", 5]]], 
					['Cows', 
						[["Mary Cain", 15], ["Vicky Benoit", 5], ["Wayne Dartt", 11]]],
					 ['Dogs', 
					 	[["Ray Braun", 13], ["Aaron Ben", 24], ["Steven Smith", 1], ["Kim Caffey", 19]]], 
					['Donkeys', 
						[["Natalie Kinney", 16], ["Caren Cohen", 3]]]]};
		
		var scoreBoard = $('table.scoreBoard').$pMap({
			'tbody tr': 'teams <- list',
			'td.teamName': 'teams[0]'
		});
		
		var teamList = $('table.teamList', scoreBoard)
			.$pMap({
				'tbody tr': 'player <- teams[1]',
				'td.player': 'player[0]',
				'td.score': 'player[1]',
				'td.position': lineNb, //passing the pointer of a function that does not use "this"
				'tbody tr[class]': function(context, items, pos){ return row.decorator(context, items, pos) } }); //show how to wrap a method and not breack the use of "this"
		
		$('td.teamPlace', scoreBoard).html(teamList); //place sub-template teamList in scoreBoard
		$p.compile(scoreBoard, 'f5'); //compile to a function
        $('div#render5').html( $p.render('f5', context) );} //place the result of the transformation to the innerHTML of div#render5

/* Note: 
	Here we compile the HTML to a function called f5.
	This function can then be saved in a js file(using the $p.getRuntime method)
	and called by the function render as above
*/

/* * * * * * * * * * * * * * * * * * * * * *
 *     E X A M P L E      6 
 * * * * * * * * * * * * * * * * * * * * * */			
	function render6(){
		var context = [ 
			{"name" : "Home", "url" : "#ho"}, 
			{"name" : "About", "url" : "http://about...", 
				"subMenu" : [
					{"name" : "History", "url" : "http://history..."},
					{"name" : "Team", "url" : "http://team..."},
					{"name" : "Offices", "url" : "http://offices...",
						"subMenu" : [
							{"name" : "Brussels", "url" : "http://brussels..."},
							{"name" : "New Delhi", "url" : "http://newdelhi..."}]}]},
	        {"name" : "Services", "url" : "http://services...",
				"subMenu" : [
					{"name" : "Web Design", "url" : "http://web..."},
					{"name" : "Development", "url" : "http://dev..."}]}];
	               
		var directive = {
			'li' : 'level1 <-',
			'a' : 'level1.name', 
			'a[href]' : 'level1.url',
			'ul.nav1 li' : 'level2 <- level1.subMenu',
				'ul.nav1 li a' : 'level2.name', 
				'ul.nav1 li a[href]' : 'level2.url',
					'ul.nav2 li' : [ 'level3 <- level2.subMenu', 'level3.name']};
		
		$('ul#nav').compile('f6', directive);
		$('ul#nav').render(context, 'f6');}
		
/*Note: 
	the last directive is an array instead of a string. This is useful
	when we want to set various directives on the same node.
*/


//nothing with PURE here, just some utility for this page
	function clickButton(obj, render){
		obj.disabled = true;
		obj.value = 'Refresh the page to render again.';
		if (arguments[2]) 
			$(arguments[2]).remove();
		if (/Firefox/i.test(navigator.userAgent)) 
			obj.type = 'submit';//to have buttons back when refreshing the page in FF
		render(obj);
	}

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
			"name": "BeeBuzz", "url": "http://beebole.com/blog"}, {
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
    timer.begin('loading data');
				var jsonSmall = ["Adrian Meador","Bryan O'Connor","Michèle Noïjû","تصبح عالميا مع يونيكود","Γέφυρα γρύλων","Chloé Ellemême","глобальных масштабах","יוצא לשוק העולמי","La \"volante\"","Todd Swift","Valerie Paige","Walter Hagelstein","Wendy Leatherbury"];
	var script = (button.id == 'b4_2') ? 'js/jsonBig.js':'js/jsonSmall.js';
	$(button).get(script, function(context) {
		timer.log('Rendering');
		context = eval(context);
		var directive = {
		'tbody tr td[onclick]':'"clickLine(this)"',
		'tbody tr td[onmouseover]': '"swapStyle(this, true);"', 
		'tbody tr td[onmouseout]' : '"swapStyle(this, false);"',
		'tbody tr td[style]':'\'cursor:pointer\'',
		
		'tbody tr[class]': 
			function(arg){
				var oddEven =  (arg.pos % 2 == 0) ? 'even' : 'odd';
				var firstLast = (arg.pos == 0) ? 'first': (arg.pos == arg.items.length -1) ? 'last':'';
				return oddEven + ' ' + firstLast; }
		};
		var p = $('table.players.2').first().parentNode;
		$('table.players.2').autoRender(context, directive);
		p.insertBefore(p.create('div', null, false, timer.end()), p.firstChild);
		button.value = 'Refresh the page to render again';
	});
}

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
	decorator: function(arg){
		return (arg.pos % 2 == 1) ? this.even : this.odd;}}
		
function lineNb(arg){
	return arg.pos+1;}

function render5(){
	var context = {
		'teams': [{
			'name':'Cats',
			'players':[	
				{"name":"Alice Keasler", "score":14}, 
				{"name":"Mary Cain", "score":15}, 
				{"name":"Vicky Benoit", "score":15}, 
				{"name":"Wayne Dartt", "score":11}]},{
			
			'name':'Dogs',
			'players': [
				{"name":"Ray Braun", "score":14}, 
				{"name":"Aaron Ben", "score":24}, 
				{"name":"Steven Smith", "score":1}, 
				{"name":"Kim Caffey", "score":19}]},{
			
			'name':'Mices',
			'players': [
				{"name":"Natalie Kinney", "score":16}, 
				{"name":"Caren Cohen", "score":3}]}]}

	var scoreBoard = $('table.scoreBoard').mapDirective({
		'tbody tr': 'team <- teams',
		'td.teamName': 'team.name'
	});
	
	var teamList = scoreBoard.cssSelect('table.teamList').first()
		.mapDirective({
			'tbody tr': 'player <- team.players',
			'td.player': 'player.name',
			'td.score': 'player.score',
			'td.position': lineNb, //passing the pointer of a function that does not use "this"
			'tbody tr[class]': function(arg){ return row.decorator(arg) } }); //show how to wrap a method and not breack the use of "this"
	
	scoreBoard.cssSelect('td.teamPlace').replaceContent(teamList); //place sub-template teamList in scoreBoard
	$p.compile(scoreBoard, 'f5'); //compile to a function
    $('div#render5').replaceContent($p.render('f5', context));} //place the result of the transformation to the innerHTML of div#render5

/* Note: 
	Here we compile the HTML to a function called f5.
	This function can then be saved in a js file(using the $p.getRuntime method)
	and called by the function render as above
*/

/* * * * * * * * * * * * * * * * * * * * * *
 *     E X A M P L E      6 
 * * * * * * * * * * * * * * * * * * * * * */			
function render6(){

	var context = {
		children: [{
			name:'Europe',
			children:[{
				name:'Belgium', 
				children:[{
					name:'Brussels'},{
					name:'Namur'},{
					name:'Antwerpen'}]},{
				name:'Germany'},{
				name:'UK'}
			]},{
			name:'America',
			children:[{
				name:'US',
				children:[{
					name:'Alabama'},{
					name:'Georgia'}
				]},{
					name:'Canada'},{
					name:'Argentina'}]},{
			name:'Asia'},{
			name:'Africa'},{
			name:'Antartica'}]};
	var directive = {
		'li+':function(arg){
			if(arg.item.children){
				return $p.compiledFunctions.tree.compiled(arg.item);}}};

	$('ul.treeItem').compile('tree', directive, context);
	$('ul.treeItem').render(context, 'tree');}
		
/*Note: 
	the last directive is an array instead of a string. This is useful
	when we want to set various directives on the same node.
*/


//nothing with PURE here, just some utility for this page
function clickButton(obj, render){
	obj.disabled = true;
	obj.value = 'Refresh the page to render again';
	if (arguments[2]) 
		$(arguments[2]).remove();
	if (/Firefox/i.test(navigator.userAgent)) 
		obj.type = 'submit';//to have buttons back when refreshing the page in FF
	render(obj);
}
var timer = {
	trace: [],
	begin:function(msg){
		this.start = 0;
		this.log(msg);},

	end: function(msg){
		this.log(msg||'end');
		if(!$p.compiledFunctions.timerTraceTable);
			$p.autoCompile($('table.timerTraceTable')[0], 'timerTraceTable', this.trace);
		return $p.render('timerTraceTable', this.trace);},

	log: function(msg){
		var now = function(){
			var now = new Date();
			return now.getTime();}
		
		if (this.start) 
			this.diff = now() - this.start;
		else {
			this.diff = 0;
			this.acc = 0;}
		this.acc += this.diff;
		this.start = now();
		if(this.trace[this.trace.length-1]) this.trace[this.trace.length-1].timerDuration = this.diff;
		this.trace.push({timerMsg:msg, timerDuration: 0, timerTime: this.acc});}}
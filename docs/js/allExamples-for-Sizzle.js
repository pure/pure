/* * * * * * * * * * * * * * * * * * * * * *
 *     E X A M P L E      1 
 * * * * * * * * * * * * * * * * * * * * * */			
function render1(){
	$p.sizzle('div#hello').autoRender({ "who": "Mary" });}


/* * * * * * * * * * * * * * * * * * * * * *
 *     E X A M P L E      2 
 * * * * * * * * * * * * * * * * * * * * * */			
function render2(){
	var context = ["Alice Keasler", "Charles LeGrand", "Gary Bitemning", "Helen Moren"];
	$p.sizzle('#players1').autoRender(context);}

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
	
	$p.sizzle('#siteList').autoRender(context);}

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
	var context = ["Adrian Meador","Bryan O'Connor","Michèle Noïjû","تصبح عالميا مع يونيكود","Γέφυρα γρύλων","Chloé Ellemême","глобальных масштабах","יוצא לשוק העולמי","La \"volante\"","Todd Swift","Valerie Paige","Walter Hagelstein","Wendy Leatherbury"];
	    timer.log('Rendering');
		var directive = {
			'tbody tr[class]': function(arg){
				//arg => {context:context, items:items, pos:pos, item:items[pos]};
				var oddEven = (arg.pos % 2 == 0) ? 'even' : 'odd';
				var firstLast = (arg.pos == 0) ? 'first' : (arg.pos == arg.items.length - 1) ? 'last' : '';
				return oddEven + ' ' + firstLast;},
			'tbody tr td[onclick]': "'clickLine(this)'", //show all differences of strings notationi "' '" '\'
			'tbody tr td[onmouseover]': '"swapStyle(this, true);"',
			'tbody tr td[onmouseout]': '\'swapStyle(this, false);\'',
			'tbody tr td[style]': "\'cursor:pointer\'"}

		$p.sizzle('table.players.2').autoRender(context, directive);
		
		$p.sizzle('div.timer')[0].innerHTML = timer.end();
		button.value = 'Refresh the page to render again';}

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
				{"first":"Alice","last":"Keasler", "score":14}, 
				{"first":"","name":"", "score":0},  //show an example of space and zero
				{"first":"Vicky","last":"Benoit", "score":15}, 
				{"first":"Wayne", "last":"Dartt", "score":11}]},{

			'name':'Dogs',
			'players': [
				{"first":"Ray","last":"Braun", "score":14}, 
				{"first":"Aaron","last":"Ben", "score":24}, 
				{"first":"Steven","last":"Smith", "score":1}, 
				{"first":"Kim", "last":"Caffey", "score":19}]},{

			'name':'Mices',
			'players': [
				{"first":"Natalie","last":"Kinney", "score":16}, 
				{"first":"Caren","last":"Cohen", "score":3}]}]}

	var scoreBoard = $p.sizzle('table.scoreBoard').mapDirective({
		'tbody tr': 'team <- teams',
		'td.teamName': 'team.name'});

	var teamList = $p.sizzle('table.teamList', scoreBoard[0])
		.mapDirective({
			'tbody tr': 'player <- team.players',
			'td.player': '#{player.first} (#{player.last})',
			'td.score': 'player.score',
			'td.position+': lineNb, //passing the pointer of a function that does not use "this"
			'tbody tr[class]+': function(arg){ return row.decorator(arg) } }); //show how to wrap a method and not breack the use of "this"

	$p.sizzle('td.teamPlace', scoreBoard[0])[0].innerHTML = $p.utils.outerHTML(teamList[0]); //place sub-template teamList in scoreBoard
	$p.compile(scoreBoard[0], 'f5'); //compile to a function
   $p.sizzle('div#render5')[0].innerHTML = $p.render('f5', context);} //place the result of the transformation to the innerHTML of div#render5

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

	$p.sizzle('ul.treeItem').compile('tree', directive, context);
	$p.sizzle('ul.treeItem').render(context, 'tree');}
		
/*Note: 
	the last directive is an array instead of a string. This is useful
	when we want to set various directives on the same node.
*/

//nothing with PURE here, just some utility for this page
function clickButton(obj, render){
	obj.disabled = true;
	obj.value = 'Refresh the page to render again';
	if (arguments[2]) {
		var elm = $p.sizzle(arguments[2])[0];
		elm.parentNode.removeChild(elm);}
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
			$p.autoCompile($p.sizzle('table.timerTraceTable')[0], 'timerTraceTable', this.trace);
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
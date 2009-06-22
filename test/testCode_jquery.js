(function(){
	//set jquery find
	jQuery.fn.extend({
		compile:function(directive, ctxt){
			return $p.compile(this[0], directive, ctxt);
		}, 
		render:function(ctxt, directive){
			return $p.render(this[0], ctxt, directive);
		}, 
		autoRender:function(ctxt, directive){
			return $p.autoRender(this[0], ctxt, directive);
		}
	});
	$p.config({
		find:function(n, sel){
			return $(n).find(sel);
		}
	});

	var data;
	/* Hello world */
	data = { who:'Wrrrld' };
	var n = $( 'div.hello' );
	n.replaceWith( n.autoRender( data ) );

	data = {
		friend:[
			{
				name:'Hughes', 
				twitter:'hugheswaroquier',
				knowledges:['erlang', 'js', 'css']
			},{
				name:'Yves', 
				twitter:'yveshiernaux',
				knowledges:['js', 'css', 'buzz']
			}
		], 
		who:'Mic',
		who2:'Mac'
	};
	
	/*directive = {
		'span.who': 'who',
		'li.friend':
		{
			'friend <- friend':
			{
				'a':'friend.name',
				'a[href]+':'friend.twitter',
				'a[title]':'View twitter account of #{friend.name}',
				'a[onclick]':'alert(#{friend.name});'
			}
		}
	};*/

	//autoRendering (overwritten with a simple directive)
	var n = $('div.friends');
	var rfn = n.compile({'.who':'who2'}, data);
	n.replaceWith( rfn(data) );
	
	data = {
		teams: [{
			name: 'Cats',
			players: [	
				{first: 'Alice', last: 'Kea\'sler', score: [16, 15, 99, 100]}, 
				{first: '', name: '', score: 0},
				{first: 'Vicky', last: 'Benoit', score: [3, 5]}, 
				{first: 'Wayne', last: 'Dartt', score: [9, 10]}]}, {

			name: 'Dogs',
			players: [
				{first: 'Ray', last: 'Braun', score: 14}, 
				{first: 'Aaron', last: 'Ben', score: 24}, 
				{first: 'Steven', last: 'Smith', score: 1}, 
				{first: 'Kim', last: 'Caffey', score: 19}]}, {

			name: 'Mice',
			players: [
				{first: 'Natalie', last: 'Kinney', score: 16}, 
				{first: 'Caren', last: 'Cohen', score: 3}]}]};
				
	var directive = {
		'table.scoreBoard > tbody > tr': {
			'team <- teams': {
				'td.teamName' : 'team.name',
				'table.teamList > tbody > tr': {
					'player <- team.players': {
						'td.player': '#{player.first} (#{player.last})',
						'td.score': '#{player.score}',
						'td.position': 
							function(arg){
								return arg.pos + 1;
							},
						'root[class]+':
							function(arg){
								return (arg.player.pos % 2 == 1) ? ' odd' : ' even';
							}
					}
				}
			}
		}
	};

	var n = $('div.scoreBoard');
	var elem = n.compile(directive)(data);
	n.get(0).innerHTML = elem;

	var data = {
		children: [{
			name: 'Europe',
			children: [{
				name: 'Belgium',
				children: [{
					name: 'Brussels'},{
					name: 'Namur'},{
					name: 'Antwerpen'}]},{
				name: 'Germany'},{
				name: 'UK'}]},{
			name: 'America',
			children: [{
				name: 'US',
				children: [{
					name: 'Alabama'},{
					name: 'Georgia'}]},{
				name: 'Canada'},{
				name: 'Argentina'}]},{
			name: 'Asia'},{
			name: 'Africa'},{
			name: 'Antarctica'}
		]
	};

	var directive = {
		'li': {
			'child <- children': {
				'a': 'child.name',
				'a[onclick]':'alert(\'#{child.name}\');',
				'div.children': function(ctxt){
					return ctxt.child.item.children ? countries(ctxt.child.item):'';
				}
			}
		}
	};
	
	var n = $('ul.treeItem');
	var countries = n.compile(directive);
	n.get(0).innerHTML = countries(data);
	
})();
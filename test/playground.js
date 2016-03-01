var VDomTestController = Composer.Controller.extend({
	elements: {
		'p': 'el_p',
		'input[name=name]': 'inp_name'
	},

	events: {
		'click p': 'clicked',
		'click h1': 'head',
		'input input[name=name]': 'head'
	},

	init: function()
	{
		this.model = new Composer.Model();
		this.render();
		this.with_bind(this.model, 'change', this.render.bind(this));
		this.poll();
	},

	render: function()
	{
		var name = this.model.get('name');
		var html = [
			'<h1>HELLO beep boop</h1>',
			'<p>my name is <span>x-'+name+'</span></p>',
			'<input type="text" name="name" value="">',
			'<br>',
			'<select name="try"><option value="1">pick me</option><option selected value="2">no pick me asswipe</option></select>',
			'<br>',
			'<input type="radio" name="bov" value="1">',
			'<input type="radio" name="bov" value="2">',
			'<br>',
			'<input type="checkbox" value="1">',
			'<br>',
			'<textarea name="body"></textarea>'
		].join('\n');
		this.html(html)
			.then(function() { console.log('done rendering!!'); });
	},

	clicked: function(e)
	{
		console.log('clicked: ', e.target);
	},

	head: function(e)
	{
		this.model.set({name: this.inp_name.get('value')});
	},

	poll: function(e)
	{
		var set_name = function()
		{
			var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
			var name = '';
			for(var i = 0; i < 12; i++)
			{
				name += chars[Math.floor(Math.random() * chars.length)];
			}
			this.model.set({name: name});
			setTimeout(set_name, 1000 + (1000 * Math.random()));
		}.bind(this);
		set_name();
	}
});

document.addEvent('domready', function() {
	Composer.promisify();
	Composer.Controller.xdomify();
	var start = window.performance.now();
	new VDomTestController({ inject: '#app' });
	console.log('took: ', window.performance.now() - start);
});


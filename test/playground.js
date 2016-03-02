var DogController = Composer.Controller.extend({
	model: null,
	init: function()
	{
		this.render();
		this.with_bind(this.model, 'change', this.render.bind(this));
	},

	render: function()
	{
		var html = [
			'<p>woof '+this.model.get('name')+'</p>'
		].join('\n');
		return this.html(html);
	}
});

var RabbitController = Composer.Controller.extend({
	model: null,
	init: function()
	{
		this.render();
		this.with_bind(this.model, 'change', this.render.bind(this));
	},

	render: function()
	{
		var html = [
			'<p>*hop* '+this.model.get('name')+'</p>'
		].join('\n');
		return this.html(html);
	}
});

var VDomTestController = Composer.Controller.extend({
	elements: {
		'.dogs': 'el_dogs',
		'.rabbits': 'el_rabbits',
		'input[name=name]': 'inp_name'
	},

	events: {
		'click p': 'clicked',
		'click h1': 'head',
		'input input[name=name]': 'change'
	},

	init: function()
	{
		this.model = new Composer.Model();
		this.render().bind(this)
			.then(function() {
				this.track_subcontroller('dog', function() {
					return new DogController({
						inject: this.el_dogs,
						model: this.model
					});
				}.bind(this));
				this.track_subcontroller('rabbit', function() {
					return new RabbitController({
						inject: this.el_rabbits,
						model: this.model
					});
				}.bind(this));
			});
		this.with_bind(this.model, 'change', this.render.bind(this));
	},

	render: function()
	{
		var html = [
			'<h1>my name is '+this.model.get('name')+'</h1>',
			'<input type="text" name="name">',
			'<div class="dogs"></div>',
			'<div class="rabbits"></div>'
		].join('\n');
		return this.html(html);
	},

	change: function(e)
	{
		this.model.set({name: this.inp_name.value});
	}
});

document.addEvent('domready', function() {
	Composer.promisify();
	Composer.Controller.xdomify();
	var start = window.performance.now();
	new VDomTestController({ inject: '#app' });
	console.log('took: ', window.performance.now() - start);
});


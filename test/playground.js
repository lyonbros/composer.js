var MyItem = Composer.Controller.extend({
	init: function()
	{
		this.render();
	},

	render: function()
	{
		this.html('my name is '+ this.model.get('name') +' ('+ this.model.cid() +', '+ this.cid() +')');
	}
});

var MyList = Composer.ListController.extend({
	inject: '#app',

	elements: {
		'ul': 'list'
	},

	init: function()
	{
		this.collection = new Composer.Collection([], {
			sortfn: function(a, b) {
				return a.get('name', '').localeCompare(b.get('name', ''));
			}
		});
		this.collection.reset([
			{name: 'larry'},
			{name: 'curly'}
		]);
		this.render();

		this.track(this.collection, function(model) {
			return new MyItem({
				inject: this.list,
				model: model
			});
		}.bind(this));
	},

	render: function()
	{
		this.html('<h1>List</h1><ul></ul>');
	}
});

var con;
window.addEvent('domready', function() {
	con = new MyList();
});


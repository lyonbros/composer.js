describe('Composer.ListController', function() {
	var Sub = Composer.Controller.extend({
		tag: 'li',

		model: null,

		init: function()
		{
			this.with_bind(this.model, 'change', this.render.bind(this));
			this.render();
		},

		render: function()
		{
			this.html(JSON.stringify(this.model.toJSON()));
		}
	});

	var List = Composer.ListController.extend({
		inject: '#test',

		sub: Sub,

		elements: {
			'ul.sublist': 'list_el'
		},

		init: function()
		{
			this.collection = new Composer.Collection();
			this.render()

			// call *after* render()
			this.track(this.collection, function(model) {
				return new this.sub({
					inject: this.list_el,
					model: model
				});
			}.bind(this));
		},

		render: function()
		{
			this.html('<ul class="sublist"></ul>');
		}
	});

	it('can be instantiated properly', function() {
		var con = new List();
		expect(con instanceof Composer.ListController).toBe(true);
		con.release();
	});

	it('will add sub-controllers when models are added to its collection', function() {
		var con = new List();
		var ul = con.list_el;
		expect(ul.childNodes.length).toBe(0);
		con.collection.add([{name: 'larry'}, {name: 'curly'}])
		expect(ul.childNodes.length).toBe(2);
		con.release();
	});

	it('will remove sub-controllers when models are removed from its collection', function() {
		var con = new List();
		var ul = con.list_el;
		expect(ul.childNodes.length).toBe(0);
		con.collection.add([{name: 'larry'}, {name: 'curly'}])
		expect(ul.childNodes.length).toBe(2);
		var model = con.collection.at(0);
		model.destroy();
		expect(ul.childNodes.length).toBe(1);
		con.release();
	});

	it('will sort sub-controllers properly base on sortfn', function() {
		var con = new List();
		var ul = con.list_el;
		con.collection.sortfn = function(a, b)
		{
			return a.get('name', '').localeCompare(b.get('name', ''));
		};

		con.collection.add([{name: 'zoey'}, {name: 'barnes'}, {name: 'harry'}]);
		expect(ul.innerHTML).toBe(
			'<li>{"name":"barnes"}</li>'+
			'<li>{"name":"harry"}</li>'+
			'<li>{"name":"zoey"}</li>'
		);

		var model = con.collection.sort_at(1);
		expect(model.get('name')).toBe('harry');
		model.destroy();

		expect(ul.innerHTML).toBe(
			'<li>{"name":"barnes"}</li>'+
			'<li>{"name":"zoey"}</li>'
		);

		con.collection.add([{name: 'chickadee-ee the chickadee'}, {name: 'argoyle the brave'}])
		expect(ul.innerHTML).toBe(
			'<li>{"name":"argoyle the brave"}</li>'+
			'<li>{"name":"barnes"}</li>'+
			'<li>{"name":"chickadee-ee the chickadee"}</li>'+
			'<li>{"name":"zoey"}</li>'
		);
		con.release();
	});

	it('will release subcontrollers properly', function() {
		var released = 0;

		var MySub = Sub.extend({
			release: function()
			{
				released++;
				return this.parent.apply(this, arguments);
			}
		});

		var con = new List({sub: MySub});
		con.collection.add([{name: 'bob'}, {name: 'cornelius'}]);
		con.release();

		expect(released).toBe(2);
	});

	it('will remove all subcontrollers on clear', function() {
		var released = 0;

		var MySub = Sub.extend({
			release: function()
			{
				released++;
				return this.parent.apply(this, arguments);
			}
		});

		var con = new List({sub: MySub});
		con.collection.add([{name: 'bob'}, {name: 'cornelius'}, {name: 'rupert'}]);
		con.collection.clear();

		expect(released).toBe(3);
	});
});


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

		empty: 0,
		not_empty: 0,

		init: function()
		{
			if(!this.collection) this.collection = new Composer.Collection();
			this.render()

			this.bind('list:empty', function() { this.empty++; }.bind(this));
			this.bind('list:notempty', function() { this.not_empty++; }.bind(this));

			// call *after* render()
			this.track(this.collection, function(model, options) {
				return new this.sub({
					inject: this.list_el,
					model: model,
					options: options
				});
			}.bind(this));
		},

		render: function()
		{
			this.html('<ul class="sublist"></ul>');
		}
	});

	var tame_html = function(html)
	{
		return html.toLowerCase().replace(/[\r\n]/g, '');
	};

	it('can be instantiated properly', function() {
		var con = new List();
		expect(con instanceof Composer.ListController).toBe(true);
		con.release();
	});

	it('initializes properly with an existing set of models', function() {
		var collection = new Composer.Collection();
		collection.add({name: 'barry'});
		collection.add({name: 'larry'});
		collection.add({name: 'jerry'});
		var con = new List({collection: collection});
		expect(con.list_el.childNodes.length).toBe(3);
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
		expect(tame_html(ul.innerHTML)).toBe(
			'<li>{"name":"barnes"}</li>'+
			'<li>{"name":"harry"}</li>'+
			'<li>{"name":"zoey"}</li>'
		);

		var model = con.collection.sort_at(1);
		expect(model.get('name')).toBe('harry');
		model.destroy();

		expect(tame_html(ul.innerHTML)).toBe(
			'<li>{"name":"barnes"}</li>'+
			'<li>{"name":"zoey"}</li>'
		);

		con.collection.add([{name: 'chickadee-ee the chickadee'}, {name: 'argoyle the brave'}])
		expect(tame_html(ul.innerHTML)).toBe(
			'<li>{"name":"argoyle the brave"}</li>'+
			'<li>{"name":"barnes"}</li>'+
			'<li>{"name":"chickadee-ee the chickadee"}</li>'+
			'<li>{"name":"zoey"}</li>'
		);
		con.release();
	});

	it('will release subcontrollers properly', function(done) {
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

		// list controllers release async
		setTimeout(function() {
			expect(released).toBe(2);
			done();
		}, 10);
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

	it('will pass options to create_fn', function() {
		var options = [];
		var MySub = Sub.extend({
			init: function()
			{
				options.push(this.options.get_a_job);
			}
		});
		var con = new List({sub: MySub});
		con.collection.add([{name: 'ovaltine'}], {get_a_job: 69});
		con.collection.reset([{name: 'bangarang'}], {get_a_job: 42});
		expect(options[0]).toBe(69);
		expect(options[1]).toBe(42);
	});

	it('will notify via eventing empty/notempty status', function() {
		var empty = 0;
		var not_empty = 0;

		var con = new List({
			collection: new Composer.Collection([{id: 3}])
		});
		expect(con.empty).toBe(0);
		expect(con.not_empty).toBe(1);

		var con = new List();
		expect(con.empty).toBe(1);
		expect(con.not_empty).toBe(0);

		con.bind('list:empty', function() { empty++; });
		con.bind('list:notempty', function() { not_empty++; });
		var m1 = new Composer.Model({id: 1});
		var m2 = new Composer.Model({id: 2});
		con.collection.add(m1);
		con.collection.add(m2);

		expect(empty).toBe(0);
		expect(not_empty).toBe(1);

		con.collection.remove(m1);
		con.collection.remove(m2);

		expect(empty).toBe(1);
		expect(not_empty).toBe(1);

		con.collection.add(m1);

		expect(empty).toBe(1);
		expect(not_empty).toBe(2);

		con.collection.clear();

		expect(empty).toBe(2);
		expect(not_empty).toBe(2);

		con.collection.add(m1);

		expect(empty).toBe(2);
		expect(not_empty).toBe(3);

		con.collection.reset([m1]);

		expect(empty).toBe(3);
		expect(not_empty).toBe(4);
	});

	var FragList = List.extend({
		init: function()
		{
			if(!this.collection) this.collection = new Composer.Collection();
			this.render()

			this.track(this.collection, function(model, options) {
				options || (options = {});
				var fragment = options.fragment;
				return new this.sub({
					inject: fragment ? fragment : this.list_el,
					model: model,
					options: options
				});
			}.bind(this), {
				container: function() { return this.list_el; }.bind(this)
			});
		}
	});
	it('properly uses a fragment when resetting items', function() {
		var collection = new Composer.Collection([
			{id: 3},
			{id: 12},
			{id: 69}
		]);
		var con = new FragList({collection: collection});
		expect(con.list_el.childNodes.length).toBe(3);

		var model = collection.get(12);
		collection.remove(model);
		expect(con.list_el.childNodes.length).toBe(2);

		con.collection.add({id: 420});
		expect(con.list_el.childNodes.length).toBe(3);
	});
});


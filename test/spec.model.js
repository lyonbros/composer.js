describe('Composer.Model', function() {
	it('can be instantiated properly', function() {
		var model = new Composer.Model({name: 'andrew'});
		expect(model.get('name')).toBe('andrew');
	});

	it('performs basic operations (set, get, etc)', function() {
		var model = new Composer.Model({name: 'larry', drives: 'SUV'});
		expect(model.id()).toBe(model.cid());
		expect(model.is_new()).toBe(true);
		model.set({id: '1234', needs: 'a fish'});
		expect(model.id()).toBe('1234');
		expect(model.is_new()).toBe(false);
		expect(model.get('name')).toBe('larry');
		expect(model.get('drives')).toBe('SUV');
		expect(model.get('needs')).toBe('a fish');
		model.unset('needs');
		expect(model.get('needs')).toBe(null);
		expect(model.get('needs', 69)).toBe(69);
		model.clear();
		expect(model.id()).toBe(model.cid());
		expect(model.get('name')).toBe(null);
		expect(model.get('drives')).toBe(null);
		expect(model.get('needs')).toBe(null);
	});

	it('can be extended properly', function() {
		var run = false;
		var c = 0;
		var MyModel = Composer.Model.extend({
			defaults: { name: 'sarah' },
			init: function()
			{
				run = true;
			},

			member: function()
			{
				c++;
			}
		});

		var model = new MyModel();
		model.member();
		model.member();
		model.member();

		expect(model.get('name')).toBe('sarah');
		expect(run).toBe(true);
		expect(c).toBe(3);
	});

	it('will handle events properly', function() {
		var state = {};
		var model = new Composer.Model();

		model.bind('change', function() { state.change = true; });
		model.bind('change:name', function(_, val) { state.name = val; });
		model.bind('change:hairstyle', function(_, val) { state.hair = val; });
		model.bind('destroy', function() { state.destroy = true; });

		model.set({name: 'andrew', hairstyle: 'super 90s'});
		model.destroy();

		expect(state.change).toBe(true);
		expect(state.name).toBe('andrew');
		expect(state.hair).toBe('super 90s');
		expect(state.destroy).toBe(true);

		state = {};

		model.set({name: 'judd', hairstyle: 'buzz'}, {silent: ['change:hairstyle']});
		expect(state.change).toBe(true);
		expect(state.name).toBe('judd');
		expect(state.hair).toBeUndefined();

		state = {};

		model.set({name: 'leslie', hairstyle: 'wavy with layers'}, {not_silent: ['change:hairstyle']});
		expect(state.change).toBeUndefined();
		expect(state.name).toBeUndefined();
		expect(state.hair).toBe('wavy with layers');
	});

	it('can be serialized', function() {
		var model = new Composer.Model();
		model.set({name: 'larry', friends: ['curly', 'moe']});

		var json = model.toJSON();
		expect(json.name).toBe('larry');
		expect(json.friends[0]).toBe('curly');
		expect(json.friends[1]).toBe('moe');
	});

	it('will build its own URL properly', function() {
		var Model = Composer.Model.extend({ base_url: '/users' });
		var model = new Model();
		expect(model.get_url()).toBe('/users');
		model.set({id: '1234'});
		expect(model.get_url()).toBe('/users/1234');

		model.url = '/spanky/slappy/69';
		expect(model.get_url()).toBe('/spanky/slappy/69');
	});

	it('will call the sync function properly', function() {
		var _sync = Composer.sync;
		var last_method = null;
		Composer.sync = function(method, model, options)
		{
			last_method = method;
			return options.success();
		};
		var model = new Composer.Model({name: 'akita', type: 'dog'});

		model.save();
		expect(last_method).toBe('create');
		model.set({id: '45'});
		model.save();
		expect(last_method).toBe('update');
		model.fetch();
		expect(last_method).toBe('read');
		model.destroy();
		expect(last_method).toBe('delete');
		Composer.sync = _sync;
	});
});


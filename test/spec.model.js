describe('Composer.Model', function() {
	it('can be instantiated properly', function() {
		var model = new Composer.Model({name: 'andrew'});
		expect(model.get('name')).toBe('andrew');
	});

	it('performs basic operations (set, get, etc)', function() {
		var model = new Composer.Model({name: 'larry', drives: 'SUV'});
		expect(model.cid().match(/^c[0-9]+/)).toBeTruthy();
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
		model.set({name: 'andrew', age: 30});
		model.reset({name: 'andrew'});
		expect(model.get('name')).toBe('andrew');
		expect(model.get('age')).toBe(null);
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

	it('has working defaults', function() {
		var MyModel = Composer.Model.extend({
			defaults: { name: 'sandra' }
		});
		expect(new MyModel().get('name')).toBe('sandra');
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

		// test resets
		var model2 = new Composer.Model();
		var change = 0;
		var name = 0;
		var age = 0;
		model2.bind('change', function() { change++; });
		model2.bind('change:name', function() { name++; });
		model2.bind('change:age', function() { age++; });

		model2.reset({name: 'eric', age: 14});
		expect(change).toBe(1);
		expect(name).toBe(1);
		expect(age).toBe(1);

		model2.reset({name: 'eric'});
		expect(change).toBe(2);
		expect(name).toBe(1);
		expect(age).toBe(2);

		model2.reset({age: 16});
		expect(change).toBe(3);
		expect(name).toBe(2);
		expect(age).toBe(3);

		model2.reset({name: 'eddy', age: 16});
		expect(change).toBe(4);
		expect(name).toBe(3);
		expect(age).toBe(3);

		model2.reset({name: 'eddy', age: 16});
		expect(change).toBe(4);
		expect(name).toBe(3);
		expect(age).toBe(3);
	});

	it('can be serialized', function() {
		var model = new Composer.Model();
		model.set({name: 'larry', friends: ['curly', 'moe']});

		var json = model.toJSON();
		expect(json.name).toBe('larry');
		expect(json.friends[0]).toBe('curly');
		expect(json.friends[1]).toBe('moe');
	});

	it('can be cloned', function() {
		var num_barks = 0;
		var Dog = Composer.Model.extend({
			bark: function()
			{
				num_barks++;
			}
		});

		var model = new Dog({name: 'dillard'});
		var clone = model.clone();
		expect(model == clone).toBe(false);
		expect(clone.get('name')).toBe('dillard');
		clone.bark();
		expect(num_barks).toBe(1);
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

	it('properly generates URLs for its save()/destroy()/fetch() methods', function() {
		var Dog = Composer.Model.extend({
			base_url: '/doge'
		});
		var dog = new Dog();
		expect(dog.get_url()).toBe('/doge');
		dog.set({id: '6969'});
		expect(dog.get_url()).toBe('/doge/6969');

		var dog = new Dog();
		dog.url = '/top-doge';
		expect(dog.get_url()).toBe('/top-doge');
		dog.set({id: '6969'});
		expect(dog.get_url()).toBe('/top-doge');

		var dog = new Dog();
		dog.url = function() {
			var base = this.base_url.replace(/\/doge/, '/top-doge/harrrrr');
			if(!this.is_new()) base += '/'+this.id();
			return base;
		};
		expect(dog.get_url()).toBe('/top-doge/harrrrr');
		dog.set({id: '6969'});
		expect(dog.get_url()).toBe('/top-doge/harrrrr/6969');
	});
});


describe('Promises', function() {
	var setup_sync = function()
	{
		Composer.sync = function(method, model, options)
		{
			setTimeout(function() {
				if(options.do_error)
				{
					return options.error('you asked for it...');
				}
				var data = {
					id: 10,
					name: 'Obama',
					real_name: 'BARRY SOETORO',
					source: 'alex jones'
				};
				if(model instanceof Composer.Collection) data = [data];
				options.success(data);
			}, 10);
		};

	};

	it('will convert the async functions properly', function() {
		var old = Composer.Model.prototype.fetch;
		expect(old == Composer.Model.prototype.fetch).toBe(true);
		Composer.promisify();
		expect(old == Composer.Model.prototype.fetch).toBe(false);
	});

	it('let\'s set up our sync function', function() {
		setup_sync();
	});

	it('will return a promise on an async function', function() {
		var model = new Composer.Model()
		var promise = model.fetch();
		expect(promise instanceof Promise).toBe(true);
	});

	var make_resolver_test = function(name, data, datatest)
	{
		return function(fn)
		{
			it('will resolve '+name+'.'+fn+' properly', function(done) {
				var error = null;
				var result = null;
				var obj = new Composer[name]();
				obj[fn].apply(obj, data ? [data] : [])
					.then(function(res) {
						if(!data) result = res;
						else result = obj;
					})
					.catch(function(err) {
						error = err;
					})
					.finally(function() {
						expect(error).toBeNull();
						expect(result == obj).toBe(true);
						if(datatest) datatest(obj);
						done();
					});
			});
		};
	};
	['fetch', 'save'].forEach(make_resolver_test('Model', null, function(model) {
		expect(model.get('name')).toBe('Obama');
	}));
	['destroy'].forEach(make_resolver_test('Model'));
	['fetch'].forEach(make_resolver_test('Collection', null, function(col) {
		expect(col.first().get('real_name')).toBe('BARRY SOETORO');
	}));
	['reset_async'].forEach(make_resolver_test('Collection', [{id: 5}, {id: 69}, {id: 42}], function(col) {
		expect(col.at(1).id()).toBe(69);
	}));

	it('will handle errors properly', function(done) {
		var res = null;
		var err = null;
		var model = new Composer.Model();
		model.fetch({do_error: true})
			.then(function() {
				res = model.id();
			})
			.catch(function(error) {
				err = error;
			})
			.finally(function() {
				expect(res).toBeNull();
				expect(err).toBe('you asked for it...');
				done();
			})
	});
});


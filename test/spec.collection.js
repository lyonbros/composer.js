describe('Composer.Collection', function() {
	it('can be instantiated properly', function() {
		var col = new Composer.Collection();
		expect(col.models().length).toBe(0);

		var col = new Composer.Collection([
			{name: 'larry', says: 'parker, if you\'re going to ask a question you better stick around for the answer'},
			{name: 'larry', says: 'alex, remember what we talked about'},
			{name: 'larry', says: 'nobody thinks you\'re funny'}
		]);
		expect(col.models().length).toBe(3);
		col.models().forEach(function(model) {
			expect(model instanceof Composer.Model).toBe(true);
		});
	});

	it('can use a custom model type', function() {

		var MyModel = Composer.Model.extend({
			defaults: { name: 'roxy' }
		});
		var MyCollection = Composer.Collection.extend({
			model: MyModel
		});

		var col = new MyCollection([{name: 'larry'}, {}]);
		col.models().forEach(function(model) {
			expect(model instanceof MyModel).toBe(true);
		});
		expect(col.first().get('name')).toBe('larry');
		expect(col.last().get('name')).toBe('roxy');
	});

	it('can add models', function() {
		var col = new Composer.Collection();
		var add = 0;

		col.bind('add', function() { add++; });

		col.add([{name: 'YOUR MOM'}]);
		col.add({name: 'larry'});
		col.add(new Composer.Model({name: 'andrea'}));

		col.models().forEach(function(model) {
			expect(model instanceof Composer.Model).toBe(true);
		});
		expect(col.models()[0].get('name')).toBe('YOUR MOM');
		expect(col.models()[1].get('name')).toBe('larry');
		expect(col.models()[2].get('name')).toBe('andrea');
		expect(add).toBe(3);
	});

	it('can remove models', function() {
		var col = new Composer.Collection();
		var remove = 0;

		col.bind('remove', function() { remove++; });

		col.add([{name: 'YOUR MOM'}]);
		col.add({name: 'larry'});
		col.add(new Composer.Model({name: 'andrea'}));

		var model1 = col.first();
		var model2 = col.last();
		col.remove([model1, model2]);
		col.remove(model1);
		col.remove(model1);
		col.remove(model1);
		expect(col.models().length).toBe(1);
		expect(remove).toBe(2);
		var next = col.first();
		col.remove(next);
		col.remove(next);
		expect(col.models().length).toBe(0);
		expect(remove).toBe(3);
	});

	it('will upsert models properly', function() {
		var model = new Composer.Model({id: 1234, name: 'sandra'});
		var col = new Composer.Collection(model);
		var name_changed = false;
		var upsert = 0;
		var add = 0;

		col.bind('upsert', function() { upsert++; });
		col.bind('add', function() { add++; });
		model.bind('change:name', function() { name_changed = true; });

		expect(col.models().length).toBe(1);
		expect(name_changed).toBe(false);

		var model2 = new Composer.Model({id: 1234, name: 'philip'});
		col.upsert(model2);

		expect(col.models().length).toBe(1);
		expect(name_changed).toBe(false);	// upserts are silent
		expect(upsert).toBe(1);
		expect(add).toBe(0);
		expect(col.first() == model).toBe(true);
		expect(col.first() == model2).toBe(false);
		expect(col.first().get('name')).toBe('philip');

		col.upsert(new Composer.Model({id: 1233, name: 'gertrude'}));
		expect(col.models().length).toBe(2);
		expect(upsert).toBe(1);
		expect(add).toBe(1);
	});

	it('will clear properly', function() {
		var col = new Composer.Collection([{},{},{}]);
		var cleared = 0;
		expect(col.models().length).toBe(3);
		col.bind('clear', function() { cleared++; });
		col.clear();
		expect(col.models().length).toBe(0);
		expect(cleared).toBe(1);
		col.clear();
		col.clear();
		col.clear();
		expect(cleared).toBe(1);
	});

	it('will reset properly', function() {
		var col = new Composer.Collection([{},{},{}]);
		var cleared = 0;
		var reset = 0;

		col.bind('clear', function() { cleared++; });
		col.bind('reset', function() { reset++; });

		col.reset([{}, {}]);
		expect(col.models().length).toBe(2);
		expect(cleared).toBe(1);
		expect(reset).toBe(1);

		col.reset([{}, {}, {}], {append: true});
		expect(col.models().length).toBe(5);
		expect(cleared).toBe(1);
		expect(reset).toBe(2);
	});

	it('will reset_async properly', function(done) {
		var data = [
			{name: 'larry'},
			{name: 'sandra'},
			{name: 'barthalomew'}
		];
		var col = new Composer.Collection();
		var reset = 0;
		col.bind('reset', function() { reset++; });
		col.reset_async(data, {
			complete: function() {
				expect(col.models().length).toBe(3);
				expect(reset).toBe(1);
				done();
			}
		});
		expect(reset).toBe(0);
	});

	it('sorts models properly', function() {
		var data = [
			{id: 1, sort: 99},
			{id: 2, sort: 69},
			{id: 3, sort: 17},
			{id: 4, sort: 28}
		];
		var MyCol = Composer.Collection.extend({
			sortfn: function(a, b) { return a.get('sort') - b.get('sort'); }
		});
		var col = new Composer.Collection(data);
		expect(col.models()[0].id()).toBe(1);
		expect(col.models()[1].id()).toBe(2);
		expect(col.models()[2].id()).toBe(3);
		expect(col.models()[3].id()).toBe(4);
		expect(col.index_of(3)).toBe(2);

		var col = new MyCol(data);
		expect(col.models()[0].id()).toBe(3);
		expect(col.models()[1].id()).toBe(4);
		expect(col.models()[2].id()).toBe(2);
		expect(col.models()[3].id()).toBe(1);

		var test = new Composer.Model({id: 5, sort: 77});
		expect(col.sort_index(test)).toBe(3);
	});

	it('supports iteration constructs', function() {
		var col = new Composer.Collection([{id: 1}, {id: 2}, {id: 3}]);
		var each = 0;
		col.each(function() { each++; });
		expect(each).toBe(3);

		var mapped = col.map(function(m) { return m.id(); });
		expect(mapped[0]).toBe(1);
		expect(mapped[1]).toBe(2);
		expect(mapped[2]).toBe(3);
	});

	it('can find models', function() {
		var model = new Composer.Model({id: 17});
		var col = new Composer.Collection([{id: 3}, model, {id: 6}]);
		expect(col.find(function(m) { return m.id() == 17; })).toBe(model);
		expect(col.find_by_id(17)).toBe(model);
		expect(col.find_by_cid(model.cid())).toBe(model);
		expect(col.exists(function(m) { return m.id() == 6; })).toBe(true);
	});

	it('can filter and select models', function() {
		var data = [
			{id: 1, name: 'larry'},
			{id: 2, name: 'andrew'},
			{id: 3, name: 'wookie'},
			{id: 4, name: 'larry'}
		];
		var col = new Composer.Collection(data);
		var filtered = col.filter(function(m) { return m.get('name') == 'larry'; });
		expect(filtered.length).toBe(2);
		expect(filtered[0].id()).toBe(1);
		expect(filtered[1].id()).toBe(4);

		var selected = col.select({name: 'larry'});
		expect(selected.length).toBe(2);
		expect(selected[0].id()).toBe(1);
		expect(selected[1].id()).toBe(4);

		var one = col.select_one({name: 'wookie'});
		expect(one instanceof Composer.Model).toBe(true);
		expect(one.id()).toBe(3);
	});

	it('restecps first/last/at', function() {
		var data = [
			{id: 1, name: 'larry'},
			{id: 2, name: 'andrew'},
			{id: 3, name: 'wookie'},
			{id: 4, name: 'larry'}
		];
		var col = new Composer.Collection(data);
		expect(col.first().id()).toBe(1);
		expect(col.last().id()).toBe(4);
		expect(col.at(0)).toBe(col.first());
		expect(col.at(2).get('name')).toBe('wookie');
	});

	it('preserves model references', function() {
		var model = new Composer.Model({id: 6, name: 'andrew'});
		var col = new Composer.Collection(model);

		expect(col.first()).toBe(model);
	});

	it('syncs properly and uses proper URLs', function() {
		var _sync = Composer.sync;
		var last_method = null;
		var last_url = null;
		Composer.sync = function(method, model, options)
		{
			last_url = this.get_url();
			last_method = method;
			return options.success();
		};

		var model = new Composer.Model({id: 69, name: 'pervy stu'});
		var col = new Composer.Collection([model]);
		col.url = '/users';

		expect(col.first().get_url()).toBe('/users/69');

		col.fetch();
		expect(last_method).toBe('read');
		expect(last_url).toBe('/users');

		Composer.sync = _sync;
	});

	it('acts on model events properly', function() {
		var model = new Composer.Model({id: 42});
		var col = new Composer.Collection(model);
		var hello = 0;

		col.bind('hello', function() { hello++; });

		model.trigger('hello');
		expect(hello).toBe(1);

		model.destroy();
		expect(col.models().length).toBe(0);
		expect(model.collections.length).toBe(0);
	});
});



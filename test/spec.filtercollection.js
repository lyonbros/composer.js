describe('Composer.FilterCollection', function() {
	var master = new Composer.Collection();

	var Filter = Composer.FilterCollection.extend({
		sortfn: function(a, b) { return a.get('age') - b.get('age'); },
		filter: function(m) {
			// LOCALS ONLY
			return m.get('loc', false);
		}
	});

	it('can be instantiated properly', function() {
		var col = new Filter(master);
		expect(col.cid().match(/^c[0-9]+/)).toBeTruthy();
		expect(col instanceof Composer.FilterCollection).toBe(true);
		col.detach();
	});

	it('will correctly filter/sort models', function() {
		var col = new Filter(master);
		var ages = [45, 32, 78, 25, 17, 27, 69, 12, 30, 44, 23, 58, 72];
		ages.forEach(function(age, i) {
			// odd ages are locs, brah
			master.add(new Composer.Model({ id: i+1, age: age, loc: (age % 2) == 1 }));
		});
		expect(col.size()).toBe(6);
		expect(col.models()[0].id()).toBe(5);
		expect(col.models()[1].id()).toBe(11);
		expect(col.models()[2].id()).toBe(4);
		expect(col.models()[3].id()).toBe(6);
		expect(col.models()[4].id()).toBe(1);
		expect(col.models()[5].id()).toBe(7);
		col.detach();
	});

	it('will limit/sort models properly', function() {
		var col = new Filter(master, {limit: 4});
		expect(col.size()).toBe(4);
		expect(col.models()[0].id()).toBe(5);
		expect(col.models()[1].id()).toBe(11);
		expect(col.models()[2].id()).toBe(4);
		expect(col.models()[3].id()).toBe(6);
		col.detach();
	});

	it('will transform models on add/remove', function() {
		var col = new Filter(master, {
			transform: function(m, action) {
				if(action == 'add')
				{
					return m.set({name: 'loccy mcbrah'});
				}
				else
				{
					return m.unset('name');
				}
			}
		});
		var model = new Composer.Model({id: 42, age: 13, loc: true});
		col.add(model);
		expect(model.get('name')).toBe('loccy mcbrah');
		col.remove(model);
		expect(model.get('name', false)).toBe(false);
		col.detach();
	});

	it('allows daisy chaining', function() {
		var col = new Filter(master);
		var daisy = new Filter(col, {
			filter: function(m) {
				return m.get('age') < 30;
			}
		});

		expect(daisy.size()).toBe(5);
		expect(daisy.models()[0].id()).toBe(42);
		expect(daisy.models()[1].id()).toBe(5);
		expect(daisy.models()[2].id()).toBe(11);
		expect(daisy.models()[3].id()).toBe(4);
		expect(daisy.models()[4].id()).toBe(6);
	});

	it('will properly filter changes', function() {
		var col = new Composer.Collection();
		col.add({id: 1, name: 'dog', groups: [1,2]});
		col.add({id: 2, name: 'cat', groups: [2,3]});
		col.add({id: 3, name: 'bird', groups: [1]});

		var cat = col.find_by_id(2);

		var filter = new Composer.FilterCollection(col, {
			filter: function(m) {
				return m.get('groups').indexOf(2) >= 0;
			}
		});

		expect(filter.size()).toBe(2);
		cat.set({groups: [3]});
		expect(filter.size()).toBe(1);
		cat.set({groups: [2,3]});
		expect(filter.size()).toBe(2);
	});
});


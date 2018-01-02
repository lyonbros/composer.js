describe('Composer.RelationalModel', function() {
	var BandMember = Composer.RelationalModel.extend({
		relations: {
			pet: {
				model: Composer.Model
			}
		}
	});
	var BandMembers = Composer.Collection.extend({
		model: BandMember,

		play: function()
		{
			return 'music';
		}
	});
	var Band = Composer.RelationalModel.extend({
		relations: {
			members: {
				collection: BandMembers
			}
		},

		play: function()
		{
			return 'la la la';
		}
	});

	var banddata = {
		name: 'the way',
		members: [
			{name: 'barney', pet: {name: 'giraffee', type: 'giraffe'}},
			{name: 'pervy stu', pet: {name: 'lucy', type: 'dog'}},
			{name: 'judd', pet: {name: 'marty malt', type: 'cat'}}
		]
	};

	it('is instantiated properly', function() {
		var col = new Band(banddata);
		expect(col.cid().match(/^c[0-9]+/)).toBeTruthy();
		expect(col.get('members') instanceof BandMembers).toBe(true);
		expect(col.get('members').first() instanceof BandMember).toBe(true);
		expect(col.get('members').first().get('pet') instanceof Composer.Model).toBe(true);
		expect(col.get('members').first().get('name')).toBe('barney');
		expect(col.get('members').first().get('pet').get('name')).toBe('giraffee');

		var mapped = col.get('members').map(function(m) { return m.get('pet').get('type'); });
		expect(mapped[0]).toBe('giraffe');
		expect(mapped[1]).toBe('dog');
		expect(mapped[2]).toBe('cat');
	});

	it('will serialize properly', function() {
		var col = new Band(banddata);
		var obj = col.toJSON();
		expect(obj.name).toBe('the way');
		expect(Composer.array.is(obj.members)).toBe(true);
		expect(obj.members[1].pet.name).toBe('lucy');
	});

	it('can bind/unbind relations', function() {
		var col = new Band(banddata);
		var add = 0;
		var addfn = function() { add++; };
		col.bind_relational('members', 'add', function() { add++; }, 'band:add:named');
		col.bind_relational('members', 'add', addfn);

		col.get('members').add({name: 'larry', pet: {name: 'racooney', type: 'dead raccoon'}});
		col.get('members').add({name: 'jeffrey', pet: {name: 'kofi', type: 'shiba'}});

		expect(add).toBe(4);

		col.unbind_relational('members', 'add', 'band:add:named');
		col.get('members').add({name: 'oh noo'});
		expect(add).toBe(5);
		col.unbind_relational('members', 'add', addfn);
		col.get('members').add({name: 'and yet his son is a dunce'});
		expect(add).toBe(5);
	});

	it('will merge_extend other classes properly', function() {
		var GoodBand = Band.extend({
			play: function() { return '...'; }
		});
		var Zep = GoodBand.extend({
			play: function() { return 'let the music be your master'; }
		});
		var Cover = Zep.extend({ });
		var good = new GoodBand();
		var cover = new Cover();
		expect(good.play()).toBe('...');
		expect(cover.play()).toBe('let the music be your master');
	});

	it('will clear related models/collections when cleared', function() {
		var band = new Band(banddata);
		var members = band.get('members');
		band.clear();
		expect(members.size()).toBe(0);
	});

	it('will use skip_relational properly', function() {
		var col = new Band(banddata);
		var data = col.toJSON({skip_relational: true});
		expect(Composer.eq(data, {name: 'the way'})).toBe(true);
	});

	it('will serialize properly', function() {
		var Dog = Composer.RelationalModel.extend({
			relations: {
				toys: {
					collection: Composer.Collection
				}
			}
		});
		var Person = Composer.RelationalModel.extend({
			relations: {
				'pet.dog': {
					model: Dog
				}
			}
		});

		var person = new Person();
		person.set({name: 'ruth', pet: {dog: {name: 'timmy', toys: [{id: 1, name: 'ropey'}, {id: 2, name: 'bally'}]}}});
		expect(person.toJSON().pet.dog.toys[1].name).toBe('bally');
		person.set({pet: {dog: {toys: [{id: 2, name: 'sticky'}]}}}, {upsert: true});
		expect(person.toJSON().pet.dog.toys[1].name).toBe('sticky');
	});

	it('replaces relational model data on reset', function() {
		var band = new Band({members: []});
		var members = band.get('members');
		expect(members.size()).toBe(0);
		band.reset({members: [{id: 69}]});
		expect(members.first().get('id')).toBe(69);

		var member = new BandMember({pet: {type: 'dog'}});
		var pet = member.get('pet');
		expect(pet.get('name', null)).toBeNull();
		expect(pet.get('type', null)).toBe('dog');
		member.reset({pet: {name: 'timmy'}});
		expect(pet.get('name', null)).toBe('timmy');
		expect(pet.get('type', null)).toBeNull();
	});
});


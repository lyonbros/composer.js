var Dog = Composer.RelationalModel.extend({
	relations: {
		toys: {
			collection: Composer.Collection
		}
	}
});
var Person = Composer.RelationalModel.extend({
	relations: {
		pet: {
			model: Dog
		}
	}
});

var person;
window.addEvent('domready', function() {
	person = new Person();
	person.set({name: 'ruth', pet: {name: 'timmy', toys: [{id: 1, name: 'ropey'}, {id: 2, name: 'bally'}]}});
	console.log('- json: ', JSON.stringify(person.toJSON()));
	console.log('---');
	person.set({pet: {toys: [{id: 2, name: 'sticky'}]}}, {upsert: true});
	console.log('- json: ', JSON.stringify(person.toJSON()));
});


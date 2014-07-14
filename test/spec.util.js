describe('Composer', function() {
	it('has known exported objects', function() {
		// Composer.*
		var main_exports	=	[
			'sync',
			'cid',
			'eq',
			'merge_extend',
			'Base',
			'Event',
			'Model',
			'Collection',
			'Controller',
			'Router'
		];
		// Composer.array.*
		var array_exports = [
			'erase',
		];
		// Composer.object.*
		var object_exports = [
			'each',
			'clone',
			'merge'
		];

		for(var i = 0; i < main_exports.length; i++)
		{
			var exp = Composer[main_exports[i]];
			expect(exp instanceof Function).toBe(true);
		}
		for(var i = 0; i < array_exports.length; i++)
		{
			var exp = Composer.array[array_exports[i]];
			expect(exp instanceof Function).toBe(true);
		}
		for(var i = 0; i < object_exports.length; i++)
		{
			var exp = Composer.object[object_exports[i]];
			expect(exp instanceof Function).toBe(true);
		}
	});

	it('is awesome', function() {
		expect(typeof window.Composer != 'undefined').toBe(true);
	});
});



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

	it('has a working eq function', function() {
		// set up some values
		var s1 = 'my string';
		var s2 = 'my string';
		var o1 = {name: 'charlie', position: null, can: false};
		var o2 = {name: 'charlie', position: null, can: false};
		var a1 = [1,false,null,undefined];
		var a2 = [1,false,null,undefined];

		var tests = [];
		var run = function(true_or_false)
		{
			tests.forEach(function(test, i) {
				// test the given order and the reverse
				expect(Composer.eq(test[0], test[1])).toBe(true_or_false);
				var res = Composer.eq(test[0], test[1]);
				if(res != true_or_false)
				{
					console.log('eq? ', i, test[0], test[1], Composer.eq(test[0], test[1]), true_or_false);
				}
				//expect(Composer.eq(test[1], test[0])).toBe(true_or_false);
			});
		};

		// trues
		tests = [
			[1, 1],
			[67, 67],
			[s1, s2],
			[null, null],
			[false, false],
			[true, true],
			[undefined, undefined],
			[{}, {}],
			[o1, o2],
			[[], []],
			[a1, a2]
		];
		run(true);

		// falses (build a list of values such that unless compared to themselves
		// *should* make eq return false
		var falsevals = [
			1,
			2,
			s1,
			67,
			'1',
			null,
			undefined,
			true,
			false,
			{},
			{name: 'frank'},
			{Name: 'frank'},
			{name: 'Frank'},
			{has_truck: false},
			{has_truck: true},
			{val: null},
			o1,
			[],
			[84],
			[1, 2],
			[1, 2, 3],
			[undefined],
			[null],
			[true],
			[false],
			a1
		];
		tests = [];
		console.log('json: ', falsevals);
		for(var i = 0; i < falsevals.length; i++)
		{
			for(var c = 0; c < falsevals.length; c++)
			{
				if(c == i) continue;	// don't compare a value to itself
				tests.push([falsevals[i], falsevals[c]]);
				if(tests.length == 163 || tests.length == 463)
				{
					console.log('fail: ', i, c, falsevals[i], falsevals[c]);
				}
			}
		}
		console.log('test: ', tests);
		run(false);
	});
});



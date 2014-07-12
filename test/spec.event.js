describe('Composer.Event', function() {
	var Animal = Composer.Event.extend({});

	it('extends the correct event class', function() {
		var dog = new Animal();
		expect(dog instanceof Composer.Event).toBe(true);
	});

	it('can bind functions to events', function() {
		var dog = new Animal();
		var fn = function() {};
		dog.bind('bark', fn);
		expect(dog._handlers['bark'].length).toBe(1);
		expect(dog.unbind('bark', fn)).toBe(true);
		expect(dog.unbind('bark', fn)).toBe(false);
		expect(dog._handlers['bark'].length).toBe(0);
	});

	it('can handle named bindings properly', function() {
		var dog = new Animal();
		var fn = function() {};
		var name = 'my-open-event';
		var named = Composer.Event._make_lookup_name('open', name);
		dog.bind('open', fn, name);
		expect(dog._handlers['open'].length).toBe(1);
		expect(dog._handler_names[named]).toBe(fn);
		dog.unbind('open', name);
		expect(dog._handlers['open'].length).toBe(0);
		expect(dog._handler_names[named]).toBeUndefined();

		// make sure named bindings are replaced
		var fn2 = function() {};
		var named2 = Composer.Event._make_lookup_name('close', name);
		dog.bind('open', fn, name);
		dog.bind('open', fn2, name);
		dog.bind('close', fn, name);
		dog.bind('close', fn2, name);
		expect(dog._handlers['open'].length).toBe(1);
		expect(dog._handlers['close'].length).toBe(1);
		expect(dog._handler_names[named]).toBe(fn2);
		expect(dog._handler_names[named2]).toBe(fn2);
	});

	it('can bind multiple handlers to one event', function() {
		var dog = new Animal();

		dog.bind('click', function() {});
		dog.bind('click', function() {});
		dog.bind('close', function() {});

		expect(dog._handlers['click'].length).toBe(2);
		expect(dog._handlers['close'].length).toBe(1);
		dog.unbind('click');
		expect(dog._handlers['click']).toBeUndefined();
		expect(dog._handlers['close'].length).toBe(1);
	});

	it('can bind once', function() {
		var dog = new Animal();
		var clicks = 0;
		dog.bind_once('click', function(num) { clicks += num; });
		dog.trigger('click', 4);
		dog.trigger('click', 4);
		dog.trigger('click', 4);
		dog.trigger('click', 4);
		expect(clicks).toBe(4);
	});

	it('can bind a catch-all event', function() {
		var dog = new Animal();
		var num = 0;

		dog.bind('click', function() { num++; });
		dog.bind('all', function() { num++; });

		dog.trigger('click');
		expect(num).toBe(2);

		dog.trigger('samson');
		dog.trigger('howzer');
		dog.trigger('samson');
		dog.trigger('howzer');

		expect(num).toBe(6);
	});

	it('can trigger events properly', function() {
		var dog = new Animal();
		var c = 0;
		var x = 0;
		var y = "";
		dog.bind('click', function(num) { c++; x += num; });
		dog.bind('click', function(num) { c++; x += (num * 2); });
		dog.bind('fire', function(str) { c++; y += str; });

		dog.trigger('click', 3);
		dog.trigger('fire', 'JETSON, YOU\'RE FIRED.');
		dog.unbind('click');
		dog.unbind('fire');
		dog.trigger('click', 3);
		dog.trigger('fire', 'IGNORE ME!!');
		expect(c).toBe(3);
		expect(x).toBe(9);
		expect(y).toBe('JETSON, YOU\'RE FIRED.');
	});

	it('triggers in proper order', function() {
		var dog = new Animal();
		var num = 6;
		dog.bind('click', function() { num = Math.pow(num, 2); });
		dog.bind('click', function() { num /= 2; });
		dog.trigger('click');
		expect(num).toBe(18);
	});

	it('will forward events', function() {
		var dog = new Animal();
		var cat = new Animal();
		var clicks = 0;

		dog.bind('click', function() { clicks++; });
		cat.trigger('click');
		cat.forward(dog);
		cat.trigger('click');

		expect(clicks).toBe(1);
	});

	it('will forward by filter', function() {
		var dog = new Animal();
		var cat = new Animal();
		var clicks = 0;

		cat.forward(function(ev, arg1) {
			if(arg1 < 4) return dog;
		});

		dog.bind('click', function() { clicks++; });

		cat.trigger('click', 2);
		cat.trigger('click', 1);
		cat.trigger('click', 0);
		cat.trigger('click', 6);
		cat.trigger('click', 4);
		cat.trigger('click', 9);

		expect(clicks).toBe(3);
	});

	it('will detect a forward', function() {
		var dog = new Animal();
		var cat = new Animal();

		expect(cat.forwards_to(dog)).toBe(false);
		cat.forward(dog);
		expect(cat.forwards_to(dog)).toBe(true);
		cat.unforward(dog);
		expect(cat.forwards_to(dog)).toBe(false);
	});

	it('can unforward', function() {
		var dog = new Animal();
		var cat = new Animal();
		var clicks = 0;

		dog.bind('click', function() { clicks++; });
		cat.forward(dog);
		cat.trigger('click');
		cat.unforward(dog);
		cat.trigger('click');
		expect(clicks).toBe(1);
	});
});


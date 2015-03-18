describe('Composer.Class', function() {
	it('will properly define and instantiate classes', function() {
		var c = 0;
		var Animal = Composer.Class({
			data: {
				name: 'moses'
			},

			initialize: function(num)
			{
				c += num;
				this.test = 42;
			}
		});

		var animal1 = new Animal(4);
		var animal2 = new Animal(4);

		animal2.data.name = 'larry';

		expect(animal1 instanceof Animal).toBe(true);
		expect(c).toBe(8);
		expect(animal1.data.name).toBe('moses');
		expect(animal1.data != animal2.data).toBe(true);
		expect(animal1.test).toBe(42);

	});

	it('will allow inheritance and parent methods', function() {
		var c = 0;
		var x = 0;

		var Animal = Composer.Class({
			initialize: function()
			{
				c++;
			},

			noise: function()
			{
				return 'none';
			}
		});

		var Dog = Animal.extend({
			initialize: function()
			{
				this.parent();
				x++;
			},

			noise: function()
			{
				return 'bark';
			}
		});

		var Cat = Animal.extend({
			initialize: function()
			{
				x++;
			},

			noise: function()
			{
				return 'not so funny meow is it';
			}
		});

		var dog = new Dog();
		var cat = new Cat();

		expect(dog instanceof Animal).toBe(true);
		expect(cat instanceof Animal).toBe(true);
		expect(c).toBe(1);
		expect(x).toBe(2);
		expect(dog.noise()).toBe('bark');
		expect(cat.noise()).toBe('not so funny meow is it');
	});

	it('will allow calling this.parent() nested', function() {
		var sounds = [];

		// use eventing for a specific test case
		var Animal = Composer.Event.extend({
			sound_off: function(sound) { sounds.push(sound); }
		});
		var Dog = Animal.extend({
			initialize: function()
			{
				this.bind('sound-off', function(sound) {
					if(sound != 'woof') return;
					this.sound_off('grr');
				}.bind(this));
			},

			sound_off: function(sound)
			{
				this.trigger('sound-off', sound);
				this.parent(sound);
			}
		});
		var Shiba = Dog.extend({
			sound_off: function(sound)
			{
				this.trigger('sound-off', sound);
				this.parent(sound);
			}
		});

		var dog = new Shiba();
		dog.sound_off('woof');
		expect(JSON.stringify(sounds)).toBe('["grr","grr","woof"]');
	});

	it('will return values from nested parent() calls', function() {
		var Animal = Composer.Class.extend({
			get_legs: function() { return 0; }
		});
		var Dog = Animal.extend({
			get_legs: function() { return this.parent() + 4; }
		});
		var Timmy = Dog.extend({
			get_legs: function() { return this.parent() - 1; }
		});

		var timmy = new Timmy();
		expect(timmy.get_legs()).toBe(3);
	});

	it('will merge_extend other classes properly', function() {
		var Band = Composer.Class({
			play: function() { return 'la la la'; }
		});
		Composer.merge_extend(Band, ['members']);

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

	it('will handle merge_extend/parent methods properly', function() {
		var Animal = Composer.Class({
			eats: {stuff: true},
			sound: function() { return []; }
		});
		Composer.merge_extend(Animal, ['eats']);
		var Dog = Animal.extend({
			eats: {poop: true},
			sound: function()
			{
				var sounds = this.parent();
				sounds.push('woof');
				return sounds;
			}
		});
		var Breed = Dog.extend({ });
		var Shiba = Breed.extend({
			eats: {dead_rats: true},
			sound: function()
			{
				var sounds = this.parent();
				sounds.push('harrrr');
				return sounds;
			}
		});

		var shiba = new Shiba();
		expect(shiba.eats.stuff).toBe(true);
		expect(shiba.eats.poop).toBe(true);
		expect(shiba.eats.dead_rats).toBe(true);
		expect(shiba.sound()[0]).toBe('woof');
		expect(shiba.sound()[1]).toBe('harrrr');
	});
});


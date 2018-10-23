describe('Composer.Controller', function() {
	var MyController = Composer.Controller.extend({
		inject: '#test',

		elements: {
			'h1': 'title'
		},

		events: {
			'click h1': 'click_title'
		},

		clicked_h1: false,

		init: function()
		{
			this.render();
		},

		render: function()
		{
			this.html('<h1>Mai title</h1><p>Lorum ippsem dollar sin amut or something<span>lol</span></p><div class="gutter"></div>');
		},

		click_title: function()
		{
			this.clicked_h1 = true;
		}
	});

	it('can be instantiated properly (and inits elements properly)', function() {
		var con = new MyController({param1: 'omg'});
		expect(con.cid().match(/^c[0-9]+/)).toBeTruthy();
		expect(con instanceof Composer.Controller).toBe(true);
		expect(con.param1).toBe('omg');
		expect(con.clicked_h1).toBe(false);
		con.click_title();
		expect(con.clicked_h1).toBe(true);
		expect(con.el.tagName.toLowerCase()).toBe('div');
		expect(con.title.tagName.toLowerCase()).toBe('h1');
	});

	it('will release properly (delete the el)', function() {
		var con = new MyController();
		var test = document.getElementById('test');
		var el = con.el;
		expect(el.parentNode).toBe(test);
		con.release();
		if(el.parentNode)
		{
			expect(el.parentNode.tagName).toBeUndefined();
		}
		else
		{
			expect(el.parentNode).toBe(null);
		}
	});

	it('can delegate events properly', function() {
		var con = new MyController();
		var title = con.title;
		expect(con.clicked_h1).toBe(false);
		Composer.fire_event(title, 'click');
		expect(con.clicked_h1).toBe(true);

		var x = 0;
		var Hard = Composer.Controller.extend({
			inject: '#test',
			elements: {
				'span': 'my_span',
				'div': 'my_div'
			},
			events: { 'click div': 'reg_click' },
			init: function() { this.render(); },
			render: function() { this.html('<div><span>hello</span></div>'); },
			reg_click: function() { x++; }
		});
		var hard = new Hard();
		Composer.fire_event(hard.my_div, 'click');
		Composer.fire_event(hard.my_span, 'click');
		expect(x).toBe(2);
	});

	it('will create non-injected elements', function() {
		var Controller = Composer.Controller.extend({
			elements: { 'h1': 'the_title' },

			init: function()
			{
				this.html('<h1>LOOL</h1><p>text text omg</p>');
			}
		});
		var con = new Controller();
		if(con.el.parentNode)
		{
			expect(con.el.parentNode.tagName).toBeUndefined();
		}
		else
		{
			expect(con.el.parentNode).toBeFalsy();
		}
		expect(con.the_title.innerHTML).toBe('LOOL');
	});

	it('properly merges elements/events when extending', function() {
		var Ext = MyController.extend({
			elements: {
				'p': 'my_p',
				'span': 'my_span'
			},
			events: {
				'click p': 'click_p',
				'click p span': 'click_span',
				'click': 'click_el'
			},

			clicked_p: 0,
			clicked_span: 0,
			clicked_el: 0,

			init: function()
			{
				this.parent();
			},

			click_p: function()
			{
				this.clicked_p++;
			},

			click_span: function()
			{
				this.clicked_span++;
			},

			click_el: function()
			{
				this.clicked_el++;
			}
		});

		var ext = new Ext();
		expect(ext.clicked_h1).toBe(false);
		expect(ext.clicked_p).toBe(0);
		expect(ext.clicked_span).toBe(0);
		expect(ext.elements['h1']).toBeDefined();
		expect(ext.elements['p']).toBeDefined();
		expect(ext.events['click h1']).toBeDefined();
		expect(ext.events['click p']).toBeDefined();
		expect(ext.events['click p.test']).toBeUndefined();

		Composer.fire_event(ext.my_p, 'click');
		Composer.fire_event(ext.my_p, 'click');

		expect(ext.clicked_h1).toBe(false);
		expect(ext.clicked_p).toBe(2);
		expect(ext.clicked_span).toBe(0);
		expect(ext.clicked_el).toBe(2);
	});

	it('will properly replace its el (and refresh elements/events)', function() {
		var con = new MyController();
		var div = document.createElement('div');
		var h1 = document.createElement('h1');
		h1.innerHTML = 'Replaced';
		div.appendChild(h1);
		con.replace(div);

		expect(con.title == h1).toBe(true);
		expect(con.clicked_h1).toBe(false);
		Composer.fire_event(h1, 'click');
		expect(con.clicked_h1).toBe(true);
	});

	it('will properly manage bindings (with_bind)', function() {
		var model = new Composer.Model();
		var rendered = 0;
		var clicked = 0;
		var omgomg = 0;
		var Manager = Composer.Controller.extend({
			model: false,

			init: function()
			{
				if(!this.model) return false;
				this.with_bind(this.model, 'click', this.click.bind(this));
				this.with_bind(this.model, 'change', this.render.bind(this));
				this.with_bind(this.model, ['my', 'dog'], this.render.bind(this));
				this.with_bind_once(this.model, 'omg', this.omg.bind(this));
			},

			render: function()
			{
				rendered++;
			},

			click: function()
			{
				clicked++;
			},

			omg: function()
			{
				omgomg++;
			}
		});
		var con = new Manager({model: model});

		model.set({name: 'jello'});
		model.set({age: 27});
		model.trigger('click');
		model.trigger('omg');
		model.trigger('omg');
		model.trigger('omg');
		model.trigger('omg');
		model.trigger('omg');

		expect(rendered).toBe(2);
		expect(clicked).toBe(1);
		expect(omgomg).toBe(1);

		con.release();

		model.set({ignoreme: 'yes'});
		model.trigger('click');
		model.trigger('omg');

		expect(rendered).toBe(2);
		expect(clicked).toBe(1);
		expect(omgomg).toBe(1);
	});

	it('will not fire with_bind events on a released controller', function() {
		var tsst = 0;

		var dog = new Composer.Event();
		var Walker = Composer.Controller.extend({
			init: function()
			{
				this.with_bind(dog, 'bark', function() { tsst++; });
			}
		});

		var walker;
		dog.bind('bark', function() { walker.release(); });
		walker = new Walker();
		dog.trigger('bark');
		expect(tsst).toBe(0);
	});

	it('will properly manage sub-controllers', function() {
		var sub_released = 0;
		var Sub = Composer.Controller.extend({
			init: function()
			{
			},

			release: function()
			{
				sub_released++;
				return this.parent.apply(this, arguments);
			}
		});
		var Master = Composer.Controller.extend({
			elements: {
				'.sub': 'sub_container'
			},

			init: function()
			{
				this.sub('Sub2', function() {
					return new Sub();
				});
				this.remove('Sub2');
			},

			render: function()
			{
				this.html('<div class="sub"></div>');
				this.sub('Sub', function() {
					return new Sub();
				});
			}
		});
		var master = new Master();
		master.render();
		master.render();
		master.render();
		expect(sub_released).toBe(3);
		expect(master.sub('Sub') instanceof Sub).toBe(true);
	});

	it('triggers subcontrollers when discussing the planet pluto', function() {
		var sub_count = 0;
		var Sub = Composer.Controller.extend({
			init: function() {
				this.bind('pluto', function(count) { sub_count += count; });
			}
		});
		var Main = Composer.Controller.extend({
			init: function() {
				this.sub('killll-meeeeee', function() { return new Sub(); });
				this.sub('get-a-job', function() { return new Sub(); });
			}
		});

		var main = new Main();
		main.trigger_subs('pluto', 3);
		main.trigger_subs('pluto', 2);
		expect(sub_count).toBe(10);
	});

	it('will merge_extend other classes properly', function() {
		var Band = Composer.Controller.extend({
			play: function() { return 'la la la'; }
		});
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

	it('will set className properly', function() {
		var Item1 = Composer.Controller.extend({
			// deprecated, but we want to support it
			className: 'myclass'
		});
		var Item2 = Composer.Controller.extend({
			class_name: 'top doge'
		});

		var con1 = new Item1();
		var con2 = new Item2();

		expect(con1.el.className).toContain('myclass');
		expect(con2.el.className).toContain('top doge');
		con1.release();
		con2.release();
	});

	it('supports the old subcontroller api', function() {
		var sub_init = 0;
		var sub_release = 0;
		var SubController = Composer.Controller.extend({
			init: function()
			{
				sub_init++;
				this.bind('release', function() { sub_release++; });
			}
		});

		var MasterController = Composer.Controller.extend({
			elements: { 'div': 'el_div' },

			init: function()
			{
				this.render();
			},

			render: function()
			{
				this.html('<div></div>');
				this.track_subcontroller('sub1', function() {
					return new SubController({ inject: this.el_div });
				}.bind(this));
			}
		});

		var con = new MasterController();
		expect(sub_init).toBe(1);
		con.render();
		con.render();
		expect(sub_init).toBe(3);
		expect(sub_release).toBe(2);
		expect(con.get_subcontroller('sub1')).toBe(con.sub('sub1'));
		expect(con.get_subcontroller('sub1') instanceof SubController).toBe(true);
		con.remove_subcontroller('sub1');
		expect(sub_init).toBe(3);
		expect(sub_release).toBe(3);

	});

	it('only fires a element event once even if there are multiple targets', function() {
		var ClickerController = Composer.Controller.extend({
			events: {
				'click .clickme': 'clicked',
			},

			count: 0,

			init: function() {
				this.render();
			},

			render: function() {
				this.html([
					'<div rel="first" class="clickme">Hello</div>',
					'<div rel="second" class="clickme">Hello</div>',
				].join('\n'));
			},

			clicked: function(e) {
				this.count++;
			},
		});
		var con = new ClickerController();
		var el = Composer.find(con.el, '.clickme');
		Composer.fire_event(el, 'click');
		expect(con.count).toBe(1);
	});
});


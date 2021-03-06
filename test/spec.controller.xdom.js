describe('Composer.Controller.xdom', function() {
	var MyController = Composer.Controller.extend({
		inject: '#test',
		xdom: true,

		elements: {
			'h1': 'title'
		},

		events: {
			'click h1': 'click_title'
		},

		clicked_h1: false,

		init: function()
		{
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

	var InputDoge = Composer.Controller.extend({
		xdom: true,
		elements: {
			'input': 'inp',
		},
		render: function(options) {
			return new Promise(function(resolve) {
				var opts = Composer.object.merge({}, options, {complete: resolve});
				this.html('<div><input id="input-doge-'+this.cid()+'" type="text" value="" name="gffft"></div>', opts);
			}.bind(this));
		},
		val: function(val) {
			if(!this.inp) return false;
			if(typeof(val) == 'undefined') {
				return this.inp.value;
			} else {
				this.inp.value = val;
				return val;
			}
		}
	});

	it('can be instantiated properly (and inits elements properly)', function(done) {
		var con = new MyController({param1: 'omg'});
		expect(con.cid().match(/^c[0-9]+/)).toBeTruthy();
		expect(con instanceof Composer.Controller).toBe(true);
		expect(con.param1).toBe('omg');
		expect(con.el.tagName.toLowerCase()).toBe('div');
		expect(con.clicked_h1).toBe(false);
		expect(con.title).toBeFalsy();
		con.bind_once('xdom:render', function() {
			con.click_title();
			expect(con.clicked_h1).toBe(true);
			expect(con.el.tagName.toLowerCase()).toBe('div');
			expect(con.title.tagName.toLowerCase()).toBe('h1');
			done();
		});
		con.render();
	});

	it('calls the html(..., {complete: fn}) callback when rendering done', function(done) {
		var Con = Composer.Controller.extend({
			xdom: true,
			init: function()
			{
				this.html('hai', {complete: this.trigger.bind(this, 'HELLO-YES-THIS-IS-DOG')});
			}
		});
		var con = new Con();
		con.bind_once('HELLO-YES-THIS-IS-DOG', function() {
			done();
		});
	});

	it('can delegate events properly', function(done) {
		var con = new MyController();
		con.bind_once('xdom:render', function() {
			var title = con.title;
			expect(con.clicked_h1).toBe(false);
			Composer.fire_event(title, 'click');
			expect(con.clicked_h1).toBe(true);

			var x = 0;
			var Hard = MyController.extend({
				inject: '#test',
				elements: {
					'span': 'my_span',
					'div': 'my_div'
				},
				events: { 'click div': 'reg_click' },
				init: function() { this.render(); },
				render: function()
				{
					this.html('<div><span>hello</span></div>');
				},
				reg_click: function() { x++; }
			});
			var hard = new Hard();
			hard.bind_once('xdom:render', function() {
				Composer.fire_event(hard.my_div, 'click');
				Composer.fire_event(hard.my_span, 'click');
				expect(x).toBe(2);
				done();
			});
		});
		con.render();
	});

	it('will preserve input elements', function(done) {
		var InpController = Composer.Controller.extend({
			xdom: true,

			elements: {
				'input[name=name]': 'inp_name',
				'textarea': 'inp_body',
				'select': 'inp_select',
				'input[name=checky]': 'inp_check',
				'input#rad1': 'inp_radio1',
				'input#rad2': 'inp_radio2',
				'input[name=fily]': 'inp_file',
				'option.pickme': 'inp_option',
			},

			render: function()
			{
				var html = [
					'<input name="name" type="text">', 
					'<textarea name="body"></textarea>',
					'<select name="choice">',
					'	<option value="1" selected>hmm this simply won\'t do</option>',
					'	<option value="2">no, certainly not this one</option>',
					'	<option class="pickme" value="3">definitely not!!</option>',
					'	<option value="4">yes, this pile of sawdust is perfect!</option>',
					'</select>',
					'<input type="file" name="fily" class="bogart">',
					'<input type="checkbox" name="checky">',
					'<input id="rad1" type="radio" name="radbrahhhhhh" value="1">',
					'<input id="rad2" type="radio" name="radbrahhhhhh" value="2">'
				].join('\n');
				this.html(html);
			}
		});
		var con = new InpController();
		con.bind_once('xdom:render', function() {
			var inp1 = con.inp_name;
			var txt1 = con.inp_body;
			var sel1 = con.inp_select;
			var opt1 = con.inp_option;
			var chk1 = con.inp_check;
			var rad1 = con.inp_radio1;
			var rad2 = con.inp_radio2;
			var file = con.inp_file;
			expect(opt1.selected).toBe(false);
			inp1.value = 'omg lol';
			txt1.value = 'wtf';
			sel1.value = '3';
			expect(opt1.selected).toBe(true);
			chk1.checked = true;
			rad2.checked = true;
			file.className = 'harrr';
			con.bind_once('xdom:render', function() {
				var inp2 = con.inp_name;
				var txt2 = con.inp_body;
				var sel2 = con.inp_select;
				var chk2 = con.inp_check;
				var rad3 = con.inp_radio1;
				var rad4 = con.inp_radio2;
				var file = con.inp_file;
				expect(inp1.value).toBe('omg lol');
				expect(txt1.value).toBe('wtf');
				expect(sel1.value).toBe('3');
				expect(opt1.selected).toBe(true);
				expect(inp1.value).toBe(inp2.value);
				expect(txt1.value).toBe(txt2.value);
				expect(sel1.value).toBe(sel2.value);
				expect(chk1.checked).toBe(chk2.checked);
				expect(rad1.checked).toBeFalsy();
				expect(rad2.checked).toBe(true);
				expect(inp1).toBe(inp2);
				expect(txt1).toBe(txt2);
				expect(sel1).toBe(sel2);
				expect(chk1).toBe(chk2);
				expect(rad1).toBe(rad3);
				expect(rad2).toBe(rad4);
				expect(file.className).toBe('bogart');
				done();
			});
			con.render();
		});
		con.render();
	});

	it('treats subcontrollers the same as non xdom', function(done) {
		var ChildController = Composer.Controller.extend({
			xdom: true,
			init: function()
			{
				this.render();
			},

			render: function()
			{
				this.html('<p>Get a job, sir.</p>');
			}
		});
		var tracked = 0;
		var MasterController = Composer.Controller.extend({
			xdom: true,

			elements: {
				'.sub': 'el_sub'
			},

			init: function()
			{
			},

			render: function()
			{
				this.html('<h1>test</h1><div class="sub"></div>', {
					complete: function() {
						this.sub('child', function() {
							tracked++;
							return new ChildController({
								inject: this.el_sub
							});
						}.bind(this));
					}.bind(this)
				});
			}
		});

		var con = new MasterController();
		con.bind_once('xdom:render', function() {
			var child = con.sub('child');
			var el = child.el;
			expect(child instanceof Composer.Controller).toBe(true);
			expect(el.parentNode).toBe(con.el_sub);
			con.bind_once('xdom:render', function() {
				var child = con.sub('child');
				expect(child.el.parentNode).toBe(con.el_sub);
				expect(el == child.el).toBe(false);
				expect(tracked).toBe(2);
				done();
			});
			con.render();
		});
		con.render();
	});

	it('preserves subcontroller\'s el when re-rendering', function(done) {
		var SubController = Composer.Controller.extend({
			xdom: true,
			init: function() { this.html('<p>hello</p>'); }
		});

		var rendered = 0;
		var MasterController = Composer.Controller.extend({
			xdom: true,

			elements: {
				'h1': 'el_h1',
				'.sub': 'el_sub'
			},

			model: null,

			init: function()
			{
				this.render({
					complete: function() {
						this.sub('jerry', function() {
							return new SubController({ inject: this.el_sub });
						}.bind(this));
					}.bind(this)
				});
				this.with_bind(this.model, 'change', this.render.bind(this));
			},

			render: function(options)
			{
				options || (options = {})
				rendered++;
				this.html('<h1>name: '+this.model.get('name')+'</h1>', options);
			}
		});

		var model = new Composer.Model({name: 'biff'});
		var con = new MasterController({ model: model });
		con.bind_once('xdom:render', function() {
			var el = con.sub('jerry').el;
			var render_cb = 0;
			con.bind('xdom:render', function() { render_cb++; });
			model.set({name: 'slappy'});
			model.set({name: 'wtf'});
			con.bind_once('xdom:render', function() {
				expect(rendered).toBe(3);
				expect(el).toBe(con.sub('jerry').el);
				expect(con.el_h1.innerHTML).toBe('name: wtf');
				done();
			});
		});
	});

	it('cancels a render if released mid-render', function(done) {
		var render_completes = 0;
		var Doge = Composer.Controller.extend({
			xdom: true,
			init: function() {
				this.bind_once('xdom:render', function() { render_completes++; });
			},
			render: function() {
				return this.html('<p>hai</p>');
			},
		});
		var doge = new Doge();
		doge.render();
		doge.release();
		setTimeout(function() {
			expect(render_completes).toBe(0);
			done();
		}, 200);
	});

	it('resets form elements if told to do so', function(done) {
		var doge = new InputDoge();
		doge.render()
			.then(function() {
				expect(doge.val()).toBe('');
				doge.val('hai');
				return doge.render();
			})
			.then(function() {
				expect(doge.val()).toBe('hai');
				return doge.render({reset_inputs: true});
			})
			.then(function() {
				expect(doge.val()).toBe('');
			})
			.finally(done);
	});

	it('allows pre-render element transformations', function(done) {
		var doge = new InputDoge();
		var ran_transform = false;
		doge.render()
			.then(function() {
				return doge.render({
					before_update: function(from, to) {
						ran_transform = true;
					}
				});
			})
			.finally(function() {
				expect(ran_transform).toBe(true);
			})
			.finally(done);
	});
});


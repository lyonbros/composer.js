describe('Composer.ListController.xdom', function() {
	var Sub = Composer.Controller.extend({
		xdom: true,
		tag: 'li',
		model: null,
		init: function() { this.render(); },
		render: function() { this.html('<h1>'+this.model.get('name')+'</h1>'); }
	});

	var List = Composer.ListController.extend({
		xdom: true,
		elements: {'ul': 'el_list'},
		model: null,
		collection: null,
		init: function()
		{
			this.render({complete: function() {
				this.track(this.collection, function(model, options) {
					return new Sub({
						inject: options.container,
						model: model
					});
				}, {
					container: this.el_list,
					fragment_on_reset: true
				});
			}.bind(this)}, {
				container: function() { return this.el_list; }.bind(this)
			});
			this.with_bind(this.model, 'change', this.render.bind(this));
		},

		render: function(options)
		{
			var complete = options.complete;
			options.immediate = false;
			this.html('<h1>'+this.model.get('title')+'</h1><ul></ul>', options);
		}
	});

	it('preserves the child controllers\' elements on html()', function(done) {
		var model = new Composer.Model({title: 'get a job'});
		var collection = new Composer.Collection();
		collection.add({name: 'barry'});
		collection.add({name: 'larry'});
		collection.add({name: 'jerry'});
		var con = new List({model: model, collection: collection});
		var con_renders = 0;
		var jerry = collection.find(function(m) { return m.get('name') == 'jerry'; });
		con.bind('xdom:render', function() { con_renders++; });
		con.bind_once('xdom:render', function() {
			expect(con.el_list.childNodes.length).toBe(3);
			expect(con_renders).toBe(1);
			con.bind_once('xdom:render', function() {
				expect(con.el_list.childNodes.length).toBe(3);
				expect(con_renders).toBe(2);
				collection.remove(jerry);
				expect(con.el_list.childNodes.length).toBe(2);
				done();
			});
			model.set({title: 'omg lol wtf'});
		});
	});
});


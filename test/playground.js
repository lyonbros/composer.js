var Dog = Composer.Model.extend({ });
var TestController = Composer.Controller.extend({
	inject: '#app',

	elements: {
		'span': 'el_status'
	},

	events: {
		'click input[type=button]': 'run_test'
	},

	init: function()
	{
		this.render();
	},

	render: function()
	{
		this.html('<input type="button" name="test" value="run">&nbsp;<span></span>');
	},

	run_test: function()
	{
		this.el_status.set('html', 'running');
		setTimeout(function() {
			test();
			setTimeout(function() {
				this.el_status.set('html', 'complete');
			}.bind(this));
		}.bind(this))
	}
});

var dog;
window.addEvent('domready', function() {
	new TestController();
});

var _perf = {first: window.performance.now(), last: window.performance.now()};
function perf(where, options)
{
	options || (options = {});
	var now = window.performance.now();
	if(options.reset) _perf.first = _perf.last = now;

	// `where` should always be n chars, w/ space padding
	for(var i = 0, n = (24 - where.length); i < n; i++) where = ' ' + where;
	console.log(where + ': ', now - _perf.last, now - _perf.first);
	_perf.last = now;
}

function test(n)
{
	n || (n = 99999);
	perf('start', {reset: true});
	for(var i = 0; i < n; i++)
	{
		var dog = new Dog();
	}
	perf('end');
}

function time(n, op)
{
	var start = window.performance.now();
	for(var i = 0; i < n; i++) { op(); };
	console.log('done: ', window.performance.now() - start);
}

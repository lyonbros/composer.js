Slick.definePseudo('docheader', function() {
	return this.tagName.match(/^h[23]/i);
});

var app = {
	init_toc: function()
	{
		var doc = document.getElement('.documentation');
		if(!doc) return false;

		var toc = doc.getElement('> .toc');
		if(!toc) return false;

		var headers = doc.getElements(':docheader()');
		var ul = new Element('ul').inject(toc);
		var last = [];
		var level = 2;
		var last_li = null;
		headers.each(function(h) {
			var id = h.get('html')
				.replace(/\(.*/, '')
				.replace(/[^a-z0-9 ]/gi, '')
				.replace(/\s+/g, '-')
				.replace(/(^-|-$)/g, '');
			h.id = id;
			var a = '<a href="#'+id+'">'+h.get('html')+'</a>';
			var newlevel = parseInt(h.tagName.replace(/^h/i, ''));
			var li = new Element('li').set('html', a);
			if(newlevel > level && last_li)
			{
				last.push(ul);
				ul = new Element('ul').inject(last_li);
			}
			else if(newlevel < level)
			{
				ul = last.pop();
			}
			li.inject(ul);
			last_li = li;
			level = newlevel;
		});
	},

	init_eval: function()
	{
		var doc = document.getElement('.documentation');
		if(!doc) return false;

		var code = doc.getElements('.highlight > pre > code');
		code.forEach(function(el) {
			var hl = el.getParent().getParent();
			var code = el.get('html').replace(/<.*?>/g, '');
			var btn = new Element('input[type=button]').addEvent('click', function() {
				var fn = new Function(code);
				fn();
			}).set('value', 'Try it').inject(hl, 'bottom');
		});
	},

	init_highlight: function()
	{
		var doc = document.getElement('.documentation');
		if(!doc) return false;

		doc.getElements('.highlight pre code').each(function(el) {
			hljs.highlightBlock(el);
		});
	}
};

window.addEvent('domready', function() {
	app.init_toc();
	app.init_eval();
	app.init_highlight();
});


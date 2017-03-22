Slick.definePseudo('docheader', function() {
	return this.tagName.match(/^h[23]/i);
});

var app = {
	init_toc: function()
	{
		var el = document.getElement('.show-toc');
		if(!el) return false;

		var toc = el.getElement('> .toc');
		if(!toc) return false;

		var used_ids = {};

		var headers = el.getElements(':docheader()');
		var ul = new Element('ul').inject(toc);
		var last = [];
		var level = 2;
		var last_li = null;
		var process_meta = function(str)
		{
			return str
				.replace(/ :: attribute\((.*?)\).*?$/, '<code>attribute, default: $1</code>')
				.replace(/ :: function(.*?)$/, '<code>function $1</code>');
		};
		headers.each(function(h) {
			var no_attr = h.get('html').replace(/ :: .*/, '');
			h.set('html', process_meta(h.get('html')));
			h.set('html', h.get('html').replace(/ :: (.*?)$/, '<code>$1</code>'));
			var id = no_attr
				.replace(/&lt;/g, '-')
				.replace(/&gt;/g, '-')
				.replace(/[^a-z0-9\._ -]/gi, '')
				.replace(/[\._ ]+/g, '-')
				.replace(/(^-|-$)/g, '')
				.toLowerCase();
			while(used_ids[id])
			{
				id += '-1';
			}
			used_ids[id] = true;
			h.id = id;
			var a = '<a href="#'+id+'">'+no_attr+'</a>';
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
		if(toc.getElement('ul').getChildren().length == 0)
		{
			toc.setStyle('display', 'none'); 
		}
	},

	init_eval: function()
	{
		var el = document.getElement('.show-eval');
		if(!el) return false;

		var code = el.getElements('.highlight > pre > code');
		code.forEach(function(el) {
			var entity_unescape = function(input)
			{
				var e = document.createElement('div');
				e.innerHTML = input;
				return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
			};
			var hl = el.getParent().getParent();
			var code = entity_unescape(el.get('html').replace(/<.*?>/g, ''));
			var btn = new Element('input[type=button]').addEvent('click', function() {
				var fn = new Function(code);
				fn();
			}).set('value', 'Try it').inject(hl, 'bottom');
		});
	},

	init_highlight: function()
	{
		var el = document.getElement('.do-highlight');
		if(!el) return false;

		el.getElements('.highlight pre code').each(function(el) {
			hljs.highlightBlock(el);
		});
	}
};

window.addEvent('domready', function() {
	app.init_toc();
	app.init_eval();
	app.init_highlight();
});


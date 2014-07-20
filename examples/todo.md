---
title: Example | Simple TODO app
layout: documentation
---

# Simple TODO app

Here it is, the obligatory javascript MVC framework TODO app. However, ours is
better than everyone else's because it uses Composer. There are swaths of
emperical evidence to support this claim (which we will link to at a later
time).

Until then, here's the app (click __"Try it"__ to load):

<div id="todo-container" style="display: none;">
    <h1>Todos</h1>
	<div class="app"></div>
</div>

{% highlight js %}
// The todo model. Each instance of this class represents one todo
var Todo = Composer.Model.extend({
	defaults: {
		name: '',
		complete: false
	}
});

// A collection that is used to hold any number of todo models.
var TodosList = Composer.Collection.extend({
	model: Todo
});

// The controller responsible for displaying a todo. It also handles editing and
// marking a todo as complete.
var TodoDisplay = Composer.Controller.extend({
	tag: 'li',
	className: 'clear',

	events: {
		'dblclick h3': 'edit_todo',
		'submit form.edit': 'do_edit_todo',
		'click input[type=checkbox]': 'toggle_complete',
		'click a.delete': 'delete_todo',
	},

	elements: {
		'h3': 'title',
		'form.edit': 'edit_form',
		'form.edit input[type=text]': 'inp_edit_name'
	},

	model: null,

	init: function()
	{
		// on model change, re-display
		this.model.bind('change', this.render.bind(this));

		// when model is destroyed (aka deleted) release this controller (pull its
		// "this.el" out of the DOM)
		this.model.bind('destroy', this.release.bind(this));

		// initial display
		this.render();
	},

	render: function()
	{
		// render the HTML for the todo. Note that we are doing it by hand, but
		// you are welcome to use a templating engine if it pleases you.
		this.html(
			'<input type="checkbox" '+ (this.model.get('complete', false) ? 'checked' : '') +'/>'+
			'<h3>'+this.model.get('name')+'</h3>'+
			'<form class="edit">'+
			'	<input type="text" value="'+this.model.get('name')+'" />'+
			'	<input type="submit" />'+
			'</form>'+
			'<div class="actions">'+
			'	<a class="delete" href="#delete-'+this.model.id()+'">X</a>'+
			'</div>'
		);

		// switch off the edit form
		this.edit_form.setStyle('display', 'none');

		// set the proper top-level class
		if(this.model.get('complete', false))
		{
			this.el.addClass('complete');
		}
		else
		{
			this.el.removeClass('complete');
		}
	},

	edit_todo: function(e)
	{
		if(e) e.stop();

		// hide title, display edit form
		this.edit_form.setStyle('display', 'block');
		this.title.setStyle('display', 'none');
		this.inp_edit_name.focus();
	},

	do_edit_todo: function(e)
	{
		if(e) e.stop();
		var name	=	this.inp_edit_name.value;
		if(name == this.model.get('name'))
		{
			// the new name is the same as the name, switch the form out for the
			// title
			this.edit_form.setStyle('display', 'none');
			this.title.setStyle('display', '');
		}
		else
		{
			// set the new name back into the model. no need to worry about
			// setting the form to display: none since the view is about to
			// re-render anyways once it detects this change.
			this.model.set({name: name});
		}
	},

	toggle_complete: function(e)
	{
		if(e) e.stop();

		var complete	=	this.model.get('complete', false);
		this.model.set({complete: !complete});
	},

	delete_todo: function(e)
	{
		if(e) e.stop();

		// this, among other things, triggers the model's "destroy" event, which
		// the controller binds to in init().
		this.model.destroy();
	}
});

// Loads and runs the Todo application. In most sufficiently complicated apps,
// the top-level object most likely won't need to be a Controller, but in this
// specific case it makes sense because the app fits nicely into the mold of
// needing a controller.
var TodoApp = Composer.Controller.extend({
	el: '#todo-container .app',

	events: {
		'submit form': 'add_todo',
		'click .clear-complete': 'clear_complete'
	},

	elements: {
		'form input[type=text]': 'inp_name',
		'.info .left': 'num_left',
		'.info .clear-complete': 'clear_btn',
        'ul.todos': 'todo_list'
	},

	// collection holding our Todos
	todos: null,

	init: function()
	{
		// instantiate our list of todos and bind our needed events to it
		this.todos	=	new TodosList();
		this.todos.bind('add', this.do_add.bind(this));
		this.todos.bind('all', this.update_info.bind(this));	// call update_info whenever anything happens in the collection

		// render the app
		this.render();
	},

	render: function()
	{
		// create the main HTML for the app and set it into this.el (the same
		// as "#todo-container .app")
		this.html(
			'<form class="add">'+
			'	<input type="text" name="name" placeholder="What do you have to do?" />'+
			'	<input type="submit"/>'+
			'</form>'+
			'<ul class="todos"></ul>'+
			'<div class="info clear">'+
			'	<span class="left"></span>'+
			'	<button class="clear-complete">Clear Completed</button>'+
			'</div>'
		);

		// manually update the info display
		this.update_info();

		return this;
	},

	add_todo: function(e)
	{
		if(e) e.stop();
		var todotxt	=	this.inp_name.value;
		if(todotxt.clean() == '') return false;

		// create a Todo model with the given data
		var todo	=	new Todo({name: todotxt});

		// add the Todo model to our Todo collection (which will in turn display the
		// todo item...see TodoApp.init() when it binds the collection's "add" event)
		this.todos.add(new Todo({name: todotxt}));

		this.inp_name.value	=	'';
		this.inp_name.focus();
	},

	do_add: function(todo)
	{
		// create a new TodoDisplay Controller to show the todo we just created.
		// it will insert itself into the <ul> list automatically when it's 
		// instantiated.
		var displayTodo	=	new TodoDisplay({
            inject: this.todo_list,
            model: todo
        });
	},

	clear_complete: function(e)
	{
		if(e) e.stop();

		// find all "complete" todos and .destroy() them >=]
		this.todos.select({complete: true}).each(function(m) { m.destroy(); });
	},

	update_info: function()
	{
		// update our "X items left..." text
		var num_left	=	this.todos.select({complete: false}).length;
		this.num_left.set('html', '<strong>'+num_left+'</strong> items in your list.');

		// show or hide the "Clear completed" button based on whether any todos
		// are marked as complete or not.
		var num_complete	=	this.todos.select({complete: true}).length;
		if(num_complete > 0)
		{
			this.clear_btn.setStyle('visibility', '');
		}
		else
		{
			this.clear_btn.setStyle('visibility', 'hidden');
		}
	}
});

// show the container
Composer.find(document, '#todo-container').style.display = 'block';

// load it!
new TodoApp();
{% endhighlight %}

# Composer.js #
Check out [Composer's documentation](http://lyonbros.github.com/composer.js/).

Composer.js is an MVC framework for MooTools >= 1.3. While there are some very
good MVC frameworks out there (backbone.js and Spine, which composer.js pulls a
lot of functionality from), the options for MooTools are lacking. We needed
something as good as the jQuery MVC frameworks but for MooTools.

The framework is now in beta, and is being used to power two projects we're
actively working on. The more we use it, the more bugs we fix and the more we 
find what belongs and what doesn't. In other words, it works great, but it's
still growing and changing slowly.

## Composer modules ##
Composer.js houses the main/stable framework, but we're also building modules
that extend its normal functionality. These are mainly considered beta/alpha
as we're still growing the basic functionality and they are subject to API
changes. So, use at your own risk.

Please [read and understand the documentation](http://lyonbros.github.com/composer.js/) before trying to
use the extra modules. Please also note that the following is by no means an
extensive documentation of the module's features, but more so a description
of some of the capabilities.

### Composer.Relational.js ###
This is an extension of Composer.Model. It allows you to set up relationships
in your data that will automatically map out models/collections for you. Here's
an example of what happens when you try to nest data structures in your model:

	var Band = Composer.Model.extend({
	});

	var zep = new Band({
		name: 'Led Zeppelin',
		members: [
			{name: 'Jimmy Page'},
			{name: 'John Paul Jones'},
			{name: 'Robert Plant'},
			{name: 'John Bonham'}
		]
	});

	zep.get('members');		// this is a javascript array containing simple objects

This is fine and well, but what if you want "members" to be a collection? This
is where RelationalModel comes into play:


	var Member = Composer.Model.extend({});
	var Members = Composer.Collection.extend({
		model: Member
	});

    var Band = Composer.RelationalModel.extend({
		relations: {
			members: {
				type: Composer.HasMany,
				collection: Users
			}
		}
	});

	var zep = new Band({
		name: 'Led Zeppelin',
		members: [
			{name: 'Jimmy Page'},
			{name: 'John Paul Jones'},
			{name: 'Robert Plant'},
			{name: 'John Bonham'}
		]
	});

	zep.get('members');		// this is a Composer Collection, each member being a model of type 'Member'

We've been using RelationalModel for quite a few months now without problems, so
I think it's safe to say it's usable. Once again though, it's officially beta
and subject to changes (although not likely because that would be a lot of work
on our part).

### Composer.Keyboard.js ###
This is a _simple_ modules that lets you do global key bindings:

    var kbd = new Composer.Keyboard();
	kbd.bind('esc', function(e) {
		console.log('you pressed escape!!');
	});

Now pressing the _escape_ key prints out 'you pressed escape!!' Gnarly brah.
Composer.Keyboard.bind extends Composer.Events.bind, meaning the callbacks
you pass to it can be named:

    kbd.bind(['left', 'right'], function() { console.log('arrow key'); }, 'named-event');
    kbd.unbind(['left', 'right'], 'named-event');  // this rids the app of your arrow key event

It can also be detached from the document if you wish to deactivate global key
handling:

    kbd.detach();	// removes document.body event listener
    kbd.attach();	// starts listening again.

Or you can destroy it, taking all events with it (good for garbage collection):

    kbd.destroy();

### Composer.FilterCollection.js ###
Documentation coming soon.


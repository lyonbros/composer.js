---
title: Examples | Using the router
layout: page
---

# Using the router

This will show you how the router ties in to your app. We create two controllers
that extend a base controller, and load one of the controllers depending on
which link is clicked.

Notice that the URL bar in the browser updates with the clicked link even
though the page doesn't reload. We're using pushState here, and the router
listens to the pushState events and loads the correct code for the given route.
Even the back button works properly, loading the corresponding controller.

This can be done on a much larger scale, loading top-level controllers for
various "pages" (wink wink) in your app, making it seem like a page has changed
even though everything is still in the same javascript context. It's like a real
desktop app in your browser!

<div id="full-route-example" class="example fade"></div>

{% highlight js %}
// define a base controller the others extend that will a) inject to the correct
// spot, and b) release itself when a successful route happens.
var BaseController = Composer.Controller.extend({
    inject: '#full-route-example div',

    init: function()
    {
        this.render();
        // release ourself on each successful route
        this.with_bind(window.app.router, 'route-success', this.release.bind(this));
    }
});
var UsersController = BaseController.extend({
    render: function()
    {
        this.html('<h1>Users</h1><ul><li>andrew</li><li>leonard</li><li>larry</li></ul>');
    }
});

var NotesController = BaseController.extend({
    render: function()
    {
        this.html('<h1>Notes</h1><ul><li>TODO: get a job</li><li>i had the silliest dream...</li><li>Bookmark: google.com</li></ul>');
    }
});

var routes = {
    '/composer.js/docs/router/users': ['app', 'handle_users'],
    '/composer.js/docs/router/notes': ['app', 'handle_notes'],
};

// define our top-level app
window.app = {
    router: (function() {
        var router = new Composer.Router(routes);
        router.bind_links({
            selector: '#full-route-example a'
        });
        router.bind('fail', function(err) {
            console.log('route: fail: ', err);
        });
        return router;
    })(),

    handle_users: function()
    {
        new UsersController();
    },

    handle_notes: function()
    {
        new NotesController();
    }
}

// create our test links
var container = document.getElementById('full-route-example');
container.innerHTML =
    '<a href="/composer.js/docs/router/users">Load users</a> | ' +
    '<a href="/composer.js/docs/router/notes">Load notes</a>' +
    '<div></div>';
container.className += ' enabled';
{% endhighlight %}


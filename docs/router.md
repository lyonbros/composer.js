---
title: Router
layout: documentation
---

# Router

The router makes it easy to map the current browser URL to an object/function.
It supports regular expression group parameters (routes are written in regular
expressions) and provides some convenience functions.

__Note:__ the Composer.Router object *requires* [History.js](https://github.com/browserstate/history.js/)
in order to function properly. It can be *loaded* without it, but History.js
must be present to use it.

## Events

These are the events fired by routers.

### statechange

Triggered when History.js fires *its* 'statechange' event (happens when using
`History.pushState` et al). Arguments passed:

- the URL we routed to
- the `force` parameter (whether or not we're forcing a route load)

### destroy

Triggered when a router object is [destroyed](#destroy-1). No arguments.

### fail

Triggered when there is a problem routing. Arguments passed:

- description: a JS object that contains the `url` of the route that failed, the
`route` that was found (if any), whether or not the `handler_exists` for the
route that was found, and whether or not the `action_exists` for the route that
was found.

### preroute

Triggered right before a route actually happens. This event is unique because it
allows modifying the URL that the route will be triggred with (without changing
the URL in the browser bar). This essentially gives you URL rewriting abilities
(think mod_rewrite in Apache). Arguments passed:

- boxed path: an object in the format `{path: url_path_str}`. If you change the
`path` key in the boxed object, the router will use the path you provided to
route on instead of the on in the URL bar.

### route

Triggered when a route happens in the router. The router itself listens to this
event to determine when to run the route and its matching code. Arguments
passed:

- The (string) path being routed on

## Composer.Router

The main router class. Extends [Composer.Base](/composer.js/docs/base), giving
it access to all of Base's abilities.

It's important to note that unlike most other Composer objects, the router has
global state (in order to bind to various URL events). As such, __it is advised
to only create one instance of the Composer.Router object at a time__.

### routes :: attribute({})

Holds the route's routing table. Although routes are generally passed to the
[router's constructor](#initialize), we'll document the format here because it
deserves its own section.

Routes are specified in the `{"/url/regex/specifier": ['object', 'function_name']}`
format:

<div class="noeval">
{% highlight js %}
var routes = {
    '/': ['pages', 'home'],
    '/users/([0-9]+)': ['users', 'load'],
    // easy way to do a catch-all
    '.*': ['pages', 'not_found']
};
{% endhighlight %}
</div>

Routes follow some basic rules:

- Routes are loaded in the order they are specified in the routing table. This
is important, because it allows you to do what we did above: create a catch-all
route at the *bottom* of the table that runs if no other routes match.
- URL specifications (the object keys) are always enclosed between `^` and `$`,
so the route your specify, by default, must be a full match. A URL specifier of
"/" will only match a URL of "/", *not* match "/mypage" (but "/.\*" *will* match
"/mypage").
- The value of the URL specifier key is an array with exactly two elements: a
top-level object name and a key within that object that points to a function to
run.
- The URL specifiers can use regular expression groups to capture values out of
the routed URL and *will pass the values in order* to the routing function.

So given our above routing table, we might set up our code like so:

{% highlight js %}
var pages = {
    home: function()
    {
        new HomePageController();
    },

    not_found: function()
    {
        new ErrorController({error: 404});
    }
};

var users = {
    load: function(user_id)
    {
        // parameters are always passed as strings
        user_id = parseInt(user_id);
        var user = users_collection.find_by_id(user_id);
        new UserDisplayController({ model: user });
    }
};
{% endhighlight %}

Note that our top-level objects are usually just that: simple objects. You can
create them as controllers, but it might introduce unneeded complexity. You
really only need to use controllers if a particular object *is displaying
something*, which we're not doing in this case, we're just loading other
objects!

### options :: attribute({...})

{% highlight js %}
options: {
    suppress_initial_route: false,
    enable_cb: function(url) { return true; },
    process_querystring: false
}
{% endhighlight %}

`suppress_initial_route` tells the router that when it's created it should *not*
try to route the current URL (it will try to do so by default). So if your
browser is at the URL "/users" the router will try to load the route for
"/users" when it's created unless you set this option to true.

`enable_cb` is a function that will *cancel* the current route if it returns a
value other than true. It is called with the URL being routed on. This lets you
do simple per-URL routing logic within your app depending on its state. 

`process_querystring` tells the router that we want to take the querystring
parameters into account when routing. This makes writing your routes a lot
trickier because you have to account for URL query parameters now, but also
gives you the power to route on them (and capture their values) if that's what
your app requires.

### initialize :: function(routes, options)

Router's constructor. `routes` is your [routing table](#routes), and `options`
is an object containing some or all of the allowed [router options](#options).

{% highlight js %}
window.pages = {
    router_docs: function()
    {
        alert('Routed to the Router docs!');
    },

    not_found: function()
    {
        alert('Uh oh');
    }
};
var routes = {
    '/composer.js/docs/router': ['pages', 'router_docs'],
    '/.*', ['pages', 'not_found']
};
var router = new Composer.Router(routes);
router.destroy();
{% endhighlight %}

### destroy :: function()

Destroys the router and any bindings it has (either other objects' bindings to
it or its bindings to the History object).

### get_param :: function(key)

Convenience function to get the value of a URL query parameter out of the
*current* URL by its key.

### route: function(url, options)

Route to a URL. This function is provided as an abstraction around setting your
URL directly via pushState.

<div class="noeval">
{% highlight js %}
// this
window.location = '/users/69';

// is now
var router = new Composer.Router({});
router.route('/users/69');
{% endhighlight %}
</div>

It's advised that when using the router object, you use this function to change
URLs.

`options` can contain the following items:

- `replace_state` - If true, will call `History.replaceState` instead of
`History.pushState` to change the URL.
- `state` - An object that is passed as the `state` parameter to
`History.pushState` or `History.replaceState`.

### find_matching_route :: function(url, routes)

Although this function is mostly used internally, you may also sometimes need to
match a URL against your routing table manually. This lets you do that:

{% highlight js %}
window.users = {
    list: function() {},
    display: function(id) {}
};
var routes = {
    '/users': ['users', 'list'],
    '/users/([0-9]+)': ['users', 'display'],
    '.*': ['pages', 'not_found']
};
var router = new Composer.Router(routes);
alert('Route: '+ JSON.stringify(router.find_matching_route('/users/10', routes)));
{% endhighlight %}



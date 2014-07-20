---
title: Example | Filter collection usage
layout: documentation
---

# Filter collection usage

Let's go over a basic use-case for filter collections. Generally you want to use
a filter collection whenever you want a continuously-updated slice of a larger
collection. This can be great for applying filters and showing real-time updates
of an existing collection (such as a search feature).

<div id="filter-example">
    <div class="full"></div>
    <div class="partial"></div>
</div>

{% highlight js %}
var User = Composer.Model.extend({});

var Users = Composer.Collection.extend({
    model: User
});

var UsersFilter = Composer.FilterCollection.extend({});

var users = new Users();

var ShowUsersController
{% endhighlight %}


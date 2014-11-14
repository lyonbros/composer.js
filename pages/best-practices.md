---
title: Best practices
layout: documentation
---

# Best practices

Composer gives you a lot of freedom in many cases. There isn't One Right Way to
do things. This may or may not be what you're looking for, but the approach
provides a lot more power than forcing your app to be structured in one
particular way.

Here we'll try to go over some of the different ways of doing things and how
they compare (and when to do them).

## Events

As mentioned in about a thousand other places, eventing is your bread and butter
when using Composer. Learn to love it.

And don't just love it...look for new places to use it. Is a model calling a
bunch of other functions in other models when something happens? Have that model
fire an event and the other models listen. Is your controller managine a number
of sub-controllers? Have it listen to what's happening with them by binding to
their events! Controllers have events too. Use them.

### Event vs function call

In general, it seems that when you need to process some data and return a result
you should use a function call. No question about it. Eventing is terrible for
"do something and pass me back the result" type operations.

For everything else (such as fire and forget) there's eventing.

Don't try to cram things into eventing if it doesn't make sense. You'll get gray
hairs. But don't ignore eventing and try to wire everything up with trees of
brittle function calls either. Use the best tool for the job (it's often
eventing!).

### Event bus

Sometimes you want your app to have a global event bus. This allows various
pieces of it to communicate without having direct knowledge of each other. This
improves the scalability and maintainability of your app in many cases.

So how do you create an event bus? Easy! Create an instance of [Composer.Event](/composer.js/docs/event#composer-event):

{% highlight js %}
// our app's top-level namespace
var my_app = {
    events: new Composer.Event()
    // ...
};
my_app.events.bind('download-complete', function() { alert('Download finished!'); });

// pretend this was fired somewhere else =]
my_app.events.trigger('download-complete');
{% endhighlight %}

## Controllers

Controllers are the link between your data and your interface. Generally they
handle either lists of items (mapped to collection, perhaps) or a single item
itself (a model) whether its a form to update the model or just displaying it as
it is.

### Lists

When displaying a list of items, you generally have two options:

1. Have one controller and one template. The controller listens to events on the
collection holding the rendered list and *re-renders everything on every event*.
1. Have a main controller that listens to `add` events on the rendered
collection, and for each new added model, creates a sub-controller that tracks
that specific model. This requires a list template and an item template. This
pattern is now made a lot easier by the [list controller](/composer.js/docs/listcontroller).

The first way is quick and dirty. It is great for small lists of data or for
large lists of data that *rarely change*. You will be re-rendering the entire
view *every time* any of the data in *any* of the models in the collection
changes, which is not very scalable.

The second way is more "correct" in that it separates your components from each
other in a more defined fashion. You have a controller that handles showing the
list, and you have a controller that shows an item. You can see this pattern in
[the TODO example](/composer.js/examples/todo). This is more scalable because
the data in the collection can change and you'll only re-render the specific
pieces that changed.

Which one you pick depends on your use-case. It's fairly common to start with
option 1 and later move to option 2 as things get more complicated.

### Divide and conquer?

As your app grows, it will have a lot of different interfaces. For your
interfaces, you can have one controller that does many things, or you can have
many controllers that do a few things.

It's up to you how to structure things, but the most useful patterns seem to be
lumping things logically. Does your controller display a list of users? Maybe it
makes sense to have another controller that handles the filtering interface.
Does your controller display a track for an album? Go ahead and put the "play"
button in that interface and have the controller handle it.

Having one controller that handles one type of thing and the associated actions
(show a user and handle the user actions, show a list of notes, display a search
interface and update the filter collection that displays the notes, etc) will
make your app easier to read and maintain.

That said, don't get too granular. You don't need a `AddUserButtonClicked`
controller. Just have a `EditUser` controller and have it handle the entire
form.

Once again, this is all up to you and depends on your various use-cases.


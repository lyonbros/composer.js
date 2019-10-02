---
title: Class system
layout: documentation
---

# Class system

The Composer class system is the base building block of all the objects Composer
provides (Model, Controller, etc). It is designed to be a standalone component
that doesn't necessarily need to be part of Composer.

## Composer.Class

This is the main export of the class system:

{% highlight js %}
var Dog = Composer.Class.extend({
    options: {
        loud: false,
        bites: false
    },

    // CTOR
    initialize: function(bites)
    {
        this.options.bites = bites;
    }
});
var larry = new Dog(true);
alert(larry.options.bites);  // true
{% endhighlight %}

_NOTE_: `Composer.Class(...)` and `Composer.Class.extend(...)` are the same.

## Extending

Classes can be extended two ways. The vanilla, simple way is `MyClass.extend`.

### Class.extend :: function(definition)
{% highlight js %}
var Dog = Composer.Class.extend({
    bark: function() { return 'woof'; }
});
var Shiba = Dog.extend({ });

var shiba = new Shiba();
alert(shiba.bark());   // 'woof'
{% endhighlight %}

### Composer.merge_extend :: function(class, array_of_property_names)
Another way, which is used internally in Composer, is very similar to the above
extension method. It allows a class to additively extend certain static
properties of the parent class. This sounds a bit esoteric, so let's dive in:

{% highlight js %}
var Animal = Composer.Class.extend({
    bites: {}
});

// sets up additive property merging for the `bites` object
Composer.merge_extend(Animal, ['bites']);

// note we use the same extend function here
var Dog = Animal.extend({
    bites: {people: true}
});

// no need to call merge_extend again here, the original call still applies
var Shiba = Dog.extend({
    bites: {rats: true}
});

var shiba = new Shiba();
alert(JSON.stringify(shiba.bites));  // {people: true, rats: true}
{% endhighlight %}

This is mainly used in [Controllers](docs/controller) (the `events`
and `elements` properties) as well as the [Relational Model](docs/relational)'s 
`relations` property.

## Constructors

A class contructor is specified by its `initialize` function:

{% highlight js %}
var Class = Composer.Class.extend({
    initialize: function()
    {
        alert('hello!');
    }
});
new Class();
{% endhighlight %}

## Parent methods

The class system allows calling parent methods using `this.parent()`:

{% highlight js %}
var Base = Composer.Class.extend({
    actions: [],

    initialize: function()
    {
        this.actions.push('sit');
    }
});

var Dog = Base.extend({
    initialize: function()
    {
        this.parent();
        this.actions.push('bite');
    }
});

var dog = new Dog();
alert(JSON.stringify(dog.actions));  // ['sit', 'bite']
{% endhighlight %}

## Mixins

The class system supports mixins. When using these, it will merge in objects
from the mixins and the object being created. This can be useful for extending
the functionality of classes without using inheritance structures.

Mixins are defined as a special key in the class, `mixins`, which is a function
that returns an array of mixin objects:

{% highlight js %}
const Shouter = Composer.Class.extend({
    events: {'shout': 'shout'},
    shout: function() { return 'AHHH'; },
});
const Person = Composer.Class.extend({
    mixins: function() { return [Shouter]; },
    events: {'yell': 'yell'},
    yell: function() { return 'HEY!'; },
});

var person = new Person();
var output = [person.shout(), person.yell(), JSON.stringify(person.events)].join(' :: ');
alert(output);
{% endhighlight %}


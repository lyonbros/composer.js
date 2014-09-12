---
title: Class system
layout: documentation
---

# Class system

The Composer class system is the base building block of all the objects Composer
provides (Model, Controller, etc). It is based off of [class.js](https://github.com/kilhage/class.js),
but modified slightly (non-function members are not shared across classes).

## Composer.Class

This is the main export of the class system:

{% highlight js %}
var Dog = Composer.Class({
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

## Extending

Classes can be extended two ways. The vanilla, simple way is `MyClass.extend`.

### Class.extend :: function(definition)
{% highlight js %}
var Dog = Composer.Class({
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
var Animal = Composer.Class({
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

This is mainly used in [Controllers](/composer.js/docs/controller) (the `events`
and `elements` properties) as well as the [Relational Model](/composer.js/docs/relational)'s 
`relations` property.

## Constructors

A class contructor is specified by its `initialize` function:

{% highlight js %}
var Class = Composer.Class({
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
var Base = Composer.Class({
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


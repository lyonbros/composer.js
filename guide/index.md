---
title: Composer.js Guide
layout: guide
---

# Composer.js Guide

Welcome! Congratulations on picking Composer for your next app! This guide will
walk you through the basics of effectively using Composer step-by-step.

You'll be an expert in no time.

## What is Composer.js?

Composer is a set of stackable libraries for building complex single-page apps.
Ok, great. What does that mean? It means that instead of selling itself as a
framework, Composer is a bunch of building blocks you can use in app
development. The building blocks, when all put together, could be thought of as
a framework like Backbone or Angular. However, the pieces are also separate from
each other and can be used individually.

Composer follows the MVC pattern. It provides models/collections to operate on
data and it provides controllers to set up communication between your data layer
and your views (the DOM).

The ultimate goal of Composer is to make building and scaling single-page
applications easy.

## When would I user Composer?

Here are the ideal uses for Composer:

- You're building your app to be run inside of a browser. Composer relies on the
existence of a DOM.
- You want to build a medium-to-large size single page app. Composer really
begins to shine once you start needing various components like [an event bus](docs/event),
[list tracking](docs/listcontroller), or [filtered views](docs/filtercollection).
- When backbone is too minimal for what you want, but Angular/React are too
large.  Composer fits the sweet spot of including features that make building
easy without imposing too much structure. You are free to create how you wish,
and can rely on Composer as much or as little as you want.

## A quick note

As a quick note, all of the following guides will assume you have [enabled
promises](docs/util#composer-promisify) and have also [enabled xdom](docs/xdom#using-xdom):

<div class="noeval">
{% highlight js %}
Composer.promisify();
Composer.Controller.xdomify();
{% endhighlight %}
</div>

# Next

So where do we being? Well, every app needs an interface, so let's
[build our first controller interface &raquo;](guide/first-interface)


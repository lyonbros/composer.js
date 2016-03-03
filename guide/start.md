---
title: Guide to getting started
layout: guide
---

# Guide to getting started

Welcome! Congratulations on picking Composer for your next app! This guide will
walk you through the basics of effectively using Composer.

Composer provides an MVC (Model, View, Controller) structure to build your app
on top of. What this means is that different pieces of your app are separated
into three basic components:

- [__Models__](docs/model) are responsible for processing and
handling data. This can mean calling an API or a local database, or just
crunching a bunch of numbers.
- __Views__ are what display everything in your app. In our case, the view is
the browser's DOM. Composer doesn't push any templating engine on you...you can
use hand-written HTML strings, or something like [Handlebars](http://handlebarsjs.com/).
- [__Controllers__](docs/controller) tie models and views together,
normally by listening to (and acting on) events. The model will fire events when
its data changes, and the view will fire events when a user performs some kind
of interaction (a click, a form post, etc).

These pieces are all tied together using eventing, which you will soon learn to
love. Eventing allows separate components of your application to talk to each
other without having explicit knowledge of each other's interfaces. This makes
your app more maintainable, and after some getting used to, a lot more fun to
build.

So where do we being? Well, every app needs an interface, so let's
[build our first controller interface &raquo;](guide/first-interface)


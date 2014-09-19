---
title: Guide to getting started
layout: default
---

# Guide to getting started

Welcome! Congratulations on picking Composer for your next app! This guide will
walk you through the basics of effectively using Composer.

Composer provides an MVC (Model, View, Controller) structure to build your app
on top of. What this means is that different pieces of your app are separated
into three basic components:

- __Models__ are responsible for processing and handling data. This can mean
calling an API or a local database, or just crunching a bunch of numbers.
- __Views__ are what display everything in your app. In our case, the view is
the browser's DOM. Composer doesn't push any templating engine on you...you can
use hand-written HTML strings, or something like [Handlebars](http://handlebarsjs.com/).
- __Controllers__ tie models and views together, normally by listening to (and
acting on) events. The model will fire events when its data changes, and the
view will fire events when a user performs some kind of interaction (a click, a
form post, etc).


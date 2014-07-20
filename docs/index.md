---
title: Documentation
layout: default
---

# Composer.js docs

Composer is a powerful MVC-based framework for building applications in
Javascript. It is designed to allow more complicated setups than can be achieved
easily with frameworks like the excellent Backbone.js. Composer makes no
assumptions about the structure of your data or your architecture; it provides a
set of tools to help you build your app then politely bows out of your way.

Composer.js is currently being used as the driving force of
[Turtl](https://turtl.it) and [Musio](http://musio.com), both being data-driven
apps that run completely in the client.

Composer used to run on top of Mootools, but as of version 1.0 is now framework
agnostic (jQuery/Mootools can be used interchangeably with Composer).

## Dependencies

Composer needs a selector library from jQuery or Mootools (Sizzle or Slick).
jQuery or Mootools themselves can also be included. This dependency can be
skipped if you are only using the data-driven portion of Composer (so, anything
but Controllers).

If you plan on using [Composer's Router](/composer.js/docs/router) (which
provides an easy way to run code when certain URLs are encountered), you need
[History.js](https://github.com/browserstate/history.js/).

### Load order

Generally, you should include the provided pre-packaged composer.js file for
inclusion in your app, however you can build your own using the following load
order:

- __util.js__ - Sets up any common Composer utilities
- __class.js__ - Houses the main class system
- __event.js__ - Composer's eventing fabric
- __base.js__ - The Base object that all others extend
- __model.js__ - Model. Represents a piece of data (record).
- __collection.js__ - Collection. Represents a list of models (table).
- __adapter.js__ - The DOM abstraction used by Controllers
- __controller.js__ - Controller. Ties models/collections to the DOM.
- __router.js__ - The Router allows easy tracking of pushState.
- __relational.js__ - Relational model. Allows setting up hierarchies in data.
- __filtercollection.js__ - Filter collection. Allows setting up materialized views.


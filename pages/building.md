---
title: Building/load order
layout: default
---

# Building / load order

Generally, you should include the provided pre-packaged [composer.js](/composer.js/js/composer.js)
file for inclusion in your app, however you can mix and match or build your own
by using the following load order:

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

## Dependencies

Some components require others, so be mindful of this if loading your Composer
components manually. Here are the dependencies (in `Component: [Dep1, Dep2, ...]`
format):

- Util: []
- Class: [Util]
- Event: [Class]
- Base: [Event]
- Model: [Base]
- Relational model: [Model]
- Collection: [Base, Model]
- Filter collection: [Collection]
- Adapter: [Util]
- Controller: [Base, Adapter]
- Router: [Base]


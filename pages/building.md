---
title: Building/load order
layout: default
---

# Building / load order

Generally, you should include the provided pre-packaged [composer.js](/composer.js/composer.js)
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
- __listcontroller.js__ - ListController. Provides easy collection tracking.
- __router.js__ - The Router allows easy tracking of pushState.
- __relational.js__ - Relational model. Allows setting up hierarchies in data.
- __filtercollection.js__ - Filter collection. Allows setting up materialized views.

## Dependencies

The full build of Composer requires either [jQuery](http://jquery.com/)
or [Mootools](http://mootools.net) as well as [History.js](https://github.com/browserstate/history.js/).

Here is the breakdown of which components rely on which (in
`Component: [Dep1, Dep2, ...]` format):

- `Util: []`
- `Class: [Util]`
- `Event: [Class]`
- `Base: [Event]`
- `Model: [Base]`
- `Relational model: [Model]`
- `Collection: [Base, Model]`
- `Filter collection: [Collection]`
- `Adapter: [Util, jQuery|Mootools]`
- `Controller: [Base, Adapter]`
- `ListController: [Controller]`
- `Router: [Base, History.js]`


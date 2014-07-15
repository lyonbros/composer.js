---
title: Introduction
layout: documentation
---

# Introduction

Composer provides an MVC structure for you to build your app on top of. It also
provides the glue between all objects, which is eventing.

Read on to learn more about how Composer organizes things top-level and how it
all fits together.

## Eventing

By far the most important piece of Composer is eventing. An event is an action.
It could be a user clicking a button in a view. It could be a model getting new
data added to it. It could be a collection removing a model.

Events are what tie everything in Composer together. A model doesn't know what
views it's being rendered in and how to re-render them. It doesn't care. It just
fires a `change` event and any controllers that are listening will re-render by
themselves.

This way of thinking, although it takes some getting used to, allows for very
complex applications that are highly modular and maintainable.

Every object in Composer extends the [event](/composer.js/docs/event) class,
giving them all the same eventing abilities.

## Components

Composer at its core is comprised of three main pieces: Models, Collections, and
Controllers.

### Model
A Model is a representation of a piece of data: a user, an address, a song, etc.
The easiest way to think of a model is that it's one record in a database table.

### Collection
A Collection is a, well, collection of models. Think of it as a database table.

### Controller
Lastly, a Controller ties the DOM/view to our data. What this means is that a
controller will set up your view and listen for events:

- Events in the view itself: a button click, a swipe, etc.
- Events from the models it's displaying

It will act on these events and either update a model with data from the view
(say if a form was posted) or re-render the view with new data from a model.

This allows models to know nothing about rendering or the view, and allows the
view to not worry about what models to notify if data changes. The controller is
the piece that ties the two together.



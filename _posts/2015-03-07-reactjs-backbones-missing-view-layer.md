---
layout: post
title: React - Backbone's missing view layer
---

Anyone who has ever used the Backbone JavaScript framework, knows that it leaves view rendering
entirely up to you. When I started reading about Facebook's [React](http://facebook.github.io/react/),
I couldn't help but wonder, is the React framework [Backbone's](http://backbonejs.org/) missing view layer?

To test my hypothesis, I created a small, single-page menu planning application to see if the
two libraries would work together.

- [source code](https://github.com/jbgo/menu-planner/tree/131f8d0aff9a8315699eb51fabc6fea45f4faa5e/public/app)
- demo coming soon

## Application structure

The design of the app is simple. The application gets kicked off by instantiating a new
backbone view. This view only does three things:

1. Fetch the initial data (the demo uses local storage).
2. Bind backbone model events to the view's render method.
3. Render the view with React.render.

That's it for the glue code between Backbone and React!

```
MP.MenuView = Backbone.View.extend({
  el: '#menu-plan',

  initialize: function() {
    this.meals = new MP.MealCollection();
    this.meals.on('sync', this.render, this);
    this.meals.on('change', this.render, this);
    this.meals.on('remove', this.render, this);
    this.meals.fetch();
    this.render();
  },

  render: function() {
    var root = React.createElement(MenuPlan, { meals: this.meals });
    React.render(root, this.el);
  }
});

MP.view = new MP.MenuView();
```

[*View full source of view.jsx on github.*](https://github.com/jbgo/menu-planner/tree/131f8d0aff9a8315699eb51fabc6fea45f4faa5e/public/app/view.jsx)

As for the rest of the applicaiton, DOM events are handled by the React components
which can create, update, or delete backbone models as required.

For example, when I want to create a new meal, by clicking on "New Breakfast" or "New Dinner",
all I have to do is listen to the `onCLick` event in my React component.

```
  render: function() {
    ... 
    <a href="#" className="create-meal-card" onClick={this.addCard}>
      + New {this.props.mealType.name}
    </a>
    ...
  }
```

Then define an event handler that creates a new meal using the `BackboneCollection.create` method
on the `meals` collection.

```
  addCard: function(e) {
    e.preventDefault();
    this.props.meals.create({
      date: MP.getDateForDay(this.props.day),
      meal_type: this.props.mealType.enumValue
    });
  },
```
[*View full source of this example on github.*](https://github.com/jbgo/menu-planner/blob/131f8d0aff9a8315699eb51fabc6fea45f4faa5e/public/app/components.jsx#L95)

Because all of my model events ultimately trigger a `React.render`, I
don't have to do anything else to update my view afterwards. It's pretty slick! 


## What I like about React

### Fast and focused

React does one thing really well - rendering views. It re-renders your entire app every
time, but manages to make this happen extremely quickly thanks to the
[virtual DOM and reconciliation process](http://facebook.github.io/react/docs/reconciliation.html).
Because React only focuses on the view layer, the API is very small and consistent, so it is easy
to learn compared to a fully featured JavaScript framework like AngularJS or Ember.js.

### Developer friendly

React gives helpful warning and error messages in the console, so I was able to correct my newbie
mistakes without referring to the documentation often. The React team also created a
[chrome browser plugin](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
that I found helpful for understanding how all of my components fit together and how
`props` and `state` were passed between components.

### It just works

React just works, and it solves the most painful part of writing single-page Backbone applications.
It's solid, fast, and has a strong community (uhum... Facebook developers) supporting it. I feel
no hesitation about using it professionally going forward.

## What I don't like about React

### Assembling the view hierarchy

I find building a component hierarchy tedious compared to using a template
language to describe views. With React, you create a lot of tiny components,
and it becomes hard to remember which component renders which part of the view.

Also, the lack of basic looping or conditional constructs in JSX is limiting.
For example, I have to assemble a component's children in
an array and then include them in the parent component.

```
render: function() {
    var menuItems = this.props.meal.menuItems.map(function(menuItem) {
      return (
        <MenuItem key={menuItem.id} menuItem={menuItem} />
      );
    });

    return (
      <ul>{menuItems}</ul>
    );
  }
```
[*View the full source of this method on github.*](https://github.com/jbgo/menu-planner/blob/131f8d0aff9a8315699eb51fabc6fea45f4faa5e/public/app/components.jsx#L149)

I find that this is more work and harder to reason about than a classic templating language. If I
could extend JSX to support assembling child components using a syntax like the example below, I
would no longer have this complaint.

```
<ul>
  <% this.props.meal.menuItems.map(function(menuItem) { %>
    <MenuItem key={menuItem.id} menuItem={menuItem} />
  <% }) %>
</ul>
```

But as I'm writing this, I realize it may be possible to create a usable React component that
accomplishes the same end result.

```
<ul>
  <children collection={this.props.meal.menuItems}>
    <MenuItem key={child.id} menuItem={child} />
  </childen>
</ul>
```

### Getting your props

I spent a lot of time passing props down the component hierarchy. Most of the errors
I encountered while building the app were a result of needing a prop that isn't available to the
current component. The solution was to go up the hierarchy until a found the prop I needed and then pass
it down the hierarchy. I feel like I will be able to come up with a good abstraction or convention
to follow that will relieve this pain point as I gain more experience with React. There are several
suggestions [in React's documentation](http://facebook.github.io/react/docs/transferring-props.html)
that I plan to try.

### Adding interactivity to the UI

The last thing I was unsure about was how to make the UI more interactive. In particular, I wanted
to focus the "Add item..." field after creating or updating a menu item to make it faster to enter
new menu items. I was able to accomplish this with [component lifecycle events](http://facebook.github.io/react/docs/component-specs.html)
and passing callback functions through props so child components could tell parent components about
state changes. Here is the abbreviated example from the menu planner app:

```
var MealCard = React.createClass({
  getInitialState: function() {
    return { wasEdited: false };
  },

  onChildEdit: function(child) {
    this.setState({ wasEdited: true });
  },

  render: function() {
    ...
        <MenuItem key={menuItem.id} meal={meal} menuItem={menuItem} onEdit={_this.onChildEdit} />
    ...
});

var MenuItem = React.createClass({
  componentDidUpdate: function() {
    if (this.props.focus) {
      $(this.getDOMNode()).find('input').focus().select();
    }
  },

  handleEdit: function() {
    this.setState({ editable: false });
    this.props.onEdit(this);
  },

  render: function() {
    ...
        <EditableMenuItem meal={this.props.meal} menuItem={menuItem} onEdit={this.handleEdit} />;
    ...
  }
```
[*View the entire MealCard and MenuItem components on github.*](https://github.com/jbgo/menu-planner/blob/131f8d0aff9a8315699eb51fabc6fea45f4faa5e/public/app/components.jsx#L131)

That seems like a lot of work just to run this line of code for the right component at the right time.

```
$(this.getDOMNode()).find('input').focus().select();
```

Again, this is another example where I feel like I will either invent or discover a better way
to handle this scenario as I gain more experience building apps with React.

## Summary

React works really well, and it is easy to integrate with Backbone. There are a few tradeoffs
you make by choosing this combination over some of the full featured frontend frameworks, but
the power and simplicity of both Backbone and React make a productive duo.

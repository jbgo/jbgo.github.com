MP.MenuView = Backbone.View.extend({
  el: '#menu-plan',

  initialize: function() {
    // Backbone appears to be doing some funky shit that prevents _.bind and
    // _.bindAll from working correctly, so I created my own implementation to
    // enfore some sense of "this" sanity here.
    var _this = this;
    _.each(_.functions(this), function(funcName) {
      var func = _this[funcName];
      _this[funcName] = function() { return func.apply(_this, arguments); }
    });

    this.meals = new MP.MealCollection();
    this.meals.on('sync', this.render);
    this.meals.on('change', this.render);
    this.meals.on('remove', this.render);
    this.meals.fetch();

    this.render();
  },

  render: function() {
    var root = React.createElement(MenuPlan, { meals: this.meals });
    React.render(root, this.el);
  }
});

MP.view = new MP.MenuView();

window.MP = {};

MP.weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
MP.weekdayNumbers = [0, 1, 2, 3, 4, 5, 6];

MP.months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

MP.mealTypes = [
  { name: 'Breakfast', enumValue: 'breakfast', bgColor: '#2653B6' },
  { name: 'Lunch',     enumValue: 'lunch',     bgColor: '#0FAC92' },
  { name: 'Dinner',    enumValue: 'dinner',    bgColor: '#B9750E' }
];

MP.mealTypeLookup = _.object(_.map(MP.mealTypes, function(t) {
  return [t.enumValue, t];
}));


MP.formatDate = function(date) {
  return MP.months[date.getMonth()] + ' ' + date.getDate();
};

MP.startOfWeek = function() {
  var now = new Date();
  now.setDate(now.getDate() - now.getDay());
  return this.formatDate(now);
};

MP.endOfWeek = function() {
  var now = new Date();
  now.setDate(now.getDate() + (6 - now.getDay()));
  return this.formatDate(now);
};

MP.getDateForDay = function(day) {
  var date, month, dayOfMonth;

  date = new Date();
  date.setDate(date.getDate() + (day - date.getDay()));
  month = date.getMonth() + 1;
  dayOfMonth = date.getDate();

  return [
    date.getFullYear(),
    (month < 10 ? "0" + month : month),
    (dayOfMonth < 10 ? "0" + dayOfMonth : dayOfMonth)
  ].join('-');
};

MP.Meal = Backbone.Model.extend({
  initialize: function() {
    if (!this.id) { this.set({ id: uuid.v4() }); }
    this.fetchMenuItems();
    this.listenTo(this.menuItems, 'remove', function() {
      this.trigger('change', this);
    });
  },

  fetchMenuItems: function() {
    if (!this.menuItems) { this.menuItems = new MP.MenuItemCollection(); }
    this.menuItems.localStorage = new Backbone.LocalStorage("menu-items-" + this.id);
    this.menuItems.fetch();
  },

  getMealType: function() {
    return MP.mealTypeLookup[this.get('meal_type')];
  },

  parse: function(response, options) {
    var d = new Date(response.date);
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    return _.extend(response, { day: d.getDay() });
  }
});

MP.MealCollection = Backbone.Collection.extend({
  model: MP.Meal,
  localStorage: new Backbone.LocalStorage("meals"),

  byDay: function() {
    var mealsByDay = {};
    var day;

    this.each(function(meal) {
      day = meal.get('day');
      if (!mealsByDay[day]) { mealsByDay[day] = []; }
      mealsByDay[day].push(meal);
    });

    return mealsByDay;
  }
});

MP.MenuItem = Backbone.Model.extend({
});

MP.MenuItemCollection = Backbone.Collection.extend({
  model: MP.MenuItem
});

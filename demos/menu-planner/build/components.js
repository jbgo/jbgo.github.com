var MenuPlan = React.createClass({displayName: "MenuPlan",
  render: function() {
    return (
      React.createElement("div", {id: "menu"}, 
        React.createElement(MenuHeader, null), 
        React.createElement(MenuWorkspace, {meals: this.props.meals})
      )
    );
  }
});

var MenuHeader = React.createClass({displayName: "MenuHeader",
  render: function() {
    var startDay = MP.startOfWeek();
    var endDay = MP.endOfWeek();

    return (
      React.createElement("div", {className: "mp-header"}, 
        React.createElement("h1", {className: "brand"}, React.createElement("a", {href: "/"}, "MP")), 
        React.createElement("div", {className: "week-summary"}, 
          React.createElement("h2", null, "Week of ", startDay, " - ", endDay)
        )
      )
    );
  }
});

var MenuWorkspace = React.createClass({displayName: "MenuWorkspace",
  render: function() {
    return (
      React.createElement("div", {className: "workspace"}, 
        React.createElement(Timeline, null), 
        React.createElement(MealCardList, {meals: this.props.meals})
      )
    );
  }
});

var Timeline = React.createClass({displayName: "Timeline",
  render: function() {
    var weekdays = MP.weekdays.map(function(day) {
      return React.createElement("li", {key: day, className: "day-col"}, day);
    });

    return (
      React.createElement("div", {className: "timeline"}, 
        React.createElement("ul", null, weekdays)
      )
    );
  }
});

var MealCardList = React.createClass({displayName: "MealCardList",
  render: function() {
    var _this = this;

    var meals = this.props.meals;
    var mealsByDay = this.props.meals.byDay();

    var mealTypeRows = MP.mealTypes.map(function(mealType) {
      return React.createElement(MealTypeRow, {key: mealType.name, mealType: mealType, meals: meals, mealsByDay: mealsByDay});
    });

    return (
      React.createElement("div", {className: "meal-cards"}, 
        mealTypeRows
      )
    );
  }
});

var MealTypeRow = React.createClass({displayName: "MealTypeRow",
  render: function() {
    var _this = this;
    var mealType = this.props.mealType;

    var mealCardContainers = MP.weekdayNumbers.map(function(day) {
      var meals, meal;
      meals = _this.props.mealsByDay[day];
      if (meals) {
        meal = _.find(meals, function(m) { return m.get('meal_type') === mealType.enumValue });
      }
      return React.createElement(MealCardContainer, {key: day, day: day, meals: _this.props.meals, mealType: mealType, meal: meal});
    });

    return (
      React.createElement("div", {className: "meal-type-row"}, 
        mealCardContainers
      )
    );
  }
});

var MealCardContainer = React.createClass({displayName: "MealCardContainer",
  addCard: function(e) {
    e.preventDefault();
    this.props.meals.create({
      date: MP.getDateForDay(this.props.day),
      meal_type: this.props.mealType.enumValue
    });
  },

  render: function() {
    var mealCardContainer;

    
    if (this.props.meal) {
      mealCardContainer = (
        React.createElement(MealCard, {meal: this.props.meal})
      );
    } else {
      mealCardContainer = (
        React.createElement("div", {className: "add-meal-card"}, 
          React.createElement("ul", null, React.createElement("li", null, 
            React.createElement("a", {href: "#", className: "create-meal-card", onClick: this.addCard}, 
              "+ New ", this.props.mealType.name
            )
          ))
        )
      );
    }

    return (
      React.createElement("div", {className: "day-col"}, 
        mealCardContainer
      )
    );
  }
});

var MealCard = React.createClass({displayName: "MealCard",
  getInitialState: function() {
    return { wasEdited: false };
  },

  remove: function(e) {
    e.preventDefault();
    this.props.meal.destroy();
  },

  onChildEdit: function(child) {
    this.setState({ wasEdited: true });
  },

  render: function() {
    var _this = this;
    var meal = this.props.meal;

    var menuItems = meal.menuItems.map(function(menuItem) {
      return (
        React.createElement(MenuItem, {key: menuItem.id, meal: meal, menuItem: menuItem, onEdit: _this.onChildEdit})
      );
    });

    // add a blank item for appending to the list
    menuItems.push(
      React.createElement(MenuItem, {key: uuid.v4(), meal: meal, onEdit: this.onChildEdit, focus: this.state.wasEdited})
    );

    var styles = { backgroundColor: this.props.meal.getMealType().bgColor };

    return (
      React.createElement("div", {className: "meal-card"}, 
        React.createElement("div", {className: "meal-card-header", title: "Drag to move", style: styles}, 
          React.createElement("span", {className: "meal-card-close", title: "Remove", onClick: this.remove}, "×"), 
          meal.getMealType().name
        ), 

        React.createElement("ul", null, menuItems)
      )
    );
  }
});

var MenuItem = React.createClass({displayName: "MenuItem",
  getInitialState: function() {
    return { editable: false };
  },

  makeEditable: function(e) {
    if (e) { e.preventDefault(); }
    this.setState({ editable: true }, function() {
      $(this.getDOMNode()).find('input').focus().select();
    });
  },

  remove: function(e) {
    e.preventDefault();
    this.props.menuItem.destroy();
  },

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
    var menuItem = this.props.menuItem;
    var el;

    if (this.state.editable || !menuItem) {
      el = React.createElement(EditableMenuItem, {meal: this.props.meal, menuItem: menuItem, onEdit: this.handleEdit});
    } else {
      el = (
        React.createElement("li", {title: "Edit"}, 
          React.createElement("div", {className: "display"}, 
            React.createElement("span", {className: "remove-item", title: "Remove", onClick: this.remove}, "×"), 
            React.createElement("span", {onClick: this.makeEditable}, menuItem.get('name'))
          )
        )
      );
    }

    return el;
  }
});

var EditableMenuItem = React.createClass({displayName: "EditableMenuItem",
  handleKeyUp: function(e) {
    if (e.keyCode === 13) { // enter
      this.doneEditing();
    }
  },

  doneEditing: function(e) {
    var meal = this.props.meal;
    var menuItem = this.props.menuItem;
    var newValue = this.refs.menuItemName.getDOMNode().value;
    if (!menuItem && newValue.trim() === '') return; // Don't save new blank items

    if (menuItem) {
      menuItem.save({ name: newValue });
    } else if (newValue.trim() !== "") {
      meal.menuItems.create({ name: newValue });
    }

    this.props.onEdit(this);
  },

  componentDidMount: function() {
    $(this.getDOMNode()).find('input').focus();
  },

  render: function() {
    var menuItem = this.props.menuItem;

    return (
      React.createElement("li", {className: "editing"}, 
        React.createElement("input", {type: "text", ref: "menuItemName", 
          defaultValue: menuItem ? menuItem.get('name') : null, 
          placeholder: "Add item...", 
          onKeyUp: this.handleKeyUp, 
          onBlur: this.doneEditing})
      )
    );
  },
});

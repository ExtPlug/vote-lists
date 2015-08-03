(function (root, factory) {
  if (typeof exports === 'object') {
    module.exports = factory(require('underscore'), require('backbone'));
  }
  else if (typeof define === 'function' && define.amd) {
    define('backbone-filtered-collection',['underscore', 'backbone'], factory);
  }
  else {
    var globalAlias = 'FilteredCollection';
    var namespace = globalAlias.split('.');
    var parent = root;
    for ( var i = 0; i < namespace.length-1; i++ ) {
      if ( parent[namespace[i]] === undefined ) parent[namespace[i]] = {};
      parent = parent[namespace[i]];
    }
    parent[namespace[namespace.length-1]] = factory(root['_'], root['Backbone']);
  }
}(this, function(_, Backbone) {
  function _requireDep(name) {
    return {'underscore': _, 'backbone': Backbone}[name];
  }

  var _bundleExports = (function (define) {
    function _require(index) {
        var module = _require.cache[index];
        if (!module) {
            var exports = {};
            module = _require.cache[index] = {
                id: index,
                exports: exports
            };
            _require.modules[index].call(exports, module, exports);
        }
        return module.exports;
    }
    _require.cache = [];
    _require.modules = [
        function (module, exports) {
            var _ = _requireDep('underscore');
            var Backbone = _requireDep('backbone');
            var proxyCollection = _require(1);
            var createFilter = _require(2);
            function invalidateCache() {
                this._filterResultCache = {};
            }
            function invalidateCacheForFilter(filterName) {
                for (var cid in this._filterResultCache) {
                    if (this._filterResultCache.hasOwnProperty(cid)) {
                        delete this._filterResultCache[cid][filterName];
                    }
                }
            }
            function addFilter(filterName, filterObj) {
                if (this._filters[filterName]) {
                    invalidateCacheForFilter.call(this, filterName);
                }
                this._filters[filterName] = filterObj;
                this.trigger('filtered:add', filterName);
            }
            function removeFilter(filterName) {
                delete this._filters[filterName];
                invalidateCacheForFilter.call(this, filterName);
                this.trigger('filtered:remove', filterName);
            }
            function execFilterOnModel(model) {
                if (!this._filterResultCache[model.cid]) {
                    this._filterResultCache[model.cid] = {};
                }
                var cache = this._filterResultCache[model.cid];
                for (var filterName in this._filters) {
                    if (this._filters.hasOwnProperty(filterName)) {
                        if (!cache.hasOwnProperty(filterName)) {
                            cache[filterName] = this._filters[filterName].fn(model);
                        }
                        if (!cache[filterName]) {
                            return false;
                        }
                    }
                }
                return true;
            }
            function execFilter() {
                var filtered = [];
                if (this._superset) {
                    filtered = this._superset.filter(_.bind(execFilterOnModel, this));
                }
                this._collection.reset(filtered);
                this.length = this._collection.length;
            }
            function onAddChange(model) {
                this._filterResultCache[model.cid] = {};
                if (execFilterOnModel.call(this, model)) {
                    if (!this._collection.get(model.cid)) {
                        var index = this.superset().indexOf(model);
                        var filteredIndex = null;
                        for (var i = index - 1; i >= 0; i -= 1) {
                            if (this.contains(this.superset().at(i))) {
                                filteredIndex = this.indexOf(this.superset().at(i)) + 1;
                                break;
                            }
                        }
                        filteredIndex = filteredIndex || 0;
                        this._collection.add(model, { at: filteredIndex });
                    }
                } else {
                    if (this._collection.get(model.cid)) {
                        this._collection.remove(model);
                    }
                }
                this.length = this._collection.length;
            }
            function onModelAttributeChange(model) {
                this._filterResultCache[model.cid] = {};
                if (!execFilterOnModel.call(this, model)) {
                    if (this._collection.get(model.cid)) {
                        this._collection.remove(model);
                    }
                }
            }
            function onAll(eventName, model, value) {
                if (eventName.slice(0, 7) === 'change:') {
                    onModelAttributeChange.call(this, arguments[1]);
                }
            }
            function onModelRemove(model) {
                if (this.contains(model)) {
                    this._collection.remove(model);
                }
                this.length = this._collection.length;
            }
            function Filtered(superset) {
                this._superset = superset;
                this._collection = new Backbone.Collection(superset.toArray());
                proxyCollection(this._collection, this);
                this.resetFilters();
                this.listenTo(this._superset, 'reset sort', execFilter);
                this.listenTo(this._superset, 'add change', onAddChange);
                this.listenTo(this._superset, 'remove', onModelRemove);
                this.listenTo(this._superset, 'all', onAll);
            }
            var methods = {
                    defaultFilterName: '__default',
                    filterBy: function (filterName, filter) {
                        if (!filter) {
                            filter = filterName;
                            filterName = this.defaultFilterName;
                        }
                        addFilter.call(this, filterName, createFilter(filter));
                        execFilter.call(this);
                        return this;
                    },
                    removeFilter: function (filterName) {
                        if (!filterName) {
                            filterName = this.defaultFilterName;
                        }
                        removeFilter.call(this, filterName);
                        execFilter.call(this);
                        return this;
                    },
                    resetFilters: function () {
                        this._filters = {};
                        invalidateCache.call(this);
                        this.trigger('filtered:reset');
                        execFilter.call(this);
                        return this;
                    },
                    superset: function () {
                        return this._superset;
                    },
                    refilter: function (arg) {
                        if (typeof arg === 'object' && arg.cid) {
                            onAddChange.call(this, arg);
                        } else {
                            invalidateCache.call(this);
                            execFilter.call(this);
                        }
                        return this;
                    },
                    getFilters: function () {
                        return _.keys(this._filters);
                    },
                    hasFilter: function (name) {
                        return _.contains(this.getFilters(), name);
                    },
                    destroy: function () {
                        this.stopListening();
                        this._collection.reset([]);
                        this._superset = this._collection;
                        this.length = 0;
                        this.trigger('filtered:destroy');
                    }
                };
            _.extend(Filtered.prototype, methods, Backbone.Events);
            module.exports = Filtered;
        },
        function (module, exports) {
            var _ = _requireDep('underscore');
            var Backbone = _requireDep('backbone');
            var blacklistedMethods = [
                    '_onModelEvent',
                    '_prepareModel',
                    '_removeReference',
                    '_reset',
                    'add',
                    'initialize',
                    'sync',
                    'remove',
                    'reset',
                    'set',
                    'push',
                    'pop',
                    'unshift',
                    'shift',
                    'sort',
                    'parse',
                    'fetch',
                    'create',
                    'model',
                    'off',
                    'on',
                    'listenTo',
                    'listenToOnce',
                    'bind',
                    'trigger',
                    'once',
                    'stopListening'
                ];
            var eventWhiteList = [
                    'add',
                    'remove',
                    'reset',
                    'sort',
                    'destroy',
                    'sync',
                    'request',
                    'error'
                ];
            function proxyCollection(from, target) {
                function updateLength() {
                    target.length = from.length;
                }
                function pipeEvents(eventName) {
                    var args = _.toArray(arguments);
                    var isChangeEvent = eventName === 'change' || eventName.slice(0, 7) === 'change:';
                    if (eventName === 'reset') {
                        target.models = from.models;
                    }
                    if (_.contains(eventWhiteList, eventName)) {
                        if (_.contains([
                                'add',
                                'remove',
                                'destroy'
                            ], eventName)) {
                            args[2] = target;
                        } else if (_.contains([
                                'reset',
                                'sort'
                            ], eventName)) {
                            args[1] = target;
                        }
                        target.trigger.apply(this, args);
                    } else if (isChangeEvent) {
                        if (target.contains(args[1])) {
                            target.trigger.apply(this, args);
                        }
                    }
                }
                var methods = {};
                _.each(_.functions(Backbone.Collection.prototype), function (method) {
                    if (!_.contains(blacklistedMethods, method)) {
                        methods[method] = function () {
                            return from[method].apply(from, arguments);
                        };
                    }
                });
                _.extend(target, Backbone.Events, methods);
                target.listenTo(from, 'all', updateLength);
                target.listenTo(from, 'all', pipeEvents);
                target.models = from.models;
                updateLength();
                return target;
            }
            module.exports = proxyCollection;
        },
        function (module, exports) {
            var _ = _requireDep('underscore');
            function convertKeyValueToFunction(key, value) {
                return function (model) {
                    return model.get(key) === value;
                };
            }
            function convertKeyFunctionToFunction(key, fn) {
                return function (model) {
                    return fn(model.get(key));
                };
            }
            function createFilterObject(filterFunction, keys) {
                if (!_.isArray(keys)) {
                    keys = null;
                }
                return {
                    fn: filterFunction,
                    keys: keys
                };
            }
            function createFilterFromObject(filterObj) {
                var keys = _.keys(filterObj);
                var filterFunctions = _.map(keys, function (key) {
                        var val = filterObj[key];
                        if (_.isFunction(val)) {
                            return convertKeyFunctionToFunction(key, val);
                        }
                        return convertKeyValueToFunction(key, val);
                    });
                var filterFunction = function (model) {
                    for (var i = 0; i < filterFunctions.length; i++) {
                        if (!filterFunctions[i](model)) {
                            return false;
                        }
                    }
                    return true;
                };
                return createFilterObject(filterFunction, keys);
            }
            function createFilter(filter, keys) {
                if (_.isFunction(filter)) {
                    return createFilterObject(filter, keys);
                }
                if (_.isObject(filter)) {
                    return createFilterFromObject(filter);
                }
            }
            module.exports = createFilter;
        }
    ];
    return  _require(0);
}());

  return _bundleExports;
}));


var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

define('extplug/vote-lists/OnceFilteredCollection',['require','exports','module','backbone-filtered-collection'],function (require, exports, module) {

  var FilteredCollection = require('backbone-filtered-collection');

  // FilteredCollection is a relatively fast auto-syncing auto-filtering
  // collection wrapper.
  // using a plain class here because FilteredCollection isn't a real Backbone
  // Collection.

  var OnceFilteredCollection = (function (_FilteredCollection) {
    function OnceFilteredCollection() {
      _classCallCheck(this, OnceFilteredCollection);

      if (_FilteredCollection != null) {
        _FilteredCollection.apply(this, arguments);
      }
    }

    _inherits(OnceFilteredCollection, _FilteredCollection);

    _createClass(OnceFilteredCollection, [{
      key: 'setFilter',

      // sets a single filter by replacing the current one instead of always
      // adding new ones.
      // this saves a filter run because FilteredCollection immediately refilters
      // after removing a filter, and then again after adding a new filter.
      value: function setFilter(filter) {
        if (this.hasFilter(this.defaultFilterName)) {
          this._filters[this.defaultFilterName] = {
            fn: filter,
            keys: null
          };
          this.refilter();
        } else {
          this.filterBy(filter);
        }
        return this;
      }
    }]);

    return OnceFilteredCollection;
  })(FilteredCollection);

  module.exports = OnceFilteredCollection;
});


define('extplug/vote-lists/VoteListView',['require','exports','module','plug/views/rooms/users/RoomUsersListView','plug/views/rooms/users/RoomUserRowView','plug/core/Events','plug/events/ShowUserRolloverEvent','underscore'],function (require, exports, module) {

  var UserListView = require('plug/views/rooms/users/RoomUsersListView');
  var UserRowView = require('plug/views/rooms/users/RoomUserRowView');
  var Events = require('plug/core/Events');
  var RolloverEvent = require('plug/events/ShowUserRolloverEvent');

  var _require = require('underscore');

  var throttle = _require.throttle;

  var VoteRowView = UserRowView.extend({
    onClick: function onClick() {
      Events.dispatch(new RolloverEvent(RolloverEvent.SHOW, this.model, {
        x: this.$el.parents('.extplug-vote-list').offset().left - 5,
        y: this.$el.offset().top + 1
      }, true));
    }
  });

  var VoteListView = UserListView.extend({
    RowClass: VoteRowView,
    initialize: function initialize() {
      this._super();
      this.draw = throttle(this.draw, 120);
      // TODO _probably_ unnecessary--FilteredCollection should deal with this?
      this.collection.on('change:vote change:grab', this.draw, this);
    },
    remove: function remove() {
      this.collection.off('change:vote change:grab', this.draw);
    }
  });

  module.exports = VoteListView;
});


define('extplug/vote-lists/style',['require','exports','module'],function (require, exports, module) {
  var woot = '#90ad2f';
  var grab = '#aa74ff';
  var meh = '#c42e3b';

  var height = 250;

  module.exports = {
    // border colours etc
    '.extplug-vote-list.woot': {
      'border-color': woot,
      '.header': { 'background': woot }
    },
    '.extplug-vote-list.grab': {
      'border-color': grab,
      '.header': { 'background': grab }
    },
    '.extplug-vote-list.meh': {
      'border-color': meh,
      '.header': { 'background': meh }
    },
    // corners in normal mode
    '#room:not(.video-only)': {
      '.extplug-vote-list.woot': {
        'border-bottom-right-radius': '4px' },
      '.extplug-vote-list.grab': {
        'border-bottom-left-radius': '4px',
        'border-bottom-right-radius': '4px'
      },
      '.extplug-vote-list.meh': {
        'border-bottom-left-radius': '4px'
      }
    },
    '.video-only': {
      // ensure that the list is large enough to view, even if vote buttons
      // are narrower than expected
      '.extplug-vote-list': {
        'min-width': '200px' },
      // rounded corner if the list is larger than the button
      '.extplug-vote-list.corner': {
        'border-bottom-right-radius': '4px' }
    },
    '.extplug-vote-list': {
      'height': '' + height + 'px',
      'width': '254px',
      'position': 'absolute',
      'background': '#282c35',
      'top': '-' + height + 'px',
      'border': '3px solid transparent',
      'border-radius': '4px 4px 0 0',
      'box-sizing': 'border-box',
      'display': 'none',

      '> .header': {
        'height': '30px',
        'color': '#fff',
        'i': {
          'left': '5px'
        },
        'span': {
          'position': 'absolute',
          'top': '5px',
          'left': '38px',
          'font-size': '14px'
        }
      },

      '.list.jspScrollable': {
        '.user .icon': {
          'margin-right': '-14px'
        }
      },
      '.list': {
        'height': '' + (height - 36) + 'px',

        '.user': {
          'height': '30px',
          'position': 'relative',

          'i': {
            'top': '7px',
            'left': '12px'
          },

          '.name': {
            'position': 'absolute',
            'top': '5px',
            'left': '38px',
            'font-size': '14px'
          },

          '.name ~ i.icon': {
            'display': 'none'
          }
        },

        '.jspTrack': {
          'background': '#282c35',
          '.jspDrag': {
            'background': '#111317'
          }
        },
        '.jspVerticalBar': {
          'background': '#282c35' }
      }
    },
    '#vote .crowd-response.extplug-vote-hover': {
      'border-top-left-radius': 0,
      'border-top-right-radius': 0
    }
  };
});


define('extplug/vote-lists/main',['require','exports','module','extplug/Plugin','plug/collections/users','lang/Lang','./OnceFilteredCollection','./VoteListView','extplug/store/settings','jquery','./style'],function (require, exports, module) {

  var Plugin = require('extplug/Plugin');
  var users = require('plug/collections/users');
  var Lang = require('lang/Lang');
  var FilteredCollection = require('./OnceFilteredCollection');
  var VoteListView = require('./VoteListView');
  var plugSettings = require('extplug/store/settings');
  var $ = require('jquery');

  var filters = {
    woot: function woot(user) {
      return user.get('vote') === 1;
    },
    meh: function meh(user) {
      return user.get('vote') === -1;
    },
    grab: function grab(user) {
      return user.get('grab') === true;
    },
    hide: function hide(user) {
      return false;
    }
  };

  var VoteLists = Plugin.extend({
    name: 'Vote Lists',
    description: 'Shows a list of users when hovering vote buttons.',

    style: require('./style'),

    init: function init(id, ext) {
      this._super(id, ext);

      this.onEnter = this.onEnter.bind(this);
      this.onLeave = this.onLeave.bind(this);
    },

    enable: function enable() {
      $('#vote .crowd-response').on('mouseenter', this.onEnter);
      $('#vote').on('mouseleave', this.onLeave);

      this.users = new FilteredCollection(users);

      this.$wrap = $('<div />').addClass('extplug-vote-list');
      this.$header = $('<div />').addClass('header');
      this.$icon = $('<i />').addClass('icon');
      this.$title = $('<span />');
      this.$header.append(this.$icon, this.$title);
      this.$wrap.append(this.$header);
      this.view = new VoteListView({ collection: this.users });
      this.$wrap.append(this.view.$el);
      this.view.render();

      $('#vote').prepend(this.$wrap);
    },

    disable: function disable() {
      this.users.destroy();
      this.view.destroy();
      this.$wrap.remove();
      $('#vote .crowd-response').off('mouseenter', this.onEnter);
      $('#vote').off('mouseleave', this.onLeave);

      this.view = null;
      this.users = null;
    },

    onEnter: function onEnter(e) {
      var vote = $(e.target).closest('.crowd-response');
      var type = vote.attr('id');

      $('.crowd-response').removeClass('extplug-vote-hover');
      vote.addClass('extplug-vote-hover');

      this.$wrap.removeClass('woot grab meh').addClass(type);
      // the *-disabled classes are white icons
      this.$icon.removeClass().addClass('icon icon-' + type + '-disabled');
      this.$title.text(Lang.vote[type]);
      this.$wrap.css('display', 'block');

      if (plugSettings.get('videoOnly')) {
        // cover only a single vote button
        var width = vote.width();
        this.$wrap.css('left', '' + vote.position().left + 'px').css('width', '' + width + 'px');

        this.$wrap.toggleClass('corner', width < 200);
      } else {
        // cover entire vote area
        this.$wrap.removeClass('corner').css({ left: '', width: '' });
      }

      this.users.setFilter(filters[type]);
      this.view.draw();
    },
    onLeave: function onLeave() {
      $('.crowd-response').removeClass('extplug-vote-hover');
      this.$wrap.css('display', 'none');
    }
  });

  module.exports = VoteLists;
});

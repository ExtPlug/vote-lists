define(function (require, exports, module) {

  const FilteredCollection = require('backbone-filtered-collection')

  // using a plain class because FilteredCollection isn't a real Backbone
  // Collection
  class OnceFilteredCollection extends FilteredCollection {
    // sets a single filter by replacing the current one instead of always
    // adding new ones.
    // this saves a filter run because FilteredCollection immediately refilters
    // after removing a filter, and then again after adding a new filter.
    setFilter(filter) {
      if (this.hasFilter(this.defaultFilterName)) {
        this._filters[this.defaultFilterName] = {
          fn: filter,
          keys: null
        }
        this.refilter()
      }
      else {
        this.filterBy(filter)
      }
      return this
    }
  }

  module.exports = OnceFilteredCollection

})

define(function (require, exports, module) {

  const UserListView = require('plug/views/rooms/users/RoomUsersListView')
  const UserRowView = require('plug/views/rooms/users/RoomUserRowView')
  const Events = require('plug/core/Events')
  const RolloverEvent = require('plug/events/ShowUserRolloverEvent')
  const { throttle } = require('underscore')

  const VoteRowView = UserRowView.extend({
    onClick() {
      Events.dispatch(new RolloverEvent(RolloverEvent.SHOW, this.model, {
        x: this.$el.parents('.extplug-vote-list').offset().left - 5,
        y: this.$el.offset().top + 1
      }, true))
    }
  })

  const VoteListView = UserListView.extend({
    RowClass: VoteRowView,
    initialize() {
      this._super()
      this.draw = throttle(this.draw, 120)
      // TODO _probably_ unnecessary--FilteredCollection should deal with this?
      this.collection.on('change:vote change:grab', this.draw, this)
    },
    remove() {
      this.collection.off('change:vote change:grab', this.draw)
    }
  })

  module.exports = VoteListView

})

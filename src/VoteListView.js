define(function (require, exports, module) {

  const UserListView = require('plug/views/rooms/users/RoomUsersListView')
  const UserRowView = require('plug/views/rooms/users/RoomUserRowView')
  const { throttle } = require('underscore')

  const VoteListView = UserListView.extend({
    RowClass: UserRowView,
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

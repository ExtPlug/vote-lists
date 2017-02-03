import { throttle } from 'underscore'
import UserListView from 'plug/views/rooms/users/RoomUsersListView'
import UserRowView from 'plug/views/rooms/users/RoomUserRowView'
import Events from 'plug/core/Events'
import RolloverEvent from 'plug/events/ShowUserRolloverEvent'

class VoteRowView extends UserRowView {
  onClick () {
    Events.dispatch(new RolloverEvent(RolloverEvent.SHOW, this.model, {
      x: this.$el.parents('.extplug-vote-list').offset().left - 5,
      y: this.$el.offset().top + 1
    }, true))
  }
}

const VoteListView = UserListView.extend({
  RowClass: VoteRowView,
  initialize () {
    this._super()
    this.draw = throttle(this.draw, 120)
    // TODO _probably_ unnecessary--FilteredCollection should deal with this?
    this.collection.on('change:vote change:grab', this.draw, this)
  },
  remove () {
    this.collection.off('change:vote change:grab', this.draw)
  }
})

export default VoteListView

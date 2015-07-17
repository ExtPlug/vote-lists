define(function (require, exports, module) {

  const Plugin = require('extplug/Plugin')
  const users = require('plug/collections/users')
  const { role: roleComparator } = require('plug/util/comparators')
  const UserRowView = require('plug/views/rooms/users/RoomUserRowView')
  const UserListView = require('plug/views/rooms/users/UserListView')
  const Lang = require('lang/Lang')
  const { throttle } = require('underscore')

  const VoteListView = UserListView.extend({
    RowClass: UserRowView,
    initialize() {
      this._super()
      this.draw = throttle(this.draw, 120)
      this.collection.on('change:vote change:grab', this.draw, this)
    },
    remove() {
      this.collection.off('change:vote change:grab', this.draw)
    }
  })

  const filters = {
    woot: user => user.get('vote') === 1,
    meh:  user => user.get('vote') === -1,
    grab: user => user.get('grab') === true,
    hide: user => false
  }

  const VoteLists = Plugin.extend({
    name: 'Vote Lists',
    description: '',

    init(id, ext) {
      this._super(id, ext)

      this.onEnter = this.onEnter.bind(this)
      this.onLeave = this.onLeave.bind(this)
    },

    enable() {
      $('#vote .crowd-response')
        .on('mouseenter', this.onEnter)
      $('#vote')
        .on('mouseleave', this.onLeave)

      this.$wrap = $('<div />').addClass('extplug-vote-list')
      this.$header = $('<div />').addClass('header')
      this.$icon = $('<i />').addClass('icon')
      this.$title = $('<span />')
      this.$header.append(this.$icon, this.$title)
      this.$wrap.append(this.$header)
      this.view = new VoteListView({ collection: users })
      this.view.canDraw = filters.hide
      this.$wrap.append(this.view.$el)
      this.view.render()

      $('#vote').append(this.$wrap)

      this.Style(require('./style'))
    },

    disable() {
      this.view.destroy()
      this.$wrap.remove()
      $('#vote .crowd-response')
        .off('mouseenter', this.onEnter)
      $('#vote')
        .off('mouseleave', this.onLeave)
    },

    onEnter(e) {
      let vote = $(e.target).closest('.crowd-response')
      let type = vote.attr('id')

      $('.crowd-response').removeClass('extplug-vote-hover')
      vote.addClass('extplug-vote-hover')

      this.$wrap.removeClass('woot grab meh')
        .addClass(type)
      this.$icon.removeClass()
        .addClass(`icon icon-${type}-disabled`)
      this.$title
        .text(Lang.vote[type])
      this.$wrap.css('display', 'block')

      this.view.canDraw = filters[type]
      this.view.draw()
    },
    onLeave() {
      $('.crowd-response').removeClass('extplug-vote-hover')
      this.view.canDraw = filters.hide
      this.$wrap.css('display', 'none')
    }
  })

  module.exports = VoteLists

})

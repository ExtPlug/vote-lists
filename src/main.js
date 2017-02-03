import $ from 'jquery'
import users from 'plug/collections/users'
import Lang from 'lang/Lang'
import Plugin from 'extplug/Plugin'
import plugSettings from 'extplug/store/settings'
import FilteredCollection from './OnceFilteredCollection'
import VoteListView from './VoteListView'
import style from './style.css'

const filters = {
  woot: user => user.get('vote') === 1,
  meh:  user => user.get('vote') === -1,
  grab: user => user.get('grab') === true,
  hide: user => false
}

const VoteLists = Plugin.extend({
  name: 'Vote Lists',
  description: 'Shows a list of users when hovering vote buttons.',

  style: style,

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

    this.users = new FilteredCollection(users)

    this.$wrap = $('<div />').addClass('extplug-vote-list')
    this.$header = $('<div />').addClass('header')
    this.$icon = $('<i />').addClass('icon')
    this.$title = $('<span />')
    this.$header.append(this.$icon, this.$title)
    this.$wrap.append(this.$header)
    this.view = new VoteListView({ collection: this.users })
    this.$wrap.append(this.view.$el)
    this.view.render()

    $('#vote').prepend(this.$wrap)
  },

  disable() {
    this.users.destroy()
    this.view.destroy()
    this.$wrap.remove()
    $('#vote .crowd-response')
      .off('mouseenter', this.onEnter)
    $('#vote')
      .off('mouseleave', this.onLeave)

    this.view = null
    this.users = null
  },

  onEnter(e) {
    let vote = $(e.target).closest('.crowd-response')
    let type = vote.attr('id')

    $('.crowd-response').removeClass('extplug-vote-hover')
    vote.addClass('extplug-vote-hover')

    this.$wrap.removeClass('woot grab meh')
      .addClass(type)
    // the *-disabled classes are white icons
    this.$icon.removeClass()
      .addClass(`icon icon-${type}-disabled`)
    this.$title
      .text(Lang.vote[type])
    this.$wrap.css('display', 'block')

    if (plugSettings.get('videoOnly')) {
      // cover only a single vote button
      let width = vote.width()
      this.$wrap
        .css('left', `${vote.position().left}px`)
        .css('width', `${width}px`)

      this.$wrap.toggleClass('corner', width < 200)
    }
    else {
      // cover entire vote area
      this.$wrap
        .removeClass('corner')
        .css({ left: '', width: '' })
    }

    this.users.setFilter(filters[type])
    this.view.draw()
  },
  onLeave() {
    $('.crowd-response').removeClass('extplug-vote-hover')
    this.$wrap.css('display', 'none')
  }
})

export default VoteLists

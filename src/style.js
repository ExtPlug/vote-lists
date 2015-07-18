define(function (require, exports, module) {
  const woot = '#90ad2f'
  const grab = '#aa74ff'
  const meh = '#c42e3b'

  const height = 250

  module.exports = {
    // border colours etc
    '.extplug-vote-list.woot': {
      'border-color': woot,
      'border-bottom-right-radius': '4px',
      '.header': { 'background': woot }
    },
    '.extplug-vote-list.grab': {
      'border-color': grab,
      'border-bottom-left-radius': '4px',
      'border-bottom-right-radius': '4px',
      '.header': { 'background': grab }
    },
    '.extplug-vote-list.meh': {
      'border-color': meh,
      'border-bottom-left-radius': '4px',
      '.header': { 'background': meh }
    },
    '.extplug-vote-list': {
      'height': `${height}px`,
      'width': '254px',
      'position': 'absolute',
      'background': '#282c35',
      'top': `-${height}px`,
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
        'height': `${height - 36}px`,

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
          'background': '#282c35',
        }
      }
    },
    '#vote .crowd-response.extplug-vote-hover': {
      'border-top-left-radius': 0,
      'border-top-right-radius': 0
    }
  }
})

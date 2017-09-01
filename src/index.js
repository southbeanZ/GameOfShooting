import './style/index.scss'

let $ = function (selector) {
  return document.querySelectorAll(selector)
}

let EventUtil = {
  getEvent: function (e = window.event) {
    return e
  },
  getElement: function (e) {
    return e.target || e.srcElement
  },
  addHandler: function (ele, event, handler, useCapture) {
    if (ele.addEventListener) {
      ele.addEventListener(event, handler, useCapture)
    } else if (ele.attachEvent) {
      ele.attachEvent('on' + event, handler)
    } else {
      let oldHandler = ele['on' + event]
      if (oldHandler) {
        ele['on' + event] = function () {
          oldHandler()
          handler()
        }
      } else {
        ele['on' + event] = handler
      }
    }
  },
  removeHandler: function (ele, event, handler) {
    if (ele.removeEventListener) {
      ele.removeEventListener(event, handler)
    } else if (ele.detachEvent) {
      ele.detachEvent('on' + event, handler)
    } else {
      // let oldHandler = ele['on' + event]
      // if (oldEvent) {
      //   ele['on' + event] = function () {
      //     oldHandler()
      //     handler()
      //   } 
      // } else {
      //   ele['on' + event] = handler
      // }
      ele['on' + event] = null
    }
  },
  stopPropagation: function (e) {
    if (e.stopPropagation) {
      e.stopPropagation()
    } else {
      e.cancelBubble = true
    }
  }
}

let page = {
  init: function () {
    let self = this
    self.listen()
  },
  listen: function () {
    let self = this
    $('.J_btn_start').forEach((_ele) => {
      EventUtil.addHandler(_ele, 'click', self.fRenderGame)
    })
    // EventUtil.addHandler($('#J_btn_start')[0], 'click', self.fJumpPage)
  },
  fRenderGame: function () {
    $('.g-part').forEach((_ele) => {
      _ele.style.display = 'none'
    })
    $('.g-part-game')[0].style.display = 'block'
  }
}

page.init()
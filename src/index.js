import './style/index.scss'
import planeImg from './image/plane.png'

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

window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame

class Bullet {
  constructor () {
    this.dx = Plane.dx + 30
    this.dy = Plane.dy - 10
    this.vy = 10
    this.ani = null
    this.move()
  }
  move () {
    Game.ctx.fillStyle = '#fff'
    Game.ctx.clearRect(this.dx, this.dy, 1, this.vy)
    this.dy -= this.vy
    if (this.dy < 20) {
      this.ani = null
    } else {
      if (this.dy < 30) {
        Game.ctx.fillRect(this.dx, 30, 1, 10 - (30 - this.dy))
      }
      Game.ctx.fillRect(this.dx, this.dy, 1, 10)
      this.ani = window.requestAnimationFrame(() => this.move())
    }
  }
}

let Plane = {
  view: function () {
    let self = this
    self.dx = 320
    self.dy = 470
    self.vx = 0
    self.img = new Image()
    self.img.onload = function () {
      Game.ctx.drawImage(self.img, self.dx, self.dy, 60, 100)
    }
    self.img.src = planeImg
    self.ani = null
    self.listen()
  },
  listen: function () {
    let self = this
    EventUtil.addHandler(window, 'keydown', self.keypressHandler)
    EventUtil.addHandler(window, 'keyup', () => {
      window.cancelAnimationFrame(self.ani)
      self.ani = null
    })
  },
  keypressHandler: function (e) {
    let self = Plane
    let keycode = +(e.keyCode || e.which)
    // console.log(keycode)
    switch (keycode) {
      case 37:
        self.vx = -1
        if (!self.ani) {
          self.move()
        }
        break
      case 39:
        self.vx = 1
        if (!self.ani) {
          self.move()
        }
        break
      case 32:
        let bull = new Bullet()
        break
      default:
        break
    }
  },
  move: function () {
    let self = this
    Game.ctx.clearRect(30, self.dy, 640, 100)
    self.dx += self.vx * 5
    self.dx = self.dx < 30 ? 30 : self.dx > 610 ? 610 : self.dx
    Game.ctx.drawImage(self.img, self.dx, self.dy, 60, 100)
    self.ani = window.requestAnimationFrame(() => self.move())
  }
}

let Game = {
  init: function () {
    let self = this
    self.ctx = $('#J_game')[0].getContext('2d')
    self.view()
  },
  view: function () {
    Plane.view()
  }
}

let page = {
  init: function () {
    let self = this
    self.listen()
    self.fRenderGame()
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
    Game.init()
  }
}

page.init()
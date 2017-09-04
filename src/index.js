import './style/index.scss'
import planeImg from './image/plane.png'
import monsterImg from './image/enemy.png'
import boomImg from './image/boom.png'

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
    this.w = 1
    this.h = 10
    this.vy = 10
    this.ani = null
    this.move()
  }
  move () {
    Game.ctx.fillStyle = '#fff'
    Game.ctx.clearRect(this.dx, this.dy, 1, this.vy)
    this.dy -= this.vy
    if (this.dy < 20) {
      window.cancelAnimationFrame(this.ani)
    } else {
      if (this.dy < 30) {
        Game.ctx.fillRect(this.dx, 30, 1, 10 - (30 - this.dy))
      }
      Game.ctx.fillRect(this.dx, this.dy, 1, 10)
      // this.ani = window.requestAnimationFrame(() => this.move())
    }
  }
}

class Monster {
  constructor (_dx = 30, _dy = 30) {
    this.dx = _dx
    this.dy = _dy
    this.w = 50
    this.h = 50
    this.vx = 2
    this.ani = null
    this.img = null
    this.die = false
    this.dieCount = 0
    this.dead = false
  }
  view () {
    this.img = new Image()
    let self = this
    this.img.onload = function () {
      Game.ctx.drawImage(self.img, self.dx, self.dy, 50, 50)
    }
    this.img.src = monsterImg
  }
  move () {
    // Game.ctx.clearRect(this.dx, this.dy, 50, 50)
    // this.dx += 2
    if (this.die) {
      this.img.src = boomImg
      this.dieCount++
      console.log('one die!')
      if (this.dieCount > 3) {
        this.dead = true
        console.log('one dead!')
        return
      }
    }
    Game.ctx.drawImage(this.img, this.dx, this.dy, 50, 50)
    // this.ani = window.requestAnimationFrame(() => this.move())
  }
}

class MonsterGroup {
  constructor () {
    this.gap = 10
    this.list = []
    this.num = 7
    this.dx = 30
    this.dy = 30
    this.vx = 2
    this.flagArr = []
    for (let i = 0; i < 50; i++) {
      this.flagArr[i] = new Array(this.num * 60 - 10)
      this.flagArr[i].fill(0)
    }
  }
  view () {
    for (let i = 0; i < this.num; i++) {
      let monster = new Monster((50 + this.gap) * i + this.dx, this.dy)
      for (let i = 0; i < 50; i++) {
        this.flagArr[i].fill(1, this.dx, this.dx + 51)
      }
      this.list.push(monster)
      // setTimeout(() => {
      //   monster.die = true
      // }, 2000 * (i + 1))
      monster.view()
    }
    this.dxr = (50 + this.gap) * this.num
    this.move()
  }
  move () {
    Game.ctx.clearRect(this.dx, this.dy, this.dxr, 50)
    this.dx += this.vx
    if (this.dx + this.dxr > 670 || this.dx < 30) {
      this.dy += 50
      if (this.dy > 470) {
        window.cancelAnimationFrame(this.ani)
        return
      }
      if (this.dx < 30) {
        this.vx = 2
      } else {
        this.vx = -2
      }
    }
    this.list.forEach((_ele, _i) => {
      if (_ele.dead) {
        let len = this.list.length
        this.list.splice(_i, 1)
        if (len === 1) {
          console.log('win!')
        }
        if (_i === 0) {
          this.dx += 60
          this.dxr -= 60
        } else if (_i === len - 1) {
          this.dxr -= 60
        }
      } else {
        _ele.dx += this.vx
        _ele.dy = this.dy
        _ele.move()
      }
    })
    // this.ani = window.requestAnimationFrame(() => this.move())
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
    self.bulletList = []
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
        self.bulletList.push(bull)
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
    self.plane = null
    self.enemies = null
    self.score = 0
    self.scoreContainer = $('.J_score')[0]
    self.ctx = $('#J_game')[0].getContext('2d')
    self.view()
  },
  view: function () {
    let self = this
    // self.renderScore()
    self.plane = Plane
    self.plane.view()
    self.enemies = new MonsterGroup()
    self.enemies.view()
    self.move()
  },
  // renderScore: function () {
  //   let self = this
  //   self.ctx.font = '18px'
  //   self.ctx.strokeStyle = '#fff'
  //   self.ctx.strokeText('分数：' + self.score, 20, 20)
  // },
  hitDetection: function () {
    let self = this
    let bullets = self.plane.bulletList
    let monsters = self.enemies.list
    bullets.forEach((_ele) => {
      let _eleDx = _ele.dx,
          _eleDy = _ele.dy,
          _eleW = _ele.w,
          _eleH = _ele.h

      monsters.every((_item) => {
        if (_item.die || _item.dead) {
          return true
        }
        let _itemDx = _item.dx,
            _itemDy = _item.dy,
            _itemW = _item.w,
            _itemH = _item.h
        if (_eleDy > _itemDy + _itemH || _eleDy + _eleH < _itemDy || _eleDx < _itemDx || _eleDx + _eleW > _itemDx + _itemW) {
          return true
        } else {
          _item.die = true
          self.score++
          self.scoreContainer.innerHTML = self.score
          return false
        }
      })
    })
  },
  move: function () {
    let self = this
    let bullets = self.plane.bulletList
    bullets.forEach((_ele) => {
      _ele.move()
    })
    self.enemies.move()
    self.hitDetection()
    self.ani = window.requestAnimationFrame(() => self.move())
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
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

let GameConfig = {
  width: 700,
  height: 600,
  padding: 30,
  areaW: 640
}

class Bullet {
  constructor () {
    this.w = 1
    this.h = 10
    this.dx = Plane.dx + Plane.w / 2
    this.dy = Plane.dy - this.h
    this.vy = 10
    this.ani = null
    this.die = false
    this.move()
  }
  move () {
    Game.ctx.fillStyle = '#fff'
    Game.ctx.clearRect(this.dx, this.dy, this.w, this.h)
    this.dy -= this.vy
    if (this.die || this.dy < 20) {
      this.die = true
      // window.cancelAnimationFrame(this.ani)
    } else {
      if (this.dy < GameConfig.padding) {
        Game.ctx.fillRect(this.dx, GameConfig.padding, this.w, this.h - (GameConfig.padding - this.dy))
      }
      Game.ctx.fillRect(this.dx, this.dy, this.w, this.h)
      // this.ani = window.requestAnimationFrame(() => this.move())
    }
  }
}

class Monster {
  constructor (_dx = GameConfig.padding, _dy = GameConfig.padding) {
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
      Game.ctx.drawImage(self.img, self.dx, self.dy, self.w, self.h)
    }
    this.img.src = monsterImg
  }
  move () {
    // Game.ctx.clearRect(this.dx, this.dy, 50, 50)
    // this.dx += 2
    if (this.dead) {
      return
    }
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
    Game.ctx.drawImage(this.img, this.dx, this.dy, this.w, this.h)
    // this.ani = window.requestAnimationFrame(() => this.move())
  }
}

class MonsterGroup {
  constructor () {
    this.gap = 10
    this.list = []
    this.num = 7
    this.dx = GameConfig.padding
    this.dy = GameConfig.padding
    this.w = 0
    this.h = 50
    this.vx = 2
    this.vy = 50
    this.flagArr = []
    for (let i = 0; i < this.h; i++) {
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
      monster.view()
    }
    this.w = (50 + this.gap) * this.num
    this.move()
  }
  move () {
    Game.ctx.clearRect(this.dx, this.dy, this.w, this.h)
    this.dx += this.vx
    if (this.dx + this.w > 670 || this.dx < GameConfig.padding) {
      this.dy += this.vy
      if (this.dy >= 430) {
        return
      }
      if (this.dx < GameConfig.padding) {
        this.vx = 2
      } else {
        this.vx = -2
      }
    }
    let tmp = []
    this.list.forEach((_ele, _i) => {
      if (_ele.dead) {
        let len = this.list.length

        if (_i === 0) {
          this.dx += 60
          this.w -= 60
        } else if (_i === len - 1) {
          this.w -= 60
        }
      } else {
        _ele.dx += this.vx
        _ele.dy = this.dy
        _ele.move()
        tmp.push(_ele)
      }
    })
    this.list = tmp
    // this.ani = window.requestAnimationFrame(() => this.move())
  }
}

let Plane = {
  view: function () {
    let self = this
    self.dx = 320
    self.dy = 470
    self.w = 60
    self.h = 100
    self.vx = 0
    self.img = new Image()
    self.img.onload = function () {
      Game.ctx.drawImage(self.img, self.dx, self.dy, self.w, self.h)
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
        self.vx = -5
        if (!self.ani) {
          self.move()
        }
        break
      case 39:
        self.vx = 5
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
    Game.ctx.clearRect(self.dx, self.dy, GameConfig.areaW, self.h)
    self.dx += self.vx
    self.dx = self.dx < GameConfig.padding ? GameConfig.padding : self.dx > 610 ? 610 : self.dx
    Game.ctx.drawImage(self.img, self.dx, self.dy, self.w, self.h)
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
      if (_ele.die) {
        return
      }
      let _eleDx = _ele.dx,
          _eleDy = _ele.dy,
          _eleW = _ele.w,
          _eleH = _ele.h

      monsters.every((_item, _i) => {
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
          _ele.die = true
          _item.die = true

          // if (_i === 0) {
          //   self.enemies.dx += 60
          //   self.enemies.w -= 60
          //   console.log(self.enemies.w)
          // } else if (_i === monsters.length - 1) {
          //   self.enemies.w -= 60
          //   console.log(self.enemies.w)
          // }

          self.score++
          self.scoreContainer.innerHTML = self.score
          return false
        }
      })
    })
  },
  isGameWin: function () {
    let self = this
    if (self.enemies.list.length === 0) {
      window.cancelAnimationFrame(self.ani)
      return true
    }
    return false
  },
  isGameOver: function () {
    let self = this
    if (self.enemies.dy >= 430) {
      window.cancelAnimationFrame(self.ani)
      return true
    }
    return false
  },
  move: function () {
    let self = this
    let bullets = self.plane.bulletList
    self.enemies.move()
    bullets.forEach((_ele, _index) => {
      // if (_ele.die) {
        // return
        // self.plane.bulletList.splice(_index, 1)
      // }
      _ele.move()
    })
    self.hitDetection()
    if (self.isGameWin()) {
      console.log('win')
      return
    }
    if (self.isGameOver()) {
      console.log('lose')
      return
    }
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
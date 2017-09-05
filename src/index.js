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
  areaW: 640,
  planeSize: {
    width: 60,
    height: 100
  }
}

class Bullet {
  constructor (_dx, _dy) {
    this.w = 1
    this.h = 10
    this.dx = _dx
    this.dy = _dy - this.h
    this.vy = 10
    this.die = false
    this.minY = GameConfig.padding - this.h
    this.move()
  }
  move () {
    this.dy -= this.vy
    if (this.die || this.dy < this.minY) {
      this.die = true
    } else {
      if (this.dy < GameConfig.padding) {
        Game.ctx.fillRect(this.dx, GameConfig.padding, this.w, this.h - (GameConfig.padding - this.dy))
      }
      Game.ctx.fillRect(this.dx, this.dy, this.w, this.h)
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
    this.img = null
    this.die = false
    this.dieCount = 0
    this.dead = false
  }
  view () {
    this.img = new Image()
    this.img.onload = () => {
      Game.ctx.drawImage(this.img, this.dx, this.dy, this.w, this.h)
    }
    this.img.src = monsterImg
  }
  move () {
    if (this.dead) {
      return
    }
    if (this.die) {
      this.img.src = boomImg
      this.dieCount++
      if (this.dieCount > 3) {
        this.dead = true
        return
      }
    }
    Game.ctx.drawImage(this.img, this.dx, this.dy, this.w, this.h)
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
  }
  view () {
    for (let i = 0; i < this.num; i++) {
      let monster = new Monster((50 + this.gap) * i + this.dx, this.dy)
      this.list.push(monster)
      monster.view()
    }
    this.w = (50 + this.gap) * this.num
    this.move()
  }
  getWidth () {
    let head = null,
        end = null
    head = this.list.find((_ele) => {
      return !_ele.die
    })
    if (!head) {
      this.dx = 0
      return 0
    }
    for (let i = this.list.length - 1; i >= 0; i--) {
      let cur = this.list[i]
      if (!cur.die) {
        end = cur
        break
      }
    }
    this.dx = head.dx
    return end.dx - head.dx + 50
  }
  move () {
    this.dx += this.vx
    if (this.dx + this.w > 670 || this.dx < GameConfig.padding) {
      this.dy += this.vy
      if (this.dy >= 480) {
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
      if (!_ele.dead) {
        _ele.dx += this.vx
        _ele.dy = this.dy
        tmp.push(_ele)
      }
      _ele.move()
    })
    this.w = this.getWidth()
  }
}

class Plane {
  constructor () {
    this.w = 60
    this.h = 100
    this.dx = (GameConfig.width - this.w) / 2
    this.dy = GameConfig.height - GameConfig.padding - this.h + 10
    this.vx = 0
    this.img = null
    this.bulletList = []
    this.view()
    this.listen()
  }
  view () {
    this.img = new Image()
    this.img.onload = () => {
      Game.ctx.drawImage(this.img, this.dx, this.dy, this.w, this.h)
    }
    this.img.src = planeImg
  }
  listen () {
    EventUtil.addHandler(window, 'keydown', (e) => this.keypressHandler(e))
    EventUtil.addHandler(window, 'keyup', () => {
      this.vx = 0
    })
  }
  keypressHandler (e) {
    let keycode = +(e.keyCode || e.which)
    // console.log(keycode)
    switch (keycode) {
      case 37:
        this.vx = -5
        break
      case 39:
        this.vx = 5
        break
      case 32:
        let _dx = this.dx + this.w / 2,
            _dy = this.dy
        let bull = new Bullet(_dx, _dy)
        this.bulletList.push(bull)
        break
      default:
        break
    }
  }
  move () {
    this.dx += this.vx
    this.dx = this.dx < GameConfig.padding ? GameConfig.padding : this.dx > 610 ? 610 : this.dx
    Game.ctx.drawImage(this.img, this.dx, this.dy, this.w, this.h)
  }
}

let Game = {
  init: function () {
    let self = this
    self.plane = null
    self.enemies = null
    self.score = 0
    self.enemiesMaxY = GameConfig.height - GameConfig.planeSize.height - GameConfig.padding
    self.scoreContainer = $('.J_score2')[0]
    self.scoreContainer.innerHTML = self.score
    self.ctx = $('#J_game')[0].getContext('2d')
    self.ctx.fillStyle = '#fff'
    self.view()
  },
  view: function () {
    let self = this
    self.plane = new Plane()
    self.enemies = new MonsterGroup()
    self.enemies.view()
    self.move()
  },
  /**
   * 子弹击中检测
   */
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
      monsters.every((_tar, _i) => {
        if (_tar.die || _tar.dead) {
          return true
        }
        let _tarDx = _tar.dx,
            _tarDy = _tar.dy,
            _tarW = _tar.w,
            _tarH = _tar.h
        if (_eleDy > _tarDy + _tarH || _eleDy + _eleH < _tarDy || _eleDx < _tarDx || _eleDx + _eleW > _tarDx + _tarW) {
          return true
        } else {
          _ele.die = true
          _tar.die = true
          self.score++
          self.scoreContainer.innerHTML = self.score
          return false
        }
      })
    })
  },
  isGameWin: function () {
    let self = this
    if (+self.score === 7) {
      window.cancelAnimationFrame(self.ani)
      return true
    }
    return false
  },
  isGameOver: function () {
    let self = this
    if (self.enemies.dy >= self.enemiesMaxY) {
      window.cancelAnimationFrame(self.ani)
      return true
    }
    return false
  },
  move: function () {
    let self = this
    if (self.isGameWin()) {
      self.fRenderPage(1)
      return
    }
    if (self.isGameOver()) {
      self.fRenderPage(0)
      return
    }
    self.hitDetection()
    if (+self.plane.vx !== 0) {
      Game.ctx.clearRect(0, 0, GameConfig.width, GameConfig.height)
      self.plane.move()
    } else {
      Game.ctx.clearRect(GameConfig.padding, 0, GameConfig.areaW, GameConfig.height - GameConfig.padding - GameConfig.planeSize.height + 10)
    }
    self.enemies.move()
    let bullets = self.plane.bulletList
    bullets.forEach((_ele, _index) => {
      _ele.move()
    })
    self.ani = window.requestAnimationFrame(() => self.move())
  },
  /**
   * 游戏结束，页面跳转
   * @param {number} status 0 输; 1 赢;
   */
  fRenderPage: function (status) {
    let self = this
    $('.g-part').forEach((_ele) => {
      _ele.style.display = 'none'
    })
    switch (+status) {
      case 0:
        $('.g-part-end')[0].style.display = 'block'
        break
      case 1:
        $('.g-part-success')[0].style.display = 'block'
        break
      default:
        break
    }
    $('.J_score').forEach((_ele) => {
      _ele.innerHTML = self.score
    })
    self.ctx.clearRect(0, 0, GameConfig.width, GameConfig.height)
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
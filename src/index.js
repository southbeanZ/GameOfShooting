import './style/index.scss'
import CONFIG from './js/config'
import planeImg from './img/plane.png'
import monsterImg from './img/enemy.png'
import boomImg from './img/boom.png'

const CANVAS_WIDTH = 700
const CANVAS_HEIGHT = 600

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
  constructor (_dx, _dy) {
    this.w = 1
    this.h = CONFIG.bulletSize
    this.dx = _dx
    this.dy = _dy - this.h
    this.vy = CONFIG.bulletSpeed
    this.die = false
    this.minY = CONFIG.canvasPadding - this.h
    this.move()
  }
  move () {
    this.dy -= this.vy
    if (this.die || this.dy < this.minY) {
      this.die = true
    } else {
      if (this.dy < CONFIG.canvasPadding) {
        Game.ctx.fillRect(this.dx, CONFIG.canvasPadding, this.w, this.h - (CONFIG.canvasPadding - this.dy))
      }
      Game.ctx.fillRect(this.dx, this.dy, this.w, this.h)
    }
  }
}

class Monster {
  constructor (_dx = CONFIG.canvasPadding, _dy = CONFIG.canvasPadding) {
    this.dx = _dx
    this.dy = _dy
    this.w = CONFIG.enemySize
    this.h = CONFIG.enemySize
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
    this.gap = CONFIG.enemyGap
    this.monsterList = []
    this.num = CONFIG.numPerLine
    this.dx = CONFIG.canvasPadding
    this.dy = CONFIG.canvasPadding
    this.w = 0
    this.h = CONFIG.enemySize
    this.vx = CONFIG.enemySpeed
    this.vy = CONFIG.enemySize
    this.maxX = CANVAS_WIDTH - CONFIG.canvasPadding
  }
  view () {
    for (let i = 0; i < this.num; i++) {
      let monster = new Monster((CONFIG.enemySize + this.gap) * i + this.dx, this.dy)
      this.monsterList.push(monster)
      monster.view()
    }
    this.w = (CONFIG.enemySize + this.gap) * this.num - this.gap
    this.move()
  }
  /**
   * 计算怪兽队伍的宽度, 并更新x坐标
   */
  getWidth () {
    let head = null,
        end = null
    head = this.monsterList.find((_ele) => {
      return !_ele.die
    })
    if (!head) {
      this.dx = CONFIG.canvasPadding
      return 0
    }
    for (let i = this.monsterList.length - 1; i >= 0; i--) {
      let cur = this.monsterList[i]
      if (!cur.die) {
        end = cur
        break
      }
    }
    this.dx = head.dx
    return end.dx - head.dx + CONFIG.enemySize
  }
  move () {
    this.dx += this.vx
    if (this.dx + this.w > this.maxX || this.dx < CONFIG.canvasPadding) {
      this.dy += this.vy
      // if (this.dy >= 480) {
      //   return
      // }
      if (this.dx < CONFIG.canvasPadding) {
        this.vx = CONFIG.enemySpeed
      } else {
        this.vx = -CONFIG.enemySpeed
      }
    }
    this.monsterList.forEach((_ele, _i) => {
      if (!_ele.dead) {
        _ele.dx += this.vx
        _ele.dy = this.dy
      }
      _ele.move()
    })
    this.w = this.getWidth()
  }
}

class Plane {
  constructor () {
    this.w = CONFIG.planeSize.width
    this.h = CONFIG.planeSize.height
    this.dx = (CANVAS_WIDTH - this.w) / 2
    this.dy = CANVAS_HEIGHT - CONFIG.canvasPadding - this.h + 10
    this.vx = 0
    this.maxX = CANVAS_WIDTH - this.w - CONFIG.canvasPadding
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
    EventUtil.addHandler(window, 'keydown', (e) => this.keydownHandler(e))
    EventUtil.addHandler(window, 'keyup', () => {
      this.vx = 0
    })
  }
  keydownHandler (e) {
    let keycode = +(e.keyCode || e.which)
    // console.log(keycode)
    switch (keycode) {
      case 37:
        this.vx = -CONFIG.planeSpeed
        break
      case 39:
        this.vx = CONFIG.planeSpeed
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
    this.dx = this.dx < CONFIG.canvasPadding ? CONFIG.canvasPadding : this.dx > this.maxX ? this.maxX : this.dx
    Game.ctx.drawImage(this.img, this.dx, this.dy, this.w, this.h)
  }
}

let Game = {
  init: function () {
    let self = this
    self.plane = null
    self.enemies = null
    self.score = 0
    self.enemiesMaxY = CANVAS_HEIGHT - CONFIG.planeSize.height - CONFIG.canvasPadding + 10
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
   * 游戏结束，页面跳转
   * @param {number} status 状态：0 输; 1 赢;
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
    self.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  },
  /**
   * 子弹击中检测处理
   */
  hitDetection: function () {
    let self = this,
        bullets = self.plane.bulletList,
        monsters = self.enemies.monsterList
    bullets.forEach((_ele, _index) => {
      let deadBulletIndex,
          deadMonsterIndex
      if (_ele.die) {
        return
      }
      let _eleDx = _ele.dx,
          _eleDy = _ele.dy,
          _eleW = _ele.w,
          _eleH = _ele.h
      monsters.every((_tar, _i) => {
        if (_tar.die || _tar.dead) {
          if (_tar.dead) {
            deadMonsterIndex = _i
          }
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
          deadBulletIndex = _index
          self.score++
          self.scoreContainer.innerHTML = self.score
          return false
        }
      })
      deadMonsterIndex !== undefined && monsters.splice(deadBulletIndex, 1)
      deadBulletIndex !== undefined && monsters.splice(deadBulletIndex, 1)
    })
  },
  isGameWin: function () {
    let self = this
    if (+self.score === CONFIG.numPerLine) {
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
      Game.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      self.plane.move()
    } else {
      Game.ctx.clearRect(0, 0, CANVAS_WIDTH, self.enemiesMaxY)
    }
    self.enemies.move()
    let bullets = self.plane.bulletList
    bullets.forEach((_ele, _index) => {
      _ele.move()
    })
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
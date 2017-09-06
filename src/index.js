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

window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame || function (cb) {
  window.setTimeout(cb, 1000 / 60)
}

/**
 * 子弹
 */
class Bullet {
  constructor (_ctx, _dx, _dy) {
    this.ctx = _ctx
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
    if (this.dy < this.minY) {
      this.die = true
    } else {
      if (this.dy < CONFIG.canvasPadding) {
        this.ctx.fillRect(this.dx, CONFIG.canvasPadding, this.w, this.h - (CONFIG.canvasPadding - this.dy))
      }
      this.ctx.fillRect(this.dx, this.dy, this.w, this.h)
    }
  }
}

/**
 * 飞机
 */
class Plane {
  constructor (_ctx) {
    this.ctx = _ctx
    this.w = CONFIG.planeSize.width
    this.h = CONFIG.planeSize.height
    this.dx = (CANVAS_WIDTH - this.w) / 2
    this.dy = CANVAS_HEIGHT - CONFIG.canvasPadding - this.h
    this.vx = 0
    this.minX = CONFIG.canvasPadding
    this.maxX = CANVAS_WIDTH - this.w - CONFIG.canvasPadding
    this.img = null
    this.bulletList = []
    this.view()
    this.listen()
  }
  view () {
    this.img = new Image()
    this.img.onload = () => {
      this.ctx.drawImage(this.img, this.dx, this.dy, this.w, this.h)
    }
    this.img.src = CONFIG.planeIcon
  }
  listen () {
    window.addEventListener('keydown', (e) => this.keydownHandler(e))
    window.addEventListener('keyup', () => {
      this.vx = 0
    })
  }
  keydownHandler (e) {
    let keycode = +(e.keyCode || e.which)
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
        let bull = new Bullet(this.ctx, _dx, _dy)
        this.bulletList.push(bull)
        break
      default:
        break
    }
  }
  move () {
    this.dx += this.vx
    this.dx = this.dx < this.minX ? this.minX : this.dx > this.maxX ? this.maxX : this.dx
    this.ctx.drawImage(this.img, this.dx, this.dy, this.w, this.h)
  }
}

/**
 * 怪兽
 */
class Monster {
  constructor (_ctx, _dx = CONFIG.canvasPadding, _dy = CONFIG.canvasPadding) {
    this.ctx = _ctx
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
      this.ctx.drawImage(this.img, this.dx, this.dy, this.w, this.h)
    }
    this.img.src = CONFIG.enemyIcon
  }
  move () {
    if (this.die) {
      this.img.src = CONFIG.enemyBoomIcon
      this.dieCount++
      if (this.dieCount > 3) {
        this.dead = true
        return
      }
    }
    this.ctx.drawImage(this.img, this.dx, this.dy, this.w, this.h)
  }
}

/**
 * 怪兽队伍
 */
class MonsterGroup {
  constructor (_ctx, _rowNum) {
    this.ctx = _ctx
    this.rowNum = _rowNum
    this.colNum = CONFIG.numPerLine
    this.gap = CONFIG.enemyGap
    this.maxX = CANVAS_WIDTH - CONFIG.canvasPadding
    this.dx = CONFIG.canvasPadding
    this.dy = CONFIG.canvasPadding
    this.vx = CONFIG.enemySpeed
    this.vy = 0
    this.monsterList = []
    this.w = (CONFIG.enemySize + this.gap) * this.colNum - this.gap
    if (CONFIG.enemyDirection === 'left') {
      this.dx = CANVAS_WIDTH - CONFIG.canvasPadding - this.w
      this.vx = -this.vx
    }
    this.boundary = {
      minX: this.dx,
      minY: this.dy,
      maxX: this.dx + this.w,
      maxY: this.dy + CONFIG.enemySize * this.rowNum
    }
  }
  view () {
    for (let i = 0; i < this.rowNum; i++) {
      for (let j = 0; j < this.colNum; j++) {
        let monster = new Monster(this.ctx, (CONFIG.enemySize + this.gap) * j + this.dx, CONFIG.enemySize * i + this.dy)
        this.monsterList.push(monster)
        monster.view()
      }
    }
  }
  /**
   * 更新怪兽队伍
   */
  updateMonsters () {
    let _minX = CANVAS_WIDTH,
        _minY = CANVAS_HEIGHT,
        _maxX = 0,
        _maxY = 0,
        len = this.monsterList.length
    while (len--) {
      let _ele = this.monsterList[len]
      if (_ele.dead) {
        this.monsterList.splice(len, 1)
        continue
      }
      _ele.dx += this.vx
      _ele.dy += this.vy
      _ele.move()
      if (_ele.dx < _minX) {
        _minX = _ele.dx
      }
      if (_ele.dy < _minY) {
        _minY = _ele.dy
      }
      if (_ele.dx + CONFIG.enemySize > _maxX) {
        _maxX = _ele.dx + CONFIG.enemySize
      }
      if (_ele.dy + CONFIG.enemySize > _maxY) {
        _maxY = _ele.dy + CONFIG.enemySize
      }
    }
    this.boundary = {
      minX: _minX,
      minY: _minY,
      maxX: _maxX,
      maxY: _maxY
    }
  }
  move () {
    this.dx += this.vx
    if (this.boundary.maxX > this.maxX || this.boundary.minX < CONFIG.canvasPadding) {
      this.vy = CONFIG.enemySize
      this.dy += this.vy
      if (this.boundary.minX < CONFIG.canvasPadding) {
        this.vx = CONFIG.enemySpeed
      } else {
        this.vx = -CONFIG.enemySpeed
      }
    } else {
      this.vy = 0
    }
    this.updateMonsters()
  }
}

let Game = {
  init: function () {
    let self = this
    self.level = CONFIG.level
    self.plane = null
    self.enemies = null
    self.score = 0
    self.totalScore = 0
    self.enemiesMaxY = CANVAS_HEIGHT - CONFIG.planeSize.height - CONFIG.canvasPadding
    self.scoreContainer = $('.J_score2')[0]
    self.scoreContainer.innerHTML = self.score
    self.ctx = $('#J_game')[0].getContext('2d')
    self.ctx.fillStyle = '#fff'
  },
  view: function () {
    let self = this
    self.totalScore += CONFIG.numPerLine * self.level
    self.plane = new Plane(self.ctx)
    self.enemies = new MonsterGroup(self.ctx, self.level)
    self.enemies.view()
    self.play()
  },
  /**
   * 游戏结束，页面跳转
   * @param {number} status 状态：0 输; 1 继续; 2 获胜;
   */
  fRenderPage: function (status) {
    let self = this
    $('.g-part').forEach((_ele) => {
      _ele.style.display = 'none'
    })
    $('.J_score').forEach((_ele) => {
      _ele.innerHTML = self.score
    })
    switch (+status) {
      case 0:
        $('.g-part-end')[0].style.display = 'block'
        self.init()
        break
      case 1:
        $('.g-part-pass')[0].style.display = 'block'
        $('.J_level')[0].innerHTML = self.level
        break
      case 2:
        $('.g-part-success')[0].style.display = 'block'
        self.init()
        break
      default:
        break
    }
    self.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  },
  /**
   * 子弹击中检测处理, 并移除废弃子弹
   */
  hitDetection: function () {
    let self = this,
        bullets = self.plane.bulletList,
        bulletNum = bullets.length,
        monsters = self.enemies.monsterList
    while (bulletNum--) {
      let _ele = bullets[bulletNum]
      if (_ele.die) {
        bullets.splice(bulletNum, 1)
        continue
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
        if (_eleDy > _tarDy + _tarH || _eleDy + _eleH < _tarDy || _eleDx + _eleW < _tarDx || _eleDx > _tarDx + _tarW) {
          return true
        } else {
          bullets.splice(bulletNum, 1)
          _tar.die = true
          self.score++
          self.scoreContainer.innerHTML = self.score
          return false
        }
      })
    }
  },
  isGameWin: function () {
    let self = this
    if (+self.score === self.totalScore) {
      window.cancelAnimationFrame(self.ani)
      return true
    }
    return false
  },
  isGameOver: function () {
    let self = this
    if (self.enemies.boundary.maxY > self.enemiesMaxY) {
      window.cancelAnimationFrame(self.ani)
      return true
    }
    return false
  },
  move: function () {
    let self = this
    self.hitDetection()
    if (+self.plane.vx !== 0) {
      self.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      self.plane.move()
    } else {
      self.ctx.clearRect(0, 0, CANVAS_WIDTH, self.enemiesMaxY)
    }
    self.enemies.move()
    let bullets = self.plane.bulletList
    bullets.forEach((_ele, _index) => {
      _ele.move()
    })
  },
  play: function () {
    let self = this
    if (self.isGameWin()) {
      if (self.level === CONFIG.totalLevel) {
        self.fRenderPage(2)
      } else {
        self.level++
        self.fRenderPage(1)
      }
      return
    }
    if (self.isGameOver()) {
      self.fRenderPage(0)
      return
    }
    self.move()
    self.ani = window.requestAnimationFrame(() => self.play())
  }
}

let page = {
  init: function () {
    let self = this
    self.listen()
    self.view()
  },
  listen: function () {
    let self = this
    $('.J_btn_start').forEach((_ele) => {
      _ele.addEventListener('click', self.fRenderGame)
    })
  },
  view: function () {
    Game.init()
  },
  fRenderGame: function () {
    $('.g-part').forEach((_ele) => {
      _ele.style.display = 'none'
    })
    $('.g-part-game')[0].style.display = 'block'
    Game.view()
  }
}

page.init()
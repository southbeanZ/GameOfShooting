# GameOfShooting
A game of shooting. 射击游戏


## 项目说明

- 概述：Canvas 射击小游戏。要求玩家控制飞机发射子弹，消灭会移动的怪兽，如果全部消灭了则游戏成功，如果怪兽移动到底部则游戏失败。
- 项目需求来源于[IMWEB课程](http://git.imweb.io/imweb-teacher/game)
- 技术栈：原生js + scss + webpack
- 本项目仓库：[southbeanZ/GameOfShooting](https://github.com/southbeanZ/GameOfShooting)
- 项目使用方法：
  - `npm install`  安装依赖
  - `npm run start`  运行项目
  - `npm run build`  打包项目
- [项目预览](https://southbeanz.github.io/GameOfShooting/dist/index.html) 
- 实现功能
  - 基本游戏流程：开始->游戏进行中->成功或者失败
  - 使用方向键← 和 → 操作飞机，使用空格（space）进行射击
  - 飞机、怪兽、子弹活动范围的限制
  - 子弹命中怪兽的爆炸效果
  - 消灭的怪兽数量记录
  - 多关卡挑战
  - 可以通过src/js目录下的config.js修改游戏配置，包括关卡数量、怪兽初始运动方向、飞机大小等等。


## 部分项目结构说明

- **dist**: 打包输出目录
  - **index.html**: 打包游戏界面
  - **bundle.js**: 打包页面逻辑 js
  - **img**: 打包图片素材
- **src**: 源码
  - **img**: 存放游戏的图片素材
  - **style**: 页面样式
  - **js**: 页面涉及的 js 代码
    - **config.js**: 游戏配置 js
  - **index.js**: 页面逻辑入口 js
  - **index.html**: 游戏界面
- **readme.md**: 项目说明文档


## 实现过程的一些思考

- 如何提高Canvas性能

  一开始我在实现页面子弹、怪兽、飞机等元素时，在各自内部使用clearRect清除自身所占空间，这就导致了clearRect方法的多次调用。所以，后来将清除画面的处理统一放在Game的方法中进行处理，同时考虑飞机的变化受玩家是否操作，可能不变，添加了飞机是否运动的判断，进行不同大小的页面清除。

  ```javascript
  if (+self.plane.vx !== 0) { //vx为飞机的水平速度
    self.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    self.plane.move()
  } else {
    self.ctx.clearRect(0, 0, CANVAS_WIDTH, self.enemiesMaxY)
  }
  ```

  ​
- 如何处理子弹与怪兽的碰撞和死亡

  游戏中，子弹与怪兽碰撞时，怪兽被消灭。这里首先需要判断是否存在碰撞，我的处理方法是两层遍历子弹和怪兽数组，当怪兽与子弹的空间位置发生重叠时，即发生了碰撞。其中，子弹的遍历一开始是使用forEach循环，并将命中的子弹使用splice方法从数组中移除；怪兽使用every循环，发生碰撞后就通过return false结束，同时标记die属性为true，因为还有3帧的死亡过程，这里不马上移除（何时移除死亡怪兽在下一个问题中说明）。从列表中移除命中的子弹和死亡的怪兽，可以减少之后遍历时间。

  但在这里，在forEach中使用splice方法移除子弹是存在问题的。循环中移除数组元素会造成后续的遍历并不完成。举例如下：

  ```javascript
  var a = [1,2,3,4,5]
  a.forEach((_ele, _i) => {
    console.log(_i + ': ' + _ele + ': ' + a);
    a.splice(_i, 1)
  })
  // 输出：
  // 0: 1: 1,2,3,4,5
  // 1: 3: 2,3,4,5
  // 2: 5: 2,4,5
  ```

  所以，这里的处理比较好的方法是先获取子弹数组的length属性，通过while从后往前进行循环，这样就可以避免影响之后的循环。

  ```javascript
  while (bulletNum--) {
    let _ele = bullets[bulletNum]
    if (_ele.die) { //处理飞出边界的子弹
      bullets.splice(bulletNum, 1)
      continue
    }
    let _eleDx = _ele.dx,
        _eleDy = _ele.dy,
        _eleW = _ele.w,
        _eleH = _ele.h
    monsters.every((_tar, _i) => {
      if (_tar.die || _tar.dead) { //跳过尚未移除的死亡怪兽
        return true
      }
      let _tarDx = _tar.dx,
          _tarDy = _tar.dy,
          _tarW = _tar.w,
          _tarH = _tar.h
      if (_eleDy > _tarDy + _tarH || _eleDy + _eleH < _tarDy || _eleDx + _eleW < _tarDx || _eleDx > _tarDx + _tarW) {
        return true
      } else { //发生了碰撞
        bullets.splice(bulletNum, 1)
        _tar.die = true
        self.score++
        self.scoreContainer.innerHTML = self.score
        return false
      }
    })
  }
  ```


- 如何处理怪兽是否到达边界

  当怪兽到达活动边界时，需要下移一段高度运动。那么，可以通过记录怪兽队伍最左上角的坐标，和队伍的长度，来判断怪兽队伍是否超出活动范围进行处理。这里要注意的点时，当位于中间的怪兽被消灭，队伍的长度并没有改变；当边缘的怪兽被消灭的时候，队伍的长度可能不止减少了一个怪兽宽度。

  但这种处理方法，在怪兽只有单行时还比较好处理，在多行的时候，难以处理队伍的高度问题（判断怪兽是否运动到了底部）。所以，后来在遍历怪兽队伍，更新怪兽位置时，同时进行整个怪兽队伍的四个边界坐标的更新，在这个过程中也移除了dead属性为true的怪兽（完成死亡过程后标记dead属性为true）。

  ```javascript
  /**
   * 更新怪兽队伍，该方法写在 MonsterGroup 方法中
   */
  updateMonsters () {
    let _minX = CANVAS_WIDTH,
        _minY = CANVAS_HEIGHT,
        _maxX = 0,
        _maxY = 0,
        len = this.monsterList.length
    while (len--) {
      let _ele = this.monsterList[len]
      if (_ele.dead) { //移除完成死亡过程的怪兽
        this.monsterList.splice(len, 1)
        continue
      }
      _ele.dx += this.vx
      _ele.dy += this.vy
      _ele.move()
      if (_ele.dx < _minX) { //更新边界信息
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
  ```

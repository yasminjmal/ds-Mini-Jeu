import { CONFIG } from './config.js';
import { randomY } from './utils.js';

export class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 40;
    this.speed = CONFIG.enemySpeed;
  }

  move() {
    this.x -= this.speed;
  }

  static spawn(enemies, canvasWidth, canvasHeight) {
    const y = randomY(50, canvasHeight - 100);
    enemies.push(new Enemy(canvasWidth - 60, y));
  }
}

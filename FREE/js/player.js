import { CONFIG } from './config.js';
import { createBullet } from './bullet.js';

export class Player {
  constructor(x, y, mode) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 50;
    this.mode = mode; // 'arrows' ou 'keyboard'
  }

  move(keys) {
    if (this.mode === 'keyboard') {
      if (keys['z']) this.y -= CONFIG.playerSpeed;
      if (keys['s']) this.y += CONFIG.playerSpeed;
    } else {
      if (keys['ArrowUp']) this.y -= CONFIG.playerSpeed;
      if (keys['ArrowDown']) this.y += CONFIG.playerSpeed;
    }
  }

  shoot(bullets) {
    bullets.push(createBullet(this.x + 40, this.y + 20));
  }
}

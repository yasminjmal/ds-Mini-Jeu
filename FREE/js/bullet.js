import { CONFIG } from './config.js';

export function createBullet(x, y) {
  return { x, y, width: 10, height: 5, speed: CONFIG.bulletSpeed };
}

export function moveBullets(bullets) {
  bullets.forEach(b => b.x += b.speed);
}

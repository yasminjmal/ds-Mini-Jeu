import { moveBullets } from './bullet.js';
import { Enemy } from './enemy.js';
import { checkCollision } from './utils.js';
import { updateScore, updateTimer } from './ui.js';

export function gameLoop(state, ctx) {
  const { player, bullets, enemies, CONFIG } = state;

  // 1. Mouvements
  player.move(state.keys);
  moveBullets(bullets);
  enemies.forEach(e => e.move());

  // 2. Collisions
  bullets.forEach((b, bi) => {
    enemies.forEach((e, ei) => {
      if (checkCollision(b, e)) {
        enemies.splice(ei, 1);
        bullets.splice(bi, 1);
        state.score++;
        updateScore(state.score);
      }
    });
  });

  // 3. Game over
  enemies.forEach(e => {
    if (checkCollision(player, e)) {
      window.location.href = '../restart/restart.html';
    }
  });

  // 4. Dessin
  ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);

  // dessin du joueur, ennemis, balles (images à intégrer)
}

import { CONFIG } from './config.js';
import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { gameLoop } from './gameLoop.js';
import { showMessage } from './ui.js';

const canvas = document.getElementById('gameArea');
const ctx = canvas.getContext('2d');    

let player, enemies = [], bullets = [];
let score = 0, keys = {};
let mode = localStorage.getItem('modeDeJeu'); // "keyboard" ou "arrows"

player = new Player(50, canvas.height / 2, mode);
for (let i = 0; i < CONFIG.maxEnemiesStart; i++) {
  Enemy.spawn(enemies, canvas.width, canvas.height);
}

showMessage("La bataille est commencée !!! Good luck !");
setTimeout(() => startGame(), 4000);

function startGame() {
  setInterval(() => gameLoop({ player, enemies, bullets, score, keys, canvas, ctx, CONFIG }, ctx), 30);
}

document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);
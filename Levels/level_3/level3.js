const playArea = document.getElementById("playArea");
const player = document.getElementById("player");
const countdown = document.getElementById("countdown");
const timerDisplay = document.getElementById("timerDisplay");

const soundWin = document.getElementById("soundWin");
const soundLose = document.getElementById("soundLose");
const soundDeath = document.getElementById("soundDeath");
const backgroundMusic = document.getElementById("backgroundMusic");

let timeLeft = 40;
let timerInterval;
let gameStarted = false;
let gameOver = false;
let enemies = [];
let totalEnemies = 10;
let killedEnemies = 0;

// ----- Mouvement fluide du player -----
const keysPressed = {};
const playerSpeed = 7; // vitesse du joueur

window.addEventListener("keydown", (e) => {
  keysPressed[e.key] = true;

  if (e.code === "Space" && gameStarted) shoot();
});

window.addEventListener("keyup", (e) => {
  keysPressed[e.key] = false;
});

function movePlayer() {
  if (!gameStarted || gameOver) return;

  const rect = player.getBoundingClientRect();
  const area = playArea.getBoundingClientRect();

  if (keysPressed["ArrowLeft"] && rect.left > area.left) player.style.left = player.offsetLeft - playerSpeed + "px";
  if (keysPressed["ArrowRight"] && rect.right < area.right) player.style.left = player.offsetLeft + playerSpeed + "px";
  if (keysPressed["ArrowUp"] && rect.top > area.top) player.style.top = player.offsetTop - playerSpeed + "px";
  if (keysPressed["ArrowDown"] && rect.bottom < area.bottom) player.style.top = player.offsetTop + playerSpeed + "px";

  requestAnimationFrame(movePlayer);
}

// ----- Countdown 3,2,1,GO -----
function startCountdown() {
  let count = 3;
  countdown.innerText = count;
  const interval = setInterval(() => {
    count--;
    if (count > 0) countdown.innerText = count;
    else if (count === 0) countdown.innerText = "GO!";
    else {
      clearInterval(interval);
      countdown.style.display = "none";
      startGame();
    }
  }, 1000);
}

// ----- Démarrer le jeu -----
function startGame() {
  gameStarted = true;
  backgroundMusic.play();
  timerInterval = setInterval(updateTimer, 1000);
  spawnEnemies();
  movePlayer(); // boucle mouvement fluide
}

// ----- Timer -----
function updateTimer() {
  if (!gameStarted) return;
  timeLeft--;
  timerDisplay.textContent = timeLeft;
  if (timeLeft <= 0 && !gameOver) checkWinOrLose();
}

// ----- Créer ennemis -----
function spawnEnemies() {
  for (let i = 0; i < totalEnemies; i++) {
    const enemy = document.createElement("img");
    enemy.src = i < 6 ? "levels_images/enemy_normal.png" : "levels_images/enemy_grave.png";
    if (i >= 6) enemy.classList.add("grave");
    enemy.classList.add("enemy");
    enemy.style.top = Math.random() * 400 + "px";
    enemy.style.left = Math.random() * 740 + "px";
    playArea.appendChild(enemy);
    enemies.push(enemy);
    moveEnemy(enemy);
  }
}

// ----- Mouvement ennemi -----
function moveEnemy(enemy) {
  const speed = enemy.classList.contains("grave") ? 10 : 7;
  let dx = Math.random() < 0.5 ? -1 : 1;
  let dy = Math.random() < 0.5 ? -1 : 1;

  function step() {
    if (gameOver) return;
    const rect = enemy.getBoundingClientRect();
    const area = playArea.getBoundingClientRect();

    if (rect.left <= area.left || rect.right >= area.right) dx *= -1;
    if (rect.top <= area.top || rect.bottom >= area.bottom) dy *= -1;

    enemy.style.left = enemy.offsetLeft + dx * speed + "px";
    enemy.style.top = enemy.offsetTop + dy * speed + "px";

    checkCollision(enemy);
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ----- Collision joueur / ennemis -----
function checkCollision(enemy) {
  const pRect = player.getBoundingClientRect();
  const eRect = enemy.getBoundingClientRect();
  if (!(pRect.right < eRect.left || pRect.left > eRect.right || pRect.bottom < eRect.top || pRect.top > eRect.bottom)) {
    if (enemy.classList.contains("grave")) {
      endGame(false, true);
    }
  }
}

// ----- Tirer -----
const fireSpeed = 10;
function shoot() {
  const fire = document.createElement("img");
  fire.src = "levels_images/oeuf.png";
  fire.classList.add("fire");
  fire.style.position = "absolute";
  fire.style.width = "30px";
  fire.style.left = player.offsetLeft + player.offsetWidth / 2 - 15 + "px";
  fire.style.top = player.offsetTop - 30 + "px";
  playArea.appendChild(fire);

  function moveFire() {
    if (!gameStarted || gameOver) {
      if (fire.parentNode) fire.parentNode.removeChild(fire);
      return;
    }

    fire.style.top = fire.offsetTop - fireSpeed + "px";

    enemies.forEach((enemy) => {
      const pRect = fire.getBoundingClientRect();
      const eRect = enemy.getBoundingClientRect();
      if (!(pRect.right < eRect.left || pRect.left > eRect.right || pRect.bottom < eRect.top || pRect.top > eRect.bottom)) {
        if (enemy.parentNode) playArea.removeChild(enemy);
        enemies = enemies.filter(e => e !== enemy);
        killedEnemies++;
        if (fire.parentNode) playArea.removeChild(fire);
        if (killedEnemies === totalEnemies) endGame(true);
      }
    });

    if (fire.offsetTop < 0 && fire.parentNode) fire.parentNode.removeChild(fire);
    else requestAnimationFrame(moveFire);
  }

  requestAnimationFrame(moveFire);
}

// ----- Fin du jeu -----
function endGame(win, killed = false){
    gameOver = true;
    gameStarted = false;
    backgroundMusic.pause();
    clearInterval(timerInterval);

    // --- Calcul des étoiles ---
    const stars = win ? calculateStars() : 0;

    // --- Stockage pour restart.html ---
    localStorage.setItem("level_isWin", win ? 1 : 0);
    localStorage.setItem("level_starsAchieved", stars);
    localStorage.setItem("level_finalTime", timeLeft);
    localStorage.setItem("level_finalScore", killedEnemies);
    localStorage.setItem("level_currentLevel", 3);

    // --- MISE À JOUR DES NIVEAUX (pour levels_mode.js) ---
    const STORAGE_KEY_MAX_LEVEL = 'levels_maxReached';
    const STORAGE_KEY_LEVEL_DATA = 'levels_data';

    // Récupérer les données existantes
    let maxLevelReached = parseInt(localStorage.getItem(STORAGE_KEY_MAX_LEVEL) || '1', 10);
    let levelData = JSON.parse(localStorage.getItem(STORAGE_KEY_LEVEL_DATA) || '{}');

    // Enregistrer les étoiles du niveau actuel
    levelData[3] = stars;
    localStorage.setItem(STORAGE_KEY_LEVEL_DATA, JSON.stringify(levelData));

    // Déverrouiller le niveau suivant si gagné
    if(win && 4 > maxLevelReached){ // ici 4 = prochain niveau
        maxLevelReached = 4;
        localStorage.setItem(STORAGE_KEY_MAX_LEVEL, maxLevelReached);
    }

    // --- Jouer les sons ---
    if(win) soundWin.play();
    else if(killed) soundDeath.play();
    else soundLose.play();

    // --- Redirection vers la page restart ---
    setTimeout(()=>window.location.href="restart.html",1500);
}

// ----- Vérification victoire/défaite -----
function checkWinOrLose() {
  if (killedEnemies === totalEnemies) endGame(true);
  else endGame(false);
}

// ----- Calcul étoiles -----
function calculateStars() {
  if (timeLeft > 20) return 3;
  else if (timeLeft > 10) return 2;
  return 1;
}

// ----- Lancer le countdown -----
window.onload = startCountdown;


    (() => {
    // --- configuration & éléments DOM ---
    const btnArrow = document.getElementById('btnArrow');
    const btnZs = document.getElementById('btnZs');
    const btnStart = document.getElementById('btnStart');
    const highScoreEl = document.getElementById('highScore');
    const scoreEl = document.getElementById('score');
    const timeEl = document.getElementById('time');
    const playArea = document.getElementById('playArea');

    const PLAY_W = () => playArea.clientWidth;
    const PLAY_H = () => playArea.clientHeight;

    // images paths (adapte si nécessaire)
    const IMG_PLAYER = '../images/player.png';
    const IMG_ENEMY = '../images/enemy.png';
    const IMG_FLAME = '../images/flame.png';
    

    
    // game state
    let controlMode = null; // 'arrow' or 'zs'
    let gameRunning = false;
    let score = 0;
    let startTimestamp = 0;
    let elapsedMs = 0;
    let highScore = parseInt(localStorage.getItem('free_highscore') || '0', 10);

    highScoreEl.textContent = highScore;

    // entities
    const enemies = [];
    const flames = [];
    let player = null;

    // spawn / difficulty control
    let spawnIntervalId = null;
    let spawnIntervalMs = 2000; // spawn every 2s (for intervals rules)
    let spawnPerTick = 1; // number of enemies to spawn each interval (changes over time)
    let gameSeconds = 0;
    let colorChangeIntervalId = null;

    // DOM helper
    function createEntity(className, imgSrc, w, h) {
        const el = document.createElement('img');
        el.src = imgSrc;
        el.className = `entity ${className}`;
        el.style.width = (w || 50) + 'px';
        el.style.height = (h || 50) + 'px';
        playArea.appendChild(el);
        return el;
    }

    // --- player creation ---
    function spawnPlayer() {
        const el = createEntity('player', IMG_PLAYER, 80, 80);
        // position player on left, vertically centered under separator (i.e. inside playArea)
        const px = 10;
        const py = (PLAY_H() / 2) - 40;
        el.style.left = px + 'px';
        el.style.top = py + 'px';
        player = {
        el,
        x: px,
        y: py,
        w: el.clientWidth,
        h: el.clientHeight,
        speed: 6 // vertical speed
        };
    }

    // --- enemy spawn ---
    function spawnEnemy(speedMultiplier = 1) {
        // spawn at right edge with random y
        const w = 60, h = 60;
        const el = createEntity('enemy', IMG_ENEMY, w, h);
        const x = PLAY_W() - w - 8;
        const y = Math.max(8, Math.random() * (PLAY_H() - h - 8));
        el.style.left = x + 'px';
        el.style.top = y + 'px';

        // velocity: move leftwards with some vertical random motion
        const baseSpeed = 1.6; // base horizontal speed
        const vx = -(baseSpeed + Math.random() * 1.2) * speedMultiplier; // negative = left
        const vy = (Math.random() - 0.5) * 1.2; // small vertical bobbing

        enemies.push({
        el, x, y, w, h, vx, vy, speedMultiplier
        });
    }
    // --- spawn constant des ennemis ---
    // function startEnemySpawning() {
    // // spawn 2 ennemis par seconde
    // setInterval(() => {
    //     spawnEnemyRandom();
    //     spawnEnemyRandom();
    // }, 1000);
    // }

    // --- fonction pour créer un ennemi aléatoire dans zones contrôlées ---
function spawnEnemyRandom() {
  const w = 60, h = 60;
  const el = createEntity('enemy', IMG_ENEMY, w, h);

  // Zones : haut-droite ou bas-droite
  const zone = Math.random() < 0.5 ? 'top' : 'bottom';
  const x = PLAY_W() - w - 8; // toujours à droite
  let y;
  if (zone === 'top') {
    y = 8 + Math.random() * (PLAY_H()/2 - h - 8); // haut
  } else {
    y = PLAY_H()/2 + Math.random() * (PLAY_H()/2 - h - 8); // bas
  }

  el.style.left = x + 'px';
  el.style.top = y + 'px';

  // vitesse modérée, direction aléatoire
  const speed = 0.5 + Math.random() * 1.2;
  const angle = Math.random() * 2 * Math.PI;
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;

  enemies.push({ el, x, y, w, h, vx, vy });
}


    // spawn initial enemies (6)
    function spawnInitialEnemies() {
        for (let i=0;i<6;i++) spawnEnemy(1);
    }

    // --- flames (projectiles) ---
    function fireFlame() {
    if (!player) return;
    const fireSound = document.getElementById('soundFire');
    if (fireSound) fireSound.play();

    const w = 30, h = 12;
    const el = createEntity('flame', IMG_FLAME, w, h);
    const x = player.x + player.w + 6;
    const y = player.y + (player.h / 2) - (h / 2);
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    const vx = 8;
    flames.push({ el, x, y, w, h, vx });
    }


    // --- collisions simple AABB ---
    function aabb(a, b) {
        return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
    }


        // --- explosion effect ---
    // --- explosion visuelle améliorée ---
        function createExplosion(x, y, color = 'orange') {
        const explosion = document.createElement("div");
        explosion.classList.add("explosion");
        explosion.style.left = `${x}px`;
        explosion.style.top = `${y}px`;
        explosion.style.borderColor = color;
        playArea.appendChild(explosion);

        // animation : rapide et vive
        explosion.animate([
            { transform: "scale(0.3)", opacity: 1 },
            { transform: "scale(1.5)", opacity: 0.8 },
            { transform: "scale(2.2)", opacity: 0 }
        ], {
            duration: 600,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)"
        });

        setTimeout(() => explosion.remove(), 600);
        }


    // --- game over ---
    function gameOver() {
    gameRunning = false;
    clearInterval(spawnIntervalId);
    clearInterval(colorChangeIntervalId);

    // explosion rouge du joueur
    const x = player.x + player.w / 2;
    const y = player.y + player.h / 2;
    createExplosion(x, y, 'red');
    document.getElementById('soundDeath')?.play();

    // supprimer ennemis et tirs après 500 ms
    setTimeout(() => {
        enemies.forEach(e => e.el.remove());
        flames.forEach(f => f.el.remove());
    }, 500);

    // image "GAME OVER"
    const gameOverImg = document.createElement('img');
    gameOverImg.src = '../images/gameover.png'; // chemin vers ton image
    gameOverImg.className = 'game-over-img';
    playArea.appendChild(gameOverImg);

    // son Game Over
    setTimeout(() => {
        const audio = new Audio('../sounds/gameover.mp3');
        audio.play();
    }, 400);

    // animation de l'image (apparition et zoom)
    gameOverImg.animate([
        { transform: 'translate(-50%, -50%) scale(0.3)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scale(1.2)', opacity: 1 },
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.9 }
    ], {
        duration: 2500,
        easing: 'ease-out'
    });
    let currentMaxScore = parseInt(localStorage.getItem('free_highscore') || '0', 10);

let isNewHigh = '0'; // Par défaut, non

// sauvegarde des scores de la partie actuelle
localStorage.setItem('free_lastScore', String(score));
localStorage.setItem('free_lastTime', String(Math.floor(elapsedMs / 1000)));

// Vérifie si c'est un nouveau record par rapport au score MAXIMUM actuel
if (score > currentMaxScore) {
    highScore = score; // Met à jour la variable globale/locale pour affichage
    currentMaxScore = score; // Met à jour le score à sauvegarder
    isNewHigh = '5'; // Met à jour l'indicateur
}

// 1. Sauvegarde l'indicateur (la seule et unique écriture)
localStorage.setItem('free_isNewHigh', isNewHigh);

// 2. Sauvegarde le high score (la nouvelle valeur, ou l'ancienne)
localStorage.setItem('free_highscore', String(currentMaxScore));

// redirection après 3 secondes
setTimeout(() => {
    window.location.href = './restart.html';
}, 3000);


    }



    // --- helper to update UI ---
    function updateUI() {
        scoreEl.textContent = String(score);
        // time formatting mm:ss
        const totalSec = Math.floor(elapsedMs / 1000);
        const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
        const ss = String(totalSec % 60).padStart(2, '0');
        timeEl.textContent = `${mm}:${ss}`;
    }

    // --- main game loop ---
    let rafId = null;
    function loop() {
        if (!gameRunning) return;

        // update time
        elapsedMs = performance.now() - startTimestamp;
        updateUI();

        // update player element position
        if (player) {
        player.el.style.left = player.x + 'px';
        player.el.style.top = player.y + 'px';
        }

        // update flames
        for (let i = flames.length - 1; i >= 0; i--) {
        const f = flames[i];
        f.x += f.vx;
        if (f.x > PLAY_W() + 50) {
            // remove
            f.el.remove();
            flames.splice(i,1);
            continue;
        }
        f.el.style.left = f.x + 'px';
        f.el.style.top = f.y + 'px';
        }




        // --- collision flames → enemies ---
for (let i = flames.length - 1; i >= 0; i--) {
  const f = flames[i];
  let hit = false;

  for (let j = enemies.length - 1; j >= 0; j--) {
    const e = enemies[j];
            if (aabb(f, e)) {
            // explosion + son
            const x = e.x + e.w / 2;
            const y = e.y + e.h / 2;
            createExplosion(x, y);
            document.getElementById('soundEnemyDeath')?.play();

            // --- INCREMENTER SCORE ---
            score += 5; // ou n'importe quelle valeur par ennemi
            if (score > highScore) {
                highScore = score;
                highScoreEl.textContent = highScore;
            }
            updateUI();

            // supprimer ennemi et flame
            e.el.remove();
            enemies.splice(j, 1);

            f.el.remove();
            flames.splice(i, 1);

            hit = true;
            break; // flame détruite → sortir
            }

  }

  if (!hit) {
    // mise à jour DOM si flame n'a pas touché
    f.el.style.left = f.x + 'px';
    f.el.style.top = f.y + 'px';
  }
}


        // --- update enemies
for (let i = enemies.length - 1; i >= 0; i--) {
  const e = enemies[i];

  // déplacement
  e.x += e.vx;
  e.y += e.vy;

  // rebond sur les bords
  if (e.x < 0) { e.x = 0; e.vx *= -1; }
  if (e.x + e.w > PLAY_W()) { e.x = PLAY_W() - e.w; e.vx *= -1; }
  if (e.y < 0) { e.y = 0; e.vy *= -1; }
  if (e.y + e.h > PLAY_H()) { e.y = PLAY_H() - e.h; e.vy *= -1; }

  // collision avec joueur → GAME OVER
  if (player && aabb(e, player)) {
    gameOver();
    return; // arrêter le loop immédiatement
  }

  // update DOM
  e.el.style.left = e.x + 'px';
  e.el.style.top = e.y + 'px';
}

       

        rafId = requestAnimationFrame(loop);
    }

    // --- spawn interval logic and difficulty evolution ---
    let difficultyStart = null;
    function startSpawning() {
        // initial enemies
        spawnInitialEnemies();

        difficultyStart = performance.now();
        spawnPerTick = 1; // after initial, for first minute we will spawn 1 or 2 depending on half

        // spawn every spawnIntervalMs but spawnPerTick enemies each time
        spawnIntervalId = setInterval(() => {
  const elapsed = Math.floor((performance.now() - difficultyStart) / 1000);

  // --- Spawn progressif selon temps ---
  if (elapsed < 15) {
    spawnPerTick = 1; // 1 ennemi toutes les 2s
  } else if (elapsed < 30) {
    spawnPerTick = 1 + Math.floor(Math.random() * 2); // 1 ou 2
  } else {
    spawnPerTick = 2 + Math.floor(Math.random() * 2); // 2 ou 3
  }

  // spawn ennemis
  for (let i = 0; i < spawnPerTick; i++) spawnEnemyRandom();

}, 1000); // tick chaque seconde


        // change border color every 30s to simulate "bataille" ambiance
        colorChangeIntervalId = setInterval(() => {
        const colors = [
            'rgba(230,140,166,0.35)',
            'rgba(179,136,210,0.35)',
            'rgba(255,183,197,0.35)',
            'rgba(255,204,128,0.35)'
        ];
        const idx = Math.floor(((performance.now() - difficultyStart) / 30000)) % colors.length;
        playArea.style.borderColor = colors[idx];
        }, 30000);

        // also set initial color immediately
        playArea.style.borderColor = 'rgba(230,140,166,0.35)';
    }

    
    // --- start sequence: image 2s -> start game ---
    function showStartMessageAndBegin() {
    // Créer un élément image
    const startImage = document.createElement('img');
    startImage.src = '../images/start_battle.png'; // ← chemin de ton image
    startImage.className = 'start-image';
    startImage.style.position = 'absolute';
    startImage.style.left = '50%';
    startImage.style.top = '50%';
    startImage.style.transform = 'translate(-50%, -50%) scale(0.7)';
    startImage.style.width = '320px';
    startImage.style.height = 'auto';
    startImage.style.zIndex = '9999';
    startImage.style.opacity = '0';
    playArea.appendChild(startImage);

    // --- son de départ ---
    const startSound = new Audio('../sounds/start_sound.mp3'); // ← ton fichier audio
    startSound.volume = 0.7;
    startSound.play();

    // --- animation de zoom doux ---
    startImage.animate([
        { transform: 'translate(-50%, -50%) scale(0.6)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scale(1.1)', opacity: 1 },
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }
    ], {
        duration: 1200,
        easing: 'ease-out'
    });

    // Après 2 secondes → retirer image + démarrer le jeu
    setTimeout(() => {
        startImage.remove();
        beginGameLoop();
    }, 2000);
    }

    function beginGameLoop() {
         // reload highscore depuis localStorage
        highScore = parseInt(localStorage.getItem('free_highscore') || '0', 10);
        highScoreEl.textContent = highScore;
        // prepare game variables
        gameRunning = true;
        startTimestamp = performance.now();
        elapsedMs = 0;
        score = 0;
        enemies.length = 0;
        flames.length = 0;

        // clear previous entities in DOM (if any)
        Array.from(playArea.querySelectorAll('.entity')).forEach(el => el.remove());

        spawnPlayer();
        // startEnemySpawning(); 
        startSpawning();

        // keyboard handlers
        setupKeyboard();

        // start RAF loop
        rafId = requestAnimationFrame(loop);
    }

    // --- keyboard handling ---
    const activeKeys = { up:false, down:false, fire:false };
    function setupKeyboard() {
        function onKeyDown(e) {
        if (!gameRunning) return;
        if (controlMode === 'arrow') {
            if (e.code === 'ArrowUp') activeKeys.up = true;
            if (e.code === 'ArrowDown') activeKeys.down = true;
        } else if (controlMode === 'zs') {
            if (e.key === 'z' || e.key === 'Z') activeKeys.up = true;
            if (e.key === 's' || e.key === 'S') activeKeys.down = true;
        }
        if (e.code === 'Space') {
            e.preventDefault();
            fireFlame();
        }
        }
        function onKeyUp(e) {
        if (controlMode === 'arrow') {
            if (e.code === 'ArrowUp') activeKeys.up = false;
            if (e.code === 'ArrowDown') activeKeys.down = false;
        } else if (controlMode === 'zs') {
            if (e.key === 'z' || e.key === 'Z') activeKeys.up = false;
            if (e.key === 's' || e.key === 'S') activeKeys.down = false;
        }
        }
        // remove previous handlers if any
        window.onkeydown = onKeyDown;
        window.onkeyup = onKeyUp;

        // small loop to move player based on activeKeys (separate from RAF)
        const moveTick = () => {
        if (!gameRunning || !player) return;
        if (activeKeys.up) player.y -= player.speed;
        if (activeKeys.down) player.y += player.speed;
        // clamp inside play area vertical bounds
        if (player.y < 4) player.y = 4;
        if (player.y + player.h > PLAY_H() - 4) player.y = PLAY_H() - player.h - 4;
        setTimeout(moveTick, 16); // ~60fps
        };
        moveTick();
    }

    // --- UI handlers for mode selection & start ---
    btnArrow.addEventListener('click', () => {
        controlMode = 'arrow';
        btnArrow.classList.add('active');
        btnZs.classList.remove('active');
        btnStart.disabled = false;
    });

    btnZs.addEventListener('click', () => {
        controlMode = 'zs';
        btnZs.classList.add('active');
        btnArrow.classList.remove('active');
        btnStart.disabled = false;
    });

    btnStart.addEventListener('click', () => {
        if (!controlMode) return;
        // disable controls while game running
        btnStart.disabled = true;
        btnArrow.disabled = true;
        btnZs.disabled = true;

        // show start message then begin
        showStartMessageAndBegin();
    });

    // update highscore display on focus (in case came back)
    window.addEventListener('focus', () => {
        highScore = parseInt(localStorage.getItem('free_highscore') || '0', 10);
        highScoreEl.textContent = highScore;
    });

    // small safety: resize -> clamp player position
    window.addEventListener('resize', () => {
        if (player) {
        if (player.y + player.h > PLAY_H() - 4) player.y = PLAY_H() - player.h - 4;
        player.el.style.top = player.y + 'px';
        }
    });

    // expose for debug (optional)
    window.__freeGame = {
        enemies, flames, getScore: () => score
    };


    // retour au menu mode de jeu
    document.getElementById("btnRetour").addEventListener("click", () => {
            window.location.href = "../mode de jeu/mode_jeu.html";
        });

    })();

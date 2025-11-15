// level1.js

document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ET ÉLÉMENTS DOM ---
    const PLAY_AREA = document.getElementById('playArea');
    const GAME_CONTAINER = document.getElementById('gameContainer');
    const PRE_GAME_TIMER = document.getElementById('preGameTimer');
    const TIMER_DISPLAY = document.getElementById('timerDisplay');
    const COURAGE_DUCK = document.getElementById('courageDuck');
    const TIME_BAR = document.getElementById('timeBar');
    const TIME_DISPLAY = document.getElementById('timeDisplay');
    const DUCK_INDICATOR = document.getElementById('duckIndicator');
    const TIME_PASSED = document.getElementById('timePassed');
    const LEVEL_STARS = [
        document.getElementById('levelStar1'),
        document.getElementById('levelStar2'),
        document.getElementById('levelStar3')
    ];

    // Images / Sons
    const IMG_PLAYER = 'images/canard.png';
    const IMG_ENEMY = 'images/enemy.png';
    const IMG_FLAME = 'images/oeuf.png';
    const STAR_FULL = '../levels_images/star_full.png'; 
    const STAR_EMPTY = '../levels_images/star_empty.png'; 
    
    const SOUNDS = {
        '1': document.getElementById('sound1'),
        '2': document.getElementById('sound2'),
        '3': document.getElementById('sound3'),
        'GO': document.getElementById('soundGo'),
        'fire': document.getElementById('soundFire'),
        'hit': document.getElementById('soundEnemyDeath'),
        'death': document.getElementById('soundDeath')
    };

    // --- VARIABLES DE JEU ---
    const GAME_DURATION_MS = 30000; // Changement : 30 secondes
    const MAX_TIME_SECONDS = 30;    // Changement : 30 secondes
    const TARGET_ENEMIES = 10;
    const ENEMY_SPEED = 1; // Vitesse des ennemis ajustée pour le mouvement aléatoire
    
    let gameRunning = false;
    let enemiesKilled = 0;
    let startTime = 0;
    let elapsedTime = 0;
    let player = null;
    let enemies = [];
    let flames = [];
    let gameLoopId = null;
    let starsAwarded = 0; // Utilisation de cette variable pour stocker le score étoile actuel

    // Conditions d'étoiles (en secondes)
    const STAR_CONDITIONS = {
        3: 7,  // 3 étoiles si temps passé < 7 secondes
        2: 15, // 2 étoiles si temps passé < 15 secondes
        1: 20  // 1 étoile si temps passé < 20 secondes
    };

    // --- LOGIQUE D'ENTITÉS (Simplifiée) ---

    // Création d'une entité (Player, Enemy, Flame)
    function createEntity(type, x, y, w, h, speed) {
        const el = document.createElement('img');
        el.className = `${type}-entity`;
        el.src = type === 'player' ? IMG_PLAYER : (type === 'enemy' ? IMG_ENEMY : IMG_FLAME);
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
        el.style.position = 'absolute';
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        PLAY_AREA.appendChild(el);
        
        // Ajout de dx et dy pour le mouvement aléatoire des ennemis
        const entity = { el, x, y, w, h, speed, remove: () => el.remove() };

        if (type === 'enemy') {
            entity.dx = 0;
            entity.dy = 0;
        }
        
        return entity;
    }

    // Initialisation du joueur (canard)
    function initPlayer() {
        const h = PLAY_AREA.clientHeight;
        player = createEntity('player', 20, h / 2 - 25, 50, 50, 5);
    }

    // Génération des ennemis (tous au début)
    function spawnEnemies() {
        const w = PLAY_AREA.clientWidth;
        const h = PLAY_AREA.clientHeight;
        enemies = [];

        // Zone droite : entre 50% et 95% de la largeur du jeu
        const MIN_X_AREA = w * 0.5;
        const MAX_X_AREA = w * 0.95;
        const MARGIN_Y = 50;

        for (let i = 0; i < TARGET_ENEMIES; i++) {
            // Position aléatoire dans la zone droite
            const startX = MIN_X_AREA + Math.random() * (MAX_X_AREA - MIN_X_AREA);
            const startY = MARGIN_Y + Math.random() * (h - 2 * MARGIN_Y - 40);

            const newEnemy = createEntity('enemy', startX, startY, 40, 40, ENEMY_SPEED);
            
            // Initialisation d'une direction aléatoire (pour le premier mouvement)
            newEnemy.dx = (Math.random() - 0.5) * newEnemy.speed * 100;
            newEnemy.dy = (Math.random() - 0.5) * newEnemy.speed * 100;
            
            enemies.push(newEnemy);
        }
    }

    // Création de projectile (œuf)
    function fireFlame() {
        if (!gameRunning) return;
        SOUNDS.fire.currentTime = 0;
        SOUNDS.fire.play().catch(() => {});
        flames.push(createEntity('flame', player.x + player.w, player.y + player.h / 2 - 5, 20, 10, 10));
    }

    // --- NOUVEAU : Mouvement Aléatoire des Ennemis ---
    function updateEnemies(dt) {
        const playW = PLAY_AREA.clientWidth;
        const playH = PLAY_AREA.clientHeight;
        
        // Zone droite limitée
        const MIN_X_BOUNDARY = playW * 0.5;
        const MAX_X_BOUNDARY = playW - 50; // Laisser une marge
        const MARGIN_Y = 50;
        
        enemies.forEach(enemy => {
            // Change de direction occasionnellement (mouvement aléatoire)
            if (Math.random() < 0.005) { // 0.5% de chance de changer de direction à chaque frame
                enemy.dx = (Math.random() - 0.5) * ENEMY_SPEED * 150;
                enemy.dy = (Math.random() - 0.5) * ENEMY_SPEED * 150;
            }

            // Mettre à jour la position (dt est le temps écoulé entre les frames)
            enemy.x += enemy.dx * dt / 1000;
            enemy.y += enemy.dy * dt / 1000;

            // Gestion des collisions avec les limites de la zone droite
            
            // Limites X
            if (enemy.x < MIN_X_BOUNDARY || enemy.x > MAX_X_BOUNDARY - enemy.w) {
                enemy.dx *= -1; // Inverser la direction X
                enemy.x = Math.max(MIN_X_BOUNDARY, Math.min(enemy.x, MAX_X_BOUNDARY - enemy.w)); // Clamper
            }
            
            // Limites Y
            if (enemy.y < MARGIN_Y || enemy.y > playH - enemy.h - MARGIN_Y) {
                enemy.dy *= -1; // Inverser la direction Y
                enemy.y = Math.max(MARGIN_Y, Math.min(enemy.y, playH - enemy.h - MARGIN_Y)); // Clamper
            }

            // Appliquer la nouvelle position
            enemy.el.style.left = enemy.x + 'px';
            enemy.el.style.top = enemy.y + 'px';
        });
    }


    // --- GESTION DU MOUVEMENT ET COLLISION (Boucle de Jeu) ---

    let lastTimestamp = 0;
    function gameLoop(timestamp) {
        if (!gameRunning) return;

        // Calcul du delta time (dt)
        const dt = timestamp - lastTimestamp;
        lastTimestamp = timestamp;

        // 1. Mise à jour du temps et de la barre
        elapsedTime = timestamp - startTime;
        updateTimeBar(elapsedTime);
        
        // 2. Mouvement du joueur (géré par les touches)
        // (handlePlayerMovement est dans un setInterval pour les inputs)

        // 3. Mouvement des ennemis (maintenant aléatoire)
        updateEnemies(dt);

        // 4. Mouvement des flammes (vers la droite)
        flames.forEach(flame => {
            flame.x += flame.speed * dt / 16.66; // Utiliser dt pour un mouvement fluide
            flame.el.style.left = `${flame.x}px`;
        });

        // 5. Détection de collision (Flame vs Enemy)
        // Utilisation de la méthode filter/map pour la suppression sécurisée

        // level1.js (dans la fonction gameLoop)

// 5. Détection de collision (Flame vs Enemy)

flames.forEach((flame, fIndex) => {
    let hit = false;
    
    enemies.forEach((enemy, eIndex) => { // NOTEZ: Ajout de eIndex
        // Si la flamme ou l'ennemi a déjà été marqué pour suppression, on passe au suivant.
        if (flame === null || enemy === null) return; 

        if (
            !hit &&
            flame.x < enemy.x + enemy.w &&
            flame.x + flame.w > enemy.x &&
            flame.y < enemy.y + enemy.h &&
            flame.y + flame.h > enemy.y
        ) {
            // Hit !
            SOUNDS.hit.currentTime = 0;
            SOUNDS.hit.play().catch(() => {});

            // MARQUAGE POUR SUPPRESSION: Retirer l'élément DOM tout de suite.
            enemy.el.remove(); // <--- OK de retirer du DOM ici

            // MARQUAGE POUR SUPPRESSION DU TABLEAU :
            enemies[eIndex] = null; // Marquer l'objet ennemi comme "mort"
            
            // Incrémentation du compteur UNIQUEMENT LORS DE LA DESTRUCTION
            enemiesKilled++; // <--- NE SE DÉCLENCHE QU'UNE FOIS

            hit = true;
            
            // Vérification de victoire
            if (enemiesKilled >= TARGET_ENEMIES) {
                if (gameRunning) { // <-- S'assurer que endGame n'est appelé qu'une fois
                     endGame(true); // VICTOIRE !
         }
                return;
            }
        }
    });
    if (!gameRunning) { // <-- MODIFICATION CLÉ : Si gameRunning est false, on arrête tout.
         return; 
}

    if (hit) {
        flame.el.remove(); 
        flames[fIndex] = null; // Marquer la flamme pour suppression
    }
});

// L'appel à endGame(true) doit être enveloppé dans un if !important
if (enemiesKilled >= TARGET_ENEMIES && gameRunning) {
    endGame(true);
    return;
}

        
        // 6. Suppression des entités hors écran et marquées
        flames = flames.filter(f => f && f.x < PLAY_AREA.clientWidth);
        // Les ennemis sont retirés directement lors de la collision (plus haut)
        enemies = enemies.filter(e => e !== null);

        // 7. Vérification de Time Over
        if (elapsedTime >= GAME_DURATION_MS && gameRunning) {
    endGame(false); // DÉFAITE (Time Over)
    return;
}


        gameLoopId = requestAnimationFrame(gameLoop);
    }
    
    // --- GESTION DE L'AFFICHAGE DU TEMPS ET DES ÉTOILES ---

    function updateTimeBar(ms) {
        const percentage = ms / GAME_DURATION_MS;
        const remainingMs = GAME_DURATION_MS - ms;
        
        // 1. Mise à jour de la barre et de l'indicateur
        TIME_PASSED.style.width = `${percentage * 100}%`;
        DUCK_INDICATOR.style.left = `${percentage * 100}%`;

        // 2. Mise à jour du temps restant
        const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
        const formattedTime = `00:${String(seconds).padStart(2, '0')}`;
        TIME_DISPLAY.textContent = formattedTime;

        // 3. Mise à jour des conditions d'étoiles
        const timePassedSeconds = Math.floor(ms / 1000);
        checkStarConditions(timePassedSeconds);
    }
    
    function checkStarConditions(timePassed) {
        let newStars = 0;
        
        if (timePassed < STAR_CONDITIONS[3]) { // < 7s
            newStars = 3;
        } else if (timePassed < STAR_CONDITIONS[2]) { // < 15s
            newStars = 2;
        } else if (timePassed < STAR_CONDITIONS[1]) { // < 20s
            newStars = 1;
        } else { // >= 20s
            newStars = 0;
        }

        // Mettre à jour l'affichage si le nombre d'étoiles change
        if (newStars !== starsAwarded) {
            starsAwarded = newStars;
            LEVEL_STARS.forEach((star, index) => {
                if (index < starsAwarded) {
                    star.src = STAR_FULL;
                } else {
                    star.src = STAR_EMPTY;
                }
            });
        }
    }

    // --- GESTION DE FIN DE JEU ---

    // level1.js

// --- GESTION DE FIN DE JEU ---

// level1.js

// --- GESTION DE FIN DE JEU (CORRIGÉE) ---

// level1.js

// --- GESTION DE FIN DE JEU (VERSION CORRIGÉE) ---

// level1.js

// --- GESTION DE FIN DE JEU (VERSION CORRIGÉE) ---
function updateLevelProgress(levelCompleted, starsGained) {
    const STORAGE_KEY_MAX_LEVEL = 'levels_maxReached';
    const STORAGE_KEY_LEVEL_DATA = 'levels_data';

    // Charger la progression existante
    let maxLevelReached = parseInt(localStorage.getItem(STORAGE_KEY_MAX_LEVEL) || '1', 10);
    const levelData = JSON.parse(localStorage.getItem(STORAGE_KEY_LEVEL_DATA) || '{}');

    // Sauvegarder les étoiles du niveau
    levelData[levelCompleted] = Math.max(levelData[levelCompleted] || 0, starsGained);
    localStorage.setItem(STORAGE_KEY_LEVEL_DATA, JSON.stringify(levelData));

    // Débloquer le niveau suivant
    if (levelCompleted >= maxLevelReached) {
        maxLevelReached = levelCompleted + 1;
        localStorage.setItem(STORAGE_KEY_MAX_LEVEL, maxLevelReached);
    }
}







function endGame(isWin) {
    if (!gameRunning) return; 
    gameRunning = false;
    cancelAnimationFrame(gameLoopId);
    
    const finalTimeInSeconds = Math.floor(elapsedTime / 1000);
    let finalStars = 0;

    // Attribution des étoiles selon performance
    if (isWin) {
        updateLevelProgress(1, finalStars); // Mettre à jour la progression du niveau 1
        if (finalTimeInSeconds <= 10) finalStars = 3;
        else if (finalTimeInSeconds <= 20) finalStars = 2;
        else finalStars = 1;
    }

    // Sauvegarde des infos du niveau
    localStorage.setItem('level_currentLevel', '1');
    localStorage.setItem('level_isWin', isWin ? '1' : '0');
    localStorage.setItem('level_starsAchieved', finalStars.toString());
    localStorage.setItem('level_finalTime', finalTimeInSeconds.toString());

    // Son de défaite
    if (!isWin) {
        SOUNDS.death.currentTime = 0;
        SOUNDS.death.play().catch(() => {});
    }

    // Redirection vers la page de fin
    setTimeout(() => {
        window.location.href = 'restart.html'; 
    }, isWin ? 1000 : 3000); 
}


    // --- GESTION DES TOUCHES (Mouvement et Tir) ---

    let keys = {};
    window.addEventListener('keydown', (e) => { keys[e.code] = true; });
    window.addEventListener('keyup', (e) => { keys[e.code] = false; });

    function handlePlayerMovement() {
        if (!gameRunning || !player) return;

        const playerSpeed = player.speed;
        const playAreaHeight = PLAY_AREA.clientHeight;
        
        if (keys['ArrowUp'] || keys['KeyZ']) {
            player.y = Math.max(player.y - playerSpeed, 0); 
        }
        if (keys['ArrowDown'] || keys['KeyS']) {
            player.y = Math.min(player.y + playerSpeed, playAreaHeight - player.h); 
        }
        
        player.el.style.top = `${player.y}px`;
        
        // Tir (Espace)
        if (keys['Space']) {
            // Un petit cooldown simple pour éviter le spam de tirs
            if (!player.lastFire || (Date.now() - player.lastFire) > 200) {
                fireFlame();
                player.lastFire = Date.now();
            }
        }
    }
    
    // --- GESTION DU COMPTE À REBOURS PRÉ-JEU (Code conservé) ---

    function startPreGameTimer() {
        let count = 3;
        
        TIMER_DISPLAY.textContent = count;
        COURAGE_DUCK.style.opacity = 1;
        
        TIMER_DISPLAY.style.animation = 'none';
        COURAGE_DUCK.style.animation = 'none';
        void TIMER_DISPLAY.offsetWidth; 
        void COURAGE_DUCK.offsetWidth; 
        
        TIMER_DISPLAY.style.animation = 'timerPulse 1s ease';
        COURAGE_DUCK.style.animation = 'duckPulse 1s ease';
        
        SOUNDS['3'].currentTime = 0;
        SOUNDS['3'].play().catch(() => {});
        
        count--; 
        
        const timerInterval = setInterval(() => {
            if (count >= 1) { 
                
                TIMER_DISPLAY.style.animation = 'none';
                COURAGE_DUCK.style.animation = 'none';
                void TIMER_DISPLAY.offsetWidth; 

                TIMER_DISPLAY.textContent = count;
                
                TIMER_DISPLAY.style.animation = 'timerPulse 1s ease';
                COURAGE_DUCK.style.animation = 'duckPulse 1s ease';
                
                SOUNDS[count.toString()].currentTime = 0;
                SOUNDS[count.toString()].play().catch(() => {});
                
                count--;
            } else {
                clearInterval(timerInterval);
                
                // --- ÉTAPE GO!! ---
                
                TIMER_DISPLAY.style.animation = 'none';
                void TIMER_DISPLAY.offsetWidth; 

                TIMER_DISPLAY.textContent = 'GO!!';
                SOUNDS.GO.currentTime = 0;
                SOUNDS.GO.play().catch(() => {});
                
                TIMER_DISPLAY.style.animation = 'timerPulse 1s ease';
                COURAGE_DUCK.style.animation = 'none'; 
                COURAGE_DUCK.style.opacity = 0; 
                
                setTimeout(() => {
                    PRE_GAME_TIMER.classList.add('hidden');
                    GAME_CONTAINER.classList.remove('hidden');
                    startGame();
                }, 1000); 
            }
        }, 1000); 
    }

    // --- DÉMARRAGE DU JEU ---

    function startGame() {
        gameRunning = true;
        startTime = performance.now();
        lastTimestamp = startTime; // Initialiser lastTimestamp
        initPlayer();
        spawnEnemies();
        gameLoop(startTime);
        
        setInterval(handlePlayerMovement, 1000 / 60); 
    }



    // Lancer le compte à rebours au chargement de la page
    startPreGameTimer();


});
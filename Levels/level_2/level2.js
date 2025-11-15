document.addEventListener('DOMContentLoaded', () => {

    const PLAY_AREA = document.getElementById('playArea');
    const GAME_CONTAINER = document.getElementById('gameContainer');
    const PRE_GAME_TIMER = document.getElementById('preGameTimer');
    const TIMER_DISPLAY = document.getElementById('timerDisplay');
    const COURAGE_DOG = document.getElementById('courageDog');
    const TIME_BAR = document.getElementById('timeBar');
    const TIME_DISPLAY = document.getElementById('timeDisplay');
    const DUCK_INDICATOR = document.getElementById('duckIndicator');
    const TIME_PASSED = document.getElementById('timePassed');
    const LEVEL_STARS = [
        document.getElementById('levelStar1'),
        document.getElementById('levelStar2'),
        document.getElementById('levelStar3')
    ];

    const IMG_PLAYER = 'images/dog.png';
    const IMG_ENEMY = 'images/enemy.png';
    const IMG_FLAME = 'images/oeuf.png';

    const SOUNDS = {
        '1': document.getElementById('sound1'),
        '2': document.getElementById('sound2'),
        '3': document.getElementById('sound3'),
        'GO': document.getElementById('soundGo'),
        'fire': document.getElementById('soundFire'),
        'hit': document.getElementById('soundEnemyDeath'),
        'death': document.getElementById('soundDeath')
    };

    const GAME_DURATION_MS = 30000; // 30 secondes
    const TARGET_ENEMIES = 25;
    const ENEMY_SPEED = 2;

    const STAR_CONDITIONS = { 3: 20, 2: 10, 1: 5 }; // secondes pour 3,2,1 étoiles
    let gameRunning = false;
    let enemiesKilled = 0;
    let elapsedTime = 0;
    let player = null;
    let enemies = [];
    let flames = [];
    let keys = {};

    // --- ENTITÉS ---
    function createEntity(type, x, y, w, h) {
        const el = document.createElement('img');
        el.className = `${type}-entity`;
        el.src = type === 'player' ? IMG_PLAYER : (type === 'enemy' ? IMG_ENEMY : IMG_FLAME);
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
        el.style.position = 'absolute';
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        PLAY_AREA.appendChild(el);

        const entity = { el, x, y, w, h };
        if (type === 'enemy') { 
            const angle = Math.random() * 2 * Math.PI;
            entity.dx = Math.cos(angle) * ENEMY_SPEED;
            entity.dy = Math.sin(angle) * ENEMY_SPEED;
        }
        return entity;
    }

    function initPlayer() {
        const h = PLAY_AREA.clientHeight;
        player = createEntity('player', 20, h / 2 - 25, 50, 50);
    }

    function spawnEnemies() {
        const w = PLAY_AREA.clientWidth;
        const h = PLAY_AREA.clientHeight;
        enemies = [];
        const MIN_X = w * 0.5;
        const MAX_X = w * 0.95;
        const MARGIN_Y = 50;

        for (let i = 0; i < TARGET_ENEMIES; i++) {
            const startX = MIN_X + Math.random() * (MAX_X - MIN_X);
            const startY = MARGIN_Y + Math.random() * (h - 2 * MARGIN_Y - 40);
            enemies.push(createEntity('enemy', startX, startY, 40, 40));
        }
    }

    function fireFlame() {
        if (!gameRunning) return;
        SOUNDS.fire.currentTime = 0;
        SOUNDS.fire.play().catch(()=>{});
        flames.push(createEntity('flame', player.x + player.w, player.y + player.h / 2 - 5, 20, 10));
    }

    function updateTimeBar() {
        const ratio = elapsedTime / GAME_DURATION_MS;
        TIME_PASSED.style.width = `${ratio*100}%`;
        DUCK_INDICATOR.style.left = `${ratio*100}%`;
        const remainingSec = Math.max(0, Math.ceil((GAME_DURATION_MS - elapsedTime)/1000));

        LEVEL_STARS.forEach((star, idx) => {
            if (remainingSec >= STAR_CONDITIONS[3-idx]) star.src = '../levels_images/star_full.png';
            else star.src = '../levels_images/star_empty.png';
        });

        TIME_DISPLAY.textContent = remainingSec < 10 ? `00:0${remainingSec}` : `00:${remainingSec}`;
    }

    function endGame() {
        gameRunning = false;
        const starsAchieved = LEVEL_STARS.filter(s => s.src.includes('star_full.png')).length;
        const isWin = (enemiesKilled >= TARGET_ENEMIES);
        localStorage.setItem("level_isWin", isWin ? "1" : "0");
        localStorage.setItem("level_starsAchieved", starsAchieved);
        localStorage.setItem("level_finalTime", Math.ceil(elapsedTime/1000));
        localStorage.setItem("level_currentLevel", "2");
        window.location.href = "restart.html";
    }

    // --- COLLISIONS ---
    function checkCollision(a, b){
        return !(
            a.x + a.w < b.x ||
            a.x > b.x + b.w ||
            a.y + a.h < b.y ||
            a.y > b.y + b.h
        );
    }

    // --- MOUVEMENT ---
    document.addEventListener('keydown', e => keys[e.key] = true);
    document.addEventListener('keyup', e => keys[e.key] = false);

    function movePlayer() {
        const step = 5;
        if (!player) return;
        if(keys['ArrowUp']) player.y -= step;
        if(keys['ArrowDown']) player.y += step;
        if(keys['ArrowLeft']) player.x -= step;
        if(keys['ArrowRight']) player.x += step;

        // Limites
        player.x = Math.max(0, Math.min(player.x, PLAY_AREA.clientWidth - player.w));
        player.y = Math.max(0, Math.min(player.y, PLAY_AREA.clientHeight - player.h));
        player.el.style.left = player.x + 'px';
        player.el.style.top = player.y + 'px';
    }

    function moveEnemies() {
        enemies.forEach(enemy => {
            enemy.x += enemy.dx;
            enemy.y += enemy.dy;

            if(enemy.x <=0 || enemy.x+enemy.w>=PLAY_AREA.clientWidth) enemy.dx *= -1;
            if(enemy.y <=0 || enemy.y+enemy.h>=PLAY_AREA.clientHeight) enemy.dy *= -1;

            enemy.el.style.left = enemy.x + 'px';
            enemy.el.style.top = enemy.y + 'px';
        });
    }

    function moveFlames() {
        flames.forEach((flame,i)=>{
            flame.x += 8;
            flame.el.style.left = flame.x+'px';
            enemies.forEach((enemy,j)=>{
                if(checkCollision(flame,enemy)){
                    PLAY_AREA.removeChild(enemy.el);
                    enemies.splice(j,1);
                    enemiesKilled++;
                    PLAY_AREA.removeChild(flame.el);
                    flames.splice(i,1);
                    SOUNDS.hit.currentTime=0;
                    SOUNDS.hit.play().catch(()=>{});
                }
            });
            if(flame.x>PLAY_AREA.clientWidth){
                PLAY_AREA.removeChild(flame.el);
                flames.splice(i,1);
            }
        });
    }

    function gameLoop(timestampStart){
        if(!gameRunning) return;
        const now = performance.now();
        elapsedTime = now - timestampStart;
        updateTimeBar();

        movePlayer();
        moveEnemies();
        moveFlames();

        if(elapsedTime >= GAME_DURATION_MS || enemiesKilled >= TARGET_ENEMIES){
            endGame();
            return;
        }

        requestAnimationFrame(()=>gameLoop(timestampStart));
    }

    function startGame() {
        PRE_GAME_TIMER.classList.add('hidden');
        GAME_CONTAINER.classList.remove('hidden');
        gameRunning = true;
        initPlayer();
        spawnEnemies();
        const startTime = performance.now();
        requestAnimationFrame(()=>gameLoop(startTime));
    }

    function preGameCountdown() {
        let count = 3;
        TIMER_DISPLAY.textContent = count;
        TIMER_DISPLAY.style.opacity = 1;
        COURAGE_DOG.style.opacity = 1;

        const interval = setInterval(()=>{
            if(count > 1){
                SOUNDS[count].play().catch(()=>{});
                count--;
                TIMER_DISPLAY.textContent = count;
            }else{
                clearInterval(interval);
                SOUNDS['GO'].play().catch(()=>{});
                TIMER_DISPLAY.textContent = "GO!";
                setTimeout(()=>{
                    TIMER_DISPLAY.style.opacity = 0;
                    COURAGE_DOG.style.opacity = 0;
                    startGame();
                }, 1000);
            }
        }, 1000);
    }

    // TIR avec espace
    document.addEventListener('keydown', e=>{
        if(e.key===' ') fireFlame();
    });

    preGameCountdown();
});
    
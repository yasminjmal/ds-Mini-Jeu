// levels_mode.js

document.addEventListener('DOMContentLoaded', () => {
    // Clé pour stocker la progression maximale et les scores
    const STORAGE_KEY_MAX_LEVEL = 'levels_maxReached';
    const STORAGE_KEY_LEVEL_DATA = 'levels_data';
    const STAR_FULL_PATH = 'levels_images/star_full.png';
    const STAR_EMPTY_PATH = 'levels_images/star_empty.png';

    // Niveau déverrouillé le plus élevé (par défaut Level 1)
    let maxLevelReached = parseInt(localStorage.getItem(STORAGE_KEY_MAX_LEVEL) || '1', 10);
    
    // Données des niveaux (étoiles obtenues) : { "1": 3, "2": 0, ... }
    const levelData = JSON.parse(localStorage.getItem(STORAGE_KEY_LEVEL_DATA) || '{}');

    const levelBlocks = document.querySelectorAll('.level-block');
    const maxLevelReachedEl = document.getElementById('maxLevelReached');

    // 1. Initialiser l'affichage
    maxLevelReachedEl.textContent = maxLevelReached;

    levelBlocks.forEach(block => {
        const level = parseInt(block.dataset.level, 10);
        const starsContainer = block.querySelector('.stars-container');
        const startBtn = block.querySelector('.start-btn');

        // Récupérer le nombre d'étoiles pour ce niveau (ou 0 par défaut)
        const starsAchieved = levelData[level.toString()] || 0;

        starsContainer.dataset.stars = starsAchieved;

        // --- Gérer le statut Verrouillé/Déverrouillé ---
        if (level <= maxLevelReached) {
            // Niveau Déverrouillé
            block.classList.remove('locked');
            block.classList.add('unlocked');
            block.querySelector('.lock-overlay').style.display = 'none';
            startBtn.disabled = false;
            
            // Ajouter le gestionnaire de clic pour START
            startBtn.addEventListener('click', () => {
                // Cette ligne utilise data-target qui est maintenant corrigé !
                const targetPage = './' + startBtn.dataset.target;
                window.location.href = targetPage;
            });

        } else {
            // Niveau Verrouillé
            block.classList.add('locked');
            block.classList.remove('unlocked');
            startBtn.disabled = true;
        }

        // --- Afficher les Étoiles ---
        const stars = starsContainer.querySelectorAll('.star');
        stars.forEach((star, index) => {
            if (index < starsAchieved) {
                // Étoile pleine si le joueur l'a gagnée
                star.src = STAR_FULL_PATH;
            } else {
                // Étoile vide (par défaut pour les niveaux bloqués)
                star.src = STAR_EMPTY_PATH;
            }
        });
    });

    // --- Fonction d'exemple pour déverrouiller/mettre à jour (à appeler depuis levelX.html) ---
    /*
    function updateLevelStatus(levelCompleted, starsGained) {
        // Mettre à jour les étoiles
        levelData[levelCompleted] = starsGained;
        localStorage.setItem(STORAGE_KEY_LEVEL_DATA, JSON.stringify(levelData));

        // Déverrouiller le niveau suivant
        if (levelCompleted >= maxLevelReached) {
            maxLevelReached = levelCompleted + 1;
            localStorage.setItem(STORAGE_KEY_MAX_LEVEL, maxLevelReached);
        }
        
        // Recharger la page ou le DOM pour appliquer les changements
        window.location.reload(); 
    }
    // Laissez cette fonction ici pour référence. Elle sera appelée par vos pages de niveaux.
    */
});
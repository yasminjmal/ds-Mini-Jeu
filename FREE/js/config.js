// config.js
export const CONFIG = {
  playerSpeed: 5,              // vitesse du joueur
  bulletSpeed: 7,              // vitesse des flammes
  enemySpeed: 2,               // vitesse de base des ennemis
  enemySpawnRate: 2000,        // délai d’apparition (ms)
  enemySpawnIncreaseRate: 30,  // chaque 30s, on augmente la difficulté
  maxEnemiesStart: 6,          // nombre d’ennemis au début
  battlefieldColorChange: true, // activer changement de couleur
  colorChangeInterval: 30000,   // toutes les 30s changer couleur
};

export function randomY(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

export function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

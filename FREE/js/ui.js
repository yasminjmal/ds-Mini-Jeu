export function showMessage(text, duration = 4000) {
  const msg = document.createElement('div');
  msg.className = 'game-message';
  msg.textContent = text;
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), duration);
}

export function updateScore(score) {
  document.getElementById('score').textContent = `SCORE : ${score}`;
}

export function updateTimer(seconds) {
  document.getElementById('timer').textContent = `TIME : ${seconds}s`;
}

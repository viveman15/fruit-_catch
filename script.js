const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreValue = document.getElementById('scoreValue');
const bestValue = document.getElementById('bestValue');
const livesValue = document.getElementById('livesValue');
const levelValue = document.getElementById('levelValue');
const comboBadge = document.getElementById('comboBadge');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const overlayEyebrow = document.getElementById('overlayEyebrow');
const overlayFruit = document.getElementById('overlayFruit');
const overlayButton = document.getElementById('overlayButton');
const pauseButton = document.getElementById('pauseButton');
const soundButton = document.getElementById('soundButton');

const fruitTypes = [
  { emoji: '🍎', points: 10, color: '#e85e4c' }, { emoji: '🍊', points: 15, color: '#f39b46' },
  { emoji: '🍋', points: 20, color: '#f3c84c' }, { emoji: '🍐', points: 25, color: '#9fc761' },
  { emoji: '🍓', points: 30, color: '#e85e72' }, { emoji: '🍉', points: 35, color: '#73b66b' }
];
const badTypes = [{ emoji: '💣', points: 0, color: '#6b6d72' }, { emoji: '🥀', points: 0, color: '#805466' }];
let best = Number(localStorage.getItem('fruitCatchBest') || 0);
let score = 0, lives = 3, combo = 1, level = 1, playing = false, paused = false, soundOn = true;
let basket = { x: 450, targetX: 450, y: 492, width: 112, height: 45 };
let drops = [], particles = [], lastTime = 0, spawnTimer = 0, shake = 0;
const keys = {};

function resizeCanvas() { const ratio = 900 / 560; canvas.style.aspectRatio = ratio; }
function updateHud() { scoreValue.textContent = String(score).padStart(5, '0'); bestValue.textContent = String(best).padStart(5, '0'); livesValue.textContent = '♥ '.repeat(lives).trim() || '—'; livesValue.setAttribute('aria-label', `${lives} lives`); levelValue.textContent = String(level).padStart(2, '0'); comboBadge.innerHTML = `COMBO <strong>x${combo}</strong>`; }
function randomDrop() { const isBad = Math.random() < Math.min(.08 + level * .012, .2); const type = isBad ? badTypes[Math.floor(Math.random() * badTypes.length)] : fruitTypes[Math.floor(Math.random() * fruitTypes.length)]; return { x: 36 + Math.random() * 828, y: -35, size: 32 + Math.random() * 7, speed: 120 + Math.random() * 55 + level * 13, type, bad: isBad, rotation: Math.random() * 6.2, spin: (Math.random() - .5) * 2 }; }
function startGame() { score = 0; lives = 3; combo = 1; level = 1; drops = []; particles = []; basket.x = basket.targetX = 450; playing = true; paused = false; overlay.classList.add('hidden'); pauseButton.innerHTML = '<span>Ⅱ</span> Pause'; updateHud(); lastTime = performance.now(); requestAnimationFrame(loop); }
function endGame() { playing = false; best = Math.max(best, score); localStorage.setItem('fruitCatchBest', best); overlayEyebrow.textContent = 'Harvest complete'; overlayTitle.textContent = score > best - 1 && score > 0 ? 'New best!' : 'Nice catch'; overlayMessage.textContent = `You brought in ${score} points. Ready to try another run?`; overlayFruit.textContent = score > 100 ? '🏆' : '🍎'; overlayButton.textContent = 'Play again  →'; overlay.classList.remove('hidden'); updateHud(); }
function togglePause() { if (!playing) return; paused = !paused; pauseButton.innerHTML = paused ? '<span>▶</span> Resume' : '<span>Ⅱ</span> Pause'; if (!paused) { lastTime = performance.now(); requestAnimationFrame(loop); } draw(); }
function addParticles(x, y, color, count = 8) { for (let i = 0; i < count; i++) particles.push({ x, y, vx: (Math.random() - .5) * 100, vy: (Math.random() - 1.1) * 100, life: .6 + Math.random() * .3, color, size: 2 + Math.random() * 3 }); }
function catchDrop(drop) { if (drop.bad) { lives--; combo = 1; shake = .25; addParticles(drop.x, drop.y, '#805466', 12); } else { score += drop.type.points * combo; combo = Math.min(9, combo + 1); addParticles(drop.x, drop.y, drop.type.color, 12); if (score > level * 120) level++; } updateHud(); if (lives <= 0) endGame(); }
function update(dt) { const direction = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0); if (direction) basket.targetX += direction * 390 * dt; basket.targetX = Math.max(65, Math.min(835, basket.targetX)); basket.x += (basket.targetX - basket.x) * Math.min(1, dt * 12); spawnTimer -= dt; const interval = Math.max(.38, .82 - level * .045); if (spawnTimer <= 0) { drops.push(randomDrop()); spawnTimer = interval; }
  drops.forEach(drop => { drop.y += drop.speed * dt; drop.rotation += drop.spin * dt; if (drop.y > basket.y - 7 && drop.y < basket.y + 35 && Math.abs(drop.x - basket.x) < basket.width * .53) { catchDrop(drop); drop.remove = true; } else if (drop.y > 580) { if (!drop.bad) { combo = 1; lives--; updateHud(); if (lives <= 0) endGame(); } drop.remove = true; } }); drops = drops.filter(drop => !drop.remove);
  particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt; p.life -= dt; }); particles = particles.filter(p => p.life > 0); shake = Math.max(0, shake - dt);
}
function drawBackground() { const gradient = ctx.createLinearGradient(0, 0, 0, 560); gradient.addColorStop(0, '#dfead1'); gradient.addColorStop(1, '#cbdcb9'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 900, 560); ctx.fillStyle = 'rgba(255,253,226,.55)'; ctx.beginPath(); ctx.arc(765, 100, 55, 0, Math.PI * 2); ctx.fill(); for (let x = -20; x < 950; x += 120) { ctx.fillStyle = '#759565'; ctx.beginPath(); ctx.arc(x + 25, 425, 88, Math.PI, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#5e815b'; ctx.beginPath(); ctx.arc(x + 73, 445, 105, Math.PI, Math.PI * 2); ctx.fill(); } ctx.fillStyle = '#afc595'; ctx.fillRect(0, 483, 900, 77); for (let x = 30; x < 900; x += 46) { ctx.fillStyle = 'rgba(76,112,64,.35)'; ctx.fillRect(x, 500 + (x % 3) * 5, 2, 20); } }
function drawBasket() { const x = basket.x; ctx.save(); ctx.translate(x, basket.y); ctx.fillStyle = 'rgba(39,65,44,.2)'; ctx.beginPath(); ctx.ellipse(0, 38, 70, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#c17845'; ctx.beginPath(); ctx.moveTo(-56, -17); ctx.quadraticCurveTo(0, 4, 56, -17); ctx.lineTo(46, 30); ctx.quadraticCurveTo(0, 53, -46, 30); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#8e5737'; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = 'rgba(255,220,157,.55)'; ctx.lineWidth = 3; for (let i = -28; i <= 28; i += 14) { ctx.beginPath(); ctx.moveTo(i, -4); ctx.lineTo(i * .8, 34); ctx.stroke(); } ctx.restore(); }
function draw() { ctx.save(); if (shake) ctx.translate((Math.random() - .5) * 8, (Math.random() - .5) * 5); drawBackground(); drops.forEach(drop => { ctx.save(); ctx.translate(drop.x, drop.y); ctx.rotate(drop.rotation); ctx.font = `${drop.size}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(drop.type.emoji, 0, 0); ctx.restore(); }); drawBasket(); particles.forEach(p => { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }); ctx.restore(); }
function loop(time) { if (!playing || paused) return; const dt = Math.min(.035, (time - lastTime) / 1000); lastTime = time; update(dt); draw(); if (playing) requestAnimationFrame(loop); }
function moveBasket(event) { const rect = canvas.getBoundingClientRect(); basket.targetX = (event.clientX - rect.left) * (900 / rect.width); }
window.addEventListener('keydown', event => { keys[event.key] = true; if (event.key === ' ' || event.key === 'Escape') { event.preventDefault(); togglePause(); } });
window.addEventListener('keyup', event => { keys[event.key] = false; });
canvas.addEventListener('pointermove', moveBasket); canvas.addEventListener('pointerdown', moveBasket); overlayButton.addEventListener('click', startGame); pauseButton.addEventListener('click', togglePause); soundButton.addEventListener('click', () => { soundOn = !soundOn; soundButton.textContent = soundOn ? '♫' : '×'; soundButton.setAttribute('aria-label', soundOn ? 'Mute sound' : 'Toggle sound'); });
resizeCanvas(); updateHud(); draw(); requestAnimationFrame(() => startGame());

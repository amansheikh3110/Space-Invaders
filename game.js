const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ================== PLAYER ==================
const player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 50,
  width: 40,
  height: 20,
  speed: 6,
};

let keys = {};
let bullets = [];
let alienBullets = [];

// ================== INPUT ==================
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// ================== ALIENS ==================
const rows = 5;
const cols = 10;
const alienSize = 30;
let alienSpeed = 1;

let aliens = [];

function createAliens() {
  aliens = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      aliens.push({
        x: 100 + c * 50,
        y: 50 + r * 40,
        alive: true,
        row: r,
        col: c,
      });
    }
  }
}

createAliens();

// ================== GAME LOOP ==================
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();

// ================== UPDATE ADDED ==================
function update() {
  // Player movement
  if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
  if (keys["ArrowRight"] && player.x + player.width < canvas.width)
    player.x += player.speed;

  // Shooting
  if (keys[" "] && bullets.length < 1) {
    bullets.push({
      x: player.x + player.width / 2,
      y: player.y,
    });
  }

  // Update bullets
  bullets.forEach(b => b.y -= 8);
  bullets = bullets.filter(b => b.y > 0);

  // Update alien bullets
  alienBullets.forEach(b => b.y += 4);
  alienBullets = alienBullets.filter(b => b.y < canvas.height);

  // Move aliens
  aliens.forEach(a => {
    if (a.alive) a.x += alienSpeed;
  });

  // Reverse direction
  const hitWall = aliens.some(a =>
    a.alive && (a.x <= 0 || a.x + alienSize >= canvas.width)
  );

  if (hitWall) {
    alienSpeed *= -1;
    aliens.forEach(a => a.y += 20);
  }

  handleCollisions();
  alienShooting();
}

// ================== COLLISIONS ==================
function handleCollisions() {
  bullets.forEach(bullet => {
    aliens.forEach(alien => {
      if (
        alien.alive &&
        bullet.x > alien.x &&
        bullet.x < alien.x + alienSize &&
        bullet.y > alien.y &&
        bullet.y < alien.y + alienSize
      ) {
        alien.alive = false;
        bullet.y = -10;
      }
    });
  });
}

// ================== ALIEN SHOOTING ==================
function alienShooting() {
  const bottomAliens = aliens.filter(a => {
    if (!a.alive) return false;
    return !aliens.some(
      other =>
        other.alive &&
        other.col === a.col &&
        other.row > a.row
    );
  });

  bottomAliens.forEach(alien => {
    if (Math.random() < 0.002) {
      alienBullets.push({
        x: alien.x + alienSize / 2,
        y: alien.y + alienSize,
      });
    }
  });
}

// ================== DRAW ==================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Player
  ctx.fillStyle = "#00ff00";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Bullets
  ctx.fillStyle = "white";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, 2, 10));

  alienBullets.forEach(b =>
    ctx.fillRect(b.x, b.y, 2, 10)
  );

  // Aliens
  aliens.forEach(a => {
    if (a.alive) {
      ctx.fillStyle = "#00ff00";
      ctx.fillRect(a.x, a.y, alienSize, alienSize);
    }
  });
}

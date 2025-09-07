// ==========================
// VARIABLES GLOBALES
// ==========================
const gameContainer = document.getElementById("game-container");
const player = document.getElementById("player");
const scoreElement = document.getElementById("score");
const levelElement = document.getElementById("level");
const livesElement = document.getElementById("lives");

const easyBtn = document.getElementById("easy-btn");
const mediumBtn = document.getElementById("medium-btn");
const hardBtn = document.getElementById("hard-btn");

let moveLeft = false;
let moveRight = false;
let shooting = false;

let enemies = [];
let bullets = [];
let enemyBullets = [];

let score = 0;
let level = 1;
let lives = 3;

let enemySpeed = 2;
let enemyDirection = 1;
let playerSpeed = 10;
let bulletSpeed = 12;
let enemyBulletSpeed = 10;

let gameLoopInterval;
let enemyShootInterval;

let difficulty = "easy";

// ==========================
// SONIDOS
// ==========================
const shootSound = new Audio("shoot.wav");
const enemyHitSound = new Audio("explosion.wav");
const backgroundMusic = new Audio("musica-de-fondo.mp3");
const gameOverMusic = new Audio("gameover.mp3");

backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;
gameOverMusic.volume = 0.7;

// ==========================
// INICIAR JUEGO
// ==========================
function startGame() {
  document.getElementById("start-screen").classList.add("hidden");

  // Ajustar velocidad según dificultad
  switch(difficulty){
    case "easy": enemySpeed = 1.5; bulletSpeed = 12; break;
    case "medium": enemySpeed = 2.5; bulletSpeed = 14; break;
    case "hard": enemySpeed = 3.5; bulletSpeed = 16; break;
  }

  score = 0; level = 1; lives = 3;
  updateHUD();
  createEnemies();

  clearInterval(gameLoopInterval);
  clearInterval(enemyShootInterval);

  gameLoopInterval = setInterval(gameLoop, 100);
  enemyShootInterval = setInterval(enemyShoot, 2000);

  backgroundMusic.play();

  document.addEventListener("keydown", keyDownHandler);
  document.addEventListener("keyup", keyUpHandler);
}

// ==========================
// BOTONES DIFICULTAD
// ==========================
[easyBtn, mediumBtn, hardBtn].forEach(btn => {
  btn.addEventListener("click", ()=>{
    difficulty = btn.dataset.difficulty;
    startGame();
  });
});

// ==========================
// CREAR ENEMIGOS
// ==========================
function createEnemies() {
  enemies.forEach(e => e.remove());
  enemies = [];

  const isMobile = window.innerWidth <= 600;
  let rows = 4;
  let cols = isMobile ? Math.min(5 + level, 10) : Math.min(8 + level, 12);

  for(let row = 0; row < rows; row++){
    for(let col = 0; col < cols; col++){
      const enemy = document.createElement("div");
      const types = ["enemy-amarillo","enemy-azul","enemy-rojo","enemy-violeta"];
      enemy.classList.add("enemy", types[Math.floor(Math.random() * types.length)]);
      enemy.style.top = `${row * 50}px`;
      enemy.style.left = `${col * 50}px`;
      gameContainer.appendChild(enemy);
      enemies.push(enemy);
    }
  }
}

// ==========================
// BUCLE PRINCIPAL
// ==========================
function gameLoop(){
  movePlayer();
  moveBullets();
  moveEnemies();
  moveEnemyBullets();
  checkCollisions();
}

// ==========================
// MOVIMIENTO JUGADOR
// ==========================
function movePlayer(){
  if(moveLeft && player.offsetLeft > 0) player.style.left = `${player.offsetLeft - playerSpeed}px`;
  if(moveRight && player.offsetLeft + player.offsetWidth < gameContainer.offsetWidth)
      player.style.left = `${player.offsetLeft + playerSpeed}px`;
}

// ==========================
// EVENTOS TECLADO
// ==========================
function keyDownHandler(e){
  if(e.key === "ArrowLeft") moveLeft = true;
  if(e.key === "ArrowRight") moveRight = true;
  if(e.key === " ") shoot();
}
function keyUpHandler(e){
  if(e.key === "ArrowLeft") moveLeft = false;
  if(e.key === "ArrowRight") moveRight = false;
}

// ==========================
// DISPARO JUGADOR
// ==========================
function shoot(){
  if(shooting) return;
  shooting = true;

  const bullet = document.createElement("div");
  bullet.classList.add("bullet");
  bullet.style.left = `${player.offsetLeft + player.offsetWidth/2 - 2}px`;
  bullet.style.top = `${player.offsetTop}px`;
  gameContainer.appendChild(bullet);
  bullets.push(bullet);

  shootSound.play();

  setTimeout(()=>shooting = false, 300);
}

// ==========================
// MOVIMIENTO BALAS JUGADOR
// ==========================
function moveBullets(){
  bullets.forEach((b,i)=>{
    b.style.top = `${b.offsetTop - bulletSpeed}px`;
    if(b.offsetTop < 0){
      b.remove(); bullets.splice(i,1);
    }
  });
}

// ==========================
// MOVIMIENTO ENEMIGOS (horizontal y bajan línea al tocar lateral)
// ==========================
function moveEnemies(){
  let hitEdge = false;

  enemies.forEach(enemy=>{
    enemy.style.left = `${enemy.offsetLeft + enemySpeed * enemyDirection}px`;
    if(enemy.offsetLeft <= 0 || enemy.offsetLeft + enemy.offsetWidth >= gameContainer.offsetWidth){
      hitEdge = true;
    }
  });

  if(hitEdge){
    enemyDirection *= -1; // Cambiar dirección
    // Baja una línea solo
    enemies.forEach(enemy=>{
      enemy.style.top = `${enemy.offsetTop + 15}px`;
    });
  }
}

// ==========================
// DISPARO ENEMIGOS
// ==========================
function enemyShoot(){
  if(enemies.length === 0) return;
  const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
  const bullet = document.createElement("div");
  bullet.classList.add("enemy-bullet");
  bullet.style.left = `${randomEnemy.offsetLeft + randomEnemy.offsetWidth/2 - 2}px`;
  bullet.style.top = `${randomEnemy.offsetTop + randomEnemy.offsetHeight}px`;
  gameContainer.appendChild(bullet);
  enemyBullets.push(bullet);
}

// ==========================
// MOVIMIENTO BALAS ENEMIGOS
// ==========================
function moveEnemyBullets(){
  enemyBullets.forEach((b,i)=>{
    b.style.top = `${b.offsetTop + enemyBulletSpeed}px`;
    if(b.offsetTop > gameContainer.offsetHeight){
      b.remove(); enemyBullets.splice(i,1);
    }
  });
}

// ==========================
// COLISIONES
// ==========================
function checkCollisions(){
  bullets.forEach((b,bIndex)=>{
    enemies.forEach((e,eIndex)=>{
      if(isColliding(b,e)){
        score += 100;
        updateHUD();
        enemyHitSound.play();
        e.remove(); enemies.splice(eIndex,1);
        b.remove(); bullets.splice(bIndex,1);
      }
    });
  });

  enemyBullets.forEach((b,i)=>{
    if(isColliding(b,player)){
      lives--;
      updateHUD();
      b.remove(); enemyBullets.splice(i,1);
      if(lives <= 0) endGame();
    }
  });

  if(enemies.length === 0){
    level++;
    updateHUD();
    createEnemies();
  }
}

// ==========================
// DETECTAR COLISION
// ==========================
function isColliding(a,b){
  return !(a.offsetTop + a.offsetHeight < b.offsetTop ||
           a.offsetTop > b.offsetTop + b.offsetHeight ||
           a.offsetLeft + a.offsetWidth < b.offsetLeft ||
           a.offsetLeft > b.offsetLeft + b.offsetWidth);
}

// ==========================
// ACTUALIZAR HUD
// ==========================
function updateHUD(){
  scoreElement.textContent = score;
  levelElement.textContent = level;
  livesElement.textContent = lives;
}

// ==========================
// FIN DEL JUEGO
// ==========================
function endGame(){
  clearInterval(gameLoopInterval);
  clearInterval(enemyShootInterval);
  backgroundMusic.pause();
  gameOverMusic.play();
  alert("¡Game Over! Tu puntuación: " + score);
  location.reload();
}




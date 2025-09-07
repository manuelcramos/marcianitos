// =====================================================
//                   VARIABLES GLOBALES
// =====================================================

// Contenedores y elementos del DOM
const gameContainer = document.getElementById("game-container"); // Contenedor principal del juego
const player = document.getElementById("player");               // Nave del jugador
const scoreElement = document.getElementById("score");          // Elemento del HUD para puntos
const levelElement = document.getElementById("level");          // Elemento del HUD para nivel
const livesElement = document.getElementById("lives");          // Elemento del HUD para vidas

// Botones de selección de dificultad
const easyBtn = document.getElementById("easy-btn");
const mediumBtn = document.getElementById("medium-btn");
const hardBtn = document.getElementById("hard-btn");

// Variables de control de movimiento y disparo
let moveLeft = false;    // Movimiento hacia la izquierda
let moveRight = false;   // Movimiento hacia la derecha
let shooting = false;    // Control de disparo (para limitar velocidad)

// Arrays para almacenar enemigos y balas
let enemies = [];        // Enemigos activos
let bullets = [];        // Balas del jugador
let enemyBullets = [];   // Balas enemigas

// Variables de estado del juego
let score = 0;           // Puntos
let level = 1;           // Nivel actual
let lives = 3;           // Vidas del jugador

// Velocidades y direcciones
let enemySpeed = 2;       // Velocidad horizontal enemigos
let enemyDirection = 1;   // Dirección inicial (1 = derecha, -1 = izquierda)
let playerSpeed = 10;     // Velocidad de la nave
let bulletSpeed = 12;     // Velocidad de las balas del jugador
let enemyBulletSpeed = 10;// Velocidad de balas enemigas

// Intervalos de bucle y disparo enemigos
let gameLoopInterval;     
let enemyShootInterval;

// Dificultad por defecto
let difficulty = "easy";

// =====================================================
//                        SONIDOS
// =====================================================

// Sonidos del juego
const shootSound = new Audio("shoot.wav");          // Sonido al disparar
const enemyHitSound = new Audio("explosion.wav");   // Sonido al destruir enemigo
const backgroundMusic = new Audio("musica-de-fondo.mp3"); // Música de fondo
const gameOverMusic = new Audio("gameover.mp3");    // Música al perder

// Configuración de música
backgroundMusic.loop = true; // Bucle infinito
backgroundMusic.volume = 0.5;
gameOverMusic.volume = 0.7;

// =====================================================
//                  FUNCIONES PRINCIPALES
// =====================================================

// Función para iniciar el juego
function startGame() {
  // Ocultar pantalla de inicio
  document.getElementById("start-screen").classList.add("hidden");

  // Ajustar variables según dificultad
  switch(difficulty){
    case "easy": enemySpeed = 1.5; bulletSpeed = 12; break;
    case "medium": enemySpeed = 2.5; bulletSpeed = 14; break;
    case "hard": enemySpeed = 3.5; bulletSpeed = 16; break;
  }

  // Reiniciar estado del juego
  score = 0;
  level = 1;
  lives = 3;
  updateHUD();        // Actualizar HUD con valores iniciales
  createEnemies();    // Crear enemigos del nivel 1

  // Limpiar intervalos anteriores
  clearInterval(gameLoopInterval);
  clearInterval(enemyShootInterval);

  // Iniciar bucles principales
  gameLoopInterval = setInterval(gameLoop, 100); // Movimiento general
  enemyShootInterval = setInterval(enemyShoot, 2000); // Disparo enemigos

  // Empezar música de fondo
  backgroundMusic.play();

  // Escuchar eventos de teclado
  document.addEventListener("keydown", keyDownHandler);
  document.addEventListener("keyup", keyUpHandler);
}

// =====================================================
//                BOTONES DE DIFICULTAD
// =====================================================
[easyBtn, mediumBtn, hardBtn].forEach(btn => {
  btn.addEventListener("click", () => {
    difficulty = btn.dataset.difficulty;
    startGame();
  });
});

// =====================================================
//                   CREAR ENEMIGOS
// =====================================================
function createEnemies() {
  // Eliminar enemigos anteriores
  enemies.forEach(e => e.remove());
  enemies = [];

  // Ajuste para móviles
  const isMobile = window.innerWidth <= 600;
  let rows = 4;  
  let cols = isMobile ? Math.min(5+level, 10) : Math.min(8+level, 12); 

  // Crear enemigos en cuadrícula
  for (let row = 0; row < rows; row++){
    for (let col = 0; col < cols; col++){
      const enemy = document.createElement("div");
      const types = ["enemy-amarillo","enemy-azul","enemy-rojo","enemy-violeta"];
      enemy.classList.add("enemy", types[Math.floor(Math.random()*types.length)]);
      enemy.style.top = `${row*50}px`;
      enemy.style.left = `${col*50}px`;
      gameContainer.appendChild(enemy);
      enemies.push(enemy);
    }
  }
}

// =====================================================
//                    BUCLE PRINCIPAL
// =====================================================
function gameLoop() {
  movePlayer();          // Mover jugador
  moveBullets();         // Mover balas jugador
  moveEnemies();         // Mover enemigos
  moveEnemyBullets();    // Mover balas enemigos
  checkCollisions();     // Revisar colisiones
}

// =====================================================
//                   MOVIMIENTO JUGADOR
// =====================================================
function movePlayer(){
  if(moveLeft && player.offsetLeft > 0) 
      player.style.left = `${player.offsetLeft - playerSpeed}px`;
  if(moveRight && player.offsetLeft + player.offsetWidth < gameContainer.offsetWidth)
      player.style.left = `${player.offsetLeft + playerSpeed}px`;
}

// =====================================================
//                EVENTOS TECLADO
// =====================================================
function keyDownHandler(e){
  if(e.key === "ArrowLeft") moveLeft = true;
  if(e.key === "ArrowRight") moveRight = true;
  if(e.key === " ") shoot(); // Permite disparar mientras se mueve
}

function keyUpHandler(e){
  if(e.key === "ArrowLeft") moveLeft = false;
  if(e.key === "ArrowRight") moveRight = false;
}

// =====================================================
//                   DISPARO JUGADOR
// =====================================================
function shoot(){
  if(shooting) return; // Evitar disparar demasiado rápido
  shooting = true;

  // Crear bala
  const bullet = document.createElement("div");
  bullet.classList.add("bullet");
  bullet.style.left = `${player.offsetLeft + player.offsetWidth/2 - 2}px`;
  bullet.style.top = `${player.offsetTop}px`;
  gameContainer.appendChild(bullet);
  bullets.push(bullet);

  // Reproducir sonido de disparo
  shootSound.play();

  // Permitir siguiente disparo tras 300ms
  setTimeout(()=> shooting = false, 300);
}

// =====================================================
//               MOVIMIENTO BALAS JUGADOR
// =====================================================
function moveBullets(){
  bullets.forEach((b, i) => {
    b.style.top = `${b.offsetTop - bulletSpeed}px`;
    if(b.offsetTop < 0){
      b.remove(); 
      bullets.splice(i, 1);
    }
  });
}

// =====================================================
//                 MOVIMIENTO ENEMIGOS
// =====================================================
function moveEnemies(){
  let hitEdge = false;

  enemies.forEach(enemy => {
    enemy.style.left = `${enemy.offsetLeft + enemySpeed * enemyDirection}px`;

    // Detectar si llegó a un lateral
    if(enemy.offsetLeft <= 0 || enemy.offsetLeft + enemy.offsetWidth >= gameContainer.offsetWidth){
      hitEdge = true;
    }
  });

  if(hitEdge){
    // Cambiar dirección al golpear lateral
    enemyDirection *= -1;

    // Bajar enemigos solo una fila, sin quedarse abajo
    enemies.forEach(enemy => {
      enemy.style.top = `${enemy.offsetTop + 15}px`;

      // Limitar que no bajen demasiado (máximo 200px)
      if(enemy.offsetTop > 200) enemy.style.top = `200px`;
    });
  }
}

// =====================================================
//                  DISPARO ENEMIGOS
// =====================================================
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

// =====================================================
//             MOVIMIENTO BALAS ENEMIGOS
// =====================================================
function moveEnemyBullets(){
  enemyBullets.forEach((b, i) => {
    b.style.top = `${b.offsetTop + enemyBulletSpeed}px`;
    if(b.offsetTop > gameContainer.offsetHeight){
      b.remove(); 
      enemyBullets.splice(i, 1);
    }
  });
}

// =====================================================
//                   COLISIONES
// =====================================================
function checkCollisions(){
  // Colisión balas jugador con enemigos
  bullets.forEach((b, bIndex) => {
    enemies.forEach((e, eIndex) => {
      if(isColliding(b, e)){
        score += 100;
        updateHUD();
        enemyHitSound.play();
        e.remove(); enemies.splice(eIndex, 1);
        b.remove(); bullets.splice(bIndex, 1);
      }
    });
  });

  // Colisión balas enemigas con jugador
  enemyBullets.forEach((b, i) => {
    if(isColliding(b, player)){
      lives--;
      updateHUD();
      b.remove(); enemyBullets.splice(i, 1);
      if(lives <= 0) endGame();
    }
  });

  // Cuando no quedan enemigos, subir nivel
  if(enemies.length === 0){
    level++;
    updateHUD();
    createEnemies();
  }
}

// =====================================================
//                  DETECTAR COLISION
// =====================================================
function isColliding(a, b){
  return !(a.offsetTop + a.offsetHeight < b.offsetTop ||
           a.offsetTop > b.offsetTop + b.offsetHeight ||
           a.offsetLeft + a.offsetWidth < b.offsetLeft ||
           a.offsetLeft > b.offsetLeft + b.offsetWidth);
}

// =====================================================
//                    ACTUALIZAR HUD
// =====================================================
function updateHUD(){
  scoreElement.textContent = score;
  levelElement.textContent = level;
  livesElement.textContent = lives;
}

// =====================================================
//                   FIN DEL JUEGO
// =====================================================
function endGame(){
  clearInterval(gameLoopInterval);
  clearInterval(enemyShootInterval);

  // Detener música de fondo y reproducir música de game over
  backgroundMusic.pause();
  gameOverMusic.play();

  // Mensaje de fin de juego
  alert("¡Game Over! Tu puntuación: " + score);
  location.reload(); // Reiniciar página
}






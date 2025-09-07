// ==========================
// VARIABLES GLOBALES
// ==========================

// Referencias a los elementos del DOM (HTML)
const gameContainer = document.getElementById("game-container"); // Contenedor principal del juego
const player = document.getElementById("player");               // Nave del jugador
const scoreElement = document.getElementById("score");          // Puntuación
const levelElement = document.getElementById("level");          // Nivel actual
const livesElement = document.getElementById("lives");          // Vidas

// Botones de selección de dificultad
const easyBtn = document.getElementById("easy-btn");
const mediumBtn = document.getElementById("medium-btn");
const hardBtn = document.getElementById("hard-btn");

// Variables de control de movimiento del jugador
let moveLeft = false;
let moveRight = false;
let shooting = false;

// Arrays para almacenar enemigos y balas
let enemies = [];
let bullets = [];
let enemyBullets = [];

// Variables del estado del juego
let score = 0;
let level = 1;
let lives = 3;

// Velocidades y dirección
let enemySpeed = 2;        // Velocidad horizontal de los enemigos
let enemyDirection = 1;    // Dirección de movimiento (1 = derecha, -1 = izquierda)
let playerSpeed = 10;      // Velocidad del jugador
let bulletSpeed = 12;      // Velocidad de bala del jugador
let enemyBulletSpeed = 10; // Velocidad de bala del enemigo

// Intervalos para los bucles del juego
let gameLoopInterval;
let enemyShootInterval;

// Dificultad seleccionada (por defecto fácil)
let difficulty = "easy";

// ==========================
// SONIDOS
// ==========================

// Sonido de disparo del jugador
const shootSound = new Audio("shoot.wav"); 
// Sonido de explosión al matar a un enemigo
const explosionSound = new Audio("explosion.mp3");
// Música de fondo del juego
const backgroundMusic = new Audio("musica-de-fondo.mp3");
// Música al perder la partida
const gameOverMusic = new Audio("gameover.mp3");

// Configuración de sonidos
backgroundMusic.loop = true;    // Música en bucle
backgroundMusic.volume = 0.5;   // Volumen moderado
gameOverMusic.volume = 0.7;     // Volumen más alto para game over

// ==========================
// INICIAR JUEGO
// ==========================
function startGame() {
  // Ocultar la pantalla de inicio
  document.getElementById("start-screen").classList.add("hidden");

  // Ajustar la velocidad según dificultad
  switch(difficulty){
    case "easy": enemySpeed=1.5; bulletSpeed=12; break;
    case "medium": enemySpeed=2.5; bulletSpeed=14; break;
    case "hard": enemySpeed=3.5; bulletSpeed=16; break;
  }

  // Resetear variables
  score = 0; 
  level = 1; 
  lives = 3;
  updateHUD();
  createEnemies();

  // Limpiar intervalos previos
  clearInterval(gameLoopInterval);
  clearInterval(enemyShootInterval);

  // Iniciar bucles del juego
  gameLoopInterval = setInterval(gameLoop, 100);
  enemyShootInterval = setInterval(enemyShoot, 2000);

  // Reproducir música de fondo
  backgroundMusic.play();

  // Activar controles de teclado
  document.addEventListener("keydown", keyDownHandler);
  document.addEventListener("keyup", keyUpHandler);
}

// ==========================
// BOTONES DE DIFICULTAD
// ==========================
[easyBtn, mediumBtn, hardBtn].forEach(btn=>{
  btn.addEventListener("click", ()=>{
    difficulty = btn.dataset.difficulty; // Guardar dificultad elegida
    startGame(); // Iniciar juego
  });
});

// ==========================
// CREAR ENEMIGOS
// ==========================
function createEnemies() {
  // Borrar enemigos anteriores
  enemies.forEach(e=>e.remove());
  enemies = [];

  // Detectar si es móvil para ajustar columnas
  const isMobile = window.innerWidth <= 600;
  let rows = 4;  
  let cols = isMobile ? Math.min(5+level, 10) : Math.min(8+level, 12);

  // Crear matriz de enemigos
  for(let row=0; row<rows; row++){
    for(let col=0; col<cols; col++){
      const enemy = document.createElement("div");
      const types=["enemy-amarillo","enemy-azul","enemy-rojo","enemy-violeta"];
      enemy.classList.add("enemy", types[Math.floor(Math.random()*types.length)]);
      enemy.style.top = `${row*50}px`;
      enemy.style.left = `${col*50}px`;
      gameContainer.appendChild(enemy);
      enemies.push(enemy);
    }
  }
}

// ==========================
// BUCLE PRINCIPAL
// ==========================
function gameLoop(){
  movePlayer();        // Mover jugador
  moveBullets();       // Mover balas del jugador
  moveEnemies();       // Mover enemigos
  moveEnemyBullets();  // Mover balas enemigas
  checkCollisions();   // Revisar colisiones
}

// ==========================
// MOVIMIENTO DEL JUGADOR
// ==========================
function movePlayer(){
  if(moveLeft && player.offsetLeft>0) 
    player.style.left=`${player.offsetLeft-playerSpeed}px`;
  if(moveRight && player.offsetLeft+player.offsetWidth<gameContainer.offsetWidth) 
    player.style.left=`${player.offsetLeft+playerSpeed}px`;
}

// ==========================
// EVENTOS DE TECLADO
// ==========================
function keyDownHandler(e){
  if(e.key==="ArrowLeft") moveLeft=true;
  if(e.key==="ArrowRight") moveRight=true;
  if(e.key===" ") shoot();
}
function keyUpHandler(e){
  if(e.key==="ArrowLeft") moveLeft=false;
  if(e.key==="ArrowRight") moveRight=false;
}

// ==========================
// DISPARO DEL JUGADOR
// ==========================
function shoot(){
  if(shooting) return; // Evitar disparos múltiples seguidos
  shooting=true;

  // Crear bala
  const bullet=document.createElement("div");
  bullet.classList.add("bullet");
  bullet.style.left=`${player.offsetLeft+player.offsetWidth/2-2}px`;
  bullet.style.top=`${player.offsetTop}px`;
  gameContainer.appendChild(bullet);
  bullets.push(bullet);

  // Reproducir sonido
  shootSound.play();

  // Tiempo de recarga de disparo
  setTimeout(()=>shooting=false,300);
}

// ==========================
// MOVIMIENTO DE BALAS JUGADOR
// ==========================
function moveBullets(){
  bullets.forEach((b,i)=>{
    b.style.top=`${b.offsetTop-bulletSpeed}px`;
    if(b.offsetTop<0){
      b.remove(); bullets.splice(i,1);
    }
  });
}

// ==========================
// MOVIMIENTO DE ENEMIGOS
// ==========================
function moveEnemies(){
  let hitEdge=false;

  // Mover horizontalmente
  enemies.forEach(enemy=>{
    enemy.style.left=`${enemy.offsetLeft+enemySpeed*enemyDirection}px`;
    if(enemy.offsetLeft<=0 || enemy.offsetLeft+enemy.offsetWidth>=gameContainer.offsetWidth){
      hitEdge=true;
    }
  });

  if(hitEdge){
    // Cambiar dirección al llegar al borde
    enemyDirection*=-1;

    enemies.forEach(enemy=>{
      enemy.style.top=`${enemy.offsetTop+15}px`; // SOLO baja una fila
      // Si llegan demasiado abajo → rebote hacia arriba
      if(enemy.offsetTop+enemy.offsetHeight>=gameContainer.offsetHeight-100){
        enemy.style.top=`${enemy.offsetTop-30}px`;
      }
    });
  }

  // Eliminar enemigos muertos del array
  enemies=enemies.filter(e=>e.isConnected);
}

// ==========================
// DISPARO DE ENEMIGOS
// ==========================
function enemyShoot(){
  if(enemies.length===0) return;
  const randomEnemy = enemies[Math.floor(Math.random()*enemies.length)];
  const bullet=document.createElement("div");
  bullet.classList.add("enemy-bullet");
  bullet.style.left=`${randomEnemy.offsetLeft+randomEnemy.offsetWidth/2-2}px`;
  bullet.style.top=`${randomEnemy.offsetTop+randomEnemy.offsetHeight}px`;
  gameContainer.appendChild(bullet);
  enemyBullets.push(bullet);
}

// ==========================
// MOVIMIENTO BALAS ENEMIGOS
// ==========================
function moveEnemyBullets(){
  enemyBullets.forEach((b,i)=>{
    b.style.top=`${b.offsetTop+enemyBulletSpeed}px`;
    if(b.offsetTop>gameContainer.offsetHeight){
      b.remove(); enemyBullets.splice(i,1);
    }
  });
}

// ==========================
// COLISIONES
// ==========================
function checkCollisions(){
  // Colisión balas del jugador con enemigos
  bullets.forEach((b,bIndex)=>{
    enemies.forEach((e,eIndex)=>{
      if(isColliding(b,e)){
        score+=100; updateHUD();
        explosionSound.play(); // Sonido explosión
        e.remove(); enemies.splice(eIndex,1);
        b.remove(); bullets.splice(bIndex,1);
      }
    });
  });

  // Colisión balas enemigas con jugador
  enemyBullets.forEach((b,i)=>{
    if(isColliding(b,player)){
      lives--; updateHUD();
      b.remove(); enemyBullets.splice(i,1);
      if(lives<=0) endGame();
    }
  });

  // Pasar de nivel al eliminar a todos los enemigos
  if(enemies.length===0){
    level++; updateHUD(); createEnemies();
  }
}

// ==========================
// DETECTAR COLISIÓN
// ==========================
function isColliding(a,b){
  return !(a.offsetTop+a.offsetHeight<b.offsetTop ||
           a.offsetTop>b.offsetTop+b.offsetHeight ||
           a.offsetLeft+a.offsetWidth<b.offsetLeft ||
           a.offsetLeft>b.offsetLeft+b.offsetWidth);
}

// ==========================
// ACTUALIZAR HUD
// ==========================
function updateHUD(){
  scoreElement.textContent=score;
  levelElement.textContent=level;
  livesElement.textContent=lives;
}

// ==========================
// FIN DEL JUEGO
// ==========================
function endGame(){
  clearInterval(gameLoopInterval);
  clearInterval(enemyShootInterval);
  backgroundMusic.pause();  // Parar música de fondo
  gameOverMusic.play();     // Reproducir música de Game Over
  alert("¡Game Over! Tu puntuación: "+score);
  location.reload();        // Reiniciar juego
}


// DOM elementen selecteren
const gameIntro = document.getElementById('game-intro');
const gameCanvasContainer = document.getElementById('game-canvas-container');
const gameOver = document.getElementById('game-over');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const homeButton = document.getElementById('home-button');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');
const highScoreElement = document.getElementById('high-score');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Spelvariabelen
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem('gymzaalSpringerHighScore') || 0;
let animationFrameId;
let lastTimestamp = 0;
const FPS = 60;
const frameTime = 1000 / FPS;

// Canvas aanpassen aan container grootte
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

// Speler (leerling)
class Player {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = canvas.width * 0.3;
        this.height = canvas.width * 0.3;
        this.x = canvas.width * 0.2;
        this.y = canvas.height / 2;
        this.velocity = 0;
        this.gravity = 0.5;
        this.jumpStrength = -10;
        this.image = new Image();
        this.image.src = 'assets/player.png'; // Afbeelding van een leerling/sporter
    }

    update() {
        // Zwaartekracht toepassen
        this.velocity += this.gravity;
        this.y += this.velocity;

        // Begrenzingen controleren
        if (this.y + this.height > this.canvas.height) {
            this.y = this.canvas.height - this.height;
            this.velocity = 0;
        }
        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }
    }

    jump() {
        this.velocity = this.jumpStrength;
    }

    draw(ctx) {
        if (this.image.complete) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            // Fallback als afbeelding niet geladen is
            ctx.fillStyle = '#FF6B6B';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

// Obstakels (gymtoestellen)
class Obstacle {
    constructor(canvas, x) {
        this.canvas = canvas;
        this.x = x;
        this.speed = 5;
        this.width = canvas.width * 0.15;
        
        // Willekeurige hoogte en opening voor het obstakel
        this.gapHeight = canvas.height * 0.35;
        
        // Meer variatie in de posities van de openingen
        // Verdeel in drie mogelijke hoogtegebieden: hoog, midden, laag
        const positionType = Math.floor(Math.random() * 3);
        
        if (positionType === 0) {
            // Hoge opening
            this.gapPosition = Math.random() * (canvas.height * 0.3) + 20;
        } else if (positionType === 1) {
            // Middenopening
            this.gapPosition = Math.random() * (canvas.height * 0.3) + canvas.height * 0.35;
        } else {
            // Lage opening
            this.gapPosition = Math.random() * (canvas.height * 0.3) + canvas.height * 0.65;
        }
        
        // Afbeeldingen voor boven- en onderdeel
        this.topImage = new Image();
        this.bottomImage = new Image();
        this.topImage.src = 'assets/obstacle_top.png'; // Afbeelding van gymtoestel (bv. bokken, paard)
        this.bottomImage.src = 'assets/obstacle_bottom.png';
        
        this.passed = false;
    }

    update() {
        this.x -= this.speed;
    }

    draw(ctx) {
        // Bovenste deel
        const topHeight = this.gapPosition;
        if (this.topImage.complete) {
            ctx.drawImage(this.topImage, this.x, 0, this.width, topHeight);
        } else {
            ctx.fillStyle = '#3c6e71';
            ctx.fillRect(this.x, 0, this.width, topHeight);
        }
        
        // Onderste deel
        const bottomY = this.gapPosition + this.gapHeight;
        const bottomHeight = this.canvas.height - bottomY;
        if (this.bottomImage.complete) {
            ctx.drawImage(this.bottomImage, this.x, bottomY, this.width, bottomHeight);
        } else {
            ctx.fillStyle = '#3c6e71';
            ctx.fillRect(this.x, bottomY, this.width, bottomHeight);
        }
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }

    checkCollision(playerBounds) {
        // Marge toevoegen voor nauwkeurigere botsdetectie
        const hitboxMargin = 10; // Pixels marge voor betere botsdetectie
        
        // Bovenste obstakel controleren - met nauwkeurigere hitbox
        if (
            playerBounds.x + playerBounds.width - hitboxMargin > this.x &&
            playerBounds.x + hitboxMargin < this.x + this.width &&
            playerBounds.y + hitboxMargin < this.gapPosition
        ) {
            return true;
        }
        
        // Onderste obstakel controleren - met nauwkeurigere hitbox
        if (
            playerBounds.x + playerBounds.width - hitboxMargin > this.x &&
            playerBounds.x + hitboxMargin < this.x + this.width &&
            playerBounds.y + playerBounds.height - hitboxMargin > this.gapPosition + this.gapHeight
        ) {
            return true;
        }
        
        return false;
    }

    checkPassed(playerX) {
        if (!this.passed && playerX > this.x + this.width) {
            this.passed = true;
            return true;
        }
        return false;
    }
}

// Achtergrond
class Background {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = 0;
        this.speed = 2;
        this.image = new Image();
        this.image.src = 'assets/background.png'; // Gymzaal achtergrond
    }

    update() {
        this.x = (this.x - this.speed) % this.canvas.width;
    }

    draw(ctx) {
        if (this.image.complete) {
            // Tekenen van de achtergrond zodat het lijkt alsof het continu beweegt
            ctx.drawImage(this.image, this.x, 0, this.canvas.width, this.canvas.height);
            ctx.drawImage(this.image, this.x + this.canvas.width, 0, this.canvas.width, this.canvas.height);
        } else {
            // Fallback als afbeelding niet geladen is
            ctx.fillStyle = '#80b0c5';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

// Spel initialiseren
let player;
let obstacles = [];
let background;
let obstacleTimer = 0;
const obstacleInterval = 120; // Frames tussen obstakels

function initGame() {
    resizeCanvas();
    player = new Player(canvas);
    obstacles = [];
    background = new Background(canvas);
    score = 0;
    obstacleTimer = 0;
    scoreElement.textContent = '0';
    highScoreElement.textContent = highScore;
}

// Spel updating
function updateGame() {
    player.update();
    background.update();
    
    // Nieuwe obstakels toevoegen
    obstacleTimer++;
    if (obstacleTimer >= obstacleInterval) {
        obstacles.push(new Obstacle(canvas, canvas.width));
        obstacleTimer = 0;
    }
    
    // Obstakels bijwerken en controleren
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update();
        
        // Verwijderen van obstakels die uit beeld zijn
        if (obstacles[i].isOffScreen()) {
            obstacles.splice(i, 1);
            continue;
        }
        
        // Score verhogen bij passeren
        if (obstacles[i].checkPassed(player.x)) {
            score++;
            scoreElement.textContent = score;
        }
        
        // Controleren op botsingen
        if (obstacles[i].checkCollision(player.getBounds())) {
            endGame();
            return;
        }
    }
}

// Spel tekenen
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    background.draw(ctx);
    
    for (const obstacle of obstacles) {
        obstacle.draw(ctx);
    }
    
    player.draw(ctx);
}

// Game loop
function gameLoop(timestamp) {
    if (!gameRunning) return;
    
    // Framerate begrenzen
    if (timestamp - lastTimestamp < frameTime) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }
    lastTimestamp = timestamp;
    
    updateGame();
    drawGame();
    
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Spel starten
function startGame() {
    gameIntro.classList.add('hidden');
    gameCanvasContainer.classList.remove('hidden');
    gameOver.classList.add('hidden');
    
    gameRunning = true;
    initGame();
    lastTimestamp = 0;
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Spel beëindigen
function endGame() {
    gameRunning = false;
    cancelAnimationFrame(animationFrameId);
    
    finalScoreElement.textContent = score;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('gymzaalSpringerHighScore', highScore);
    }
    
    highScoreElement.textContent = highScore;
    
    gameCanvasContainer.classList.add('hidden');
    gameOver.classList.remove('hidden');
}

// Event listeners
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
homeButton.addEventListener('click', () => {
    gameOver.classList.add('hidden');
    gameIntro.classList.remove('hidden');
});

// Springen met spatiebalk of aanraking
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameRunning) {
        player.jump();
        e.preventDefault(); // Voorkomt scrollen bij spatiebalk
    }
});

canvas.addEventListener('touchstart', (e) => {
    if (gameRunning) {
        player.jump();
        e.preventDefault();
    }
});

// Venstergrootte aanpassen
window.addEventListener('resize', resizeCanvas);

// Initialiseren
window.addEventListener('load', () => {
    highScore = localStorage.getItem('gymzaalSpringerHighScore') || 0;
    highScoreElement.textContent = highScore;
}); 
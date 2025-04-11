// Simon Game - Two Players
// Game for two players based on the classic Simon memory game

// Sound frequencies for each color
const AUDIO_FREQUENCIES = {
    red: 261.6, // C4
    green: 329.6, // E4
    blue: 392.0, // G4
    yellow: 523.2 // C5
};

// DOM Elements
const boardElement = document.getElementById('game-board');
const startButton = document.getElementById('start-btn');
const resetButton = document.getElementById('reset-btn');
const messageElement = document.getElementById('message');
const currentPlayerElement = document.getElementById('current-player');
const sequenceLengthElement = document.getElementById('sequence-length');
const game1Button = document.getElementById('game1-btn');
const game2Button = document.getElementById('game2-btn');
const buttons = document.querySelectorAll('.simon-btn');

// Game State Variables
let gameSequence = [];
let playerSequence = [];
let currentPlayer = 1;
let activePlayer = 1;
let round = 0;
let gameMode = 1;
let isGameActive = false;
let playerTurn = false;
let isPlayingSequence = false;
let isAddingColor = false;

// Audio Context for sounds
let audioContext = null;

// Initialize the game
function init() {
    // Set up event listeners
    startButton.addEventListener('click', startGame);
    resetButton.addEventListener('click', resetGame);
    game1Button.addEventListener('click', () => setGameMode(1));
    game2Button.addEventListener('click', () => setGameMode(2));
    
    // Set up button event listeners
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (playerTurn && !isPlayingSequence) {
                const color = btn.getAttribute('data-color');
                playColor(color);
                
                if (isAddingColor) {
                    addColorHandler(color);
                } else {
                    checkPlayerInput(color);
                }
            }
        });
    });
    
    // Set up keyboard event listeners
    document.addEventListener('keydown', handleKeyPress);
    
    // Initialize audio context
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.error('Web Audio API is not supported in this browser');
    }
    
    // Set initial game mode
    setGameMode(1);
    updateUI();
}

// Set the game mode
function setGameMode(mode) {
    gameMode = mode;
    if (mode === 1) {
        game1Button.classList.add('active');
        game2Button.classList.remove('active');
        messageElement.textContent = 'Spelmodus 1: Simon genereert een sequentie, spelers wisselen elkaar af.';
    } else {
        game2Button.classList.add('active');
        game1Button.classList.remove('active');
        messageElement.textContent = 'Spelmodus 2: Simon begint, spelers herhalen en voegen toe.';
    }
}

// Start the game
function startGame() {
    if (isGameActive) return;
    
    isGameActive = true;
    playerTurn = false;
    currentPlayer = 1;
    activePlayer = 1;
    round = 0;
    gameSequence = [];
    playerSequence = [];
    
    updateUI();
    
    if (gameMode === 1) {
        addToSequence();
        setTimeout(() => {
            playSequence(() => {
                startPlayerTurn();
            });
        }, 1000);
    } else {
        addToSequence();
        setTimeout(() => {
            playSequence(() => {
                startPlayerTurn();
            });
        }, 1000);
    }
    
    startButton.disabled = true;
    messageElement.textContent = 'Het spel begint...';
}

// Reset the game
function resetGame() {
    isGameActive = false;
    playerTurn = false;
    currentPlayer = 1;
    activePlayer = 1;
    round = 0;
    gameSequence = [];
    playerSequence = [];
    
    startButton.disabled = false;
    updateUI();
    messageElement.textContent = 'Spel gereset. Klik op Start om te beginnen.';
}

// Add a random color to the sequence
function addToSequence() {
    const colors = ['red', 'green', 'blue', 'yellow'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    gameSequence.push(randomColor);
    round++;
    updateUI();
}

// Play the current sequence
function playSequence(callback) {
    isPlayingSequence = true;
    playerTurn = false;
    let i = 0;
    
    messageElement.textContent = 'Let op de sequentie...';
    
    const interval = setInterval(() => {
        if (i >= gameSequence.length) {
            clearInterval(interval);
            isPlayingSequence = false;
            if (callback) callback();
            return;
        }
        
        playColor(gameSequence[i]);
        i++;
    }, 800);
}

// Play a color (visual and audio)
function playColor(color) {
    const btn = document.getElementById(color);
    
    // Visual feedback
    btn.classList.add('active');
    setTimeout(() => {
        btn.classList.remove('active');
    }, 500);
    
    // Audio feedback
    playSound(color);
}

// Play sound for a color
function playSound(color) {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.frequency.value = AUDIO_FREQUENCIES[color];
    oscillator.type = 'sine';
    
    gainNode.gain.value = 0.3;
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    
    setTimeout(() => {
        oscillator.stop();
    }, 400);
}

// Start the player's turn
function startPlayerTurn() {
    playerTurn = true;
    playerSequence = [];
    activePlayer = currentPlayer;
    
    messageElement.textContent = `Speler ${activePlayer}: Herhaal de sequentie.`;
    updateUI();
}

// Check player's input
function checkPlayerInput(color) {
    playerSequence.push(color);
    const currentIndex = playerSequence.length - 1;
    
    // Check if the input is correct
    if (color !== gameSequence[currentIndex]) {
        // Wrong input
        gameOver(false);
        return;
    }
    
    // Check if the sequence is complete
    if (playerSequence.length === gameSequence.length) {
        // In Game Mode 2, player adds a new color after completing sequence
        if (gameMode === 2 && isGameActive) {
            playerTurn = false;
            setTimeout(() => {
                messageElement.textContent = `Goed gedaan! Speler ${activePlayer}, voeg nu een nieuwe kleur toe.`;
                isAddingColor = true;
                playerTurn = true;
            }, 800);
        } else {
            // In Game Mode 1, switch players after correctly completing sequence
            playerTurn = false;
            setTimeout(() => {
                messageElement.textContent = `Goed gedaan! Nu is Speler ${currentPlayer === 1 ? 2 : 1} aan de beurt.`;
                currentPlayer = currentPlayer === 1 ? 2 : 1;
                addToSequence();
                setTimeout(() => {
                    playSequence(() => {
                        startPlayerTurn();
                    });
                }, 1000);
            }, 800);
        }
    }
}

// Handler voor het toevoegen van een nieuwe kleur
function addColorHandler(color) {
    // Voeg de gekozen kleur toe aan de sequentie
    gameSequence.push(color);
    round++;
    
    // Schakel terug naar normale modus
    isAddingColor = false;
    playerTurn = false;
    
    // Schakel naar de volgende speler
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    
    setTimeout(() => {
        messageElement.textContent = `Speler ${currentPlayer} is aan de beurt.`;
        playSequence(() => {
            startPlayerTurn();
        });
    }, 1000);
}

// Handle keyboard input
function handleKeyPress(e) {
    if (!playerTurn || isPlayingSequence) return;
    
    let color;
    switch (e.key.toLowerCase()) {
        case 'r':
        case '1':
            color = 'red';
            break;
        case 'g':
        case '2':
            color = 'green';
            break;
        case 'b':
        case '3':
            color = 'blue';
            break;
        case 'y':
        case '4':
            color = 'yellow';
            break;
        default:
            return;
    }
    
    playColor(color);
    checkPlayerInput(color);
}

// Game over function
function gameOver(isSuccess) {
    isGameActive = false;
    playerTurn = false;
    startButton.disabled = false;
    
    // Play wrong sound
    if (!isSuccess) {
        playWrongSound();
    }
    
    // Show game over message
    if (gameMode === 1) {
        const winner = currentPlayer === 1 ? 2 : 1;
        messageElement.textContent = `Spel voorbij! Speler ${winner} wint! Reekslengte: ${round - 1}`;
    } else {
        const winner = activePlayer === 1 ? 2 : 1;
        messageElement.textContent = `Spel voorbij! Speler ${winner} wint! Reekslengte: ${round}`;
    }
    
    updateUI();
}

// Play wrong sound
function playWrongSound() {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.frequency.value = 100;
    oscillator.type = 'sawtooth';
    
    gainNode.gain.value = 0.2;
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    
    setTimeout(() => {
        oscillator.stop();
    }, 600);
}

// Update UI elements
function updateUI() {
    currentPlayerElement.textContent = `Speler ${activePlayer} is aan zet`;
    sequenceLengthElement.textContent = `Reekslengte: ${round}`;
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', init); 
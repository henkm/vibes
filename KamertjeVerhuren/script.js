document.addEventListener('DOMContentLoaded', () => {
    // Canvas en context ophalen
    const canvas = document.getElementById('game-board');
    const ctx = canvas.getContext('2d');
    
    // UI-elementen
    const gridSizeSelect = document.getElementById('grid-size');
    const gameModeSelect = document.getElementById('game-mode');
    const aiLevelSelect = document.getElementById('ai-level');
    const aiDifficultyDiv = document.querySelector('.ai-difficulty');
    const newGameBtn = document.getElementById('new-game-btn');
    const restartBtn = document.getElementById('restart-btn');
    const player1ScoreElement = document.querySelector('.player1 .player-score');
    const player2ScoreElement = document.querySelector('.player2 .player-score');
    const player2NameElement = document.querySelector('.player2 .player-name');
    const currentPlayerElement = document.querySelector('.current-player');
    
    // Spelconfiguratie
    let gridSize = parseInt(gridSizeSelect.value);
    let cellSize = 60;
    let dotRadius = 5;
    let lineWidth = 4;
    let currentPlayer = 1;
    let player1Score = 0;
    let player2Score = 0;
    let isSinglePlayer = false;
    let aiLevel = 'medium';
    let isAiTurn = false;
    let gameActive = true;
    
    // Kleuren
    const player1Color = '#3498db';
    const player2Color = '#e74c3c';
    const dotColor = '#2c3e50';
    const gridColor = '#95a5a6';
    const completedLineColor = '#2c3e50';
    const hoverLineColor = '#7f8c8d';
    
    // Spelopslag
    let horizontalLines = [];
    let verticalLines = [];
    let boxes = [];
    
    // Tracking voor touch en muis
    let isDragging = false;
    let startDot = null;
    let lastHoverLine = null;
    
    // Event listener voor het tonen/verbergen van AI-moeilijkheidsgraad
    gameModeSelect.addEventListener('change', () => {
        isSinglePlayer = gameModeSelect.value === 'single-player';
        aiDifficultyDiv.style.display = isSinglePlayer ? 'flex' : 'none';
        
        // Update speler 2 naam
        player2NameElement.textContent = isSinglePlayer ? 'Computer' : 'Speler 2';
    });
    
    // Canvas resize helpers
    function resizeCanvas() {
        const boardSize = Math.min(window.innerWidth * 0.9, 600);
        canvas.width = boardSize;
        canvas.height = boardSize;
        cellSize = Math.floor(boardSize / gridSize);
        
        // Pas dotRadius en lineWidth aan op basis van rastergrootte
        // Kleinere waarden voor grotere rasters
        if (gridSize > 6) {
            dotRadius = Math.max(2, Math.floor(cellSize / 16));
            lineWidth = Math.max(2, Math.floor(cellSize / 20));
        } else {
            dotRadius = Math.max(3, Math.floor(cellSize / 12));
            lineWidth = Math.max(2, Math.floor(cellSize / 15));
        }
        
        drawGame();
    }
    
    // Initialisatie van het spel
    function initGame() {
        gridSize = parseInt(gridSizeSelect.value);
        isSinglePlayer = gameModeSelect.value === 'single-player';
        aiLevel = aiLevelSelect.value;
        gameActive = true;
        
        // Arrays initialiseren
        horizontalLines = Array(gridSize).fill().map(() => Array(gridSize - 1).fill(0));
        verticalLines = Array(gridSize - 1).fill().map(() => Array(gridSize).fill(0));
        boxes = Array(gridSize - 1).fill().map(() => Array(gridSize - 1).fill(0));
        
        // Scores resetten
        player1Score = 0;
        player2Score = 0;
        player1ScoreElement.textContent = player1Score;
        player2ScoreElement.textContent = player2Score;
        
        // Huidige speler resetten
        currentPlayer = 1;
        isAiTurn = false;
        updateCurrentPlayerDisplay();
        
        // Update speler 2 naam
        player2NameElement.textContent = isSinglePlayer ? 'Computer' : 'Speler 2';
        
        // Canvas aanpassen
        resizeCanvas();
    }
    
    // Update de weergave van de huidige speler
    function updateCurrentPlayerDisplay() {
        if (isSinglePlayer && currentPlayer === 2) {
            currentPlayerElement.textContent = isAiTurn ? 'Computer denkt na...' : 'Computer is aan de beurt';
        } else {
            currentPlayerElement.textContent = `Speler ${currentPlayer} is aan de beurt`;
        }
        
        if (currentPlayer === 1) {
            currentPlayerElement.style.color = player1Color;
        } else {
            currentPlayerElement.style.color = player2Color;
        }
    }
    
    // Spel tekenen
    function drawGame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Tekent de stippen
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const x = j * cellSize + cellSize / 2;
                const y = i * cellSize + cellSize / 2;
                
                ctx.beginPath();
                ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
                ctx.fillStyle = dotColor;
                ctx.fill();
            }
        }
        
        // Tekent de horizontale lijnen
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize - 1; j++) {
                const x1 = j * cellSize + cellSize / 2;
                const y1 = i * cellSize + cellSize / 2;
                const x2 = (j + 1) * cellSize + cellSize / 2;
                const y2 = i * cellSize + cellSize / 2;
                
                if (horizontalLines[i][j] !== 0) {
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.strokeStyle = (horizontalLines[i][j] === 1) ? player1Color : player2Color;
                    ctx.lineWidth = lineWidth;
                    ctx.lineCap = 'round';
                    ctx.stroke();
                }
            }
        }
        
        // Tekent de verticale lijnen
        for (let i = 0; i < gridSize - 1; i++) {
            for (let j = 0; j < gridSize; j++) {
                const x1 = j * cellSize + cellSize / 2;
                const y1 = i * cellSize + cellSize / 2;
                const x2 = j * cellSize + cellSize / 2;
                const y2 = (i + 1) * cellSize + cellSize / 2;
                
                if (verticalLines[i][j] !== 0) {
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.strokeStyle = (verticalLines[i][j] === 1) ? player1Color : player2Color;
                    ctx.lineWidth = lineWidth;
                    ctx.lineCap = 'round';
                    ctx.stroke();
                }
            }
        }
        
        // Tekent de gekleurde vakjes
        for (let i = 0; i < gridSize - 1; i++) {
            for (let j = 0; j < gridSize - 1; j++) {
                if (boxes[i][j] !== 0) {
                    const x = j * cellSize + cellSize / 2 + dotRadius;
                    const y = i * cellSize + cellSize / 2 + dotRadius;
                    const size = cellSize - dotRadius * 2;
                    
                    ctx.fillStyle = (boxes[i][j] === 1) ? 
                        'rgba(52, 152, 219, 0.3)' : 'rgba(231, 76, 60, 0.3)';
                    ctx.fillRect(x, y, size, size);
                    
                    // Initiaal van de speler in het vakje
                    ctx.fillStyle = (boxes[i][j] === 1) ? player1Color : player2Color;
                    
                    // Pas fontgrootte aan op basis van rastergrootte
                    let fontSize;
                    if (gridSize > 6) {
                        fontSize = cellSize / 4;
                        // Gebruik enkel een cijfer voor grote rasters
                        ctx.font = `bold ${fontSize}px Arial`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(
                            boxes[i][j] === 1 ? '1' : '2', 
                            x + size / 2, 
                            y + size / 2
                        );
                    } else {
                        fontSize = cellSize / 3;
                        ctx.font = `bold ${fontSize}px Arial`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(
                            boxes[i][j] === 1 ? 'S1' : isSinglePlayer ? 'PC' : 'S2', 
                            x + size / 2, 
                            y + size / 2
                        );
                    }
                }
            }
        }
        
        // Teken hover-lijn als we aan het slepen zijn
        if (lastHoverLine) {
            ctx.beginPath();
            ctx.moveTo(lastHoverLine.x1, lastHoverLine.y1);
            ctx.lineTo(lastHoverLine.x2, lastHoverLine.y2);
            ctx.strokeStyle = hoverLineColor;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.stroke();
        }
    }
    
    // Vind de dichtstbijzijnde stip bij een bepaalde coördinaat
    function findClosestDot(x, y) {
        let closestDot = null;
        let minDistance = Infinity;
        
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const dotX = j * cellSize + cellSize / 2;
                const dotY = i * cellSize + cellSize / 2;
                const distance = Math.sqrt(Math.pow(x - dotX, 2) + Math.pow(y - dotY, 2));
                
                if (distance < minDistance && distance < cellSize / 2) {
                    minDistance = distance;
                    closestDot = { row: i, col: j, x: dotX, y: dotY };
                }
            }
        }
        
        return closestDot;
    }
    
    // Controleer of een lijn al getekend is
    function isLineDrawn(dot1, dot2) {
        if (dot1.row === dot2.row) {
            // Horizontale lijn
            const minCol = Math.min(dot1.col, dot2.col);
            const maxCol = Math.max(dot1.col, dot2.col);
            
            if (maxCol - minCol === 1) {
                return horizontalLines[dot1.row][minCol] !== 0;
            }
        } else if (dot1.col === dot2.col) {
            // Verticale lijn
            const minRow = Math.min(dot1.row, dot2.row);
            const maxRow = Math.max(dot1.row, dot2.row);
            
            if (maxRow - minRow === 1) {
                return verticalLines[minRow][dot1.col] !== 0;
            }
        }
        
        return true; // Ongeldige lijn
    }
    
    // Controleer of een zet een vakje compleet maakt en update scores
    function checkBoxCompletion(dot1, dot2) {
        let boxCompleted = false;
        
        if (dot1.row === dot2.row) {
            // Horizontale lijn
            const row = dot1.row;
            const minCol = Math.min(dot1.col, dot2.col);
            
            // Controleer vakje boven de lijn
            if (row > 0) {
                const boxRow = row - 1;
                const boxCol = minCol;
                
                if (horizontalLines[row - 1][boxCol] !== 0 && 
                    verticalLines[boxRow][boxCol] !== 0 && 
                    verticalLines[boxRow][boxCol + 1] !== 0 &&
                    boxes[boxRow][boxCol] === 0) {
                    
                    boxes[boxRow][boxCol] = currentPlayer;
                    boxCompleted = true;
                    
                    if (currentPlayer === 1) {
                        player1Score++;
                    } else {
                        player2Score++;
                    }
                }
            }
            
            // Controleer vakje onder de lijn
            if (row < gridSize - 1) {
                const boxRow = row;
                const boxCol = minCol;
                
                if (horizontalLines[row + 1][boxCol] !== 0 && 
                    verticalLines[boxRow][boxCol] !== 0 && 
                    verticalLines[boxRow][boxCol + 1] !== 0 &&
                    boxes[boxRow][boxCol] === 0) {
                    
                    boxes[boxRow][boxCol] = currentPlayer;
                    boxCompleted = true;
                    
                    if (currentPlayer === 1) {
                        player1Score++;
                    } else {
                        player2Score++;
                    }
                }
            }
        } else if (dot1.col === dot2.col) {
            // Verticale lijn
            const col = dot1.col;
            const minRow = Math.min(dot1.row, dot2.row);
            
            // Controleer vakje links van de lijn
            if (col > 0) {
                const boxRow = minRow;
                const boxCol = col - 1;
                
                if (horizontalLines[minRow][boxCol] !== 0 && 
                    horizontalLines[minRow + 1][boxCol] !== 0 && 
                    verticalLines[boxRow][boxCol] !== 0 &&
                    boxes[boxRow][boxCol] === 0) {
                    
                    boxes[boxRow][boxCol] = currentPlayer;
                    boxCompleted = true;
                    
                    if (currentPlayer === 1) {
                        player1Score++;
                    } else {
                        player2Score++;
                    }
                }
            }
            
            // Controleer vakje rechts van de lijn
            if (col < gridSize - 1) {
                const boxRow = minRow;
                const boxCol = col;
                
                if (horizontalLines[minRow][boxCol] !== 0 && 
                    horizontalLines[minRow + 1][boxCol] !== 0 && 
                    verticalLines[boxRow][boxCol + 1] !== 0 &&
                    boxes[boxRow][boxCol] === 0) {
                    
                    boxes[boxRow][boxCol] = currentPlayer;
                    boxCompleted = true;
                    
                    if (currentPlayer === 1) {
                        player1Score++;
                    } else {
                        player2Score++;
                    }
                }
            }
        }
        
        // Update score display
        player1ScoreElement.textContent = player1Score;
        player2ScoreElement.textContent = player2Score;
        
        // Toon een bericht als een vakje voltooid is
        if (boxCompleted) {
            if (currentPlayer === 1) {
                currentPlayerElement.textContent = "Speler 1 heeft een vakje voltooid! Extra beurt!";
            } else if (isSinglePlayer) {
                currentPlayerElement.textContent = "Computer heeft een vakje voltooid! Extra beurt!";
            } else {
                currentPlayerElement.textContent = "Speler 2 heeft een vakje voltooid! Extra beurt!";
            }
        }
        
        return boxCompleted;
    }
    
    // Controleer of het spel voltooid is
    function checkGameCompletion() {
        const totalBoxes = (gridSize - 1) * (gridSize - 1);
        if (player1Score + player2Score === totalBoxes) {
            let message;
            if (player1Score > player2Score) {
                message = 'Speler 1 wint!';
            } else if (player2Score > player1Score) {
                message = isSinglePlayer ? 'Computer wint!' : 'Speler 2 wint!';
            } else {
                message = 'Gelijkspel!';
            }
            
            currentPlayerElement.textContent = message;
            gameActive = false;
            return true;
        }
        return false;
    }
    
    // Teken een lijn tussen twee stippen
    function drawLine(dot1, dot2) {
        if (!dot1 || !dot2 || !gameActive) return false;
        
        // Controleer of de stippen aangrenzend zijn
        const rowDiff = Math.abs(dot1.row - dot2.row);
        const colDiff = Math.abs(dot1.col - dot2.col);
        
        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
            // Controleer of de lijn al getekend is
            if (!isLineDrawn(dot1, dot2)) {
                if (dot1.row === dot2.row) {
                    // Horizontale lijn
                    const row = dot1.row;
                    const minCol = Math.min(dot1.col, dot2.col);
                    horizontalLines[row][minCol] = currentPlayer;
                } else {
                    // Verticale lijn
                    const col = dot1.col;
                    const minRow = Math.min(dot1.row, dot2.row);
                    verticalLines[minRow][col] = currentPlayer;
                }
                
                const boxCompleted = checkBoxCompletion(dot1, dot2);
                drawGame();
                
                if (!boxCompleted) {
                    // Wissel speler als er geen vakje voltooid is
                    currentPlayer = currentPlayer === 1 ? 2 : 1;
                    updateCurrentPlayerDisplay();
                    
                    // Als het de beurt is van de AI in single-player modus
                    if (isSinglePlayer && currentPlayer === 2 && gameActive) {
                        isAiTurn = true;
                        // Kort vertraging voordat de AI een zet doet
                        setTimeout(() => {
                            makeAiMove();
                            isAiTurn = false;
                        }, 500);
                    }
                } else {
                    // Als een vakje is voltooid, blijft de huidige speler aan de beurt
                    // Als de AI een vakje heeft voltooid, laat de AI nog een zet doen
                    if (isSinglePlayer && currentPlayer === 2 && gameActive) {
                        isAiTurn = true;
                        // Kort vertraging voordat de AI opnieuw een zet doet
                        setTimeout(() => {
                            makeAiMove();
                            isAiTurn = false;
                        }, 500);
                    }
                }
                
                // Controleer of het spel voltooid is
                checkGameCompletion();
                
                return true;
            }
        }
        
        return false;
    }
    
    // AI-zet maken
    function makeAiMove() {
        if (!gameActive) {
            isAiTurn = false;
            return;
        }
        
        // Zoek eerst een zet die een vakje kan voltooien
        const completeBoxMove = findMoveToCompleteBox();
        if (completeBoxMove) {
            drawLine(
                { row: completeBoxMove.dot1.row, col: completeBoxMove.dot1.col, x: 0, y: 0 },
                { row: completeBoxMove.dot2.row, col: completeBoxMove.dot2.col, x: 0, y: 0 }
            );
            return;
        }
        
        // Zoek een veilige zet op basis van moeilijkheidsgraad
        switch(aiLevel) {
            case 'easy':
                // Op eenvoudig niveau: kies een willekeurige zet
                makeRandomAiMove();
                break;
            case 'medium':
                // Op gemiddeld niveau: vermijd meestal zetten die een vakje opzetten voor voltooiing
                if (Math.random() < 0.7) {
                    makeSmartAiMove();
                } else {
                    makeRandomAiMove();
                }
                break;
            case 'hard':
                // Op moeilijk niveau: vermijd bijna altijd zetten die een vakje opzetten voor voltooiing
                if (Math.random() < 0.9) {
                    makeSmartAiMove();
                } else {
                    makeRandomAiMove();
                }
                break;
        }
    }
    
    // Vind een zet die een vakje compleet maakt
    function findMoveToCompleteBox() {
        // Controleer horizontale lijnen
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize - 1; j++) {
                if (horizontalLines[i][j] === 0) {
                    // Zet tijdelijk deze lijn
                    horizontalLines[i][j] = 2;
                    
                    // Controleer of het een vakje zou voltooien
                    const dot1 = { row: i, col: j };
                    const dot2 = { row: i, col: j + 1 };
                    let wouldCompleteBox = false;
                    
                    // Controleer vakje boven
                    if (i > 0) {
                        if (horizontalLines[i - 1][j] !== 0 && 
                            verticalLines[i - 1][j] !== 0 && 
                            verticalLines[i - 1][j + 1] !== 0) {
                            wouldCompleteBox = true;
                        }
                    }
                    
                    // Controleer vakje onder
                    if (i < gridSize - 1) {
                        if (horizontalLines[i + 1][j] !== 0 && 
                            verticalLines[i][j] !== 0 && 
                            verticalLines[i][j + 1] !== 0) {
                            wouldCompleteBox = true;
                        }
                    }
                    
                    // Ongedaan maken van de tijdelijke zet
                    horizontalLines[i][j] = 0;
                    
                    if (wouldCompleteBox) {
                        return { dot1, dot2 };
                    }
                }
            }
        }
        
        // Controleer verticale lijnen
        for (let i = 0; i < gridSize - 1; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (verticalLines[i][j] === 0) {
                    // Zet tijdelijk deze lijn
                    verticalLines[i][j] = 2;
                    
                    // Controleer of het een vakje zou voltooien
                    const dot1 = { row: i, col: j };
                    const dot2 = { row: i + 1, col: j };
                    let wouldCompleteBox = false;
                    
                    // Controleer vakje links
                    if (j > 0) {
                        if (verticalLines[i][j - 1] !== 0 && 
                            horizontalLines[i][j - 1] !== 0 && 
                            horizontalLines[i + 1][j - 1] !== 0) {
                            wouldCompleteBox = true;
                        }
                    }
                    
                    // Controleer vakje rechts
                    if (j < gridSize - 1) {
                        if (verticalLines[i][j + 1] !== 0 && 
                            horizontalLines[i][j] !== 0 && 
                            horizontalLines[i + 1][j] !== 0) {
                            wouldCompleteBox = true;
                        }
                    }
                    
                    // Ongedaan maken van de tijdelijke zet
                    verticalLines[i][j] = 0;
                    
                    if (wouldCompleteBox) {
                        return { dot1, dot2 };
                    }
                }
            }
        }
        
        return null;
    }
    
    // Vind en vermijd zetten die leiden tot een gemakkelijke voltooiing
    function makeSmartAiMove() {
        const possibleMoves = [];
        const riskyMoves = [];
        
        // Verzamel alle mogelijke zetten
        // Horizontale lijnen
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize - 1; j++) {
                if (horizontalLines[i][j] === 0) {
                    const dot1 = { row: i, col: j, x: 0, y: 0 };
                    const dot2 = { row: i, col: j + 1, x: 0, y: 0 };
                    
                    let isRisky = false;
                    
                    // Controleer of deze zet leidt tot een situatie met 3 lijnen van een vakje
                    // Controleer vakje boven
                    if (i > 0) {
                        let linesDrawn = 0;
                        if (horizontalLines[i - 1][j] !== 0) linesDrawn++;
                        if (verticalLines[i - 1][j] !== 0) linesDrawn++;
                        if (verticalLines[i - 1][j + 1] !== 0) linesDrawn++;
                        
                        if (linesDrawn === 2) isRisky = true;
                    }
                    
                    // Controleer vakje onder
                    if (i < gridSize - 1) {
                        let linesDrawn = 0;
                        if (horizontalLines[i + 1][j] !== 0) linesDrawn++;
                        if (verticalLines[i][j] !== 0) linesDrawn++;
                        if (verticalLines[i][j + 1] !== 0) linesDrawn++;
                        
                        if (linesDrawn === 2) isRisky = true;
                    }
                    
                    if (isRisky) {
                        riskyMoves.push({ dot1, dot2 });
                    } else {
                        possibleMoves.push({ dot1, dot2 });
                    }
                }
            }
        }
        
        // Verticale lijnen
        for (let i = 0; i < gridSize - 1; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (verticalLines[i][j] === 0) {
                    const dot1 = { row: i, col: j, x: 0, y: 0 };
                    const dot2 = { row: i + 1, col: j, x: 0, y: 0 };
                    
                    let isRisky = false;
                    
                    // Controleer vakje links
                    if (j > 0) {
                        let linesDrawn = 0;
                        if (verticalLines[i][j - 1] !== 0) linesDrawn++;
                        if (horizontalLines[i][j - 1] !== 0) linesDrawn++;
                        if (horizontalLines[i + 1][j - 1] !== 0) linesDrawn++;
                        
                        if (linesDrawn === 2) isRisky = true;
                    }
                    
                    // Controleer vakje rechts
                    if (j < gridSize - 1) {
                        let linesDrawn = 0;
                        if (verticalLines[i][j + 1] !== 0) linesDrawn++;
                        if (horizontalLines[i][j] !== 0) linesDrawn++;
                        if (horizontalLines[i + 1][j] !== 0) linesDrawn++;
                        
                        if (linesDrawn === 2) isRisky = true;
                    }
                    
                    if (isRisky) {
                        riskyMoves.push({ dot1, dot2 });
                    } else {
                        possibleMoves.push({ dot1, dot2 });
                    }
                }
            }
        }
        
        let selectedMove;
        
        // Kies bij voorkeur een niet-riskante zet
        if (possibleMoves.length > 0) {
            selectedMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        } else if (riskyMoves.length > 0) {
            // Als er geen veilige zetten zijn, kies dan een riskante
            selectedMove = riskyMoves[Math.floor(Math.random() * riskyMoves.length)];
        } else {
            // Geen zetten beschikbaar (zou niet moeten gebeuren)
            return;
        }
        
        drawLine(selectedMove.dot1, selectedMove.dot2);
    }
    
    // Willekeurige AI-zet maken
    function makeRandomAiMove() {
        const availableMoves = [];
        
        // Verzamel alle mogelijke zetten
        // Horizontale lijnen
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize - 1; j++) {
                if (horizontalLines[i][j] === 0) {
                    availableMoves.push({
                        dot1: { row: i, col: j, x: 0, y: 0 },
                        dot2: { row: i, col: j + 1, x: 0, y: 0 }
                    });
                }
            }
        }
        
        // Verticale lijnen
        for (let i = 0; i < gridSize - 1; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (verticalLines[i][j] === 0) {
                    availableMoves.push({
                        dot1: { row: i, col: j, x: 0, y: 0 },
                        dot2: { row: i + 1, col: j, x: 0, y: 0 }
                    });
                }
            }
        }
        
        if (availableMoves.length > 0) {
            const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
            drawLine(randomMove.dot1, randomMove.dot2);
        }
    }
    
    // Event listeners
    function handleMouseDown(e) {
        if (isAiTurn || !gameActive) return;
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        startDot = findClosestDot(mouseX, mouseY);
        if (startDot) {
            isDragging = true;
        }
    }
    
    function handleMouseMove(e) {
        if (!isDragging || !startDot || isAiTurn || !gameActive) return;
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Vind de dichtstbijzijnde stip voor huidige muispositie
        const closestDot = findClosestDot(mouseX, mouseY);
        
        // Reset laatste hover-lijn
        lastHoverLine = null;
        
        if (closestDot && startDot !== closestDot) {
            // Controleer of het een geldige lijn zou zijn
            const rowDiff = Math.abs(startDot.row - closestDot.row);
            const colDiff = Math.abs(startDot.col - closestDot.col);
            
            if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
                if (!isLineDrawn(startDot, closestDot)) {
                    // Toon hover-lijn
                    lastHoverLine = {
                        x1: startDot.x,
                        y1: startDot.y,
                        x2: closestDot.x,
                        y2: closestDot.y
                    };
                }
            }
        }
        
        drawGame();
    }
    
    function handleMouseUp(e) {
        if (!isDragging || !startDot || isAiTurn || !gameActive) {
            isDragging = false;
            return;
        }
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const endDot = findClosestDot(mouseX, mouseY);
        drawLine(startDot, endDot);
        
        isDragging = false;
        startDot = null;
        lastHoverLine = null;
    }
    
    function handleTouchStart(e) {
        if (isAiTurn || !gameActive) return;
        
        e.preventDefault();
        if (e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        startDot = findClosestDot(touchX, touchY);
        if (startDot) {
            isDragging = true;
        }
    }
    
    function handleTouchMove(e) {
        if (!isDragging || !startDot || isAiTurn || !gameActive) return;
        
        e.preventDefault();
        if (e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        // Vind de dichtstbijzijnde stip voor huidige touch positie
        const closestDot = findClosestDot(touchX, touchY);
        
        // Reset laatste hover-lijn
        lastHoverLine = null;
        
        if (closestDot && startDot !== closestDot) {
            // Controleer of het een geldige lijn zou zijn
            const rowDiff = Math.abs(startDot.row - closestDot.row);
            const colDiff = Math.abs(startDot.col - closestDot.col);
            
            if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
                if (!isLineDrawn(startDot, closestDot)) {
                    // Toon hover-lijn
                    lastHoverLine = {
                        x1: startDot.x,
                        y1: startDot.y,
                        x2: closestDot.x,
                        y2: closestDot.y
                    };
                }
            }
        }
        
        drawGame();
    }
    
    function handleTouchEnd(e) {
        if (!isDragging || !startDot || isAiTurn || !gameActive) {
            isDragging = false;
            return;
        }
        
        e.preventDefault();
        
        // Gebruik de laatste touch positie
        if (e.changedTouches.length > 0) {
            const touch = e.changedTouches[0];
            const rect = canvas.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            
            const endDot = findClosestDot(touchX, touchY);
            drawLine(startDot, endDot);
        }
        
        isDragging = false;
        startDot = null;
        lastHoverLine = null;
    }
    
    // Event listeners toevoegen
    newGameBtn.addEventListener('click', initGame);
    restartBtn.addEventListener('click', initGame);
    
    // Event listeners voor muis en touch
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    
    // Touch event listeners voor iPad-ondersteuning
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Resize event
    window.addEventListener('resize', resizeCanvas);
    
    // Initialiseer het spel
    initGame();
}); 
document.addEventListener('DOMContentLoaded', () => {
    // Canvas en context ophalen
    const canvas = document.getElementById('game-board');
    const ctx = canvas.getContext('2d');
    
    // UI-elementen
    const gridSizeSelect = document.getElementById('grid-size');
    const newGameBtn = document.getElementById('new-game-btn');
    const restartBtn = document.getElementById('restart-btn');
    const player1ScoreElement = document.querySelector('.player1 .player-score');
    const player2ScoreElement = document.querySelector('.player2 .player-score');
    const currentPlayerElement = document.querySelector('.current-player');
    
    // Spelconfiguratie
    let gridSize = parseInt(gridSizeSelect.value);
    let cellSize = 60;
    let dotRadius = 5;
    let lineWidth = 4;
    let currentPlayer = 1;
    let player1Score = 0;
    let player2Score = 0;
    
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
        updateCurrentPlayerDisplay();
        
        // Canvas aanpassen
        resizeCanvas();
    }
    
    // Update de weergave van de huidige speler
    function updateCurrentPlayerDisplay() {
        currentPlayerElement.textContent = `Speler ${currentPlayer} is aan de beurt`;
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
                            boxes[i][j] === 1 ? 'S1' : 'S2', 
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
                message = 'Speler 2 wint!';
            } else {
                message = 'Gelijkspel!';
            }
            
            currentPlayerElement.textContent = message;
            return true;
        }
        return false;
    }
    
    // Teken een lijn tussen twee stippen
    function drawLine(dot1, dot2) {
        if (!dot1 || !dot2) return false;
        
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
                }
                
                // Controleer of het spel voltooid is
                checkGameCompletion();
                
                return true;
            }
        }
        
        return false;
    }
    
    // Event listeners
    function handleMouseDown(e) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        startDot = findClosestDot(mouseX, mouseY);
        if (startDot) {
            isDragging = true;
        }
    }
    
    function handleMouseMove(e) {
        if (!isDragging || !startDot) return;
        
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
        if (!isDragging || !startDot) {
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
        e.preventDefault();
        if (!isDragging || !startDot || e.touches.length !== 1) return;
        
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
        e.preventDefault();
        if (!isDragging || !startDot) {
            isDragging = false;
            return;
        }
        
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
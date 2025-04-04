document.addEventListener('DOMContentLoaded', () => {
    // Spelstatus variabelen
    let currentPlayer = 'x'; // 'x' begint het spel
    let nextBoardIndex = null; // Eerste zet mag overal
    let gameEnded = false;
    
    // Bord data structuren
    const boardState = Array(9).fill().map(() => Array(9).fill(null));
    const bigBoardState = Array(9).fill(null);
    
    // DOM elementen
    const gameBoard = document.getElementById('game-board');
    const statusMessage = document.getElementById('status-message');
    const restartButton = document.getElementById('restart-btn');
    const playerX = document.getElementById('player-x');
    const playerO = document.getElementById('player-o');
    
    // Maak het spelboard
    createGameBoard();
    updatePlayerInfo();
    
    // Event listener voor herstart knop
    restartButton.addEventListener('click', restartGame);
    
    // Functie om het speelbord te maken
    function createGameBoard() {
        gameBoard.innerHTML = '';
        
        for (let i = 0; i < 9; i++) {
            const bigCell = document.createElement('div');
            bigCell.classList.add('big-cell');
            bigCell.dataset.index = i;
            
            for (let j = 0; j < 9; j++) {
                const smallCell = document.createElement('div');
                smallCell.classList.add('small-cell');
                smallCell.dataset.bigIndex = i;
                smallCell.dataset.smallIndex = j;
                
                // Voeg event listener toe
                smallCell.addEventListener('click', () => handleCellClick(i, j));
                
                bigCell.appendChild(smallCell);
            }
            
            gameBoard.appendChild(bigCell);
        }
        
        // Markeer alle borden als actief bij het begin van het spel
        if (nextBoardIndex === null) {
            document.querySelectorAll('.big-cell').forEach(cell => {
                cell.classList.add('active');
            });
        }
    }
    
    // Functie om een zet te verwerken
    function handleCellClick(bigIndex, smallIndex) {
        // Controleer of het spel beëindigd is
        if (gameEnded) return;
        
        // Controleer of de zet geldig is
        if (!isValidMove(bigIndex, smallIndex)) return;
        
        // Update het bord
        boardState[bigIndex][smallIndex] = currentPlayer;
        updateCellUI(bigIndex, smallIndex);
        
        // Controleer of het kleine bord is gewonnen
        const smallBoardResult = checkWinCondition(boardState[bigIndex]);
        if (smallBoardResult) {
            bigBoardState[bigIndex] = smallBoardResult;
            updateBigCellUI(bigIndex, smallBoardResult);
            
            // Controleer of het grote bord is gewonnen
            const bigBoardResult = checkWinCondition(bigBoardState);
            if (bigBoardResult) {
                endGame(bigBoardResult);
                return;
            }
        }
        
        // Controleer of het grote bord gelijk is gespeeld
        if (checkDraw(bigBoardState)) {
            endGame('draw');
            return;
        }
        
        // Bepaal het volgende bord
        nextBoardIndex = isPlayableBigCell(smallIndex) ? smallIndex : null;
        
        // Wissel speler
        currentPlayer = currentPlayer === 'x' ? 'o' : 'x';
        
        // Update UI
        updateActiveBoards();
        updateStatusMessage();
        updatePlayerInfo();
    }
    
    // Controleer of een zet geldig is
    function isValidMove(bigIndex, smallIndex) {
        // Als het bord vol of gewonnen is
        if (bigBoardState[bigIndex] !== null) return false;
        
        // Als de cel al bezet is
        if (boardState[bigIndex][smallIndex] !== null) return false;
        
        // Als een specifiek bord is aangewezen en dit is niet dat bord
        if (nextBoardIndex !== null && bigIndex !== nextBoardIndex) return false;
        
        return true;
    }
    
    // Controleer of een groot bord nog speelbaar is
    function isPlayableBigCell(index) {
        // Als het bord al gewonnen of gelijkgespeeld is
        if (bigBoardState[index] !== null) return false;
        
        // Als het bord vol is
        return !boardState[index].every(cell => cell !== null);
    }
    
    // Update het UI voor een cel
    function updateCellUI(bigIndex, smallIndex) {
        const smallCell = document.querySelector(`.small-cell[data-big-index="${bigIndex}"][data-small-index="${smallIndex}"]`);
        smallCell.classList.add(currentPlayer);
    }
    
    // Update het UI voor een groot bord
    function updateBigCellUI(bigIndex, result) {
        const bigCell = document.querySelector(`.big-cell[data-index="${bigIndex}"]`);
        
        if (result === 'x') {
            bigCell.classList.add('won-x');
        } else if (result === 'o') {
            bigCell.classList.add('won-o');
        } else if (result === 'draw') {
            bigCell.classList.add('draw');
        }
    }
    
    // Update welke borden actief zijn
    function updateActiveBoards() {
        // Verwijder de actieve klasse van alle borden
        document.querySelectorAll('.big-cell').forEach(cell => {
            cell.classList.remove('active');
        });
        
        // Als de volgende zet overal mag zijn, markeer alle speelbare borden als actief
        if (nextBoardIndex === null) {
            for (let i = 0; i < 9; i++) {
                if (isPlayableBigCell(i)) {
                    document.querySelector(`.big-cell[data-index="${i}"]`).classList.add('active');
                }
            }
        } 
        // Anders markeer alleen het aangewezen bord als actief
        else {
            document.querySelector(`.big-cell[data-index="${nextBoardIndex}"]`).classList.add('active');
        }
    }
    
    // Update status bericht
    function updateStatusMessage() {
        const playerSymbol = currentPlayer === 'x' ? '🌹' : '🌻';
        const playerNumber = currentPlayer === 'x' ? '1' : '2';
        
        if (nextBoardIndex === null) {
            statusMessage.textContent = `Speler ${playerNumber} (${playerSymbol}) mag overal spelen!`;
        } else {
            statusMessage.textContent = `Speler ${playerNumber} (${playerSymbol}) moet in het gemarkeerde bord spelen!`;
        }
    }
    
    // Update speler info voor huidige beurt
    function updatePlayerInfo() {
        playerX.classList.toggle('active', currentPlayer === 'x');
        playerO.classList.toggle('active', currentPlayer === 'o');
    }
    
    // Controleer winconditie
    function checkWinCondition(board) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // horizontaal
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // verticaal
            [0, 4, 8], [2, 4, 6]             // diagonaal
        ];
        
        // Controleer op een winnaar
        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a]; // Geeft 'x' of 'o' terug
            }
        }
        
        // Controleer op gelijkspel
        if (checkDraw(board)) {
            return 'draw';
        }
        
        return null; // Geen winnaar of gelijkspel
    }
    
    // Controleer op gelijkspel
    function checkDraw(board) {
        return board.every(cell => cell !== null);
    }
    
    // Beëindig het spel
    function endGame(result) {
        gameEnded = true;
        
        if (result === 'x') {
            statusMessage.textContent = 'Speler 1 (🌹) heeft gewonnen! 🎉';
        } else if (result === 'o') {
            statusMessage.textContent = 'Speler 2 (🌻) heeft gewonnen! 🎉';
        } else {
            statusMessage.textContent = 'Gelijkspel! 🤝';
        }
    }
    
    // Herstart het spel
    function restartGame() {
        // Reset spelstatus
        currentPlayer = 'x';
        nextBoardIndex = null;
        gameEnded = false;
        
        // Reset borden
        for (let i = 0; i < 9; i++) {
            bigBoardState[i] = null;
            for (let j = 0; j < 9; j++) {
                boardState[i][j] = null;
            }
        }
        
        // Reset UI
        createGameBoard();
        updateStatusMessage();
        updatePlayerInfo();
        
        statusMessage.textContent = 'Speler 1 (🌹) begint het spel!';
    }
}); 
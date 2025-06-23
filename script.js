document.addEventListener('DOMContentLoaded', () => {
    // Game state
    const gameState = {
        score: 0,
        round: 1,
        maxRounds: 5,
        timer: 10,
        isMemorizePhase: false,
        isSolvePhase: false,
        selectedTiles: [],
        currentEquation: [],
        tiles: {
            'A': { value: '', flipped: false },
            'B': { value: '', flipped: false },
            'C': { value: '', flipped: false },
            'D': { value: '', flipped: false },
            'E': { value: '', flipped: false },
            'F': { value: '', flipped: false },
            'G': { value: '', flipped: false },
            'H': { value: '', flipped: false },
            'I': { value: '', flipped: false },
            'J': { value: '', flipped: false }
        },
        targetValue: 0,
        timerInterval: null
    };

    // DOM elements
    const elements = {
        score: document.getElementById('score'),
        timer: document.getElementById('timer'),
        round: document.getElementById('round'),
        targetValue: document.getElementById('target-value'),
        equationDisplay: document.getElementById('equation-display'),
        resultMessage: document.getElementById('result-message'),
        checkBtn: document.getElementById('check-btn'),
        resetBtn: document.getElementById('reset-btn'),
        tiles: document.querySelectorAll('.tile'),
        flipSound: document.getElementById('flip-sound'),
        correctSound: document.getElementById('correct-sound'),
        wrongSound: document.getElementById('wrong-sound')
    };

    // Initialize and start game automatically
    initGame();
    startGame();

    // Event listeners
    elements.checkBtn.addEventListener('click', checkAnswer);
    elements.resetBtn.addEventListener('click', resetGame);

    elements.tiles.forEach(tile => {
        tile.addEventListener('click', () => handleTileClick(tile));
    });

    function initGame() {
        updateUI();
    }

    function startGame() {
        if (gameState.isMemorizePhase || gameState.isSolvePhase) return;
        
        // Reset game state for new round
        gameState.selectedTiles = [];
        gameState.currentEquation = [];
        elements.equationDisplay.textContent = '';
        elements.resultMessage.textContent = '';
        elements.resultMessage.className = 'result';
        
        // Generate random tile values and target
        generateTileValues();
        generateTargetValue();
        
        // Show values on tiles
        updateTilesUI(true);
        
        // Start memorize phase
        gameState.isMemorizePhase = true;
        gameState.timer = 10;
        updateUI();
        
        // Disable check button during memorize phase
        elements.checkBtn.disabled = true;
        
        // Start timer
        startTimer(() => {
            // Timer ended - flip tiles
            flipAllTiles();
            gameState.isMemorizePhase = false;
            gameState.isSolvePhase = true;
            elements.checkBtn.disabled = false;
        });
    }

    function generateTileValues() {
        const operations = ['+', '-', '×', '÷'];
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        // Generate values - ALL tiles will have operations
        const values = [];
        
        for (let i = 0; i < 10; i++) {
            const op = operations[Math.floor(Math.random() * operations.length)];
            const num = numbers[Math.floor(Math.random() * numbers.length)];
            values.push(`${op}${num}`);
        }
        
        // Assign to tiles
        let index = 0;
        for (const tileId in gameState.tiles) {
            gameState.tiles[tileId].value = values[index++];
            gameState.tiles[tileId].flipped = false;
        }
    }

    function generateTargetValue() {
        // Random target between -30 and 30
        gameState.targetValue = Math.floor(Math.random() * 61) - 30;
        elements.targetValue.textContent = gameState.targetValue;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function startTimer(callback) {
        clearInterval(gameState.timerInterval);
        elements.timer.textContent = gameState.timer;
        
        gameState.timerInterval = setInterval(() => {
            gameState.timer--;
            elements.timer.textContent = gameState.timer;
            
            if (gameState.timer <= 0) {
                clearInterval(gameState.timerInterval);
                callback();
            }
        }, 1000);
    }

    function updateTilesUI(showValues) {
        elements.tiles.forEach(tile => {
            const tileId = tile.dataset.id;
            const tileData = gameState.tiles[tileId];
            
            // Always set the letter (A-J)
            tile.setAttribute('data-id', tileId);
            
            if (showValues) {
                tile.setAttribute('data-value', tileData.value);
            } else {
                tile.setAttribute('data-value', '');
            }
            
            if (tileData.flipped) {
                tile.classList.add('flipped');
            } else {
                tile.classList.remove('flipped');
            }
        });
    }

    function flipAllTiles() {
        elements.flipSound.play();
        
        elements.tiles.forEach(tile => {
            const tileId = tile.dataset.id;
            gameState.tiles[tileId].flipped = true;
            tile.classList.add('flipped');
            tile.setAttribute('data-value', '');
        });
    }

    function handleTileClick(tile) {
        if (!gameState.isSolvePhase) return;
        
        const tileId = tile.dataset.id;
        
        // Don't allow selecting the same tile twice in sequence
        if (gameState.selectedTiles.includes(tileId)) return;
        
        // Limit to 4 tiles in equation
        if (gameState.selectedTiles.length >= 4) return;
        
        // Add to selected tiles
        gameState.selectedTiles.push(tileId);
        tile.classList.add('selected');
        
        // Temporarily show the value when tile is selected
        tile.setAttribute('data-value', gameState.tiles[tileId].value);
        tile.classList.remove('flipped');
        
        // Show equation being built
        updateEquationDisplay();
    }

    function updateEquationDisplay() {
        const equationParts = gameState.selectedTiles.map(tileId => {
            return gameState.tiles[tileId].value;
        });
        elements.equationDisplay.textContent = equationParts.join(' ');
    }

    function checkAnswer() {
        if (gameState.selectedTiles.length < 2) {
            showResult('Select at least 2 tiles', 'error');
            return;
        }
        
        // Get the equation parts
        const equationParts = gameState.selectedTiles.map(tileId => {
            return gameState.tiles[tileId].value;
        });
        
        // Convert to a string we can evaluate
        let equationStr = equationParts.join('').replace(/×/g, '*').replace(/÷/g, '/');
        
        try {
            // Calculate result
            const result = eval(equationStr);
            
            if (result === gameState.targetValue) {
                // Correct answer
                gameState.score++;
                showResult('Correct! +1 point', 'success');
                elements.correctSound.play();
                
                // Move to next round or end game
                setTimeout(() => {
                    if (gameState.round < gameState.maxRounds) {
                        gameState.round++;
                        startGame();
                    } else {
                        endGame();
                    }
                }, 1500);
            } else {
                // Wrong answer
                showResult(`Wrong! Got ${result}, needed ${gameState.targetValue}`, 'error');
                elements.wrongSound.play();
                
                // Flip tiles back after delay
                setTimeout(() => {
                    resetSelection();
                }, 1500);
            }
        } catch (e) {
            showResult('Invalid equation', 'error');
            elements.wrongSound.play();
            resetSelection();
        }
    }

    function showResult(message, type) {
        elements.resultMessage.textContent = message;
        elements.resultMessage.className = 'result ' + type;
    }

    function resetSelection() {
        gameState.selectedTiles.forEach(tileId => {
            const tile = document.getElementById(`tile-${tileId}`);
            tile.classList.remove('selected');
            tile.classList.add('flipped');
            tile.setAttribute('data-value', '');
        });
        gameState.selectedTiles = [];
        elements.equationDisplay.textContent = '';
    }

    function endGame() {
        gameState.isSolvePhase = false;
        elements.checkBtn.disabled = true;
        showResult(`Game over! Final score: ${gameState.score}`, 'success');
    }

    function resetGame() {
        clearInterval(gameState.timerInterval);
        
        gameState.score = 0;
        gameState.round = 1;
        gameState.timer = 10;
        gameState.isMemorizePhase = false;
        gameState.isSolvePhase = false;
        gameState.selectedTiles = [];
        gameState.currentEquation = [];
        
        elements.equationDisplay.textContent = '';
        elements.resultMessage.textContent = '';
        elements.resultMessage.className = 'result';
        
        // Reset tiles
        elements.tiles.forEach(tile => {
            tile.classList.remove('flipped', 'selected');
            tile.setAttribute('data-value', '');
        });
        
        updateUI();
        elements.checkBtn.disabled = true;
        
        // Restart game automatically
        setTimeout(startGame, 500);
    }

    function updateUI() {
        elements.score.textContent = gameState.score;
        elements.round.textContent = `${gameState.round}/${gameState.maxRounds}`;
        elements.timer.textContent = gameState.timer;
    }
});
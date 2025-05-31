// ===== VARIABLES GLOBALES =====
let sudokuGrid = [];
let originalGrid = [];
let isAnimating = false;
let animationSpeed = 200;
let stepCount = 0;
let startTime = null;
let timeInterval = null;
let currentAlgorithm = '';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=';

// Canvas pour la visualisation de l'arbre
let canvas, ctx;
let treeNodes = [];
let currentLevel = 0;
let maxNodesPerLevel = 6;

// ===== INITIALISATION =====
window.onload = function() {
    initializeGrid();
    generateNewPuzzle();
    initializeCanvas();
    logToConsole('🎯 Application Sudoku initialisée', 'success');
};

function initializeGrid() {
    const grid = document.getElementById('sudokuGrid');
    grid.innerHTML = '';
    
    for (let i = 0; i < 81; i++) {
        const cell = document.createElement('input');
        cell.type = 'text';
        cell.className = 'sudoku-cell';
        cell.maxLength = 1;
        cell.id = `cell-${i}`;
        
        cell.addEventListener('input', function(e) {
            const value = e.target.value;
            if (!/^[1-9]$/.test(value)) {
                e.target.value = '';
            } else {
                const row = Math.floor(i / 9);
                const col = i % 9;
                sudokuGrid[row][col] = parseInt(value);
            }
        });
        
        grid.appendChild(cell);
    }
    
    // Initialiser la grille
    sudokuGrid = Array(9).fill().map(() => Array(9).fill(0));
}

function initializeCanvas() {
    canvas = document.getElementById('treeCanvas');
    ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        drawWelcomeMessage();
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function drawWelcomeMessage() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#666';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🌳 Arbre de recherche', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText('Lancez un algorithme pour voir la visualisation', canvas.width / 2, canvas.height / 2 + 15);
}

// ===== INTÉGRATION API GEMINI =====
async function callGeminiAPI(prompt) {
    try {
        const response = await fetch(`${GEMINI_API_URL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`Erreur API: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Erreur API Gemini:', error);
        return getFallbackResponse(prompt);
    }
}

function getFallbackResponse(message) {
    const responses = {
        'bfs': 'BFS explore niveau par niveau, garantissant la solution optimale mais utilisant plus de mémoire.',
        'dfs': 'DFS explore en profondeur avec backtracking, plus économe en mémoire mais potentiellement plus lent.',
        'différence': 'BFS trouve la solution la plus courte, DFS trouve une solution rapidement.',
        'complexité': 'BFS: O(b^d) en espace, DFS: O(bd) en espace où b=facteur de branchement, d=profondeur.',
        'sudoku': 'Le Sudoku illustre parfaitement les algorithmes de recherche avec contraintes.',
        'algorithme': 'Les algorithmes de recherche sont essentiels en intelligence artificielle.',
        'backtracking': 'Le backtracking revient en arrière quand une voie ne mène pas à la solution.',
        'bonjour': 'Bonjour ! Je suis votre assistant IA pour comprendre BFS et DFS.',
        'aide': 'Je peux expliquer les algorithmes, leurs différences, et leur application au Sudoku.'
    };
    
    const lowerMessage = message.toLowerCase();
    for (const [key, response] of Object.entries(responses)) {
        if (lowerMessage.includes(key)) {
            return response;
        }
    }
    
    return 'Posez-moi des questions sur BFS, DFS, leurs différences ou leur application au Sudoku !';
}

// ===== GÉNÉRATION INTELLIGENTE DE SUDOKU =====
async function generateNewPuzzle() {
    logToConsole('🔄 Génération d\'un nouveau puzzle Sudoku...', 'info');
    
    stepCount = 0;
    updateStats();
    clearTree();
    
    // Générer un puzzle valide
    const difficulty = document.getElementById('difficulty')?.value || 'medium';
    const puzzle = await generateValidSudoku(difficulty);
    
    sudokuGrid = puzzle.map(row => [...row]);
    originalGrid = sudokuGrid.map(row => [...row]);
    
    updateGridDisplay();
    logToConsole('✅ Nouveau puzzle généré avec succès', 'success');
    
    // Message IA contextuel
    const prompt = `Un nouveau puzzle Sudoku de difficulté ${difficulty} a été généré. Donne un conseil bref et encourageant sur comment l'aborder avec les algorithmes BFS ou DFS.`;
    const aiResponse = await callGeminiAPI(prompt);
    addChatMessage('ai', aiResponse);
}

async function generateValidSudoku(difficulty) {
    // Créer une grille complète
    const fullGrid = createCompleteGrid();
    
    // Retirer des cases selon la difficulté
    const cellsToRemove = {
        'easy': 35,
        'medium': 45,
        'hard': 55,
        'expert': 65
    };
    
    const removeCount = cellsToRemove[difficulty] || 45;
    return removeCells(fullGrid, removeCount);
}

function createCompleteGrid() {
    const grid = Array(9).fill().map(() => Array(9).fill(0));
    fillGrid(grid);
    return grid;
}

function fillGrid(grid) {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (grid[row][col] === 0) {
                // Mélanger les nombres pour la randomisation
                for (let i = nums.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [nums[i], nums[j]] = [nums[j], nums[i]];
                }
                
                for (const num of nums) {
                    if (isValidMove(grid, row, col, num)) {
                        grid[row][col] = num;
                        
                        if (fillGrid(grid)) {
                            return true;
                        }
                        
                        grid[row][col] = 0;
                    }
                }
                
                return false;
            }
        }
    }
    
    return true;
}

function removeCells(grid, count) {
    const puzzle = grid.map(row => [...row]);
    let removed = 0;
    
    while (removed < count) {
        const row = Math.floor(Math.random() * 9);
        const col = Math.floor(Math.random() * 9);
        
        if (puzzle[row][col] !== 0) {
            const backup = puzzle[row][col];
            puzzle[row][col] = 0;
            
            // Vérifier si le puzzle reste solvable
            if (hasUniqueSolution(puzzle)) {
                removed++;
            } else {
                puzzle[row][col] = backup;
            }
        }
    }
    
    return puzzle;
}

function hasUniqueSolution(grid) {
    const solutions = [];
    solveSudokuCount(grid.map(row => [...row]), solutions, 2);
    return solutions.length === 1;
}

function solveSudokuCount(grid, solutions, maxSolutions) {
    if (solutions.length >= maxSolutions) return;
    
    const emptyCell = findNextEmpty(grid);
    if (!emptyCell) {
        solutions.push(grid.map(row => [...row]));
        return;
    }
    
    const [row, col] = emptyCell;
    
    for (let num = 1; num <= 9; num++) {
        if (isValidMove(grid, row, col, num)) {
            grid[row][col] = num;
            solveSudokuCount(grid, solutions, maxSolutions);
            grid[row][col] = 0;
        }
    }
}

// ===== VALIDATION SUDOKU AMÉLIORÉE =====
function isValidMove(grid, row, col, num) {
    // Vérification ligne
    for (let c = 0; c < 9; c++) {
        if (grid[row][c] === num) return false;
    }
    
    // Vérification colonne
    for (let r = 0; r < 9; r++) {
        if (grid[r][col] === num) return false;
    }
    
    // Vérification bloc 3x3
    const blockRow = Math.floor(row / 3) * 3;
    const blockCol = Math.floor(col / 3) * 3;
    
    for (let r = blockRow; r < blockRow + 3; r++) {
        for (let c = blockCol; c < blockCol + 3; c++) {
            if (grid[r][c] === num) return false;
        }
    }
    
    return true;
}

function findNextEmpty(grid) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (grid[row][col] === 0) {
                return [row, col];
            }
        }
    }
    return null;
}

// ===== ALGORITHME BFS CORRIGÉ =====
async function solveBFS() {
    if (isAnimating) return;
    
    logToConsole('🔍 Démarrage BFS (Breadth-First Search)', 'info');
    currentAlgorithm = 'BFS';
    isAnimating = true;
    stepCount = 0;
    startTime = Date.now();
    
    updateAlgorithmInfo('BFS', {
        name: 'Breadth-First Search',
        principle: 'Explore niveau par niveau',
        complexity: 'O(b^d) - Gourmand en mémoire',
        optimal: 'Trouve la solution optimale'
    });
    
    startTimer();
    clearTree();
    
    try {
        const workingGrid = sudokuGrid.map(row => [...row]);
        const queue = [{ 
            grid: workingGrid, 
            path: [], 
            depth: 0,
            lastMove: null 
        }];
        
        let found = false;
        let iterations = 0;
        const maxIterations = 10000;
        
        while (queue.length > 0 && !found && iterations < maxIterations) {
            iterations++;
            const current = queue.shift();
            const { grid, path, depth, lastMove } = current;
            
            // Ajouter à l'arbre de visualisation
            if (lastMove && treeNodes.length < 30) {
                addTreeNode(lastMove.row, lastMove.col, lastMove.value, depth, 'BFS');
            }
            
            const emptyCell = findNextEmpty(grid);
            
            if (!emptyCell) {
                logToConsole('🎉 Solution trouvée avec BFS !', 'success');
                await animateSolution(path);
                found = true;
                break;
            }
            
            const [row, col] = emptyCell;
            
            // Optimisation: limiter le nombre de possibilités
            const validMoves = [];
            for (let num = 1; num <= 9; num++) {
                if (isValidMove(grid, row, col, num)) {
                    validMoves.push(num);
                }
            }
            
            // Ajouter tous les mouvements valides à la queue
            for (const num of validMoves) {
                const newGrid = grid.map(r => [...r]);
                newGrid[row][col] = num;
                const newPath = [...path, { row, col, value: num }];
                
                queue.push({
                    grid: newGrid,
                    path: newPath,
                    depth: depth + 1,
                    lastMove: { row, col, value: num }
                });
            }
            
            // Mise à jour périodique
            if (iterations % 100 === 0) {
                stepCount = iterations;
                updateStats();
                await sleep(10);
            }
            
            if (iterations % 1000 === 0) {
                logToConsole(`🔄 BFS: ${iterations} états explorés, queue: ${queue.length}`, 'info');
            }
        }
        
        if (!found) {
            logToConsole('❌ BFS: Limite d\'itérations atteinte', 'error');
        }
        
    } catch (error) {
        logToConsole(`❌ Erreur BFS: ${error.message}`, 'error');
    }
    
    stopTimer();
    isAnimating = false;
}

// ===== ALGORITHME DFS CORRIGÉ =====
async function solveDFS() {
    if (isAnimating) return;
    
    logToConsole('🎯 Démarrage DFS (Depth-First Search)', 'info');
    currentAlgorithm = 'DFS';
    isAnimating = true;
    stepCount = 0;
    startTime = Date.now();
    
    updateAlgorithmInfo('DFS', {
        name: 'Depth-First Search',
        principle: 'Explore en profondeur avec backtracking',
        complexity: 'O(b^m) - Économe en mémoire',
        optimal: 'Solution rapide'
    });
    
    startTimer();
    clearTree();
    
    try {
        const workingGrid = sudokuGrid.map(row => [...row]);
        const result = await solveDFSRecursive(workingGrid, [], 0);
        
        if (result.success) {
            logToConsole('🎉 Solution trouvée avec DFS !', 'success');
            await animateSolution(result.path);
        } else {
            logToConsole('❌ DFS: Aucune solution trouvée', 'error');
        }
        
    } catch (error) {
        logToConsole(`❌ Erreur DFS: ${error.message}`, 'error');
    }
    
    stopTimer();
    isAnimating = false;
}

async function solveDFSRecursive(grid, path, depth) {
    stepCount++;
    
    if (depth > 100) { // Limite de sécurité
        return { success: false, path: [] };
    }
    
    const emptyCell = findNextEmpty(grid);
    
    if (!emptyCell) {
        return { success: true, path: [...path] };
    }
    
    const [row, col] = emptyCell;
    
    // Ajouter à l'arbre si pas trop de nœuds
    if (treeNodes.length < 30) {
        addTreeNode(row, col, 0, depth, 'DFS');
    }
    
    // Animation
    highlightCell(row, col, 'solving');
    await sleep(animationSpeed / 4);
    
    for (let num = 1; num <= 9; num++) {
        if (isValidMove(grid, row, col, num)) {
            grid[row][col] = num;
            const newPath = [...path, { row, col, value: num }];
            
            // Visualisation
            highlightCell(row, col, 'current');
            updateCellDisplay(row, col, num, 'solving');
            await sleep(animationSpeed / 3);
            
            if (stepCount % 10 === 0) {
                updateStats();
            }
            
            const result = await solveDFSRecursive(grid, newPath, depth + 1);
            
            if (result.success) {
                return result;
            }
            
            // Backtrack
            grid[row][col] = 0;
            updateCellDisplay(row, col, '', 'solving');
            await sleep(animationSpeed / 6);
        }
    }
    
    highlightCell(row, col, '');
    return { success: false, path: [] };
}

// ===== VISUALISATION D'ARBRE SIMPLIFIÉE =====
function addTreeNode(row, col, value, depth, algorithm) {
    if (treeNodes.length >= 30) return; // Limiter pour la lisibilité
    
    const nodeRadius = 20;
    const levelHeight = 60;
    const nodeSpacing = 80;
    
    // Calculer position
    const nodesAtLevel = treeNodes.filter(n => n.depth === depth).length;
    const x = (canvas.width / 2) + (nodesAtLevel - 1) * nodeSpacing - ((nodesAtLevel - 1) * nodeSpacing / 2);
    const y = 40 + depth * levelHeight;
    
    const node = {
        x: Math.max(nodeRadius, Math.min(x, canvas.width - nodeRadius)),
        y: Math.min(y, canvas.height - nodeRadius),
        row, col, value, depth, algorithm,
        id: treeNodes.length,
        isActive: true
    };
    
    treeNodes.push(node);
    drawTree();
}

function drawTree() {
    if (!ctx || treeNodes.length === 0) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Titre
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Arbre ${currentAlgorithm} - ${treeNodes.length} nœuds`, canvas.width / 2, 20);
    
    // Dessiner les connexions
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    for (let i = 1; i < treeNodes.length; i++) {
        const node = treeNodes[i];
        const parentIndex = Math.floor((i - 1) / 2);
        const parent = treeNodes[parentIndex];
        
        if (parent && node.depth > parent.depth) {
            ctx.beginPath();
            ctx.moveTo(parent.x, parent.y);
            ctx.lineTo(node.x, node.y);
            ctx.stroke();
        }
    }
    
    // Dessiner les nœuds
    treeNodes.forEach((node, index) => {
        const isLatest = index === treeNodes.length - 1;
        const isRoot = index === 0;
        
        // Cercle principal
        if (isLatest) {
            ctx.fillStyle = '#4CAF50'; // Vert pour le nœud actuel
        } else if (isRoot) {
            ctx.fillStyle = '#FF9800'; // Orange pour la racine
        } else {
            ctx.fillStyle = '#2196F3'; // Bleu pour les autres
        }
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, 18, 0, 2 * Math.PI);
        ctx.fill();
        
        // Bordure
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Texte - Position de la case
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${node.row+1},${node.col+1}`, node.x, node.y - 2);
        
        // Valeur si disponible
        if (node.value > 0) {
            ctx.font = 'bold 8px Arial';
            ctx.fillText(`(${node.value})`, node.x, node.y + 8);
        }
    });
    
    // Légende
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('🟢 Actuel', 10, canvas.height - 30);
    ctx.fillText('🟠 Racine', 10, canvas.height - 15);
    ctx.fillText('🔵 Exploré', 80, canvas.height - 30);
    ctx.fillText(`Profondeur: ${Math.max(...treeNodes.map(n => n.depth))}`, 80, canvas.height - 15);
}

function clearTree() {
    treeNodes = [];
    currentLevel = 0;
    if (ctx) {
        drawWelcomeMessage();
    }
}

// ===== CHAT IA AMÉLIORÉ =====
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addChatMessage('user', message);
    input.value = '';
    
    // Construire le prompt contextualisé
    const context = `
    Contexte: Application Sudoku avec algorithmes BFS et DFS
    Algorithme actuel: ${currentAlgorithm || 'Aucun'}
    Étapes effectuées: ${stepCount}
    État: ${isAnimating ? 'En cours de résolution' : 'En attente'}
    
    Question de l'utilisateur: ${message}
    
    Réponds de manière concise et pédagogique sur les algorithmes BFS/DFS appliqués au Sudoku.
    `;
    
    try {
        const aiResponse = await callGeminiAPI(context);
        addChatMessage('ai', aiResponse);
        logToConsole(`💬 Question IA traitée: "${message.substring(0, 30)}..."`, 'info');
    } catch (error) {
        const fallbackResponse = getFallbackResponse(message);
        addChatMessage('ai', fallbackResponse);
        logToConsole('⚠️ Utilisation de la réponse de secours', 'warning');
    }
}

function addChatMessage(sender, message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = message;
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Animation
    messageDiv.style.opacity = '0';
    messageDiv.style.transform = 'translateY(20px)';
    setTimeout(() => {
        messageDiv.style.transition = 'all 0.3s ease';
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateY(0)';
    }, 50);
}

// ===== FONCTIONS D'AFFICHAGE =====
function updateGridDisplay() {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const cellIndex = row * 9 + col;
            const cell = document.getElementById(`cell-${cellIndex}`);
            const value = sudokuGrid[row][col];
            
            if (cell) {
                cell.value = value === 0 ? '' : value;
                
                if (originalGrid[row][col] !== 0) {
                    cell.classList.add('given');
                    cell.readOnly = true;
                } else {
                    cell.classList.remove('given');
                    cell.readOnly = false;
                }
                
                cell.classList.remove('solving', 'solved', 'current');
            }
        }
    }
}

function updateCellDisplay(row, col, value, className = '') {
    const cellIndex = row * 9 + col;
    const cell = document.getElementById(`cell-${cellIndex}`);
    
    if (cell) {
        cell.value = value;
        cell.className = 'sudoku-cell';
        if (originalGrid[row][col] !== 0) {
            cell.classList.add('given');
        }
        if (className) {
            cell.classList.add(className);
        }
    }
}

function highlightCell(row, col, className) {
    const cellIndex = row * 9 + col;
    const cell = document.getElementById(`cell-${cellIndex}`);
    
    if (cell) {
        cell.classList.remove('solving', 'solved', 'current');
        if (className) {
            cell.classList.add(className);
        }
    }
}

async function animateSolution(path) {
    logToConsole('🎬 Animation de la solution...', 'info');
    
    for (const step of path) {
        const { row, col, value } = step;
        highlightCell(row, col, 'current');
        updateCellDisplay(row, col, value, 'current');
        await sleep(150);
        highlightCell(row, col, 'solved');
        updateCellDisplay(row, col, value, 'solved');
        sudokuGrid[row][col] = value;
    }
    
    logToConsole('✨ Solution animée terminée !', 'success');
}

// ===== FONCTIONS UTILITAIRES =====
function startTimer() {
    stopTimer();
    timeInterval = setInterval(updateStats, 100);
}

function stopTimer() {
    if (timeInterval) {
        clearInterval(timeInterval);
        timeInterval = null;
    }
}

function updateStats() {
    const stepsElement = document.getElementById('stepsCount');
    const timeElement = document.getElementById('timeElapsed');
    
    if (stepsElement) stepsElement.textContent = stepCount;
    
    if (timeElement && startTime) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        timeElement.textContent = `${elapsed}s`;
    }
}

function updateAlgorithmInfo(algorithm, info) {
    const infoDiv = document.getElementById('algorithmInfo');
    if (infoDiv) {
        infoDiv.innerHTML = `
            <h3>📚 ${info.name}</h3>
            <p><strong>Principe:</strong> ${info.principle}</p>
            <p><strong>Complexité:</strong> ${info.complexity}</p>
            <p><strong>Caractéristique:</strong> ${info.optimal}</p>
        `;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function logToConsole(message, type = 'info') {
    const console = document.getElementById('console');
    if (!console) return;
    
    const logDiv = document.createElement('div');
    logDiv.className = `console-log ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    logDiv.textContent = `[${timestamp}] ${message}`;
    
    console.appendChild(logDiv);
    console.scrollTop = console.scrollHeight;
    
    // Limiter les logs
    const logs = console.querySelectorAll('.console-log');
    if (logs.length > 100) {
        logs[0].remove();
    }
}

// ===== FONCTIONS SUPPLÉMENTAIRES =====
function resetGrid() {
    if (isAnimating) return;
    
    sudokuGrid = originalGrid.map(row => [...row]);
    updateGridDisplay();
    stepCount = 0;
    updateStats();
    stopTimer();
    clearTree();
    logToConsole('🔄 Grille réinitialisée', 'info');
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// ===== COMPARAISON D'ALGORITHMES =====
async function compareAlgorithms() {
    if (isAnimating) return;
    
    logToConsole('⚖️ Comparaison BFS vs DFS', 'info');
    
    const originalState = sudokuGrid.map(row => [...row]);
    const results = {};
    
    // Test BFS
    logToConsole('🔍 Test BFS...', 'info');
    await solveBFS();
    results.BFS = { steps: stepCount, time: Date.now() - startTime };
    
    await sleep(2000);
    
    // Reset et test DFS
    sudokuGrid = originalState.map(row => [...row]);
    updateGridDisplay();
    
    logToConsole('🎯 Test DFS...', 'info');
    await solveDFS();
    results.DFS = { steps: stepCount, time: Date.now() - startTime };
    
    // Analyse
    const winner = results.BFS.time < results.DFS.time ? 'BFS' : 'DFS';
    const comparison = `
📊 Résultats comparatifs:
• BFS: ${results.BFS.steps} étapes en ${results.BFS.time}ms
• DFS: ${results.DFS.steps} étapes en ${results.DFS.time}ms
🏆 Plus rapide: ${winner}
    `;
    
    logToConsole(comparison, 'success');
    
    // Message IA sur la comparaison
    const prompt = `Analyse ces résultats de comparaison d'algorithmes:
    BFS: ${results.BFS.steps} étapes en ${results.BFS.time}ms
    DFS: ${results.DFS.steps} étapes en ${results.DFS.time}ms
    Le plus rapide est ${winner}. Explique pourquoi de manière simple.`;
    
    try {
        const aiResponse = await callGeminiAPI(prompt);
        addChatMessage('ai', aiResponse);
    } catch (error) {
        addChatMessage('ai', `${winner} a été plus rapide car il explore différemment l'espace de solutions.`);
    }
}

// ===== AMÉLIORATION DE L'ARBRE DE VISUALISATION =====
function addTreeNode(row, col, value, depth, algorithm) {
    if (treeNodes.length >= 20) { // Réduire encore plus pour la clarté
        return;
    }
    
    const nodeRadius = 25;
    const levelHeight = 80;
    const maxWidth = canvas.width - 100;
    
    // Calculer la position avec meilleure répartition
    const nodesAtCurrentLevel = treeNodes.filter(n => n.depth === depth);
    const positionInLevel = nodesAtCurrentLevel.length;
    const totalAtLevel = Math.min(4, 9 - depth); // Limiter par niveau
    
    let x, y;
    
    if (depth === 0) {
        // Racine au centre
        x = canvas.width / 2;
        y = 50;
    } else {
        // Répartition équilibrée pour les autres niveaux
        const spacing = maxWidth / (totalAtLevel + 1);
        x = spacing * (positionInLevel + 1) + 50;
        y = 50 + depth * levelHeight;
    }
    
    // Vérifier les limites
    x = Math.max(nodeRadius + 10, Math.min(x, canvas.width - nodeRadius - 10));
    y = Math.min(y, canvas.height - nodeRadius - 30);
    
    const node = {
        x, y, row, col, value, depth, algorithm,
        id: treeNodes.length,
        isActive: true,
        parent: treeNodes.length > 0 ? treeNodes[treeNodes.length - 1] : null
    };
    
    treeNodes.push(node);
    drawSimplifiedTree();
}

function drawSimplifiedTree() {
    if (!ctx || treeNodes.length === 0) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // En-tête avec informations
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`🌳 Arbre ${currentAlgorithm}`, canvas.width / 2, 25);
    
    // Statistiques
    ctx.font = '12px Arial';
    ctx.fillStyle = '#7f8c8d';
    const maxDepth = treeNodes.length > 0 ? Math.max(...treeNodes.map(n => n.depth)) : 0;
    ctx.fillText(`Nœuds: ${treeNodes.length} | Profondeur max: ${maxDepth}`, canvas.width / 2, 40);
    
    // Dessiner les connexions avec style amélioré
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 2;
    
    for (let i = 1; i < treeNodes.length; i++) {
        const node = treeNodes[i];
        let parentNode = null;
        
        // Trouver le parent logique (nœud précédent de profondeur inférieure)
        for (let j = i - 1; j >= 0; j--) {
            if (treeNodes[j].depth === node.depth - 1) {
                parentNode = treeNodes[j];
                break;
            }
        }
        
        if (parentNode) {
            // Ligne courbée pour un meilleur visuel
            ctx.beginPath();
            ctx.moveTo(parentNode.x, parentNode.y + 15);
            
            const midX = (parentNode.x + node.x) / 2;
            const midY = (parentNode.y + node.y) / 2;
            
            ctx.quadraticCurveTo(midX, midY - 20, node.x, node.y - 15);
            ctx.stroke();
        }
    }
    
    // Dessiner les nœuds avec plus de détails
    treeNodes.forEach((node, index) => {
        const isLatest = index === treeNodes.length - 1;
        const isRoot = index === 0;
        
        // Ombre portée
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.arc(node.x + 2, node.y + 2, 22, 0, 2 * Math.PI);
        ctx.fill();
        
        // Cercle principal avec gradient
        if (isLatest) {
            ctx.fillStyle = '#27ae60'; // Vert vif pour le nœud actuel
        } else if (isRoot) {
            ctx.fillStyle = '#e74c3c'; // Rouge pour la racine
        } else {
            ctx.fillStyle = '#3498db'; // Bleu pour les autres
        }
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
        ctx.fill();
        
        // Bordure élégante
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Badge de profondeur
        ctx.fillStyle = '#34495e';
        ctx.beginPath();
        ctx.arc(node.x + 15, node.y - 15, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(node.depth.toString(), node.x + 15, node.y - 12);
        
        // Informations du nœud
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        
        // Position de la case (ligne, colonne)
        ctx.fillText(`R${node.row + 1}C${node.col + 1}`, node.x, node.y - 3);
        
        // Valeur testée
        if (node.value > 0) {
            ctx.font = 'bold 9px Arial';
            ctx.fillText(`Val: ${node.value}`, node.x, node.y + 8);
        } else {
            ctx.font = '8px Arial';
            ctx.fillText('Test', node.x, node.y + 8);
        }
    });
    
    // Légende améliorée
    drawLegend();
}

function drawLegend() {
    const legendX = 10;
    const legendY = canvas.height - 80;
    
    // Fond de la légende
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(legendX - 5, legendY - 25, 200, 70);
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX - 5, legendY - 25, 200, 70);
    
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#2c3e50';
    ctx.textAlign = 'left';
    ctx.fillText('Légende:', legendX, legendY - 10);
    
    // Éléments de légende
    const items = [
        { color: '#e74c3c', label: 'Racine (début)' },
        { color: '#27ae60', label: 'Nœud actuel' },
        { color: '#3498db', label: 'Nœuds explorés' }
    ];
    
    ctx.font = '10px Arial';
    items.forEach((item, i) => {
        const y = legendY + 8 + i * 15;
        
        // Cercle coloré
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(legendX + 8, y - 3, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // Texte
        ctx.fillStyle = '#2c3e50';
        ctx.fillText(item.label, legendX + 20, y);
    });
}

function clearTree() {
    treeNodes = [];
    currentLevel = 0;
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawWelcomeMessage();
    }
}

function drawWelcomeMessage() {
    if (!ctx) return;
    
    ctx.fillStyle = 'rgba(52, 73, 94, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#7f8c8d';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🌳 Visualisation de l\'arbre de recherche', canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.font = '14px Arial';
    ctx.fillText('Lancez BFS ou DFS pour voir l\'exploration', canvas.width / 2, canvas.height / 2 + 10);
    
    ctx.font = '12px Arial';
    ctx.fillStyle = '#95a5a6';
    ctx.fillText('L\'arbre montre comment l\'algorithme explore les solutions', canvas.width / 2, canvas.height / 2 + 35);
}

// ===== GÉNÉRATION AMÉLIORÉE DE SUDOKU =====
async function generateNewPuzzle() {
    if (isAnimating) {
        logToConsole('⚠️ Arrêt de l\'animation en cours...', 'warning');
        isAnimating = false;
        stopTimer();
    }
    
    logToConsole('🔄 Génération d\'un nouveau puzzle Sudoku...', 'info');
    
    // Reset des statistiques
    stepCount = 0;
    startTime = null;
    updateStats();
    clearTree();
    
    try {
        // Obtenir la difficulté sélectionnée
        const difficultySelect = document.getElementById('difficulty');
        const difficulty = difficultySelect ? difficultySelect.value : 'medium';
        
        // Générer un puzzle valide
        const puzzle = await generateValidSudoku(difficulty);
        
        if (puzzle) {
            sudokuGrid = puzzle.map(row => [...row]);
            originalGrid = sudokuGrid.map(row => [...row]);
            updateGridDisplay();
            
            logToConsole(`✅ Nouveau puzzle généré (${difficulty})`, 'success');
            
            // Message IA contextuel avec Gemini
            const prompt = `Un nouveau puzzle Sudoku de difficulté ${difficulty} vient d'être généré. Donne un conseil stratégique bref sur comment l'aborder avec BFS ou DFS. Reste concis et encourageant.`;
            
            try {
                const aiResponse = await callGeminiAPI(prompt);
                addChatMessage('ai', aiResponse);
            } catch (error) {
                const fallbackTips = {
                    'easy': 'Parfait pour débuter ! BFS ou DFS fonctionneront rapidement sur ce niveau.',
                    'medium': 'Difficulté équilibrée. DFS sera probablement plus rapide grâce au backtracking.',
                    'hard': 'Challenge intéressant ! Observez comment BFS explore méthodiquement chaque possibilité.',
                    'expert': 'Niveau expert ! Comparez les deux algorithmes pour voir leurs différences.'
                };
                addChatMessage('ai', fallbackTips[difficulty] || fallbackTips['medium']);
            }
        } else {
            throw new Error('Failed to generate valid puzzle');
        }
        
    } catch (error) {
        logToConsole(`❌ Erreur lors de la génération: ${error.message}`, 'error');
        // Utiliser un puzzle de secours
        generateFallbackPuzzle();
    }
}

function generateFallbackPuzzle() {
    // Puzzle de secours simple mais valide
    const fallbackPuzzle = [
        [5,3,0,0,7,0,0,0,0],
        [6,0,0,1,9,5,0,0,0],
        [0,9,8,0,0,0,0,6,0],
        [8,0,0,0,6,0,0,0,3],
        [4,0,0,8,0,3,0,0,1],
        [7,0,0,0,2,0,0,0,6],
        [0,6,0,0,0,0,2,8,0],
        [0,0,0,4,1,9,0,0,5],
        [0,0,0,0,8,0,0,7,9]
    ];
    
    sudokuGrid = fallbackPuzzle.map(row => [...row]);
    originalGrid = sudokuGrid.map(row => [...row]);
    updateGridDisplay();
    
    logToConsole('🆘 Puzzle de secours chargé', 'warning');
}

// ===== AMÉLIORATION DES ALGORITHMES =====
async function solveBFS() {
    if (isAnimating) {
        logToConsole('⚠️ Un algorithme est déjà en cours...', 'warning');
        return;
    }
    
    logToConsole('🔍 Démarrage BFS (Breadth-First Search)', 'info');
    currentAlgorithm = 'BFS';
    isAnimating = true;
    stepCount = 0;
    startTime = Date.now();
    
    updateAlgorithmInfo('BFS', {
        name: 'Breadth-First Search (Largeur d\'abord)',
        principle: 'Explore tous les nœuds niveau par niveau',
        complexity: 'O(b^d) - Utilise beaucoup de mémoire',
        optimal: 'Garantit la solution avec le moins d\'étapes'
    });
    
    startTimer();
    clearTree();
    
    try {
        const workingGrid = sudokuGrid.map(row => [...row]);
        
        // Vérifier si le puzzle est déjà résolu
        if (isPuzzleComplete(workingGrid)) {
            logToConsole('✅ Le puzzle est déjà résolu !', 'success');
            isAnimating = false;
            stopTimer();
            return;
        }
        
        const queue = [{ 
            grid: workingGrid, 
            path: [], 
            depth: 0,
            lastMove: null 
        }];
        
        let found = false;
        let iterations = 0;
        const maxIterations = 5000; // Réduire pour éviter les blocages
        
        while (queue.length > 0 && !found && iterations < maxIterations && isAnimating) {
            iterations++;
            const current = queue.shift();
            const { grid, path, depth, lastMove } = current;
            
            // Ajouter à l'arbre de visualisation (limité)
            if (lastMove && treeNodes.length < 15) {
                addTreeNode(lastMove.row, lastMove.col, lastMove.value, depth, 'BFS');
                await sleep(50); // Animation plus fluide
            }
            
            const emptyCell = findNextEmpty(grid);
            
            if (!emptyCell) {
                logToConsole('🎉 Solution trouvée avec BFS !', 'success');
                await animateSolution(path);
                found = true;
                break;
            }
            
            const [row, col] = emptyCell;
            
            // Optimisation: utiliser la contrainte la plus restrictive
            const validMoves = [];
            for (let num = 1; num <= 9; num++) {
                if (isValidMove(grid, row, col, num)) {
                    validMoves.push(num);
                }
            }
            
            // Limiter le branchement pour éviter l'explosion combinatoire
            const maxBranches = Math.min(validMoves.length, 3);
            
            for (let i = 0; i < maxBranches; i++) {
                const num = validMoves[i];
                const newGrid = grid.map(r => [...r]);
                newGrid[row][col] = num;
                const newPath = [...path, { row, col, value: num }];
                
                queue.push({
                    grid: newGrid,
                    path: newPath,
                    depth: depth + 1,
                    lastMove: { row, col, value: num }
                });
            }
            
            // Mise à jour périodique
            if (iterations % 50 === 0) {
                stepCount = iterations;
                updateStats();
                await sleep(10);
            }
            
            if (iterations % 500 === 0) {
                logToConsole(`🔄 BFS: ${iterations} états explorés, queue: ${queue.length}`, 'info');
            }
        }
        
        if (!found && isAnimating) {
            if (iterations >= maxIterations) {
                logToConsole('⏱️ BFS: Temps limite atteint', 'warning');
            } else {
                logToConsole('❌ BFS: Aucune solution trouvée', 'error');
            }
        }
        
    } catch (error) {
        logToConsole(`❌ Erreur BFS: ${error.message}`, 'error');
        console.error('BFS Error:', error);
    }
    
    stopTimer();
    isAnimating = false;
}

async function solveDFS() {
    if (isAnimating) {
        logToConsole('⚠️ Un algorithme est déjà en cours...', 'warning');
        return;
    }
    
    logToConsole('🎯 Démarrage DFS (Depth-First Search)', 'info');
    currentAlgorithm = 'DFS';
    isAnimating = true;
    stepCount = 0;
    startTime = Date.now();
    
    updateAlgorithmInfo('DFS', {
        name: 'Depth-First Search (Profondeur d\'abord)',
        principle: 'Explore en profondeur avec retour arrière (backtracking)',
        complexity: 'O(b^m) - Économe en mémoire',
        optimal: 'Trouve une solution rapidement (pas forcément optimale)'
    });
    
    startTimer();
    clearTree();
    
    try {
        const workingGrid = sudokuGrid.map(row => [...row]);
        
        // Vérifier si le puzzle est déjà résolu
        if (isPuzzleComplete(workingGrid)) {
            logToConsole('✅ Le puzzle est déjà résolu !', 'success');
            isAnimating = false;
            stopTimer();
            return;
        }
        
        const result = await solveDFSRecursive(workingGrid, [], 0);
        
        if (result.success && isAnimating) {
            logToConsole('🎉 Solution trouvée avec DFS !', 'success');
            await animateSolution(result.path);
        } else if (isAnimating) {
            logToConsole('❌ DFS: Aucune solution trouvée', 'error');
        }
        
    } catch (error) {
        logToConsole(`❌ Erreur DFS: ${error.message}`, 'error');
        console.error('DFS Error:', error);
    }
    
    stopTimer();
    isAnimating = false;
}

async function solveDFSRecursive(grid, path, depth) {
    if (!isAnimating) return { success: false, path: [] };
    
    stepCount++;
    
    // Limites de sécurité
    if (depth > 81 || stepCount > 10000) {
        return { success: false, path: [] };
    }
    
    const emptyCell = findNextEmpty(grid);
    
    if (!emptyCell) {
        return { success: true, path: [...path] };
    }
    
    const [row, col] = emptyCell;
    
    // Ajouter à l'arbre si pas trop de nœuds
    if (treeNodes.length < 15) {
        addTreeNode(row, col, 0, depth, 'DFS');
    }
    
    // Animation progressive
    highlightCell(row, col, 'solving');
    if (stepCount % 20 === 0) {
        await sleep(animationSpeed / 8);
        updateStats();
    }
    
    // Essayer chaque nombre de 1 à 9
    for (let num = 1; num <= 9 && isAnimating; num++) {
        if (isValidMove(grid, row, col, num)) {
            // Placer le nombre
            grid[row][col] = num;
            const newPath = [...path, { row, col, value: num }];
            
            // Visualisation
            if (stepCount % 10 === 0) {
                highlightCell(row, col, 'current');
                updateCellDisplay(row, col, num, 'solving');
                await sleep(animationSpeed / 6);
            }
            
            // Récursion
            const result = await solveDFSRecursive(grid, newPath, depth + 1);
            
            if (result.success) {
                return result;
            }
            
            // Backtrack - retirer le nombre
            grid[row][col] = 0;
            if (stepCount % 15 === 0) {
                updateCellDisplay(row, col, '', 'solving');
                await sleep(animationSpeed / 12);
            }
        }
    }
    
    highlightCell(row, col, '');
    return { success: false, path: [] };
}

// ===== FONCTIONS UTILITAIRES AMÉLIORÉES =====
function isPuzzleComplete(grid) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (grid[row][col] === 0) {
                return false;
            }
        }
    }
    return true;
}

function stopCurrentAlgorithm() {
    if (isAnimating) {
        isAnimating = false;
        stopTimer();
        logToConsole('⏹️ Algorithme arrêté par l\'utilisateur', 'warning');
    }
}

// ===== CHAT IA AVEC GEMINI AMÉLIORÉ =====
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Désactiver temporairement l'input
    input.disabled = true;
    addChatMessage('user', message);
    input.value = '';
    
    // Construire un prompt contextualisé intelligent
    const context = buildIntelligentContext(message);
    
    try {
        logToConsole('🤖 Envoi de la requête à Gemini AI...', 'info');
        const aiResponse = await callGeminiAPI(context);
        addChatMessage('ai', aiResponse);
        logToConsole(`💬 Réponse IA reçue pour: "${message.substring(0, 30)}..."`, 'success');
    } catch (error) {
        logToConsole('⚠️ Erreur API Gemini, utilisation de la réponse de secours', 'warning');
        const fallbackResponse = getFallbackResponse(message);
        addChatMessage('ai', fallbackResponse);
    }
    
    // Réactiver l'input
    input.disabled = false;
    input.focus();
}

function buildIntelligentContext(userMessage) {
    const currentState = {
        algorithm: currentAlgorithm || 'Aucun',
        steps: stepCount,
        isRunning: isAnimating,
        gridFilled: calculateGridCompletion(),
        hasTree: treeNodes.length > 0
    };
    
    return `Tu es un assistant expert en algorithmes de recherche BFS et DFS appliqués au Sudoku.

CONTEXTE ACTUEL:
- Algorithme actuel: ${currentState.algorithm}
- Étapes effectuées: ${currentState.steps}
- État: ${currentState.isRunning ? 'En cours d\'exécution' : 'En attente'}
- Grille complétée à: ${currentState.gridFilled}%
- Arbre de recherche: ${currentState.hasTree ? 'Visualisé' : 'Vide'}

QUESTION DE L'UTILISATEUR: "${userMessage}"

INSTRUCTIONS:
- Réponds de manière concise et pédagogique (maximum 3 phrases)
- Utilise des emojis appropriés
- Reste focus sur BFS/DFS et le Sudoku
- Si l'utilisateur demande une comparaison, explique clairement les différences
- Si l'utilisateur a des problèmes techniques, propose des solutions simples

Réponds maintenant:`;
}

function calculateGridCompletion() {
    let filled = 0;
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (sudokuGrid[row][col] !== 0) filled++;
        }
    }
    return Math.round((filled / 81) * 100);
}

// ===== GESTION DES ÉVÉNEMENTS =====
function handleChatKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// ===== FONCTIONS DE CONTRÔLE =====
function resetGrid() {
    if (isAnimating) {
        isAnimating = false;
        stopTimer();
    }
    
    sudokuGrid = originalGrid.map(row => [...row]);
    updateGridDisplay();
    stepCount = 0;
    startTime = null;
    updateStats();
    clearTree();
    logToConsole('🔄 Grille réinitialisée à l\'état initial', 'info');
}

function clearGrid() {
    if (isAnimating) {
        isAnimating = false;
        stopTimer();
    }
    
    sudokuGrid = Array(9).fill().map(() => Array(9).fill(0));
    originalGrid = Array(9).fill().map(() => Array(9).fill(0));
    updateGridDisplay();
    stepCount = 0;
    startTime = null;
    updateStats();
    clearTree();
    logToConsole('🗑️ Grille vidée complètement', 'info');
}

// ===== INITIALISATION FINALE =====
// S'assurer que toutes les fonctions sont disponibles globalement
window.solveBFS = solveBFS;
window.solveDFS = solveDFS;
window.generateNewPuzzle = generateNewPuzzle;
window.resetGrid = resetGrid;
window.clearGrid = clearGrid;
window.sendMessage = sendMessage;
window.handleChatKeyPress = handleChatKeyPress;
window.compareAlgorithms = compareAlgorithms;
window.stopCurrentAlgorithm = stopCurrentAlgorithm;
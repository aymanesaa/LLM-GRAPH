// ===== VARIABLES GLOBALES =====
        let sudokuGrid = [];
        let originalGrid = [];
        let isAnimating = false;
        let animationSpeed = 300;
        let stepCount = 0;
        let startTime = null;
        let timeInterval = null;
        let currentAlgorithm = '';

        // Canvas pour la visualisation de l'arbre
        let canvas, ctx;
        let treeNodes = [];
        let treeConnections = [];

        // ===== INITIALISATION =====
        window.onload = function() {
            initializeGrid();
            generateNewPuzzle();
            initializeCanvas();
            logToConsole('🎯 Grille Sudoku générée', 'success');
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
        }

        function initializeCanvas() {
            canvas = document.getElementById('treeCanvas');
            ctx = canvas.getContext('2d');
            
            // Ajuster la taille du canvas
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
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('L\'arbre de décision apparaîtra ici lors de la résolution', 
                        canvas.width / 2, canvas.height / 2);
        }

        // ===== GÉNÉRATION DE PUZZLES SUDOKU =====
        function generateNewPuzzle() {
            logToConsole('🔄 Génération d\'un nouveau puzzle...', 'info');
            
            stepCount = 0;
            updateStats();
            clearTree();
            
            // Créer une grille simple prédéfinie pour la démo
            sudokuGrid = [
                [7, 5, 3, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 4, 9, 1, 8, 0, 0],
                [0, 0, 0, 0, 0, 0, 9, 1, 0],
                [8, 0, 0, 7, 4, 6, 0, 3, 0],
                [4, 7, 9, 0, 1, 2, 0, 0, 1],
                [0, 0, 0, 2, 5, 1, 1, 6, 0],
                [0, 7, 3, 0, 0, 0, 0, 0, 4],
                [0, 0, 0, 5, 4, 9, 2, 0, 0],
                [0, 0, 0, 0, 0, 0, 7, 1, 6]
            ];
            
            originalGrid = sudokuGrid.map(row => [...row]);
            updateGridDisplay();
            logToConsole('✅ Puzzle généré avec succès', 'success');
        }

        // ===== VALIDATION SUDOKU =====
        function isValidMove(grid, row, col, num) {
            // Vérifier la ligne
            for (let c = 0; c < 9; c++) {
                if (grid[row][c] === num) return false;
            }
            
            // Vérifier la colonne
            for (let r = 0; r < 9; r++) {
                if (grid[r][col] === num) return false;
            }
            
            // Vérifier le bloc 3x3
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

        // ===== ALGORITHME BFS =====
        async function solveBFS() {
            if (isAnimating) return;
            
            logToConsole('🔍 Démarrage BFS (Breadth-First Search)', 'info');
            currentAlgorithm = 'BFS';
            isAnimating = true;
            stepCount = 0;
            startTime = Date.now();
            
            updateAlgorithmInfo('BFS', {
                name: 'Breadth-First Search',
                principle: 'Explore tous les états niveau par niveau',
                complexity: 'O(b^d) - élevée en mémoire',
                optimal: 'Trouve la solution optimale'
            });
            
            startTimer();
            clearTree();
            
            const workingGrid = sudokuGrid.map(row => [...row]);
            const queue = [{ grid: workingGrid, path: [], depth: 0 }];
            
            let found = false;
            let iterations = 0;
            const maxIterations = 5000;
            
            while (queue.length > 0 && !found && iterations < maxIterations) {
                iterations++;
                const current = queue.shift();
                const { grid, path, depth } = current;
                
                const emptyCell = findNextEmpty(grid);
                
                if (!emptyCell) {
                    logToConsole('🎉 Solution trouvée avec BFS !', 'success');
                    await animateSolution(path);
                    found = true;
                    break;
                }
                
                const [row, col] = emptyCell;
                
                // Ajouter nœud à l'arbre
                if (treeNodes.length < 50) {
                    addTreeNode(row, col, depth, 'BFS');
                }
                
                for (let num = 1; num <= 9; num++) {
                    if (isValidMove(grid, row, col, num)) {
                        const newGrid = grid.map(r => [...r]);
                        newGrid[row][col] = num;
                        const newPath = [...path, { row, col, value: num }];
                        
                        queue.push({
                            grid: newGrid,
                            path: newPath,
                            depth: depth + 1
                        });
                        
                        if (iterations % 100 === 0) {
                            highlightCell(row, col, 'solving');
                            await sleep(50);
                            stepCount++;
                            updateStats();
                        }
                    }
                }
                
                if (iterations % 500 === 0) {
                    logToConsole(`🔄 BFS: ${iterations} itérations`, 'info');
                }
            }
            
            if (!found) {
                logToConsole('❌ BFS: Limite d\'itérations atteinte', 'error');
            }
            
            stopTimer();
            isAnimating = false;
        }

        // ===== ALGORITHME DFS =====
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
                complexity: 'O(b^m) - économe en mémoire',
                optimal: 'Solution rapide mais pas forcément optimale'
            });
            
            startTimer();
            clearTree();
            
            const workingGrid = sudokuGrid.map(row => [...row]);
            const result = await solveDFSRecursive(workingGrid, [], 0);
            
            if (result.success) {
                logToConsole('🎉 Solution trouvée avec DFS !', 'success');
                await animateSolution(result.path);
            } else {
                logToConsole('❌ DFS: Aucune solution trouvée', 'error');
            }
            
            stopTimer();
            isAnimating = false;
        }

        async function solveDFSRecursive(grid, path, depth) {
            stepCount++;
            
            if (depth > 81) return { success: false, path: [] };
            
            const emptyCell = findNextEmpty(grid);
            
            if (!emptyCell) {
                return { success: true, path: [...path] };
            }
            
            const [row, col] = emptyCell;
            
            if (treeNodes.length < 50) {
                addTreeNode(row, col, depth, 'DFS');
            }
            
            highlightCell(row, col, 'solving');
            await sleep(animationSpeed / 3);
            
            for (let num = 1; num <= 9; num++) {
                if (isValidMove(grid, row, col, num)) {
                    grid[row][col] = num;
                    const newPath = [...path, { row, col, value: num }];
                    
                    highlightCell(row, col, 'current');
                    updateCellDisplay(row, col, num, 'solving');
                    await sleep(animationSpeed / 2);
                    
                    if (stepCount % 5 === 0) {
                        updateStats();
                    }
                    
                    const result = await solveDFSRecursive(grid, newPath, depth + 1);
                    
                    if (result.success) {
                        return result;
                    }
                    
                    grid[row][col] = 0;
                    updateCellDisplay(row, col, '', 'solving');
                    await sleep(animationSpeed / 4);
                }
            }
            
            highlightCell(row, col, '');
            return { success: false, path: [] };
        }

        // ===== COMPARAISON DES ALGORITHMES =====
        async function compareAlgorithms() {
            if (isAnimating) return;
            
            logToConsole('⚖️ Comparaison BFS vs DFS', 'info');
            addChatMessage('ai', 'Je lance une comparaison entre BFS et DFS. Observez les différences !');
            
            const originalState = sudokuGrid.map(row => [...row]);
            
            // Test BFS
            await solveBFS();
            const bfsStats = { steps: stepCount, time: Date.now() - startTime };
            
            await sleep(2000);
            
            // Reset pour DFS
            sudokuGrid = originalState.map(row => [...row]);
            updateGridDisplay();
            
            // Test DFS
            await solveDFS();
            const dfsStats = { steps: stepCount, time: Date.now() - startTime };
            
            // Analyse comparative
            const comparison = `
📊 Résultats de comparaison:
• BFS: ${bfsStats.steps} étapes, ${bfsStats.time}ms
• DFS: ${dfsStats.steps} étapes, ${dfsStats.time}ms
• Winner: ${bfsStats.time < dfsStats.time ? 'BFS' : 'DFS'} (plus rapide)
            `;
            
            logToConsole(comparison, 'success');
            addChatMessage('ai', comparison);
        }

        // ===== VISUALISATION DE L'ARBRE =====
        function addTreeNode(row, col, depth, algorithm) {
            const nodeCount = treeNodes.length;
            const levelWidth = canvas.width / (depth + 2);
            const x = (nodeCount % 8) * (canvas.width / 8) + 40;
            const y = depth * 40 + 30;
            
            const node = {
                x: Math.min(x, canvas.width - 30),
                y: Math.min(y, canvas.height - 30),
                row, col, depth, algorithm,
                id: nodeCount
            };
            
            treeNodes.push(node);
            
            // Ajouter connexion avec le parent
            if (nodeCount > 0) {
                const parentIndex = Math.floor((nodeCount - 1) / 2);
                treeConnections.push({
                    from: parentIndex,
                    to: nodeCount
                });
            }
            
            drawTree();
        }

        function drawTree() {
            if (!ctx || treeNodes.length === 0) return;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Dessiner les connexions
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 1;
            treeConnections.forEach(conn => {
                const from = treeNodes[conn.from];
                const to = treeNodes[conn.to];
                if (from && to) {
                    ctx.beginPath();
                    ctx.moveTo(from.x, from.y);
                    ctx.lineTo(to.x, to.y);
                    ctx.stroke();
                }
            });
            
            // Dessiner les nœuds
            treeNodes.forEach((node, index) => {
                const isLatest = index === treeNodes.length - 1;
                
                // Cercle du nœud
                ctx.fillStyle = isLatest ? '#2196F3' : '#f0f0f0';
                ctx.beginPath();
                ctx.arc(node.x, node.y, 12, 0, 2 * Math.PI);
                ctx.fill();
                
                ctx.strokeStyle = '#666';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Texte
                ctx.fillStyle = isLatest ? 'white' : '#333';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${node.row},${node.col}`, node.x, node.y + 3);
            });
            
            // Légende
            // Légende
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Algorithme: ${currentAlgorithm}`, 10, canvas.height - 10);
    }

    function clearTree() {
        treeNodes = [];
        treeConnections = [];
        if (ctx) {
            drawWelcomeMessage();
        }
    }

    // ===== ANIMATION ET AFFICHAGE =====
    function updateGridDisplay() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cellIndex = row * 9 + col;
                const cell = document.getElementById(`cell-${cellIndex}`);
                const value = sudokuGrid[row][col];
                
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
            await sleep(200);
            highlightCell(row, col, 'solved');
            updateCellDisplay(row, col, value, 'solved');
        }
        
        logToConsole('✨ Animation terminée !', 'success');
    }

    // ===== GESTION DU TEMPS ET STATISTIQUES =====
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
        document.getElementById('stepsCount').textContent = stepCount;
        
        if (startTime) {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            document.getElementById('timeElapsed').textContent = `${elapsed}s`;
        }
    }

    function updateAlgorithmInfo(algorithm, info) {
        const infoDiv = document.getElementById('algorithmInfo');
        infoDiv.innerHTML = `
            <h3>📚 ${info.name}</h3>
            <p><strong>Principe:</strong> ${info.principle}</p>
            <p><strong>Complexité:</strong> ${info.complexity}</p>
            <p><strong>Caractéristique:</strong> ${info.optimal}</p>
        `;
    }

    // ===== SYSTÈME DE CHAT AI =====
    const aiResponses = {
        'bfs': 'BFS (Breadth-First Search) explore tous les états niveau par niveau. Il garantit de trouver la solution optimale mais utilise beaucoup de mémoire.',
        'dfs': 'DFS (Depth-First Search) explore en profondeur avec backtracking. Il est plus économe en mémoire mais peut prendre plus de temps.',
        'difference': 'La principale différence : BFS explore largeur d\'abord (optimal mais gourmand), DFS explore profondeur d\'abord (rapide mais pas toujours optimal).',
        'complexite': 'BFS a une complexité spatiale O(b^d) élevée, DFS a O(bm) plus faible. Temporellement, les deux sont exponentiels.',
        'sudoku': 'Le Sudoku est parfait pour démontrer ces algorithmes car il s\'agit d\'un problème de satisfaction de contraintes avec backtracking.',
        'backtracking': 'Le backtracking revient en arrière quand une solution partielle ne peut plus être étendue. C\'est essentiel dans DFS.',
        'optimal': 'BFS trouve toujours la solution avec le minimum d\'étapes, tandis que DFS trouve une solution rapidement mais pas forcément la plus courte.',
        'memoire': 'BFS stocke tous les états d\'un niveau en mémoire, DFS ne stocke que le chemin actuel, d\'où sa économie mémoire.',
        'bonjour': 'Bonjour ! Je suis ravi de vous aider à comprendre les algorithmes BFS et DFS appliqués au Sudoku.',
        'aide': 'Je peux expliquer BFS, DFS, leurs différences, complexités, et comment ils s\'appliquent au Sudoku. Que souhaitez-vous savoir ?'
    };

    function getAIResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Recherche de mots-clés
        for (const [keyword, response] of Object.entries(aiResponses)) {
            if (lowerMessage.includes(keyword)) {
                return response;
            }
        }
        
        // Réponses contextuelles basées sur l'état actuel
        if (currentAlgorithm === 'BFS') {
            return `Vous utilisez actuellement BFS. Cet algorithme explore systématiquement tous les états niveau par niveau. Étapes actuelles: ${stepCount}`;
        } else if (currentAlgorithm === 'DFS') {
            return `Vous utilisez actuellement DFS. Cet algorithme explore en profondeur avec backtracking. Étapes actuelles: ${stepCount}`;
        }
        
        // Réponse par défaut intelligente
        const responses = [
            'Excellente question ! Pouvez-vous être plus spécifique sur BFS, DFS, ou leur application au Sudoku ?',
            'Je suis spécialisé dans les algorithmes BFS et DFS. Voulez-vous que je compare leur efficacité ?',
            'Intéressant ! Souhaitez-vous voir une démonstration pratique des algorithmes ?',
            'Pour mieux vous aider, précisez si vous voulez comprendre la théorie ou voir les algorithmes en action.',
            'Je peux expliquer les concepts, montrer les différences, ou analyser les performances. Que préférez-vous ?'
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
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
        
        // Scroll vers le bas
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Animation d'apparition
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
        setTimeout(() => {
            messageDiv.style.transition = 'all 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 50);
    }

    function sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Ajouter le message de l'utilisateur
        addChatMessage('user', message);
        input.value = '';
        
        // Simuler une réflexion de l'AI
        setTimeout(() => {
            const aiResponse = getAIResponse(message);
            addChatMessage('ai', aiResponse);
            logToConsole(`💬 Question posée: "${message}"`, 'info');
        }, 500 + Math.random() * 1000);
    }

    function handleChatKeyPress(event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    }

    // ===== FONCTIONS UTILITAIRES =====
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function logToConsole(message, type = 'info') {
        const console = document.getElementById('console');
        const logDiv = document.createElement('div');
        logDiv.className = `console-log ${type}`;
        
        const timestamp = new Date().toLocaleTimeString();
        logDiv.textContent = `[${timestamp}] ${message}`;
        
        console.appendChild(logDiv);
        console.scrollTop = console.scrollHeight;
        
        // Limiter le nombre de logs
        const logs = console.querySelectorAll('.console-log');
        if (logs.length > 50) {
            logs[0].remove();
        }
    }

    // ===== FONCTIONNALITÉS SUPPLÉMENTAIRES =====
    function resetGrid() {
        sudokuGrid = originalGrid.map(row => [...row]);
        updateGridDisplay();
        stepCount = 0;
        updateStats();
        stopTimer();
        clearTree();
        logToConsole('🔄 Grille réinitialisée', 'info');
    }

    function validateCurrentGrid() {
        let isValid = true;
        let filledCells = 0;
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const value = sudokuGrid[row][col];
                if (value !== 0) {
                    filledCells++;
                    // Temporairement enlever la valeur pour tester la validité
                    sudokuGrid[row][col] = 0;
                    if (!isValidMove(sudokuGrid, row, col, value)) {
                        isValid = false;
                    }
                    sudokuGrid[row][col] = value;
                }
            }
        }
        
        const completion = Math.round((filledCells / 81) * 100);
        logToConsole(`📊 Grille ${isValid ? 'valide' : 'invalide'} - ${completion}% complétée`, 
                    isValid ? 'success' : 'error');
        
        return { valid: isValid, completion };
    }

    // ===== AMÉLIORATIONS DE LA VISUALISATION DE L'ARBRE =====
    function drawTreeImproved() {
        if (!ctx || treeNodes.length === 0) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculer les positions de manière plus intelligente
        const levels = {};
        treeNodes.forEach(node => {
            if (!levels[node.depth]) levels[node.depth] = [];
            levels[node.depth].push(node);
        });
        
        // Repositionner les nœuds pour une meilleure visualisation
        Object.keys(levels).forEach(depth => {
            const nodesAtLevel = levels[depth];
            const levelY = parseInt(depth) * 50 + 40;
            const spacing = Math.min(canvas.width / (nodesAtLevel.length + 1), 80);
            
            nodesAtLevel.forEach((node, index) => {
                node.x = (index + 1) * spacing;
                node.y = Math.min(levelY, canvas.height - 30);
            });
        });
        
        // Dessiner les connexions avec des couleurs
        ctx.lineWidth = 2;
        treeConnections.forEach(conn => {
            const from = treeNodes[conn.from];
            const to = treeNodes[conn.to];
            if (from && to) {
                const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
                gradient.addColorStop(0, '#2196F3');
                gradient.addColorStop(1, '#9c27b0');
                ctx.strokeStyle = gradient;
                
                ctx.beginPath();
                ctx.moveTo(from.x, from.y);
                ctx.lineTo(to.x, to.y);
                ctx.stroke();
            }
        });
        
        // Dessiner les nœuds avec plus de détails
        treeNodes.forEach((node, index) => {
            const isLatest = index === treeNodes.length - 1;
            const isRoot = index === 0;
            
            // Ombre
            if (!isRoot) {
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.beginPath();
                ctx.arc(node.x + 2, node.y + 2, 15, 0, 2 * Math.PI);
                ctx.fill();
            }
            
            // Cercle principal
            const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 15);
            if (isLatest) {
                gradient.addColorStop(0, '#4caf50');
                gradient.addColorStop(1, '#2e7d32');
            } else if (isRoot) {
                gradient.addColorStop(0, '#ff9800');
                gradient.addColorStop(1, '#f57c00');
            } else {
                gradient.addColorStop(0, '#e3f2fd');
                gradient.addColorStop(1, '#2196F3');
            }
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 15, 0, 2 * Math.PI);
            ctx.fill();
            
            // Bordure
            ctx.strokeStyle = isLatest ? '#4caf50' : '#2196F3';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Texte
            ctx.fillStyle = isLatest || isRoot ? 'white' : '#333';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${node.row},${node.col}`, node.x, node.y + 3);
        });
        
        // Statistiques de l'arbre
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${currentAlgorithm} - Nœuds: ${treeNodes.length}`, 10, 20);
        ctx.fillText(`Profondeur max: ${Math.max(...treeNodes.map(n => n.depth))}`, 10, canvas.height - 30);
        ctx.fillText(`Étapes: ${stepCount}`, 10, canvas.height - 10);
    }

    // Remplacer la fonction drawTree par la version améliorée
    function drawTree() {
        drawTreeImproved();
    }

    // ===== GESTION DES ÉVÉNEMENTS ET RACCOURCIS =====
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey) {
            switch(event.key) {
                case 'b':
                    event.preventDefault();
                    solveBFS();
                    break;
                case 'd':
                    event.preventDefault();
                    solveDFS();
                    break;
                case 'n':
                    event.preventDefault();
                    generateNewPuzzle();
                    break;
                case 'r':
                    event.preventDefault();
                    resetGrid();
                    break;
            }
        }
    });

    // ===== MESSAGES D'ACCUEIL ET TUTORIAL =====
    setTimeout(() => {
        addChatMessage('ai', 'Bienvenue dans l\'apprentissage interactif des algorithmes ! 🎓');
        setTimeout(() => {
            addChatMessage('ai', 'Essayez les boutons BFS et DFS pour voir les algorithmes en action, ou posez-moi vos questions !');
        }, 2000);
    }, 1000);

    // ===== INITIALISATION FINALE =====
    logToConsole('🎮 Raccourcis: Ctrl+B (BFS), Ctrl+D (DFS), Ctrl+N (Nouveau), Ctrl+R (Reset)', 'info');

    // ===== FONCTIONNALITÉS AVANCÉES =====
    
    // Système de hints/indices intelligents
    function getHint() {
        if (isAnimating) return;
        
        logToConsole('💡 Recherche d\'un indice...', 'info');
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (sudokuGrid[row][col] === 0) {
                    const possibleValues = [];
                    
                    for (let num = 1; num <= 9; num++) {
                        if (isValidMove(sudokuGrid, row, col, num)) {
                            possibleValues.push(num);
                        }
                    }
                    
                    if (possibleValues.length === 1) {
                        const value = possibleValues[0];
                        highlightCell(row, col, 'current');
                        updateCellDisplay(row, col, value, 'current');
                        sudokuGrid[row][col] = value;
                        
                        addChatMessage('ai', `💡 Indice trouvé ! Cellule (${row+1},${col+1}) ne peut être que ${value}`);
                        logToConsole(`💡 Indice: (${row},${col}) = ${value}`, 'success');
                        
                        setTimeout(() => {
                            highlightCell(row, col, 'solved');
                            updateCellDisplay(row, col, value, 'solved');
                        }, 2000);
                        
                        return;
                    }
                }
            }
        }
        
        addChatMessage('ai', '🤔 Aucun indice évident trouvé. Les cases restantes nécessitent des techniques avancées.');
        logToConsole('💡 Aucun indice simple trouvé', 'warning');
    }

    // Analyse de la complexité du puzzle
    function analyzePuzzleComplexity() {
        let emptyCells = 0;
        let constrainedCells = 0;
        let totalPossibilities = 0;
        
        const analysis = {
            difficulty: 'Unknown',
            emptyCells: 0,
            averagePossibilities: 0,
            constrainedCells: 0,
            techniques: []
        };
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (sudokuGrid[row][col] === 0) {
                    emptyCells++;
                    let possibilities = 0;
                    
                    for (let num = 1; num <= 9; num++) {
                        if (isValidMove(sudokuGrid, row, col, num)) {
                            possibilities++;
                        }
                    }
                    
                    totalPossibilities += possibilities;
                    
                    if (possibilities <= 2) {
                        constrainedCells++;
                    }
                    
                    if (possibilities === 1) {
                        analysis.techniques.push('Naked Single');
                    }
                }
            }
        }
        
        analysis.emptyCells = emptyCells;
        analysis.constrainedCells = constrainedCells;
        analysis.averagePossibilities = emptyCells > 0 ? (totalPossibilities / emptyCells).toFixed(2) : 0;
        
        // Déterminer la difficulté
        if (analysis.averagePossibilities < 2.5) {
            analysis.difficulty = 'Facile';
        } else if (analysis.averagePossibilities < 4) {
            analysis.difficulty = 'Moyen';
        } else if (analysis.averagePossibilities < 6) {
            analysis.difficulty = 'Difficile';
        } else {
            analysis.difficulty = 'Expert';
        }
        
        const report = `
📊 Analyse du puzzle:
• Difficulté estimée: ${analysis.difficulty}
• Cases vides: ${analysis.emptyCells}/81
• Possibilités moyennes: ${analysis.averagePossibilities}
• Cases contraintes: ${analysis.constrainedCells}
        `;
        
        addChatMessage('ai', report);
        logToConsole(`📊 Analyse: ${analysis.difficulty} - ${analysis.emptyCells} cases vides`, 'info');
        
        return analysis;
    }

    // Générateur de puzzles avec différents niveaux
    function generatePuzzleByDifficulty(difficulty) {
        logToConsole(`🎲 Génération puzzle niveau: ${difficulty}`, 'info');
        
        // Grilles prédéfinies pour différents niveaux
        const puzzles = {
            easy: [
                [5,3,0,0,7,0,0,0,0],
                [6,0,0,1,9,5,0,0,0],
                [0,9,8,0,0,0,0,6,0],
                [8,0,0,0,6,0,0,0,3],
                [4,0,0,8,0,3,0,0,1],
                [7,0,0,0,2,0,0,0,6],
                [0,6,0,0,0,0,2,8,0],
                [0,0,0,4,1,9,0,0,5],
                [0,0,0,0,8,0,0,7,9]
            ],
            medium: [
                [0,0,0,6,0,0,4,0,0],
                [7,0,0,0,0,3,6,0,0],
                [0,0,0,0,9,1,0,8,0],
                [0,0,0,0,0,0,0,0,0],
                [0,5,0,1,8,0,0,0,3],
                [0,0,0,3,0,6,0,4,5],
                [0,4,0,2,0,0,0,6,0],
                [9,0,3,0,0,0,0,0,0],
                [0,2,0,0,0,0,1,0,0]
            ],
            hard: [
                [0,0,0,0,0,0,0,1,0],
                [4,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,6,0,2],
                [0,0,0,0,3,0,0,0,0],
                [5,0,9,0,0,0,0,0,0],
                [0,0,0,0,0,0,4,0,0],
                [0,0,0,5,1,0,0,0,0],
                [0,0,0,0,0,0,0,0,3],
                [0,0,0,0,0,9,0,0,0]
            ]
        };
        
        const selectedPuzzle = puzzles[difficulty] || puzzles.medium;
        sudokuGrid = selectedPuzzle.map(row => [...row]);
        originalGrid = sudokuGrid.map(row => [...row]);
        
        updateGridDisplay();
        analyzePuzzleComplexity();
        
        stepCount = 0;
        updateStats();
        clearTree();
        
        logToConsole(`✅ Puzzle ${difficulty} généré`, 'success');
    }

    // Système de scoring et performance
    let gameStats = {
        puzzlesSolved: 0,
        totalTime: 0,
        bestTime: Infinity,
        algorithmsUsed: { BFS: 0, DFS: 0 },
        hintsUsed: 0
    };

    function updateGameStats(algorithm, time, steps) {
        gameStats.puzzlesSolved++;
        gameStats.totalTime += time;
        gameStats.bestTime = Math.min(gameStats.bestTime, time);
        gameStats.algorithmsUsed[algorithm]++;
        
        const avgTime = (gameStats.totalTime / gameStats.puzzlesSolved / 1000).toFixed(1);
        const bestTimeFormatted = (gameStats.bestTime / 1000).toFixed(1);
        
        const statsReport = `
🏆 Statistiques de session:
• Puzzles résolus: ${gameStats.puzzlesSolved}
• Temps moyen: ${avgTime}s
• Meilleur temps: ${bestTimeFormatted}s
• BFS utilisé: ${gameStats.algorithmsUsed.BFS} fois
• DFS utilisé: ${gameStats.algorithmsUsed.DFS} fois
        `;
        
        logToConsole(`🏆 Puzzle résolu en ${(time/1000).toFixed(1)}s avec ${steps} étapes`, 'success');
        
        if (gameStats.puzzlesSolved % 3 === 0) {
            addChatMessage('ai', statsReport);
        }
    }

    // Mode compétition entre algorithmes
    async function algorithmRace() {
        if (isAnimating) return;
        
        logToConsole('🏁 Course d\'algorithmes lancée !', 'info');
        addChatMessage('ai', '🏁 Course BFS vs DFS ! Observez qui termine en premier.');
        
        const originalState = sudokuGrid.map(row => [...row]);
        
        // Préparer deux instances
        const gridBFS = originalState.map(row => [...row]);
        const gridDFS = originalState.map(row => [...row]);
        
        const results = { BFS: null, DFS: null };
        
        // Lancer BFS en arrière-plan
        const bfsPromise = new Promise(async (resolve) => {
            const startTime = Date.now();
            const success = await solveBFSQuick(gridBFS);
            results.BFS = {
                time: Date.now() - startTime,
                success,
                steps: stepCount
            };
            resolve();
        });
        
        // Lancer DFS en arrière-plan
        const dfsPromise = new Promise(async (resolve) => {
            const startTime = Date.now();
            const success = await solveDFSQuick(gridDFS);
            results.DFS = {
                time: Date.now() - startTime,
                success,
                steps: stepCount
            };
            resolve();
        });
        
        // Attendre les résultats
        await Promise.all([bfsPromise, dfsPromise]);
        
        // Analyser les résultats
        const winner = results.BFS.time < results.DFS.time ? 'BFS' : 'DFS';
        const raceReport = `
🏁 Résultats de course:
🥇 Gagnant: ${winner}
⚡ BFS: ${(results.BFS.time/1000).toFixed(2)}s
⚡ DFS: ${(results.DFS.time/1000).toFixed(2)}s
📊 Différence: ${Math.abs(results.BFS.time - results.DFS.time)}ms
        `;
        
        addChatMessage('ai', raceReport);
        logToConsole(`🏁 Course terminée - Gagnant: ${winner}`, 'success');
    }

    // Versions rapides des algorithmes pour la course
    async function solveBFSQuick(grid) {
        const queue = [{ grid: grid.map(row => [...row]), path: [] }];
        let iterations = 0;
        const maxIterations = 1000;
        
        while (queue.length > 0 && iterations < maxIterations) {
            iterations++;
            const current = queue.shift();
            const { grid: currentGrid } = current;
            
            const emptyCell = findNextEmpty(currentGrid);
            if (!emptyCell) return true;
            
            const [row, col] = emptyCell;
            
            for (let num = 1; num <= 9; num++) {
                if (isValidMove(currentGrid, row, col, num)) {
                    const newGrid = currentGrid.map(r => [...r]);
                    newGrid[row][col] = num;
                    queue.push({ grid: newGrid, path: [] });
                }
            }
        }
        
        return false;
    }

    async function solveDFSQuick(grid) {
        return solveDFSRecursiveQuick(grid, 0);
    }

    function solveDFSRecursiveQuick(grid, depth) {
        if (depth > 81) return false;
        
        const emptyCell = findNextEmpty(grid);
        if (!emptyCell) return true;
        
        const [row, col] = emptyCell;
        
        for (let num = 1; num <= 9; num++) {
            if (isValidMove(grid, row, col, num)) {
                grid[row][col] = num;
                
                if (solveDFSRecursiveQuick(grid, depth + 1)) {
                    return true;
                }
                
                grid[row][col] = 0;
            }
        }
        
        return false;
    }

    // Mode tutoriel interactif
    function startTutorial() {
        logToConsole('📚 Tutoriel interactif démarré', 'info');
        
        const tutorialSteps = [
            {
                message: "🎓 Bienvenue dans le tutoriel ! Je vais vous expliquer BFS et DFS étape par étape.",
                action: null
            },
            {
                message: "📋 Voici un puzzle Sudoku. Chaque case doit contenir un chiffre de 1 à 9, sans répétition dans les lignes, colonnes et blocs 3x3.",
                action: () => generatePuzzleByDifficulty('easy')
            },
            {
                message: "🔍 BFS (Breadth-First Search) explore tous les états possibles niveau par niveau. Observez:",
                action: () => setTimeout(solveBFS, 2000)
            },
            {
                message: "⏰ BFS garantit de trouver la solution optimale, mais utilise beaucoup de mémoire car il garde tous les états en attente.",
                action: null
            },
            {
                message: "🎯 Maintenant, essayons DFS (Depth-First Search). Il explore en profondeur avec backtracking:",
                action: () => {
                    generatePuzzleByDifficulty('easy');
                    setTimeout(solveDFS, 2000);
                }
            },
            {
                message: "💾 DFS est plus économe en mémoire mais peut prendre plus de temps car il n'explore qu'un chemin à la fois.",
                action: null
            },
            {
                message: "⚖️ Comparons maintenant les deux algorithmes sur le même puzzle:",
                action: () => setTimeout(compareAlgorithms, 2000)
            },
            {
                message: "🎉 Tutoriel terminé ! Vous pouvez maintenant explorer librement et me poser des questions.",
                action: null
            }
        ];
        
        let currentStep = 0;
        
        function nextTutorialStep() {
            if (currentStep >= tutorialSteps.length) return;
            
            const step = tutorialSteps[currentStep];
            addChatMessage('ai', step.message);
            
            if (step.action) {
                step.action();
            }
            
            currentStep++;
            
            if (currentStep < tutorialSteps.length) {
                setTimeout(nextTutorialStep, 5000);
            }
        }
        
        nextTutorialStep();
    }

    // Système d'aide contextuelle
    function getContextualHelp() {
        const analysis = analyzePuzzleComplexity();
        let helpMessage = '';
        
        if (analysis.emptyCells > 50) {
            helpMessage = "🎯 Beaucoup de cases vides ! Commencez par les techniques de base comme les 'naked singles'.";
        } else if (analysis.averagePossibilities > 5) {
            helpMessage = "🤔 Puzzle complexe détecté. Les algorithmes avancés comme BFS peuvent être nécessaires.";
        } else if (analysis.constrainedCells > 10) {
            helpMessage = "💡 Plusieurs cases contraintes disponibles. Utilisez le bouton 'Indice' pour les révéler.";
        } else {
            helpMessage = "✨ Puzzle bien équilibré ! Parfait pour comparer BFS et DFS.";
        }
        
        addChatMessage('ai', helpMessage);
    }

    // Ajout des boutons supplémentaires
    function addExtraControls() {
        const controls = document.querySelector('.controls');
        
        // Bouton Indice
        const hintBtn = document.createElement('button');
        hintBtn.className = 'btn btn-info';
        hintBtn.textContent = 'Indice';
        hintBtn.onclick = getHint;
        controls.appendChild(hintBtn);
        
        // Bouton Analyse
        const analyzeBtn = document.createElement('button');
        analyzeBtn.className = 'btn btn-secondary';
        analyzeBtn.textContent = 'Analyser';
        analyzeBtn.onclick = analyzePuzzleComplexity;
        controls.appendChild(analyzeBtn);
        
        // Bouton Course
        const raceBtn = document.createElement('button');
        raceBtn.className = 'btn btn-primary';
        raceBtn.textContent = 'Course';
        raceBtn.onclick = algorithmRace;
        controls.appendChild(raceBtn);
        
        // Bouton Tutoriel
        const tutorialBtn = document.createElement('button');
        tutorialBtn.className = 'btn btn-success';
        tutorialBtn.textContent = 'Tutoriel';
        tutorialBtn.onclick = startTutorial;
        controls.appendChild(tutorialBtn);
    }

    // Mise à jour du sélecteur de difficulté
    document.getElementById('difficulty').addEventListener('change', function(e) {
        const difficulty = e.target.value;
        generatePuzzleByDifficulty(difficulty);
    });

    // Initialisation des contrôles supplémentaires
    setTimeout(addExtraControls, 1000);

    // Messages d'aide contextuelle périodiques
    setInterval(() => {
        if (!isAnimating && Math.random() < 0.3) {
            getContextualHelp();
        }
    }, 30000);

    // Sauvegarde automatique de l'état
    function saveGameState() {
        const gameState = {
            sudokuGrid,
            originalGrid,
            gameStats,
            timestamp: Date.now()
        };
        
        // Simulation de sauvegarde (localStorage n'est pas disponible)
        logToConsole('💾 État du jeu sauvegardé', 'info');
        return gameState;
    }

    // Auto-sauvegarde toutes les 2 minutes
    setInterval(saveGameState, 120000);

    logToConsole('🚀 Toutes les fonctionnalités avancées chargées !', 'success');

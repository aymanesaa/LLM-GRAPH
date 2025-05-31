const knowledgeBase = {
      "bfs": {
        "description": "BFS (Breadth-First Search) explore un graphe niveau par niveau. Il utilise une file et garantit de trouver le chemin le plus court dans un graphe non pondéré.",
        "avantages": "Avantages : Trouve toujours le chemin le plus court, idéal pour les graphes avec solutions peu profondes.",
        "inconvenients": "Inconvénients : Consomme beaucoup de mémoire car stocke tous les nœuds d'un niveau.",
        "complexite": "Complexité : O(V+E) où V est le nombre de sommets et E le nombre d'arêtes.",
        "applications": "Applications : Plus court chemin, réseaux peer-to-peer, crawlers web."
      },
      "dfs": {
        "description": "DFS (Depth-First Search) explore un graphe en profondeur d'abord. Il utilise une pile (récursion) et peut être plus efficace en mémoire que BFS.",
        "avantages": "Avantages : Utilise moins de mémoire que BFS, peut trouver des solutions plus rapidement dans certains cas.",
        "inconvenients": "Inconvénients : Ne trouve pas toujours le chemin le plus court, peut rester bloqué dans des branches profondes.",
        "complexite": "Complexité : O(V+E) comme BFS, mais avec une utilisation mémoire différente.",
        "applications": "Applications : Résolution de labyrinthes, tri topologique, détection de cycles."
      },
      "comparaison": {
        "exploration": "BFS explore largeur d'abord (niveau par niveau), DFS explore profondeur d'abord (une branche jusqu'au bout).",
        "memoire": "BFS utilise plus de mémoire (stocke tout un niveau), DFS utilise moins de mémoire (stocke le chemin actuel).",
        "chemin": "BFS trouve le plus court chemin, DFS peut trouver une solution plus rapidement mais pas forcément la plus courte.",
        "implementation": "BFS utilise une file, DFS utilise une pile (souvent via récursion)."
      },
      "sudoku": {
        "bfs": "BFS n'est pas idéal pour le Sudoku car il explorerait toutes les possibilités niveau par niveau, ce qui serait très inefficace.",
        "dfs": "DFS est mieux adapté au Sudoku car il explore une solution complète avant de revenir en arrière (backtracking).",
        "meilleur": "DFS avec backtracking est généralement la meilleure approche pour résoudre un Sudoku."
      }
    };

    // Fonction pour analyser la question et trouver la réponse la plus pertinente
    function getAnswer(question) {
      const lowerQuestion = question.toLowerCase();
      
      if (lowerQuestion.includes("bfs") && lowerQuestion.includes("dfs")) {
        if (lowerQuestion.includes("compar") || lowerQuestion.includes("différ")) {
          return formatComparisonAnswer();
        }
        return "BFS et DFS sont deux algorithmes de parcours de graphes. BFS explore niveau par niveau, DFS explore en profondeur d'abord. Voulez-vous une comparaison détaillée ?";
      }
      
      if (lowerQuestion.includes("bfs")) {
        if (lowerQuestion.includes("avantage")) {
          return knowledgeBase.bfs.avantages;
        }
        if (lowerQuestion.includes("inconvénient") || lowerQuestion.includes("désavantage")) {
          return knowledgeBase.bfs.inconvenients;
        }
        if (lowerQuestion.includes("complex")) {
          return knowledgeBase.bfs.complexite;
        }
        if (lowerQuestion.includes("application")) {
          return knowledgeBase.bfs.applications;
        }
        if (lowerQuestion.includes("sudoku")) {
          return knowledgeBase.sudoku.bfs;
        }
        return knowledgeBase.bfs.description;
      }
      
      if (lowerQuestion.includes("dfs")) {
        if (lowerQuestion.includes("avantage")) {
          return knowledgeBase.dfs.avantages;
        }
        if (lowerQuestion.includes("inconvénient") || lowerQuestion.includes("désavantage")) {
          return knowledgeBase.dfs.inconvenients;
        }
        if (lowerQuestion.includes("complex")) {
          return knowledgeBase.dfs.complexite;
        }
        if (lowerQuestion.includes("application")) {
          return knowledgeBase.dfs.applications;
        }
        if (lowerQuestion.includes("sudoku")) {
          return knowledgeBase.sudoku.dfs + " " + knowledgeBase.sudoku.meilleur;
        }
        return knowledgeBase.dfs.description;
      }
      
      if (lowerQuestion.includes("sudoku")) {
        return "Pour le Sudoku, DFS avec backtracking est généralement la meilleure approche. BFS serait trop inefficace car il explorerait toutes les possibilités niveau par niveau.";
      }
      
      return "Je suis spécialisé dans les algorithmes BFS et DFS. Pouvez-vous poser une question plus spécifique sur ces algorithmes ?";
    }

    // Fonction pour formater une réponse de comparaison
    function formatComparisonAnswer() {
      let response = "Comparaison entre BFS et DFS:<br><br>";
      response += `• <strong>Exploration:</strong> ${knowledgeBase.comparaison.exploration}<br><br>`;
      response += `• <strong>Mémoire:</strong> ${knowledgeBase.comparaison.memoire}<br><br>`;
      response += `• <strong>Chemin:</strong> ${knowledgeBase.comparaison.chemin}<br><br>`;
      response += `• <strong>Implémentation:</strong> ${knowledgeBase.comparaison.implementation}`;
      return response;
    }

    // Gestion de l'interface du chat
    document.getElementById("openChatBtn").addEventListener("click", function() {
      document.getElementById("chatPopup").style.display = "block";
    });

    document.getElementById("closeChatBtn").addEventListener("click", function() {
      document.getElementById("chatPopup").style.display = "none";
    });

    function handleKeyPress(event) {
      if (event.key === 'Enter') {
        handleSend();
      }
    }

    function addMessage(content, isUser = false) {
      const messagesDiv = document.getElementById("messages");
      const messageDiv = document.createElement("div");
      messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
      messageDiv.innerHTML = content;
      messagesDiv.appendChild(messageDiv);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    async function handleSend() {
      const input = document.getElementById("userInput");
      const msg = input.value.trim();
      if (!msg) return;

      // Ajouter le message de l'utilisateur
      addMessage(msg, true);
      input.value = "";

      // Simuler un délai de réponse
      setTimeout(() => {
        const reply = getAnswer(msg);
        addMessage(reply, false);
      }, 500);
    }
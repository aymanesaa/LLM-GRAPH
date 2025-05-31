
  document.getElementById("openChatBtn").addEventListener("click", function () {
    document.getElementById("chatPopup").style.display = "block";
  });

  document.getElementById("closeChatBtn").addEventListener("click", function () {
    document.getElementById("chatPopup").style.display = "none";
  });

  async function handleSend() {
    const input = document.getElementById("userInput");
    const msg = input.value.trim();
    if (!msg) return;

    const messagesDiv = document.getElementById("messages");
    messagesDiv.innerHTML += `<div><strong>Toi:</strong> ${msg}</div>`;
    input.value = "";

    const reply = await sendMessageToGemini(msg);
    messagesDiv.innerHTML += `<div style="color:green;"><strong>IA:</strong> ${reply}</div>`;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }


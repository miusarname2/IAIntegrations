// public/script.js
const messagesDiv = document.getElementById('messages');
const promptInput = document.getElementById('prompt-input');
const sendBtn = document.getElementById('send-btn');
const modelSelect = document.getElementById('model-select');

function appendMessage(content, sender) {
    const msgEl = document.createElement('div');
    msgEl.classList.add('message', sender);
    const contEl = document.createElement('div');
    contEl.classList.add('content');
    contEl.textContent = content;
    msgEl.appendChild(contEl);
    messagesDiv.appendChild(msgEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

sendBtn.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    const model = modelSelect.value;
    if (!prompt) return;
    appendMessage(prompt, 'user');
    promptInput.value = '';
    sendBtn.disabled = true;
    appendMessage('...', 'bot');

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, model })
        });

        if (!response.ok) throw new Error('Error en la respuesta del servidor');
        const reader = response.body.getReader();
        let botResp = '';
        const lastMsg = messagesDiv.querySelector('.message.bot:last-child .content');

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            botResp += new TextDecoder().decode(value);
            lastMsg.textContent = botResp;
        }
    } catch (err) {
        appendMessage('Error: ' + err.message, 'bot');
        console.error(err);
    } finally {
        sendBtn.disabled = false;
    }
});

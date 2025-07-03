// public/script.js
const messagesDiv = document.getElementById('messages');
const promptInput = document.getElementById('prompt-input');
const sendBtn = document.getElementById('send-btn');
const modelSelect = document.getElementById('model-select');

// Carga dinámica de modelos al iniciar
async function loadModels() {
    try {
        const resp = await fetch('/models');
        const { data } = await resp.json();
        data.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.id;
            modelSelect.appendChild(opt);
        });
    } catch (e) {
        console.error('No se pudieron cargar modelos', e);
    }
}

function appendMessage(text, cls) {
    const el = document.createElement('div');
    el.className = `message ${cls}`;
    el.innerHTML = `<div class="content">${text}</div>`;
    messagesDiv.appendChild(el);
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
        const res = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, model })
        });
        if (!res.ok) throw new Error(await res.text());
        const reader = res.body.getReader();
        let text = '';
        const contentEl = messagesDiv.querySelector('.message.bot:last-child .content');
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            text += new TextDecoder().decode(value);
            contentEl.textContent = text;
        }
    } catch (err) {
        appendMessage('Error: ' + err.message, 'bot');
        console.error(err);
    } finally {
        sendBtn.disabled = false;
    }
});

// Arranca
loadModels();

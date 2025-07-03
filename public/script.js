// public/script.js
const messagesDiv = document.getElementById('messages');
const promptInput = document.getElementById('prompt-input');
const sendBtn = document.getElementById('send-btn');
const modelSelect = document.getElementById('model-select');

// Carga dinámica de modelos al iniciar
async function loadModels() {
    try {
        const resp = await fetch('/models');
        const json = await resp.json();
        (json.data || json.models || []).forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.id;
            modelSelect.appendChild(opt);
        });
    } catch (e) {
        console.error('No se pudieron cargar modelos', e);
    }
}

// Añade una burbuja de mensaje
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

    // Mensaje usuario
    appendMessage(prompt, 'user');
    promptInput.value = '';
    sendBtn.disabled = true;

    // Burbuja bot vacía
    appendMessage('', 'bot');
    const contentEl = messagesDiv.querySelector('.message.bot:last-child .content');

    try {
        const res = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, model })
        });
        if (!res.ok) throw new Error(await res.text());

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            // Procesar bloques SSE separados por doble salto de línea
            const parts = buffer.split('\n\n');
            buffer = parts.pop(); // parte incompleta

            for (let part of parts) {
                part.split('\n').forEach(line => {
                    if (!line.startsWith('data: ')) return;
                    const jsonStr = line.slice(6).trim();
                    if (jsonStr === '[DONE]') return;
                    try {
                        const chunk = JSON.parse(jsonStr);
                        const delta = chunk.choices?.[0]?.delta?.content;
                        if (delta) {
                            contentEl.textContent += delta;
                            messagesDiv.scrollTop = messagesDiv.scrollHeight;
                        }
                    } catch (_) { /* ignora errores de parse */ }
                });
            }
        }
    } catch (err) {
        contentEl.textContent = 'Error: ' + err.message;
        console.error(err);
    } finally {
        sendBtn.disabled = false;
    }
});

// Inicializa
loadModels();

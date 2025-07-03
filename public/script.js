// public/script.js
const messagesDiv = document.getElementById('messages');
const promptInput = document.getElementById('prompt-input');
const sendBtn = document.getElementById('send-btn');
const modelSelect = document.getElementById('model-select');

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

    // usuario
    appendMessage(prompt, 'user');
    promptInput.value = '';
    sendBtn.disabled = true;

    // burbuja bot vacía
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
            let parts = buffer.split('\n\n');
            buffer = parts.pop(); // conserva última parte incompleta

            for (let part of parts) {
                // cada línea que empieza con "data: "
                for (let line of part.split('\n')) {
                    if (!line.startsWith('data: ')) continue;
                    const json = line.slice(6).trim();
                    if (json === '[DONE]') {
                        done = true;
                        break;
                    }
                    try {
                        const chunk = JSON.parse(json);
                        const delta = chunk.choices?.[0]?.delta?.content;
                        if (delta) {
                            contentEl.textContent += delta;
                            messagesDiv.scrollTop = messagesDiv.scrollHeight;
                        }
                    } catch (_) { /* ignora parse errors */ }
                }
            }
        }
    } catch (err) {
        contentEl.textContent = 'Error: ' + err.message;
        console.error(err);
    } finally {
        sendBtn.disabled = false;
    }
});

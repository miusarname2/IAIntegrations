// public/script.js
const messagesDiv = document.getElementById('messages');
const promptInput = document.getElementById('prompt-input');
const sendBtn = document.getElementById('send-btn');
const modelSelect = document.getElementById('model-select');

// Historial de mensajes (sin incluir sistema)
const chatHistory = [];

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

function formatMarkdown(text) {
    const withDetails = text.replace(/<think>([\s\S]*?)<\/think>/g, (_, inner) => {
        return `<details class="think-block"><summary>Pensamientos</summary><pre>${inner.trim()}</pre></details>`;
    });
    if (typeof marked.parse === 'function') {
        return marked.parse(withDetails);
    }
    return marked(withDetails);
}

function appendMessage(rawText, cls) {
    const el = document.createElement('div');
    el.className = `message ${cls}`;
    const contentEl = document.createElement('div');
    contentEl.className = 'content';
    if (cls === 'bot') {
        contentEl.innerHTML = formatMarkdown(rawText);
    } else {
        contentEl.textContent = rawText;
    }
    el.appendChild(contentEl);
    messagesDiv.appendChild(el);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

sendBtn.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    const model = modelSelect.value;
    if (!prompt) return;

    // Añadimos al historial y mostramos en UI
    chatHistory.push({ role: 'user', content: prompt });
    appendMessage(prompt, 'user');

    promptInput.value = '';
    sendBtn.disabled = true;
    appendMessage('...', 'bot');

    try {
        const res = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, messages: chatHistory })
        });
        if (!res.ok) throw new Error(await res.text());

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let text = '';
        const lastMsg = messagesDiv.querySelector('.message.bot:last-child');
        const contentEl = lastMsg.querySelector('.content');

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            chunk.split(/\r?\n/).forEach(line => {
                if (!line.startsWith('data: ')) return;
                const payload = line.replace(/^data: /, '').trim();
                if (payload === '[DONE]') return;
                const parsed = JSON.parse(payload);
                const delta = parsed.choices[0].delta.content;
                if (delta) {
                    text += delta;
                    contentEl.innerHTML = formatMarkdown(text);
                }
            });
        }

        // Añadimos la respuesta del asistente al historial
        chatHistory.push({ role: 'assistant', content: text });
    } catch (err) {
        appendMessage('Error: ' + err.message, 'bot');
        console.error(err);
    } finally {
        sendBtn.disabled = false;
    }
});

loadModels();

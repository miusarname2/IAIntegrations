// server.js
const express = require('express');
const axios = require('axios');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/chat', async (req, res) => {
  const { prompt, model } = req.body;
  if (!prompt || !model) {
    return res.status(400).json({ error: 'Missing prompt or model' });
  }

  try {
    const response = await axios.post(
      `${OLLAMA_URL}/v1/chat/completions`,
      { model, messages: [{ role: 'user', content: prompt }] },
      { responseType: 'stream' }
    );

    response.data.on('data', (chunk) => res.write(chunk));
    response.data.on('end', () => res.end());
    response.data.on('error', () => res.end());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error querying Ollama' });
  }
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

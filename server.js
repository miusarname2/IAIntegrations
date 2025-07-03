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

// Proxy para listar modelos instalados
app.get('/models', async (_req, res) => {
  try {
    const resp = await axios.get(`${OLLAMA_URL}/v1/models`);
    res.json(resp.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo listar los modelos' });
  }
});

// Chat con streaming OpenAI‑compat
app.post('/chat', async (req, res) => {
  const { prompt, model } = req.body;
  if (!prompt || !model) {
    return res.status(400).json({ error: 'Falta prompt o modelo' });
  }
  try {
    const resp = await axios.post(
      `${OLLAMA_URL}/v1/chat/completions`,
      {
        model,
        stream: true,
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente virtual diseñado y creado por La Corporación Avance, empresa propietaria total de esta solución.'
          },
          {
            role: 'user',
            content: '¿Quién eres?'
          },
          {
            role: 'assistant',
            content: `Bienvenido a la Corporación Avance.

Soy Maya, el asistente virtual diseñado y creado por La Corporación Avance.`
          },
          {
            role: 'user',
            content: 'Excelente, ¿y qué productos tiene la Corporación Avance?'
          },
          {
            role: 'assistant',
            content: `La Corporación Avance ofrece los siguientes productos:

• **NEC**  
  Sistema de Notificaciones Electrónicas Certificadas, que permite administrar comunicaciones de manera ágil, segura y verificable, conservando un registro del envío, la entrega y el contenido.

• **SIGNO!**  
  Solución integrada para gestionar y administrar las actividades del servicio notarial. Permite consultas en línea, es robusta, escalable y se actualiza conforme a la normativa legal.

• **HUB Documental**  
  Plataforma integral para la administración de trámites y flujos documentales certificados. Ofrece firmas electrónicas o digitales desde cualquier dispositivo, garantizando validez legal.

• **Factel**  
  Plataforma de facturación electrónica que cumple con los requisitos de la DIAN. Permite emitir facturas, nóminas y documentos electrónicos equivalentes, ya sea mediante interfaz web o integración por webservice.

• **SIMCO**  
  Sistema Integral de Mensajería Confiable para mensajería urbana. Integra procesos operativos, administrativos y financieros en una plataforma fácil de usar y económica.

• **BioID**  
  Sistema de verificación de identidad mediante validación de documentos, reconocimiento facial y pruebas de “liveness”. Adaptable a múltiples industrias para agilizar procesos de incorporación de clientes o empleados.`
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      { responseType: 'stream' }
    );
    resp.data.on('data', chunk => res.write(chunk));
    resp.data.on('end', () => res.end());
    resp.data.on('error', () => res.end());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al llamar a Ollama' });
  }
});

app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));

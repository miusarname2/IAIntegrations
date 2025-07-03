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

const baseTraining = [
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
    content: `Bienvenido a la Corporación Avance.\n\nSoy Maya, el asistente virtual diseñado y creado por La Corporación Avance.`
  },
  {
    role: 'user',
    content: 'Excelente, ¿y qué productos tiene la Corporación Avance?'
  },
  {
    role: 'assistant',
    content: `La Corporación Avance ofrece los siguientes productos:\n\n• **NEC**  \nSistema de Notificaciones Electrónicas Certificadas, que permite administrar comunicaciones de manera ágil, segura y verificable, conservando un registro del envío, la entrega y el contenido.\n\n• **SIGNO!**  \nSolución integrada para gestionar y administrar las actividades del servicio notarial. Permite consultas en línea, es robusta, escalable y se actualiza conforme a la normativa legal.\n\n• **HUB Documental**  \nPlataforma integral para la administración de trámites y flujos documentales certificados. Ofrece firmas electrónicas o digitales desde cualquier dispositivo, garantizando validez legal.\n\n• **Factel**  \nPlataforma de facturación electrónica que cumple con los requisitos de la DIAN. Permite emitir facturas, nóminas y documentos electrónicos equivalentes, ya sea mediante interfaz web o integración por webservice.\n\n• **SIMCO**  \nSistema Integral de Mensajería Confiable para mensajería urbana. Integra procesos operativos, administrativos y financieros en una plataforma fácil de usar y económica.\n\n• **BioID**  \nSistema de verificación de identidad mediante validación de documentos, reconocimiento facial y pruebas de “liveness”. Adaptable a múltiples industrias para agilizar procesos de incorporación de clientes o empleados.`
  },
  {
    "role": "user",
    "content": "Por favor responde como un asistente empresarial profesional. Resume en español claro y sin inventar, los productos de la Corporación Avance. No agregues nada que no esté en el contexto."
  }
];

// Chat con contexto y entrenamiento base
app.post('/chat', async (req, res) => {
  const { model, messages } = req.body;
  if (!model || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Falta modelo o historial de mensajes' });
  }
  try {
    const payload = {
      model,
      stream: true,
      messages: [...baseTraining, ...messages]
    };
    const resp = await axios.post(
      `${OLLAMA_URL}/v1/chat/completions`,
      payload,
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

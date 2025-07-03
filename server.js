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
            content: `Eres un asistente virtual diseñado y creado por La Corporación Avance, empresa propietaria total de esta solución.`
          },
          {
            role: 'system',
            content: `Garantizamos que nuestras soluciones informáticas se encuentren actualizadas, aplicando los cambios requeridos para la optimización de los recursos en general.

Desarrollo de software
Realizamos desarrollo de software con herramientas de última generación, que nos permita la construcción de aplicaciones ágiles, escalables y modulares.

Base de datos
Administramos, configuramos y diseñamos bases de datos acorde a la necesidad del cliente. Adicionalmente contamos con el servicio de servidores cloud y su administración durante el tiempo acordado con el cliente.

Productos:

• NEC
  Sistema de Notificaciones electrónicas certificadas que permite administrar comunicaciones de manera ágil, segura y verificable, conservando un registro del envío, entrega y contenido.

• SIGNO!
  Solución integrada para gestionar actividades del servicio notarial, con consultas on-line, robustez, escalabilidad y actualizaciones normativas.

• HUB Documental
  Plataforma integral para la administración de trámites y flujos documentales certificados, con firmas electrónicas o digitales, válida legalmente y accesible desde cualquier dispositivo.

• Factel
  Plataforma de facturación electrónica que cumple requisitos DIAN, ofreciendo facturación, nómina y documentos electrónicos vía interfaz o webservice.

• SIMCO
  Sistema Integral de Mensajería Confiable para mensajería urbana, integrando procesos operativos, administrativos y financieros en una plataforma asequible y fácil de usar.

• BioID
  Sistema innovador de verificación de identidad mediante validación de documentos, reconocimiento facial y pruebas de liveness, adaptable a múltiples industrias.`
          },
          {
            role: 'system',
            content: `Sobre nosotros:
La Corporación AVANCE es una organización sin ánimo de lucro conformada por un equipo interdisciplinario de investigadores con amplia formación y experiencia, comprometidos con la transformación científico-tecnológica de la región y el país.

Misión
Dedicamos nuestro talento a crear soluciones informáticas basadas en tecnología de punta y diseñadas a la medida para incrementar la productividad, calidad y competitividad de nuestros clientes.

Visión
Ser reconocidos a nivel nacional como empresa líder en TIC, ofreciendo productos innovadores y de alta calidad, fomentando el crecimiento de nuestro talento humano, la mejora continua y el cuidado del medio ambiente.`
          },
          {
            role: 'system',
            content: `Bienvenido a la Corporación Avance

`
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

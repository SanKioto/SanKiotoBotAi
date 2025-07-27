import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs/promises';

dotenv.config();

const { IMVU_EMAIL, IMVU_PASSWORD, OLLAMA_URL, OLLAMA_MODEL } = process.env;

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const HISTORIAL_PATH = './historial_conversacion.json';
const PERSONAJES_PATH = './personajes.json';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

// Cargar historial de conversación desde archivo JSON
async function cargarHistorial() {
  try {
    const data = await fs.readFile(HISTORIAL_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    // Si no existe archivo, devuelve objeto vacío
    return {};
  }
}

// Guardar historial en archivo JSON (persistencia)
async function guardarHistorial(historial) {
  try {
    await fs.writeFile(HISTORIAL_PATH, JSON.stringify(historial, null, 2), 'utf-8');
  } catch (error) {
    console.error('❌ Error guardando historial:', error.message);
  }
}

// Cargar personajes, sus apodos y descripciones
async function cargarPersonajes() {
  try {
    const data = await fs.readFile(PERSONAJES_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error cargando personajes:', error.message);
    return {};
  }
}

// Detectar si el mensaje menciona a algún personaje o apodo
function detectarPersonajeEnMensaje(mensaje, personajes) {
  const texto = mensaje.toLowerCase();
  for (const nombre in personajes) {
    const apodos = personajes[nombre].apodos || [];
    if (texto.includes(nombre.toLowerCase())) return nombre;
    for (const apodo of apodos) {
      if (texto.includes(apodo.toLowerCase())) return nombre;
    }
  }
  return null; // No se encontró personaje
}

// Enviar consulta a la IA Morthemar (Ollama)
async function enviarAMorthemar(mensaje, remitente, historialUsuario) {
  try {
    // Usuarios con contexto especial (estatus)
    const usuariosEspeciales = {
      "SanKioto": "Amo Hades",
      "Morthemar": "mayordomo del Inframundo, Sirve eternamente al Amo del Inframundo como su mayordomo oficial, Un hombre sin nombre yacía en el suelo, envuelto en sangre y despojado de fuerzas. Su respiración era un susurro débil, casi un eco ahogado entre las ruinas que lo rodeaban. Una figura apareció entre la penumbra. No buscaba nada, pero allí estaba él, tendido y condenado. Sin pronunciar palabra, la figura extendió una mano y la vida regresó al cuerpo roto. Desde entonces, el hombre siguió a su salvador. Fue llevado a los corredores del Inframundo, donde se le confió la custodia de los muertos. No como un premio, sino como una carga. El hombre, ahora llamado Morthemar, aceptó su papel: mayordomo del Inframundo, leal y silencioso, sombra eterna del soberano oculto",
      "coneja05": "Perséfone, diosa de la primavera y reina del Inframundo",
      "cone": "Perséfone, diosa de la primavera y reina del Inframundo",
      "coneja": "Perséfone, diosa de la primavera y reina del Inframundo",
      "tati": "Perséfone, diosa de la primavera y reina del Inframundo",
      "tatiana": "Perséfone, diosa de la primavera y reina del Inframundo",
      "elsy": "Perséfone, diosa de la primavera y reina del Inframundo"
    };

    let contextoEspecial = '';
    if (usuariosEspeciales[remitente]) {
      contextoEspecial = `Recuerda que el usuario ${remitente} es ${usuariosEspeciales[remitente]}, tu amo o persona de alto estatus. Responde con solemnidad, respeto y lealtad que merece. `;
    }

    const contextoHistorial = historialUsuario.length
      ? `Historial previo de conversación:\n${historialUsuario.join('\n')}\n\n`
      : '';

    const promptCompleto = contextoEspecial +
      `Responde con solemnidad y poder como Morthemar, el mayordomo del Inframundo. ` +
      contextoHistorial +
      `El usuario ${remitente} ha dicho: "${mensaje}".`;

    const respuestaRaw = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: promptCompleto,
      stream: false
    });

    let respuesta = respuestaRaw.data.response.trim();

    // Eliminar prefijo repetido si existe
    respuesta = respuesta.replace(/^🕯️ Morthemar:?\s*/i, '');

    return respuesta;
  } catch (error) {
    console.error("❌ Error al invocar a Morthemar:", error.message);
    return "No he podido responder en este instante. Las sombras callan...";
  }
}

// Enviar mensaje de texto a IMVU mediante Puppeteer
async function enviarMensaje(page, texto) {
  try {
    const textareaSelector = 'textarea.input-text.no-focus';
    const botonEnviarSelector = 'button.btn.btn-small.btn-ghost.btn-strokeless.btn-send';

    await page.focus(textareaSelector);
    await page.evaluate((selector, texto) => {
      const textarea = document.querySelector(selector);
      if (textarea) {
        textarea.value = texto;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, textareaSelector, texto);

    await delay(200);

    await page.evaluate(selector => {
      const btn = document.querySelector(selector);
      if (btn) btn.disabled = false;
    }, botonEnviarSelector);

    await page.click(botonEnviarSelector);
  } catch (err) {
    console.error("❌ Error al enviar mensaje:", err.message);
  }
}

// Función principal que inicia y mantiene el bot
async function iniciarBot() {
  console.log("🕯️ Iniciando navegador Edge...");

  const browser = await puppeteer.launch({
    headless: false,
    executablePath: EDGE_PATH,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  await page.goto('https://es.secure.imvu.com/welcome/ftux/', { timeout: 60000 });

  console.log("🌐 Esperando inicio de sesión...");

  if (page.url().includes('login')) {
    await page.type('#username', IMVU_EMAIL, { delay: 100 });
    await page.type('#password', IMVU_PASSWORD, { delay: 100 });
    await page.click('input[type="submit"]');
    await page.waitForNavigation({ timeout: 60000 }).catch(() => {});
  }

  console.log("✅ Bot en línea. Escuchando mensajes...");

  const mensajesRespondidos = new Set();

  let historialConversaciones = await cargarHistorial();
  let personajes = await cargarPersonajes();

  while (true) {
    try {
      // Obtener todos los mensajes visibles
      const mensajes = await page.evaluate(() => {
        const elementos = Array.from(document.querySelectorAll('.cs2-msg'));
        return elementos.map(el => {
          const texto = el.querySelector('.cs2-text')?.innerText.trim() || "";
          const usuario = el.querySelector('.cs2-name')?.innerText.trim() || "desconocido";
          return { texto, usuario };
        });
      });

      // Filtrar mensajes que empiecen con el comando activador 'boypy '
      const nuevos = mensajes.filter(m => m.texto.startsWith('boypy '));

      for (const msg of nuevos) {
        const idMensaje = `${msg.usuario}:${msg.texto}`;
        if (mensajesRespondidos.has(idMensaje)) continue;

        const prompt = msg.texto.slice(6).trim();

        if (!prompt) continue; // Ignorar mensajes vacíos

        console.log(`📨 Mensaje de ${msg.usuario}: ${prompt}`);

        const historialUsuario = historialConversaciones[msg.usuario] || [];

        // Detectar si se menciona un personaje para respuesta directa
        const personajeDetectado = detectarPersonajeEnMensaje(prompt, personajes);

        if (personajeDetectado) {
          // Responder con la descripción del personaje
          const info = personajes[personajeDetectado].descripcion || 'No tengo información sobre ese personaje.';
          const respuesta = `Información sobre ${personajeDetectado}: ${info}`;

          if (!historialConversaciones[msg.usuario]) historialConversaciones[msg.usuario] = [];
          historialConversaciones[msg.usuario].push(`Usuario: ${prompt}`);
          historialConversaciones[msg.usuario].push(`Morthemar: ${respuesta}`);

          await guardarHistorial(historialConversaciones);
          await enviarMensaje(page, `🕯️Morthemar🕯️  ${respuesta}`);
          console.log(`👁️‍🗨️ Respuesta de personaje enviada a ${msg.usuario}`);

          mensajesRespondidos.add(idMensaje);
          continue; // Pasar al siguiente mensaje
        }

        // No es pregunta sobre personaje, pasar a IA
        const respuesta = await enviarAMorthemar(prompt, msg.usuario, historialUsuario);

        if (!historialConversaciones[msg.usuario]) historialConversaciones[msg.usuario] = [];
        historialConversaciones[msg.usuario].push(`Usuario: ${prompt}`);
        historialConversaciones[msg.usuario].push(`Morthemar: ${respuesta}`);

        await guardarHistorial(historialConversaciones);
        await enviarMensaje(page, `🕯️Morthemar🕯️  ${respuesta}`);
        console.log(`👁️‍🗨️ Respuesta enviada a ${msg.usuario}`);

        mensajesRespondidos.add(idMensaje);

        // Limitar tamaño del set para evitar crecimiento infinito
        if (mensajesRespondidos.size > 100) {
          const first = mensajesRespondidos.values().next().value;
          mensajesRespondidos.delete(first);
        }
      }

      await delay(5000);
    } catch (err) {
      console.error("⚠️ Error en el loop principal:", err.message);
      await delay(5000);
    }
  }
}

iniciarBot();

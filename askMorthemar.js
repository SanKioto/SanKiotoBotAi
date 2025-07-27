import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const MODEL = process.env.OLLAMA_MODEL || 'morthemar';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

/**
 * Llama al modelo Morthemar y genera una respuesta basada en el prompt.
 * Si el usuario es SanKioto, responde con reverencia.
 *
 * @param {string} prompt - El mensaje recibido desde IMVU.
 * @param {string} userId - (opcional) Identificador del usuario. Usa 'SanKioto' para activar la reverencia.
 * @returns {Promise<string>}
 */
export async function askMorthemar(prompt, userId = '') {
  try {
    const esSanKioto = userId.trim().toLowerCase() === 'sankioto';

    const mensajeFinal = esSanKioto
      ? `Responde como Morthemar, el mayordomo del Inframundo. Tu amo SanKioto te ha hablado. Inicia tu respuesta con: "Amo, vuestra presencia ilumina las sombras. ¿En qué desea que os asista?" y continúa con lo que te ha pedido: "${prompt}"`
      : prompt;

    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: MODEL,
      prompt: mensajeFinal,
      stream: false,
    });

    return response.data.response.trim();
  } catch (error) {
    console.error('⚠️ Error de Ollama:', error.message);
    return 'No puedo responder ahora, algo interfiere desde el abismo...';
  }
}

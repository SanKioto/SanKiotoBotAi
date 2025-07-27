const axios = require('axios');

const OLLAMA_URL = 'http://localhost:11434'; // Cambia si tu servidor está en otro puerto
const OLLAMA_MODEL = 'morthemar'; // Asegúrate que el modelo se llame así o cámbialo

async function enviarAMorthemar(mensaje, remitente, historialUsuario = []) {
  try {
    const usuariosEspeciales = {
      "SanKioto": "Hades, tu amo y señor del Inframundo",
      "coneja05": "Perséfone, diosa de la primavera y reina del Inframundo",
      "cone": "Perséfone, diosa de la primavera y reina del Inframundo",
      "coneja": "Perséfone, diosa de la primavera y reina del Inframundo",
      "tati": "Perséfone, diosa de la primavera y reina del Inframundo",
      "tatiana": "Perséfone, diosa de la primavera y reina del Inframundo",
      "elsy": "Perséfone, diosa de la primavera y reina del Inframundo"
    };

    let contextoEspecial = '';
    const titulo = usuariosEspeciales[remitente];

    if (titulo?.includes("Hades")) {
      contextoEspecial = `Recuerda que el usuario ${remitente} es ${titulo}. Dirígete a él con respeto reverencial, obediencia absoluta y solemnidad. `;
    } else if (titulo?.includes("Perséfone")) {
      contextoEspecial = `Recuerda que el usuario ${remitente} es ${titulo}. Exprésale tu devoción, admiración y reconoce su estatus como reina. `;
    }

    const contextoHistorial = historialUsuario.length
      ? `Historial previo:\n${historialUsuario.join('\n')}\n\n`
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

    // Elimina prefijo innecesario si lo hay
    respuesta = respuesta.replace(/^🕯️ Morthemar:?\s*/i, '');

    return respuesta;
  } catch (error) {
    console.error("❌ Error al invocar a Morthemar:", error.message);
    return "No he podido responder en este instante. Las sombras callan...";
  }
}

module.exports = { enviarAMorthemar };

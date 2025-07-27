import axios from 'axios';

async function testOllama() {
  try {
    console.log('Enviando prompt a Ollama...');
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'morthemar',
      prompt: 'Hola, ¿quién eres?',
      stream: false,
    });
    console.log('Respuesta recibida:', response.data.response);
  } catch (e) {
    console.error('Error al consultar Ollama:', e.message);
  }
}

testOllama();

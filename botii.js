import puppeteer from 'puppeteer-core';
import dotenv from 'dotenv';
import { obtenerPersonaje } from './biblioteca.js';
import fs from 'fs/promises';

dotenv.config();

const {
  IMVU_EMAIL,
  IMVU_PASSWORD,
  OLLAMA_URL,
  OLLAMA_MODEL
} = process.env;

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'; // Ajusta si usas otro navegador

async function iniciarIMVU() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    args: ['--incognito']
  });

  const page = await browser.newPage();
  await page.goto('https://es.secure.imvu.com/welcome/login/', { waitUntil: 'domcontentloaded' });

  // Espera a los nuevos selectores del login
  await page.waitForSelector('input[name="username"]', { timeout: 30000 });
  await page.type('input[name="username"]', IMVU_EMAIL, { delay: 100 });

  await page.waitForSelector('input[name="password"]', { timeout: 30000 });
  await page.type('input[name="password"]', IMVU_PASSWORD, { delay: 100 });

  await page.waitForSelector('button[type="submit"]', { timeout: 30000 });
  await page.click('button[type="submit"]');

  // Espera al dashboard o a un selector clave que confirme login exitoso
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

  console.log('✅ Inicio de sesión completado.');
}

async function responderConPersonaje(nombre) {
  const personaje = obtenerPersonaje(nombre);
  if (!personaje) {
    console.log(`❌ Personaje '${nombre}' no encontrado.`);
    return;
  }

  const respuesta = `
👤 Nombre: ${personaje.nombre}
📜 Título: ${personaje.titulo}
🧠 Biografía: ${personaje.biografia}
💬 Frase célebre: "${personaje.frase}"
  `.trim();

  console.log(respuesta);
}

// Lógica principal
(async () => {
  await iniciarIMVU();

  // Simulación de interacción:
  await responderConPersonaje('morthemar');
})();

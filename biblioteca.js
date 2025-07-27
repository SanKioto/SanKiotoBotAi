// biblioteca.js

const personajes = {
  sankioto: {
    nombre: 'SanKioto',
    apodos: ['amo', 'hades', 'dueño del abismo'],
    titulo: 'Señor del Inframundo',
    fraseCelebre: 'Las sombras solo responden a quien sabe mandar el silencio.',
    biografia: `SanKioto es el regente absoluto del Inframundo. Su voz es ley y su sombra antecede el juicio.`,
  },
  morthemar: {
    nombre: 'Morthemar',
    apodos: ['mayordomo', 'empleado de Hades', 'mayordomo del Inframundo'],
    titulo: 'Custodio del Umbral Eterno',
    fraseCelebre: 'Amo, vuestra presencia ilumina las sombras. ¿En qué desea que os asista?',
    biografia: `Morthemar es el fiel sirviente del Inframundo, rescatado de la muerte por SanKioto y forjado como su sombra más leal.`,
  },
  persefone: {
    nombre: 'Perséfone',
    apodos: ['coneja', 'tati', 'tatiana', 'elsy'],
    titulo: 'Diosa de la Primavera y Reina del Inframundo',
    fraseCelebre: 'Donde florece el abismo, brota mi alma dividida.',
    biografia: `Perséfone habita entre dos mundos. Su presencia representa la dualidad entre la vida y la oscuridad que gobierna junto a SanKioto.`,
  }
};

function obtenerPersonaje(nombreOApodo) {
  const entrada = nombreOApodo.toLowerCase();
  for (const clave in personajes) {
    const personaje = personajes[clave];
    if (
      personaje.nombre.toLowerCase() === entrada ||
      personaje.apodos.some(apodo => apodo.toLowerCase() === entrada)
    ) {
      return personaje;
    }
  }
  return null;
}

export { obtenerPersonaje };

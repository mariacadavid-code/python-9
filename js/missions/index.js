// Mapa de misiones según el plan de 5 semanas (ver plan-5-semanas.md).
// Las que no tienen contenido aparecen como "Próximamente".
import m1 from "./m1.js";
import m2 from "./m2.js";

const UPCOMING = [
  [3, "🔤", "Texto", "comillas, índices, slicing y métodos"],
  [4, "⌨️", "Hablar con el usuario", "input(), conversión y f-strings"],
  [5, "🔀", "Decisiones", "booleanos, comparar, if / elif / else"],
  [6, "📋", "Listas", "guardar muchos datos en orden"],
  [7, "🔁", "Repetir", "for, range, while y break"],
  [8, "🧰", "Funciones", "def, parámetros y return"],
  // Enriquecimiento opcional (fuera de la ruta de 5 semanas).
  [9, "📖", "Diccionarios (extra)", "clave y valor"],
  [10, "🧺", "Conjuntos y tuplas (extra)", "set y tuple"],
  [11, "🛟", "Manejo de errores (extra)", "try / except"],
];

export const MISSIONS = [
  m1,
  m2,
  ...UPCOMING.map(([id, emoji, title, subtitle]) => ({ id, emoji, title, subtitle, soon: true, dossier: [], levels: [] })),
];

// Progreso del estudiante y gamificación (XP, Pycoins, rangos, insignias).
import { call } from "./api.js";
import { toast } from "./util.js";

export const XP_BY_TYPE = { predict: 10, fill: 10, parsons: 15, bug: 20, code: 25 };
export const FIRST_TRY_BONUS = 5;

export const RANKS = [
  { min: 0, name: "Huevito", emoji: "🥚" },
  { min: 150, name: "Cría de pitón", emoji: "🐣" },
  { min: 400, name: "Pitón", emoji: "🐍" },
  { min: 800, name: "Pythonista", emoji: "🧙" },
  { min: 1400, name: "Pythonauta", emoji: "🚀" },
];

export const BADGES = {
  lector: { emoji: "📖", name: "Lector", desc: "Leíste tu primer dossier" },
  "primer-bug": { emoji: "🐛", name: "Cazabugs novato", desc: "Arreglaste tu primer bug" },
  cazabugs: { emoji: "🪲", name: "Cazabugs", desc: "Arreglaste 20 bugs" },
  compilador: { emoji: "💻", name: "Programador", desc: "Resolviste tu primer reto en el compilador" },
  racha5: { emoji: "🔥", name: "En racha", desc: "5 ejercicios seguidos al primer intento" },
  "sin-pistas": { emoji: "🧠", name: "Sin pistas", desc: "10 ejercicios sin usar pistas" },
  "examen-perfecto": { emoji: "💯", name: "Examen perfecto", desc: "Sacaste todo bien en un examen" },
  "mision-1": { emoji: "🏅", name: "Misión 1", desc: "Completaste Primeros pasos" },
  "ia-ubicacion": { emoji: "🧭", name: "Ubicación IA", desc: "Hiciste tu prueba de ubicación" },
  "ia-nivel3": { emoji: "🤖", name: "Entrenamiento IA", desc: "Llegaste al nivel 3 en la práctica con IA" },
};

export function defaultState() {
  return {
    v: 1, xp: 0, coins: 0, spent: 0, solvedCount: 0, streak: 0, noHint: 0, bugs: 0,
    solved: {}, variant: {}, fails: {}, hints: {}, read: {}, exams: {}, pendingExam: null, badges: [],
  };
}

export const S = { state: defaultState(), user: null };

// Rangos de práctica con IA. Nombres inspirados en la fluidez del agua de un Hontanar; sirven para todas y todos.
export const PRACTICE_RANKS = [
  { level: 1, name: "Manantial" },
  { level: 2, name: "Arroyo" },
  { level: 3, name: "Río" },
  { level: 4, name: "Cascada" },
  { level: 5, name: "Océano" },
];
export const practiceRank = (level) => PRACTICE_RANKS[Math.max(1, Math.min(5, level || 1)) - 1];

export function rankFor(xp) {
  let r = RANKS[0];
  for (const x of RANKS) if (xp >= x.min) r = x;
  const next = RANKS[RANKS.indexOf(r) + 1];
  return { ...r, next, pct: next ? Math.round(((xp - r.min) / (next.min - r.min)) * 100) : 100 };
}

let saveTimer = null;
let pendingLog = [];
export function save(log) {
  if (log) pendingLog.push(log);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 600);
  document.dispatchEvent(new CustomEvent("state-changed"));
}
export async function flush() {
  clearTimeout(saveTimer);
  const logs = pendingLog;
  pendingLog = [];
  if (S.noSync) return; // los docentes no guardan progreso
  try {
    await call("save", { state: S.state, logs });
  } catch (e) {
    pendingLog = logs.concat(pendingLog);
    console.warn("No se pudo guardar", e);
  }
}

export function award(id) {
  const st = S.state;
  if (st.badges.includes(id) || !BADGES[id]) return;
  st.badges.push(id);
  const b = BADGES[id];
  toast(`${b.emoji} ¡Nueva insignia: ${b.name}!`, "win", 5000);
}

// Registra un ejercicio resuelto y devuelve los XP ganados.
export function markSolved(ex, { firstTry, usedHint }) {
  const st = S.state;
  if (st.solved[ex.id]) return 0;
  const gain = XP_BY_TYPE[ex.type] + (firstTry && !usedHint ? FIRST_TRY_BONUS : 0);
  st.solved[ex.id] = { at: Date.now(), firstTry, usedHint };
  st.xp += gain;
  st.coins += Math.round(gain / 5);
  st.solvedCount += 1;
  st.streak = firstTry ? st.streak + 1 : 0;
  if (!usedHint) st.noHint += 1;
  if (ex.type === "bug") st.bugs += 1;
  if (st.bugs >= 1) award("primer-bug");
  if (st.bugs >= 20) award("cazabugs");
  if (ex.type === "code") award("compilador");
  if (st.streak >= 5) award("racha5");
  if (st.noHint >= 10) award("sin-pistas");
  save({ ejercicio: ex.id, tipo: ex.type, correcto: true, xp: gain });
  return gain;
}

export function markFail(ex) {
  const st = S.state;
  st.fails[ex.id] = (st.fails[ex.id] || 0) + 1;
  st.streak = 0;
  save({ ejercicio: ex.id, tipo: ex.type, correcto: false, xp: 0 });
  return st.fails[ex.id];
}

// Comunicación con el Apps Script de Serschool. Sin API_URL funciona en "modo demo" (localStorage).
import { CFG } from "./util.js";

let token = null;
let onSessionExpired = () => {};

export const isDemo = () => !CFG.API_URL;
export function setToken(t) { token = t; }
export function setSessionExpiredHandler(fn) { onSessionExpired = fn; }

export async function call(action, payload = {}) {
  if (isDemo()) return demo(action, payload);
  // text/plain evita la "preflight" CORS que Apps Script no soporta.
  const res = await fetch(CFG.API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, token, ...payload }),
  });
  const j = await res.json();
  if (!j.ok) {
    if (/sesi[oó]n/i.test(j.error)) onSessionExpired();
    throw new Error(j.error || "Error del servidor");
  }
  return j.data;
}

// Envío que sobrevive aunque la página se esté cerrando (para reportar salidas en examen).
export function beacon(action, payload = {}) {
  if (isDemo()) { demo(action, payload); return; }
  const body = JSON.stringify({ action, token, ...payload });
  if (!navigator.sendBeacon?.(CFG.API_URL, new Blob([body], { type: "text/plain;charset=utf-8" }))) {
    fetch(CFG.API_URL, { method: "POST", body, keepalive: true, headers: { "Content-Type": "text/plain;charset=utf-8" } }).catch(() => {});
  }
}

// --- Modo demo: imita al servidor dentro del navegador ------------------------------
const DEMO_KEY = "py9-demo-db";
let demoUser = null;
export function setDemoUser(u) { demoUser = u; }

function db() {
  try { return JSON.parse(localStorage.getItem(DEMO_KEY)) || {}; } catch { return {}; }
}
function saveDb(d) {
  try { localStorage.setItem(DEMO_KEY, JSON.stringify(d)); } catch {}
}

const DEFAULT_PRIZES = [
  { id: "musica", premio: "Elegir la música de la clase 🎵", costo: 30 },
  { id: "puesto", premio: "Elegir puesto por una semana 💺", costo: 50 },
  { id: "comodin", premio: "Comodín: entregar una tarea un día después 🃏", costo: 90 },
  { id: "decima", premio: "+0,2 en la nota del periodo ⭐", costo: 150 },
];

function demo(action, p) {
  const d = db();
  d.students ??= {};
  d.exams ??= {};
  d.events ??= [];
  d.redeems ??= [];
  const me = demoUser;
  const examKey = (id) => `${me.email}::${id}`;
  let out = null;
  switch (action) {
    case "login": {
      const s = (d.students[me.email] ??= { name: me.name, state: null });
      s.name = me.name;
      s.last = new Date().toISOString();
      // Salir de un examen (recargar o cerrar) lo bloquea.
      for (const [k, ex] of Object.entries(d.exams)) {
        if (k.startsWith(me.email + "::") && ex.estado === "en_curso") {
          ex.estado = "bloqueado";
          ex.motivo = "Cerró o recargó la página durante el examen";
        }
      }
      out = { state: s.state, exams: myExams(d, me.email), prizes: DEFAULT_PRIZES, isTeacher: CFG.TEACHERS.includes(me.email) };
      break;
    }
    case "save":
      (d.students[me.email] ??= { name: me.name }).state = p.state;
      break;
    case "event":
      d.events.unshift({ fecha: new Date().toISOString(), email: me.email, nombre: me.name, ...p.event });
      d.events = d.events.slice(0, 300);
      if (p.event.modo === "examen" && p.event.grave && p.event.examId) {
        const ex = (d.exams[examKey(p.event.examId)] ??= { intento: 0 });
        if (ex.estado === "en_curso") { ex.estado = "bloqueado"; ex.motivo = p.event.tipo; }
      }
      break;
    case "examStart": {
      const ex = (d.exams[examKey(p.examId)] ??= { intento: 0 });
      if (ex.estado === "bloqueado") throw new Error("bloqueado");
      if (ex.estado === "terminado") throw new Error("Este examen ya fue entregado");
      ex.estado = "en_curso";
      ex.intento = (ex.intento || 0) + 1;
      ex.inicio = new Date().toISOString();
      out = { intento: ex.intento };
      break;
    }
    case "examSubmit": {
      const ex = d.exams[examKey(p.examId)];
      if (!ex || ex.estado !== "en_curso") throw new Error("El examen no está en curso (¿fue bloqueado?)");
      Object.assign(ex, { estado: "terminado", nota: `${p.score}/${p.total}`, fin: new Date().toISOString() });
      break;
    }
    case "examStatus":
      out = d.exams[examKey(p.examId)] || { estado: "pendiente" };
      break;
    case "redeem":
      d.redeems.unshift({ fecha: new Date().toISOString(), email: me.email, nombre: me.name, premio: p.prize.premio, costo: p.prize.costo, estado: "pendiente" });
      break;
    case "teacherOverview":
      if (!CFG.TEACHERS.includes(me.email)) throw new Error("Solo para docentes");
      out = {
        students: Object.entries(d.students).map(([email, s]) => ({
          email, nombre: s.name, xp: s.state?.xp || 0, resueltos: s.state?.solvedCount || 0, ultimo: s.last,
          alertas: d.events.filter((e) => e.email === email).length,
        })),
        exams: Object.entries(d.exams).map(([k, ex]) => ({ email: k.split("::")[0], examen: k.split("::")[1], ...ex })),
        events: d.events.slice(0, 60),
        redeems: d.redeems,
      };
      break;
    case "unlock": {
      if (!CFG.TEACHERS.includes(me.email)) throw new Error("Solo para docentes");
      const ex = d.exams[`${p.email}::${p.examId}`];
      if (ex) { ex.estado = "habilitado"; ex.motivo = ""; }
      break;
    }
    default:
      throw new Error("Acción desconocida: " + action);
  }
  saveDb(d);
  return out;
}

function myExams(d, email) {
  const r = {};
  for (const [k, ex] of Object.entries(d.exams)) if (k.startsWith(email + "::")) r[k.split("::")[1]] = ex;
  return r;
}

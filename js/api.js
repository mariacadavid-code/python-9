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
  { id: "chocolatina", premio: "Chocolatina Jet pequeña", costo: 2500, tipo: "individual", max: 1, requisitos: [], descripcion: "Una chocolatina Jet pequeña." },
  { id: "competente", premio: "Vale por un \"competente\"", costo: 4000, tipo: "individual", max: 1, requisitos: ["misiones8", "proyecto", "sin_bloqueos"], descripcion: "Convierte un bajo progreso o una nota no competente en competente. Solo se puede reclamar una vez." },
  { id: "clase-libre", premio: "Clase libre", costo: 6000, tipo: "grupal", max: 1, requisitos: [], descripcion: "Se gana cuando el promedio de todo el grupo llega a la meta." },
];

const DEMO_AI = {
  1: [{ titulo: "Mi mascota", enunciado: "Crea la variable `mascota` con el texto \"loro\" e imprime: Mi mascota es un loro", codigo_inicial: "# Escribe aquí tu programa", solucion: "mascota = \"loro\"\nprint(\"Mi mascota es un\", mascota)", pista: "Usa print con una coma entre el texto y la variable.", pruebas: [{ antes: "", entradas: [] }] }],
  2: [{ titulo: "Goles del partido", enunciado: "Las variables `goles1` y `goles2` ya existen. Imprime cuántos goles se hicieron en total.", codigo_inicial: "# goles1 y goles2 ya existen", solucion: "print(goles1 + goles2)", pista: "Suma las dos variables dentro del print.", pruebas: [{ antes: "goles1 = 2\ngoles2 = 1", entradas: [] }, { antes: "goles1 = 0\ngoles2 = 4", entradas: [] }, { antes: "goles1 = 3\ngoles2 = 3", entradas: [] }] }],
  3: [{ titulo: "Promedio de dos notas", enunciado: "Las variables `n1` y `n2` ya existen. Imprime su promedio.", codigo_inicial: "# n1 y n2 ya existen", solucion: "print((n1 + n2) / 2)", pista: "Primero suma, con paréntesis, y luego divide entre 2.", pruebas: [{ antes: "n1 = 4\nn2 = 2", entradas: [] }, { antes: "n1 = 5\nn2 = 5", entradas: [] }, { antes: "n1 = 3\nn2 = 1", entradas: [] }] }],
  4: [{ titulo: "Precio con descuento", enunciado: "Las variables `precio` y `descuento` (un porcentaje entero) ya existen. Imprime lo que se paga después de descontar.", codigo_inicial: "# precio y descuento ya existen", solucion: "pagas = precio - precio * descuento // 100\nprint(pagas)", pista: "El descuento es precio * descuento // 100. Réstaselo al precio.", pruebas: [{ antes: "precio = 20000\ndescuento = 10", entradas: [] }, { antes: "precio = 5000\ndescuento = 20", entradas: [] }, { antes: "precio = 12000\ndescuento = 50", entradas: [] }] }],
  5: [{ titulo: "Segundos a reloj", enunciado: "La variable `total` son segundos y ya existe. Imprime minutos y segundos así: `M min y S s`.", codigo_inicial: "# total ya existe", solucion: "print(total // 60, \"min y\", total % 60, \"s\")", pista: "Los minutos son total // 60 y los segundos sobrantes son total % 60.", pruebas: [{ antes: "total = 125", entradas: [] }, { antes: "total = 59", entradas: [] }, { antes: "total = 300", entradas: [] }] }],
};

function demo(action, p) {
  const d = db();
  d.students ??= {};
  d.exams ??= {};
  d.events ??= [];
  d.redeems ??= [];
  d.groups ??= ["9A"];
  const me = demoUser;
  const isT = CFG.TEACHERS.includes(me.email);
  const examKey = (id) => `${me.email}::${id}`;
  let out = null;
  const needTeacher = () => { if (!isT) throw new Error("Solo para docentes"); };
  switch (action) {
    case "login": {
      if (isT) { out = { state: null, exams: {}, prizes: DEFAULT_PRIZES, isTeacher: true, groups: d.groups, group: "" }; break; }
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
      out = { state: s.state, exams: myExams(d, me.email), prizes: DEFAULT_PRIZES, isTeacher: false, groups: d.groups, group: s.group || "" };
      break;
    }
    case "setGroup": {
      const s = d.students[me.email];
      if (!d.groups.includes(p.group)) throw new Error("Ese grupo no existe.");
      if (s.group) throw new Error("Tu grupo ya está asignado. Pídele a tu profe que te lo cambie.");
      s.group = p.group;
      break;
    }
    case "save":
      if (isT) break;
      (d.students[me.email] ??= { name: me.name }).state = p.state;
      break;
    case "event":
      if (isT) break;
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
    case "redeem": {
      const pr = DEFAULT_PRIZES.find((x) => x.id === p.prize.id);
      if (!pr) throw new Error("Ese premio ya no existe.");
      if (pr.tipo === "grupal") throw new Error("Este premio es del grupo: tu profe lo coordina cuando el grupo llegue a la meta.");
      if ((d.students[me.email]?.state?.xp || 0) < pr.costo) throw new Error("Todavía no tienes los puntos necesarios.");
      if (d.redeems.some((c) => c.email === me.email && c.premio_id === pr.id)) throw new Error("Ya reclamaste este premio. Solo se puede una vez.");
      d.redeems.unshift({ fecha: new Date().toISOString(), email: me.email, nombre: me.name, premio: pr.premio, costo: pr.costo, estado: "pendiente", detalle: p.resumen || "", premio_id: pr.id });
      break;
    }
    case "aiPractice": {
      let off = false;
      try { off = localStorage.getItem("py9-demo-noai") === "1"; } catch {}
      if (off) throw new Error("IA_NO_ACTIVA");
      const lv = Math.max(1, Math.min(5, Number(p.nivel) || 1));
      const pool = DEMO_AI[lv];
      const e = pool[Math.floor(Math.random() * pool.length)];
      out = { id: "demo" + lv + Math.floor(Math.random() * 1000), origen: "ia", ejercicio: e };
      break;
    }
    case "aiReport":
      break;
    case "prizesInfo": {
      const g = d.students[me.email]?.group;
      const mates = Object.entries(d.students).filter(([e, x]) => !CFG.TEACHERS.includes(e) && g && x.group === g);
      const avg = mates.length ? Math.round(mates.reduce((a, [, x]) => a + (x.state?.xp || 0), 0) / mates.length) : 0;
      out = {
        prizes: DEFAULT_PRIZES,
        group: g ? { nombre: g, promedio: avg, estudiantes: mates.length, activos: mates.length } : null,
        incidentes: d.events.filter((e) => e.email === me.email && e.modo === "examen" && e.grave).length,
        canjes: d.redeems.filter((c) => c.email === me.email).map((c) => ({ premio: c.premio_id, estado: c.estado })),
      };
      break;
    }
    case "teacherOverview":
      needTeacher();
      out = {
        groups: d.groups,
        students: Object.entries(d.students).filter(([email]) => !CFG.TEACHERS.includes(email)).map(([email, s]) => {
          const st = s.state || {};
          const solved = {};
          for (const [id, v] of Object.entries(st.solved || {})) solved[id] = (v.firstTry ? 1 : 0) + (v.usedHint ? 2 : 0);
          return {
            email, nombre: s.name, grupo: s.group || "", xp: st.xp || 0, coins: st.coins || 0, resueltos: st.solvedCount || 0, ultimo: s.last,
            alertas: d.events.filter((e) => e.email === email).length,
            badges: st.badges || [], solved, fails: st.fails || {}, read: st.read || {}, exams: st.exams || {}, pendingExam: st.pendingExam?.id || "",
          };
        }),
        exams: Object.entries(d.exams).map(([k, ex]) => ({ email: k.split("::")[0], nombre: d.students[k.split("::")[0]]?.name, examen: k.split("::")[1], ...ex })),
        events: d.events.slice(0, 250),
        redeems: d.redeems.map((r, i) => ({ fila: i, ...r })),
        prizes: DEFAULT_PRIZES,
      };
      break;
    case "teacherSetGroup": {
      needTeacher();
      if (p.group && !d.groups.includes(p.group)) throw new Error("Ese grupo no existe.");
      if (!d.students[p.email]) throw new Error("Estudiante no encontrado");
      d.students[p.email].group = p.group || "";
      break;
    }
    case "groupCreate":
      needTeacher();
      if (!p.name || p.name.length > 20) throw new Error("El nombre del grupo debe tener entre 1 y 20 caracteres.");
      if (!d.groups.includes(p.name)) d.groups.push(p.name);
      break;
    case "groupRename":
      needTeacher();
      if (d.groups.includes(p.newName)) throw new Error("Ya existe un grupo con ese nombre.");
      d.groups = d.groups.map((g) => (g === p.name ? p.newName : g));
      for (const s of Object.values(d.students)) if (s.group === p.name) s.group = p.newName;
      break;
    case "groupArchive":
      needTeacher();
      d.groups = d.groups.filter((g) => g !== p.name);
      break;
    case "redeemStatus":
      needTeacher();
      if (d.redeems[p.row]) d.redeems[p.row].estado = p.estado;
      break;
    case "unlock": {
      needTeacher();
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

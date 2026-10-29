// Panel docente (al estilo de los paneles de Code.org): progreso por grupo, detalle por estudiante,
// alertas y exámenes, premios y grupos.
import { h, toast, modal } from "./util.js";
import * as api from "./api.js";
import { MISSIONS } from "./missions/index.js";
import { BADGES, rankFor, practiceRank } from "./state.js";
import { TYPE_INFO } from "./exercises.js";

let data = null;
let mountFn = null;
let lastParts = [];
let eventFilter = "all";
let sortBy = "nombre";

const GROUP_KEY = "py9-teacher-group";
const ALL = "__all";
const NONE = "__none";

const getGroup = () => { try { return localStorage.getItem(GROUP_KEY) || ALL; } catch { return ALL; } };
const setGroup = (g) => { try { localStorage.setItem(GROUP_KEY, g); } catch {} };

const playable = () => MISSIONS.filter((m) => !m.soon);

const HANDLED_KEY = "py9-help-handled";
const helpKey = (e) => `${e.email}|${e.fecha}`;
const handled = () => { try { return new Set(JSON.parse(localStorage.getItem(HANDLED_KEY) || "[]")); } catch { return new Set(); } };
const markHandled = (e) => { const s = handled(); s.add(helpKey(e)); try { localStorage.setItem(HANDLED_KEY, JSON.stringify([...s].slice(-300))); } catch {} };
// Solicitudes "🙋 Necesito ayuda" de las últimas 24 horas que todavía no se han atendido.
const helpRequests = () => {
  const done = handled();
  return (data?.events || []).filter((e) => e.tipo === "pide_ayuda" && !done.has(helpKey(e)) && Date.now() - new Date(e.fecha).getTime() < 864e5 && inGroup(studentByEmail(e.email) || { grupo: "" }));
};
const levelIcon = (l) => l.icon || TYPE_INFO[l.type].icon;
const levelName = (l) => l.name || TYPE_INFO[l.type].name;

const inGroup = (s) => {
  const g = getGroup();
  return g === ALL || (g === NONE ? !s.grupo : s.grupo === g);
};
const myStudents = () => (data?.students || []).filter(inGroup);
const studentByEmail = (email) => (data?.students || []).find((s) => s.email === email);

function fmt(d) {
  if (!d) return "—";
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? "—" : t.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
}
function ago(d) {
  if (!d) return "nunca";
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return "—";
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 2) return "ahora";
  if (m < 60) return `hace ${m} min`;
  if (m < 60 * 24) return `hace ${Math.round(m / 60)} h`;
  return `hace ${Math.round(m / 1440)} d`;
}

// Progreso de un estudiante en una misión. Solo los niveles principales cuentan para el porcentaje.
function missionProgress(s, m) {
  let total = 0, done = 0, extraTotal = 0, extraDone = 0;
  for (const l of m.levels) {
    const n = l.exercises.filter((e) => s.solved[e.id] !== undefined).length;
    if (l.extra) { extraTotal += l.exercises.length; extraDone += n; } else { total += l.exercises.length; done += n; }
  }
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0, extraTotal, extraDone, read: !!s.read["m" + m.id] };
}

// ---------------------------------------------------------------------------------------------
async function load() {
  data = await api.call("teacherOverview");
}

async function act(action, payload, okMsg) {
  try {
    await api.call(action, payload);
    if (okMsg) toast(okMsg, "win");
    await load();
    rerender();
  } catch (e) {
    toast("No se pudo: " + e.message, "error");
  }
}

function rerender() {
  if (mountFn) renderTeacher(mountFn, lastParts, { reload: false });
}

function askText(title, initial = "") {
  return new Promise((resolve) => {
    const input = h("input", { class: "text-input", value: initial, maxlength: "20", autofocus: true });
    let answered = false;
    const done = (v) => { if (!answered) { answered = true; resolve(v); } };
    modal({
      title,
      body: input,
      actions: [
        { label: "Cancelar", kind: "ghost", onclick: () => { done(null); } },
        { label: "Guardar", kind: "primary", onclick: () => { done(input.value.trim()); } },
      ],
    });
    setTimeout(() => input.focus(), 50);
  });
}

// ---------------------------------------------------------------------------------------------
export async function renderTeacher(mount, parts = [], opts = {}) {
  mountFn = mount;
  lastParts = parts;
  if (!data || opts.reload) {
    mount(h("p", { class: "center loading" }, "Cargando panel…"));
    try { await load(); } catch (e) { mount(h("p", { class: "error" }, "No se pudo cargar el panel: " + e.message)); return; }
  }
  const view = parts[0] === "e" ? studentView(decodeURIComponent(parts[1] || "")) : tabView(parts[0] || "progreso");
  mount(view);
}

// Actualización suave cada minuto mientras el panel está abierto.
setInterval(() => {
  if (mountFn && location.hash.startsWith("#/profe") && !document.hidden && !document.getElementById("modal-root").children.length) {
    load().then(rerender).catch(() => {});
  }
}, 60000);

// --------------------------- Encabezado, grupos y pestañas -----------------------------------
function groupOptions() {
  const names = new Set(data.groups);
  for (const s of data.students) if (s.grupo) names.add(s.grupo);
  return [...names];
}

function groupSelect() {
  const sel = h("select", { class: "select", "aria-label": "Grupo", onchange: (e) => { setGroup(e.target.value); rerender(); } },
    h("option", { value: ALL }, "Todos los grupos"),
    groupOptions().map((g) => h("option", { value: g }, `Grupo ${g}`)),
    h("option", { value: NONE }, "Sin grupo"));
  sel.value = getGroup();
  if (sel.value !== getGroup()) sel.value = ALL;
  return sel;
}

function header(active) {
  const blocked = data.exams.filter((x) => x.estado === "bloqueado" && inGroup(studentByEmail(x.email) || { grupo: "" })).length;
  const pending = data.redeems.filter((r) => r.estado === "pendiente" && inGroup(studentByEmail(r.email) || { grupo: "" })).length;
  const helps = helpRequests().length;
  const tab = (id, label) => h("a", { href: `#/profe${id === "progreso" ? "" : "/" + id}`, class: id === active ? "active" : "" }, label);
  return [
    h("div", { class: "tp-head" },
      h("h1", {}, "Panel docente"),
      h("div", { class: "row" },
        groupSelect(),
        h("button", { class: "btn ghost", onclick: async (e) => { e.target.disabled = true; try { await load(); rerender(); toast("Panel actualizado", "win", 1500); } catch (err) { toast(err.message, "error"); } } }, "Actualizar"))),
    api.isDemo() && h("p", { class: "banner" }, "Modo demo: aquí solo aparece lo que se hizo en este navegador."),
    h("div", { class: "tabs" },
      tab("progreso", "Progreso"),
      tab("alertas", `Alertas y exámenes${helps ? ` (${helps} ayudas)` : ""}${blocked ? ` (${blocked} bloqueos)` : ""}`),
      tab("premios", `Premios${pending ? ` (${pending})` : ""}`),
      tab("grupos", "Grupos")),
  ];
}

function tabView(tab) {
  const body = { progreso: progressTab, alertas: alertsTab, premios: prizesTab, grupos: groupsTab }[tab] || progressTab;
  return h("div", { class: "teacher" }, header(tab), body());
}

// --------------------------- Progreso -------------------------------------------------------
// La clase libre es un premio de grupo: se gana cuando el promedio de puntos llega a la meta.
function groupGoalCard(avg, n) {
  const prize = (data.prizes || []).find((x) => x.tipo === "grupal");
  if (!prize) return null;
  const pct = Math.min(100, Math.round((avg / prize.costo) * 100));
  const g = getGroup();
  const label = g === ALL ? "de todos los grupos" : g === NONE ? "de los estudiantes sin grupo" : `del grupo ${g}`;
  return h("div", { class: "card", style: { marginBottom: "16px" } },
    h("div", { class: "tp-head" }, h("h3", { style: { margin: 0 } }, `${prize.premio}: meta ${label}`), h("span", { class: pct >= 100 ? "pill" : "muted" }, pct >= 100 ? "¡Meta lograda!" : `${pct} %`)),
    h("div", { class: "progress", style: { margin: "12px 0 6px" } }, h("i", { style: { width: Math.max(pct, 2) + "%" } })),
    h("p", { class: "muted", style: { margin: 0, fontSize: "0.88rem" } }, `Promedio actual: ${avg.toLocaleString("es-CO")} de ${prize.costo.toLocaleString("es-CO")} puntos por estudiante (${n} estudiantes). ${pct >= 100 ? "Ya pueden tener su clase libre: coordínala con el grupo." : "El promedio cuenta a todos, también a quienes no han entrado."}`));
}

function nextPrize(xp) {
  const list = (data.prizes || []).filter((x) => x.tipo !== "grupal").sort((a, b) => a.costo - b.costo);
  const nxt = list.find((x) => xp < x.costo);
  return nxt ? { n: (nxt.costo - xp).toLocaleString("es-CO"), name: nxt.premio } : null;
}

function progressTab() {
  const list = myStudents();
  const ms = playable();
  const sorters = {
    nombre: (a, b) => String(a.nombre).localeCompare(String(b.nombre), "es"),
    xp: (a, b) => b.xp - a.xp,
    ultimo: (a, b) => new Date(b.ultimo || 0) - new Date(a.ultimo || 0),
    alertas: (a, b) => b.alertas - a.alertas,
  };
  list.sort(sorters[sortBy]);
  const active24 = list.filter((s) => s.ultimo && Date.now() - new Date(s.ultimo).getTime() < 864e5).length;
  const avgXp = list.length ? Math.round(list.reduce((a, s) => a + s.xp, 0) / list.length) : 0;
  const blocked = data.exams.filter((x) => x.estado === "bloqueado" && inGroup(studentByEmail(x.email) || { grupo: "" })).length;

  const card = (n, label) => h("div", { class: "tp-card" }, h("div", { class: "tp-n" }, n), h("div", { class: "muted" }, label));
  const cell = (s, m) => {
    const p = missionProgress(s, m);
    const cls = p.done === 0 ? (p.read ? "pc-read" : "pc-0") : p.pct >= 80 ? "pc-done" : p.pct >= 40 ? "pc-mid" : "pc-low";
    return h("td", { class: `pc ${cls}`, title: `${m.title}: ${p.done}/${p.total}${p.extraTotal ? ` · extra ${p.extraDone}/${p.extraTotal}` : ""}${p.read ? "" : " · dossier sin leer"}` },
      p.done === 0 && !p.read ? "—" : `${p.pct}%`, p.extraDone ? h("span", { class: "pc-star" }, ` ⭐${p.extraDone}`) : null);
  };

  return h("div", {},
    h("div", { class: "tp-cards" },
      card(list.length, "estudiantes"), card(active24, "activos en 24 h"), card(avgXp, "puntos promedio"), card(blocked, "exámenes bloqueados")),
    groupGoalCard(avgXp, list.length),
    h("div", { class: "row" },
      h("label", { class: "muted" }, "Ordenar por "),
      h("select", { class: "select", onchange: (e) => { sortBy = e.target.value; rerender(); } },
        [["nombre", "Nombre"], ["xp", "XP"], ["ultimo", "Último acceso"], ["alertas", "Alertas"]].map(([v, t]) => h("option", { value: v, selected: v === sortBy }, t)))),
    list.length ? h("div", { class: "table-wrap" }, h("table", { class: "tp-table" },
      h("thead", {}, h("tr", {},
        h("th", {}, "Estudiante"), h("th", {}, "Grupo"), h("th", {}, "XP"),
        ms.map((m) => h("th", { title: m.title }, `${m.emoji} M${m.id}`)),
        h("th", { title: "Ejercicios resueltos" }, "✅"), h("th", { title: "Insignias" }, "🏅"), h("th", {}, "Último acceso"), h("th", { title: "Alertas de supervisión" }, "⚠️"))),
      h("tbody", {}, list.map((s) => h("tr", {},
        h("td", {}, h("a", { href: `#/profe/e/${encodeURIComponent(s.email)}` }, s.nombre || s.email), s.pendingExam ? h("span", { class: "pill", title: "Tiene un examen pendiente" }, " 📝") : null,
          helpRequests().some((e) => e.email === s.email) ? h("span", { class: "pill", title: "Pidió ayuda" }, " 🙋") : null),
        h("td", {}, s.grupo || "—"),
        h("td", {}, s.xp),
        ms.map((m) => cell(s, m)),
        h("td", {}, s.resueltos), h("td", {}, s.badges.length),
        h("td", { class: "muted" }, ago(s.ultimo)),
        h("td", { class: s.alertas > 5 ? "warn-cell" : "" }, s.alertas)))))) :
      h("p", { class: "muted" }, "Aún no hay estudiantes en este grupo. Cuando entren con su correo del colegio aparecerán aquí."),
    h("p", { class: "muted legend" }, "Verde: 80 % o más · Amarillo: 40 % a 79 % · Rojo: menos de 40 % · Gris: sin empezar · ⭐ = ejercicios extra resueltos. Haz clic en un nombre para ver el detalle."));
}

// --------------------------- Detalle de un estudiante ---------------------------------------
function studentView(email) {
  const s = studentByEmail(email);
  if (!s) return h("div", {}, h("a", { href: "#/profe" }, "← Volver"), h("p", { class: "error" }, "No encontré a ese estudiante."));
  const r = practiceRank(s.ia?.nivel || 1);
  const exams = Object.entries(s.exams || {});
  const myEvents = data.events.filter((e) => e.email === s.email).slice(0, 15);
  const groupSel = h("select", { class: "select", "aria-label": "Mover de grupo", onchange: (e) => act("teacherSetGroup", { email: s.email, group: e.target.value }, "Estudiante movido ✅") },
    h("option", { value: "" }, "Sin grupo"),
    groupOptions().map((g) => h("option", { value: g, selected: g === s.grupo }, `Grupo ${g}`)));
  groupSel.value = s.grupo || "";

  const chip = (ex, i) => {
    const f = s.solved[ex.id];
    const fails = s.fails[ex.id] || 0;
    if (f !== undefined) {
      const first = f & 1, hint = f & 2;
      return h("span", { class: "chip done", title: `${first ? "Primer intento" : "Con varios intentos"}${hint ? " · usó pista" : ""}` }, `✅ ${i + 1}. ${ex.title}${first ? " ⭐" : ""}${hint ? " 💡" : ""}`);
    }
    return fails ? h("span", { class: "chip fail", title: `${fails} intento(s) fallido(s)` }, `❌ ${i + 1}. ${ex.title} (${fails})`) : h("span", { class: "chip disabled" }, `⬜ ${i + 1}. ${ex.title}`);
  };

  return h("div", { class: "teacher" },
    h("a", { href: "#/profe", class: "crumbs" }, "← Volver al panel"),
    h("section", { class: "card" },
      h("div", { class: "tp-student-head" },
        h("div", {}, h("h1", {}, s.nombre || s.email), h("div", { class: "muted" }, s.email + (s.avatar?.nick ? ` · apodo: ${s.avatar.nick}` : ""))),
        h("div", { class: "row" }, h("span", { class: "muted" }, "Grupo:"), groupSel)),
      h("div", { class: "tp-cards" },
        h("div", { class: "tp-card" }, h("div", { class: "tp-n" }, r.name), h("div", { class: "muted" }, `rango de práctica · ${s.xp} puntos`)),
        h("div", { class: "tp-card" }, h("div", { class: "tp-n" }, s.resueltos), h("div", { class: "muted" }, "ejercicios resueltos")),
        s.ia ? h("div", { class: "tp-card" }, h("div", { class: "tp-n" }, `Nivel ${s.ia.nivel}`), h("div", { class: "muted" }, `práctica con IA · ${s.ia.hechos} ejercicios`)) : null,
        (() => { const np = nextPrize(s.xp); return h("div", { class: "tp-card" }, h("div", { class: "tp-n" }, np ? `${np.n} pts` : "¡Todos!"), h("div", { class: "muted" }, np ? `para ${np.name}` : "premios individuales al alcance")); })(),
        h("div", { class: "tp-card" }, h("div", { class: "tp-n" }, s.alertas), h("div", { class: "muted" }, "alertas")),
        h("div", { class: "tp-card" }, h("div", { class: "tp-n" }, ago(s.ultimo)), h("div", { class: "muted" }, "último acceso")))),
    h("section", { class: "card" },
      h("h2", {}, `🏅 Insignias (${s.badges.length}/${Object.keys(BADGES).length})`),
      h("div", { class: "badge-grid" }, Object.entries(BADGES).map(([id, b]) => h("div", { class: `badge ${s.badges.includes(id) ? "earned" : ""}` },
        h("div", { class: "b-emoji" }, s.badges.includes(id) ? b.emoji : "❔"), h("strong", {}, b.name), h("small", { class: "muted" }, b.desc))))),
    h("section", { class: "card" },
      h("h2", {}, "📝 Exámenes"),
      exams.length || s.pendingExam ? h("ul", { class: "plain" },
        exams.map(([id, x]) => h("li", {}, `${id}: ${x.score}/${x.total} (${fmt(x.at)})`)),
        s.pendingExam ? h("li", { class: "warn-cell" }, `Pendiente por presentar: ${s.pendingExam}`) : null,
        data.exams.filter((x) => x.email === s.email && x.estado === "bloqueado").map((x) => h("li", { class: "warn-cell" }, `🔒 ${x.examen} bloqueado (${String(x.motivo).replace(/_/g, " ")})`,
          h("button", { class: "btn mini-btn", onclick: () => act("unlock", { email: s.email, examId: x.examen }, "Examen habilitado ✅") }, "Habilitar")))) :
        h("p", { class: "muted" }, "Todavía no ha presentado exámenes.")),
    playable().map((m) => {
      const p = missionProgress(s, m);
      return h("section", { class: "card" },
        h("h2", {}, `${m.emoji} Misión ${m.id}: ${m.title} — ${p.pct}%`),
        h("p", { class: "muted" }, p.read ? "📚 Dossier leído" : "📚 Dossier sin leer"),
        m.levels.map((l, li) => {
          const n = l.exercises.filter((e) => s.solved[e.id] !== undefined).length;
          return h("div", { class: "tp-level" },
            h("div", { class: "muted" }, `${levelIcon(l)} Nivel ${li + 1} · ${levelName(l)}${l.extra ? " · ⭐ extra" : ""} — ${n}/${l.exercises.length}`),
            h("div", { class: "chips" }, l.exercises.map(chip)));
        }));
    }),
    h("section", { class: "card" },
      h("h2", {}, "🚨 Últimos eventos de supervisión"),
      myEvents.length ? eventsTable(myEvents, false) : h("p", { class: "muted" }, "Sin eventos. 👌")));
}

// --------------------------- Alertas y exámenes ----------------------------------------------
function eventsTable(list, withName = true) {
  return h("div", { class: "table-wrap" }, h("table", {},
    h("thead", {}, h("tr", {}, h("th", {}, "Hora"), withName && h("th", {}, "Estudiante"), h("th", {}, "Modo"), h("th", {}, "Evento"), h("th", {}, "Detalle"))),
    h("tbody", {}, list.map((e) => h("tr", { class: e.grave ? "grave" : "" },
      h("td", {}, fmt(e.fecha)),
      withName && h("td", {}, h("a", { href: `#/profe/e/${encodeURIComponent(e.email)}` }, e.nombre || e.email)),
      h("td", {}, e.modo), h("td", {}, String(e.tipo).replace(/_/g, " ")), h("td", {}, e.detalle))))));
}

function alertsTab() {
  const mine = (email) => inGroup(studentByEmail(email) || { grupo: "" });
  const blocked = data.exams.filter((x) => x.estado === "bloqueado" && mine(x.email));
  const events = data.events.filter((e) => mine(e.email) && (eventFilter === "all" || e.grave)).slice(0, 100);
  const pending = myStudents().filter((s) => s.pendingExam);
  const helps = helpRequests();
  return h("div", {},
    h("section", { class: "card" },
      h("h2", {}, `🙋 Piden ayuda (${helps.length})`),
      helps.length ? h("ul", { class: "plain" }, helps.map((e) => h("li", { class: "group-row" },
        h("a", { href: `#/profe/e/${encodeURIComponent(e.email)}` }, e.nombre || e.email),
        h("span", { class: "muted" }, `${e.detalle} · ${ago(e.fecha)}`),
        h("button", { class: "btn ghost", onclick: () => { markHandled(e); rerender(); } }, "✅ Atendido")))) :
        h("p", { class: "muted" }, "Nadie ha pedido ayuda. 👌 Cuando un estudiante pulse \"Necesito ayuda\", aparecerá aquí.")),
    h("section", { class: "card" },
      h("h2", {}, `🔒 Exámenes bloqueados (${blocked.length})`),
      blocked.length ? h("div", { class: "table-wrap" }, h("table", {},
        h("thead", {}, h("tr", {}, h("th", {}, "Estudiante"), h("th", {}, "Examen"), h("th", {}, "Motivo"), h("th", {}, "Intento"), h("th", {}, ""))),
        h("tbody", {}, blocked.map((x) => h("tr", {},
          h("td", {}, h("a", { href: `#/profe/e/${encodeURIComponent(x.email)}` }, x.nombre || x.email)), h("td", {}, x.examen),
          h("td", {}, String(x.motivo || "").replace(/_/g, " ")), h("td", {}, x.intento),
          h("td", {}, h("button", { class: "btn primary", onclick: (e) => { e.target.disabled = true; act("unlock", { email: x.email, examId: x.examen }, "Examen habilitado ✅"); } }, "Habilitar"))))))) :
        h("p", { class: "muted" }, "Nadie tiene exámenes bloqueados. 👌")),
    pending.length ? h("section", { class: "card" },
      h("h2", {}, `📝 Con examen pendiente (${pending.length})`),
      h("p", { class: "muted" }, "Estos estudiantes llegaron a un checkpoint y todavía no lo presentan:"),
      h("div", { class: "chips" }, pending.map((s) => h("a", { class: "chip", href: `#/profe/e/${encodeURIComponent(s.email)}` }, `${s.nombre || s.email} · ${s.pendingExam}`)))) : null,
    h("section", { class: "card" },
      h("div", { class: "tp-head" }, h("h2", {}, "🚨 Eventos de supervisión"),
        h("select", { class: "select", onchange: (e) => { eventFilter = e.target.value; rerender(); } },
          h("option", { value: "all", selected: eventFilter === "all" }, "Todos"), h("option", { value: "grave", selected: eventFilter === "grave" }, "Solo graves (exámenes)"))),
      events.length ? eventsTable(events) : h("p", { class: "muted" }, "Sin eventos. 👌")));
}

// --------------------------- Premios ---------------------------------------------------------
function prizesTab() {
  const list = data.redeems.filter((r) => inGroup(studentByEmail(r.email) || { grupo: "" }));
  return h("section", { class: "card" },
    h("h2", {}, "🎁 Canjes de premios"),
    h("p", { class: "muted" }, "Los premios y sus puntos se editan en la pestaña \"Premios\" de la hoja de cálculo. Revisa las misiones y los requisitos antes de entregar el vale \"competente\"."),
    list.length ? h("div", { class: "table-wrap" }, h("table", {},
      h("thead", {}, h("tr", {}, h("th", {}, "Fecha"), h("th", {}, "Estudiante"), h("th", {}, "Premio"), h("th", {}, "Puntos"), h("th", {}, "Para revisar"), h("th", {}, "Estado"), h("th", {}, ""))),
      h("tbody", {}, list.map((c) => h("tr", {},
        h("td", {}, fmt(c.fecha)), h("td", {}, c.nombre || c.email), h("td", {}, c.premio), h("td", {}, `${c.costo} pts`), h("td", { class: "muted" }, c.detalle || "—"), h("td", {}, c.estado === "entregado" ? "✅ entregado" : "⏳ pendiente"),
        h("td", {}, h("button", { class: c.estado === "entregado" ? "btn ghost" : "btn primary", onclick: (e) => { e.target.disabled = true; act("redeemStatus", { row: c.fila, estado: c.estado === "entregado" ? "pendiente" : "entregado" }, c.estado === "entregado" ? "Marcado como pendiente" : "Marcado como entregado ✅"); } },
          c.estado === "entregado" ? "Deshacer" : "Marcar entregado"))))))) :
      h("p", { class: "muted" }, "Aún no hay canjes."));
}

// --------------------------- Grupos ----------------------------------------------------------
function groupsTab() {
  const count = (g) => data.students.filter((s) => s.grupo === g).length;
  const noGroup = data.students.filter((s) => !s.grupo);
  const orphan = groupOptions().filter((g) => !data.groups.includes(g));
  const nameInput = h("input", { class: "text-input", placeholder: "Nombre del grupo (ej. 9B)", maxlength: "20" });
  const create = () => { const n = nameInput.value.trim(); if (n) act("groupCreate", { name: n }, `Grupo ${n} creado ✅`); };
  nameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") create(); });
  return h("div", {},
    h("section", { class: "card" },
      h("h2", {}, "👥 Mis grupos"),
      h("p", { class: "muted" }, "Cada estudiante elige su grupo la primera vez que entra. Aquí puedes crear grupos nuevos, cambiarles el nombre o moverlos de grupo."),
      h("ul", { class: "plain" }, data.groups.map((g) => h("li", { class: "group-row" },
        h("strong", {}, `Grupo ${g}`), h("span", { class: "pill" }, `${count(g)} estudiantes`),
        h("button", { class: "btn ghost", onclick: async () => { const n = await askText(`Nuevo nombre para ${g}`, g); if (n && n !== g) act("groupRename", { name: g, newName: n }, "Grupo renombrado ✅"); } }, "✏️ Renombrar"),
        h("button", { class: "btn ghost", onclick: () => modal({ title: `¿Archivar el grupo ${g}?`, body: h("p", {}, "Los estudiantes que ya están en él conservan su grupo, pero los nuevos ya no podrán elegirlo."), actions: [{ label: "Cancelar", kind: "ghost" }, { label: "Archivar", kind: "primary", onclick: () => { act("groupArchive", { name: g }, "Grupo archivado"); } }] }) }, "📦 Archivar")))),
      !data.groups.length && h("p", { class: "muted" }, "Todavía no hay grupos. Crea el primero aquí abajo."),
      h("div", { class: "row" }, nameInput, h("button", { class: "btn primary", onclick: create }, "➕ Crear grupo")),
      orphan.length ? h("p", { class: "muted" }, `Grupos archivados con estudiantes: ${orphan.join(", ")}.`) : null),
    h("section", { class: "card" },
      h("h2", {}, `Sin grupo (${noGroup.length})`),
      noGroup.length ? h("ul", { class: "plain" }, noGroup.map((s) => h("li", { class: "group-row" },
        h("a", { href: `#/profe/e/${encodeURIComponent(s.email)}` }, s.nombre || s.email),
        h("select", { class: "select", onchange: (e) => e.target.value && act("teacherSetGroup", { email: s.email, group: e.target.value }, "Estudiante movido ✅") },
          h("option", { value: "" }, "Asignar a…"), data.groups.map((g) => h("option", { value: g }, `Grupo ${g}`)))))) :
        h("p", { class: "muted" }, "Todos los estudiantes tienen grupo. 👌")));
}

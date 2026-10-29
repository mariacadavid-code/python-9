// Aplicación principal: inicio de sesión, rutas y vistas.
import { CFG, h, toast, modal, decodeJwt, codeBlock, seedFrom, friendlyError } from "./util.js";
import * as api from "./api.js";
import { S, defaultState, rankFor, RANKS, BADGES, XP_BY_TYPE, save, flush, markSolved, markFail, award, PRACTICE_RANKS, practiceRank } from "./state.js";
import * as sup from "./supervisor.js";
import { MISSIONS } from "./missions/index.js";
import { TYPE_INFO, prepare, render, solutionText, editor } from "./exercises.js";
import { openExam } from "./exam.js";
import { renderTeacher } from "./teacher.js";
import { initA11y, listenButton, plainText, stopSpeaking } from "./a11y.js";
import { buddy } from "./honti.js";
import { aiPanel } from "./ai.js";
import { viewProfile } from "./profile.js";
import { avatarSVG, avatarState } from "./avatar.js";
import { runPython, warmup } from "./py.js";
import { LANDING_HTML } from "./landing.js";

const app = document.getElementById("app");
const mount = (...nodes) => app.replaceChildren(...nodes.filter((n) => n != null && n !== false));
let prizes = [];
let isTeacher = false;
let gisReady = false;

const isLocalDev = () => ["localhost", "127.0.0.1"].includes(location.hostname);

// ============================ Sesión ============================
function waitForGis(fn) {
  if (window.google?.accounts?.id) return fn();
  setTimeout(() => waitForGis(fn), 150);
}

function showLogin(error) {
  document.getElementById("topbar").hidden = true;
  app.classList.add("landing-on");
  const page = h("div", { class: "landing" });
  page.innerHTML = LANDING_HTML;
  // Los enlaces de la portada se desplazan dentro de la página sin cambiar la ruta de la aplicación.
  page.querySelectorAll("[data-go]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    page.querySelector("#" + a.dataset.go)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }));
  const msg = page.querySelector("#entry-msg");
  if (error) msg.append(h("p", { class: "error" }, error));
  if (isLocalDev() && api.isDemo()) {
    msg.append(h("div", { class: "dev-login" },
      h("p", { class: "muted" }, "Modo prueba (solo en este computador):"),
      h("button", { class: "btn ghost", onclick: () => startSession({ email: "estudiante.prueba@" + CFG.DOMAIN, name: "Estudiante de Prueba" }) }, "Entrar como estudiante"),
      h("button", { class: "btn ghost", onclick: () => startSession({ email: CFG.TEACHERS[0], name: "Profe (prueba)" }) }, "Entrar como profe")));
  }
  mount(page);
  if (error) page.querySelector("#entrar")?.scrollIntoView();
  waitForGis(() => {
    if (!gisReady) {
      google.accounts.id.initialize({ client_id: CFG.CLIENT_ID, callback: onCredential, hd: CFG.DOMAIN, auto_select: true, itp_support: true });
      gisReady = true;
    }
    const slot = document.getElementById("gbtn");
    if (slot) google.accounts.id.renderButton(slot, { theme: "filled_blue", size: "large", shape: "pill", text: "signin_with", locale: "es" });
    google.accounts.id.prompt();
  });
}

function onCredential(resp) {
  const p = decodeJwt(resp.credential);
  const email = String(p.email || "").toLowerCase();
  if (!email.endsWith("@" + CFG.DOMAIN)) {
    google.accounts.id.disableAutoSelect();
    return showLogin(`Ese correo (${email}) no es del colegio. Usa tu cuenta @${CFG.DOMAIN}.`);
  }
  api.setToken(resp.credential);
  // Renovar el token antes de que venza (dura 1 hora).
  const ms = p.exp * 1000 - Date.now() - 5 * 60 * 1000;
  setTimeout(() => google.accounts.id.prompt(), Math.max(ms, 60000));
  if (S.user?.email === email) return; // solo era una renovación
  startSession({ email, name: p.name || email, picture: p.picture });
}

api.setSessionExpiredHandler(() => {
  modal({
    title: "Tu sesión venció ⌛",
    body: h("p", {}, "Vuelve a entrar con tu cuenta del colegio para seguir guardando tu progreso."),
    actions: [{ label: "Volver a entrar", kind: "primary", onclick: () => waitForGis(() => google.accounts.id.prompt()) }],
  });
});

async function startSession(user) {
  S.user = user;
  api.setDemoUser(user);
  app.classList.remove("landing-on");
  mount(h("p", { class: "center loading" }, "Cargando tu progreso… 🐍"));
  let data;
  try {
    data = await api.call("login");
  } catch (e) {
    S.user = null;
    return showLogin("No pudimos entrar: " + e.message);
  }
  S.state = Object.assign(defaultState(), data.state || {});
  prizes = data.prizes || [];
  isTeacher = !!data.isTeacher;
  // Los docentes pueden recorrer todo el curso sin que quede registrado como progreso ni supervisión.
  S.isTeacher = isTeacher;
  S.noSync = isTeacher;
  if (!isTeacher) sup.start(user, reportEvent);
  warmup().catch(() => toast("No se pudo cargar Python. Revisa tu conexión a internet.", "error", 8000));
  renderTopbar();
  document.addEventListener("state-changed", renderTopbar);
  window.addEventListener("hashchange", route);
  window.addEventListener("pagehide", () => flush());
  if (isTeacher && !location.hash.replace("#", "").replace("/", "")) location.hash = "#/profe";
  route();
  if (!isTeacher && !data.group && data.groups?.length) askGroup(data.groups);
  if (S.state.pendingExam && data.exams?.[S.state.pendingExam.id]?.estado === "bloqueado") openExam();
}

// El estudiante elige su grupo la primera vez; después solo la profe puede cambiarlo.
function askGroup(groups) {
  const sel = h("select", { class: "select big-select" }, h("option", { value: "" }, "Elige tu grupo…"), groups.map((g) => h("option", { value: g }, `Grupo ${g}`)));
  const err = h("p", { class: "error" });
  modal({
    title: "¿De qué grupo eres? 🏫",
    body: h("div", {}, h("p", {}, "Elige tu grupo para que tu profe vea tu progreso en el lugar correcto. Solo lo eliges una vez."), sel, err),
    dismissable: false,
    actions: [{ label: "Guardar", kind: "primary", onclick: () => {
      if (!sel.value) { err.textContent = "Elige un grupo para seguir."; return false; }
      api.call("setGroup", { group: sel.value }).then(() => toast(`¡Listo! Eres del grupo ${sel.value} 🎉`, "win")).catch((e) => toast(e.message, "error"));
    } }],
  });
}

function reportEvent(ev) {
  const event = { ...ev, examId: S.state.pendingExam?.id || "" };
  if (ev.grave) api.beacon("event", { event });
  else api.call("event", { event }).catch(() => {});
}

// ============================ Lógica de progreso ============================
function findExercise(id) {
  for (const m of MISSIONS) for (const [li, l] of m.levels.entries()) for (const ex of l.exercises) if (ex.id === id) return { mission: m, levelIdx: li, ex };
  return null;
}
function levelSolved(level) { return level.exercises.filter((e) => S.state.solved[e.id]).length; }
function levelNeeded(level) { return Math.ceil(CFG.PASS_RATIO * level.exercises.length); }
// Modo docente: todo abierto para poder recorrer el curso. Se puede apagar para ver lo que ve un estudiante.
const OPEN_KEY = "py9-teacher-open";
function teacherOpen() {
  if (!isTeacher) return false;
  try { return localStorage.getItem(OPEN_KEY) !== "0"; } catch { return true; }
}
function setTeacherOpen(on) {
  try { localStorage.setItem(OPEN_KEY, on ? "1" : "0"); } catch {}
  route();
}
function levelUnlocked(m, idx) {
  if (teacherOpen()) return true;
  if (!S.state.read["m" + m.id]) return false;
  for (let i = 1; i <= idx; i++) if (levelSolved(m.levels[i - 1]) < levelNeeded(m.levels[i - 1])) return false;
  return true;
}
// Los niveles "extra" son opcionales: no cuentan para abrir la siguiente misión ni para el examen final.
const levelInfo = (l) => ({ ...TYPE_INFO[l.type], ...(l.name && { name: l.name }), ...(l.icon && { icon: l.icon }) });
function missionStats(m) {
  const core = m.levels.filter((l) => !l.extra);
  const total = core.reduce((a, l) => a + l.exercises.length, 0);
  const done = core.reduce((a, l) => a + levelSolved(l), 0);
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}
function missionUnlocked(m) {
  if (m.soon) return false;
  if (teacherOpen()) return true;
  const prev = MISSIONS.find((x) => x.id === m.id - 1);
  return !prev || (!prev.soon && missionStats(prev).pct >= 80);
}
// El laboratorio (compilador libre) se abre al pasar los primeros niveles de la Misión 1.
const labUnlocked = () => levelUnlocked(MISSIONS[0], 3);

function nextExercise(m) {
  for (const [li, l] of m.levels.entries()) {
    if (!levelUnlocked(m, li)) break;
    const ex = l.exercises.find((e) => !S.state.solved[e.id]);
    if (ex) return ex;
  }
  return null;
}

function maybeCheckpoint(m) {
  const st = S.state;
  if (isTeacher || st.pendingExam) return;
  const stats = missionStats(m);
  const final = stats.done === stats.total && !st.exams[`final-m${m.id}`];
  const cp = st.solvedCount > 0 && st.solvedCount % CFG.CHECKPOINT_EVERY === 0 && !st.exams[`cp-${st.solvedCount}`];
  if (!final && !cp) return;
  st.pendingExam = final
    ? { id: `final-m${m.id}`, mission: m.id, title: `Examen final · Misión ${m.id}: ${m.title}`, final: true }
    : { id: `cp-${st.solvedCount}`, mission: m.id, title: `Checkpoint · ${st.solvedCount} ejercicios`, final: false };
  save();
  modal({
    title: "📝 ¡Hora del examen!",
    body: h("p", {}, `Llevas ${st.solvedCount} ejercicios resueltos. Antes de seguir, demuestra lo que aprendiste en un examen corto.`),
    actions: [{ label: "Más tarde", kind: "ghost" }, { label: "Ir al examen", kind: "primary", onclick: () => { openExam(); } }],
  });
}

// ============================ Barra superior ============================
function renderTopbar() {
  const bar = document.getElementById("topbar");
  bar.hidden = false;
  const st = S.state;
  const pr = practiceRank(st.ai?.level || 1);
  const link = (href, label, extra = "") => h("a", { href, class: `nav-link ${extra} ${location.hash.startsWith(href) ? "active" : ""}` }, label);
  bar.replaceChildren(
    h("a", { href: "#/", class: "brand", "aria-label": "Ser School · Python 9°" }, h("img", { src: "img/logo-ser-school.png", alt: "Ser School" })),
    h("nav", {},
      isTeacher && link("#/profe", "Panel docente", "teacher-link"),
      link("#/", isTeacher ? "Curso" : "Inicio"),
      link("#/lab", labUnlocked() ? "Laboratorio" : "🔒 Laboratorio"),
      !isTeacher && link("#/premios", "Premios"),
      !isTeacher && link("#/perfil", "Mi perfil")),
    isTeacher ? h("div", { class: "me" },
      h("label", { class: "switch", title: "Con el modo abierto puedes entrar a cualquier misión y nivel sin desbloquear nada. Apágalo para ver el curso como lo ve un estudiante." },
        h("input", { type: "checkbox", checked: teacherOpen(), onchange: (e) => setTeacherOpen(e.target.checked) }),
        h("span", {}, "Todo abierto")),
      h("span", { class: "pill", title: "Tu avance y tus intentos no se guardan ni se mezclan con los de los estudiantes." }, "Modo docente")) :
    h("div", { class: "me" },
      h("a", { href: "#/perfil", class: "avatar-chip", title: "Mi perfil", "aria-label": "Mi perfil", html: avatarSVG(avatarState(), 36) }),
      h("span", { class: "rank-chip", title: "Tu rango de práctica con IA" }, `Rango ${pr.name}`),
      h("div", { class: "pts", title: "Tus puntos. Con ellos llegas a los premios." }, h("b", {}, st.xp), " puntos")),
  );
}

// ============================ Rutas ============================
function route() {
  const parts = location.hash.replace(/^#\/?/, "").split("/");
  window.scrollTo(0, 0);
  stopSpeaking();
  renderTopbar();
  if (parts[0] === "m") return viewMission(Number(parts[1]), parts[2] || "dossier");
  if (parts[0] === "ex") return viewExercise(parts[1]);
  if (parts[0] === "lab") return viewLab();
  if (parts[0] === "premios") return viewPrizes();
  if (parts[0] === "perfil" && !isTeacher) return viewProfile(mount);
  if (parts[0] === "profe" && isTeacher) return renderTeacher(mount, parts.slice(1));
  return viewHome();
}

function examBanner() {
  const pe = S.state.pendingExam;
  if (!pe) return null;
  return h("div", { class: "banner exam" },
    h("span", {}, `📝 Tienes pendiente: ${pe.title}. Los ejercicios siguen bloqueados hasta que lo presentes.`),
    h("button", { class: "btn primary", onclick: () => openExam() }, "Presentar examen"));
}

// ---------- Inicio ----------
function viewHome() {
  const st = S.state;
  const first = (S.user.name || "").split(" ")[0];
  const cur = routeMissions().find((x) => !x.soon && !missionDone(x) && missionUnlocked(x)) || MISSIONS[0];
  const next = !st.pendingExam ? nextExercise(cur) : null;
  const found = next ? findExercise(next.id) : null;
  const pos = found ? found.mission.levels[found.levelIdx].exercises.findIndex((e) => e.id === next.id) + 1 : 0;
  const total = found ? found.mission.levels[found.levelIdx].exercises.length : 0;
  const hello = buddy(
    !st.read["m" + cur.id] ? `¡Hola, ${first}! Empecemos leyendo la ficha de la Misión ${cur.id}. Es cortita.`
      : next ? `¡Hola, ${first}! Hoy toca el ejercicio ${pos} de ${total}. Tú puedes.`
        : `¡Hola, ${first}! Elige un ejercicio y seguimos juntos.`, "hi", { body: true });
  const cta = st.pendingExam ? h("button", { class: "btn primary big", onclick: () => openExam() }, "Presentar mi examen")
    : !st.read["m" + cur.id] ? h("a", { class: "btn primary big", href: `#/m/${cur.id}` }, `Empezar la Misión ${cur.id}`)
      : next ? h("a", { class: "btn primary big", href: `#/ex/${next.id}` }, `Seguir: ejercicio ${pos} de ${total}`)
        : h("a", { class: "btn primary big", href: `#/m/${cur.id}/ejercicios` }, "Ver ejercicios");
  mount(
    examBanner(),
    h("section", { class: "hero2" },
      h("span", { class: "tagpill lime" }, "Python · Grado 9° · 5 semanas"),
      h("h1", {}, "Deja tu ", h("em", {}, "huella"), " en el código"),
      h("p", { class: "lead" }, "Aprende a tu ritmo, con ejercicios cortos. Honti, el perro del colegio, te acompaña y te orienta. Al final de las 8 misiones construyes tu propio asistente con inteligencia artificial."),
      hello.el,
      h("div", { class: "hero-actions" }, cta),
      h("div", { class: "hero-stats2" },
        h("span", {}, h("b", {}, st.solvedCount), " resueltos"),
        h("span", {}, h("b", {}, st.xp), " puntos"),
        h("span", {}, h("b", {}, st.badges.length), " insignias"))),
    found ? goalsStrip(found.mission, found.levelIdx, next) : null,
    routeCard(),
    h("h2", { class: "section-title" }, "Misiones"),
    h("div", { class: "mission-grid" }, MISSIONS.map(missionCard)),
  );
}

function missionCard(m) {
  const open = missionUnlocked(m);
  const s = missionStats(m);
  const inner = [
    h("div", { class: "m-emoji" }, open ? m.emoji : m.soon ? "🛠️" : "🔒"),
    h("div", { class: "m-num" }, `Misión ${m.id}`),
    h("h3", {}, m.title),
    h("p", { class: "muted" }, m.subtitle),
    m.soon ? h("span", { class: "pill" }, "Próximamente") : h("div", { class: "progress" }, h("i", { style: { width: s.pct + "%" } }), h("span", {}, `${s.done}/${s.total}`)),
  ];
  return open ? h("a", { class: "mission card", href: `#/m/${m.id}` }, inner) : h("div", { class: "mission card locked" }, inner);
}

// ---------- Misión: dossier y ejercicios ----------
function viewMission(id, tab) {
  const m = MISSIONS.find((x) => x.id === id);
  if (!m || !missionUnlocked(m)) return viewHome();
  const read = S.state.read["m" + m.id] || teacherOpen();
  const tabs = h("div", { class: "tabs" },
    h("a", { href: `#/m/${m.id}`, class: tab === "dossier" ? "active" : "" }, "📚 Dossier"),
    h("a", { href: `#/m/${m.id}/ejercicios`, class: tab === "ejercicios" ? "active" : "" }, read ? "🏋️ Ejercicios" : "🔒 Ejercicios"));
  const head = h("header", { class: "mission-head" }, h("span", { class: "m-emoji" }, m.emoji), h("div", {}, h("div", { class: "muted" }, `Misión ${m.id}`), h("h1", {}, m.title)));
  mount(examBanner(), head, tabs, tab === "ejercicios" && read ? exerciseList(m) : dossierView(m));
}

function runnable(code) {
  const out = h("pre", { class: "console", hidden: true });
  const btn = h("button", { class: "btn mini-run", onclick: async () => {
    btn.disabled = true;
    btn.textContent = "⏳";
    const r = await runPython(code);
    out.hidden = false;
    out.textContent = (r.out || "") + (r.err ? friendlyError(r.err) : "");
    btn.disabled = false;
    btn.textContent = "▶ Probar";
  } }, "▶ Probar");
  return h("div", { class: "runnable" }, codeBlock(code), btn, out);
}

function dossierView(m) {
  const read = S.state.read["m" + m.id];
  return h("div", { class: "dossier" },
    m.dossier.map((sec, i) => h("section", { class: "card dossier-sec" },
      h("div", { class: "sec-num" }, `${i + 1}/${m.dossier.length}`),
      h("h2", {}, sec.title),
      listenButton(() => `${sec.title}. ${plainText(sec.body)} ${plainText(sec.after)}`),
      h("div", { class: "nosel", html: sec.body }),
      sec.example && runnable(sec.example),
      sec.after && h("div", { class: "nosel", html: sec.after }),
      sec.example2 && runnable(sec.example2))),
    h("div", { class: "card center" },
      read ? h("a", { class: "btn primary big", href: `#/m/${m.id}/ejercicios` }, "Ir a los ejercicios 🏋️")
        : h("button", { class: "btn primary big", onclick: () => {
          S.state.read["m" + m.id] = true;
          award("lector");
          save();
          location.hash = `#/m/${m.id}/ejercicios`;
        } }, "¡Terminé de leer! Abrir ejercicios ✅")));
}

function exerciseList(m) {
  const pending = !!S.state.pendingExam;
  return h("div", { class: "levels" },
    m.levels.map((l, li) => {
      const info = levelInfo(l);
      const open = levelUnlocked(m, li);
      const done = levelSolved(l);
      const prev = m.levels[li - 1];
      return h("section", { class: `card level ${open ? "" : "locked"} ${l.extra ? "extra" : ""}` },
        h("div", { class: "level-head" },
          h("span", { class: "level-icon" }, open ? info.icon : "🔒"),
          h("div", {}, h("div", { class: "muted" }, `Nivel ${li + 1}${l.extra ? " · ⭐ Extra (opcional)" : ` de ${m.levels.filter((x) => !x.extra).length}`}`), h("h3", {}, info.name)),
          h("span", { class: "pill" }, `${done}/${l.exercises.length}`)),
        l.blurb && open && h("p", { class: "muted" }, l.blurb),
        !open && prev && h("p", { class: "muted" }, `Resuelve ${levelNeeded(prev)} ejercicios de "${levelInfo(prev).name}" para abrir este nivel.`),
        l.type === "bug" && !l.extra && open && !S.state.solved[l.exercises[0].id] && h("p", { class: "muted" }, "🎉 ¡Desde aquí usas el compilador real de Python! También se abrió el Laboratorio."),
        h("div", { class: "chips" }, l.exercises.map((ex, i) => {
          const solved = S.state.solved[ex.id];
          const label = `${solved ? "✅" : info.icon} ${i + 1}. ${ex.title}`;
          return open && !pending ? h("a", { class: `chip ${solved ? "done" : ""}`, href: `#/ex/${ex.id}` }, label) : h("span", { class: "chip disabled" }, label);
        })));
    }));
}

// ---------- Metas: corto, mediano y largo plazo ----------
// Ruta principal del curso: las misiones 1 a 8. Después viene el proyecto final con IA.
const routeMissions = () => MISSIONS.filter((x) => x.id <= 8);
const missionDone = (x) => !x.soon && missionStats(x).pct >= 80;

// Texto de la meta corta de un nivel: cuántos faltan para abrir lo siguiente.
function shortGoal(m, levelIdx) {
  const l = m.levels[levelIdx];
  if (l.extra) return "⭐ Nivel extra: es opcional, sin presión.";
  const left = Math.max(0, levelNeeded(l) - levelSolved(l));
  const isLastCore = !m.levels.slice(levelIdx + 1).some((x) => !x.extra);
  if (left === 0) return isLastCore ? "✅ ¡Misión completada! Ya puedes pasar a la siguiente." : `✅ ¡Meta del nivel cumplida! Se abrió el Nivel ${levelIdx + 2}.`;
  return isLastCore ? `🎯 Te faltan ${left} para completar la Misión ${m.id}.` : `🎯 Te faltan ${left} para abrir el Nivel ${levelIdx + 2}.`;
}

// Tres metas siempre a la vista: AHORA (este ejercicio y nivel), ESTA MISIÓN y MI META FINAL.
function goalsStrip(m, levelIdx, ex) {
  const l = m.levels[levelIdx];
  const idx = l.exercises.findIndex((e) => e.id === ex.id);
  const coreLevels = m.levels.filter((x) => !x.extra).length;
  const stats = missionStats(m);
  const route = routeMissions();
  const done = route.filter(missionDone).length;
  const dots = h("div", { class: "dots", "aria-label": `Ejercicio ${idx + 1} de ${l.exercises.length}` },
    l.exercises.map((e, i) => h("a", { href: `#/ex/${e.id}`, class: `dot ${S.state.solved[e.id] ? "ok" : ""} ${i === idx ? "now" : ""}`, title: `${i + 1}. ${e.title} (haz clic para ir)`, "aria-label": `Ejercicio ${i + 1}: ${e.title}` })));
  return h("div", { class: "goals" },
    h("div", { class: "goal now" },
      h("div", { class: "goal-label" }, "🎯 Ahora"),
      h("div", { class: "goal-big" }, `Ejercicio ${idx + 1} de ${l.exercises.length}`),
      dots,
      h("div", { class: "goal-note" }, shortGoal(m, levelIdx))),
    h("div", { class: "goal" },
      h("div", { class: "goal-label" }, `🗺️ Misión ${m.id}: ${m.title}`),
      h("div", { class: "goal-big" }, l.extra ? `Nivel ${levelIdx + 1} (extra)` : `Nivel ${levelIdx + 1} de ${coreLevels}`),
      h("div", { class: "progress" }, h("i", { style: { width: stats.pct + "%" } }), h("span", {}, `${stats.done}/${stats.total}`)),
      h("div", { class: "goal-note" }, `${stats.pct}% de la misión`)),
    h("div", { class: "goal" },
      h("div", { class: "goal-label" }, "🏁 Mi meta final"),
      h("div", { class: "goal-big" }, "Mi asistente con IA 🤖"),
      h("div", { class: "progress" }, h("i", { style: { width: Math.round((done / route.length) * 100) + "%" } }), h("span", {}, `${done}/${route.length}`)),
      h("div", { class: "goal-note" }, `Misión ${m.id} de ${route.length} · llevas ${done} completadas`)));
}

// Camino completo del curso, para saber siempre dónde estás y cuánto falta.
function routeCard() {
  const route = routeMissions();
  const cur = route.find((x) => !x.soon && !missionDone(x) && missionUnlocked(x));
  const node = (x) => {
    const done = missionDone(x);
    const state = done ? "done" : x === cur ? "cur" : x.soon || !missionUnlocked(x) ? "lock" : "open";
    const s = x.soon ? null : missionStats(x);
    return h(missionUnlocked(x) ? "a" : "div", { class: `rnode ${state}`, href: `#/m/${x.id}`, title: `${x.title}${s ? ` · ${s.pct}%` : ""}` },
      h("div", { class: "rdot" }, done ? "✅" : x === cur ? "📍" : x.soon ? "🛠️" : x.emoji),
      h("div", { class: "rname" }, `M${x.id}`), h("div", { class: "rsub" }, x.title));
  };
  const finalNode = h("div", { class: "rnode final" }, h("div", { class: "rdot" }, "🏁"), h("div", { class: "rname" }, "Final"), h("div", { class: "rsub" }, "Mi asistente con IA"));
  const doneCount = route.filter(missionDone).length;
  return h("section", { class: "card route" },
    h("div", { class: "tp-head" }, h("h2", {}, "🧭 Mi camino"), h("span", { class: "pill" }, `${doneCount} de ${route.length} misiones · 5 semanas`)),
    h("p", { class: "muted" }, "Así de cerca estás de tu meta. Cada misión se hace en una sesión de clase. Al final de las 8 construyes tu propio asistente con inteligencia artificial."),
    h("div", { class: "route-line" }, route.map(node), finalNode));
}

// ---------- Ejercicio ----------
async function viewExercise(id) {
  const found = findExercise(id);
  if (!found) return viewHome();
  const { mission: m, levelIdx, ex } = found;
  if (!levelUnlocked(m, levelIdx) || S.state.pendingExam) return viewMission(m.id, "ejercicios");
  const st = S.state;
  const info = { ...TYPE_INFO[ex.type], ...levelInfo(m.levels[levelIdx]) };
  const wasSolved = !!st.solved[ex.id];
  const priorFails = st.fails[ex.id] || 0;
  let attempts = 0;
  let usedHint = false;
  const variant = (st.variant[ex.id] || 0) + (wasSolved ? 1000 : 0);

  const body = h("div", {}, h("p", { class: "center loading" }, "Preparando tu variante… 🐍"));
  const feedback = h("div", { class: "feedback", hidden: true });
  const checkBtn = h("button", { class: "btn primary big", disabled: true }, "Comprobar ✔");
  const exBuddy = buddy("Lee con calma, una línea a la vez. Aquí estoy si me necesitas.", "hi");
  let inst = null;

  // Pistas por escalones: primero una pregunta, luego una ayudita y al final un ejemplo parecido ya resuelto.
  const GUIDE = {
    predict: "Recorre el programa línea por línea, como si fueras Python. Después de cada línea, ¿qué valor tiene cada variable?",
    fill: "Mira la salida esperada. ¿Qué te dice sobre lo que falta en el hueco?",
    parsons: "¿Qué línea tiene que ir primero? Recuerda: una variable se crea antes de usarla.",
    bug: "Compara lo que imprime tu programa con la salida esperada. ¿En qué línea empieza la diferencia?",
    code: "Divide el problema en pasos pequeños: ¿qué datos tienes? ¿qué tienes que mostrar? Escribe primero un paso.",
  };
  let hintStep = 0;
  const hintBox = h("div", { class: "hint-box", "aria-live": "polite" });
  const hintBtn = h("button", { class: "btn ghost", onclick: async () => {
    usedHint = true;
    hintBtn.disabled = true;
    if (hintStep === 0) {
      hintBox.append(h("div", { class: "hint-step" }, h("strong", {}, "🧭 Pista 1 de 3 · Una pregunta para pensar"), GUIDE[ex.type]));
    } else if (hintStep === 1) {
      hintBox.append(h("div", { class: "hint-step" }, h("strong", {}, "💡 Pista 2 de 3 · Una ayudita"), ex.hint || "Relee el enunciado con calma."));
    } else {
      let other, k = 0;
      do { other = await prepare(ex, seedFrom(S.user.email, ex.id, "ejemplo", variant, k)); k++; } while (k < 5 && JSON.stringify(other.data) === JSON.stringify(inst?.data));
      hintBox.append(h("div", { class: "hint-step" },
        h("strong", {}, "📖 Pista 3 de 3 · Así se resolvió un ejemplo parecido (con otros datos)"),
        h("pre", { class: "console nosel" }, solutionText(other)),
        h("span", { class: "muted" }, "Ahora haz el tuyo, que tiene datos distintos. ¡Tú puedes!")));
    }
    hintStep++;
    exBuddy.say("Buena idea pedir una pista. Pensar con ayuda también es aprender.", "think");
    if (hintStep < 3) { hintBtn.disabled = false; hintBtn.textContent = `💡 Otra pista (${hintStep + 1} de 3)`; } else hintBtn.textContent = "💡 No hay más pistas";
  } }, "💡 Pista (1 de 3)");

  const listenBtn = listenButton(() => [ex.title, info.ask, plainText(inst?.data?.prompt)].filter(Boolean).join(". "));

  // "Necesito ayuda": le avisa a la profe sin que el estudiante tenga que levantar la mano.
  let helpSent = 0;
  const helpBtn = h("button", { class: "btn ghost help-btn", onclick: () => {
    if (Date.now() - helpSent < 60000) return toast("Ya le avisaste a tu profe. ¡Lo verá en su panel! 🙋");
    helpSent = Date.now();
    api.call("event", { event: { modo: "practica", tipo: "pide_ayuda", detalle: `${m.title} · ${ex.title}`, grave: false, examId: "" } })
      .then(() => { exBuddy.say("Listo, le avisé a tu profe. Ya viene en camino.", "hug", true); toast("Le avisé a tu profe. Mientras llega, prueba una pista.", "win", 5000); })
      .catch(() => toast("No pude avisarle ahora. Levanta la mano 🙋", "warn"));
  } }, "🙋 Necesito ayuda");

  const goals = h("div", {}, goalsStrip(m, levelIdx, ex));
  const paintGoals = () => goals.replaceChildren(goalsStrip(m, levelIdx, ex));

  mount(
    h("nav", { class: "crumbs" }, h("a", { href: `#/m/${m.id}/ejercicios` }, `← Misión ${m.id}: ${m.title}`)),
    goals,
    h("section", { class: "card exercise-card" },
      h("div", { class: "ex-head" },
        h("span", { class: "level-icon" }, info.icon),
        h("div", {}, h("div", { class: "muted" }, `Nivel ${levelIdx + 1} · ${info.name}`), h("h1", {}, ex.title)),
        h("span", { class: "pill" }, wasSolved ? "✅ Resuelto · práctica libre" : `+${XP_BY_TYPE[ex.type]} XP`)),
      exBuddy.el,
      h("p", { class: "ask" }, info.ask),
      body,
      feedback,
      h("div", { class: "row" }, checkBtn, hintBtn, listenBtn, helpBtn),
      hintBox));

  inst = await prepare(ex, seedFrom(S.user.email, ex.id, variant));
  const view = render(inst);
  body.replaceChildren(view.el);
  checkBtn.disabled = false;

  checkBtn.onclick = async () => {
    checkBtn.disabled = true;
    checkBtn.textContent = "Revisando…";
    attempts++;
    const res = await view.check();
    checkBtn.textContent = "Comprobar ✔";
    feedback.hidden = false;
    if (res.ok) {
      const gain = wasSolved ? 0 : markSolved(ex, { firstTry: priorFails === 0 && attempts === 1, usedHint });
      feedback.className = "feedback ok";
      const next = nextExercise(m);
      paintGoals();
      exBuddy.say("¡Bien hecho! " + shortGoal(m, levelIdx).replace(/^[^A-Za-z¡]+/, ""), "cheer", true);
      const lv = m.levels[levelIdx];
      feedback.replaceChildren(
        h("strong", {}, gain ? `🎉 ¡Correcto! +${gain} XP` : "🎉 ¡Correcto!"),
        h("div", { class: "muted" }, `Llevas ${levelSolved(lv)} de ${lv.exercises.length} en este nivel. ${shortGoal(m, levelIdx)}`),
        h("div", { class: "row" },
          h("button", { class: "btn ghost", onclick: () => { st.variant[ex.id] = (st.variant[ex.id] || 0) + 1; save(); viewExercise(ex.id); } }, "🔁 Otra variante"),
          next ? h("a", { class: "btn primary", href: `#/ex/${next.id}` }, "Siguiente ▶") : h("a", { class: "btn primary", href: `#/m/${m.id}/ejercicios` }, "Volver a la misión")));
      celebrate();
      if (!wasSolved) {
        const stats = missionStats(m);
        if (stats.done === stats.total) award(`mision-${m.id}`);
        maybeCheckpoint(m);
      }
      return;
    }
    const fails = wasSolved ? attempts : markFail(ex);
    feedback.className = "feedback bad";
    const cheers = ["Equivocarse es parte de aprender 💪", "¡Casi! Respira y vuelve a mirar el enunciado 👀", "Cada intento te acerca más 🚀"];
    feedback.replaceChildren(h("strong", {}, res.msg), res.out != null && h("pre", { class: "console" }, res.out), h("div", { class: "cheer" }, cheers[(attempts - 1) % cheers.length]));
    exBuddy.say("Sin afán. Mira otra vez, línea por línea.", "hug");
    checkBtn.disabled = false;
    // Cada 2 fallos: se muestra la solución y llega una variante nueva para practicar de verdad.
    if (fails % 2 === 0) {
      modal({
        title: "Vamos con otra variante 🔁",
        body: h("div", {},
          h("p", {}, "Te muestro la respuesta de esta versión. Léela con calma y luego intenta una nueva:"),
          h("pre", { class: "console nosel" }, solutionText(inst))),
        actions: [
          { label: "🙋 Pedir ayuda a mi profe", kind: "ghost", onclick: () => { helpBtn.click(); return false; } },
          { label: "Entendido, ¡dame otra!", kind: "primary", onclick: () => { st.variant[ex.id] = (st.variant[ex.id] || 0) + 1; save(); viewExercise(ex.id); } },
        ],
        dismissable: false,
      });
    }
  };
}

function celebrate() {
  const layer = h("div", { class: "confetti", "aria-hidden": "true" });
  for (let i = 0; i < 24; i++) {
    layer.append(h("i", { style: { left: Math.random() * 100 + "%", animationDelay: Math.random() * 0.4 + "s", background: ["#CCEF3A", "#26588A", "#ffffff", "#344151"][i % 4] } }));
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 2200);
}

// ---------- Laboratorio (compilador libre) ----------
let labTab = "ia";
function viewLab() {
  if (!labUnlocked()) {
    mount(h("section", { class: "card center" },
      h("div", { class: "logo-big" }, "🔒"),
      h("h1", {}, "Laboratorio bloqueado"),
      h("p", {}, "Se abre cuando pases los niveles 1, 2 y 3 de la Misión 1. ¡Ya casi!"),
      h("a", { class: "btn primary", href: "#/m/1/ejercicios" }, "Ir a la Misión 1")));
    return;
  }
  const key = `py9-lab-${S.user.email}`;
  let draft = "";
  try { draft = localStorage.getItem(key) || ""; } catch {}
  const ed = editor(draft || `# ¡Tu laboratorio! Escribe y ejecuta lo que quieras.\nnombre = "${(S.user.name || "").split(" ")[0]}"\nprint("Hola,", nombre)\n`, { rows: 14 });
  const stdin = h("textarea", { class: "stdin", rows: 3, placeholder: "Datos para input(), uno por línea (opcional)" });
  const out = h("pre", { class: "console" }, "La salida aparecerá aquí.");
  const run = h("button", { class: "btn primary big", onclick: async () => {
    try { localStorage.setItem(key, ed.value); } catch {}
    run.disabled = true;
    run.textContent = "⏳ Ejecutando…";
    const r = await runPython(ed.value, stdin.value.split("\n").filter((x) => x !== ""));
    out.textContent = (r.out || "") + (r.err ? (r.out ? "\n" : "") + friendlyError(r.err) : "") || "(el programa no imprimió nada)";
    out.classList.toggle("has-error", !!r.err);
    run.disabled = false;
    run.textContent = "▶ Ejecutar";
  } }, "▶ Ejecutar");
  const free = h("section", { class: "card" },
    h("p", { class: "muted" }, "Python 3 de verdad, corriendo en tu navegador. Experimenta sin miedo: aquí nada da puntos ni quita."),
    ed.el, h("div", { class: "row" }, run), stdin, h("div", { class: "label" }, "Salida"), out);
  const tab = (id, label) => h("a", { href: "#/lab", class: labTab === id ? "active" : "", onclick: (e) => { e.preventDefault(); labTab = id; viewLab(); } }, label);
  mount(
    h("h1", { style: { margin: "0 0 12px" } }, "Laboratorio"),
    h("div", { class: "tabs" }, tab("ia", "Práctica con IA"), tab("libre", "Laboratorio libre")),
    labTab === "ia" ? aiPanel({ celebrate }) : free);
}

// ---------- Premios e insignias ----------
const PRIZE_ART = {
  chocolatina: ["var(--lime-soft)", '<svg viewBox="0 0 80 80" fill="none" stroke="#344151" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"><rect x="12" y="26" width="56" height="30" rx="8" fill="#26588A"/><path d="M12 41h56M30 26v30M50 26v30" stroke="#F4F4F4"/><path d="M26 26 14 18M54 26l12-8"/></svg>'],
  competente: ["var(--brand-soft)", '<svg viewBox="0 0 80 80" fill="none" stroke="#26588A" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><rect x="10" y="20" width="60" height="40" rx="9"/><path d="M10 34h60M24 48h16M24 54h28"/><circle cx="58" cy="46" r="6" fill="#CCEF3A" stroke="#CCEF3A"/></svg>'],
  "clase-libre": ["var(--brand-soft)", '<svg viewBox="0 0 80 80" fill="none" stroke="#26588A" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><circle cx="26" cy="30" r="8"/><circle cx="54" cy="30" r="8"/><path d="M10 62a16 16 0 0 1 32 0M38 62a16 16 0 0 1 32 0"/><path d="M40 12v7" stroke="#CCEF3A" stroke-width="6"/></svg>'],
};
const REQ_LABEL = {
  misiones8: "Las 8 misiones completadas",
  proyecto: "Proyecto final con IA entregado",
  sin_bloqueos: "Ningún examen bloqueado",
};
const fmtN = (n) => Number(n).toLocaleString("es-CO");

async function viewPrizes() {
  mount(h("p", { class: "center loading" }, "Cargando tus premios…"));
  let info;
  try { info = await api.call("prizesInfo"); } catch { info = { prizes, group: null, incidentes: 0, canjes: [] }; }
  const st = S.state;
  const r = rankFor(st.xp);
  const route = routeMissions();
  const reqOk = {
    misiones8: route.every(missionDone),
    proyecto: !!st.projectDone,
    sin_bloqueos: (info.incidentes || 0) === 0,
  };
  const claimed = (id) => (info.canjes || []).filter((c) => c.premio === id);

  const card = (p) => {
    const [bg, art] = PRIZE_ART[p.id] || PRIZE_ART.chocolatina;
    const group = p.tipo === "grupal";
    const have = group ? Math.round(info.group?.promedio || 0) : st.xp;
    const pct = Math.min(100, Math.round((have / p.costo) * 100));
    const reqs = (p.requisitos || []).map((k) => ({ k, ok: !!reqOk[k] }));
    const mine = claimed(p.id);
    const done = !group && mine.length >= (p.max || 1);
    const enough = have >= p.costo;
    const ready = !group && enough && reqs.every((x) => x.ok) && !done;
    const pending = reqs.filter((x) => !x.ok).length + (enough ? 0 : 1);
    return h("article", { class: "card prize2" },
      h("div", { class: "art", style: { background: bg }, html: art }),
      h("span", { class: `tagpill ${group ? "lime" : ""}` }, group ? "Premio de grupo" : p.max === 1 ? "Máximo 1 por estudiante" : "Premio individual"),
      h("h3", {}, p.premio),
      h("p", { class: "cost" }, fmtN(p.costo), " ", h("small", {}, group ? "puntos de promedio" : "puntos")),
      p.descripcion && h("p", { class: "meta" }, p.descripcion),
      h("div", {}, h("div", { class: "bar" }, h("i", { style: { width: Math.max(pct, 2) + "%" } })),
        h("p", { class: "meta" }, group
          ? (enough ? "¡Meta lograda! Tu profe coordina la clase libre." : `Promedio de ${info.group?.nombre || "tu grupo"}: ${fmtN(have)} de ${fmtN(p.costo)}`)
          : (enough ? "¡Ya tienes los puntos!" : `Tienes ${fmtN(have)} · te faltan ${fmtN(p.costo - have)}. ¡Vas por buen camino!`))),
      reqs.length ? h("ul", { class: "reqs" }, reqs.map((x) => h("li", { class: x.ok ? "ok" : "" }, h("span", { class: "ck" }, x.ok ? "✓" : "🔒"), REQ_LABEL[x.k] || x.k))) : null,
      group ? h("p", { class: "meta" }, `${info.group?.estudiantes || 0} estudiantes · ${info.group?.activos || 0} activos esta semana. Se avanza ayudándose.`)
        : done ? h("button", { class: "btn", disabled: true }, mine[0].estado === "entregado" ? "Entregado ✓" : "Reclamado · en revisión")
          : h("button", { class: ready ? "btn primary" : "btn", disabled: !ready, onclick: () => redeem(p) }, ready ? "Reclamar" : pending > 1 || !enough ? "Aún no alcanza" : "Faltan requisitos"));
  };

  mount(
    h("section", {},
      h("p", { class: "eyebrow" }, "Mis premios"),
      h("h1", { style: { margin: "8px 0 18px" } }, "Metas lejanas, pero alcanzables"),
      h("div", { class: "prize-grid2" }, (info.prizes || prizes).map(card)),
      h("p", { class: "muted", style: { marginTop: "14px", fontSize: "0.88rem" } }, "Los puntos no se gastan: se acumulan. Cuando cumples la meta y los requisitos, reclamas y tu profe lo revisa y te lo entrega.")),
    h("section", { class: "card" },
      h("h2", {}, "Mis insignias"),
      h("div", { class: "badge-grid" }, Object.entries(BADGES).map(([id, b]) => h("div", { class: `badge ${st.badges.includes(id) ? "earned" : ""}` },
        h("div", { class: "b-emoji" }, st.badges.includes(id) ? b.emoji : "❔"),
        h("strong", {}, b.name), h("small", { class: "muted" }, b.desc))))),
    h("section", { class: "card" },
      h("h2", {}, "Rangos"),
      h("ol", { class: "ranks" }, PRACTICE_RANKS.map((x) => h("li", { class: x.level === (st.ai?.level || 1) ? "current" : "" }, `${x.name} · nivel ${x.level} de práctica · ${CFG.AI_XP[x.level - 1]} puntos por ejercicio`)))));
}

function redeem(p) {
  modal({
    title: "¿Reclamar este premio?",
    body: h("p", {}, `${p.premio}. Tu profe recibirá la solicitud, la revisará y te lo entregará.`),
    actions: [
      { label: "Cancelar", kind: "ghost" },
      { label: "Sí, reclamar", kind: "primary", onclick: async () => {
        try {
          await api.call("redeem", { prize: { id: p.id }, resumen: `misiones completadas: ${routeMissions().filter(missionDone).length}/8 · puntos: ${S.state.xp}` });
          toast("¡Solicitud enviada! Tu profe la revisará.", "win");
          viewPrizes();
        } catch (e) { toast("No se pudo reclamar: " + e.message, "error"); }
      } },
    ],
  });
}

// ============================ Arranque ============================
initA11y();
showLogin();

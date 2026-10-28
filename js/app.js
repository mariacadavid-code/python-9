// Aplicación principal: inicio de sesión, rutas y vistas.
import { CFG, h, toast, modal, decodeJwt, codeBlock, seedFrom, friendlyError } from "./util.js";
import * as api from "./api.js";
import { S, defaultState, rankFor, RANKS, BADGES, XP_BY_TYPE, save, flush, markSolved, markFail, award } from "./state.js";
import * as sup from "./supervisor.js";
import { MISSIONS } from "./missions/index.js";
import { TYPE_INFO, prepare, render, solutionText, editor } from "./exercises.js";
import { openExam } from "./exam.js";
import { renderTeacher } from "./teacher.js";
import { runPython, warmup } from "./py.js";

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
  mount(
    h("section", { class: "login card" },
      h("div", { class: "logo-big" }, "🐍"),
      h("h1", {}, "Python Practicando"),
      h("p", { class: "muted" }, "Grado 9° · Serschool"),
      h("p", {}, `Entra con tu correo del colegio (@${CFG.DOMAIN}).`),
      h("div", { id: "gbtn" }),
      error && h("p", { class: "error" }, error),
      isLocalDev() && api.isDemo() && h("div", { class: "dev-login" },
        h("p", { class: "muted" }, "Modo prueba (solo en este computador):"),
        h("button", { class: "btn ghost", onclick: () => startSession({ email: "estudiante.prueba@" + CFG.DOMAIN, name: "Estudiante de Prueba" }) }, "Entrar como estudiante"),
        h("button", { class: "btn ghost", onclick: () => startSession({ email: CFG.TEACHERS[0], name: "Profe (prueba)" }) }, "Entrar como profe"))));
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
  const r = rankFor(st.xp);
  const link = (href, label, extra = "") => h("a", { href, class: `nav-link ${extra} ${location.hash.startsWith(href) ? "active" : ""}` }, label);
  bar.replaceChildren(
    h("a", { href: "#/", class: "brand" }, h("span", { class: "logo" }, "🐍"), h("span", {}, "Python 9°")),
    h("nav", {},
      isTeacher && link("#/profe", "🧑‍🏫 Panel docente", "teacher-link"),
      link("#/", isTeacher ? "🗺️ Curso" : "🏠 Inicio"),
      link("#/lab", labUnlocked() ? "💻 Laboratorio" : "🔒 Laboratorio"),
      !isTeacher && link("#/premios", "🎁 Premios")),
    isTeacher ? h("div", { class: "me" },
      h("label", { class: "switch", title: "Con el modo abierto puedes entrar a cualquier misión y nivel sin desbloquear nada. Apágalo para ver el curso como lo ve un estudiante." },
        h("input", { type: "checkbox", checked: teacherOpen(), onchange: (e) => setTeacherOpen(e.target.checked) }),
        h("span", {}, "🔓 Todo abierto")),
      h("span", { class: "pill", title: "Tu avance y tus intentos no se guardan ni se mezclan con los de los estudiantes." }, "Modo docente")) :
    h("div", { class: "me" },
      h("div", { class: "rank", title: r.next ? `Siguiente rango: ${r.next.name} (${r.next.min} XP)` : "¡Rango máximo!" },
        h("span", { class: "rank-emoji" }, r.emoji),
        h("div", {},
          h("div", { class: "rank-name" }, `${r.name} · ${st.xp} XP`),
          h("div", { class: "xpbar" }, h("i", { style: { width: r.pct + "%" } })))),
      h("div", { class: "coins", title: "Pycoins para canjear premios" }, `🪙 ${st.coins}`)),
  );
}

// ============================ Rutas ============================
function route() {
  const parts = location.hash.replace(/^#\/?/, "").split("/");
  window.scrollTo(0, 0);
  renderTopbar();
  if (parts[0] === "m") return viewMission(Number(parts[1]), parts[2] || "dossier");
  if (parts[0] === "ex") return viewExercise(parts[1]);
  if (parts[0] === "lab") return viewLab();
  if (parts[0] === "premios") return viewPrizes();
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
  const m1 = MISSIONS[0];
  const next = nextExercise(m1);
  mount(
    examBanner(),
    h("section", { class: "hero card" },
      h("div", {},
        h("h1", {}, `¡Hola, ${first}! 👋`),
        h("p", {}, "Cada misión tiene un dossier para leer y muchos ejercicios cortos. Repetir con variantes distintas es lo que hace que se te quede en la memoria. 🧠"),
        h("div", { class: "row" },
          !st.read.m1 ? h("a", { class: "btn primary big", href: "#/m/1" }, "Empezar Misión 1 📚")
            : next && !st.pendingExam ? h("a", { class: "btn primary big", href: `#/ex/${next.id}` }, "Seguir practicando ▶")
              : h("a", { class: "btn primary big", href: "#/m/1/ejercicios" }, "Ver ejercicios"))),
      h("div", { class: "hero-stats" },
        stat("✅", st.solvedCount, "resueltos"),
        stat("⭐", st.xp, "XP"),
        stat("🏅", st.badges.length, "insignias"))),
    h("h2", { class: "section-title" }, "🗺️ Misiones"),
    h("div", { class: "mission-grid" }, MISSIONS.map(missionCard)),
  );
}
const stat = (icon, n, label) => h("div", { class: "stat" }, h("div", { class: "stat-n" }, `${icon} ${n}`), h("div", { class: "muted" }, label));

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
          h("div", {}, h("div", { class: "muted" }, `Nivel ${li + 1}${l.extra ? " · ⭐ Extra (opcional)" : ""}`), h("h3", {}, info.name)),
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
  const hintBtn = h("button", { class: "btn ghost", onclick: () => {
    usedHint = true;
    hintBtn.disabled = true;
    feedback.hidden = false;
    feedback.className = "feedback hint";
    feedback.replaceChildren(h("strong", {}, "💡 Pista: "), h("span", {}, ex.hint));
  } }, "💡 Pista");

  mount(
    h("nav", { class: "crumbs" }, h("a", { href: `#/m/${m.id}/ejercicios` }, `← Misión ${m.id}: ${m.title}`)),
    h("section", { class: "card exercise-card" },
      h("div", { class: "ex-head" },
        h("span", { class: "level-icon" }, info.icon),
        h("div", {}, h("div", { class: "muted" }, `Nivel ${levelIdx + 1} · ${info.name}`), h("h1", {}, ex.title)),
        h("span", { class: "pill" }, wasSolved ? "✅ Resuelto · práctica libre" : `+${XP_BY_TYPE[ex.type]} XP`)),
      h("p", { class: "ask" }, info.ask),
      body,
      feedback,
      h("div", { class: "row" }, checkBtn, ex.hint && hintBtn)));

  const inst = await prepare(ex, seedFrom(S.user.email, ex.id, variant));
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
      feedback.replaceChildren(
        h("strong", {}, gain ? `🎉 ¡Correcto! +${gain} XP` : "🎉 ¡Correcto!"),
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
    feedback.replaceChildren(h("strong", {}, res.msg), res.out != null && h("pre", { class: "console" }, res.out));
    checkBtn.disabled = false;
    // Cada 2 fallos: se muestra la solución y llega una variante nueva para practicar de verdad.
    if (fails % 2 === 0) {
      modal({
        title: "Vamos con otra variante 🔁",
        body: h("div", {},
          h("p", {}, "Te muestro la respuesta de esta versión. Léela con calma y luego intenta una nueva:"),
          h("pre", { class: "console nosel" }, solutionText(inst))),
        actions: [{ label: "Entendido, ¡dame otra!", kind: "primary", onclick: () => { st.variant[ex.id] = (st.variant[ex.id] || 0) + 1; save(); viewExercise(ex.id); } }],
        dismissable: false,
      });
    }
  };
}

function celebrate() {
  const layer = h("div", { class: "confetti", "aria-hidden": "true" });
  for (let i = 0; i < 24; i++) {
    layer.append(h("i", { style: { left: Math.random() * 100 + "%", animationDelay: Math.random() * 0.4 + "s", background: `hsl(${Math.random() * 360} 85% 60%)` } }));
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 2200);
}

// ---------- Laboratorio (compilador libre) ----------
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
  mount(h("section", { class: "card" },
    h("h1", {}, "💻 Laboratorio"),
    h("p", { class: "muted" }, "Python 3 de verdad, corriendo en tu navegador. Experimenta sin miedo: aquí nada da puntos ni quita."),
    ed.el, h("div", { class: "row" }, run), stdin, h("div", { class: "label" }, "Salida"), out));
}

// ---------- Premios e insignias ----------
function viewPrizes() {
  const st = S.state;
  const r = rankFor(st.xp);
  mount(
    h("section", { class: "card" },
      h("h1", {}, "🎁 Tienda de premios"),
      h("p", {}, `Tienes `, h("strong", {}, `🪙 ${st.coins} Pycoins`), `. Los ganas resolviendo ejercicios y exámenes. Tu profe aprueba cada canje.`),
      h("div", { class: "prize-grid" }, prizes.map((p) => h("div", { class: "prize card" },
        h("h3", {}, p.premio),
        h("div", { class: "pill" }, `🪙 ${p.costo}`),
        h("button", { class: "btn primary", disabled: st.coins < p.costo, onclick: () => redeem(p) }, st.coins < p.costo ? `Te faltan ${p.costo - st.coins}` : "Canjear"))))),
    h("section", { class: "card" },
      h("h2", {}, "🏅 Insignias"),
      h("div", { class: "badge-grid" }, Object.entries(BADGES).map(([id, b]) => h("div", { class: `badge ${st.badges.includes(id) ? "earned" : ""}` },
        h("div", { class: "b-emoji" }, st.badges.includes(id) ? b.emoji : "❔"),
        h("strong", {}, b.name), h("small", { class: "muted" }, b.desc))))),
    h("section", { class: "card" },
      h("h2", {}, "📈 Rangos"),
      h("ol", { class: "ranks" }, RANKS.map((x) => h("li", { class: x.name === r.name ? "current" : "" }, `${x.emoji} ${x.name} — desde ${x.min} XP`)))));
}

function redeem(p) {
  modal({
    title: "¿Canjear este premio?",
    body: h("p", {}, `${p.premio} por 🪙 ${p.costo}. Tu profe recibirá la solicitud.`),
    actions: [
      { label: "Cancelar", kind: "ghost" },
      { label: "Sí, canjear", kind: "primary", onclick: async () => {
        try {
          await api.call("redeem", { prize: p });
          S.state.coins -= p.costo;
          S.state.spent += p.costo;
          save();
          toast("🎉 ¡Solicitud enviada! Tu profe la revisará.", "win");
          viewPrizes();
        } catch (e) { toast("No se pudo canjear: " + e.message, "error"); }
      } },
    ],
  });
}

// ============================ Arranque ============================
showLogin();

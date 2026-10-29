// Práctica personalizada del Laboratorio. Los ejercicios se adaptan al nivel del estudiante (1 a 5):
// vienen de la IA (Gemini, a través del Apps Script) y, si la IA no está disponible, del banco de ejercicios del curso.
// Cada ejercicio de la IA se verifica con Python real en el navegador antes de mostrarse.
import { CFG, h, esc, seedFrom, rng, normOut, toast } from "./util.js";
import * as api from "./api.js";
import { MISSIONS } from "./missions/index.js";
import { S, save, award, PRACTICE_RANKS, practiceRank } from "./state.js";
import { avatarSVG, avatarState } from "./avatar.js";
import { prepare, render, TYPE_INFO } from "./exercises.js";
import { runPython } from "./py.js";
import { buddy } from "./huellita.js";
import { listenButton, plainText } from "./a11y.js";

const NAMES = PRACTICE_RANKS.map((r) => r.name);

// Qué sabe el estudiante según las misiones que ya abrió. La IA solo usa estos temas.
const TOPICS = {
  1: "print, variables, tipos de datos (int, float, str, bool), comentarios y asignación múltiple",
  2: "operaciones aritméticas (+ - * / // % **), jerarquía de operaciones y variables que se acumulan",
  3: "cadenas de texto: comillas, índices, slicing y métodos como upper, lower, replace y split",
  4: "input(), conversión con int() y float(), y f-strings",
  5: "booleanos, comparaciones, and, or, not, y condicionales if, elif y else",
  6: "listas: crear, índices, append, remove, len y sort",
  7: "bucles for con range y while, break y continue",
  8: "funciones con def, parámetros, valores por defecto y return",
};

// replaceChildren convierte null en el texto "null": se filtran los vacíos antes de pintar.
const put = (el, ...nodes) => el.replaceChildren(...nodes.filter((n) => n != null && n !== false));

const today = () => new Date().toLocaleDateString("sv-SE", { timeZone: "America/Bogota" });

export function aiState() {
  const st = S.state;
  st.ai ??= { level: 1, ok: 0, no: 0, hist: [], seen: [], day: "", todayEx: 0, todayXp: 0, done: 0 };
  const a = st.ai;
  if (a.day !== today()) { a.day = today(); a.todayEx = 0; a.todayXp = 0; }
  return a;
}

function unlockedTopics() {
  const list = MISSIONS.filter((m) => !m.soon && TOPICS[m.id] && (S.isTeacher || S.state.read["m" + m.id])).map((m) => TOPICS[m.id]);
  return list.length ? list : [TOPICS[1]];
}

// Respaldo cuando la IA no está disponible: un ejercicio del curso que corresponde al nivel.
const BANK_TYPES = { 1: ["predict"], 2: ["fill"], 3: ["parsons", "bug"], 4: ["code"] };
function bankPick(level) {
  const pool = [];
  for (const m of MISSIONS) {
    if (m.soon || !(S.isTeacher || S.state.read["m" + m.id])) continue;
    for (const l of m.levels) {
      if (level === 5 ? l.extra : !l.extra && BANK_TYPES[level].includes(l.type)) pool.push(...l.exercises);
    }
  }
  if (!pool.length) for (const l of MISSIONS[0].levels) if (!l.extra) pool.push(...l.exercises);
  return rng(seedFrom(S.user.email, "banco", Date.now())).pick(pool);
}

const mdLite = (t) => esc(String(t)).replace(/`([^`]+)`/g, "<code>$1</code>");

function aiExercise(id, e) {
  return {
    id: "ia-" + id, type: "code", title: e.titulo, hint: e.pista || "Divide el problema en pasos pequeños.",
    gen: () => ({
      prompt: mdLite(e.enunciado),
      starter: e.codigo_inicial ? e.codigo_inicial + "\n" : "",
      solution: e.solucion,
      tests: e.pruebas.map((p) => ({ pre: p.antes || "", stdin: p.entradas || [] })),
      usesInput: e.pruebas.some((p) => (p.entradas || []).length),
    }),
  };
}

// La solución propuesta por la IA tiene que funcionar de verdad: sin errores y con salida en todas las pruebas.
async function verify(e) {
  const outs = [];
  for (const p of e.pruebas) {
    const r = await runPython((p.antes ? p.antes + "\n" : "") + e.solucion, p.entradas || [], 4000);
    if (r.err || !String(r.out).trim()) return false;
    outs.push(normOut(r.out));
  }
  const varies = e.pruebas.some((p) => p.antes) || e.pruebas.some((p) => (p.entradas || []).length);
  return !(e.pruebas.length > 1 && varies && new Set(outs).size < 2);
}

async function fetchExercise(a) {
  const temas = unlockedTopics();
  for (let intento = 0; intento < 2; intento++) {
    let r;
    try { r = await api.call("aiPractice", { nivel: a.level, temas, excluir: a.seen.slice(-60) }); } catch (e) { return { fallback: e.message }; }
    if (await verify(r.ejercicio)) {
      if (r.origen === "ia") api.call("aiReport", { id: r.id, ok: true }).catch(() => {});
      a.seen.push(r.id);
      a.seen = a.seen.slice(-120);
      return { ex: aiExercise(r.id, r.ejercicio), origen: r.origen };
    }
    api.call("aiReport", { id: r.id, ok: false }).catch(() => {});
  }
  return { fallback: "IA_ERROR" };
}

const FALLBACK_MSG = {
  IA_NO_ACTIVA: "La IA todavía no está activa, así que te pongo ejercicios del banco del curso, con tu mismo nivel.",
  IA_LIMITE_DIARIO: "Llegaste al límite de ejercicios nuevos con IA de hoy. Seguimos con el banco del curso.",
  IA_LIMITE_GLOBAL: "La IA está muy ocupada hoy. Seguimos con el banco del curso.",
  IA_LIMITE_GOOGLE: "La IA está muy ocupada ahora. Seguimos con el banco del curso.",
};

export function aiPanel({ celebrate } = {}) {
  const a = aiState();
  const huellita = buddy(`¡Hola! Estás en el nivel ${a.level}. Pide un ejercicio cuando quieras.`, "hi");
  const scaleEl = h("div", { class: "ai-scale" });
  const pipsEl = h("div", { class: "ai-pips" });
  const coachEl = h("p", { class: "muted" });
  const limitEl = h("p", { class: "muted", style: { fontSize: "0.85rem" } });
  const stage = h("div", { class: "ai-stage" });
  const placeEl = h("div", { class: "ai-place" });
  const askBtn = h("button", { class: "btn primary big" }, "Dame un ejercicio");
  let busy = false;

  function paintMeta() {
    scaleEl.replaceChildren(...NAMES.map((n, i) => h("div", { class: i + 1 === a.level ? "on" : i + 1 < a.level ? "past" : "" }, h("b", {}, i + 1), h("span", {}, n))));
    pipsEl.replaceChildren(...a.hist.slice(-5).map((v) => h("i", { class: v ? "y" : "n" })));
    const need = 3 - a.ok;
    coachEl.textContent = a.level >= 5 ? "Estás en el nivel más alto. Mantén el ritmo."
      : `Con ${need} acierto${need === 1 ? "" : "s"} seguido${need === 1 ? "" : "s"} sin pistas, subes al nivel ${a.level + 1}.`;
    limitEl.textContent = `Hoy: ${a.todayEx} de ${CFG.AI_DAILY_EX} ejercicios · ${a.todayXp} de ${CFG.AI_DAILY_XP} puntos posibles`;
    askBtn.disabled = busy || a.todayEx >= CFG.AI_DAILY_EX;
    const pr = practiceRank(a.level);
    const placedOk = a.placed && !a.placed.skipped;
    const days = placedOk ? Math.max(0, Math.ceil(7 - (Date.now() - a.placed.at) / 864e5)) : 0;
    placeEl.replaceChildren(
      h("div", {}, h("p", { class: "eyebrow" }, "Tu rango"), h("p", { class: "goal-big" }, `${pr.name} · nivel ${a.level}`),
        h("p", { class: "muted", style: { fontSize: "0.85rem" } }, placedOk ? "Tu ubicación ya está hecha." : "Aún no hiciste tu prueba de ubicación: son 5 preguntas y la IA te pone en tu rango.")),
      h("button", { class: placedOk ? "btn" : "btn primary", disabled: busy || !canPlace(), onclick: placement },
        !placedOk ? "Hacer mi prueba de ubicación" : canPlace() ? "Repetir mi ubicación" : `Podrás repetirla en ${days} día${days === 1 ? "" : "s"}`));
  }

  const canPlace = () => S.isTeacher || !a.placed || a.placed.skipped || Date.now() - a.placed.at >= 7 * 864e5;

  // 3 aciertos seguidos sin pistas suben de nivel; 3 ejercicios fallidos seguidos lo bajan un paso.
  function register(kind) {
    const before = a.level;
    if (kind === "ok") { a.ok++; a.no = 0; a.hist.push(1); if (a.ok >= 3 && a.level < 5) { a.level++; a.ok = 0; } }
    else if (kind === "help") { a.ok = 0; a.no = 0; a.hist.push(1); }
    else { a.ok = 0; a.no++; a.hist.push(0); if (a.no >= 3 && a.level > 1) { a.level--; a.no = 0; } }
    a.hist = a.hist.slice(-10);
    if (a.level >= 3) award("ia-nivel3");
    if (a.level > (a.max || 1)) { a.max = a.level; toast(`🏅 ¡Nueva medalla de rango: ${practiceRank(a.level).name}!`, "win", 5000); }
    return a.level - before;
  }

  async function load() {
    if (busy) return;
    if (a.todayEx >= CFG.AI_DAILY_EX) {
      put(stage, h("p", { class: "banner" }, `Hoy ya practicaste ${CFG.AI_DAILY_EX} ejercicios. ¡Buen trabajo! Mañana seguimos.`));
      return;
    }
    busy = true;
    paintMeta();
    huellita.say("Déjame pensar un ejercicio a tu medida…", "think");
    put(stage, h("p", { class: "center loading" }, "Huellita está preparando tu ejercicio…"));
    const level = a.level;
    const r = await fetchExercise(a);
    const ex = r.fallback ? bankPick(level) : r.ex;
    const origin = r.fallback ? "banco" : r.origen === "ia" ? "ia" : "banco-ia";
    const inst = await prepare(ex, seedFrom(S.user.email, ex.id, Date.now() % 100000));
    const view = render(inst);
    a.todayEx++;
    save();

    let wrong = 0, usedHint = false, solved = false, failedCounted = false;
    const feedback = h("div", { class: "feedback", hidden: true });
    const checkBtn = h("button", { class: "btn primary big" }, "Comprobar ✔");
    const hintBtn = h("button", { class: "btn ghost", onclick: () => {
      usedHint = true; hintBtn.disabled = true;
      feedback.hidden = false; feedback.className = "feedback hint";
      put(feedback, h("strong", {}, "💡 Pista: "), h("span", {}, ex.hint || "Divide el problema en pasos pequeños."));
      huellita.say("Buena idea pedir una pista. Pensar con ayuda también es aprender.", "think");
    } }, "💡 Pista");
    const nextBtn = h("button", { class: "btn primary", onclick: () => { busy = false; load(); } }, "Siguiente ejercicio ▶");
    const listen = listenButton(() => [ex.title, plainText(inst.data.prompt || TYPE_INFO[ex.type].ask)].join(". "));

    checkBtn.onclick = async () => {
      if (solved) return;
      checkBtn.disabled = true; checkBtn.textContent = "Revisando…";
      const res = await view.check();
      checkBtn.textContent = "Comprobar ✔"; checkBtn.disabled = false;
      feedback.hidden = false;
      if (res.ok) {
        solved = true;
        const firstTry = wrong === 0 && !usedHint;
        const base = (CFG.AI_XP[level - 1] || 10) + (firstTry ? 5 : 0);
        const gain = Math.min(base, Math.max(0, CFG.AI_DAILY_XP - a.todayXp));
        S.state.xp += gain; a.todayXp += gain; a.done++;
        const delta = failedCounted ? 0 : register(firstTry ? "ok" : "help");
        save({ ejercicio: ex.id, tipo: "ia", correcto: true, xp: gain });
        feedback.className = "feedback ok";
        put(feedback, 
          h("strong", {}, gain ? `🎉 ¡Correcto! +${gain} puntos` : "🎉 ¡Correcto!"),
          gain === 0 ? h("div", { class: "muted" }, "Ya llegaste al tope de puntos de hoy. Practicar igual te sirve mucho.") : null,
          delta > 0 ? h("div", { class: "cheer" }, `¡Subiste al nivel ${a.level}!`) : null,
          h("div", { class: "row" }, a.todayEx < CFG.AI_DAILY_EX ? nextBtn : h("span", { class: "muted" }, "Ese fue tu último ejercicio de hoy. ¡Mañana seguimos!")));
        huellita.say(delta > 0 ? `¡Subiste al nivel ${a.level}! Te lo ganaste con práctica.` : "¡Bien hecho! Sigamos con otro.", "cheer", true);
        celebrate?.();
        checkBtn.disabled = true; hintBtn.disabled = true;
      } else {
        wrong++;
        feedback.className = "feedback bad";
        put(feedback, h("strong", {}, res.msg), res.out != null && h("pre", { class: "console" }, res.out));
        huellita.say("Sin afán. Mira otra vez y prueba de nuevo.", "hug");
        if (wrong >= 3 && !failedCounted) {
          failedCounted = true;
          const delta = register("fail");
          save();
          feedback.append(h("p", { class: "cheer" }, delta < 0 ? `Vamos un pasito atrás, al nivel ${a.level}, para afianzar. Así se llega más lejos.` : "Este estuvo difícil. Pide una pista o salta al siguiente."),
            h("div", { class: "row" }, a.todayEx < CFG.AI_DAILY_EX ? nextBtn : null));
        }
      }
      paintMeta();
    };

    const notice = r.fallback ? (FALLBACK_MSG[r.fallback] || "No pude traer un ejercicio de la IA. Te pongo uno del banco del curso.") : "";
    put(stage, 
      h("div", { class: "row", style: { justifyContent: "space-between" } },
        h("span", { class: `tagpill ${origin === "ia" ? "lime" : ""}` }, origin === "ia" ? "Hecho para ti con IA" : origin === "banco-ia" ? "Hecho con IA para tu nivel" : "Del banco del curso"),
        h("span", { class: "muted", style: { fontSize: "0.8rem" } }, `Nivel ${level} · ${NAMES[level - 1]}`)),
      notice ? h("p", { class: "muted", style: { fontSize: "0.85rem" } }, notice) : null,
      h("h2", {}, ex.title),
      h("p", { class: "ask" }, ex.type === "code" && origin !== "banco" ? "Escribe tu programa. Lo revisamos con pruebas automáticas." : TYPE_INFO[ex.type].ask),
      view.el,
      feedback,
      h("div", { class: "row" }, checkBtn, hintBtn, listen));
    huellita.say(r.fallback ? "Aquí tienes uno de tu nivel. ¡Vamos!" : "¡Listo! Este lo preparé para ti.", "hi", true);
    busy = false;
    paintMeta();
  }

  // Prueba de ubicación: 5 preguntas que parten del nivel medio. Si acierta sube, si falla baja. El rango queda en el nivel más alto que resolvió.
  async function placement() {
    if (busy) return;
    busy = true;
    paintMeta();
    const probe = { level: 3, seen: a.seen };
    let highest = 0, right = 0;
    const results = [];
    for (let i = 1; i <= 5; i++) {
      huellita.say(`Pregunta ${i} de 5. Sin pistas, a tu ritmo.`, "think");
      put(stage, h("p", { class: "center loading" }, `Preparando la pregunta ${i} de 5…`));
      const lvl = probe.level;
      const r = await fetchExercise(probe);
      a.seen = probe.seen;
      const ex = r.fallback ? bankPick(lvl) : r.ex;
      const inst = await prepare(ex, seedFrom(S.user.email, ex.id, "ub", Date.now() % 100000));
      const view = render(inst);
      const ok = await new Promise((resolve) => {
        let wrong = 0;
        const feedback = h("div", { class: "feedback", hidden: true });
        const check = h("button", { class: "btn primary big" }, "Comprobar ✔");
        const skip = h("button", { class: "btn ghost", onclick: () => resolve(false) }, "No lo sé");
        check.onclick = async () => {
          check.disabled = true; check.textContent = "Revisando…";
          const res = await view.check();
          check.disabled = false; check.textContent = "Comprobar ✔";
          if (res.ok) { resolve(wrong <= 1); return; }
          wrong++;
          feedback.hidden = false; feedback.className = "feedback bad";
          put(feedback, h("strong", {}, res.msg), res.out != null && h("pre", { class: "console" }, res.out));
          if (wrong >= 3) resolve(false);
        };
        put(stage,
          h("div", { class: "row", style: { justifyContent: "space-between" } }, h("span", { class: "tagpill lime" }, `Pregunta ${i} de 5`), h("span", { class: "muted", style: { fontSize: "0.8rem" } }, "Prueba de ubicación · sin pistas")),
          h("div", { class: "ai-steps" }, Array.from({ length: 5 }, (_, k) => h("i", { class: k < i - 1 ? "ok" : k === i - 1 ? "now" : "" }))),
          h("h2", {}, ex.title),
          h("p", { class: "ask" }, r.fallback ? TYPE_INFO[ex.type].ask : "Escribe tu programa. Lo revisamos con pruebas automáticas."),
          view.el, feedback, h("div", { class: "row" }, check, skip));
      });
      results.push(ok);
      if (ok) { right++; highest = Math.max(highest, lvl); probe.level = Math.min(5, lvl + 1); } else probe.level = Math.max(1, lvl - 1);
    }
    // Si falló las dos últimas, ese nivel era su techo: se baja un escalón.
    if (results.slice(-2).every((x) => !x)) highest = Math.max(1, highest - 1);
    const placed = Math.max(1, highest);
    a.level = placed; a.max = Math.max(a.max || 1, placed); a.ok = 0; a.no = 0; a.hist = [];
    a.placed = { level: placed, at: Date.now() };
    award("ia-ubicacion");
    if (placed >= 3) award("ia-nivel3");
    save();
    const rank = practiceRank(placed);
    put(stage, h("div", { class: "placement-result" },
      h("div", { class: "pr-avatar", html: avatarSVG(avatarState(), 150) }),
      h("h2", {}, `Tu rango: ${rank.name}`),
      h("p", {}, `Respondiste bien ${right} de 5. Empiezas en el nivel ${placed} y ganas ${CFG.AI_XP[placed - 1]} puntos por ejercicio. Si lo haces bien, subes.`),
      h("div", { class: "row", style: { justifyContent: "center" } },
        h("button", { class: "btn primary", onclick: () => { busy = false; load(); } }, "Empezar a practicar"),
        h("a", { class: "btn", href: "#/perfil" }, "Ver mi perfil y compartir"))));
    huellita.say(`¡Listo! Tu rango es ${rank.name}. ¡Qué buen comienzo!`, "cheer", true);
    celebrate?.();
    busy = false;
    paintMeta();
  }

  askBtn.onclick = load;
  paintMeta();
  return h("div", { class: "ai" },
    h("section", { class: "card ai-head" },
      huellita.el,
      placeEl,
      h("div", { class: "ai-meta" },
        h("div", {}, h("p", { class: "eyebrow" }, "Tu nivel"), scaleEl),
        h("div", {}, h("p", { class: "eyebrow" }, "Últimos 5 ejercicios"), pipsEl, coachEl, limitEl)),
      h("div", { class: "row" }, askBtn)),
    h("section", { class: "card" }, stage),
    h("section", { class: "card" },
      h("h3", {}, "Cómo decide tu entrenadora"),
      h("ul", { class: "reqs" },
        h("li", { class: "ok" }, h("span", { class: "ck" }, "↑"), "Sube de nivel con 3 aciertos seguidos sin pistas."),
        h("li", { class: "ok" }, h("span", { class: "ck" }, "↓"), "Baja un paso si 3 ejercicios seguidos se te hacen muy difíciles, para reforzar."),
        h("li", { class: "ok" }, h("span", { class: "ck" }, "✓"), "Cada ejercicio se revisa con Python antes de llegar a ti."),
        h("li", { class: "ok" }, h("span", { class: "ck" }, "⏱"), `Hay un tope diario (${CFG.AI_DAILY_EX} ejercicios y ${CFG.AI_DAILY_XP} puntos) para que practiques con calma.`))));
}

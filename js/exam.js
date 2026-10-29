// Exámenes (checkpoints): pantalla completa obligatoria, sin pistas, y bloqueo si el estudiante se sale.
// Solo la profe puede volver a habilitar un examen bloqueado.
import { CFG, h, seedFrom, rng, toast, modal } from "./util.js";
import { call } from "./api.js";
import { S, save, award, flush } from "./state.js";
import { prepare, render } from "./exercises.js";
import * as sup from "./supervisor.js";
import { MISSIONS } from "./missions/index.js";

const root = () => document.getElementById("exam-root");
let pollTimer = null;
let clock = null;

function close() {
  clearInterval(pollTimer);
  clearInterval(clock);
  sup.setMode("practica");
  sup.exitFullscreen();
  root().hidden = true;
  root().replaceChildren();
  document.dispatchEvent(new CustomEvent("state-changed"));
}

function screen(...children) {
  root().hidden = false;
  root().replaceChildren(h("div", { class: "exam-screen" }, ...children));
}

// Punto de entrada: muestra el examen pendiente según su estado en el servidor.
export async function openExam() {
  const pe = S.state.pendingExam;
  if (!pe) return;
  screen(h("p", { class: "center" }, "Cargando examen…"), h("p", { class: "center muted" }, "Si tarda, es porque hay muchos estudiantes conectados. Espera unos segundos."));
  let status;
  try {
    status = await call("examStatus", { examId: pe.id });
  } catch (e) {
    screen(h("p", { class: "center" }, "No pudimos abrir el examen: " + e.message),
      h("div", { class: "row center" }, h("button", { class: "btn ghost", onclick: close }, "Volver"), h("button", { class: "btn primary", onclick: openExam }, "Reintentar")));
    return;
  }
  if (status.estado === "bloqueado") return lockedScreen(pe, status.motivo);
  intro(pe, status.estado === "habilitado");
}

function intro(pe, reopened) {
  screen(
    h("div", { class: "exam-badge" }, "📝"),
    h("h1", {}, pe.title),
    reopened && h("p", { class: "ok-note" }, "✅ Tu profe habilitó de nuevo el examen. Tendrás preguntas nuevas."),
    h("ul", { class: "rules" },
      h("li", {}, `${CFG.EXAM_QUESTIONS} preguntas y ${CFG.EXAM_MINUTES} minutos.`),
      h("li", {}, "Se hace en pantalla completa. Sin pistas, sin copiar ni pegar."),
      h("li", { class: "danger" }, "🔒 Si sales de la pantalla completa, cambias de pestaña o de ventana, el examen se BLOQUEA y solo tu profe lo puede habilitar."),
      h("li", {}, "Si recargas o cierras la página durante el examen, también se bloquea.")),
    h("div", { class: "row center" },
      h("button", { class: "btn ghost", onclick: close }, "Ahora no"),
      h("button", { class: "btn primary big", onclick: () => begin(pe) }, "Empezar en pantalla completa 🚀")),
  );
}

async function begin(pe) {
  const fs = await sup.enterFullscreen();
  if (!fs) {
    toast("Tu navegador no dejó activar pantalla completa. Inténtalo de nuevo.", "warn");
    return;
  }
  let intento;
  try {
    ({ intento } = await call("examStart", { examId: pe.id }));
  } catch (e) {
    sup.exitFullscreen();
    if (e.message === "bloqueado") return lockedScreen(pe);
    screen(h("p", {}, e.message), h("button", { class: "btn", onclick: close }, "Volver"));
    return;
  }
  let locked = false;
  sup.setMode("examen", (tipo) => {
    if (locked) return;
    locked = true;
    clearInterval(clock);
    sup.setMode("practica");
    sup.exitFullscreen();
    lockedScreen(pe, tipo);
  });

  screen(h("p", { class: "center" }, "Preparando tus preguntas… 🐍"));
  const mission = MISSIONS.find((m) => m.id === pe.mission);
  // Solo se pregunta de los niveles que el estudiante ya practicó.
  const practiced = mission.levels.filter((l) => l.exercises.some((x) => S.state.solved[x.id]));
  const pool = practiced.flatMap((l) => l.exercises).filter((x) => ["predict", "fill", "bug"].includes(x.type));
  const r = rng(seedFrom(S.user.email, pe.id, intento));
  const chosen = r.sample(pool, CFG.EXAM_QUESTIONS);
  const items = [];
  for (const [i, ex] of chosen.entries()) {
    const inst = await prepare(ex, seedFrom(S.user.email, pe.id, intento, i));
    items.push({ inst, view: render(inst, { exam: true }) });
  }
  if (locked) return;

  let left = CFG.EXAM_MINUTES * 60;
  const timer = h("span", { class: "timer" });
  const tick = () => {
    timer.textContent = `⏱️ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
    timer.classList.toggle("low", left <= 60);
    if (left-- <= 0) submit(true);
  };
  // Confirmación propia: los diálogos nativos del navegador pueden sacar de pantalla completa.
  const askSubmit = () => modal({
    title: "¿Entregar el examen?",
    body: h("p", {}, "Después de entregar ya no puedes cambiar tus respuestas."),
    actions: [{ label: "Seguir revisando", kind: "ghost" }, { label: "Sí, entregar", kind: "primary", onclick: () => { submit(false); } }],
  });
  const submitBtn = h("button", { class: "btn primary big", onclick: askSubmit }, "Entregar examen ✅");
  screen(
    h("div", { class: "exam-head" }, h("strong", {}, pe.title), timer),
    items.map((it, i) => h("section", { class: "card exam-q" }, h("h3", {}, `Pregunta ${i + 1}`), it.view.el)),
    h("div", { class: "row center" }, submitBtn),
  );
  tick();
  clock = setInterval(tick, 1000);

  async function submit(auto) {
    if (locked) return;
    locked = true;
    clearInterval(clock);
    submitBtn.disabled = true;
    submitBtn.textContent = "Revisando…";
    let score = 0;
    for (const it of items) if ((await it.view.check()).ok) score++;
    const total = items.length;
    try {
      await call("examSubmit", { examId: pe.id, score, total, answers: items.map((it) => it.view.el.getAnswer?.() ?? "") });
    } catch (e) {
      sup.setMode("practica");
      sup.exitFullscreen();
      screen(h("p", {}, "No se pudo entregar: " + e.message), h("button", { class: "btn", onclick: close }, "Volver"));
      return;
    }
    sup.setMode("practica");
    sup.exitFullscreen();
    const st = S.state;
    const gain = score * 10 + (score === total ? 20 : 0);
    st.exams[pe.id] = { score, total, at: Date.now(), mission: pe.mission };
    st.xp += gain;
    st.coins += Math.round(gain / 5);
    st.pendingExam = null;
    if (score === total) award("examen-perfecto");
    if (pe.final) award(`mision-${pe.mission}`);
    save({ ejercicio: pe.id, tipo: "examen", correcto: score / total >= 0.6, xp: gain });
    await flush();
    screen(
      h("div", { class: "exam-badge" }, score / total >= 0.6 ? "🎉" : "💪"),
      h("h1", {}, `Sacaste ${score} de ${total}`),
      h("p", { class: "center" }, score / total >= 0.6 ? `¡Muy bien! Ganaste ${gain} XP.` : `Ganaste ${gain} XP. Repasa el dossier y sigue practicando: ¡vas mejorando!`),
      h("div", { class: "row center" }, h("button", { class: "btn primary", onclick: close }, "Seguir")),
    );
  }
}

function lockedScreen(pe, motivo) {
  sup.setMode("practica");
  screen(
    h("div", { class: "exam-badge" }, "🔒"),
    h("h1", {}, "Examen bloqueado"),
    h("p", { class: "center" }, "Saliste del examen, así que se bloqueó. Tu profe ya recibió el aviso."),
    motivo && h("p", { class: "center muted" }, `Motivo: ${String(motivo).replace(/_/g, " ")}`),
    h("p", { class: "center" }, "Pídele a tu profe que lo habilite. Esta pantalla se actualiza sola."),
    h("div", { class: "row center" }, h("button", { class: "btn ghost", onclick: close }, "Volver al inicio")),
  );
  clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    try {
      const s = await call("examStatus", { examId: pe.id });
      if (s.estado === "habilitado") {
        clearInterval(pollTimer);
        intro(pe, true);
      }
    } catch {}
  }, 15000);
}

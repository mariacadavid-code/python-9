// Supervisión: bloquea copiar/pegar, detecta salidas, pantalla completa, inactividad,
// y pinta la marca de agua + la capa anti-fotos.
import { CFG, h, modal, toast } from "./util.js";

let mode = "practica"; // "practica" | "examen"
let onViolation = null;
let report = () => {};
let user = null;
let lastSent = {};
let hiddenAt = null;
let blurTimer = null;
let lastActivity = Date.now();
let idleWarned = false;
let idleReported = false;
let idleModal = null;

function send(tipo, detalle = "", grave = false) {
  const key = tipo + mode;
  const now = Date.now();
  // No inundar la hoja: el mismo evento máximo cada 10 s (salvo los graves).
  if (!grave && lastSent[key] && now - lastSent[key] < 10000) return;
  lastSent[key] = now;
  report({ tipo, detalle: String(detalle), modo: mode, grave });
  if (grave && mode === "examen" && onViolation) onViolation(tipo, detalle);
}

export function setMode(m, violationHandler = null) {
  mode = m;
  onViolation = violationHandler;
  document.body.classList.toggle("exam-mode", m === "examen");
}
export const getMode = () => mode;

export function start(u, reporter) {
  user = u;
  report = reporter;

  // Copiar, cortar, pegar, arrastrar texto, menú contextual.
  const block = (tipo) => (e) => {
    e.preventDefault();
    send(tipo);
    toast("✋ En este sitio no se copia ni se pega: ¡escríbelo tú! Así se aprende.", "warn");
  };
  document.addEventListener("copy", block("intento_copiar"));
  document.addEventListener("cut", block("intento_cortar"));
  document.addEventListener("paste", block("intento_pegar"));
  document.addEventListener("drop", block("intento_soltar_texto"));
  document.addEventListener("contextmenu", (e) => { e.preventDefault(); send("clic_derecho"); });
  document.addEventListener("dragstart", (e) => e.preventDefault());

  document.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey;
    if (k === "f12" || (ctrl && e.shiftKey && ["i", "j", "c", "k"].includes(k)) || (ctrl && ["u", "s", "p"].includes(k))) {
      e.preventDefault();
      send("tecla_bloqueada", (ctrl ? "Ctrl+" : "") + (e.shiftKey ? "Shift+" : "") + e.key, mode === "examen" && k === "f12");
    }
    if (k === "printscreen") flashHide("captura");
  }, true);
  document.addEventListener("keyup", (e) => { if (e.key === "PrintScreen") flashHide("captura"); });

  // Salidas de la página.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      hiddenAt = Date.now();
      if (mode === "examen") send("salio_de_la_pestana", "durante examen", true);
    } else if (hiddenAt) {
      const secs = Math.round((Date.now() - hiddenAt) / 1000);
      hiddenAt = null;
      if (mode === "practica" && secs >= 2) {
        send("salio_de_la_pestana", `${secs} s fuera`);
        toast(`👀 Te fuiste ${secs} s. ¡Volvamos a Python! (Quedó registrado)`, "warn", 5000);
      }
    }
  });
  window.addEventListener("blur", () => {
    clearTimeout(blurTimer);
    // Un blur corto puede ser una notificación del sistema: esperamos 2 s.
    blurTimer = setTimeout(() => {
      if (!document.hasFocus()) send("cambio_de_ventana", "", mode === "examen");
    }, 2000);
  });
  window.addEventListener("focus", () => clearTimeout(blurTimer));
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && mode === "examen") send("salio_de_pantalla_completa", "", true);
  });

  // Inactividad.
  for (const ev of ["mousemove", "keydown", "mousedown", "touchstart", "scroll", "wheel"]) {
    window.addEventListener(ev, activity, { passive: true, capture: true });
  }
  setInterval(checkIdle, 5000);

  paintWatermark();
  setInterval(paintWatermark, 60000);
  document.getElementById("moire").hidden = !CFG.MOIRE;
}

function activity() {
  lastActivity = Date.now();
  if (idleReported) {
    send("volvio_de_inactividad", "");
  }
  idleWarned = false;
  idleReported = false;
  if (idleModal) { idleModal.close(); idleModal = null; }
}

function checkIdle() {
  const secs = (Date.now() - lastActivity) / 1000;
  if (!idleWarned && secs >= CFG.IDLE_WARN_SEC) {
    idleWarned = true;
    idleModal = modal({
      title: "¿Sigues ahí? 👀",
      body: h("p", {}, "Llevas un rato sin moverte. Si no vuelves pronto, tu profe recibirá un aviso de inactividad."),
      actions: [{ label: "¡Aquí estoy! 🙋", kind: "primary" }],
    });
  }
  if (!idleReported && secs >= CFG.IDLE_REPORT_SEC) {
    idleReported = true;
    send("inactividad", `${Math.round(secs / 60)} min sin actividad`);
  }
}

function flashHide(tipo) {
  send(tipo, "tecla Imprimir pantalla", false);
  document.body.classList.add("blackout");
  setTimeout(() => document.body.classList.remove("blackout"), 1500);
}

// Marca de agua con nombre, correo y hora: cualquier foto queda identificada.
function paintWatermark() {
  if (!user) return;
  const c = document.createElement("canvas");
  c.width = 420;
  c.height = 220;
  const ctx = c.getContext("2d");
  ctx.translate(210, 110);
  ctx.rotate(-0.4);
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(60, 40, 120, 1)";
  ctx.font = "600 15px Nunito, sans-serif";
  ctx.fillText(user.name, 0, -10);
  ctx.font = "13px Nunito, sans-serif";
  ctx.fillText(user.email, 0, 10);
  ctx.fillText(new Date().toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" }), 0, 28);
  document.getElementById("watermark").style.backgroundImage = `url(${c.toDataURL()})`;
}

export async function enterFullscreen() {
  try {
    await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    return true;
  } catch {
    return false;
  }
}
export function exitFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

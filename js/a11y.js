// Ayudas de accesibilidad (DUA): tamaño de letra, letra fácil de leer, alto contraste,
// modo calmado (sin movimiento) y lectura en voz alta. Las preferencias se recuerdan en este navegador.
import { h } from "./util.js";

const KEY = "py9-a11y";
const DEFAULTS = { size: 1, easy: false, contrast: false, calm: false };
let prefs = { ...DEFAULTS };

function load() {
  try { prefs = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { prefs = { ...DEFAULTS }; }
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch {}
}

function apply() {
  const root = document.documentElement;
  root.style.setProperty("--fs", String(prefs.size));
  root.classList.toggle("a11y-easy", prefs.easy);
  root.classList.toggle("a11y-contrast", prefs.contrast);
  root.classList.toggle("a11y-calm", prefs.calm);
}

// ---------------- Lectura en voz alta ----------------
export const canSpeak = () => "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
let speakingBtn = null;

export function stopSpeaking() {
  if (canSpeak()) speechSynthesis.cancel();
  if (speakingBtn) { speakingBtn.classList.remove("speaking"); speakingBtn.textContent = "🔊 Escuchar"; speakingBtn = null; }
}

function pickVoice() {
  const voices = speechSynthesis.getVoices();
  return voices.find((v) => /^es[-_](CO|MX|US|419)/i.test(v.lang)) || voices.find((v) => /^es/i.test(v.lang)) || null;
}

export function speak(text, btn) {
  if (!canSpeak()) return;
  const wasThis = speakingBtn === btn && btn;
  stopSpeaking();
  if (wasThis) return; // segundo clic = detener
  const u = new SpeechSynthesisUtterance(String(text).replace(/\s+/g, " ").trim());
  const v = pickVoice();
  if (v) u.voice = v;
  u.lang = v?.lang || "es-ES";
  u.rate = 0.92;
  u.onend = u.onerror = () => { if (speakingBtn === btn) stopSpeaking(); };
  if (btn) { speakingBtn = btn; btn.classList.add("speaking"); btn.textContent = "⏹️ Detener"; }
  speechSynthesis.speak(u);
}

// Botón "🔊 Escuchar" que lee lo que devuelva getText() (se evalúa al hacer clic).
export function listenButton(getText) {
  if (!canSpeak()) return null;
  const btn = h("button", { class: "btn ghost listen", type: "button", "aria-label": "Escuchar en voz alta" }, "🔊 Escuchar");
  btn.addEventListener("click", () => speak(getText(), btn));
  return btn;
}

export const plainText = (html) => {
  const d = document.createElement("div");
  d.innerHTML = String(html || "");
  return d.textContent.replace(/\s+/g, " ").trim();
};

// ---------------- Panel flotante "Ayudas" ----------------
export function initA11y() {
  load();
  apply();
  if (document.getElementById("a11y-root")) return;
  const root = h("div", { id: "a11y-root" });
  document.body.append(root);

  let open = false;
  const render = () => {
    const opt = (label, key, extra) => h("label", { class: "a11y-opt" },
      h("input", { type: "checkbox", checked: prefs[key], onchange: (e) => { prefs[key] = e.target.checked; persist(); apply(); } }),
      h("span", {}, label), extra);
    const size = (label, v, title) => h("button", { type: "button", class: `btn ${prefs.size === v ? "primary" : "ghost"} a11y-size`, title, "aria-pressed": String(prefs.size === v), onclick: () => { prefs.size = v; persist(); apply(); render(); } }, label);
    root.replaceChildren(
      open && h("div", { class: "a11y-panel", role: "dialog", "aria-label": "Ayudas para leer y trabajar mejor" },
        h("h3", {}, "♿ Ayudas para ti"),
        h("div", { class: "a11y-sizes" }, h("span", {}, "Tamaño de letra"), size("A", 1, "Normal"), size("A+", 1.15, "Grande"), size("A++", 1.3, "Muy grande")),
        opt("Letra fácil de leer", "easy"),
        opt("Más contraste", "contrast"),
        opt("Modo calmado (sin movimiento)", "calm"),
        canSpeak() ? h("p", { class: "muted a11y-tip" }, "🔊 En cada ejercicio y en cada ficha hay un botón \"Escuchar\".") : h("p", { class: "muted a11y-tip" }, "Tu navegador no puede leer en voz alta."),
        h("button", { class: "btn ghost", type: "button", onclick: () => { prefs = { ...DEFAULTS }; persist(); apply(); render(); } }, "Volver a lo normal")),
      h("button", { class: "a11y-fab", type: "button", "aria-expanded": String(open), "aria-label": "Ayudas de accesibilidad", title: "Ayudas para leer y trabajar mejor", onclick: () => { open = !open; render(); } }, open ? "✖" : "♿"));
  };
  render();
  if (canSpeak()) speechSynthesis.getVoices(); // algunos navegadores cargan las voces de forma diferida
}

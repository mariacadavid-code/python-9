// Honti, el perro del colegio. Acompaña al estudiante, lo orienta en los ejercicios y es la voz de la práctica con IA.
// Usa la ilustración de Honti; el ánimo se muestra con una pequeña marca junto a él y con saltitos.
import { h } from "./util.js";

const MOOD = { cheer: "✨", think: "❓", hug: "💛", hi: "" };

// buddy(texto, ánimo, { body: true }) devuelve Honti con su globo de texto.
// Con body = true aparece de cuerpo entero (inicio); si no, solo la cabeza (ejercicios y chat).
export function buddy(text, mood = "hi", opts = {}) {
  const img = h("img", { src: opts.body ? "img/honti.png" : "img/honti-cabeza.png", alt: "Honti, el perro del colegio", draggable: "false" });
  const badge = h("span", { class: "mood-badge", "aria-hidden": "true" });
  const mascot = h("div", { class: `mascot ${opts.body ? "is-body" : ""}` }, img, badge);
  const bubble = h("div", { class: "bubble", "aria-live": "polite" }, text);
  const el = h("div", { class: `buddy ${opts.body ? "is-body" : ""}` }, mascot, bubble);
  const paint = (m) => { badge.textContent = MOOD[m] || ""; badge.hidden = !MOOD[m]; };
  paint(mood);
  return {
    el,
    say(msg, m = "hi", jump = false) {
      bubble.textContent = msg;
      paint(m);
      if (jump) { el.classList.remove("jump"); void el.offsetWidth; el.classList.add("jump"); }
    },
  };
}

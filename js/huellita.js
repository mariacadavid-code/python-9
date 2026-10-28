// Huellita: la compañera de estudio. Una huella lima con ojos que cambia de ánimo y acompaña al estudiante.
import { h } from "./util.js";

export function mascotSVG(mood = "hi") {
  let eyes, mouth, extra = "";
  if (mood === "cheer") {
    eyes = '<path d="M38 66q8-10 16 0M66 66q8-10 16 0" fill="none" stroke="#344151" stroke-width="5" stroke-linecap="round"/>';
    mouth = '<path d="M44 80q16 22 32 0z" fill="#344151" stroke="#344151" stroke-width="4" stroke-linejoin="round"/><path d="M52 88q8 6 16 0" fill="#ff9aa8" stroke="none"/>';
    extra = '<g stroke="#26588A" stroke-width="4" stroke-linecap="round"><path d="M14 20l8 8M104 20l-8 8M60 2v10"/></g>';
  } else if (mood === "think") {
    eyes = '<circle cx="46" cy="64" r="6" fill="#344151"/><circle cx="74" cy="64" r="6" fill="#344151"/><circle cx="48" cy="61" r="2" fill="#fff"/><circle cx="76" cy="61" r="2" fill="#fff"/>';
    mouth = '<path d="M50 86h20" fill="none" stroke="#344151" stroke-width="5" stroke-linecap="round"/>';
    extra = '<path d="M84 44q6-8 14-4" fill="none" stroke="#344151" stroke-width="4" stroke-linecap="round"/>';
  } else if (mood === "hug") {
    eyes = '<path d="M40 68q6 8 12 0M68 68q6 8 12 0" fill="none" stroke="#344151" stroke-width="5" stroke-linecap="round"/>';
    mouth = '<path d="M48 84q12 10 24 0" fill="none" stroke="#344151" stroke-width="5" stroke-linecap="round"/>';
  } else {
    eyes = '<circle cx="46" cy="66" r="6" fill="#344151"/><circle cx="74" cy="66" r="6" fill="#344151"/><circle cx="48" cy="63" r="2" fill="#fff"/><circle cx="76" cy="63" r="2" fill="#fff"/>';
    mouth = '<path d="M46 82q14 14 28 0" fill="none" stroke="#344151" stroke-width="5" stroke-linecap="round"/>';
  }
  return '<svg viewBox="0 0 120 120" role="img" aria-label="Huellita, tu compañera de estudio">' +
    '<path d="M60 8c28 0 50 20 50 50 0 32-20 54-50 54S10 92 10 58C10 28 32 8 60 8z" fill="#CCEF3A"/>' +
    '<g fill="none" stroke="#26588A" stroke-width="4.5" stroke-linecap="round"><path d="M36 36c6-8 14-12 24-12s18 4 24 12"/><path d="M28 48c8-14 18-20 32-20s24 6 32 20" opacity=".55"/></g>' +
    '<circle cx="34" cy="82" r="7" fill="#26588A" opacity=".16"/><circle cx="86" cy="82" r="7" fill="#26588A" opacity=".16"/>' + eyes + mouth + extra + "</svg>";
}

// Huellita con su globo de texto. say() cambia el mensaje y el ánimo; con jump = true da un saltito.
export function buddy(text, mood = "hi") {
  const mascot = h("div", { class: "mascot" });
  const bubble = h("div", { class: "bubble", "aria-live": "polite" }, text);
  const el = h("div", { class: "buddy" }, mascot, bubble);
  const paint = (m) => { mascot.innerHTML = mascotSVG(m); };
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

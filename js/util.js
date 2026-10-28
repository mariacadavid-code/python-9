// Utilidades compartidas: DOM, azar con semilla, resaltado de Python, salidas.

export const CFG = window.APP_CONFIG;

// --- DOM -------------------------------------------------------------------
export function h(tag, attrs, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2), v);
    else if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k === "style" && typeof v === "object") Object.assign(e.style, v);
    else e.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    e.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return e;
}

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function toast(msg, kind = "info", ms = 3500) {
  const root = document.getElementById("toasts");
  const t = h("div", { class: `toast ${kind}` }, msg);
  root.append(t);
  setTimeout(() => t.classList.add("out"), ms);
  setTimeout(() => t.remove(), ms + 400);
}

export function modal({ title, body, actions = [], dismissable = true }) {
  const root = document.getElementById("modal-root");
  const close = () => wrap.remove();
  const wrap = h("div", { class: "modal-wrap" },
    h("div", { class: "modal", role: "dialog", "aria-modal": "true" },
      title && h("h2", {}, title),
      h("div", { class: "modal-body" }, body),
      h("div", { class: "modal-actions" },
        actions.map((a) => h("button", { class: `btn ${a.kind || ""}`, onclick: () => { if (a.onclick?.() !== false) close(); } }, a.label)))));
  if (dismissable) wrap.addEventListener("click", (e) => { if (e.target === wrap) close(); });
  root.append(wrap);
  return { close, el: wrap };
}

// --- Azar reproducible ------------------------------------------------------
// La misma semilla da siempre la misma variante: cada estudiante tiene las suyas.
export function seedFrom(...parts) {
  let h1 = 2166136261;
  for (const ch of parts.join("|")) {
    h1 ^= ch.codePointAt(0);
    h1 = Math.imul(h1, 16777619);
  }
  return h1 >>> 0;
}

export function rng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const shuffle = (arr) => {
    const b = [...arr];
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    shuffle,
    sample: (arr, n) => shuffle(arr).slice(0, n),
  };
}

// --- Salidas de programas -----------------------------------------------------
export function normOut(s) {
  return String(s ?? "")
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n+$/, "")
    .replace(/^\n+/, "");
}

const ERR_ES = {
  SyntaxError: "Error de escritura: Python no entiende cómo está escrita esa línea. Revisa comillas, paréntesis y dos puntos.",
  IndentationError: "Error de sangría: revisa los espacios al inicio de la línea.",
  NameError: "Python no conoce ese nombre. ¿Lo escribiste igual (mayúsculas y minúsculas)? ¿Lo creaste antes de usarlo?",
  TypeError: "Estás mezclando tipos que no combinan, por ejemplo texto + número.",
  ValueError: "Ese valor no sirve para esa operación, por ejemplo int(\"hola\").",
  ZeroDivisionError: "¡No se puede dividir entre cero!",
  EOFError: "El programa pidió más datos con input() de los que había.",
  IndexError: "Estás pidiendo una posición que no existe.",
  KeyError: "Esa clave no existe en el diccionario.",
  AttributeError: "Ese tipo de dato no tiene ese método.",
  Timeout: "Tu programa tardó demasiado. ¿Hay un bucle que nunca termina?",
};

export function friendlyError(err) {
  if (!err) return "";
  const where = err.line ? ` (línea ${err.line})` : "";
  const tip = ERR_ES[err.type] || "Algo salió mal al ejecutar el programa.";
  return `❌ ${err.type}${where}: ${tip}\n   Detalle de Python: ${err.msg}`;
}

// --- Resaltado de Python ------------------------------------------------------
const KW = new Set("False None True and as assert break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield".split(" "));
const BI = new Set("print input int float str bool type len range list dict set tuple round abs min max sum sorted".split(" "));

export function highlight(code) {
  const re = /(#[^\n]*)|([fF]?(?:"(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?))|(\b\d+(?:\.\d+)?\b)|([A-Za-z_À-ɏ]\w*)|([\s\S])/g;
  let out = "";
  let m;
  while ((m = re.exec(code))) {
    const [t, com, str, num, id] = m;
    if (com) out += `<span class="tk-com">${esc(t)}</span>`;
    else if (str) out += `<span class="tk-str">${esc(t)}</span>`;
    else if (num) out += `<span class="tk-num">${esc(t)}</span>`;
    else if (id) {
      if (KW.has(t)) out += `<span class="tk-kw">${t}</span>`;
      else if (BI.has(t)) out += `<span class="tk-bi">${t}</span>`;
      else out += esc(t);
    } else out += esc(t);
  }
  return out;
}

export function codeBlock(code) {
  return h("pre", { class: "code nosel", html: highlight(code) });
}

// Lee el contenido de un token de Google (JWT) sin verificarlo: la verificación real la hace Apps Script.
export function decodeJwt(token) {
  const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(atob(part).split("").map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join(""));
  return JSON.parse(json);
}

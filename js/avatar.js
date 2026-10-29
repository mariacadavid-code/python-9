// Avatares y medallas. El avatar es la cabeza de Honti, el perro del colegio, que el estudiante personaliza con fondos y accesorios que se desbloquean por rango.
// También arma la tarjeta de rango (una imagen) para compartir con amigos: solo muestra apodo, rango y medallas.
import { S, BADGES, PRACTICE_RANKS, practiceRank } from "./state.js";

// ----------------------------- Piezas del avatar ----------------------------------------------------
export const COLORS = [
  { id: "lima", name: "Lima", body: "#CCEF3A", ink: "#344151", arcs: "#26588A", rank: 1 },
  { id: "blanco", name: "Blanco", body: "#FFFFFF", ink: "#344151", arcs: "#26588A", rank: 1, edge: "#344151" },
  { id: "azul", name: "Azul", body: "#26588A", ink: "#FFFFFF", arcs: "#CCEF3A", rank: 2 },
  { id: "pizarra", name: "Pizarra", body: "#344151", ink: "#FFFFFF", arcs: "#CCEF3A", rank: 3 },
];
export const ACCESSORIES = [
  { id: "ninguno", name: "Nada", rank: 1 },
  { id: "gafas", name: "Gafas", rank: 1 },
  { id: "audifonos", name: "Audífonos", rank: 2 },
  { id: "bufanda", name: "Bufanda", rank: 3 },
  { id: "corona", name: "Corona", rank: 5 },
];

export const defaultAvatar = () => ({ color: "lima", acc: "ninguno", nick: "", pins: [] });

export function avatarState() {
  const st = S.state;
  st.avatar = { ...defaultAvatar(), ...(st.avatar || {}) };
  if (!ACCESSORIES.some((a) => a.id === st.avatar.acc)) st.avatar.acc = "ninguno";
  return st.avatar;
}

const pick = (list, id) => list.find((x) => x.id === id) || list[0];

// Rango de práctica más alto que alcanzó el estudiante (decide qué piezas tiene desbloqueadas).
export function maxRank() {
  const a = S.state.ai || {};
  return Math.max(1, a.max || 0, a.level || 1);
}
export const isUnlocked = (part) => S.isTeacher || maxRank() >= part.rank;

// Para dibujar el avatar dentro de una imagen (tarjeta de rango) la ilustración va incrustada.
let headData = null;
export async function ensureHeadData() {
  if (headData) return headData;
  const blob = await (await fetch("img/honti-cabeza.png")).blob();
  headData = await new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(blob); });
  return headData;
}

let uid = 0;
export function avatarSVG(av = avatarState(), size = 120, opts = {}) {
  const c = pick(COLORS, av.color);
  const id = "av" + ++uid;
  const href = opts.inline && headData ? headData : "img/honti-cabeza.png";
  let acc = "";
  if (av.acc === "gafas") acc = '<g fill="rgba(255,255,255,.18)" stroke="#344151" stroke-width="4"><circle cx="86" cy="114" r="14"/><circle cx="131" cy="110" r="14"/><path d="M100 113q8-5 17-3" fill="none"/></g>';
  else if (av.acc === "audifonos") acc = '<path d="M42 96C38 14 160 6 156 84" fill="none" stroke="#CCEF3A" stroke-width="6" stroke-linecap="round"/><circle cx="42" cy="104" r="13" fill="#26588A" stroke="#CCEF3A" stroke-width="4"/><circle cx="156" cy="92" r="13" fill="#26588A" stroke="#CCEF3A" stroke-width="4"/>';
  else if (av.acc === "bufanda") acc = '<path d="M46 168q54 26 110-2l-4 16q-52 24-104 2z" fill="#CCEF3A" stroke="#344151" stroke-width="3" stroke-linejoin="round"/><path d="M128 178l6 22 14-4-6-22z" fill="#CCEF3A" stroke="#344151" stroke-width="3" stroke-linejoin="round"/>';
  else if (av.acc === "corona") acc = '<path d="M70 48L74 20l13 14 12-20 12 20 13-14 4 28z" fill="#CCEF3A" stroke="#344151" stroke-width="3" stroke-linejoin="round"/>';
  const edge = c.edge ? ` stroke="${c.edge}" stroke-width="3"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 200 200" width="${size}" height="${size}" role="img" aria-label="Tu avatar: Honti">` +
    `<defs><clipPath id="${id}"><circle cx="100" cy="100" r="95"/></clipPath></defs>` +
    `<circle cx="100" cy="100" r="96" fill="${c.body}"${edge}/>` +
    `<g clip-path="url(#${id})"><image href="${href}" xlink:href="${href}" x="20" y="38" width="160" height="160"/></g>` +
    acc + `</svg>`;
}

// ----------------------------- Medallas -----------------------------------------------------------------
// Medalla de rango: círculo lima con tantas ondas como el nivel. Las insignias usan su emoji.
export function rankMedalSVG(level, size = 64, on = true) {
  const waves = Array.from({ length: level }, (_, i) => `<path d="M26 ${60 - (level - 1) * 5 + i * 10}q6-7 12 0t12 0t12 0" fill="none" stroke="#26588A" stroke-width="4" stroke-linecap="round"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="Medalla ${practiceRank(level).name}"${on ? "" : ' style="filter:grayscale(1);opacity:.4"'}>` +
    `<circle cx="50" cy="50" r="46" fill="#CCEF3A" stroke="#344151" stroke-width="3"/><circle cx="50" cy="50" r="38" fill="none" stroke="#26588A" stroke-width="2" stroke-dasharray="3 5"/>${waves}</svg>`;
}

// Todas las medallas ganadas: una por cada rango alcanzado y una por cada insignia.
export function earnedMedals() {
  const list = [];
  for (let n = 1; n <= maxRank() && n <= PRACTICE_RANKS.length; n++) {
    if ((S.state.ai && (S.state.ai.max || S.state.ai.placed)) || n === 1) list.push({ id: "rank-" + n, kind: "rank", level: n, name: "Rango " + practiceRank(n).name, desc: `Llegaste al nivel ${n} de práctica` });
  }
  for (const id of S.state.badges || []) if (BADGES[id]) list.push({ id, kind: "badge", emoji: BADGES[id].emoji, name: BADGES[id].name, desc: BADGES[id].desc });
  return list;
}

export function medalHTML(m, size = 56) {
  if (m.kind === "rank") return rankMedalSVG(m.level, size);
  return `<span class="medal-emoji" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.5)}px">${m.emoji}</span>`;
}

// ----------------------------- Tarjeta para compartir ----------------------------------------------------
function loadImg(src) {
  return new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = src; });
}
const svgUrl = (svg) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// Imagen 1080x1080 con el avatar, el apodo, el rango y las medallas destacadas. No incluye correo ni nombre completo.
export async function buildShareCard() {
  const av = avatarState();
  const a = S.state.ai || {};
  const rank = practiceRank(a.level || 1);
  const nick = (av.nick || (S.user?.name || "").split(" ")[0] || "Programador").slice(0, 16);
  const medals = earnedMedals();
  const pins = (av.pins || []).map((id) => medals.find((m) => m.id === id)).filter(Boolean).slice(0, 3);
  try { await Promise.all([document.fonts.load("800 56px Montserrat"), document.fonts.load("600 30px Montserrat"), ensureHeadData()]); } catch {}

  const c = document.createElement("canvas");
  c.width = 1080; c.height = 1080;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#26588A"; ctx.fillRect(0, 0, 1080, 1080);
  // línea lima que fluye, como en el sistema gráfico de la marca
  ctx.strokeStyle = "#CCEF3A"; ctx.lineWidth = 22; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(40, 1040); ctx.bezierCurveTo(200, 1000, 260, 1070, 420, 1040); ctx.bezierCurveTo(580, 1010, 640, 1070, 800, 1040); ctx.bezierCurveTo(900, 1020, 980, 1040, 1050, 1015); ctx.stroke();
  ctx.fillStyle = "#F4F4F4"; rr(ctx, 90, 60, 900, 880, 56); ctx.fill();

  const [logo, avatarImg] = await Promise.all([loadImg("img/logo-ser-school.png"), loadImg(svgUrl(avatarSVG(av, 440, { inline: true })))]);
  const lw = 300, lh = lw * (logo.height / logo.width);
  ctx.drawImage(logo, 540 - lw / 2, 80, lw, lh);
  ctx.drawImage(avatarImg, 540 - 170, 80 + lh + 4, 340, 340);

  ctx.textAlign = "center"; ctx.fillStyle = "#344151";
  ctx.font = "800 64px Montserrat, sans-serif";
  const ny = 80 + lh + 4 + 340 + 64;
  ctx.fillText(nick, 540, ny);
  ctx.font = "800 38px Montserrat, sans-serif"; ctx.fillStyle = "#26588A";
  ctx.fillText(`Rango ${rank.name} · nivel ${rank.level}`, 540, ny + 54);
  ctx.font = "600 26px Montserrat, sans-serif"; ctx.fillStyle = "#667487";
  ctx.fillText("Python · Grado 9° · Ser School", 540, ny + 96);

  // medallas destacadas
  const items = pins.length ? pins : medals.slice(-3);
  const gap = 110, startX = 540 - ((items.length - 1) * gap) / 2;
  for (let i = 0; i < items.length; i++) {
    const m = items[i], x = startX + i * gap, y = ny + 160;
    if (m.kind === "rank") ctx.drawImage(await loadImg(svgUrl(rankMedalSVG(m.level, 96))), x - 48, y - 48, 96, 96);
    else {
      ctx.fillStyle = "#CCEF3A"; ctx.strokeStyle = "#344151"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, 46, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.font = "44px sans-serif"; ctx.fillStyle = "#344151"; ctx.fillText(m.emoji, x, y + 16);
    }
  }
  ctx.fillStyle = "#CCEF3A"; ctx.font = "800 44px Montserrat, sans-serif"; ctx.textAlign = "center";
  ctx.fillText("#DejaTuHuella", 540, 990);
  return new Promise((resolve) => c.toBlob((b) => resolve({ blob: b, nick, rank }), "image/png"));
}

export const shareText = (nick, rank) => `Soy ${rank.name} en Python con Ser School. ¡Deja tu #huella en el código! (${nick})`;

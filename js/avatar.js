// Avatares y medallas. El avatar es una Huellita que el estudiante personaliza con piezas que se desbloquean por rango.
// También arma la tarjeta de rango (una imagen) para compartir con amigos: solo muestra apodo, rango y medallas.
import { S, BADGES, PRACTICE_RANKS, practiceRank } from "./state.js";

// ----------------------------- Piezas del avatar ----------------------------------------------------
export const COLORS = [
  { id: "lima", name: "Lima", body: "#CCEF3A", ink: "#344151", arcs: "#26588A", rank: 1 },
  { id: "blanco", name: "Blanco", body: "#FFFFFF", ink: "#344151", arcs: "#26588A", rank: 1, edge: "#344151" },
  { id: "azul", name: "Azul", body: "#26588A", ink: "#FFFFFF", arcs: "#CCEF3A", rank: 2 },
  { id: "pizarra", name: "Pizarra", body: "#344151", ink: "#FFFFFF", arcs: "#CCEF3A", rank: 3 },
];
export const FACES = [
  { id: "sonrisa", name: "Sonrisa", rank: 1 },
  { id: "feliz", name: "Feliz", rank: 1 },
  { id: "guino", name: "Guiño", rank: 2 },
  { id: "calma", name: "Calma", rank: 1 },
];
export const ACCESSORIES = [
  { id: "ninguno", name: "Nada", rank: 1 },
  { id: "gafas", name: "Gafas", rank: 1 },
  { id: "audifonos", name: "Audífonos", rank: 2 },
  { id: "gorra", name: "Gorra", rank: 3 },
  { id: "corona", name: "Corona", rank: 5 },
];

export const defaultAvatar = () => ({ color: "lima", face: "sonrisa", acc: "ninguno", nick: "", pins: [] });

export function avatarState() {
  const st = S.state;
  st.avatar = { ...defaultAvatar(), ...(st.avatar || {}) };
  return st.avatar;
}

const pick = (list, id) => list.find((x) => x.id === id) || list[0];

// Rango de práctica más alto que alcanzó el estudiante (decide qué piezas tiene desbloqueadas).
export function maxRank() {
  const a = S.state.ai || {};
  return Math.max(1, a.max || 0, a.level || 1);
}
export const isUnlocked = (part) => S.isTeacher || maxRank() >= part.rank;

export function avatarSVG(av = avatarState(), size = 120) {
  const c = pick(COLORS, av.color);
  const ink = c.ink;
  let eyes, mouth;
  const dot = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="6" fill="${ink}"/><circle cx="${cx + 2}" cy="${cy - 3}" r="2" fill="${c.body}"/>`;
  if (av.face === "feliz") {
    eyes = `<path d="M38 66q8-10 16 0M66 66q8-10 16 0" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>`;
    mouth = `<path d="M44 80q16 22 32 0z" fill="${ink}" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>`;
  } else if (av.face === "guino") {
    eyes = `${dot(46, 66)}<path d="M66 68q8-8 16 0" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>`;
    mouth = `<path d="M46 82q14 14 28 0" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>`;
  } else if (av.face === "calma") {
    eyes = `${dot(46, 66)}${dot(74, 66)}`;
    mouth = `<path d="M50 86h20" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>`;
  } else {
    eyes = `${dot(46, 66)}${dot(74, 66)}`;
    mouth = `<path d="M46 82q14 14 28 0" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>`;
  }
  let acc = "";
  if (av.acc === "gafas") acc = `<g fill="none" stroke="${ink}" stroke-width="4"><circle cx="46" cy="66" r="12"/><circle cx="74" cy="66" r="12"/><path d="M58 66h4"/></g>`;
  else if (av.acc === "audifonos") acc = `<g fill="none" stroke="#CCEF3A" stroke-width="6" stroke-linecap="round"><path d="M16 62C14 10 106 10 104 62"/></g><rect x="6" y="56" width="16" height="28" rx="8" fill="#26588A" stroke="#CCEF3A" stroke-width="3"/><rect x="98" y="56" width="16" height="28" rx="8" fill="#26588A" stroke="#CCEF3A" stroke-width="3"/>`;
  else if (av.acc === "gorra") acc = `<path d="M20 42C24 12 96 12 100 42z" fill="#26588A" stroke="#344151" stroke-width="3" stroke-linejoin="round"/><path d="M58 40h44q8 0 8 8H58z" fill="#CCEF3A" stroke="#344151" stroke-width="3" stroke-linejoin="round"/>`;
  else if (av.acc === "corona") acc = `<path d="M34 24l8-16 12 12 6-14 6 14 12-12 8 16z" fill="#CCEF3A" stroke="#344151" stroke-width="3" stroke-linejoin="round"/>`;
  const edge = c.edge ? ` stroke="${c.edge}" stroke-width="3"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="Tu avatar">` +
    `<path d="M60 8c28 0 50 20 50 50 0 32-20 54-50 54S10 92 10 58C10 28 32 8 60 8z" fill="${c.body}"${edge}/>` +
    `<g fill="none" stroke="${c.arcs}" stroke-width="4.5" stroke-linecap="round"><path d="M36 36c6-8 14-12 24-12s18 4 24 12"/><path d="M28 48c8-14 18-20 32-20s24 6 32 20" opacity=".55"/></g>` +
    `<circle cx="34" cy="82" r="7" fill="${c.arcs}" opacity=".18"/><circle cx="86" cy="82" r="7" fill="${c.arcs}" opacity=".18"/>` +
    eyes + mouth + acc + `</svg>`;
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
  try { await Promise.all([document.fonts.load("800 56px Montserrat"), document.fonts.load("600 30px Montserrat")]); } catch {}

  const c = document.createElement("canvas");
  c.width = 1080; c.height = 1080;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#26588A"; ctx.fillRect(0, 0, 1080, 1080);
  // línea lima que fluye, como en el sistema gráfico de la marca
  ctx.strokeStyle = "#CCEF3A"; ctx.lineWidth = 22; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(40, 1040); ctx.bezierCurveTo(200, 1000, 260, 1070, 420, 1040); ctx.bezierCurveTo(580, 1010, 640, 1070, 800, 1040); ctx.bezierCurveTo(900, 1020, 980, 1040, 1050, 1015); ctx.stroke();
  ctx.fillStyle = "#F4F4F4"; rr(ctx, 90, 60, 900, 880, 56); ctx.fill();

  const [logo, avatarImg] = await Promise.all([loadImg("img/logo-ser-school.png"), loadImg(svgUrl(avatarSVG(av, 440)))]);
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

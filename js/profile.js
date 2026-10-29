// Mi perfil: avatar personalizable, medallas destacadas y tarjeta de rango para compartir con amigos.
import { h, modal, toast } from "./util.js";
import { S, save, practiceRank, PRACTICE_RANKS } from "./state.js";
import { avatarSVG, avatarState, COLORS, FACES, ACCESSORIES, isUnlocked, earnedMedals, medalHTML, buildShareCard, shareText } from "./avatar.js";
import { CFG } from "./util.js";

const NICK_RE = /^[\p{L}\p{N} ._-]{2,16}$/u;

export function viewProfile(mount) {
  const av = avatarState();
  const a = S.state.ai || {};
  const rank = practiceRank(a.level || 1);
  const medals = earnedMedals();

  const preview = h("div", { class: "pf-avatar" });
  const paint = () => { preview.innerHTML = avatarSVG(av, 220); };
  paint();

  const firstName = (S.user?.name || "").split(" ")[0] || "";
  const nick = h("input", { class: "text-input", maxlength: "16", value: av.nick || "", placeholder: firstName || "Tu apodo", "aria-label": "Tu apodo" });
  const saveNick = () => {
    const v = nick.value.trim();
    if (v && !NICK_RE.test(v)) { toast("Usa entre 2 y 16 letras, números o espacios.", "warn"); return; }
    av.nick = v;
    save();
    toast(v ? "Apodo guardado" : "Usaremos tu nombre", "win", 1800);
  };
  nick.addEventListener("change", saveNick);

  const group = (title, list, key) => h("div", { class: "pf-group" },
    h("p", { class: "eyebrow" }, title),
    h("div", { class: "pf-opts" }, list.map((o) => {
      const open = isUnlocked(o);
      const on = av[key] === o.id;
      return h("button", {
        class: `pf-opt ${on ? "on" : ""} ${open ? "" : "locked"}`, type: "button", disabled: !open,
        title: open ? o.name : `Se desbloquea con el rango ${practiceRank(o.rank).name}`,
        "aria-pressed": String(on),
        onclick: () => { av[key] = o.id; save(); paint(); viewProfile(mount); },
      }, key === "color" ? h("span", { class: "sw", style: { background: o.body, borderColor: o.edge || "transparent" } }) : null, o.name, open ? null : h("small", {}, ` 🔒 ${practiceRank(o.rank).name}`));
    })));

  const togglePin = (id) => {
    const i = av.pins.indexOf(id);
    if (i >= 0) av.pins.splice(i, 1);
    else if (av.pins.length >= 3) { toast("Puedes destacar hasta 3 medallas.", "warn"); return; }
    else av.pins.push(id);
    save();
    viewProfile(mount);
  };

  async function share(btn) {
    btn.disabled = true;
    btn.textContent = "Preparando tu tarjeta…";
    try {
      const { blob, nick: n, rank: r } = await buildShareCard();
      const url = URL.createObjectURL(blob);
      const file = new File([blob], "mi-rango-python.png", { type: "image/png" });
      const text = shareText(n, r);
      const canShare = !!(navigator.canShare && navigator.canShare({ files: [file] }));
      modal({
        title: "Tu tarjeta de rango",
        body: h("div", {},
          h("img", { src: url, alt: "Tu tarjeta de rango", style: { width: "100%", borderRadius: "16px", display: "block" } }),
          h("p", { class: "muted", style: { fontSize: "0.85rem" } }, "Solo muestra tu apodo, tu rango y tus medallas. No incluye tu correo ni tu nombre completo.")),
        actions: [
          { label: "Cerrar", kind: "ghost", onclick: () => { URL.revokeObjectURL(url); } },
          { label: "Copiar texto", kind: "ghost", onclick: async () => { try { await navigator.clipboard.writeText(text); toast("Texto copiado", "win", 1800); } catch { toast("No se pudo copiar el texto.", "warn"); } return false; } },
          { label: "Descargar", kind: canShare ? "ghost" : "primary", onclick: () => { const l = h("a", { href: url, download: "mi-rango-python.png" }); document.body.append(l); l.click(); l.remove(); return false; } },
          ...(canShare ? [{ label: "Compartir", kind: "primary", onclick: async () => { try { await navigator.share({ files: [file], text }); } catch {} return false; } }] : []),
        ],
      });
    } catch (e) {
      toast("No se pudo crear la tarjeta. Inténtalo otra vez.", "error");
    }
    btn.disabled = false;
    btn.textContent = "Compartir mi rango";
  }
  const shareBtn = h("button", { class: "btn primary big", onclick: (e) => share(e.currentTarget) }, "Compartir mi rango");

  mount(
    h("section", { class: "card pf-head" },
      preview,
      h("div", { class: "pf-info" },
        h("p", { class: "eyebrow" }, "Mi perfil"),
        h("h1", { style: { margin: "6px 0" } }, av.nick || firstName || "Mi avatar"),
        h("p", { class: "pf-rank" }, h("span", { class: "tagpill lime" }, `Rango ${rank.name} · nivel ${rank.level}`), h("span", { class: "tagpill" }, `${medals.length} medallas`), h("span", { class: "tagpill" }, `${S.state.xp} puntos`)),
        h("label", { class: "eyebrow", for: "nick" }, "Tu apodo (lo ven tus amigos y tu profe)"),
        h("div", { class: "row" }, nick),
        h("div", { class: "row" }, shareBtn))),
    h("section", { class: "card" },
      h("h2", {}, "Personaliza tu avatar"),
      h("p", { class: "muted" }, "Cada rango desbloquea piezas nuevas. ¡Sube de rango practicando con la IA!"),
      group("Color", COLORS, "color"),
      group("Cara", FACES, "face"),
      group("Accesorio", ACCESSORIES, "acc")),
    h("section", { class: "card" },
      h("h2", {}, "Mis medallas"),
      h("p", { class: "muted" }, "Toca una medalla para destacarla en tu tarjeta (hasta 3)."),
      h("div", { class: "pf-medals" }, medals.map((m) => h("button", {
        class: `pf-medal ${av.pins.includes(m.id) ? "pinned" : ""}`, type: "button", title: `${m.name}: ${m.desc}`, "aria-pressed": String(av.pins.includes(m.id)),
        onclick: () => togglePin(m.id),
      }, h("span", { html: medalHTML(m, 64) }), h("small", {}, m.name), av.pins.includes(m.id) ? h("b", { class: "pin" }, "★") : null)))),
    h("section", { class: "card" },
      h("h2", {}, "Los rangos"),
      h("ol", { class: "ranks" }, PRACTICE_RANKS.map((x) => h("li", { class: x.level === rank.level ? "current" : "" },
        `${x.name} · nivel ${x.level} · ${CFG.AI_XP[x.level - 1]} puntos por ejercicio`)))));
}

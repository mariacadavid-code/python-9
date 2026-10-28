// Motor de ejercicios: 5 modalidades (predecir, completar, ordenar, cazar bug, compilador).
// Cada ejercicio es una plantilla `gen(r)` que crea una variante distinta según la semilla.
import { h, rng, normOut, friendlyError, highlight, codeBlock } from "./util.js";
import { runPython } from "./py.js";

export const TYPE_INFO = {
  predict: { name: "Predice la salida", icon: "🔮", ask: "¿Qué imprime este programa? Escribe la salida exacta, línea por línea." },
  fill: { name: "Completa el hueco", icon: "🧩", ask: "Escribe lo que falta en el espacio para que el programa imprima la salida esperada." },
  parsons: { name: "Ordena las líneas", icon: "🧱", ask: "Ordena las líneas (arrastra o usa las flechas) para que el programa imprima la salida esperada." },
  bug: { name: "Caza el bug", icon: "🐛", ask: "Este programa tiene un error. Arréglalo en el editor para que imprima la salida esperada." },
  code: { name: "Compilador", icon: "💻", ask: "Escribe tu programa desde cero. Lo revisamos con pruebas automáticas." },
};

// Crea la variante y calcula la salida correcta ejecutando Python de verdad.
export async function prepare(ex, seed) {
  const data = ex.gen(rng(seed));
  const inst = { ex, data, seed };
  const stdin = data.stdin || [];
  if (ex.type === "predict") inst.expected = (await runPython(data.code, stdin)).out;
  if (ex.type === "fill") inst.expected = (await runPython(data.code.replace("___", data.answer), stdin)).out;
  if (ex.type === "parsons") inst.expected = (await runPython(data.lines.join("\n"), stdin)).out;
  if (ex.type === "bug") inst.expected = (await runPython(data.fixed, stdin)).out;
  if (ex.type === "code") {
    // Cada prueba puede ser una lista de datos para input() o { pre, stdin }: `pre` son líneas
    // que se ejecutan antes del código del estudiante (por ejemplo, valores distintos para sus variables).
    inst.tests = [];
    for (const t of data.tests || [stdin]) {
      const test = Array.isArray(t) ? { stdin: t, pre: "" } : { stdin: t.stdin || [], pre: t.pre ? t.pre + "\n" : "" };
      inst.tests.push({ ...test, expected: (await runPython(test.pre + data.solution, test.stdin)).out });
    }
  }
  return inst;
}

// Explicación que se muestra cuando se revela la respuesta (tras fallar 2 veces).
export function solutionText(inst) {
  const { ex, data } = inst;
  if (ex.type === "predict") return `La salida era:\n${inst.expected}`;
  if (ex.type === "fill") return `En el hueco iba: ${data.answer}`;
  if (ex.type === "parsons") return `El orden correcto era:\n${data.lines.join("\n")}`;
  if (ex.type === "bug") return `Una solución posible:\n${data.fixed}`;
  return `Una solución posible:\n${data.solution}`;
}

function expectedBox(text) {
  return h("div", { class: "expected" }, h("div", { class: "label" }, "🎯 Salida esperada"), h("pre", { class: "console nosel" }, text || "(nada)"));
}

function requiresOk(data, code) {
  for (const r of data.requires || []) if (!r.re.test(code)) return r.msg;
  return null;
}

// Devuelve { el, check(): Promise<{ok, msg, out}> }.
export function render(inst, { exam = false } = {}) {
  const { ex, data } = inst;
  const wrap = h("div", { class: `exercise type-${ex.type}` });
  if (data.prompt) wrap.append(h("p", { class: "prompt", html: data.prompt }));
  let check;

  if (ex.type === "predict") {
    const ta = h("textarea", { class: "answer", rows: Math.max(2, inst.expected.split("\n").length + 1), placeholder: "Escribe aquí la salida…", spellcheck: "false", autocomplete: "off" });
    wrap.append(codeBlock(data.code), h("label", { class: "label" }, "✍️ Tu respuesta"), ta);
    check = async () => {
      if (!ta.value.trim()) return { ok: false, msg: "Escribe tu respuesta primero 🙂" };
      return normOut(ta.value) === normOut(inst.expected)
        ? { ok: true }
        : { ok: false, msg: "No es esa la salida. Recorre el programa línea por línea, como si fueras Python 🤔" };
    };
    wrap.getAnswer = () => ta.value;
  }

  if (ex.type === "fill") {
    const [before, after] = data.code.split("___");
    const input = h("input", { class: "blank", size: Math.max(3, data.answer.length + 2), spellcheck: "false", autocomplete: "off", "aria-label": "hueco" });
    const pre = h("pre", { class: "code" });
    pre.append(h("span", { class: "nosel", html: highlight(before) }), input, h("span", { class: "nosel", html: highlight(after) }));
    wrap.append(pre, expectedBox(inst.expected));
    check = async () => {
      const v = input.value.trim();
      if (!v) return { ok: false, msg: "Escribe algo en el hueco 🙂" };
      if ((data.accept || [data.answer]).includes(v)) return { ok: true };
      const r = await runPython(data.code.replace("___", v), data.stdin || []);
      if (!r.err && normOut(r.out) === normOut(inst.expected)) return { ok: true };
      return { ok: false, msg: r.err ? "Con eso el programa da error:" : "Con eso el programa imprime otra cosa:", out: r.err ? friendlyError(r.err) : r.out };
    };
    wrap.getAnswer = () => input.value;
  }

  if (ex.type === "parsons") {
    const order = rng(inst.seed ^ 0x9e3779b9).shuffle(data.lines.map((l, i) => i));
    // Si quedó igual al orden correcto, lo rotamos.
    if (order.every((v, i) => v === i)) order.push(order.shift());
    const list = h("ol", { class: "parsons" });
    const renderList = () => {
      list.replaceChildren(...order.map((idx, pos) => {
        const li = h("li", { draggable: "true", class: "pline" },
          h("span", { class: "grip", "aria-hidden": "true" }, "⠿"),
          h("code", { class: "nosel", html: highlight(data.lines[idx]) }),
          h("span", { class: "arrows" },
            h("button", { class: "mini", title: "Subir", disabled: pos === 0, onclick: () => move(pos, pos - 1) }, "▲"),
            h("button", { class: "mini", title: "Bajar", disabled: pos === order.length - 1, onclick: () => move(pos, pos + 1) }, "▼")));
        li.addEventListener("dragstart", (e) => { e.stopPropagation(); e.dataTransfer.setData("text/x-pos", String(pos)); li.classList.add("dragging"); });
        li.addEventListener("dragend", () => li.classList.remove("dragging"));
        li.addEventListener("dragover", (e) => e.preventDefault());
        li.addEventListener("drop", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const from = Number(e.dataTransfer.getData("text/x-pos"));
          if (!Number.isNaN(from)) move(from, pos);
        });
        return li;
      }));
    };
    const move = (from, to) => {
      const [x] = order.splice(from, 1);
      order.splice(to, 0, x);
      renderList();
    };
    renderList();
    wrap.append(expectedBox(inst.expected), list);
    check = async () => {
      const code = order.map((i) => data.lines[i]).join("\n");
      const r = await runPython(code, data.stdin || []);
      if (!r.err && normOut(r.out) === normOut(inst.expected)) return { ok: true };
      return { ok: false, msg: r.err ? "En ese orden el programa da error:" : "En ese orden imprime:", out: r.err ? friendlyError(r.err) : r.out };
    };
    wrap.getAnswer = () => order.map((i) => data.lines[i]).join("\n");
  }

  if (ex.type === "bug" || ex.type === "code") {
    const ed = editor(ex.type === "bug" ? data.code : data.starter || "");
    const consoleEl = h("pre", { class: "console", hidden: true });
    const stdinBox = data.usesInput ? h("textarea", { class: "stdin", rows: 2, placeholder: "Datos de prueba para input(), uno por línea" }) : null;
    const runBtn = h("button", { class: "btn ghost", onclick: async () => {
      runBtn.disabled = true;
      runBtn.textContent = "⏳ Ejecutando…";
      const r = await runPython((ex.type === "code" ? inst.tests[0].pre : "") + ed.value, stdinBox ?stdinBox.value.split("\n").filter((x) => x !== "") : (data.stdin || []));
      consoleEl.hidden = false;
      consoleEl.textContent = (r.out || "") + (r.err ? (r.out ? "\n" : "") + friendlyError(r.err) : "");
      consoleEl.classList.toggle("has-error", !!r.err);
      runBtn.disabled = false;
      runBtn.textContent = "▶ Ejecutar";
    } }, "▶ Ejecutar");

    if (ex.type === "bug") wrap.append(expectedBox(inst.expected));
    if (ex.type === "code" && inst.tests.length === 1 && !data.usesInput) wrap.append(expectedBox(inst.tests[0].expected));
    wrap.append(ed.el);
    if (!exam) wrap.append(h("div", { class: "row" }, runBtn, stdinBox));
    wrap.append(consoleEl);

    check = async () => {
      const code = ed.value;
      if (!code.trim()) return { ok: false, msg: "El editor está vacío 🙂" };
      const missing = requiresOk(data, code);
      const tests = ex.type === "bug" ? [{ stdin: data.stdin || [], expected: inst.expected }] : inst.tests;
      for (const [i, t] of tests.entries()) {
        const pre = t.pre || "";
        const r = await runPython(pre + code, t.stdin);
        if (r.err?.line) r.err.line -= pre.split("\n").length - 1;
        if (r.err) return { ok: false, msg: "Tu programa da error:", out: friendlyError(r.err) };
        if (normOut(r.out) !== normOut(t.expected)) {
          const extra = tests.length > 1 ? ` (prueba ${i + 1} de ${tests.length}${t.pre ? ", con otros valores en las variables" : ""}${t.stdin.length ? `, con datos: ${t.stdin.join(", ")}` : ""})` : "";
          return { ok: false, msg: `La salida no coincide${extra}. Tu programa imprimió:`, out: r.out || "(nada)" };
        }
      }
      if (missing) return { ok: false, msg: `La salida está bien, pero falta algo: ${missing}` };
      return { ok: true };
    };
    wrap.getAnswer = () => ed.value;
  }

  return { el: wrap, check };
}

// Editor de código con resaltado, números de línea, Tab = 4 espacios y sangría automática.
export function editor(initial = "", { rows = 8 } = {}) {
  const ta = h("textarea", { class: "ed-input", spellcheck: "false", autocomplete: "off", autocapitalize: "off", wrap: "off" });
  ta.value = initial;
  const hl = h("pre", { class: "ed-hl", "aria-hidden": "true" });
  const gutter = h("div", { class: "ed-gutter", "aria-hidden": "true" });
  const el = h("div", { class: "editor" }, gutter, h("div", { class: "ed-area" }, hl, ta));
  el.style.setProperty("--rows", rows);
  const sync = () => {
    hl.innerHTML = highlight(ta.value) + "\n";
    const n = ta.value.split("\n").length;
    gutter.textContent = Array.from({ length: n }, (_, i) => i + 1).join("\n");
    hl.scrollTop = ta.scrollTop;
    hl.scrollLeft = ta.scrollLeft;
    gutter.scrollTop = ta.scrollTop;
  };
  const insert = (text) => {
    const { selectionStart: s, selectionEnd: e } = ta;
    ta.setRangeText(text, s, e, "end");
    sync();
  };
  ta.addEventListener("input", sync);
  ta.addEventListener("scroll", sync);
  ta.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        const s = ta.selectionStart;
        const lineStart = ta.value.lastIndexOf("\n", s - 1) + 1;
        const m = ta.value.slice(lineStart).match(/^ {1,4}/);
        if (m) { ta.setRangeText("", lineStart, lineStart + m[0].length, "end"); sync(); }
      } else insert("    ");
    } else if (e.key === "Enter") {
      e.preventDefault();
      const s = ta.selectionStart;
      const line = ta.value.slice(ta.value.lastIndexOf("\n", s - 1) + 1, s);
      let indent = line.match(/^\s*/)[0];
      if (/:\s*$/.test(line)) indent += "    ";
      insert("\n" + indent);
    }
  });
  sync();
  return { el, get value() { return ta.value; }, set value(v) { ta.value = v; sync(); }, focus: () => ta.focus() };
}

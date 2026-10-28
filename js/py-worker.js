// Ejecuta Python real (Pyodide) en un hilo aparte, para que un bucle infinito no congele la página.
importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");

const RUNNER = `
import sys, io, json, traceback

def __serschool_run(src, stdin_lines):
    out = io.StringIO()
    datos = iter(list(stdin_lines))

    def _input(prompt=""):
        out.write(str(prompt))
        try:
            return next(datos)
        except StopIteration:
            raise EOFError("no hay más datos de entrada")

    g = {"__name__": "__main__", "input": _input}
    viejo = sys.stdout
    sys.stdout = out
    err = None
    try:
        exec(compile(src, "<tu código>", "exec"), g)
    except SyntaxError as e:
        err = {"type": type(e).__name__, "msg": str(e.msg), "line": e.lineno}
    except BaseException as e:
        tb = traceback.extract_tb(e.__traceback__)
        linea = next((f.lineno for f in reversed(tb) if f.filename == "<tu código>"), None)
        err = {"type": type(e).__name__, "msg": str(e), "line": linea}
    finally:
        sys.stdout = viejo
    texto = out.getvalue()
    if len(texto) > 20000:
        texto = texto[:20000] + "\\n... (salida recortada)"
    return json.dumps({"out": texto, "err": err})
`;

let py = null;

(async () => {
  try {
    py = await loadPyodide();
    py.runPython(RUNNER);
    self.postMessage({ id: 0, ok: true });
  } catch (e) {
    self.postMessage({ id: 0, ok: false, error: String(e) });
  }
})();

self.onmessage = (e) => {
  const { id, code, stdin } = e.data;
  try {
    const fn = py.globals.get("__serschool_run");
    const res = fn(code, py.toPy(stdin || []));
    fn.destroy();
    self.postMessage({ id, ...JSON.parse(res) });
  } catch (err) {
    self.postMessage({ id, out: "", err: { type: "InternalError", msg: String(err), line: null } });
  }
};

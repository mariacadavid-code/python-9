// Cliente del worker de Python: cola de ejecuciones, límite de tiempo y reinicio.

let worker = null;
let ready = null;
let seq = 0;
const pending = new Map();
let chain = Promise.resolve();

function boot() {
  worker = new Worker(new URL("./py-worker.js", import.meta.url));
  ready = new Promise((resolve, reject) => pending.set(0, { resolve, reject }));
  worker.onmessage = (e) => {
    const { id, ...rest } = e.data;
    const p = pending.get(id);
    if (!p) return;
    pending.delete(id);
    if (id === 0 && !rest.ok) p.reject(new Error(rest.error));
    else p.resolve(rest);
  };
}

export function warmup() {
  if (!worker) boot();
  return ready;
}

function runOnce(code, stdin, timeoutMs) {
  return new Promise((resolve) => {
    const id = ++seq;
    const timer = setTimeout(() => {
      pending.delete(id);
      worker.terminate();
      worker = null;
      resolve({ out: "", err: { type: "Timeout", msg: `más de ${timeoutMs / 1000} segundos`, line: null } });
    }, timeoutMs);
    pending.set(id, { resolve: (r) => { clearTimeout(timer); resolve(r); } });
    worker.postMessage({ id, code, stdin });
  });
}

// Ejecuta código Python y devuelve { out, err }. Las ejecuciones van en fila, una a la vez.
export function runPython(code, stdin = [], timeoutMs = 5000) {
  const job = chain.then(async () => {
    await warmup();
    return runOnce(code, stdin, timeoutMs);
  });
  chain = job.catch(() => {});
  return job;
}

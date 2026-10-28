// Configuración general del micrositio. Este archivo es público (va en GitHub):
// aquí NO van contraseñas ni secretos.
window.APP_CONFIG = {
  // ID de cliente de Google (proyecto python-9-serschool). Es público.
  CLIENT_ID: "425270464630-pr81594b0hruguj1hi6f5g8u3ifupc5p.apps.googleusercontent.com",
  // Solo se aceptan cuentas de este dominio.
  DOMAIN: "serschool.edu.co",
  // URL del Web App de Apps Script (termina en /exec).
  // Vacío = MODO DEMO: el progreso se guarda solo en este navegador.
  API_URL: "https://script.google.com/macros/s/AKfycbxxJihO0-taVuqL-yCD3YTtW-GzXSVs4PCg5TLoR_5wzMJoV6juu0a-2-T7IitGg-sxFg/exec",
  // Correos con acceso al Panel docente.
  TEACHERS: ["mariacadavid@serschool.edu.co"],

  // Cada cuántos ejercicios resueltos aparece un examen (checkpoint).
  CHECKPOINT_EVERY: 12,
  EXAM_QUESTIONS: 5,
  EXAM_MINUTES: 15,
  // Porcentaje de un nivel que hay que resolver para abrir el siguiente.
  PASS_RATIO: 0.8,
  // Inactividad: aviso al estudiante y reporte a la profe (segundos).
  IDLE_WARN_SEC: 180,
  IDLE_REPORT_SEC: 300,
  // Capa anti-fotos (patrón en movimiento). Ponerlo en false si molesta a alguien.
  MOIRE: true,
};

// Solo en este computador: abrir con ?demo para probar sin conectarse al Apps Script.
if (["localhost", "127.0.0.1"].includes(location.hostname) && new URLSearchParams(location.search).has("demo")) {
  window.APP_CONFIG.API_URL = "";
}

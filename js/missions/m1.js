// Misión 1 — Primeros pasos (equivale a la Sección 3 del curso de referencia):
// print, variables, tipos de datos, reglas de nombres, "constantes", comentarios, asignación múltiple.
import { NOMBRES, CIUDADES, MASCOTAS, COMIDAS, JUEGOS, FRASES, VARIABLES_NUM } from "./data.js";

const dossier = [
  {
    title: "🐍 ¿Qué es Python?",
    body: `<p>Programar es darle <b>instrucciones</b> a un computador, paso a paso, en un idioma que entienda. <b>Python</b> es uno de esos idiomas: es fácil de leer y lo usan en videojuegos, inteligencia artificial, ciencia y páginas web.</p>
<p>Python lee tu programa <b>de arriba hacia abajo, una línea a la vez</b>. ¡Recuerda esto, porque es la clave de casi todos los ejercicios!</p>`,
  },
  {
    title: "🖨️ print(): hacer que Python hable",
    body: `<p><code>print()</code> muestra en pantalla lo que pongas dentro de los paréntesis. El texto va entre comillas.</p>`,
    example: `print("¡Hola, mundo!")\nprint("Estoy aprendiendo Python")`,
    after: `<p>Puedes imprimir varias cosas separadas por <b>comas</b>. Python pone un <b>espacio</b> entre ellas automáticamente:</p>`,
    example2: `print("Tengo", 14, "años")\nprint("Uno", "dos", "tres")`,
  },
  {
    title: "📦 Variables: cajitas con nombre",
    body: `<p>Una <b>variable</b> es como una cajita con una etiqueta: guardas algo adentro y luego lo usas por su nombre.</p>
<p>El signo <code>=</code> <b>no</b> significa "igual" como en matemáticas. Significa <b>"guarda esto en la cajita"</b>.</p>`,
    example: `nombre = "Sofía"\nedad = 14\nprint("Hola,", nombre)\nprint(nombre, "tiene", edad, "años")`,
    after: `<p>Si vuelves a guardar algo en la misma variable, <b>el valor viejo se reemplaza</b>:</p>`,
    example2: `vidas = 3\nprint(vidas)\nvidas = 2\nprint(vidas)`,
  },
  {
    title: "🏷️ Tipos de datos",
    body: `<p>Cada dato tiene un <b>tipo</b>. Los cuatro básicos son:</p>
<table class="mini-table">
<tr><th>Tipo</th><th>¿Qué es?</th><th>Ejemplos</th></tr>
<tr><td><code>int</code></td><td>número entero</td><td><code>15</code>, <code>-3</code>, <code>2026</code></td></tr>
<tr><td><code>float</code></td><td>número con decimales (con punto)</td><td><code>3.5</code>, <code>0.25</code></td></tr>
<tr><td><code>str</code></td><td>texto (siempre entre comillas)</td><td><code>"hola"</code>, <code>"15"</code></td></tr>
<tr><td><code>bool</code></td><td>verdadero o falso</td><td><code>True</code>, <code>False</code></td></tr>
</table>
<p>¡Ojo! <code>"15"</code> con comillas es <b>texto</b>, no número. Con <code>type()</code> le preguntas a Python el tipo de un dato:</p>`,
    example: `print(type(15))\nprint(type(3.5))\nprint(type("15"))\nprint(type(True))`,
  },
  {
    title: "📏 Reglas para nombrar variables",
    body: `<ul>
<li>✅ Usa letras, números y guion bajo: <code>nombre</code>, <code>juego2</code>, <code>mi_mascota</code>.</li>
<li>❌ No pueden empezar con número: <code>2juego</code> da error.</li>
<li>❌ No pueden tener espacios: <code>mi mascota</code> da error. Usa <code>mi_mascota</code>.</li>
<li>⚠️ Python distingue mayúsculas: <code>Nombre</code> y <code>nombre</code> son <b>dos cajitas distintas</b>.</li>
<li>❌ No uses palabras reservadas de Python como <code>print</code>, <code>if</code> o <code>True</code>.</li>
<li>💡 Usa nombres que expliquen qué guardan: <code>edad</code> es mejor que <code>x</code>.</li>
</ul>`,
  },
  {
    title: "🔒 \"Constantes\"",
    body: `<p>Algunos valores no deberían cambiar nunca, como la cantidad de días de la semana. Python no tiene constantes de verdad, pero por <b>acuerdo entre programadores</b> se escriben en <b>MAYÚSCULAS</b> para avisar: "no cambies esto".</p>`,
    example: `DIAS_SEMANA = 7\nVIDAS_MAXIMAS = 5\nprint("Una semana tiene", DIAS_SEMANA, "días")`,
  },
  {
    title: "💬 Comentarios",
    body: `<p>Todo lo que va después de <code>#</code> es un <b>comentario</b>: Python lo ignora. Sirve para explicar tu código o para "apagar" una línea sin borrarla.</p>`,
    example: `# Este programa saluda\nprint("Hola")\n# print("Esta línea está apagada")\nprint("Chao")  # también se puede comentar al final`,
  },
  {
    title: "🎯 Asignación múltiple e intercambio",
    body: `<p>Puedes crear varias variables en <b>una sola línea</b>. Los valores se reparten en orden:</p>`,
    example: `nombre, edad, ciudad = "Mateo", 15, "Cali"\nprint(nombre)\nprint(ciudad)`,
    after: `<p>Truco de magia 🪄: intercambiar el valor de dos variables en una línea.</p>`,
    example2: `a = 1\nb = 2\na, b = b, a\nprint(a, b)`,
  },
  {
    title: "⚠️ Errores típicos (¡los vas a cazar!)",
    body: `<ul>
<li><b>Comillas sin cerrar:</b> <code>print("Hola)</code> → <i>SyntaxError</i>.</li>
<li><b>Mayúsculas:</b> crear <code>Nombre</code> y usar <code>nombre</code> → <i>NameError</i>.</li>
<li><b>Texto + número:</b> <code>"Tengo " + 14</code> → <i>TypeError</i>. Usa <code>str(14)</code> o separa con comas en el <code>print</code>.</li>
<li><b>Nombre que empieza con número:</b> <code>2juego = ...</code> → <i>SyntaxError</i>.</li>
</ul>
<p>Los errores no son malos: Python te está diciendo qué arreglar. 🕵️</p>`,
  },
];

// ---------------- Nivel 1: Predice la salida ----------------
const predict = [
  {
    id: "m1-p1", title: "Saludo con variable",
    gen: (r) => ({ code: `nombre = "${r.pick(NOMBRES)}"\nprint("${r.pick(["Hola", "Buenas", "Qué más", "Hey"])}", nombre)` }),
    hint: "print con coma pone un espacio entre las partes.",
  },
  {
    id: "m1-p2", title: "La cajita cambia",
    gen: (r) => {
      const v = r.pick(VARIABLES_NUM), a = r.int(2, 20), b = r.int(21, 60);
      return { code: `${v} = ${a}\nprint(${v})\n${v} = ${b}\nprint(${v})` };
    },
    hint: "Python lee de arriba hacia abajo. Cada print muestra lo que hay en la cajita EN ESE MOMENTO.",
  },
  {
    id: "m1-p3", title: "¿Qué tipo es?",
    gen: (r) => {
      const val = r.pick([`${r.int(1, 99)}`, `${r.int(1, 9)}.${r.int(1, 9)}`, `"${r.pick(NOMBRES)}"`, r.pick(["True", "False"]), `"${r.int(10, 99)}"`]);
      return { code: `dato = ${val}\nprint(type(dato))` };
    },
    hint: "type() responde algo como <class 'int'>. ¿El dato tiene comillas? ¿Tiene punto decimal?",
  },
  {
    id: "m1-p4", title: "Reparto en orden",
    gen: (r) => {
      const [x, y, z] = r.sample(NOMBRES, 3);
      const [p, q] = r.sample(["a", "b", "c"], 2);
      return { code: `a, b, c = "${x}", "${y}", "${z}"\nprint(${p})\nprint(${q})` };
    },
    hint: "El primer valor va a la primera variable, el segundo a la segunda…",
  },
  {
    id: "m1-p5", title: "Línea apagada",
    gen: (r) => {
      const [f1, f2, f3] = r.sample(COMIDAS, 3);
      const off = r.int(0, 2);
      const lines = [f1, f2, f3].map((f, i) => (i === off ? `# print("${f}")` : `print("${f}")`));
      return { code: `# Mis comidas favoritas\n${lines.join("\n")}` };
    },
    hint: "Las líneas que empiezan con # no se ejecutan.",
  },
  {
    id: "m1-p6", title: "Intercambio mágico",
    gen: (r) => {
      const a = r.int(1, 50), b = r.int(51, 99);
      return { code: `x = ${a}\ny = ${b}\nx, y = y, x\nprint("x vale", x)\nprint("y vale", y)` };
    },
    hint: "x, y = y, x cambia los valores: x se queda con el de y y al revés.",
  },
];

// ---------------- Nivel 2: Completa el hueco ----------------
const fill = [
  {
    id: "m1-f1", title: "Haz hablar a Python",
    gen: (r) => ({ code: `___("${r.pick(FRASES)}")`, answer: "print" }),
    hint: "¿Cuál es la instrucción que muestra cosas en pantalla?",
  },
  {
    id: "m1-f2", title: "Guarda en la cajita",
    gen: (r) => {
      const v = r.pick(VARIABLES_NUM);
      return { code: `${v} ___ ${r.int(3, 99)}\nprint(${v})`, answer: "=" };
    },
    hint: "¿Qué signo significa \"guarda esto en la variable\"?",
  },
  {
    id: "m1-f3", title: "Pregúntale el tipo",
    gen: (r) => {
      const val = r.pick([`${r.int(1, 99)}`, `${r.int(1, 9)}.${r.int(1, 9)}`, `"${r.pick(MASCOTAS)}"`, r.pick(["True", "False"])]);
      return { code: `dato = ${val}\nprint(___(dato))`, answer: "type" };
    },
    hint: "Hay una función que responde <class '...'>.",
  },
  {
    id: "m1-f4", title: "Apaga la línea",
    gen: (r) => {
      const [a, b] = r.sample(JUEGOS, 2);
      return { code: `print("Juego favorito: ${a}")\n___ print("Juego favorito: ${b}")`, answer: "#" };
    },
    hint: "La salida esperada solo tiene UNA línea. ¿Con qué símbolo Python ignora una línea?",
  },
  {
    id: "m1-f5", title: "Número a texto",
    gen: (r) => ({ code: `edad = ${r.int(13, 16)}\nprint("Tengo " + ___(edad) + " años")`, answer: "str" }),
    hint: "Para pegar un número con texto usando +, primero hay que convertirlo a texto (str).",
  },
  {
    id: "m1-f6", title: "Intercambio incompleto",
    gen: (r) => {
      const a = r.int(1, 40), b = r.int(41, 90);
      return { code: `a = ${a}\nb = ${b}\na, b = ___, a\nprint(a, b)`, answer: "b" };
    },
    hint: "Para intercambiar: a, b = b, a",
  },
];

// ---------------- Nivel 3: Ordena las líneas ----------------
const parsons = [
  {
    id: "m1-o1", title: "¿Dónde vive?",
    gen: (r) => ({ lines: [`nombre = "${r.pick(NOMBRES)}"`, `ciudad = "${r.pick(CIUDADES)}"`, `print(nombre, "vive en", ciudad)`] }),
    hint: "Una variable debe existir ANTES de usarla en el print.",
  },
  {
    id: "m1-o2", title: "Receta paso a paso",
    gen: (r) => {
      const c = r.pick(COMIDAS);
      return { lines: [`comida = "${c}"`, `print("Hoy cocino", comida)`, `print("Paso 1: lavarse las manos")`, `print("Paso 2: preparar la", comida)`, `print("¡Listo, a comer!")`] };
    },
    hint: "Mira la salida esperada: los print deben ir en ese mismo orden.",
  },
  {
    id: "m1-o3", title: "Pierdo una vida",
    gen: (r) => {
      const a = r.int(3, 9);
      return { lines: [`vidas = ${a}`, `print("Vidas:", vidas)`, `vidas = ${a - 1}`, `print("Vidas:", vidas)`] };
    },
    hint: "Cada print muestra el valor que tiene la variable en ese momento.",
  },
  {
    id: "m1-o4", title: "Cambio de cajas",
    gen: (r) => {
      const a = r.int(1, 30), b = r.int(31, 60);
      return { lines: [`x = ${a}`, `y = ${b}`, `print("Antes:", x, y)`, `x, y = y, x`, `print("Después:", x, y)`] };
    },
    hint: "Primero crea las variables, luego muestra, luego intercambia y vuelve a mostrar.",
  },
];

// ---------------- Nivel 4: Caza el bug ----------------
const bug = [
  {
    id: "m1-b1", title: "Comillas perdidas",
    gen: (r) => {
      const f = r.pick(FRASES);
      return { code: `print("${f})`, fixed: `print("${f}")` };
    },
    hint: "Todo texto que abre comillas tiene que cerrarlas.",
  },
  {
    id: "m1-b2", title: "Mayúsculas traviesas",
    gen: (r) => {
      const m = r.pick(MASCOTAS);
      return {
        code: `Mascota = "${m}"\nprint("Mi mascota es un", mascota)`,
        fixed: `mascota = "${m}"\nprint("Mi mascota es un", mascota)`,
        requires: [{ re: /print\([^\n]*,\s*[A-Za-z_]\w*\s*\)/, msg: "el print debe seguir usando la variable, no el texto escrito a mano." }],
      };
    },
    hint: "Python distingue mayúsculas: Mascota y mascota son distintas.",
  },
  {
    id: "m1-b3", title: "Nombre prohibido",
    gen: (r) => {
      const j = r.pick(JUEGOS);
      return {
        code: `2juego = "${j}"\nprint("Mi juego favorito es", 2juego)`,
        fixed: `juego2 = "${j}"\nprint("Mi juego favorito es", juego2)`,
        requires: [{ re: /print\([^\n]*,\s*[A-Za-z_]\w*\s*\)/, msg: "el print debe seguir usando una variable." }],
      };
    },
    hint: "Los nombres de variables no pueden empezar con un número.",
  },
  {
    id: "m1-b4", title: "Texto + número",
    gen: (r) => {
      const e = r.int(13, 16);
      return {
        code: `edad = ${e}\nprint("Tengo " + edad + " años")`,
        fixed: `edad = ${e}\nprint("Tengo " + str(edad) + " años")`,
        requires: [{ re: /print\([^\n]*edad/, msg: "el print debe seguir usando la variable edad." }],
      };
    },
    hint: "No se puede sumar texto con número. Convierte con str() o separa con comas.",
  },
];

// ---------------- Nivel 5: Compilador ----------------
const code = [
  {
    id: "m1-c1", title: "Tarjeta de presentación",
    gen: (r) => {
      const n = r.pick(NOMBRES), c = r.pick(CIUDADES);
      return {
        prompt: `Crea una variable <code>nombre</code> con el valor <code>"${n}"</code> y una variable <code>ciudad</code> con <code>"${c}"</code>. Luego imprime usando las variables.`,
        solution: `nombre = "${n}"\nciudad = "${c}"\nprint(nombre, "vive en", ciudad)`,
        requires: [
          { re: /nombre\s*=/, msg: "crea la variable nombre." },
          { re: /ciudad\s*=/, msg: "crea la variable ciudad." },
          { re: /print\([^\n]*nombre[^\n]*ciudad/, msg: "el print debe usar las variables nombre y ciudad." },
        ],
      };
    },
    hint: "print(nombre, \"vive en\", ciudad)",
  },
  {
    id: "m1-c2", title: "Detective de tipos",
    gen: (r) => {
      const vals = r.shuffle([`${r.int(1, 99)}`, `${r.int(1, 9)}.${r.int(1, 9)}`, `"${r.pick(COMIDAS)}"`, r.pick(["True", "False"])]);
      return {
        prompt: `Imprime el tipo de cada uno de estos datos, en este orden y uno por línea: <code>${vals.join("</code>, <code>")}</code>`,
        solution: vals.map((v) => `print(type(${v}))`).join("\n"),
        requires: [{ re: /type\(/, msg: "usa la función type()." }],
      };
    },
    hint: "Una línea por dato: print(type(...))",
  },
  {
    id: "m1-c3", title: "Intercambio de cajas",
    gen: (r) => {
      const a = r.int(1, 50), b = r.int(51, 99);
      return {
        prompt: `Crea <code>a = ${a}</code> y <code>b = ${b}</code>. Intercambia sus valores <b>en una sola línea</b> y luego imprime <code>a</code> y después <code>b</code>, cada uno en su propia línea.`,
        solution: `a = ${a}\nb = ${b}\na, b = b, a\nprint(a)\nprint(b)`,
        requires: [{ re: /a\s*,\s*b\s*=\s*b\s*,\s*a/, msg: "intercambia con a, b = b, a (sin escribir los números a mano)." }],
      };
    },
    hint: "a, b = b, a",
  },
  {
    id: "m1-c4", title: "Ficha del jugador",
    gen: (r) => {
      const n = r.pick(NOMBRES), j = r.pick(JUEGOS), l = r.int(5, 60);
      return {
        prompt: `Con <b>asignación múltiple</b> crea en una sola línea <code>jugador</code>, <code>juego</code> y <code>nivel</code> con los valores <code>"${n}"</code>, <code>"${j}"</code> y <code>${l}</code>. Escribe un <b>comentario</b> que explique el programa e imprime la ficha.`,
        solution: `# Ficha del jugador\njugador, juego, nivel = "${n}", "${j}", ${l}\nprint("Jugador:", jugador)\nprint("Juego:", juego)\nprint("Nivel:", nivel)`,
        requires: [
          { re: /#/, msg: "agrega un comentario con #." },
          { re: /jugador\s*,\s*juego\s*,\s*nivel\s*=/, msg: "usa asignación múltiple: jugador, juego, nivel = ..." },
          { re: /print\([^\n]*nivel/, msg: "imprime usando las variables." },
        ],
      };
    },
    hint: "jugador, juego, nivel = ...  y luego tres print.",
  },
];

// ---------------- Nivel 6 (extra): Bug difícil — DOS errores por programa ----------------
const bugHard = [
  {
    id: "m1-d1", title: "Mi tarjeta con dos errores",
    gen: (r) => {
      const n = r.pick(NOMBRES), c = r.pick(CIUDADES);
      return {
        code: `nombre = "${n}\nCiudad = "${c}"\nprint("Soy", nombre, "de", ciudad)`,
        fixed: `nombre = "${n}"\nciudad = "${c}"\nprint("Soy", nombre, "de", ciudad)`,
        requires: [{ re: /print\([^\n]*nombre[^\n]*ciudad/, msg: "el print debe usar las variables nombre y ciudad." }],
      };
    },
    hint: "Una línea tiene unas comillas sin cerrar y otra tiene una mayúscula de más.",
  },
  {
    id: "m1-d2", title: "La mascota y la edad",
    gen: (r) => {
      const m = r.pick(MASCOTAS), e = r.int(2, 12);
      return {
        code: `mi mascota = "${m}"\nedad = ${e}\nprint("Mi " + mi mascota + " tiene " + edad + " años")`,
        fixed: `mi_mascota = "${m}"\nedad = ${e}\nprint("Mi " + mi_mascota + " tiene " + str(edad) + " años")`,
        requires: [{ re: /print\([^\n]*mi_mascota[^\n]*edad/, msg: "el print debe usar las variables mi_mascota y edad." }],
      };
    },
    hint: "Los nombres de variable no pueden tener espacios, y no se puede sumar texto con un número.",
  },
  {
    id: "m1-d3", title: "El intercambio fallido",
    gen: (r) => {
      const a = r.int(1, 40), b = r.int(41, 90);
      return {
        code: `a = ${a}\nb = ${b}\na = b\nb = a\nprint("a vale", a)\n# print("b vale", b)`,
        fixed: `a = ${a}\nb = ${b}\na, b = b, a\nprint("a vale", a)\nprint("b vale", b)`,
        requires: [{ re: /^\s*print\("b vale"/m, msg: "tiene que imprimirse también el valor de b." }],
      };
    },
    hint: "Si haces a = b, el valor viejo de a se pierde. Usa el intercambio en una línea. Y mira bien qué línea está apagada.",
  },
];

// ---------------- Nivel 7 (extra): Reto con pruebas ocultas ----------------
// Tu programa se prueba con valores distintos para las variables que ya existen.
const hidden = [
  {
    id: "m1-h1", title: "Saludo para cualquiera",
    gen: (r) => {
      const t = () => ({ pre: `nombre = "${r.pick(NOMBRES)}"` });
      return {
        prompt: "La variable <code>nombre</code> <b>ya existe</b>. Imprime una línea con el saludo <code>Hola, NOMBRE</code> (por ejemplo <code>Hola, Sofía</code>). Tu programa se probará con nombres distintos.",
        starter: "# nombre ya existe. ¡No la borres!\n",
        solution: `print("Hola,", nombre)`,
        tests: [t(), t(), t()],
        requires: [{ re: /nombre/, msg: "usa la variable nombre." }],
      };
    },
    hint: "print(\"Hola,\", nombre)",
  },
  {
    id: "m1-h2", title: "Intercambia y muestra",
    gen: (r) => {
      const t = () => ({ pre: `x = ${r.int(1, 40)}\ny = ${r.int(41, 90)}` });
      return {
        prompt: "Las variables <code>x</code> e <code>y</code> <b>ya existen</b>. Intercambia sus valores <b>en una sola línea</b> e imprime <code>x</code> y después <code>y</code>, cada una en su propia línea.",
        starter: "# x e y ya existen. ¡No las borres!\n",
        solution: "x, y = y, x\nprint(x)\nprint(y)",
        tests: [t(), t(), t()],
        requires: [{ re: /x\s*,\s*y\s*=\s*y\s*,\s*x/, msg: "intercambia con x, y = y, x." }],
      };
    },
    hint: "x, y = y, x",
  },
  {
    id: "m1-h3", title: "Detective de tipos",
    gen: (r) => {
      const vals = r.shuffle([`${r.int(1, 99)}`, `${r.int(1, 9)}.${r.int(1, 9)}`, `"${r.pick(COMIDAS)}"`, r.pick(["True", "False"])]).slice(0, 3);
      return {
        prompt: "La variable <code>dato</code> <b>ya existe</b>, pero cada vez trae un tipo distinto. Imprime su tipo. Tu programa se probará con números, textos y booleanos.",
        starter: "# dato ya existe. ¡No la borres!\n",
        solution: "print(type(dato))",
        tests: vals.map((v) => ({ pre: `dato = ${v}` })),
        requires: [{ re: /type\(\s*dato\s*\)/, msg: "usa type(dato)." }],
      };
    },
    hint: "print(type(dato))",
  },
];

// ---------------- Nivel 8 (extra): Jefe de misión ----------------
const boss = [
  {
    id: "m1-j1", title: "El carnet del jugador",
    gen: (r) => {
      const t = () => ({ pre: `jugador = "${r.pick(NOMBRES)}"\njuego = "${r.pick(JUEGOS)}"\nnivel = ${r.int(1, 99)}` });
      return {
        prompt: "Ya existen <code>jugador</code>, <code>juego</code> y <code>nivel</code>. Escribe un <b>comentario</b> con <code>#</code> y luego imprime <b>exactamente</b> estas tres líneas:<pre class=\"console nosel\">Jugador: Sofía\nJuego: Roblox\nNivel: 12</pre>(los datos cambian en cada prueba).",
        starter: "# jugador, juego y nivel ya existen.\n",
        solution: `# Carnet del jugador\nprint("Jugador:", jugador)\nprint("Juego:", juego)\nprint("Nivel:", nivel)`,
        tests: [t(), t(), t()],
        requires: [{ re: /(^|\n)\s*#/, msg: "agrega un comentario con #." }, { re: /print\([^\n]*nivel/, msg: "imprime usando las variables." }],
      };
    },
    hint: "Tres print: print(\"Jugador:\", jugador), print(\"Juego:\", juego) y print(\"Nivel:\", nivel).",
  },
  {
    id: "m1-j2", title: "Cambio de equipos",
    gen: (r) => {
      const t = () => { const [a, b] = r.sample(NOMBRES, 2); return { pre: `equipo1 = "${a}"\nequipo2 = "${b}"` }; };
      return {
        prompt: "Ya existen <code>equipo1</code> y <code>equipo2</code> con el nombre de dos jugadores. Intercámbialos <b>en una sola línea</b> e imprime <b>exactamente</b>:<pre class=\"console nosel\">Equipo 1: Mateo\nEquipo 2: Sofía</pre>(con los nombres ya intercambiados).",
        starter: "# equipo1 y equipo2 ya existen.\n",
        solution: `equipo1, equipo2 = equipo2, equipo1\nprint("Equipo 1:", equipo1)\nprint("Equipo 2:", equipo2)`,
        tests: [t(), t(), t()],
        requires: [{ re: /equipo1\s*,\s*equipo2\s*=\s*equipo2\s*,\s*equipo1/, msg: "intercambia en una línea: equipo1, equipo2 = equipo2, equipo1." }],
      };
    },
    hint: "Intercambia con equipo1, equipo2 = equipo2, equipo1 y luego imprime los dos.",
  },
];

const withType = (type, list) => list.map((x) => ({ ...x, type }));

export default {
  id: 1,
  emoji: "👣",
  title: "Primeros pasos",
  subtitle: "print, variables, tipos y comentarios",
  dossier,
  levels: [
    { type: "predict", exercises: withType("predict", predict) },
    { type: "fill", exercises: withType("fill", fill) },
    { type: "parsons", exercises: withType("parsons", parsons) },
    { type: "bug", exercises: withType("bug", bug) },
    { type: "code", name: "Compilador guiado", exercises: withType("code", code) },
    { type: "bug", name: "Bug difícil", icon: "🕷️", extra: true, blurb: "Aquí cada programa tiene DOS errores.", exercises: withType("bug", bugHard) },
    { type: "code", name: "Reto con pruebas ocultas", icon: "🧪", extra: true, blurb: "Tu programa se prueba con valores distintos. ¡Que funcione para todos!", exercises: withType("code", hidden) },
    { type: "code", name: "Jefe de misión", icon: "👑", extra: true, blurb: "El reto final de la misión. ¡Tú puedes!", exercises: withType("code", boss) },
  ],
};

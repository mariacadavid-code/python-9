// Misión 3 — Texto (equivale a la Sección 5 del curso de referencia):
// comillas, concatenar con +, repetir con *, len(), índices, slicing y métodos (upper, lower, title, strip, replace, count).
// Niveles 1 a 5 = ruta principal. Niveles 6 a 8 = extra opcional.
import { NOMBRES, CIUDADES, MASCOTAS, COMIDAS, JUEGOS } from "./data.js";

// Palabras sin tildes y de 7 letras o más, para trabajar con índices y cortes sin sorpresas.
const PALABRAS = ["programa", "teclado", "pantalla", "computador", "variable", "galleta", "mochila", "cuaderno", "portatil", "videojuego", "bicicleta", "chocolate", "mariposa", "elefante"];
const NOMBRES_A = ["Sofia", "Mateo", "Valentina", "Samuel", "Isabella", "Tomas", "Mariana", "Emilio", "Luciana", "Jeronimo", "Antonella", "Martin", "Salome", "Simon"];
const APELLIDOS_A = ["Gomez", "Ruiz", "Perez", "Torres", "Cano", "Mejia", "Rojas", "Vargas", "Ortiz", "Duque"];
const CIUDADES_A = ["medellin", "bogota", "cali", "cartagena", "pereira", "armenia", "manizales"];
const APODOS = ["El Pro", "Rayo", "Capi", "Flash", "Maestro"];

const dossier = [
  {
    title: "🔤 Texto en Python: las cadenas (str)",
    body: `<p>Un texto en Python se llama <b>cadena</b> (en inglés, <code>str</code>, de <i>string</i>). Siempre va <b>entre comillas</b>: pueden ser dobles <code>" "</code> o simples <code>' '</code>. Las dos funcionan igual.</p>
<p>Truco: si tu texto <b>lleva comillas adentro</b>, usa el otro tipo por fuera:</p>`,
    example: `a = "Hola"\nb = 'Python'\nprint(a, b)\nprint('Mi apodo es "Rayo"')\nprint("It's Python")\nprint(type(a))`,
    after: `<p>Un texto vacío <code>""</code> también es una cadena. Y ojo: <code>"14"</code> con comillas es <b>texto</b>, no un número.</p>`,
  },
  {
    title: "➕ Pegar textos: concatenar",
    body: `<p>Con el signo <code>+</code> puedes <b>pegar</b> textos. A eso se le llama <b>concatenar</b>. Python <b>no agrega espacios solo</b>: si los quieres, ¡pégalos tú!</p>`,
    example: `nombre = "Sofía"\nprint("Hola" + nombre)\nprint("Hola " + nombre)\nprint("Hola" + " " + nombre)`,
    after: `<p>⚠️ El <code>+</code> solo pega <b>texto con texto</b>. Si intentas <code>"Tengo " + 14</code> te da un <i>TypeError</i>. Para mezclar texto y números usa la <b>coma</b> en el <code>print</code>: <code>print("Tengo", 14, "años")</code>.</p>`,
  },
  {
    title: "✖️ Repetir texto con *",
    body: `<p>Multiplicar un texto por un número lo <b>repite</b>. Sirve para dibujar rayas y marcos.</p>`,
    example: `print("ja" * 3)\nprint("-" * 20)\nprint("=" * 10)`,
  },
  {
    title: "📏 len(): ¿cuántos caracteres tiene?",
    body: `<p><code>len()</code> cuenta los <b>caracteres</b> de un texto. Cuentan las letras, los números, los <b>espacios</b> y los signos.</p>`,
    example: `palabra = "Python"\nprint(len(palabra))\nprint(len("Hola mundo"))`,
    after: `<p>Fíjate que <code>"Hola mundo"</code> da 10: son 4 + 1 (el espacio) + 5.</p>`,
  },
  {
    title: "🔢 Índices: cada letra tiene su número",
    body: `<p>Cada caracter de un texto tiene una <b>posición</b>, llamada <b>índice</b>. ¡Y se empieza a contar desde <b>0</b>, no desde 1!</p>
<table class="mini-table">
<tr><th>letra</th><td>P</td><td>Y</td><td>T</td><td>H</td><td>O</td><td>N</td></tr>
<tr><th>índice</th><td>0</td><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td></tr>
<tr><th>desde el final</th><td>-6</td><td>-5</td><td>-4</td><td>-3</td><td>-2</td><td>-1</td></tr>
</table>
<p>Se usa con corchetes: <code>palabra[0]</code>. El índice <code>-1</code> es siempre la <b>última</b> letra.</p>`,
    example: `palabra = "PYTHON"\nprint(palabra[0])\nprint(palabra[3])\nprint(palabra[-1])`,
    after: `<p>⚠️ Si pides un índice que no existe, como <code>palabra[6]</code> en un texto de 6 letras, Python responde <i>IndexError</i>. La última letra es la posición <code>len(palabra) - 1</code>, o simplemente <code>-1</code>.</p>`,
  },
  {
    title: "✂️ Slicing: cortar pedazos",
    body: `<p>Con <code>[inicio:fin]</code> sacas un <b>pedazo</b> del texto. El <b>inicio sí cuenta</b>, pero el <b>fin NO</b> (se queda afuera).</p>`,
    example: `palabra = "PROGRAMA"\nprint(palabra[0:3])\nprint(palabra[:3])\nprint(palabra[3:])\nprint(palabra[-3:])`,
    after: `<ul>
<li><code>[:3]</code> → desde el principio hasta antes del índice 3 (las <b>3 primeras</b>).</li>
<li><code>[3:]</code> → desde el índice 3 hasta el final.</li>
<li><code>[-3:]</code> → las <b>3 últimas</b>.</li>
<li><code>[::-1]</code> → el texto <b>al revés</b>. 🪞</li>
</ul>`,
    example2: `palabra = "PROGRAMA"\nprint(palabra[::-1])`,
  },
  {
    title: "🪄 Métodos: trucos para los textos",
    body: `<p>Los textos traen <b>métodos</b>: funciones que se escriben con un punto después del texto.</p>
<table class="mini-table">
<tr><th>Método</th><th>¿Qué hace?</th></tr>
<tr><td><code>.upper()</code></td><td>todo en MAYÚSCULAS</td></tr>
<tr><td><code>.lower()</code></td><td>todo en minúsculas</td></tr>
<tr><td><code>.title()</code></td><td>Primera Letra De Cada Palabra En Mayúscula</td></tr>
<tr><td><code>.strip()</code></td><td>quita los espacios de los extremos</td></tr>
<tr><td><code>.replace("a", "b")</code></td><td>cambia un pedazo por otro</td></tr>
<tr><td><code>.count("a")</code></td><td>cuenta cuántas veces aparece</td></tr>
</table>`,
    example: `frase = "  hola mundo  "\nprint(frase.strip())\nprint(frase.upper())\nprint("banana".replace("a", "o"))\nprint("banana".count("a"))`,
    after: `<p>🔑 <b>Los textos no cambian solos.</b> Los métodos te devuelven un texto <i>nuevo</i>. Si quieres quedarte con el cambio, guárdalo:</p>`,
    example2: `nombre = "sofía"\nnombre.title()\nprint(nombre)\nnombre = nombre.title()\nprint(nombre)`,
  },
  {
    title: "⚠️ Errores típicos (¡los vas a cazar!)",
    body: `<ul>
<li><b>Comillas que se cruzan:</b> <code>"Me dicen "Rayo""</code> se rompe. Usa comillas distintas por fuera: <code>'Me dicen "Rayo"'</code>.</li>
<li><b>Texto + número:</b> <code>"Tengo " + 14</code> da TypeError. Usa la coma en el <code>print</code>.</li>
<li><b>Se pegan sin espacio:</b> <code>"Hola" + nombre</code> sale <code>HolaSofía</code>. Agrega <code>" "</code>.</li>
<li><b>Contar desde 1:</b> la primera letra es <code>[0]</code>, no <code>[1]</code>. Y <code>palabra[len(palabra)]</code> siempre da IndexError.</li>
<li><b>Método sin guardar:</b> <code>nombre.title()</code> a solas no cambia <code>nombre</code>. Hay que escribir <code>nombre = nombre.title()</code>.</li>
<li><b>Mayúsculas en el método:</b> <code>.Upper()</code> no existe; es <code>.upper()</code>. Python distingue mayúsculas de minúsculas.</li>
</ul>`,
  },
];

// ---------------- Nivel 1: Predice la salida ----------------
const predict = [
  {
    id: "m3-p1", title: "Pegando textos",
    gen: (r) => {
      const n = r.pick(NOMBRES);
      return { code: `saludo = "${r.pick(["Hola", "Buenas", "Qué más"])}"\nnombre = "${n}"\nprint(saludo + " " + nombre)\nprint(saludo + nombre)` };
    },
    hint: "El + pega los textos tal cual. Fíjate bien dónde hay un espacio y dónde no.",
  },
  {
    id: "m3-p2", title: "Texto que se repite",
    gen: (r) => {
      const p = r.pick(["ja", "na", "ho", "la", "ta"]);
      return { code: `risa = "${p}"\nprint(risa * ${r.int(2, 5)})\nprint("-" * ${r.int(4, 12)})` };
    },
    hint: "Multiplicar un texto por un número lo repite esa cantidad de veces.",
  },
  {
    id: "m3-p3", title: "Contando caracteres",
    gen: (r) => {
      const w = r.pick(PALABRAS);
      return { code: `palabra = "${w}"\nprint(len(palabra))\nprint(len(palabra + "s"))\nprint(len("${r.pick(NOMBRES)} ${r.pick(APELLIDOS_A)}"))` };
    },
    hint: "len() cuenta todos los caracteres, ¡también el espacio!",
  },
  {
    id: "m3-p4", title: "Letras por su índice",
    gen: (r) => {
      const w = r.pick(PALABRAS);
      return { code: `palabra = "${w}"\nprint(palabra[0])\nprint(palabra[${r.int(2, 5)}])\nprint(palabra[-1])` };
    },
    hint: "Cuenta desde 0. El índice -1 es la última letra.",
  },
  {
    id: "m3-p5", title: "Cortando pedazos",
    gen: (r) => {
      const w = r.pick(PALABRAS);
      const k = r.int(3, 5);
      return { code: `palabra = "${w}"\nprint(palabra[:${k}])\nprint(palabra[${k}:])\nprint(palabra[-3:])` };
    },
    hint: "En [a:b] la letra del índice a sí entra y la del índice b se queda afuera.",
  },
  {
    id: "m3-p6", title: "Métodos del texto",
    gen: (r) => {
      const a = r.pick(["mariposa", "elefante", "bicicleta", "chocolate"]);
      const b = r.pick(["verde", "grande", "rapido", "bonito"]);
      const l = r.pick(["a", "e", "o"]);
      return { code: `frase = "${a} ${b}"\nprint(frase.upper())\nprint(frase.title())\nprint(frase.replace("${l}", "*"))\nprint(frase.count("${l}"))` };
    },
    hint: "Ve método por método. Recuerda que ninguno cambia la variable frase: cada print parte del texto original.",
  },
];

// ---------------- Nivel 2: Completa el hueco ----------------
const fill = [
  {
    id: "m3-f1", title: "Pegar con espacio",
    gen: (r) => {
      const n = r.pick(NOMBRES);
      return { code: `saludo = "${r.pick(["Hola", "Buenas", "Bienvenido"])}"\nnombre = "${n}"\nprint(saludo ___ " " + nombre)`, answer: "+" };
    },
    hint: "Mira la salida esperada: los dos textos van pegados con un espacio en medio. ¿Qué operador pega textos?",
  },
  {
    id: "m3-f2", title: "Repetir el texto",
    gen: (r) => {
      const p = r.pick(["ja", "na", "ho", "la", "ta", "ra"]);
      return { code: `risa = "${p}"\nprint(risa ___ ${r.int(3, 6)})`, answer: "*" };
    },
    hint: "Para repetir un texto se multiplica.",
  },
  {
    id: "m3-f3", title: "¿Cuántos caracteres?",
    gen: (r) => ({ code: `palabra = "${r.pick(PALABRAS)}"\nprint(___(palabra))`, answer: "len" }),
    hint: "La salida es un número: cuántos caracteres tiene la palabra. Hay una función para contarlos.",
  },
  {
    id: "m3-f4", title: "La letra que falta",
    gen: (r) => {
      const w = r.pick(PALABRAS);
      const i = r.int(1, w.length - 2);
      return { code: `palabra = "${w}"\nprint(palabra[___])`, answer: String(i) };
    },
    hint: "Mira cuál letra imprime la salida y cuenta a qué posición pertenece (¡empieza en 0!).",
  },
  {
    id: "m3-f5", title: "Las primeras letras",
    gen: (r) => {
      const w = r.pick(PALABRAS);
      return { code: `palabra = "${w}"\nprint(palabra[0:___])`, answer: String(r.int(3, 5)) };
    },
    hint: "El número del final no entra en el corte. Si la salida tiene 4 letras, ¿qué número va?",
  },
  {
    id: "m3-f6", title: "Elige el método",
    gen: (r) => {
      const k = r.int(0, 2);
      if (k === 0) return { code: `texto = "${r.pick(["hola mundo", "me gusta python", "vamos con toda"])}"\nprint(texto.___())`, answer: "upper" };
      if (k === 1) return { code: `texto = "${r.pick(["HOLA MUNDO", "ME GUSTA PYTHON", "VAMOS CON TODA"])}"\nprint(texto.___())`, answer: "lower" };
      return { code: `texto = "${r.pick(["hola mundo", "me gusta python", "vamos con toda"])}"\nprint(texto.___())`, answer: "title" };
    },
    hint: "Compara el texto original con la salida: ¿qué le pasó a las letras?",
  },
];

// ---------------- Nivel 3: Ordena las líneas ----------------
const parsons = [
  {
    id: "m3-o1", title: "Nombre completo",
    gen: (r) => ({ lines: [`nombre = "${r.pick(NOMBRES)}"`, `apellido = "${r.pick(APELLIDOS_A)}"`, `completo = nombre + " " + apellido`, `print(completo)`] }),
    hint: "Primero se crean las dos variables, luego se pegan y al final se imprime.",
  },
  {
    id: "m3-o2", title: "Primera y última",
    gen: (r) => ({ lines: [`palabra = "${r.pick(PALABRAS)}"`, `primera = palabra[0]`, `ultima = palabra[-1]`, `print(primera, ultima)`] }),
    hint: "Una variable tiene que existir antes de que la uses.",
  },
  {
    id: "m3-o3", title: "Grito de gol",
    gen: (r) => ({ lines: [`palabra = "${r.pick(["gol", "victoria", "campeon", "bravo"])}"`, `grito = palabra.upper()`, `print(grito)`, `print(len(grito))`] }),
    hint: "Guardas el grito antes de imprimirlo y medirlo.",
  },
  {
    id: "m3-o4", title: "Título subrayado",
    gen: (r) => ({ lines: [`titulo = "${r.pick(["MI PERFIL", "PYTHON", "REGLAS DEL JUEGO", "MIS METAS"])}"`, `raya = "=" * len(titulo)`, `print(titulo)`, `print(raya)`] }),
    hint: "La raya depende del tamaño del título, así que el título se crea primero.",
  },
];

// ---------------- Nivel 4: Caza el bug ----------------
const bug = [
  {
    id: "m3-b1", title: "Comillas que se cruzan",
    gen: (r) => {
      const a = r.pick(APODOS), j = r.pick(JUEGOS);
      return {
        code: `mensaje = "Mi apodo es "${a}" en ${j}"\nprint(mensaje)`,
        fixed: `mensaje = 'Mi apodo es "${a}" en ${j}'\nprint(mensaje)`,
        requires: [{ re: /print\(\s*mensaje\s*\)/, msg: "imprime la variable mensaje." }],
      };
    },
    hint: "El texto ya tiene comillas dobles adentro. Por fuera usa comillas simples.",
  },
  {
    id: "m3-b2", title: "Texto más número",
    gen: (r) => {
      const n = r.pick(NOMBRES), e = r.int(13, 16);
      return {
        code: `nombre = "${n}"\nedad = ${e}\nprint("Hola, soy " + nombre + " y tengo " + edad + " años")`,
        fixed: `nombre = "${n}"\nedad = ${e}\nprint("Hola, soy", nombre, "y tengo", edad, "años")`,
        requires: [{ re: /print\([^\n]*nombre[^\n]*edad/, msg: "usa las variables nombre y edad." }],
      };
    },
    hint: "El + no puede pegar texto con un número. En el print, sepáralos con comas.",
  },
  {
    id: "m3-b3", title: "Una letra que no existe",
    gen: (r) => {
      const w = r.pick(PALABRAS);
      return {
        code: `palabra = "${w}"\nprint("La última letra es", palabra[${w.length}])`,
        fixed: `palabra = "${w}"\nprint("La última letra es", palabra[-1])`,
        requires: [{ re: /print\([^\n]*palabra\s*\[/, msg: "saca la letra con un índice de palabra." }],
      };
    },
    hint: "Los índices empiezan en 0, así que el último es uno menos que la longitud. O usa -1.",
  },
  {
    id: "m3-b4", title: "El método que no se guarda",
    gen: (r) => {
      const n = r.pick(NOMBRES).toLowerCase();
      return {
        code: `nombre = "${n}"\nnombre.title()\nprint("Bienvenido,", nombre)`,
        fixed: `nombre = "${n}"\nnombre = nombre.title()\nprint("Bienvenido,", nombre)`,
        requires: [{ re: /nombre\s*=\s*nombre\.(title|capitalize)\(\)/, msg: "guarda el resultado del método en la variable nombre." }],
      };
    },
    hint: "Los métodos devuelven un texto nuevo; si no lo guardas en una variable, se pierde.",
  },
];

// ---------------- Nivel 5: Compilador guiado ----------------
const code = [
  {
    id: "m3-c1", title: "Tarjeta de presentación",
    gen: (r) => {
      const n = r.pick(NOMBRES), c = r.pick(CIUDADES);
      return {
        prompt: `Crea las variables <code>nombre = "${n}"</code> y <code>ciudad = "${c}"</code>. Imprime exactamente: <code>Me llamo ${n} y vivo en ${c}</code>`,
        solution: `nombre = "${n}"\nciudad = "${c}"\nprint("Me llamo " + nombre + " y vivo en " + ciudad)`,
        requires: [
          { re: /nombre\s*=/, msg: "crea la variable nombre." },
          { re: /ciudad\s*=/, msg: "crea la variable ciudad." },
          { re: /print\([^\n]*nombre[^\n]*ciudad/, msg: "usa las variables dentro del print, no escribas el texto directamente." },
        ],
      };
    },
    hint: 'print("Me llamo " + nombre + " y vivo en " + ciudad)  — o usa comas y cuida los espacios.',
  },
  {
    id: "m3-c2", title: "Palabra en grande",
    gen: (r) => {
      const w = r.pick(PALABRAS);
      return {
        prompt: `Crea la variable <code>palabra = "${w}"</code>. Imprime la palabra en <b>MAYÚSCULAS</b> y, en otra línea, cuántos caracteres tiene (solo el número).`,
        solution: `palabra = "${w}"\nprint(palabra.upper())\nprint(len(palabra))`,
        requires: [
          { re: /\.upper\(\)/, msg: "usa el método upper()." },
          { re: /len\(/, msg: "cuenta los caracteres con len()." },
        ],
      };
    },
    hint: "print(palabra.upper()) y print(len(palabra))",
  },
  {
    id: "m3-c3", title: "Las iniciales",
    gen: (r) => {
      const n = r.pick(NOMBRES_A), a = r.pick(APELLIDOS_A);
      return {
        prompt: `Crea <code>nombre = "${n}"</code> y <code>apellido = "${a}"</code>. Imprime sus <b>iniciales</b> juntas, sin espacios: <code>${n[0]}${a[0]}</code>.`,
        solution: `nombre = "${n}"\napellido = "${a}"\nprint(nombre[0] + apellido[0])`,
        requires: [
          { re: /\[\s*0\s*\]/, msg: "saca la primera letra de cada variable con el índice [0]." },
        ],
      };
    },
    hint: "La primera letra de un texto es texto[0]. Pega las dos con +.",
  },
  {
    id: "m3-c4", title: "Contraseña recortada",
    gen: (r) => {
      const w = r.pick(PALABRAS);
      return {
        prompt: `Crea <code>palabra = "${w}"</code>. Imprime sus <b>3 primeras letras</b> seguidas de tres puntos: <code>${w.slice(0, 3)}...</code>`,
        solution: `palabra = "${w}"\nprint(palabra[:3] + "...")`,
        requires: [
          { re: /\[\s*0?\s*:\s*3\s*\]/, msg: "corta las 3 primeras letras con [:3]." },
        ],
      };
    },
    hint: 'print(palabra[:3] + "...")',
  },
];

// ---------------- Nivel 6 (extra): Bug difícil — DOS errores por programa ----------------
const bugHard = [
  {
    id: "m3-d1", title: "Saludo gritado",
    gen: (r) => {
      const n = r.pick(NOMBRES);
      const s = r.pick(["hola", "buenas", "bienvenido"]);
      return {
        code: `saludo = "${s}"\nnombre = "${n}"\nsaludo.upper()\nprint(saludo + nombre)`,
        fixed: `saludo = "${s}"\nnombre = "${n}"\nsaludo = saludo.upper()\nprint(saludo + " " + nombre)`,
        requires: [{ re: /print\([^\n]*saludo[^\n]*nombre/, msg: "imprime saludo y nombre juntos." }],
      };
    },
    hint: "Un error está en la línea 3 (el método no se guarda) y otro en la línea 4 (falta un espacio).",
  },
  {
    id: "m3-d2", title: "La última letra",
    gen: (r) => {
      const w = r.pick(PALABRAS);
      return {
        code: `palabra = "${w}"\nprint("Última letra:", palabra[len(palabra)])\nprint("Letras:", palabra.len())`,
        fixed: `palabra = "${w}"\nprint("Última letra:", palabra[len(palabra) - 1])\nprint("Letras:", len(palabra))`,
        requires: [{ re: /print\([^\n]*palabra[^\n]*\)/, msg: "usa la variable palabra en los print." }],
      };
    },
    hint: "Uno de los errores es del índice (siempre uno menos que la longitud) y el otro es cómo se llama a len().",
  },
  {
    id: "m3-d3", title: "Cortes y mayúsculas",
    gen: (r) => {
      const a = r.pick(["python", "codigo", "sistema", "teclado"]);
      const b = r.pick(["genial", "divertido", "facil", "poderoso"]);
      return {
        code: `frase = "${a} es ${b}"\nprint(frase[0:${a.length}].Upper())\nprint(frase[-${b.length}:0])`,
        fixed: `frase = "${a} es ${b}"\nprint(frase[0:${a.length}].upper())\nprint(frase[-${b.length}:])`,
        requires: [{ re: /print\([^\n]*frase\s*\[/, msg: "corta pedazos de la variable frase." }],
      };
    },
    hint: "Hay un error de mayúsculas en un método y otro en un corte que no llega al final.",
  },
];

// ---------------- Nivel 7 (extra): Reto con pruebas ocultas ----------------
const hidden = [
  {
    id: "m3-h1", title: "Primera, última y tamaño",
    gen: (r) => {
      const t = () => ({ pre: `palabra = "${r.pick(PALABRAS)}"` });
      return {
        prompt: "La variable <code>palabra</code> <b>ya existe</b>: no la escribas. Imprime, en tres líneas, su <b>primera letra</b>, su <b>última letra</b> y <b>cuántos caracteres</b> tiene. Tu programa se probará con palabras distintas.",
        starter: "# palabra ya existe. ¡No la borres!\n",
        solution: "print(palabra[0])\nprint(palabra[-1])\nprint(len(palabra))",
        tests: [t(), t(), t()],
        requires: [{ re: /palabra/, msg: "usa la variable palabra." }, { re: /len\(/, msg: "cuenta los caracteres con len()." }],
      };
    },
    hint: "palabra[0], palabra[-1] y len(palabra), cada uno en su propio print.",
  },
  {
    id: "m3-h2", title: "Apellido, Nombre",
    gen: (r) => {
      const t = () => ({ pre: `nombre = "${r.pick(NOMBRES_A).toLowerCase()}"\napellido = "${r.pick(APELLIDOS_A).toLowerCase()}"` });
      return {
        prompt: "Las variables <code>nombre</code> y <code>apellido</code> <b>ya existen</b> (en minúsculas). Imprime una línea con este formato: <code>APELLIDO, Nombre</code> (el apellido todo en mayúsculas y el nombre con la primera letra en mayúscula). Ejemplo: <code>RUIZ, Mateo</code>.",
        starter: "# nombre y apellido ya existen.\n",
        solution: 'print(apellido.upper() + ", " + nombre.title())',
        tests: [t(), t(), t()],
        requires: [{ re: /\.upper\(\)/, msg: "pon el apellido en mayúsculas con upper()." }, { re: /\.(title|capitalize)\(\)/, msg: "pon la primera letra del nombre en mayúscula." }],
      };
    },
    hint: "apellido.upper() y nombre.title(). Pégalos con una coma y un espacio entre medio: \", \".",
  },
  {
    id: "m3-h3", title: "Frase limpia",
    gen: (r) => {
      const t = () => ({ pre: `frase = "${" ".repeat(r.int(1, 3))}${r.pick(["hola mundo", "me encanta la arepa", "python es genial", "vamos a programar"])}${" ".repeat(r.int(1, 3))}"` });
      return {
        prompt: "La variable <code>frase</code> <b>ya existe</b> y tiene <b>espacios de más</b> al inicio y al final. Imprime la frase limpia y, en otra línea, cuántas veces aparece la letra <code>a</code>.",
        starter: "# frase ya existe.\n",
        solution: 'print(frase.strip())\nprint(frase.count("a"))',
        tests: [t(), t(), t()],
        requires: [{ re: /\.strip\(\)/, msg: "quita los espacios con strip()." }, { re: /\.count\(/, msg: "cuenta la letra con count()." }],
      };
    },
    hint: 'frase.strip() limpia los bordes y frase.count("a") cuenta las aes.',
  },
];

// ---------------- Nivel 8 (extra): Jefe de misión ----------------
const boss = [
  {
    id: "m3-j1", title: "El carné del colegio",
    gen: (r) => {
      const t = () => ({ pre: `nombre = "${r.pick(NOMBRES_A)}"\napellido = "${r.pick(APELLIDOS_A)}"\nciudad = "${r.pick(CIUDADES_A)}"` });
      return {
        prompt: "Ya existen <code>nombre</code>, <code>apellido</code> y <code>ciudad</code>. Escribe <b>exactamente</b> tres líneas:<pre class=\"console nosel\">Estudiante: SOFIA GOMEZ\nUsuario: sofgomez\nCiudad: Medellin</pre>El estudiante va en mayúsculas; el usuario son las <b>3 primeras letras del nombre</b> y el apellido, todo en minúsculas; la ciudad con la primera letra en mayúscula.",
        starter: "# nombre, apellido y ciudad ya existen.\n",
        solution: 'print("Estudiante:", nombre.upper(), apellido.upper())\nprint("Usuario: " + nombre[:3].lower() + apellido.lower())\nprint("Ciudad:", ciudad.title())',
        tests: [t(), t(), t()],
        requires: [{ re: /\.upper\(\)/, msg: "usa upper() para el estudiante." }, { re: /\[\s*0?\s*:\s*3\s*\]/, msg: "saca las 3 primeras letras del nombre con [:3]." }, { re: /\.title\(\)/, msg: "usa title() para la ciudad." }],
      };
    },
    hint: 'Estudiante: nombre.upper() y apellido.upper(). Usuario: nombre[:3].lower() pegado a apellido.lower() (sin espacio). Ciudad: ciudad.title().',
  },
  {
    id: "m3-j2", title: "Mensaje secreto",
    gen: (r) => {
      const t = () => ({ pre: `palabra = "${r.pick(PALABRAS)}"` });
      return {
        prompt: "La variable <code>palabra</code> ya existe. Imprime dos líneas: en la primera, la palabra en <b>MAYÚSCULAS</b>, un guion <code>-</code> y sus <b>2 primeras letras</b> (sin espacios); en la segunda, la palabra <b>al revés</b>. Ejemplo con \"gato\": <pre class=\"console nosel\">GATO-ga\notag</pre>",
        starter: "# palabra ya existe.\n",
        solution: 'print(palabra.upper() + "-" + palabra[:2])\nprint(palabra[::-1])',
        tests: [t(), t(), t()],
        requires: [{ re: /\.upper\(\)/, msg: "usa upper() para la primera línea." }, { re: /\[\s*:\s*:\s*-1\s*\]/, msg: "la palabra al revés se saca con [::-1]." }],
      };
    },
    hint: "Primera línea: palabra.upper() + \"-\" + palabra[:2]. Segunda línea: palabra[::-1].",
  },
];

const withType = (type, list) => list.map((x) => ({ ...x, type }));

export default {
  id: 3,
  emoji: "🔤",
  title: "Texto",
  subtitle: "comillas, índices, slicing y métodos",
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

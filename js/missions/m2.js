// Misión 2 — Números y operaciones (equivale a la Sección 4 del curso de referencia):
// int y float, + - * / // % **, jerarquía de operaciones, variables que se acumulan.
// Niveles 1 a 5 = ruta principal. Niveles 6 a 8 = extra opcional.

const dossier = [
  {
    title: "🔢 Números en Python",
    body: `<p>Python trabaja con dos clases de números:</p>
<ul>
<li><code>int</code>: números <b>enteros</b>, sin decimales: <code>7</code>, <code>-3</code>, <code>2026</code>.</li>
<li><code>float</code>: números <b>con decimales</b>. Se escriben con <b>punto</b>, no con coma: <code>3.5</code>, <code>0.25</code>.</li>
</ul>
<p>Los números <b>no llevan comillas</b>. Con comillas, Python los toma como texto.</p>`,
    example: `print(7)\nprint(3.5)\nprint(type(7))\nprint(type(3.5))`,
  },
  {
    title: "➕ Sumar, restar y multiplicar",
    body: `<p>Python es una calculadora muy poderosa. Para multiplicar se usa el asterisco <code>*</code> (no la letra x).</p>`,
    example: `print(8 + 5)\nprint(8 - 5)\nprint(8 * 5)`,
  },
  {
    title: "➗ Tres formas de dividir",
    body: `<p>Imagina que tienes <b>17 galletas</b> y las repartes entre <b>5 amigos</b>.</p>
<table class="mini-table">
<tr><th>Operador</th><th>¿Qué hace?</th><th>Con 17 y 5</th></tr>
<tr><td><code>/</code></td><td>división normal (siempre da decimales)</td><td><code>3.4</code></td></tr>
<tr><td><code>//</code></td><td>cuántas galletas le tocan a cada uno (división entera)</td><td><code>3</code></td></tr>
<tr><td><code>%</code></td><td>cuántas galletas <b>sobran</b> (el residuo)</td><td><code>2</code></td></tr>
</table>`,
    example: `print(17 / 5)\nprint(17 // 5)\nprint(17 % 5)`,
    after: `<p>💡 El <code>%</code> también sirve para saber si un número es par: si <code>n % 2</code> da <code>0</code>, ¡es par!</p>`,
  },
  {
    title: "💪 Potencias",
    body: `<p>Para elevar un número a una potencia se usan <b>dos asteriscos</b>: <code>**</code>. Por ejemplo, el área de un cuadrado de lado 4 es <code>4 ** 2</code>.</p>
<p>⚠️ No uses <code>^</code>: en Python hace otra cosa distinta y da resultados raros.</p>`,
    example: `print(4 ** 2)\nprint(2 ** 3)\nprint(2 ** 10)`,
  },
  {
    title: "🥇 Jerarquía: ¿quién va primero?",
    body: `<p>Cuando hay varias operaciones juntas, Python sigue este orden, igual que en matemáticas:</p>
<ol>
<li><b>Paréntesis</b> <code>( )</code></li>
<li><b>Potencias</b> <code>**</code></li>
<li><b>Multiplicar y dividir</b> <code>* / // %</code> (de izquierda a derecha)</li>
<li><b>Sumar y restar</b> <code>+ -</code> (de izquierda a derecha)</li>
</ol>
<p>Si quieres que algo se haga primero, ¡ponle paréntesis!</p>`,
    example: `print(2 + 3 * 4)\nprint((2 + 3) * 4)\nprint(2 + 3 ** 2)`,
  },
  {
    title: "📦 Operaciones con variables",
    body: `<p>Puedes hacer cuentas con las cajitas (variables). Y recuerda: <code>=</code> significa <b>"guarda"</b>. Por eso esto sí tiene sentido:</p>`,
    example: `puntos = 10\npuntos = puntos + 5\nprint(puntos)`,
    after: `<p>Lee la línea <code>puntos = puntos + 5</code> así: <i>"toma lo que hay en puntos, súmale 5 y guárdalo otra vez en puntos"</i>. Hay un atajo para escribirlo más corto:</p>`,
    example2: `monedas = 3\nmonedas += 2\nmonedas *= 10\nprint(monedas)`,
  },
  {
    title: "⚠️ Errores típicos (¡los vas a cazar!)",
    body: `<ul>
<li><b>Promedios sin paréntesis:</b> <code>a + b / 2</code> divide solo <code>b</code>. Lo correcto: <code>(a + b) / 2</code>.</li>
<li><b>La x no multiplica:</b> <code>3 x 4</code> es un SyntaxError. Usa <code>3 * 4</code>.</li>
<li><b>El sombrero no es potencia:</b> <code>5 ^ 2</code> no da 25. Usa <code>5 ** 2</code>.</li>
<li><b>Cuenta que no se guarda:</b> escribir solo <code>puntos + 5</code> no cambia nada. Hay que guardar: <code>puntos = puntos + 5</code>.</li>
<li><b>Dividir entre cero:</b> <code>5 / 0</code> da <i>ZeroDivisionError</i>. ¡Ni la calculadora puede!</li>
<li><b>Coma en vez de punto:</b> <code>3,5</code> no es un decimal en Python. Escribe <code>3.5</code>.</li>
</ul>`,
  },
];

// Tres notas enteras (1 a 5) cuya suma es múltiplo de 3, para que el promedio salga limpio.
function tresNotas(r) {
  for (let i = 0; i < 50; i++) {
    const n = [r.int(2, 5), r.int(2, 5), r.int(2, 5)];
    if ((n[0] + n[1] + n[2]) % 3 === 0 && new Set(n).size > 1) return n;
  }
  return [3, 4, 5];
}
// Pareja a, b donde a // b y a % b dan resultados distintos y hay sobrante.
function parejaDivision(r) {
  for (let i = 0; i < 50; i++) {
    const b = r.int(3, 9);
    const a = r.int(2, 9) * b + r.int(1, b - 1);
    if (Math.floor(a / b) !== a % b) return [a, b];
  }
  return [17, 5];
}

// ---------------- Nivel 1: Predice la salida ----------------
const predict = [
  {
    id: "m2-p1", title: "Sumas y restas",
    gen: (r) => ({ code: `a = ${r.int(10, 50)}\nb = ${r.int(1, 9)}\nprint(a + b)\nprint(a - b)` }),
    hint: "Reemplaza a y b por sus números y haz cada cuenta.",
  },
  {
    id: "m2-p2", title: "Cuenta de la tienda",
    gen: (r) => ({ code: `precio = ${r.int(2, 9) * 500}\ncantidad = ${r.int(2, 6)}\nprint(precio * cantidad)` }),
    hint: "El asterisco * multiplica.",
  },
  {
    id: "m2-p3", title: "División normal",
    gen: (r) => {
      const b = r.pick([2, 4, 5]);
      return { code: `a = ${b * r.int(2, 9) + r.int(1, b - 1)}\nb = ${b}\nprint(a / b)` };
    },
    hint: "La división con / siempre da un número con punto decimal, aunque sea exacta.",
  },
  {
    id: "m2-p4", title: "Cociente y sobrante",
    gen: (r) => {
      const [a, b] = parejaDivision(r);
      return { code: `a = ${a}\nb = ${b}\nprint(a // b)\nprint(a % b)` };
    },
    hint: "// dice cuántas veces cabe b en a. % dice cuánto sobra.",
  },
  {
    id: "m2-p5", title: "Jerarquía con paréntesis",
    gen: (r) => {
      const [a, b, c] = [r.int(2, 9), r.int(2, 9), r.int(2, 9)];
      return { code: `a = ${a}\nb = ${b}\nc = ${c}\nprint(a + b * c)\nprint((a + b) * c)` };
    },
    hint: "Primero lo que está entre paréntesis, luego * y /, al final + y -.",
  },
  {
    id: "m2-p6", title: "La cajita se acumula",
    gen: (r) => {
      const v = r.pick(["monedas", "puntos", "goles", "estrellas"]);
      return { code: `${v} = ${r.int(2, 9)}\n${v} = ${v} + ${r.int(2, 9)}\n${v} += ${r.int(2, 9)}\n${v} = ${v} * 2\nprint(${v})` };
    },
    hint: "Ve línea por línea y anota cuánto vale la variable después de cada una.",
  },
];

// ---------------- Nivel 2: Completa el hueco ----------------
const fill = [
  {
    id: "m2-f1", title: "El operador de multiplicar",
    gen: (r) => {
      const a = r.int(3, 6), b = r.int(7, 9);
      return { code: `a = ${a}\nb = ${b}\nprint(a ___ b)`, answer: "*" };
    },
    hint: "Mira la salida esperada. ¿Qué operación de 2 números da ese resultado?",
  },
  {
    id: "m2-f2", title: "¿Cuánto sobra?",
    gen: (r) => {
      const [a, b] = parejaDivision(r);
      return { code: `galletas = ${a}\namigos = ${b}\nprint(galletas ___ amigos)`, answer: "%" };
    },
    hint: "Hay un operador que da el sobrante de una división.",
  },
  {
    id: "m2-f3", title: "División sin decimales",
    gen: (r) => {
      const [a, b] = parejaDivision(r);
      return { code: `a = ${a}\nb = ${b}\nprint(a ___ b)`, answer: "//" };
    },
    hint: "La salida no tiene punto decimal: es una división entera.",
  },
  {
    id: "m2-f4", title: "Área de un cuadrado",
    gen: (r) => ({ code: `lado = ${r.int(3, 9)}\nprint(lado ___ 2)`, answer: "**" }),
    hint: "Elevar al cuadrado se escribe con dos asteriscos.",
  },
  {
    id: "m2-f5", title: "El número que falta",
    gen: (r) => {
      const a = r.int(2, 9), x = r.int(2, 9), c = r.int(2, 9);
      return { code: `total = ${a} + ___ * ${c}\nprint(total)`, answer: String(x), accept: [String(x)] , _total: a + x * c };
    },
    hint: "Primero se hace la multiplicación. Pregúntate: ¿qué número por el factor, más el primero, da el total?",
  },
  {
    id: "m2-f6", title: "Los paréntesis salvan el día",
    gen: (r) => {
      const [a, b, c] = [r.int(2, 6), r.int(2, 6), r.int(2, 6)];
      return { code: `a = ${a}\nb = ${b}\nc = ${c}\nprint(___ * c)`, answer: "(a + b)" };
    },
    hint: "Se quiere sumar a + b primero y después multiplicar por c.",
  },
];

// ---------------- Nivel 3: Ordena las líneas ----------------
const parsons = [
  {
    id: "m2-o1", title: "Área del rectángulo",
    gen: (r) => ({ lines: [`base = ${r.int(3, 12)}`, `altura = ${r.int(2, 9)}`, `area = base * altura`, `print("El área es", area)`] }),
    hint: "Primero se crean base y altura, luego se calcula el área, al final se imprime.",
  },
  {
    id: "m2-o2", title: "Precio con descuento",
    gen: (r) => ({ lines: [`precio = ${r.int(5, 20) * 1000}`, `descuento = ${r.int(1, 4) * 500}`, `total = precio - descuento`, `print("Pagas", total)`] }),
    hint: "Una variable debe existir antes de usarla en una cuenta.",
  },
  {
    id: "m2-o3", title: "Reparto de galletas",
    gen: (r) => {
      const [a, b] = parejaDivision(r);
      return { lines: [`galletas = ${a}`, `amigos = ${b}`, `print("Cada uno recibe", galletas // amigos)`, `print("Sobran", galletas % amigos)`] };
    },
    hint: "Mira la salida esperada: primero lo que recibe cada uno, luego lo que sobra.",
  },
  {
    id: "m2-o4", title: "Puntos que suben",
    gen: (r) => {
      const a = r.int(5, 20), b = r.int(2, 9);
      return { lines: [`puntos = ${a}`, `puntos = puntos + ${b}`, `print(puntos)`, `puntos = puntos * 2`, `print(puntos)`] };
    },
    hint: "Cada print muestra el valor que tiene la variable en ese momento.",
  },
];

// ---------------- Nivel 4: Caza el bug ----------------
const bug = [
  {
    id: "m2-b1", title: "Promedio roto",
    gen: (r) => {
      const a = r.int(2, 5), b = r.int(2, 5) * 2;
      return {
        code: `n1 = ${a}\nn2 = ${b}\npromedio = n1 + n2 / 2\nprint(promedio)`,
        fixed: `n1 = ${a}\nn2 = ${b}\npromedio = (n1 + n2) / 2\nprint(promedio)`,
        requires: [{ re: /promedio\s*=[^\n]*n1[^\n]*n2|promedio\s*=[^\n]*n2[^\n]*n1/, msg: "calcula el promedio con las variables n1 y n2." }],
      };
    },
    hint: "La división se hace antes que la suma. ¿Qué necesitas para que primero se sume?",
  },
  {
    id: "m2-b2", title: "Galletas sin decimales",
    gen: (r) => {
      const [a, b] = parejaDivision(r);
      return {
        code: `galletas = ${a}\namigos = ${b}\nprint("A cada uno le tocan", galletas / amigos)`,
        fixed: `galletas = ${a}\namigos = ${b}\nprint("A cada uno le tocan", galletas // amigos)`,
        requires: [{ re: /print\([^\n]*galletas[^\n]*amigos/, msg: "usa las variables galletas y amigos." }],
      };
    },
    hint: "Nadie puede recibir media galleta decimal... Usa la división entera.",
  },
  {
    id: "m2-b3", title: "El sombrero no es potencia",
    gen: (r) => {
      const l = r.int(3, 9);
      return {
        code: `lado = ${l}\nprint("Área:", lado ^ 2)`,
        fixed: `lado = ${l}\nprint("Área:", lado ** 2)`,
        requires: [{ re: /print\([^\n]*lado/, msg: "usa la variable lado." }],
      };
    },
    hint: "En Python la potencia se escribe con dos asteriscos.",
  },
  {
    id: "m2-b4", title: "La x que no multiplica",
    gen: (r) => {
      const p = r.int(2, 9) * 500, q = r.int(2, 6);
      return {
        code: `precio = ${p}\ncantidad = ${q}\nprint("Total:", precio x cantidad)`,
        fixed: `precio = ${p}\ncantidad = ${q}\nprint("Total:", precio * cantidad)`,
        requires: [{ re: /print\([^\n]*precio[^\n]*cantidad/, msg: "usa las variables precio y cantidad." }],
      };
    },
    hint: "Para multiplicar Python usa un asterisco.",
  },
];

// ---------------- Nivel 5: Compilador guiado ----------------
const code = [
  {
    id: "m2-c1", title: "Área del rectángulo",
    gen: (r) => {
      const b = r.int(3, 15), h = r.int(2, 9);
      return {
        prompt: `Crea las variables <code>base = ${b}</code> y <code>altura = ${h}</code>. Calcula el <code>area</code> (base por altura) y imprímela.`,
        solution: `base = ${b}\naltura = ${h}\narea = base * altura\nprint(area)`,
        requires: [
          { re: /base\s*=/, msg: "crea la variable base." },
          { re: /altura\s*=/, msg: "crea la variable altura." },
          { re: /\*/, msg: "calcula el área multiplicando variables." },
        ],
      };
    },
    hint: "area = base * altura  y luego print(area)",
  },
  {
    id: "m2-c2", title: "Promedio de tres notas",
    gen: (r) => {
      const [a, b, c] = tresNotas(r);
      return {
        prompt: `Tus notas son <code>n1 = ${a}</code>, <code>n2 = ${b}</code> y <code>n3 = ${c}</code>. Calcula e imprime el promedio. <i>(Python lo mostrará con ".0": es normal.)</i>`,
        solution: `n1 = ${a}\nn2 = ${b}\nn3 = ${c}\npromedio = (n1 + n2 + n3) / 3\nprint(promedio)`,
        requires: [
          { re: /n1\s*=/, msg: "crea n1, n2 y n3." },
          { re: /\([^)]*\)\s*\/\s*3/, msg: "suma las notas entre paréntesis y divide entre 3." },
        ],
      };
    },
    hint: "promedio = (n1 + n2 + n3) / 3 — ¡con paréntesis!",
  },
  {
    id: "m2-c3", title: "Galletas para todos",
    gen: (r) => {
      const [a, b] = parejaDivision(r);
      return {
        prompt: `Hay <code>galletas = ${a}</code> y <code>amigos = ${b}</code>. Imprime en una línea cuántas galletas recibe cada uno y en otra línea cuántas sobran (solo los números).`,
        solution: `galletas = ${a}\namigos = ${b}\nprint(galletas // amigos)\nprint(galletas % amigos)`,
        requires: [
          { re: /\/\//, msg: "usa // para lo que recibe cada uno." },
          { re: /%/, msg: "usa % para lo que sobra." },
        ],
      };
    },
    hint: "print(galletas // amigos) y print(galletas % amigos)",
  },
  {
    id: "m2-c4", title: "La cuenta del restaurante",
    gen: (r) => {
      const p = r.int(8, 20) * 1000, n = r.int(2, 6), t = r.int(1, 5) * 1000;
      return {
        prompt: `Cada plato cuesta <code>plato = ${p}</code>. Van <code>personas = ${n}</code> y dejan <code>propina = ${t}</code>. Calcula e imprime el <code>total</code> (platos de todos más la propina).`,
        solution: `plato = ${p}\npersonas = ${n}\npropina = ${t}\ntotal = plato * personas + propina\nprint(total)`,
        requires: [
          { re: /\*/, msg: "multiplica el plato por las personas." },
          { re: /\+/, msg: "suma la propina." },
          { re: /print\([^\n]*total/, msg: "guarda el resultado en total e imprímelo." },
        ],
      };
    },
    hint: "total = plato * personas + propina",
  },
];

// ---------------- Nivel 6 (extra): Bug difícil — DOS errores por programa ----------------
const bugHard = [
  {
    id: "m2-d1", title: "El triángulo con dos errores",
    gen: (r) => {
      const b = r.int(3, 14), h = r.int(2, 9);
      return {
        code: `base = ${b}\naltura = ${h}\narea = base x altura / 2\nprint("Área del triángulo:", Area)`,
        fixed: `base = ${b}\naltura = ${h}\narea = base * altura / 2\nprint("Área del triángulo:", area)`,
        requires: [{ re: /print\([^\n]*area/, msg: "imprime la variable area." }],
      };
    },
    hint: "Hay un error en la línea 3 y otro en la línea 4. Revisa cómo se multiplica y las mayúsculas.",
  },
  {
    id: "m2-d2", title: "Puntos que no se guardan",
    gen: (r) => {
      const a = r.int(2, 9), b = r.int(2, 9);
      return {
        code: `puntos = ${a}\npuntos + ${b}\npuntos = puntos ^ 2\nprint("Puntos al cuadrado:", puntos)`,
        fixed: `puntos = ${a}\npuntos = puntos + ${b}\npuntos = puntos ** 2\nprint("Puntos al cuadrado:", puntos)`,
        requires: [{ re: /puntos\s*=\s*puntos\s*\+|puntos\s*\+=/, msg: "guarda la suma dentro de puntos." }],
      };
    },
    hint: "Una cuenta suelta no se guarda, y el sombrero ^ no es la potencia.",
  },
  {
    id: "m2-d3", title: "Promedio y sobrante",
    gen: (r) => {
      const [x, y, z] = tresNotas(r);
      const [a, b] = parejaDivision(r);
      return {
        code: `n1 = ${x}\nn2 = ${y}\nn3 = ${z}\nprint("Promedio:", n1 + n2 + n3 / 3)\nprint("Sobran:", ${a} // ${b})`,
        fixed: `n1 = ${x}\nn2 = ${y}\nn3 = ${z}\nprint("Promedio:", (n1 + n2 + n3) / 3)\nprint("Sobran:", ${a} % ${b})`,
        requires: [{ re: /print\([^\n]*n1[^\n]*n2[^\n]*n3/, msg: "el promedio debe usar n1, n2 y n3." }],
      };
    },
    hint: "Uno de los errores es de paréntesis y el otro es de operador: el sobrante no se calcula con //.",
  },
];

// ---------------- Nivel 7 (extra): Reto con pruebas ocultas ----------------
// Tu programa se prueba con valores distintos para las variables que ya existen.
const hidden = [
  {
    id: "m2-h1", title: "Perímetro del rectángulo",
    gen: (r) => {
      const t = () => ({ pre: `base = ${r.int(2, 20)}\naltura = ${r.int(2, 20)}` });
      return {
        prompt: "Las variables <code>base</code> y <code>altura</code> <b>ya existen</b>: no las escribas. Imprime el <b>perímetro</b> del rectángulo (la suma de sus 4 lados). Tu programa se probará con valores distintos.",
        starter: "# base y altura ya existen. ¡No las borres!\n",
        solution: "print(2 * (base + altura))",
        tests: [t(), t(), t()],
        requires: [{ re: /base/, msg: "usa la variable base." }, { re: /altura/, msg: "usa la variable altura." }],
      };
    },
    hint: "El perímetro es 2 × (base + altura).",
  },
  {
    id: "m2-h2", title: "Dulces en bolsas",
    gen: (r) => {
      const t = () => { const b = r.int(3, 9); return { pre: `dulces = ${r.int(3, 9) * b + r.int(1, b - 1)}\nbolsas = ${b}` }; };
      return {
        prompt: "Las variables <code>dulces</code> y <code>bolsas</code> <b>ya existen</b>. Reparte los dulces en partes iguales: imprime cuántos dulces van en cada bolsa y, en otra línea, cuántos dulces sobran (solo los números).",
        starter: "# dulces y bolsas ya existen. ¡No las borres!\n",
        solution: "print(dulces // bolsas)\nprint(dulces % bolsas)",
        tests: [t(), t(), t()],
        requires: [{ re: /\/\//, msg: "usa // para lo que va en cada bolsa." }, { re: /%/, msg: "usa % para lo que sobra." }],
      };
    },
    hint: "// para cada bolsa y % para lo que sobra.",
  },
  {
    id: "m2-h3", title: "Edad en meses y semanas",
    gen: (r) => {
      const t = () => ({ pre: `anios = ${r.int(10, 17)}` });
      return {
        prompt: "La variable <code>anios</code> <b>ya existe</b>. Imprime, en dos líneas, cuántos <b>meses</b> y cuántas <b>semanas</b> aproximadas tiene esa edad (usa 12 meses por año y 52 semanas por año).",
        starter: "# anios ya existe. ¡No la borres!\n",
        solution: "print(anios * 12)\nprint(anios * 52)",
        tests: [t(), t(), t()],
        requires: [{ re: /anios/, msg: "usa la variable anios." }],
      };
    },
    hint: "Meses: anios * 12. Semanas: anios * 52.",
  },
];

// ---------------- Nivel 8 (extra): Jefe de misión ----------------
const boss = [
  {
    id: "m2-j1", title: "El recibo de la tienda",
    gen: (r) => {
      const t = () => { const p = r.int(2, 9) * 500, q = r.int(2, 6); return { pre: `precio_unitario = ${p}\ncantidad = ${q}\ndinero = ${p * q + r.int(1, 8) * 1000}` }; };
      return {
        prompt: "Ya existen <code>precio_unitario</code>, <code>cantidad</code> y <code>dinero</code> (lo que pagas). Calcula el <code>subtotal</code> y el <code>cambio</code> y escribe <b>exactamente</b> dos líneas:<pre class=\"console nosel\">Subtotal: 3000\nCambio: 2000</pre>(los números cambian según los datos).",
        starter: "# precio_unitario, cantidad y dinero ya existen.\n",
        solution: "subtotal = precio_unitario * cantidad\ncambio = dinero - subtotal\nprint(\"Subtotal:\", subtotal)\nprint(\"Cambio:\", cambio)",
        tests: [t(), t(), t()],
        requires: [{ re: /\*/, msg: "multiplica precio_unitario por cantidad." }, { re: /-/, msg: "resta el subtotal al dinero." }],
      };
    },
    hint: "subtotal = precio_unitario * cantidad; cambio = dinero - subtotal. Luego dos print con \"Subtotal:\" y \"Cambio:\".",
  },
  {
    id: "m2-j2", title: "De segundos a reloj",
    gen: (r) => {
      const t = () => ({ pre: `total = ${r.int(1, 5) * 3600 + r.int(1, 59) * 60 + r.int(1, 59)}` });
      return {
        prompt: "La variable <code>total</code> son segundos y ya existe. Imprime una línea con este formato: <code>H horas, M minutos y S segundos</code>. Ejemplo para 3725: <code>1 horas, 2 minutos y 5 segundos</code>. (1 hora = 3600 segundos y 1 minuto = 60 segundos).",
        starter: "# total ya existe (en segundos).\n",
        solution: "horas = total // 3600\nresto = total % 3600\nminutos = resto // 60\nsegundos = resto % 60\nprint(horas, \"horas,\", minutos, \"minutos y\", segundos, \"segundos\")",
        tests: [t(), t(), t()],
        requires: [{ re: /\/\//, msg: "usa // para sacar las horas y los minutos." }, { re: /%/, msg: "usa % para el resto." }],
      };
    },
    hint: "Horas = total // 3600. Lo que sobra (% 3600) lo vuelves a dividir: minutos con // 60 y segundos con % 60.",
  },
];

const withType = (type, list) => list.map((x) => ({ ...x, type }));

export default {
  id: 2,
  emoji: "🔢",
  title: "Números y operaciones",
  subtitle: "+ - * / // % ** y jerarquía",
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

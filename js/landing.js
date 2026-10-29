// Portada pública del curso (se genera con landing/a-sitio.py desde landing/plantilla.html).
export const LANDING_HTML = `<header class="l-top">
  <div class="l-wrap">
    <a href="#inicio" data-go="inicio" aria-label="Ser School, inicio"><img class="l-logo" src="img/logo-ser-school.png" alt="Ser School"></a>
    <nav class="l-links" aria-label="Secciones">
      <a href="#curso" data-go="curso">El curso</a>
      <a href="#misiones" data-go="misiones">Misiones</a>
      <a href="#juego" data-go="juego">Puntos y premios</a>
      <a href="#honti" data-go="honti">Honti</a>
    </nav>
    <a class="l-btn l-primary l-small" href="#entrar" data-go="entrar">Iniciar sesión</a>
  </div>
</header>

<main id="inicio">
  <section class="l-hero">
    <div class="l-wrap">
      <div>
        <p class="l-eyebrow">Python · Grado 9° · 5 semanas</p>
        <h1>Aprende Python <span class="l-mark">practicando</span>, un paso a la vez.</h1>
        <p class="l-lead">Un curso hecho para ti: ejercicios cortos, bugs por cazar, un compilador de verdad y puntos que se convierten en premios. Al final construyes tu propio asistente con inteligencia artificial.</p>
        <div class="l-cta">
          <a class="l-btn l-primary" href="#entrar" data-go="entrar">Iniciar sesión</a>
          <a class="l-btn l-ghost" href="#curso" data-go="curso">Cómo funciona</a>
        </div>
        <div class="l-facts">
          <span class="l-pill">8 misiones</span>
          <span class="l-pill">Cientos de ejercicios</span>
          <span class="l-pill">Compilador real</span>
          <span class="l-pill">Con tu correo del colegio</span>
        </div>
      </div>
      <div class="l-art">
        <div class="l-bubble">¡Hola! Soy Honti 🐾</div>
        <img src="img/honti.png" alt="Honti, el perro del colegio, con gorra y buzo, guiñando el ojo con el pulgar arriba">
      </div>
    </div>
  </section>


  <section class="l-block" id="entrar">
    <div class="l-wrap">
      <div class="l-card l-entry">
        <p class="l-eyebrow">Estudiantes y docentes</p>
        <h2>Entra a tu curso</h2>
        <p>Inicia sesión con tu correo del colegio (<b>@serschool.edu.co</b>). Tu progreso se guarda solo.</p>
        <div id="gbtn"></div>
        <div id="entry-msg"></div>
      </div>
    </div>
  </section>

  <section class="l-block" id="curso">
    <div class="l-wrap">
      <p class="l-eyebrow">Sobre el curso</p>
      <h2>Programar se aprende haciendo.</h2>
      <p class="l-sub">Nada de leer páginas y páginas. Cada misión empieza con una ficha corta y sigue con ejercicios que puedes resolver en pocos minutos. Si te equivocas, pruebas otra vez: así se aprende.</p>
      <div class="l-grid l-g3">
        <div class="l-card"><div class="l-ic">⏱️</div><h3>Ejercicios cortos</h3><p>Cada uno cabe en unos minutos. Hay muchas versiones del mismo ejercicio con datos distintos, para que lo practiques hasta dominarlo.</p></div>
        <div class="l-card"><div class="l-ic">🎯</div><h3>Siempre sabes dónde vas</h3><p>Ves tu meta con claridad: «ejercicio 7 de 24». Nunca haces cosas sin saber cuánto falta.</p></div>
        <div class="l-card"><div class="l-ic">💡</div><h3>Pistas que te ayudan</h3><p>Si te trabas, pides una pista por pasos. Y si de verdad no sale, pides ayuda a tu profe con un botón.</p></div>
        <div class="l-card"><div class="l-ic">💻</div><h3>Python de verdad</h3><p>Escribes y ejecutas código real en el navegador. No necesitas instalar nada: funciona hasta en el Chromebook.</p></div>
        <div class="l-card"><div class="l-ic">🌱</div><h3>Para todos los ritmos</h3><p>Letra grande, alto contraste, lectura en voz alta y fuente fácil de leer. Cada quien avanza a su paso.</p></div>
        <div class="l-card"><div class="l-ic">👩‍🏫</div><h3>Tu profe te acompaña</h3><p>Ve tu progreso, tus medallas y cuándo necesitas apoyo, para ayudarte justo donde lo necesitas.</p></div>
      </div>
    </div>
  </section>

  <section class="l-block l-band" id="misiones">
    <div class="l-wrap">
      <p class="l-eyebrow">Qué haces en cada misión</p>
      <h2>Cada misión tiene niveles, y cada nivel un tipo de reto.</h2>
      <p class="l-sub">Empiezas leyendo, luego predices, completas, ordenas, cazas bugs y escribes tu propio código. Los niveles extra son para quienes quieren más.</p>
      <div class="l-levels">
        <div class="l-lv"><h3>Predice la salida</h3><p>Lees un programa y adivinas qué va a imprimir. Así aprendes a «pensar como Python».</p></div>
        <div class="l-lv"><h3>Completa el hueco</h3><p>Al código le falta una pieza. Tú la pones.</p></div>
        <div class="l-lv"><h3>Ordena las líneas</h3><p>Las líneas están revueltas. Ponlas en el orden correcto.</p></div>
        <div class="l-lv"><h3>Caza el bug</h3><p>El programa tiene un error escondido. Encuéntralo y arréglalo.</p></div>
        <div class="l-lv"><h3>Compilador guiado</h3><p>Escribes tu programa y se ejecuta de verdad. Se prueba con distintos datos.</p></div>
        <div class="l-lv l-extra"><h3>Bug difícil</h3><p>Aquí cada programa tiene dos errores.</p></div>
        <div class="l-lv l-extra"><h3>Pruebas ocultas</h3><p>Tu programa debe funcionar con valores que aún no has visto.</p></div>
        <div class="l-lv l-extra"><h3>Jefe de misión</h3><p>El reto final de la misión. ¡Tú puedes!</p></div>
      </div>
    </div>
  </section>

  <section class="l-block">
    <div class="l-wrap">
      <p class="l-eyebrow">La ruta de 5 semanas</p>
      <h2>8 misiones y un proyecto final.</h2>
      <p class="l-sub">Empiezas por lo más básico y cada misión se apoya en la anterior.</p>
      <div class="l-path">
        <div class="l-step"><b>1</b><div>Primeros pasos<span>print, variables y tipos</span></div></div>
        <div class="l-step"><b>2</b><div>Números y operaciones<span>sumar, dividir y más</span></div></div>
        <div class="l-step"><b>3</b><div>Trabajar con texto<span>cadenas y sus trucos</span></div></div>
        <div class="l-step"><b>4</b><div>Hablar con el usuario<span>input() y f-strings</span></div></div>
        <div class="l-step"><b>5</b><div>Decisiones<span>if / elif / else</span></div></div>
        <div class="l-step"><b>6</b><div>Listas<span>guardar muchos datos</span></div></div>
        <div class="l-step"><b>7</b><div>Repetir<span>for, range y while</span></div></div>
        <div class="l-step"><b>8</b><div>Funciones<span>def, parámetros y return</span></div></div>
        <div class="l-step l-final"><b>★</b><div>Proyecto final<span>tu propio asistente con IA</span></div></div>
      </div>
    </div>
  </section>

  <section class="l-block" id="juego">
    <div class="l-wrap">
      <p class="l-eyebrow">Gamificación</p>
      <h2>Juegas mientras aprendes.</h2>
      <p class="l-sub">Cada ejercicio resuelto te da puntos. Con ellos subes de rango, ganas medallas, personalizas tu avatar y llegas a premios reales.</p>
      <div class="l-grid l-g4">
        <div class="l-card"><div class="l-ic">⭐</div><h3>Puntos</h3><p>Más puntos por resolver sin pistas, al primer intento y por cazar bugs.</p></div>
        <div class="l-card"><div class="l-ic">🏅</div><h3>Insignias</h3><p>Cazabugs, en racha, programador… Cada logro tiene su medalla.</p></div>
        <div class="l-card"><div class="l-ic">🐶</div><h3>Tu avatar</h3><p>Personaliza a Honti con fondos y accesorios que se desbloquean al subir de rango.</p></div>
        <div class="l-card"><div class="l-ic">📤</div><h3>Compártelo</h3><p>Crea una tarjeta con tu apodo, rango y medallas para mostrarla a tus amigos.</p></div>
      </div>
      <div class="l-ranks" aria-label="Rangos de práctica">
        <span class="l-rank"><i>1</i>Manantial</span>
        <span class="l-rank"><i>2</i>Arroyo</span>
        <span class="l-rank"><i>3</i>Río</span>
        <span class="l-rank"><i>4</i>Cascada</span>
        <span class="l-rank"><i>5</i>Océano</span>
      </div>
      <div class="l-grid l-g3" style="margin-top:28px">
        <div class="l-card"><div class="l-ic">🍫</div><h3>Chocolatina Jet</h3><p>Una chocolatina pequeña para quien llegue a la meta de puntos.</p></div>
        <div class="l-card"><div class="l-ic">🎟️</div><h3>Vale «competente»</h3><p>Un comodín para mejorar un bajo progreso. Solo uno, y se gana de verdad: tu profe lo revisa.</p></div>
        <div class="l-card"><div class="l-ic">🎉</div><h3>Clase libre</h3><p>Premio de todo el grupo: se gana cuando el promedio del curso llega a la meta.</p></div>
      </div>
    </div>
  </section>

  <section class="l-block">
    <div class="l-wrap">
      <div class="l-honti-box" id="honti">
        <img src="img/honti-cabeza.png" alt="Honti">
        <div>
          <p class="l-eyebrow">Práctica con IA</p>
          <h2>Honti te orienta.</h2>
          <p>En el Laboratorio, Honti te ayuda a practicar con ejercicios hechos para tu nivel.</p>
          <ul>
            <li>Empieza con una prueba corta para ubicarte en tu rango.</li>
            <li>Si lo haces bien, te propone ejercicios más difíciles que dan más puntos.</li>
            <li>Si te cuesta, baja un poco la dificultad para que vuelvas a ganar confianza.</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <section class="l-block l-band">
    <div class="l-wrap">
      <p class="l-eyebrow">Evaluación justa</p>
      <h2>Exámenes cortos, y cada quien con lo suyo.</h2>
      <p class="l-sub">Cada cierto número de ejercicios hay un checkpoint, y al terminar cada misión, un examen final.</p>
      <div class="l-grid l-g3">
        <div class="l-card"><div class="l-ic">📝</div><h3>Preguntas distintas</h3><p>Cada estudiante recibe preguntas con datos diferentes. Lo que aprendiste es lo que cuenta.</p></div>
        <div class="l-card"><div class="l-ic">🖥️</div><h3>Pantalla completa</h3><p>El examen se hace sin salir de la pantalla. Si te sales, se bloquea y solo tu profe puede reabrirlo.</p></div>
        <div class="l-card"><div class="l-ic">🔒</div><h3>Sin copiar y pegar</h3><p>Todo el trabajo es tuyo. El curso avisa a tu profe si hay salidas de la pestaña o inactividad.</p></div>
      </div>
    </div>
  </section>

  <section class="l-cta-final">
    <div class="l-wrap">
      <h2>¿Listo para dejar tu <span class="l-mark">huella</span> en el código?</h2>
      <p>Entra con tu correo del colegio y continúa donde te quedaste. Tu progreso se guarda solo.</p>
      <a class="l-btn l-primary" href="#entrar" data-go="entrar">Iniciar sesión</a>
    </div>
  </section>
</main>

<footer>
  <div class="l-wrap">
    <img class="l-logo" src="img/logo-ser-school.png" alt="Ser School">
    <span>Python Practicando 9° · Ser School</span>
  </div>
</footer>`;

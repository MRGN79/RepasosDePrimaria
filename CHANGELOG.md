# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.0.0/)
y el proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Cuentas y guardado en la nube (dos tipos de cuenta).** La app admite ahora
  dos formas de acceso que conviven: una **cuenta de madre, padre o tutor**
  (con correo y contraseña o con Google) que gestiona uno o varios **perfiles de
  hijo** —con un selector "¿quién juega?" y un **PIN** de 4 cifras, que se queda
  solo en el dispositivo, cuando hay más de un perfil—; y una **cuenta de niño**
  con su propia cuenta de Google (pensada para cuentas supervisadas por Family
  Link), que entra directamente a elegir curso. En el alta con Google se pregunta
  de forma explícita si la cuenta es de la persona adulta o del niño, y la opción
  "soy adulto" pide resolver una operación sencilla como comprobación.
- **El progreso viaja con la cuenta.** El progreso de cada perfil (racha,
  estrellas, medallas, misión diaria y avance por materia) se guarda en la nube
  en región europea y funciona **sin conexión**: se puede jugar sin red y se
  sincroniza al reconectar. Sin cuenta configurada, la app sigue funcionando por
  completo en el dispositivo, como hasta ahora.
- **Privacidad por diseño.** De las cuentas de Google solo se usa el
  identificador de sesión: nunca se guardan el correo, el nombre ni la foto. El
  avatar y el apodo salen de una lista cerrada, sin texto libre que identifique
  al niño.
- **El progreso de antes de tener cuenta se traslada solo a la nube.** Si el
  niño llevaba tiempo jugando sin cuenta y después un adulto crea la suya, todo
  ese avance (racha, estrellas, medallas, misión diaria y el progreso de cada
  curso jugado en el dispositivo) se traslada **automáticamente y sin perder
  nada** a la nube al crear el primer perfil. Antes de que ocurra, la pantalla de
  creación del perfil avisa de que ese progreso se va a guardar en la cuenta. El
  traslado se hace en segundo plano —el niño puede seguir jugando mientras
  tanto— y, si en algún momento no hay conexión, el avance permanece intacto en
  el dispositivo y termina de guardarse en cuanto vuelve la red.
- **Cambio de cuenta de adulto en el mismo dispositivo.** Desde Ajustes, un
  adulto puede cerrar su sesión y entrar con otra cuenta —por ejemplo, si dos
  familias comparten la misma tablet—. El cambio pide primero una comprobación
  para personas adultas y una confirmación, y **no borra nada**: el progreso de
  cada niño sigue a salvo en la nube.
- **Contenido de 2.º de Primaria (primer paquete).** Al elegir el curso de 2.º,
  las cinco materias muestran ya actividades reales (antes aparecían como
  "Pronto"), alineadas al currículo oficial de 2.º: en Matemáticas, números hasta
  100, sumas y restas sin llevar y las tablas del 2, el 5 y el 10; en Lengua,
  sílabas, mayúsculas y singular/plural; en Natural Science, los sentidos, el
  cuerpo humano y los animales; en Sociales, la familia, el colegio y el barrio;
  y en English, los números 1–20, los colores y las mascotas. Es un primer
  paquete que se ampliará más adelante, igual que se hizo con 3.º.
- El progreso, la racha y la misión diaria de cada curso siguen siendo
  independientes: las actividades de 2.º y de 3.º nunca se mezclan.
- **Primer contenido de 1.º, 4.º, 5.º y 6.º de Primaria (paquete ligero).** Los
  cuatro cursos que quedaban dejan de aparecer como "Pronto" y ofrecen ya, en cada
  una de las cinco materias, un tema jugable alineado al currículo oficial de cada
  curso: en 1.º, sumas hasta 10, las vocales, seres vivos y no vivos, las
  estaciones y los saludos en inglés; en 4.º, la multiplicación por dos cifras,
  los tiempos verbales, las cadenas alimentarias, el ciclo del agua y la familia
  en inglés; en 5.º, los números decimales, sujeto y predicado, el aparato
  circulatorio, el clima y las rutinas diarias; y en 6.º, los porcentajes, los
  diptongos e hiatos, la energía y sus fuentes, la Unión Europea y la comida en
  inglés. Es un primer paquete pensado para poder navegar y probar todos los
  cursos; se ampliará más adelante, igual que en 2.º y 3.º.

- **Política de privacidad** accesible desde Ajustes, en español e inglés.
  Explica en lenguaje claro qué datos se guardan (la cuenta del adulto y el
  progreso de cada perfil de hijo, sin ningún dato que identifique al niño), en
  qué se basa el consentimiento del adulto responsable, dónde residen los datos
  (progreso en región europea) y qué derechos tiene el usuario.
- Aviso sobre el origen del contenido: el pie de página indica que las
  preguntas son de elaboración propia basadas en el currículo oficial, y el
  README incluye el aviso legal completo en español e inglés.
- Fichero `LICENSE`: todos los derechos reservados. Uso gratuito de la
  aplicación desplegada para fines personales, educativos y no comerciales;
  reutilización del código o del contenido sujeta a autorización previa.
- **La aplicación pasa a ser una app instalable en Android**, empaquetada con
  Capacitor sobre la misma aplicación existente. Se añade el proyecto Android
  nativo y el manejo del botón "atrás" del dispositivo (fuera de la pantalla de
  inicio vuelve a inicio; en inicio permite salir).
- Integración continua que construye y publica en cada cambio un **APK de
  prueba (debug)** descargable. La firma de la versión de publicación queda
  preparada para hacerse de forma segura cuando llegue el momento de subir a
  Google Play.
- **La app instalable queda conectada al servicio en la nube real.** El guardado
  del progreso en la cuenta descrito más arriba funciona ya en las versiones que
  genera la compilación, y no solo en pruebas internas: la aplicación empaquetada
  arranca con la nube activada en lugar de en modo local.

### Changed

- Se actualiza el **aviso de privacidad** (pie de página, README y archivo de
  configuración) para reflejar el nuevo funcionamiento con cuenta opcional: si un
  adulto crea una cuenta, su correo y el progreso se guardan de forma segura en la
  nube; el progreso y el PIN del niño siguen guardándose únicamente en el
  dispositivo, y no se trata ningún dato que identifique al niño.
- El repositorio de GitHub se ha renombrado de `TerceroDePrimaria` a
  `RepasosDePrimaria` (GitHub redirige automáticamente la URL anterior).
- Las rutas internas de la aplicación pasan a ser relativas para poder
  ejecutarse dentro de la app; ya no dependen de una subruta de un sitio web.
- El **APK de prueba (debug)** pasa a firmarse siempre con la misma clave de
  desarrollo, en lugar de con una clave distinta en cada compilación. Es un paso
  previo para habilitar el inicio de sesión con Google en las versiones de
  prueba. No afecta a la versión de publicación, que seguirá firmándose de forma
  segura cuando llegue el momento de subir a Google Play.

### Removed

- Se retira la publicación del sitio en GitHub Pages: el canal de distribución
  pasa a ser la app instalable, no una página web con URL pública.

### Fixed

- Accesibilidad de las pantallas de alta de cuenta (elección de rol, reto de
  adulto, selector "cambiar de niño" con PIN, elección de avatar y apodo):
  contraste de bordes de inputs/opciones corregido, selección de avatar ya no
  depende solo del color (se añade una marca ✓), y objetivos táctiles ajustados
  al tamaño mínimo del proyecto.
- La política de privacidad, la DPIA y el mapeo de Play Data Safety se
  actualizan para reflejar con exactitud la cuenta propia del niño con Google
  (ADR-004): ya no afirman sin matices que "el niño no tiene cuenta ni correo"
  cuando el niño usa su propia cuenta de Google, en cuyo caso su
  correo/nombre/foto residen en Firebase Authentication igual que los del
  adulto (nunca en la base de datos de progreso).

## [0.5.0] — 2026-08-03

### Added

- **Selección de curso (1.º–6.º de Primaria).** La app se abre a toda la
  Primaria bajo el nombre "Repasos de Primaria". El curso se elige en el primer
  arranque y se puede cambiar en cualquier momento desde Ajustes. La pantalla de
  inicio muestra el curso activo.
- **Progreso aislado por curso.** La racha, las estrellas, las medallas, la
  misión diaria y el progreso por tema/materia se guardan por separado en cada
  curso: lo de un curso no interfiere con lo de otro.
- Estado "Pronto" para los cursos aún sin actividades (todos salvo 3.º): sus
  materias aparecen en el selector marcadas como no disponibles, sin contenido de
  relleno.

### Changed

- Renombrado de la aplicación de "Tercero de Primaria" a "Repasos de Primaria"
  (título, textos e información del pie de página) en español e inglés.
- El contenido existente de 3.º se conserva íntegro dentro del nuevo modelo por
  curso. Los usuarios con progreso previo lo mantienen: al actualizar, sus
  avances se asignan automáticamente a 3.º sin pérdida.

## [0.4.0] — 2026-07-23

### Added

- En la Mochila, las medallas conseguidas muestran ahora en un tooltip (al
  pasar el ratón o llegar por teclado) cómo se lograron, además de la fecha
  de obtención que ya se mostraba.

### Fixed

- Warning de ESLint (`react-hooks/exhaustive-deps`) por una dependencia
  innecesaria (`materia`) en el `useMemo` de `useSession`.
- Texto del pie de página que explicaba el funcionamiento de las sesiones:
  aclara que las "5 preguntas por sesión" son al elegir una materia, y que
  la misión de hoy combina 15 (3 de cada una), para no confundir a quien
  ve ambos números en la misma app.

## [0.3.0] — 2026-07-09

### Changed

- **Interfaz renovada con un aire más divertido, dinámico y con más
  personalidad**, sin cambiar ningún flujo, texto ni la forma de usar la app:
  - **Ambiente de "isla de verano":** un fondo de cielo suave con un sol cálido y
    espuma de mar que acompaña a todas las pantallas y da identidad propia al
    conjunto. Es decorativo y se atenúa por completo al imprimir.
  - **La app cobra vida:** la mascota Rumbo "respira" con un balanceo mínimo, los
    contenidos entran con una pequeña cascada al abrir cada pantalla, las tarjetas
    de materia dan un saltito al pasar por encima y la llama de la racha titila
    suavemente cuando está activa.
  - **Más color y energía:** botón principal con degradado tipo "caramelo", halo
    de sol tras la misión del día y barra de progreso como una estela marina
    turquesa→azul.
  - **Celebraciones más festivas:** la ventana de recompensa aparece con un rebote
    alegre además del confeti ya existente.
- **Movimiento seguro:** todas las animaciones nuevas respetan `prefers-reduced-motion`
  y el ajuste de "reducir movimiento" de la app (con reduce-motion todo aparece
  colocado y legible, sin destellos), y ningún elemento parpadea (WCAG 2.3.1).

## [0.2.0] — 2026-07-05

### Changed

- **Retos de 4º rebajados a currículo realista de 4º de primaria (decisión del
  usuario):** sustituidos 31 ejercicios que cubrían contenido de 5º/6º o de ESO,
  manteniendo id, tipo y opción correcta (solo cambian los textos en EN y ES):
  - Mates (4): números negativos, área del triángulo, comparación de fracciones
    con distinto denominador y ángulo cóncavo → mayor número de 4 cifras,
    perímetro del triángulo, fracciones con igual denominador y ángulo completo.
  - Lengua (11): voz pasiva, condicional, complementos directo/indirecto,
    oraciones compuestas/subordinadas/concesivas, alegoría y pretérito perfecto
    → diminutivos y aumentativos, imperfecto, demostrativos, posesivos,
    polisemia, palabras compuestas, homófonos y sujeto/predicado.
  - Inglés (15): present perfect, pasiva, reported speech, first/second
    conditional, for/since y modales avanzados → presente continuo, there
    is/are, plurales irregulares, 3ª persona del presente simple, have got,
    la hora y vocabulario básico.
  - Ciencias (1): pared celular vegetal vs. animal → aparato circulatorio.
- **Alcance del MVP (decisión del usuario, gate QA — Opción B):** los "Retos de 4º"
  (conceptos de adelanto a 4º de primaria dentro de cada materia) se difieren a la
  siguiente ola como P1, post-MVP. El release inicial cubre el repaso de 3º; el
  adelanto de 4º llegará en una versión posterior.

### Fixed

- **Revisión completa del contenido (1.635 ejercicios):** corregidas 9 claves
  de respuesta erróneas y 8 textos con imprecisiones factuales o ambigüedades:
  - Emparejar con parejas cruzadas: `len-3-acc-012` (lápiz es llana, pájaro
    esdrújula), `sci-3-states-016` (nieve=sólido, olor=gas), `sci-3-states-021`
    (gas se comprime, sólido mantiene forma), `sci-3-skeleton-016` (columna
    sostiene el cuerpo, fémur para caminar), `sci-3-forces-031` (chutar inicia
    movimiento, frenar lo detiene), `sci-3-solar-026` (luna nueva no se ve,
    luna llena entera iluminada), `eng-3-colors-002` (Circle=Shape; tercera
    categoría ahora inequívoca: Seven=Number).
  - Opción múltiple: `soc-3-spain-003` (el río más largo de España es el Tajo;
    el Ebro sigue siendo el más largo íntegramente español en `soc-3-maps-040`)
    y `soc-3-maps-010` (en España se enseñan 6 continentes, no 7).
  - Textos: `mat-3-len-031` (era "piscina olímpica" con respuesta 25 m — una
    olímpica mide 50 m), `mat-3-pv-006` (aclarado "cifra de las decenas" para
    no contradecir a `mat-3-pv-009`), `sci-3-forces-026` (dos opciones decían
    ambas "attracted" y el motor exige la pareja exacta), `sci-3-senses-030`
    (el "mapa de la lengua" es un mito — sustituida por sabor del limón),
    `sci-3-skeleton-029` y `sci-3-plants-032` (afirmaciones anatómica y
    taxonómicamente dudosas reformuladas), `eng-3-animals-035` (las jorobas
    del camello almacenan grasa, no agua), `eng-3-family-047` (el hijo de tu
    primo no es tu "second cousin"), `eng-3-animals-051` (la araña también
    produce seda — distractor cambiado), `c4-math-047` (el ángulo >180° en
    España se llama cóncavo, no "reflejo").
- El barajado de chistes de la hoja de caligrafía usaba `sort` con un
  comparador aleatorio, que no produce una permutación uniforme; ahora
  reutiliza el Fisher–Yates ya existente para el orden de ejercicios.
- La "misión del día" y la insignia de racha podían quedarse mostrando el
  estado de ayer si la pantalla de inicio se dejaba abierta cruzando la
  medianoche, hasta que otra interacción forzara un re-render.
- El contador de estrellas en vivo durante una sesión redondeaba al alza
  con la primera media estrella (acierto tras reintento), mostrando una
  estrella completa antes de haberla ganado del todo.

## [0.1.0] — 2026-06-25

Primera versión jugable de TerceroDePrimaria: una web de repaso de verano para
3º de primaria, 100% estática, gratuita y sin recogida de datos.

### Added

- **Bienvenida personalizada:** al empezar, el niño elige un avatar y un mote;
  la app le saluda por su nombre. Todo se guarda en el propio dispositivo, sin
  cuentas ni registro.
- **5 materias para repasar:** Matemáticas, Lengua, Ciencias (en inglés, *Natural
  Science*), Ciencias Sociales e Inglés (*English*).
- **4 formas de responder:** elegir entre varias opciones, verdadero o falso,
  escribir la respuesta y emparejar parejas.
- **Matemáticas siempre distintas:** los ejercicios de cálculo (sumas, restas,
  tablas, multiplicar por una cifra y divisiones exactas) generan números nuevos
  en cada partida, con dificultad adaptada a 3º de primaria.
- **Premios sin competir con nadie:** estrellas por acertar, una "mochila" de
  insignias que se van desbloqueando, un objetivo diario y una racha que anima a
  volver cada día.
- **Hojas para imprimir:** genera fichas de ejercicios en papel por materia o
  tema, con la opción de incluir las soluciones, y imprímelas o guárdalas como
  PDF desde el navegador.
- **Dos idiomas:** la aplicación funciona en castellano y en inglés y detecta el
  idioma del dispositivo al arrancar.
- **Pensada para tablets y para todos:** tipografía de alta legibilidad, opción
  de reducir las animaciones y diseño cuidado para que sea fácil de usar a los
  8-9 años.

### Security

- **Privacidad por diseño:** la aplicación no tiene servidor, no pide registro y
  no envía ningún dato a ningún sitio. El progreso (racha, estrellas,
  preferencias) se guarda únicamente en el almacenamiento local del navegador y
  nunca sale del dispositivo. Sin cookies de terceros ni analítica.

---
<!-- Guía rápida:
  - Mover [Unreleased] → [X.Y.Z] — AAAA-MM-DD en cada release (lo hace Documentación)
  - Added: nuevas funcionalidades
  - Changed: cambios en funcionalidades existentes
  - Fixed: correcciones de bugs
  - Removed: funcionalidades eliminadas
  - Security: parches de seguridad
  - Nunca editar entradas ya publicadas — solo añadir al principio
-->

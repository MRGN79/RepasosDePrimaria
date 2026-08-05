# Notas técnicas — Incremento 4 (migración del progreso local a la nube)

**Fecha:** 2026-08-05
**Autor:** Arquitecto, como diseño técnico de la Épica E de
[`docs/specs/07-app-android-firebase.md`](../specs/07-app-android-firebase.md)
(US-E1…US-E8). Rama: `feat/migracion-progreso-local`.

**No** son un cambio de ADR: implementan los principios ya fijados en ADR-003
(Firestore + reglas) y ADR-004 (Modelo A tutor / Modelo B niño) para el caso
concreto de trasladar el progreso preexistente en `localStorage` a la nube. Si
alguno de los puntos marcados con **[promover]** se considera significativo, se
sube a ADR propio.

Este documento es el contrato que **Frontend** implementará y que **Tester**,
**Seguridad**, **Accesibilidad** y **Abogado** revisarán. No incluye código de
producción: describe módulos, funciones, tipos y flujo con precisión suficiente
para implementar sin ambigüedad.

**Principio rector heredado de la spec:** *el progreso local nunca se pierde.*
El dato local solo se borra cuando la nube confirma que lo tiene. Ante cualquier
duda, gana conservar el dato local.

---

## 0. Mapa de lo que ya existe (punto de partida)

- `src/lib/storage.ts` — dueño de `localStorage` (`tdp:v1`, esquema v2). Expone
  `loadState()`, `saveState()`, `emptyCourseState()`, `parseCourseState()`,
  `PersistedState` (`courses: Partial<Record<Curso, CourseState>>`,
  `currentCourse`, `preferences`). Lectura defensiva; degrada sin error si no hay
  `localStorage`. **Módulo puro: no importa Firebase ni React.**
- `src/lib/firebase/courseMapping.ts` — `courseStateToCloudDoc(cs)` minimiza
  (anula `nicknameCustom`) y deja las 6 claves permitidas;
  `cloudDocToCourseState(raw)` reusa `parseCourseState`. **Módulo puro.**
- `src/lib/firebase/firestore.ts` — `saveCourse(uid, childId, curso, cs)`
  (`setDoc` con el doc minimizado), `loadCourse(uid, childId, curso)`
  (`getDoc` → `parseCourseState` o `null`). `childId===null` ⟹ Modelo B
  (`users/{uid}/courses/{curso}`); `childId!==null` ⟹ Modelo A
  (`users/{uid}/children/{childId}/courses/{curso}`).
- `src/AppRoot.tsx` (`CloudRoot`) — orquesta el flujo de cuenta. `onProfileCreate`
  crea el perfil (`createChildProfile` / `createKidAccount`) y es **el punto donde
  arranca la migración**. El listener `onTutorAuthChanged` ya limpia el estado al
  cerrar sesión.
- `src/screens/account/ProfileSetupScreen.tsx` — pantalla de creación de perfil
  (`variant` `tutorChild` | `kid`); es donde vive el **aviso** (US-E1/E5).
- `src/state/CloudGameProvider.tsx` — respalda el juego con Firestore; guarda el
  curso activo con **debounce de 700 ms** (`setDoc`, sobrescritura completa).
- `src/screens/SettingsScreen.tsx` — Ajustes; es donde vive el **cambio de cuenta**
  (US-E8). `AdultChallenge` ya existe en `src/components/AdultChallenge.tsx`.
- `firestore.rules` — permite `write`/`read` de `courses/{curso}` al dueño
  (`validCourseDoc` = allowlist de 6 claves + sin PII).

---

## 1. Algoritmo verify-before-delete (US-E2)

### 1.1 Qué significa "verificado" — precisión

La verificación tiene **dos señales**, y ambas deben cumplirse antes de borrar
nada en local:

1. **Confirmación de escritura en servidor (señal primaria).** El `Promise` de
   `setDoc` de Firestore **solo resuelve cuando el servidor ha confirmado** la
   escritura. En modo offline no resuelve (queda pendiente); si las reglas la
   rechazan, **rechaza**. Por tanto, *que `saveCourse(...)` resuelva sin error es,
   por sí mismo, la prueba de que la nube tiene el dato de forma durable.*
2. **Comparación de contenido leído de vuelta (señal de integridad).** Tras la
   confirmación, se relee el documento y se compara con lo que se pretendía
   escribir. Guarda contra truncamientos silenciosos, campos recortados por las
   reglas, o corrupción. **La relectura debe forzar origen servidor**
   (`getDocFromServer`) — ver §1.3, es el matiz no evidente del incremento.

> **[promover] Trade-off crítico de offline-first (léelo).** Con la persistencia
> offline de Firestore activada (Inc. 3, `persistentLocalCache`), un `getDoc`
> normal **puede devolver el valor desde la caché local** — es decir, podría
> "confirmar" una escritura que el servidor aún no tiene. Eso rompería la promesa
> de verify-before-delete (borraríamos el local creyendo que la nube lo tiene,
> cuando solo lo tiene la caché del propio dispositivo). **Mitigación adoptada:**
> (a) tratar la resolución de `setDoc` como la confirmación de servidor, y
> (b) usar `getDocFromServer` para la relectura de verificación. Si no hay red,
> `setDoc` no resuelve y `getDocFromServer` falla → el curso queda **pendiente**
> (no se borra nada), que es exactamente el comportamiento deseado (US-E6).

Una `CourseState` de nube se considera **equivalente** a la local si coinciden
todos los campos con significado de avance: `streak.current/longest/lastPlayedDate`,
`stars.total`, `dailyGoal.{lastDoneDate,totalCompleted}`, `badges.unlocked` (mismas
claves→valores), y `progress.*` (`correctByTopic`/`correctBySubject` como mapas
clave→valor; `subjectsTried`/`correctExerciseIds`/`failedExerciseIds` como
conjuntos). **No** se compara por `JSON.stringify` crudo: Firestore puede reordenar
las claves de los mapas y los ítems de los arrays al serializar, y un stringify
ingenuo daría falsos negativos. Se implementa `courseStatesEquivalent(a, b)` con
comparación estructural (mapas por conjunto de pares, arrays por conjunto). El
`profile.nicknameCustom` se ignora en la comparación (siempre se sube `null`).

### 1.2 Flujo por curso (pseudocódigo)

```
migrateCourse(target, curso, localCS):
  # 1. defensa anti-retroceso (US-E2 último criterio + caso edge "niño juega antes de terminar")
  cloudCS = await loadCourse(target.uid, target.childId, curso)      # puede ser null
  intended = (cloudCS == null)
             ? courseStateToCloudDoc(localCS)
             : courseStateToCloudDoc( mergeNonRegressing(localCS, cloudCS) )

  # 2. escribir (señal primaria: resuelve ⟺ el servidor lo confirmó)
  await saveCourse(target.uid, target.childId, curso, intended)      # setDoc; determinista

  # 3. releer del SERVIDOR y comparar (señal de integridad)
  readback = await loadCourseFromServer(target.uid, target.childId, curso)  # getDocFromServer
  if readback == null OR NOT courseStatesEquivalent(readback, intended):
      throw VerificationFailed(curso)                                # → queda pendiente (US-E6)

  # 4. verificado ⟹ y solo entonces ⟹ borrar SOLO este curso en local
  removeCourseProgress(curso)                                        # storage.ts
  markCourseDone(curso)                                             # quita de pendingCourses
```

Puntos clave:

- **`mergeNonRegressing(local, cloud)`** (función pura nueva, testeable): por cada
  contador toma el máximo (`stars.total`, `streak.current`, `streak.longest`,
  `dailyGoal.totalCompleted`, y cada valor de `correctByTopic`/`correctBySubject`);
  por cada conjunto la unión (`badges.unlocked` unión por clave conservando la
  fecha más temprana, `subjectsTried`, `correctExerciseIds`; `failedExerciseIds`
  = unión menos los ya correctos, coherente con `consolidation.ts`);
  `lastPlayedDate`/`lastDoneDate` = la fecha más reciente. Nunca reduce ningún
  indicador. Esto es lo que garantiza **no destruir progreso de nube preexistente**
  y hace la operación **idempotente**.
- **Determinismo ⟹ idempotencia.** `saveCourse` usa `setDoc` con id = `curso` y
  contenido función determinista de `(local ∪ cloud)`. Reejecutar produce el mismo
  documento: ni duplica (el id es el curso, no autogenerado) ni corrompe.
- **`getDocFromServer` en la verificación** requiere red. Offline ⟹ falla ⟹ curso
  pendiente. Es correcto: sin red no podemos afirmar que el servidor lo tiene.

### 1.3 Añadido mínimo a `firestore.ts`

Nueva función hermana de `loadCourse`, con la misma resolución de ruta pero
`getDocFromServer` en vez de `getDoc`:

```ts
// firestore.ts
import { getDocFromServer } from "firebase/firestore";
export async function loadCourseFromServer(
  uid: string, childId: string | null, curso: Curso,
): Promise<CourseState | null> { /* misma ruta que loadCourse, getDocFromServer */ }
```

`getDocFromServer` ya está disponible en `firebase/firestore` (mismo paquete,
sin dependencia nueva).

---

## 2. Marcador de "ya migrado" y estado de reanudación (US-E4, US-E6)

### 2.1 Dónde vive y por qué

**En `localStorage`, clave nueva `tdp:migration`** (separada de `tdp:v1`), no en
Firestore ni en Capacitor Preferences. Justificación:

- **Debe sobrevivir a cerrar sesión.** `localStorage` no se toca al hacer
  `signOut` (solo se limpia el estado de Auth). Así, un segundo perfil/cuenta
  creado en el mismo dispositivo tras la migración **no** vuelve a migrar (US-E4).
- **Debe desaparecer al reinstalar.** Al reinstalar la app, Android borra los datos
  del WebView: se van **a la vez** `tdp:v1` (progreso) y `tdp:migration` (marcador).
  Quedan coherentes: sin progreso local ni marcador, y el usuario recupera su avance
  **iniciando sesión** (la nube ya es la fuente de verdad), no vía migración (caso
  edge de la spec).
- **Es a nivel de dispositivo.** En el WebView el origen es único, así que una
  sola clave de `localStorage` funciona como marcador de dispositivo, común a
  Modelo A y Modelo B (se migra a quien cree el **primer** perfil, del tipo que sea).
- La spec (US-E4) pide explícitamente el marcador en `localStorage`; el progreso ya
  vive ahí. Mantener el marcador junto al progreso es lo coherente.

> **[promover] Se guarda el `uid` (+ `childId`) del perfil destino en
> `localStorage`.** El estado de reanudación necesita saber *hacia qué perfil*
> reanudar (US-E6 exige reanudar "hacia el mismo perfil para el que empezó").
> El `uid` es un identificador seudónimo ya usado en toda la app; queda en
> almacenamiento local del dispositivo, **no** se escribe en ningún documento de
> Firestore (las reglas siguen rechazando PII). Riesgo bajo, pero se señala para
> revisión de **Seguridad**/**Abogado**.

### 2.2 Forma del estado

```ts
// tipo persistido bajo tdp:migration (esquema versionado, lectura defensiva)
interface MigrationState {
  schemaVersion: 1;
  status: "pending" | "done";
  target: { uid: string; childId: string | null };   // childId null = Modelo B
  pendingCourses: Curso[];   // cursos con avance aún NO verificados en la nube
  attempts: number;          // reintentos consumidos (para backoff / aviso)
  lastErrorAt: string | null;
}
```

- `status: "done"` ⟺ `pendingCourses` vacío ⟺ todos los cursos con avance están
  verificados en la nube (US-E6). A partir de ahí, la fuente de verdad es la nube.
- El caso **sin progreso** (US-E7) también escribe el marcador con
  `status:"done"`, `pendingCourses:[]`, para no reevaluar la migración en cada
  arranque.

### 2.3 Persistencia — dónde va el código

En `storage.ts` (dueño de `localStorage`, ya tiene el acceso defensivo
`getStorage()`), **sin** importar Firebase (el tipo `MigrationState` es strings y
`Curso`, no toca Firebase). Nuevas funciones puras:

```ts
// storage.ts
export const MIGRATION_KEY = "tdp:migration";
export function loadMigrationState(): MigrationState | null;
export function saveMigrationState(s: MigrationState): void;
export function clearMigrationState(): void;                 // uso interno/tests
export function courseHasProgress(cs: CourseState): boolean; // §3
export function coursesWithProgress(st: PersistedState): Curso[];
export function removeCourseProgress(curso: Curso): void;    // borra courses[curso] de tdp:v1
```

`removeCourseProgress` carga `tdp:v1`, elimina `courses[curso]` y guarda; conserva
`preferences` y `currentCourse` intactos. Si al borrar el curso activo la lista
queda vacía, `loadState()` ya re-crea una entrada vacía para el curso activo (no
rompe nada): tras la migración el `tdp:v1` retiene solo `preferences` + un curso
activo vacío, y la nube manda.

---

## 3. Qué cuenta como "avance real" (US-E1, US-E3, US-E7)

`courseHasProgress(cs)` = **verdadero si algún campo de aprendizaje difiere del
estado por defecto**:

```
stars.total > 0
|| streak.longest > 0
|| dailyGoal.totalCompleted > 0
|| Object.keys(badges.unlocked).length > 0
|| Object.keys(progress.correctByTopic).length > 0
|| Object.keys(progress.correctBySubject).length > 0
|| progress.subjectsTried.length > 0
|| progress.correctExerciseIds.length > 0
|| progress.failedExerciseIds.length > 0
```

> **[promover] El `profile` (avatar/apodo) NO cuenta como avance.** Un curso donde
> solo se eligió avatar/apodo pero nunca se jugó se trata como "sin avance" y se
> **omite** (no se crea documento de nube). Motivos: (a) evita sembrar documentos
> de nube vacíos (US-E3 lo pide explícitamente); (b) la identidad visible del
> perfil de nube ya la aporta el `mote`/`avatar` elegidos en `ProfileSetupScreen`,
> no el `profile` del `CourseState` viejo; (c) el `nicknameCustom` (texto libre)
> se descarta al subir de todos modos. Si el usuario prefiriera conservar la
> elección de avatar por-curso del progreso local, es un cambio acotado — se
> documenta la decisión para que sea consciente.

- `hasLocalProgressToMigrate()` (en `migration.ts`) = `coursesWithProgress(loadState())`
  no vacío. Es la señal para **mostrar el aviso** (US-E1) — combinada con "no existe
  aún marcador de migración" (el aviso solo aparece en el primer perfil del
  dispositivo).
- `currentCourse` de la nube al concluir: si el `currentCourse` local tenía avance,
  se conserva como curso activo inicial del perfil; si no, el que corresponda por
  defecto. El `currentCourse` del perfil ya lo fija `ProfileSetupScreen` (el
  usuario elige curso al crear el perfil); la migración **no** lo pisa salvo que
  convenga alinear con el `currentCourse` local — decisión de Frontend menor,
  el destino correcto ya está cubierto porque cada curso va a su propio documento.

---

## 4. Iteración multi-curso: secuencial, en segundo plano (US-E3, no-bloqueo)

**Secuencial, no en paralelo.** Por cada curso de `pendingCourses`: `migrateCourse`
(§1.2) completo (write → verify → delete-local → quitar de pendientes), y se pasa
al siguiente. Razones:

- N es pequeño (≤ 6 cursos), documentos diminutos: el paralelismo no aporta latencia
  perceptible.
- Secuencial da **contabilidad de fallos parcial limpia**: cada curso se marca
  hecho en cuanto verifica; si la app se cierra a mitad, `pendingCourses` refleja
  exactamente lo que falta (US-E6, caso "unos cursos sí y otros no").
- Evita ráfagas de escrituras contra reglas/cuota.

**En segundo plano, sin bloquear el juego.** El runner es `async` fire-and-forget
lanzado desde `AppRoot`; el niño puede jugar mientras corre. La UI muestra un
aviso **no bloqueante** (`account.migration.inProgress`), no una pantalla modal.

### 4.1 Orden recomendado: curso activo primero (resuelve la carrera con `CloudGameProvider`)

> **[promover] Carrera entre la migración y `CloudGameProvider`.** `CloudGameProvider`
> carga el curso activo desde la nube al montarse y, al jugar, lo **sobrescribe**
> con `setDoc` (debounce 700 ms). Si la migración escribe el avance del curso
> activo *después* de que `CloudGameProvider` cargara un documento vacío, la
> escritura del provider podría pisar lo migrado. Dos garantías combinadas lo
> evitan:
>
> 1. **`mergeNonRegressing` en la escritura de migración** (§1.2, paso 1): la
>    migración siempre relee la nube y **funde** con el local antes de escribir.
>    Esto hace *toda* interleaving segura por convergencia (la unión no retrocede).
>    Es la garantía de corrección principal.
> 2. **Migrar el curso activo ANTES de montar el juego** (optimización): en
>    `onProfileCreate`, migrar primero `currentCourse` (una escritura+verify rápida),
>    y solo entonces fijar el perfil activo (que monta `CloudGameProvider`). Así el
>    provider carga el curso activo **ya migrado** desde la nube y su primer guardado
>    parte del estado correcto. Los cursos no activos se migran en segundo plano.
>
> Con (1) sola, la corrección está garantizada aunque el niño cambie de curso a uno
> aún no migrado (la fusión converge). (2) elimina además el caso más común de
> clobber sin bloquear la experiencia.

**Relación con la deuda técnica de QA (PR #31, flush del debounce).** El problema
"última edición sin flush" de `CloudGameProvider` queda **subsumido** por
`mergeNonRegressing`: una escritura de juego que llegue tarde a la nube se funde,
no se pierde, en la siguiente pasada. Aun así se recomienda resolver la deuda
(flush en `unmount`/`beforeunload`) como higiene; se cruza con esta épica pero no
la bloquea.

---

## 5. Manejo de fallos y reintentos (US-E6)

| Situación | Comportamiento |
|---|---|
| **Sin red** | `saveCourse` no resuelve / `getDocFromServer` falla → el curso queda en `pendingCourses`; local intacto. Se reintenta al recuperar red (§5.1). |
| **Reglas rechazan la escritura** | `setDoc` rechaza → `VerificationFailed` → curso pendiente; local intacto. (No debería ocurrir: el doc minimizado cumple `validCourseDoc`; si ocurre, es un bug de datos, y el local no se pierde.) |
| **App cerrada a mitad** | El estado `tdp:migration` (`status:"pending"` + `pendingCourses`) persiste; al reabrir con el **mismo perfil activo** que `target`, se reanuda solo (§5.1). |
| **Verificación no coincide** | `VerificationFailed` → pendiente + `attempts++`; se reintenta. |
| **`localStorage` no disponible** | No hay nada que migrar ni marcar; el alta continúa como alta limpia (US-E7). `getStorage()` ya devuelve `null` sin romper. |

### 5.1 Reanudación y reintento

- **`resumeMigrationIfPending(activeTarget)`** — se llama desde `AppRoot` cuando un
  perfil pasa a activo (al arrancar la app y montar el juego). Lee `tdp:migration`;
  si `status==="pending"` **y** `target` coincide con `activeTarget` (mismo `uid` y
  `childId`), relanza el runner sobre `pendingCourses` en segundo plano. Si el
  `target` **no** coincide (el usuario cambió de cuenta antes de terminar), **no**
  reanuda: los cursos pendientes siguen destinados al target original y el local se
  conserva.
- **Reintento manual** — cuando se agota un intento, la UI muestra
  `account.migration.incompleteTitle`/`Body` + botón `account.migration.retryAction`
  (no bloqueante). Pulsarlo relanza el runner sobre `pendingCourses`.
- **Backoff** — reintento automático simple al recuperar conectividad; `attempts`
  gobierna cuándo pasar de "reintento silencioso en 2.º plano" a "avisar y ofrecer
  reintento manual". No se requiere librería: un par de reintentos con espera y
  luego aviso.

> **[promover] Trade-off de la reanudación atada al target original.** Si la
> migración queda pendiente y el usuario **cambia de cuenta** (US-E8) sin volver a
> la cuenta original, los cursos pendientes **no** se migran a la cuenta nueva
> (irían a la original). El progreso local **se conserva** (nunca se pierde) y se
> completará cuando la cuenta original vuelva a estar activa. En el extremo, si esa
> cuenta nunca regresa, el progreso permanece en el dispositivo indefinidamente
> (seguro, pero no en la nube). Es coherente con "una migración por dispositivo,
> hacia el primer perfil" (US-E4) y con "gana conservar el local". Se señala porque
> no es evidente.

---

## 6. Cambio de cuenta de tutor (US-E8)

Se **confirma** la propuesta de la spec: el control vive en `SettingsScreen`.

### 6.1 Qué hace `signOut` hoy y qué hace falta tocar

- `signOutTutor()` (`auth.ts`) hace `signOut(getFirebaseAuth())`. El listener
  `onTutorAuthChanged` de `CloudRoot` ya reacciona a `user===null`: limpia
  `userDoc`, `children`, `activeChild` y `resetSetup()`, y el render cae a
  `TutorAuthScreen` (pantalla de entrada). **No hace falta una ruta nueva** en
  `AppRoot`: volver limpiamente a la entrada ya está cubierto por ese listener.
- **Ajuste menor recomendado en `AppRoot`:** en la rama `!u` del listener, limpiar
  también el estado residual de PIN (`pinMode`, `pinTargetChild`, `lockedIds`) por
  higiene, para que un cambio de cuenta no deje flags colgando. `activeChild` ya se
  limpia.

### 6.2 Contrato e implementación

- `SettingsScreen` recibe una prop **opcional** nueva:
  `account?: { onSwitchAccount: () => void }`. Presente solo cuando la nube está
  habilitada; ausente ⟹ la sección de cuenta **no se renderiza** (la app en modo
  local sigue sin cuenta). Como `App` se instancia con y sin nube, `App` recibe la
  misma prop opcional `account?` y la reenvía a `SettingsScreen`.
- **Cadena de props:** `AppRoot` (modo nube) → `<App account={{ onSwitchAccount }} />`
  → `<SettingsScreen account={...} />`. En modo local, `<App />` sin `account`.
- `onSwitchAccount` **vive en `AppRoot`** = `() => { void signOutTutor(); }`. Así la
  responsabilidad de sesión/Auth queda en `AppRoot`, no enterrada en el subárbol del
  juego. `SettingsScreen` solo dispara el callback tras las confirmaciones.
- **Flujo dentro de `SettingsScreen`** (estado local, como el patrón `confirmClear`
  ya existente): sección "Account" (`settings.account.label`) con botón "Switch
  account" (`settings.account.switch`). Al pulsar →
  1. **Reto de adulto** (`AdultChallenge` inline) — impide que un niño cierre sesión
     por accidente (US-E8; es la fricción ligera, **no** la reautenticación de
     Inc. 5).
  2. **Diálogo de confirmación** — `settings.account.switchConfirmTitle` /
     `switchConfirmBody` (aclara que el progreso del niño queda a salvo en la nube) /
     `switchConfirmButton` / `switchCancel`.
  3. Confirmar → `account.onSwitchAccount()` → `signOut` → vuelta a la entrada.
- **Cerrar sesión NO borra datos:** no toca ni la nube ni `localStorage` ni el
  marcador `tdp:migration`. El progreso del niño permanece en la nube; el marcador
  de migración permanece (una nueva cuenta en el mismo dispositivo no re-migra).
- **a11y/i18n:** `AdultChallenge` ya cumple (label, `role="alert"`, foco). El
  diálogo de confirmación replica el patrón accesible de `clearData` (texto real,
  navegable por teclado). Todos los textos por claves i18n EN/ES.

---

## 7. Impacto en `firestore.rules` — sin cambios

La migración escribe con `saveCourse`/lee con `loadCourse`/`loadCourseFromServer`
sobre las rutas `courses/{curso}` de Modelo A y Modelo B, que **ya** permiten
`read`/`write` al dueño verificado. `courseStateToCloudDoc` produce exactamente
las 6 claves de `validCourseDoc` sin PII (allowlist superada; `noForbiddenFields`
solo mira claves de primer nivel — `profile.nicknameCustom: null` no es clave
prohibida). El marcador y el estado de reanudación viven en `localStorage`, fuera
de Firestore. **Conclusión: no se requiere ningún cambio en `firestore.rules`.**

> **Requisito de proceso (CLAUDE.md):** este diseño **no** modifica las reglas de
> seguridad, así que no procede la consulta previa a Seguridad por cambio de reglas.
> Si durante la implementación Frontend detectara que necesita tocar `firestore.rules`
> (no debería), **debe pararse y consultar a Seguridad antes de tocarlas** — no las
> cambia por su cuenta. Seguridad sí revisa como gate: (a) que no viaje PII nueva
> (no la hay: el `CourseState` migrado es anónimo, ya cubierto por el consentimiento
> de Inc. 2/6), y (b) el almacenamiento del `uid` en `localStorage` (§2.1, riesgo
> bajo).

---

## 8. Estructura de módulos y contrato para Frontend

### 8.1 Ficheros

| Fichero | Estado | Contenido |
|---|---|---|
| `src/lib/storage.ts` | **ampliar** | `MIGRATION_KEY`, `MigrationState`, `loadMigrationState`/`saveMigrationState`/`clearMigrationState`, `courseHasProgress`, `coursesWithProgress`, `removeCourseProgress`. Sigue puro (sin Firebase). |
| `src/lib/firebase/firestore.ts` | **ampliar** | `loadCourseFromServer(uid, childId, curso)` (`getDocFromServer`). |
| `src/lib/firebase/migration.ts` | **nuevo** | Orquestación + helpers puros. Depende de `storage.ts` (local + marcador) y `firestore.ts` (nube). |
| `src/AppRoot.tsx` | **ampliar** | Disparar `beginMigration` en `onProfileCreate`; `resumeMigrationIfPending` al activar perfil; estado React del aviso; `onSwitchAccount`; pasar `account` a `<App>`; limpiar PIN residual al `signOut`; calcular `showMigrationNotice` para `ProfileSetupScreen`. |
| `src/screens/account/ProfileSetupScreen.tsx` | **ampliar** | Prop opcional `migration?: { show: boolean; multiCourse: boolean }`; render del aviso (US-E1/E5). |
| `src/screens/SettingsScreen.tsx` | **ampliar** | Prop opcional `account?`; sección de cuenta con reto de adulto + confirmación (US-E8). |
| `src/App.tsx` | **ampliar** | Prop opcional `account?`; reenvío a `SettingsScreen`. |
| `src/lib/firebase/migration.test.ts` + tests de `storage`/settings | **nuevo** (Tester) | Cubrir merge, equivalencia, idempotencia, reanudación, no-red, multi-curso. |

### 8.2 Contrato de `migration.ts` (lo que consume Frontend)

```ts
export interface MigrationTarget { uid: string; childId: string | null }

export type MigrationOutcome =
  | { status: "done"; migrated: Curso[] }
  | { status: "incomplete"; migrated: Curso[]; pending: Curso[] }
  | { status: "noop" };   // ya había marcador (no es el primer perfil) o sin progreso

export interface RunOptions {
  onProgress?: (s: { phase: "running" | "incomplete" | "done"; pending: Curso[] }) => void;
}

// ¿Mostrar el aviso de migración? (primer perfil del dispositivo + hay avance)
export function hasLocalProgressToMigrate(): boolean;
export function migrationMarkerExists(): boolean;      // = loadMigrationState() != null

// Arranca la migración tras crear el PRIMER perfil. Autoprotegida: si ya existe
// marcador (no es el primer perfil), retorna { status: "noop" } sin migrar (US-E4).
// Si no hay progreso, escribe marcador done y retorna noop (US-E7).
export function beginMigration(target: MigrationTarget, opts?: RunOptions): Promise<MigrationOutcome>;

// Reanuda/reintenta si hay pendientes para ESTE target (US-E6). Si no hay pendientes
// o el target no coincide, retorna null.
export function resumeMigrationIfPending(activeTarget: MigrationTarget, opts?: RunOptions): Promise<MigrationOutcome | null>;

// Helpers puros (exportados para Tester)
export function mergeNonRegressing(local: CourseState, cloud: CourseState): CourseState;
export function courseStatesEquivalent(a: CourseState, b: CourseState): boolean;
```

### 8.3 Puntos de disparo en `AppRoot`

- **Aviso (US-E1/E5):** en el render de `ProfileSetupScreen`, calcular
  `show = !migrationMarkerExists() && hasLocalProgressToMigrate()` y
  `multiCourse = coursesWithProgress(loadState()).length > 1`; pasar
  `migration={{ show, multiCourse }}`.
- **Arranque (US-E2…E5):** en `onProfileCreate`, tras `createChildProfile` (tutor)
  o `createKidAccount` (kid) con éxito, componer `target` (`{uid, childId}` /
  `{uid, childId:null}`) y llamar `beginMigration(target, { onProgress })`.
  Recomendado (§4.1): migrar el `currentCourse` primero y luego fijar el perfil
  activo; los demás cursos van en 2.º plano.
- **Reanudación (US-E6):** cuando un perfil pasa a activo tras arrancar la app
  (rama `userDoc.role==="kid"` o `tutor && activeChild`), llamar
  `resumeMigrationIfPending(activeTarget, { onProgress })` una vez.
- **UI de estado:** estado React (`migrationStatus`) que mapea a un aviso no
  bloqueante superpuesto al juego: `account.migration.inProgress` (running),
  `incompleteTitle/Body` + `retryAction` (incomplete), `doneToast` (done). El niño
  juega mientras tanto.

---

## 9. Cobertura de criterios de aceptación (trazabilidad)

| US | Cubierto por |
|---|---|
| E1 / E5 | §3 (`hasLocalProgressToMigrate` + `multiCourse`), §8.3 (prop del aviso), disparo en `onProfileCreate` para ambos variantes (`tutorChild`/`kid`). |
| E2 | §1 (verify-before-delete, doble señal, `getDocFromServer`, `mergeNonRegressing` anti-retroceso). |
| E3 | §3 (`coursesWithProgress`, omitir cursos sin avance), §4 (todos los cursos, cada uno a su doc). |
| E4 | §2 (marcador de dispositivo en `localStorage`, `beginMigration` autoprotegida), sin fusión entre hermanos. |
| E5 | Modelo B = `childId:null` en `target`; mismas funciones. Marcador común a ambos modelos. |
| E6 | §5 (`MigrationState` pendiente, `resumeMigrationIfPending`, reintento manual, idempotencia). |
| E7 | §3 + §5 (sin avance / `localStorage` no disponible ⟹ alta limpia + marcador done). |
| E8 | §6 (control en `SettingsScreen`, reto de adulto, confirmación, `signOut`, sin pérdida de datos). |

---

## 10. Versionado

Feature aditiva (nueva capacidad sin romper lo existente) ⟹ **MINOR** en fase
`0.y.z`. No hay ambigüedad MINOR/MAJOR que requiera decisión del Arquitecto; la
propone **Documentación** en el gate. Sin migración de datos irreversible (el
borrado local solo ocurre tras verificación; no hay `down` de esquema de nube).

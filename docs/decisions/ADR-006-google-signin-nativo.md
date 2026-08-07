# ADR-006: Google Sign-In nativo vía puente `@capacitor-firebase/authentication`

**Fecha:** 2026-08-07
**Estado:** Aceptado
**Decidido por:** Arquitecto (a petición del Jefe, tras confirmación del fallo en un dispositivo Android real por el usuario)

---

## Contexto

`signInWithGoogle()` (`src/lib/firebase/auth.ts`) usa `signInWithPopup` del SDK Web de
Firebase. Dentro del WebView de Capacitor esto abre una Custom Tab/navegador externo
del sistema; el usuario elige su cuenta, pero la página de retorno
(`firebaseapp.com/__/auth/handler`) no tiene ningún `window.opener` real al que
devolver el resultado — no hay relación de pestañas entre el navegador externo y el
WebView embebido. La promesa de `signInWithPopup` nunca resuelve. Efecto observado: el
botón "Continuar con Google" se queda deshabilitado para siempre, confirmado por el
usuario en una tablet real con el APK 0.6.0 instalado. Ya era un riesgo documentado en
`.claude/pending-actions.md` desde el Inc. 3 (2026-08-04); esto lo confirma en hardware
real, no solo en teoría.

Afecta a **ambos roles** (tutor y niño, ADR-004): el proveedor Google no fija el rol, y
ambos flujos llaman al mismo `signInWithGoogle()`.

## Decisión

Sustituir el flujo de popup por un **puente nativo**: `@capacitor-firebase/authentication`
(CapawesomeTeam, Apache-2.0, activo, compatible con Capacitor 8 y `firebase ^12`), en
modo **`skipNativeAuth: true`**. El plugin solo hace de selector nativo de cuenta de
Google (sin navegador externo) y entrega un `idToken`; ese token se pasa al SDK Web con
`signInWithCredential(auth, GoogleAuthProvider.credential(idToken))`, que sigue siendo
el dueño real de la sesión.

**Por qué no migra Auth/Firestore/App Check al SDK nativo:** `skipNativeAuth: true` es
justo lo que evita ese rewrite — el plugin nunca inicia sesión en el Firebase Auth
nativo, solo entrega el credential al SDK Web ya integrado. `onAuthStateChanged`
(`onTutorAuthChanged`), Firestore (`persistentLocalCache`) y App Check (adjunto al
`FirebaseApp` del SDK Web, ADR-005) siguen exactamente igual.

**Configuración nativa que exige:** `google-services.json` (config pública del proyecto
Firebase — API key, IDs de cliente OAuth — no un secreto en sentido estricto, pero por
decisión ya tomada en ADR-003 §6/§7 no se versiona: la CI lo inyecta desde el secreto
`GOOGLE_SERVICES_JSON_BASE64`). El plugin Gradle `com.google.gms.google-services` ya
estaba preparado en `android/build.gradle`/`android/app/build.gradle` desde el Inc. 1,
aplicándose solo si ese fichero existe — no ha hecho falta tocar Gradle.

**Fingerprint necesario:** el SHA-1 del keystore de debug (ya registrado, PR #33) es
**suficiente** para este fix — es lo que valida el cliente OAuth Android que usa el
picker nativo. El **SHA-256** sigue sin ser necesario aquí; se reserva para la
migración de App Check a Play Integrity (ADR-005), no para Google Sign-In.

## Alternativas consideradas

- **`@codetrix-studio/capacitor-google-auth`** — descartado: no soporta Capacitor 8
  (peer `@capacitor/core ^6`), última publicación en 2024-05 (>12 meses, señal de
  dependencia sin mantenimiento según la Política de Dependencias del proyecto).
- **`signInWithRedirect`** en vez de popup — descartado: en un WebView de Capacitor con
  origen `https://localhost` (sin dominio real ni App Links configurados), no hay forma
  fiable de que el navegador del sistema devuelva el control a la app tras el redirect;
  el problema de fondo es el mismo que con popup.
- **Migrar todo Auth al SDK nativo de Firebase** (sin `skipNativeAuth`) — descartado por
  desproporcionado: obligaría a revisar Firestore y App Check bajo un modelo de sesión
  distinto sin necesidad, cuando el puente resuelve el único punto roto (el picker).

## Rollout

Por pasos, cada uno con un APK verificable en el dispositivo real del usuario (no
reproducible en el entorno de desarrollo, que carece de WebView/dispositivo Android):

0. Registrar el SHA-1 en Firebase Console, regenerar `google-services.json` — hecho.
1. Instalar la dependencia + `cap sync` + inyección del secreto en CI, **sin** tocar
   `signInWithGoogle` — aísla si el build nativo rompe algo existente.
2. Cablear `signInWithGoogle` para usar el puente en plataforma nativa (rama web/
   emulador intacta, seguimos usando `signInWithPopup` fuera de Capacitor).
3. Verificar rol niño, cancelación del picker, sin red, y cuentas supervisadas por
   Family Link (ADR-004) — la superficie del picker nativo es distinta a la Custom Tab.

## Consecuencias

- Añade una dependencia nativa nueva (Apache-2.0, aprobada por el Abogado bajo demanda
  antes de integrarla).
- `google-services.json` pasa a ser un prerrequisito real de build para que Google
  Sign-In funcione — ya no es opcional/best-effort.
- Elimina la dependencia del round-trip por navegador externo por completo: no hace
  falta ningún manejo de deep-links (`@capacitor/app`) para este flujo.
- Efecto colateral positivo detectado durante el rollout: `@capacitor/preferences`
  (PIN de pestillo, Inc. 3) nunca se había registrado en el proyecto Android nativo
  tras añadirse a `package.json` — el `cap sync` de este ADR lo corrige de paso (bug
  real y separado, documentado en `CHANGELOG.md`).
- Pendiente de revisión por Seguridad antes de mergear el Paso 2 (frontera de confianza
  del `idToken`, invariante de `skipNativeAuth`, superficie nativa nueva) — ver el
  detalle en `.claude/pending-actions.md`.

# ADR-005: App Check con reCAPTCHA v3 como proveedor interino (monitor→enforce), puente a Play Integrity

**Fecha:** 2026-08-06
**Estado:** Aceptado
**Decidido por:** Arquitecto (sobre base verificada del gate de Seguridad del commit `929276b`)

---

## Contexto

La API key de la app **Web** de Firebase (la que usa esta app dentro del WebView de
Capacitor vía el SDK JS — no hay SDK nativo Android integrado) queda de facto **sin
restricción efectiva** en Google Cloud Console: la restricción por SHA-1 que ADR-003
§8 preveía es para una app Android **nativa**, y no aplica a una key de tipo Web; la
alternativa para Web ("HTTP referrers") no es fiable dentro de un WebView de
Capacitor.

Esto no expone datos de usuario — `firestore.rules` (ya en producción, 39 tests,
deny-by-default + `uid`/`email_verified`) es la barrera real de autorización — pero
sí permite abuso de los endpoints de Firebase Auth (alta masiva de cuentas, spam de
verificación/reset de contraseña, enumeración) y consumo de cuota/facturación por
quien tome la key del repo público (o del propio APK, donde también viaja) y la use
fuera de la app.

ADR-003 §9 y la DPIA ya anotaban **Firebase App Check** como mitigación pendiente,
asumiendo el proveedor **Play Integrity**. Play Integrity no es viable hoy:

- Requiere el **keystore de release real** con huella SHA-256 registrada — hoy solo
  existe un keystore de **debug** fijo (PR #33); el de release depende de secretos de
  GitHub (`ANDROID_KEYSTORE_BASE64` y relacionados) aún sin configurar.
- Requiere vinculación con **Google Play Console**, sin acceso desde el entorno de
  desarrollo.
- **No es un proveedor del SDK Web de Firebase App Check** (`ReCaptchaV3Provider`,
  `ReCaptchaEnterpriseProvider`, `CustomProvider` son los disponibles) — es nativo
  Android, y usarlo exigiría un plugin nativo de Capacitor que hoy no existe en el
  proyecto (de naturaleza similar al plugin nativo pendiente para Google Sign-In en
  WebView, ver `.claude/pending-actions.md`).

## Decisión

Implementar Firebase App Check con **`ReCaptchaV3Provider`** (SDK Web), integrado en
la inicialización de Firebase (`src/lib/firebase/config.ts`) justo después de
`initializeApp` y antes de que Auth o Firestore toquen la red, en **modo monitor**
(sin activar "Enforce" en consola).

La selección de proveedor queda aislada en una única función
(`resolveAppCheckProvider`) para poder sustituirla por Play Integrity el día que sea
viable, sin reescribir el resto del módulo. Sin site key configurada, la función
devuelve `null` y App Check queda ausente — no bloquea la app en ningún caso.

No se modifica `firestore.rules`: el enforcement de App Check (Firestore y Auth) es
un toggle de consola, independiente de la sintaxis de las reglas. Mantener la
separación evita complicar el setup del emulador de tests y preserva la barrera de
autorización (`uid`/`email_verified`) como responsabilidad exclusiva de las reglas.

El paso a **enforce** se pospone hasta que:
1. Las métricas de monitor (Firebase Console → App Check) muestren que la app
   legítima obtiene token de forma fiable, incluido dentro del WebView de Capacitor
   en dispositivo real (no validado en este proyecto todavía).
2. Idealmente, Play Integrity ya sea el proveedor real.

reCAPTCHA v3 se documenta en la política de privacidad como medida de seguridad
(prevención de abuso), no como analítica ni publicidad — Google actúa como encargado
del tratamiento para esta señal.

## Alternativas consideradas

- **No tocar código, esperar a Play Integrity.** Descartada: la ventana de
  exposición ya es real (proyecto Firebase en producción) y Play Integrity depende de
  tres bloqueos externos encadenados sin fecha. La integración en modo monitor es
  pequeña, no rompe nada, y no impide migrar a Play Integrity después.
- **`CustomProvider` respaldado por una Cloud Function.** Descartada: sin una
  atestación de dispositivo/servidor previa que traducir a token, es un problema del
  huevo y la gallina — más una función nueva que mantener. Sobreingeniería para el
  problema actual.
- **`ReCaptchaEnterpriseProvider`.** Descartada por ahora: exige habilitar
  facturación de reCAPTCHA Enterprise en GCP y tiene mayor huella de señales
  enviadas a Google — peor encaje con ADR-001 (sin tracking de terceros) en una app de
  menores. Queda como posible escalada solo si el abuso persiste con la v3 estándar.
- **Solo mitigaciones sin App Check** (protección de enumeración, cuotas). Ya activas
  (ADR-003 §2) pero insuficientes solas: no frenan el alta masiva de cuentas ni el
  spam de verificación/reset desde una key robada.

## Consecuencias

**Positivas:** mitigación disponible hoy sin arriesgar a usuarios legítimos (modo
monitor), con telemetría para decidir el enforce con datos reales; el punto de
extensión deja preparado el cambio a Play Integrity sin reescritura; ataca también el
abuso de endpoints de Auth (Identity Platform sí admite enforce de App Check), no
solo Firestore.

**Negativas / trade-offs:**
- Introduce un script de un tercero (Google) ejecutándose en la página, en tensión
  con el principio de ADR-001 de no usar tracking de terceros — mitigado por el
  encuadre de "puente temporal" y por documentarlo explícitamente como medida de
  seguridad en la política de privacidad, no como analítica.
- reCAPTCHA v3 dentro de un WebView de Capacitor **no está validado** en este
  proyecto — motivo por el que el enforce no se activa hasta comprobarlo en
  dispositivo real.
- La obtención de un token de App Check requiere red hacia Google. En modo monitor
  es irrelevante; si algún día se activa enforce, hay que reconciliarlo con el
  principio offline-first (ADR-003 §3: el niño juega sin conexión) — otro motivo para
  no adelantar el enforce sin validarlo.
- Play Integrity sigue siendo el destino preferido, no solo por ser más fuerte
  técnicamente sino por mejor encaje de privacidad en una app infantil: es una
  atestación de integridad de app/dispositivo vía Play services, no un script de
  scoring conductual en la página.

**Riesgos operativos a vigilar:**
- El dominio/origen real que sirve el WebView de Capacitor debe registrarse en el
  admin de reCAPTCHA — sin eso, no se emite token ni en desarrollo.
- El debug token de App Check nunca debe viajar en un build de producción (el código
  ya lo condiciona a `!import.meta.env.PROD`).
- La site key es pública por diseño (misma postura que el resto de `VITE_FIREBASE_*`
  en `.env.production`); el secreto correspondiente vive únicamente del lado de
  Google, nunca en el repositorio.

## Camino a Play Integrity (trabajo futuro)

Migrar a Play Integrity requiere, a la vez: keystore de release real (secretos
`ANDROID_KEYSTORE_*`), acceso a Google Play Console, y un plugin nativo de Capacitor
para App Check (p. ej. `@capacitor-firebase/app-check`). Este último se empareja de
forma natural con `@capacitor-firebase/authentication`, ya pendiente por el mismo
motivo (Google Sign-In no es fiable vía `signInWithPopup` en el WebView). Vale la pena
tratar ambos como un mismo incremento futuro de migración a plugins nativos de
`@capacitor-firebase/*`.

## Impacto de versión

**PATCH** (`0.6.1`). Endurecimiento de seguridad interno: en modo monitor no cambia
ningún comportamiento observable para el usuario legítimo, no añade capacidad de
usuario ni cambia contrato de API.

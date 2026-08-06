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

## Extensión 2026-08-06 — Alcance por modelo de cuenta (pregunta de Responsabilidad Social, PR #35)

**Decisión: App Check se mantiene GLOBAL — se inicializa en el arranque para toda
sesión, incluido el Modelo B (niño con cuenta Google). No se acota al Modelo A. El
código actual (`initializeAppCheckOnce`, global y previo a la primera llamada de Auth)
es el correcto y NO debe hacerse condicional por rol. Sin cambio de código.**

### La pregunta

Responsabilidad Social (gate de la PR #35) planteó si el dispositivo de un niño
(Modelo B, ADR-004) debe cargar y ejecutar el script de reCAPTCHA de un tercero, cuando
el vector de abuso que motivó App Check (alta masiva, spam de verificación/reset) vive
en el flujo **email/contraseña**, que solo existe en el Modelo A. El Modelo B usa Google
Sign-In, con su propia protección antiabuso. La intuición —minimizar la exposición del
menor a señales de terceros— es legítima y coherente con el principio de minimización
que rige ADR-004.

### Por qué acotar a Modelo A es técnicamente inviable, no solo subóptimo

Tres propiedades de App Check, encadenadas con el orden real del flujo de entrada
(`AppRoot.tsx`), lo cierran:

1. **App Check se adjunta al `FirebaseApp`, no a un flujo de autenticación.** Una vez
   inicializado, toda llamada de red (Auth, Firestore) de esa instancia lleva el token.
   No es configurable por rol, por usuario ni por endpoint.
2. **El enforce es server-side y por producto** (toggle de consola: Firestore o Auth,
   cada uno completo), **nunca por rol ni por endpoint.** No existe "enforce solo
   `accounts:signUp`" ni "enforce Firestore solo para tutores".
3. **El rol no se conoce hasta _después_ de autenticar.** El mismo `signInWithGoogle()`
   sirve al tutor-Google y al niño; el rol se elige en `RoleChoiceScreen` ya con sesión
   abierta. En el instante de la llamada de red de auth —que **es** el vector de abuso
   de este ADR (`accounts:signUp`, `accounts:sendOobCode`)— la app no sabe ni puede
   saber si es Modelo A o B.

Consecuencias directas:

- **Diferir App Check "hasta saber que es tutor" no protege el vector.** Cuando el rol
  es conocido, las llamadas de abuso (signup, verify, reset) ya ocurrieron. Peor aún:
  un atacante con la key robada abusa de esos endpoints **fuera de la app**, sin pulsar
  ningún botón; solo el enforce con token en *toda* llamada legítima lo bloquea. Acotar
  por rol dejaría esos endpoints sin cobertura para todos, no solo para el Modelo B.
- **No hay token sin script.** El proveedor de App Check *es* reCAPTCHA; obtener el token
  al arranque (necesario para cubrir Auth pre-rol) implica cargar el script en todo
  dispositivo, incluido el del niño. No existe "cubrir Auth del tutor sin cargar
  reCAPTCHA en el dispositivo del niño", porque al arrancar ambos son indistinguibles.
- **El enforce de Auth arrastra al niño igualmente.** `signInWithIdp` (Google) y el
  refresh del token son endpoints de Identity Platform: con Auth en enforce, la sesión
  del niño necesita token en el sign-in y en cada refresh. Sin App Check inicializado, su
  Google Sign-In y su sesión se romperían. ADR-004 §7 ya anticipaba "App Check en la ruta
  de Google" cubriendo también al niño; mantenerlo global es coherente con esa postura.

### Impacto en el enforce futuro (respuesta explícita)

Mantenerlo global es precisamente lo que **conserva abierta** la vía de enforce para
ambos modelos: con token en toda sesión, tanto Firestore-enforce como Auth-enforce
podrían aplicarse al niño sin excluirlo. Haberlo acotado al Modelo A habría **cerrado
para siempre** el enforce de Firestore sobre las escrituras del niño (bloqueadas por
falta de token) y **roto** su Google Sign-In bajo Auth-enforce. Es decir: la opción que
"protege menos al niño de reCAPTCHA" es también la que le **impediría** beneficiarse del
enforce el día que se active — lo contrario de lo que se busca. (El paso a enforce sigue
condicionado a lo ya fijado en este ADR: validación en dispositivo real, reconciliación
con offline-first, y criterios de corte de Seguridad en `pending-actions.md`.)

### Cómo se responde de verdad a la preocupación de Responsabilidad Social

La preocupación es válida y su resolución **no** es el alcance por rol (imposible), sino
**la migración a Play Integrity** — que este ADR ya fija como destino preferido y que RS
ahora refuerza con una razón concreta y de peso: Play Integrity es una atestación de
integridad de app/dispositivo vía Play Services, **no un script de scoring conductual de
un tercero ejecutándose en la página del menor**. Migrar a Play Integrity elimina de raíz
la exposición que RS señala, para ambos modelos. Se eleva la prioridad de esa migración
por este motivo, además del técnico ya registrado.

Justificación a reforzar en ADR/política de privacidad, mientras reCAPTCHA sea el
proveedor (para el gate de RS y la revisión legal humana ya pendiente):

- reCAPTCHA v3 se carga como **medida de seguridad** (prevención de abuso), **idéntica en
  todo dispositivo porque la superficie que protege —los endpoints de autenticación— se
  ejerce antes de que la app pueda saber si la sesión es de un adulto o de un menor**, y
  el enforce de App Check es por servicio, no por usuario. Distinguir por rol en la capa
  protegida es técnicamente imposible; no es una omisión de diseño.
- Es proporcionada y minimizada: en **modo monitor** no muestra reto ni fricción al niño
  (es invisible), la app **no persiste ningún score ni señal conductual** de reCAPTCHA, y
  el token atesta integridad de la app, no identidad del usuario. Es un **puente temporal**
  documentado hacia Play Integrity.
- La preocupación **legal** derivada (cookies de reCAPTCHA del dominio de Google en el
  dispositivo de un menor — ePrivacy/art. 22.2 LSSI — y el rol contractual real de Google
  en reCAPTCHA v3 estándar) **no la resuelve esta decisión de arquitectura**; sigue viva y
  ya está registrada como bloqueante de la activación de la site key en `pending-actions.md`
  (entrada de revisión legal humana ampliada). Esta decisión solo establece que el alcance
  por rol no es una mitigación disponible, por lo que la mitigación debe venir de Play
  Integrity + el encuadre legal, no de dejar de cargar reCAPTCHA en el Modelo B.

### Nota para la decisión de enforce (no ahora)

Dado que la barrera de autorización real de Firestore son las reglas (deny-by-default +
`uid`/`email_verified`), al llegar el momento del enforce es defendible **enforce solo en
Auth** (donde vive el vector real) y **dejar Firestore en monitor**, reduciendo la huella.
Esto **no** cambia la decisión de esta sección: el niño se autentica igualmente (Google
Sign-In → Auth), así que su dispositivo necesita el token —y por tanto reCAPTCHA al
arranque— aunque Firestore nunca pase a enforce. No hay escenario de enforce que permita
al Modelo B prescindir de App Check.

## Impacto de versión

**PATCH** (`0.6.1`). Endurecimiento de seguridad interno: en modo monitor no cambia
ningún comportamiento observable para el usuario legítimo, no añade capacidad de
usuario ni cambia contrato de API.

> Extensión 2026-08-06 (alcance por modelo de cuenta): **sin impacto de versión** — es
> una aclaración de diseño que confirma el comportamiento ya implementado; no toca código.

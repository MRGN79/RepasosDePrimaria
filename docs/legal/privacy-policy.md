# Política de Privacidad — Repasos de Primaria

> **Documento fuente.** Este archivo es la versión de referencia, redactada y
> validada por el Abogado (ADR-003 §9, US-D3). El texto que ve el usuario dentro
> de la app se sirve por claves i18n desde `locales/{en,es}/legal.json` y debe
> mantenerse equivalente a este documento. Cuando cambie la política, se cambian
> ambos y se actualiza la fecha.
>
> **Última actualización:** 6 de agosto de 2026 · **Versión del texto:** 1.2
>
> **Estado de implementación (importante para la exactitud del documento):** en
> el momento de esta versión, la **cuenta del tutor** (email/contraseña o
> Google) y la **cuenta propia del niño con Google** (ADR-004), junto con el
> **guardado de perfiles y progreso en Cloud Firestore** (ADR-003 §3-5), ya
> están construidas en el código (Incremento 3), funcionando contra el
> **emulador de Firebase**. **No existe todavía un proyecto Firebase real ni
> credenciales de producción** (`.claude/pending-actions.md`): mientras eso no
> ocurra, el código de nube permanece inerte y no hay tratamiento efectivo de
> datos de ningún usuario real. Esta política describe el tratamiento
> **objetivo** del producto, ya materializado en el código, para que quede
> correcta y completa **desde antes** de que exista un proyecto Firebase real.

---

## Versión en español

### 1. Quién es responsable del tratamiento

**Repasos de Primaria** es una aplicación educativa personal y gratuita para el
repaso de contenidos de Educación Primaria. El responsable del tratamiento de los
datos descritos en esta política es la persona titular del proyecto, a quien
puedes dirigirte por los medios indicados en el apartado 12 (Contacto).

La app se distribuye como aplicación instalable en Android. El contenido educativo
funciona sin conexión y sin cuenta; el tratamiento de datos personales se limita a
lo estrictamente necesario para ofrecer, de forma opcional, el guardado del
progreso en la nube a través de una cuenta de madre, padre o tutor.

### 2. Dos formas de jugar: perfil de hijo bajo la cuenta del tutor, o cuenta propia del niño

La aplicación ofrece **dos modelos de cuenta**, y lo que se guarda de un niño o
niña depende de cuál se use:

- **Modelo A — Perfil de hijo bajo la cuenta del tutor (el modelo por defecto).**
  El adulto (madre, padre o tutor) crea la cuenta y, dentro de ella, uno o varios
  **perfiles de hijo**. El niño **no tiene cuenta propia, ni email, ni ningún
  identificador personal**: su perfil se reduce a un apodo y un avatar elegidos de
  una **lista cerrada** (nunca texto libre). El **PIN** que puede proteger ese
  perfil cuando hay más de un hijo es un simple pestillo local para que un hermano
  no abra el perfil equivocado en la misma tablet: **nunca sale del dispositivo**
  y no viaja a ningún servidor.
- **Modelo B — Cuenta propia del niño con Google.** Si el niño ya dispone de su
  propia cuenta de Google (idealmente supervisada por Family Link), puede iniciar
  sesión él mismo, sin pasar por la cuenta de un tutor. En este modelo **el niño sí
  tiene una cuenta y un correo**, gestionados por **Firebase Authentication** —la
  misma infraestructura de Google que gestiona la cuenta del adulto en el Modelo
  A—. La app minimiza lo que persiste de esa cuenta: en **Cloud Firestore nunca se
  guarda el correo, el nombre ni la foto** de la cuenta de Google del niño, solo un
  identificador técnico interno.

Antes de confirmar que una cuenta de Google es la de un adulto, o antes de
registrar el consentimiento para dar de alta la cuenta de un niño, la app plantea
un **reto de adulto** (una operación aritmética sencilla). Es una medida de
**esfuerzo razonable** para reducir altas accidentales o hechas por el propio
niño haciéndose pasar por adulto, **no una verificación de identidad o de edad
fuerte**.

En ambos modelos, todo lo que genera el uso del niño dentro de una sesión
—racha, estrellas, medallas, progreso por materia, preferencias de idioma, sonido
y movimiento— se guarda **en el propio dispositivo** por diseño; con una cuenta
activa (Modelo A o B), ese progreso además se sincroniza en la nube según se
describe en el apartado siguiente.

**Progreso que ya existía antes de crear la cuenta.** Si el niño llevaba tiempo
jugando en este dispositivo sin ninguna cuenta, ese progreso no se pierde: al
crear el primer perfil (Modelo A) o la cuenta propia del niño (Modelo B), la app
traslada automáticamente a la nube todo el progreso ya acumulado en el
dispositivo (de todos los cursos jugados, no solo el activo), avisando antes de
que ocurra en la propia pantalla de creación del perfil. El progreso local no se
borra hasta confirmar que la copia en la nube se ha guardado correctamente; si en
ese momento no hay conexión, el progreso permanece intacto en el dispositivo y el
traslado se completa en cuanto vuelve la red.

### 3. Qué datos tratamos

| Dato | Dónde se trata | Finalidad | Estado |
|---|---|---|---|
| **Correo electrónico y contraseña** del adulto (madre/padre/tutor), Modelo A | Firebase Authentication (Google) | Crear e iniciar la sesión de la cuenta del adulto; enviar el correo de verificación y el de restablecimiento de contraseña | Construido en código (Inc. 2-3); **sin tratamiento efectivo** hasta que exista proyecto Firebase real |
| **Correo, nombre y foto** de la cuenta de Google del adulto o del niño, cuando se usa **Iniciar sesión con Google** (Modelo A o B) | Firebase Authentication (Google) | Autenticar a la persona (adulto o niño) con su cuenta de Google | Construido en código (Inc. 3); **sin tratamiento efectivo** hasta que exista proyecto Firebase real |
| **Progreso de aprendizaje** de cada perfil de hijo o de la cuenta del niño (racha, estrellas, medallas, progreso por materia/tema) | Cloud Firestore (región europea) | Guardar y sincronizar el progreso entre dispositivos | Construido en código (Inc. 3); **sin tratamiento efectivo** hasta que exista proyecto Firebase real |
| **Apodo y avatar** de cada perfil de hijo o de la cuenta del niño, elegidos de una **lista cerrada** | Cloud Firestore (región europea) | Personalizar la experiencia del niño sin usar datos identificativos | Construido en código (Inc. 3); **sin tratamiento efectivo** hasta que exista proyecto Firebase real |
| **Identificador técnico (uid)** de la cuenta de Google del niño, Modelo B | Cloud Firestore (región europea) | Enlazar el perfil del niño con su sesión, sin guardar su correo, nombre ni foto | Construido en código (Inc. 3); **sin tratamiento efectivo** hasta que exista proyecto Firebase real |

La contraseña del adulto es gestionada y almacenada de forma cifrada por Firebase
Authentication; el proyecto **no** ve ni guarda la contraseña en claro.

### 4. Qué datos NO tratamos

- **En Cloud Firestore, ningún dato personal identificativo:** ni nombre real, ni
  apellidos, ni fecha de nacimiento, ni fotografía, ni voz, ni correo —del adulto
  ni del niño, en ninguno de los dos modelos de cuenta—. El apodo procede de una
  lista cerrada. La única excepción es el **uid** técnico de la cuenta de Google
  del niño en el Modelo B, que no es por sí mismo un dato identificativo legible.
- **El PIN del niño no se guarda en la nube** en ninguna forma (ni siquiera cifrado
  o resumido): vive solo en el almacenamiento seguro del dispositivo. Aplica solo
  al Modelo A (la cuenta propia del niño, Modelo B, no usa PIN).
- **Ni el correo del adulto ni el correo del niño (cuando usa su propia cuenta de
  Google, Modelo B) se copian a la base de datos de progreso** (Firestore): residen
  únicamente en Firebase Authentication, que es su única fuente de verdad para
  ambos.
- **No usamos analítica, ni perfiles publicitarios, ni rastreadores, ni cookies de
  terceros con fines comerciales.** No se realiza publicidad dirigida. **Única
  excepción, estrictamente de seguridad:** para proteger las cuentas frente a abuso
  automatizado (creación masiva de cuentas, envío masivo de correos de verificación
  o de restablecimiento de contraseña), la app usa **Google reCAPTCHA v3** al
  comunicarse con Firebase. reCAPTCHA puede usar cookies u otro almacenamiento del
  dominio de Google y analiza señales técnicas del dispositivo y del comportamiento
  para distinguir un uso legítimo de un abuso automatizado; **no se usa con fines
  analíticos ni publicitarios**. La base jurídica de esta señal es el **interés
  legítimo en la seguridad del servicio** (art. 6.1.f RGPD); puedes **oponerte** a
  este tratamiento (art. 21 RGPD) a través de los canales de contacto de esta
  política. A diferencia del resto de la infraestructura de Firebase —donde Google
  actúa como encargado del tratamiento bajo su DPA—, en el servicio estándar de
  reCAPTCHA v3 Google puede tratar estas señales también para sus propios fines de
  seguridad y prevención de abuso; el encuadre exacto de esa relación está pendiente
  de confirmación por un profesional del derecho, y el objetivo es sustituir
  reCAPTCHA por Play Integrity, que no envía señales de comportamiento a un tercero.
  Aplica por igual en el Modelo A y en el Modelo B (cuenta propia del niño).

### 5. Base jurídica y consentimiento (tratamiento de datos de menores)

**Modelo A (perfil de hijo bajo la cuenta del tutor):** el diseño sitúa
deliberadamente el consentimiento y el control en el **adulto responsable**, no en
el niño. El niño no consiente ni facilita datos personales, porque no tiene cuenta
ni se le piden datos identificativos. El adulto es quien, si lo desea, crea una
cuenta y **da su consentimiento informado** en la pantalla de consentimiento antes
de que se guarde nada en la nube. Ese consentimiento (fecha y versión del texto)
queda registrado asociado a su cuenta.

**Modelo B (cuenta propia del niño con Google):** aquí es el **propio niño** quien
inicia sesión con su cuenta de Google. Antes de completar el alta, la app exige
superar el **reto de adulto** descrito en el apartado 2 y presenta la pantalla de
consentimiento. **Punto legal abierto, señalado expresamente para revisión
humana:** el reto de adulto es una medida de esfuerzo razonable frente a un menor
que se hace pasar por adulto, pero **no constituye por sí solo una verificación de
identidad o de edad fuerte**. Si esa medida basta como mecanismo válido de
consentimiento/autorización parental para la cuenta propia de un menor conforme al
art. 8 RGPD y al art. 7 LOPD-GDD es una cuestión que **debe confirmar un
profesional del derecho colegiado** antes de exponer este modelo a usuarios reales
(ver acción pendiente en `.claude/pending-actions.md`); el equipo que redacta esta
política incluye un componente de revisión automatizada (IA), no un despacho de
abogados.

**Bases jurídicas (art. 6 RGPD):**

- Para la **cuenta del adulto** (email/contraseña o Google) y para la **cuenta
  propia del niño con Google** (Modelo B): **ejecución de la relación de servicio**
  solicitada por quien crea la cuenta y, en lo que exceda de ello, **consentimiento**
  (art. 6.1.a y 6.1.b RGPD); en el caso del niño, sujeto a la confirmación legal
  pendiente indicada arriba.
- Para el **guardado del progreso** en la nube (Modelo A): **consentimiento del
  adulto responsable** (art. 6.1.a RGPD), otorgado en su condición de titular de la
  patria potestad o tutela sobre el menor.

**Menores:** la app está pensada para niños de Primaria (por debajo de la edad de
consentimiento digital: 14 años en España conforme al art. 7 LOPD-GDD, 16 años en
la base del RGPD). En el Modelo A **el tratamiento se apoya en el consentimiento
del adulto**, no del menor, y el niño no aporta datos identificativos. En el
Modelo B el niño aporta su propio correo de Google al iniciar sesión; el
fundamento de esa autorización queda como punto abierto de revisión legal humana,
ya señalado arriba. En ningún caso hay perfilado ni decisiones automatizadas sobre
el menor, ni publicidad dirigida (DSA art. 28).

### 6. Dónde se guardan los datos y transferencias internacionales

- **Cloud Firestore** (progreso y perfiles de hijo) se aloja en **región europea**
  (multi-región de la Unión Europea). Estos datos **no salen del Espacio Económico
  Europeo** en su almacenamiento en reposo.
- **Firebase Authentication** (correo y credenciales del adulto, y correo/nombre/
  foto de la cuenta de Google del niño cuando usa el Modelo B) se ejecuta sobre la
  **infraestructura global de Google y no es fijable a una región concreta de la
  UE**. Esto implica que el tratamiento de esos correos —el del adulto y, en su
  caso, el del niño— puede suponer una **transferencia internacional de datos**
  fuera del EEE.

**Cómo se cubre esa transferencia:** Google Cloud / Firebase actúa como **encargado
del tratamiento** bajo su **Data Processing Addendum (DPA)**, que incorpora las
**Cláusulas Contractuales Tipo (SCCs) de la Comisión Europea (versión 2021)** y las
medidas complementarias post-*Schrems II* para las transferencias a Estados Unidos y
otros terceros países. En la medida en que el destinatario esté certificado, resulta
además aplicable el **Data Privacy Framework UE-EEUU (2023)**.

> **Acción del responsable pendiente de ejecución material:** aceptar y conservar
> evidencia del **DPA de Google/Firebase** en la consola del proyecto, y verificar
> la vigencia del Data Privacy Framework en el momento de la puesta en producción.
> Mientras la cuenta del adulto no esté expuesta a usuarios finales reales, no hay
> transferencia efectiva de datos de usuarios; esta política deja el punto
> documentado y trazable (ADR-003, riesgo de residencia de datos de Auth).

**Minimización como salvaguarda:** el progreso, los perfiles de hijo y el PIN
**nunca** pasan por Authentication, solo por Firestore (región europea). Lo que sí
llega a la infraestructura global de Auth es el **correo del adulto** (Modelo A) y,
cuando se usa el Modelo B, el **correo, nombre y foto de la cuenta de Google del
niño** —exactamente el mismo tratamiento que Google aplica a cualquier cuenta que
inicia sesión con Google, dentro o fuera de esta app—. Firestore, por su parte,
nunca guarda esos datos identificativos: solo el uid técnico.

### 7. Conservación y supresión de los datos

- Los datos se conservan **mientras la cuenta del adulto exista**.
- El adulto puede **borrar un perfil de hijo** o **cerrar la cuenta** desde la
  propia app. El borrado de la cuenta desencadena un **borrado en cascada** de todo
  su árbol de datos en Firestore (perfiles de hijo y su progreso) y la eliminación
  del usuario en Firebase Authentication (ADR-003 §5).
- El progreso guardado localmente en el dispositivo se puede borrar en cualquier
  momento desde **Ajustes → Borrar todos mis datos**.

### 8. Derechos de las personas interesadas (RGPD)

El adulto responsable puede ejercer, respecto de los datos asociados a su cuenta,
los derechos de:

- **Acceso** a sus datos.
- **Rectificación** de datos inexactos.
- **Supresión** ("derecho al olvido") —materializado por el borrado de cuenta en
  cascada.
- **Limitación** y **oposición** al tratamiento.
- **Portabilidad** de los datos.

Para ejercerlos, o para presentar una reclamación, puede dirigirse al responsable
(apartado 12) o a la autoridad de control competente: en España, la **Agencia
Española de Protección de Datos (AEPD)**, `www.aepd.es`.

### 9. Seguridad

- El acceso a los datos en la nube está restringido por **reglas de seguridad de
  Firestore**: cada adulto solo puede leer y escribir los datos bajo su propia
  cuenta, nunca los de otra (ADR-003 §3).
- La escritura en la nube exige **verificación previa del correo** del adulto.
- Las **acciones sensibles** (borrar datos o cerrar la cuenta, cambiar el correo o
  la contraseña) están protegidas por una **puerta parental** que exige
  reautenticación del adulto (ADR-003 §4).
- Se minimiza el dato personal tratado: el correo vive solo en Authentication y el
  PIN solo en el dispositivo.

### 10. No hay decisiones automatizadas ni perfilado

La aplicación no elabora perfiles de comportamiento, no toma decisiones
automatizadas con efectos jurídicos sobre las personas y no realiza publicidad
dirigida a menores.

### 11. Cambios en esta política

Si el tratamiento cambia (por ejemplo, al activarse el guardado en la nube para
usuarios reales), se actualizará esta política, su fecha y su versión, y —cuando el
cambio sea sustancial— se solicitará de nuevo el consentimiento del adulto.

### 12. Contacto

Puedes plantear cualquier cuestión sobre privacidad, o ejercer tus derechos, a
través del **repositorio del proyecto en GitHub**, por el mismo cauce indicado para
el aviso de contenido. Se atenderá y se dará respuesta en un plazo razonable.

---

## English version

### 1. Who is the data controller

**Repasos de Primaria** ("Primary Review") is a personal, free educational app for
reviewing primary-school content. The controller of the data described in this
policy is the project's owner, reachable through the means set out in section 12
(Contact).

The app ships as an installable Android application. The educational content works
offline and without an account; the processing of personal data is limited to what
is strictly necessary to optionally offer cloud saving of progress through a
parent/guardian account.

### 2. Two ways to play: a child profile under the tutor's account, or the child's own account

The app offers **two account models**, and what is stored about a child depends on
which one is used:

- **Model A — Child profile under the tutor's account (the default model).** The
  adult (parent or guardian) creates the account and, inside it, one or more
  **child profiles**. The child **has no account of their own, no email, and no
  personal identifier**: their profile is limited to a nickname and avatar chosen
  from a **fixed list** (never free text). The **PIN** that can protect that profile
  when there is more than one child is just a local latch so a sibling does not
  open the wrong profile on the same tablet: it **never leaves the device** and is
  never sent to any server.
- **Model B — The child's own Google account.** If the child already has their own
  Google account (ideally supervised through Family Link), they can sign in
  themselves, without going through a tutor's account. In this model **the child
  does have an account and an email**, managed by **Firebase Authentication** — the
  same Google infrastructure that manages the adult's account in Model A. The app
  minimises what it stores from that account: **Cloud Firestore never stores the
  email, name or photo** of the child's Google account, only an internal technical
  identifier.

Before confirming that a Google account belongs to an adult, or before recording
consent to create a child's account, the app presents an **adult challenge** (a
simple arithmetic question). This is a **reasonable-effort** measure to reduce
accidental sign-ups or a child posing as an adult, **not a strong identity or age
verification**.

In both models, everything generated by the child's use within a session —streak,
stars, badges, subject progress, language/sound/motion preferences— is stored **on
the device itself** by design; with an active account (Model A or B), that progress
is additionally synced to the cloud as described in the next section.

**Progress that already existed before creating the account.** If the child had
been playing on this device for a while without any account, that progress is not
lost: when the first profile is created (Model A) or the child's own account
(Model B), the app automatically transfers to the cloud all the progress already
built up on the device (from every course played, not just the active one),
warning about it beforehand on the profile-creation screen itself. Local progress
is not deleted until the cloud copy is confirmed to have been saved correctly; if
there is no connection at that moment, the progress stays intact on the device and
the transfer completes once the connection returns.

### 3. What data we process

| Data | Where it is processed | Purpose | Status |
|---|---|---|---|
| Adult's (parent/guardian) **email and password**, Model A | Firebase Authentication (Google) | Create and sign in to the adult account; send verification and password-reset emails | Built in code (Inc. 2-3); **no effective processing** until a real Firebase project exists |
| **Email, name and photo** of the adult's or child's Google account, when using **Sign in with Google** (Model A or B) | Firebase Authentication (Google) | Authenticate the person (adult or child) with their Google account | Built in code (Inc. 3); **no effective processing** until a real Firebase project exists |
| Each child profile's or child account's **learning progress** (streak, stars, badges, subject/topic progress) | Cloud Firestore (European region) | Save and sync progress across devices | Built in code (Inc. 3); **no effective processing** until a real Firebase project exists |
| Each child profile's or child account's **nickname and avatar**, chosen from a **fixed list** | Cloud Firestore (European region) | Personalise the child's experience without identifying data | Built in code (Inc. 3); **no effective processing** until a real Firebase project exists |
| **Technical identifier (uid)** of the child's Google account, Model B | Cloud Firestore (European region) | Link the child's profile to their session, without storing their email, name or photo | Built in code (Inc. 3); **no effective processing** until a real Firebase project exists |

The adult's password is managed and stored encrypted by Firebase Authentication;
the project never sees or stores the password in clear text.

### 4. What data we do NOT process

- **In Cloud Firestore, no identifying personal data:** no real name, surname,
  birth date, photo, voice or email —neither the adult's nor the child's, in
  either account model. The nickname comes from a fixed list. The only exception
  is the technical **uid** of the child's Google account in Model B, which is not
  by itself a readable identifying data point.
- **The child's PIN is never stored in the cloud** in any form: it lives only in the
  device's secure storage. This applies only to Model A (the child's own account,
  Model B, does not use a PIN).
- **Neither the adult's email nor the child's email (when they use their own Google
  account, Model B) are copied into the progress database** (Firestore): both
  reside only in Firebase Authentication, their single source of truth.
- **No analytics, advertising profiles, trackers, or third-party cookies for
  commercial purposes.** No targeted advertising is carried out. **One strictly
  security-related exception:** to protect accounts against automated abuse (mass
  account creation, mass sending of verification or password-reset emails), the app
  uses **Google reCAPTCHA v3** when communicating with Firebase. reCAPTCHA may use
  cookies or other storage on Google's domain, and it analyzes technical device and
  behavioral signals to distinguish legitimate use from automated abuse; **it is not
  used for analytics or advertising purposes**. The legal basis for this signal is
  the **legitimate interest in the security of the service** (Art. 6(1)(f) GDPR); you
  may **object** to this processing (Art. 21 GDPR) through the contact channels in
  this policy. Unlike the rest of the Firebase infrastructure —where Google acts as
  processor under its DPA—, in the standard reCAPTCHA v3 service Google may also
  process these signals for its own security and abuse-prevention purposes; the exact
  characterization of that relationship is pending confirmation by a qualified
  lawyer, and the goal is to replace reCAPTCHA with Play Integrity, which does not
  send behavioral signals to a third party. This applies equally to Model A and Model
  B (the child's own account).

### 5. Legal basis and consent (processing of minors' data)

**Model A (child profile under the tutor's account):** the design deliberately
places consent and control with the **responsible adult**, not the child. The child
does not consent nor provide personal data, because they have no account and are
not asked for identifying data. The adult is the one who, if they wish, creates an
account and **gives informed consent** on the consent screen before anything is
saved in the cloud. That consent (date and version of the text) is recorded against
their account.

**Model B (the child's own Google account):** here it is the **child themselves**
who signs in with their Google account. Before completing sign-up, the app requires
passing the **adult challenge** described in section 2 and shows the consent
screen. **Open legal point, explicitly flagged for human review:** the adult
challenge is a reasonable-effort measure against a minor posing as an adult, but
**it does not by itself amount to strong identity or age verification**. Whether it
suffices as a valid parental consent/authorisation mechanism for a minor's own
account under GDPR Art. 8 and Spain's LOPD-GDD Art. 7 is a question that **must be
confirmed by a qualified legal professional** before this model is exposed to real
users (see the pending action in `.claude/pending-actions.md`); the team drafting
this policy includes an automated (AI) review component, not a law firm.

**Legal bases (Art. 6 GDPR):**

- For the **adult's account** (email/password or Google) and for the **child's own
  Google account** (Model B): performance of the service requested by whoever
  creates the account and, beyond that, **consent** (Art. 6(1)(a) and 6(1)(b) GDPR);
  in the child's case, subject to the pending legal confirmation noted above.
- For **cloud progress saving** (Model A): the **responsible adult's consent** (Art.
  6(1)(a) GDPR), given as holder of parental responsibility over the minor.

**Minors:** the app targets primary-school children, below the age of digital consent
(14 in Spain under Art. 7 LOPD-GDD; 16 under the GDPR baseline). In Model A the
processing relies on the **adult's consent**, not the minor's, and the child
provides no identifying data. In Model B the child provides their own Google email
when signing in; the basis for that authorisation remains the open point for human
legal review noted above. In neither model is there profiling, automated
decision-making about the minor, or advertising directed at minors (DSA Art. 28).

### 6. Where data is stored and international transfers

- **Cloud Firestore** (progress and child profiles) is hosted in a **European
  region** (EU multi-region). This data does **not leave the European Economic Area**
  at rest.
- **Firebase Authentication** (the adult's email and credentials, and the child's
  Google account email/name/photo when Model B is used) runs on **Google's global
  infrastructure and cannot be pinned to a specific EU region**. Processing those
  emails — the adult's and, where applicable, the child's — may therefore involve an
  **international data transfer** outside the EEA.

**How that transfer is covered:** Google Cloud / Firebase acts as **processor** under
its **Data Processing Addendum (DPA)**, which incorporates the European Commission's
**Standard Contractual Clauses (SCCs, 2021 version)** and post-*Schrems II*
supplementary measures. Where the recipient is certified, the **EU-US Data Privacy
Framework (2023)** also applies.

> **Controller action pending material execution:** accept and keep evidence of
> **Google/Firebase's DPA** in the project console, and verify the Data Privacy
> Framework's validity at go-live. While the adult account is not exposed to real
> end users, no effective transfer of user data occurs; this policy keeps the point
> documented and traceable (ADR-003, Auth data-residence risk).

**Minimisation as a safeguard:** progress, child profiles and the PIN **never** pass
through Authentication, only through Firestore (European region). What does reach
Auth's global infrastructure is the **adult's email** (Model A) and, when Model B is
used, the **email, name and photo of the child's Google account** — exactly the
same processing Google applies to any account signing in with Google, inside or
outside this app. Firestore, in turn, never stores that identifying data: only the
technical uid.

### 7. Retention and deletion

- Data is kept **while the adult account exists**.
- The adult can **delete a child profile** or **close the account** from within the
  app. Account deletion triggers a **cascade deletion** of the entire data tree in
  Firestore (child profiles and their progress) and removal of the user from Firebase
  Authentication (ADR-003 §5).
- Progress stored locally can be deleted at any time from **Settings → Delete all my
  data**.

### 8. Data subject rights (GDPR)

The responsible adult may exercise, over the data associated with their account, the
rights of **access, rectification, erasure** (materialised by cascade account
deletion), **restriction, objection** and **portability**. To do so, or to lodge a
complaint, contact the controller (section 12) or the competent supervisory
authority: in Spain, the **Spanish Data Protection Agency (AEPD)**, `www.aepd.es`.

### 9. Security

Cloud access is restricted by **Firestore security rules** (each adult can only read
and write data under their own account); cloud writes require prior **email
verification**; **sensitive actions** are protected by a **parental gate** requiring
re-authentication; and personal data is minimised (email only in Auth, PIN only on
device).

### 10. No automated decisions or profiling

The app does not build behavioural profiles, makes no automated decisions with legal
effects, and carries out no advertising directed at minors.

### 11. Changes to this policy

If the processing changes (for example, when cloud saving is activated for real
users), this policy, its date and version will be updated and —where the change is
substantial— the adult's consent will be requested again.

### 12. Contact

You can raise any privacy question, or exercise your rights, through the **project's
GitHub repository**, via the same channel indicated for the content notice.

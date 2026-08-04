# Política de Privacidad — Repasos de Primaria

> **Documento fuente.** Este archivo es la versión de referencia, redactada y
> validada por el Abogado (ADR-003 §9, US-D3). El texto que ve el usuario dentro
> de la app se sirve por claves i18n desde `locales/{en,es}/legal.json` y debe
> mantenerse equivalente a este documento. Cuando cambie la política, se cambian
> ambos y se actualiza la fecha.
>
> **Última actualización:** 3 de agosto de 2026 · **Versión del texto:** 1.0
>
> **Estado de implementación (importante para la exactitud del documento):** en
> el momento de esta versión, la **cuenta del tutor (Firebase Authentication)**
> ya está construida en el código (Incremento 2, funcionando contra el emulador
> de Firebase mientras no exista proyecto real). El **guardado de perfiles y
> progreso en Cloud Firestore** está **diseñado** (ADR-003 §3-5) pero **aún no
> implementado** (Incrementos 3-5). Esta política describe el tratamiento
> **objetivo** del producto y señala explícitamente qué es ya efectivo y qué está
> pendiente de activarse. Ninguna funcionalidad de nube está expuesta a un usuario
> final hasta que las pantallas de cuenta se integren en el flujo de la app.

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

### 2. Un principio de diseño: los datos del niño no salen del dispositivo

La aplicación está pensada para que la use un niño o niña de Primaria, pero **el
niño no tiene cuenta, ni email, ni ningún identificador personal**. Todo lo que
genera el uso del niño —racha, estrellas, medallas, progreso por materia,
preferencias de idioma, sonido y movimiento— se guarda **en el propio
dispositivo** y sigue estando ahí por diseño.

El **PIN** que puede proteger un perfil de hijo es un simple pestillo local para
que un hermano no abra el perfil equivocado en la misma tablet: **nunca sale del
dispositivo** y no viaja a ningún servidor.

Lo único que puede salir del dispositivo es lo que se describe en el apartado
siguiente, y solo si un adulto crea voluntariamente una cuenta.

### 3. Qué datos tratamos

| Dato | Dónde se trata | Finalidad | Estado |
|---|---|---|---|
| **Correo electrónico y contraseña** del adulto (madre/padre/tutor) | Firebase Authentication (Google) | Crear e iniciar la sesión de la cuenta del adulto; enviar el correo de verificación y el de restablecimiento de contraseña | **Activo** (Inc. 2) |
| **Progreso de aprendizaje** de cada perfil de hijo (racha, estrellas, medallas, progreso por materia/tema) | Cloud Firestore (región europea) | Guardar y sincronizar el progreso entre dispositivos del mismo adulto | **Diseñado, pendiente** (Inc. 3-5) |
| **Apodo y avatar** de cada perfil de hijo, elegidos de una **lista cerrada** | Cloud Firestore (región europea) | Personalizar la experiencia del niño sin usar datos identificativos | **Diseñado, pendiente** (Inc. 3-5) |

La contraseña del adulto es gestionada y almacenada de forma cifrada por Firebase
Authentication; el proyecto **no** ve ni guarda la contraseña en claro.

### 4. Qué datos NO tratamos

- **Ningún dato personal que identifique al niño:** ni nombre real, ni apellidos,
  ni fecha de nacimiento, ni fotografía, ni voz, ni correo. El apodo procede de una
  lista cerrada y no es un dato identificativo del adulto ni del niño.
- **El PIN del niño no se guarda en la nube** en ninguna forma (ni siquiera cifrado
  o resumido): vive solo en el almacenamiento seguro del dispositivo.
- **El correo del adulto no se copia a la base de datos de progreso** (Firestore):
  reside únicamente en Firebase Authentication, que es su única fuente de verdad.
- **No usamos cookies de terceros, ni analítica, ni perfiles publicitarios, ni
  rastreadores.** No se realiza publicidad dirigida.

### 5. Base jurídica y consentimiento (tratamiento de datos de menores)

El diseño del producto sitúa deliberadamente el consentimiento y el control en el
**adulto responsable**, no en el niño:

- **El niño no consiente ni facilita datos personales**, porque no tiene cuenta ni
  se le piden datos identificativos.
- **El adulto** (madre, padre o tutor) es quien, si lo desea, crea una cuenta y
  **da su consentimiento informado** en la pantalla de consentimiento antes de que
  se guarde nada en la nube. Ese consentimiento (fecha y versión del texto) queda
  registrado asociado a su cuenta.

**Bases jurídicas (art. 6 RGPD):**

- Para la **cuenta del adulto** (email y autenticación): **ejecución de la relación
  de servicio** solicitada por el propio adulto y, en lo que exceda de ello,
  **consentimiento** (art. 6.1.a y 6.1.b RGPD).
- Para el **guardado del progreso del perfil de hijo** en la nube: **consentimiento
  del adulto responsable** (art. 6.1.a RGPD), otorgado en su condición de titular de
  la patria potestad o tutela sobre el menor.

**Menores:** la app está pensada para niños de Primaria (por debajo de la edad de
consentimiento digital: 14 años en España conforme al art. 7 LOPD-GDD, 16 años en
la base del RGPD). Por eso **el tratamiento se apoya en el consentimiento del
adulto**, no del menor, y el niño no aporta datos identificativos. No hay perfilado
ni decisiones automatizadas sobre el menor, ni publicidad dirigida (DSA art. 28).

### 6. Dónde se guardan los datos y transferencias internacionales

- **Cloud Firestore** (progreso y perfiles de hijo) se aloja en **región europea**
  (multi-región de la Unión Europea). Estos datos **no salen del Espacio Económico
  Europeo** en su almacenamiento en reposo.
- **Firebase Authentication** (correo y credenciales del adulto) se ejecuta sobre
  la **infraestructura global de Google y no es fijable a una región concreta de la
  UE**. Esto implica que el tratamiento del correo del adulto puede suponer una
  **transferencia internacional de datos** fuera del EEE.

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

**Minimización como salvaguarda:** el único dato personal que llega a la
infraestructura global de Auth es el **correo del adulto** (más las credenciales de
acceso). Ni el progreso, ni los perfiles de hijo, ni el PIN, ni ningún dato del
menor pasan por Authentication.

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

### 2. A design principle: the child's data does not leave the device

The app is meant to be used by a primary-school child, but **the child has no
account, no email and no personal identifier**. Everything the child's use
generates —streak, stars, badges, subject progress, language/sound/motion
preferences— is stored **on the device itself** and stays there by design.

The **PIN** that can protect a child profile is just a local latch so a sibling does
not open the wrong profile on the same tablet: it **never leaves the device** and is
never sent to any server.

The only thing that may leave the device is described in the next section, and only
if an adult voluntarily creates an account.

### 3. What data we process

| Data | Where it is processed | Purpose | Status |
|---|---|---|---|
| Adult's (parent/guardian) **email and password** | Firebase Authentication (Google) | Create and sign in to the adult account; send verification and password-reset emails | **Active** (Inc. 2) |
| Each child profile's **learning progress** (streak, stars, badges, subject/topic progress) | Cloud Firestore (European region) | Save and sync progress across the adult's devices | **Designed, pending** (Inc. 3-5) |
| Each child profile's **nickname and avatar**, chosen from a **fixed list** | Cloud Firestore (European region) | Personalise the child's experience without identifying data | **Designed, pending** (Inc. 3-5) |

The adult's password is managed and stored encrypted by Firebase Authentication;
the project never sees or stores the password in clear text.

### 4. What data we do NOT process

- **No personal data that identifies the child:** no real name, surname, birth date,
  photo, voice or email. The nickname comes from a fixed list and does not identify
  the adult or the child.
- **The child's PIN is never stored in the cloud** in any form: it lives only in the
  device's secure storage.
- **The adult's email is not copied into the progress database** (Firestore): it
  resides only in Firebase Authentication, its single source of truth.
- **No third-party cookies, analytics, advertising profiles or trackers.** No
  targeted advertising is carried out.

### 5. Legal basis and consent (processing of minors' data)

The product deliberately places consent and control with the **responsible adult**,
not the child:

- **The child does not consent nor provide personal data**, because they have no
  account and are not asked for identifying data.
- **The adult** (parent or guardian) is the one who, if they wish, creates an account
  and **gives informed consent** on the consent screen before anything is saved in
  the cloud. That consent (date and version of the text) is recorded against their
  account.

**Legal bases (Art. 6 GDPR):** performance of the service requested by the adult and,
beyond that, the adult's **consent** (Art. 6(1)(a) and 6(1)(b) GDPR); cloud saving of
a child profile's progress relies on the **responsible adult's consent** (Art.
6(1)(a) GDPR), given as holder of parental responsibility over the minor.

**Minors:** the app targets primary-school children, below the age of digital consent
(14 in Spain under Art. 7 LOPD-GDD; 16 under the GDPR baseline). The processing
therefore relies on the **adult's consent**, not the minor's, and the child provides
no identifying data. There is no profiling, automated decision-making about the
minor, or advertising directed at minors (DSA Art. 28).

### 6. Where data is stored and international transfers

- **Cloud Firestore** (progress and child profiles) is hosted in a **European
  region** (EU multi-region). This data does **not leave the European Economic Area**
  at rest.
- **Firebase Authentication** (the adult's email and credentials) runs on **Google's
  global infrastructure and cannot be pinned to a specific EU region**. Processing the
  adult's email may therefore involve an **international data transfer** outside the
  EEA.

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

**Minimisation as a safeguard:** the only personal data reaching Auth's global
infrastructure is the **adult's email** (plus login credentials). No progress, child
profiles, PIN or any minor's data passes through Authentication.

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

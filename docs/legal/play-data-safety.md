# Google Play — Declaración de Seguridad de los Datos (Data Safety)

**Proyecto:** Repasos de Primaria
**Fecha:** 3 de agosto de 2026 · **Autor:** Abogado (agente) · **Estado:** Referencia
**Ámbito:** documento **interno** de desarrollo. No se despliega. Sirve de guía para
rellenar el formulario **Data Safety** de Google Play Console cuando el usuario prepare
la publicación (no hay acceso a Play Console desde el entorno de desarrollo).

> Este mapeo refleja el **diseño objetivo** de ADR-003 **y de ADR-004** (cuenta propia
> del niño con Google). Debe reverificarse contra el estado real de implementación en
> el momento de la publicación: si el guardado en la nube (Firestore) aún no estuviera
> activo para usuarios reales, la sección de datos del niño se declara conforme a lo
> que efectivamente se recoja en esa fecha.
>
> **Cambio introducido por ADR-004 respecto a la versión anterior de este mapeo:** la
> app admite ahora una **cuenta propia del niño** (Google Sign-In, sin pasar por un
> tutor). Cuando se usa ese modelo, la app **sí recopila correo, nombre y foto de un
> menor** (vía Firebase Authentication) — antes este documento asumía que el único
> dato personal recogido era el del adulto. Ver el detalle en las secciones 1, 2.1 y 4.

---

## 1. Resumen para el formulario

| Pregunta de Play Console | Respuesta |
|---|---|
| ¿La app recopila o comparte datos de usuario? | **Sí** — correo del adulto (Modelo A); correo/nombre/foto de la cuenta de Google del adulto o del niño cuando se usa "Iniciar sesión con Google" (Modelo A o B, ADR-004); progreso del perfil de hijo o de la cuenta del niño sin PII adicional en Firestore |
| ¿Los datos se transfieren cifrados en tránsito? | **Sí** (HTTPS/TLS de Firebase) |
| ¿El usuario puede solicitar la eliminación de sus datos? | **Sí** (borrado de cuenta en cascada + borrado local) |
| ¿Hay un método para solicitar la eliminación? | **Sí** (desde la app; contacto vía repositorio) |
| ¿La app está dirigida a menores / participa en Families? | **Sí** — público que incluye menores. Aplica **Families Policy** y **Teacher Approved / Designed for Families** según se decida al publicar |
| ¿Se comparten datos con terceros? | **No** se "comparten" en el sentido de Play (no hay cesión a terceros con fines propios). Firebase actúa como **encargado** (proveedor de servicio), no como tercero receptor |
| ¿Se usan datos para publicidad o marketing? | **No** |
| ¿Se realiza seguimiento de usuarios (tracking) con fines publicitarios? | **No** |

---

## 2. Mapeo por tipo de dato (categorías de Play)

### 2.1 Datos recopilados

| Categoría Play | Tipo concreto | ¿Recopilado? | ¿Compartido? | Finalidad (Play) | Obligatorio | Notas |
|---|---|---|---|---|---|---|
| **Información personal** | Direcciones de correo electrónico | **Sí** — del adulto (Modelo A) **y, cuando el niño usa su propia cuenta de Google (Modelo B, ADR-004), también del menor** | No | Gestión de la cuenta; autenticación | Opcional (solo si se crea una cuenta) | Reside solo en Firebase Auth; en Firestore nunca se copia |
| **Información personal** | Nombre y foto de perfil | **Sí** — solo si se usa "Iniciar sesión con Google" (adulto o niño); nombre/foto proceden de la cuenta de Google, no se piden por formulario | No | Autenticación | Opcional | Igual que el correo: solo en Firebase Auth, nunca en Firestore |
| **Información personal** | Otros identificadores (apodo/avatar de perfil en la app) | Sí (perfil de hijo o cuenta del niño) | No | Personalización | Opcional | El apodo procede de una **lista cerrada**; no es un identificador personal por sí mismo |
| **Actividad en la app** | Progreso / interacciones en la app (progreso de aprendizaje) | Sí (perfil de hijo) | No | Funcionalidad de la app (guardar/sincronizar) | Opcional | Sin PII del menor |
| **Info de la app y rendimiento** | Registros de fallos, diagnósticos | No | — | — | — | No se integra analítica ni crash reporting de terceros |
| **Identificadores del dispositivo o de otro tipo** | Device ID / user ID publicitario | No | — | — | — | No se usa ID publicitario |
| **Ubicación** | Aproximada o precisa | No | — | — | — | — |
| **Datos de salud / financieros / mensajes / fotos / contactos / audio** | — | No | — | — | — | — |

### 2.2 Credenciales

- La **contraseña** del adulto se gestiona por Firebase Authentication (almacenada
  cifrada por el proveedor). En el formulario de Play, las credenciales de la cuenta
  del usuario se declaran dentro de "Información personal → otra información", indicando
  que se usan **solo para autenticación** y **no se comparten**.

---

## 3. Prácticas de seguridad declaradas

- **Cifrado en tránsito:** Sí (TLS de Firebase).
- **Cifrado en reposo:** Sí (cifrado gestionado por Google Cloud / Firestore).
- **Eliminación de datos:** el usuario puede **cerrar la cuenta** y desencadenar el
  **borrado en cascada** de todos sus datos (ADR-003 §5); el progreso local se borra
  desde Ajustes.
- **Revisión independiente de seguridad:** no aplica (proyecto personal); los controles
  se auditan internamente (agente Seguridad).

---

## 4. Cumplimiento para público infantil (Families)

- La app se usa por **menores**, bajo la cuenta de un adulto (Modelo A, mayoría de
  casos esperados) o, si el niño ya tiene su propia cuenta de Google, con esa cuenta
  directamente (Modelo B, ADR-004). Al publicar, procede completar la sección
  **"Público objetivo y contenido"** declarando que incluye a niños, y cumplir la
  **Families Policy** de Google Play:
  - Sin publicidad dirigida a menores ni anuncios inapropiados.
  - **Modelo A:** sin recogida de datos personales identificativos del menor (se
    cumple por diseño: apodo/avatar de lista cerrada, sin PII).
  - **Modelo B:** al admitir que el propio niño inicie sesión con su cuenta de
    Google, la app **sí recopila correo/nombre/foto de un menor** vía Firebase
    Authentication. Esto activa con mayor probabilidad la obligación de
    inscripción en **"Designed for Families"** (revisión adicional de Google) y
    refuerza la necesidad de la **revisión legal humana** ya pendiente (no solo del
    agente Abogado) sobre si el "reto de adulto" del alta es suficiente como
    mecanismo de autorización antes de permitir el inicio de sesión directo del
    menor.
  - API de consentimiento parental / controles cuando aplique.
- Coherencia con la política de privacidad (`docs/legal/privacy-policy.md`) y con la
  DPIA (`docs/legal/dpia.md`, riesgo R9): el consentimiento y el control residen en
  el adulto en el Modelo A; en el Modelo B es el menor quien inicia sesión tras el
  reto de adulto, punto que queda documentado como abierto para revisión legal
  humana en ambos documentos.

---

## 5. Acción pendiente del usuario

- Rellenar el formulario **Data Safety** en Play Console con este mapeo cuando se
  prepare la subida a Google Play.
- Enlazar en la ficha de Play la **URL pública de la política de privacidad** (Play la
  exige). Hoy la política vive dentro de la app y como documento fuente; para Play habrá
  que **publicarla en una URL accesible** (decisión y acción del usuario; registrada en
  `.claude/pending-actions.md`).

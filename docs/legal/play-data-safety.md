# Google Play — Declaración de Seguridad de los Datos (Data Safety)

**Proyecto:** Repasos de Primaria
**Fecha:** 3 de agosto de 2026 · **Autor:** Abogado (agente) · **Estado:** Referencia
**Ámbito:** documento **interno** de desarrollo. No se despliega. Sirve de guía para
rellenar el formulario **Data Safety** de Google Play Console cuando el usuario prepare
la publicación (no hay acceso a Play Console desde el entorno de desarrollo).

> Este mapeo refleja el **diseño objetivo** de ADR-003. Debe reverificarse contra el
> estado real de implementación en el momento de la publicación: si el guardado en la
> nube (Firestore) aún no estuviera activo para usuarios reales, la sección de datos
> del niño se declara conforme a lo que efectivamente se recoja en esa fecha.

---

## 1. Resumen para el formulario

| Pregunta de Play Console | Respuesta |
|---|---|
| ¿La app recopila o comparte datos de usuario? | **Sí** (correo del adulto; progreso del perfil de hijo sin PII) |
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
| **Información personal** | Direcciones de correo electrónico | Sí (solo adulto) | No | Gestión de la cuenta; autenticación | Opcional (solo si el adulto crea cuenta) | Reside solo en Firebase Auth |
| **Información personal** | Nombre, apellidos, otros identificadores | No | — | — | — | El apodo procede de lista cerrada; no es identificador |
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

- La app se usa por **menores** bajo la cuenta de un adulto. Al publicar, procede
  completar la sección **"Público objetivo y contenido"** declarando que incluye a
  niños, y cumplir la **Families Policy** de Google Play:
  - Sin publicidad dirigida a menores ni anuncios inapropiados.
  - Sin recogida de datos personales del menor (se cumple por diseño: no hay PII del
    menor).
  - API de consentimiento parental / controles cuando aplique.
- Coherencia con la política de privacidad (`docs/legal/privacy-policy.md`) y con la
  DPIA (`docs/legal/dpia.md`): el consentimiento y el control residen en el adulto.

---

## 5. Acción pendiente del usuario

- Rellenar el formulario **Data Safety** en Play Console con este mapeo cuando se
  prepare la subida a Google Play.
- Enlazar en la ficha de Play la **URL pública de la política de privacidad** (Play la
  exige). Hoy la política vive dentro de la app y como documento fuente; para Play habrá
  que **publicarla en una URL accesible** (decisión y acción del usuario; registrada en
  `.claude/pending-actions.md`).

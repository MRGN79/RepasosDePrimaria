# DPIA — Evaluación de Impacto de Protección de Datos

**Proyecto:** Repasos de Primaria (app Android + Firebase)
**Tratamiento evaluado:** cuenta de tutor y guardado en la nube del progreso de
perfiles de hijo (ADR-003), **más la cuenta propia del niño con Google** (ADR-004).
**Fecha:** 4 de agosto de 2026 · **Autor:** Abogado (agente) · **Estado:** Vigente
**Ámbito:** documento **interno** de desarrollo. No se despliega ni se publica en la
app (archivo privado del proceso — ver "Archivos Privados" en `CLAUDE.md`).

> **Por qué se realiza esta DPIA.** El tratamiento afecta a la actividad de **niños
> de Primaria** (menores de la edad de consentimiento digital) y a datos personales
> de sus tutores —y, desde ADR-004, potencialmente del propio niño cuando usa su
> cuenta de Google—. El art. 35 RGPD exige DPIA cuando el tratamiento entraña un alto
> riesgo; el propio criterio del equipo (agente Abogado) la considera **obligatoria**
> por tratarse de un servicio dirigido a un contexto de uso por menores. Se evalúa el
> **diseño completo** de ADR-003 (Authentication + Firestore + borrado en cascada +
> puerta parental) **y de ADR-004** (coexistencia de cuenta de tutor y cuenta de
> niño), no solo lo ya implementado.

---

## 1. Descripción sistemática del tratamiento

### 1.1 Naturaleza, alcance, contexto y fines

- **Fin:** permitir que un adulto (madre/padre/tutor) guarde y sincronice en la nube
  el progreso de aprendizaje de uno o varios perfiles de hijo, y recupere ese
  progreso en distintos dispositivos. El uso educativo del niño en sí funciona en
  local y sin cuenta.
- **Naturaleza:** app instalable en Android (Capacitor sobre frontend web). Backend
  gestionado Firebase (Authentication + Cloud Firestore + Cloud Functions).
- **Alcance:** producto personal y gratuito. Volumen esperado bajo. Mercado inicial
  España; interfaz EN/ES.
- **Contexto:** los usuarios finales del contenido son niños; el titular de la cuenta
  y de la decisión de guardar en la nube es siempre un adulto.

### 1.2 Datos, interesados y flujos

| Categoría de dato | Interesado | Dónde reside | ¿Sale del EEE? |
|---|---|---|---|
| Correo y contraseña del adulto | Adulto (tutor) | Firebase Authentication (infra global Google) | **Posible** (Auth no fijable a UE) |
| Correo, nombre y foto de la cuenta de Google del adulto (Modelo A, alta con Google) | Adulto (tutor) | Firebase Authentication (infra global Google) | **Posible** (Auth no fijable a UE) |
| **Correo, nombre y foto de la cuenta de Google del niño (Modelo B, ADR-004)** | **Menor (identificado por su cuenta de Google)** | Firebase Authentication (infra global Google) | **Posible** (Auth no fijable a UE) |
| Registro de consentimiento (fecha/versión) | Adulto | Cloud Firestore (región UE) | No (en reposo) |
| Progreso de aprendizaje del perfil de hijo o de la cuenta del niño | Menor (no identificado en Firestore) | Cloud Firestore (región UE) | No |
| Apodo + avatar (lista cerrada) | Menor (no identificado en Firestore) | Cloud Firestore (región UE) | No |
| `uid` técnico de la cuenta de Google del niño (Modelo B) | Menor (identificador no legible) | Cloud Firestore (región UE) | No |
| PIN del perfil de hijo (Modelo A) | Menor | **Solo dispositivo** (secure storage) | No (nunca sube) |

**Fuente de verdad única del correo:** Firebase Auth. **No** se duplica en Firestore.
**Minimización estructural en Firestore:** ningún dato identificativo del menor pasa
por Firestore (solo `uid` técnico en el Modelo B). **Cambio introducido por ADR-004
respecto a la versión anterior de esta DPIA:** con la cuenta propia del niño (Modelo
B), el dato personal que puede transferirse fuera del EEE **ya no se limita al
correo del adulto** — se añade el correo, nombre y foto de la cuenta de Google del
**propio menor**, tratados por Firebase Authentication exactamente igual que los del
adulto. Esto es la fuente del riesgo R9 (§3).

### 1.3 Encargados y transferencias

- **Google Ireland / Google LLC** como encargado del tratamiento (Firebase), bajo su
  **DPA** con **SCCs 2021** y medidas post-*Schrems II*; en su caso, **Data Privacy
  Framework UE-EEUU (2023)**.
- No hay otros encargados, ni cesiones a terceros, ni analítica, ni publicidad, ni
  cookies de terceros.

---

## 2. Necesidad y proporcionalidad

- **Base jurídica:** consentimiento del adulto (art. 6.1.a RGPD) para el guardado del
  progreso del perfil de hijo; ejecución de servicio + consentimiento para la cuenta
  del adulto (art. 6.1.a/b). El menor no consiente ni aporta datos identificativos.
- **Minimización (art. 5.1.c):** no se recoge ningún PII del menor. El apodo procede
  de lista cerrada. El correo del adulto no se replica fuera de Auth. El PIN no sale
  del dispositivo.
- **Limitación de finalidad (art. 5.1.b):** los datos se usan solo para el guardado y
  la sincronización del progreso y la autenticación del adulto.
- **Exactitud y conservación (art. 5.1.d/e):** datos conservados mientras exista la
  cuenta; borrado en cascada a solicitud (derecho de supresión).
- **Transparencia (arts. 12-13):** política de privacidad accesible desde la app y
  pantalla de consentimiento previa en lenguaje claro.
- **Proporcionalidad del guardado en la nube:** es **opcional**; sin cuenta, la app
  funciona íntegramente en local. El usuario elige activarlo.

---

## 3. Identificación y evaluación de riesgos

| # | Riesgo | Prob. | Impacto | Nivel | Medidas mitigadoras |
|---|---|---|---|---|---|
| R1 | Acceso de un tutor a datos de otra cuenta | Baja | Alto | Medio | Reglas Firestore por `uid` + `email_verified`; tests de reglas de acceso cruzado (US-C2) |
| R2 | Exposición de PII del menor | Muy baja | Alto | Medio | Por diseño no se recoge PII del menor; apodo de lista cerrada; validación del campo `mote` |
| R3 | Transferencia internacional del correo del adulto (Auth global) | Media | Medio | Medio | Minimización (solo correo); DPA + SCCs 2021 + DPF; documentado en política y ADR-003 |
| R4 | Caché offline sin cifrar con datos sensibles | Baja | Medio | Bajo | Email fuera de Firestore; PIN fuera de Firestore; solo progreso sin PII en caché |
| R5 | Acción destructiva ejecutada por un niño (borrar cuenta/datos) | Media | Medio | Medio | Puerta parental: reautenticación del adulto para acciones de cuenta; reto de adulto para destructivas locales (ADR-003 §4) |
| R6 | Enumeración de cuentas / abuso de API key | Media | Bajo | Bajo | Email Enumeration Protection activado; API key de la app Android restringida por SHA-1 — la de la app **Web** (la que usa esta app) no admite esa restricción, su mitigación es App Check en modo monitor (R10, ADR-005) |
| R7 | Persistencia de datos tras baja (no se cumple supresión) | Baja | Alto | Medio | Cloud Function de recursive delete de todo el árbol + borrado en Auth (ADR-003 §5) |
| R8 | Suplantación con correo no verificado | Baja | Medio | Bajo | Verificación de correo obligatoria antes de escribir en la nube; refresh de token |
| **R9** | **Transferencia internacional de PII de un menor identificado (correo/nombre/foto de su propia cuenta de Google, Modelo B, ADR-004)** | Media | **Alto** | **Alto** | DPA + SCCs 2021 + DPF (misma cobertura contractual que R3, pero aplicada ahora a datos del menor, no solo del adulto); reto de adulto antes del alta (esfuerzo razonable, no verificación fuerte — **su suficiencia como consentimiento parental está pendiente de revisión legal humana**, ver §5); minimización en Firestore (solo `uid`); ninguna funcionalidad activa hasta que exista proyecto Firebase real |
| R10 | Tercero (Google reCAPTCHA v3) recibe señales del dispositivo con fines antiabuso (App Check, ADR-005), posiblemente del dispositivo de un menor (Modelo B) | Baja | Medio | Bajo | Uso estrictamente de seguridad, no analítico ni publicitario; base jurídica interés legítimo (art. 6.1.f) con derecho de oposición (art. 21); modo monitor (no bloquea); **hoy sin site key configurada → App Check ausente (no-op): no hay flujo de datos a Google todavía**; proveedor interino hasta Play Integrity —atestación de dispositivo sin scoring conductual—. **Advertencia:** el servicio estándar de reCAPTCHA v3 **no se rige por el DPA de Firebase** (a diferencia de R3/R9); Google puede tratar la señal con fines propios de seguridad → el encuadre "encargado" **no puede darse por sentado** y queda pendiente de revisión legal humana antes de activar la site key (posible régimen de responsable/corresponsable; valorar reCAPTCHA Enterprise —sí bajo Cloud DPA— o Play Integrity como salida) |

**Nota sobre R9:** es el riesgo de mayor impacto de esta DPIA porque combina dos
factores agravantes del art. 35 RGPD — datos de un **menor** y una **transferencia
internacional** — sobre un dato directamente identificativo (correo). Se califica
"Alto" en impacto pese al bajo volumen esperado del proyecto, precisamente porque el
umbral de proporcionalidad para datos de menores es más exigente. Ver condición 5 en
§5.

---

## 4. Medidas para afrontar los riesgos (síntesis de controles)

- **Control de acceso:** reglas Firestore estrictas por `uid` + `email_verified`;
  allowlist de campos; inmutabilidad de `consentimiento` y `createdAt`.
- **Minimización de PII:** correo solo en Auth; PIN solo en dispositivo; sin datos
  identificativos del menor; apodo de catálogo cerrado.
- **Puerta parental:** reautenticación para acciones de cuenta/credenciales; reto de
  adulto para destructivas locales.
- **Supresión efectiva:** Cloud Function de borrado en cascada + eliminación en Auth.
- **Seguridad de plataforma:** App Check con reCAPTCHA v3 en modo monitor
  (proveedor interino hasta que Play Integrity sea viable; ver ADR-005), API key
  restringida donde aplica, endurecimiento de WebView y del pipeline de firma
  (ADR-003 §7-8). reCAPTCHA v3 introduce un tercero (Google) que recibe señales del
  dispositivo con fines antiabuso, no analíticos ni publicitarios — ver R10.
- **Transparencia y consentimiento:** política de privacidad en la app; registro de
  consentimiento con fecha y versión.
- **Residencia:** Firestore en región UE; para Auth, cobertura contractual (DPA/SCCs)
  y minimización del dato transferido.

---

## 5. Riesgo residual y conclusión

Tras aplicar las medidas del Modelo A (solo cuenta de tutor), el riesgo residual de
esa parte del tratamiento es **BAJO-MEDIO**. La incorporación del **Modelo B**
(cuenta propia del niño, ADR-004) añade el riesgo **R9** (Alto impacto): eleva el
riesgo residual **global** de esta DPIA a **MEDIO**, no ya bajo-medio, mientras no se
cumpla la condición 5 siguiente. Se considera **aceptable para continuar el
desarrollo** (el tratamiento sigue inerte: no hay proyecto Firebase real ni usuarios
expuestos), pero **no para exponer el Modelo B a usuarios reales**, condicionado a:

1. **Ejecutar materialmente** la aceptación y conservación del **DPA de
   Firebase/Google** en la consola del proyecto (acción del usuario; registrada en
   `.claude/pending-actions.md`).
2. **Implementar** las reglas de seguridad, la puerta parental y el borrado en
   cascada tal como los define ADR-003 (Incrementos 3-5) **antes** de exponer el
   guardado en la nube a usuarios reales.
3. **Verificar** en QA/Seguridad los tests de reglas de acceso cruzado y la
   restricción de la API key.
4. **Revisar** la vigencia del Data Privacy Framework y de las SCCs en el momento del
   lanzamiento real en Google Play.
5. **(Nueva, por R9/ADR-004) Obtener revisión legal humana** —no solo del agente
   Abogado— sobre si el reto de adulto es un mecanismo de consentimiento/autorización
   parental válido para que un menor abra y use su propia cuenta de Google dentro de
   esta app (art. 8 RGPD, art. 7 LOPD-GDD), **antes** de exponer el Modelo B a
   usuarios reales. Esta condición es más estricta que las condiciones 1-4: mientras
   no se cumpla, el Modelo B (cuenta propia del niño) no debe activarse en producción,
   aunque el Modelo A (perfil bajo la cuenta del tutor) sí pueda avanzar con las
   condiciones 1-4.

**Sobre la consulta previa a la AEPD (art. 36 RGPD):** con el Modelo A únicamente, el
riesgo residual no alcanzaba el umbral de consulta previa. **Con la incorporación del
Modelo B (R9), esta conclusión debe revisarse** como parte de la condición 5: la
combinación de datos de un menor identificado + transferencia internacional es
precisamente el tipo de tratamiento que el art. 36 RGPD contempla para la consulta
previa, y la decisión de si es necesaria no debe tomarla en solitario un agente de
IA. Se reevaluará esta DPIA si cambian la escala del tratamiento, las categorías de
datos, o el marco de transferencias internacionales.

---

## 6. Trazabilidad

- Decisión de arquitectura y controles técnicos: `docs/decisions/ADR-003-android-firebase.md` y `docs/decisions/ADR-004-cuentas-adulto-y-nino.md`.
- Especificación funcional y criterios: `docs/specs/07-app-android-firebase.md` (US-C1, US-C2, US-D2, US-D3).
- Política de privacidad de cara al usuario: `docs/legal/privacy-policy.md` y `locales/{en,es}/legal.json`.
- Mapeo de Play Data Safety: `docs/legal/play-data-safety.md`.

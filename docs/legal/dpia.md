# DPIA — Evaluación de Impacto de Protección de Datos

**Proyecto:** Repasos de Primaria (app Android + Firebase)
**Tratamiento evaluado:** cuenta de tutor y guardado en la nube del progreso de
perfiles de hijo (ADR-003).
**Fecha:** 3 de agosto de 2026 · **Autor:** Abogado (agente) · **Estado:** Vigente
**Ámbito:** documento **interno** de desarrollo. No se despliega ni se publica en la
app (archivo privado del proceso — ver "Archivos Privados" en `CLAUDE.md`).

> **Por qué se realiza esta DPIA.** El tratamiento afecta a la actividad de **niños
> de Primaria** (menores de la edad de consentimiento digital) y a datos personales
> de sus tutores. El art. 35 RGPD exige DPIA cuando el tratamiento entraña un alto
> riesgo; el propio criterio del equipo (agente Abogado) la considera **obligatoria**
> por tratarse de un servicio dirigido a un contexto de uso por menores. Se evalúa el
> **diseño completo** de ADR-003 (Authentication + Firestore + borrado en cascada +
> puerta parental), no solo lo ya implementado.

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
| Registro de consentimiento (fecha/versión) | Adulto | Cloud Firestore (región UE) | No (en reposo) |
| Progreso de aprendizaje del perfil de hijo | Menor (no identificado) | Cloud Firestore (región UE) | No |
| Apodo + avatar (lista cerrada) | Menor (no identificado) | Cloud Firestore (región UE) | No |
| PIN del perfil de hijo | Menor | **Solo dispositivo** (secure storage) | No (nunca sube) |

**Fuente de verdad única del correo:** Firebase Auth. **No** se duplica en Firestore.
**Minimización estructural:** ningún dato del menor pasa por Authentication; el único
dato personal que puede transferirse fuera del EEE es el correo del adulto.

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
| R6 | Enumeración de cuentas / abuso de API key | Media | Bajo | Bajo | Email Enumeration Protection activado; errores genéricos; API key restringida por app+SHA-256 |
| R7 | Persistencia de datos tras baja (no se cumple supresión) | Baja | Alto | Medio | Cloud Function de recursive delete de todo el árbol + borrado en Auth (ADR-003 §5) |
| R8 | Suplantación con correo no verificado | Baja | Medio | Bajo | Verificación de correo obligatoria antes de escribir en la nube; refresh de token |

---

## 4. Medidas para afrontar los riesgos (síntesis de controles)

- **Control de acceso:** reglas Firestore estrictas por `uid` + `email_verified`;
  allowlist de campos; inmutabilidad de `consentimiento` y `createdAt`.
- **Minimización de PII:** correo solo en Auth; PIN solo en dispositivo; sin datos
  identificativos del menor; apodo de catálogo cerrado.
- **Puerta parental:** reautenticación para acciones de cuenta/credenciales; reto de
  adulto para destructivas locales.
- **Supresión efectiva:** Cloud Function de borrado en cascada + eliminación en Auth.
- **Seguridad de plataforma:** App Check (monitor→enforce), API key restringida,
  endurecimiento de WebView y del pipeline de firma (ADR-003 §7-8).
- **Transparencia y consentimiento:** política de privacidad en la app; registro de
  consentimiento con fecha y versión.
- **Residencia:** Firestore en región UE; para Auth, cobertura contractual (DPA/SCCs)
  y minimización del dato transferido.

---

## 5. Riesgo residual y conclusión

Tras aplicar las medidas, el **riesgo residual es BAJO-MEDIO** y **aceptable** para
poner el tratamiento en producción, condicionado a:

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

**No se requiere consulta previa a la AEPD** (art. 36 RGPD): el riesgo residual, tras
las medidas, no es alto. Se reevaluará esta DPIA si cambian la escala del tratamiento,
las categorías de datos, o el marco de transferencias internacionales.

---

## 6. Trazabilidad

- Decisión de arquitectura y controles técnicos: `docs/decisions/ADR-003-android-firebase.md`.
- Especificación funcional y criterios: `docs/specs/07-app-android-firebase.md` (US-C1, US-C2, US-D2, US-D3).
- Política de privacidad de cara al usuario: `docs/legal/privacy-policy.md` y `locales/{en,es}/legal.json`.
- Mapeo de Play Data Safety: `docs/legal/play-data-safety.md`.

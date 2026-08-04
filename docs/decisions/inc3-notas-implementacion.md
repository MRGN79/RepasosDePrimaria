# Notas de implementación — Incremento 3 (Firestore + perfiles + reglas)

**Fecha:** 2026-08-04
**Autor:** Arquitecto (con Seguridad), como notas de implementación de ADR-003 y
ADR-004. **No** son un cambio de ADR: recogen detalles que los ADR dejaron
abiertos y se cerraron al implementar. Si alguno se considerara significativo,
promocionarlo a ADR.

## 1. `displayName` / `photoURL` prohibidos en TODO documento

ADR-003 §3 contemplaba un `displayName?` opcional del tutor en `users/{uid}`.
En la implementación se ha optado por **no persistir `displayName` en ningún
documento** y por que las reglas lo **rechacen** (junto a `photoURL`, `email`,
`name`, `birthDate`, PIN). Motivos:

- Alinea con la minimización máxima de ADR-004 §3 ("de la cuenta solo se
  persiste el `uid`") y con el requisito explícito de esta tarea ("prohibición de
  `email`/`displayName`/`photoURL`/PIN en cualquier documento").
- El nombre visible del perfil ya lo aporta `mote` (catálogo cerrado); un
  `displayName` libre del tutor sería un vector de PII sin uso funcional en este
  incremento.

Consecuencia: si en el futuro se quisiera un nombre visible del tutor, habría
que introducirlo como campo de catálogo/validado y relajar la allowlist — cambio
acotado. Se documenta aquí para que la divergencia con la letra de ADR-003 §3 no
pase inadvertida.

## 2. Minimización del `CourseState` en la nube (`nicknameCustom`)

El `CourseState` (ADR-002) incluye `profile.nicknameCustom` (apodo de **texto
libre**). Las reglas validan la allowlist de claves de primer nivel del
documento de curso, pero no pueden inspeccionar en profundidad ese texto. Para
no subir PII, la capa de datos (`courseStateToCloudDoc`) **anula
`nicknameCustom`** al escribir en Firestore: en la nube el `profile` solo
conserva referencias de catálogo (`avatarId`, `nicknameId`). Es una decisión de
la capa de aplicación que refuerza lo que la regla no puede garantizar por sí
sola.

## 3. Coherencia transaccional del tope de hijos (`getAfter`)

ADR-003 §5 pedía que la regla validara "que el incremento de `childrenCount` sea
coherente con la creación". Se ha implementado con `getAfter`: la creación de un
`children/{childId}` solo se permite si, en la **misma escritura atómica**, el
documento del tutor queda con `childrenCount == anterior + 1` y `<= 6`. Efecto:
un `set` suelto de un hijo (sin bump del contador) queda **denegado**; la única
vía válida es la transacción que hace la app (`createChildProfile`). Cubierto por
tests del emulador.

## 4. Verificación cruzada proveedor↔rol asimétrica

Implementada tal como ADR-004 §1/§2 (revisión 2026-08-04): en la creación, las
reglas exigen solo las dos invariantes deterministas —`password ⟹ tutor` y
`kid ⟹ google.com`—; la pareja `(google.com, tutor)` se **admite** y la
gobierna la UI (paso de rol + reto de adulto), no la regla. El reto de adulto es
fricción de UI, no una garantía de reglas (las reglas no pueden validar que se
resolvió), como etiqueta Seguridad en ADR-004 §7.

## 5. Google Sign-In en Android — límite del entorno

`signInWithGoogle` usa `signInWithPopup`, que funciona en navegador y contra el
emulador. En el **WebView nativo de Android** el flujo de popup requiere un
plugin nativo de Google Sign-In y un **proyecto Firebase real** (con la huella
SHA-256 registrada). No es verificable desde el entorno de desarrollo actual;
queda registrado en `.claude/pending-actions.md`.

## 6. Verificación offline-first

La persistencia offline de Firestore está habilitada (`persistentLocalCache` en
`config.ts`; caída a memoria donde no hay IndexedDB, p. ej. tests en Node). La
verificación de extremo a extremo —jugar sin red y sincronizar al reconectar—
necesita un navegador/WebView real con IndexedDB y control de red; **no es
reproducible en este entorno headless**. Cómo se verificaría: (a) `npm run dev`
con el emulador, (b) alta de una cuenta y juego, (c) cortar la red del
dispositivo/DevTools, (d) seguir jugando (las escrituras se encolan), (e)
restaurar la red y comprobar en la UI del emulador que el progreso se sincroniza.
Registrado en `.claude/pending-actions.md`.

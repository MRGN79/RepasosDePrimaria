# Despliegue — Guía de configuración

**Proyecto:** RepasosDePrimaria
**Repositorio:** `MRGN79/RepasosDePrimaria`
**Responsable:** DevOps
**Última actualización:** 2026-08-03 (pivote a app Android — ADR-003 — y **retirada de GitHub Pages**)

---

> ## ⛔ GitHub Pages RETIRADO (ADR-003)
>
> El proyecto ha dejado de ser una web con URL pública y pasa a ser una **app
> instalable en Android** (Capacitor). En consecuencia:
>
> - El workflow `deploy.yml` (Pages) **se ha eliminado**. El artefacto publicado
>   del proyecto pasa a ser el **APK/AAB**, construido por
>   [`.github/workflows/android-apk.yml`](../../.github/workflows/android-apk.yml).
> - Las secciones 2–7 de abajo, específicas de Pages, quedan **como histórico**
>   y **ya no aplican**. Lo único vigente de este documento es la **protección de
>   la rama `main`** (sección 4, Paso B), con estos ajustes:
>   - El *status check* requerido sigue siendo **`Lint + Build`** (job de
>     `ci.yml`), y puede añadirse también **`APK debug (sin firmar)`** (job de
>     `android-apk.yml`) si se quiere exigir que el APK compile antes de mergear.
>   - El environment protegido ya no es `github-pages` sino **`android-release`**
>     (secretos de firma para el AAB de release — ver §Firma de release abajo).
>
> ### Firma de release (Environment `android-release`)
>
> 1. **Settings → Environments → New environment** → nombre **`android-release`**.
> 2. **Deployment branches and tags:** *Selected* → añade `main` y el patrón de
>    tags `v*` (solo `main`/tags firman release).
> 3. (Recomendado) **Required reviewers:** tu usuario, para aprobar cada release.
> 4. **Secrets** del environment (cuando se prepare la subida a Play):
>    `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`,
>    `ANDROID_KEY_PASSWORD`. Mientras no existan, el job de release **avisa y no
>    falla** (solo se produce el APK debug).
>
> El resto del documento se conserva por trazabilidad histórica.

---

## 1. Qué ha configurado DevOps (ya está en el repo)

| Archivo | Función |
|---|---|
| `.github/workflows/ci.yml` | **Gate de CI** en cada PR a `main`: `npm ci` → `lint` → `build`. No despliega. |
| `.github/workflows/deploy.yml` | **Deploy a producción** en cada push a `main`: build + publica `dist/` en GitHub Pages con las actions oficiales (`configure-pages`, `upload-pages-artifact`, `deploy-pages`). |
| `.env.example` | Referencia de variables de entorno (este proyecto no requiere ninguna). |
| `.gitignore` | Ignora `dist/` y la caché de Vite (el build se genera en CI, no se commitea). |

**Modelo de deploy elegido:** "GitHub Actions" (NO la rama `gh-pages` legacy). Es el modelo actual recomendado por GitHub: no requiere una rama de artefactos, publica directamente desde el workflow y da trazabilidad completa en la pestaña Actions.

---

## 2. ⚠️ Dependencia: el proyecto Vite todavía no existe

A día de hoy **no hay `package.json`** en el repositorio. Los workflows asumen los scripts npm estándar:

- `npm ci` — instala dependencias (requiere `package.json` + `package-lock.json`)
- `npm run lint` — linter
- `npm run build` — `vite build`, que genera la carpeta `dist/`

**Los workflows fallarán hasta que Frontend/Maquetador generen el scaffold de Vite.** Cuando se cree el proyecto, hay que asegurar que `package.json` define esos tres scripts. Por ejemplo:

```jsonc
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

Si el proyecto no va a tener linter al principio, dejar al menos un `lint` que no falle (ej. `"lint": "tsc --noEmit"`) para que el gate de CI siga siendo significativo, o ajustar los workflows quitando el paso de lint. **Decisión de Frontend/Arquitecto**, no de infraestructura.

---

## 3. ⚠️ Configuración OBLIGATORIA en `vite.config.ts` (la hace Frontend)

GitHub Pages sirve este sitio desde una subruta:

```
https://mrgn79.github.io/RepasosDePrimaria/
```

Por eso Vite **debe** configurarse con el `base` correspondiente, o todos los assets (JS, CSS, imágenes) darán 404:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/RepasosDePrimaria/",   // <-- nombre EXACTO del repo, con barras a ambos lados
  plugins: [react()],
});
```

- El nombre del repo es **`RepasosDePrimaria`** (sensible a mayúsculas/minúsculas). El `base` debe coincidir exactamente.
- **Routing:** usar **`HashRouter`** de `react-router-dom` (decisión del ADR-001). Evita los 404 de SPA en GitHub Pages sin trucos de `404.html`, porque la ruta de cliente va tras el `#` y nunca llega al servidor.
- Si en el futuro se usa un dominio propio o un GitHub Pages de usuario/organización servido desde la raíz, `base` pasaría a `/`. **Hoy NO es el caso.**

> Esta configuración es responsabilidad de Frontend al crear el scaffold, pero se documenta aquí porque es el punto que más rompe los deploys a GitHub Pages.

---

## 4. ✅ Pasos manuales en la UI de GitHub (los hace el usuario)

Estos pasos **no se pueden automatizar desde el código** — hay que hacerlos una vez en la web de GitHub. Sigue el orden.

### Paso A — Activar GitHub Pages con source "GitHub Actions"

1. Abre el repositorio en GitHub: `https://github.com/MRGN79/RepasosDePrimaria`
2. Ve a **Settings** (pestaña superior del repo).
3. En el menú lateral izquierdo, baja hasta **Pages** (sección "Code and automation").
4. En **Build and deployment** → **Source**, abre el desplegable y selecciona **GitHub Actions**.
   - ⚠️ NO elijas "Deploy from a branch". Debe ser **GitHub Actions**.
5. No hay que guardar nada más; la selección se aplica al instante.

> Tras esto, el primer push/merge a `main` (con el proyecto Vite ya creado) ejecutará `deploy.yml` y publicará el sitio. La URL aparecerá en **Settings → Pages** y también en la pestaña **Actions** del propio deploy (output `page_url`).

### Paso B — Proteger la rama `main` (requerir PR + CI verde)

1. En **Settings**, menú lateral → **Branches** (sección "Code and automation").
2. En **Branch protection rules**, pulsa **Add branch ruleset** (o **Add rule** en la UI clásica).
   - Si usas **rulesets** (UI nueva):
     1. **Ruleset Name:** `protect-main` (o el nombre que prefieras).
     2. **Enforcement status:** `Active`.
     3. **Target branches** → **Add target** → **Include by pattern** → escribe `main`.
     4. En **Rules**, marca:
        - ☑ **Require a pull request before merging**
          - Dentro, marca **Require approvals** y pon **1** (al menos una revisión).
        - ☑ **Require status checks to pass**
          - Pulsa **Add checks** y busca/añade el check del CI. Se llamará **`Lint + Build`** (el `name:` del job en `ci.yml`).
            - ⚠️ Este check solo aparece en la lista **después** de que el workflow `ci.yml` se haya ejecutado al menos una vez (abre un PR de prueba para que aparezca, o escríbelo a mano si la UI lo permite).
          - Marca también **Require branches to be up to date before merging** (recomendado).
        - ☑ **Block force pushes** (recomendado).
     5. **Create** / **Save changes**.
   - Si usas la UI clásica (**Branch protection rule**):
     1. **Branch name pattern:** `main`.
     2. ☑ **Require a pull request before merging** → ☑ **Require approvals** (1).
     3. ☑ **Require status checks to pass before merging** → ☑ **Require branches to be up to date** → busca y añade **`Lint + Build`**.
     4. ☑ **Do not allow bypassing the above settings** (recomendado, opcional).
     5. **Create**.

> Resultado: nadie puede hacer push directo a `main`; todo entra por PR con CI verde y al menos una aprobación. Es exactamente la política de ramas protegidas que define `CLAUDE.md`.

### Paso C (opcional pero recomendado) — Proteger el environment `github-pages`

El workflow `deploy.yml` despliega contra el environment `github-pages`. Puedes añadir una regla de protección para que el deploy a producción requiera aprobación manual:

1. **Settings** → **Environments** → selecciona **github-pages** (se crea solo tras el primer deploy; si no existe aún, este paso espera a después del primer deploy).
2. En **Deployment branches and tags**, deja **Selected branches** y añade `main` (que solo `main` pueda desplegar).
3. (Opcional) **Required reviewers:** añade tu usuario si quieres una aprobación manual antes de cada publicación a producción.

> Si no quieres fricción extra para un proyecto personal, este paso C puede omitirse. Los pasos A y B son los importantes.

---

## 5. Cómo desplegar (una vez todo está configurado)

El flujo es automático y coincide con `CLAUDE.md`:

```
PR desde rama feature → CI (lint + build) en verde → aprobación →
  squash merge a main → deploy.yml se dispara → build → publica dist/ en Pages
```

- **No se despliega manualmente desde local.** El deploy lo hace siempre GitHub Actions al mergear a `main`.
- Se puede relanzar un deploy sin commit nuevo desde **Actions → Deploy to GitHub Pages → Run workflow** (gracias a `workflow_dispatch`).
- **Recordatorio de visibilidad (CLAUDE.md):** abrir el PR, hacer push y el merge quedan registrados en GitHub con la hora real. En ventana sensible (L-V 08:00–19:00 Europe/Madrid), DevOps debe avisar al usuario y ofrecer postponer antes de ejecutar estas acciones. Los commits locales sí se ajustan con `.claude/scripts/safe-commit.sh`.

---

## 6. Exclusión de archivos privados — verificación

`CLAUDE.md` exige que `.claude/`, `CLAUDE.md`, `.github/`, `docs/` y `CHANGELOG.md` **no** lleguen al artefacto desplegado.

**Verificación:** el workflow publica **únicamente la carpeta `dist/`** (`upload-pages-artifact` con `path: ./dist`). `dist/` es el resultado de `vite build` y solo contiene el HTML/CSS/JS compilado del sitio — no incluye ninguno de esos archivos privados. **La exclusión es automática y está verificada por construcción:** lo que no está en `dist/` no se publica.

- No hace falta `.dockerignore` para este deploy (no hay Docker en este flujo), pero el `.dockerignore` del repo ya excluye esos archivos por si en el futuro se contenedoriza.
- Si alguna vez el build copiase archivos a `dist/` (vía `public/` o un script), revisar que ninguno de los privados acabe ahí.

---

## 7. Rollback

Al ser un sitio estático sin estado de servidor, el rollback es sencillo:

- **Opción rápida:** en **Actions**, abrir el último deploy bueno conocido y pulsar **Re-run all jobs** — vuelve a publicar ese commit. (Funciona mientras el commit siga en el historial.)
- **Opción por código:** `git revert` del commit problemático → PR → merge a `main` → el deploy automático publica la versión corregida.
- No hay migraciones de base de datos ni estado persistente en servidor (la persistencia es `localStorage` en el dispositivo del usuario), así que un rollback de código revierte el 100% del comportamiento publicado.

---

## 8. Checklist resumen para el usuario

- [ ] (Frontend) Crear el scaffold de Vite con `package.json` y scripts `lint` + `build`.
- [ ] (Frontend) Fijar `base: "/RepasosDePrimaria/"` en `vite.config.ts` y usar `HashRouter`.
- [ ] **(Usuario) Paso A** — Settings → Pages → Source = **GitHub Actions**.
- [ ] **(Usuario) Paso B** — Settings → Branches → proteger `main` (PR + 1 aprobación + check `Lint + Build`).
- [ ] (Usuario, opcional) **Paso C** — Settings → Environments → proteger `github-pages`.
- [ ] (DevOps) Confirmar primer deploy verde y comprobar la URL `https://mrgn79.github.io/RepasosDePrimaria/`.

# REBRANDING.md — Migración de marca de EB Corp

Instrucciones para aplicar la identidad nueva de EB Corp al sitio `ebcorp-web`.
Este documento es la fuente de verdad. No hace falta contexto previo.

**Repo:** `ebcorp-web` — sitio estático, HTML + CSS + JS vanilla, sin build step, desplegado en Netlify.
**Regla base:** no introducir frameworks, ni Tailwind, ni bundlers, ni npm. Sigue siendo HTML plano.

---

## 0. Antes de empezar

Los archivos de marca nuevos están en la carpeta `ebcorp-marca/` (o donde los haya dejado el usuario).
Cópialos así:

| Archivo nuevo | Destino en el repo |
|---|---|
| `ebcorp-logo.svg` | `assets/images/ebcorp-logo.svg` |
| `ebcorp-logo-blanco.svg` | `assets/images/ebcorp-logo-blanco.svg` |
| `ebcorp-logo-vertical.svg` | `assets/images/ebcorp-logo-vertical.svg` |
| `ebcorp-isotipo.svg` | `assets/images/ebcorp-isotipo.svg` |
| `favicon.svg` | `assets/favicon.svg` (reemplaza el actual) |
| `png/og-image.png` | `assets/images/og-image.png` |
| `png/favicon-32.png` | `assets/favicon-32.png` |
| `png/apple-touch-icon.png` | `assets/apple-touch-icon.png` |
| `png/icon-192.png`, `png/icon-512.png` | `assets/icon-192.png`, `assets/icon-512.png` |

Borra, porque son restos de un proyecto Expo y no los usa un sitio estático:
`assets/android-icon-background.png`, `assets/android-icon-foreground.png`,
`assets/android-icon-monochrome.png`, `assets/splash-icon.png`, `assets/icon.png`, `assets/favicon.png`.

Deja `assets/images/og-image.svg` y `assets/images/corona.svg` para el final: primero quita todas las
referencias, después bórralos.

Trabaja en una rama: `git checkout -b rebranding`.

---

## 1. Tokens de color (`css/styles.css`, bloque `:root`)

La marca nueva es carbón + un degradado azul→cian. Se eliminan el ámbar y el verde esmeralda
como colores de marca.

**Conserva los nombres de los tokens** (`--color-primary`, etc.) y cambia solo sus valores. Así
las ~1000 referencias repartidas por el CSS siguen funcionando y el diff se mantiene chico.

```css
/* Marca */
--color-primary:        #1B242C;   /* Carbón — texto, fondos oscuros, navbar */
--color-primary-dark:   #11181E;
--color-primary-light:  #2B3A46;

--color-azul:           #027DFE;   /* Azul EB — línea de ingeniería eléctrica */
--color-cian:           #08DDF0;   /* Cian pulso — línea de desarrollo web */
--color-accent-electric: var(--color-azul);  /* alias de compatibilidad */

--gradient-marca: linear-gradient(120deg, #026EFF 0%, #069AFC 50%, #08DDF0 100%);

/* Funcionales — NO son colores de marca, solo estados de interfaz */
--color-warning: #E8A33D;   /* avisos de riesgo eléctrico en el blog */
--color-success: #1FA97A;   /* confirmaciones, listas de checks */
--color-danger:  #EF4444;   /* se mantiene */

/* Fondos */
--color-white:    #FFFFFF;
--color-offwhite: #F7F8F9;   /* secciones alternas */
```

Elimina `--color-accent-yellow`, `--color-accent-green`, `--color-electrical`, `--color-digital`,
`--shadow-glow-yellow`. Reemplaza `--shadow-glow-electric` por
`0 0 30px rgba(2, 125, 254, 0.28)`.

### Cómo reemplazar los usos existentes

Hay 29 usos de ámbar y verde. El criterio es **para qué sirve el color**, no dónde está:

- **Ámbar que identifica la línea eléctrica o decora** → `var(--color-azul)`, o
  `var(--gradient-marca)` si era un degradado.
  Afecta a: `css/styles.css` líneas 395, 408 (degradados de botón/badge), 627, 755
  (`.pain-electrical`), 771, 944 (`.node-electrical i`), 1055, 1106, 1421 (`border-image`),
  1472, 1541; `css/pages.css` líneas 69, 85, 122, 147, 186.
- **Ámbar de advertencia real** → `var(--color-warning)`.
  Solo `css/blog.css` líneas 296, 297 (`.callout-warning`) y 603.
- **Verde de confirmación** → `var(--color-success)`.
  `css/blog.css` 538 (`.pro-con-list .pro .fa-check`), `css/styles.css` 900, 991, 1580
  (`.cta-trust .fa-check-circle`), `css/pages.css` 375 (`.hours-247`), 494.

Las dos líneas de negocio ahora se distinguen con los dos extremos del degradado:
**azul = ingeniería eléctrica**, **cian = desarrollo web**. Donde el CSS use cian para "digital",
déjalo; donde use ámbar para "eléctrico", pásalo a azul.

Revisa que ningún fondo oscuro conserve el azul marino viejo `#1A2B5F`, `#0F1A3D` o `#2A3F8F`
escrito a mano (fuera del bloque `:root`). Búscalos y cámbialos por los tokens nuevos.

---

## 2. Tipografía

Sale Space Grotesk. Entra **Saira**, que es la familia del logotipo nuevo.

En `:root`:
```css
--font-primary: 'Inter', system-ui, -apple-system, sans-serif;
--font-display: 'Saira', 'Inter', system-ui, sans-serif;
```
Elimina `--font-mono` y cambia sus 5 usos a `var(--font-display)`.

Aplica `--font-display` a `h1`, `h2`, `h3`, a los números grandes de la barra de estadísticas y a
los textos de botón. El cuerpo se queda en Inter.

En **todas** las páginas HTML, reemplaza el link de Google Fonts por:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Saira:wght@500;600;700&display=swap" rel="stylesheet">
```
Baja los pesos de Inter de `400;500;600;700;800;900` a `400;500;600;700`: los pesos 800 y 900 ya
no se usan porque los títulos van en Saira, y cada peso extra pesa en la carga.

---

## 3. Logo en la interfaz

### Navbar
Hoy es un parche: un `<img>` de `corona.svg`, la palabra armada con `<span>` de colores y
`font-family:'Courier New'` en estilo inline. Todo eso se va. Queda:

```html
<a href="index.html" class="nav-logo" aria-label="EB Corp — inicio">
  <img src="assets/images/ebcorp-logo-blanco.svg" alt="EB Corp" height="34" width="171">
</a>
```
Mueve los estilos inline a la clase `.nav-logo` en el CSS. El `alt` va con el nombre porque la
imagen **sí** comunica contenido; no lo dejes vacío ni con `aria-hidden`.

### Footer
Reemplaza el icono `fa-bolt` más `<span class="logo-text">EB <span class="logo-accent">Corp</span></span>`
por el mismo `<img>` del logo blanco, a `height="40"`.

### Rutas relativas
El sitio no usa rutas absolutas. Ajusta el `src` según dónde esté el archivo:
- `index.html` → `assets/images/...`
- `pages/*.html` → `../assets/images/...`
- `pages/blog/*.html` → `../../assets/images/...`

### Iconos de rayo
Hay 35 usos de `fa-bolt` en el HTML. Reemplaza por el isotipo **solo** los que funcionan como logo
(`.logo-icon`, `.logo-icon-sm`). Los que son iconos de servicio o de lista quedan como están: ahí
el rayo describe electricidad, no la marca.

---

## 4. `<head>` de cada página

En las 12 páginas HTML (`index.html`, 8 en `pages/`, 3 en `pages/blog/` más el índice del blog):

```html
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta name="theme-color" content="#1B242C">
```

Sustituye la og:image por el PNG. Los SVG **no se renderizan** en WhatsApp ni en Facebook, por eso
los enlaces compartidos salen sin vista previa:
```html
<meta property="og:image" content="https://ebcorp.ec/assets/images/og-image.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
```
Ojo: hoy varias páginas apuntan a `https://ebcorp.netlify.app/...`. Usa el mismo dominio que ya
está en la etiqueta `<link rel="canonical">` de cada página; si difieren entre páginas, unifícalos
y avísale al usuario cuál elegiste.

Solo `index.html` tiene `theme-color` hoy. Agrégalo a las 11 restantes.

---

## 5. `manifest.json`

```json
{
  "theme_color": "#1B242C",
  "background_color": "#1B242C",
  "icons": [
    { "src": "/assets/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/assets/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```
Mantén el resto de campos como están.

---

## 6. Qué NO tocar

- El texto y el contenido de las páginas. El copy y el eslogan son una fase aparte.
- El ID de Google Analytics `G-RF6SH8ZWHR`.
- La estructura de archivos, las URLs, el `sitemap.xml` y el `robots.txt`.
- La lógica de `js/main.js`, salvo si tiene colores escritos a mano.
- Los artículos del blog, más allá del `<head>` y los colores heredados del CSS.

---

## 7. Verificación antes del commit

```bash
grep -rn "accent-yellow\|accent-green\|Space Grotesk\|Courier New" css/ *.html pages/   # debe salir vacío
grep -rn "1A2B5F\|0F1A3D\|2A3F8F\|F5A623\|00C896" css/ *.html pages/                    # debe salir vacío
grep -rn "og-image.svg\|corona.svg" . --include=*.html                                  # debe salir vacío
grep -rLn "theme-color" --include=*.html -r .                                           # no debe faltar en ninguna
```

Abre el sitio y revisa a 320 px, 768 px y 1440 px:
1. La navbar con el logo nuevo, incluido el estado con scroll y el menú móvil.
2. El hero, la barra de estadísticas y las tarjetas de servicios.
3. `pages/precios.html` y `pages/cotizador.html`, que tienen su propio CSS.
4. Un artículo del blog, por los callouts de advertencia y las listas pro/contra.
5. El footer y el botón flotante de WhatsApp.

Contraste: el texto sobre carbón `#1B242C` y sobre azul `#027DFE` debe cumplir WCAG AA (4.5:1 en
texto normal). El cian `#08DDF0` es muy claro: úsalo sobre carbón, nunca como texto sobre blanco.

## 8. Commits

Uno por bloque, no todo junto:
```
feat: migrar tokens de color a la identidad nueva
feat: cambiar Space Grotesk por Saira en titulares
feat: reemplazar el logo en navbar y footer
feat: actualizar favicons, theme-color y og:image
chore: eliminar assets de Expo sin uso
```

Al terminar, lista qué archivos cambiaste, qué dejaste intacto a propósito y cualquier lugar donde
el color nuevo haya quedado dudoso, para que el usuario lo revise.

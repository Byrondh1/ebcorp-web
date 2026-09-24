# BLOG-LIMPIEZA.md — Publicar el blog pendiente y corregir el SEO

Instrucciones para el repo `ebcorp-web` (sitio estático, HTML + CSS + JS vanilla, sin build step).
Ejecutar **antes** que `REBRANDING.md`, para que el rebranding alcance también a los artículos nuevos.

## Contexto

Una tarea automática genera cada martes un artículo de blog y lo deja en una rama `claude/...`
sin fusionar. Hay 17 ramas acumuladas desde el 2 de junio de 2026. Ninguna llegó a `main`, así
que el sitio sigue mostrando los 7 artículos de abril.

De los 17 artículos nuevos: 14 tratan el mismo tema (mantenimiento preventivo eléctrico
industrial), 2 tratan acometida de media tensión con **el mismo nombre de archivo**, y 1 trata
corrección del factor de potencia. Publicarlos todos sería canibalización de palabras clave.

## 1. Publicar solo tres artículos

Trabaja en una rama nueva: `git checkout -b blog-publicacion` desde `main`.

No fusiones las ramas: cada una toca las mismas líneas de `pages/blog/index.html` y de
`sitemap.xml` y darían conflicto una tras otra. Copia los archivos directamente:

```bash
git checkout <rama> -- <ruta del archivo>
```

| Tema | Rama (por fecha del commit) | Archivos a traer |
|---|---|---|
| Mantenimiento preventivo | 9 de junio de 2026 | el `.html` en `pages/blog/` y su par en inglés |
| Acometida de media tensión | 21 de julio de 2026 | el `.html` en `pages/blog/` y su par en inglés |
| Factor de potencia | 11 de agosto de 2026 | el `.html` en `pages/blog/` y su par en inglés |

Identifica cada rama por la fecha de su último commit (`git log -1 --format=%ad`), no por el
nombre, que es aleatorio.

Ojo con dos ramas (2 y 16 de junio) que dejaron el archivo en inglés dentro de `pages/blog/` en
vez de `pages/blog/en/`. No son de las que vamos a publicar, pero si algún archivo en inglés
aparece fuera de `pages/blog/en/`, muévelo.

De la rama del **25 de agosto** extrae solo las referencias normativas a la NEC (es la que más
cita la norma) y fúndelas en el artículo de mantenimiento, sin duplicar secciones enteras.

## 2. Reconstruir el índice y el sitemap una sola vez

En `pages/blog/index.html`, agrega una tarjeta `<article class="blog-card">` por cada artículo
nuevo, copiando la estructura de las existentes: `data-category` (`electrico` o `web`), la clase
de imagen, la etiqueta, el tiempo de lectura, el `<time datetime="...">`, el `<h2>` y el resumen.
Los tres van arriba, en orden de fecha descendente.

En `sitemap.xml`, agrega un bloque `<url>` por artículo con su `lastmod`, y actualiza el `lastmod`
del índice del blog.

## 3. Correcciones de SEO

**Unificar el dominio.** El `sitemap.xml` y varias etiquetas `og:image` apuntan a
`https://ebcorp.netlify.app/`, mientras el sitio se sirve en otro dominio. Tener dos direcciones
para el mismo contenido divide la autoridad y confunde a Google. Revisa qué dominio usan las
etiquetas `<link rel="canonical">`, unifica **todo** el sitio a ese y dile al usuario cuál
elegiste. Si el dominio bueno es `ebcorp.ec`, en `netlify.toml` debe quedar la redirección 301
desde el subdominio de Netlify.

**Fechas desactualizadas.** Varios títulos y descripciones dicen "2025" y los `lastmod` del
sitemap están en marzo de 2025. Un artículo de precios que se anuncia como de 2025 pierde clics
frente a uno de 2026. Actualiza el año en los títulos, las descripciones y las fechas visibles de
los artículos que sigan siendo válidos, y no toques el contenido técnico.

**hreflang entre pares.** Cada artículo en español debe enlazar a su versión en inglés y
viceversa, con `<link rel="alternate" hreflang="es-EC" ...>`, `hreflang="en"` y un
`hreflang="x-default"` apuntando a la versión en español. Verifica que los tres pares nuevos lo
tengan y que las URLs sean absolutas y del dominio unificado.

**Enlaces internos.** Cada artículo nuevo debe enlazar al menos una vez a
`pages/servicios-electricos.html` y una vez a `pages/cotizador.html`, con texto descriptivo, no
"clic aquí". Es lo que convierte una visita de blog en un contacto.

**Slugs estables.** No renombres archivos ya publicados. Si algún slug tiene que cambiar, agrega
la redirección 301 correspondiente en `netlify.toml`.

## 4. Limpiar las ramas

Una vez fusionada `blog-publicacion` en `main` y verificado el sitio, borra las 17 ramas
`claude/...` del remoto. Antes de borrar, muéstrale al usuario la lista con la fecha de cada una
y espera su confirmación.

## 5. Verificación

```bash
grep -rn "netlify.app" . --include=*.html --include=*.xml --include=*.toml   # solo la redirección
grep -c "<url>" sitemap.xml                                                  # debe cuadrar con las páginas
grep -rn "hreflang" pages/blog/*.html | head                                 # pares completos
```

Abre el índice del blog y los tres artículos nuevos a 320 px y a 1440 px, y comprueba que los
filtros por categoría del índice sigan funcionando con las tarjetas nuevas.

## 6. Aviso para el usuario

Los artículos traen precios en dólares que generó el modelo, no las tarifas reales de EB Corp.
Antes de publicar hay que revisarlos uno por uno. Recuérdaselo al terminar y lista en qué
secciones aparecen.

## 7. Ajustar la tarea semanal

El prompt de la tarea recurrente debe cambiar, o en siete días habrá una rama más con el mismo
tema. Lo que necesita:

- Leer `pages/blog/index.html` antes de escribir y elegir un tema que **no** esté cubierto.
- Trabajar sobre `main` y abrir un Pull Request, en lugar de dejar una rama suelta.
- Mantener una lista de temas pendientes en el repo, por ejemplo `pages/blog/TEMAS.md`, y tachar
  el que usó.
- No inventar precios: usar rangos aprobados por el usuario o remitir al cotizador.

Temas sin cubrir que sirven de punto de partida: puesta a tierra y SPT, tableros y coordinación
de protecciones, termografía infrarroja, iluminación industrial LED y retorno de inversión,
grupos electrógenos en modo isla, seguridad eléctrica y bloqueo/etiquetado, medición inteligente
y tarifas de la regulación vigente, y del lado digital, velocidad de carga, formularios que
convierten y Google Business Profile para empresas locales.

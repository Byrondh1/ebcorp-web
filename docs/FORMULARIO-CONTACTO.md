# FORMULARIO-CONTACTO.md — Migrar el formulario de Netlify Forms a Vercel + Resend

Repo `ebcorp-web`, sitio estático servido por Vercel en `https://ebcorp.dev`.

## El problema

`pages/contacto.html` envía el formulario con `data-netlify="true"` y `fetch('/')`, que es el
mecanismo de Netlify Forms. El sitio ya no está en Netlify, así que el POST no lo recibe nadie.
El visitante ve el mensaje de éxito y se le abre WhatsApp, pero el contenido del formulario se
pierde. Todo mensaje enviado hasta hoy por esa vía no llegó a ningún buzón.

## Requisitos que el usuario ya dejó listos

- Dominio de envío verificado en Resend: `send.ebcorp.dev` (subdominio, para no interferir con
  los registros MX de Cloudflare Email Routing del dominio principal).
- Variable de entorno en Vercel: `RESEND_API_KEY`.

No pidas la clave ni la escribas en ningún archivo. Se lee solo con `process.env.RESEND_API_KEY`.
Si al probar en local no está definida, la función debe responder un error claro en el log, no
enviar nada y no exponer el motivo al visitante.

## 1. La función serverless

Crea `api/contacto.js`. Vercel detecta la carpeta `api/` y la publica como función sin
configuración extra. Requisitos:

- Acepta solo `POST`; cualquier otro método responde 405.
- Lee los campos que hoy tiene el formulario en `pages/contacto.html`. Revísalo primero y usa
  exactamente esos nombres, no inventes campos nuevos.
- Valida en el servidor, no solo en el navegador: campos obligatorios presentes, correo con
  formato válido, y un largo máximo por campo (por ejemplo 100 caracteres en nombre, 200 en
  asunto, 5000 en el mensaje). Si algo falla, responde 400 con un mensaje corto y genérico.
- Campo trampa (honeypot): agrega al formulario un input oculto con un nombre plausible, por
  ejemplo `empresa_web`, oculto por CSS y no por `type="hidden"`. Si llega con contenido, es un
  bot: responde 200 como si todo hubiera salido bien, pero no envíes el correo. Nunca le digas al
  bot que fue detectado.
- Limita el abuso de forma simple: rechaza envíos con más de, digamos, 5 enlaces en el mensaje, y
  usa la cabecera `x-forwarded-for` para no aceptar más de 3 envíos por IP cada 10 minutos. Con
  una función sin estado basta un mapa en memoria; no monte una base de datos para esto, y anota
  en un comentario que el límite se reinicia con cada arranque en frío.
- Envía el correo con la API de Resend:
  - `from`: una dirección del dominio verificado, por ejemplo `web@send.ebcorp.dev`, con nombre
    visible "EB Corp — Formulario web".
  - `to`: `contacto@ebcorp.dev`.
  - `reply_to`: el correo que escribió el visitante, para poder responderle directo desde Gmail.
  - `subject`: algo rastreable, del tipo `[Web] <asunto> — <nombre>`.
  - Cuerpo en texto plano y en HTML, con todos los campos del formulario y la fecha en hora de
    Ecuador. Escapa el HTML de lo que escribió el visitante.
- Responde `{ ok: true }` con 200 al enviar bien. Si Resend falla, registra el error completo en
  el log del servidor y devuelve 502 con un mensaje genérico, sin detalles internos.
- No registres el contenido del mensaje en los logs más allá de lo necesario para diagnosticar.

Usa la API de Resend por `fetch` directo a su endpoint en vez de instalar el SDK: el repo no tiene
`package.json` ni build step y conviene que siga así.

## 2. El formulario

En `pages/contacto.html`:

- Quita `data-netlify="true"` y cualquier atributo o campo oculto propio de Netlify Forms.
- Cambia el envío a `fetch('/api/contacto')` con `Content-Type: application/json`.
- Agrega el campo trampa descrito arriba.
- Mientras se envía, deshabilita el botón y muestra un estado de carga, para que nadie envíe dos
  veces.
- Muestra el mensaje de éxito **solo** si la respuesta viene con `ok: true`. Hoy se muestra pase
  lo que pase, y eso es justo lo que escondió el problema.
- Si falla, muestra un mensaje de error visible que ofrezca el WhatsApp y el correo como
  alternativa, sin tecnicismos.
- Deja el comportamiento actual de abrir WhatsApp solo después del éxito, no antes.

## 3. Compatibilidad con la CSP

El envío queda en el mismo origen, así que `form-action 'self'` y `connect-src 'self'` de
`vercel.json` lo permiten sin cambios. Confírmalo en la consola del navegador después del deploy;
si aparece algún bloqueo, avisa antes de tocar la política.

## 4. Pruebas

1. Envío normal: el correo llega a `contacto@ebcorp.dev`, con el `reply_to` correcto y todos los
   campos completos.
2. Validación: envía sin nombre, con un correo mal formado y con un mensaje de 10.000 caracteres.
   Los tres deben responder 400 y el formulario debe mostrar el error.
3. Honeypot: rellena el campo trampa por consola y comprueba que responde 200 y que **no** llega
   correo.
4. Método incorrecto: un GET a `/api/contacto` responde 405.
5. Interfaz: el botón se deshabilita, el éxito sale solo con `ok: true`, y el error muestra las
   alternativas.
6. A 320 px el formulario no se desborda. Hoy se sale unos 110 px, así que arréglalo en esta misma
   pasada.

## 5. Al terminar

Reporta qué archivos creaste y modificaste, el resultado de las seis pruebas, y si el desborde a
320 px quedó resuelto. No fusiones a `main` sin aprobación.

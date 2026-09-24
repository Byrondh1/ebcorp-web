// Recibe el formulario de pages/contacto.html y lo envía por correo con Resend.

const RESEND_URL = 'https://api.resend.com/emails';
const FROM = 'EB Corp — Formulario web <web@send.ebcorp.dev>';
const TO = 'contacto@ebcorp.dev';

const SERVICIOS = {
  'electrico': 'Ingeniería Eléctrica Industrial',
  'web-corporativo': 'Sitio Web Corporativo',
  'web-ecommerce': 'Tienda Online (E-commerce)',
  'ambos': 'Eléctrico + Web (Proyecto integral)',
  'seo': 'SEO y Posicionamiento',
  'otro': 'Otro',
};

const MAX = { nombre: 100, empresa: 150, email: 254, telefono: 40, mensaje: 5000 };
const MAX_ENLACES = 5;
const LIMITE_ENVIOS = 3;
const VENTANA_MS = 10 * 60 * 1000;

// Límite por IP en memoria: se reinicia con cada arranque en frío de la función
// y no se comparte entre instancias. Es una barrera simple, no una garantía.
const enviosPorIp = new Map();

function limiteSuperado(ip) {
  const ahora = Date.now();
  const recientes = (enviosPorIp.get(ip) || []).filter(t => ahora - t < VENTANA_MS);
  if (recientes.length >= LIMITE_ENVIOS) {
    enviosPorIp.set(ip, recientes);
    return true;
  }
  recientes.push(ahora);
  enviosPorIp.set(ip, recientes);
  return false;
}

function escapar(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function validar(body) {
  const datos = {
    nombre: texto(body.nombre),
    empresa: texto(body.empresa),
    email: texto(body.email),
    telefono: texto(body.telefono),
    servicio: texto(body.servicio),
    mensaje: texto(body.mensaje),
  };

  if (!datos.nombre || !datos.email || !datos.servicio || !datos.mensaje) return null;
  // Formato estricto: el correo va en reply_to y en un enlace mailto:, donde ? & , o comillas añadirían destinatarios
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(datos.email)) return null;
  if (!SERVICIOS[datos.servicio]) return null;
  for (const campo of Object.keys(MAX)) {
    if (datos[campo].length > MAX[campo]) return null;
  }
  const enlaces = datos.mensaje.match(/https?:\/\/|www\./gi) || [];
  if (enlaces.length > MAX_ENLACES) return null;

  return datos;
}

function fechaEcuador() {
  return new Intl.DateTimeFormat('es-EC', {
    timeZone: 'America/Guayaquil',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date());
}

// Número para wa.me: solo dígitos con código de país. Los móviles de Ecuador escritos
// en formato local (09XXXXXXXX o 9XXXXXXXX) se completan con 593. Si no parece un
// número válido se devuelve null y el correo no lleva botón de WhatsApp.
function numeroWhatsApp(telefono) {
  let digitos = telefono.replace(/\D/g, '');
  if (!digitos) return null;
  if (telefono.trim().startsWith('+')) {
    // ya trae código de país
  } else if (digitos.startsWith('00')) {
    digitos = digitos.slice(2);
  } else if (/^09\d{8}$/.test(digitos)) {
    digitos = '593' + digitos.slice(1);
  } else if (/^9\d{8}$/.test(digitos)) {
    digitos = '593' + digitos;
  }
  if (digitos.startsWith('5930')) digitos = '593' + digitos.slice(4);
  return /^[1-9]\d{7,14}$/.test(digitos) ? digitos : null;
}

// Botón compatible con clientes de correo: tabla con fondo y enlace con estilos en línea
function boton(href, etiqueta, color) {
  return (
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-table;margin:0 8px 8px 0">' +
    `<tr><td bgcolor="${color}" style="border-radius:8px;background:${color}">` +
    `<a href="${escapar(href)}" target="_blank" style="display:inline-block;padding:14px 22px;font-family:Arial,sans-serif;` +
    'font-size:16px;font-weight:bold;line-height:20px;color:#ffffff;text-decoration:none;border-radius:8px;' +
    `mso-padding-alt:0">${escapar(etiqueta)}</a>` +
    '</td></tr></table>'
  );
}

function construirCorreo(d) {
  const servicio = SERVICIOS[d.servicio];
  const fecha = fechaEcuador();
  const asunto = `[Web] ${servicio} — ${d.nombre}`;

  const enlaceCorreo = `mailto:${d.email}?subject=${encodeURIComponent('Re: ' + asunto)}`;
  const numero = d.telefono ? numeroWhatsApp(d.telefono) : null;
  const saludo = `Hola ${d.nombre}, te escribimos de EB Corp por la consulta que dejaste en nuestro sitio web (${servicio}).`;
  const enlaceWhatsApp = numero ? `https://wa.me/${numero}?text=${encodeURIComponent(saludo)}` : null;
  const filas = [
    ['Nombre', d.nombre],
    ['Empresa', d.empresa || '—'],
    ['Correo', d.email],
    ['WhatsApp / Teléfono', d.telefono || '—'],
    ['Servicio', servicio],
    ['Fecha (hora de Ecuador)', fecha],
  ];

  const text =
    `Responder por correo: ${enlaceCorreo}\n` +
    (enlaceWhatsApp ? `Responder por WhatsApp: ${enlaceWhatsApp}\n` : '') +
    '\n' +
    filas.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\nMensaje:\n${d.mensaje}\n`;

  const html =
    '<p style="font-family:Arial,sans-serif;font-size:14px;color:#555;margin:0 0 10px">Responder al visitante:</p>' +
    '<div style="margin:0 0 16px">' +
    boton(enlaceCorreo, 'Responder por correo', '#1A2B5F') +
    (enlaceWhatsApp ? boton(enlaceWhatsApp, 'Responder por WhatsApp', '#128C4B') : '') +
    '</div>' +
    '<table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">' +
    filas.map(([k, v]) =>
      `<tr><td style="color:#555;vertical-align:top"><strong>${escapar(k)}</strong></td><td>${escapar(v)}</td></tr>`
    ).join('') +
    '</table>' +
    '<p style="font-family:Arial,sans-serif;font-size:14px;color:#555;margin-top:16px"><strong>Mensaje</strong></p>' +
    `<p style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap">${escapar(d.mensaje)}</p>`;

  return {
    from: FROM,
    to: [TO],
    reply_to: d.email,
    subject: asunto,
    text,
    html,
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (_) {
    body = null;
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ ok: false, error: 'Datos no válidos' });
  }

  // Campo trampa: un bot lo rellena. Se responde como si todo fuera bien y no se envía nada.
  if (texto(body.empresa_web)) {
    console.log('[contacto] campo trampa con contenido: envío descartado');
    return res.status(200).json({ ok: true });
  }

  const datos = validar(body);
  if (!datos) {
    return res.status(400).json({ ok: false, error: 'Datos no válidos' });
  }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'desconocida';
  if (limiteSuperado(ip)) {
    return res.status(429).json({ ok: false, error: 'Demasiados envíos, intenta más tarde' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[contacto] RESEND_API_KEY no está definida: no se envió el correo');
    return res.status(500).json({ ok: false, error: 'No se pudo enviar el mensaje' });
  }

  try {
    const respuesta = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(construirCorreo(datos)),
    });
    if (!respuesta.ok) {
      const detalle = await respuesta.text();
      console.error(`[contacto] Resend respondió ${respuesta.status}: ${detalle}`);
      return res.status(502).json({ ok: false, error: 'No se pudo enviar el mensaje' });
    }
    const enviado = await respuesta.json().catch(() => ({}));
    console.log(`[contacto] correo aceptado por Resend, id ${enviado.id || 'desconocido'}`);
  } catch (error) {
    console.error('[contacto] Error al llamar a Resend:', error);
    return res.status(502).json({ ok: false, error: 'No se pudo enviar el mensaje' });
  }

  return res.status(200).json({ ok: true });
};

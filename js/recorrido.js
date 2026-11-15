/**
 * EB Corp — Recorrido del inicio
 * El scroll dentro de .recorrido avanza una película de 19,9 s.
 * P = progreso (0–1) × 4,2. Tiempo del video = min(P, 4) / 4 × 19,9;
 * el último tramo (P 4–4,2) mantiene el fotograma final.
 * Sin JS o con prefers-reduced-motion la sección queda en modo estático
 * (cuatro escenas apiladas con su fotograma y su texto).
 */
(function () {
  'use strict';

  var seccion = document.querySelector('.recorrido');
  if (!seccion) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var P_MAX = 4.2;
  var DURACION = 19.9;
  var SUBIDA = 40; // px que sube cada bloque al entrar

  // Tiempos de cada bloque en P: [empieza a entrar, entra del todo, empieza a salir, sale del todo]
  var BLOQUES = [
    [-1, 0, 0.5, 0.7],
    [0.85, 1.05, 1.6, 1.8],
    [1.9, 2.1, 2.85, 3.0],
    [3.6, 3.8, Infinity, Infinity]
  ];
  // Listas que aparecen elemento a elemento entre dos valores de P
  var LISTAS = { 2: [2.1, 2.7], 3: [3.7, 4.0] };
  // Paso del indicador según P (CIUDAD, SUBESTACIÓN, TRANSFORMADOR, DISEÑO)
  var INICIO_PASO = [0, 0.85, 1.9, 3.6];

  // Un solo archivo para escritorio y móvil (1280×720, 7,9 MB)
  var fuente = 'assets/video/film-720.mp4';

  var medio  = seccion.querySelector('.recorrido-medio');
  var video  = seccion.querySelector('.recorrido-video');
  var textos = Array.prototype.slice.call(seccion.querySelectorAll('.recorrido-texto'));
  var pasos  = Array.prototype.slice.call(seccion.querySelectorAll('.recorrido-pasos li'));
  var listas = textos.map(function (t) {
    return Array.prototype.slice.call(t.querySelectorAll('.recorrido-lista li'));
  });

  seccion.classList.add('recorrido--activo');

  var listo = false;
  var tiempoObjetivo = 0;
  var pasoActual = -1;
  var rafPendiente = false;

  function tramo(valor, desde, hasta) {
    if (hasta <= desde) return valor >= hasta ? 1 : 0;
    return Math.min(1, Math.max(0, (valor - desde) / (hasta - desde)));
  }

  function progreso() {
    var caja = seccion.getBoundingClientRect();
    var recorrible = caja.height - window.innerHeight;
    if (recorrible <= 0) return 0;
    return Math.min(1, Math.max(0, -caja.top / recorrible));
  }

  function buscar() {
    if (!listo || video.seeking) return; // se reintenta en 'seeked'
    if (Math.abs(video.currentTime - tiempoObjetivo) > 0.001) {
      video.currentTime = tiempoObjetivo;
    }
  }

  function actualizar() {
    rafPendiente = false;
    var P = progreso() * P_MAX;

    BLOQUES.forEach(function (b, i) {
      var entrada = tramo(P, b[0], b[1]);
      var salida  = tramo(P, b[2], b[3]);
      var opacidad = entrada * (1 - salida);
      var y = SUBIDA * (1 - entrada) - SUBIDA * salida;
      var el = textos[i];
      if (!el) return;
      el.style.opacity = opacidad.toFixed(3);
      el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
      el.classList.toggle('is-visible', opacidad > 0.5);
      el.setAttribute('aria-hidden', opacidad > 0.05 ? 'false' : 'true');
    });

    Object.keys(LISTAS).forEach(function (i) {
      var items = listas[i] || [];
      var rango = LISTAS[i];
      var paso = items.length > 1 ? (rango[1] - rango[0]) / (items.length - 1) : 0;
      items.forEach(function (li, n) {
        li.classList.toggle('is-visible', P >= rango[0] + paso * n);
      });
    });

    var actual = 0;
    INICIO_PASO.forEach(function (desde, i) { if (P >= desde) actual = i; });
    if (actual !== pasoActual) {
      pasos.forEach(function (li, i) {
        li.classList.toggle('is-actual', i === actual);
        if (i === actual) li.setAttribute('aria-current', 'step');
        else li.removeAttribute('aria-current');
      });
      pasoActual = actual;
    }

    tiempoObjetivo = Math.min(P, 4) / 4 * DURACION;
    buscar();
  }

  function pedirActualizacion() {
    if (rafPendiente) return;
    rafPendiente = true;
    requestAnimationFrame(actualizar);
  }

  window.addEventListener('scroll', pedirActualizacion, { passive: true });
  window.addEventListener('resize', pedirActualizacion);
  video.addEventListener('seeked', buscar);
  actualizar();

  // El video se reproduce por streaming (moov al inicio con +faststart): en cuanto hay
  // datos del primer cuadro se puede buscar; las zonas aún no descargadas se piden
  // con peticiones de rango y el navegador sigue precargando el resto (preload auto).
  video.addEventListener('loadeddata', function alCargar() {
    video.removeEventListener('loadeddata', alCargar);
    listo = true;
    buscar();
    // Se quita el fotograma fijo cuando el video ya muestra el cuadro pedido
    if (!video.seeking && Math.abs(video.currentTime - tiempoObjetivo) <= 0.001) {
      medio.classList.add('is-listo');
    } else {
      video.addEventListener('seeked', function alBuscar() {
        video.removeEventListener('seeked', alBuscar);
        medio.classList.add('is-listo');
      });
    }
  });
  // Si el video no carga, queda el fotograma de la escena 1 y los textos siguen funcionando
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = fuente;
})();

/**
 * EB Corp — Recorrido del inicio
 * El scroll dentro de .recorrido avanza una película de 19,9 s.
 * P = progreso (0–1) × 4,2. Tiempo del video = min(P, 4) / 4 × 19,9;
 * el último tramo (P 4–4,2) mantiene el fotograma final.
 * El video se descarga una sola vez, en orden, y se añade a un MediaSource
 * mientras llega. Sin JS o con prefers-reduced-motion la sección queda en
 * modo estático (cuatro escenas apiladas con su fotograma y su texto).
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

  // Pantallas verticales: film-mobile (608×1080, recorte central de los clips en 1080p),
  // sea cual sea la conexión. Horizontales: film-720, o film-540 si la conexión es lenta.
  // Todos son MP4 fragmentados (un fragmento cada 10 cuadros) para poder añadirlos
  // por partes a un MediaSource mientras se descargan.
  var vertical = window.matchMedia('(orientation: portrait)').matches;
  var conexion = navigator.connection;
  var lenta = !!conexion && (conexion.saveData || /2g|3g/.test(conexion.effectiveType || '') ||
    (conexion.downlink > 0 && conexion.downlink < 5));
  var fuente = vertical ? 'assets/video/film-mobile.mp4'
    : (lenta ? 'assets/video/film-540.mp4' : 'assets/video/film-720.mp4');
  var TIPO = 'video/mp4; codecs="avc1.64001F"';

  var medio  = seccion.querySelector('.recorrido-medio');
  var video  = seccion.querySelector('.recorrido-video');
  var textos = Array.prototype.slice.call(seccion.querySelectorAll('.recorrido-texto'));
  var pasos  = Array.prototype.slice.call(seccion.querySelectorAll('.recorrido-pasos li'));
  var listas = textos.map(function (t) {
    return Array.prototype.slice.call(t.querySelectorAll('.recorrido-lista li'));
  });

  seccion.classList.add('recorrido--activo');

  var listo = false;
  var modoMSE = false;      // datos añadidos en orden: solo se puede buscar en lo ya descargado
  var cargaCompleta = false;
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

  // Con MediaSource, buscar más allá de lo descargado dejaría el video esperando
  // (y bloquearía las búsquedas siguientes): se muestra el último cuadro disponible
  // y se avanza solo a medida que llegan datos.
  function tiempoPosible(t) {
    if (!modoMSE || cargaCompleta) return t;
    var b = video.buffered;
    if (!b.length || b.start(0) > 0.1) return 0;
    return Math.min(t, Math.max(0, b.end(0) - 0.05));
  }

  function buscar() {
    if (!listo || video.seeking) return; // se reintenta en 'seeked'
    var t = tiempoPosible(tiempoObjetivo);
    if (Math.abs(video.currentTime - t) > 0.001) {
      video.currentTime = t;
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

  // Quita el fotograma fijo cuando el video ya muestra un cuadro
  function alPrimerCuadro(el) {
    el.addEventListener('loadeddata', function alCargar() {
      el.removeEventListener('loadeddata', alCargar);
      listo = true;
      buscar();
      if (!el.seeking) medio.classList.add('is-listo');
      else el.addEventListener('seeked', function () { medio.classList.add('is-listo'); }, { once: true });
    });
  }

  function prepararElemento(el) {
    el.muted = true;
    el.playsInline = true;
    el.disableRemotePlayback = true; // lo exige ManagedMediaSource en iOS
  }

  // ---------- Opción principal: una sola descarga en orden con fetch → MediaSource ----------
  // Así ninguna búsqueda cancela la descarga (con src directo, cada salto de currentTime
  // a una zona sin datos abortaba la petición de rango y el navegador dejaba huecos)
  // y el archivo termina de bajar aunque el usuario siga haciendo scroll.
  function cargarConMediaSource(MS) {
    var ms = new MS();
    modoMSE = true;
    prepararElemento(video);
    alPrimerCuadro(video);
    video.src = URL.createObjectURL(ms);

    ms.addEventListener('sourceopen', function () {
      var sb;
      try { sb = ms.addSourceBuffer(TIPO); } catch (e) { return cargarRespaldo(); }
      var cola = [];
      var bytesEnCola = 0;
      var terminado = false;

      function bombear() {
        if (sb.updating || ms.readyState !== 'open') return;
        if (cola.length) {
          // Junta lo que llegó mientras el buffer estaba ocupado en un solo append
          var junto = new Uint8Array(bytesEnCola);
          var pos = 0;
          cola.forEach(function (c) { junto.set(c, pos); pos += c.length; });
          cola = [];
          bytesEnCola = 0;
          try { sb.appendBuffer(junto); } catch (e) { fallar(); }
        } else if (terminado) {
          ms.endOfStream();
          cargaCompleta = true;
          buscar();
        }
      }

      function fallar() {
        terminado = true;
        modoMSE = false;
        cargarRespaldo();
      }

      sb.addEventListener('updateend', function () { bombear(); buscar(); });
      sb.addEventListener('error', fallar);

      fetch(fuente).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        if (!r.body || !r.body.getReader) {
          return r.arrayBuffer().then(function (b) {
            cola.push(new Uint8Array(b)); bytesEnCola = b.byteLength; terminado = true; bombear();
          });
        }
        var lector = r.body.getReader();
        return (function leer() {
          return lector.read().then(function (parte) {
            if (parte.done) { terminado = true; bombear(); return; }
            cola.push(parte.value);
            bytesEnCola += parte.value.length;
            bombear();
            return leer();
          });
        })();
      }).catch(fallar);
    }, { once: true });
  }

  // ---------- Respaldo sin MediaSource (iPhone con iOS < 17.1, por ejemplo) ----------
  // Arranca con streaming para moverse cuanto antes y, en paralelo, descarga el archivo
  // completo; cuando está listo cambia a un video con el blob, ya situado en el mismo
  // cuadro y colocado debajo del actual, así que el cambio no se ve.
  function cargarRespaldo() {
    modoMSE = false;
    var actual = video;
    prepararElemento(actual);
    actual.preload = 'auto';
    if (!listo) alPrimerCuadro(actual);
    actual.src = fuente;

    if (!window.fetch) return;
    // La descarga completa empieza cuando el navegador deja de precargar el streaming
    // (o a los 8 s), para que no compitan por el ancho de banda al principio.
    var empezada = false;
    function empezarDescarga() {
      if (empezada) return;
      empezada = true;
      clearTimeout(espera);
      descargarCompleto();
    }
    var espera = setTimeout(empezarDescarga, 8000);
    actual.addEventListener('suspend', empezarDescarga, { once: true });
    actual.addEventListener('canplaythrough', empezarDescarga, { once: true });
  }

  function descargarCompleto() {
    var actual = video;
    fetch(fuente).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.blob();
    }).then(function (blob) {
      var nuevo = actual.cloneNode(false);
      nuevo.removeAttribute('src');
      prepararElemento(nuevo);
      nuevo.preload = 'auto';
      medio.insertBefore(nuevo, actual); // debajo del video visible
      function situar() {
        if (Math.abs(nuevo.currentTime - tiempoObjetivo) > 0.001) {
          nuevo.currentTime = tiempoObjetivo;
          return;
        }
        nuevo.removeEventListener('seeked', situar);
        actual.removeEventListener('seeked', buscar);
        actual.removeAttribute('src');
        actual.load();
        actual.remove();
        video = nuevo;
        cargaCompleta = true;
        listo = true;
        medio.classList.add('is-listo');
        video.addEventListener('seeked', buscar);
        buscar();
      }
      nuevo.addEventListener('loadeddata', function () {
        nuevo.addEventListener('seeked', situar);
        situar();
      }, { once: true });
      nuevo.src = URL.createObjectURL(blob);
    }).catch(function () {
      // Se queda el streaming; si tampoco carga, queda el fotograma de la escena 1
    });
  }

  var MS = window.ManagedMediaSource || window.MediaSource;
  if (MS && MS.isTypeSupported && MS.isTypeSupported(TIPO) && window.fetch) {
    cargarConMediaSource(MS);
  } else {
    cargarRespaldo();
  }
})();

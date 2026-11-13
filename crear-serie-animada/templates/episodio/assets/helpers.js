/* Ayudas compartidas por las escenas del episodio. Necesita window.Personaje y window.gsap.
   Todo determinista: sin Math.random ni Date.now. */
(function (global) {
  "use strict";
  var FORMAS = ["abierta", "ancha", "redonda", "abierta", "ancha"];

  /* Movimiento de boca por palabra. palabras = [[ini, fin], ...] en segundos RELATIVOS a t0.
     Alterna formas cada ~0,115 s dentro de cada palabra y cierra la boca entre palabras.
     "reposo" = forma con que queda al terminar (si no se pasa, no se toca la boca al terminar). */
  function habla(tl, root, t0, palabras, reposo) {
    var n = 0;
    palabras.forEach(function (w, i) {
      var s = t0 + w[0], e = t0 + w[1];
      if (e <= 0) return;                                   // palabra de una voz que arrancó antes de esta escena
      for (var t = Math.max(0, s); t < e - 0.05; t += 0.115) { global.Personaje.bocaAt(tl, root, FORMAS[n % FORMAS.length], t); n++; }
      var sig = palabras[i + 1];
      if (!sig || sig[0] - w[1] > 0.06) global.Personaje.bocaAt(tl, root, "cerrada", Math.max(0, e));
    });
    if (reposo) global.Personaje.bocaAt(tl, root, reposo, Math.max(0, t0 + palabras[palabras.length - 1][1] + 0.1));
  }

  /* Boca de una línea de voz usando los números que salen de Whisper (assets/voz-palabras.js) y el inicio de la voz
     (assets/episodio-tiempos.js). linea = "01-gancho", escena = "esc1" (id de la escena que la llama).
     Si todavía no hay voz importada, no hace nada. Al retimear la voz, la boca se corre sola. */
  function hablaLinea(tl, root, linea, escena, reposo) {
    var V = global.VOZ_PALABRAS, EP = global.EP;
    if (!V || !EP || !V[linea] || !EP.voces || !EP.voces[linea]) return;
    var t0 = EP.voces[linea].inicio - ((EP.escenas && EP.escenas[escena]) || 0);
    habla(tl, root, t0, V[linea].p, reposo);
  }

  /* Pose a partir de otra, con un brazo llevado a (tx, ty) del SVG del rig. */
  function brazo(side, tx, ty, bend) {
    var r = global.Personaje.ik(side, tx, ty, bend), o = {};
    o["brazo-" + side] = { rotation: r.brazo };
    o["antebrazo-" + side] = { rotation: r.antebrazo };
    return o;
  }
  /* Mezcla poses: cada argumento es el nombre de una pose o un objeto de partes. Los últimos pisan a los primeros. */
  function pose(base) {
    var out = {};
    for (var i = 0; i < arguments.length; i++) {
      var src = arguments[i];
      if (typeof src === "string") src = global.Personaje.POSES[src];
      for (var k in src) out[k] = Object.assign({}, out[k] || {}, src[k]);
    }
    return out;
  }

  /* Sacudón de cámara determinista sobre un elemento (px). */
  function sacudon(tl, el, t, dur, fuerza) {
    var pasos = 6;
    for (var k = 0; k < pasos; k++) {
      var f = (1 - k / pasos) * fuerza;
      tl.to(el, { x: (k % 2 ? -1 : 1) * f, y: (k % 3 === 0 ? -1 : 1) * f * 0.6, duration: dur / pasos, ease: "none" }, t + (k * dur) / pasos);
    }
    tl.to(el, { x: 0, y: 0, duration: 0.05, ease: "none" }, t + dur);
  }

  global.Hab = { habla: habla, hablaLinea: hablaLinea, brazo: brazo, pose: pose, sacudon: sacudon };

  /* Ajustes del episodio sobre el look base del rig (Personaje.look arma el estado desde BASE_VARS).
     Ejemplo: ningún personaje lleva el prop de identidad en la mano en este episodio:
       global.Personaje.BASE_VARS["--acc-identidad"] = 0;
     (el rig y los otros episodios no cambian). */
})(window);

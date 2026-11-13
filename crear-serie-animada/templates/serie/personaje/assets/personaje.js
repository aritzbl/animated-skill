/* Personaje: API del rig 2D. Necesita window.gsap y window.PERSONAJE_MARKUP (assets/personaje-markup.js).
   Todo es determinista: sin Math.random, sin Date.now, sin fetch.
   Convención de lados: "i" = izquierda de la PANTALLA, "d" = derecha de la PANTALLA (no del personaje).
   Ángulos en grados, positivo = sentido horario (SVG con y hacia abajo). */
(function (global) {
  "use strict";
  var gsap = global.gsap;
  var RAD = Math.PI / 180;

  /* ---------- huesos de los brazos en pose de descanso (coordenadas del SVG) ---------- */
  var ARM = {
    i: { S: [152, 240], E: [130, 292], H: [121, 372] },
    d: { S: [248, 240], E: [270, 292], H: [279, 372] },
  };

  /* Cinemática inversa de 2 huesos: lleva el centro de la mano a (tx, ty).
     bend = +1 / -1 elige para qué lado dobla el codo.
     Para el brazo i, +1 abre el codo hacia afuera. Para el brazo d, -1. */
  function ik(side, tx, ty, bend) {
    var a = ARM[side];
    var L1 = Math.hypot(a.E[0] - a.S[0], a.E[1] - a.S[1]);
    var L2 = Math.hypot(a.H[0] - a.E[0], a.H[1] - a.E[1]);
    var dx = tx - a.S[0], dy = ty - a.S[1];
    var d = Math.hypot(dx, dy);
    d = Math.min(Math.max(d, Math.abs(L1 - L2) + 0.5), L1 + L2 - 0.5);
    var base = Math.atan2(dy, dx);
    var cosA = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d);
    var A = Math.acos(Math.max(-1, Math.min(1, cosA)));
    var upper = base + bend * A;
    var ex = a.S[0] + L1 * Math.cos(upper), ey = a.S[1] + L1 * Math.sin(upper);
    var hx = a.S[0] + d * Math.cos(base), hy = a.S[1] + d * Math.sin(base);
    var fore = Math.atan2(hy - ey, hx - ex);
    var u0 = Math.atan2(a.E[1] - a.S[1], a.E[0] - a.S[0]);
    var f0 = Math.atan2(a.H[1] - a.E[1], a.H[0] - a.E[0]);
    var r1 = upper - u0;
    var r2 = fore - f0 - r1;
    function norm(r) { var g = r / RAD; while (g > 180) g -= 360; while (g < -180) g += 360; return g; }
    return { brazo: norm(r1), antebrazo: norm(r2) };
  }
  function armPose(side, tx, ty, bend) {
    var r = ik(side, tx, ty, bend), o = {};
    o["brazo-" + side] = { rotation: r.brazo };
    o["antebrazo-" + side] = { rotation: r.antebrazo };
    return o;
  }
  function merge() {
    var out = {};
    for (var i = 0; i < arguments.length; i++) {
      var src = arguments[i];
      for (var k in src) { out[k] = Object.assign({}, out[k] || {}, src[k]); }
    }
    return out;
  }

  /* ---------- articulaciones que mueven las poses ---------- */
  var JOINTS = [
    "cuerpo", "torso", "cabeza",
    "brazo-i", "antebrazo-i", "mano-i", "brazo-d", "antebrazo-d", "mano-d",
    "pierna-i", "muslo-i", "pierna-i-inf", "pie-i",
    "pierna-d", "muslo-d", "pierna-d-inf", "pie-d",
  ];
  var REST = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
  /* postura: 1 = encorvado (estado inicial), 0 = derecho. Se suma a CUALQUIER pose: baja y achata
     el torso y hunde la cabeza entre los hombros. Cada mejora "postura-N" la va bajando. */
  var POSTURA_BASE = 1;
  function posturaOffsets(p) {
    return { cabeza: { y: 14 * p, sy: 1 - 0.05 * p }, torso: { sy: 1 - 0.04 * p } };
  }
  function estadoDe(root) {
    if (!root._personaje) root._personaje = { pose: "parado", postura: POSTURA_BASE };
    return root._personaje;
  }
  /* props: partes que solo se prenden o apagan según la pose (prop-mano = el objeto de identidad en la mano d) */
  var PROPS = ["silla", "prop-manos", "dedo-i", "dedo-d", "prop-mano", "prop-sorbo"];
  /* el prop de identidad va en la mano d por defecto; las poses que usan esa mano lo apagan */
  var PROP_DEFAULT = { "prop-mano": 1 };

  /* ---------- ciclo de caminata: andar con balanceo (waddle), mira a la derecha de la pantalla ----------
     Cuatro claves: levanta la pierna i, apoya, levanta la d, apoya. El cuerpo se balancea hacia
     la pierna que apoya. La pierna que se levanta flexiona la rodilla (no cruza la otra). */
  var WALK = [
    /* 0: levanta la pierna i (queda atrás), el cuerpo se carga sobre la d */
    {
      cuerpo: { x: 4, y: -2 }, torso: { rotation: 3 }, cabeza: { y: 1, rotation: -2 },
      "pierna-i": { rotation: 5 }, "pierna-i-inf": { rotation: 36 }, "pie-i": { rotation: 12 },
      "pierna-d": { rotation: -2 },
      "brazo-i": { rotation: -14 }, "antebrazo-i": { rotation: -8 },
      "brazo-d": { rotation: 12 }, "antebrazo-d": { rotation: -2 },
    },
    /* 1: contacto, las dos piernas apoyan, el cuerpo baja */
    {
      cuerpo: { x: 0, y: 3 }, torso: { rotation: 0 }, cabeza: { y: 2 },
      "brazo-i": { rotation: -4 }, "brazo-d": { rotation: 4 },
    },
    /* 2: levanta la pierna d (pasa adelante), el cuerpo se carga sobre la i */
    {
      cuerpo: { x: -4, y: -2 }, torso: { rotation: -3 }, cabeza: { y: 1, rotation: 2 },
      "pierna-d": { rotation: -5 }, "pierna-d-inf": { rotation: -36 }, "pie-d": { rotation: -12 },
      "pierna-i": { rotation: 2 },
      "brazo-d": { rotation: -14 }, "antebrazo-d": { rotation: -8 },
      "brazo-i": { rotation: 12 }, "antebrazo-i": { rotation: -2 },
    },
    /* 3: contacto */
    {
      cuerpo: { x: 0, y: 3 }, torso: { rotation: 0 }, cabeza: { y: 2 },
      "brazo-i": { rotation: 4 }, "brazo-d": { rotation: -4 },
    },
  ];

  /* ---------- poses ---------- */
  var POSES = {
    parado: {},

    /* sentado: pelvis baja, muslos en escorzo (se ven cortos), manos en el prop-manos */
    sentado: merge(
      {
        cuerpo: { y: 50 },
        torso: { scaleY: 0.98 },
        cabeza: { y: 3 },
        "muslo-i": { scaleY: 0.3 }, "muslo-d": { scaleY: 0.3 },
        "pierna-i": { x: -12, rotation: 6 }, "pierna-d": { x: 12, rotation: -6 },
        "pierna-i-inf": { y: -50.4, rotation: -6 }, "pierna-d-inf": { y: -50.4, rotation: 6 },
        silla: { opacity: 1 }, "prop-manos": { opacity: 1 }, "prop-mano": { opacity: 0 },
      },
      armPose("i", 166, 364, 1),
      armPose("d", 234, 364, -1)
    ),

    caminando: WALK[0],

    /* señalando con el índice arriba a la derecha de la pantalla */
    "señalando": merge(
      {
        torso: { rotation: -3 }, cabeza: { rotation: -4 },
        "dedo-d": { opacity: 1 }, "prop-mano": { opacity: 0 },
      },
      armPose("d", 352, 152, -1)
    ),

    /* cabeza entre las manos: se hunde, codos abiertos */
    "cabeza-entre-manos": merge(
      {
        torso: { scaleY: 0.96 }, cabeza: { y: 16, rotation: 2 }, "prop-mano": { opacity: 0 },
      },
      armPose("i", 118, 186, -1),
      armPose("d", 282, 186, 1)
    ),

    /* saludo: brazo d arriba (la oscilación del antebrazo se anima aparte con wave) */
    saludo: merge(
      { torso: { rotation: 2 }, cabeza: { rotation: -3 }, "dedo-d": { opacity: 0 }, "prop-mano": { opacity: 0 } },
      armPose("d", 318, 132, 1)
    ),

    /* sorbo: el brazo d sube la mano a la boca con el codo pegado al cuerpo.
       La mano y el prop que se ven son los de "prop-sorbo", que va arriba de la cara. */
    "sorbo": merge(
      { cabeza: { rotation: -3 }, "prop-mano": { opacity: 0 }, "prop-sorbo": { opacity: 1 } },
      armPose("d", 240, 222, -1)
    ),
  };

  /* sentado con sorbo: deja el prop-manos, la mano d sube el prop a la boca */
  POSES["sentado-sorbo"] = merge(
    POSES.sentado,
    { "prop-manos": { opacity: 0 }, "prop-mano": { opacity: 0 }, "prop-sorbo": { opacity: 1 }, cabeza: { y: 3, rotation: -3 } },
    armPose("d", 240, 222, -1)
  );

  /* ---------- expresiones (ojos, cejas, rubor) y formas de boca ---------- */
  var EXPR = {
    /* lid: bajada del párpado en px (0 abierto, 30 cerrado). lidRot: inclinación en grados.
       brow: y y rotation. pupil: desplazamiento. eye: escala del ojo. */
    neutro:    { lid: 15, lidRot: [0, 0],    brow: [{ y: 0, r: 0 }, { y: 0, r: 0 }],      pupil: [0, 0],   eye: 1,    rubor: 0, boca: "cerrada" },
    sorpresa:  { lid: 0,  lidRot: [0, 0],    brow: [{ y: -12, r: 12 }, { y: -12, r: -12 }], pupil: [0, -1],  eye: 1.2,  rubor: 0, boca: "redonda" },
    verguenza: { lid: 10, lidRot: [-6, 6],   brow: [{ y: -2, r: -10 }, { y: -2, r: 10 }], pupil: [-4, 5],  eye: 1,    rubor: 1, boca: "temblor" },
    bronca:    { lid: 9,  lidRot: [16, -16], brow: [{ y: 5, r: 26 }, { y: 5, r: -26 }],  pupil: [0, 2],   eye: 1,    rubor: 0, boca: "enojo" },
    cansado:   { lid: 22, lidRot: [-6, 6],   brow: [{ y: 4, r: -6 }, { y: 4, r: 6 }],    pupil: [0, 6],   eye: 1,    rubor: 0, boca: "triste" },
    orgulloso: { lid: 18, lidRot: [0, 0],    brow: [{ y: -9, r: -4 }, { y: -1, r: 0 }],  pupil: [3, 3],   eye: 1,    rubor: 0, boca: "ladeada" },
  };
  var BOCAS = ["cerrada", "abierta", "ancha", "redonda", "triste", "ladeada", "temblor", "enojo"];
  var BOCAS_HABLA = ["cerrada", "abierta", "ancha", "redonda"];

  /* giro de cabeza (aprox. 3/4): la cara se corre y se achata; la oreja lejana desaparece */
  var GIRO = {
    frente:  { cara: { x: 0, scaleX: 1 }, nariz: { x: 0, scaleX: 1 }, "oreja-i": { x: 0, opacity: 1 }, "oreja-d": { x: 0, opacity: 1 } },
    tresCuartosD: { cara: { x: 24, scaleX: 0.9 }, nariz: { x: 6, scaleX: 1.3 }, "oreja-i": { x: 0, opacity: 1 }, "oreja-d": { x: -10, opacity: 0 } },
    tresCuartosI: { cara: { x: -24, scaleX: 0.9 }, nariz: { x: -6, scaleX: 1.3 }, "oreja-i": { x: 10, opacity: 0 }, "oreja-d": { x: 0, opacity: 1 } },
  };

  /* ---------- mejoras por episodio ----------
     Cada mejora cambia variables CSS (ver assets/personaje.css). El rig no se redibuja.
     "dia" es el episodio por defecto en que ocurre: se puede cambiar según lo que vote el público.
     tipo: "estética" (se ve en el cuerpo), "hábito" (cambia algo que hace o lleva: el objeto del hábito, la postura)
     o "skill" (accesorio de lo aprendido). Una mejora puede traer "postura": 1 encorvado a 0 derecho. */
  var BASE_VARS = {
    "--p-shirt": "#3E8E8A", "--p-pants": "#4C5B7A", "--p-shoes": "#D9D3C7",
    "--ojeras": 1, "--granos": 1, "--pelo-sucio": 1, "--pelo-despeinado": 1, "--pelo-largo": 1, "--mechon": 1, "--pelo-peinado": 0,
    "--mancha-1": 1, "--mancha-2": 1, "--mancha-3": 1, "--zapa-mugre": 1,
    "--acc-habito": 1, "--acc-identidad": 1,
    "--acc-cuello": 0, "--acc-corbata": 0, "--acc-credencial": 0,
    "--acc-anteojos": 0, "--acc-reloj": 0, "--acc-birome": 0,
  };
    /* EJEMPLO de arco "descuidado -> arreglado": reemplazar por el arco de tu serie (ver references/02-personaje-y-rig.md).
     "dia" = número de episodio por defecto en que ocurre (se mueve según lo que vote el público).
     Orden sugerido: primero el aspecto, después los hábitos, al final las skills. */
  var MEJORAS = [
    { id: "lava-pelo",   dia: 2,  tipo: "estética", nombre: "Se lava el pelo",                  vars: { "--pelo-sucio": 0 } },
    { id: "corta-pelo",  dia: 2,  tipo: "estética", nombre: "Se corta y se peina el pelo",      vars: { "--pelo-largo": 0, "--pelo-despeinado": 0, "--mechon": 0, "--pelo-peinado": 1 } },
    { id: "lava-ropa",   dia: 3,  tipo: "estética", nombre: "Lava la remera",                   vars: { "--mancha-1": 0, "--mancha-2": 0, "--mancha-3": 0 } },
    { id: "duerme-1",    dia: 4,  tipo: "estética", nombre: "Duerme una noche entera",          vars: { "--ojeras": 0.6 } },
    { id: "piel-1",      dia: 5,  tipo: "estética", nombre: "Se cuida la piel",                 vars: { "--granos": 0.4 } },
    { id: "zapatillas",  dia: 6,  tipo: "estética", nombre: "Limpia las zapatillas",            vars: { "--zapa-mugre": 0, "--p-shoes": "#F2EFE8" } },
    { id: "postura-1",   dia: 7,  tipo: "hábito",   nombre: "Se endereza un poco",              vars: {}, postura: 0.65 },
    { id: "sin-habito",  dia: 8,  tipo: "hábito",   nombre: "Deja el objeto del hábito",        vars: { "--acc-habito": 0 } },
    { id: "duerme-2",    dia: 10, tipo: "estética", nombre: "Duerme bien toda la semana",       vars: { "--ojeras": 0 } },
    { id: "piel-2",      dia: 11, tipo: "estética", nombre: "Piel limpia",                      vars: { "--granos": 0 } },
    { id: "postura-2",   dia: 12, tipo: "hábito",   nombre: "Camina con la espalda más recta",  vars: {}, postura: 0.3 },
    { id: "birome",      dia: 14, tipo: "skill",    nombre: "Skill 1 (birome en la oreja)",     vars: { "--acc-birome": 1 } },
    { id: "anteojos",    dia: 17, tipo: "skill",    nombre: "Skill 2 (anteojos)",               vars: { "--acc-anteojos": 1 } },
    { id: "credencial",  dia: 20, tipo: "skill",    nombre: "Skill 3 (credencial)",             vars: { "--acc-credencial": 1 } },
    { id: "postura-3",   dia: 22, tipo: "hábito",   nombre: "Postura de entrevista",            vars: {}, postura: 0 },
    { id: "camisa",      dia: 24, tipo: "skill",    nombre: "Ropa formal (camisa)",             vars: { "--p-shirt": "#F3EEE2", "--acc-cuello": 1 } },
    { id: "reloj",       dia: 27, tipo: "skill",    nombre: "Skill 4 (reloj)",                  vars: { "--acc-reloj": 1 } },
    { id: "corbata",     dia: 30, tipo: "skill",    nombre: "Look final (corbata)",             vars: { "--acc-corbata": 1, "--p-pants": "#3E4A66" } },
  ];
  /* estado = número de día (aplica todas las mejoras con dia <= estado)
            o lista de ids (aplica solo esas, en el orden de la tabla) */
  function mejorasDe(estado) {
    if (typeof estado === "number") return MEJORAS.filter(function (m) { return m.dia <= estado; });
    return MEJORAS.filter(function (m) { return estado.indexOf(m.id) >= 0; });
  }
  function look(root, estado) {
    var vars = Object.assign({}, BASE_VARS), postura = POSTURA_BASE;
    mejorasDe(estado).forEach(function (m) {
      Object.assign(vars, m.vars);
      if (m.postura != null) postura = m.postura;
    });
    Object.keys(vars).forEach(function (k) { root.style.setProperty(k, String(vars[k])); });
    var st = estadoDe(root);
    st.postura = postura;
    poseApply(null, root, st.pose, 0, 0);   // la postura se ve en la pose actual
  }
  /* ids de todas las mejoras hasta la indicada, inclusive (para mostrar antes y después) */
  function hasta(id) {
    var out = [];
    for (var i = 0; i < MEJORAS.length; i++) { out.push(MEJORAS[i].id); if (MEJORAS[i].id === id) break; }
    return out;
  }
  function antesDe(id) { var h = hasta(id); h.pop(); return h; }
  /* aplica una mejora con animación dentro de un episodio (p. ej. se lava la remera en cámara) */
  function mejoraTo(tl, root, id, t, dur) {
    var m = MEJORAS.filter(function (x) { return x.id === id; })[0];
    dur = dur || 0.5;
    Object.keys(m.vars).forEach(function (k) {
      var v = m.vars[k], o = {};
      o[k] = v;
      if (typeof v === "number") { o.duration = dur; o.ease = "sine.inOut"; tl.to(root, o, t); }
      else tl.set(root, o, t + dur / 2);
    });
    if (m.postura != null) {            // la postura no es CSS: se anima volviendo a aplicar la pose actual
      var st = estadoDe(root);
      st.postura = m.postura;
      poseApply(tl, root, st.pose, t, dur, "sine.inOut");
    }
  }

  /* ---------- montaje ---------- */
  var uidCount = 0;
  function mount(host, opts) {
    opts = opts || {};
    var uid = opts.uid || "g" + (++uidCount);
    var wrap = document.createElement("div");
    wrap.innerHTML = global.PERSONAJE_MARKUP;
    var svg = wrap.firstElementChild;
    svg.setAttribute("data-uid", uid);
    // ids únicos por instancia: id original queda en data-part
    var ids = [];
    svg.querySelectorAll("[id]").forEach(function (el) {
      ids.push(el.id);
      el.setAttribute("data-part", el.id);
      el.id = uid + "-" + el.id;
    });
    svg.querySelectorAll("[clip-path]").forEach(function (el) {
      var m = /url\(#([\w-]+)\)/.exec(el.getAttribute("clip-path"));
      if (m) el.setAttribute("clip-path", "url(#" + uid + "-" + m[1] + ")");
    });
    if (opts.viewBox) svg.setAttribute("viewBox", opts.viewBox);
    if (opts.width) svg.style.width = opts.width;
    if (opts.height) svg.style.height = opts.height;
    svg.style.display = "block";
    if (opts.overflow) svg.style.overflow = "visible";
    host.appendChild(svg);
    svg.querySelectorAll("[data-pivot]").forEach(function (el) {
      gsap.set(el, { svgOrigin: el.getAttribute("data-pivot") });
    });
    poseSet(svg, opts.pose || "parado");
    exprSet(svg, opts.expr || "neutro");
    if (opts.boca) bocaSet(svg, opts.boca);
    giroSet(svg, opts.giro || "frente");
    if (opts.mejoras || opts.dia != null) look(svg, opts.mejoras || opts.dia);
    return svg;
  }
  function part(root, name) { return root.querySelector('[data-part="' + name + '"]'); }

  /* ---------- helpers de animación ---------- */
  function put(tl, t, el, props, dur, ease) {
    if (!el) return;
    if (!tl) { gsap.set(el, props); return; }
    if (dur > 0) tl.to(el, Object.assign({}, props, { duration: dur, ease: ease || "sine.inOut" }), t);
    else tl.set(el, props, t);
  }
  function poseObj(pose) { return typeof pose === "string" ? POSES[pose] : pose; }

  /* pose estática (hoja) o animada (tl) */
  function poseApply(tl, root, pose, t, dur, ease) {
    var P = poseObj(pose) || {};
    var st = estadoDe(root);
    st.pose = pose;
    var off = posturaOffsets(st.postura);
    JOINTS.forEach(function (j) {
      var props = Object.assign({}, REST, P[j] || {});
      if (off[j]) { props.y += off[j].y || 0; props.scaleY *= off[j].sy || 1; }
      put(tl, t, part(root, j), props, dur, ease);
    });
    PROPS.forEach(function (p) {
      var o = (P[p] && P[p].opacity != null) ? P[p].opacity : (PROP_DEFAULT[p] || 0);
      put(tl, t, part(root, p), { opacity: o }, dur ? Math.min(dur, 0.2) : 0, "none");
    });
  }
  function poseSet(root, pose) { poseApply(null, root, pose, 0, 0); }
  function poseTo(tl, root, pose, t, dur, ease) { poseApply(tl, root, pose, t, dur, ease); }

  function bocaApply(tl, root, forma, t) {
    BOCAS.forEach(function (b) {
      put(tl, t, part(root, "boca-" + b), { opacity: b === forma ? 1 : 0 }, 0);
    });
  }
  function bocaSet(root, forma) { bocaApply(null, root, forma, 0); }
  function bocaAt(tl, root, forma, t) { bocaApply(tl, root, forma, t); }

  function exprApply(tl, root, name, t, dur, ease) {
    var E = typeof name === "string" ? EXPR[name] : name;
    ["i", "d"].forEach(function (s, n) {
      put(tl, t, part(root, "parpado-" + s), { y: E.lid, rotation: E.lidRot[n] }, dur, ease);
      put(tl, t, part(root, "pupila-" + s), { x: E.pupil[0], y: E.pupil[1] }, dur, ease);
      put(tl, t, part(root, "ojo-" + s), { scaleX: E.eye, scaleY: E.eye }, dur, ease);
      put(tl, t, part(root, "ceja-" + s), { y: E.brow[n].y, rotation: E.brow[n].r }, dur, ease);
    });
    put(tl, t, part(root, "rubor"), { opacity: E.rubor }, dur, ease);
    // la boca cambia a mitad de camino: nunca "salta" antes que los ojos
    bocaApply(tl, root, E.boca, t + (dur || 0) * 0.5);
  }
  function exprSet(root, name) { exprApply(null, root, name, 0, 0); }
  function exprTo(tl, root, name, t, dur, ease) { exprApply(tl, root, name, t, dur, ease); }

  function giroApply(tl, root, name, t, dur, ease) {
    var G = GIRO[name];
    Object.keys(G).forEach(function (p) { put(tl, t, part(root, p), G[p], dur, ease); });
  }
  function giroSet(root, name) { giroApply(null, root, name, 0, 0); }
  function giroTo(tl, root, name, t, dur, ease) { giroApply(tl, root, name, t, dur, ease); }

  /* parpadeo: baja los párpados y vuelve al valor de la expresión. restLid = EXPR[x].lid */
  function blink(tl, root, t, restLid) {
    ["i", "d"].forEach(function (s) {
      var el = part(root, "parpado-" + s);
      tl.to(el, { y: 30, duration: 0.06, ease: "power1.in" }, t);
      tl.to(el, { y: restLid, duration: 0.1, ease: "power1.out" }, t + 0.09);
    });
  }

  /* respiración en idle: sube y baja el pecho. Se despliega en ciclos explícitos (sin repeat infinito). */
  function breathe(tl, root, t0, t1, period) {
    period = period || 2.4;
    var el = part(root, "respira");
    for (var t = t0; t < t1 - 0.01; t += period) {
      var half = Math.min(period / 2, (t1 - t) / 2);
      tl.to(el, { scaleY: 1.014, scaleX: 0.994, duration: half, ease: "sine.inOut" }, t);
      tl.to(el, { scaleY: 1, scaleX: 1, duration: half, ease: "sine.inOut" }, t + half);
    }
  }

  /* caminata: n pasos de T/4 cada uno. Devuelve el tiempo final. */
  function walk(tl, root, t0, steps, T, startKey) {
    var q = T / 4;
    for (var n = 0; n < steps; n++) {
      poseApply(tl, root, WALK[(n + (startKey || 0)) % 4], t0 + n * q, q, "sine.inOut");
    }
    return t0 + steps * q;
  }

  /* un sorbo de "prop-mano": sube, aguanta "hold" segundos y vuelve a la pose en la que estaba */
  function sorbo(tl, root, t, hold) {
    hold = hold || 0.9;
    var prev = estadoDe(root).pose;
    var pose = prev === "sentado" ? "sentado-sorbo" : "sorbo";   // sentado conserva silla y cuerpo
    poseApply(tl, root, pose, t, 0.35, "sine.inOut");
    poseApply(tl, root, prev, t + 0.35 + hold, 0.35, "sine.inOut");
    return t + 0.7 + hold;
  }

  /* saludo con la mano: oscila el antebrazo d alrededor del valor de la pose "saludo" */
  function wave(tl, root, t0, swings, period) {
    var base = POSES.saludo["antebrazo-d"].rotation;
    var el = part(root, "antebrazo-d");
    var mano = part(root, "mano-d");
    for (var n = 0; n < swings; n++) {
      var t = t0 + n * period;
      tl.to(el, { rotation: base + (n % 2 === 0 ? 24 : -24), duration: period, ease: "sine.inOut" }, t);
      tl.to(mano, { rotation: n % 2 === 0 ? -12 : 12, duration: period, ease: "sine.inOut" }, t);
    }
    return t0 + swings * period;
  }

  global.Personaje = {
    mount: mount, part: part, ik: ik,
    POSES: POSES, WALK: WALK, EXPR: EXPR, BOCAS: BOCAS, BOCAS_HABLA: BOCAS_HABLA, GIRO: GIRO,
    poseSet: poseSet, poseTo: poseTo,
    exprSet: exprSet, exprTo: exprTo,
    bocaSet: bocaSet, bocaAt: bocaAt,
    giroSet: giroSet, giroTo: giroTo,
    blink: blink, breathe: breathe, walk: walk, wave: wave, sorbo: sorbo,
    MEJORAS: MEJORAS, BASE_VARS: BASE_VARS,
    look: look, hasta: hasta, antesDe: antesDe, mejoraTo: mejoraTo,
  };
})(window);

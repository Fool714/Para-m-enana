/* =========================================================
   Para Lunita 🌻
   Todo lo que se mueve se dibuja UNA vez en sprites y luego
   solo se copia con drawImage: así el navegador no vuelve a
   calcular pétalos, sombras ni degradados en cada frame.
   ========================================================= */

const canvas = document.getElementById("space");
const ctx = canvas.getContext("2d", { alpha: false });

const modal = document.getElementById("letterModal");
const openLetter = document.getElementById("openLetter");
const closeLetter = document.getElementById("closeLetter");
const musicButton = document.getElementById("musicButton");
const music = document.getElementById("music");

const TAU = Math.PI * 2;
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* =========================================================
   1. Fábrica de sprites (se ejecuta una sola vez)
   ========================================================= */

function lienzo(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

/* --- Girasol dibujado a mano: 12 pétalos + corazón de semillas --- */
function girasol(S, semilla = 0) {
  const c = lienzo(S, S);
  const g = c.getContext("2d");
  const cx = S / 2, cy = S / 2, R = S * 0.34;
  const giro = semilla * 0.4;

  // aura cálida
  const aura = g.createRadialGradient(cx, cy, R * 0.4, cx, cy, S / 2);
  aura.addColorStop(0, "rgba(255, 205, 60, .38)");
  aura.addColorStop(1, "rgba(255, 190, 40, 0)");
  g.fillStyle = aura;
  g.fillRect(0, 0, S, S);

  // dos coronas de pétalos puntiagudos; la de atrás, más oscura y girada
  for (let capa = 1; capa >= 0; capa--) {
    const n = capa === 0 ? 13 : 12;
    const largo = capa === 0 ? R * 1.06 : R * 0.84;
    const ancho = capa === 0 ? R * 0.17 : R * 0.15;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + giro + (capa ? Math.PI / n : 0);
      g.save();
      g.translate(cx, cy);
      g.rotate(a);
      const grad = g.createLinearGradient(0, -largo, 0, 0);
      if (capa === 0) {
        grad.addColorStop(0, "#fff0a0");
        grad.addColorStop(.5, "#ffc93c");
        grad.addColorStop(1, "#e59206");
      } else {
        grad.addColorStop(0, "#efb63a");
        grad.addColorStop(1, "#b86e05");
      }
      g.fillStyle = grad;
      g.beginPath();
      g.moveTo(0, -R * 0.2);
      g.quadraticCurveTo(ancho, -largo * .55, 0, -largo);
      g.quadraticCurveTo(-ancho, -largo * .55, 0, -R * 0.2);
      g.fill();
      g.restore();
    }
  }

  // centro de semillas
  const nucleo = g.createRadialGradient(cx - R * .12, cy - R * .12, 0, cx, cy, R * 0.46);
  nucleo.addColorStop(0, "#9a6524");
  nucleo.addColorStop(.7, "#5a3410");
  nucleo.addColorStop(1, "#301c06");
  g.fillStyle = nucleo;
  g.beginPath();
  g.arc(cx, cy, R * 0.46, 0, TAU);
  g.fill();

  // semillas en espiral (proporción áurea)
  const phi = Math.PI * (3 - Math.sqrt(5));
  const total = 90;
  for (let i = 0; i < total; i++) {
    const rad = Math.sqrt(i / total) * R * 0.42;
    const a = i * phi + giro;
    g.fillStyle = i % 3 === 0 ? "rgba(255, 210, 120, .32)" : "rgba(20, 10, 0, .45)";
    g.beginPath();
    g.arc(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, R * 0.035, 0, TAU);
    g.fill();
  }

  return c;
}

/* --- Ramo: tres girasoles, hojas y un lazo --- */
function ramo(S) {
  const c = lienzo(S, S);
  const g = c.getContext("2d");
  const flor = girasol(Math.round(S * 0.52), 1);
  const f = flor.width;

  // tallos
  g.strokeStyle = "#3f6b2a";
  g.lineWidth = S * 0.035;
  g.lineCap = "round";
  const base = { x: S * 0.5, y: S * 0.92 };
  const puntas = [
    { x: S * 0.26, y: S * 0.36 },
    { x: S * 0.74, y: S * 0.40 },
    { x: S * 0.50, y: S * 0.26 }
  ];
  for (const p of puntas) {
    g.beginPath();
    g.moveTo(base.x, base.y);
    g.quadraticCurveTo((base.x + p.x) / 2, (base.y + p.y) / 2 + S * 0.05, p.x, p.y);
    g.stroke();
  }

  // hojas
  g.fillStyle = "#4e8434";
  for (const s of [-1, 1]) {
    g.save();
    g.translate(base.x, base.y - S * 0.2);
    g.rotate(s * 0.7);
    g.beginPath();
    g.ellipse(s * S * 0.12, 0, S * 0.13, S * 0.05, 0, 0, TAU);
    g.fill();
    g.restore();
  }

  // papel del ramo
  g.fillStyle = "rgba(250, 235, 210, .85)";
  g.beginPath();
  g.moveTo(base.x - S * 0.14, base.y - S * 0.24);
  g.lineTo(base.x + S * 0.14, base.y - S * 0.24);
  g.lineTo(base.x + S * 0.05, base.y);
  g.lineTo(base.x - S * 0.05, base.y);
  g.closePath();
  g.fill();

  for (const p of puntas) g.drawImage(flor, p.x - f / 2, p.y - f / 2);
  return c;
}

/* --- Frase con su sombra ya horneada --- */
function frase(texto) {
  const alto = 96;
  const tmp = lienzo(10, 10).getContext("2d");
  tmp.font = 'italic 700 56px Poppins, sans-serif';
  const ancho = Math.ceil(tmp.measureText(texto).width) + 60;

  const c = lienzo(ancho, alto);
  const g = c.getContext("2d");
  g.font = 'italic 700 56px Poppins, sans-serif';
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.shadowColor = "rgba(0, 0, 0, .9)";
  g.shadowBlur = 16;
  g.fillStyle = "#fffdf2";
  g.fillText(texto, ancho / 2, alto / 2);
  g.shadowBlur = 6;
  g.fillText(texto, ancho / 2, alto / 2);
  return c;
}

/* --- Chispa dorada (corazón y vórtice) --- */
function chispa(S, color) {
  const c = lienzo(S, S);
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, "#fffdf0");
  gr.addColorStop(.35, color);
  gr.addColorStop(1, "rgba(255, 180, 30, 0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, S, S);
  return c;
}

/* --- Espiral del vórtice: se dibuja redonda y luego se aplasta --- */
function espiral(S) {
  const c = lienzo(S, S);
  const g = c.getContext("2d");
  const cx = S / 2, cy = S / 2, R = S / 2;
  g.globalCompositeOperation = "lighter";
  for (let brazo = 0; brazo < 3; brazo++) {
    for (let i = 1; i <= 130; i++) {
      const p = i / 130;
      const a = p * 5.2 + (brazo * TAU) / 3;
      const rad = p * R * 0.95;
      g.globalAlpha = (1 - p) * 0.85;
      g.fillStyle = i % 5 === 0 ? "#fffbe6" : "#ffd24d";
      g.beginPath();
      g.arc(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, (1 - p) * S * 0.006 + 1, 0, TAU);
      g.fill();
    }
  }
  return c;
}

/* --- Resplandores --- */
function resplandor(S, paradas) {
  const c = lienzo(S, S);
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  for (const [pos, col] of paradas) gr.addColorStop(pos, col);
  g.fillStyle = gr;
  g.fillRect(0, 0, S, S);
  return c;
}

const SPR = {
  flores: [girasol(200, 0), girasol(200, 2), ramo(230)],
  chispaOro: chispa(24, "rgba(255, 210, 80, .95)"),
  chispaClara: chispa(24, "rgba(255, 245, 190, .95)"),
  espiral: espiral(420),
  nucleo: resplandor(700, [
    [0, "rgba(255, 252, 220, .85)"],
    [.12, "rgba(255, 225, 120, .5)"],
    [.42, "rgba(220, 190, 40, .16)"],
    [1, "rgba(180, 160, 20, 0)"]
  ]),
  halo: resplandor(900, [
    [0, "rgba(190, 200, 30, .22)"],
    [1, "rgba(190, 200, 30, 0)"]
  ])
};

const FRASES = [
  "Te amo 💛", "Mi amor 🤍", "Eres mi sol 🌻", "Me encantas 💛",
  "Amor de mi vida 🤍", "Siempre juntos 💛", "Eres preciosa 🌻",
  "Eres mi todo 🤍", "Te adoro 💛", "Mi Lunita 🌻", "Eres única 🌻",
  "Te quiero 💛"
];
SPR.frases = FRASES.map(frase);

/* =========================================================
   2. Escena
   ========================================================= */

let W, H, CX, CY, FOCAL, DPR;
let calidad = 1;              // baja sola si el equipo sufre

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  CX = W / 2;
  CY = H * 0.56;
  FOCAL = Math.min(W, H) * 0.9;

  crearEstrellas();
  crearCorazon();
}

/* --- Estrellas --- */
let estrellas = [];

function crearEstrellas() {
  const total = Math.round(((W * H) / 6500) * calidad);
  estrellas = [];
  for (let i = 0; i < total; i++) {
    estrellas.push({
      x: (Math.random() * W) | 0,
      y: (Math.random() * H) | 0,
      s: Math.random() < .8 ? 1 : 2,
      fase: Math.random() * TAU,
      vel: 0.6 + Math.random() * 1.4
    });
  }
}

function pintarEstrellas(t) {
  ctx.fillStyle = "#ffffff";
  for (const e of estrellas) {
    ctx.globalAlpha = 0.25 + Math.abs(Math.sin(t * 0.001 * e.vel + e.fase)) * 0.7;
    ctx.fillRect(e.x, e.y, e.s, e.s);
  }
  ctx.globalAlpha = 1;
}

/* --- Corazón de chispas --- */
let corazon = [];
let zonaCorazon = { x: 0, y: 0, r: 0 };

function crearCorazon() {
  const esc = Math.min(W, H) * 0.0085;
  const cy = CY - Math.min(W, H) * 0.24;
  const total = Math.round((reduced ? 120 : 240) * calidad);
  zonaCorazon = { x: CX, y: cy, r: esc * 17 };
  corazon = [];

  for (let i = 0; i < total; i++) {
    const a = (i / total) * TAU;
    const x = 16 * Math.pow(Math.sin(a), 3);
    const y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
    corazon.push({
      tx: CX + x * esc + (Math.random() - .5) * esc * 2.2,
      ty: cy - y * esc + (Math.random() - .5) * esc * 2.2,
      vida: reduced ? 1 : -Math.random() * 1.4,
      vel: .35 + Math.random() * .45,
      fase: Math.random() * TAU,
      tam: 7 + Math.random() * 9,
      clara: Math.random() > .82
    });
  }
}

function pintarCorazon(t, dt) {
  ctx.globalCompositeOperation = "lighter";
  for (const h of corazon) {
    h.vida += dt * h.vel;
    if (h.vida > 5) h.vida = -Math.random() * .6;
    if (h.vida < 0) continue;

    const p = h.vida < 1 ? h.vida : 1;
    const e = 1 - Math.pow(1 - p, 3);
    const x = CX + (h.tx - CX) * e;
    const y = CY + (h.ty - CY) * e - Math.sin(p * Math.PI) * 18;

    ctx.globalAlpha = Math.min(p * 1.6, 1) * (.55 + Math.abs(Math.sin(t * .004 + h.fase)) * .45);
    const s = h.tam;
    ctx.drawImage(h.clara ? SPR.chispaClara : SPR.chispaOro, x - s / 2, y - s / 2, s, s);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

/* --- Girasoles y frases que vuelan hacia ti --- */
const Z_LEJOS = 1400;
const Z_CERCA = 70;
let objetos = [];

function nuevoObjeto(z) {
  const esFlor = Math.random() < .58;
  const a = Math.random() * TAU;
  const rad = 40 + Math.random() * 190;
  const sprite = esFlor
    ? SPR.flores[(Math.random() * SPR.flores.length) | 0]
    : SPR.frases[(Math.random() * SPR.frases.length) | 0];

  objetos.push({
    x: Math.cos(a) * rad,
    y: Math.sin(a) * rad * .55,
    z: z ?? Z_LEJOS,
    vz: 90 + Math.random() * 130,
    sprite,
    // alto en "unidades de mundo": el ancho sale de la proporción del sprite
    alto: esFlor ? 58 + Math.random() * 30 : 17 + Math.random() * 6
  });
}

function limite() {
  return Math.round((reduced ? 14 : 32) * calidad);
}

function moverObjetos(dt) {
  for (let i = objetos.length - 1; i >= 0; i--) {
    objetos[i].z -= objetos[i].vz * dt;
    if (objetos[i].z <= Z_CERCA) objetos.splice(i, 1);
  }
  while (objetos.length < limite()) nuevoObjeto();
  objetos.sort((a, b) => b.z - a.z);   // los lejanos, primero
}

function pintarObjetos() {
  for (const o of objetos) {
    const k = FOCAL / o.z;
    const h = o.alto * k;
    if (h < 6) continue;
    const w = h * (o.sprite.width / o.sprite.height);
    const x = CX + o.x * k;
    const y = CY + o.y * k;

    const entra = (Z_LEJOS - o.z) / 420;
    const sale = (o.z - Z_CERCA) / 220;
    ctx.globalAlpha = Math.max(0, Math.min(entra, sale, 1));
    ctx.drawImage(o.sprite, x - w / 2, y - h / 2, w, h);
  }
  ctx.globalAlpha = 1;
}

for (let i = 0; i < 30; i++) nuevoObjeto(Z_CERCA + Math.random() * (Z_LEJOS - Z_CERCA));

/* --- Fondo --- */
function pintarFondo(t) {
  const halo = Math.max(W, H) * 1.1;
  ctx.drawImage(SPR.halo, W * .72 - halo / 2, H * .22 - halo / 2, halo, halo);

  const pulso = 1 + Math.sin(t * .0015) * .06;
  const nuc = Math.min(W, H) * .84 * pulso;
  ctx.drawImage(SPR.nucleo, CX - nuc / 2, CY - nuc / 2, nuc, nuc);
}

function pintarVortice(t) {
  const R = Math.min(W, H) * .42;
  ctx.globalCompositeOperation = "lighter";
  ctx.save();
  ctx.translate(CX, CY);
  ctx.scale(1, .34);              // aplastado = suelo en perspectiva
  ctx.rotate(t * .0009);
  ctx.drawImage(SPR.espiral, -R / 2, -R / 2, R, R);
  ctx.restore();
  ctx.globalCompositeOperation = "source-over";
}

/* =========================================================
   3. Bucle con control de rendimiento
   ========================================================= */

let ultimo = performance.now();
let acumFPS = 0, muestras = 0, yaBajado = false;
let corriendo = true;

function frame(ahora) {
  if (!corriendo) return;
  const dt = Math.min((ahora - ultimo) / 1000, .05);
  ultimo = ahora;

  // si el equipo va justo, bajamos la densidad una sola vez
  if (!yaBajado && dt > 0) {
    acumFPS += 1 / dt;
    if (++muestras === 120) {
      if (acumFPS / muestras < 42) {
        calidad = .55;
        yaBajado = true;
        crearEstrellas();
        crearCorazon();
        objetos.length = Math.min(objetos.length, limite());
      }
      muestras = 0;
      acumFPS = 0;
    }
  }

  ctx.fillStyle = "#05060a";
  ctx.fillRect(0, 0, W, H);

  pintarEstrellas(ahora);
  pintarFondo(ahora);
  pintarVortice(ahora);
  moverObjetos(dt);
  pintarCorazon(ahora, dt);
  pintarObjetos();

  requestAnimationFrame(frame);
}

// en segundo plano no gastamos batería
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    corriendo = false;
  } else if (!corriendo) {
    corriendo = true;
    ultimo = performance.now();
    requestAnimationFrame(frame);
  }
});

window.addEventListener("resize", () => {
  clearTimeout(window.__rz);
  window.__rz = setTimeout(resize, 150);
});

resize();
requestAnimationFrame(frame);

/* =========================================================
   4. La carta
   ========================================================= */

function abrir(m) { m.classList.add("open"); }
function cerrar(m) { m.classList.remove("open"); }

openLetter.addEventListener("click", () => abrir(modal));
closeLetter.addEventListener("click", () => cerrar(modal));
modal.addEventListener("click", (e) => { if (e.target === modal) cerrar(modal); });

canvas.addEventListener("click", (e) => {
  const dx = e.clientX - zonaCorazon.x;
  const dy = e.clientY - zonaCorazon.y;
  if (Math.hypot(dx, dy) < zonaCorazon.r) abrir(modal);
});

/* =========================================================
   5. Galería de recuerdos
   ========================================================= */

const photoModal = document.getElementById("photoModal");
const photoImg = document.getElementById("photoImg");
const photoCaption = document.getElementById("photoCaption");
const photoCount = document.getElementById("photoCount");
const botones = [...document.querySelectorAll(".recuerdo")];

const recuerdos = botones.map((b) => ({
  foto: b.dataset.foto,
  texto: b.dataset.texto
}));
let actual = 0;

// precarga para que la foto aparezca al instante
for (const r of recuerdos) { const i = new Image(); i.src = r.foto; }

function mostrar(i) {
  actual = (i + recuerdos.length) % recuerdos.length;
  photoImg.src = recuerdos[actual].foto;
  photoCaption.textContent = recuerdos[actual].texto;
  photoCount.textContent = (actual + 1) + " / " + recuerdos.length;
  abrir(photoModal);
}

botones.forEach((b, i) => b.addEventListener("click", () => mostrar(i)));

document.getElementById("closePhoto").addEventListener("click", () => cerrar(photoModal));
document.getElementById("prevPhoto").addEventListener("click", () => mostrar(actual - 1));
document.getElementById("nextPhoto").addEventListener("click", () => mostrar(actual + 1));
photoModal.addEventListener("click", (e) => { if (e.target === photoModal) cerrar(photoModal); });

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { cerrar(modal); cerrar(photoModal); }
  if (!photoModal.classList.contains("open")) return;
  if (e.key === "ArrowRight") mostrar(actual + 1);
  if (e.key === "ArrowLeft") mostrar(actual - 1);
});

/* =========================================================
   6. Música
   ========================================================= */

musicButton.addEventListener("click", async () => {
  try {
    if (music.paused) {
      await music.play();
      musicButton.textContent = "❚❚ Pausar";
    } else {
      music.pause();
      musicButton.textContent = "♫ Disco Eterno";
    }
  } catch {
    musicButton.textContent = "No encuentro disco-eterno.mp4";
  }
});

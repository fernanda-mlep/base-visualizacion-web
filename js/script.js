/* =========================================================
   BASE DE DATOS PARA RELLENAR CON TABLAS DE INVESTIGACIÓN
   ========================================================= */
const DATOS_MODELO = {
  // 1. ~45 encuestados: reemplaza o agrega filas { id, x, y, tramo, edad }
  encuestados: Array.from({ length: 45 }, (_, i) => ({
    id: i + 1,
    x: 45 + ((i * 53) % 590),
    y: 42 + ((i * 29) % 136)
  })),

  // 3. ~10 paraderos: tipo -> 'micro' | 'colectivo' | 'taxi' | 'ascensor'
  paraderos: [
    { tipo: "ascensor", nombre: "Ascensor Cordillera", x: 365, y: 24 },
    { tipo: "micro", nombre: "Errázuriz / Sotomayor", x: 225, y: 186 },
    { tipo: "micro", nombre: "Errázuriz / Urriola", x: 65, y: 188 },
    { tipo: "micro", nombre: "Errázuriz / Clave", x: 515, y: 192 },
    { tipo: "colectivo", nombre: "Blanco / Sotomayor", x: 245, y: 132 },
    { tipo: "colectivo", nombre: "Blanco / Almte. Muñoz", x: 375, y: 138 },
    { tipo: "colectivo", nombre: "Cochrane / Echaurren", x: 525, y: 84 },
    { tipo: "taxi", nombre: "Plaza Sotomayor", x: 205, y: 98 },
    { tipo: "taxi", nombre: "Plaza Echaurren", x: 540, y: 58 },
    { tipo: "micro", nombre: "Bustamante / Márquez", x: 635, y: 72 }
  ],

  // 4. Dimensiones perceptivas (votaciones 1 a 5 por sector)
  percepcion: [
    { x: 35, y: 40, w: 150, h: 135, voto: 2 },
    { x: 195, y: 35, w: 165, h: 140, voto: 5 },
    { x: 375, y: 38, w: 135, h: 145, voto: 3 },
    { x: 515, y: 35, w: 135, h: 150, voto: 4 }
  ],

  // 5. Espacios de descanso/ocio (amarillo - editable posteriormente)
  descanso: [
    { nombre: "Plaza Echaurren", x: 516, y: 39, w: 46, h: 38, rx: 6 },
    { nombre: "Plaza Sotomayor", x: 204, y: 78, w: 44, h: 46, rx: 6 }
  ]
};

document.addEventListener("DOMContentLoaded", () => {
  iniciarParallax();
  iniciarModelo3D();
});

/* =========================================================
   SECCIÓN 2: PARALLAX CON COLISIÓN ESPONJOSA
   ========================================================= */
function iniciarParallax() {
  const escenario = document.getElementById("escenario-parallax");
  if (!escenario) return;

  const palabras = ["tránsito", "personas mayores", "barrio", "comunidad", "pertenencia", "seguridad", "identidad"];
  const MARGEN = 14;

  const nodos = palabras.map((texto, i) => {
    const el = document.createElement("div");
    el.className = "palabra-esponjosa";
    el.textContent = texto;
    escenario.appendChild(el);
    const { width, height } = escenario.getBoundingClientRect();

    return {
      el,
      x: Math.min(Math.max(30, (width / 3) * (i % 3) + 40), width - el.offsetWidth - 30),
      y: Math.min(Math.max(30, (height / 3) * Math.floor(i / 3) + 45), height - el.offsetHeight - 30),
      vx: 0,
      vy: 0,
      w: el.offsetWidth,
      h: el.offsetHeight,
      factor: (i % 2 === 0 ? 1 : -1) * (0.18 + i * 0.04)
    };
  });

  let activa = false;
  let ultimoScroll = window.scrollY;
  let frameId = null;

  new IntersectionObserver((entries) => {
    activa = entries[0].isIntersecting;
    if (activa && !frameId) {
      ultimoScroll = window.scrollY;
      animar();
    } else if (!activa && frameId) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  }, { threshold: 0.1 }).observe(escenario);

  window.addEventListener("scroll", () => {
    if (!activa) return;
    const delta = window.scrollY - ultimoScroll;
    ultimoScroll = window.scrollY;
    nodos.forEach((n, i) => {
      n.vy += delta * n.factor * 0.35;
      n.vx += Math.sin(i + ultimoScroll * 0.01) * Math.abs(delta) * 0.03;
    });
  }, { passive: true });

  function animar() {
    if (!activa) return;
    const { width: maxW, height: maxH } = escenario.getBoundingClientRect();

    nodos.forEach((n) => {
      n.w = n.el.offsetWidth;
      n.h = n.el.offsetHeight;
      n.x += n.vx;
      n.y += n.vy;
      n.vx *= 0.9;
      n.vy *= 0.9;

      if (n.x < MARGEN) { n.x = MARGEN; n.vx *= -0.65; }
      else if (n.x + n.w > maxW - MARGEN) { n.x = maxW - n.w - MARGEN; n.vx *= -0.65; }

      if (n.y < MARGEN) { n.y = MARGEN; n.vy *= -0.65; }
      else if (n.y + n.h > maxH - MARGEN) { n.y = maxH - n.h - MARGEN; n.vy *= -0.65; }
    });

    for (let i = 0; i < nodos.length; i++) {
      for (let j = i + 1; j < nodos.length; j++) {
        const a = nodos[i], b = nodos[j];
        const dx = (b.x + b.w / 2) - (a.x + a.w / 2);
        const dy = (b.y + b.h / 2) - (a.y + a.h / 2);
        const ox = (a.w + b.w) / 2 + MARGEN - Math.abs(dx);
        const oy = (a.h + b.h) / 2 + MARGEN - Math.abs(dy);

        if (ox > 0 && oy > 0) {
          if (ox < oy) {
            const e = (dx >= 0 ? 1 : -1) * ox * 0.5;
            a.x -= e; b.x += e; a.vx -= e * 0.25; b.vx += e * 0.25;
          } else {
            const e = (dy >= 0 ? 1 : -1) * oy * 0.5;
            a.y -= e; b.y += e; a.vy -= e * 0.25; b.vy += e * 0.25;
          }
        }
      }
    }

    nodos.forEach((n) => {
      n.el.style.transform = `translate3d(${n.x.toFixed(1)}px, ${n.y.toFixed(1)}px, 0)`;
    });
    frameId = requestAnimationFrame(animar);
  }
}

/* =========================================================
   SECCIÓN 4: MODELO VISUAL 3D INTERACTIVO DE 5 CAPAS
   ========================================================= */
function iniciarModelo3D() {
  const visor = document.getElementById("visor-3d");
  const pila = document.getElementById("pila-3d");
  const lista = document.getElementById("lista-capas");
  const btnReset = document.getElementById("btn-reset");
  if (!visor || !pila || !lista) return;

  // Silueta exacta del área estudiada (Urriola -> Márquez / Serrano -> Errázuriz)
  const SILUETA_MAPA = "M 18,46 Q 110,36 185,24 L 255,34 L 385,36 L 560,28 L 664,46 L 656,192 L 500,188 L 365,176 L 195,172 L 26,188 Z";

  const capas = [
    { id: 1, nombre: "1. Personas encuestadas (45)", visible: true, render: renderEncuestados },
    { id: 2, nombre: "2. Calles y cuadras", visible: true, render: renderMapa },
    { id: 3, nombre: "3. Locomoción colectiva (10)", visible: true, render: renderParaderos },
    { id: 4, nombre: "4. Dimensiones perceptivas (1-5)", visible: true, render: renderPercepcion },
    { id: 5, nombre: "5. Descanso / Plaza Echaurren", visible: true, render: renderDescanso }
  ];

  // Crear DOM de cada capa con la misma área y forma
  capas.forEach((capa) => {
    const div = document.createElement("div");
    div.className = "capa-3d";
    div.dataset.id = capa.id;
    div.innerHTML = `
      <svg viewBox="0 0 680 220" preserveAspectRatio="none">
        <defs>
          <clipPath id="clip-barrio-${capa.id}">
            <path d="${SILUETA_MAPA}" />
          </clipPath>
          <pattern id="trama-baja" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.2" fill="#244c66" fill-opacity="0.35" />
          </pattern>
          <pattern id="trama-media" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#244c66" stroke-width="1.5" stroke-opacity="0.4" />
          </pattern>
          <pattern id="trama-alta" width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M 0 3 L 6 3 M 3 0 L 3 6" stroke="#1e2124" stroke-width="1.2" stroke-opacity="0.45" />
          </pattern>
        </defs>
        <path d="${SILUETA_MAPA}" fill="rgba(255, 252, 243, 0.52)" stroke="#1e2124" stroke-width="1.5" />
        <g clip-path="url(#clip-barrio-${capa.id})">
          ${capa.render()}
        </g>
      </svg>`;
    pila.appendChild(div);
    capa.el = div;
  });

  // Renderizadores por capa
  function renderEncuestados() {
    return DATOS_MODELO.encuestados
      .map((p) => `<circle class="nodo-persona" cx="${p.x}" cy="${p.y}" r="4.2" fill="#1e2124" fill-opacity="0.88" />`)
      .join("");
  }

  function renderMapa() {
    // Calles en tono claro y cuadras de edificios diferenciadas
    const cuadras = [
      "30,52 108,44 114,76 34,84",
      "118,43 188,33 192,72 124,75",
      "30,94 116,86 120,124 34,132",
      "126,85 192,80 194,120 128,123",
      "34,142 121,134 126,174 38,180",
      "130,133 194,130 194,166 134,173",
      // Sector Sotomayor (3 bloques centrales)
      "204,40 248,43 248,70 204,70",
      "204,78 248,78 248,124 204,124",
      "204,132 248,132 248,165 204,165",
      // Tramo Sotomayor - Almte. Muñoz
      "260,44 366,46 364,76 260,72",
      "260,84 364,86 362,124 260,122",
      "260,132 362,134 360,168 260,165",
      // Tramo Almte. Muñoz - Clave - Márquez
      "376,46 446,45 446,82 376,84",
      "456,45 506,43 506,80 456,82",
      "516,41 562,38 562,77 516,79",
      "572,38 614,42 612,78 572,77",
      "622,44 654,50 650,82 620,79",
      "374,94 422,93 422,130 374,130",
      "432,93 506,90 506,128 432,129",
      "516,89 558,88 558,127 516,128",
      "568,88 610,89 608,128 568,127",
      "618,90 650,94 648,130 616,128",
      "372,140 422,140 422,174 372,170",
      "432,140 506,138 506,178 432,175",
      "516,138 558,138 558,180 516,178",
      "568,138 646,142 644,184 568,180"
    ];

    const fondoCalles = `<path d="${SILUETA_MAPA}" fill="rgba(216, 211, 197, 0.35)" />`;
    const edificios = cuadras
      .map((pts) => `<polygon points="${pts}" fill="rgba(36, 76, 102, 0.22)" stroke="#1e2124" stroke-width="1.1" />`)
      .join("");
    return fondoCalles + edificios;
  }

  function renderParaderos() {
    const estilos = {
      micro: { color: "#1e2124", r: 5 },
      colectivo: { color: "#244c66", r: 4.5 },
      taxi: { color: "#c85a32", r: 4 },
      ascensor: { color: "#7a3e65", r: 6 }
    };
    return DATOS_MODELO.paraderos.map((p) => {
      const st = estilos[p.tipo] || estilos.micro;
      return `<g transform="translate(${p.x},${p.y})">
        <circle r="${st.r + 3}" fill="none" stroke="${st.color}" stroke-width="1" stroke-opacity="0.5" />
        <circle r="${st.r}" fill="${st.color}" />
      </g>`;
    }).join("");
  }

  function renderPercepcion() {
    return DATOS_MODELO.percepcion.map((z) => {
      const patron = z.voto <= 2 ? "trama-baja" : z.voto === 3 ? "trama-media" : "trama-alta";
      return `<rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="12" fill="url(#${patron})" stroke="#244c66" stroke-opacity="0.3" />`;
    }).join("");
  }

  function renderDescanso() {
    return DATOS_MODELO.descanso.map((d) =>
      `<rect x="${d.x}" y="${d.y}" width="${d.w}" height="${d.h}" rx="${d.rx}" fill="#f6c945" fill-opacity="0.72" stroke="#1e2124" stroke-width="1.2" />`
    ).join("");
  }

  // Posicionamiento Z en 3D según el orden actual del arreglo `capas`
  function actualizarOrden3D() {
    const separacionZ = 52;
    const total = capas.length;
    capas.forEach((capa, idx) => {
      const z = ((total - 1) / 2 - idx) * separacionZ;
      capa.el.style.transform = `translateZ(${z}px)`;
      capa.el.classList.toggle("oculta", !capa.visible);
    });
    renderListaUI();
  }

  // Interfaz para reordenar capas (ej: 1,2,3,4,5 -> 5,3,2,1,4)
  function renderListaUI() {
    lista.innerHTML = "";
    capas.forEach((capa, idx) => {
      const li = document.createElement("li");
      li.className = `item-capa ${capa.visible ? "" : "oculta"}`;
      li.draggable = true;
      li.innerHTML = `
        <span>${capa.nombre}</span>
        <div class="capa-acciones">
          <button type="button" data-dir="-1" title="Subir nivel">↑</button>
          <button type="button" data-dir="1" title="Bajar nivel">↓</button>
          <button type="button" data-toggle="1" title="Mostrar/Ocultar">${capa.visible ? "●" : "○"}</button>
        </div>`;

      li.querySelector('[data-dir="-1"]').onclick = () => moverCapa(idx, idx - 1);
      li.querySelector('[data-dir="1"]').onclick = () => moverCapa(idx, idx + 1);
      li.querySelector('[data-toggle="1"]').onclick = () => {
        capa.visible = !capa.visible;
        actualizarOrden3D();
      };

      li.ondragstart = (e) => e.dataTransfer.setData("text/plain", idx);
      li.ondragover = (e) => e.preventDefault();
      li.ondrop = (e) => {
        e.preventDefault();
        const origen = Number(e.dataTransfer.getData("text/plain"));
        moverCapa(origen, idx);
      };

      lista.appendChild(li);
    });
  }

  function moverCapa(desde, hacia) {
    if (hacia < 0 || hacia >= capas.length || desde === hacia) return;
    const [item] = capas.splice(desde, 1);
    capas.splice(hacia, 0, item);
    actualizarOrden3D();
  }

  // Control 3D (rotación 360° + zoom + sensibilidad sutil al cursor en capa 1)
  let rotX = 52, rotZ = -18, zoom = 1;
  let arrastrando = false, prevX = 0, prevY = 0;

  function aplicarCamara() {
    pila.style.transform = `scale(${zoom}) rotateX(${rotX}deg) rotateZ(${rotZ}deg)`;
  }

  visor.addEventListener("pointerdown", (e) => {
    arrastrando = true;
    prevX = e.clientX;
    prevY = e.clientY;
    visor.setPointerCapture(e.pointerId);
  });

  visor.addEventListener("pointermove", (e) => {
    const rect = visor.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

    // Sensibilidad ligera de los 45 puntos al cursor
    pila.querySelectorAll(".nodo-persona").forEach((nodo, i) => {
      const factor = (i % 3 + 1) * 2.2;
      nodo.style.transform = `translate(${(nx * factor).toFixed(1)}px, ${(ny * factor).toFixed(1)}px)`;
    });

    if (!arrastrando) return;
    rotZ += (e.clientX - prevX) * 0.45;
    rotX = Math.max(0, Math.min(85, rotX - (e.clientY - prevY) * 0.45));
    prevX = e.clientX;
    prevY = e.clientY;
    aplicarCamara();
  });

  visor.addEventListener("pointerup", () => { arrastrando = false; });

  visor.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoom = Math.max(0.55, Math.min(2.2, zoom - e.deltaY * 0.001));
    aplicarCamara();
  }, { passive: false });

  if (btnReset) {
    btnReset.onclick = () => {
      rotX = 52; rotZ = -18; zoom = 1;
      aplicarCamara();
    };
  }

  actualizarOrden3D();
  aplicarCamara();
}
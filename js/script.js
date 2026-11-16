document.addEventListener("DOMContentLoaded", () => {
  const escenario = document.getElementById("escenario-parallax");
  if (!escenario) return;

  const palabrasTexto = [
    "tránsito",
    "personas mayores",
    "barrio",
    "comunidad",
    "pertenencia",
    "seguridad",
    "identidad"
  ];

  // Margen extra que simula el grosor del contorno "esponjoso" para las colisiones
  const MARGEN_ESPONJOSO = 14;
  const nodos = [];

  // 1. Crear elementos DOM y asignarles posiciones y profundidades (parallax) iniciales
  palabrasTexto.forEach((texto, index) => {
    const el = document.createElement("div");
    el.className = "palabra-esponjosa";
    el.textContent = texto;
    escenario.appendChild(el);

    const rect = escenario.getBoundingClientRect();
    const elWidth = el.offsetWidth;
    const elHeight = el.offsetHeight;

    // Distribución inicial repartida en el contenedor
    const cols = 3;
    const col = index % cols;
    const row = Math.floor(index / cols);

    const x = Math.min(
      Math.max(30, (rect.width / cols) * col + 40),
      rect.width - elWidth - 30
    );
    const y = Math.min(
      Math.max(30, (rect.height / 3) * row + 45),
      rect.height - elHeight - 30
    );

    nodos.push({
      el,
      x,
      y,
      vx: 0,
      vy: 0,
      w: elWidth,
      h: elHeight,
      // Factor parallax distinto por palabra (unas reaccionan más rápido al scroll)
      factorScroll: (index % 2 === 0 ? 1 : -1) * (0.18 + (index * 0.04))
    });
  });

  // 2. Controlar que la física y el parallax SOLO ocurran mientras la sección es visible
  let seccionActiva = false;
  let ultimoScrollY = window.scrollY;
  let animacionId = null;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        seccionActiva = entry.isIntersecting;
        if (seccionActiva && !animacionId) {
          ultimoScrollY = window.scrollY;
          actualizarFisica();
        } else if (!seccionActiva && animacionId) {
          cancelAnimationFrame(animacionId);
          animacionId = null;
        }
      });
    },
    { threshold: 0.1 }
  );

  observer.observe(escenario);

  // 3. Impulso impulsado exclusivamente por el evento scroll dentro de la sección
  window.addEventListener("scroll", () => {
    if (!seccionActiva) return;

    const scrollActual = window.scrollY;
    const deltaScroll = scrollActual - ultimoScrollY;
    ultimoScrollY = scrollActual;

    nodos.forEach((nodo, i) => {
      // Impulso vertical diferencial (efecto parallax) + ligero empuje lateral
      nodo.vy += deltaScroll * nodo.factorScroll * 0.35;
      nodo.vx += Math.sin(i + scrollActual * 0.01) * Math.abs(deltaScroll) * 0.03;
    });
  }, { passive: true });

  // 4. Bucle de colisiones esponjosas y amortiguación
  function actualizarFisica() {
    if (!seccionActiva) return;

    const limites = escenario.getBoundingClientRect();
    const maxW = limites.width;
    const maxH = limites.height;

    // Actualizar dimensiones reales por si cambió el ancho de ventana
    nodos.forEach((n) => {
      n.w = n.el.offsetWidth;
      n.h = n.el.offsetHeight;

      // Aplicar velocidad y fricción suave (sensación flotante)
      n.x += n.vx;
      n.y += n.vy;
      n.vx *= 0.90;
      n.vy *= 0.90;

      // Rebote suave contra los bordes del recuadro
      if (n.x < MARGEN_ESPONJOSO) {
        n.x = MARGEN_ESPONJOSO;
        n.vx *= -0.65;
      } else if (n.x + n.w > maxW - MARGEN_ESPONJOSO) {
        n.x = maxW - n.w - MARGEN_ESPONJOSO;
        n.vx *= -0.65;
      }

      if (n.y < MARGEN_ESPONJOSO) {
        n.y = MARGEN_ESPONJOSO;
        n.vy *= -0.65;
      } else if (n.y + n.h > maxH - MARGEN_ESPONJOSO) {
        n.y = maxH - n.h - MARGEN_ESPONJOSO;
        n.vy *= -0.65;
      }
    });

    // Detección de colisión entre pares de palabras (cajas redondeadas + margen esponjoso)
    for (let i = 0; i < nodos.length; i++) {
      for (let j = i + 1; j < nodos.length; j++) {
        const a = nodos[i];
        const b = nodos[j];

        const centroAX = a.x + a.w / 2;
        const centroAY = a.y + a.h / 2;
        const centroBX = b.x + b.w / 2;
        const centroBY = b.y + b.h / 2;

        const dx = centroBX - centroAX;
        const dy = centroBY - centroAY;

        const minDistX = (a.w + b.w) / 2 + MARGEN_ESPONJOSO;
        const minDistY = (a.h + b.h) / 2 + MARGEN_ESPONJOSO;

        const overlapX = minDistX - Math.abs(dx);
        const overlapY = minDistY - Math.abs(dy);

        // Si los contornos esponjosos se tocan, se repelen suavemente
        if (overlapX > 0 && overlapY > 0) {
          const elasticidad = 0.25;

          if (overlapX < overlapY) {
            const empujeX = (dx >= 0 ? 1 : -1) * (overlapX * 0.5);
            a.x -= empujeX;
            b.x += empujeX;
            a.vx -= empujeX * elasticidad;
            b.vx += empujeX * elasticidad;
          } else {
            const empujeY = (dy >= 0 ? 1 : -1) * (overlapY * 0.5);
            a.y -= empujeY;
            b.y += empujeY;
            a.vy -= empujeY * elasticidad;
            b.vy += empujeY * elasticidad;
          }
        }
      }
    }

    // Dibujar posiciones finales
    nodos.forEach((n) => {
      n.el.style.transform = `translate3d(${n.x.toFixed(1)}px, ${n.y.toFixed(1)}px, 0)`;
    });

    animacionId = requestAnimationFrame(actualizarFisica);
  }
});
/**
 * BENYAMIN NAMTALASHVILI — INTERACTIVE FOOTER DOT GRID & CONSTELLATION CANVAS
 * Features:
 * - Interactive dot matrix responding to cursor physics
 * - Proximity glow + subtle elastic spring displacement
 * - Automatic IntersectionObserver performance optimization (0% CPU when off-screen)
 */

(function () {
  'use strict';

  function initFooterInteractiveCanvas() {
    const footers = document.querySelectorAll('.designer-footer');
    if (!footers || footers.length === 0) return;

    footers.forEach(footer => {
      // Create canvas if not present
      let canvas = footer.querySelector('.footer-grid-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'footer-grid-canvas';
        footer.insertBefore(canvas, footer.firstChild);
      }

      const ctx = canvas.getContext('2d');
      let animationFrameId = null;
      let isVisible = false;
      let width = 0;
      let height = 0;
      let dots = [];

      let footerRect = { left: 0, top: 0, width: 0, height: 0 };
      let isRunning = false;

      const GRID_SPACING = 28;
      const HOVER_RADIUS = 130;
      const HOVER_RADIUS_SQ = HOVER_RADIUS * HOVER_RADIUS;
      const LINE_RADIUS = HOVER_RADIUS * 0.65;
      const LINE_RADIUS_SQ = LINE_RADIUS * LINE_RADIUS;
      const MAX_LINE_DIST_SQ = (GRID_SPACING * 1.5) * (GRID_SPACING * 1.5);
      const MAX_DISPLACEMENT = 14;

      const mouse = {
        x: -9999,
        y: -9999,
        active: false
      };

      function updateFooterRect() {
        const r = footer.getBoundingClientRect();
        footerRect.left = r.left + window.scrollX;
        footerRect.top = r.top + window.scrollY;
        footerRect.width = r.width;
        footerRect.height = r.height;
      }

      function resize() {
        const rect = footer.getBoundingClientRect();
        footerRect.left = rect.left + window.scrollX;
        footerRect.top = rect.top + window.scrollY;
        footerRect.width = rect.width;
        footerRect.height = rect.height;

        const dpr = window.devicePixelRatio || 1;
        width = canvas.width = Math.round(rect.width * dpr);
        height = canvas.height = Math.round(rect.height * dpr);
        ctx.resetTransform ? ctx.resetTransform() : ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        initDots(rect.width, rect.height);
        requestFrame();
      }

      function initDots(w, h) {
        dots = [];
        const cols = Math.ceil(w / GRID_SPACING);
        const rows = Math.ceil(h / GRID_SPACING);

        for (let r = 0; r <= rows; r++) {
          for (let c = 0; c <= cols; c++) {
            const originX = c * GRID_SPACING;
            const originY = r * GRID_SPACING;
            dots.push({
              originX,
              originY,
              x: originX,
              y: originY,
              baseAlpha: 0.12,
              alpha: 0.12,
              radius: 1.1
            });
          }
        }
      }

      function requestFrame() {
        if (isVisible && !isRunning) {
          isRunning = true;
          animationFrameId = requestAnimationFrame(render);
        }
      }

      footer.addEventListener('mouseenter', () => {
        updateFooterRect();
      });

      footer.addEventListener('mousemove', (e) => {
        mouse.x = e.pageX - footerRect.left;
        mouse.y = e.pageY - footerRect.top;
        mouse.active = true;
        requestFrame();
      }, { passive: true });

      footer.addEventListener('mouseleave', () => {
        mouse.active = false;
        mouse.x = -9999;
        mouse.y = -9999;
        requestFrame();
      });

      function render() {
        if (!isVisible) {
          isRunning = false;
          return;
        }

        ctx.clearRect(0, 0, footerRect.width, footerRect.height);

        let needsAnother = mouse.active;
        const hoveredDots = [];
        const activeNearDots = [];

        // Batch 1: Static / resting dots in a single path
        ctx.beginPath();
        for (let i = 0; i < dots.length; i++) {
          const d = dots[i];

          const dx = mouse.x - d.originX;
          const dy = mouse.y - d.originY;
          const distSq = dx * dx + dy * dy;

          let targetX = d.originX;
          let targetY = d.originY;
          let targetAlpha = d.baseAlpha;
          let targetRadius = 1.1;

          if (mouse.active && distSq < HOVER_RADIUS_SQ) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / HOVER_RADIUS);
            const angle = Math.atan2(dy, dx);

            targetX = d.originX - Math.cos(angle) * (force * MAX_DISPLACEMENT);
            targetY = d.originY - Math.sin(angle) * (force * MAX_DISPLACEMENT);
            targetAlpha = d.baseAlpha + force * 0.85;
            targetRadius = 1.1 + force * 1.8;

            hoveredDots.push(d);
            if (distSq < LINE_RADIUS_SQ) {
              activeNearDots.push({ dot: d, distSq });
            }
          }

          // Spring physics easing
          const diffX = targetX - d.x;
          const diffY = targetY - d.y;
          const diffA = targetAlpha - d.alpha;

          if (Math.abs(diffX) > 0.05 || Math.abs(diffY) > 0.05 || Math.abs(diffA) > 0.01) {
            d.x += diffX * 0.15;
            d.y += diffY * 0.15;
            d.alpha += diffA * 0.18;
            needsAnother = true;
          } else {
            d.x = targetX;
            d.y = targetY;
            d.alpha = targetAlpha;
          }

          // If not currently hovered, batch into base path
          if (!mouse.active || distSq >= HOVER_RADIUS_SQ) {
            ctx.moveTo(d.x + d.radius, d.y);
            ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
          }
        }
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.shadowBlur = 0;
        ctx.fill();

        // Batch 2: Hovered dots with amber visionOS specular glow
        if (hoveredDots.length > 0) {
          for (let k = 0; k < hoveredDots.length; k++) {
            const hd = hoveredDots[k];
            ctx.beginPath();
            ctx.arc(hd.x, hd.y, hd.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 107, 0, ${hd.alpha})`;
            ctx.shadowColor = "rgba(255, 107, 0, 0.6)";
            ctx.shadowBlur = 8;
            ctx.fill();
          }
        }

        // Batch 3: Subtle connection lines (O(K^2) where K is only the few near-cursor dots)
        if (activeNearDots.length > 1) {
          ctx.shadowBlur = 0;
          for (let i = 0; i < activeNearDots.length; i++) {
            const item1 = activeNearDots[i];
            const d1 = item1.dot;
            const dist1 = Math.sqrt(item1.distSq);
            for (let j = i + 1; j < activeNearDots.length; j++) {
              const d2 = activeNearDots[j].dot;
              const ldx = d1.x - d2.x;
              const ldy = d1.y - d2.y;
              const ldistSq = ldx * ldx + ldy * ldy;
              if (ldistSq <= MAX_LINE_DIST_SQ) {
                ctx.beginPath();
                ctx.moveTo(d1.x, d1.y);
                ctx.lineTo(d2.x, d2.y);
                const lineAlpha = (1 - dist1 / LINE_RADIUS) * 0.25;
                ctx.strokeStyle = `rgba(255, 107, 0, ${lineAlpha})`;
                ctx.lineWidth = 0.75;
                ctx.stroke();
              }
            }
          }
        }

        if (needsAnother) {
          animationFrameId = requestAnimationFrame(render);
        } else {
          isRunning = false;
        }
      }

      // Observer to only animate when in view
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            isVisible = true;
            resize();
            requestFrame();
          } else {
            isVisible = false;
            isRunning = false;
            cancelAnimationFrame(animationFrameId);
          }
        });
      }, { threshold: 0.05 });

      observer.observe(footer);
      window.addEventListener('resize', resize, { passive: true });
      resize();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFooterInteractiveCanvas);
  } else {
    initFooterInteractiveCanvas();
  }
})();

/**
 * BENYAMIN NAMTALASHVILI — INTERACTIVE PHYSICS CTA ENGINE (MATTER.JS)
 * Ultra-Responsive Direct Grab, Drag, and Fling Physics System
 */

(function () {
  'use strict';

  function initPhysicsCTA() {
    const container = document.getElementById('ctaPhysicsContainer');
    const canvas = document.getElementById('physicsCanvas');
    if (!container || !canvas || typeof Matter === 'undefined') return;

    const {
      Engine,
      Runner,
      Bodies,
      Composite,
      Query,
      Body,
      Vector
    } = Matter;

    let engine, runner;
    let pillBodies = [];
    let walls = [];
    let draggedBody = null;
    let dragOffset = { x: 0, y: 0 };
    let recentPositions = [];

    // Expanded interactive tags & icon squircles for CTA physics sandbox
    const itemConfigs = [
      // Major Skill Capsules
      { text: '⚡ n8n AI Agents', color: '#FF6B00', w: 165, h: 46, type: 'pill', angle: 0.15 },
      { text: '🎨 Design Systems', color: '#FF2D55', w: 165, h: 46, type: 'pill', angle: -0.12 },
      { text: '✨ GSAP 60fps', color: '#FF9500', w: 150, h: 46, type: 'pill', angle: 0.2 },
      { text: '💻 Full-Stack Web', color: '#00C7BE', w: 160, h: 46, type: 'pill', angle: -0.18 },
      { text: '🚀 SaaS Platforms', color: '#34C759', w: 160, h: 46, type: 'pill', angle: 0.1 },
      { text: '🧠 Autonomous AI', color: '#BF5AF2', w: 165, h: 46, type: 'pill', angle: -0.22 },
      { text: '📱 Web & Mobile UI', color: '#FFD60A', w: 165, h: 46, type: 'pill', angle: 0.08 },
      { text: '📦 3D Packaging', color: '#FF375F', w: 150, h: 46, type: 'pill', angle: -0.14 },
      { text: '🔥 Brand Strategy', color: '#5E5CE6', w: 160, h: 46, type: 'pill', angle: 0.25 },
      { text: '🎬 Motion Video', color: '#30D158', w: 145, h: 46, type: 'pill', angle: -0.09 },
      { text: '🌐 Next.js & Vite', color: '#2997FF', w: 155, h: 46, type: 'pill', angle: 0.14 },
      { text: '⚡ Sub-50ms APIs', color: '#FF9F0A', w: 160, h: 46, type: 'pill', angle: -0.16 },

      // Interactive Icon Squircles / Badges
      { icon: '⚡', color: '#FF6B00', w: 50, h: 50, type: 'squircle', angle: 0.3 },
      { icon: '🎨', color: '#FF2D55', w: 50, h: 50, type: 'squircle', angle: -0.2 },
      { icon: '🧠', color: '#BF5AF2', w: 50, h: 50, type: 'squircle', angle: 0.15 },
      { icon: '🚀', color: '#34C759', w: 50, h: 50, type: 'squircle', angle: -0.3 },
      { icon: '💻', color: '#00C7BE', w: 50, h: 50, type: 'squircle', angle: 0.25 },
      { icon: '✦', color: '#FFD60A', w: 50, h: 50, type: 'squircle', angle: -0.15 }
    ];

    function setupEngine() {
      // Clean up previous run
      if (runner) Runner.stop(runner);
      if (engine) Composite.clear(engine.world, false);
      draggedBody = null;

      const width = container.clientWidth;
      const height = container.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      canvas.style.touchAction = 'none';

      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      // Create engine with weightless space gravity
      engine = Engine.create({
        gravity: { x: 0, y: 0.015, scale: 0.001 }
      });

      // Rigid boundary walls around CTA card
      const wallThick = 80;
      walls = [
        // Top
        Bodies.rectangle(width / 2, -wallThick / 2, width * 3, wallThick, { isStatic: true, restitution: 0.96 }),
        // Bottom
        Bodies.rectangle(width / 2, height + wallThick / 2, width * 3, wallThick, { isStatic: true, restitution: 0.96 }),
        // Left
        Bodies.rectangle(-wallThick / 2, height / 2, wallThick, height * 3, { isStatic: true, restitution: 0.96 }),
        // Right
        Bodies.rectangle(width + wallThick / 2, height / 2, wallThick, height * 3, { isStatic: true, restitution: 0.96 })
      ];
      Composite.add(engine.world, walls);

      // Scale pills dynamically for responsive screens
      const scaleFactor = width < 600 ? 0.72 : (width < 900 ? 0.85 : 0.95);

      // Generate physics pill and icon bodies
      pillBodies = itemConfigs.map((cfg, idx) => {
        const w = cfg.w * scaleFactor;
        const h = cfg.h * scaleFactor;
        const radius = cfg.type === 'pill' ? h / 2 : 14 * scaleFactor;

        // Distribute initial spawn positions nicely across canvas perimeter
        const col = idx % 4;
        const row = Math.floor(idx / 4);
        const posX = Math.max(w / 2 + 30, Math.min(width - w / 2 - 30, (col + 0.5) * (width / 4) + (Math.random() - 0.5) * 40));
        const posY = Math.max(h / 2 + 30, Math.min(height - h / 2 - 30, (row + 0.5) * (height / 5) + (Math.random() - 0.5) * 40));

        const body = Bodies.rectangle(posX, posY, w, h, {
          chamfer: { radius: radius },
          angle: cfg.angle + (Math.random() - 0.5) * 0.25,
          restitution: 0.94, // High bounciness
          frictionAir: 0.01, // Minimal air resistance for perpetual floating
          friction: 0.04,
          density: 0.001,
          render: { visible: false }
        });

        body.itemType = cfg.type;
        body.pillText = cfg.text || '';
        body.pillIcon = cfg.icon || '';
        body.pillColor = cfg.color;
        body.pillW = w;
        body.pillH = h;
        body.pillRadius = radius;
        body.isBeingDragged = false;

        // Initial float impulse
        const driftAngle = Math.random() * Math.PI * 2;
        const driftSpeed = 1.0 + Math.random() * 1.5;
        Body.setVelocity(body, {
          x: Math.cos(driftAngle) * driftSpeed,
          y: Math.sin(driftAngle) * driftSpeed
        });
        Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.03);

        return body;
      });

      Composite.add(engine.world, pillBodies);

      // Helper to calculate exact CSS pixel coordinates
      function getCanvasCoords(e) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
      }

      // Hover Cursor State
      canvas.addEventListener('pointermove', (e) => {
        if (draggedBody) return;
      });

      // Pointer Down (Grab)
      canvas.addEventListener('pointerdown', (e) => {
        const pt = getCanvasCoords(e);
        const hits = Query.point(pillBodies, pt);
        if (hits.length > 0) {
          draggedBody = hits[0];
          dragOffset = {
            x: draggedBody.position.x - pt.x,
            y: draggedBody.position.y - pt.y
          };
          recentPositions = [{ x: pt.x, y: pt.y, t: performance.now() }];
          draggedBody.isBeingDragged = true;
          try {
            canvas.setPointerCapture(e.pointerId);
          } catch (err) {}
          Body.setVelocity(draggedBody, { x: 0, y: 0 });
          Body.setAngularVelocity(draggedBody, 0);
        }
      });

      // Pointer Move (Drag)
      canvas.addEventListener('pointermove', (e) => {
        if (!draggedBody) return;
        const pt = getCanvasCoords(e);
        const now = performance.now();
        recentPositions.push({ x: pt.x, y: pt.y, t: now });
        if (recentPositions.length > 6) recentPositions.shift();

        const targetX = Math.max(draggedBody.pillW / 2, Math.min(width - draggedBody.pillW / 2, pt.x + dragOffset.x));
        const targetY = Math.max(draggedBody.pillH / 2, Math.min(height - draggedBody.pillH / 2, pt.y + dragOffset.y));

        const vx = (targetX - draggedBody.position.x) * 0.48;
        const vy = (targetY - draggedBody.position.y) * 0.48;

        Body.setPosition(draggedBody, { x: targetX, y: targetY });
        Body.setVelocity(draggedBody, { x: vx, y: vy });
      });

      // Pointer Up / Cancel (Throw / Release)
      function handlePointerUp(e) {
        if (!draggedBody) return;
        
        if (recentPositions.length >= 2) {
          const first = recentPositions[0];
          const last = recentPositions[recentPositions.length - 1];
          const dt = Math.max(16, last.t - first.t);
          const vx = ((last.x - first.x) / dt) * 20;
          const vy = ((last.y - first.y) / dt) * 20;
          const maxSpeed = 26;
          const speed = Math.hypot(vx, vy);
          const factor = speed > maxSpeed ? maxSpeed / speed : 1;
          Body.setVelocity(draggedBody, { x: vx * factor, y: vy * factor });
          Body.setAngularVelocity(draggedBody, vx * 0.009);
        }

        draggedBody.isBeingDragged = false;
        draggedBody = null;
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch (err) {}
      }

      canvas.addEventListener('pointerup', handlePointerUp);
      canvas.addEventListener('pointercancel', handlePointerUp);

      // Start Runner only if currently visible
      runner = Runner.create();
      if (isCtaVisible) {
        Runner.run(runner, engine);
      }

      // Render Loop
      function renderLoop() {
        ctx.clearRect(0, 0, width, height);

        pillBodies.forEach(body => {
          // Keep floating impulse alive if not dragged and speed is low
          if (!body.isBeingDragged) {
            const speed = Vector.magnitude(body.velocity);
            if (speed < 0.35) {
              const randAngle = Math.random() * Math.PI * 2;
              Body.applyForce(body, body.position, {
                x: Math.cos(randAngle) * 0.0003,
                y: Math.sin(randAngle) * 0.0003
              });
            }
          }

          ctx.save();
          ctx.translate(body.position.x, body.position.y);
          ctx.rotate(body.angle);

          const pw = body.pillW;
          const ph = body.pillH;
          const pr = body.pillRadius;

          // Tactile elevation on drag
          if (body.isBeingDragged) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 26;
            ctx.shadowOffsetY = 12;
            ctx.scale(1.1, 1.1);
          } else {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.42)';
            ctx.shadowBlur = 14;
            ctx.shadowOffsetY = 6;
          }

          // Draw capsule or squircle
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(-pw / 2, -ph / 2, pw, ph, pr);
          } else {
            ctx.moveTo(-pw / 2 + pr, -ph / 2);
            ctx.lineTo(pw / 2 - pr, -ph / 2);
            ctx.quadraticCurveTo(pw / 2, -ph / 2, pw / 2, -ph / 2 + pr);
            ctx.lineTo(pw / 2, ph / 2 - pr);
            ctx.quadraticCurveTo(pw / 2, ph / 2, pw / 2 - pr, ph / 2);
            ctx.lineTo(-pw / 2 + pr, ph / 2);
            ctx.quadraticCurveTo(-pw / 2, ph / 2, -pw / 2, ph / 2 - pr);
            ctx.lineTo(-pw / 2, -ph / 2 + pr);
            ctx.quadraticCurveTo(-pw / 2, -ph / 2, -pw / 2 + pr, -ph / 2);
          }
          ctx.fillStyle = body.pillColor;
          ctx.fill();

          // Specular highlight rim
          ctx.shadowColor = 'transparent';
          ctx.lineWidth = 1.3;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.stroke();

          // Render Text or Icon Glyph
          if (body.itemType === 'squircle' && body.pillIcon) {
            ctx.fillStyle = '#FFFFFF';
            const iconSize = Math.round(22 * scaleFactor);
            ctx.font = `700 ${iconSize}px 'Plus Jakarta Sans', -apple-system, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(body.pillIcon, 0, 1);
          } else {
            ctx.fillStyle = '#000000';
            const fontSize = Math.round(14 * scaleFactor);
            ctx.font = `800 ${fontSize}px 'Plus Jakarta Sans', -apple-system, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.letterSpacing = '-0.02em';
            ctx.fillText(body.pillText, 0, 1);
          }

          ctx.restore();
        });

        if (isCtaVisible) {
          rafId = requestAnimationFrame(renderLoop);
        } else {
          rafId = null;
        }
      }

      if (isCtaVisible && !rafId) {
        rafId = requestAnimationFrame(renderLoop);
      }
    }

    let isCtaVisible = false;
    let rafId = null;

    if ('IntersectionObserver' in window) {
      const ctaObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isCtaVisible = entry.isIntersecting;
          if (isCtaVisible) {
            if (runner) Runner.run(runner, engine);
            if (!rafId) rafId = requestAnimationFrame(renderLoop);
          } else {
            if (runner) Runner.stop(runner);
            if (rafId) {
              cancelAnimationFrame(rafId);
              rafId = null;
            }
          }
        });
      }, { threshold: 0.05 });

      ctaObserver.observe(container);
    } else {
      isCtaVisible = true;
    }

    setupEngine();

    // Debounced Resize Observer
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(setupEngine, 150);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhysicsCTA);
  } else {
    initPhysicsCTA();
  }
})();

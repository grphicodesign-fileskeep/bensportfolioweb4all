/**
 * BENYAMIN NAMTALASHVILI — MASTER MATTER.JS ZERO-GRAVITY HERO PHYSICS ENGINE
 * Pixel-Perfect Convex Collision Hitboxes · Compound Capsule & Squircle Geometry
 * True 1:1 Physical Dimension Mapping · Responsive Multi-Touch · Breakpoint Adaptation
 */

(function () {
  'use strict';

  function ensureMatterLoaded(callback) {
    if (typeof Matter !== 'undefined') {
      callback();
      return;
    }

    const script = document.createElement('script');
    script.src = 'matter.min.js';
    script.onload = () => {
      if (typeof Matter !== 'undefined') callback();
    };
    script.onerror = () => {
      const cdnScript = document.createElement('script');
      cdnScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js';
      cdnScript.onload = () => {
        if (typeof Matter !== 'undefined') callback();
      };
      document.head.appendChild(cdnScript);
    };
    document.head.appendChild(script);
  }

  function initMatterHero() {
    if (typeof Matter === 'undefined') {
      ensureMatterLoaded(initMatterHero);
      return;
    }

    const heroSection = document.getElementById('hero') || document.querySelector('.hero-section');
    const stageContainer = document.getElementById('heroAntigravityStage') || document.querySelector('.hero-antigravity-container');
    if (!heroSection || !stageContainer) return;

    const items = Array.from(stageContainer.querySelectorAll('.antigravity-item'));
    if (items.length === 0) return;

    // Clean up any existing instances on the container
    if (stageContainer._matterEngine) {
      Matter.Engine.clear(stageContainer._matterEngine);
      if (stageContainer._matterRunner) {
        Matter.Runner.stop(stageContainer._matterRunner);
      }
    }

    const {
      Engine,
      World,
      Bodies,
      Body,
      Runner,
      Events,
      Composite,
      Vector
    } = Matter;

    // 1. High-Fidelity Physics Engine (Optimized iterations for 60fps/120fps smoothness)
    const engine = Engine.create({
      enableSleeping: false,
      constraintIterations: 2,
      positionIterations: 6,
      velocityIterations: 4
    });

    engine.world.gravity.x = 0;
    engine.world.gravity.y = 0;
    engine.world.gravity.scale = 0;
    stageContainer._matterEngine = engine;

    // Measure Stage Dimensions
    function getDimensions() {
      const w = stageContainer.offsetWidth || heroSection.offsetWidth || window.innerWidth;
      const h = stageContainer.offsetHeight || heroSection.offsetHeight || window.innerHeight || 750;
      return {
        width: Math.max(280, w),
        height: Math.max(380, h)
      };
    }

    let { width: stageW, height: stageH } = getDimensions();

    // 2. Static Boundary Walls
    const wallThickness = 160;
    let walls = createWalls(stageW, stageH);

    function createWalls(w, h) {
      const wallOpts = {
        isStatic: true,
        restitution: 0.98,
        friction: 0.001,
        render: { visible: false }
      };

      const top = Bodies.rectangle(w / 2, -wallThickness / 2, w * 3, wallThickness, wallOpts);
      const bottom = Bodies.rectangle(w / 2, h + wallThickness / 2, w * 3, wallThickness, wallOpts);
      const left = Bodies.rectangle(-wallThickness / 2, h / 2, wallThickness, h * 3, wallOpts);
      const right = Bodies.rectangle(w + wallThickness / 2, h / 2, wallThickness, h * 3, wallOpts);

      World.add(engine.world, [top, bottom, left, right]);
      return { top, bottom, left, right };
    }

    // 3. Pixel-Perfect Compound Geometry Generators (Mapped 1:1 to CSS Bounds)
    function createCapsulePhysicsBody(x, y, w, h, angleRad) {
      const isVertical = h > w;
      const major = Math.max(w, h);
      const minor = Math.min(w, h);
      const r = minor / 2;
      const straight = Math.max(1, major - minor);
      const halfStraight = straight / 2;

      let parts = [];
      if (!isVertical) {
        // Horizontal Pill: Center Box + Left Half-Circle Cap + Right Half-Circle Cap
        const centerRect = Bodies.rectangle(x, y, straight, minor, { render: { visible: false } });
        const leftCircle = Bodies.circle(x - halfStraight, y, r, { render: { visible: false } });
        const rightCircle = Bodies.circle(x + halfStraight, y, r, { render: { visible: false } });
        parts = [centerRect, leftCircle, rightCircle];
      } else {
        // Vertical Pill: Center Box + Top Half-Circle Cap + Bottom Half-Circle Cap
        const centerRect = Bodies.rectangle(x, y, minor, straight, { render: { visible: false } });
        const topCircle = Bodies.circle(x, y - halfStraight, r, { render: { visible: false } });
        const bottomCircle = Bodies.circle(x, y + halfStraight, r, { render: { visible: false } });
        parts = [centerRect, topCircle, bottomCircle];
      }

      const body = Body.create({
        parts: parts,
        restitution: 0.94,
        friction: 0.002,
        frictionAir: 0.007,
        frictionStatic: 0.001,
        density: 0.001,
        render: { visible: false }
      });

      Body.setPosition(body, { x, y });
      Body.setAngle(body, angleRad);
      return body;
    }

    function createSquirclePhysicsBody(x, y, w, h, angleRad) {
      const r = Math.min(w, h) * 0.28; // Exact Apple squircle corner curvature
      const innerW = Math.max(1, w - 2 * r);
      const innerH = Math.max(1, h - 2 * r);

      const crossH = Bodies.rectangle(x, y, w, innerH, { render: { visible: false } });
      const crossV = Bodies.rectangle(x, y, innerW, h, { render: { visible: false } });
      const cTL = Bodies.circle(x - w / 2 + r, y - h / 2 + r, r, { render: { visible: false } });
      const cTR = Bodies.circle(x + w / 2 - r, y - h / 2 + r, r, { render: { visible: false } });
      const cBL = Bodies.circle(x - w / 2 + r, y + h / 2 - r, r, { render: { visible: false } });
      const cBR = Bodies.circle(x + w / 2 - r, y + h / 2 - r, r, { render: { visible: false } });

      const body = Body.create({
        parts: [crossH, crossV, cTL, cTR, cBL, cBR],
        restitution: 0.94,
        friction: 0.002,
        frictionAir: 0.007,
        frictionStatic: 0.001,
        density: 0.001,
        render: { visible: false }
      });

      Body.setPosition(body, { x, y });
      Body.setAngle(body, angleRad);
      return body;
    }

    // 4. Measure Elements & Generate Exact 1:1 Physics Bodies
    const bodyItemPairs = [];

    function buildPairs() {
      // Clear previous bodies from world
      bodyItemPairs.forEach(p => {
        if (p.body) World.remove(engine.world, p.body);
      });
      bodyItemPairs.length = 0;

      items.forEach((el, index) => {
        // Skip elements hidden via CSS display: none on mobile
        if (window.getComputedStyle(el).display === 'none' || el.offsetParent === null) {
          return;
        }

        el.style.touchAction = 'none';
        el.style.pointerEvents = 'auto';
        el.style.transform = 'none'; // Temporarily clear transforms to measure natural CSS box

        const initXPercent = parseFloat(el.getAttribute('data-initial-x')) || (index % 2 === 0 ? 12 : 88);
        const initYPercent = parseFloat(el.getAttribute('data-initial-y')) || (12 + (index * 7) % 75);
        const initRotDeg = parseFloat(el.getAttribute('data-rot')) || 0;
        const customScale = parseFloat(el.getAttribute('data-scale')) || 1.0;

        // Measure true unscaled CSS width and height
        const rect = el.getBoundingClientRect();
        const isSquircle = el.classList.contains('squircle-item');
        const defaultW = isSquircle ? (window.innerWidth <= 768 ? 28 : 44) : (window.innerWidth <= 768 ? 68 : 120);
        const defaultH = isSquircle ? (window.innerWidth <= 768 ? 28 : 44) : (window.innerWidth <= 768 ? 24 : 38);
        const elW = rect.width > 12 ? rect.width : (el.offsetWidth || defaultW);
        const elH = rect.height > 12 ? rect.height : (el.offsetHeight || defaultH);

        let posX = (initXPercent / 100) * stageW;
        let posY = (initYPercent / 100) * stageH;

        if (window.innerWidth <= 768) {
          if (initXPercent < 50) {
            posX = Math.max(elW / 2 + 8, Math.min(posX, stageW * 0.20));
          } else {
            posX = Math.max(stageW * 0.80, Math.min(posX, stageW - elW / 2 - 8));
          }
        }

        posX = Math.max(elW / 2 + 8, Math.min(posX, stageW - elW / 2 - 8));
        posY = Math.max(elH / 2 + 8, Math.min(posY, stageH - elH / 2 - 8));

        const angleRad = (initRotDeg * Math.PI) / 180;

        const bodyW = elW * customScale;
        const bodyH = elH * customScale;

        const body = isSquircle
          ? createSquirclePhysicsBody(posX, posY, bodyW, bodyH, angleRad)
          : createCapsulePhysicsBody(posX, posY, bodyW, bodyH, angleRad);

        // Gentle Initial Drift (Gentler on mobile to avoid rushing into the center)
        const isMob = window.innerWidth <= 768;
        const angle = Math.random() * Math.PI * 2;
        const speed = isMob ? (0.12 + Math.random() * 0.12) : (0.35 + Math.random() * 0.35);
        Body.setVelocity(body, {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        });
        Body.setAngularVelocity(body, (Math.random() - 0.5) * (isMob ? 0.002 : 0.005));

        World.add(engine.world, body);

        const pair = {
          el,
          body,
          isSquircle,
          baseScale: customScale,
          currentScale: customScale,
          targetScale: customScale,
          width: elW,
          height: elH,
          isDragging: false,
          dragOffset: { x: 0, y: 0 },
          recentPositions: []
        };

        bodyItemPairs.push(pair);

        // Bind Pointer Events (Cleaned from previous listeners via direct property / once bindings)
        bindPointerEvents(pair);
      });
    }

    function bindPointerEvents(pair) {
      const { el, body } = pair;

      el.onpointerdown = (e) => {
        e.preventDefault();
        e.stopPropagation();

        try {
          el.setPointerCapture(e.pointerId);
        } catch (err) {}

        const stageRect = stageContainer.getBoundingClientRect();
        const px = e.clientX - stageRect.left;
        const py = e.clientY - stageRect.top;

        pair.isDragging = true;
        pair.dragOffset = {
          x: px - body.position.x,
          y: py - body.position.y
        };
        pair.targetScale = pair.baseScale * 1.08;
        pair.recentPositions = [{ x: px, y: py, t: performance.now() }];

        el.classList.add('is-dragging');
        document.body.classList.add('is-dragging-active');

        Body.setVelocity(body, { x: 0, y: 0 });
        Body.setAngularVelocity(body, 0);

        if (typeof window.playButtonClick === 'function') {
          window.playButtonClick();
        }
      };

      el.onpointermove = (e) => {
        if (!pair.isDragging) return;
        e.preventDefault();

        const stageRect = stageContainer.getBoundingClientRect();
        const px = e.clientX - stageRect.left;
        const py = e.clientY - stageRect.top;
        const now = performance.now();

        const targetX = px - pair.dragOffset.x;
        const targetY = py - pair.dragOffset.y;

        Body.setPosition(body, { x: targetX, y: targetY });

        pair.recentPositions.push({ x: px, y: py, t: now });
        if (pair.recentPositions.length > 5) {
          pair.recentPositions.shift();
        }
      };

      const handleRelease = (e) => {
        if (!pair.isDragging) return;
        pair.isDragging = false;
        pair.targetScale = pair.baseScale;
        el.classList.remove('is-dragging');
        document.body.classList.remove('is-dragging-active');

        try {
          el.releasePointerCapture(e.pointerId);
        } catch (err) {}

        if (pair.recentPositions.length >= 2) {
          const first = pair.recentPositions[0];
          const last = pair.recentPositions[pair.recentPositions.length - 1];
          const dt = Math.max(16, last.t - first.t);
          const vx = ((last.x - first.x) / dt) * 16;
          const vy = ((last.y - first.y) / dt) * 16;
          const maxSpeed = 20;
          const speed = Math.hypot(vx, vy);
          const factor = speed > maxSpeed ? maxSpeed / speed : 1;

          Body.setVelocity(body, { x: vx * factor, y: vy * factor });
          Body.setAngularVelocity(body, vx * 0.006);
        }
      };

      el.onpointerup = handleRelease;
      el.onpointercancel = handleRelease;
    }

    // Build initial bodies
    buildPairs();

    // 5. Ambient Zero-G Micro-Forces & Mobile Center Clearance Buffer
    let frameCount = 0;
    Events.on(engine, 'beforeUpdate', () => {
      frameCount++;
      const isMob = window.innerWidth <= 768;
      const centerRepelX = stageW / 2;
      const centerRepelY = stageH * 0.46; // Center of hero headline/CTA zone
      const repelRadius = isMob ? Math.min(stageW * 0.42, 190) : 0;

      bodyItemPairs.forEach(pair => {
        if (!pair.isDragging) {
          // On mobile, gently push elements away from the center text/CTA zone if they drift into it
          if (isMob && repelRadius > 0) {
            const dx = pair.body.position.x - centerRepelX;
            const dy = pair.body.position.y - centerRepelY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < repelRadius && dist > 1) {
              const pushFactor = (1 - dist / repelRadius) * 0.00015;
              Body.applyForce(pair.body, pair.body.position, {
                x: (dx / dist) * pushFactor,
                y: (dy / dist) * pushFactor
              });
            }
          }

          if (frameCount % 60 === 0) {
            const speed = Vector.magnitude(pair.body.velocity);
            const maxSpeed = isMob ? 0.15 : 0.22;
            if (speed < maxSpeed) {
              const nudgeAngle = Math.random() * Math.PI * 2;
              const forceMag = isMob ? 0.00008 : 0.0002;
              Body.applyForce(pair.body, pair.body.position, {
                x: Math.cos(nudgeAngle) * forceMag,
                y: Math.sin(nudgeAngle) * forceMag
              });
            }
          }
        }
      });
    });

    // 6. Synchronize Physics to DOM Elements (Center-Aligned 1:1)
    let isHeroVisible = true;
    Events.on(engine, 'afterUpdate', () => {
      if (!isHeroVisible) return;
      bodyItemPairs.forEach(pair => {
        const { el, body, width, height } = pair;

        // Smooth spring scale for drag expansion
        pair.currentScale += (pair.targetScale - pair.currentScale) * 0.24;

        const posX = body.position.x - width / 2;
        const posY = body.position.y - height / 2;
        const angle = body.angle;

        el.style.transform = `translate3d(${posX.toFixed(1)}px, ${posY.toFixed(1)}px, 0) rotate(${angle.toFixed(4)}rad) scale(${pair.currentScale.toFixed(4)})`;
      });
    });

    // 7. Start Runner
    const runner = Runner.create();
    Runner.run(runner, engine);
    stageContainer._matterRunner = runner;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isHeroVisible = entry.isIntersecting;
          isHeroVisible ? Runner.run(runner, engine) : Runner.stop(runner);
        });
      }, { threshold: 0.05 }).observe(heroSection);
    }

    // 8. Responsive Dynamic Resize & Orientation Re-calibration
    let resizeTimer = null;
    let lastWidth = window.innerWidth;

    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const currentWidth = window.innerWidth;
        const dims = getDimensions();
        stageW = dims.width;
        stageH = dims.height;

        // Rebuild boundary walls
        Composite.remove(engine.world, [walls.top, walls.bottom, walls.left, walls.right]);
        walls = createWalls(stageW, stageH);

        // If breakpoint crossed or significant width change, rebuild bodies for 1:1 pixel match
        if (Math.abs(currentWidth - lastWidth) > 30) {
          lastWidth = currentWidth;
          buildPairs();
        } else {
          // Clamp existing bodies inside stage bounds
          bodyItemPairs.forEach(pair => {
            const clampedX = Math.max(pair.width / 2 + 5, Math.min(pair.body.position.x, stageW - pair.width / 2 - 5));
            const clampedY = Math.max(pair.height / 2 + 5, Math.min(pair.body.position.y, stageH - pair.height / 2 - 5));
            Body.setPosition(pair.body, { x: clampedX, y: clampedY });
          });
        }
      }, 120);
    }

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initMatterHero, 80));
  } else {
    setTimeout(initMatterHero, 80);
  }
})();

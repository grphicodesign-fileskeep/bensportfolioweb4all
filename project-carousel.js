/**
 * BENYAMIN NAMTALASHVILI — APPLE FLUID INFINITE CAROUSEL ENGINE
 * Principles: Apple Fluid Interfaces (WWDC), 3D Perspective Tilt, Zero-Latency Momentum
 * Features: Native aspect-ratio support, Infinite Wrap, Interruptible Velocity Handoff
 */

(function () {
  'use strict';

  function initAppleFluidCarousel() {
    const viewport = document.getElementById('featuredCarouselViewport');
    const track = document.getElementById('featuredCarouselTrack');
    const cursorBadge = document.getElementById('dragCursorBadge');

    if (!viewport || !track) return;

    const cards = Array.from(track.querySelectorAll('.featured-card'));
    if (cards.length === 0) return;

    // Clone cards once to guarantee seamless infinite wrapping buffer
    const cardCount = cards.length;
    for (let i = 0; i < cardCount; i++) {
      const clone = cards[i].cloneNode(true);
      clone.setAttribute('data-clone', 'true');
      track.appendChild(clone);
    }

    const allCards = Array.from(track.querySelectorAll('.featured-card'));
    let totalTrackWidth = 0;
    let singleSetWidth = 0;

    function calculateDimensions() {
      const gap = parseFloat(window.getComputedStyle(track).gap) || 32;
      let setW = 0;
      for (let i = 0; i < cardCount; i++) {
        setW += cards[i].offsetWidth + gap;
      }
      singleSetWidth = setW;
      totalTrackWidth = setW * 2;
    }

    calculateDimensions();
    window.addEventListener('resize', calculateDimensions);

    // =========================================================================
    // STATE & PHYSICS CONSTANTS
    // =========================================================================
    let currentX = 0;
    let targetX = 0;
    let isDragging = false;
    let pointerStartX = 0;
    let dragStartX = 0;
    let velocity = 0;
    let lastPointerX = 0;
    let lastTimestamp = 0;
    let isHovered = false;
    let autoGlideSpeed = -0.45; // Subtle auto-drift when idle

    // History buffer for velocity smoothing
    const historyLength = 5;
    const posHistory = [];
    const timeHistory = [];

    // =========================================================================
    // CUSTOM CURSOR TRACKING (HOVER DRAG CAPSULE COMPONENT)
    // =========================================================================
    const CAPSULE_HTML = `
      <span class="capsule-chevron left">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </span>
      <span class="capsule-pulse-dot"></span>
      <span class="capsule-label">DRAG TO EXPLORE</span>
      <span class="capsule-chevron right">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </span>
    `;

    let activeBadge = document.getElementById('carouselDragCapsule');
    if (!activeBadge) {
      activeBadge = document.createElement('div');
      activeBadge.id = 'carouselDragCapsule';
      activeBadge.className = 'carousel-drag-capsule';
      activeBadge.innerHTML = CAPSULE_HTML;
      document.body.appendChild(activeBadge);
    } else {
      activeBadge.innerHTML = CAPSULE_HTML;
    }

    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 768;

    if (!isTouch && activeBadge) {
      // Direct high-performance transform tracking with zero matrix clipping
      let mouseX = -100;
      let mouseY = -100;
      let isOverCarousel = false;

      function updateCapsulePosition(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        activeBadge.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      }

      window.addEventListener('pointermove', updateCapsulePosition, { passive: true });

      viewport.addEventListener('pointerenter', (e) => {
        isHovered = true;
        isOverCarousel = true;
        updateCapsulePosition(e);
        activeBadge.classList.add('is-active');
      });

      viewport.addEventListener('pointerleave', () => {
        isOverCarousel = false;
        if (!isDragging) {
          isHovered = false;
          activeBadge.classList.remove('is-active', 'is-pressed');
        }
      });

      viewport.addEventListener('pointerdown', () => {
        activeBadge.classList.add('is-pressed');
      });

      window.addEventListener('pointerup', () => {
        activeBadge.classList.remove('is-pressed');
        if (!isOverCarousel) {
          isHovered = false;
          activeBadge.classList.remove('is-active');
        }
      });
    }

    // =========================================================================
    // POINTER EVENTS (ZERO LATENCY & FULL INTERRUPTIBILITY)
    // =========================================================================
    viewport.addEventListener('pointerdown', (e) => {
      // Respect right clicks
      if (e.button !== 0 && e.pointerType === 'mouse') return;

      isDragging = true;
      isHovered = true;
      pointerStartX = e.clientX;
      dragStartX = targetX;
      lastPointerX = e.clientX;
      lastTimestamp = performance.now();
      velocity = 0;

      posHistory.length = 0;
      timeHistory.length = 0;
      posHistory.push(e.clientX);
      timeHistory.push(lastTimestamp);

      // Kill active momentum instantly on grab (interruptibility)
      targetX = currentX;

      try {
        viewport.setPointerCapture(e.pointerId);
      } catch (err) {}
    });

    viewport.addEventListener('pointermove', (e) => {
      if (!isDragging) return;

      const now = performance.now();
      const deltaX = e.clientX - pointerStartX;
      targetX = dragStartX + deltaX;

      // Track rolling history for velocity projection
      posHistory.push(e.clientX);
      timeHistory.push(now);
      if (posHistory.length > historyLength) {
        posHistory.shift();
        timeHistory.shift();
      }

      lastPointerX = e.clientX;
      lastTimestamp = now;
    });

    function endDrag(e) {
      if (!isDragging) return;
      isDragging = false;

      try {
        viewport.releasePointerCapture(e.pointerId);
      } catch (err) {}

      // Calculate release velocity using weighted history
      if (posHistory.length >= 2) {
        const firstPos = posHistory[0];
        const lastPos = posHistory[posHistory.length - 1];
        const firstTime = timeHistory[0];
        const lastTime = timeHistory[timeHistory.length - 1];
        const dt = (lastTime - firstTime) || 16;
        velocity = (lastPos - firstPos) / dt; // px per millisecond
      } else {
        velocity = 0;
      }

      // Apple momentum projection (WWDC Designing Fluid Interfaces exponential decay)
      // project(v) = (v / 1000) * (decel / (1 - decel))
      if (Math.abs(velocity) > 0.08) {
        const momentumThrow = velocity * 420;
        targetX += momentumThrow;
      }
    }

    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    // Prevent any drag gestures from triggering unintended clicks
    track.addEventListener('click', (e) => {
      if (Math.abs(currentX - dragStartX) > 6) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    // =========================================================================
    // 60FPS FLUID TICKER WITH 3D TACTILE PERSPECTIVE (VIEWPORT OPTIMIZED)
    // =========================================================================
    let lastFrameTime = performance.now();
    let isCarouselVisible = false;
    let carouselRafId = null;
    let lastTiltAngle = 0;

    function renderLoop(now) {
      const dt = Math.min(32, now - lastFrameTime);
      lastFrameTime = now;

      if (!isDragging && !isHovered) {
        // Auto-glide drift when idle
        targetX += autoGlideSpeed * (dt / 16.67);
      }

      // Smooth Spring Lerp Interpolation
      const lerpFactor = isDragging ? 0.22 : 0.085;
      currentX += (targetX - currentX) * lerpFactor;

      // Infinite Wrap Math (Modulo without seam)
      if (singleSetWidth > 0) {
        while (currentX <= -singleSetWidth) {
          currentX += singleSetWidth;
          targetX += singleSetWidth;
        }
        while (currentX > 0) {
          currentX -= singleSetWidth;
          targetX -= singleSetWidth;
        }
      }

      // Apply transform to track
      track.style.transform = `translate3d(${currentX.toFixed(1)}px, 0, 0)`;

      // Calculate dynamic speed for 3D tilt & card skew (only during active drag or high-velocity fling)
      const frameSpeed = (targetX - currentX);
      const isHighVelocity = isDragging || Math.abs(frameSpeed) > 1.2;

      if (isHighVelocity) {
        const tiltAngle = Math.max(-3.5, Math.min(3.5, frameSpeed * 0.045));
        const scaleDown = Math.max(0.985, 1 - Math.abs(frameSpeed) * 0.00035);
        if (Math.abs(tiltAngle - lastTiltAngle) > 0.02) {
          lastTiltAngle = tiltAngle;
          for (let i = 0; i < allCards.length; i++) {
            allCards[i].style.transform = `perspective(1000px) rotateY(${tiltAngle.toFixed(2)}deg) scale(${scaleDown.toFixed(3)})`;
          }
        }
      } else if (lastTiltAngle !== 0) {
        // Reset card tilt back to neutral once
        lastTiltAngle = 0;
        for (let i = 0; i < allCards.length; i++) {
          allCards[i].style.transform = '';
        }
      }

      if (isCarouselVisible) {
        carouselRafId = requestAnimationFrame(renderLoop);
      } else {
        carouselRafId = null;
      }
    }

    if ('IntersectionObserver' in window) {
      const carouselObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isCarouselVisible = entry.isIntersecting;
          if (isCarouselVisible) {
            lastFrameTime = performance.now();
            if (!carouselRafId) carouselRafId = requestAnimationFrame(renderLoop);
          } else {
            if (carouselRafId) {
              cancelAnimationFrame(carouselRafId);
              carouselRafId = null;
            }
          }
        });
      }, { threshold: 0.05 });

      carouselObserver.observe(viewport);
    } else {
      isCarouselVisible = true;
      carouselRafId = requestAnimationFrame(renderLoop);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppleFluidCarousel);
  } else {
    initAppleFluidCarousel();
  }
})();

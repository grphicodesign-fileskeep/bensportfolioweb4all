/**
 * BENYAMIN NAMTALASHVILI — LIVE FIGMA COMPONENT GENERATOR SIMULATION
 * Core Capabilities: "DESIGNED LIVE" Interactive Bento Card
 * 
 * Simulates a live designer cursor (Benyamin.Design) drawing selection boxes,
 * setting dimensions, adjusting auto-layout properties, and spawning interactive
 * UI components in an infinite realistic creative loop.
 */

(function () {
  'use strict';

  function initLiveDesignSimulation() {
    const card = document.getElementById('bentoLiveCard') || document.querySelector('.bento-preview-card');
    if (!card) return;

    // Check if stage already exists or create it
    let stage = card.querySelector('.bento-live-stage');
    if (!stage) {
      stage = document.createElement('div');
      stage.className = 'bento-live-stage';
      stage.id = 'bentoLiveStage';
      card.appendChild(stage);
    }

    let cursor = card.querySelector('.bento-mini-cursor');
    if (!cursor) {
      cursor = document.createElement('div');
      cursor.className = 'bento-mini-cursor';
      cursor.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
          <path d="M2 2L8.5 16L11 11L16 8.5L2 2Z" fill="#FF5E00" stroke="#FFFFFF" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>
        <span class="bento-mini-badge">Benyamin.Design</span>
      `;
      card.appendChild(cursor);
    }

    // Dimension Tooltip Pill
    let dimTooltip = card.querySelector('.live-dim-tooltip');
    if (!dimTooltip) {
      dimTooltip = document.createElement('div');
      dimTooltip.className = 'live-dim-tooltip';
      card.appendChild(dimTooltip);
    }

    // Status Indicator
    const statusPill = card.querySelector('.bento-live-status-pill');

    let currentStep = 0;
    let activeTimers = [];
    let isRunning = false;
    let isDestroyed = false;

    function scheduleTimer(fn, delay) {
      if (isDestroyed) return null;
      const id = setTimeout(() => {
        activeTimers = activeTimers.filter(t => t !== id);
        if (isRunning && !isDestroyed) {
          fn();
        }
      }, delay);
      activeTimers.push(id);
      return id;
    }

    function clearAllTimers() {
      activeTimers.forEach(id => clearTimeout(id));
      activeTimers = [];
    }

    function stopSimulation() {
      isRunning = false;
      clearAllTimers();
      hideTooltip();
      if (stage) stage.innerHTML = '';
    }

    function startSimulation() {
      if (isRunning || isDestroyed) return;
      isRunning = true;
      runComponent1();
    }

    // Helper: Move Cursor with smooth transition
    function moveCursor(x, y, duration = 0.5) {
      cursor.style.transition = `transform ${duration}s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease`;
      cursor.style.transform = `translate(${x}px, ${y}px)`;
    }

    function showTooltip(text, x, y) {
      dimTooltip.textContent = text;
      dimTooltip.style.opacity = '1';
      dimTooltip.style.transform = `translate(${x}px, ${y - 24}px)`;
    }

    function hideTooltip() {
      dimTooltip.style.opacity = '0';
    }

    function updateStatus(text, color = '#FF5E00') {
      if (statusPill) {
        statusPill.innerHTML = `<span style="color:${color}">●</span> ${text}`;
      }
    }

    // COMPONENT 1: Primary Agent Glass Button (BtnPrimary.fig)
    function runComponent1() {
      if (isDestroyed || !isRunning) return;
      stage.innerHTML = '';
      updateStatus('DRAWING FRAME', '#FF5E00');

      // Start position
      moveCursor(35, 30, 0.4);
      hideTooltip();

      scheduleTimer(() => {
        // Selection Box starts drawing
        const box = document.createElement('div');
        box.className = 'live-selection-box';
        box.style.left = '45px';
        box.style.top = '38px';
        box.style.width = '0px';
        box.style.height = '0px';
        box.innerHTML = `
          <span class="sel-handle sel-tl"></span>
          <span class="sel-handle sel-tr"></span>
          <span class="sel-handle sel-bl"></span>
          <span class="sel-handle sel-br"></span>
        `;
        stage.appendChild(box);

        // Drag cursor to expand box
        scheduleTimer(() => {
          moveCursor(195, 78, 0.6);
          showTooltip('150 × 40 · R: 999', 195, 78);
          box.style.transition = 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1), height 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
          box.style.width = '150px';
          box.style.height = '40px';
        }, 150);

        // Solidify into Glass Button
        scheduleTimer(() => {
          box.classList.add('solidified');
          updateStatus('STYLING COMPONENT', '#3B82F6');
          box.innerHTML = `
            <div class="live-comp-button">
              <span class="comp-icon"><i class="fa-solid fa-bolt"></i></span>
              <span class="comp-text">Deploy Agent</span>
              <span class="comp-badge">AutoLayout</span>
            </div>
          `;
          showTooltip('BtnPrimary · 60fps', 195, 78);
        }, 850);

        // Cursor Clicks the Button to test interaction
        scheduleTimer(() => {
          moveCursor(120, 58, 0.4);
          scheduleTimer(() => {
            cursor.classList.add('cursor-clicking');
            const btn = box.querySelector('.live-comp-button');
            if (btn) btn.classList.add('is-active-btn');
            updateStatus('READY · VERIFIED', '#10B981');
            showTooltip('✓ Interactive State OK', 120, 58);

            scheduleTimer(() => {
              cursor.classList.remove('cursor-clicking');
            }, 300);
          }, 450);
        }, 1400);

        // Transition to next component
        scheduleTimer(() => {
          hideTooltip();
          box.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          box.style.opacity = '0';
          box.style.transform = 'scale(0.95)';
          scheduleTimer(runComponent2, 500);
        }, 3400);

      }, 500);
    }

    // COMPONENT 2: Autonomous Neural Toggle Switch (AiSwitch.fig)
    function runComponent2() {
      if (isDestroyed || !isRunning) return;
      stage.innerHTML = '';
      updateStatus('DRAWING COMPONENT', '#8B5CF6');

      moveCursor(40, 28, 0.4);
      hideTooltip();

      scheduleTimer(() => {
        const box = document.createElement('div');
        box.className = 'live-selection-box';
        box.style.left = '42px';
        box.style.top = '34px';
        box.style.width = '0px';
        box.style.height = '0px';
        box.innerHTML = `
          <span class="sel-handle sel-tl"></span>
          <span class="sel-handle sel-tr"></span>
          <span class="sel-handle sel-bl"></span>
          <span class="sel-handle sel-br"></span>
        `;
        stage.appendChild(box);

        scheduleTimer(() => {
          moveCursor(185, 82, 0.6);
          showTooltip('142 × 48 · Pill', 185, 82);
          box.style.transition = 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1), height 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
          box.style.width = '142px';
          box.style.height = '48px';
        }, 150);

        scheduleTimer(() => {
          box.classList.add('solidified');
          updateStatus('CONFIGURING LOGIC', '#06B6D4');
          box.innerHTML = `
            <div class="live-comp-toggle">
              <div class="toggle-info">
                <span class="toggle-title">Neural Copilot</span>
                <span class="toggle-mode" id="liveToggleStatus">Idle</span>
              </div>
              <div class="toggle-switch-track" id="liveToggleTrack">
                <span class="toggle-switch-thumb" id="liveToggleThumb"></span>
              </div>
            </div>
          `;
          showTooltip('AiSwitch.state(0)', 185, 82);
        }, 850);

        // Move to switch thumb & click to toggle ON
        scheduleTimer(() => {
          moveCursor(160, 58, 0.45);
          scheduleTimer(() => {
            cursor.classList.add('cursor-clicking');
            const track = document.getElementById('liveToggleTrack');
            const status = document.getElementById('liveToggleStatus');
            if (track) track.classList.add('is-on');
            if (status) {
              status.textContent = 'ACTIVE';
              status.style.color = '#10B981';
            }
            updateStatus('AUTONOMOUS ACTIVE', '#10B981');
            showTooltip('⚡ State: 1 (Enabled)', 160, 58);

            scheduleTimer(() => {
              cursor.classList.remove('cursor-clicking');
            }, 300);
          }, 500);
        }, 1400);

        // Transition to next component
        scheduleTimer(() => {
          hideTooltip();
          box.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          box.style.opacity = '0';
          box.style.transform = 'scale(0.95)';
          scheduleTimer(runComponent3, 500);
        }, 3400);

      }, 500);
    }

    // COMPONENT 3: Live Sparkline Performance Metric Card (MetricCard.fig)
    function runComponent3() {
      if (isDestroyed || !isRunning) return;
      stage.innerHTML = '';
      updateStatus('CREATING CHART', '#10B981');

      moveCursor(30, 26, 0.4);
      hideTooltip();

      scheduleTimer(() => {
        const box = document.createElement('div');
        box.className = 'live-selection-box';
        box.style.left = '32px';
        box.style.top = '30px';
        box.style.width = '0px';
        box.style.height = '0px';
        box.innerHTML = `
          <span class="sel-handle sel-tl"></span>
          <span class="sel-handle sel-tr"></span>
          <span class="sel-handle sel-bl"></span>
          <span class="sel-handle sel-br"></span>
        `;
        stage.appendChild(box);

        scheduleTimer(() => {
          moveCursor(205, 84, 0.6);
          showTooltip('172 × 54 · AutoLayout', 205, 84);
          box.style.transition = 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1), height 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
          box.style.width = '172px';
          box.style.height = '54px';
        }, 150);

        scheduleTimer(() => {
          box.classList.add('solidified');
          updateStatus('CALCULATING DATA', '#FF5E00');
          box.innerHTML = `
            <div class="live-comp-metric">
              <div class="metric-val-col">
                <span class="metric-num">+148%</span>
                <span class="metric-sub">Velocity Index</span>
              </div>
              <div class="metric-chart-col">
                <svg width="64" height="24" viewBox="0 0 64 24" fill="none">
                  <path class="sparkline-path" d="M2 20L14 16L26 18L38 9L50 12L62 3" stroke="#FF5E00" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="62" cy="3" r="3" fill="#FF5E00" class="sparkline-dot"/>
                </svg>
              </div>
            </div>
          `;
          showTooltip('MetricPill · +148%', 205, 84);
        }, 850);

        // Move to inspect sparkline dot
        scheduleTimer(() => {
          moveCursor(188, 46, 0.45);
          showTooltip('Peak 120fps · Zero Latency', 188, 46);
          updateStatus('OPTIMIZED 120FPS', '#10B981');
        }, 1500);

        // Loop back to Component 1
        scheduleTimer(() => {
          hideTooltip();
          box.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          box.style.opacity = '0';
          box.style.transform = 'scale(0.95)';
          scheduleTimer(runComponent1, 500);
        }, 3400);

      }, 500);
    }

    // Observer to only run simulation when card is in view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          startSimulation();
        } else {
          stopSimulation();
        }
      });
    }, { threshold: 0.1 });

    observer.observe(card);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLiveDesignSimulation);
  } else {
    initLiveDesignSimulation();
  }
})();

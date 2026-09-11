/**
 * BENYAMIN NAMTALASHVILI — MASTER INTERACTION & MOTION ENGINE
 * Lenis Smooth Scroll + GSAP 3 ScrollTrigger + Web Audio Haptics + Interactive Stage Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Register GSAP Plugins if loaded
  if (typeof gsap !== 'undefined') {
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.config({ ignoreMobileResize: true });
    }
  }

  // =========================================================================
  // 1. TACTILE AUDIO FEEDBACK ENGINE (App Interface Click & Menu Tone)
  // =========================================================================
  let audioEnabled = true;
  let audioCtx = null;
  const audioBuffers = {
    click: null,
    tone: null
  };

  const AUDIO_URLS = {
    click: 'assets/ui-click.mp3',
    tone: 'assets/menu-tone.mp3'
  };

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
  }

  // Pre-load and decode audio buffers for zero-latency polyphonic playback
  async function preloadAudioBuffers() {
    initAudio();
    if (!audioCtx) return;

    for (const [key, url] of Object.entries(AUDIO_URLS)) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          audioBuffers[key] = await audioCtx.decodeAudioData(arrayBuffer);
        }
      } catch (err) {
        // Fallback handled seamlessly during playback
      }
    }
  }

  // Auto-preload on first user interaction if not already loaded
  const unlockAudio = () => {
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (!audioBuffers.click || !audioBuffers.tone) {
      preloadAudioBuffers();
    }
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });

  function playSound(type = 'click', volume = 0.5) {
    if (!audioEnabled) return;
    try {
      initAudio();
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      if (audioCtx && audioBuffers[type]) {
        const source = audioCtx.createBufferSource();
        const gainNode = audioCtx.createGain();
        source.buffer = audioBuffers[type];
        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        source.start(0);
        return;
      }

      // Fallback: HTML5 Audio instance
      const soundUrl = AUDIO_URLS[type] || AUDIO_URLS.click;
      const audioEl = new Audio(soundUrl);
      audioEl.volume = volume;
      audioEl.currentTime = 0;
      audioEl.play().catch(() => {});
    } catch (e) {
      // Graceful fallback
    }
  }

  function playButtonClick() {
    playSound('click', 0.55);
  }

  function playMenuTone() {
    playSound('tone', 0.45);
  }

  // Expose on window for global access
  window.playButtonClick = playButtonClick;
  window.playMenuTone = playMenuTone;
  window.playTactileClick = (freq, type, duration) => playButtonClick();

  // Audio Toggle Button in Navigation
  const audioToggleBtn = document.getElementById('audioToggleBtn');
  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      audioEnabled = !audioEnabled;
      audioToggleBtn.innerHTML = audioEnabled 
        ? '<i class="fa-solid fa-volume-high"></i>' 
        : '<i class="fa-solid fa-volume-xmark"></i>';
      audioToggleBtn.setAttribute('title', audioEnabled ? 'Sound Effects Enabled' : 'Sound Effects Muted');
      if (audioEnabled) playMenuTone();
    });
  }

  // Global delegated click handler for all interactive elements
  document.addEventListener('click', (e) => {
    const toneTarget = e.target.closest(
      '.stage-tab-btn, .stage-filter-chip, .portfolio-filter-btn, .portfolio-filter-chip, .filter-chip, .tab-btn, #audioToggleBtn'
    );
    if (toneTarget) {
      if (toneTarget !== audioToggleBtn) {
        playMenuTone();
      }
      return;
    }

    const clickTarget = e.target.closest(
      'button, .btn-apple-primary, .btn-apple-secondary, .btn, .nav-links-wrap a, .nav-link, .nav-cta, .stage-watch-demo-btn, .cta-banner-btn, .featured-card, .portfolio-card-item, .chip, .accordion-header, #backToTop, #footerBackToTop, input[type="submit"], input[type="button"]'
    );
    if (clickTarget) {
      playButtonClick();
    }
  });

  // =========================================================================
  // 1.5. GLOBAL APPLE LIQUID GLASS MOBILE NAVIGATION DRAWER CONTROLLER
  // =========================================================================
  function initMobileNavigation() {
    const nav = document.getElementById('nav') || document.querySelector('nav');
    if (!nav) return;

    const navIsland = nav.querySelector('.nav-island');
    if (!navIsland) return;

    // Check or inject hamburger toggle inside .nav-island
    let mobileToggle = navIsland.querySelector('.nav-mobile-toggle');
    if (!mobileToggle) {
      mobileToggle = document.createElement('button');
      mobileToggle.className = 'nav-mobile-toggle';
      mobileToggle.id = 'navMobileToggle';
      mobileToggle.setAttribute('aria-label', 'Toggle Mobile Navigation Menu');
      mobileToggle.setAttribute('aria-expanded', 'false');
      mobileToggle.innerHTML = `
        <div class="hamburger-lines">
          <span></span>
          <span></span>
          <span></span>
        </div>
      `;
      navIsland.appendChild(mobileToggle);
    }

    // Determine active page
    const currentPath = window.location.pathname.toLowerCase();
    const isOverview = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath === '' || currentPath.endsWith('test%20portfolio/');
    const isWorks = currentPath.includes('portfolio') || currentPath.includes('case-study');
    const isAbout = currentPath.includes('about');
    const isContact = currentPath.includes('contact');

    // Create or find Mobile Navigation Drawer Sheet & Backdrop
    let backdrop = document.querySelector('.mobile-nav-backdrop');
    let sheet = document.querySelector('.mobile-nav-sheet');

    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'mobile-nav-backdrop';
      backdrop.id = 'mobileNavBackdrop';
      document.body.appendChild(backdrop);
    }

    if (!sheet) {
      sheet = document.createElement('div');
      sheet.className = 'mobile-nav-sheet';
      sheet.id = 'mobileNavSheet';
      sheet.setAttribute('role', 'dialog');
      sheet.setAttribute('aria-label', 'Mobile Navigation');

      sheet.innerHTML = `
        <!-- Header Profile & Controls -->
        <div class="mobile-nav-header">
          <a href="index.html" class="mobile-nav-brand-lockup" aria-label="Benyamin Namtalashvili Home">
            <span class="mobile-nav-avatar">BN</span>
            <div class="mobile-nav-brand-meta">
              <span class="mobile-nav-brand-name">Benyamin Namtalashvili</span>
              <span class="mobile-nav-brand-sub">AI Workflow &amp; Web Architect</span>
            </div>
          </a>
          <div class="mobile-nav-header-actions">
            <button class="mobile-nav-close-btn" id="mobileNavCloseBtn" aria-label="Close Navigation Menu">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <!-- Navigation Links Matrix -->
        <ul class="mobile-nav-links">
          <li>
            <a href="index.html" class="mobile-nav-link-item ${isOverview ? 'active' : ''}">
              <div class="mobile-nav-link-left">
                <span class="mobile-nav-link-icon"><i class="fa-solid fa-house-chimney"></i></span>
                <div class="mobile-nav-link-text">
                  <span class="mobile-nav-link-title">Overview</span>
                  <span class="mobile-nav-link-sub">Core Showcase &amp; Architecture</span>
                </div>
              </div>
              <div class="mobile-nav-link-badge">
                <span class="mobile-nav-tag">Home</span>
                <i class="fa-solid fa-chevron-right mobile-nav-arrow"></i>
              </div>
            </a>
          </li>
          <li>
            <a href="portfolio.html" class="mobile-nav-link-item ${isWorks ? 'active' : ''}">
              <div class="mobile-nav-link-left">
                <span class="mobile-nav-link-icon"><i class="fa-solid fa-layer-group"></i></span>
                <div class="mobile-nav-link-text">
                  <span class="mobile-nav-link-title">Works &amp; Case Studies</span>
                  <span class="mobile-nav-link-sub">9 Production Web &amp; AI Systems</span>
                </div>
              </div>
              <div class="mobile-nav-link-badge">
                <span class="mobile-nav-tag">9 Projects</span>
                <i class="fa-solid fa-chevron-right mobile-nav-arrow"></i>
              </div>
            </a>
          </li>
          <li>
            <a href="about.html" class="mobile-nav-link-item ${isAbout ? 'active' : ''}">
              <div class="mobile-nav-link-left">
                <span class="mobile-nav-link-icon"><i class="fa-solid fa-id-badge"></i></span>
                <div class="mobile-nav-link-text">
                  <span class="mobile-nav-link-title">About &amp; Resume</span>
                  <span class="mobile-nav-link-sub">Engineering &amp; Design Philosophy</span>
                </div>
              </div>
              <div class="mobile-nav-link-badge">
                <span class="mobile-nav-tag">Bio</span>
                <i class="fa-solid fa-chevron-right mobile-nav-arrow"></i>
              </div>
            </a>
          </li>
          <li>
            <a href="contact.html" class="mobile-nav-link-item ${isContact ? 'active' : ''}">
              <div class="mobile-nav-link-left">
                <span class="mobile-nav-link-icon"><i class="fa-solid fa-paper-plane"></i></span>
                <div class="mobile-nav-link-text">
                  <span class="mobile-nav-link-title">Contact &amp; Booking</span>
                  <span class="mobile-nav-link-sub">Direct Inquiries &amp; Discovery Calls</span>
                </div>
              </div>
              <div class="mobile-nav-link-badge">
                <span class="mobile-nav-tag">Let's Talk</span>
                <i class="fa-solid fa-chevron-right mobile-nav-arrow"></i>
              </div>
            </a>
          </li>
          <li>
            <a href="https://bensmodelingportfolio.netlify.app/" target="_blank" rel="noopener noreferrer" class="mobile-nav-link-item mobile-nav-modeling-pill">
              <div class="mobile-nav-link-left">
                <span class="mobile-nav-link-icon" style="background:rgba(255,107,0,0.15); color:var(--apple-blue);"><i class="fa-solid fa-camera"></i></span>
                <div class="mobile-nav-link-text">
                  <span class="mobile-nav-link-title">Modeling Portfolio</span>
                  <span class="mobile-nav-link-sub">High-Fashion &amp; Lookbook Visuals</span>
                </div>
              </div>
              <div class="mobile-nav-link-badge">
                <span class="mobile-nav-tag" style="background:rgba(255,107,0,0.12); color:var(--apple-blue);">Visuals ↗</span>
              </div>
            </a>
          </li>
        </ul>

        <!-- Bottom CTA & Quick Action Dock -->
        <div class="mobile-nav-cta-row">
          <a href="contact.html" class="nav-cta-btn" style="width:100%; justify-content:center; padding:0.85rem;">
            <span>Get in Touch <i class="fa-solid fa-arrow-right" style="font-size:0.82rem; margin-left:0.35rem;"></i></span>
          </a>

          <div class="mobile-nav-dock">
            <a href="mailto:benyaminnamtalashvili726@gmail.com" class="mobile-dock-btn" title="Send Email">
              <i class="fa-solid fa-envelope" style="color:var(--apple-blue);"></i>
              <span>Email</span>
            </a>
            <a href="https://wa.me/639454836568" target="_blank" rel="noopener noreferrer" class="mobile-dock-btn" title="WhatsApp Message">
              <i class="fa-brands fa-whatsapp" style="color:#25D366;"></i>
              <span>WhatsApp</span>
            </a>
            <a href="tel:+639454836568" class="mobile-dock-btn" title="Direct Phone Call">
              <i class="fa-solid fa-phone" style="color:var(--apple-blue);"></i>
              <span>Call</span>
            </a>
          </div>
        </div>
      `;
      document.body.appendChild(sheet);
    }

    let isOpen = false;

    function openMobileNav() {
      isOpen = true;
      mobileToggle.classList.add('is-active');
      mobileToggle.setAttribute('aria-expanded', 'true');
      navIsland.classList.add('is-expanded');
      backdrop.classList.add('is-open');
      sheet.classList.add('is-open');
      document.documentElement.classList.add('mobile-nav-open');
      document.body.classList.add('mobile-nav-open');
      if (typeof lenis !== 'undefined' && lenis) lenis.stop();
      playButtonClick();
    }

    function closeMobileNav() {
      isOpen = false;
      mobileToggle.classList.remove('is-active');
      mobileToggle.setAttribute('aria-expanded', 'false');
      navIsland.classList.remove('is-expanded');
      backdrop.classList.remove('is-open');
      sheet.classList.remove('is-open');
      document.documentElement.classList.remove('mobile-nav-open');
      document.body.classList.remove('mobile-nav-open');
      if (typeof lenis !== 'undefined' && lenis) lenis.start();
      playButtonClick();
    }

    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isOpen) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });

    backdrop.addEventListener('click', closeMobileNav);

    const closeBtn = sheet.querySelector('#mobileNavCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeMobileNav);
    }

    // Auto-close when clicking internal navigation links
    sheet.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (!link.getAttribute('target')) {
          closeMobileNav();
        }
      });
    });

    // Touch Swipe-Up / Pull to dismiss gesture
    let touchStartY = 0;
    let touchEndY = 0;
    sheet.addEventListener('touchstart', (e) => {
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    sheet.addEventListener('touchend', (e) => {
      touchEndY = e.changedTouches[0].screenY;
      if (touchStartY - touchEndY > 80 && sheet.scrollTop <= 0) {
        closeMobileNav();
      }
    }, { passive: true });

    // ESC key closes drawer
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeMobileNav();
      }
    });
  }

  initMobileNavigation();

  // Dynamic Island Navbar Scroll Elevation Controller
  const mainNavEl = document.getElementById('nav') || document.querySelector('nav');
  if (mainNavEl) {
    const handleNavScroll = () => {
      if (window.scrollY > 24) {
        mainNavEl.classList.add('is-scrolled');
      } else {
        mainNavEl.classList.remove('is-scrolled');
      }
    };
    window.addEventListener('scroll', handleNavScroll, { passive: true });
    handleNavScroll();
  }

  // =========================================================================
  // 2. LENIS SMOOTH SCROLLING ENGINE (Synchronized with GSAP)
  // =========================================================================
  let lenis;
  if (typeof Lenis !== 'undefined' && !prefersReducedMotion) {
    lenis = new Lenis({
      duration: 0.95,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
    });

    if (typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(500, 33);
    } else {
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }
  }

  // =========================================================================
  // SMOOTH APPLE-GRADE PAGE TRANSITIONS & INSTANT PRE-FETCH ENGINE
  // =========================================================================
  function initPageTransitions() {
    // 1. Create or bind high-performance Apple Dynamic Island Transition Curtain
    let curtain = document.querySelector('.page-transition-curtain');
    if (!curtain) {
      curtain = document.createElement('div');
      curtain.className = 'page-transition-curtain';
      curtain.innerHTML = `
        <div class="page-transition-capsule">
          <div class="page-transition-spinner"></div>
          <span class="page-transition-label">Benyamin.Design</span>
        </div>
      `;
      document.body.appendChild(curtain);
    }

    // Dismiss curtain smoothly on load / bfcache restore
    const dismissCurtain = () => {
      if (curtain) {
        curtain.classList.remove('is-active');
      }
    };

    window.addEventListener('pageshow', dismissCurtain);
    requestAnimationFrame(dismissCurtain);

    // 2. High-Velocity Link Pre-fetching on Hover / Touch (0ms Navigation Lag)
    const prefetchedUrls = new Set();
    function prefetchUrl(url) {
      if (!url || prefetchedUrls.has(url) || url.startsWith('#') || url.startsWith('javascript:')) return;
      const cleanUrl = url.split('?')[0].toLowerCase();
      if (cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.pdf') || cleanUrl.endsWith('.zip') || cleanUrl.endsWith('.mp3')) return;
      prefetchedUrls.add(url);
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    }

    document.addEventListener('pointerenter', (e) => {
      const a = e.target.closest('a');
      if (a && a.href && a.origin === window.location.origin && !a.href.includes('#')) {
        prefetchUrl(a.href);
      }
    }, { passive: true, capture: true });

    document.addEventListener('touchstart', (e) => {
      const a = e.target.closest('a');
      if (a && a.href && a.origin === window.location.origin && !a.href.includes('#')) {
        prefetchUrl(a.href);
      }
    }, { passive: true, capture: true });

    // 3. Intercept internal page navigation links for silky Apple-grade transition
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // Ignore in-page anchors, external links, downloads, new tabs, and modifier keys
      if (
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:') ||
        link.target === '_blank' ||
        link.getAttribute('download') !== null ||
        e.ctrlKey || e.metaKey || e.shiftKey || e.altKey
      ) {
        return;
      }

      // Check if internal navigation target
      const isInternal = !href.startsWith('http') || href.includes(window.location.hostname);
      if (isInternal && (href.endsWith('.html') || !href.includes('.'))) {
        e.preventDefault();
        playButtonClick();

        if (document.startViewTransition) {
          curtain.classList.add('is-active');
          setTimeout(() => {
            window.location.href = href;
          }, 110);
        } else {
          curtain.classList.add('is-active');
          setTimeout(() => {
            window.location.href = href;
          }, 110);
        }
      }
    });

    // 4. Smooth scroll for internal in-page anchor links (#section)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '') return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          playButtonClick();
          if (lenis) {
            lenis.scrollTo(target, { offset: -80 });
          } else {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
  }

  initPageTransitions();

  // =========================================================================
  // 3. HERO & SECTION SCROLL REVEAL ANIMATIONS (GSAP ScrollTrigger)
  // Mobile-Optimized · Hardware Accelerated · Zero Vanishing
  // =========================================================================
  function initScrollAnimations() {
    if (typeof gsap === 'undefined' || prefersReducedMotion) return;

    const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window && window.innerWidth <= 1024);

    // 3.1 Hero Text Entrance Animation (Instant on page load)
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
      gsap.fromTo(['.hero-rating-pill', '.hero-title', '.hero-lead', '.hero-actions-row'],
        { y: isMobile ? 16 : 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.75, stagger: 0.1, ease: 'power3.out', clearProps: 'opacity,transform' }
      );
    }

    if (typeof ScrollTrigger === 'undefined') return;

    // 3.2 Video Presentation Stage Scroll-Appear & 3D Unfold Animation
    const stageWrap = document.querySelector('.hero-stage-wrap');
    const deviceStage = document.querySelector('.hero-device-stage');

    if (stageWrap && deviceStage) {
      if (isMobile) {
        // Mobile: Gentle fade-in without extreme 3D rotations for instant GPU clarity
        gsap.fromTo(deviceStage,
          { y: 20, opacity: 0.8 },
          {
            scrollTrigger: {
              trigger: stageWrap,
              start: 'top 92%',
              toggleActions: 'play none none none',
              once: true
            },
            y: 0,
            opacity: 1,
            duration: 0.65,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
          }
        );
      } else {
        // Desktop: Full 4K 3D unfold perspective
        gsap.set(deviceStage, {
          transformPerspective: 1200,
          transformOrigin: "center top",
          rotateX: 18,
          scale: 0.88,
          y: 60,
          opacity: 0.25,
          filter: 'blur(8px)'
        });

        gsap.to(deviceStage, {
          scrollTrigger: {
            trigger: stageWrap,
            start: 'top 92%',
            end: 'top 45%',
            scrub: 1.2,
            toggleActions: 'play none none reverse'
          },
          rotateX: 0,
          scale: 1.0,
          y: 0,
          opacity: 1,
          filter: 'blur(0px)',
          ease: 'power2.out'
        });
      }
    }

    // 3.3 Hero Exit Drift & Parallax (Desktop Only — disabled on mobile to prevent vanishing)
    const heroSection = document.querySelector('.hero-section');
    if (heroSection && !isMobile) {
      gsap.to(heroSection, {
        scrollTrigger: {
          trigger: heroSection,
          start: 'top top',
          end: 'bottom 15%',
          scrub: 1.2
        },
        y: -40,
        opacity: 0.4,
        ease: 'power2.out'
      });
    }

    // 3.4 Section-by-Section Viewport Appear & Fade In
    // Mobile: Reveal once and STAY visible (never vanish on scroll)
    // Desktop: Smooth reveal without abrupt bottom-cut reversals
    const contentSections = [
      {
        selector: '#featured-projects',
        header: '.featured-header-container, .featured-header-meta, .sec-tag, .section-h2, .section-desc',
        children: '.portfolio-card-item, .brand-real-card',
        stagger: 0.07
      },
      {
        selector: '#capabilities',
        header: '.capabilities-bento-section .sec-tag, .capabilities-bento-section .section-h2, .capabilities-bento-section .section-desc',
        children: '.bento-card',
        stagger: 0.08
      },
      {
        selector: '#testimonials',
        header: '.testimonials-header, .testimonials-header .sec-tag, .testimonials-header .section-h2, .testimonials-header .section-desc',
        children: '.testimonials-stage',
        stagger: 0.1
      },
      {
        selector: '#faq',
        header: '.faq-header-wrap .sec-tag, .faq-header-wrap .section-h2, .faq-header-wrap .section-desc',
        children: null,
        stagger: 0.08
      },
      {
        selector: '.cta-banner-section',
        header: '.cta-banner-title, .cta-banner-desc',
        children: '.cta-masterpiece-banner',
        stagger: 0.08
      },
      {
        selector: '.contact-blueprint-section',
        header: '.contact-hero-header',
        children: '.contact-card, .blueprint-card',
        stagger: 0.08
      }
    ];

    contentSections.forEach(secConfig => {
      const sec = document.querySelector(secConfig.selector);
      if (!sec) return;

      if (isMobile) {
        // MOBILE: Fast, reliable entrance that clears inline styles and NEVER reverses or hides
        gsap.fromTo(sec,
          { y: 16, opacity: 0 },
          {
            scrollTrigger: {
              trigger: sec,
              start: 'top 94%',
              toggleActions: 'play none none none',
              once: true
            },
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'power3.out',
            onComplete: () => {
              gsap.set(sec, { clearProps: 'opacity,transform,scale' });
            }
          }
        );

        if (secConfig.header) {
          const headerElems = sec.querySelectorAll(secConfig.header);
          if (headerElems.length > 0) {
            gsap.fromTo(headerElems,
              { y: 12, opacity: 0 },
              {
                scrollTrigger: {
                  trigger: sec,
                  start: 'top 92%',
                  toggleActions: 'play none none none',
                  once: true
                },
                y: 0,
                opacity: 1,
                duration: 0.55,
                stagger: 0.05,
                ease: 'power3.out',
                onComplete: () => {
                  gsap.set(headerElems, { clearProps: 'opacity,transform' });
                }
              }
            );
          }
        }

        if (secConfig.children) {
          const childElems = sec.querySelectorAll(secConfig.children);
          if (childElems.length > 0) {
            gsap.fromTo(childElems,
              { y: 16, opacity: 0 },
              {
                scrollTrigger: {
                  trigger: sec,
                  start: 'top 90%',
                  toggleActions: 'play none none none',
                  once: true
                },
                y: 0,
                opacity: 1,
                duration: 0.55,
                stagger: 0.05,
                ease: 'power3.out',
                onComplete: () => {
                  gsap.set(childElems, { clearProps: 'opacity,transform' });
                }
              }
            );
          }
        }
      } else {
        // DESKTOP: Apple-caliber entrance, staying permanently visible as user scrolls through
        gsap.fromTo(sec,
          { y: 35, opacity: 0, scale: 0.99 },
          {
            scrollTrigger: {
              trigger: sec,
              start: 'top 86%',
              toggleActions: 'play none none reverse'
            },
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: 'power3.out',
            onComplete: () => {
              gsap.set(sec, { clearProps: 'opacity,transform,scale' });
            }
          }
        );

        if (secConfig.header) {
          const headerElems = sec.querySelectorAll(secConfig.header);
          if (headerElems.length > 0) {
            gsap.fromTo(headerElems,
              { y: 22, opacity: 0 },
              {
                scrollTrigger: {
                  trigger: sec,
                  start: 'top 84%',
                  toggleActions: 'play none none reverse'
                },
                y: 0,
                opacity: 1,
                duration: 0.7,
                stagger: 0.07,
                ease: 'power3.out',
                onComplete: () => {
                  gsap.set(headerElems, { clearProps: 'opacity,transform' });
                }
              }
            );
          }
        }

        if (secConfig.children) {
          const childElems = sec.querySelectorAll(secConfig.children);
          if (childElems.length > 0) {
            gsap.fromTo(childElems,
              { y: 25, opacity: 0 },
              {
                scrollTrigger: {
                  trigger: sec,
                  start: 'top 82%',
                  toggleActions: 'play none none reverse'
                },
                y: 0,
                opacity: 1,
                duration: 0.7,
                stagger: secConfig.stagger || 0.08,
                ease: 'power3.out',
                onComplete: () => {
                  gsap.set(childElems, { clearProps: 'opacity,transform' });
                }
              }
            );
          }
        }
      }
    });

    // 3.5 Case Study Elements Scroll Reveal & Parallax
    if (document.querySelector('.case-study-hero-stage') || document.querySelector('.case-study-device-frame')) {
      gsap.fromTo('.case-study-breadcrumb, .case-study-hero-stage .hero-rating-pill, .case-study-hero-stage .hero-title, .case-study-hero-stage .hero-lead, .case-study-spec-bento',
        { y: isMobile ? 14 : 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.75, stagger: 0.08, ease: 'power3.out', clearProps: 'opacity,transform' }
      );

      const deviceFrame = document.querySelector('.case-study-device-frame');
      if (deviceFrame) {
        gsap.fromTo(deviceFrame,
          { y: isMobile ? 18 : 35, opacity: 0.85, scale: isMobile ? 1 : 0.98 },
          {
            scrollTrigger: {
              trigger: deviceFrame,
              start: 'top 92%',
              toggleActions: isMobile ? 'play none none none' : 'play none none reverse',
              once: isMobile
            },
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: 'power3.out',
            clearProps: 'opacity,transform'
          }
        );
      }

      const sectionCards = document.querySelectorAll('.case-study-section-card, .case-study-pagination');
      if (sectionCards.length > 0) {
        sectionCards.forEach(card => {
          gsap.fromTo(card,
            { y: isMobile ? 16 : 30, opacity: 0 },
            {
              scrollTrigger: {
                trigger: card,
                start: 'top 90%',
                toggleActions: isMobile ? 'play none none none' : 'play none none reverse',
                once: isMobile
              },
              y: 0,
              opacity: 1,
              duration: 0.7,
              ease: 'power3.out',
              clearProps: 'opacity,transform'
            }
          );
        });
      }
    }
  }

  // =========================================================================
  // 4. HERO STAGE VIDEO PLAYER & INTERACTIVE TAB CONTROLLER
  // =========================================================================
  const prototypeCanvas = document.getElementById('prototypeCanvas');

  const tabContents = {
    spatial: `
      <video src="FIVER AD FINAL.mp4" poster="assets/graphico-web-engine.jpg" preload="none" loop muted playsinline class="hero-stage-video" id="heroVideoPlayer"></video>
      <div class="video-live-badge">
        <span class="live-dot"></span>
        <span>4K VIDEO PRESENTATION</span>
      </div>
      <div class="video-control-bar">
        <div class="video-btn-group">
          <button class="video-play-btn" id="videoPlayBtn" title="Play/Pause"><i class="fa-solid fa-pause"></i></button>
          <button class="video-mute-btn" id="videoMuteBtn" title="Mute/Unmute"><i class="fa-solid fa-volume-xmark"></i></button>
          <span>Showcase_Presentation.mp4</span>
        </div>
        <span class="tabular-nums" style="color:var(--apple-sky);">60 FPS · 4K Cinema Stage</span>
      </div>
    `,
    ai: `
      <div style="padding:2.5rem; height:100%; display:flex; flex-direction:column; justify-content:space-between; font-family:var(--font-mono); font-size:0.88rem; color:#A1A1A6; background:#0B0B0D; border-radius:var(--radius-md);">
        <div>
          <div style="color:var(--apple-green); margin-bottom:0.8rem; font-size:0.85rem;">// Modern High-Performance Web &amp; API Architecture</div>
          <div style="color:#FFF; font-weight:700; font-size:1.05rem;">POST /api/v1/automation/pipeline</div>
          <pre style="color:#86868B; margin-top:1rem; font-size:0.82rem; line-height:1.6; background:rgba(255,255,255,0.03); padding:1rem; border-radius:8px;">
{
  "project": "Graphic, Web &amp; AI Automation Suite",
  "status": "Production Ready",
  "web_tier": "Responsive Component Architecture &amp; Edge Routing",
  "automation_nodes": "n8n Webhook Pipeline + LLM Agent Orchestration",
  "latency": "22ms · 99.99% Uptime"
}</pre>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.1); padding-top:1rem;">
          <span style="color:#34C759;">● Web Core Online (Zero Latency)</span>
          <span style="color:var(--apple-sky);">Full-Stack Web &amp; API Integration</span>
        </div>
      </div>
    `,
    tokens: `
      <div style="padding:2.5rem; height:100%; display:flex; flex-direction:column; justify-content:space-between; font-family:var(--font-mono); font-size:0.85rem; background:#0B0B0D; border-radius:var(--radius-md);">
        <div>
          <div style="color:var(--apple-sky); margin-bottom:1rem; font-size:0.85rem;">// Graphic Design &amp; Visual Identity System</div>
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:1rem;">
            <div style="padding:1rem; background:#0071E3; color:#FFF; border-radius:10px; font-weight:700;">Brand Accent<br><span style="font-size:0.75rem; opacity:0.85;">#0071E3</span></div>
            <div style="padding:1rem; background:#161619; color:#FFF; border:1px solid rgba(255,255,255,0.25); border-radius:10px; font-weight:700;">Obsidian Glass<br><span style="font-size:0.75rem; opacity:0.85;">#161619</span></div>
            <div style="padding:1rem; background:#34C759; color:#000; border-radius:10px; font-weight:700;">Success Green<br><span style="font-size:0.75rem; opacity:0.85;">#34C759</span></div>
          </div>
        </div>
        <div style="color:var(--ink-dark-secondary); font-size:0.82rem; border-top:1px solid rgba(255,255,255,0.1); padding-top:1rem;">
          ✦ Precision Vector Layouts · Liquid Specular Glass · Human Interface Standards
        </div>
      </div>
    `
  };

  function bindVideoControls() {
    const heroVideo = document.getElementById('heroVideoPlayer');
    const videoPlayBtn = document.getElementById('videoPlayBtn');
    const videoMuteBtn = document.getElementById('videoMuteBtn');

    if (heroVideo && videoPlayBtn) {
      videoPlayBtn.addEventListener('click', () => {
        if (heroVideo.paused) {
          heroVideo.play();
          videoPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        } else {
          heroVideo.pause();
          videoPlayBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
      });
    }

    if (heroVideo && videoMuteBtn) {
      videoMuteBtn.addEventListener('click', () => {
        heroVideo.muted = !heroVideo.muted;
        videoMuteBtn.innerHTML = heroVideo.muted 
          ? '<i class="fa-solid fa-volume-xmark"></i>' 
          : '<i class="fa-solid fa-volume-high"></i>';
      });
    }
  }

  bindVideoControls();

  // Unified global switcher for both top tab pills and bottom filter chips
  window.switchStageTab = function(target) {
    if (!prototypeCanvas || !tabContents[target]) return;

    playTactileClick(700, 'sine', 0.03);

    // Update top tabs
    document.querySelectorAll('.stage-tab-btn').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-tab') === target);
    });

    // Update bottom chips
    const chipMap = {
      spatial: '.chip-ai',
      ai: '.chip-web',
      tokens: '.chip-graphic'
    };

    document.querySelectorAll('.stage-filter-chip').forEach(c => c.classList.remove('active'));
    if (chipMap[target]) {
      const activeChip = document.querySelector(chipMap[target]);
      if (activeChip) activeChip.classList.add('active');
    }

    // Replace canvas content
    prototypeCanvas.innerHTML = tabContents[target];

    if (target === 'spatial') {
      bindVideoControls();
    }
  };

  // Top tab buttons click handler
  document.querySelectorAll('.stage-tab-btn').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      window.switchStageTab(target);
    });
  });

  // =========================================================================
  // 5. INITIALIZE SCROLL ANIMATIONS & REFRESH SCROLLTRIGGER
  // =========================================================================
  initScrollAnimations();
  if (typeof ScrollTrigger !== 'undefined') {
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);
  }

  // =========================================================================
  // 7. BACK TO TOP & LIVE FOOTER STATS
  // =========================================================================
  const backToTop = document.getElementById('backToTop');
  const footerBackToTop = document.getElementById('footerBackToTop');

  function scrollToTop() {
    playTactileClick(700, 'sine', 0.04);
    if (lenis) {
      lenis.scrollTo(0);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  if (backToTop) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        backToTop.classList.add('show');
      } else {
        backToTop.classList.remove('show');
      }
    });
    backToTop.addEventListener('click', scrollToTop);
  }

  if (footerBackToTop) {
    footerBackToTop.addEventListener('click', scrollToTop);
  }

  // Update Footer Clock Live
  function updateFooterClock() {
    const clockElements = document.querySelectorAll('#footerClockTime');
    if (clockElements.length > 0) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      clockElements.forEach(el => {
        el.textContent = `${hours}:${mins} PHT`;
      });
    }
  }
  updateFooterClock();
  setInterval(updateFooterClock, 10000);

  // =========================================================================
  // 8. 4K CINEMA SHOWCASE VIDEO CONTROLLER (Fiverr Ad Video Engine)
  // =========================================================================
  const heroVideo = document.getElementById('heroVideoPlayer');
  const videoSoundBtn = document.getElementById('videoSoundBtn');
  const videoSoundIcon = document.getElementById('videoSoundIcon');
  const videoSoundText = document.getElementById('videoSoundText');

  if (heroVideo) {
    heroVideo.muted = true;
    let videoSourcesLoaded = false;

    const loadAndPlayHeroVideo = () => {
      if (!videoSourcesLoaded) {
        const sources = heroVideo.querySelectorAll('source');
        let needsLoad = false;
        sources.forEach(src => {
          if (src.dataset.src && !src.getAttribute('src')) {
            src.src = src.dataset.src;
            needsLoad = true;
          }
        });
        if (needsLoad) {
          heroVideo.load();
        }
        videoSourcesLoaded = true;
      }

      const playPromise = heroVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    };

    // Lazy load video stream with 300px lookahead margin & pause when offscreen
    if ('IntersectionObserver' in window) {
      const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            loadAndPlayHeroVideo();
          } else {
            if (videoSourcesLoaded) {
              heroVideo.pause();
            }
          }
        });
      }, { rootMargin: '300px 0px', threshold: 0.08 });

      videoObserver.observe(heroVideo);
    } else {
      loadAndPlayHeroVideo();
    }

    if (videoSoundBtn) {
      videoSoundBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playTactileClick(600, 'sine', 0.05);

        if (heroVideo.muted) {
          heroVideo.muted = false;
          if (videoSoundIcon) videoSoundIcon.className = 'fa-solid fa-volume-high';
          if (videoSoundText) videoSoundText.textContent = 'Mute Audio';
        } else {
          heroVideo.muted = true;
          if (videoSoundIcon) videoSoundIcon.className = 'fa-solid fa-volume-xmark';
          if (videoSoundText) videoSoundText.textContent = 'Unmute Audio';
        }
      });
    }
  }

  // =========================================================================
  // 5. CUSTOMER STORIES (GSAP 3-TIER INFINITE MARQUEE & SYNCED HOVER CONTROLLER)
  // =========================================================================
  function initCustomerStoriesMarquee() {
    const rowTop = document.getElementById('storiesRowTop');
    const rowMiddle = document.getElementById('storiesRowMiddle');
    const rowBottom = document.getElementById('storiesRowBottom');
    if (!rowTop || !rowMiddle || !rowBottom || typeof gsap === 'undefined') return;

    // Clone groups in all three rows to guarantee endless, seamless looping
    [rowTop, rowMiddle, rowBottom].forEach(row => {
      const group = row.querySelector('.stories-track-group');
      if (group) {
        const clone1 = group.cloneNode(true);
        const clone2 = group.cloneNode(true);
        row.appendChild(clone1);
        row.appendChild(clone2);
      }
    });

    requestAnimationFrame(() => {
      const groupTop = rowTop.querySelector('.stories-track-group');
      const groupMiddle = rowMiddle.querySelector('.stories-track-group');
      const groupBottom = rowBottom.querySelector('.stories-track-group');
      if (!groupTop || !groupMiddle || !groupBottom) return;

      const getWidthTop = () => groupTop.offsetWidth;
      const getWidthMiddle = () => groupMiddle.offsetWidth;
      const getWidthBottom = () => groupBottom.offsetWidth;

      // Row 1 (Top): Pans slowly to the left
      const tweenTop = gsap.fromTo(rowTop,
        { x: 0 },
        {
          x: () => -getWidthTop(),
          duration: 38,
          ease: "none",
          repeat: -1
        }
      );

      // Row 2 (Middle): Pans slowly to the right
      const tweenMiddle = gsap.fromTo(rowMiddle,
        { x: () => -getWidthMiddle() },
        {
          x: 0,
          duration: 44,
          ease: "none",
          repeat: -1
        }
      );

      // Row 3 (Bottom): Pans slowly to the left
      const tweenBottom = gsap.fromTo(rowBottom,
        { x: 0 },
        {
          x: () => -getWidthBottom(),
          duration: 36,
          ease: "none",
          repeat: -1
        }
      );

      const allTweens = [tweenTop, tweenMiddle, tweenBottom];

      // Synchronized Hover Interactions:
      // Hovering any individual card pauses ALL three rows and scales that card up to 1.03
      const allCards = document.querySelectorAll('.story-card');
      allCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
          allTweens.forEach(t => t.pause());
          card.classList.add('is-hovered');
          gsap.to(card, {
            scale: 1.03,
            duration: 0.28,
            ease: "power2.out"
          });
        });

        card.addEventListener('mouseleave', () => {
          card.classList.remove('is-hovered');
          gsap.to(card, {
            scale: 1,
            duration: 0.28,
            ease: "power2.out",
            onComplete: () => {
              // Gracefully resume marquee motion across all 3 rows
              allTweens.forEach(t => t.play());
            }
          });
        });
      });

      // Recalculate dimensions smoothly on viewport resize
      window.addEventListener('resize', () => {
        allTweens.forEach(t => t.invalidate());
      });

      // Viewport Optimization: only tick GSAP marquee tweens when section is visible
      const testimonialsSection = document.getElementById('testimonials') || rowTop.closest('section');
      if (testimonialsSection && 'IntersectionObserver' in window) {
        const storiesObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              allTweens.forEach(t => t.play());
            } else {
              allTweens.forEach(t => t.pause());
            }
          });
        }, { threshold: 0.05 });
        storiesObserver.observe(testimonialsSection);
      }
    });
  }

  initCustomerStoriesMarquee();

  // =========================================================================
  // 6. FLOATING DARK-MODE FOOTER CARD CONTROLLER (GSAP ScrollTrigger & Magnetic)
  // =========================================================================
  function initFloatingDarkFooter() {
    const footer = document.getElementById('designerFooter') || document.getElementById('floatingDarkFooter');
    if (!footer || typeof gsap === 'undefined') return;

    // 1. Scroll Reveal: Slide up from y: 100px and fade in with ScrollTrigger
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.fromTo(footer,
        { y: 100, opacity: 0 },
        {
          scrollTrigger: {
            trigger: '.floating-footer-wrapper',
            start: 'top 88%',
            toggleActions: 'play none none none'
          },
          y: 0,
          opacity: 1,
          duration: 1.1,
          ease: 'power3.out'
        }
      );
    }

    // 2. Social Link Hover: Diagonal arrow animate up-right + neon accent color
    const socialLinks = footer.querySelectorAll('.footer-social-link');
    socialLinks.forEach(link => {
      const arrow = link.querySelector('.social-diagonal-arrow');
      if (arrow) {
        link.addEventListener('mouseenter', () => {
          gsap.to(arrow, {
            x: 4,
            y: -4,
            color: '#00E5FF',
            duration: 0.22,
            ease: 'power2.out'
          });
        });
        link.addEventListener('mouseleave', () => {
          gsap.to(arrow, {
            x: 0,
            y: 0,
            color: '#FF7A00',
            duration: 0.22,
            ease: 'power2.out'
          });
        });
      }
    });

    // 3. Magnetic Physics on Central Pill Buttons
    const magneticBtns = footer.querySelectorAll('.magnetic-btn');
    magneticBtns.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = (e.clientX - centerX) * 0.32;
        const deltaY = (e.clientY - centerY) * 0.32;

        gsap.to(btn, {
          x: deltaX,
          y: deltaY,
          duration: 0.3,
          ease: 'power2.out'
        });
      });

      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: 'elastic.out(1, 0.4)'
        });
      });
    });

    // 4. Copy Email Action
    const copyEmailBtn = document.getElementById('copyEmailBtn');
    const copyEmailText = document.getElementById('copyEmailText');
    if (copyEmailBtn && copyEmailText) {
      copyEmailBtn.addEventListener('click', () => {
        const email = 'benyaminnamtalashvili726@gmail.com';
        navigator.clipboard.writeText(email).then(() => {
          copyEmailText.textContent = 'Copied! ✓';
          copyEmailBtn.style.borderColor = '#00FF7F';
          copyEmailBtn.style.color = '#00FF7F';
          setTimeout(() => {
            copyEmailText.textContent = 'Copy Email';
            copyEmailBtn.style.borderColor = '';
            copyEmailBtn.style.color = '';
          }, 2200);
        }).catch(() => {
          copyEmailText.textContent = 'Copied! ✓';
          setTimeout(() => { copyEmailText.textContent = 'Copy Email'; }, 2000);
        });
      });
    }
  }

  // =========================================================================
  // 12. MODELING PORTFOLIO INTERACTIVE BURST BUTTON (GSAP PHYSICS)
  // =========================================================================
  function initModelingBurstButton() {
    const wrappers = document.querySelectorAll('.modeling-burst-wrapper, .burst-btn-container');
    if (!wrappers.length || typeof gsap === 'undefined') return;

    wrappers.forEach((wrapper) => {
      const btn = wrapper.querySelector('.modeling-burst-btn, .modeling-btn-pill');
      const glasses = wrapper.querySelector('.pop-icon-glasses');
      const sunglasses = wrapper.querySelector('.pop-icon-sunglasses');
      const star = wrapper.querySelector('.pop-icon-star');
      const camera = wrapper.querySelector('.pop-icon-camera');

      if (!btn || !glasses || !sunglasses || !star || !camera) return;

      // Force hardware acceleration and initialize dead-center behind main button
      gsap.set([glasses, sunglasses, star, camera], {
        xPercent: -50,
        yPercent: -50,
        x: 0,
        y: 0,
        scale: 0,
        opacity: 0,
        transformOrigin: '50% 50%',
        force3D: true
      });

      gsap.set(btn, {
        force3D: true
      });

      let currentTl = null;

      btn.addEventListener('mouseenter', () => {
        if (currentTl) currentTl.kill();

        currentTl = gsap.timeline();

        // 1. Soft glowing orange drop shadow
        currentTl.to(btn, {
          boxShadow: '0 12px 32px rgba(255, 69, 0, 0.38), 0 0 20px rgba(255, 69, 0, 0.22)',
          duration: 0.35,
          ease: 'power2.out'
        }, 0);

        // 2. Burst eruption to four corners with spring-like elastic easing
        // Top-Left: Black Sunglasses
        currentTl.to(sunglasses, {
          x: -115,
          y: -52,
          rotation: -12,
          scale: 1,
          opacity: 1,
          duration: 0.85,
          ease: 'elastic.out(1, 0.6)'
        }, 0);

        // Top-Right: Black Glasses
        currentTl.to(glasses, {
          x: 115,
          y: -52,
          rotation: 12,
          scale: 1,
          opacity: 1,
          duration: 0.85,
          ease: 'elastic.out(1, 0.6)'
        }, 0);

        // Bottom-Left: Solid Orange Star
        currentTl.to(star, {
          x: -105,
          y: 52,
          rotation: -18,
          scale: 1,
          opacity: 1,
          duration: 0.85,
          ease: 'elastic.out(1, 0.6)'
        }, 0);

        // Bottom-Right: Solid Orange Camera
        currentTl.to(camera, {
          x: 105,
          y: 52,
          rotation: 14,
          scale: 1,
          opacity: 1,
          duration: 0.85,
          ease: 'elastic.out(1, 0.6)'
        }, 0);
      });

      btn.addEventListener('mouseleave', () => {
        if (currentTl) currentTl.kill();

        currentTl = gsap.timeline();

        // Orange glow fades out
        currentTl.to(btn, {
          boxShadow: '0 4px 14px rgba(255, 69, 0, 0.08)',
          duration: 0.3,
          ease: 'power3.inOut'
        }, 0);

        // Rapidly suck four icons back to exact center (x: 0, y: 0), scale: 0, opacity: 0
        currentTl.to([sunglasses, glasses, star, camera], {
          x: 0,
          y: 0,
          rotation: 0,
          scale: 0,
          opacity: 0,
          duration: 0.32,
          ease: 'power3.inOut'
        }, 0);
      });
    });
  }

  // =========================================================================
  // TACTILE 3D "SKILL COMPARISON" GSAP PINNED STACKING DECK ENGINE
  // Phase 3: Pinned ScrollTrigger -> Sticky Stacking Deck -> Scale Down & Dim
  // =========================================================================
  function initSkillComparisonAnimation() {
    const section = document.querySelector('#skill-comparison');
    if (!section) return;

    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const layers = gsap.utils.toArray(section.querySelectorAll('.stack-card-layer'));
    if (!layers.length) return;

    const header = section.querySelector('.tactile-header');
    const timeline = section.querySelector('#tactileTimelineDeck');
    const axisLine = section.querySelector('#tactileAxisLine');
    const rightCards = section.querySelectorAll('.tactile-card-right');

    // Force GPU hardware acceleration on all animatable layer elements
    gsap.set(layers, {
      force3D: true,
      willChange: 'transform, opacity, filter'
    });

    // Initial state: Layer 0 sits at center; Layers 1..N start translated down offscreen
    layers.forEach((layer, i) => {
      if (i === 0) {
        gsap.set(layer, {
          yPercent: 0,
          opacity: 1,
          scale: 1,
          filter: 'brightness(1)'
        });
      } else {
        gsap.set(layer, {
          yPercent: 120,
          opacity: 0,
          scale: 1,
          filter: 'brightness(1)'
        });
      }
    });

    // === HEADER EXIT ANIMATION ===
    // Fade + slide the header up and out as user scrolls toward the cards
    // Triggers when the section enters the upper 30% of viewport
    if (header) {
      gsap.to(header, {
        scrollTrigger: {
          trigger: section,
          start: 'top 30%',
          end: 'top -5%',
          scrub: 0.6,
          invalidateOnRefresh: true
        },
        y: -40,
        opacity: 0,
        scale: 0.97,
        ease: 'none'
      });
    }

    // === PINNED STACKING DECK ===
    // Pin the card DECK (tactile-timeline) when IT reaches the top of the viewport.
    // By that point, the header text has already scrolled off-screen naturally.
    const pinTarget = timeline || section;
    const pinTl = gsap.timeline({
      scrollTrigger: {
        trigger: pinTarget,
        start: 'top top',           // deck top hits viewport top = header already gone
        end: `+=${(layers.length - 1) * 800}`,  // ~800px scroll per card transition
        pin: true,
        pinSpacing: true,
        scrub: 0.85,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onEnter: () => {
          // Optionally lock scroll offset so header space is respected
          if (header) gsap.set(header, { visibility: 'hidden' });
        },
        onLeaveBack: () => {
          if (header) gsap.set(header, { visibility: 'visible' });
        }
      }
    });

    // 1. Central axis line smooth progression
    if (axisLine) {
      pinTl.fromTo(
        axisLine,
        { scaleY: 0.4, transformOrigin: 'top center' },
        { scaleY: 1, duration: 0.4, ease: 'none' },
        0
      );
    }

    // 2. Cascade through each remaining card layer (Index 1 to 4)
    layers.forEach((layer, i) => {
      if (i === 0) return;

      const stepTime = (i - 1) * 1.5;

      // Current incoming card slides up into pinned center position
      pinTl.to(layer, {
        yPercent: 0,
        opacity: 1,
        duration: 1.2,
        ease: 'power2.out'
      }, stepTime);

      // Previous cards in the stack scale down & subtly darken
      for (let j = 0; j < i; j++) {
        const prevLayer = layers[j];
        const depth = i - j;
        const targetScale = Math.max(0.85, 1 - depth * 0.045);
        const targetY = -depth * 14;
        const targetBrightness = Math.max(0.68, 1 - depth * 0.08);

        pinTl.to(prevLayer, {
          scale: targetScale,
          y: targetY,
          filter: `brightness(${targetBrightness})`,
          duration: 1.2,
          ease: 'power2.out'
        }, stepTime);
      }
    });

    // 3. Interactive Physical 3D Hover State for "My Capabilities" cards
    rightCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        gsap.to(card, {
          y: -4,
          boxShadow: '0 4px 8px rgba(0,0,0,0.03), 0 16px 36px -4px rgba(0,0,0,0.11), 0 24px 48px -12px rgba(0,0,0,0.06), inset 0 1.5px 1px 0 rgba(255,255,255,0.95)',
          duration: 0.25,
          ease: 'power2.out'
        });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          y: 0,
          boxShadow: '0 2px 4px rgba(0,0,0,0.025), 0 8px 24px -4px rgba(0,0,0,0.06), 0 18px 42px -8px rgba(0,0,0,0.05), inset 0 1.5px 1px 0 rgba(255,255,255,0.95)',
          duration: 0.3,
          ease: 'power2.out'
        });
      });
    });
  }


  // =========================================================================
  // FAQ ACCORDION + GSAP MOTION ENGINE — "The Curious Section"
  // Architecture: initFaqAccordion (toggle + hover) · initFaqGsapAnimations (scroll-in + parallax)
  // =========================================================================

  function initFaqAccordion() {
    const items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    // Set initial hidden state via GSAP (replaces CSS opacity:0 / translateY)
    if (!prefersReducedMotion) {
      gsap.set(items, { opacity: 0, y: 22, scale: 0.985 });
    }

    items.forEach(item => {
      const btn     = item.querySelector('.faq-question');
      const answer  = item.querySelector('.faq-answer');
      const toggle  = item.querySelector('.faq-toggle');
      const num     = item.querySelector('.faq-num');
      const plusIcon  = item.querySelector('.faq-icon-plus');
      const minusIcon = item.querySelector('.faq-icon-minus');
      if (!btn || !answer) return;

      // ── Hover: magnetic lift + number spring scale ──
      item.addEventListener('mouseenter', () => {
        if (item.classList.contains('is-open')) return; // open state owns transform
        if (prefersReducedMotion) return;
        gsap.to(item, {
          y: -4,
          boxShadow: '0 8px 40px rgba(255,107,0,0.14), 0 2px 8px rgba(0,0,0,0.05)',
          borderColor: 'rgba(255,107,0,0.35)',
          duration: 0.35,
          ease: 'power3.out'
        });
        if (num) {
          gsap.to(num, { scale: 1.25, color: '#FF4500', duration: 0.25, ease: 'back.out(2)' });
        }
      });

      item.addEventListener('mouseleave', () => {
        if (item.classList.contains('is-open')) return;
        if (prefersReducedMotion) return;
        gsap.to(item, {
          y: 0,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          borderColor: 'rgba(0,0,0,0.09)',
          duration: 0.45,
          ease: 'power3.out'
        });
        if (num) {
          gsap.to(num, { scale: 1, color: 'var(--apple-blue)', duration: 0.25, ease: 'power2.out' });
        }
      });

      // ── Click: open / close accordion ──
      btn.addEventListener('click', () => {
        const isCurrentlyOpen = item.classList.contains('is-open');

        // Close ALL items first
        items.forEach(other => {
          if (other === item) return;
          if (!other.classList.contains('is-open')) return;

          const otherAnswer  = other.querySelector('.faq-answer');
          const otherToggle  = other.querySelector('.faq-toggle');
          const otherPlusIcon  = other.querySelector('.faq-icon-plus');
          const otherMinusIcon = other.querySelector('.faq-icon-minus');
          const otherBtn = other.querySelector('.faq-question');

          other.classList.remove('is-open');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');

          // Close animation
          if (!prefersReducedMotion) {
            if (otherAnswer) {
              gsap.to(otherAnswer, { height: 0, opacity: 0, paddingBottom: 0, duration: 0.38, ease: 'power3.inOut' });
            }
            if (otherToggle) {
              gsap.to(otherToggle, { rotation: 0, backgroundColor: 'var(--canvas-parchment)', borderColor: 'rgba(0,0,0,0.09)', color: 'var(--ink-secondary)', duration: 0.4, ease: 'power3.inOut' });
            }
            if (otherPlusIcon)  gsap.to(otherPlusIcon,  { opacity: 1, duration: 0.2 });
            if (otherMinusIcon) gsap.to(otherMinusIcon, { opacity: 0, duration: 0.2 });
            gsap.to(other, {
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              borderColor: 'rgba(0,0,0,0.09)',
              y: 0,
              duration: 0.35,
              ease: 'power3.out'
            });
          } else {
            // Reduced motion: instant state
            if (otherAnswer) gsap.set(otherAnswer, { height: 0, opacity: 0, paddingBottom: 0 });
          }
        });

        if (!isCurrentlyOpen) {
          // ── OPEN ──
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');

          if (!prefersReducedMotion) {
            // Precise height animation
            gsap.set(answer, { height: 'auto', opacity: 1, paddingBottom: '1.5rem' });
            const targetHeight = answer.offsetHeight;
            gsap.set(answer, { height: 0, opacity: 0, paddingBottom: 0 });
            gsap.to(answer, {
              height: targetHeight,
              opacity: 1,
              paddingBottom: '1.5rem',
              duration: 0.5,
              ease: 'power3.inOut'
            });

            // Toggle icon spring rotation + colour swap
            if (toggle) {
              gsap.to(toggle, { rotation: 180, backgroundColor: '#FF6B00', borderColor: '#FF6B00', color: '#fff', duration: 0.45, ease: 'back.out(1.4)' });
            }
            if (plusIcon)  gsap.to(plusIcon,  { opacity: 0, duration: 0.2 });
            if (minusIcon) gsap.to(minusIcon, { opacity: 1, duration: 0.2 });

            // Number pulse
            if (num) {
              gsap.fromTo(num,
                { scale: 1 },
                { scale: 1.18, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1 }
              );
            }

            // Card orange glow lift
            gsap.to(item, {
              boxShadow: '0 0 0 1.5px rgba(255,107,0,0.4), 0 14px 48px rgba(255,107,0,0.16)',
              y: -3,
              duration: 0.4,
              ease: 'power3.out'
            });
          } else {
            gsap.set(answer, { height: 'auto', opacity: 1, paddingBottom: '1.5rem' });
            if (toggle) gsap.set(toggle, { rotation: 180, backgroundColor: '#FF6B00', borderColor: '#FF6B00', color: '#fff' });
            if (plusIcon)  gsap.set(plusIcon,  { opacity: 0 });
            if (minusIcon) gsap.set(minusIcon, { opacity: 1 });
          }

        } else {
          // ── CLOSE ──
          item.classList.remove('is-open');
          btn.setAttribute('aria-expanded', 'false');

          if (!prefersReducedMotion) {
            gsap.to(answer, { height: 0, opacity: 0, paddingBottom: 0, duration: 0.38, ease: 'power3.inOut' });
            if (toggle) {
              gsap.to(toggle, { rotation: 0, backgroundColor: 'var(--canvas-parchment)', borderColor: 'rgba(0,0,0,0.09)', color: 'var(--ink-secondary)', duration: 0.4, ease: 'power3.inOut' });
            }
            if (plusIcon)  gsap.to(plusIcon,  { opacity: 1, duration: 0.2 });
            if (minusIcon) gsap.to(minusIcon, { opacity: 0, duration: 0.2 });
            gsap.to(item, {
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              borderColor: 'rgba(0,0,0,0.09)',
              y: 0,
              duration: 0.35,
              ease: 'power3.out'
            });
          } else {
            gsap.set(answer, { height: 0, opacity: 0, paddingBottom: 0 });
            if (toggle) gsap.set(toggle, { rotation: 0, backgroundColor: 'var(--canvas-parchment)', borderColor: 'rgba(0,0,0,0.09)', color: 'var(--ink-secondary)' });
            if (plusIcon)  gsap.set(plusIcon,  { opacity: 1 });
            if (minusIcon) gsap.set(minusIcon, { opacity: 0 });
          }
        }
      });

      // Keyboard passthrough (native <button> handles Enter/Space, explicit for clarity)
      btn.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
      });
    });
  }


  function initFaqGsapAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const section = document.querySelector('.faq-section');
    if (!section) return;

    // Reduced motion: show everything instantly
    if (prefersReducedMotion) {
      gsap.set('.faq-header-wrap > *', { opacity: 1, y: 0 });
      gsap.set('.faq-group-label',     { opacity: 1, x: 0 });
      gsap.set('.faq-item',            { opacity: 1, y: 0, scale: 1 });
      return;
    }

    // ── 1. Section Header: staggered cascade ──
    const headerChildren = section.querySelectorAll('.faq-eyebrow, .faq-serif-script, .faq-main-title, .faq-subtitle');
    gsap.set(headerChildren, { opacity: 0, y: 24 });

    gsap.to(headerChildren, {
      opacity: 1,
      y: 0,
      duration: 0.75,
      ease: 'power3.out',
      stagger: 0.13,
      scrollTrigger: {
        trigger: '.faq-header-wrap',
        start: 'top 82%',
        once: true
      }
    });

    // ── 2. Header parallax scrub ──
    gsap.to('.faq-header-wrap', {
      y: -30,
      ease: 'none',
      scrollTrigger: {
        trigger: '.faq-section',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5
      }
    });

    // ── 3. Group labels + items: per-group cascade ──
    const groups = section.querySelectorAll('.faq-group');
    groups.forEach((group, gi) => {
      const label = group.querySelector('.faq-group-label');
      const items = group.querySelectorAll('.faq-item');

      // Group label slides in from left
      if (label) {
        gsap.set(label, { opacity: 0, x: -14 });
        gsap.to(label, {
          opacity: 1,
          x: 0,
          duration: 0.55,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: group,
            start: 'top 85%',
            once: true
          }
        });
      }

      // Items cascade in
      if (items.length) {
        gsap.to(items, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.65,
          ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
          stagger: 0.09,
          scrollTrigger: {
            trigger: group,
            start: 'top 80%',
            once: true
          }
        });
      }
    });
  }


  // =========================================================================
  // GSAP NUMBER SCALING & COUNT-UP ANIMATION SYSTEM
  // Mobile-Resilient · Spring Bloom · Permanent Visibility · Micro-Interactions
  // =========================================================================
  function initNumberScalingAnimations() {
    if (typeof gsap === 'undefined' || prefersReducedMotion) return;

    const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window && window.innerWidth <= 1024);
    const toggleBehavior = isMobile ? 'play none none none' : 'play none none reverse';

    // 1. Proof Bar Numbers: 30+, 5/5, 100% (Scale Bloom + Numeric Count-Up)
    const proofBar = document.querySelector('.testimonials-proof-bar');
    const proofNums = document.querySelectorAll('.proof-bar-num');
    if (proofBar && proofNums.length > 0) {
      // Elastic Scale Bloom
      gsap.fromTo(proofNums,
        {
          scale: isMobile ? 0.7 : 0.25,
          opacity: 0,
          y: isMobile ? 10 : 20
        },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.12,
          ease: 'back.out(2)',
          scrollTrigger: {
            trigger: proofBar,
            start: 'top 92%',
            toggleActions: toggleBehavior,
            once: isMobile
          },
          onComplete: () => {
            gsap.set(proofNums, { clearProps: 'transform,scale,opacity' });
          }
        }
      );

      // Numeric counting animation synchronized with scale
      proofNums.forEach(numEl => {
        const originalText = numEl.textContent.trim();
        if (originalText.includes('30+')) {
          const obj = { val: 0 };
          gsap.to(obj, {
            val: 30,
            duration: 1.4,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: proofBar,
              start: 'top 92%',
              toggleActions: toggleBehavior,
              once: isMobile
            },
            onUpdate: () => {
              numEl.textContent = Math.round(obj.val) + '+';
            },
            onComplete: () => {
              numEl.textContent = '30+';
            }
          });
        } else if (originalText.includes('5/5')) {
          const obj = { val: 0 };
          gsap.to(obj, {
            val: 5,
            duration: 1.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: proofBar,
              start: 'top 92%',
              toggleActions: toggleBehavior,
              once: isMobile
            },
            onUpdate: () => {
              numEl.textContent = Math.round(obj.val) + '/5';
            },
            onComplete: () => {
              numEl.textContent = '5/5';
            }
          });
        } else if (originalText.includes('100%')) {
          const obj = { val: 0 };
          gsap.to(obj, {
            val: 100,
            duration: 1.5,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: proofBar,
              start: 'top 92%',
              toggleActions: toggleBehavior,
              once: isMobile
            },
            onUpdate: () => {
              numEl.textContent = Math.round(obj.val) + '%';
            },
            onComplete: () => {
              numEl.textContent = '100%';
            }
          });
        }
      });
    }

    // 2. FAQ Numbers (01 - 06): Elastic Spring Scale on Viewport Scroll
    const faqNums = document.querySelectorAll('.faq-num');
    if (faqNums.length > 0) {
      const faqSection = document.querySelector('.faq-section') || document.querySelector('.faq-container');
      if (faqSection) {
        gsap.fromTo(faqNums,
          {
            scale: isMobile ? 0.75 : 0.2,
            opacity: 0,
            rotation: isMobile ? 0 : -14
          },
          {
            scale: 1,
            opacity: 1,
            rotation: 0,
            duration: 0.7,
            stagger: 0.07,
            ease: 'back.out(2)',
            scrollTrigger: {
              trigger: faqSection,
              start: 'top 88%',
              toggleActions: toggleBehavior,
              once: isMobile
            },
            onComplete: () => {
              gsap.set(faqNums, { clearProps: 'transform,scale,opacity' });
            }
          }
        );
      }
    }

    // 3. Featured Index ("01 — 18"): Spring Pop
    const featuredIndex = document.querySelector('.featured-index-mono');
    if (featuredIndex) {
      gsap.fromTo(featuredIndex,
        {
          scale: 0.5,
          opacity: 0,
          x: 10
        },
        {
          scale: 1,
          opacity: 1,
          x: 0,
          duration: 0.75,
          ease: 'back.out(1.8)',
          scrollTrigger: {
            trigger: '.featured-header-container',
            start: 'top 88%',
            toggleActions: toggleBehavior,
            once: isMobile
          },
          onComplete: () => {
            gsap.set(featuredIndex, { clearProps: 'transform,scale,opacity' });
          }
        }
      );
    }
  }

  // =========================================================================
  // TESTIMONIALS MOBILE INTERACTION CONTROLLER
  // Smooth Touch-to-Pause, Pan-Y pass-through, Active Reader Feedback
  // =========================================================================
  function initTestimonialsMobileInteraction() {
    const stage = document.getElementById('testimonialsStage');
    if (!stage) return;

    let touchTimer = null;

    stage.addEventListener('touchstart', () => {
      clearTimeout(touchTimer);
      stage.classList.add('is-touch-paused');
    }, { passive: true });

    stage.addEventListener('touchend', () => {
      touchTimer = setTimeout(() => {
        stage.classList.remove('is-touch-paused');
      }, 700);
    }, { passive: true });

    stage.addEventListener('touchcancel', () => {
      stage.classList.remove('is-touch-paused');
    }, { passive: true });

    const cards = stage.querySelectorAll('.testi-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          stage.classList.toggle('is-touch-paused');
        }
      });
    });
  }

  initFloatingDarkFooter();
  initModelingBurstButton();
  initSkillComparisonAnimation();
  initFaqAccordion();
  initFaqGsapAnimations();
  initNumberScalingAnimations();
  initTestimonialsMobileInteraction();
});


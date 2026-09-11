/**
 * APPLE LIQUID GLASS SPATIAL PHOTO VIEWER (visionOS & macOS SEQUOIA)
 * 4-Tier Specular Rim Lighting · Dynamic Island · Spherical Liquid Glass Dials
 * Instant Fluid Keyboard Arrow Navigation · Interruptible Slide Morphing · 120fps Magnetic Cursor
 * Author: Benyamin Namtalashvili
 */

(function () {
  'use strict';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSpatialViewer);
  } else {
    initSpatialViewer();
  }

  function initSpatialViewer() {
    // 1. Inject visionOS Liquid Glass Floating Cursor Follower Pill
    let cursorBadge = document.getElementById('caseStudyCursorBadge');
    if (!cursorBadge) {
      cursorBadge = document.createElement('div');
      cursorBadge.id = 'caseStudyCursorBadge';
      cursorBadge.className = 'case-study-photo-cursor-badge';
      cursorBadge.innerHTML = '<i class="fa-solid fa-expand" aria-hidden="true"></i><span id="cursorBadgeLabel">View Photo</span>';
      document.body.appendChild(cursorBadge);
    }

    // 2. Inject Fullscreen Liquid Glass Spatial Lightbox Modal
    let lightbox = document.getElementById('caseStudyLightboxModal');
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.id = 'caseStudyLightboxModal';
      lightbox.className = 'case-study-lightbox-modal';
      lightbox.setAttribute('role', 'dialog');
      lightbox.setAttribute('aria-modal', 'true');
      lightbox.setAttribute('aria-label', 'Spatial Image Viewer');
      lightbox.innerHTML = `
        <!-- Dedicated Backdrop Click Interceptor -->
        <div class="lightbox-backdrop-layer" id="lightboxBackdrop" aria-hidden="true"></div>

        <!-- Floating Apple Dynamic Island Top Bar -->
        <div class="lightbox-dynamic-island" id="lightboxIsland" role="toolbar" aria-label="Viewer Controls">
          <div class="lightbox-island-left">
            <div class="lightbox-pulse-badge">
              <span class="lightbox-pulse-dot" aria-hidden="true"></span>
              <span id="lightboxCategory">CASE STUDY</span>
            </div>
            <span class="lightbox-counter-text" id="lightboxCounter">01 / 08</span>
            <span class="lightbox-caption-text" id="lightboxCaption">Spatial Preview</span>
          </div>

          <div class="lightbox-island-actions">
            <a id="lightboxOriginalLink" class="lightbox-icon-btn" target="_blank" rel="noopener noreferrer" title="View Full Original (O)" aria-label="Open Full Resolution">
              <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
            </a>
            <button id="lightboxZoomBtn" class="lightbox-icon-btn" title="Toggle Zoom (Z / Space)" aria-label="Toggle Zoom" type="button">
              <i class="fa-solid fa-magnifying-glass-plus" id="lightboxZoomIcon" aria-hidden="true"></i>
            </button>
            <button id="lightboxCloseBtn" class="lightbox-icon-btn close" title="Close (Esc)" aria-label="Close Viewer" type="button">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        <!-- Left & Right Fixed Viewport Spatial Navigation Dials -->
        <button class="lightbox-spatial-dial prev" id="lightboxPrevBtn" title="Previous Image (← or A)" aria-label="Previous Image" type="button">
          <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
        </button>
        <button class="lightbox-spatial-dial next" id="lightboxNextBtn" title="Next Image (→ or D)" aria-label="Next Image" type="button">
          <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        </button>

        <!-- Center Stage Viewport with Spatial Sliding Buffer -->
        <div class="lightbox-stage-wrap" id="lightboxStage">
          <div class="lightbox-img-container" id="lightboxImgContainer">
            <img id="lightboxMainImg" class="lightbox-main-img" src="" alt="Enlarged Case Study Photo" draggable="false"/>
          </div>
        </div>

        <!-- Bottom Floating Thumbnail Filmstrip Ribbon -->
        <div class="lightbox-thumbnail-tray" id="lightboxThumbTray" role="tablist" aria-label="Image Thumbnails"></div>
      `;
      document.body.appendChild(lightbox);
    }

    const backdropEl = document.getElementById('lightboxBackdrop');
    const islandEl = document.getElementById('lightboxIsland');
    const counterEl = document.getElementById('lightboxCounter');
    const captionEl = document.getElementById('lightboxCaption');
    const categoryEl = document.getElementById('lightboxCategory');
    const originalLinkEl = document.getElementById('lightboxOriginalLink');
    const mainImgEl = document.getElementById('lightboxMainImg');
    const closeBtnEl = document.getElementById('lightboxCloseBtn');
    const zoomBtnEl = document.getElementById('lightboxZoomBtn');
    const zoomIconEl = document.getElementById('lightboxZoomIcon');
    const prevBtnEl = document.getElementById('lightboxPrevBtn');
    const nextBtnEl = document.getElementById('lightboxNextBtn');
    const stageEl = document.getElementById('lightboxStage');
    const imgContainerEl = document.getElementById('lightboxImgContainer');
    const thumbTrayEl = document.getElementById('lightboxThumbTray');

    // UI Click Audio Feedback
    const clickSound = new Audio('u_o8xh7gwsrj-app_interface_click_2-476372.mp3');
    function playTactileFeedback() {
      try {
        clickSound.currentTime = 0;
        clickSound.volume = 0.18;
        clickSound.play().catch(() => {});
      } catch(e) {}
    }

    // 3. 120fps Magnetic Cursor Tracking
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let badgeX = mouseX;
    let badgeY = mouseY;
    let isHoveringZoomable = false;
    let isBadgeActive = false;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    function renderCursorBadge() {
      badgeX += (mouseX - badgeX) * 0.18;
      badgeY += (mouseY - badgeY) * 0.18;

      if (cursorBadge) {
        cursorBadge.style.left = `${badgeX}px`;
        cursorBadge.style.top = `${badgeY}px`;

        if (isHoveringZoomable && !isBadgeActive && !lightbox.classList.contains('open')) {
          cursorBadge.classList.add('active');
          isBadgeActive = true;
        } else if ((!isHoveringZoomable || lightbox.classList.contains('open')) && isBadgeActive) {
          cursorBadge.classList.remove('active');
          isBadgeActive = false;
        }
      }

      requestAnimationFrame(renderCursorBadge);
    }
    requestAnimationFrame(renderCursorBadge);

    // 4. Discover & Register All Showcase Images Across Case Study Pages
    let galleryItems = [];
    let currentIndex = 0;
    let isZoomed = false;
    let transitionCleanupTimer = null;

    function extractCategoryFromPage() {
      const pageTitle = (document.title || '').toLowerCase();
      const heading = (document.querySelector('h1')?.textContent || '').toLowerCase();
      const combined = `${pageTitle} ${heading}`;

      if (combined.includes('riveter') || combined.includes('tote') || combined.includes('pouch') || combined.includes('belt bag') || combined.includes('beltbag')) return 'R. RIVETER';
      if (combined.includes('brayne')) return 'BRAYNE DIGITAL';
      if (combined.includes('aviator')) return 'THE AVIATOR STORE';
      if (combined.includes('galera') || combined.includes('ace galera')) return 'DJ ACE GALERA';
      if (combined.includes('crystal') || combined.includes('white claw')) return 'CRYSTAL WHITE CLAW';
      if (combined.includes('estilo')) return 'ESTILO SALON';
      if (combined.includes('ohmnibus')) return 'OHMNIBUS FLEET';
      if (combined.includes('qonek')) return 'QONEK APP';
      if (combined.includes('tugon')) return 'TUGON SERVICE';
      if (combined.includes('ocean breeze') || combined.includes('ocean') || combined.includes('resort')) return 'OCEAN BREEZE RESORT';
      return 'CASE STUDY';
    }

    const currentBrandCategory = extractCategoryFromPage();
    if (categoryEl) categoryEl.textContent = currentBrandCategory;

    function buildGallery() {
      galleryItems = [];
      const foundImgs = Array.from(document.querySelectorAll(
        '.case-study-hero-stage img, .case-study-device-frame img, .case-study-section-card img, .case-study-photo-card img, .case-study-container img, [data-zoomable]'
      ));
      
      const filteredImgs = foundImgs.filter(img => {
        if (!img) return false;
        // Exclude lightbox UI elements, navigation headers, footers, and brand icons
        if (img.classList.contains('lightbox-main-img') ||
            img.closest('.lightbox-thumbnail-tray') ||
            img.closest('.lightbox-dynamic-island') ||
            img.closest('#nav') ||
            img.closest('footer') ||
            img.classList.contains('nav-brand-img') ||
            img.classList.contains('nav-logo-img') ||
            img.classList.contains('brand-real-logo')) {
          return false;
        }
        // Exclude decorative micro-icons
        if (img.width > 0 && img.width < 50) {
          return false;
        }
        return true;
      });

      // De-duplicate elements
      const uniqueImgs = [];
      const seen = new Set();
      filteredImgs.forEach(img => {
        if (!seen.has(img)) {
          seen.add(img);
          uniqueImgs.push(img);
        }
      });

      // Clear thumbnail tray
      if (thumbTrayEl) thumbTrayEl.innerHTML = '';

      uniqueImgs.forEach((img, idx) => {
        img.classList.add('case-study-zoomable-img');
        img.style.cursor = 'pointer';

        const parentCard = img.closest('.case-study-photo-card') || img.closest('.case-study-device-frame') || img.parentElement;
        if (parentCard && !parentCard.classList.contains('case-study-photo-card') && !parentCard.classList.contains('case-study-device-frame')) {
          parentCard.classList.add('case-study-photo-card');
        }

        const altTitle = img.getAttribute('data-caption') || img.getAttribute('alt') || `Showcase Photo 0${idx + 1}`;
        const item = {
          element: img,
          src: img.getAttribute('src') || '',
          alt: img.getAttribute('alt') || altTitle,
          title: altTitle
        };
        galleryItems.push(item);

        // Build thumbnail pill item
        if (thumbTrayEl) {
          const thumb = document.createElement('button');
          thumb.type = 'button';
          thumb.className = `lightbox-thumb-item ${idx === 0 ? 'active' : ''}`;
          thumb.setAttribute('aria-label', `Thumbnail for ${altTitle}`);
          thumb.innerHTML = `<img src="${item.src}" alt="${item.alt}" loading="lazy"/>`;
          thumb.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (currentIndex !== idx) {
              const direction = idx > currentIndex ? 'next' : 'prev';
              switchImageTo(idx, direction);
            }
          });
          thumbTrayEl.appendChild(thumb);
        }

        // Hover events for magnetic pill cursor
        img.addEventListener('mouseenter', () => { isHoveringZoomable = true; });
        img.addEventListener('mouseleave', () => { isHoveringZoomable = false; });

        // Direct image click to open lightbox
        img.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openLightbox(idx);
        });

        // Parent card click (safely ignoring links/buttons inside)
        if (parentCard && parentCard !== img) {
          parentCard.addEventListener('mouseenter', () => { isHoveringZoomable = true; });
          parentCard.addEventListener('mouseleave', () => { isHoveringZoomable = false; });
          parentCard.addEventListener('click', (e) => {
            if (e.target.closest('a') || e.target.closest('button')) {
              return;
            }
            if (e.target !== img) {
              e.preventDefault();
              openLightbox(idx);
            }
          });
        }
      });
    }

    buildGallery();

    // 5. Interruptible, Instant Fluid Image Navigation
    function switchImageTo(newIndex, direction = 'next') {
      if (!galleryItems.length) return;
      if (newIndex < 0 || newIndex >= galleryItems.length) {
        newIndex = (newIndex + galleryItems.length) % galleryItems.length;
      }
      if (newIndex === currentIndex && galleryItems.length > 1) return;

      if (transitionCleanupTimer) {
        clearTimeout(transitionCleanupTimer);
        transitionCleanupTimer = null;
      }

      resetZoom();
      playTactileFeedback();

      currentIndex = newIndex;
      updateHeaderAndMeta();

      const current = galleryItems[currentIndex];
      if (!current) return;

      const inClass = direction === 'next' ? 'slide-in-right' : 'slide-in-left';

      // Immediate image swap with forced hardware reflow for instant animation trigger
      mainImgEl.src = current.src;
      mainImgEl.alt = current.alt;

      mainImgEl.className = 'lightbox-main-img';
      void mainImgEl.offsetWidth; // Force CSS reflow
      mainImgEl.className = `lightbox-main-img ${inClass}`;

      transitionCleanupTimer = setTimeout(() => {
        mainImgEl.className = 'lightbox-main-img';
      }, 380);
    }

    function updateHeaderAndMeta() {
      const current = galleryItems[currentIndex];
      if (!current) return;

      const total = galleryItems.length;
      const formattedCur = String(currentIndex + 1).padStart(2, '0');
      const formattedTot = String(total).padStart(2, '0');

      if (counterEl) counterEl.textContent = `${formattedCur} / ${formattedTot}`;
      if (captionEl) {
        captionEl.textContent = current.title;
        captionEl.setAttribute('title', current.title);
      }
      if (originalLinkEl) originalLinkEl.setAttribute('href', current.src);

      // Update thumbnail active status & smoothly scroll active item into center
      if (thumbTrayEl) {
        const thumbs = thumbTrayEl.querySelectorAll('.lightbox-thumb-item');
        thumbs.forEach((t, i) => {
          if (i === currentIndex) {
            t.classList.add('active');
            t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          } else {
            t.classList.remove('active');
          }
        });
      }

      // Hide navigation arrows & thumbnails if only 1 image exists, otherwise ensure visible
      if (total <= 1) {
        if (prevBtnEl) prevBtnEl.style.display = 'none';
        if (nextBtnEl) nextBtnEl.style.display = 'none';
        if (thumbTrayEl) thumbTrayEl.style.display = 'none';
      } else {
        if (prevBtnEl) prevBtnEl.style.display = 'flex';
        if (nextBtnEl) nextBtnEl.style.display = 'flex';
        if (thumbTrayEl) thumbTrayEl.style.display = 'flex';
      }
    }

    // 6. Open & Close Lightbox
    function openLightbox(index) {
      if (!galleryItems.length || index < 0 || index >= galleryItems.length) return;
      currentIndex = index;
      isZoomed = false;
      resetZoom();

      const current = galleryItems[currentIndex];
      mainImgEl.src = current.src;
      mainImgEl.alt = current.alt;
      mainImgEl.className = 'lightbox-main-img';

      updateHeaderAndMeta();

      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
      isHoveringZoomable = false;
      playTactileFeedback();
    }

    function closeLightbox() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
      resetZoom();
      playTactileFeedback();
    }

    function prevImage() {
      if (galleryItems.length <= 1) return;
      const nextIdx = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
      switchImageTo(nextIdx, 'prev');
    }

    function nextImage() {
      if (galleryItems.length <= 1) return;
      const nextIdx = (currentIndex + 1) % galleryItems.length;
      switchImageTo(nextIdx, 'next');
    }

    function toggleZoom() {
      isZoomed = !isZoomed;
      if (isZoomed) {
        mainImgEl.classList.add('zoomed');
        zoomIconEl.className = 'fa-solid fa-magnifying-glass-minus';
        zoomBtnEl.setAttribute('title', 'Fit to Screen (Z)');
      } else {
        resetZoom();
      }
      playTactileFeedback();
    }

    function resetZoom() {
      isZoomed = false;
      mainImgEl.classList.remove('zoomed');
      zoomIconEl.className = 'fa-solid fa-magnifying-glass-plus';
      zoomBtnEl.setAttribute('title', 'Zoom 1.5x (Z)');
    }

    // Pan / Drag in Zoom Mode
    let isDragging = false;
    let startX = 0, startY = 0;
    let scrollLeft = 0, scrollTop = 0;

    stageEl.addEventListener('mousedown', (e) => {
      if (isZoomed && e.target === mainImgEl) {
        isDragging = true;
        startX = e.pageX - stageEl.offsetLeft;
        startY = e.pageY - stageEl.offsetTop;
        scrollLeft = stageEl.scrollLeft;
        scrollTop = stageEl.scrollTop;
      }
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging || !isZoomed) return;
      e.preventDefault();
      const x = e.pageX - stageEl.offsetLeft;
      const y = e.pageY - stageEl.offsetTop;
      const walkX = (x - startX) * 1.5;
      const walkY = (y - startY) * 1.5;
      stageEl.scrollLeft = scrollLeft - walkX;
      stageEl.scrollTop = scrollTop - walkY;
    });

    // Event Bindings for Dedicated Controls
    closeBtnEl.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeLightbox();
    });

    function bindButtonAction(btn, action) {
      if (!btn) return;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        action();
      });
      btn.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });
      btn.addEventListener('touchstart', (e) => {
        e.stopPropagation();
      }, { passive: true });
    }

    bindButtonAction(prevBtnEl, prevImage);
    bindButtonAction(nextBtnEl, nextImage);

    zoomBtnEl.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleZoom();
    });

    // Click main image to toggle zoom
    mainImgEl.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleZoom();
    });

    // Backdrop Click Handling: ONLY close if clicking directly on outer backdrop
    if (backdropEl) {
      backdropEl.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeLightbox();
      });
    }

    lightbox.addEventListener('click', (e) => {
      // Close only if click is directly on lightbox or backdrop layer, and not inside stage or controls
      if (e.target === lightbox || e.target === backdropEl) {
        closeLightbox();
      }
    });

    // Prevent backdrop close from clicks inside the island, stage, or tray
    islandEl.addEventListener('click', (e) => { e.stopPropagation(); });
    stageEl.addEventListener('click', (e) => {
      if (e.target === stageEl || e.target === imgContainerEl) {
        // Clicking empty margin in stage does NOT exit the photo view
        e.stopPropagation();
      }
    });
    thumbTrayEl.addEventListener('click', (e) => { e.stopPropagation(); });

    // High-Priority Global Keyboard Navigation
    window.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;

      const key = e.key;

      if (key === 'Escape') {
        e.preventDefault();
        closeLightbox();
      } else if (key === 'ArrowLeft' || key === 'a' || key === 'A' || key === 'h' || key === 'PageUp') {
        e.preventDefault();
        e.stopPropagation();
        prevImage();
      } else if (key === 'ArrowRight' || key === 'd' || key === 'D' || key === 'l' || key === 'PageDown') {
        e.preventDefault();
        e.stopPropagation();
        nextImage();
      } else if (key === ' ' || key === 'z' || key === 'Z') {
        e.preventDefault();
        e.stopPropagation();
        toggleZoom();
      } else if (key === 'o' || key === 'O') {
        e.preventDefault();
        if (galleryItems[currentIndex]) {
          window.open(galleryItems[currentIndex].src, '_blank');
        }
      }
    }, true);

    // Touch Gestures on Mobile (Smooth Horizontal Swipe with Momentum)
    let touchStartX = 0;
    let touchStartY = 0;

    stageEl.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    stageEl.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1 && !isZoomed) {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = e.changedTouches[0].clientY - touchStartY;

        if (Math.abs(deltaX) > 40 && Math.abs(deltaY) < 80) {
          if (deltaX > 0) {
            prevImage();
          } else {
            nextImage();
          }
        }
      }
    }, { passive: true });
  }
})();

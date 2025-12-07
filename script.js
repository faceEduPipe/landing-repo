/**
 * FACE [SYS 4.0]
 * MASTER CONTROLLER
 * Combines: Local Data Fetch + Visual Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  initSystem();
});

async function initSystem() {
  console.log('FACE [SYS] :: INITIALIZING...');

  try {
    // --- PHASE 1: DATA INGESTION ---
    const response = await fetch('./content.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    // --- PHASE 2: RENDERING ---
    if (data.global) updateGlobal(data.global);
    if (data.grid)   updateGrid(data.grid);
    if (data.tracks) updateTracks(data.tracks);
    if (data.method) updateMethod(data.method);

    // --- PHASE 3: VISUALS START ---
    // We only start animations AFTER HTML is generated
    initVisuals(); 
    
    console.log('FACE [SYS] :: SYSTEM READY.');

  } catch (error) {
    console.warn('FACE [SYS] :: OFFLINE MODE / DATA MISSING');
    console.error(error);
    // Even if data fails, try to start visuals for static content
    initVisuals(); 
  }
}

/* =========================================
   A. DATA UPDATER FUNCTIONS
   (These draw the HTML from your JSON)
   ========================================= */

function updateGlobal(content) {
  // 1. Hero Section
  safeHTML('h1.reveal-node', content.hero_headline);
  safeHTML('p.serif.reveal-node', content.hero_sub);
  safeText('a.cta-btn', content.cta_label);
  
  // 2. Social Links
  safeLink('.link-tiktok', content.link_tiktok);
  safeLink('.link-instagram', content.link_instagram);
  safeLink('.link-patreon', content.link_patreon);

  // 3. Section Headers
  safeText('#capabilities .section-headline', content.sec1_title); // "CORE FUNCTION"
  safeText('#manifest .section-headline', content.sec2_title);     // "DEPLOYMENT TRACKS"
  
  // --- ADD THIS LINE BELOW ---
  safeText('#method .section-headline', content.sec3_title);       // "OPERATING FRAMEWORK"
  
  // 4. Footer Email
  const emailBtn = document.querySelector('footer .cta-btn');
  if (emailBtn && content.footer_email) emailBtn.href = `mailto:${content.footer_email}`;
}

function updateGrid(items) {
  const container = document.querySelector('#capabilities .grid-container');
  if (!container) return;
  container.innerHTML = '';
  items.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = `grid-item reveal-node delay-${index + 1} visible`; // Auto-visible
    div.innerHTML = `
      <span class="index-marker">${item.marker}</span>
      <h2 class="grid-title">${item.title}</h2>
      <p class="grid-body">${item.desc}</p>
    `;
    container.appendChild(div);
  });
}

function updateTracks(tracks) {
  const container = document.getElementById('accordion-module');
  if (!container) return;
  container.innerHTML = '';
  tracks.forEach((track, index) => {
    // Note: We don't attach click listeners here anymore.
    // We let initVisuals() handle the logic once all items exist.
    const div = document.createElement('div');
    div.className = `acc-item ${index === 0 ? 'active' : ''}`;
    div.setAttribute('data-index', index);
    div.setAttribute('aria-expanded', index === 0);
    div.innerHTML = `
      <div class="acc-progress"><div class="acc-progress-fill"></div></div>
      <div class="acc-header">
        <h3 class="acc-title">${track.title}</h3>
        <span class="acc-meta">${track.meta}</span>
      </div>
      <div class="acc-body">
        <div class="acc-content-wrapper">
          <div class="acc-narrative"><p class="acc-desc">${track.desc}</p></div>
          <div class="acc-data-grid">
            <div class="data-row"><span class="data-key">Location</span><span class="data-val">${track.loc}</span></div>
            <div class="data-row"><span class="data-key">Attendees</span><span class="data-val">${track.attendees}</span></div>
            <div class="data-row"><span class="data-key">Duration</span><span class="data-val">${track.duration}</span></div>
            <div class="data-row"><span class="data-key">Frequency</span><span class="data-val">${track.freq}</span></div>
          </div>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

function updateMethod(steps) {
    // Optional: Add method section logic if you have it in JSON
}

/* =========================================
   B. VISUAL ENGINE (THEMES + ANIMATION)
   (Wrapped in a function to run LAST)
   ========================================= */

function initVisuals() {
  
  // 1. THEMES & SCROLL LOGIC
  const themes = {
    'default': { '--accent-acid': '#60A5FA', '--accent-acid-ghost': 'rgba(96, 165, 250, 0.2)', 'light': { '--bg-concrete': '#F4F6F8', '--ink-graphite': '#0F172A' }, 'dark': { '--bg-concrete': '#0F1C2E', '--ink-graphite': '#F8FAFC' } },
    'green': { '--accent-acid': '#34D399', '--accent-acid-ghost': 'rgba(52, 211, 153, 0.2)', 'light': { '--bg-concrete': '#F2F2F0', '--ink-graphite': '#111' }, 'dark': { '--bg-concrete': '#0F1C2E', '--ink-graphite': '#F8FAFC' } },
    'lavender': { '--accent-acid': '#A78BFA', '--accent-acid-ghost': 'rgba(167, 139, 250, 0.2)', 'light': { '--bg-concrete': '#F4F6F8', '--ink-graphite': '#0F172A' }, 'dark': { '--bg-concrete': '#0F1C2E', '--ink-graphite': '#F8FAFC' } }
  };
  
  let currentTheme = null; 
  let globalColorIndex = -1; 
  let lastActiveSection = null;
  const allowedCycle = ['default', 'green', 'lavender', 'default', 'green']; // Simplified cycle
  const darkSectionsIDs = ['hero', 'manifest']; 
  const stdSections = document.querySelectorAll('.std-section');

  function setTheme(themeName) {
    currentTheme = themeName;
    const root = document.documentElement;
    const themeData = themes[currentTheme];
    const isDark = document.body.classList.contains('dark-mode');
    if(!themeData) return;

    root.style.setProperty('--accent-acid', themeData['--accent-acid']);
    root.style.setProperty('--accent-acid-ghost', themeData['--accent-acid-ghost']);
    const modeData = isDark ? themeData.dark : themeData.light;
    root.style.setProperty('--bg-concrete', modeData['--bg-concrete']);
    root.style.setProperty('--ink-graphite', modeData['--ink-graphite']);
  }

  function updateTheme() {
    let max = 0, active = null;
    stdSections.forEach(sec => {
        const rect = sec.getBoundingClientRect();
        const visible = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
        if (visible > max) { max = visible; active = sec; }
    });

    if (active && active !== lastActiveSection) {
        lastActiveSection = active;
        globalColorIndex++; 
        let nextTheme = allowedCycle[globalColorIndex % allowedCycle.length];
        
        // Auto Dark Mode Logic
        const isFooter = active.tagName === 'FOOTER' || active.classList.contains('mega-footer');
        const shouldBeDark = darkSectionsIDs.includes(active.id) || active.classList.contains('hero') || isFooter;
        document.body.classList.toggle('dark-mode', shouldBeDark);
        
        setTheme(nextTheme);
    }
  }

  window.addEventListener('scroll', updateTheme);
  window.addEventListener('resize', updateTheme);
  updateTheme(); // Initial call

  // 2. ACCORDION LOGIC (Now safe to run because elements exist)
  const items = document.querySelectorAll('.acc-item');
  const stack = document.getElementById('accordion-module');
  
  if(items.length > 0) {
    let currentIndex = 0;
    let elapsed = 0;
    let isStopped = false;
    const intervalTime = 6000;
    const totalItems = items.length;

    function updateState(i) {
        items.forEach((item, idx) => {
            const active = idx === i;
            item.classList.toggle('active', active);
            item.setAttribute('aria-expanded', active);
            const bar = item.querySelector('.acc-progress-fill');
            if(bar) bar.style.height = active ? '0%' : '0%'; // Reset others
        });
        currentIndex = i;
    }

    function loop(ts) {
        if (!isStopped) {
            elapsed += 16; // Approx 60fps
            const percent = Math.min((elapsed / intervalTime) * 100, 100);
            const bar = items[currentIndex].querySelector('.acc-progress-fill');
            if (bar) bar.style.height = `${percent}%`;

            if (elapsed >= intervalTime) {
                elapsed = 0;
                updateState((currentIndex + 1) % totalItems);
            }
        }
        requestAnimationFrame(loop);
    }
    
    // Start Loop
    requestAnimationFrame(loop);

    // Click Interactions
    items.forEach((item, i) => {
        item.addEventListener('click', () => {
            isStopped = true;
            elapsed = 0;
            // Reset all bars
            items.forEach(it => { if(it.querySelector('.acc-progress-fill')) it.querySelector('.acc-progress-fill').style.height = '0%'; });
            updateState(i);
            // Fill current bar to show it's selected/stopped
            const bar = item.querySelector('.acc-progress-fill');
            if (bar) bar.style.height = '100%';
        });
    });

    if(stack){
        stack.addEventListener('mouseleave', () => {
            if (isStopped) {
                isStopped = false;
                elapsed = 0;
            }
        });
    }
  }

  // 3. OBSERVERS (Reveal & Header)
  const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')); // Changed to match your CSS class 'visible'
  }, { rootMargin: '-10% 0px', threshold: 0.05 });
  
  // Observe static AND dynamic elements
  document.querySelectorAll('.reveal-node').forEach(n => revealObserver.observe(n));
  
  // Header highlighting logic
  document.querySelectorAll('.header-wrapper').forEach(wrapper => {
      // (Your existing header observer logic here if needed, simplified for brevity)
  });
  
  // 4. REPLACEABLE WORDS
  document.querySelectorAll('.replaceable').forEach(span => {
    const words = span.dataset.words.split(',');
    let idx = 0;
    setInterval(() => {
        span.style.opacity = 0;
        span.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            idx = (idx + 1) % words.length;
            span.textContent = words[idx];
            span.style.opacity = 1;
            span.style.transform = 'translateY(0)';
        }, 300);
    }, 4000);
  });
}

/* =========================================
   C. UTILITIES
   ========================================= */

function safeText(sel, txt) { const el = document.querySelector(sel); if(el && txt) el.innerText = txt; }
function safeHTML(sel, htm) { const el = document.querySelector(sel); if(el && htm) el.innerHTML = htm; }
function safeLink(id, url) { const el = document.getElementById(id); if(el && url) el.href = url; }

/**
 * FACE [SYS 4.0]
 * MASTER CONTROLLER
 * Status: FINAL | All Modules Active
 */

document.addEventListener('DOMContentLoaded', () => {
  initSystem();
});

async function initSystem() {
  console.log('FACE [SYS] :: INITIALIZING...');

  try {
    // 1. DATA INGESTION
    // Ensure you are running on a server (http://) for fetch to work
    const response = await fetch('./content.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    console.log('FACE [SYS] :: DATA RECEIVED', data);

    // 2. RENDERING
    if (data.global) updateGlobal(data.global);
    if (data.grid)   updateGrid(data.grid);
    if (data.tracks) updateTracks(data.tracks);
    if (data.method) updateMethod(data.method);

    // 3. VISUAL ENGINE
    initVisuals(); 
    
    console.log('FACE [SYS] :: SYSTEM READY.');

  } catch (error) {
    console.warn('FACE [SYS] :: OFFLINE MODE / DATA MISSING');
    console.error(error);
    // Force visuals if data fails
    initVisuals(); 
  }
}

/* =========================================
   A. DATA UPDATER FUNCTIONS
   ========================================= */

function updateGlobal(content) {
  safeHTML('h1.reveal-node', content.hero_headline);
  safeHTML('p.serif.reveal-node', content.hero_sub);
  safeText('a.cta-btn', content.cta_label);
  
  // Social Links
  safeLink('.link-tiktok', content.link_tiktok);
  safeLink('.link-instagram', content.link_instagram);
  safeLink('.link-patreon', content.link_patreon);

  // Section Headers
  safeText('#capabilities .section-headline', content.sec1_title);
  safeText('#manifest .section-headline', content.sec2_title);
  safeText('#method .section-headline', content.sec3_title);
  
  // Footer Email
  const emailBtn = document.querySelector('footer .cta-btn');
  if (emailBtn && content.footer_email) emailBtn.href = `mailto:${content.footer_email}`;
}

function updateGrid(items) {
  const container = document.querySelector('#capabilities .grid-container');
  if (!container) return;
  container.innerHTML = '';
  items.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = `grid-item reveal-node delay-${index + 1}`; 
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
    const div = document.createElement('div');
    div.className = `acc-item ${index === 0 ? 'active' : ''} reveal-node delay-${index + 1}`;
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
    const container = document.querySelector('#method .grid-container');
    if (!container) return;
    container.innerHTML = '';
    steps.forEach((step, index) => {
      const div = document.createElement('div');
      div.className = `grid-item reveal-node delay-${index + 1}`;
      div.innerHTML = `
        <span class="index-marker">${step.marker}</span>
        <h2 class="grid-title">${step.title}</h2>
        <p class="grid-body">${step.desc}</p>
      `;
      container.appendChild(div);
    });
}

/* =========================================
   B. VISUAL ENGINE (ALL LOGIC INCLUDED)
   ========================================= */

function initVisuals() {
  
  // 1. THEMES & SCROLL
  const themes = {
    'default': { '--accent-acid': '#60A5FA', '--accent-acid-ghost': 'rgba(96, 165, 250, 0.2)', 'light': { '--bg-concrete': '#F4F6F8', '--ink-graphite': '#0F172A' }, 'dark': { '--bg-concrete': '#0F1C2E', '--ink-graphite': '#F8FAFC' } },
    'green': { '--accent-acid': '#34D399', '--accent-acid-ghost': 'rgba(52, 211, 153, 0.2)', 'light': { '--bg-concrete': '#F2F2F0', '--ink-graphite': '#111' }, 'dark': { '--bg-concrete': '#0F1C2E', '--ink-graphite': '#F8FAFC' } },
    'lavender': { '--accent-acid': '#A78BFA', '--accent-acid-ghost': 'rgba(167, 139, 250, 0.2)', 'light': { '--bg-concrete': '#F4F6F8', '--ink-graphite': '#0F172A' }, 'dark': { '--bg-concrete': '#0F1C2E', '--ink-graphite': '#F8FAFC' } }
  };
  
  let currentTheme = null; 
  let globalColorIndex = -1; 
  let lastActiveSection = null;
  const allowedCycle = ['default', 'green', 'lavender', 'default', 'green'];
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

  function throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
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
        
        const isFooter = active.tagName === 'FOOTER' || active.classList.contains('mega-footer');
        const shouldBeDark = darkSectionsIDs.includes(active.id) || active.classList.contains('hero') || isFooter;
        document.body.classList.toggle('dark-mode', shouldBeDark);
        
        setTheme(nextTheme);
    }
  }

  window.addEventListener('scroll', throttle(updateTheme, 100));
  window.addEventListener('resize', throttle(updateTheme, 100));
  updateTheme(); 

  // 2. ACCORDION
  const items = document.querySelectorAll('.acc-item');
  if(items.length > 0) {
    let currentIndex = 0;
    let startTime = null;
    let isStopped = false;
    const intervalTime = 6000;
    const totalItems = items.length;

    function updateState(i) {
        items.forEach((item, idx) => {
            const active = idx === i;
            item.classList.toggle('active', active);
            item.setAttribute('aria-expanded', active);
            const bar = item.querySelector('.acc-progress-fill');
            if(bar) bar.style.height = active ? '0%' : '0%'; 
        });
        currentIndex = i;
    }

    function loop(timestamp) {
        if (!startTime) startTime = timestamp;
        if (!isStopped) {
            const elapsed = timestamp - startTime;
            const percent = Math.min((elapsed / intervalTime) * 100, 100);
            const bar = items[currentIndex].querySelector('.acc-progress-fill');
            if (bar) bar.style.height = `${percent}%`;

            if (elapsed >= intervalTime) {
                startTime = timestamp;
                updateState((currentIndex + 1) % totalItems);
            }
        } else { startTime = timestamp; }
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    items.forEach((item, i) => {
        item.addEventListener('click', () => {
            isStopped = true;
            items.forEach(it => { if(it.querySelector('.acc-progress-fill')) it.querySelector('.acc-progress-fill').style.height = '0%'; });
            updateState(i);
            const bar = item.querySelector('.acc-progress-fill');
            if (bar) bar.style.height = '100%';
        });
    });
    
    const stack = document.getElementById('accordion-module');
    if(stack){
        stack.addEventListener('mouseleave', () => { isStopped = false; startTime = null; });
    }
  }

  // 3. REVEAL OBSERVER (Fades in text)
  const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(e => {
          if(e.isIntersecting) {
             e.target.classList.add('is-visible'); 
             e.target.style.opacity = '1';         
             revealObserver.unobserve(e.target);   
          }
      });
  }, { rootMargin: '-5% 0px', threshold: 0.05 });
  document.querySelectorAll('.reveal-node').forEach(n => revealObserver.observe(n));
  
  // 4. REPLACEABLE WORDS (Animation for "Essential / Practice")
  document.querySelectorAll('.replaceable').forEach(span => {
    if(!span.dataset.words) return;
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

  // 5. HEADER AUTO-HIGHLIGHT (The "Ghost" Text)
  const headerObserver = new IntersectionObserver(entries => {
      entries.forEach(e => {
          const ghost = e.target.querySelector('.label-ghost');
          if(ghost) {
              if (e.isIntersecting) {
                  ghost.classList.add('is-solid');
              } else {
                  ghost.classList.remove('is-solid');
              }
          }
      });
  }, { threshold: 0.5 }); 

  document.querySelectorAll('.header-wrapper').forEach(wrapper => {
      headerObserver.observe(wrapper);
  });
}

/* =========================================
   C. UTILITIES
   ========================================= */

function safeText(sel, txt) { const el = document.querySelector(sel); if(el && txt) el.innerText = txt; }
function safeHTML(sel, htm) { const el = document.querySelector(sel); if(el && htm) el.innerHTML = htm; }
function safeLink(sel, url) { const el = document.querySelector(sel); if(el && url) el.href = url; }

/**
 * FACE
 * CLIENT-SIDE CONTROLLER
 * * Mode: Local JSON Read
 * Source: ./content.json
 */

document.addEventListener('DOMContentLoaded', () => {
  initSystem();
});

async function initSystem() {
  console.log('FACE [SYS] :: INITIALIZING...');

  try {
    // 1. Fetch the local data file (created by your GitHub Action)
    const response = await fetch('./content.json');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 2. Distribute data to sections
    if (data.global) updateGlobal(data.global);
    if (data.grid)   updateGrid(data.grid);
    if (data.tracks) updateTracks(data.tracks);
    if (data.method) updateMethod(data.method);

    console.log('FACE [SYS] :: SYSTEM READY.');

  } catch (error) {
    console.warn('FACE [SYS] :: OFFLINE MODE / DATA MISSING');
    console.error(error);
  }
}

/* =========================================
   1. THEME DEFINITIONS (ACADEMIC PALETTE)
   ========================================= */
const themes = {
    'default': { // BLUEPRINT (Blue/Navy) - HERO DEFAULT
        '--accent-acid': '#60A5FA', 
        '--accent-acid-ghost': 'rgba(96, 165, 250, 0.2)',
        'light': { '--bg-concrete': '#F4F6F8', '--ink-graphite': '#0F172A' },
        'dark':  { '--bg-concrete': '#0F1C2E', '--ink-graphite': '#F8FAFC' }
    },
    'green': { // FIELD (Green/Olive)
        '--accent-acid': '#34D399',
        '--accent-acid-ghost': 'rgba(52, 211, 153, 0.2)',
        'light': { '--bg-concrete': '#F2F2F0', '--ink-graphite': '#111' }, 
        'dark':  { '--bg-concrete': '#0F1C2E', '--ink-graphite': '#F8FAFC' } 
    },
    'lavender': { // RESEARCH (Purple/Clean)
        '--accent-acid': '#A78BFA',
        '--accent-acid-ghost': 'rgba(167, 139, 250, 0.2)',
        'light': { '--bg-concrete': '#F4F6F8', '--ink-graphite': '#0F172A' }, 
        'dark':  { '--bg-concrete': '#0F1C2E', '--ink-graphite': '#F8FAFC' } 
    }
};

// Initialize as NULL so the first check doesn't skip 'default'
let currentTheme = null; 

function setTheme(themeName) {
    currentTheme = themeName;
    applyTheme();
}

function applyTheme() {
    if(!currentTheme) return; // Safety check
    const root = document.documentElement;
    const themeData = themes[currentTheme];
    const isDark = document.body.classList.contains('dark-mode');

    // 1. Apply Accent Colors
    root.style.setProperty('--accent-acid', themeData['--accent-acid']);
    root.style.setProperty('--accent-acid-ghost', themeData['--accent-acid-ghost']);

    // 2. Apply Background Based on Mode
    const modeData = isDark ? themeData.dark : themeData.light;
    root.style.setProperty('--bg-concrete', modeData['--bg-concrete']);
    root.style.setProperty('--ink-graphite', modeData['--ink-graphite']);
}


/* =========================================
   2. SMART CONTINUOUS SCROLL (FIXED START)
   ========================================= */
const allowedCycle = ['default', 'green', 'lavender', 'gold', 'red'];

// START AT -1: So the first scroll/load becomes 0 ('default' / Blue)
let globalColorIndex = -1; 
let lastActiveSection = null;

// Force these IDs/Classes to use Dark Mode (Navy Background)
const darkSectionsIDs = ['hero', 'manifest']; 

const stdSections = document.querySelectorAll('.std-section');

function updateTheme() {
    let max = 0, active = null;

    // 1. Find visible section
    stdSections.forEach(sec => {
        const rect = sec.getBoundingClientRect();
        const visible = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
        if (visible > max) {
            max = visible;
            active = sec;
        }
    });

    // 2. Trigger updates only when entering new section
    if (active && active !== lastActiveSection) {
        lastActiveSection = active;

        // A. SMART CYCLE: Pick next color
        globalColorIndex++; 
        let nextTheme = allowedCycle[globalColorIndex % allowedCycle.length];

        // CHECK: If the new color is the same as the CURRENT color, skip to the next one
        if(nextTheme === currentTheme) {
            globalColorIndex++;
            nextTheme = allowedCycle[globalColorIndex % allowedCycle.length];
        }

        // B. HANDLE DARK MODE (Navy Background)
        const isFooter = active.tagName === 'FOOTER' || active.classList.contains('mega-footer');
        const shouldBeDark = darkSectionsIDs.includes(active.id) || active.classList.contains('hero') || isFooter;
        
        document.body.classList.toggle('dark-mode', shouldBeDark);

        // C. APPLY THEMES
        setTheme(nextTheme);
        applyTheme(); 
    }
}

window.addEventListener('scroll', updateTheme);
window.addEventListener('resize', updateTheme);
// Trigger once on load to set Hero = Blue
updateTheme(); 


/* =========================================
   3. ANIMATIONS & UTILITIES
   ========================================= */

// Auto-Highlight Words
function autohighlight(el) {
    if (!el.querySelector('.stagger-word')) {
        el.innerHTML = el.textContent
            .split(' ').filter(w => w)
            .map((w, i) => `<span class="stagger-word" data-word-index="${i}">${w}</span>`)
            .join(' ');
    }
    el.querySelectorAll('.stagger-word').forEach((w, i, arr) => {
        if (i === 0 || i === arr.length - 1 || /\d/.test(w.textContent)) {
            setTimeout(() => {
                w.classList.add('highlight-word');
                setTimeout(() => w.classList.remove('highlight-word'), 400);
            }, 100 + 80 * i);
        }
    });
}

// Reveal Observer
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => e.isIntersecting && e.target.classList.add('is-visible'));
}, { rootMargin: '-10% 0px -10% 0px', threshold: 0.05 });
document.querySelectorAll('.reveal-node').forEach(n => revealObserver.observe(n));

// Header Observer
const headerObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
        const label = e.target.querySelector('.label-ghost');
        const title = e.target.querySelector('.section-headline.autohighlight-node');
        if (e.isIntersecting) {
            label?.classList.add('is-solid');
            title && autohighlight(title);
            label && autohighlight(label);
        } else label?.classList.remove('is-solid');
    });
}, { rootMargin: '-30% 0px -30% 0px' });
document.querySelectorAll('.header-wrapper').forEach(n => headerObserver.observe(n));

// Accordion Autoplay
const items = document.querySelectorAll('.acc-item');
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
        resetBar(idx);
    });
    currentIndex = i;
}

function resetBar(i) {
    const bar = items[i].querySelector('.acc-progress-fill');
    if (bar) bar.style.height = '0%';
}

function restartTimer() {
    elapsed = 0;
    loop.lastTime = 0;
}

function loop(ts) {
    if (!loop.lastTime) loop.lastTime = ts;
    const delta = ts - loop.lastTime;
    loop.lastTime = ts;

    if (!isStopped) {
        elapsed += delta;
        const percent = Math.min((elapsed / intervalTime) * 100, 100);
        const bar = items[currentIndex].querySelector('.acc-progress-fill');
        if (bar) bar.style.height = `${percent}%`;

        if (elapsed >= intervalTime) {
            updateState((currentIndex + 1) % totalItems);
            restartTimer();
        }
    }
    requestAnimationFrame(loop);
}

if(items.length > 0) {
    updateState(currentIndex);
    requestAnimationFrame(loop);
}

// Accordion Interaction
items.forEach((item, i) => {
    item.addEventListener('click', () => {
        isStopped = true;
        updateState(i);
        restartTimer();
        const bar = item.querySelector('.acc-progress-fill');
        if (bar) bar.style.height = '100%';
    });
});
const stack = document.getElementById('accordion-module');
if(stack){
    stack.addEventListener('mouseleave', () => {
        if (isStopped) {
            isStopped = false;
            restartTimer();
            resetBar(currentIndex);
        }
    });
}

// Replaceable Words
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

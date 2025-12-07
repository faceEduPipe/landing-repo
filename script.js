/* ------------------------
   1. THEME CALIBRATOR (LOGIC)
------------------------- */
// This handles the Color Chips + Day/Night Toggle
const themes = {
    'default': { // BLUEPRINT (Blue/Navy)
        '--accent-acid': '#60A5FA', 
        '--accent-acid-ghost': 'rgba(96, 165, 250, 0.2)',
        'light': { '--bg-concrete': '#F4F6F8', '--ink-graphite': '#0F172A' },
        'dark':  { '--bg-concrete': '#0F1C2E', '--ink-graphite': '#F8FAFC' }
    },
    'green': { // FIELD (Green/Olive)
        '--accent-acid': '#34D399',
        '--accent-acid-ghost': 'rgba(52, 211, 153, 0.2)',
        'light': { '--bg-concrete': '#F2F2F0', '--ink-graphite': '#111' }, // Concrete
        'dark':  { '--bg-concrete': '#0F1C2E', '--ink-graphite': '#F8FAFC' } // Navy
    },
    'lavender': { // RESEARCH (Purple/Clean)
        '--accent-acid': '#A78BFA',
        '--accent-acid-ghost': 'rgba(167, 139, 250, 0.2)',
        'light': { '--bg-concrete': '#F4F6F8', '--ink-graphite': '#0F172A' }, // Cool White
        'dark':  { '--bg-concrete': '#0F1C2E', '--ink-graphite': '#F8FAFC' } // Navy
    }
};

let currentTheme = 'default';

function setTheme(themeName) {
    currentTheme = themeName;
    applyTheme();
}

function applyTheme() {
    const root = document.documentElement;
    const themeData = themes[currentTheme];
    const isDark = document.body.classList.contains('dark-mode');

    // 1. Apply the Accent Colors (Same for both modes)
    root.style.setProperty('--accent-acid', themeData['--accent-acid']);
    root.style.setProperty('--accent-acid-ghost', themeData['--accent-acid-ghost']);

    // 2. Apply Background/Text based on Mode
    const modeData = isDark ? themeData.dark : themeData.light;
    root.style.setProperty('--bg-concrete', modeData['--bg-concrete']);
    root.style.setProperty('--ink-graphite', modeData['--ink-graphite']);
}


/* ------------------------
   2. CONTINUOUS COLOR CYCLE (NEXT ACCENT ON SCROLL)
------------------------- */
const allowedCycle = ['default', 'green', 'lavender'];

// Track the state
let globalColorIndex = 0; 
let lastActiveSection = null;

// Fixed Dark Mode Sections (Background doesn't cycle, only Accent cycles)
const darkSections = ['hero', 'manifest', 'mega-footer'];
const stdSections = document.querySelectorAll('.std-section');

function updateTheme() {
    let max = 0, active = null;

    // 1. Find the currently visible section
    stdSections.forEach(sec => {
        const rect = sec.getBoundingClientRect();
        const visible = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
        if (visible > max) {
            max = visible;
            active = sec;
        }
    });

    // 2. Only trigger if we have ENTERED a new section
    if (active && active !== lastActiveSection) {
        
        // A. Update the Tracker
        lastActiveSection = active;

        // B. Advance the Color Cycle (Always moves forward: 0 -> 1 -> 2 -> 0...)
        // We increment the index every time a section changes
        const nextTheme = allowedCycle[globalColorIndex % allowedCycle.length];
        globalColorIndex++; // Prepare for next time

        // C. Handle Dark/Light Background (Fixed to Section ID)
        const sectionId = active.id || (active.classList.contains('hero') ? 'hero' : 'footer');
        const shouldBeDark = darkSections.includes(sectionId);
        
        document.body.classList.toggle('dark-mode', shouldBeDark);

        // D. Apply the New Cycle Color
        setTheme(nextTheme);
        
        // Force re-apply to ensure background mode updates correctly
        applyTheme();
    }
}

window.addEventListener('scroll', updateTheme);
window.addEventListener('resize', updateTheme);

// Initialize
updateTheme();


/* ------------------------
   3. AUTO-HIGHLIGHT WORDS
------------------------- */
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

/* ------------------------
   4. REVEAL & HEADER OBSERVER
------------------------- */
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => e.isIntersecting && e.target.classList.add('is-visible'));
}, { rootMargin: '-10% 0px -10% 0px', threshold: 0.05 });

document.querySelectorAll('.reveal-node').forEach(n => revealObserver.observe(n));

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


/* ------------------------
   5. ACCORDION AUTOPLAY
------------------------- */
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

updateState(currentIndex);
requestAnimationFrame(loop);

// Interaction
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

/* ------------------------
   6. REPLACEABLE WORDS
------------------------- */
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

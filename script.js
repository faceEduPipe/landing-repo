/* ------------------------
   AUTO-HIGHLIGHT WORDS
------------------------- */
function autohighlight(el) {
    if (!el.querySelector('.stagger-word')) {
        el.innerHTML = el.textContent
            .split(' ').filter(w => w)
            .map((w, i) => `<span class="stagger-word" data-word-index="${i}">${w}</span>`)
            .join(' ');
    }
    el.querySelectorAll('.stagger-word').forEach((w, i, arr) => {
        if (i===0 || i===arr.length-1 || /\d/.test(w.textContent)) {
            setTimeout(() => {
                w.classList.add('highlight-word');
                setTimeout(() => w.classList.remove('highlight-word'), 400);
            }, 100 + 80*i);
        }
    });
}

/* ------------------------
   REVEAL & HEADER OBSERVER
------------------------- */
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => e.isIntersecting && e.target.classList.add('is-visible'));
}, { rootMargin: '-10% 0px -10% 0px', threshold: 0.05 });
document.querySelectorAll('.reveal-node').forEach(n => revealObserver.observe(n));

const headerObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
        const label = e.target.querySelector('.label-ghost');
        const title = e.target.querySelector('.section-headline.autohighlight-node');
        if(e.isIntersecting){
            label?.classList.add('is-solid');
            title && autohighlight(title);
            label && autohighlight(label);
        } else label?.classList.remove('is-solid');
    });
}, { rootMargin: '-30% 0px -30% 0px' });
document.querySelectorAll('.header-wrapper').forEach(n => headerObserver.observe(n));

/* ------------------------
   THEME SWITCHING
------------------------- */
const darkSections = ['hero','manifest','mega-footer'], stdSections=document.querySelectorAll('.std-section');
function updateTheme(){
    let max=0, active=null;
    stdSections.forEach(sec=>{
        const rect=sec.getBoundingClientRect(), visible=Math.min(rect.bottom,window.innerHeight)-Math.max(rect.top,0);
        if(visible>max){max=visible;active=sec;}
    });
    if(active) document.body.classList.toggle('dark-mode', darkSections.includes(active.id||active.classList[1]));
}
window.addEventListener('scroll',updateTheme);
window.addEventListener('resize',updateTheme);
updateTheme();

/* ------------------------
   ACCORDION AUTOPLAY (GHOST FILL)
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
  loop.lastTime = 0;   // IMPORTANT FIX
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

// Click interaction: stop + fill instantly
items.forEach((item, i) => {
  item.addEventListener('click', () => {
    isStopped = true;    // set first to avoid timing glitches
    updateState(i);
    restartTimer();

    const bar = item.querySelector('.acc-progress-fill');
    if (bar) bar.style.height = '100%';
  });
});

// Resume autoplay
const stack = document.getElementById('accordion-module');
stack.addEventListener('mouseleave', () => {
  if (isStopped) {
    isStopped = false;
    restartTimer();
    resetBar(currentIndex);
  }
});

/* ------------------------
   REPLACEABLE WORDS
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

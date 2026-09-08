'use strict';

/* =========================================================
   Partial loader — injects a reusable HTML fragment
   ========================================================= */
async function loadPartial(targetSelector, url) {
    const target = document.querySelector(targetSelector);
    if (!target) return false;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${url} -> ${res.status}`);
        target.innerHTML = await res.text();
        return true;
    } catch (err) {
        console.error('Partial load failed:', err);
        return false;
    }
}

/* =========================================================
   Navbar behavior (runs AFTER navbar.html is injected)
   ========================================================= */
function initNavbar() {
    const nav = document.getElementById('mainNav');
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    let menuOpen = false;

    const setMenu = (open) => {
        menuOpen = open;
        if (mobileMenu) {
            mobileMenu.classList.toggle('hidden', !open);
            // Collapse the accordions so the menu always reopens at the top level
            if (!open) {
                mobileMenu.querySelectorAll('details[open]').forEach((d) => {
                    d.open = false;
                });
            }
        }
        if (menuToggle) {
            menuToggle.innerHTML = open
                ? '<i class="fas fa-times"></i>'
                : '<i class="fas fa-bars"></i>';
            menuToggle.setAttribute('aria-expanded', String(open));
            menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        }
    };

    const closeMenu = () => setMenu(false);

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            setMenu(!menuOpen);
        });

        mobileMenu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', closeMenu);
        });

        document.addEventListener('click', (e) => {
            if (menuOpen && !mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                closeMenu();
            }
        });
    }

    // Shadow on scroll
    if (nav) {
        const onScroll = () => {
            if (window.scrollY > 30) {
                nav.classList.add('shadow-lg', 'shadow-gray-900/5');
                nav.style.borderBottomColor = 'rgba(255,255,255,0.4)';
            } else {
                nav.classList.remove('shadow-lg', 'shadow-gray-900/5');
                nav.style.borderBottomColor = 'rgba(255,255,255,0.2)';
            }
        };
        window.addEventListener('scroll', onScroll);
        onScroll();
    }

    // Smooth anchor scrolling for same-page links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                const navHeight = nav ? nav.offsetHeight : 0;
                const top = targetEl.getBoundingClientRect().top + window.pageYOffset - navHeight - 12;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });
}

/* =========================================================
   Scroll-reveal animations
   ========================================================= */
function initReveal() {
    const revealElements = document.querySelectorAll('.reveal');
    if (!revealElements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealElements.forEach((el) => observer.observe(el));

    setTimeout(() => {
        const winHeight = window.innerHeight || document.documentElement.clientHeight;
        revealElements.forEach((el) => {
            if (el.getBoundingClientRect().top < winHeight - 80) el.classList.add('visible');
        });
    }, 200);
}

/* =========================================================
   Scroll reveal — toggles Tailwind utility classes only.
   Markup: <el data-reveal data-reveal-delay="120"
               class="opacity-0 translate-y-8 blur-sm transition-all
                      duration-700 ease-out will-change-transform">
   ========================================================= */
function initScrollReveal() {
    const items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;

    const FROM = [
        'opacity-0',
        'translate-y-6', 'translate-y-8', 'translate-y-10', 'translate-y-12',
        '-translate-y-6', '-translate-y-8',
        'translate-x-8', 'translate-x-10', 'translate-x-12',
        '-translate-x-8', '-translate-x-10', '-translate-x-12',
        'scale-90', 'scale-95', 'blur-sm', 'blur',
    ];
    const TO = ['opacity-100', 'translate-x-0', 'translate-y-0', 'scale-100', 'blur-0'];

    const show = (el) => {
        el.classList.remove(...FROM);
        el.classList.add(...TO);
    };

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
        items.forEach(show);
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const delay = Number(el.dataset.revealDelay) || 0;
            window.setTimeout(() => show(el), delay);
            observer.unobserve(el);
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

    items.forEach((el) => observer.observe(el));
}

/* =========================================================
   Timeline progress — scroll-driven fill for [data-timeline],
   plus a "light-up" pass over each [data-timeline-dot] as the
   fill reaches it. Utility-class toggles only.
   ========================================================= */
function initTimelineProgress() {
    const track = document.querySelector('[data-timeline]');
    const fill = document.querySelector('[data-timeline-fill]');
    if (!track || !fill) return;

    const dots = Array.from(track.querySelectorAll('[data-timeline-dot]'));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const update = () => {
        const rect = track.getBoundingClientRect();
        const anchor = window.innerHeight * (reduce ? 0.9 : 0.5);
        const progressed = Math.min(Math.max(anchor - rect.top, 0), rect.height);
        fill.style.height = `${(progressed / rect.height) * 100}%`;

        dots.forEach((dot) => {
            const reached = dot.getBoundingClientRect().top < anchor + 2;
            dot.classList.toggle('bg-emerald-500', reached);
            dot.classList.toggle('border-emerald-500', reached);
            dot.classList.toggle('scale-110', reached);
            dot.classList.toggle('bg-white', !reached);
        });
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('load', update);
    update();
}

/* =========================================================
   Parallax — translates [data-parallax] on scroll for depth.
   data-parallax-speed: fraction of scroll distance (default .15);
   negative moves the element the other way. Disabled for
   prefers-reduced-motion. Sets inline transform only.
   ========================================================= */
function initParallax() {
    const items = Array.from(document.querySelectorAll('[data-parallax]'));
    if (!items.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ticking = false;

    const apply = () => {
        const mid = window.scrollY + window.innerHeight / 2;
        items.forEach((el) => {
            const speed = parseFloat(el.dataset.parallaxSpeed) || 0.15;
            const box = el.getBoundingClientRect();
            const elMid = box.top + window.scrollY + box.height / 2;
            const shift = (mid - elMid) * speed;
            el.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0)`;
        });
        ticking = false;
    };

    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(apply);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', apply);
    apply();
}

/* =========================================================
   Horizontal scroll gallery — vertical scroll drives a
   horizontal track. Hooks are data-* attributes only, and
   every visual change is a Tailwind utility class toggle.
     [data-hscroll-section]  outer <section> (gets a computed height)
     [data-hscroll-pin]      sticky viewport wrapper
     [data-hscroll]          the flex track that is translated
     [data-hscroll-progress] progress bar (scaleX 0 -> 1)
     [data-hscroll-card]     each card (focus styling by proximity)
   ========================================================= */
function initHorizontalScroll() {
    const section = document.querySelector('[data-hscroll-section]');
    if (!section) return;
    const pin = section.querySelector('[data-hscroll-pin]');
    const track = section.querySelector('[data-hscroll]');
    if (!pin || !track) return;

    const bar = section.querySelector('[data-hscroll-progress]');
    const cards = Array.from(track.querySelectorAll('[data-hscroll-card]'));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let distance = 0;
    let startY = 0;

    const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);

    const usePinned = () => {
        pin.classList.add('sticky', 'top-0', 'h-screen', 'items-center', 'overflow-hidden');
        pin.classList.remove('py-12');
        track.classList.add('w-max', 'flex-nowrap');
        track.classList.remove('flex-wrap', 'justify-center');
        if (bar) bar.classList.remove('hidden');
    };

    const useFallbackGrid = () => {
        section.style.height = '';
        track.style.transform = '';
        pin.classList.remove('sticky', 'top-0', 'h-screen', 'items-center', 'overflow-hidden');
        pin.classList.add('py-12');
        track.classList.remove('w-max', 'flex-nowrap');
        track.classList.add('flex-wrap', 'justify-center');
        cards.forEach((c) => {
            c.classList.remove('grayscale', 'opacity-60', 'scale-95');
            c.classList.add('grayscale-0', 'opacity-100');
        });
        if (bar) bar.classList.add('hidden');
    };

    const paint = () => {
        if (!distance) return;
        const p = clamp((window.scrollY - startY) / distance, 0, 1);
        track.style.transform = `translate3d(${(-p * distance).toFixed(2)}px, 0, 0)`;
        if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;

        const mid = window.innerWidth / 2;
        cards.forEach((card) => {
            const r = card.getBoundingClientRect();
            const active = Math.abs(r.left + r.width / 2 - mid) < r.width / 2 + 48;
            card.classList.toggle('grayscale', !active);
            card.classList.toggle('grayscale-0', active);
            card.classList.toggle('opacity-60', !active);
            card.classList.toggle('opacity-100', active);
            card.classList.toggle('scale-95', !active);
        });
    };

    const layout = () => {
        usePinned();
        distance = track.scrollWidth - pin.clientWidth;
        if (reduce || distance <= 0) {
            useFallbackGrid();
            distance = 0;
            return;
        }
        section.style.height = `${pin.offsetTop + window.innerHeight + distance}px`;
        startY = section.getBoundingClientRect().top + window.scrollY + pin.offsetTop;
        paint();
    };

    window.addEventListener('scroll', paint, { passive: true });
    window.addEventListener('resize', layout);
    window.addEventListener('load', layout);
    layout();
}

/* =========================================================
   Stat counter animation
   ========================================================= */
function initStats() {
    const statNumbers = document.querySelectorAll('.stat-number, [data-count]');
    if (!statNumbers.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const text = el.textContent.trim();
            if (/\d/.test(text)) {
                const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                const suffix = text.replace(/[0-9]/g, '');
                if (!isNaN(num) && num > 0) {
                    let current = 0;
                    const increment = Math.ceil(num / 40);
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= num) {
                            current = num;
                            clearInterval(timer);
                        }
                        el.textContent = current + suffix;
                    }, 30);
                }
            }
            observer.unobserve(el);
        });
    }, { threshold: 0.5 });

    statNumbers.forEach((el) => observer.observe(el));
}

/* =========================================================
   Floating WhatsApp / call buttons
   ========================================================= */
function initFloatingButtons() {
    const wrap = document.createElement('div');
    wrap.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end md:bottom-8 md:right-8';
    wrap.innerHTML = `
        <a href="https://wa.me/9979901901" target="_blank" rel="noopener"
           class="flex items-center gap-2.5 bg-green-500 hover:bg-emerald-600 text-white font-semibold p-2.5 px-4 rounded-full shadow-2xl shadow-emerald-500/40 transition-all text-sm border border-white/20 backdrop-blur">
            <i class="fab fa-whatsapp text-2xl"></i>
        </a>
    `;
    document.body.appendChild(wrap);
}

/* =========================================================
   Boot
   ========================================================= */
document.addEventListener('DOMContentLoaded', async () => {
    const navLoaded = await loadPartial('#navbar', 'components/navbar.html');
    if (navLoaded) initNavbar();

    await loadPartial('#footer-container', 'components/footer.html');

    initReveal();
    initScrollReveal();
    initTimelineProgress();
    initParallax();
    initHorizontalScroll();
    initStats();
    initFloatingButtons();
});


// privacy js

/* =========================================================
           Contents nav - built from the sections themselves, so the
           list can never drift out of sync with the document.
           ========================================================= */
(function () {
    'use strict';

    const sections = Array.from(document.querySelectorAll('main section[id]'));
    const lists = document.querySelectorAll('[data-toc], [data-toc-mobile]');
    if (!sections.length || !lists.length) return;

    const entries = sections.map((section, i) => {
        const heading = section.querySelector('h2');
        const number = String(i + 1).padStart(2, '0');
        // Heading text minus its leading clause number
        const title = heading
            ? heading.textContent.replace(/^\s*\d+\s*/, '').trim()
            : section.id;
        return { id: section.id, number, title };
    });

    lists.forEach((list) => {
        const isSidebar = list.hasAttribute('data-toc');
        list.innerHTML = entries.map((e) => `
                    <li>
                        <a href="#${e.id}"
                           data-toc-for="${e.id}"
                           class="toc-link block py-1.5 ${isSidebar ? 'pl-3' : 'pl-0'} hover:text-emerald-700">
                            <span class="tabular-nums text-gray-400 mr-2">${e.number}</span>${e.title}
                        </a>
                    </li>`).join('');
    });

    const links = Array.from(document.querySelectorAll('[data-toc-for]'));
    const setActive = (id) => {
        links.forEach((link) => {
            link.setAttribute('aria-current', link.dataset.tocFor === id ? 'true' : 'false');
        });
    };

    // Highlight whichever section the reader is currently in
    let active = null;
    const observer = new IntersectionObserver((records) => {
        const visible = records
            .filter((r) => r.isIntersecting)
            .sort((a, b) => a.target.offsetTop - b.target.offsetTop)[0];
        if (visible && visible.target.id !== active) {
            active = visible.target.id;
            setActive(active);
        }
    }, { rootMargin: '-120px 0px -70% 0px', threshold: 0 });

    sections.forEach((section) => observer.observe(section));
})();
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
    const items = document.querySelectorAll('[data-reveal], [data-animate]');
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

    // Give bare [data-animate] / [data-reveal] elements a sensible default
    // entrance so markup doesn't have to spell out every utility.
    const fromRe = /^(opacity-0|-?translate-[xy]-|scale-9|blur)/;
    items.forEach((el) => {
        if (![...el.classList].some((c) => fromRe.test(c))) {
            el.classList.add('opacity-0', 'translate-y-8');
        }
        if (![...el.classList].some((c) => c.startsWith('transition'))) {
            el.classList.add('transition-all', 'duration-700', 'ease-out', 'will-change-transform');
        }
    });

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
   Marquee — JS-driven continuous scroll, right to left.
   Markup: a flex track with two identical halves and
   [data-marquee] (optional data-marquee-speed in px/sec).
   Pauses on hover / keyboard focus; static under reduced motion.
   ========================================================= */
function initMarquee() {
    const tracks = document.querySelectorAll('[data-marquee]');
    if (!tracks.length) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    tracks.forEach((track) => {
        let paused = false;
        const pause = () => { paused = true; };
        const play = () => { paused = false; };
        track.addEventListener('mouseenter', pause);
        track.addEventListener('mouseleave', play);
        track.addEventListener('focusin', pause);
        track.addEventListener('focusout', play);
        if (reduce) return;

        const speed = parseFloat(track.dataset.marqueeSpeed) || 45;
        let offset = 0;
        let last = performance.now();

        const tick = (now) => {
            const dt = Math.min((now - last) / 1000, 0.05);
            last = now;
            if (!paused) {
                offset -= speed * dt;               // negative => content travels right to left
                const half = track.scrollWidth / 2;
                if (half > 0 && -offset >= half) offset += half;
                track.style.transform = `translate3d(${offset.toFixed(2)}px, 0, 0)`;
            }
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    });
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
   Products page — spec comparison tabs.
   Styling is handled by aria-selected: / group-aria-selected:
   variants in the markup; JS only flips aria-selected + focus,
   and shows the matching [data-spec-panel] with a fade.
   ========================================================= */
function initSpecTabs() {
    const root = document.querySelector('[data-spec-tabs]');
    if (!root) return;
    const tabs = Array.from(root.querySelectorAll('[data-spec-tab]'));
    const panels = Array.from(document.querySelectorAll('[data-spec-panel]'));
    if (!tabs.length || !panels.length) return;

    const select = (i, focus) => {
        tabs.forEach((t, k) => {
            const on = k === i;
            t.setAttribute('aria-selected', String(on));
            t.tabIndex = on ? 0 : -1;
        });
        panels.forEach((p, k) => {
            if (k === i) {
                p.hidden = false;
                p.classList.add('opacity-0');
                requestAnimationFrame(() => p.classList.remove('opacity-0'));
            } else {
                p.hidden = true;
            }
        });
        if (focus && tabs[i]) tabs[i].focus();
    };

    tabs.forEach((t, i) => {
        t.addEventListener('click', () => select(i, false));
        t.addEventListener('keydown', (e) => {
            const last = tabs.length - 1;
            let n = null;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = i === last ? 0 : i + 1;
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = i === 0 ? last : i - 1;
            else if (e.key === 'Home') n = 0;
            else if (e.key === 'End') n = last;
            if (n !== null) { e.preventDefault(); select(n, true); }
        });
    });

    const start = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    select(start < 0 ? 0 : start, false);
}

/* =========================================================
   Products page — gallery filter + lightbox
   ========================================================= */
function initGallery() {
    const grid = document.querySelector('[data-gallery]');
    if (!grid) return;
    const items = Array.from(grid.querySelectorAll('[data-gallery-item]'));
    const filters = Array.from(document.querySelectorAll('[data-gallery-filter]'));

    filters.forEach((btn) => {
        btn.addEventListener('click', () => {
            const f = btn.dataset.filter;
            filters.forEach((b) => {
                const on = b === btn;
                b.setAttribute('aria-pressed', String(on));
                b.classList.toggle('bg-emerald-600', on);
                b.classList.toggle('text-white', on);
                b.classList.toggle('border-emerald-600', on);
                b.classList.toggle('border-gray-300', !on);
                b.classList.toggle('text-gray-600', !on);
            });
            items.forEach((it) => {
                const show = f === 'all' || it.dataset.type === f;
                it.hidden = !show;
                if (show) { it.style.opacity = '1'; it.style.transform = 'none'; }
            });
        });
    });

    const box = document.querySelector('[data-lightbox]');
    if (!box) return;
    const boxImg = box.querySelector('[data-lightbox-img]');
    const visible = () => items.filter((it) => !it.hidden);
    let idx = 0;

    const render = () => {
        const list = visible();
        if (!list.length) return;
        idx = (idx + list.length) % list.length;
        const img = list[idx].querySelector('img');
        boxImg.src = img.currentSrc || img.src;
        boxImg.alt = img.alt || '';
    };
    const open = (el) => {
        idx = visible().indexOf(el);
        render();
        box.hidden = false;
        requestAnimationFrame(() => box.classList.remove('opacity-0'));
        document.addEventListener('keydown', onKey);
    };
    const close = () => {
        box.classList.add('opacity-0');
        document.removeEventListener('keydown', onKey);
        window.setTimeout(() => { box.hidden = true; }, 300);
    };
    const onKey = (e) => {
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowRight') { idx++; render(); }
        else if (e.key === 'ArrowLeft') { idx--; render(); }
    };

    box.classList.add('opacity-0');
    items.forEach((it) => it.addEventListener('click', () => open(it)));
    box.querySelector('[data-lightbox-close]').addEventListener('click', close);
    box.querySelector('[data-lightbox-next]').addEventListener('click', () => { idx++; render(); });
    box.querySelector('[data-lightbox-prev]').addEventListener('click', () => { idx--; render(); });
    box.addEventListener('click', (e) => { if (e.target === box) close(); });
}

/* =========================================================
   Products page — "help me choose" guided selector
   ========================================================= */
function initChooser() {
    const root = document.querySelector('[data-chooser]');
    if (!root) return;
    const groups = Array.from(root.querySelectorAll('[data-choose-group]'));
    const result = root.querySelector('[data-chooser-result]');
    if (!result) return;
    const nameEl = result.querySelector('[data-result-name]');
    const whyEl = result.querySelector('[data-result-why]');
    const linkEl = result.querySelector('[data-result-link]');
    const choice = {};

    const W = {
        climate: { mild: [2, 0, 1], hot: [0, 2, 1], humid: [0, 1, 2] },
        priority: { cost: [3, 0, 0], control: [0, 3, 1], yield: [0, 1, 3] },
        scale: { small: [2, 1, 0], mid: [1, 2, 1], large: [0, 1, 3] },
    };
    const TYPES = [
        { name: 'Plastic, Shade-Net & Fiberglass', why: 'Fastest, most cost-efficient covered growing.', href: 'plastic-shade-net-fiberglass.html' },
        { name: 'Polycarbonate & Air-Conditioned', why: 'Holds set-point through the worst of the heat.', href: 'polycarbonate-air-conditioned.html' },
        { name: 'Multi-Unit Halls & Glass Hydroponic', why: 'Highest control and yield for commercial scale.', href: 'multi-unit-halls-nurseries-glass-hydroponic.html' },
    ];

    const evaluate = () => {
        if (Object.keys(choice).length < groups.length) return;
        const score = [0, 0, 0];
        Object.keys(choice).forEach((g) => {
            const row = W[g] && W[g][choice[g]];
            if (row) row.forEach((v, i) => (score[i] += v));
        });
        let best = 0;
        score.forEach((v, i) => { if (v > score[best]) best = i; });
        const pick = TYPES[best];
        if (nameEl) nameEl.textContent = pick.name;
        if (whyEl) whyEl.textContent = pick.why;
        if (linkEl) linkEl.setAttribute('href', pick.href);
        result.classList.remove('opacity-60');
        if (window.gsap) window.gsap.fromTo(result, { y: 8, opacity: 0.4 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' });
    };

    groups.forEach((group) => {
        const g = group.dataset.chooseGroup;
        group.querySelectorAll('[data-choose]').forEach((btn) => {
            btn.addEventListener('click', () => {
                choice[g] = btn.dataset.value;
                group.querySelectorAll('[data-choose]').forEach((b) => {
                    b.setAttribute('aria-pressed', String(b === btn));
                });
                evaluate();
            });
        });
    });
}

/* =========================================================
   GSAP flourishes (only when GSAP is present on the page)
   ========================================================= */
function initGsap() {
    if (!window.gsap) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const gsap = window.gsap;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    const words = document.querySelectorAll('[data-hero-word]');
    if (words.length) {
        gsap.set(words, { yPercent: 115 });
        gsap.to(words, { yPercent: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06, delay: 0.12 });
    }

    const figures = document.querySelectorAll('[data-gallery-item]');
    if (figures.length && window.ScrollTrigger && window.ScrollTrigger.batch) {
        gsap.set(figures, { y: 28, opacity: 0 });
        window.ScrollTrigger.batch(figures, {
            start: 'top 88%',
            onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.07 }),
        });
    }
}

/* =========================================================
   Generic FAQ accordion (single open)
   ========================================================= */
function initFaq() {
    const items = Array.from(document.querySelectorAll('[data-faq]'));
    if (!items.length) return;

    const closeItem = (item) => {
        item.querySelector('[data-faq-btn]').setAttribute('aria-expanded', 'false');
        item.querySelector('[data-faq-panel]').style.maxHeight = '0px';
        const icon = item.querySelector('[data-faq-icon]');
        if (icon) icon.classList.remove('rotate-45');
    };

    items.forEach((item) => {
        const btn = item.querySelector('[data-faq-btn]');
        const panel = item.querySelector('[data-faq-panel]');
        const icon = item.querySelector('[data-faq-icon]');
        btn.addEventListener('click', () => {
            const open = btn.getAttribute('aria-expanded') === 'true';
            items.forEach((o) => { if (o !== item) closeItem(o); });
            if (open) {
                closeItem(item);
            } else {
                btn.setAttribute('aria-expanded', 'true');
                panel.style.maxHeight = panel.scrollHeight + 'px';
                if (icon) icon.classList.add('rotate-45');
            }
        });
    });

    window.addEventListener('resize', () => {
        items.forEach((item) => {
            if (item.querySelector('[data-faq-btn]').getAttribute('aria-expanded') === 'true') {
                const p = item.querySelector('[data-faq-panel]');
                p.style.maxHeight = p.scrollHeight + 'px';
            }
        });
    }, { passive: true });
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
    initMarquee();
    initHorizontalScroll();
    initStats();
    initSpecTabs();
    initGallery();
    initChooser();
    initFaq();
    initGsap();
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

// sustainability js

(function () {
    "use strict";
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var GS = !reduce && window.gsap && window.ScrollTrigger;
    if (GS) gsap.registerPlugin(ScrollTrigger);

    /* ---- 1 · Hero staggered split-word reveal ---- */
    var words = document.querySelectorAll("[data-hero-word]");
    if (GS && words.length) {
        gsap.set(words, { yPercent: 120 });
        gsap.to(words, {
            yPercent: 0, duration: 0.9, ease: "power3.out", stagger: 0.07, delay: 0.15
        });
    }

    /* ---- 3 · Impact: stagger cards + count up ---- */
    var counters = document.querySelectorAll("[data-count]");
    var format = function (el, value) {
        var dec = parseInt(el.dataset.decimals, 10) || 0;
        el.textContent = value.toFixed(dec) + (el.dataset.suffix || "");
    };
    var runCounters = function () {
        counters.forEach(function (el) {
            var target = parseFloat(el.dataset.count) || 0;
            if (!GS) { format(el, target); return; }
            var proxy = { v: 0 };
            gsap.to(proxy, {
                v: target, duration: 2, ease: "power1.out",
                onUpdate: function () { format(el, proxy.v); }
            });
        });
    };
    var impactCards = document.querySelectorAll("[data-impact-card]");
    if (GS) {
        gsap.set(impactCards, { y: 40, opacity: 0 });
        ScrollTrigger.create({
            trigger: "#impact", start: "top 72%", once: true,
            onEnter: function () {
                gsap.to(impactCards, {
                    y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.12
                });
                runCounters();
            }
        });
    } else {
        runCounters();
    }

    /* ---- 4 · Milestone timeline: draw line + light nodes ---- */
    var line = document.querySelector("[data-timeline-line]");
    var nodes = document.querySelectorAll("[data-timeline-node]");
    if (GS && line) {
        gsap.set(line, { scaleY: 0 });
        gsap.to(line, {
            scaleY: 1, ease: "none",
            scrollTrigger: { trigger: "#timeline", start: "top 55%", end: "bottom 85%", scrub: 0.5 }
        });
        nodes.forEach(function (node) {
            var dot = node.querySelector("[data-node-dot]");
            var body = node.querySelector("[data-node-body]");
            gsap.set(body, { opacity: 0, y: 22 });
            gsap.set(dot, { scale: 0.55 });
            ScrollTrigger.create({
                trigger: node, start: "top 68%", end: "bottom 40%",
                onEnter: function () { activate(dot, body); },
                onEnterBack: function () { activate(dot, body); },
                onLeaveBack: function () { deactivate(dot, body); }
            });
        });
    } else if (line) {
        line.style.transform = "scaleY(1)";
        nodes.forEach(function (node) {
            node.querySelector("[data-node-body]").style.opacity = 1;
            node.querySelector("[data-node-dot]").style.background = "#2BD48A";
        });
    }
    function activate(dot, body) {
        gsap.to(body, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
        gsap.to(dot, {
            scale: 1, backgroundColor: "#2BD48A", boxShadow: "0 0 22px rgba(43,212,138,0.9)",
            duration: 0.4, ease: "power2.out"
        });
    }
    function deactivate(dot, body) {
        gsap.to(body, { opacity: 0, y: 22, duration: 0.3 });
        gsap.to(dot, { scale: 0.55, backgroundColor: "#0c3a29", boxShadow: "none", duration: 0.3 });
    }

    /* ---- 5 · Funding hub: tab switching with fade ---- */
    var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-fund-tab]"));
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-fund-panel]"));
    function selectTrack(i) {
        tabs.forEach(function (t, k) {
            var on = k === i;
            t.setAttribute("aria-selected", String(on));
            t.classList.toggle("border-emerald-600", on);
            t.classList.toggle("bg-white", on);
            t.classList.toggle("text-gray-900", on);
            t.classList.toggle("shadow-sm", on);
            t.classList.toggle("border-transparent", !on);
            t.classList.toggle("text-gray-500", !on);
        });
        panels.forEach(function (p, k) {
            if (k === i) {
                p.hidden = false;
                p.classList.add("opacity-0");
                requestAnimationFrame(function () { p.classList.remove("opacity-0"); });
            } else {
                p.hidden = true;
            }
        });
    }
    tabs.forEach(function (t, i) {
        t.addEventListener("click", function () { selectTrack(i); });
        t.addEventListener("keydown", function (e) {
            var last = tabs.length - 1, n = null;
            if (e.key === "ArrowDown" || e.key === "ArrowRight") n = i === last ? 0 : i + 1;
            else if (e.key === "ArrowUp" || e.key === "ArrowLeft") n = i === 0 ? last : i - 1;
            else if (e.key === "Home") n = 0;
            else if (e.key === "End") n = last;
            if (n !== null) { e.preventDefault(); tabs[n].focus(); selectTrack(n); }
        });
    });

    /* ---- 6 · FAQ accordion (single open) ---- */
    var faqs = Array.prototype.slice.call(document.querySelectorAll("[data-faq]"));
    faqs.forEach(function (item) {
        var btn = item.querySelector("[data-faq-btn]");
        var panel = item.querySelector("[data-faq-panel]");
        var icon = item.querySelector("[data-faq-icon]");
        btn.addEventListener("click", function () {
            var isOpen = btn.getAttribute("aria-expanded") === "true";
            faqs.forEach(function (other) {
                if (other === item) return;
                other.querySelector("[data-faq-btn]").setAttribute("aria-expanded", "false");
                other.querySelector("[data-faq-panel]").style.maxHeight = "0px";
                other.querySelector("[data-faq-icon]").classList.remove("rotate-45");
            });
            if (isOpen) {
                btn.setAttribute("aria-expanded", "false");
                panel.style.maxHeight = "0px";
                icon.classList.remove("rotate-45");
            } else {
                btn.setAttribute("aria-expanded", "true");
                panel.style.maxHeight = panel.scrollHeight + "px";
                icon.classList.add("rotate-45");
            }
        });
    });
    window.addEventListener("resize", function () {
        faqs.forEach(function (item) {
            var btn = item.querySelector("[data-faq-btn]");
            if (btn.getAttribute("aria-expanded") === "true") {
                var p = item.querySelector("[data-faq-panel]");
                p.style.maxHeight = p.scrollHeight + "px";
            }
        });
    }, { passive: true });

    /* ---- Smooth anchor scroll for hero CTAs ---- */
    document.querySelectorAll('a[data-smooth][href^="#"]').forEach(function (a) {
        a.addEventListener("click", function (e) {
            var target = document.querySelector(a.getAttribute("href"));
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        });
    });
})();
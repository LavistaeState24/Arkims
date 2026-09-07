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
   Stat counter animation
   ========================================================= */
function initStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
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
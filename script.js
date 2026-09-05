
    (function() {
        'use strict';

        // ----- Mobile menu toggle -----
        const menuToggle = document.getElementById('menuToggle');
        const mobileMenu = document.getElementById('mobileMenu');
        let menuOpen = false;

        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            menuOpen = !menuOpen;
            mobileMenu.classList.toggle('hidden', !menuOpen);
            menuToggle.innerHTML = menuOpen ?
                '<i class="fas fa-times"></i>' :
                '<i class="fas fa-bars"></i>';
        });

        // Close mobile menu on link click
        document.querySelectorAll('#mobileMenu a').forEach(link => {
            link.addEventListener('click', () => {
                menuOpen = false;
                mobileMenu.classList.add('hidden');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            });
        });

        // Close on outside click
        document.addEventListener('click', function(e) {
            if (menuOpen && !mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                menuOpen = false;
                mobileMenu.classList.add('hidden');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });

        // ----- Scroll-triggered reveal animations (Intersection Observer) -----
        const revealElements = document.querySelectorAll('.reveal');

        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -40px 0px'
        });

        revealElements.forEach(el => revealObserver.observe(el));

        // ----- Navbar shadow on scroll -----
        const navbar = document.getElementById('navbar');
        let lastScrollY = 0;

        window.addEventListener('scroll', function() {
            const scrollY = window.scrollY;
            if (scrollY > 30) {
                navbar.classList.add('shadow-lg', 'shadow-gray-900/5');
                navbar.style.borderBottomColor = 'rgba(255,255,255,0.4)';
            } else {
                navbar.classList.remove('shadow-lg', 'shadow-gray-900/5');
                navbar.style.borderBottomColor = 'rgba(255,255,255,0.2)';
            }
            lastScrollY = scrollY;
        });

        // ----- Smooth anchor scrolling (for nav links) -----
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                const targetEl = document.querySelector(targetId);
                if (targetEl) {
                    e.preventDefault();
                    const navHeight = navbar.offsetHeight;
                    const targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset -
                        navHeight - 12;
                    window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                }
            });
        });

        // ----- Floating WhatsApp / click-to-call (optional) -----
        // We already have contact info in the footer & contact section.
        // Add a floating button if desired:
        const floatingBtn = document.createElement('div');
        floatingBtn.className =
            'fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end md:bottom-8 md:right-8';
        floatingBtn.innerHTML = `
          <a href="https://wa.me/966566084364" target="_blank"
             class="flex items-center gap-2.5 bg-green-500 hover:bg-emerald-600 text-white font-semibold p-2.5 px-4 rounded-full shadow-2xl shadow-emerald-500/40 transition-all text-sm border border-white/20 backdrop-blur">
            <i class="fab fa-whatsapp text-2xl"></i>
        
          </a>
          <a href="tel:+966566084364"
             class="flex items-center gap-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-3 rounded-2xl shadow-2xl shadow-blue-500/40 transition-all text-sm border border-white/20 backdrop-blur">
            <i class="fas fa-phone-alt text-lg"></i>
            <span>Call Now</span>
          </a>
        `;
        document.body.appendChild(floatingBtn);

        // ----- Animate stats on scroll (optional) -----
        // Simple counter animation for stat numbers
        const statNumbers = document.querySelectorAll('.stat-number');
        const statObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const text = el.textContent.trim();
                    // Only animate if it's a number with + or %
                    if (/\d/.test(text)) {
                        const num = parseInt(text.replace(/[^0-9]/g, ''));
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
                    statObserver.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(el => statObserver.observe(el));

        // ----- Set initial visibility for reveal elements that are already visible -----
        // (in case they load in view)
        setTimeout(() => {
            revealElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                const winHeight = window.innerHeight || document.documentElement.clientHeight;
                if (rect.top < winHeight - 80) {
                    el.classList.add('visible');
                }
            });
        }, 200);

    })();

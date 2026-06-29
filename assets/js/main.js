/**
 * =====================================================
 * coldbrewjp - Premium Landing Page
 * Main JavaScript
 * =====================================================
 */

(function() {
    'use strict';

    // =====================================================
    // DOM ELEMENTS
    // =====================================================
    const navbar = document.getElementById('navbar');
    const dashboardMockup = document.getElementById('dashboardMockup');

    // =====================================================
    // NAVBAR SCROLL EFFECT
    // =====================================================
    let lastScroll = 0;
    const scrollThreshold = 50;

    function handleNavbarScroll() {
        const currentScroll = window.pageYOffset;

        if (currentScroll > scrollThreshold) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    }

    // =====================================================
    // PARALLAX EFFECT FOR DASHBOARD
    // =====================================================
    function handleParallax() {
        if (!dashboardMockup) return;

        const scrolled = window.pageYOffset;
        const parallaxSpeed = 0.15;
        const translateY = scrolled * parallaxSpeed;

        // Apply subtle parallax effect
        dashboardMockup.style.transform = `translateY(${translateY}px)`;
    }

    // =====================================================
    // SMOOTH SCROLL FOR ANCHOR LINKS
    // =====================================================
    function initSmoothScroll() {
        const anchorLinks = document.querySelectorAll('a[href^="#"]');

        anchorLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');

                // Skip if it's just '#'
                if (href === '#') return;

                const target = document.querySelector(href);

                if (target) {
                    e.preventDefault();

                    const navbarHeight = navbar.offsetHeight;
                    const targetPosition = target.offsetTop - navbarHeight;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // =====================================================
    // SCROLL REVEAL ANIMATIONS
    // =====================================================
    function initScrollReveal() {
        const revealElements = document.querySelectorAll(
            '.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .fade-in-up, .fade-in-left, .fade-in-right'
        );

        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Optional: Stop observing once revealed
                    // revealObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(element => {
            revealObserver.observe(element);
        });
    }

    // =====================================================
    // RIPPLE EFFECT FOR BUTTONS
    // =====================================================
    function initRippleEffect() {
        const rippleButtons = document.querySelectorAll('.ripple');

        rippleButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const ripple = document.createElement('span');
                ripple.classList.add('ipple-span');
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';

                button.appendChild(ripple);

                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }

    // =====================================================
    // COUNTER ANIMATION
    // =====================================================
    function animateValue(element, start, end, duration) {
        const startTime = performance.now();
        const diff = end - start;

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = start + (diff * easeOutQuart);

            element.textContent = Math.round(current).toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = end.toLocaleString();
            }
        }

        requestAnimationFrame(update);
    }

    function initCounters() {
        const counters = document.querySelectorAll('.stat-value');

        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                    entry.target.classList.add('counted');
                    const text = entry.target.textContent;
                    const value = parseInt(text.replace(/,/g, ''));
                    animateValue(entry.target, 0, value, 2000);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => {
            counterObserver.observe(counter);
        });
    }

    // =====================================================
    // HOVER CARD 3D EFFECT
    // =====================================================
    function init3DCardEffect() {
        const cards = document.querySelectorAll('.feature-card, .pricing-card, .testimonial-card');

        cards.forEach(card => {
            card.addEventListener('mousemove', function(e) {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
            });

            card.addEventListener('mouseleave', function() {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
            });
        });
    }

    // =====================================================
    // DYNAMIC BACKGROUND
    // =====================================================
    function initDynamicBackground() {
        // Optional: Add floating particles or gradient animation
        // This is a placeholder for future enhancements
    }

    // =====================================================
    // LAZY LOADING IMAGES
    // =====================================================
    function initLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    // =====================================================
    // FORM VALIDATION (if forms exist)
    // =====================================================
    function initFormValidation() {
        const forms = document.querySelectorAll('form[data-validate]');

        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                let isValid = true;
                const requiredFields = form.querySelectorAll('[required]');

                requiredFields.forEach(field => {
                    if (!field.value.trim()) {
                        isValid = false;
                        field.classList.add('error');
                    } else {
                        field.classList.remove('error');
                    }
                });

                if (!isValid) {
                    e.preventDefault();
                }
            });
        });
    }

    // =====================================================
    // MOBILE MENU
    // =====================================================
    function initMobileMenu() {
        const navbarToggler = document.querySelector('.navbar-toggler');
        const navbarCollapse = document.querySelector('.navbar-collapse');

        if (navbarToggler && navbarCollapse) {
            // Close menu when clicking outside
            document.addEventListener('click', function(e) {
                if (!navbar.contains(e.target) && navbarCollapse.classList.contains('show')) {
                    navbarToggler.click();
                }
            });

            // Close menu on link click
            const navLinks = navbarCollapse.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (navbarCollapse.classList.contains('show')) {
                        navbarToggler.click();
                    }
                });
            });
        }
    }

    // =====================================================
    // PERFORMANCE OPTIMIZATION
    // =====================================================
    let ticking = false;

    function onScroll() {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                handleNavbarScroll();
                handleParallax();
                ticking = false;
            });
            ticking = true;
        }
    }

    // =====================================================
    // INITIALIZATION
    // =====================================================
    function init() {
        // Event listeners
        window.addEventListener('scroll', onScroll, { passive: true });

        // Initial calls
        handleNavbarScroll();

        // Initialize features
        initSmoothScroll();
        initScrollReveal();
        initRippleEffect();
        initCounters();
        init3DCardEffect();
        initLazyLoading();
        initFormValidation();
        initMobileMenu();
        initDynamicBackground();

        // Add loaded class to body
        document.body.classList.add('loaded');
    }

    // =====================================================
    // DOM READY
    // =====================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // =====================================================
    // EXPORTS (for module usage)
    // =====================================================
    window.coldbrewjp = {
        animateValue,
        initScrollReveal,
        init3DCardEffect
    };

})();

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Debounce function for performance optimization
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function for scroll events
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Check if element is in viewport
 */
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Get random number in range
 */
function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// =====================================================
// CONSOLE BRANDING (Optional - for development)
// =====================================================
console.log(
    '%c coldbrewjp ',
    'background: linear-gradient(135deg, #45E3C6, #3BC4A8); color: #111; font-size: 20px; font-weight: bold; padding: 10px 20px; border-radius: 8px;'
);
console.log('%c Reward Better. Teach Smarter. ', 'color: #45E3C6; font-size: 14px;');

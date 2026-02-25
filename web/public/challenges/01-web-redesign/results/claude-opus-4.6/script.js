// SkillSync — Lightweight interactions
(function () {
    'use strict';

    // Intersection Observer for fade-in animations
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));

    // Mobile menu toggle
    const toggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navActions = document.querySelector('.nav-actions');

    if (toggle) {
        toggle.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('open');
            if (navActions) navActions.classList.toggle('open');
            toggle.setAttribute('aria-expanded', isOpen);
        });

        // Close on link click
        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                if (navActions) navActions.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Header scroll effect
    const header = document.querySelector('.header');
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (currentScroll > 50) {
            header.style.boxShadow = '0 1px 8px rgba(0,0,0,0.06)';
        } else {
            header.style.boxShadow = 'none';
        }
        lastScroll = currentScroll;
    }, { passive: true });
})();

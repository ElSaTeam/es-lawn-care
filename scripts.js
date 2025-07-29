console.log('scripts.js loaded immediately'); // Debug: Confirm script loads

// Hamburger menu toggle
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('#menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const hamburger = document.querySelector('.hamburger');

    if (menuToggle && navLinks && hamburger) {
        hamburger.addEventListener('click', () => {
            const isChecked = menuToggle.checked;
            menuToggle.checked = !isChecked;
            navLinks.classList.toggle('active', !isChecked);
        });
    }
});

// Debug link clicks and close menu on navigation
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        console.log(`Clicked: ${link.getAttribute('data-debug')}, href: ${link.getAttribute('href')}`);
        // Close the menu after clicking a link (mobile)
        const menuToggle = document.querySelector('#menu-toggle');
        const navLinks = document.querySelector('.nav-links');
        if (menuToggle && navLinks) {
            menuToggle.checked = false;
            navLinks.classList.remove('active');
        }
    });
    link.addEventListener('touchstart', (e) => {
        console.log(`Touched: ${link.getAttribute('data-debug')}, href: ${link.getAttribute('href')}`);
    });
});

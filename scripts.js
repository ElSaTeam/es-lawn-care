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

    // Form submission with reCAPTCHA
    const form = document.querySelector('form[name="contact"]');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const recaptchaResponse = grecaptcha.getResponse();
            if (!recaptchaResponse) {
                alert('Please complete the reCAPTCHA');
                return;
            }
            const formData = new FormData(form);
            formData.append('g-recaptcha-response', recaptchaResponse);
            const response = await fetch('/.netlify/functions/send-sms-via-email', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (response.ok) {
                alert('Message sent successfully!');
                form.reset();
            } else {
                alert(`Error: ${result.error}`);
            }
        });
    }

    // Scroll to form on "Get a Free Quote" click
    const quoteBtn = document.querySelector('.get-quote-btn');
    if (quoteBtn) {
        quoteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('.contact-form').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Debug link clicks and close menu on navigation
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            console.log(`Clicked: ${link.getAttribute('data-debug')}, href: ${link.getAttribute('href')}`);
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
});

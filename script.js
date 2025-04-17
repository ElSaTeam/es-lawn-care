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

// Function to initialize the form
function initForm() {
    const form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const submitButton = event.target.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';

            try {
                const formData = new FormData(form);
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    form.reset();
                    if (typeof grecaptcha !== 'undefined') {
                        grecaptcha.reset();
                    }
                    submitButton.disabled = false;
                    submitButton.textContent = 'Send Message';
                    // Redirect to thank-you.html
                    window.location.href = 'thank-you.html';
                } else {
                    alert('Error: Failed to send message. Please try again.');
                    submitButton.disabled = false;
                    submitButton.textContent = 'Send Message';
                }
            } catch (error) {
                alert('Network error: ' + error.message);
                submitButton.disabled = false;
                submitButton.textContent = 'Send Message';
            }
        });
    }
}

// Run initialization
initForm();
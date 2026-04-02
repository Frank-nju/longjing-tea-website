// Scroll Animations
document.querySelectorAll('.scroll-animate').forEach(element => {
    window.addEventListener('scroll', () => {
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            element.classList.add('visible');
        } else {
            element.classList.remove('visible');
        }
    });
});

// Form Handling
const form = document.querySelector('form');
if (form) {
    form.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevents the default form submission
        // Handle form data here
        const formData = new FormData(form);
        console.log('Form Data Submitted:', Object.fromEntries(formData));
        // You can also send the data to a server here
    });
}

// Smooth Scroll Effect
const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
smoothScrollLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent the default anchor click behavior
        const targetId = link.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
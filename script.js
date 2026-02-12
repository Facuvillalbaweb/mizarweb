/* =========================================
   LÓGICA DE INTERACTIVIDAD (Constelaciones)
   ========================================= */

const canvas = document.getElementById('star-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];

// Configuración de las partículas
const properties = {
    particleColor: 'rgba(255, 255, 255, 1)',
    lineColor: 'rgba(56, 189, 248,', 
    particleCount: 160,    // AUMENTADO: De 80 a 160 para más densidad
    connectionDistance: 150,
    mouseDistance: 200
}

let mouse = { x: null, y: null };

// Ajustar tamaño del canvas
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

// Eventos del Mouse
window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
});

window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
});

// Clase Partícula
class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.velocityX = (Math.random() - 0.5) * 0.5;
        this.velocityY = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2;
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Rebote en los bordes
        if (this.x < 0 || this.x > width) this.velocityX *= -1;
        if (this.y < 0 || this.y > height) this.velocityY *= -1;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = properties.particleColor;
        ctx.fill();
    }
}

// Inicialización
function init() {
    particles = [];
    for (let i = 0; i < properties.particleCount; i++) {
        particles.push(new Particle());
    }
}

// Bucle de animación
function animate() {
    ctx.clearRect(0, 0, width, height);
    
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        // NOTA: Se ha eliminado el bucle que conectaba partículas entre sí 
        // para dejar el fondo más limpio, como solicitaste.

        // Interacción con Mouse (Solo esto genera líneas)
        if (mouse.x != null) {
            let mouseDistance = Math.sqrt(
                (particles[i].x - mouse.x) ** 2 + 
                (particles[i].y - mouse.y) ** 2
            );

            if (mouseDistance < properties.mouseDistance) {
                // La opacidad de la línea depende de la distancia al mouse
                ctx.beginPath();
                ctx.strokeStyle = properties.lineColor + (1 - mouseDistance/properties.mouseDistance) + ')';
                ctx.lineWidth = 1;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animate);
}

/* =========================================
   ANIMACIONES AL HACER SCROLL
   ========================================= */

// Seleccionar todos los elementos que deben animarse
const revealElements = document.querySelectorAll('.reveal-element');

const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Añadir clase active cuando el elemento entra en pantalla
            entry.target.classList.add('active');
            // Opcional: Dejar de observar si solo queremos que se anime una vez
            observer.unobserve(entry.target); 
        }
    });
}, {
    root: null,
    threshold: 0.15, // Se dispara cuando el 15% del elemento es visible
    rootMargin: "0px 0px -50px 0px"
});

revealElements.forEach(el => {
    revealObserver.observe(el);
});

// Iniciar
init();
animate();
/* =========================================
   LÓGICA DEL FORMULARIO
   ========================================= */

const contactForm = document.getElementById('contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Evita que la página se recargue

        // Aquí iría la lógica para enviar a un servidor real
        
        // Simulación visual
        const btn = contactForm.querySelector('button');
        const originalText = btn.innerText;
        
        btn.innerText = 'Enviando... 🛰️';
        btn.style.opacity = '0.7';

        setTimeout(() => {
            alert('¡Transmisión recibida! Nos pondremos en contacto pronto.');
            contactForm.reset(); // Limpia los campos
            btn.innerText = originalText;
            btn.style.opacity = '1';
        }, 2000);
    });
}
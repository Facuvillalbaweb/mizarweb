document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. PRELOADER LÓGICA ("Quantum Core") ---
    const preloader = document.getElementById('preloader');
    const loaderText = document.querySelector('.loader-text');
    
    // Efecto de desencriptación de texto estilo Matrix/Cyberpunk
    if(loaderText) {
        const finalVal = loaderText.getAttribute('data-final') || "CARGANDO";
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
        let iterations = 0;
        
        const interval = setInterval(() => {
            loaderText.innerText = finalVal.split('')
                .map((letter, index) => {
                    if(index < iterations) {
                        return finalVal[index];
                    }
                    return characters[Math.floor(Math.random() * characters.length)];
                })
                .join('');
            
            if(iterations >= finalVal.length){ 
                clearInterval(interval);
            }
            
            iterations += 1/3; // Controla la velocidad del efecto
        }, 50);
    }

    // Garantizar tiempo mínimo de carga (2.5s) para que la animación destaque
    setTimeout(() => {
        if (document.readyState === 'complete') {
            finishLoading();
        } else {
            window.addEventListener('load', finishLoading);
        }
    }, 2500);

    function finishLoading() {
        if(preloader) {
            preloader.classList.add('loaded');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 800); // Coincide con la transición CSS (0.8s)
        }
    }


    // --- 2. SISTEMA DE NAVEGACIÓN SPA (Single Page Application) ---
    const sections = document.querySelectorAll('.section');
    const navButtons = document.querySelectorAll('.nav-btn');
    const mobNavButtons = document.querySelectorAll('.mob-nav-btn');
    const bgLayer = document.getElementById('background-layer');
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu-overlay');
    
    const sectionOrder = ['home', 'about', 'services', 'portfolio', 'contact'];

    const sectionThemes = {
        'home': 'bg-gradient-home',
        'about': 'bg-gradient-about',
        'services': 'bg-gradient-services',
        'portfolio': 'bg-gradient-portfolio',
        'contact': 'bg-gradient-contact'
    };

    function navigateTo(targetId) {
        // Ocultar todas
        sections.forEach(sec => sec.classList.remove('active-section'));

        // Mostrar la elegida
        const targetSection = document.getElementById(targetId);
        if (targetSection) targetSection.classList.add('active-section');

        // Actualizar estados visuales de los botones
        navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.target === targetId));

        // Cambiar fondo dinámico
        if(bgLayer) {
            bgLayer.className = ''; 
            if (sectionThemes[targetId]) bgLayer.classList.add(sectionThemes[targetId]);
        }

        // Cerrar menú móvil si se usó
        if (mobileMenu && mobileMenu.classList.contains('active')) {
            toggleMobileMenu();
        }
    }

    navButtons.forEach(btn => btn.addEventListener('click', () => navigateTo(btn.dataset.target)));
    mobNavButtons.forEach(btn => btn.addEventListener('click', () => navigateTo(btn.dataset.target)));
    document.querySelectorAll('.nav-trigger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(btn.dataset.target);
        });
    });


    // --- 3. MENÚ MÓVIL ---
    function toggleMobileMenu() {
        if(mobileMenu && menuToggle) {
            mobileMenu.classList.toggle('active');
            menuToggle.classList.toggle('open'); 
        }
    }

    if(menuToggle) menuToggle.addEventListener('click', toggleMobileMenu);


    // --- 4. GESTOS TÁCTILES (SWIPE NAVEGACIÓN) ---
    let touchStartX = 0;
    let touchStartY = 0;
    const swipeThreshold = 50; 

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        handleSwipeGesture(touchStartX, touchStartY, touchEndX, touchEndY, e.target);
    }, { passive: true });

    function handleSwipeGesture(startX, startY, endX, endY, targetElement) {
        const diffX = endX - startX;
        const diffY = endY - startY;

        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > swipeThreshold) {
            if (mobileMenu && mobileMenu.classList.contains('active')) {
                if (diffX > 0) toggleMobileMenu(); // Swipe derecha cierra el menú
                return; 
            }

            // Ignorar swipe si el usuario está haciendo scroll dentro del carrusel de proyectos o de reseñas
            if (targetElement.closest('.horizontal-scroll-container') || targetElement.closest('.carousel-container')) {
                return;
            }

            const currentSection = document.querySelector('.section.active-section');
            if(currentSection) {
                const currentIndex = sectionOrder.indexOf(currentSection.id);
                if (diffX < 0) {
                    const nextIndex = currentIndex + 1;
                    if (nextIndex < sectionOrder.length) navigateTo(sectionOrder[nextIndex]);
                } else {
                    const prevIndex = currentIndex - 1;
                    if (prevIndex >= 0) navigateTo(sectionOrder[prevIndex]);
                }
            }
        }
    }


    // --- 5. LÓGICA SUB-MENÚ "NOSOTROS" (NUEVO HUB) ---
    const aboutNavBtns = document.querySelectorAll('.sub-nav-btn');
    const aboutTabs = document.querySelectorAll('.about-tab-content');

    aboutNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Limpiar clases activas
            aboutNavBtns.forEach(b => b.classList.remove('active'));
            aboutTabs.forEach(t => t.classList.remove('active'));

            // Activar el presionado
            btn.classList.add('active');
            
            // Mostrar contenido correspondiente
            const targetId = `tab-${btn.dataset.sub}`;
            const targetTab = document.getElementById(targetId);
            if(targetTab) {
                targetTab.classList.add('active');
            }
        });
    });


    // --- 6. FILTRADO Y SCROLL DE PORTFOLIO ---
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.dataset.filter;

            projectCards.forEach(card => {
                const category = card.dataset.category;
                if (filterValue === 'all' || category === filterValue) {
                    card.classList.remove('hidden');
                    card.style.opacity = '0';
                    setTimeout(() => card.style.opacity = '1', 50);
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });
    
    // Convertir rueda del mouse a scroll horizontal
    const scrollContainer = document.querySelector('.horizontal-scroll-container');
    if (scrollContainer) {
        scrollContainer.addEventListener('wheel', (evt) => {
            if(scrollContainer.scrollWidth > scrollContainer.clientWidth) {
                evt.preventDefault();
                scrollContainer.scrollLeft += evt.deltaY;
            }
        });
    }


    // --- 7. CARRUSEL DE RESEÑAS ---
    const track = document.querySelector('.carousel-track');
    if (track) {
        const slides = Array.from(track.children);
        const nextButton = document.querySelector('.carousel-btn.next');
        const prevButton = document.querySelector('.carousel-btn.prev');
        let currentSlideIndex = 0;

        function updateCarousel() {
            slides.forEach(slide => slide.classList.remove('current-slide'));
            if(slides[currentSlideIndex]) {
                slides[currentSlideIndex].classList.add('current-slide');
            }
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                currentSlideIndex = (currentSlideIndex + 1) % slides.length;
                updateCarousel();
            });
        }

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                currentSlideIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
                updateCarousel();
            });
        }
    }


    // --- 8. STARFIELD (PARTÍCULAS DE FONDO) ---
    const canvas = document.getElementById('starfield');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height;
        let stars = [];
        const starCount = 100;
        const connectionDistance = 100;

        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        }

        class Star {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }
            draw() {
                ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function initStars() {
            stars = [];
            for (let i = 0; i < starCount; i++) stars.push(new Star());
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);
            
            stars.forEach(star => {
                star.update();
                star.draw();
            });

            for (let i = 0; i < stars.length; i++) {
                for (let j = i + 1; j < stars.length; j++) {
                    const dx = stars[i].x - stars[j].x;
                    const dy = stars[i].y - stars[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < connectionDistance) {
                        ctx.strokeStyle = `rgba(100, 255, 218, ${1 - dist/connectionDistance})`;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(stars[i].x, stars[i].y);
                        ctx.lineTo(stars[j].x, stars[j].y);
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animate);
        }

        window.addEventListener('resize', resize);
        resize();
        initStars();
        animate();
    }

    // Inicializar la SPA en Home si no hay sección activa
    if (!document.querySelector('.active-section')) {
        navigateTo('home');
    }
});
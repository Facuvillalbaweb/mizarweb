document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. PRELOADER LÓGICA (CORREGIDA) ---
    const preloader = document.getElementById('preloader');
    const loaderText = document.querySelector('.loader-text');
    
    // Verificamos si el usuario ya vio el preloader en esta sesión
    const yaVioPreloader = sessionStorage.getItem('preloaderVisto');

    if(loaderText) {
        const finalVal = loaderText.getAttribute('data-final') || "CARGANDO";
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let iterations = 0;

        // Revelado progresivo de las letras, más pausado y prolijo
        const interval = setInterval(() => {
            loaderText.innerText = finalVal.split('')
                .map((letter, index) => {
                    if(index < iterations) return finalVal[index];
                    return characters[Math.floor(Math.random() * characters.length)];
                }).join('');
            if(iterations >= finalVal.length) clearInterval(interval);
            iterations += 1/4;
        }, 60);
    }

    // Lógica de tiempo de carga inteligente
    let tiempoDeEspera = 1500; // Por defecto 1.5s para la primera visita

    if (yaVioPreloader) {
        // Si ya lo vio antes en esta sesión, reducimos el tiempo drásticamente a 200ms
        tiempoDeEspera = 200; 
    }

    setTimeout(() => {
        if (document.readyState === 'complete') {
            finishLoading();
        } else {
            window.addEventListener('load', finishLoading);
        }
    }, tiempoDeEspera);

    function finishLoading() {
        if(preloader) {
            preloader.classList.add('loaded');
            // Guardamos en la memoria que ya vio el preloader
            sessionStorage.setItem('preloaderVisto', 'true');
            
            setTimeout(() => preloader.style.display = 'none', 800);
        }
    }
    // --- 2. MENÚ MÓVIL ---
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu-overlay');

    function toggleMobileMenu() {
        if(mobileMenu && menuToggle) {
            const open = mobileMenu.classList.toggle('active');
            menuToggle.classList.toggle('open', open);
            menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
            document.body.classList.toggle('menu-open', open);
        }
    }
    if(menuToggle) menuToggle.addEventListener('click', toggleMobileMenu);

    // Cerrar el menú móvil con la tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('active')) toggleMobileMenu();
    });

    // --- 3. ÁREAS: TARJETAS CON PANEL DESPLEGABLE ---
    const expandables = document.querySelectorAll('[data-expandable]');
    if (expandables.length) {
        const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        const allCards = Array.from(expandables);

        // Sólo una tarjeta fijada a la vez: al abrir una se cierra la anterior
        const closeOthers = (keep) => {
            allCards.forEach(other => {
                if (other === keep) return;
                delete other.dataset.pinned;
                other.classList.remove('is-open');
                const t = other.querySelector('.area-toggle');
                if (t) t.setAttribute('aria-expanded', 'false');
            });
        };

        expandables.forEach(card => {
            const toggle = card.querySelector('.area-toggle');
            if (!toggle) return;

            const setOpen = (open) => {
                card.classList.toggle('is-open', open);
                toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            };

            // El clic "fija" la tarjeta abierta. El estado se decide por
            // el pin y no por la clase, porque en escritorio el hover ya
            // pudo haberla abierto (y el foco del botón también).
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const pinned = card.dataset.pinned === '1';
                closeOthers(card);
                if (pinned) { delete card.dataset.pinned; setOpen(false); }
                else { card.dataset.pinned = '1'; setOpen(true); }
            });

            // En táctil, tocar la tarjeta (no sólo el botón) también la abre
            if (!canHover) {
                card.addEventListener('click', (e) => {
                    if (e.target.closest('.area-toggle')) return;
                    const open = card.classList.contains('is-open');
                    closeOthers(card);
                    if (open) { delete card.dataset.pinned; setOpen(false); }
                    else { card.dataset.pinned = '1'; setOpen(true); }
                });
            }

            if (canHover) {
                card.addEventListener('pointerenter', () => setOpen(true));
                card.addEventListener('pointerleave', () => {
                    if (!card.dataset.pinned) setOpen(false);
                });
            }

            // Accesible por teclado: al enfocar el botón se muestra el panel
            toggle.addEventListener('focus', () => setOpen(true));
            card.addEventListener('focusout', (e) => {
                if (!card.dataset.pinned && !card.contains(e.relatedTarget)) setOpen(false);
            });
        });
    }

    // --- 4. CARRUSEL DE RESEÑAS DEL INICIO (auto 6s + rueda del mouse) ---
    const reviewsRail = document.getElementById('reviewsRail');
    if (reviewsRail) {
        const slides = Array.from(reviewsRail.querySelectorAll('.review-slide'));
        const dotsBox = document.getElementById('reviewsDots');
        const progress = document.getElementById('reviewsProgress');
        const INTERVAL = 6000;

        let index = Math.max(0, slides.findIndex(s => s.classList.contains('is-current')));
        let timer = null;
        let wheelLock = false;

        const dots = slides.map((_, i) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'reviews-dot';
            b.setAttribute('role', 'tab');
            b.setAttribute('aria-label', 'Reseña ' + (i + 1));
            b.addEventListener('click', () => { go(i - index); });
            if (dotsBox) dotsBox.appendChild(b);
            return b;
        });

        function paint() {
            slides.forEach((s, i) => {
                s.classList.toggle('is-current', i === index);
                s.setAttribute('aria-hidden', i === index ? 'false' : 'true');
            });
            dots.forEach((d, i) => {
                d.classList.toggle('is-active', i === index);
                d.setAttribute('aria-selected', i === index ? 'true' : 'false');
            });
            if (progress) {
                progress.style.animation = 'none';
                void progress.offsetWidth;
                progress.style.animation = '';
            }
        }

        function go(delta) {
            if (!delta) return;
            const dir = delta > 0 ? 1 : -1;
            reviewsRail.style.setProperty('--dir', dir);
            index = (index + delta % slides.length + slides.length) % slides.length;
            paint();
            restart();
        }

        function restart() {
            clearInterval(timer);
            if (reviewsRail.dataset.paused === '1') return;
            timer = setInterval(() => go(1), INTERVAL);
        }

        function pause(state) {
            reviewsRail.dataset.paused = state ? '1' : '0';
            reviewsRail.classList.toggle('is-paused', !!state);
            if (state) clearInterval(timer); else restart();
        }

        // Rueda del mouse sobre el carrusel
        reviewsRail.addEventListener('wheel', (e) => {
            const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
            if (Math.abs(d) < 4) return;
            e.preventDefault();
            if (wheelLock) return;
            wheelLock = true;
            setTimeout(() => { wheelLock = false; }, 420);
            go(d > 0 ? 1 : -1);
        }, { passive: false });

        reviewsRail.addEventListener('pointerenter', () => pause(true));
        reviewsRail.addEventListener('pointerleave', () => pause(false));
        reviewsRail.addEventListener('focusin', () => pause(true));
        reviewsRail.addEventListener('focusout', (e) => {
            if (!reviewsRail.contains(e.relatedTarget)) pause(false);
        });

        reviewsRail.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(1); }
            if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); go(-1); }
        });

        // Deslizar con el dedo dentro del carrusel
        let tStartX = 0, tStartY = 0;
        reviewsRail.addEventListener('touchstart', (e) => {
            tStartX = e.touches[0].clientX; tStartY = e.touches[0].clientY;
        }, { passive: true });
        reviewsRail.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - tStartX;
            const dy = e.changedTouches[0].clientY - tStartY;
            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
        });

        document.addEventListener('visibilitychange', () => pause(document.hidden));

        paint();
        restart();
    }

    // --- 5. PROYECTOS: CONSTELACIÓN + ESCENARIO ---
    const pjRail = document.getElementById('pjRail');
    if (pjRail) {
        const viewport   = document.getElementById('pjRailViewport');
        const nodes      = Array.from(pjRail.querySelectorAll('.pj-node'));
        const stage      = document.getElementById('pjStage');
        const stageImg   = document.getElementById('pjStageImg');
        const stageTag   = document.getElementById('pjStageTag');
        const stageTitle = document.getElementById('pjStageTitle');
        const stageDesc  = document.getElementById('pjStageDesc');
        const stageIndex = document.getElementById('pjStageIndex');
        const stageTotal = document.getElementById('pjStageTotal');
        const filterBtns = Array.from(document.querySelectorAll('.filter-btn'));
        const arrowPrev  = document.querySelector('.pj-rail-arrow.prev');
        const arrowNext  = document.querySelector('.pj-rail-arrow.next');

        const pad = (n) => String(n).padStart(2, '0');
        const visibleNodes = () => nodes.filter(n => !n.classList.contains('is-hidden'));

        function centerNode(node) {
            if (!viewport) return;
            const left = node.offsetLeft - (viewport.clientWidth - node.offsetWidth) / 2;
            viewport.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
        }

        function select(node, scroll) {
            if (!node) return;
            nodes.forEach(n => {
                const on = n === node;
                n.classList.toggle('is-active', on);
                n.setAttribute('aria-selected', on ? 'true' : 'false');
                n.setAttribute('tabindex', on ? '0' : '-1');
            });

            const img  = node.querySelector('.pj-node-thumb img');
            const tag  = node.querySelector('.pj-node-tag');
            const ttl  = node.querySelector('h4');
            const desc = node.querySelector('.pj-node-desc');

            if (stageImg && img) {
                stageImg.src = img.getAttribute('src');
                stageImg.alt = img.getAttribute('alt') || '';
            }
            if (stageTag && tag)    stageTag.textContent   = tag.textContent;
            if (stageTitle && ttl)  stageTitle.textContent = ttl.textContent;
            if (stageDesc && desc)  stageDesc.textContent  = desc.textContent;
            if (stage) stage.style.setProperty('--card-fallback', node.style.getPropertyValue('--card-fallback'));

            const list = visibleNodes();
            if (stageIndex) stageIndex.textContent = pad(Math.max(0, list.indexOf(node)) + 1);
            if (stageTotal) stageTotal.textContent = pad(list.length);

            if (stage) {
                stage.classList.remove('is-swapping');
                void stage.offsetWidth;
                stage.classList.add('is-swapping');
            }

            if (scroll !== false) centerNode(node);
        }

        function step(dir) {
            const list = visibleNodes();
            if (!list.length) return;
            const current = list.findIndex(n => n.classList.contains('is-active'));
            const next = (current + dir + list.length) % list.length;
            select(list[next]);
            list[next].focus({ preventScroll: true });
        }

        nodes.forEach(node => {
            node.addEventListener('click', () => select(node));
            node.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(node); }
            });
        });

        pjRail.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
            if (e.key === 'ArrowLeft')  { e.preventDefault(); step(-1); }
            if (e.key === 'Home')       { e.preventDefault(); select(visibleNodes()[0]); }
            if (e.key === 'End')        { e.preventDefault(); const l = visibleNodes(); select(l[l.length - 1]); }
        });

        if (arrowPrev) arrowPrev.addEventListener('click', () => step(-1));
        if (arrowNext) arrowNext.addEventListener('click', () => step(1));

        // Rueda vertical del mouse -> desplazamiento horizontal del riel
        if (viewport) {
            viewport.addEventListener('wheel', (e) => {
                const max = viewport.scrollWidth - viewport.clientWidth;
                if (max <= 1) return;
                const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
                if (!d) return;
                const atStart = viewport.scrollLeft <= 0 && d < 0;
                const atEnd   = viewport.scrollLeft >= max - 1 && d > 0;
                if (atStart || atEnd) return;   // dejamos que siga la página
                e.preventDefault();
                viewport.scrollLeft += d;
            }, { passive: false });

            const syncEdges = () => {
                const max = viewport.scrollWidth - viewport.clientWidth;
                viewport.classList.toggle('at-start', viewport.scrollLeft <= 2);
                viewport.classList.toggle('at-end', viewport.scrollLeft >= max - 2);
            };
            viewport.addEventListener('scroll', syncEdges, { passive: true });
            window.addEventListener('resize', syncEdges);
            syncEdges();
        }

        // Filtros por categoría
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');

                const value = btn.dataset.filter;
                let i = 0;
                nodes.forEach(node => {
                    const match = value === 'all' || node.dataset.category === value;
                    node.classList.toggle('is-hidden', !match);
                    if (match) node.style.setProperty('--fi', i++);
                });

                const list = visibleNodes();
                if (list.length) {
                    const active = list.find(n => n.classList.contains('is-active'));
                    select(active || list[0]);
                    if (viewport && !active) viewport.scrollTo({ left: 0, behavior: 'smooth' });
                }
                pjRail.classList.remove('is-refiltered');
                void pjRail.offsetWidth;
                pjRail.classList.add('is-refiltered');
            });
        });

        nodes.forEach((n, i) => n.style.setProperty('--fi', i));
        select(nodes.find(n => n.classList.contains('is-active')) || nodes[0], false);
    }

    // --- 6. AURORA BACKGROUND (ONDAS DE GRADIENTE SUAVES) ---
    const canvas = document.getElementById('starfield');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height, blobs = [], stars = [];
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Paleta oficial de la marca (ver style.css :root)
        const palette = [
            { r: 100, g: 255, b: 218 }, // --accent-cyan
            { r: 0,   g: 180, b: 216 }, // --accent-blue
            { r: 123, g: 44,  b: 191 }  // --accent-purple
        ];

        function resize() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; }

        // Cada "blob" es una gran mancha de gradiente radial que deriva
        // lentamente en un recorrido orgánico (senos/cosenos desfasados),
        // simulando una aurora boreal suave sobre el fondo oscuro.
        class AuroraBlob {
            constructor(colorIndex) {
                this.color = palette[colorIndex % palette.length];
                this.baseX = Math.random();
                this.baseY = Math.random();
                this.radiusRatio = 0.38 + Math.random() * 0.22;
                this.speed = 0.00012 + Math.random() * 0.00010;
                this.angle = Math.random() * Math.PI * 2;
                this.driftX = 0.16 + Math.random() * 0.12;
                this.driftY = 0.12 + Math.random() * 0.10;
                this.alpha = 0.14 + Math.random() * 0.07;
            }
            update(t) {
                this.x = (this.baseX + Math.sin(t * this.speed + this.angle) * this.driftX) * width;
                this.y = (this.baseY + Math.cos(t * this.speed * 0.8 + this.angle) * this.driftY) * height;
            }
            draw() {
                const r = Math.max(width, height) * this.radiusRatio;
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
                gradient.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha})`);
                gradient.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
            }
        }

        // Un puñado de estrellas muy tenues y sin conexiones, como guiño
        // a la identidad "Mizar" sin volver al look anterior de puntos.
        class Star {
            constructor() {
                this.x = Math.random() * width; this.y = Math.random() * height;
                this.size = Math.random() * 1.1 + 0.3;
                this.baseAlpha = Math.random() * 0.3 + 0.1;
                this.twinkleSpeed = 0.0006 + Math.random() * 0.0008;
                this.phase = Math.random() * Math.PI * 2;
            }
            draw(t) {
                const alpha = this.baseAlpha * (0.5 + 0.5 * Math.sin(t * this.twinkleSpeed + this.phase));
                ctx.fillStyle = `rgba(230, 241, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
            }
        }

        function init() {
            blobs = [0, 1, 2, 0, 1].map(i => new AuroraBlob(i));
            stars = Array.from({ length: 45 }, () => new Star());
        }

        function renderFrame(t) {
            ctx.clearRect(0, 0, width, height);
            ctx.globalCompositeOperation = 'lighter';
            blobs.forEach(blob => { blob.update(t); blob.draw(); });
            ctx.globalCompositeOperation = 'source-over';
            stars.forEach(star => star.draw(t));
        }

        function animate(t) {
            renderFrame(t);
            requestAnimationFrame(animate);
        }

        window.addEventListener('resize', resize);
        resize();
        init();

        // Respetamos la preferencia de movimiento reducido del usuario
        if (prefersReducedMotion) {
            renderFrame(0);
        } else {
            requestAnimationFrame(animate);
        }
    }
    // --- 6b. SMART HEADER (oculta el menú al bajar, lo muestra al subir) ---
    // Antes se escuchaba el scroll de cada .section, que nunca desborda:
    // el evento no llegaba a dispararse. Ahora se usa el scroll de la ventana.
    const header = document.querySelector('.main-header');
    if (header) {
        let lastScroll = window.pageYOffset || 0;
        let ticking = false;

        const onScroll = () => {
            const y = Math.max(0, window.pageYOffset || document.documentElement.scrollTop || 0);
            const menuAbierto = mobileMenu && mobileMenu.classList.contains('active');

            if (!menuAbierto && y > lastScroll + 6 && y > 90) {
                header.classList.add('is-hidden');
            } else if (y < lastScroll - 6 || y <= 90) {
                header.classList.remove('is-hidden');
            }
            header.classList.toggle('is-stuck', y > 24);
            lastScroll = y;
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
        }, { passive: true });
    }

    // --- 7. AGENDA DE REUNIONES (Contacto) ---
    const calGrid = document.getElementById('calGrid');
    if (calGrid) {
        const WA_NUMBER = '5493751340173';
        const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const DIAS   = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
        const SLOTS  = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00','18:00'];

        const calMonth    = document.getElementById('calMonth');
        const calPrev     = document.getElementById('calPrev');
        const calNext     = document.getElementById('calNext');
        const slotList    = document.getElementById('slotList');
        const slotDate    = document.getElementById('slotDate');
        const summary     = document.getElementById('schedSummary');
        const summaryText = document.getElementById('schedSummaryText');
        const confirmBtn  = document.getElementById('schedConfirm');

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const limit = new Date(today.getFullYear(), today.getMonth() + 4, 0); // 4 meses de agenda
        let cursor = new Date(today.getFullYear(), today.getMonth(), 1);
        let picked = null;      // Date elegida
        let pickedSlot = null;  // 'HH:MM'

        const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;
        const isAvailable = (d) => !isWeekend(d) && d >= today && d <= limit;

        function renderMonth() {
            calGrid.innerHTML = '';
            if (calMonth) calMonth.textContent = MESES[cursor.getMonth()] + ' ' + cursor.getFullYear();

            const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
            const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
            const offset = (first.getDay() + 6) % 7; // la semana arranca el lunes

            for (let i = 0; i < offset; i++) {
                const blank = document.createElement('span');
                blank.className = 'cal-cell is-blank';
                blank.setAttribute('aria-hidden', 'true');
                calGrid.appendChild(blank);
            }

            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'cal-cell';
                btn.textContent = day;
                btn.style.setProperty('--ci', day);
                btn.dataset.date = iso(date);

                if (date.getTime() === today.getTime()) btn.classList.add('is-today');

                if (!isAvailable(date)) {
                    btn.classList.add('is-off');
                    btn.disabled = true;
                    btn.setAttribute('aria-label', day + ' de ' + MESES[cursor.getMonth()] + ' — sin turnos');
                } else {
                    btn.setAttribute('aria-label', DIAS[date.getDay()] + ' ' + day + ' de ' + MESES[cursor.getMonth()]);
                    btn.addEventListener('click', () => pickDate(date, btn));
                }

                if (picked && iso(picked) === btn.dataset.date) btn.classList.add('is-picked');
                calGrid.appendChild(btn);
            }

            if (calPrev) calPrev.disabled = cursor.getFullYear() === today.getFullYear() && cursor.getMonth() === today.getMonth();
            if (calNext) calNext.disabled = cursor.getFullYear() === limit.getFullYear() && cursor.getMonth() >= limit.getMonth();
        }

        function pickDate(date, btn) {
            picked = date;
            pickedSlot = null;
            calGrid.querySelectorAll('.cal-cell').forEach(c => c.classList.remove('is-picked'));
            btn.classList.add('is-picked');
            renderSlots();
            updateSummary();
        }

        function renderSlots() {
            if (!slotList) return;
            slotList.innerHTML = '';

            if (!picked) {
                if (slotDate) slotDate.textContent = '— elegí un día';
                slotList.innerHTML = '<p class="slot-empty">Seleccioná una fecha en el calendario para ver los horarios libres.</p>';
                return;
            }

            if (slotDate) {
                slotDate.textContent = '· ' + DIAS[picked.getDay()] + ' ' + picked.getDate() + ' de ' + MESES[picked.getMonth()];
            }

            SLOTS.forEach((time, i) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'slot-btn';
                b.textContent = time;
                b.style.setProperty('--si', i);
                b.addEventListener('click', () => {
                    pickedSlot = time;
                    slotList.querySelectorAll('.slot-btn').forEach(s => s.classList.remove('is-picked'));
                    b.classList.add('is-picked');
                    updateSummary();
                });
                slotList.appendChild(b);
            });
        }

        function updateSummary() {
            const ready = !!(picked && pickedSlot);

            if (summary) summary.hidden = !ready;
            if (ready && summaryText) {
                summaryText.textContent = DIAS[picked.getDay()] + ' ' + picked.getDate() + ' de ' +
                    MESES[picked.getMonth()] + ' de ' + picked.getFullYear() + ' a las ' + pickedSlot + ' h (GMT-3)';
            }

            if (confirmBtn) {
                confirmBtn.classList.toggle('is-disabled', !ready);
                confirmBtn.setAttribute('aria-disabled', ready ? 'false' : 'true');
                if (ready) {
                    const msg = '¡Hola Mizar Web! Quiero agendar una reunión el ' +
                        DIAS[picked.getDay()] + ' ' + picked.getDate() + ' de ' + MESES[picked.getMonth()] +
                        ' de ' + picked.getFullYear() + ' a las ' + pickedSlot + ' h.';
                    confirmBtn.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
                } else {
                    confirmBtn.removeAttribute('href');
                }
            }
        }

        if (calPrev) calPrev.addEventListener('click', () => { cursor.setMonth(cursor.getMonth() - 1); renderMonth(); });
        if (calNext) calNext.addEventListener('click', () => { cursor.setMonth(cursor.getMonth() + 1); renderMonth(); });
        if (confirmBtn) confirmBtn.addEventListener('click', (e) => {
            if (confirmBtn.classList.contains('is-disabled')) e.preventDefault();
        });

        renderMonth();
        renderSlots();
        updateSummary();
    }

    // --- 8. PROYECTOS: ARRASTRAR EL RIEL PARA DESPLAZARLO ---
    const portfolioScroll = document.querySelector('.pj-rail-viewport');
    if (portfolioScroll) {
        let isDown = false;
        let dragMoved = false;
        let startX = 0;
        let scrollStart = 0;

        const dragStart = (x) => {
            isDown = true;
            dragMoved = false;
            startX = x;
            scrollStart = portfolioScroll.scrollLeft;
            portfolioScroll.classList.add('dragging');
        };
        const dragMove = (x) => {
            if (!isDown) return;
            const delta = x - startX;
            if (Math.abs(delta) > 5) dragMoved = true;
            portfolioScroll.scrollLeft = scrollStart - delta;
        };
        const dragEnd = () => {
            isDown = false;
            portfolioScroll.classList.remove('dragging');
        };

        portfolioScroll.addEventListener('dragstart', (e) => e.preventDefault());
        portfolioScroll.addEventListener('mousedown', (e) => dragStart(e.pageX));
        window.addEventListener('mousemove', (e) => { if (isDown) { e.preventDefault(); dragMove(e.pageX); } });
        window.addEventListener('mouseup', dragEnd);

        portfolioScroll.addEventListener('touchstart', (e) => dragStart(e.touches[0].pageX), { passive: true });
        portfolioScroll.addEventListener('touchmove', (e) => dragMove(e.touches[0].pageX), { passive: true });
        portfolioScroll.addEventListener('touchend', dragEnd);

        portfolioScroll.addEventListener('click', (e) => {
            if (dragMoved) { e.preventDefault(); e.stopPropagation(); }
        }, true);
    }

    // --- 10. SWIPE ENTRE PÁGINAS (arrastrar el dedo hacia los costados) ---
    const pageOrder = ['index.html', 'servicios.html', 'proyectos.html', 'contacto.html'];

    function currentPageIndex() {
        let path = location.pathname.split('/').pop();
        if (path === '') path = 'index.html';
        const idx = pageOrder.indexOf(path);
        return idx === -1 ? 0 : idx;
    }

    function goToAdjacentPage(delta) {
        const nextIdx = currentPageIndex() + delta;
        if (nextIdx >= 0 && nextIdx < pageOrder.length) {
            window.location.href = pageOrder[nextIdx];
        }
    }

    (function initPageSwipeNavigation() {
        // Las páginas legales quedan fuera del recorrido lateral
        if (document.body.hasAttribute('data-plain')) return;
        {
            let path = location.pathname.split('/').pop();
            if (path === '') path = 'index.html';
            if (pageOrder.indexOf(path) === -1) return;
        }

        const SWIPE_THRESHOLD = 80;
        let tracking = false;
        let startX = 0;
        let startY = 0;

        document.addEventListener('touchstart', (e) => {
            const target = e.target;
            if (target.closest('[data-no-swipe]') || target.closest('.mobile-menu-overlay') || target.closest('.reviews-popover')) {
                tracking = false;
                return;
            }
            tracking = true;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (!tracking) return;
            tracking = false;
            const touch = e.changedTouches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5) {
                goToAdjacentPage(dx < 0 ? 1 : -1);
            }
        });
    })();

    // --- 11. MENÚ MÓVIL: ARRASTRAR HACIA LA DERECHA PARA CERRAR ---
    if (mobileMenu) {
        const CLOSE_THRESHOLD = 90;
        let menuDragging = false;
        let menuStartX = 0;
        let menuCurrentX = 0;

        mobileMenu.addEventListener('touchstart', (e) => {
            if (!mobileMenu.classList.contains('active')) return;
            menuDragging = true;
            menuStartX = e.touches[0].clientX;
            menuCurrentX = menuStartX;
            mobileMenu.style.transition = 'none';
        }, { passive: true });

        mobileMenu.addEventListener('touchmove', (e) => {
            if (!menuDragging) return;
            menuCurrentX = e.touches[0].clientX;
            const delta = Math.max(0, menuCurrentX - menuStartX);
            mobileMenu.style.transform = `translateX(${delta}px)`;
        }, { passive: true });

        mobileMenu.addEventListener('touchend', () => {
            if (!menuDragging) return;
            menuDragging = false;
            mobileMenu.style.transition = '';
            const delta = menuCurrentX - menuStartX;
            mobileMenu.style.transform = '';
            if (delta > CLOSE_THRESHOLD) toggleMobileMenu();
        });
    }
});

/* ============================================================
   MIZAR MOTION LAYER — capa de movimiento
   Añade animaciones de entrada, fondo generativo, hovers
   avanzados, efectos ambientales automáticos y transiciones
   de página. No modifica la estructura del sitio.
   ============================================================ */
(function () {
    'use strict';

    var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var FINE_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    document.documentElement.classList.add('anim-ready');

    function ready(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    function rand(min, max) { return min + Math.random() * (max - min); }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    /* --------------------------------------------------------
       1. DIVISOR DE TEXTO (letras / palabras)
       Recorre los nodos de texto sin alterar la estructura de
       etiquetas internas (<strong>, <small>, etc.).
       -------------------------------------------------------- */
    function splitText(el, mode) {
        if (el.dataset.split) return 0;
        var idx = 0;

        function walk(node) {
            var kids = Array.prototype.slice.call(node.childNodes);
            kids.forEach(function (child) {
                if (child.nodeType === 3) {
                    var text = child.textContent;
                    if (!text.replace(/\s/g, '').length) return;

                    var frag = document.createDocumentFragment();
                    text.split(/(\s+)/).forEach(function (part) {
                        if (part === '') return;
                        if (/^\s+$/.test(part)) {
                            frag.appendChild(document.createTextNode(part));
                            return;
                        }
                        var word = document.createElement('span');
                        word.className = 'an-word';
                        word.style.setProperty('--wi', idx);

                        if (mode === 'chars') {
                            Array.prototype.forEach.call(part, function (ch) {
                                var c = document.createElement('span');
                                c.className = 'an-char';
                                c.textContent = ch;
                                c.style.setProperty('--ci', idx);
                                c.style.setProperty('--rnd', rand(-1, 1).toFixed(2));
                                c.style.setProperty('--rnd2', rand(-1, 1).toFixed(2));
                                idx++;
                                word.appendChild(c);
                            });
                        } else {
                            word.textContent = part;
                            idx++;
                        }
                        frag.appendChild(word);
                    });
                    node.replaceChild(frag, child);
                } else if (child.nodeType === 1 && !child.classList.contains('an-word')) {
                    walk(child);
                }
            });
        }

        var label = el.textContent.trim();
        walk(el);
        el.dataset.split = mode;
        if (label && !el.getAttribute('aria-label')) el.setAttribute('aria-label', label);
        return idx;
    }

    /* --------------------------------------------------------
       2. PLAN DE ENTRADA
       Cada grupo usa un set de animaciones distintas que rotan
       por índice, para que ningún elemento entre igual que otro.
       -------------------------------------------------------- */
    var PLAN = [
        /* --- Header --- */
        { sel: '.logo-container', anims: ['spiralIn'], d: 0.10, dur: 1.15 },
        { sel: '.nav-btn', anims: ['dropBounce', 'flipX', 'popElastic', 'liquidRise'], d: 0.30, step: 0.085, dur: 0.9 },
        { sel: '.menu-toggle', anims: ['popElastic'], d: 0.34, dur: 0.85 },

        /* --- Home: hero --- */
        { sel: '.subtitle', split: 'chars', canim: 'charWave', d: 0.52, cstep: 0.026 },
        { sel: '.glitch-title', split: 'chars', canim: 'charScatter', d: 0.72, cstep: 0.021, cdur: 1.0 },
        { sel: '.hero-actions .btn-primary', anims: ['clipWipeUp'], d: 1.28, dur: 0.9 },
        { sel: '.hero-actions .btn-secondary', anims: ['rippleReveal'], d: 1.40, dur: 0.95 },

        /* --- Home: integrantes + sobre nosotros + reseñas --- */
        { sel: '.title-about-hero', split: 'chars', canim: 'charFlip', d: 1.05, step: 0.28, cstep: 0.032 },
        { sel: '.founder-card', anims: ['unfold3d', 'tiltDrop'], d: 1.20, step: 0.16, dur: 1.2 },
        { sel: '.about-description', split: 'words', wanim: 'wordBlur', d: 1.62, wstep: 0.026 },
        { sel: '.reviews-rail', anims: ['glassSlideUp'], d: 1.72, dur: 1.2 },

        /* --- Títulos genéricos --- */
        { sel: '.section-title:not(.title-about-hero)', split: 'chars', canim: 'charRise', d: 0.52, cstep: 0.031 },
        { sel: '.portfolio-subtitle', split: 'words', wanim: 'wordUnroll', d: 0.80, wstep: 0.05 },

        /* --- Áreas --- */
        { sel: '.areas-method', split: 'words', wanim: 'wordBlur', d: 0.80, wstep: 0.018 },
        { sel: '.area-block-head', anims: ['clipWipeLeft'], d: 0.95, step: 0.16, dur: 0.9 },
        { sel: '.area-grid-services .area-card', anims: ['depthPush', 'foldPaper', 'liquidRise', 'orbitIn', 'irisOpen', 'blurRise'], d: 1.10, step: 0.075, dur: 1.05 },
        { sel: '.area-grid-skills .area-card', anims: ['irisOpen', 'tiltDrop', 'blurRise', 'foldPaper'], d: 1.24, step: 0.09, dur: 1.0 },
        { sel: '.area-grid-tools .area-card', anims: ['stretchIn', 'popElastic', 'spiralIn', 'clipWipeLeft', 'dropBounce', 'neonFlicker'], d: 1.32, step: 0.07, dur: 0.9 },

        /* --- Proyectos --- */
        { sel: '.filter-btn', anims: ['curtainSplit', 'dropBounce', 'clipWipeUp', 'popElastic', 'stretchIn', 'swingIn'], d: 0.82, step: 0.075, dur: 0.85 },
        { sel: '.pj-stage', anims: ['glassSlideUp'], d: 1.00, dur: 1.25 },
        { sel: '.pj-node', anims: ['irisOpen', 'popElastic', 'blurRise', 'dropBounce'], d: 1.22, step: 0.055, dur: 0.9 },
        { sel: '.pj-hint', split: 'words', wanim: 'wordBlur', d: 1.90, wstep: 0.03 },

        /* --- Contacto --- */
        { sel: '.contact-info-col p', split: 'words', wanim: 'wordBlur', d: 0.78, wstep: 0.03 },
        { sel: '.method', anims: ['skewSlide', 'clipWipeLeft', 'rippleReveal'], d: 0.98, step: 0.14, dur: 1.05 },
        { sel: '.glass-form', anims: ['glassSlideUp'], d: 0.82, dur: 1.25 },
        { sel: '.form-group', anims: ['slideRightBlur', 'clipWipeUp', 'blurRise', 'skewSlide'], d: 1.12, step: 0.11, dur: 0.9 },
        { sel: '.glass-form .btn-primary', anims: ['popElastic'], d: 1.62, dur: 0.95 },
        { sel: '.scheduler', anims: ['glassSlideUp'], d: 1.05, dur: 1.3 },

        /* --- Legales --- */
        { sel: '.legal-title', split: 'chars', canim: 'charRise', d: 0.28, cstep: 0.026 },
        { sel: '.legal-toc a', anims: ['clipWipeUp'], d: 0.52, step: 0.03, dur: 0.6 },
        { sel: '.legal-wrapper section', anims: ['blurRise'], d: 0.62, step: 0.05, dur: 0.8 },

        /* --- Pie --- */
        { sel: '.footer-inner', anims: ['blurRise'], d: 0.20, dur: 0.9 }
    ];

    var revealReady = false;
    var revealQueue = [];
    var readyStamp = 0;

    function reveal(el) {
        if (el.classList.contains('an-in')) return;
        if (!revealReady) {
            if (revealQueue.indexOf(el) === -1) revealQueue.push(el);
            return;
        }
        /* Fuera de la secuencia inicial usamos retardos compactos
           para que el scroll se sienta inmediato pero escalonado. */
        if (performance.now() - readyStamp > 2600) {
            var gi = parseInt(el.dataset.gi || '0', 10);
            el.style.setProperty('--d', (gi % 8) * 0.07 + 's');
        }
        el.classList.add('an-in');

        /* Al terminar, sellamos el elemento para que los efectos
           ambientales no vuelvan a disparar la animación de entrada. */
        var endMs = parseInt(el.dataset.mzEnd || '2600', 10);
        setTimeout(function () { el.classList.add('an-done'); }, endMs + 260);
    }

    function flushReveals() {
        revealReady = true;
        readyStamp = performance.now();
        document.body.classList.add('mz-ready');
        var pending = revealQueue.slice();
        revealQueue.length = 0;
        pending.forEach(reveal);
    }

    function buildEntrances() {
        var observer = null;
        if ('IntersectionObserver' in window) {
            observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        reveal(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            /* El margen horizontal es muy amplio a propósito: los nodos de
               la constelación viven en un riel con desplazamiento propio y
               quedarían invisibles si se los recortara por el eje X. El
               recorte que importa para el rendimiento es el vertical. */
            }, { threshold: 0.06, rootMargin: '260px 6000px -5% 6000px' });
        }

        PLAN.forEach(function (rule) {
            var nodes = document.querySelectorAll(rule.sel);
            Array.prototype.forEach.call(nodes, function (el, i) {
                if (el.dataset.anim || el.dataset.split || el.dataset.mzDone) return;
                el.dataset.mzDone = '1';
                el.dataset.gi = i;

                var delay = (rule.d || 0) + i * (rule.step || 0);
                el.style.setProperty('--d', delay.toFixed(3) + 's');

                var endMs;
                if (rule.split) {
                    var pieces = splitText(el, rule.split) || 1;
                    endMs = (delay
                        + pieces * (rule.split === 'chars' ? (rule.cstep || 0.032) : (rule.wstep || 0.045))
                        + (rule.split === 'chars' ? (rule.cdur || 0.78) : (rule.wdur || 0.85))) * 1000;
                } else {
                    endMs = (delay + (rule.dur || 1)) * 1000;
                }
                el.dataset.mzEnd = Math.round(endMs);

                if (rule.split) {
                    if (rule.split === 'chars') {
                        el.setAttribute('data-canim', rule.canim || 'charRise');
                        el.style.setProperty('--cstep', (rule.cstep || 0.032) + 's');
                        if (rule.cdur) el.style.setProperty('--cdur', rule.cdur + 's');
                    } else {
                        el.setAttribute('data-wanim', rule.wanim || 'wordBlur');
                        el.style.setProperty('--wstep', (rule.wstep || 0.045) + 's');
                        if (rule.wdur) el.style.setProperty('--wdur', rule.wdur + 's');
                    }
                } else {
                    var name = rule.anims[i % rule.anims.length];
                    el.setAttribute('data-anim', name);
                    if (rule.dur) el.style.setProperty('--dur', rule.dur + 's');
                }

                if (observer) observer.observe(el); else reveal(el);
            });
        });
    }

    /* Los nodos del riel de proyectos viven dentro de un contenedor con
       overflow propio: los que quedan fuera de su recorte nunca cuentan
       como visibles para IntersectionObserver, por más rootMargin que se
       le ponga. Se revelan todos juntos cuando el riel entra en pantalla. */
    function revealRailNodes() {
        var vp = document.querySelector('.pj-rail-viewport');
        if (!vp) return;
        var nodes = vp.querySelectorAll('.pj-node');
        var fire = function () { Array.prototype.forEach.call(nodes, reveal); };

        if (!('IntersectionObserver' in window)) { fire(); return; }

        var io = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) { io.disconnect(); fire(); }
        }, { threshold: 0.02, rootMargin: '300px 0px 200px 0px' });
        io.observe(vp);
    }

    /* Reveal forzado para contenedores que pasan de display:none
       a visible (pestañas, menú, popover). */
    function forceReveal(root, stagger) {
        var items = root.querySelectorAll('[data-anim], [data-split]');
        Array.prototype.forEach.call(items, function (el, i) {
            el.classList.remove('an-in', 'an-done');
            el.style.setProperty('--d', (i * (stagger || 0.06)).toFixed(3) + 's');
            void el.offsetWidth;
            el.classList.add('an-in');
            var end = parseInt(el.dataset.mzEnd || '2000', 10);
            setTimeout(function () { el.classList.add('an-done'); }, end + 260);
        });
    }

    /* --------------------------------------------------------
       3. FONDO AMBIENTAL GENERATIVO
       Formas minimalistas, cintas ondulantes, polvo, ondas
       expansivas y meteoros ocasionales.
       -------------------------------------------------------- */
    function initAmbientBackground() {
        if (REDUCED) return;

        var canvas = document.createElement('canvas');
        canvas.id = 'ambient-layer';
        canvas.setAttribute('aria-hidden', 'true');
        document.body.appendChild(canvas);

        var ctx = canvas.getContext('2d');
        var W = 0, H = 0, DPR = 1;
        var polys = [], ribbons = [], dust = [], ripples = [], meteors = [], orbits = [];
        var mx = 0, my = 0, tmx = 0, tmy = 0;
        var lastRipple = 0, lastMeteor = 0;

        var CYAN = '100, 255, 218';
        var BLUE = '0, 180, 216';
        var PURP = '150, 90, 220';
        var TONES = [CYAN, BLUE, PURP];

        function resize() {
            DPR = Math.min(window.devicePixelRatio || 1, 2);
            W = window.innerWidth;
            H = window.innerHeight;
            canvas.width = W * DPR;
            canvas.height = H * DPR;
            canvas.style.width = W + 'px';
            canvas.style.height = H + 'px';
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        }

        /* --- Polígonos wireframe que orbitan y respiran --- */
        function Poly() {
            this.sides = Math.floor(rand(3, 7));
            this.r = rand(38, 118);
            this.x = rand(0.05, 0.95);
            this.y = rand(0.05, 0.95);
            this.rot = rand(0, Math.PI * 2);
            this.spin = rand(-0.00016, 0.00016);
            this.driftA = rand(0, Math.PI * 2);
            this.driftS = rand(0.00006, 0.00016);
            this.driftR = rand(0.03, 0.10);
            this.breath = rand(0.00035, 0.00075);
            this.depth = rand(0.25, 1);
            this.tone = pick(TONES);
            this.alpha = rand(0.10, 0.26);
            this.dashed = Math.random() > 0.62;
        }
        Poly.prototype.draw = function (t) {
            var cx = (this.x + Math.cos(t * this.driftS + this.driftA) * this.driftR) * W + mx * 46 * this.depth;
            var cy = (this.y + Math.sin(t * this.driftS * 0.83 + this.driftA) * this.driftR * 0.7) * H + my * 34 * this.depth;
            var scale = 1 + Math.sin(t * this.breath + this.driftA) * 0.16;
            var rr = this.r * scale * this.depth;
            var ang = this.rot + t * this.spin;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(ang);
            ctx.beginPath();
            for (var i = 0; i <= this.sides; i++) {
                var a = (i / this.sides) * Math.PI * 2;
                var px = Math.cos(a) * rr;
                var py = Math.sin(a) * rr;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
            if (this.dashed) ctx.setLineDash([5, 9]); else ctx.setLineDash([]);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(' + this.tone + ', ' + (this.alpha * (0.65 + 0.35 * Math.sin(t * 0.0004 + this.driftA))).toFixed(3) + ')';
            ctx.stroke();

            /* Vértice luminoso que recorre el polígono */
            var vi = (t * 0.00022 + this.driftA) % 1;
            var va = vi * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(Math.cos(va) * rr, Math.sin(va) * rr, 1.8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + this.tone + ', 0.75)';
            ctx.fill();
            ctx.restore();
        };

        /* --- Cintas sinusoidales (seda flotante) --- */
        function Ribbon(i) {
            this.base = 0.18 + i * 0.24;
            this.amp = rand(24, 70);
            this.freq = rand(0.0016, 0.0034);
            this.speed = rand(0.00016, 0.00032);
            this.phase = rand(0, Math.PI * 2);
            this.tone = TONES[i % TONES.length];
            this.alpha = rand(0.10, 0.19);
            this.depth = rand(0.3, 1);
            this.width = rand(0.9, 1.8);
        }
        Ribbon.prototype.draw = function (t) {
            var y0 = this.base * H + my * 30 * this.depth;
            ctx.beginPath();
            for (var x = -40; x <= W + 40; x += 14) {
                var y = y0
                    + Math.sin(x * this.freq + t * this.speed + this.phase) * this.amp
                    + Math.sin(x * this.freq * 0.47 - t * this.speed * 1.7) * this.amp * 0.42;
                if (x === -40) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            var grad = ctx.createLinearGradient(0, 0, W, 0);
            grad.addColorStop(0, 'rgba(' + this.tone + ', 0)');
            grad.addColorStop(0.5, 'rgba(' + this.tone + ', ' + this.alpha + ')');
            grad.addColorStop(1, 'rgba(' + this.tone + ', 0)');
            ctx.strokeStyle = grad;
            ctx.lineWidth = this.width;
            ctx.setLineDash([]);
            ctx.stroke();
        };

        /* --- Polvo estelar a la deriva --- */
        function Dust() { this.reset(true); }
        Dust.prototype.reset = function (initial) {
            this.x = rand(0, 1);
            this.y = initial ? rand(0, 1) : rand(0.98, 1.12);
            this.size = rand(0.5, 1.9);
            this.vy = rand(0.000018, 0.000062);
            this.sway = rand(0.00018, 0.00055);
            this.swayAmp = rand(0.004, 0.022);
            this.phase = rand(0, Math.PI * 2);
            this.alpha = rand(0.12, 0.5);
            this.depth = rand(0.2, 1);
            this.tone = Math.random() > 0.72 ? pick(TONES) : '230, 241, 255';
        };
        Dust.prototype.draw = function (t, dt) {
            this.y -= this.vy * dt;
            if (this.y < -0.06) this.reset(false);
            var px = (this.x + Math.sin(t * this.sway + this.phase) * this.swayAmp) * W + mx * 24 * this.depth;
            var py = this.y * H + my * 18 * this.depth;
            var a = this.alpha * (0.45 + 0.55 * Math.sin(t * 0.0009 + this.phase));
            ctx.beginPath();
            ctx.arc(px, py, this.size * this.depth, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + this.tone + ', ' + a.toFixed(3) + ')';
            ctx.fill();
        };

        /* --- Ondas expansivas ocasionales --- */
        function Ripple() {
            this.x = rand(0.1, 0.9) * W;
            this.y = rand(0.1, 0.9) * H;
            this.r = 0;
            this.max = rand(140, 340);
            this.speed = rand(0.34, 0.68);
            this.tone = pick(TONES);
            this.rings = Math.floor(rand(2, 4));
        }
        Ripple.prototype.draw = function (dt) {
            this.r += this.speed * dt * 0.06;
            var done = this.r > this.max;
            for (var i = 0; i < this.rings; i++) {
                var rr = this.r - i * 26;
                if (rr <= 0) continue;
                var fade = 1 - rr / this.max;
                if (fade <= 0) continue;
                ctx.beginPath();
                ctx.arc(this.x, this.y, rr, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(' + this.tone + ', ' + (fade * 0.22 * (1 - i * 0.3)).toFixed(3) + ')';
                ctx.lineWidth = 1;
                ctx.setLineDash([]);
                ctx.stroke();
            }
            return done;
        };

        /* --- Meteoros muy espaciados --- */
        function Meteor() {
            var fromLeft = Math.random() > 0.5;
            this.x = fromLeft ? rand(-0.1, 0.35) * W : rand(0.65, 1.1) * W;
            this.y = rand(-0.1, 0.4) * H;
            this.len = rand(120, 300);
            this.speed = rand(0.16, 0.34);
            this.dir = fromLeft ? 1 : -1;
            this.slope = rand(0.35, 0.75);
            this.life = 0;
            this.maxLife = rand(1500, 2600);
            this.tone = Math.random() > 0.5 ? CYAN : BLUE;
        }
        Meteor.prototype.draw = function (dt) {
            this.life += dt;
            this.x += this.speed * this.dir * dt * 0.35;
            this.y += this.speed * this.slope * dt * 0.35;
            var p = this.life / this.maxLife;
            var fade = Math.sin(Math.min(p, 1) * Math.PI);
            var tx = this.x - this.len * this.dir;
            var ty = this.y - this.len * this.slope;
            var g = ctx.createLinearGradient(this.x, this.y, tx, ty);
            g.addColorStop(0, 'rgba(' + this.tone + ', ' + (0.55 * fade).toFixed(3) + ')');
            g.addColorStop(1, 'rgba(' + this.tone + ', 0)');
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(tx, ty);
            ctx.strokeStyle = g;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([]);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(this.x, this.y, 1.8 * fade + 0.4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,' + (0.6 * fade).toFixed(3) + ')';
            ctx.fill();
            return p >= 1;
        };

        /* --- Sistemas binarios (guiño a Mizar) --- */
        function Orbit() {
            this.x = rand(0.12, 0.88);
            this.y = rand(0.12, 0.88);
            this.r = rand(16, 34);
            this.speed = rand(0.00035, 0.0007);
            this.phase = rand(0, Math.PI * 2);
            this.driftA = rand(0, Math.PI * 2);
            this.driftS = rand(0.00005, 0.00011);
            this.depth = rand(0.4, 1);
        }
        Orbit.prototype.draw = function (t) {
            var cx = (this.x + Math.cos(t * this.driftS + this.driftA) * 0.05) * W + mx * 30 * this.depth;
            var cy = (this.y + Math.sin(t * this.driftS + this.driftA) * 0.04) * H + my * 22 * this.depth;
            var a = t * this.speed + this.phase;

            ctx.beginPath();
            ctx.arc(cx, cy, this.r, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(' + CYAN + ', 0.07)';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 6]);
            ctx.stroke();
            ctx.setLineDash([]);

            var p1x = cx + Math.cos(a) * this.r, p1y = cy + Math.sin(a) * this.r;
            var p2x = cx + Math.cos(a + Math.PI) * this.r * 0.72, p2y = cy + Math.sin(a + Math.PI) * this.r * 0.72;

            ctx.beginPath();
            ctx.arc(p1x, p1y, 2.1, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + CYAN + ', 0.55)';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(p2x, p2y, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + BLUE + ', 0.45)';
            ctx.fill();
        };

        function build() {
            var area = W * H;
            var polyCount = area > 900000 ? 9 : 6;
            var dustCount = area > 900000 ? 78 : 42;
            polys = []; ribbons = []; dust = []; orbits = [];
            for (var i = 0; i < polyCount; i++) polys.push(new Poly());
            for (var r = 0; r < 3; r++) ribbons.push(new Ribbon(r));
            for (var d = 0; d < dustCount; d++) dust.push(new Dust());
            for (var o = 0; o < 2; o++) orbits.push(new Orbit());
        }

        var prev = 0;
        function frame(t) {
            var dt = Math.min(t - prev, 48);
            prev = t;

            if (document.hidden) { requestAnimationFrame(frame); return; }

            mx += (tmx - mx) * 0.045;
            my += (tmy - my) * 0.045;

            ctx.clearRect(0, 0, W, H);
            ctx.globalCompositeOperation = 'lighter';

            ribbons.forEach(function (r) { r.draw(t); });
            polys.forEach(function (p) { p.draw(t); });
            orbits.forEach(function (o) { o.draw(t); });
            dust.forEach(function (d) { d.draw(t, dt); });

            if (t - lastRipple > rand(5200, 9600)) {
                ripples.push(new Ripple());
                lastRipple = t;
            }
            ripples = ripples.filter(function (r) { return !r.draw(dt); });

            if (t - lastMeteor > rand(11000, 20000)) {
                meteors.push(new Meteor());
                lastMeteor = t;
            }
            meteors = meteors.filter(function (m) { return !m.draw(dt); });

            ctx.globalCompositeOperation = 'source-over';
            requestAnimationFrame(frame);
        }

        window.addEventListener('resize', function () { resize(); build(); });
        if (FINE_POINTER) {
            window.addEventListener('pointermove', function (e) {
                tmx = (e.clientX / window.innerWidth - 0.5) * 2;
                tmy = (e.clientY / window.innerHeight - 0.5) * 2;
            }, { passive: true });
        }

        resize();
        build();
        requestAnimationFrame(frame);
    }

    /* --------------------------------------------------------
       4. HOVER AVANZADO — tilt 3D, magnetismo, spotlight
       -------------------------------------------------------- */
    function attachPointerFx(el, opts) {
        var raf = null, rect = null;

        function update(e) {
            if (!rect) rect = el.getBoundingClientRect();
            var px = (e.clientX - rect.left) / rect.width;
            var py = (e.clientY - rect.top) / rect.height;
            px = Math.max(0, Math.min(1, px));
            py = Math.max(0, Math.min(1, py));

            if (raf) return;
            raf = requestAnimationFrame(function () {
                raf = null;
                el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
                el.style.setProperty('--my', (py * 100).toFixed(1) + '%');

                if (opts.tilt) {
                    el.style.setProperty('--ry', ((px - 0.5) * 2 * opts.tilt).toFixed(2) + 'deg');
                    el.style.setProperty('--rx', (-(py - 0.5) * 2 * opts.tilt).toFixed(2) + 'deg');
                    el.style.setProperty('--px', (px - 0.5).toFixed(3));
                    el.style.setProperty('--py', (py - 0.5).toFixed(3));
                }
                if (opts.magnet) {
                    el.style.setProperty('--tx', ((px - 0.5) * 2 * opts.magnet).toFixed(2) + 'px');
                    el.style.setProperty('--ty', ((py - 0.5) * 2 * opts.magnet).toFixed(2) + 'px');
                }
            });
        }

        el.addEventListener('pointerenter', function () { rect = el.getBoundingClientRect(); });
        el.addEventListener('pointermove', update);
        el.addEventListener('pointerleave', function () {
            rect = null;
            el.style.setProperty('--rx', '0deg');
            el.style.setProperty('--ry', '0deg');
            el.style.setProperty('--tx', '0px');
            el.style.setProperty('--ty', '0px');
            el.style.setProperty('--px', '0');
            el.style.setProperty('--py', '0');
        });
    }

    function initHoverFx() {
        if (!FINE_POINTER) return;

        var tilts = [
            ['.pj-node', 8],
            ['.pj-stage-media', 5],
            ['.founder-card', 7],
            ['.area-grid-skills .area-card', 8],
            ['.area-grid-tools .area-card', 10],
            ['.method', 6]
        ];
        tilts.forEach(function (pair) {
            Array.prototype.forEach.call(document.querySelectorAll(pair[0]), function (el) {
                attachPointerFx(el, { tilt: pair[1] });
            });
        });

        var magnets = ['.btn-primary', '.btn-secondary', '.nav-btn', '.filter-btn', '.pj-rail-arrow', '.cal-nav'];
        magnets.forEach(function (sel) {
            Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) {
                attachPointerFx(el, { magnet: 7 });
            });
        });

        /* Estados del cursor sobre elementos interactivos */
        var hotSel = 'a, button, input, textarea, select, .pj-node, .founder-card, .area-card, .review-slide';
        var wasHot = false;
        document.addEventListener('pointermove', function (e) {
            var hot = !!(e.target.closest && e.target.closest(hotSel));
            if (hot !== wasHot) {
                wasHot = hot;
                document.body.classList.toggle('mz-hot', hot);
            }
        }, { passive: true });
    }

    /* --- Aura de cursor con retardo --- */
    function initCursorAura() {
        if (!FINE_POINTER || REDUCED) return;

        var aura = document.createElement('div');
        aura.className = 'mz-aura';
        var dot = document.createElement('div');
        dot.className = 'mz-dot';
        aura.setAttribute('aria-hidden', 'true');
        dot.setAttribute('aria-hidden', 'true');
        document.body.appendChild(aura);
        document.body.appendChild(dot);

        var tx = window.innerWidth / 2, ty = window.innerHeight / 2;
        var ax = tx, ay = ty, dx = tx, dy = ty;

        window.addEventListener('pointermove', function (e) {
            tx = e.clientX; ty = e.clientY;
            document.body.classList.add('mz-pointer-active');
        }, { passive: true });

        window.addEventListener('pointerleave', function () {
            document.body.classList.remove('mz-pointer-active');
        });

        (function loop() {
            ax += (tx - ax) * 0.085;
            ay += (ty - ay) * 0.085;
            dx += (tx - dx) * 0.24;
            dy += (ty - dy) * 0.24;
            aura.style.transform = 'translate3d(' + ax.toFixed(1) + 'px,' + ay.toFixed(1) + 'px,0)';
            dot.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0)';
            requestAnimationFrame(loop);
        })();
    }

    /* --- Etiquetas con relevo vertical al pasar el cursor ---
       Reemplaza al antiguo "descifrado" de letras aceleradas. El efecto
       ahora vive en CSS (.nav-btn > span + ::after leído de data-label),
       por lo que no cuesta ni un frame de JS. Acá sólo completamos
       data-label en los botones que no lo traigan desde el HTML. */
    function initLabelSwap() {
        var targets = document.querySelectorAll(
            '.nav-btn, .mob-nav-btn, .filter-btn, .btn-primary, .btn-secondary, .footer-links a'
        );

        Array.prototype.forEach.call(targets, function (el) {
            if (el.querySelector('.lbl')) return;

            var text = (el.dataset.label || el.textContent || '').trim();
            if (!text) return;
            el.dataset.label = text;

            /* Los iconos que ya viniesen en el botón se conservan */
            var icons = Array.prototype.slice.call(el.children).filter(function (c) {
                return c.tagName === 'I';
            });

            var wrap = document.createElement('span');
            wrap.className = 'lbl';

            var front = document.createElement('span');
            front.className = 'lbl-a';
            front.textContent = text;

            var back = document.createElement('span');
            back.className = 'lbl-b';
            back.setAttribute('aria-hidden', 'true');
            back.textContent = text;

            wrap.appendChild(front);
            wrap.appendChild(back);

            el.textContent = '';
            icons.forEach(function (ic) { el.appendChild(ic); });
            el.appendChild(wrap);
        });
    }

    /* --------------------------------------------------------
       5. DIRECTOR AMBIENTAL
       Dispara efectos puntuales cada cierto tiempo sobre
       elementos aleatorios visibles.
       -------------------------------------------------------- */
    function addTemp(el, cls, ms) {
        if (el.classList.contains(cls)) return;
        el.classList.add(cls);
        setTimeout(function () { el.classList.remove(cls); }, ms);
    }

    function isVisible(el) {
        if (!el.offsetParent && el.style.position !== 'fixed') return false;
        var r = el.getBoundingClientRect();
        return r.bottom > 0 && r.top < window.innerHeight && r.width > 0;
    }

    function initAmbientConductor() {
        if (REDUCED) return;

        var SCHEDULE = [
            { sel: '.pj-node:not(.is-active)', cls: 'amb-glint', ms: 1500, every: 2600, burst: 1 },
            { sel: '.founder-card', cls: 'amb-trace', ms: 2600, every: 6500 },
            { sel: '.founder-card', cls: 'amb-pop', ms: 1700, every: 9000 },
            { sel: '.area-grid-skills .area-card', cls: 'amb-trace', ms: 2600, every: 5200 },
            { sel: '.area-grid-tools .area-card', cls: 'amb-spin-icon', ms: 1600, every: 3800 },
            { sel: '.area-grid-tools .area-card', cls: 'amb-trace', ms: 2600, every: 6200 },
            { sel: '.area-grid-services .area-card:not(.is-open)', cls: 'amb-tilt-nudge', ms: 1800, every: 5000 },
            { sel: '.method', cls: 'amb-slide-hint', ms: 1500, every: 5600 },
            { sel: '.filter-btn:not(.active)', cls: 'amb-sheen', ms: 1300, every: 4200 },
            { sel: '.nav-btn:not(.active)', cls: 'amb-sheen', ms: 1300, every: 7000 },
            { sel: '.btn-primary, .btn-secondary', cls: 'amb-pulse', ms: 2000, every: 6800 },
            { sel: '.form-group', cls: 'amb-line', ms: 1800, every: 5000 },
            { sel: '.section-title, .area-title', cls: 'amb-title-sweep', ms: 1800, every: 12000 },
            { sel: '.menu-toggle', cls: 'amb-pulse', ms: 1200, every: 9500 }
        ];

        SCHEDULE.forEach(function (task) {
            var kick = function () {
                if (!document.hidden) {
                    var nodes = Array.prototype.filter.call(
                        document.querySelectorAll(task.sel), isVisible
                    );
                    if (nodes.length) {
                        var n = task.burst || 1;
                        for (var i = 0; i < n; i++) addTemp(pick(nodes), task.cls, task.ms);
                    }
                }
                setTimeout(kick, task.every * rand(0.75, 1.45));
            };
            setTimeout(kick, rand(2500, task.every));
        });
    }

    /* --------------------------------------------------------
       6. TRANSICIÓN ENTRE PÁGINAS
       -------------------------------------------------------- */
    /* Transición "horizonte": una línea de luz cruza la pantalla y de
       ella se abre el velo. Al cargar la página siguiente el velo se
       cierra sobre esa misma línea y la línea se apaga. Sólo usa
       transform y opacity: una sola capa compuesta, cero reflow. */
    function initPageTransition() {
        var veil = document.createElement('div');
        veil.className = 'mz-veil';
        veil.setAttribute('aria-hidden', 'true');
        veil.innerHTML = '<span class="mz-veil-panel top"></span>' +
                         '<span class="mz-veil-panel bottom"></span>' +
                         '<span class="mz-veil-line"></span>';
        document.body.appendChild(veil);

        /* Entrada: arrancamos cubiertos y abrimos. */
        document.body.classList.add('mz-entering');
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                document.body.classList.remove('mz-entering');
                document.body.classList.add('mz-entered');
                setTimeout(function () { document.body.classList.remove('mz-entered'); }, 900);
            });
        });

        if (REDUCED) return;

        document.addEventListener('click', function (e) {
            var link = e.target.closest ? e.target.closest('a[href]') : null;
            if (!link) return;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

            var href = link.getAttribute('href');
            if (!href || href.charAt(0) === '#' || link.target === '_blank') return;
            if (!/\.html($|\?|#)/.test(href)) return;
            if (link.origin && link.origin !== location.origin) return;

            var current = location.pathname.split('/').pop() || 'index.html';
            if (href.split('?')[0].split('#')[0] === current) return;

            e.preventDefault();
            document.body.classList.add('mz-leaving');
            setTimeout(function () { window.location.href = href; }, 560);
        });

        /* Si el usuario vuelve con el botón atrás, el navegador puede
           restaurar la página desde caché con el velo aún cerrado. */
        window.addEventListener('pageshow', function (ev) {
            if (ev.persisted) document.body.classList.remove('mz-leaving');
        });
    }

    /* --------------------------------------------------------
       7. ENGANCHES A LA UI EXISTENTE
       -------------------------------------------------------- */
    function initHooks() {
        /* Índices para escalonar animaciones CSS */
        function indexAll(sel) {
            Array.prototype.forEach.call(document.querySelectorAll(sel), function (el, i) {
                el.style.setProperty('--i', i);
            });
        }
        indexAll('.mob-nav-btn');
        indexAll('.mobile-social-row a');
        indexAll('.service-icon');
        indexAll('.area-grid-skills .area-card i');
        indexAll('.area-grid-tools .area-card i');
        indexAll('.method i');
        indexAll('.footer-links a');

        Array.prototype.forEach.call(document.querySelectorAll('.area-drawer-inner ul'), function (ul) {
            Array.prototype.forEach.call(ul.children, function (li, i) {
                li.style.setProperty('--li', i);
            });
        });

        /* Filtros de proyectos: entrada escalonada de los nodos visibles */
        Array.prototype.forEach.call(document.querySelectorAll('.filter-btn'), function (btn) {
            btn.addEventListener('click', function () {
                setTimeout(function () {
                    var visible = document.querySelectorAll('.pj-node:not(.is-hidden)');
                    Array.prototype.forEach.call(visible, function (card, i) {
                        card.classList.remove('filtered-in');
                        card.style.setProperty('--fi', i);
                        void card.offsetWidth;
                        card.classList.add('filtered-in');
                    });
                }, 20);
            });
        });

        /* Ondas al hacer clic sobre botones (efecto material sutil) */
        if (!REDUCED) {
            document.addEventListener('pointerdown', function (e) {
                var t = e.target.closest ? e.target.closest('.btn-primary, .btn-secondary, .filter-btn, .pj-rail-arrow, .cal-cell, .slot-btn, .area-toggle') : null;
                if (!t) return;
                var r = t.getBoundingClientRect();
                var ink = document.createElement('span');
                ink.style.cssText = 'position:absolute;border-radius:50%;pointer-events:none;' +
                    'left:' + (e.clientX - r.left) + 'px;top:' + (e.clientY - r.top) + 'px;' +
                    'width:8px;height:8px;margin:-4px 0 0 -4px;' +
                    'background:radial-gradient(circle,rgba(100,255,218,.55),rgba(100,255,218,0) 70%);' +
                    'transform:scale(0);opacity:1;z-index:-1;' +
                    'transition:transform .65s cubic-bezier(.16,1,.3,1),opacity .65s ease;';
                t.appendChild(ink);
                requestAnimationFrame(function () {
                    ink.style.transform = 'scale(' + (Math.max(r.width, r.height) / 8 * 2.6) + ')';
                    ink.style.opacity = '0';
                });
                setTimeout(function () { ink.remove(); }, 700);
            });
        }
    }

    /* --------------------------------------------------------
       8. ARRANQUE — sincronizado con el preloader
       -------------------------------------------------------- */
    function waitForPreloader(done) {
        var pre = document.getElementById('preloader');
        if (!pre) { done(); return; }

        var fired = false;
        function go() {
            if (fired) return;
            fired = true;
            done();
        }

        if (pre.classList.contains('loaded')) { go(); return; }

        if ('MutationObserver' in window) {
            var mo = new MutationObserver(function () {
                if (pre.classList.contains('loaded')) {
                    mo.disconnect();
                    setTimeout(go, 120);
                }
            });
            mo.observe(pre, { attributes: true, attributeFilter: ['class'] });
        }
        /* Red de seguridad: nunca dejamos el contenido oculto */
        setTimeout(go, 2600);
    }

    ready(function () {
        /* Las páginas legales llevan data-plain: layout y tipografía
           iguales, pero sin fondo generativo ni efectos ambientales. */
        var PLAIN = document.body.hasAttribute('data-plain');

        initLabelSwap();
        buildEntrances();
        revealRailNodes();
        initHooks();
        initPageTransition();

        if (!PLAIN) {
            initAmbientBackground();
            initHoverFx();
            initCursorAura();
            initAmbientConductor();
        }

        waitForPreloader(flushReveals);
    });
})();

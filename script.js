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

    // --- 3. ÁREAS: SELECTOR DE CATEGORÍAS DEL CARRUSEL ---
    const areasSelector = document.querySelector('.areas-selector');
    if (areasSelector) {
        const catBtns = Array.from(areasSelector.querySelectorAll('.areas-cat-btn'));
        const areasViewport = document.querySelector('.areas-carousel');
        const areasTracks = areasViewport ? Array.from(areasViewport.querySelectorAll('.areas-carousel-track')) : [];

        catBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;

                catBtns.forEach(b => {
                    const active = b === btn;
                    b.classList.toggle('is-active', active);
                    b.setAttribute('aria-selected', active ? 'true' : 'false');
                });

                areasTracks.forEach(track => {
                    const match = track.dataset.panel === category;
                    track.hidden = !match;
                    if (!match) return;

                    // Vuelve a disparar la entrada del panel
                    track.style.animation = 'none';
                    void track.offsetWidth;
                    track.style.animation = '';

                    // Red de seguridad: si el observador de entrada nunca vio
                    // estas tarjetas (estaban en display:none al cargar la
                    // página), se revelan igual al mostrar el panel.
                    track.querySelectorAll('[data-anim]:not(.an-in)').forEach(el => el.classList.add('an-in'));
                });

                if (areasViewport) areasViewport.scrollTo({ left: 0, behavior: 'auto' });
            });
        });

        // Rueda vertical del mouse -> desplazamiento horizontal del carrusel
        // (mismo criterio que el riel de proyectos; en la versión apilada
        // de mobile no hace nada porque no hay overflow horizontal).
        if (areasViewport) {
            areasViewport.addEventListener('wheel', (e) => {
                const max = areasViewport.scrollWidth - areasViewport.clientWidth;
                if (max <= 1) return;
                const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
                if (!d) return;
                const atStart = areasViewport.scrollLeft <= 0 && d < 0;
                const atEnd   = areasViewport.scrollLeft >= max - 1 && d > 0;
                if (atStart || atEnd) return;   // dejamos que siga la página
                e.preventDefault();
                areasViewport.scrollLeft += d;
            }, { passive: false });
        }
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
        const stageCta   = document.getElementById('pjStageCta');
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
            if (stageCta) stageCta.href = node.dataset.url || '#';
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

        // Deslizar con el dedo sobre el escenario grande para cambiar de
        // proyecto (mobile/tablet). El cambio de contenido ya dispara la
        // transición suave de select() (clase is-swapping).
        if (stage) {
            let sStartX = 0, sStartY = 0;
            stage.addEventListener('touchstart', (e) => {
                sStartX = e.touches[0].clientX;
                sStartY = e.touches[0].clientY;
            }, { passive: true });
            stage.addEventListener('touchend', (e) => {
                const dx = e.changedTouches[0].clientX - sStartX;
                const dy = e.changedTouches[0].clientY - sStartY;
                if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
            });
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

    // --- 6. FONDO ---
    // El fondo animado vive ahora enteramente en CSS (#background-layer).
    // Se retiró el canvas de aurora: redibujaba cinco degradados a pantalla
    // completa en cada frame, que era el mayor consumo de memoria y CPU.

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

    // --- 7b. FORMULARIO DE CONTACTO (envío sin recargar la página) ---
    // El sitio es estático (GitHub Pages): no hay servidor propio que pueda
    // mandar un mail. El formulario hace POST a Web3Forms, que es quien lo
    // entrega a la casilla. Acá sólo interceptamos el envío para dar
    // respuesta en pantalla en vez de saltar a otra página.
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        const statusBox = document.getElementById('cfStatus');
        const submitBtn = document.getElementById('cfSubmit');
        const btnLabel  = submitBtn ? (submitBtn.querySelector('.lbl-a') || submitBtn.querySelector('span')) : null;
        const originalLabel = btnLabel ? btnLabel.textContent : 'Enviar Mensaje';
        let sending = false;

        function setStatus(text, kind) {
            if (!statusBox) return;
            statusBox.textContent = text;
            statusBox.classList.remove('is-ok', 'is-error', 'is-info');
            if (kind) statusBox.classList.add('is-' + kind);
            statusBox.hidden = !text;
        }

        function setBusy(state) {
            sending = state;
            if (submitBtn) {
                submitBtn.disabled = state;
                submitBtn.classList.toggle('is-sending', state);
            }
            if (btnLabel) btnLabel.textContent = state ? 'Enviando…' : originalLabel;
        }

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (sending) return;

            // Validación propia: novalidate desactiva los globos del navegador
            // para poder mostrar el aviso con el estilo del sitio.
            if (!contactForm.checkValidity()) {
                setStatus('Completá nombre, email y mensaje para poder enviarlo.', 'error');
                const firstBad = contactForm.querySelector(':invalid');
                if (firstBad) firstBad.focus();
                return;
            }

            setBusy(true);
            setStatus('Enviando tu mensaje…', 'info');

            try {
                const res = await fetch(contactForm.action, {
                    method: 'POST',
                    headers: { 'Accept': 'application/json' },
                    body: new FormData(contactForm)
                });
                const data = await res.json().catch(() => ({}));

                if (res.ok && data.success) {
                    contactForm.reset();
                    setStatus('¡Listo! Recibimos tu mensaje y te respondemos a la brevedad.', 'ok');
                } else {
                    setStatus('No pudimos enviarlo. Escribinos por WhatsApp y lo resolvemos.', 'error');
                }
            } catch (err) {
                // Sin conexión, o el navegador bloqueó la petición.
                setStatus('No hay conexión con el servidor. Probá de nuevo o escribinos por WhatsApp.', 'error');
            } finally {
                setBusy(false);
            }
        });
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
       1. PLAN DE ENTRADA
       El troceado de textos por letra y por palabra se retiró: creaba
       cientos de <span> por página sólo para animarlos una vez. Ahora
       cada bloque entra completo con una de dos animaciones livianas
       (desenfoque ascendente o deslizamiento de panel), que el
       compositor resuelve sin repintar el contenido.
       -------------------------------------------------------- */
    var PLAN = [
        /* --- Header --- */
        { sel: '.logo-container', anims: ['blurRise'], d: 0.10, dur: 0.8 },
        { sel: '.nav-btn', anims: ['blurRise'], d: 0.24, step: 0.06, dur: 0.7 },
        { sel: '.menu-toggle', anims: ['blurRise'], d: 0.28, dur: 0.7 },

        /* --- Home: hero --- */
        { sel: '.subtitle', anims: ['blurRise'], d: 0.34, dur: 0.75 },
        { sel: '.glitch-title', anims: ['blurRise'], d: 0.42, dur: 0.85 },
        { sel: '.hero-actions .btn-primary', anims: ['blurRise'], d: 0.56, dur: 0.7 },
        { sel: '.hero-actions .btn-secondary', anims: ['blurRise'], d: 0.62, dur: 0.7 },

        /* --- Home: integrantes + sobre nosotros + reseñas --- */
        { sel: '.title-about-hero', anims: ['blurRise'], d: 0.46, step: 0.12, dur: 0.75 },
        { sel: '.founder-card', anims: ['glassSlideUp'], d: 0.58, step: 0.10, dur: 0.8 },
        { sel: '.about-description', anims: ['blurRise'], d: 0.62, dur: 0.85 },
        { sel: '.pillar-item', anims: ['glassSlideUp'], d: 0.66, step: 0.08, dur: 0.75 },
        { sel: '.reviews-rail', anims: ['glassSlideUp'], d: 0.70, dur: 0.9 },

        /* --- Títulos genéricos --- */
        { sel: '.section-title:not(.title-about-hero)', anims: ['blurRise'], d: 0.34, dur: 0.8 },
        { sel: '.portfolio-subtitle', anims: ['blurRise'], d: 0.44, dur: 0.8 },

        /* --- Áreas --- */
        { sel: '.areas-method', anims: ['blurRise'], d: 0.44, dur: 0.8 },
        { sel: '.area-block-head', anims: ['blurRise'], d: 0.50, step: 0.10, dur: 0.75 },
        { sel: '.area-card', anims: ['glassSlideUp'], d: 0.56, step: 0.045, dur: 0.7 },

        /* --- Proyectos --- */
        { sel: '.filter-btn', anims: ['blurRise'], d: 0.44, step: 0.05, dur: 0.7 },
        { sel: '.pj-stage', anims: ['glassSlideUp'], d: 0.52, dur: 0.9 },
        { sel: '.pj-node', anims: ['glassSlideUp'], d: 0.60, step: 0.035, dur: 0.7 },
        { sel: '.pj-hint', anims: ['blurRise'], d: 0.80, dur: 0.8 },

        /* --- Contacto --- */
        { sel: '.contact-info-col p', anims: ['blurRise'], d: 0.42, step: 0.08, dur: 0.8 },
        { sel: '.method', anims: ['glassSlideUp'], d: 0.54, step: 0.09, dur: 0.75 },
        { sel: '.glass-form', anims: ['glassSlideUp'], d: 0.48, dur: 0.9 },
        { sel: '.form-group', anims: ['blurRise'], d: 0.62, step: 0.07, dur: 0.7 },
        { sel: '.glass-form .btn-primary', anims: ['blurRise'], d: 0.90, dur: 0.7 },
        { sel: '.scheduler', anims: ['glassSlideUp'], d: 0.58, dur: 0.95 },

        /* --- Legales --- */
        { sel: '.legal-title', anims: ['blurRise'], d: 0.22, dur: 0.8 },
        { sel: '.legal-toc a', anims: ['blurRise'], d: 0.36, step: 0.03, dur: 0.6 },
        { sel: '.legal-wrapper section', anims: ['blurRise'], d: 0.44, step: 0.05, dur: 0.7 },

        /* --- Pie --- */
        { sel: '.footer-inner', anims: ['blurRise'], d: 0.20, dur: 0.8 }
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
                if (el.dataset.anim || el.dataset.mzDone) return;
                el.dataset.mzDone = '1';
                el.dataset.gi = i;

                var delay = (rule.d || 0) + i * (rule.step || 0);
                el.style.setProperty('--d', delay.toFixed(3) + 's');
                el.dataset.mzEnd = Math.round((delay + (rule.dur || 1)) * 1000);

                el.setAttribute('data-anim', rule.anims[i % rule.anims.length]);
                if (rule.dur) el.style.setProperty('--dur', rule.dur + 's');

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

    /* --------------------------------------------------------
       4. HOVER
       El hover vive enteramente en CSS (:hover). Se retiraron el
       tilt 3D, el magnetismo y el aura del cursor: cada uno
       escuchaba pointermove y mantenía un bucle de animación
       propio, además de capas compuestas permanentes.
       -------------------------------------------------------- */

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

        /* Quedan sólo tres guiños, muy espaciados y de coste ínfimo:
           un barrido de luz sobre un botón, otro sobre un enlace del
           menú y un destello sobre un nodo del portafolio. Todos usan
           una única capa con transform/opacity y se apagan solos. */
        var SCHEDULE = [
            { sel: '.btn-primary, .btn-secondary', cls: 'amb-pulse', ms: 2000, every: 14000 },
            { sel: '.nav-btn:not(.active)', cls: 'amb-sheen', ms: 1300, every: 16000 },
            { sel: '.pj-node:not(.is-active)', cls: 'amb-glint', ms: 1500, every: 12000 }
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
       Retirada. El cambio de página ya lo cubre el preloader con
       el fondo de Mizar; el velo sumaba dos capas a pantalla
       completa con will-change permanente.
       -------------------------------------------------------- */

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
        indexAll('.areas-carousel-track[data-panel="habilidades"] .area-card i');
        indexAll('.areas-carousel-track[data-panel="herramientas"] .area-card i');
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
                var t = e.target.closest ? e.target.closest('.btn-primary, .btn-secondary, .filter-btn, .pj-rail-arrow, .cal-cell, .slot-btn, .areas-cat-btn') : null;
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

        if (!PLAIN) {
            initAmbientConductor();
        }

        waitForPreloader(flushReveals);
    });
})();

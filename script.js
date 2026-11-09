/* Snoker Studios: barra por capítulos, buscador «Te toca», catálogo,
   pasos de instalación, sorteo de apps y diálogo para pasar al móvil. */
(() => {
    'use strict';

    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const root = document.documentElement;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const touch = window.matchMedia('(pointer: coarse)').matches;

    /* ---------- Dispositivo ---------- */
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);
    const platform = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';
    root.dataset.platform = platform;

    const year = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());

    /* ---------- Datos de las apps (salen del HTML) ---------- */
    const KEYS = {
        monet: ['gastos', 'gasto', 'ingresos', 'ingreso', 'dinero', 'cuentas', 'cuenta', 'presupuesto', 'ahorro', 'ahorrar',
            'finanzas', 'euros', 'banco', 'nomina', 'sueldo', 'bolsas', 'bolsa', 'metas', 'mes', 'limite', 'limites',
            'hacer las cuentas', 'control de gastos', 'gastar menos'],
        remindly: ['recordar', 'recordatorio', 'recordatorios', 'acordarme', 'acordarte', 'acordarse', 'aviso', 'avisos',
            'alarma', 'pastilla', 'pastillas', 'medicina', 'cita', 'citas', 'calendario', 'agenda', 'tarea', 'tareas',
            'cumpleanos', 'olvidar', 'olvido', 'apuntar', 'basura', 'agua', 'regar', 'que no se me olvide'],
        tetoca: ['sorteo', 'sorteos', 'sortear', 'amigo invisible', 'invisible', 'regalo', 'regalos', 'equipos', 'repartir',
            'ruleta', 'azar', 'suerte', 'premio', 'premios', 'rifa', 'turno', 'quien paga', 'elegir', 'aleatorio',
            'hacer equipos', 'echar a suertes'],
        torino: ['pdf', 'pdfs', 'word', 'docx', 'documento', 'documentos', 'comprimir', 'imagen', 'imagenes', 'foto', 'fotos',
            'unir', 'juntar', 'audio', 'video', 'videos', 'mp3', 'convertir', 'archivo', 'archivos', 'pasar a pdf'],
        furgolero: ['futbol', 'mundial', 'mundiales', 'draft', 'liga', 'premier', 'sobres', 'partido', 'partidos', 'simular',
            'simulador', 'torneo', 'jugadores', 'alineacion', 'fifa', 'gol', 'goles', 'seleccion', 'equipo de futbol',
            'copa del rey', 'champions'],
        dnd: ['rol', 'dnd', 'd&d', 'dragones', 'mazmorras', 'personaje', 'personajes', 'ficha', 'fichas', 'master',
            'dungeon', 'bestiario', 'campana', 'dados', 'partida de rol', 'monstruos', 'dragones y mazmorras'],
        nuztracker: ['pokemon', 'nuzlocke', 'nuzlockes', 'pokedex', 'captura', 'capturas', 'encuentro', 'encuentros',
            'entrenador', 'locke', 'lockes', 'muertes', 'bajas', 'reto pokemon', 'equipo pokemon'],
    };

    const CAPTIONS = {
        monet: 'Monet, resumen del mes con datos de ejemplo.',
        remindly: 'Remindly, la vista de hoy con plantillas rápidas.',
        tetoca: 'TeToca, inicio con sus herramientas.',
        torino: 'Torino Tools, conversor de Word a PDF.',
        furgolero: 'Furgolero, elección de competición.',
        dnd: 'D&D Manager, tus personajes en modo local.',
        nuztracker: 'NuzTracker, portada con las reglas básicas.',
    };

    const apps = $$('.app').map((el) => ({
        id: el.id,
        el,
        name: el.dataset.name,
        web: el.dataset.web,
        apk: el.dataset.apk || '',
        meta: $('.app-meta', el).textContent.trim(),
        shot: `assets/images/apps/${el.dataset.app}.jpg`,
    }));
    const byId = Object.fromEntries(apps.map((a) => [a.id, a]));

    /* ---------- Barra: toma el color del capítulo que tiene debajo ---------- */
    const bar = $('#bar');
    const chapters = $$('[data-chapter]');
    let barQueued = false;

    function paintBar() {
        barQueued = false;
        const y = bar.offsetHeight / 2;
        let mode = 'light';
        for (const c of chapters) {
            const r = c.getBoundingClientRect();
            if (r.top <= y && r.bottom > y) mode = c.dataset.chapter;
        }
        bar.classList.toggle('is-dark', mode === 'dark');
    }

    window.addEventListener('scroll', () => {
        if (!barQueued) {
            barQueued = true;
            requestAnimationFrame(paintBar);
        }
    }, { passive: true });
    window.addEventListener('resize', paintBar, { passive: true });
    paintBar();

    /* ---------- Menú del móvil ---------- */
    const menuBtn = $('.bar-menu');

    function setMenu(open) {
        bar.classList.toggle('is-open', open);
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.textContent = open ? 'Cerrar' : 'Menú';
    }

    menuBtn.addEventListener('click', () => setMenu(!bar.classList.contains('is-open')));
    $$('#menu a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && bar.classList.contains('is-open')) {
            setMenu(false);
            menuBtn.focus();
        }
    });
    document.addEventListener('click', (e) => {
        if (bar.classList.contains('is-open') && !bar.contains(e.target)) setMenu(false);
    });

    /* ---------- Portada: la ventana del titular pasa por las siete apps ---------- */
    const heroTitle = $('#hero-title');
    const slotLists = $$('.slot', heroTitle).map((s) => $$('img', s));
    slotLists.flat().forEach((img) => { img.style.objectPosition = img.dataset.pos || '50% 20%'; });
    let slotIndex = 0;
    let slotTimer = null;

    function showSlot(i) {
        slotLists.forEach((list) => list.forEach((img, k) => img.classList.toggle('is-on', k === i)));
    }

    function startSlot() {
        if (slotTimer || reduce.matches) return;
        slotTimer = setInterval(() => {
            slotIndex = (slotIndex + 1) % slotLists[0].length;
            showSlot(slotIndex);
        }, 1700);
    }

    function stopSlot() {
        clearInterval(slotTimer);
        slotTimer = null;
    }

    showSlot(0);
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => (entry.isIntersecting ? startSlot() : stopSlot()))
            .observe(heroTitle);
    } else {
        startSlot();
    }

    /* ---------- Catálogo: la app del centro de la pantalla manda ---------- */
    const frameImgs = $$('.frame-pics img');
    const frameCap = $('#frame-cap');
    let activeId = apps[0] && apps[0].id;

    function activate(id) {
        if (!byId[id] || id === activeId) return;
        activeId = id;
        apps.forEach((a) => a.el.classList.toggle('is-active', a.id === id));
        frameImgs.forEach((img) => img.classList.toggle('is-on', img.dataset.for === id));
        if (frameCap) frameCap.textContent = CAPTIONS[id] || '';
    }

    if ('IntersectionObserver' in window) {
        const spy = new IntersectionObserver((entries) => {
            entries.forEach((e) => { if (e.isIntersecting) activate(e.target.id); });
        }, { rootMargin: '-42% 0px -52% 0px' });
        apps.forEach((a) => spy.observe(a.el));
    }

    apps.forEach((a) => {
        a.el.addEventListener('focusin', () => activate(a.id));
        if (!touch) a.el.addEventListener('pointerenter', () => activate(a.id));
    });

    function goToApp(id) {
        const app = byId[id];
        if (!app) return;
        activate(id);
        app.el.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
        history.replaceState(null, '', `#${id}`);
    }

    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        const id = link.getAttribute('href').slice(1);
        if (byId[id]) {
            e.preventDefault();
            goToApp(id);
            const name = $('.app-name a', byId[id].el);
            if (name) setTimeout(() => name.focus({ preventScroll: true }), reduce.matches ? 0 : 500);
        }
    });

    if (byId[location.hash.slice(1)]) activate(location.hash.slice(1));

    /* ---------- Buscador «Te toca ___» ---------- */
    const STOP = new Set(['para', 'con', 'las', 'los', 'del', 'una', 'uno', 'unos', 'unas', 'que', 'por', 'mis', 'tus',
        'hacer', 'quiero', 'necesito', 'como', 'mas', 'algo', 'este', 'esta', 'cosa', 'cosas', 'app', 'apps', 'mio', 'mia']);
    const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9& ]+/g, ' ').replace(/\s+/g, ' ').trim();
    const NKEYS = Object.fromEntries(Object.entries(KEYS).map(([id, list]) => [id, list.map(norm)]));

    function search(q) {
        const nq = norm(q);
        if (!nq) return [];
        const tokens = nq.split(' ').filter((t) => t.length >= 3 && !STOP.has(t));
        return apps.map((a) => {
            let score = 0;
            for (const k of NKEYS[a.id] || []) {
                if (k.includes(' ')) {
                    if (` ${nq} `.includes(` ${k} `)) score += 3;
                    continue;
                }
                for (const t of tokens) {
                    if (t === k) score += 2;
                    else if (t.length >= 4 && k.length >= 4 && (k.startsWith(t) || t.startsWith(k))) score += 1;
                }
            }
            if (norm(a.name).split(' ').some((w) => tokens.includes(w))) score += 4;
            return { a, score };
        }).filter((r) => r.score > 0).sort((x, y) => y.score - x.score).slice(0, 3).map((r) => r.a);
    }

    const input = $('#finder-input');
    const answer = $('#finder-answer');

    function hitRow(a, lead) {
        const row = document.createElement('a');
        row.className = 'hit';
        row.href = `#${a.id}`;
        const img = document.createElement('img');
        img.src = a.shot;
        img.alt = '';
        img.width = 64;
        img.height = 64;
        const text = document.createElement('div');
        const name = document.createElement('p');
        name.className = 'hit-name';
        name.textContent = lead ? `${lead} ${a.name}` : a.name;
        const why = document.createElement('p');
        why.className = 'hit-why';
        why.textContent = a.meta;
        text.append(name, why);
        const go = document.createElement('span');
        go.className = 'hit-go';
        go.textContent = 'Ver ficha';
        row.append(img, text, go);
        return row;
    }

    const el = (tag, cls, text) => {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text) n.textContent = text;
        return n;
    };

    // La primera coincidencia sale como una ficha pequeña, con sus botones.
    function pickCard(a, lead) {
        const card = el('div', 'pick');
        const img = el('img', 'pick-shot');
        img.src = a.shot;
        img.alt = '';
        const body = el('div', 'pick-body');
        if (lead) body.append(el('p', 'pick-lead', lead));
        body.append(el('p', 'pick-name', a.name), el('p', 'pick-meta', a.meta));
        const desc = $('.app-desc', a.el);
        if (desc) body.append(el('p', 'pick-desc', desc.textContent.replace(/\s+/g, ' ').trim()));
        const actions = el('div', 'pick-actions');
        const open = el('a', 'btn btn-solid', 'Abrir en el navegador');
        open.href = a.web;
        open.target = '_blank';
        open.rel = 'noopener';
        actions.append(open);
        if (a.apk) {
            const apk = el('a', 'btn btn-tone', 'Descargar APK');
            apk.href = a.apk;
            apk.setAttribute('download', '');
            actions.append(apk);
        }
        const more = el('a', 'btn btn-tone', 'Ver ficha');
        more.href = `#${a.id}`;
        actions.append(more);
        body.append(actions);
        card.append(img, body);
        return card;
    }

    function render(list, lead) {
        answer.textContent = '';
        if (!list.length) {
            const p = el('p', 'finder-empty');
            p.textContent = norm(input.value)
                ? 'Eso no lo hace ninguna todavía. Prueba con otras palabras o mira las siete aquí debajo.'
                : 'Escribe lo que necesitas: sortear, pasar a PDF, apuntar gastos…';
            answer.append(p);
            return;
        }
        answer.append(pickCard(list[0], lead));
        if (list.length > 1) {
            const wrap = el('div', 'hits also');
            list.slice(1).forEach((a) => wrap.append(hitRow(a)));
            answer.append(wrap);
        }
    }

    let typing;
    input.addEventListener('input', () => {
        clearTimeout(typing);
        typing = setTimeout(() => render(search(input.value)), 120);
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const first = $('.hit', answer);
            if (first) first.click();
        }
    });
    render(search(input.value));

    /* ---------- Que decida la suerte ---------- */
    let lastLuck = '';

    function draw() {
        const pool = apps.filter((a) => a.id !== lastLuck);
        const pick = pool[Math.floor(Math.random() * pool.length)];
        lastLuck = pick.id;
        return pick;
    }

    function shuffle(onTick, done) {
        const pick = draw();
        if (reduce.matches) { done(pick); return; }
        let n = 0;
        const ticks = 9;
        const step = () => {
            if (n >= ticks) { done(pick); return; }
            onTick(apps[(Math.random() * apps.length) | 0]);
            n += 1;
            setTimeout(step, 45 + n * 12);
        };
        step();
    }

    $$('[data-luck]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const inFooter = btn.closest('.foot');
            btn.disabled = true;
            if (inFooter) {
                const out = $('#foot-luck');
                shuffle(
                    (a) => { out.textContent = a.name; },
                    (a) => {
                        out.textContent = 'Te ha tocado ';
                        const link = document.createElement('a');
                        link.href = `#${a.id}`;
                        link.textContent = a.name;
                        out.append(link, '.');
                        btn.disabled = false;
                    },
                );
            } else {
                input.value = '';
                shuffle(
                    (a) => render([a]),
                    (a) => { render([a], 'Te ha tocado'); btn.disabled = false; },
                );
            }
        });
    });

    $$('.example[data-q]').forEach((btn) => {
        btn.addEventListener('click', () => {
            input.value = btn.dataset.q;
            render(search(input.value));
        });
    });

    /* ---------- Instalar: Android o iPhone, cuatro pasos ---------- */
    const install = $('#instalar');
    const range = $('#track');
    const railFill = $('#rail-fill');
    const tracks = Object.fromEntries($$('.steps', install).map((ol) => [ol.dataset.track, ol]));
    const switches = $$('.switch', install);
    const stageNames = $$('.stage-names li', install);
    const STAGES = {
        android: ['Descargar', 'Abrir', 'Permitir', 'Instalar'],
        ios: ['Safari', 'Compartir', 'Añadir', 'Listo'],
    };
    let track = platform === 'ios' ? 'ios' : 'android';

    function setStep(i) {
        range.value = String(i);
        $$('.step', tracks[track]).forEach((li, k) => li.classList.toggle('is-current', k === i));
        stageNames.forEach((li, k) => li.classList.toggle('is-on', k === i));
        railFill.style.width = `${(i / 3) * 100}%`;
        const clause = $$('.step-clause', tracks[track])[i];
        range.setAttribute('aria-valuetext', `${STAGES[track][i]}. ${clause ? clause.textContent : ''}`);
    }

    function setTrack(t) {
        track = t;
        switches.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.track === t)));
        Object.entries(tracks).forEach(([k, ol]) => ol.classList.toggle('is-active', k === t));
        stageNames.forEach((li, k) => { li.textContent = STAGES[t][k]; });
        setStep(0);
    }

    switches.forEach((b) => b.addEventListener('click', () => setTrack(b.dataset.track)));
    range.addEventListener('input', () => setStep(Number(range.value)));
    stageNames.forEach((li, k) => {
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => setStep(k));
    });
    $$('[data-ios-guide]').forEach((a) => a.addEventListener('click', () => setTrack('ios')));
    setTrack(track);

    /* ---------- Pasar al móvil (QR) o compartir ---------- */
    const dialog = $('#pass-dialog');
    const qrBox = $('#pass-qr');
    const passUrl = $('#pass-url');
    const passCopy = $('#pass-copy');
    let qrLoad = null;

    function loadQR() {
        if (window.qrcode) return Promise.resolve();
        if (!qrLoad) {
            qrLoad = new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
                s.integrity = 'sha384-mZT2gIty7ZDdOGkxfP6joZcYdMW1Jvj9dRlfpTmaJAKKXTqzygtB22k7FLe+KZC1';
                s.crossOrigin = 'anonymous';
                s.onload = resolve;
                s.onerror = () => { qrLoad = null; reject(new Error('qr')); };
                document.head.append(s);
            });
        }
        return qrLoad;
    }

    const linkFor = (a) => {
        if (!a.apk || !/^https?:/.test(location.protocol)) return a.web;
        const u = new URL(location.href);
        u.hash = a.id;
        return u.href;
    };

    async function openPass(a) {
        const url = linkFor(a);
        $('#pass-title').textContent = `Abre ${a.name} en el móvil`;
        passUrl.textContent = url;
        passCopy.textContent = 'Copiar enlace';
        passCopy.dataset.url = url;
        qrBox.textContent = 'Preparando el código…';
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else { window.open(url, '_blank', 'noopener'); return; }
        try {
            await loadQR();
            const qr = window.qrcode(0, 'M');
            qr.addData(url);
            qr.make();
            qrBox.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 0, scalable: true });
            const svg = $('svg', qrBox);
            if (svg) {
                svg.setAttribute('role', 'img');
                svg.setAttribute('aria-label', `Código QR para abrir ${a.name}`);
            }
        } catch {
            qrBox.textContent = 'No se ha podido crear el código. Copia el enlace.';
        }
    }

    passCopy.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(passCopy.dataset.url || '');
            passCopy.textContent = 'Copiado';
        } catch {
            passCopy.textContent = 'No se pudo copiar';
        }
    });

    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

    $$('[data-pass]').forEach((btn) => {
        const a = byId[btn.closest('.app').id];
        if (touch) btn.textContent = 'Compartir';
        btn.addEventListener('click', async () => {
            if (touch && navigator.share) {
                try {
                    await navigator.share({ title: a.name, text: `${a.name}, de Snoker Studios`, url: linkFor(a) });
                } catch { /* cancelado */ }
                return;
            }
            openPass(a);
        });
    });

    /* ---------- Entradas al hacer scroll ---------- */
    if (!reduce.matches && 'IntersectionObserver' in window) {
        const groups = [
            '.finder-line', '.finder-answer', '.finder-examples',
            '.catalogue-title', '.app-head', '.app-desc', '.app-actions', '.frame',
            '.install-switch', '.install-track',
            '.news-title', '.news-pic', '.news-word', '.news-table tr',
            '.faq-title', '.faq details',
            '.foot-title', '.foot-invite .btn', '.foot-links li', '.foot-legal',
        ];
        // Todo lo que ya ha entrado (o que se ha saltado con un enlace) aparece:
        // nada se queda escondido aunque el scroll vaya a saltos.
        let pending = $$(groups.join(',')).filter((node) => {
            const r = node.getBoundingClientRect();
            if (r.top < window.innerHeight && r.bottom > 0) return false;
            node.classList.add('rise');
            return true;
        });
        let riseQueued = false;
        const reveal = () => {
            riseQueued = false;
            const line = window.innerHeight * 0.92;
            let i = 0;
            pending = pending.filter((node) => {
                if (node.getBoundingClientRect().top > line) return true;
                node.style.transitionDelay = `${Math.min(i, 6) * 70}ms`;
                node.classList.add('in');
                node.addEventListener('transitionend', () => { node.style.transitionDelay = ''; }, { once: true });
                i += 1;
                return false;
            });
        };
        const queueReveal = () => {
            if (!riseQueued && pending.length) { riseQueued = true; requestAnimationFrame(reveal); }
        };
        window.addEventListener('scroll', queueReveal, { passive: true });
        window.addEventListener('resize', queueReveal, { passive: true });
        window.addEventListener('load', queueReveal);
    }

    /* ---------- El nombre del cierre se desliza con el scroll ---------- */
    const footName = $('.foot-name');
    const foot = $('.foot');
    if (footName && !reduce.matches) {
        let queued = false;
        const move = () => {
            queued = false;
            const r = foot.getBoundingClientRect();
            const p = Math.min(1, Math.max(0, 1 - r.top / window.innerHeight));
            footName.style.transform = `translate(${(1 - p) * 10}%, 30%)`;
        };
        window.addEventListener('scroll', () => {
            if (!queued) { queued = true; requestAnimationFrame(move); }
        }, { passive: true });
        move();
    }
})();

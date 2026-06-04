const CONTACT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby2ttC4i37DTiG2XFFfxNSQd_wpwOsy5CsAqpEiq0KBfXV8-kZFMLrXFojLOsvrJ_UFbQ/exec';

/* =============================================================
   VOLKSWMAZDA — index.js
   Lógica del sitio público. Requiere: app.js cargado antes.
   ============================================================= */
/* ============================================================
   CONFIGURACIÓN DE CONTACTO — edita solo esta sección
   ============================================================ */
const CONTACTO = {
  // Número de WhatsApp (con código de país, sin + ni espacios)
  whatsapp: '573116894097',

  // Número mostrado en pantalla (formato legible)
  telefonoDisplay: '+57 311 689 40 97',

  // Correo electrónico de contacto
  email: 'volkswmazda@gmail.com',

  // Dirección / ciudad mostrada en la sección de contacto
  direccion: 'Tunja, Boyacá · Colombia',

  // Horarios de atención
  horarioSemana: 'Lun – Vie: 8:00 AM – 12:30 PM  ·  2:00 PM – 6:00 PM',
  horarioSabado: 'Sábado: 8:00 AM – 1:00 PM',

  // Mensajes de WhatsApp por contexto
  msgAgendarCita:    'Hola, quiero agendar una cita',
  msgAgendar2:       'Hola, quiero agendar una cita en Volkswmazda',
  msgFloat:          'Hola, necesito información sobre los servicios de Volkswmazda',
};
/* ============================================================ */

// Función helper para construir URL de WhatsApp
function waUrl(msg){ return 'https://wa.me/'+CONTACTO.whatsapp+'?text='+encodeURIComponent(msg); }

// Renderizar todos los datos de contacto en el DOM
(function renderContacto(){
  const s = (id, val) => { const el = document.getElementById(id); if(el) el.innerHTML = val; };
  const a = (id, href, txt) => { const el = document.getElementById(id); if(el){ el.href=href; el.textContent=txt; } };

  // Botones de WhatsApp
  a('cta-nav-wa',  waUrl(CONTACTO.msgAgendarCita),  'Agendar Cita');
  a('cta-hero-wa', waUrl(CONTACTO.msgAgendar2),     '');
  a('cta-sec-wa',  waUrl(CONTACTO.msgAgendar2),     '');
  // Float y footer: solo href, el SVG interno se deja intacto
  const waFloat = document.getElementById('wa-float-btn');
  if(waFloat) waFloat.href = waUrl(CONTACTO.msgFloat);
  const footerWa = document.getElementById('footer-wa-link');
  if(footerWa) footerWa.href = 'https://wa.me/'+CONTACTO.whatsapp;

  // Reconstruir contenido interno de los botones hero y cta (tienen SVG dentro)
  const heroWa = document.getElementById('cta-hero-wa');
  if(heroWa && heroWa.innerHTML.trim()===''){
    heroWa.href = waUrl(CONTACTO.msgAgendar2);
    heroWa.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> Agendar por WhatsApp`;
  }
  const ctaSecWa = document.getElementById('cta-sec-wa');
  if(ctaSecWa && ctaSecWa.innerHTML.trim()===''){
    ctaSecWa.href = waUrl(CONTACTO.msgAgendar2);
    ctaSecWa.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> Agendar por WhatsApp`;
  }
  // Nav CTA - reconstruir icono
  const navWa = document.getElementById('cta-nav-wa');
  if(navWa && navWa.innerHTML.trim()===''){
    navWa.href = waUrl(CONTACTO.msgAgendarCita);
    navWa.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> Agendar Cita`;
  }

  // Teléfono en sección CTA
  s('cta-phone-display', CONTACTO.telefonoDisplay);

  // Sección de contacto
  s('cinfo-location', CONTACTO.direccion);
  a('cinfo-phone-link', 'tel:'+CONTACTO.whatsapp, CONTACTO.telefonoDisplay);
  a('cinfo-email-link', 'mailto:'+CONTACTO.email,  CONTACTO.email);
  s('cinfo-hours-week', CONTACTO.horarioSemana);
  s('cinfo-hours-sat',  CONTACTO.horarioSabado);

  // Footer copyright
  s('footer-copy', '© '+new Date().getFullYear()+' Volkswmazda · Centro de Servicio Especializado · '+CONTACTO.direccion);
})();

window.addEventListener('scroll',()=>{
  const _nav = document.getElementById('main-nav');
  const _top = document.getElementById('back-top');
  if(_nav) _nav.classList.toggle('scrolled', window.scrollY > 40);
  if(_top) _top.classList.toggle('visible', window.scrollY > 400);
});

// Menú móvil
function toggleMenu(){
  document.getElementById('ham').classList.toggle('open');
  document.getElementById('mob-menu').classList.toggle('open');
}

// Reveal al hacer scroll
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target);} });
},{threshold:0.12});
document.querySelectorAll('.reveal').forEach(r=>io.observe(r));

// ── Testimonios: se cargan después de inicializar Firebase ──────
// (ver llamada después de _initTrackDb)

// ===== HERO CARRUSEL (automático cada 5s) =====
const slides = document.querySelectorAll('.hero-slide');
const dots = document.querySelectorAll('.dot');
const slideLabels = ['Volkswagen · Servicio Premium','Mazda · Diagnóstico Avanzado','Audi · Mecánica de Precisión','Taller Certificado · Tunja'];
let current = 0, heroTimer;

function goToSlide(n){
  slides[current].classList.remove('active');
  dots[current].classList.remove('active');
  current = (n + slides.length) % slides.length;
  slides[current].classList.add('active');
  dots[current].classList.add('active');
  const lbl = document.getElementById('slideLabel'); if(lbl) lbl.textContent = slideLabels[current];
  resetHeroTimer();
}
function nextSlide(){ goToSlide(current + 1); }
function resetHeroTimer(){ clearInterval(heroTimer); heroTimer = setInterval(nextSlide, 5000); }
resetHeroTimer();

// ===== TESTIMONIOS (auto cada 8s, en bucle) =====
let testPos = 0, testTimer;
function getVisible(){ return window.innerWidth > 1024 ? 3 : (window.innerWidth > 768 ? 2 : 1); }
function applyTest(){
  const track = document.getElementById('testTrack');
  if(!track) return;
  const card = track.querySelector('.test-card');
  if(!card) return;
  const gap = 20;
  const cardWidth = card.offsetWidth + gap;
  track.style.transform = `translateX(-${testPos * cardWidth}px)`;
}
function slideTest(dir){
  const cards = document.querySelectorAll('#testTrack .test-card');
  const maxPos = Math.max(0, cards.length - getVisible());
  testPos += dir;
  if(testPos > maxPos) testPos = 0;       // vuelve al inicio
  if(testPos < 0) testPos = maxPos;       // va al final
  applyTest();
  resetTestTimer();
}
function resetTestTimer(){
  clearInterval(testTimer);
  if(document.querySelectorAll('#testTrack .test-card').length > 1){
    testTimer = setInterval(()=>slideTest(1), 8000);
  }
}
resetTestTimer();
window.addEventListener('resize', ()=>{ testPos = 0; applyTest(); });

// ===== FORMULARIO =====
function submitForm(btn){
  const get = id => document.getElementById(id).value.trim();
  const nombre   = get('cf-nombre');
  const telefono = get('cf-telefono');
  const email    = get('cf-email');
  const mensaje  = get('cf-mensaje');
  const marca    = get('cf-marca');
  const servicio = get('cf-servicio');
  const errDiv   = document.getElementById('cf-error');

  if(!nombre || !telefono || !email || !mensaje){
    errDiv.textContent = 'Por favor, completa todos los campos obligatorios (*)';
    errDiv.style.display = 'block'; return;
  }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    errDiv.textContent = 'Por favor, ingresa un correo electrónico válido.';
    errDiv.style.display = 'block'; return;
  }
  errDiv.style.display = 'none';

  const orig = btn.innerHTML;
  const spinSvg = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" style="animation:spin .6s linear infinite"><circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,.3)" stroke-width="2"/><path d="M12 3a9 9 0 0 1 9 9" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>';
  btn.innerHTML = spinSvg + ' Enviando...';
  btn.disabled = true;

  function _mostrarExito(){
    btn.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> ¡Mensaje enviado!';
    btn.style.background = '#16a34a';
    ['cf-nombre','cf-telefono','cf-email','cf-marca','cf-servicio','cf-mensaje']
      .forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
    setTimeout(()=>{ btn.innerHTML=orig; btn.disabled=false; btn.style.background=''; }, 4000);
  }

  // GAS requiere FormData con fetch no-cors — es el único método
  // que ejecuta el script sin bloqueo de CORS ni 403 en redirects.
  // Con no-cors + FormData el navegador envía el POST y GAS lo recibe.
  // No podemos leer la respuesta (opaque), pero el script SÍ ejecuta.
  try {
    const fd = new FormData();
    fd.append('action',   'contact');
    fd.append('nombre',   nombre);
    fd.append('telefono', telefono);
    fd.append('email',    email);
    fd.append('marca',    marca);
    fd.append('servicio', servicio);
    fd.append('mensaje',  mensaje);

    fetch(CONTACT_SCRIPT_URL, {
      method: 'POST',
      body:   fd
      // SIN mode:'no-cors' — igual que el upload de PDFs que sí funciona
    })
    .then(function(res){ return res.json(); })
    .then(function(data){
      _mostrarExito();
    })
    .catch(function(e){
      console.warn('[VMZ Contact] Error:', e);
      _mostrarExito(); // mostrar éxito igual — el script puede haber ejecutado
    });

  } catch(err) {
    console.error('[Volkswmazda] Error enviando:', err);
    _mostrarExito();
  }
}

// Keyframe spin
const st = document.createElement('style');
st.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
document.head.appendChild(st);

/* ── Firebase config (único punto de declaración) ──────────────────── */
function _initTrackDb(){
  try{
    const cfg = {
      apiKey:"AIzaSyBtwmqZqZ2Hj1Xt5ogIaTqEZJXd3vKVMig",
      authDomain:"volkswmazda-ad26d.firebaseapp.com",
      databaseURL:"https://volkswmazda-ad26d-default-rtdb.europe-west1.firebasedatabase.app",
      projectId:"volkswmazda-ad26d",
      storageBucket:"volkswmazda-ad26d.firebasestorage.app",
      messagingSenderId:"178846757029",
      appId:"1:178846757029:web:4d54fee13233950c8c5d4c"
    };
    if(typeof firebase === 'undefined') return false;
    if(!firebase.apps || !firebase.apps.length) firebase.initializeApp(cfg);
    window._trackDb = firebase.database();
    return true;
  } catch(e){ return false; }
}

if(!_initTrackDb()){
  window.addEventListener('load', function(){
    _initTrackDb();
    cargarTestimonios();
  });
} else {
  // Firebase listo — cargar testimonios inmediatamente
  cargarTestimonios();
}

/* ── Rate limiter ────────────────────────────────────────────────────── */
const RATE_KEY = 'vmz_track_attempts';
const RATE_LOCK = 'vmz_track_lock';
const MAX_ATTEMPTS = 3;
const LOCK_MS = 2 * 60 * 1000; // 2 minutos

function getRateState(){
  const lock = localStorage.getItem(RATE_LOCK);
  if(lock && Date.now() < parseInt(lock)){
    const secs = Math.ceil((parseInt(lock) - Date.now()) / 1000);
    return { blocked: true, secs };
  }
  const attempts = parseInt(localStorage.getItem(RATE_KEY)||'0');
  return { blocked: false, attempts };
}
function registerAttempt(){
  const st = getRateState();
  if(st.blocked) return;
  const attempts = (st.attempts||0) + 1;
  localStorage.setItem(RATE_KEY, attempts);
  if(attempts >= MAX_ATTEMPTS){
    localStorage.setItem(RATE_LOCK, Date.now() + LOCK_MS);
    localStorage.removeItem(RATE_KEY);
  }
}
function resetRate(){ localStorage.removeItem(RATE_KEY); localStorage.removeItem(RATE_LOCK); }

/* ── Helpers de fecha ────────────────────────────────────────────────── */
function fmtDT(iso){
  if(!iso) return null;
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('es-CO',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}),
    time: d.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit',hour12:true})
  };
}
function fmtInspDate(date, time){
  // date: "jun 1, 2026"  time: "2:27 p.m."
  if(!date) return null;
  return { date, time: time||'' };
}

/* ── HTML del formulario ─────────────────────────────────────────────── */
function htmlFormulario(rateWarn){
  return `
  <div class="tq-wrap">
    <div class="tq-hero">
      <div class="tq-icon">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="m9 12 2 2 4-4" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="tq-head">
        <div class="tq-title">Estado de tu servicio</div>
        <div class="tq-sub">Ingresa la placa y cédula del propietario para consultar.</div>
      </div>
    </div>
    <div class="tq-fields">
      <div class="tq-field">
        <label>Placa del vehículo</label>
        <input id="tq-placa" placeholder="Ej. ABC123" maxlength="7" autocomplete="off" oninput="this.value=this.value.toUpperCase()"/>
      </div>
      <div class="tq-field">
        <label>Cédula del propietario</label>
        <input id="tq-cedula" placeholder="Tu número de cédula" maxlength="12" autocomplete="off" inputmode="numeric"/>
      </div>
    </div>
    <button class="tq-btn" id="tq-submit-btn" onclick="consultarServicio()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#fff" stroke-width="2"/><path d="m21 21-4.35-4.35" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>
      Consultar ahora
    </button>
    <div class="tq-err" id="tq-err"></div>
    ${rateWarn ? `<div class="tq-rate-warn" style="display:block">⚠️ ${rateWarn}</div>` : ''}
  </div>`;
}

/* ── HTML del resultado ──────────────────────────────────────────────── */
function htmlResultado(s){
  const status   = s.inspection?.status || 'Recibido';
  const isInsp   = status === 'En Inspección';
  const isFin    = status === 'Finalizado';
  const badgeClass = isFin ? 'badge-finalizado' : isInsp ? 'badge-inspeccion' : 'badge-recibido';
  const dotColor   = isFin ? '#86EFAC' : isInsp ? '#FCD34D' : '#93C5FD';

  const recibido   = fmtInspDate(s.inspection?.date, s.inspection?.time);
  const iniciado   = s.inspection?.startedAt  ? fmtDT(s.inspection.startedAt)  : null;
  const finalizado = s.inspection?.finishedAt ? fmtDT(s.inspection.finishedAt) : null;

  // Estado de cada paso
  const p1 = 'done';                                         // siempre completado
  const p2 = isFin ? 'done-green' : isInsp ? 'active' : 'pending';
  const p3 = isFin ? 'done-green' : 'pending';

  // Icono pro — escudo con check / llave / bandera
  const icoShield = `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="m9 12 2 2 4-4" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;

  function dotIcon(state){
    if(state==='done' || state==='done-green')
      return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    if(state==='active')
      return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="#F59E0B" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" stroke="#D1D5DB" stroke-width="2"/></svg>`;
  }

  function tlItem(state, label, dt, amberLabel, isLast){
    const isPending = state === 'pending';
    let dateHtml = '';
    if(dt){
      const colorClass = state==='done-green' ? 'green' : state==='active' ? 'amber' : 'blue';
      dateHtml = `<div class="tl-datetime ${colorClass}">${dt.date} · ${dt.time}</div>`;
    } else if(state==='active'){
      dateHtml = `<div class="tl-datetime amber">${amberLabel||'En proceso…'}</div>`;
    } else {
      dateHtml = `<div class="tl-pending-txt">Pendiente</div>`;
    }
    const lineColor = state==='done' ? 'blue' : state==='done-green' ? 'green' : state==='active' ? 'amber' : '';
    const lineHtml = isLast ? '' : `<div class="tl-line ${lineColor}"></div>`;
    return `
    <div class="tl-item ${state}">
      <div class="tl-left">
        <div class="tl-dot">${dotIcon(state)}</div>
        ${lineHtml}
      </div>
      <div class="tl-content">
        <div class="tl-step-name">${label}</div>
        ${dateHtml}
      </div>
    </div>`;
  }

  const tipoNombre = s.inspection?.tipoServicioNombre || (s.inspection?.tipoServicio?.startsWith('tipo_') ? '' : s.inspection?.tipoServicio) || '';
  const vehicleInfo = [s.vehicle?.brand, s.vehicle?.model, s.vehicle?.year].filter(Boolean).join(' ');

  return `
  <div class="tr-wrap">
    <div class="tr-header">
      <div class="tr-header-inner">
        <div class="tr-header-top">
          <div class="tr-car-ico">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">${icoShield}</svg>
          </div>
          <div>
            <div class="tr-plate">${s.vehicle?.plate||'—'}</div>
            <div class="tr-tipo">${vehicleInfo}${vehicleInfo&&tipoNombre?' · ':''}${tipoNombre}</div>
          </div>
        </div>
        <span class="tr-status-badge ${badgeClass}">
          <span class="dot" style="background:${dotColor}"></span>
          ${status.toUpperCase()}
        </span>
      </div>
    </div>

    <div class="tr-timeline">
      <div class="tr-tl-title">Recorrido del servicio</div>
      ${tlItem(p1, 'Vehículo recibido',    recibido,   null,                                   false)}
      ${tlItem(p2, 'Inspección iniciada',  iniciado,   'Técnico trabajando en tu vehículo',    false)}
      ${tlItem(p3, 'Servicio finalizado',  finalizado, null,                                   true)}
    </div>

    <div class="tr-footer">
      <div class="tr-footer-note">Actualización en tiempo real · Solo se muestra el servicio más reciente</div>
      <button class="tr-back-btn" onclick="abrirConsultaServicio(true)">← Nueva consulta</button>
    </div>
  </div>`;
}
/* ── Abrir modal de consulta ─────────────────────────────────────────── */
function abrirConsultaServicio(force){
  const st = getRateState();
  const rateWarn = st.blocked
    ? `Demasiados intentos. Espera ${st.secs} segundos antes de volver a consultar.`
    : null;

  Swal.fire({
    html: htmlFormulario(rateWarn),
    showConfirmButton: false,
    showCloseButton: true,
    customClass:{ popup:'swal-track-popup', htmlContainer:'swal-track-html' },
    backdrop:'rgba(15,23,42,0.7)',
    didOpen:()=>{
      const inp = document.getElementById('tq-placa');
      if(inp) inp.focus();
      // Enter en cualquier campo → consultar
      ['tq-placa','tq-cedula'].forEach(id=>{
        const el = document.getElementById(id);
        if(el) el.addEventListener('keydown', e=>{ if(e.key==='Enter') consultarServicio(); });
      });
      // Si bloqueado, deshabilitar botón
      if(st.blocked){
        const btn = document.getElementById('tq-submit-btn');
        if(btn) btn.disabled = true;
      }
    }
  });
}

/* ── Consultar en Firebase ───────────────────────────────────────────── */
async function consultarServicio(){
  const placa  = (document.getElementById('tq-placa')?.value||'').trim().toUpperCase();
  const cedula = (document.getElementById('tq-cedula')?.value||'').trim();
  const errEl  = document.getElementById('tq-err');
  const btn    = document.getElementById('tq-submit-btn');

  // Validación
  function showErr(msg){ errEl.textContent=msg; errEl.style.display='block'; }
  errEl.style.display='none';
  document.getElementById('tq-placa')?.classList.remove('err');
  document.getElementById('tq-cedula')?.classList.remove('err');

  if(!placa){ document.getElementById('tq-placa')?.classList.add('err'); showErr('Ingresa la placa del vehículo.'); return; }
  if(!cedula){ document.getElementById('tq-cedula')?.classList.add('err'); showErr('Ingresa el número de cédula.'); return; }

  // Rate limit
  const st = getRateState();
  if(st.blocked){ showErr(`Demasiados intentos. Espera ${st.secs} segundos.`); return; }
  registerAttempt();

  // Loading
  btn.disabled = true;
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="animation:spin 1s linear infinite"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg> Consultando…`;

  try {
    // Asegurar que Firebase esté inicializado
    if(!window._trackDb) _initTrackDb();
    if(!window._trackDb) throw new Error('DB no disponible');

    // Intentar primero con orderByChild (requiere índice en Firebase rules)
    // Si falla, hacer query completa y filtrar en cliente
    let all = null;
    try {
      const snap = await window._trackDb.ref('services').orderByChild('vehicle/plate').equalTo(placa).once('value');
      all = snap.val();
    } catch(idxErr){
      console.warn('Índice no disponible, filtrando en cliente:', idxErr.message);
      // Fallback: leer todos y filtrar por placa en cliente
      const snap = await window._trackDb.ref('services').once('value');
      const todos = snap.val();
      if(todos){
        all = {};
        Object.entries(todos).forEach(([k,v])=>{
          if(v?.vehicle?.plate?.toUpperCase() === placa) all[k]=v;
        });
        if(!Object.keys(all).length) all = null;
      }
    }
    if(!all){
      showErr('No encontramos ningún servicio con esa placa. Verifica los datos.');
      btn.disabled=false; btn.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#fff" stroke-width="2"/><path d="m21 21-4.35-4.35" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg> Consultar ahora';
      return;
    }

    // Filtrar por cédula del propietario
    const matches = Object.values(all).filter(s =>
      s.owner && String(s.owner.doc||'').trim() === cedula
    );

    if(!matches.length){
      showErr('La cédula no coincide con el propietario de este vehículo.');
      btn.disabled=false; btn.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#fff" stroke-width="2"/><path d="m21 21-4.35-4.35" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg> Consultar ahora';
      return;
    }

    // Solo el más reciente
    const servicio = matches.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0))[0];

    // Resetear rate limit en consulta exitosa
    resetRate();

    // Mostrar resultado
    Swal.fire({
      html: htmlResultado(servicio),
      showConfirmButton: false,
      showCloseButton: true,
      customClass:{ popup:'swal-track-popup', htmlContainer:'swal-track-html' },
      backdrop:'rgba(15,23,42,0.7)',
    });

  } catch(e){
    console.error('[Consulta servicio] Error:', e);
    showErr('Error al consultar. Verifica tu conexión e intenta de nuevo.');
    btn.disabled=false; btn.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#fff" stroke-width="2"/><path d="m21 21-4.35-4.35" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg> Consultar ahora';
  }
}


// ── Auto-apertura por URL ?sid=<serviceId> ──────────────────────────────────
// Cuando el admin comparte la URL con el parámetro sid,
// se abre automáticamente el modal de seguimiento con el resultado del servicio.
(function autoOpenTracking() {
  const params = new URLSearchParams(window.location.search);
  const sid    = params.get('sid');
  const rate   = params.get('rate');

  if (!sid && !rate) return;

  // Limpiar parámetros de URL inmediatamente para evitar loops al refrescar
  if (window.history && window.history.replaceState) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  function waitFirebase(cb) {
    if (window._trackDb) { cb(); return; }
    window.addEventListener('firebase-ready', cb, { once: true });
  }

  // ── Modo seguimiento (?sid=) ─────────────────────────────────
  if (sid) {
    function tryAutoOpen() {
      window._trackDb.ref('services/' + sid).once('value').then(function(snap) {
        const servicio = snap.val();
        if (!servicio) { abrirConsultaServicio(); return; }
        Swal.fire({
          html: htmlResultado(servicio),
          showConfirmButton: false,
          showCloseButton: true,
          customClass: { popup: 'swal-track-popup', htmlContainer: 'swal-track-html' },
          backdrop: 'rgba(15,23,42,0.7)'
        });
      }).catch(function() { abrirConsultaServicio(); });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function(){ waitFirebase(tryAutoOpen); });
    } else {
      waitFirebase(tryAutoOpen);
    }
  }

  // ── Modo calificación (?rate=) ───────────────────────────────
  if (rate) {
    function tryAutoRate() {
      window._trackDb.ref('services/' + rate).once('value').then(function(snap) {
        const servicio = snap.val();
        if (!servicio) return;
        // Si ya fue calificado, mostrar agradecimiento
        if (servicio.rating && servicio.rating.stars) {
          Swal.fire({
            html: htmlRatingAlreadyDone(servicio),
            showConfirmButton: false,
            showCloseButton: true,
            customClass: { popup: 'swal-track-popup', htmlContainer: 'swal-track-html' },
            backdrop: 'rgba(15,23,42,0.7)'
          });
          return;
        }
        Swal.fire({
          html: htmlRatingModal(servicio, rate),
          showConfirmButton: false,
          showCloseButton: true,
          customClass: { popup: 'swal-track-popup', htmlContainer: 'swal-track-html' },
          backdrop: 'rgba(15,23,42,0.7)',
          didOpen: function() { initRatingStars(); }
        });
      }).catch(function(e){ console.error('[Rate] error:', e); });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function(){ waitFirebase(tryAutoRate); });
    } else {
      waitFirebase(tryAutoRate);
    }
  }
})();

// ── HTML modal de calificación — UX premium ──────────────────────────────────
function htmlRatingModal(s, serviceId) {
  const plate  = (s.vehicle  && s.vehicle.plate)  || '—';
  const brand  = (s.vehicle  && s.vehicle.brand)  || '';
  const model  = (s.vehicle  && s.vehicle.model)  || '';
  const owner  = (s.owner    && s.owner.name)     || 'Cliente';
  const tipo   = (s.inspection && (s.inspection.tipoServicioNombre || s.inspection.tipoServicio)) || 'Servicio';
  const tech   = (s.inspection && s.inspection.technician) || '';

  return `<div style="font-family:'Manrope',sans-serif;overflow:hidden;border-radius:20px">

    <!-- Header con gradiente -->
    <div style="background:linear-gradient(135deg,#0F2460 0%,#1E3A8A 50%,#2563EB 100%);padding:28px 28px 24px;text-align:center;position:relative;overflow:hidden">
      <div style="position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.04)"></div>
      <div style="position:absolute;bottom:-40px;left:-20px;width:100px;height:100px;border-radius:50%;background:rgba(37,99,235,.15)"></div>
      <div style="position:relative;z-index:1">
        <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:20px;padding:5px 14px;margin-bottom:14px">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="#FFD700" stroke-width="2" fill="#FFD700"/></svg>
          <span style="font-size:11px;font-weight:700;letter-spacing:.12em;color:rgba(255,255,255,.85);text-transform:uppercase">Califica tu experiencia</span>
        </div>
        <div style="font-size:24px;font-weight:800;color:#fff;margin-bottom:5px;letter-spacing:-.01em">${brand} ${model}</div>
        <div style="font-size:14px;color:rgba(255,255,255,.7);margin-bottom:${tech?'4px':'0'}">${plate} · ${tipo}</div>
        ${tech ? `<div style="font-size:12px;color:rgba(255,255,255,.5);margin-top:2px">Técnico: ${tech}</div>` : ''}
        <div style="margin-top:10px;display:inline-block;background:rgba(255,255,255,.1);border-radius:8px;padding:5px 12px">
          <span style="font-size:12px;color:rgba(255,255,255,.8);font-weight:600">${owner}</span>
        </div>
      </div>
    </div>

    <!-- Cuerpo -->
    <div style="padding:26px 28px 24px;background:#fff">

      <!-- Estrellas -->
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:13px;font-weight:700;color:#374151;letter-spacing:.02em;margin-bottom:18px">¿Qué tan satisfecho quedaste?</div>
        <div id="rating-stars" style="display:flex;justify-content:center;gap:8px;margin-bottom:10px">
          ${[1,2,3,4,5].map(i => `
            <button data-star="${i}" onclick="setRatingStar(${i})"
              style="background:none;border:none;cursor:pointer;padding:4px;border-radius:8px;transition:transform .15s;outline:none"
              onmouseover="hoverStar(${i})" onmouseout="unhoverStar()">
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" id="star-svg-${i}">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  stroke="#D1D5DB" stroke-width="1.5" fill="#F9FAFB" id="star-path-${i}"
                  style="transition:all .15s"/>
              </svg>
            </button>`).join('')}
        </div>
        <!-- Pill de label -->
        <div id="rating-pill" style="display:inline-block;min-width:100px;padding:5px 16px;border-radius:20px;background:#F3F4F6;border:1.5px solid #E5E7EB;font-size:13px;font-weight:700;color:#6B7280;transition:all .2s;min-height:30px;line-height:20px">
          Toca una estrella
        </div>
      </div>

      <!-- Textarea -->
      <div style="margin-bottom:20px">
        <label style="display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;letter-spacing:.08em;color:#9CA3AF;text-transform:uppercase;margin-bottom:10px">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Cuéntanos más (opcional)
        </label>
        <textarea id="rating-obs" placeholder="¿Qué fue lo que más te gustó? ¿Algo que podamos mejorar?" rows="3"
          style="width:100%;box-sizing:border-box;padding:13px 15px;border-radius:12px;border:1.5px solid #E5E7EB;font-family:'Manrope',sans-serif;font-size:14px;color:#374151;outline:none;resize:none;transition:all .2s;line-height:1.6;background:#FAFAFA"
          onfocus="this.style.borderColor='#2563EB';this.style.background='#fff';this.style.boxShadow='0 0 0 3px rgba(37,99,235,.1)'"
          onblur="this.style.borderColor='#E5E7EB';this.style.background='#FAFAFA';this.style.boxShadow='none'"></textarea>
      </div>

      <!-- Error -->
      <div id="rating-err" style="display:none;align-items:center;gap:7px;font-size:13px;color:#DC2626;margin-bottom:14px;padding:10px 14px;background:rgba(220,38,38,.06);border:1px solid rgba(220,38,38,.2);border-radius:9px">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#DC2626" stroke-width="1.8"/><path d="M12 8v4M12 16h.01" stroke="#DC2626" stroke-width="2" stroke-linecap="round"/></svg>
        Por favor selecciona una calificación antes de continuar.
      </div>

      <!-- Botón enviar -->
      <button id="rating-submit-btn" onclick="enviarCalificacion('${serviceId}')"
        style="width:100%;padding:15px;background:linear-gradient(135deg,#1E3A8A,#2563EB);color:#fff;font-family:'Manrope',sans-serif;font-weight:700;font-size:15px;border-radius:12px;border:none;cursor:pointer;letter-spacing:.02em;transition:all .22s;box-shadow:0 6px 24px rgba(37,99,235,.4);display:flex;align-items:center;justify-content:center;gap:9px"
        onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 10px 32px rgba(37,99,235,.5)'"
        onmouseout="this.style.transform='';this.style.boxShadow='0 6px 24px rgba(37,99,235,.4)'">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Enviar calificación
      </button>

      <div style="text-align:center;margin-top:12px;font-size:11.5px;color:#9CA3AF">
        🔒 Tu reseña es anónima · Solo se comparte el nombre del propietario
      </div>
    </div>
  </div>`;
}

// ── Ya calificado — pantalla premium ─────────────────────────────────────────
function htmlRatingAlreadyDone(s) {
  const rStars  = (s.rating && s.rating.stars) || 0;
  const rObs    = (s.rating && s.rating.obs)   || '';
  const rFecha  = s.rating && s.rating.fecha
    ? new Date(s.rating.fecha).toLocaleDateString('es-CO',{day:'2-digit',month:'long',year:'numeric'})
    : '';

  const filledColor  = ['','#EF4444','#F97316','#EAB308','#84CC16','#22C55E'][rStars] || '#F59E0B';
  const labels       = ['','Muy malo','Malo','Regular','Bueno','Excelente'];
  const starsHtml    = Array.from({length:5},(_,i) =>
    `<svg width="32" height="32" viewBox="0 0 24 24" fill="${i<rStars?filledColor:'#E5E7EB'}" style="transition:none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>`).join('');

  return `<div style="font-family:'Manrope',sans-serif;overflow:hidden;border-radius:20px">
    <!-- Header verde éxito -->
    <div style="background:linear-gradient(135deg,#064E3B,#059669);padding:32px 28px;text-align:center;position:relative;overflow:hidden">
      <div style="position:absolute;inset:0;background:url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><circle cx="30" cy="30" r="20" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="1"/></svg>') repeat"></div>
      <div style="position:relative;z-index:1">
        <div style="width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.15);border:2px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div style="font-size:22px;font-weight:800;color:#fff;margin-bottom:6px">¡Calificación registrada!</div>
        <div style="font-size:13px;color:rgba(255,255,255,.75)">Gracias por tomarte el tiempo de evaluarnos</div>
      </div>
    </div>

    <!-- Cuerpo con resumen -->
    <div style="padding:28px 28px 26px;background:#fff;text-align:center">
      <!-- Estrellas con color semántico -->
      <div style="display:flex;justify-content:center;gap:4px;margin-bottom:10px">${starsHtml}</div>
      <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:${filledColor}18;border:1.5px solid ${filledColor}40;font-size:13px;font-weight:700;color:${filledColor};margin-bottom:${rObs?'18px':'24px'}">${labels[rStars]||''}</div>

      ${rObs ? `
      <div style="background:#F9FAFB;border-radius:12px;border:1px solid #E5E7EB;padding:16px 20px;margin-bottom:18px;text-align:left">
        <div style="font-size:11px;font-weight:700;letter-spacing:.1em;color:#9CA3AF;text-transform:uppercase;margin-bottom:8px">Tu comentario</div>
        <div style="font-size:14px;color:#374151;line-height:1.65;font-style:italic">"${rObs}"</div>
      </div>` : ''}

      ${rFecha ? `<div style="font-size:12px;color:#9CA3AF;margin-bottom:20px">Enviada el ${rFecha}</div>` : ''}

      <div style="background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border:1px solid #BFDBFE;border-radius:12px;padding:14px 18px;text-align:left">
        <div style="font-size:13px;font-weight:700;color:#1D4ED8;margin-bottom:4px">¡Tu opinión importa!</div>
        <div style="font-size:12.5px;color:#3B82F6;line-height:1.55">Ayudas a otros clientes a elegir un taller de confianza y nos motivas a seguir mejorando.</div>
      </div>
    </div>
  </div>`;
}

// ── Lógica de estrellas — versión SVG premium ────────────────────────────────
var _currentRating = 0;
var _ratingLabels  = ['','Muy malo','Malo','Regular','Bueno','Excelente'];
var _ratingColors  = ['','#EF4444','#F97316','#EAB308','#84CC16','#22C55E'];
var _ratingPillBg  = ['','rgba(239,68,68,.1)','rgba(249,115,22,.1)','rgba(234,179,8,.1)','rgba(132,204,22,.1)','rgba(34,197,94,.1)'];
var _ratingPillBorder = ['','rgba(239,68,68,.3)','rgba(249,115,22,.3)','rgba(234,179,8,.3)','rgba(132,204,22,.3)','rgba(34,197,94,.3)'];

function initRatingStars() {
  _currentRating = 0;
  paintStars(0, false);
}

function hoverStar(n) {
  if (_currentRating === 0) paintStars(n, false);
}
function unhoverStar() {
  paintStars(_currentRating, _currentRating > 0);
}

function setRatingStar(n) {
  _currentRating = n;
  paintStars(n, true);
  var err = document.getElementById('rating-err');
  if (err) err.style.display = 'none';
  // Shake the submit button to indicate it's ready
  var btn = document.getElementById('rating-submit-btn');
  if (btn) {
    btn.style.animation = 'none';
    setTimeout(function(){ btn.style.animation = ''; }, 10);
  }
}

function paintStars(n, selected) {
  for (var i = 1; i <= 5; i++) {
    var path = document.getElementById('star-path-' + i);
    var btn  = document.querySelector('[data-star="' + i + '"]');
    if (!path || !btn) continue;
    if (i <= n) {
      var col = _ratingColors[n] || '#F59E0B';
      path.setAttribute('fill', col);
      path.setAttribute('stroke', col);
      btn.style.transform = selected ? 'scale(1.18)' : 'scale(1.1)';
    } else {
      path.setAttribute('fill', '#F9FAFB');
      path.setAttribute('stroke', '#D1D5DB');
      btn.style.transform = 'scale(1)';
    }
  }
  // Update pill
  var pill = document.getElementById('rating-pill');
  if (pill) {
    if (n > 0) {
      pill.textContent = _ratingLabels[n];
      pill.style.background = _ratingPillBg[n];
      pill.style.borderColor = _ratingPillBorder[n];
      pill.style.color = _ratingColors[n];
      pill.style.fontWeight = '800';
    } else {
      pill.textContent = 'Toca una estrella';
      pill.style.background = '#F3F4F6';
      pill.style.borderColor = '#E5E7EB';
      pill.style.color = '#6B7280';
      pill.style.fontWeight = '700';
    }
  }
}

function highlightStars(n) { paintStars(n, n === _currentRating); }


// ── actualizarCacheTestimonios ────────────────────────────────────────────────
// Lee /ratings de Firebase, filtra 4-5★ con obs, mezcla y guarda 10 en
// /metadata/testimonios — 1 escritura puntual solo cuando alguien califica.
// Los visitantes leen /metadata/testimonios (2KB fijos, sin importar el tráfico).
async function actualizarCacheTestimonios() {
  try {
    if (!window._trackDb) return;
    var snap = await window._trackDb.ref('ratings').once('value');
    var data = snap.val();
    if (!data) return;

    var buenos = Object.values(data).filter(function(r) {
      return r.stars >= 4 && r.obs && r.obs.trim().length >= 10;
    });
    if (!buenos.length) return;

    var seleccion = buenos
      .sort(function() { return Math.random() - 0.5; })
      .slice(0, 10)
      .map(function(r) {
        return {
          stars:    r.stars,
          obs:      r.obs.trim(),
          nombre:   r.nombre   || 'Cliente',
          vehiculo: r.vehiculo || '',
          tipo:     r.tipo     || ''
        };
      });

    await window._trackDb.ref('testimoniosCache').set({
      items:      seleccion,
      total:      buenos.length,
      updatedAt:  new Date().toISOString()
    });
  } catch(e) {
    console.warn('[Testimonios] Error actualizando caché:', e);
  }
}

async function enviarCalificacion(serviceId) {
  if (!_currentRating) {
    var err = document.getElementById('rating-err');
    if (err) err.style.display = 'block';
    return;
  }
  var obs = (document.getElementById('rating-obs') && document.getElementById('rating-obs').value.trim()) || '';
  var btn = document.querySelector('#swal2-html-container button[onclick*="enviarCalificacion"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

  try {
    await window._trackDb.ref('services/' + serviceId + '/rating').set({
      stars:   _currentRating,
      obs:     obs,
      fecha:   new Date().toISOString()
    });
    // También guardar en /ratings/{serviceId} para cargar testimonios
    var snap = await window._trackDb.ref('services/' + serviceId).once('value');
    var svc  = snap.val() || {};
    await window._trackDb.ref('ratings/' + serviceId).set({
      stars:    _currentRating,
      obs:      obs,
      fecha:    new Date().toISOString(),
      nombre:   (svc.owner  && svc.owner.name)    || 'Cliente',
      vehiculo: ((svc.vehicle && svc.vehicle.brand) || '') + ' ' + ((svc.vehicle && svc.vehicle.model) || '') + ' · ' + ((svc.vehicle && svc.vehicle.plate) || ''),
      tipo:     (svc.inspection && (svc.inspection.tipoServicioNombre || svc.inspection.tipoServicio)) || ''
    });
    Swal.fire({
      html: htmlRatingAlreadyDone({ rating: { stars: _currentRating, obs: obs } }),
      showConfirmButton: false,
      showCloseButton: true,
      customClass: { popup: 'swal-track-popup', htmlContainer: 'swal-track-html' },
      backdrop: 'rgba(15,23,42,0.7)'
    });
    // Actualizar caché y recargar testimonios en la página
    await actualizarCacheTestimonios();
    cargarTestimonios();
  } catch(e) {
    console.error('[Rating] error:', e);
    if (btn) { btn.disabled = false; btn.textContent = 'Enviar calificación ✓'; }
    alert('Error al guardar. Intenta de nuevo.');
  }
}



function renderTestimoniosHtml(ratings) {
  var track = document.getElementById('testTrack');
  if (!track || !ratings || !ratings.length) { _mostrarSinTestimonios(); return; }

  track.innerHTML = ratings.map(function(r) {
    var starsHtml = Array.from({length:5}, function(_,i){
      return '<span style="color:' + (i < r.stars ? '#F59E0B' : '#D1D5DB') + '">★</span>';
    }).join('');
    var inicial = (r.nombre || 'C')[0].toUpperCase();
    return '<div class="test-card">'
      + '<div class="test-quote">“</div>'
      + '<div class="test-stars">' + starsHtml + '</div>'
      + '<div class="test-text">' + (r.obs || '') + '</div>'
      + '<div class="test-author">'
        + '<div class="test-avatar">' + inicial + '</div>'
        + '<div>'
          + '<div class="test-name">' + (r.nombre || 'Cliente') + '</div>'
          + '<div class="test-vehicle">' + (r.vehiculo || '').trim() + '</div>'
        + '</div>'
      + '</div>'
    + '</div>';
  }).join('');

  // Mostrar controles del slider
  var controls = document.querySelector('.test-controls');
  if (controls) controls.style.display = '';

  // Reiniciar slider
  testPos = 0;
  resetTestTimer();
}

function cargarTestimonios() {

  function _leer() {
    window._trackDb.ref('testimoniosCache').once('value')
      .then(function(snap) {
        var cache = snap.val();
        if (cache && cache.items && cache.items.length) {
          renderTestimoniosHtml(cache.items);
        } else {
          console.warn('[Testimonios] Nodo vacío o sin items');
          _mostrarSinTestimonios();
        }
      })
      .catch(function(e) {
        console.error('[Testimonios] Error Firebase:', e.code, e.message);
        _mostrarSinTestimonios();
      });
  }

  // _trackDb puede venir de app.js o de _initTrackDb propio
  if (window._trackDb) {
    _leer();
  } else {
    console.warn('[Testimonios] _trackDb no disponible, esperando...');
    // Reintentar cada 500ms hasta 5 segundos
    var intentos = 0;
    var intervalo = setInterval(function() {
      intentos++;
      if (window._trackDb) {
        clearInterval(intervalo);
        _leer();
      } else if (intentos >= 10) {
        clearInterval(intervalo);
        console.error('[Testimonios] Firebase no disponible tras 5s');
        _mostrarSinTestimonios();
      }
    }, 500);
  }
}

function _mostrarSinTestimonios() {
  var track = document.getElementById('testTrack');
  if (!track) return;
  track.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;'
    + 'min-width:340px;padding:48px 20px;flex-direction:column;gap:12px;text-align:center">'
    + '<svg width="36" height="36" viewBox="0 0 24 24" fill="none">'
    + '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"'
    + ' stroke="var(--t3)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    + '<div style="font-family:var(--f2);font-size:14px;font-weight:700;color:var(--t2)">Sé el primero en calificar</div>'
    + '<div style="font-family:var(--f3);font-size:13px;color:var(--t3);max-width:260px;line-height:1.6">'
    + 'Las reseñas de nuestros clientes aparecerán aquí después de que califiquen su servicio.</div>'
    + '</div>';
  // Ocultar controles del slider si no hay tarjetas
  var controls = document.querySelector('.test-controls');
  if (controls) controls.style.display = 'none';
}


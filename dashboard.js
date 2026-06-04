(function(){
  const firebaseConfig = {
    apiKey: "AIzaSyBtwmqZqZ2Hj1Xt5ogIaTqEZJXd3vKVMig",
    authDomain: "volkswmazda-ad26d.firebaseapp.com",
    databaseURL: "https://volkswmazda-ad26d-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "volkswmazda-ad26d",
    storageBucket: "volkswmazda-ad26d.firebasestorage.app",
    messagingSenderId: "178846757029",
    appId: "1:178846757029:web:4d54fee13233950c8c5d4c"
  };

  const app  = firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db   = firebase.database();

  // Expose compat API through the same window._ interface the rest of the code uses
  window._fbAuth   = auth;
  window._fbSignOut = () => auth.signOut();
  window._fbCreateUser = (a, email, pass) => auth.createUserWithEmailAndPassword(email, pass);
  window._fbDeleteAuthUser = (user) => user.delete();

  window._fbDb     = db;
  window._fbRef    = (dbInst, path) => (path !== undefined ? dbInst.ref(path) : dbInst.ref(dbInst));
  window._fbSet    = (ref, val)     => ref.set(val);
  window._fbGet    = (ref)          => ref.once('value');
  window._fbUpdate = (ref, val)     => ref.update(val);
  window._fbRemove = (ref)          => ref.remove();
  window._fbOnValue = (ref, cb, err) => { ref.on('value', cb, err); return () => ref.off('value', cb); };
  window._fbOff    = (ref, cb)      => ref.off('value', cb);

  // Guard: wait for Auth to restore session before starting dashboard
  document.addEventListener('DOMContentLoaded', function() {
    const raw = sessionStorage.getItem('vmz_user');
    if (!raw) { window.location.href = 'Login.html'; return; }
    try { window._sessionUser = JSON.parse(raw); }
    catch(e) { window.location.href = 'Login.html'; return; }

    // One-shot: fires once when Auth state is known
    const unsub = auth.onAuthStateChanged(function(firebaseUser) {
      unsub();
      if (!firebaseUser) {
        sessionStorage.removeItem('vmz_user');
        window.location.href = 'Login.html';
        return;
      }
      if (typeof initDash === 'function') initDash();
    });
  });
})();

// ===================== SWEETALERT2 HELPERS ===================================
async function vmzConfirm(title, text, opts){
  opts = opts || {};
  const r = await Swal.fire({
    title: title,
    html: text || '',
    icon: opts.icon || 'warning',
    showCancelButton: true,
    confirmButtonText: opts.confirm || 'Confirmar',
    cancelButtonText: opts.cancel || 'Cancelar',
    customClass:{
      popup:'vmz-swal-popup' + (opts.danger ? ' vmz-danger' : ''),
      backdrop:'vmz-swal-backdrop'
    },
    buttonsStyling: true,
    focusCancel: true
  });
  return r.isConfirmed;
}

function vmzAlert(title, text, icon){
  Swal.fire({
    title: title,
    html: text || '',
    icon: icon || 'info',
    confirmButtonText: 'Entendido',
    customClass:{
      popup:'vmz-swal-popup',
      backdrop:'vmz-swal-backdrop'
    },
    buttonsStyling: true
  });
}

// ===================== SESIÓN =====================
let currentUser = null;


// ===================== CONFIG =====================
const ALL_BRANDS = {
  'Volkswagen':{code:'VW',models:['Golf GTI','Golf R','Tiguan','Tiguan R-Line','Passat','Arteon','T-Roc','Touareg','Polo GTI','Jetta','ID.4']},
  'Audi':      {code:'AU',models:['A3 Sportback','A4 Avant','A5 Coupé','A6','A7','Q3','Q5','Q5 Sportback','Q7','TT','RS3','e-tron']},
  'Mazda':     {code:'MZ',models:['Mazda2','Mazda3','Mazda6','CX-3','CX-5','CX-30','CX-50','CX-90','MX-5 Miata']},
  'Toyota':    {code:'TY',models:['Corolla','Camry','RAV4','Hilux','Land Cruiser','C-HR','Yaris','Prado']},
  'Honda':     {code:'HD',models:['Civic','Accord','CR-V','HR-V','Pilot','Fit','Odyssey']},
  'Chevrolet': {code:'CH',models:['Spark','Onix','Tracker','Equinox','Traverse','Camaro','Suburban']},
  'Renault':   {code:'RN',models:['Logan','Sandero','Duster','Kwid','Koleos','Megane']},
  'Nissan':    {code:'NS',models:['March','Versa','Sentra','X-Trail','Murano','Frontier','Kicks','Qashqai']},
  'Ford':      {code:'FD',models:['Fiesta','Focus','Escape','Explorer','Ranger','Mustang','Bronco']},
  'Hyundai':   {code:'HY',models:['Accent','Elantra','Tucson','Santa Fe','Kona','Ioniq 5','Creta']},
  'Kia':       {code:'KI',models:['Picanto','Rio','Cerato','Sportage','Sorento','Stinger','EV6']},
  'BMW':       {code:'BM',models:['Serie 1','Serie 3','Serie 5','X1','X3','X5','M3','M5']},
  'Mercedes-Benz':{code:'MB',models:['Clase A','Clase C','Clase E','GLA','GLC','GLE','AMG GT']},
  'Porsche':   {code:'PC',models:['911','Cayenne','Macan','Panamera','Taycan']},
  'Subaru':    {code:'SB',models:['Impreza','Legacy','Outback','Forester','XV','WRX']},
  'Mitsubishi':{code:'MT',models:['Lancer','Outlander','Eclipse Cross','Montero Sport','L200']},
  'Jeep':      {code:'JP',models:['Wrangler','Cherokee','Grand Cherokee','Compass','Renegade']},
  'Land Rover':{code:'LR',models:['Discovery','Defender','Range Rover','Freelander','Evoque']},
  'Volvo':     {code:'VL',models:['XC40','XC60','XC90','S60','V60','C40']},
  'Suzuki':    {code:'SZ',models:['Swift','Vitara','Jimny','S-Cross','Baleno']},
};

const STATUS_CLASS = {'Recibido':'s-recibido','En Inspección':'s-inspeccion','Finalizado':'s-finalizado'};

const INSP_BLOCKS = [
  {label:'Carrocería & Exterior',icon:'<path d="M3 12l9-8 9 8v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',items:['Pintura general','Parabrisas delantero','Parabrisas trasero','Lunas laterales','Ópticas / Faros','Luces traseras','Espejos retrovisores','Parachoques del.','Parachoques tras.']},
  {label:'Llantas & Frenos',icon:'<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',items:['Llanta del. derecha','Llanta del. izquierda','Llanta tras. derecha','Llanta tras. izquierda','Llanta repuesto','Frenos delanteros','Frenos traseros','Freno de mano','Rines / Aros']},
  {label:'Motor & Mecánica',icon:'<rect x="3" y="7" width="18" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M7 7V5M17 7V5M7 17v2M17 17v2M3 12h2M19 12h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',items:['Estado visual motor','Nivel de aceite','Nivel refrigerante','Correa distribución','Sistema de escape','Caja de cambios','Dirección','Suspensión del.','Suspensión tras.']},
  {label:'Interior & Electrónica',icon:'<rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',items:['Tablero / Dashboard','Sistema de audio','Aire acondicionado','Tapicería / Asientos','Volante y controles','Computador a bordo','Luces interiores','Cinturones seguridad','Airbags (indicador)']},
];


let currentStep=1, selectedBrand='', ratingMap={}, photoMap={};
let techRatingMap={}, techPhotoMap={};
let localPeritajes=[];
let lastPayload=null;
let currentAtenderID=null;


let _localPeritajes = [];
let _localTipos     = [];
let _localCats      = [];
let _tiposListenerActive   = false;
let _catsListenerActive    = false;
let _servicesListenerActive = false;

// ── Helpers ──────────────────────────────────────────────────────────────
function fbDb(){ return window._fbDb; }
function fbRef(path){ return firebase.database().ref(path); }
async function fbSet(path, val){ return window._fbSet(fbRef(path), val); }
async function fbUpdate(path, val){ return window._fbUpdate(fbRef(path), val); }
async function fbRemove(path){ return window._fbRemove(fbRef(path)); }
function fbListen(path, cb){
  return window._fbOnValue(fbRef(path), snap => cb(snap.val() || {}));
}

// ── SERVICIOS (peritajes) ─────────────────────────────────────────────────
function startServicesListenerTech(){
  // Dedicated listener for technician view — auto-refreshes tech cards on data change
  if(_servicesListenerActive) return;
  if(!window._fbDb || !window._fbRef || !window._fbOnValue) return;
  _servicesListenerActive = true;
  const servRef = window._fbRef(window._fbDb, 'services');
  window._fbOnValue(servRef, (snapshot) => {
    const raw = snapshot.val() || {};
    _localPeritajes = Object.values(raw).filter(p =>
      p && typeof p === 'object' && p.id && p.inspection && p.inspection.status
    );
    localPeritajes = _localPeritajes;
    refreshTechView();       // refresh tech cards
    renderTechHistorial();   // refresh historial
  }, (err) => {
    console.error('[Firebase] services listener (tech) error:', err);
    _servicesListenerActive = false;
  });
}

function startServicesListener(){
  if(_servicesListenerActive) return;
  if(!window._fbDb || !window._fbRef || !window._fbOnValue) return;
  _servicesListenerActive = true;
  const servRef = window._fbRef(window._fbDb, 'services');
  window._fbOnValue(servRef, (snapshot) => {
    const raw = snapshot.val() || {};
    // Filter to valid service objects only (must have id + inspection)
    _localPeritajes = Object.values(raw).filter(p =>
      p && typeof p === 'object' && p.id && p.inspection && p.inspection.status
    );
    localPeritajes = _localPeritajes;
    refreshDashboard();
  }, (err) => {
    console.error('[Firebase] services listener error:', err);
    _servicesListenerActive = false;
  });
}

async function dbSavePeritaje(p){
  await fbSet('services/' + p.id, p);
}


const APPS_SCRIPT_URL   = 'https://script.google.com/macros/s/AKfycby2ttC4i37DTiG2XFFfxNSQd_wpwOsy5CsAqpEiq0KBfXV8-kZFMLrXFojLOsvrJ_UFbQ/exec';


async function _compressPhoto(dataURL, maxW=900, quality=0.72){
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>{
      // Solo reducir si es más grande que maxW; nunca ampliar
      const scale=Math.min(1, maxW/img.width);
      const canvas=document.createElement('canvas');
      canvas.width=Math.round(img.width*scale);
      canvas.height=Math.round(img.height*scale);
      canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror=()=>resolve(dataURL);
    img.src=dataURL;
  });
}


async function dbSavePhotos(pertId, key, dataURLs){
}

function dbGetPhotosForPeritaje(pertId){
  if(window._adminPdfId===pertId && window._adminPhotosCache)
    return window._adminPhotosCache;
  const result=[];
  Object.entries(techPhotoMap).forEach(([key,photos])=>{
    photos.forEach(data=>result.push({pertId,key,data}));
  });
  return result;
}

async function pdfQueueUpload(serviceId, pdfBase64, filename){
  try{
    const sizeKB=Math.round(pdfBase64.length*0.75/1024);
    console.log('[Drive] Subiendo PDF:',sizeKB,'KB');

    const fd=new FormData();
    fd.append('origin',   window.location.origin || 'null');
    fd.append('action',   'upload');
    fd.append('serviceId', serviceId);
    fd.append('filename',  filename||serviceId+'.pdf');
    fd.append('pdfBase64', pdfBase64);

    const res=await fetch(APPS_SCRIPT_URL, {method:'POST', body:fd});
    const text=await res.text();
    let data;
    try{ data=JSON.parse(text); }
    catch(e){ throw new Error('Apps Script respondió: '+text.slice(0,200)); }

    if(!data.ok) throw new Error(data.error||'Upload failed');

    await fbSet('pdf_queue/'+serviceId, {
      fileId:      data.fileId,
      downloadUrl: data.downloadUrl,
      uploadedAt:  new Date().toISOString(),
      sizeKB
    });
    return { ok:true, fileId:data.fileId, downloadUrl:data.downloadUrl };
  }catch(e){
    console.error('[Drive] upload error:',e);
    return { ok:false, error:e.message };
  }
}

async function pdfQueueGet(serviceId){
  try{
    const snap=await window._fbGet(window._fbRef(window._fbDb,'pdf_queue/'+serviceId));
    return snap.val();
  }catch(e){ return null; }
}

async function pdfQueueDelete(serviceId, fileId){
  try{
    // Borrar de Drive via FormData
    if(fileId){
      const fd=new FormData();
      fd.append('origin',  window.location.origin || 'null');
      fd.append('action', 'delete');
      fd.append('fileId',  fileId);
      await fetch(APPS_SCRIPT_URL, {method:'POST', body:fd});
    }
    // Borrar fileId de Firebase
    await fbRemove('pdf_queue/'+serviceId);
  }catch(e){ console.warn('[Drive] delete error:',e); }
}

let _pdfQueueListener=null;
function startPdfQueueListener(){
  if(_pdfQueueListener) return;
  _pdfQueueListener=true;
  window._pdfQueue={};
  window._fbOnValue(window._fbRef(window._fbDb,'pdf_queue'), snap=>{
    window._pdfQueue=snap.val()||{};
    renderTable(localPeritajes);
  });
}

function dbGetAllPeritajes(){ return _localPeritajes; }

function startTiposListener(){
  if(_tiposListenerActive) return;
  if(!window._fbDb || !window._fbRef || !window._fbOnValue) return;
  _tiposListenerActive = true;
  const tRef = window._fbRef(window._fbDb, 'serviceTypes');
  window._fbOnValue(tRef, (snapshot) => {
    const raw = snapshot.val() || {};
    _localTipos = Object.values(raw).filter(t => t && t.id);
    renderTiposServicio();
    refreshCatTipoSel();
    buildTipoSelector();
  }, (err) => {
    console.error('[Firebase] serviceTypes listener error:', err);
    _tiposListenerActive = false;
  });
}

function getTipos(){ return _localTipos; }

async function fbSaveTipo(id, obj){ await fbSet('serviceTypes/' + id, obj); }
async function fbRemoveTipo(id){ await fbRemove('serviceTypes/' + id); }

// ── CATEGORÍAS ────────────────────────────────────────────────────────────
function startCatsListener(){
  if(_catsListenerActive) return;
  if(!window._fbDb || !window._fbRef || !window._fbOnValue) return;
  _catsListenerActive = true;
  const cRef = window._fbRef(window._fbDb, 'categories');
  window._fbOnValue(cRef, (snapshot) => {
    const raw = snapshot.val() || {};
    _localCats = Object.values(raw).filter(c => c && c.id);
    renderCategorias();
  }, (err) => {
    console.error('[Firebase] categories listener error:', err);
    _catsListenerActive = false;
  });
}

function getCats(){ return _localCats; }

async function fbSaveCat(id, obj){ await fbSet('categories/' + id, obj); }
async function fbRemoveCat(id){ await fbRemove('categories/' + id); }

// ===================== SESIÓN (sessionStorage) =====================
function getCurrentUser() {
  const raw = sessionStorage.getItem('vmz_user');
  if (!raw) { window.location.href = 'Login.html'; return null; }
  try { return JSON.parse(raw); } catch(e) { window.location.href = 'Login.html'; return null; }
}

async function logout() {
  try {
    if (window._fbAuth && window._fbSignOut) {
      await window._fbSignOut(window._fbAuth);
    }
  } catch(e) {}
  sessionStorage.removeItem('vmz_user');
  window.location.href = 'Login.html';
}

// ===================== INIT =====================
async function initDash(){
  // Read user from sessionStorage (set by Firebase login)
  const userData = getCurrentUser();
  if (!userData) return;
  currentUser = {
    uid:     userData.uid   || '',
    email:   userData.email || '',
    role:    userData.role  || 'tech',
    name:    userData.name  || '',
    display: userData.display || userData.name || '',
    techName: userData.techName || null
  };
  updateClock();setInterval(updateClock,1000);
  applyRole();
  buildBrandSelector();
  buildInspGrid('insp-grid','tech-insp-grid');
  const now=new Date();
  document.getElementById('f-fecha').value=now.toISOString().split('T')[0];
  document.getElementById('f-hora').value=now.toTimeString().slice(0,5);
  genPertID();
  try{
      // localPeritajes is now synced via startServicesListener — no manual reload needed
  }catch(err){
    console.error("[DB] init error:",err);
    showToast("Error al inicializar la base de datos","err");
    localPeritajes=[];
  }
  if(currentUser.role==='admin'){
    startUsersListener();
    startTiposListener();
    startCatsListener();
    startServicesListener();
    startPdfQueueListener();
    setTimeout(_syncAdminIndex, 2000);
  } else {
    startTiposListener();
    startCatsListener();
    startServicesListenerTech();
  }
  console.log('[Notif] currentUser.uid:', currentUser.uid, '| role:', currentUser.role);
  if(currentUser.uid && window._fbDb){
    startNotificationsListener(currentUser.uid);
    console.log('[Notif] listener iniciado para:', currentUser.uid);
  } else {
    console.warn('[Notif] ⚠ No se inició listener — uid vacío o _fbDb no disponible');
  }
}

function applyRole(){
  const isAdmin=currentUser.role==='admin';
  // Avatar & name
  const av=document.getElementById('sb-avatar-el');
  av.textContent=currentUser.name.charAt(0).toUpperCase();
  av.className='sb-avatar '+(isAdmin?'admin':'tech');
  document.getElementById('sb-uname-el').textContent=currentUser.name;
  document.getElementById('sb-urole-el').textContent=isAdmin?'Administrador · Tunja':'Técnico · Tunja';
  // Show/hide role elements — do this BEFORE removing overlay
  document.querySelectorAll('.sb-admin-only').forEach(el=>{el.style.display=isAdmin?'':'none';});
  document.querySelectorAll('.sb-tech-only').forEach(el=>{el.style.display=isAdmin?'none':'';});
  // Welcome name
  document.getElementById('dash-user-name').textContent=currentUser.name;
  if(!isAdmin){
    const heroName=document.getElementById('tech-user-name-hero');
    if(heroName) heroName.textContent=currentUser.name;
  }
  // Activate the correct default page before revealing UI
  if(isAdmin){
    showPage('dashboard', document.querySelector('[data-page=dashboard]'));
  } else {
    showPage('mis-peritajes', document.querySelector('[data-page=mis-peritajes]'));
  }
  // Fade out the loading overlay — short delay so first paint is correct
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      const overlay = document.getElementById('app-loading-overlay');
      if(overlay){
        overlay.classList.add('hiding');
        setTimeout(()=>overlay.remove(), 380);
      }
    });
  });
}

function updateClock(){
  const now=new Date();
  document.getElementById('tb-clock').textContent=now.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'});
  document.getElementById('tb-date').textContent=now.toLocaleDateString('es-CO',{weekday:'short',day:'2-digit',month:'short'}).toUpperCase();
}

// ===================== DASHBOARD (ADMIN) =====================
function refreshDashboard(){
  const total=localPeritajes.length;
  const rec=localPeritajes.filter(p=>p.inspection?.status==='Recibido').length;
  const insp=localPeritajes.filter(p=>p.inspection?.status==='En Inspección').length;
  const fin=localPeritajes.filter(p=>p.inspection?.status==='Finalizado').length;
  document.getElementById('stat-diag').textContent=String(insp).padStart(2,'0');
  document.getElementById('stat-rec').textContent=String(rec).padStart(2,'0');
  document.getElementById('stat-comp').textContent=String(fin).padStart(2,'0');
  document.getElementById('stat-total').textContent=String(total).padStart(2,'0');
  document.getElementById('bar-diag').style.width=total>0?Math.min(100,Math.round((insp/total)*100))+'%':'0%';
  document.getElementById('stat-trend-txt').textContent=total>0?`${insp} activo${insp!==1?'s':''}  ·  ${total} total`:'Sin movimiento aún';
  const lbl=document.getElementById('table-count-label');if(lbl)lbl.textContent=total>0?`${total} servicio${total!==1?'s':''}  registrado${total!==1?'s':''}`:'Sin registros aún';
  renderTable(localPeritajes);
}

function renderTable(data){
  const tbody=document.getElementById('table-body');
  if(!data||data.length===0){tbody.innerHTML='<tr><td colspan="8" style="text-align:center;color:var(--t3);padding:32px">No hay servicios registrados aún</td></tr>';return;}
  const sorted=[...data].filter(r=>r&&r.inspection).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  tbody.innerHTML=sorted.map(r=>{
    const date=r.createdAt?new Date(r.createdAt).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'2-digit'}):'—';
    const sc=STATUS_CLASS[r.inspection?.status]||'s-recibido';
    return `<tr>
      <td><span class="cell-vin">${r.id}</span></td>
      <td><span style="font-family:var(--f2);font-weight:700;letter-spacing:.06em;color:var(--t1)">${r.vehicle.plate||'—'}</span></td>
      <td><span class="cell-name">${r.owner.name}</span></td>
      <td style="font-size:12px;color:var(--t2)">${r.inspection.technician||'—'}</td>
      <td><span class="status-pill ${sc}"><span class="dot"></span>${(r.inspection.status||'Recibido').toUpperCase()}</span></td>
      <td style="font-family:var(--f2);font-size:12px;color:var(--t3)">${date}</td>
      <td>
        <button onclick="copiarUrlSeguimiento('${r.id}')" style="display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:6px;border:1.5px solid var(--acc-border);background:var(--acc-soft);color:var(--acc);font-size:11px;font-weight:700;cursor:pointer;letter-spacing:.04em;white-space:nowrap;font-family:var(--f2);transition:all .18s" onmouseover="this.style.background='var(--acc)';this.style.color='#fff'" onmouseout="this.style.background='var(--acc-soft)';this.style.color='var(--acc)'">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
          Seguimiento
        </button>
      </td>
      <td>
        ${(r.inspection&&r.inspection.status==='Finalizado')
          ? `<button onclick="copiarUrlCalificacion('${r.id}')" style="display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:6px;border:1.5px solid rgba(234,179,8,.35);background:rgba(234,179,8,.08);color:#ca8a04;font-size:11px;font-weight:700;cursor:pointer;letter-spacing:.04em;white-space:nowrap;font-family:var(--f2);transition:all .18s" onmouseover="this.style.background='rgba(234,179,8,.18)'" onmouseout="this.style.background='rgba(234,179,8,.08)'">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              URL Calificación
            </button>`
          : `<span style="font-size:11px;color:var(--t3)">—</span>`}
      </td>
      <td style="display:flex;gap:6px">
        <button class="btn-ver" onclick='showDetail(${JSON.stringify(r).replace(/'/g,"&#39;")})'>VER</button>
        ${(()=>{
          const hasQueue = window._pdfQueue && window._pdfQueue[r.id];
          const isFin = r.inspection.status==='Finalizado';
          if(isFin && hasQueue)
            return `<button class="btn-ver" style="color:#15803D;border-color:rgba(22,163,74,.28);background:rgba(22,163,74,.07)" onclick='downloadPDFById("${r.id}")'>⬇ PDF</button>`;
          if(isFin && !hasQueue)
            return `<button disabled style="font-size:11px;padding:5px 10px;border-radius:6px;border:1px solid #D1D5DB;background:#F3F4F6;color:#9CA3AF;cursor:default;font-family:var(--f3);font-weight:500;display:inline-flex;align-items:center;gap:5px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 15V3M6 9l6 6 6-6M3 21h18" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round"/></svg> PDF descargado</button>`;
          return `<span style="font-size:11px;color:var(--t3)">Pendiente</span>`;
        })()}
      </td>
    </tr>`;
  }).join('');
}

function filterTable(q){
  const f=q.trim().toLowerCase();
  renderTable(f?localPeritajes.filter(r=>(r.vehicle.plate||'').toLowerCase().includes(f)||(r.owner.name||'').toLowerCase().includes(f)||(r.id||'').toLowerCase().includes(f)):localPeritajes);
}

async function showDetail(r){
  document.getElementById('det-title').textContent=`Servicio · ${r.id}`;

  // ── Condiciones evaluadas ─────────────────────────────────────────────────
  const ratings = r.inspection.ratings || {};
  const tipoId  = r.inspection.tipoServicio || '';
  const detCats = _localCats.filter(c => c.tipoId === tipoId && (c.items||[]).length > 0);
  let totalRated = 0, totalGood = 0;
  const catBlocks = [];
  detCats.forEach((cat, ci) => {
    const evalItems = (cat.items||[]).map((item, ii) => ({item, val: ratings[`cat${ci}_i${ii}`]||null}))
                                     .filter(x => x.val && x.val !== 'N/A');
    if(!evalItems.length) return;
    totalRated += evalItems.length;
    totalGood  += evalItems.filter(x => x.val === 'Bueno').length;
    catBlocks.push({nombre: cat.nombre, items: evalItems});
  });
  const pct = totalRated > 0 ? Math.round((totalGood/totalRated)*100) : null;
  const barColor = pct === null ? '#6B7280' : pct >= 75 ? '#16A34A' : pct >= 40 ? '#D97706' : '#DC2626';

  const pillColor = {
    Bueno:   {bg:'#DCFCE7', color:'#15803D'},
    Regular: {bg:'#FEF9C3', color:'#A16207'},
    Malo:    {bg:'#FEE2E2', color:'#B91C1C'}
  };

  // Score bar
  const scoreHTML = pct !== null ? `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 0 4px">
      <div style="font-size:22px;font-weight:800;color:${barColor};min-width:48px">${pct}%</div>
      <div style="flex:1">
        <div style="height:5px;background:var(--bg3);border-radius:99px;overflow:hidden;margin-bottom:4px">
          <div style="height:100%;width:${pct}%;background:${barColor};border-radius:99px"></div>
        </div>
        <div style="font-size:10.5px;color:var(--t3)">${totalRated} ítem${totalRated!==1?'s':''} evaluado${totalRated!==1?'s':''} · ${totalGood} en buen estado</div>
      </div>
    </div>` : '';

  const catRowsHTML = catBlocks.map(b => `
    <div style="margin-bottom:6px">
      <div style="font-size:10px;font-weight:700;letter-spacing:.07em;color:var(--t3);text-transform:uppercase;padding:4px 0 6px">${b.nombre}</div>
      ${b.items.map(x => {
        const p = pillColor[x.val] || {bg:'#F3F4F6', color:'#6B7280'};
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border)">
          <span style="font-size:13px;color:var(--t1)">${x.item}</span>
          <span style="font-size:10px;font-weight:700;padding:3px 9px;border-radius:20px;background:${p.bg};color:${p.color}">${x.val}</span>
        </div>`;
      }).join('')}
    </div>`).join('');

  const evalSection = catBlocks.length ? `
    <div class="det-section">
      <div class="det-section-title">Condiciones evaluadas</div>
      ${scoreHTML}
      ${catRowsHTML}
    </div>` : '';

  // ── Observaciones ─────────────────────────────────────────────────────────
  const obs   = r.inspection.techObservations || r.inspection.observations || '';
  const acces = r.inspection.accessories || '';
  const obsSection = (obs || acces) ? `
    <div class="det-section">
      <div class="det-section-title">Observaciones</div>
      ${obs ? `<div style="font-size:13px;color:var(--t2);line-height:1.6;white-space:pre-wrap">${obs}</div>` : ''}
      ${acces ? `<div class="det-row"><span class="det-key">Accesorios</span><span class="det-val">${acces}</span></div>` : ''}
    </div>` : '';

  // ── Acción PDF ────────────────────────────────────────────────────────────
  const hasQueue = window._pdfQueue && window._pdfQueue[r.id];
  const isFin = r.inspection.status === 'Finalizado';
  const pdfBtn = isFin && hasQueue
    ? `<button class="btn-prim" style="background:#16A34A" onclick="downloadPDFById('${r.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 15V3M6 9l6 6 6-6M3 21h18" stroke="white" stroke-width="2" stroke-linecap="round"/></svg> Descargar PDF</button>`
    : isFin && !hasQueue
      ? `<span style="font-size:12px;color:var(--t3)">PDF ya descargado por el administrador</span>`
      : `<span style="font-size:12px;color:var(--t3)">El PDF estará disponible al finalizar</span>`;

  const pdfSinFotosBtn = isFin
    ? `<button class="btn-sec" onclick="downloadPDFSinFotos('${r.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 15V3M6 9l6 6 6-6M3 21h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Descargar PDF sin fotos</button>`
    : ``;

  document.getElementById('det-body').innerHTML=`

    <!-- PROPIETARIO -->
    <div class="det-section">
      <div class="det-section-title">Propietario</div>
      <div class="det-row"><span class="det-key">Nombre</span><span class="det-val">${r.owner.name||'—'}</span></div>
      <div class="det-row"><span class="det-key">Documento</span><span class="det-val">${r.owner.doc||'—'}</span></div>
      <div class="det-row"><span class="det-key">Teléfono</span><span class="det-val">${r.owner.tel||'—'}</span></div>
      <div class="det-row"><span class="det-key">Correo</span><span class="det-val" style="font-size:11.5px">${r.owner.email||'—'}</span></div>
    </div>

    <!-- VEHÍCULO -->
    <div class="det-section">
      <div class="det-section-title">Vehículo</div>
      <div class="det-row"><span class="det-key">Marca / Modelo</span><span class="det-val">${r.vehicle.brand||'—'} ${r.vehicle.model||''} ${r.vehicle.year||''}</span></div>
      <div class="det-row"><span class="det-key">Placa</span><span class="det-val">${r.vehicle.plate||'—'}</span></div>
      <div class="det-row"><span class="det-key">Color</span><span class="det-val">${r.vehicle.color||'—'}</span></div>
      <div class="det-row"><span class="det-key">Kilometraje</span><span class="det-val">${r.vehicle.km?Number(r.vehicle.km).toLocaleString('es-CO')+' km':'—'}</span></div>
      <div class="det-row"><span class="det-key">Combustible</span><span class="det-val">${r.vehicle.fuel||'—'}</span></div>
      <div class="det-row"><span class="det-key">Transmisión</span><span class="det-val">${r.vehicle.transmission||'—'}</span></div>
    </div>

    <!-- INSPECCIÓN -->
    <div class="det-section">
      <div class="det-section-title">Inspección</div>
      <div class="det-row">
        <span class="det-key">Técnico</span>
        <span class="det-val" style="display:flex;align-items:center;gap:8px">
          ${r.inspection.technician||'—'}
          ${r.inspection.status==='Recibido' && currentUser && currentUser.role==='admin'
            ? `<button onclick="cambiarTecnico('${r.id}')" style="font-size:11px;padding:4px 10px;border-radius:6px;border:1.5px solid var(--acc-border);background:var(--acc-soft);color:var(--acc);cursor:pointer;font-weight:700;letter-spacing:.04em;transition:all .2s" onmouseover="this.style.background='var(--acc)';this.style.color='#fff'" onmouseout="this.style.background='var(--acc-soft)';this.style.color='var(--acc)'">✎ Reasignar</button>`
            : ''}
        </span>
      </div>
      <div class="det-row"><span class="det-key">Estado</span><span class="det-val"><span class="status-pill ${STATUS_CLASS[r.inspection.status]||'s-recibido'}"><span class="dot"></span>${r.inspection.status||'—'}</span></span></div>
      <div class="det-row"><span class="det-key">Prioridad</span><span class="det-val">${r.inspection.priority||'—'}</span></div>
      <div class="det-row"><span class="det-key">Ingreso</span><span class="det-val">${r.inspection.date||'—'} ${r.inspection.time||''}</span></div>
    </div>

    ${evalSection}
    ${obsSection}

    <!-- ACCIONES -->
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding-top:4px;border-top:1px solid var(--border)">
      ${pdfBtn}
      ${pdfSinFotosBtn}
      <button class="btn-sec" style="margin-left:auto" onclick="document.getElementById('modal-detail').classList.remove('open')">Cerrar</button>
    </div>`;

  document.getElementById('modal-detail').classList.add('open');
}



// ── Copiar URL de calificación al portapapeles ───────────────────────────────
function copiarUrlCalificacion(serviceId) {
  const base = window.location.origin + window.location.pathname.replace(/dashboard\.html.*$/, '');
  const url  = base + 'index.html?rate=' + encodeURIComponent(serviceId);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => showToast('URL de calificación copiada ✓', 'ok'))
      .catch(() => _fallbackCopy(url));
  } else { _fallbackCopy(url); }
}

// ── Copiar URL de seguimiento al portapapeles ────────────────────────────────
function copiarUrlSeguimiento(serviceId) {
  // Construir URL: origen actual + index.html + ?sid=<serviceId>
  const base = window.location.origin + window.location.pathname.replace(/dashboard\.html.*$/, '');
  const url = base + 'index.html?sid=' + encodeURIComponent(serviceId);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('URL de seguimiento copiada al portapapeles ✓', 'ok');
    }).catch(() => _fallbackCopy(url));
  } else {
    _fallbackCopy(url);
  }
}
function _fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); showToast('URL copiada ✓', 'ok'); }
  catch(e) { showToast('No se pudo copiar. URL: ' + text, 'err'); }
  document.body.removeChild(ta);
}

// ── Cambiar técnico asignado (solo en estado Recibido) ──────────────────────
async function cambiarTecnico(serviceId) {
  // Cerrar el modal de detalle
  document.getElementById('modal-detail').classList.remove('open');

  // Cargar técnicos disponibles
  const techSnap = await window._fbDb.ref('users').orderByChild('role').equalTo('tech').once('value');
  const techData = techSnap.val() || {};
  const techs = Object.entries(techData)
    .filter(([, v]) => v.active !== false)
    .map(([uid, v]) => ({ uid, name: v.name || v.email }));

  if (!techs.length) {
    showToast('No hay técnicos activos disponibles', 'err');
    return;
  }

  const opts = techs.map(t => `<option value="${t.uid}" data-name="${t.name}">${t.name}</option>`).join('');

  const { value: selectedUid, isConfirmed } = await Swal.fire({
    title: 'Reasignar Técnico',
    html: `
      <p style="font-size:13px;color:#6B7280;margin-bottom:16px">Solo se puede cambiar el técnico cuando el estado es <strong>Recibido</strong>.</p>
      <select id="swal-tech-sel" style="width:100%;padding:11px 14px;border-radius:10px;border:1.5px solid #D1D5DB;font-size:15px;font-weight:600;color:#111827;background:#F9FAFB;outline:none;cursor:pointer">
        <option value="">Seleccionar técnico...</option>
        ${opts}
      </select>`,
    confirmButtonText: 'Guardar cambio',
    cancelButtonText: 'Cancelar',
    showCancelButton: true,
    customClass: { popup: 'vmz-swal-popup', confirmButton: 'vmz-swal-btn', cancelButton: 'vmz-swal-btn-sec' },
    preConfirm: () => {
      const sel = document.getElementById('swal-tech-sel');
      if (!sel.value) { Swal.showValidationMessage('Selecciona un técnico'); return false; }
      return sel.value;
    }
  });

  if (!isConfirmed || !selectedUid) return;

  // Obtener nombre del técnico seleccionado
  const selTech = techs.find(t => t.uid === selectedUid);
  if (!selTech) return;

  try {
    // Obtener el servicio actual para saber quién era el técnico anterior
    const prevSnap = await window._fbDb.ref(`services/${serviceId}`).once('value');
    const prevService = prevSnap.val();
    const prevTechUid = prevService?.inspection?.technicianId;
    const prevTechName = prevService?.inspection?.technician || 'el técnico anterior';
    const plate = prevService?.vehicle?.plate || 'S/N';
    const brand = prevService?.vehicle?.brand || '';

    await window._fbDb.ref(`services/${serviceId}/inspection`).update({
      technician: selTech.name,
      technicianId: selTech.uid,
      reasignadoPor: currentUser.name || currentUser.email,
      reasignadoAt: new Date().toISOString()
    });

    // Notificar al técnico NUEVO
    _pushNotification(
      selTech.uid,
      'assign',
      'Servicio asignado',
      `Se te asignó el vehículo ${brand} · Placa: ${plate}`,
      { serviceId }
    );

    // Notificar al técnico ANTERIOR (si era distinto)
    if (prevTechUid && prevTechUid !== selTech.uid) {
      _pushNotification(
        prevTechUid,
        'reasignado',
        'Servicio reasignado',
        `El servicio de ${brand} · Placa: ${plate} fue reasignado a ${selTech.name}. Ya no debes gestionarlo.`,
        { serviceId, reasignadoA: selTech.name }
      );
    }

    showToast(`Técnico actualizado a ${selTech.name}`, 'ok');
  } catch(e) {
    console.error(e);
    showToast('Error al actualizar el técnico', 'err');
  }
}

// ===================== TÉCNICO PANEL =====================
function refreshTechView(){
  if(!currentUser||currentUser.role!=='tech') return;
  const myName=currentUser.techName||currentUser.name;
  const myUid=currentUser.uid||'';
  const myPerts=localPeritajes.filter(p=>{
    if(!p.inspection) return false;
    // Excluir si fue reasignado a otro técnico
    if(p.inspection.reasignadoAt){
      const nowAssignedUid = p.inspection.technicianId;
      if(myUid && nowAssignedUid && nowAssignedUid !== myUid) return false;
    }
    const byUid = myUid && p.inspection.technicianId === myUid;
    const byName = !myUid && p.inspection.technician === myName;
    return (byUid||byName) && p.inspection.status!=='Finalizado';
  });
  const badge=document.getElementById('sb-badge-tech');
  if(badge) badge.textContent=myPerts.length;
  const container=document.getElementById('tech-cards-container');
  if(!container) return;
  if(myPerts.length===0){
    container.innerHTML=`<div class="no-peritajes"><div class="no-peritajes-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4" stroke="var(--acc)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div><p style="font-size:15px;font-weight:600;color:var(--t1);margin-bottom:6px">Sin servicios pendientes</p><p style="font-size:13px;color:var(--t3)">El administrador le asignará nuevos servicios</p></div>`;
    return;
  }
  const sorted=[...myPerts].sort((a,b)=>{
    const prioOrder={Urgente:0,Alta:1,Normal:2,Programado:3};
    return (prioOrder[a.inspection.priority]||2)-(prioOrder[b.inspection.priority]||2);
  });
  container.innerHTML=sorted.map(p=>{
    const sc=STATUS_CLASS[p.inspection.status]||'s-recibido';
    const isInsp=p.inspection.status==='En Inspección';
    const isUrgent=p.inspection.priority==='Urgente';
    const isHigh=p.inspection.priority==='Alta';
    const accentClass=isInsp?'insp':isUrgent?'urgent':isHigh?'high':'';
    const tipo=getTipos().find(t=>t.id===p.inspection.tipoServicio);
    return `<div class="tech-card" onclick="abrirAtender('${p.id}')">
      <div class="tech-card-accent ${accentClass}"></div>
      <div class="tech-card-body">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px">
          <div>
            <div class="tc-id">${p.id}${tipo?' · '+tipo.nombre:''}</div>
            <div class="tc-plate">${p.vehicle.plate||'—'}</div>
            <div class="tc-brand">${p.vehicle.brand} ${p.vehicle.model||''} ${p.vehicle.year||''}</div>
          </div>
          <span class="status-pill ${sc}"><span class="dot"></span>${p.inspection.status}</span>
        </div>
        <div class="tc-meta">
          <div class="tc-row"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/></svg>${p.owner.name}</div>
          <div class="tc-row"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>${p.inspection.date||'Sin fecha'} · Prioridad: ${p.inspection.priority||'Normal'}</div>
          ${p.vehicle.reason?`<div class="tc-row" style="white-space:normal"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>${p.vehicle.reason.slice(0,70)}${p.vehicle.reason.length>70?'...':''}</div>`:''}
        </div>
        <div class="btn-atender ${isInsp?'continuar':''}">
          ${isInsp
            ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="white" stroke-width="2" stroke-linecap="round"/></svg> Continuar Inspección`
            : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><polygon points="5 3 19 12 5 21 5 3" fill="white"/></svg> Iniciar Inspección`}
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderTechHistorial(){
  if(!currentUser||currentUser.role!=='tech') return;
  const myName=currentUser.techName||currentUser.name;
  const myUid=currentUser.uid||'';
  const q=(document.getElementById('hist-search')||{}).value||'';
  const filt=(document.getElementById('hist-filter')||{}).value||'';
  let list=localPeritajes.filter(p=>{
    if(!p.inspection) return false;
    const byUid = myUid && p.inspection.technicianId === myUid;
    const byName = p.inspection.technician === myName;
    return byUid||byName;
  });
  if(filt) list=list.filter(p=>p.inspection.status===filt);
  if(q){const ql=q.toLowerCase();list=list.filter(p=>(p.vehicle.plate||'').toLowerCase().includes(ql)||(p.owner.name||'').toLowerCase().includes(ql)||(p.id||'').toLowerCase().includes(ql));}
  list=[...list].sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  const sub=document.getElementById('tech-hist-sub');
  if(sub) sub.textContent=`${list.length} peritaje${list.length!==1?'s':''} registrado${list.length!==1?'s':''}`;
  const cont=document.getElementById('tech-historial-container');
  if(!cont) return;
  if(list.length===0){
    cont.innerHTML=`<div class="no-peritajes"><svg width="48" height="48" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M12 6v6l4 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><p style="margin-top:12px;font-family:var(--f2);font-size:16px">Sin resultados</p><p style="font-size:12px;color:var(--t3);margin-top:6px">No se encontraron peritajes con ese criterio</p></div>`;
    return;
  }
  cont.innerHTML=`<div class="tcard" style="margin-top:0">
    <table class="data-table" style="width:100%">
      <thead><tr>
        <th>ID</th><th>Propietario</th><th>Vehículo</th><th>Placa</th><th>Fecha</th><th>Estado</th><th>Acciones</th>
      </tr></thead>
      <tbody>${list.map(p=>{
        const sc=STATUS_CLASS[p.inspection.status]||'s-recibido';
        const dt=p.inspection.date||'—';
        return `<tr>
          <td style="font-family:var(--f2);font-size:11px;color:var(--t3)">${p.id}</td>
          <td>${p.owner.name||'—'}</td>
          <td style="color:var(--t1)">${p.vehicle.brand||''} ${p.vehicle.model||''} ${p.vehicle.year||''}</td>
          <td><span style="font-family:var(--f2);font-weight:700;color:var(--t1)">${p.vehicle.plate||'—'}</span></td>
          <td>${dt}</td>
          <td><span class="status-pill ${sc}"><span class="dot"></span>${p.inspection.status}</span></td>
          <td><span style="font-size:11px;color:var(--t3)">—</span></td>
        </tr>`;
      }).join('')}</tbody>
    </table>
  </div>`;
}

async function histVerPDF(id){
  // Solo admin — técnico no tiene acceso al PDF
  if(currentUser && currentUser.role==='admin'){
    const p=localPeritajes.find(x=>x.id===id);
    if(p){lastPayload=p;await generatePDF(p);}
  }
}

async function abrirAtender(id){
  const p=localPeritajes.find(x=>x.id===id);
  if(!p) return;
  currentAtenderID=id;
  techRatingMap={...((p.inspection.ratings)||{})};
  techPhotoMap={};

  document.getElementById('atender-id-display').textContent=p.id;

  // Info card
  const infoGrid=document.getElementById('atender-info-grid');
  infoGrid.innerHTML=`
    <div class="ff"><label class="fl">Propietario</label><div class="fi" style="background:rgba(255,255,255,.02);cursor:default">${p.owner.name}</div></div>
    <div class="ff"><label class="fl">Placa</label><div class="fi" style="background:rgba(255,255,255,.02);cursor:default;font-family:var(--f2);font-weight:700">${p.vehicle.plate||'—'}</div></div>
    <div class="ff"><label class="fl">Vehículo</label><div class="fi" style="background:rgba(255,255,255,.02);cursor:default">${p.vehicle.brand} ${p.vehicle.model||''} ${p.vehicle.year||''}</div></div>
    <div class="ff"><label class="fl">Kilometraje</label><div class="fi" style="background:rgba(255,255,255,.02);cursor:default">${p.vehicle.km?Number(p.vehicle.km).toLocaleString('es-CO')+' km':'—'}</div></div>
    <div class="ff"><label class="fl">Motivo de Ingreso</label><div class="fi" style="background:rgba(255,255,255,.02);cursor:default;white-space:normal;height:auto;padding:11px 14px">${p.vehicle.reason||'—'}</div></div>
    <div class="ff"><label class="fl">Prioridad</label><div class="fi" style="background:rgba(255,255,255,.02);cursor:default">${p.inspection.priority||'Normal'}</div></div>
  `;

  // Pre-load ratings into tech grid
  document.querySelectorAll('#tech-insp-grid .r-btn').forEach(b=>{
    b.classList.remove('sel-ok','sel-reg','sel-bad','sel-na');
    const key=b.dataset.key;const val=b.dataset.val;
    if(techRatingMap[key]===val){
      const cls={Bueno:'sel-ok',Regular:'sel-reg',Malo:'sel-bad','N/A':'sel-na'}[val];
      if(cls) b.classList.add(cls);
    }
  });

  // Pre-fill observations
  document.getElementById('tech-obs').value=p.inspection.techObservations||'';
  document.getElementById('tech-acces').value=p.inspection.accessories||'';

  // Build dynamic inspection grid from this service's categories
  buildTechInspGridDynamic(p);

  // Mark as En Inspección if Recibido — await so it persists to Firebase
  if(p.inspection.status==='Recibido'){
    p.inspection.status='En Inspección';
    p.inspection.startedAt = new Date().toISOString();
    await dbSavePeritaje(p);
    showToast('Inspección iniciada · Estado actualizado en BD','ok');
    // Notificar a administradores
    _notifyAdminsOnStarted(p);
  }

  updateTechScore();
  showPage('atender',document.querySelector('[data-page=atender]'));
  document.getElementById('content').scrollTo({top:0,behavior:'smooth'});
}

async function finalizarPeritaje(){
  const obs=document.getElementById('tech-obs').value.trim();
  if(!obs){showToast('Agregue las observaciones técnicas','err');document.getElementById('tech-obs').focus();return;}

  const p=localPeritajes.find(x=>x.id===currentAtenderID);
  if(!p) return;

  p.inspection.status='Finalizado';
  p.inspection.ratings={...techRatingMap};
  p.inspection.techObservations=obs;
  p.inspection.accessories=document.getElementById('tech-acces').value.trim();
  p.inspection.observations=obs;

  // NO guardar el sello en la BD — se captura en tiempo de generación del PDF
  p.inspection.sello       = '';   // no persistir en BD
  p.inspection.sigOwner    = '';   // eliminado
  p.inspection.sigTech     = '';   // eliminado
  p.inspection.finishedAt  = new Date().toISOString();

  // ── Guardar en BD ────────────────────────────────────────────────────────
  await dbSavePeritaje(p);
  lastPayload=p;
  // Guardar también en colecciones relacionales
  await _saveOwnerAndVehicle(p);
  _notifyAdminsOnDone(p);

  // ── Bloquear UI — mostrar modal de progreso ──────────────────────────────
  // Impedir cierre accidental mientras se sube el PDF
  _setModalBlocking(true);
  _setModalProgress(0, 'Preparando informe...');
  document.getElementById('modal-title-txt').textContent='Generando PDF...';
  document.getElementById('modal-sub-txt').textContent='Comprimiendo fotos y preparando informe técnico';
  document.getElementById('modal-id-txt').textContent=`ID: ${p.id}`;
  document.getElementById('modal-ico-wrap').innerHTML=`<div style="width:44px;height:44px;border:3px solid rgba(37,99,235,.2);border-top-color:var(--acc);border-radius:50%;animation:spin .7s linear infinite"></div>`;
  document.getElementById('modal-close-btn').style.display='none';
  document.getElementById('modal-pdf-btn').style.display='none';
  document.getElementById('modal-success').classList.add('open');

  const _beforeUnload = (e)=>{ e.preventDefault(); e.returnValue=''; };
  window.addEventListener('beforeunload', _beforeUnload);

  try{
    // ── 1. Comprimir fotos ─────────────────────────────────────────────────
    const rawPhotos = dbGetPhotosForPeritaje(p.id);
    const totalFotos = rawPhotos.length;
    const compressedPhotos = [];
    for(let i=0;i<rawPhotos.length;i++){
      _setModalProgress(Math.round((i/Math.max(totalFotos,1))*40), `Comprimiendo foto ${i+1} de ${totalFotos}...`);
      const cData = await _compressPhoto(rawPhotos[i].data);
      compressedPhotos.push({...rawPhotos[i], data: cData});
    }
    if(totalFotos>0) window._adminPhotosCache = compressedPhotos;

    // ── 2. Generar PDF ─────────────────────────────────────────────────────
    _setModalProgress(50, 'Generando PDF...');
    window._adminPdfId = p.id;
    const pdfBase64 = await generatePDF(p, {returnBase64:true});
    window._adminPdfId = null;
    window._adminPhotosCache = null;

    const filename = `Servicio_${p.id}_${(p.vehicle.plate||'SIN-PLACA').toUpperCase()}.pdf`;

    // ── 3. Subir a Drive ───────────────────────────────────────────────────
    _setModalProgress(70, 'Enviando informe al administrador...');
    document.getElementById('modal-sub-txt').textContent='Subiendo informe a Google Drive...';
    const uploadResult = await pdfQueueUpload(p.id, pdfBase64, filename);

    if(uploadResult.ok){
      // ── Éxito ────────────────────────────────────────────────────────────
      _setModalProgress(100, '¡Informe enviado correctamente!');
      document.getElementById('modal-ico-wrap').innerHTML=`<svg width="44" height="44" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#22c55e" stroke-width="1.5"/><path d="M8 12l3 3 5-5" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      document.getElementById('modal-title-txt').textContent='¡Servicio Finalizado!';
      document.getElementById('modal-sub-txt').textContent=`PDF enviado al administrador · Placa: ${p.vehicle.plate||'N/A'}`;
      _setModalBlocking(false);
      document.getElementById('modal-close-btn').style.display='';
      clearTimeout(window._autoRedirect);
      window._autoRedirect = setTimeout(()=>{
        closeModal(); refreshTechView();
        showPage('mis-peritajes', document.querySelector('[data-page=mis-peritajes]'));
      }, 5000);

    } else {
      // ── Fallo Drive: informar al técnico y descargar PDF automáticamente ──
      _setModalBlocking(false);
      window.removeEventListener('beforeunload', _beforeUnload);

      document.getElementById('modal-progress-wrap').style.display='none';
      document.getElementById('modal-ico-wrap').innerHTML=`<svg width="44" height="44" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#D97706" stroke-width="1.5"/><path d="M12 9v4M12 17h.01" stroke="#D97706" stroke-width="2" stroke-linecap="round"/></svg>`;
      document.getElementById('modal-title-txt').textContent='Error al enviar — PDF descargado';
      document.getElementById('modal-sub-txt').textContent='No se pudo subir a Drive. El PDF fue descargado en tu dispositivo. Entrégalo al administrador por WhatsApp o correo.';
      document.getElementById('modal-close-btn').style.display='';

      // Descargar PDF — método compatible iOS/Android/Desktop
      _downloadPdfCrossPlatform(pdfBase64, filename);

      // Notificar al admin en la app
      _notifyAllAdmins('info',
        'PDF no llegó a Drive',
        `Error Drive para ${p.id} (${p.vehicle.plate||'S/N'}). El técnico ${p.inspection.technician||'—'} tiene el PDF descargado en su dispositivo. Solicíteselo.`,
        { serviceId: p.id }
      );
    }

  }catch(e){
    console.error('[finalizarPeritaje] error:', e);
    _setModalProgress(0,'');
    document.getElementById('modal-progress-wrap').style.display='none';
    document.getElementById('modal-ico-wrap').innerHTML=`<svg width="44" height="44" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#EF4444" stroke-width="1.5"/><path d="M12 8v4M12 16h.01" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/></svg>`;
    document.getElementById('modal-title-txt').textContent='Error al procesar';
    document.getElementById('modal-sub-txt').textContent='Ocurrió un error. El servicio está guardado en la base de datos. Contacte al administrador.';
    _setModalBlocking(false);
    document.getElementById('modal-close-btn').style.display='';
  } finally {
    window.removeEventListener('beforeunload', _beforeUnload);
  }
}


function _downloadPdfCrossPlatform(pdfBase64, filename){
  try{
    // Extraer bytes puros (quitar prefijo data URI si existe)
    const base64 = pdfBase64.indexOf(',') >= 0 ? pdfBase64.split(',')[1] : pdfBase64;

    // Convertir base64 → Uint8Array → Blob
    const binary = atob(base64);
    const bytes  = new Uint8Array(binary.length);
    for(let i=0; i<binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'application/pdf' });

    // Detectar iOS (Safari no soporta download en <a> ni Blob URL directo)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if(isIOS){
      // iOS: usar FileReader para obtener data URI y abrir en nueva pestaña
      // El usuario verá el PDF en el visor nativo y puede guardarlo con el botón Share
      const reader = new FileReader();
      reader.onloadend = function(){
        const dataUrl = reader.result;
        // Abrir en nueva ventana — Safari lo abre en el visor de PDF integrado
        const w = window.open('', '_blank');
        if(w){
          w.document.write(
            `<html><head><title>${filename}</title></head>` +
            `<body style="margin:0;background:#000">` +
            `<iframe src="${dataUrl}" style="width:100%;height:100vh;border:none"></iframe>` +
            `</body></html>`
          );
          w.document.close();
        } else {
          // Popup bloqueado: fallback con link visible en el modal
          _showPdfFallbackLink(dataUrl, filename);
        }
      };
      reader.readAsDataURL(blob);
    } else {
      // Android / Desktop: Blob URL + click en <a download>
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(()=>{ URL.revokeObjectURL(url); document.body.removeChild(link); }, 3000);
    }
  }catch(err){
    console.error('[Download] error:', err);
    // Último recurso: mostrar data URI directamente
    try{
      const w = window.open(pdfBase64, '_blank');
      if(!w) _showPdfFallbackLink(pdfBase64, filename);
    }catch(e2){}
  }
}

// ── Fallback: mostrar link en el modal si todo falla ─────────────────────────
function _showPdfFallbackLink(dataUrl, filename){
  const sub = document.getElementById('modal-sub-txt');
  if(sub){
    sub.innerHTML = `No se pudo abrir automáticamente. ` +
      `<a href="${dataUrl}" download="${filename}" target="_blank" ` +
      `style="color:#2563EB;font-weight:700;text-decoration:underline">` +
      `Toca aquí para abrir el PDF</a> y guárdalo con el botón Compartir.`;
  }
}

// ── Bloqueo de modal ─────────────────────────────────────────────────────────
function _setModalBlocking(block){
  const ov = document.getElementById('modal-success');
  if(block){
    ov.style.pointerEvents='all';
    // Deshabilitar click fuera para cerrar
    ov._blockClose = true;
  } else {
    ov.style.pointerEvents='auto';
    ov._blockClose = false;
  }
}

// ── Barra de progreso del modal ──────────────────────────────────────────────
function _setModalProgress(pct, label){
  const wrap = document.getElementById('modal-progress-wrap');
  const bar  = document.getElementById('modal-progress-bar');
  const lbl  = document.getElementById('modal-progress-label');
  if(!wrap) return;
  wrap.style.display = pct>=0 ? '' : 'none';
  if(bar) bar.style.width = pct + '%';
  if(lbl) lbl.textContent = label || '';
}

// ===================== PAGE NAV =====================
function showPage(name,el){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.sb-item').forEach(i=>i.classList.remove('active'));
  const pg=document.getElementById('page-'+name);
  if(pg) pg.classList.add('active');
  if(el) el.classList.add('active');
  const labels={dashboard:'Panel Principal',peritaje:'Nuevo Servicio','mis-peritajes':'Mis Servicios','mi-historial':'Mi Historial',atender:'Atender Servicio','tipos-servicio':'Tipos de Servicio','categorias':'Categorías','usuarios':'Gestión de Usuarios'};
  document.getElementById('tb-current').textContent=labels[name]||name;
  document.getElementById('sidebar').classList.remove('open');
  if(name==='peritaje' && typeof clearOwnerFields==='function') clearOwnerFields();
}

// ===================== BRAND SELECTOR =====================
function buildBrandSelector(){
  const c=document.getElementById('brand-sel-container');
  if(!c) return;
  c.innerHTML=Object.entries(ALL_BRANDS).map(([name,info])=>
    `<button class="brand-btn" onclick="selectBrand('${name}',this)">
      <div class="brand-logo-ico" style="background:rgba(29,111,232,.12);color:var(--blue-inst);border:1px solid var(--blue-inst-border);font-size:9px;letter-spacing:.05em">${info.code}</div>${name}
    </button>`
  ).join('');
}

function selectBrand(brand,btn){
  selectedBrand=brand;
  document.querySelectorAll('.brand-btn').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
  // f-modelo is now a free-text input — just focus it so user can type the line
  const inp=document.getElementById('f-modelo');
  if(inp&&!inp.value) inp.focus();
}

// ===================== STEPS (ADMIN FORM) =====================
function genPertID(){
  const now=new Date();
  const id=`VWM-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(Math.floor(Math.random()*900)+100)}`;
  document.getElementById('pert-id-display').textContent=id;
  window._pertID=id;
}

function goStep(n,validate=true){
  if(validate&&n>currentStep){if(!validateStep(currentStep)) return;const sn=document.querySelector(`#snode-${currentStep}`);if(sn) sn.classList.add('done');}
  document.querySelectorAll('.form-step').forEach(s=>s.classList.remove('active'));
  document.getElementById(`fstep-${n}`).classList.add('active');
  document.querySelectorAll('[id^="snode-"]').forEach(nd=>{nd.classList.remove('active');const s=parseInt(nd.id.split('-')[1]);if(s<n)nd.classList.add('done');else nd.classList.remove('done');});
  document.getElementById(`snode-${n}`).classList.add('active');
  document.getElementById(`snode-${n}`).classList.remove('done');
  currentStep=n;
  if(n===3){
    buildTipoSelector();populateTecnicoSelect();
    // Always reset submit button when entering step 3
    const sb=document.querySelector('.btn-submit-f');
    if(sb){sb.disabled=false;sb.textContent='REGISTRAR SERVICIO';}
  }
  document.getElementById('content').scrollTo({top:0,behavior:'smooth'});
}

function validateStep(s){
  const required={
    1:[['f-nombre','Nombres'],['f-apellido','Apellidos'],['f-doctype','Tipo de documento'],['f-docnum','Número de documento'],['f-tel','Teléfono'],['f-email','Correo']],
    2:[['f-placa','Placa'],['f-anio','Año'],['f-combust','Combustible'],['f-km','Kilometraje'],['f-motivo','Motivo de ingreso']],
    3:[['f-tipo-servicio','Tipo de servicio'],['f-tecnico','Técnico asignado']]
  };
  for(const [id,lbl] of(required[s]||[])){const el=document.getElementById(id);if(!el||!el.value.trim()){showToast(`Complete el campo: ${lbl}`,'err');el&&el.focus();return false;}}
  if(s===2&&!selectedBrand){showToast('Seleccione una marca de vehículo','err');return false;}
  return true;
}

// ===================== STEP 3 DYNAMIC =====================
function buildTipoSelector(){
  const tipos=getTipos().filter(t=>t.activo!==false);
  const wrap=document.getElementById('tipo-servicio-selector');
  const hidden=document.getElementById('f-tipo-servicio');
  if(!wrap) return;
  if(!tipos.length){
    wrap.innerHTML=`<div class="tipo-card-empty">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      No hay tipos de servicio activos — ve a <strong style="color:var(--blue-inst);cursor:pointer;margin-left:4px" onclick="showPage('tipos-servicio',document.querySelector('[data-page=tipos-servicio]'));renderTiposServicio()">Tipos de Servicio</strong> para crear uno.
    </div>`;
    if(hidden) hidden.value='';
    return;
  }
  wrap.innerHTML=tipos.map(t=>`
    <div class="tipo-card" id="tipo-card-${t.id}" onclick="selectTipoServicio('${t.id}')">
      <div class="tipo-card-ico">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 12h6M9 16h6M9 8h6M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke="var(--blue-inst)" stroke-width="1.5" stroke-linecap="round"/></svg>
      </div>
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--t1);line-height:1.2">${t.nombre}</div>
        ${t.descripcion?`<div style="font-size:11px;color:var(--t3);margin-top:2px">${t.descripcion}</div>`:''}
      </div>
    </div>`).join('');
  if(hidden) hidden.value='';
  document.getElementById('cats-preview-wrap').style.display='none';
}

function selectTipoServicio(id){
  const hidden=document.getElementById('f-tipo-servicio');
  if(hidden) hidden.value=id;
  document.querySelectorAll('.tipo-card').forEach(c=>c.classList.toggle('selected',c.id===`tipo-card-${id}`));
  renderCatPreview(id);
}

function renderCatPreview(tipoId){
  const cats=getCats().filter(c=>c.tipoId===tipoId);
  const wrap=document.getElementById('cats-preview-wrap');
  const grid=document.getElementById('cats-preview-grid');
  if(!wrap||!grid){return;}
  if(!cats.length){wrap.style.display='none';return;}
  wrap.style.display='block';
  grid.innerHTML=cats.map(cat=>`
    <div class="cat-preview-card">
      <div class="cat-preview-hdr">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h7" stroke="var(--blue-inst)" stroke-width="2" stroke-linecap="round"/></svg>
        ${cat.nombre}
      </div>
      <div class="cat-preview-items">
        ${(cat.items||[]).length
          ? cat.items.map(item=>`<div class="cat-preview-item">${item}</div>`).join('')
          : '<div style="font-size:11px;color:var(--t3);padding:4px 0">Sin ítems definidos</div>'}
      </div>
    </div>`).join('');
}

function populateTecnicoSelect(){
  const sel=document.getElementById('f-tecnico');
  if(!sel) return;
  const techs=_localUsers.filter(u=>u.role==='tech'&&u.active!==false);
  sel.innerHTML='<option value="">Seleccionar técnico...</option>';
  if(techs.length){
    techs.forEach(u=>{
      const o=document.createElement('option');
      // value = "uid|nombre" — allows extracting both uid and display name
      o.value=(u.uid||'')+'|'+(u.techName||u.name);
      o.textContent=u.name+(u.city?` · ${u.city}`:'');
      sel.appendChild(o);
    });
  } else {
    const o=document.createElement('option');
    o.value='';o.textContent='Sin técnicos activos en el sistema';o.disabled=true;
    sel.appendChild(o);
  }
}

// ===================== INSPECTION GRID =====================
// Builds the tech inspection grid dynamically from the service's categories in Firebase
function buildTechInspGridDynamic(p, _attempt){
  const grid = document.getElementById('tech-insp-grid');
  if(!grid) return;

  const tipoId = p.inspection?.tipoServicio || '';
  const cats = getCats().filter(cat => cat.tipoId === tipoId && (cat.items||[]).length > 0);

  // Si las cats aún no han llegado de Firebase, reintenta hasta 8 veces (4 segundos)
  if(!cats.length && (_attempt||0) < 8){
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:28px 20px;color:var(--t3)">
      <div style="font-size:13px">Cargando categorías...</div>
    </div>`;
    setTimeout(() => buildTechInspGridDynamic(p, (_attempt||0)+1), 500);
    return;
  }

  grid.innerHTML = '';

  if(!cats.length){
    const tipo = getTipos().find(t => t.id === tipoId);
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:32px 20px;color:var(--t3)">
      <div style="font-size:13px;margin-bottom:6px">No hay categorías definidas para el tipo <strong>${tipo?.nombre||tipoId||'desconocido'}</strong>.</div>
      <div style="font-size:12px">El administrador debe configurar las categorías en el módulo correspondiente.</div>
    </div>`;
    return;
  }

  grid.innerHTML = cats.map((cat, ci) => {
    const items = cat.items || [];
    return `<div class="insp-block">
      <div class="insp-blk-hdr">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 12h6M9 16h6M9 8h6M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        ${cat.nombre}
      </div>
      ${items.map((item, ii) => {
        const key = `cat${ci}_i${ii}`;
        const prev = techRatingMap[key];
        const mkBtn = (val, lbl, cls) =>
          `<button type="button" class="r-btn${prev===val?' '+cls:''}" data-key="${key}" data-val="${val}" onclick="setTechRating('${key}','${val}',this)">${lbl}</button>`;
        return `<div class="insp-item">
          <div class="insp-item-row">
            <label>${item}</label>
            <div class="r-group">
              ${mkBtn('Bueno','B','sel-ok')}
              ${mkBtn('Regular','R','sel-reg')}
              ${mkBtn('Malo','M','sel-bad')}
              ${mkBtn('N/A','N/A','sel-na')}
            </div>
          </div>
          <div class="photo-area">
            <label class="photo-upload-btn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Adjuntar fotos
              <input type="file" accept="image/*" multiple onchange="handlePhotos('${key}',this,true)"/>
            </label>
            <div class="photo-thumbs" id="tech-thumbs-${key}"></div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }).join('');

  // Also store cat metadata for PDF generation
  window._currentInspCats = cats;
}

// Legacy static grid builder (used for admin preview only now)
function buildInspGrid(adminGridId, techGridId){
  [adminGridId, techGridId].forEach(gridId=>{
    const grid=document.getElementById(gridId);
    if(!grid||grid.children.length>0) return;
    const isTech=gridId===techGridId;
    grid.innerHTML=INSP_BLOCKS.map((blk,bi)=>`
      <div class="insp-block">
        <div class="insp-blk-hdr"><svg width="18" height="18" viewBox="0 0 24 24" fill="none">${blk.icon}</svg>${blk.label}</div>
        ${blk.items.map((item,ii)=>{
          const key=`b${bi}_i${ii}`;
          const pfx=isTech?'tech-':'adm-';
          return `<div class="insp-item">
            <div class="insp-item-row">
              <label>${item}</label>
              <div class="r-group">
                <button type="button" class="r-btn" data-key="${key}" data-val="Bueno" onclick="${isTech?`setTechRating`:`setRating`}('${key}','Bueno',this)">B</button>
                <button type="button" class="r-btn" data-key="${key}" data-val="Regular" onclick="${isTech?`setTechRating`:`setRating`}('${key}','Regular',this)">R</button>
                <button type="button" class="r-btn" data-key="${key}" data-val="Malo" onclick="${isTech?`setTechRating`:`setRating`}('${key}','Malo',this)">M</button>
                <button type="button" class="r-btn" data-key="${key}" data-val="N/A" onclick="${isTech?`setTechRating`:`setRating`}('${key}','N/A',this)">N/A</button>
              </div>
            </div>
            <div class="photo-area">
              <label class="photo-upload-btn">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Adjuntar fotos
                <input type="file" accept="image/*" multiple onchange="handlePhotos('${key}',this,${isTech})"/>
              </label>
              <div class="photo-thumbs" id="${pfx}thumbs-${key}"></div>
            </div>
          </div>`;
        }).join('')}
      </div>`).join('');
  });
}

function handlePhotos(key,input,isTech=false){
  const map=isTech?techPhotoMap:photoMap;
  const pfx=isTech?'tech-':'adm-';
  const files=Array.from(input.files);
  if(!map[key]) map[key]=[];
  let done=0;
  files.forEach(f=>{
    const reader=new FileReader();
    reader.onload=e=>{map[key].push(e.target.result);renderThumbs(key,isTech);done++;if(done===files.length) showToast(`${files.length} foto${files.length>1?'s':''} adjuntada${files.length>1?'s':''}`, 'ok');};
    reader.readAsDataURL(f);
  });
  input.value='';
}

function renderThumbs(key,isTech=false){
  const map=isTech?techPhotoMap:photoMap;
  const pfx=isTech?'tech-':'adm-';
  const c=document.getElementById(`${pfx}thumbs-${key}`);
  if(!c) return;
  const photos=map[key]||[];
  c.innerHTML=photos.map((src,idx)=>`
    <div class="photo-thumb" onclick="openLightbox('${src}')">
      <img src="${src}" alt="foto"/>
      <button class="photo-thumb-del" onclick="event.stopPropagation();removePhoto('${key}',${idx},${isTech})" title="Eliminar">&#x2715;</button>
    </div>`).join('');
}

function removePhoto(key,idx,isTech=false){
  const map=isTech?techPhotoMap:photoMap;
  if(map[key]) map[key].splice(idx,1);
  renderThumbs(key,isTech);
}

function openLightbox(src){document.getElementById('lightbox-img').src=src;document.getElementById('lightbox').classList.add('open');}

function setRating(key,val,btn){
  ratingMap[key]=val;
  btn.closest('.r-group').querySelectorAll('.r-btn').forEach(b=>b.classList.remove('sel-ok','sel-reg','sel-bad','sel-na'));
  btn.classList.add({Bueno:'sel-ok',Regular:'sel-reg',Malo:'sel-bad','N/A':'sel-na'}[val]||'');
}

function setTechRating(key,val,btn){
  techRatingMap[key]=val;
  btn.closest('.r-group').querySelectorAll('.r-btn').forEach(b=>b.classList.remove('sel-ok','sel-reg','sel-bad','sel-na'));
  btn.classList.add({Bueno:'sel-ok',Regular:'sel-reg',Malo:'sel-bad','N/A':'sel-na'}[val]||'');
  updateTechScore();
}

function updateTechScore(){
  // Solo contar ítems con valor real (excluir N/A y no evaluados)
  const realVals = Object.values(techRatingMap).filter(v => v && v !== 'N/A');
  const rated    = realVals.length;
  const good     = realVals.filter(v => v === 'Bueno').length;
  const reg      = realVals.filter(v => v === 'Regular').length;
  const bad      = realVals.filter(v => v === 'Malo').length;
  // Promedio ponderado: Bueno=100, Regular=50, Malo=0
  const pct = rated > 0 ? Math.round(((good*100 + reg*50 + bad*0) / (rated*100)) * 100) : 0;

  const fill = document.getElementById('tech-score-fill');
  if(fill){
    fill.style.width = pct + '%';
    fill.style.background = pct>=80
      ? 'linear-gradient(90deg,#16a34a,#22c55e)'
      : pct>=50
        ? 'linear-gradient(90deg,#d97706,#f97316)'
        : 'linear-gradient(90deg,#1558C4,#1D6FE8)';
  }
  // Mostrar solo el porcentaje, sin el contador N/N
  const num = document.getElementById('tech-score-num');
  if(num) num.textContent = rated === 0 ? '—' : `${pct}%`;
  const grade = document.getElementById('tech-score-grade');
  if(grade) grade.textContent = rated===0
    ? 'Pendiente de evaluación'
    : pct>=85 ? 'Excelente condición'
    : pct>=70 ? 'Buena condición — apta para uso'
    : pct>=50 ? 'Condición aceptable — requiere atención'
    : 'Requiere intervención urgente';
}

// ===================== ADMIN SUBMIT =====================
async function submitPeritaje(){
  if(!validateStep(3)) return;
  const id=window._pertID;
  const payload={
    id,
    createdAt:new Date().toISOString(),
    owner:{
      name:    document.getElementById('f-nombre').value.trim()+' '+document.getElementById('f-apellido').value.trim(),
      firstName: document.getElementById('f-nombre').value.trim(),
      lastName:  document.getElementById('f-apellido').value.trim(),
      doc:     document.getElementById('f-docnum').value.trim(),
      docType: document.getElementById('f-doctype').value,
      tel:     document.getElementById('f-tel').value.trim(),
      email:   document.getElementById('f-email').value.trim(),
      address: document.getElementById('f-dir').value.trim(),
      city:    document.getElementById('f-ciudad').value.trim(),
      depto:   document.getElementById('f-depto').value.trim()
    },
    vehicle:{brand:selectedBrand,model:document.getElementById('f-modelo').value,year:document.getElementById('f-anio').value,plate:document.getElementById('f-placa').value,vin:document.getElementById('f-vin').value,motor:document.getElementById('f-motor').value,color:document.getElementById('f-color').value.trim(),fuel:document.getElementById('f-combust').value,transmission:document.getElementById('f-trans').value,km:document.getElementById('f-km').value,reason:document.getElementById('f-motivo').value.trim()},
    inspection:(()=>{
      const tv=document.getElementById('f-tecnico').value;
      let [techUid,techName]=tv.includes('|')?tv.split('|'):['' ,tv];
      if(!techUid && techName){
        const found=_localUsers.find(u=>u.name===techName||u.techName===techName);
        if(found && found.uid){ techUid=found.uid; }
      }
      return {technician:techName,technicianId:techUid,adminId:currentUser.uid||'',tipoServicio:document.getElementById('f-tipo-servicio')?.value||'',date:document.getElementById('f-fecha').value,time:document.getElementById('f-hora').value,status:'Recibido',priority:document.getElementById('f-prioridad').value,ratings:{},observations:document.getElementById('f-obs').value.trim(),accessories:document.getElementById('f-acces').value.trim(),sigOwner:'',sigTech:''};
    })()
  };
  const submitBtn=document.querySelector('.btn-submit-f');
  if(submitBtn){submitBtn.disabled=true;submitBtn.textContent='Registrando...';}
  try{
    await dbSavePeritaje(payload);
    for(const [key,photos] of Object.entries(photoMap)){if(photos.length>0) await dbSavePhotos(id,key,photos);}
    lastPayload=payload;
    // Guardar propietario y vehículo en colecciones relacionales
    await _saveOwnerAndVehicle(payload);
    // Notificar al técnico asignado
    _notifyTechOnAssign(payload);
    document.getElementById('modal-title-txt').textContent='Registrado';
    document.getElementById('modal-sub-txt').textContent=`Servicio asignado a ${payload.inspection.technician} · Placa: ${payload.vehicle.plate||'N/A'}`;
    document.getElementById('modal-id-txt').textContent=`ID: ${id} · Estado: Recibido`;
    const pdfBtnRec=document.getElementById('modal-pdf-btn');
    if(pdfBtnRec) pdfBtnRec.style.display='none';
    document.getElementById('modal-success').classList.add('open');
    refreshDashboard();
    clearTimeout(window._autoRedirect);
    window._autoRedirect=setTimeout(()=>{closeModalAndReset();},4500);
  }catch(err){
    console.error('[submitPeritaje]',err);
    showToast('Error al guardar: '+err.message,'err');
  }finally{
    // Siempre restaurar el botón — sin importar si hubo error o éxito
    if(submitBtn){submitBtn.disabled=false;submitBtn.textContent='REGISTRAR SERVICIO';}
  }
}

// ===================== PDF =====================
async function downloadPDF(){
  // Solo admin puede descargar PDF
  if(currentUser && currentUser.role==='admin' && lastPayload)
    await generatePDF(lastPayload);
}
async function downloadPDFById(id){
  const p=localPeritajes.find(x=>x.id===id);
  if(!p) return;

  if(currentUser.role==='admin'){
    // ── ADMIN: descarga desde pdf_queue via <a> (no window.open — bloqueado por browser) ──
    showToast('Obteniendo PDF...','ok');
    const queued = await pdfQueueGet(id);
    if(queued && queued.downloadUrl){
      // Usar <a> con click — no se bloquea como popup
      const a = document.createElement('a');
      a.href = queued.downloadUrl;
      a.download = `Servicio_${p.id}_${(p.vehicle.plate||'SIN-PLACA').toUpperCase()}.pdf`;
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      // Pequeña espera para asegurar que el click se procesó
      await new Promise(r => setTimeout(r, 800));
      document.body.removeChild(a);
      showToast('PDF descargado · Eliminando de la cola...','ok');
      // Borrar DESPUÉS de confirmar que el link se clickeó
      pdfQueueDelete(id, queued.fileId);
      document.getElementById('modal-detail')?.classList.remove('open');
    } else if(p.inspection.status==='Finalizado'){
      showToast('PDF ya descargado anteriormente — no disponible','err');
      document.getElementById('modal-detail')?.classList.remove('open');
    } else {
      showToast('El PDF estará disponible cuando el técnico finalice','err');
      document.getElementById('modal-detail')?.classList.remove('open');
    }
    return;
  }

  // Técnico no tiene acceso al PDF
  showToast('El PDF lo descarga el administrador del sistema','err');
  document.getElementById('modal-detail')?.classList.remove('open');
}


async function downloadPDFSinFotos(id){
  const p = localPeritajes.find(x => x.id === id);
  if(!p) return;
  showToast("Generando PDF sin fotos...", "ok");
  try {
    await generatePDF(p, {returnBase64: false, skipPhotos: true});
  } catch(err) {
    showToast("Error al generar PDF: " + err.message, "err");
  }
}
async function generatePDF(p, opts={}){
  const { returnBase64=false, skipPhotos=false } = opts;
  showToast('Generando PDF...','ok');

  // Imágenes embebidas como base64 (sin dependencias externas, sin CORS)
  window._pdfLogoB64='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAxEAAAGQCAYAAADWoMDcAAEAAElEQVR4nO' + 'ydd5wcZfX/P3f6zO5sTTYdEkIggDRpFr4CAsoPpNlQRL9IUb40iTSxg1K/iIBfQVBAQJSO9CIIEUILPaSXTbK9Tb+9nN8fs+fJM7Ob7IZsQoDnndd9ZXZ29s6tzz3nOed8DqBQKBQKhUKhUCgUCoVCoVAoFAqFQqFQKBQKhUKhUCgUCoVCoVAoFAqFQqFQKBQKhUKhUCgUCoVCoVAoFAqFQqFQKBQKhUKhUCgUCoVCoVAoFAqFQqFQKBQKhUKhUCgUCoVCoVAoFAqFQqFQKBQKhUKhUCgU';

  (function(){var imgs=document.querySelectorAll('[id^="hero-logo-"],[id="sb-logo-img"],[id="login-logo-img"]');for(var i=0;i<imgs.length;i++){imgs[i].src=window._pdfLogoB64;}})();

  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
  const W=210,H=297,mL=14,mR=196,cW=W-mL*2;

  // ── PDF palette ──────────────────────────────────────────────────────
  const BG      = [249,250,251];
  const WHITE   = [255,255,255];
  const BLACK   = [15,17,23];
  const GRAY    = [75,85,99];
  const LGRAY   = [229,231,235];
  const MGRAY   = [156,163,175];
  const ACC     = [37,99,235];
  const ACC_L   = [219,234,254];
  const DARK    = [15,23,42];
  const GREEN_C = [22,163,74];
  const GREEN_L = [220,252,231];
  const ORANGE_C= [217,119,6];
  const ORANGE_L= [254,243,199];
  const RED_C   = [220,38,38];
  const RED_L   = [254,226,226];

  const rr=(x,y,w,h,r,style)=>{
    if(!r||r<=0||w<=0||h<=0){doc.rect(x,y,w,h,style);return;}
    doc.roundedRect(x,y,w,h,r,r,style);
  };

  const drawGradientStripe=(y0,h)=>{
    const steps=40;const sw=W/steps;
    for(let i=0;i<steps;i++){
      const t=i/(steps-1);
      let r,g,b;
      if(t<0.5){const u=t/0.5;r=Math.round(30+u*(37-30));g=Math.round(64+u*(99-64));b=Math.round(175+u*(235-175));}
      else{const u=(t-0.5)/0.5;r=Math.round(37+u*(59-37));g=Math.round(99+u*(130-99));b=Math.round(235+u*(246-235));}
      doc.setFillColor(r,g,b);doc.rect(i*sw,y0,sw+0.5,h,'F');
    }
  };

  const drawHeader=()=>{
    doc.setFillColor(...BG);doc.rect(0,0,W,H,'F');
    doc.setFillColor(...DARK);doc.rect(0,0,W,44,'F');
    if(window._pdfLogoB64){
      try{doc.addImage(window._pdfLogoB64,'PNG',mL,7,56,22);}catch(e){
        doc.setFont('helvetica','bold');doc.setFontSize(18);doc.setTextColor(...WHITE);doc.text('VOLKSWMAZDA',mL,21);
      }
    } else {
      doc.setFont('helvetica','bold');doc.setFontSize(18);doc.setTextColor(...WHITE);doc.text('VOLKSWMAZDA',mL,21);
    }
    doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.setTextColor(...MGRAY);
    doc.setCharSpace(1.4);doc.text('CENTRO DE SERVICIO ESPECIALIZADO',mL,33);doc.setCharSpace(0);
    doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(...WHITE);
    doc.text(p.id,mR,17,'right');
    const dt=new Date(p.createdAt).toLocaleDateString('es-CO',{day:'2-digit',month:'2-digit',year:'numeric'});
    doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(...MGRAY);
    doc.text(dt,mR,25,'right');
    drawGradientStripe(44,4);
    doc.setFillColor(...ACC);doc.rect(0,48,W,20,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(10.5);doc.setTextColor(...WHITE);
    doc.text('INFORME DE SERVICIO TÉCNICO',mL,59);
    const techFull='TÉCNICO: '+(p.inspection.technician||'').toUpperCase();
    doc.setFontSize(7.5);doc.setTextColor(200,200,200);
    doc.text(techFull,mR,64,'right');
  };

  const addMiniHeader=()=>{
    doc.setFillColor(...DARK);doc.rect(0,0,W,14,'F');
    drawGradientStripe(12,2);
    doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(...WHITE);doc.text('VOLKSWMAZDA',mL,9);
    doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(200,200,200);doc.text(p.id,mR,9,'right');
  };

  const drawFooter=(pg,total)=>{
    doc.setFillColor(245,245,245);doc.rect(0,H-12,W,12,'F');
    doc.setDrawColor(...LGRAY);doc.setLineWidth(0.3);doc.line(0,H-12,W,H-12);
    doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(...GRAY);
    doc.text('VOLKSWMAZDA · Centro de Servicio Especializado · Tunja, Boyacá',mL,H-5);
    doc.text('Página '+pg+' de '+total,mR,H-5,'right');
  };

  let y=78;

  const checkPage=(needed=30)=>{
    if(y+needed>H-18){
      doc.addPage();doc.setFillColor(...BG);doc.rect(0,0,W,H,'F');
      addMiniHeader();y=22;
    }
  };

  // ── Título de sección — espaciado consistente y visual claro ─────────
  const sectionTitle=(title)=>{
    checkPage(20);
    y+=4; // espacio antes del título
    // Fondo azul claro de título completo
    doc.setFillColor(235,242,255);
    doc.setDrawColor(...LGRAY);doc.setLineWidth(0.25);
    rr(mL,y,cW,10,2,'FD');
    // Franja izquierda azul sólida
    doc.setFillColor(...ACC);
    doc.rect(mL,y,4,10,'F');
    // Texto
    doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(...ACC);
    doc.setCharSpace(1.2);doc.text(title.toUpperCase(),mL+8,y+7);doc.setCharSpace(0);
    y+=18; // espacio después del título
  };

  const infoGrid=(pairs)=>{
    const colW=cW/2-5;let col=0;
    pairs.forEach(([label,value])=>{
      if(!label&&!value){if(col!==0){col=0;y+=18;}return;}
      checkPage(20);
      const x=col===0?mL:mL+colW+10;
      // Fondo celda
      if(col===0){
        doc.setFillColor(252,252,253);
        doc.setDrawColor(...LGRAY);doc.setLineWidth(0.2);
        rr(mL,y-1,cW,16,2,'FD');
      }
      doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(...MGRAY);doc.setCharSpace(0.6);doc.text((label||'').toUpperCase(),x+2,y+5);doc.setCharSpace(0);
      doc.setFont('helvetica','bold');doc.setFontSize(9.5);doc.setTextColor(...BLACK);
      const lines=doc.splitTextToSize(String(value||'—'),colW-4);doc.text(lines[0],x+2,y+12);
      col++;if(col===2){col=0;y+=18;}
    });
    if(col!==0) y+=18;y+=4;
  };

  drawHeader();

  // ── PROPIETARIO ──────────────────────────────────────────────────────
  sectionTitle('Información del Propietario');
  infoGrid([
    ['Nombre completo',p.owner.name],
    ['Documento',(p.owner.docType||'')+' '+(p.owner.doc||'')||'—'],
    ['Teléfono',p.owner.tel||'—'],
    ['Correo electrónico',p.owner.email||'—'],
    ['Ciudad',p.owner.city||'—'],
    ['Dirección',p.owner.address||'—']
  ]);

  // ── VEHÍCULO ─────────────────────────────────────────────────────────
  sectionTitle('Información del Vehículo');
  infoGrid([
    ['Marca',p.vehicle.brand||'—'],['Modelo / Línea',p.vehicle.model||'—'],
    ['Año',p.vehicle.year||'—'],['Color',p.vehicle.color||'—'],
    ['Placa',p.vehicle.plate||'—'],['VIN',p.vehicle.vin||'—'],
    ['Nº de Motor',p.vehicle.motor||'—'],['Combustible',p.vehicle.fuel||'—'],
    ['Transmisión',p.vehicle.transmission||'—'],['Kilometraje',p.vehicle.km?Number(p.vehicle.km).toLocaleString('es-CO')+' km':'—'],
    ['Motivo de ingreso',p.vehicle.reason||'—'],['','']
  ]);

  // ── INSPECCIÓN META ──────────────────────────────────────────────────
  sectionTitle('Datos de la Inspección');
  infoGrid([
    ['Técnico asignado',p.inspection.technician||'—'],['Estado',p.inspection.status||'—'],
    ['Fecha de ingreso',p.inspection.date||'—'],['Hora de ingreso',p.inspection.time||'—'],
    ['Prioridad',p.inspection.priority||'—'],['','']
  ]);

  // ── EVALUACIÓN TÉCNICA ───────────────────────────────────────────────
  sectionTitle('Evaluación Técnica');

  const ratings=p.inspection.ratings||{};
  const tipoId=p.inspection?.tipoServicio||'';
  const pdfCats=_localCats.filter(cat=>cat.tipoId===tipoId&&(cat.items||[]).length>0);
  const allItems=[];
  pdfCats.forEach((cat,ci)=>(cat.items||[]).forEach((item,ii)=>{
    allItems.push({blk:cat.nombre,item,val:ratings['cat'+ci+'_i'+ii]||null});
  }));
  const good=allItems.filter(x=>x.val==='Bueno').length;
  const rated=allItems.filter(x=>x.val&&x.val!=='N/A').length;
  const pct=rated>0?Math.round((good/rated)*100):0;

  // ── SCORE CARD — dark card, donut limpio, sin adornos extra ─────────────
  checkPage(40);

  const scoreColor = pct>=80 ? GREEN_C : pct>=50 ? ORANGE_C : RED_C;
  const scoreLabel = pct>=80 ? 'Excelente condición' : pct>=50 ? 'Condición aceptable' : 'Requiere atención';
  const cardH=36;

  // Card clara (gris suave, no oscura)
  doc.setFillColor(241,245,249);
  doc.setDrawColor(226,232,240);doc.setLineWidth(0.3);
  rr(mL,y,cW,cardH,5,'FD');

  // ── Donut ────────────────────────────────────────────────────────────
  const R=13, ri=9;      // radio exterior e interior
  const cx=mL+20+R, cy=y+cardH/2;

  // Halo / sombra (clara)
  doc.setFillColor(226,232,240); doc.circle(cx,cy,R+2,'F');
  // Fondo del ring (gris claro)
  doc.setFillColor(203,213,225); doc.circle(cx,cy,R,'F');
  // Agujero interior (mismo que fondo de card)
  doc.setFillColor(241,245,249); doc.circle(cx,cy,ri,'F');
  // Progreso: anillo de color encima del ring, luego agujero de nuevo
  doc.setFillColor(...scoreColor); doc.circle(cx,cy,R,'F');
  doc.setFillColor(241,245,249);    doc.circle(cx,cy,ri,'F');
  // Si pct<100: tapa el arco no completado con el gris del ring
  if(pct<100){
    const angle=Math.PI*2*(pct/100); // ángulo de progreso en rad
    doc.setFillColor(203,213,225); doc.circle(cx,cy,R,'F');
    doc.setFillColor(241,245,249); doc.circle(cx,cy,ri,'F');
    // Sectores de color usando triángulos (aproximación para pct parcial)
    const steps=36;
    const filled=Math.round(steps*pct/100);
    doc.setFillColor(...scoreColor);
    for(let s=0;s<filled;s++){
      const a1=-Math.PI/2 + (Math.PI*2/steps)*s;
      const a2=-Math.PI/2 + (Math.PI*2/steps)*(s+1);
      const x1=cx+Math.cos(a1)*R, y1=cy+Math.sin(a1)*R;
      const x2=cx+Math.cos(a2)*R, y2=cy+Math.sin(a2)*R;
      doc.triangle(cx,cy,x1,y1,x2,y2,'F');
    }
    // Agujero interior otra vez
    doc.setFillColor(241,245,249); doc.circle(cx,cy,ri,'F');
    // Ring exterior fino decorativo
    doc.setDrawColor(203,213,225);doc.setLineWidth(0.3);doc.circle(cx,cy,R,'S');
  }

  // Número centrado — tamaño adaptado al nº de dígitos — texto oscuro para contraste
  const pctStr=pct+'%';
  const fSz=pct===100?9:pct>=10?10.5:12;
  doc.setFont('helvetica','bold');doc.setFontSize(fSz);doc.setTextColor(...scoreColor);
  doc.text(pctStr,cx,cy+fSz*0.195,'center');

  // ── Texto derecho del donut ───────────────────────────────────────────
  const tx=cx+R+9;

  doc.setFont('helvetica','bold');doc.setFontSize(12.5);doc.setTextColor(...scoreColor);
  doc.text(scoreLabel,tx,cy-1.5);

  doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(71,85,105);
  doc.text('Condición general del vehículo',tx,cy+6);

  doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(100,116,139);
  doc.text(rated+' ítem'+(rated!==1?'s':'')+' evaluado'+(rated!==1?'s':''),tx,cy+12.5);

  y+=cardH+10;

  // Items por categoría
  pdfCats.forEach((cat,ci)=>{
    const evalItems=(cat.items||[]).filter((_,ii)=>{const v=ratings['cat'+ci+'_i'+ii]||null;return v&&v!=='N/A';});
    if(!evalItems.length) return;
    checkPage(20+evalItems.length*8+4);
    // Encabezado de categoría — mayor padding interno
    doc.setFillColor(...ACC_L);doc.setDrawColor(...LGRAY);doc.setLineWidth(0.25);
    rr(mL,y,cW,11,2,'FD');
    doc.setFillColor(...ACC);doc.rect(mL,y,4,11,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.setTextColor(...ACC);
    doc.setCharSpace(0.5);doc.text(cat.nombre.toUpperCase(),mL+8,y+7.5);doc.setCharSpace(0);
    y+=14; // espacio después del header de categoría
    (cat.items||[]).forEach((item,ii)=>{
      const val=ratings['cat'+ci+'_i'+ii]||null;
      if(!val||val==='N/A') return;
      // Fila
      doc.setFillColor(evalItems.indexOf(item)%2===0?250:255,evalItems.indexOf(item)%2===0?250:255,evalItems.indexOf(item)%2===0?252:255);
      doc.rect(mL,y,cW,9,'F');
      doc.setDrawColor(...LGRAY);doc.setLineWidth(0.15);doc.line(mL,y+9,mR,y+9);
      doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(...GRAY);
      doc.text(item,mL+5,y+6.5);
      const vBg={Bueno:GREEN_L,Regular:ORANGE_L,Malo:RED_L}[val]||[240,240,240];
      const vCol={Bueno:GREEN_C,Regular:ORANGE_C,Malo:RED_C}[val]||[100,100,100];
      const pillTxt=val.toUpperCase();
      const pillW=doc.getTextWidth(pillTxt)+10;
      doc.setFillColor(...vBg);rr(mR-pillW,y+1.8,pillW,5.5,2.5,'F');
      doc.setFont('helvetica','bold');doc.setFontSize(7.5);doc.setTextColor(...vCol);
      doc.text(pillTxt,mR-pillW/2,y+6,'center');
      y+=9;
    });
    y+=8; // espacio entre categorías
  });

  // ── OBSERVACIONES ────────────────────────────────────────────────────
  const obs=p.inspection.techObservations||p.inspection.observations||'';
  if(obs){
    checkPage(36);
    sectionTitle('Observaciones del Técnico');
    const obsLines=doc.splitTextToSize(obs,cW-16);
    const obsH=Math.max(18,obsLines.length*6+16);
    doc.setFillColor(...WHITE);doc.setDrawColor(...LGRAY);doc.setLineWidth(0.35);
    rr(mL,y,cW,obsH,3,'FD');
    doc.setFillColor(...ACC);doc.rect(mL,y,4,obsH,'F');
    doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(55,65,81);
    obsLines.forEach((l,i)=>{doc.text(l,mL+9,y+10+i*6);});
    y+=obsH+10;
  }

  if(p.inspection.accessories){
    checkPage(28);
    sectionTitle('Accesorios / Objetos en el Vehículo');
    const accLines=doc.splitTextToSize(p.inspection.accessories,cW-8);
    doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(55,65,81);
    accLines.forEach((l,i)=>{doc.text(l,mL+4,y+i*6);});
    y+=accLines.length*6+12;
  }

  // ── FOTOS ─────────────────────────────────────────────────────────────
  const photos=dbGetPhotosForPeritaje(p.id);
  if(!skipPhotos && photos.length>0){
    const photoGroups={};
    photos.forEach(ph=>{if(!photoGroups[ph.key]) photoGroups[ph.key]=[];photoGroups[ph.key].push(ph.data);});
    const labelMap={};
    const photoCats=_localCats.filter(cat=>cat.tipoId===(p.inspection?.tipoServicio||'')&&(cat.items||[]).length>0);
    photoCats.forEach((cat,ci)=>(cat.items||[]).forEach((item,ii)=>{labelMap['cat'+ci+'_i'+ii]={blk:cat.nombre,item};}));
    checkPage(30);
    sectionTitle('Registro Fotográfico ('+photos.length+' foto'+(photos.length!==1?'s':'')+')');
    let curBlk='';
    const cols=2, gap=6;
    const imgW=Math.floor((cW - gap*(cols-1)) / cols);
    const imgH=Math.round(imgW * 0.72);
    for(const key of Object.keys(photoGroups).sort()){
      const grpPhotos=photoGroups[key];
      const info=labelMap[key]||{blk:'Fotos adjuntas',item:key};
      const neededForBlock = (info.blk!==curBlk ? 11 : 0) + 9 + imgH + 10;
      if(y + neededForBlock > H-18){
        doc.addPage();doc.setFillColor(...BG);doc.rect(0,0,W,H,'F');addMiniHeader();y=22;
        curBlk='';
      }
      if(info.blk!==curBlk){
        curBlk=info.blk;
        doc.setFillColor(...ACC_L);doc.setDrawColor(...LGRAY);doc.setLineWidth(0.25);
        rr(mL,y,cW,9,2,'FD');doc.setFillColor(...ACC);doc.rect(mL,y,4,9,'F');
        doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(...ACC);
        doc.setCharSpace(0.5);doc.text(curBlk.toUpperCase(),mL+8,y+6.2);doc.setCharSpace(0);y+=13;
      }
      if(y + 9 + imgH > H-18){
        doc.addPage();doc.setFillColor(...BG);doc.rect(0,0,W,H,'F');addMiniHeader();y=22;
        doc.setFillColor(...ACC_L);doc.setDrawColor(...LGRAY);doc.setLineWidth(0.25);
        rr(mL,y,cW,9,2,'FD');doc.setFillColor(...ACC);doc.rect(mL,y,4,9,'F');
        doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(...ACC);
        doc.setCharSpace(0.5);doc.text(curBlk.toUpperCase(),mL+8,y+6.2);doc.setCharSpace(0);y+=13;
      }
      doc.setFont('helvetica','italic');doc.setFontSize(8.5);doc.setTextColor(...GRAY);
      doc.text(info.item,mL+4,y+1.5);y+=9;
      for(let i=0;i<grpPhotos.length;i+=cols){
        const row=grpPhotos.slice(i,i+cols);
        if(y + imgH + 8 > H-18){
          doc.addPage();doc.setFillColor(...BG);doc.rect(0,0,W,H,'F');addMiniHeader();y=22;
        }
        row.forEach((data,ri)=>{
          const px=mL+ri*(imgW+gap);
          try{
            const imgProps=doc.getImageProperties(data);
            const srcW=imgProps.width||imgW, srcH=imgProps.height||imgH;
            const ratio=srcW/srcH;
            let dw,dh;
            if(ratio > imgW/imgH){ dw=imgW; dh=imgW/ratio; }
            else                 { dh=imgH; dw=imgH*ratio;  }
            const ox=(imgW-dw)/2, oy=(imgH-dh)/2;
            doc.setFillColor(255,255,255);
            doc.rect(px,y,imgW,imgH,'F');
            doc.addImage(data,'JPEG',px+ox,y+oy,dw,dh,'','MEDIUM');
            doc.setDrawColor(...LGRAY);doc.setLineWidth(0.3);doc.rect(px,y,imgW,imgH,'S');
          }catch(e){}
        });
        y+=imgH+6;
      }
      y+=8;
    }
  }

  // SELLO OFICIAL
  let selloData = '';
  try{
    const selloImgEl = document.getElementById('sello-preview');
    if(selloImgEl && selloImgEl.complete && selloImgEl.naturalWidth > 0){
      const tmpImg = new Image();
      tmpImg.crossOrigin = 'anonymous';
      await new Promise((res)=>{
        tmpImg.onload = res;
        tmpImg.onerror = res;
        tmpImg.src = selloImgEl.src + (selloImgEl.src.startsWith('data:') ? '' : '?t=' + Date.now());
        if(tmpImg.complete) res();
      });
      if(tmpImg.naturalWidth > 0){
        const sc = document.createElement('canvas');
        sc.width  = tmpImg.naturalWidth;
        sc.height = tmpImg.naturalHeight;
        sc.getContext('2d').drawImage(tmpImg, 0, 0);
        try{ selloData = sc.toDataURL('image/png'); }catch(e){}
      }
    }
    if(!selloData && selloImgEl && selloImgEl.src && selloImgEl.src.startsWith('data:')){
      selloData = selloImgEl.src;
    }
    if(!selloData){
      try{
        const resp = await fetch('firma.png');
        if(resp.ok){
          const blob = await resp.blob();
          selloData = await new Promise((res,rej)=>{
            const fr = new FileReader();
            fr.onload = ()=> res(fr.result);
            fr.onerror = rej;
            fr.readAsDataURL(blob);
          });
        }
      }catch(fe){}
    }
  }catch(e){}

  if(selloData && selloData.length > 100){
    if(y + 50 > H-18){ doc.addPage(); doc.setFillColor(...BG); doc.rect(0,0,W,H,'F'); addMiniHeader(); y=22; }
    y += 10;
    try{
      const imgProps = doc.getImageProperties(selloData);
      const sw = imgProps.width  || 1;
      const sh = imgProps.height || 1;
      const ratio = sw / sh;
      const maxSW = 70, maxSH = 40;
      let dw, dh;
      if(ratio > maxSW/maxSH){ dw = maxSW; dh = maxSW/ratio; }
      else                   { dh = maxSH; dw = maxSH*ratio;  }
      const cx = mL + (cW - dw) / 2;
      doc.addImage(selloData, 'PNG', cx, y, dw, dh);
      y += dh + 8;
    }catch(e){}
  }

  // FOOTERS
  const totalPages=doc.getNumberOfPages();
  for(let i=1;i<=totalPages;i++){doc.setPage(i);drawFooter(i,totalPages);}

  const filename = 'Servicio_'+p.id+'_'+(p.vehicle.plate||'SIN-PLACA').toUpperCase()+'.pdf';
  if(returnBase64){
    return doc.output('datauristring');
  }
  doc.save(filename);
  showToast('PDF descargado correctamente','ok');
}


// ===================== MODAL & RESET =====================
function closeModal(){document.getElementById('modal-success').classList.remove('open');}

function closeModalAndReset(){
  clearTimeout(window._autoRedirect);closeModal();
  // Reset admin form
  ratingMap={};photoMap={};selectedBrand='';
  document.querySelectorAll('#insp-grid .r-btn').forEach(b=>b.classList.remove('sel-ok','sel-reg','sel-bad','sel-na'));
  document.querySelectorAll('.brand-btn').forEach(b=>b.classList.remove('selected'));
  document.querySelectorAll('[id^="adm-thumbs-"]').forEach(c=>c.innerHTML='');
  ['f-nombre','f-apellido','f-docnum','f-tel','f-email','f-dir','f-placa','f-vin','f-motor','f-km','f-motivo','f-obs','f-acces','f-color','f-modelo'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  ['f-doctype','f-anio','f-combust','f-trans','f-tecnico','f-prioridad'].forEach(id=>{const el=document.getElementById(id);if(el)el.selectedIndex=0;});
  document.getElementById('f-ciudad').value='Tunja';document.getElementById('f-depto').value='Boyacá';
  // Reset tipo servicio
  const hidTipo=document.getElementById('f-tipo-servicio');if(hidTipo) hidTipo.value='';
  document.querySelectorAll('.tipo-card').forEach(c=>c.classList.remove('selected'));
  const catsWrap=document.getElementById('cats-preview-wrap');if(catsWrap) catsWrap.style.display='none';
  const now=new Date();
  document.getElementById('f-fecha').value=now.toISOString().split('T')[0];
  document.getElementById('f-hora').value=now.toTimeString().slice(0,5);
  genPertID();goStep(1,false);
  const sb=document.querySelector('.btn-submit-f');
  if(sb){sb.disabled=false;sb.textContent='REGISTRAR SERVICIO';}
  if(currentUser.role==='admin'){showPage('dashboard',document.querySelector('[data-page=dashboard]'));}
  else{showPage('mis-peritajes',document.querySelector('[data-page=mis-peritajes]'));refreshTechView();}
}

function showToast(msg,type='ok'){
  const t=document.getElementById('toast');t.textContent=msg;t.className=`toast ${type} show`;
  clearTimeout(t._tid);t._tid=setTimeout(()=>t.classList.remove('show'),3200);
}

// ===================== VIDEO =====================
window.addEventListener('load',()=>{
  const v=document.getElementById('bg-video');
  if(v){
    v.playbackRate=0.7;v.muted=true;
    v.play().catch(()=>{document.addEventListener('click',()=>v.play(),{once:true});});
    v.addEventListener('error',()=>{
      const wrap=v.closest('.login-video-wrap');
      if(wrap){wrap.style.background='#0a0a0f';const img=document.createElement('img');img.src='https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=1920&q=80&auto=format';img.style.cssText='width:100%;height:100%;object-fit:cover;filter:brightness(.18) saturate(.5)';v.replaceWith(img);}
    });
  }
});

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

document.addEventListener('click',e=>{
  const sb=document.getElementById('sidebar');const tog=document.getElementById('sb-toggle');
  if(sb&&tog&&!sb.contains(e.target)&&!tog.contains(e.target)) sb.classList.remove('open');
});

// ===================== TIPOS DE SERVICIO =====================
// ===================== TIPOS DE SERVICIO — Firebase =====================
function renderTiposServicio(){
  const tipos=getTipos();
  const sel=document.getElementById('cat-tipo-filter');
  if(sel){
    const cur=sel.value;
    sel.innerHTML='<option value="">-- Todos los tipos --</option>';
    tipos.forEach(t=>{const o=document.createElement('option');o.value=t.id;o.textContent=t.nombre;if(t.id===cur)o.selected=true;sel.appendChild(o);});
  }
  const tbody=document.getElementById('tipos-body');
  if(!tbody) return;
  if(!tipos.length){tbody.innerHTML='<tr><td colspan="4" class="td-empty">No hay tipos de servicio. Crea el primero.</td></tr>';return;}
  tbody.innerHTML=tipos.map(t=>`
    <tr>
      <td style="color:var(--t1);font-weight:500">${t.nombre}</td>
      <td>${t.descripcion||'<span style="color:var(--t3)">—</span>'}</td>
      <td><span class="${t.activo!==false?'badge-act':'badge-ina'}">${t.activo!==false?'Activo':'Inactivo'}</span></td>
      <td style="display:flex;gap:8px">
        <button class="btn-icon" onclick="editTipo('${t.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Editar</button>
        <button class="btn-danger" onclick="deleteTipo('${t.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
      </td>
    </tr>`).join('');
  refreshCatTipoSel();
}

function openTipoModal(){
  document.getElementById('tipo-edit-id').value='';
  document.getElementById('tipo-nombre').value='';
  document.getElementById('tipo-desc').value='';
  document.getElementById('tipo-activo').classList.add('on');
  document.getElementById('mod-tipo-title').textContent='Nuevo Tipo de Servicio';
  openMod('mod-tipo');
}

function editTipo(id){
  const t=getTipos().find(x=>x.id===id);if(!t) return;
  document.getElementById('tipo-edit-id').value=id;
  document.getElementById('tipo-nombre').value=t.nombre;
  document.getElementById('tipo-desc').value=t.descripcion||'';
  const tog=document.getElementById('tipo-activo');
  t.activo!==false?tog.classList.add('on'):tog.classList.remove('on');
  document.getElementById('mod-tipo-title').textContent='Editar Tipo de Servicio';
  openMod('mod-tipo');
}

async function saveTipo(){
  const nombre=document.getElementById('tipo-nombre').value.trim();
  if(!nombre){showToast('El nombre es obligatorio','err');return;}
  const editId=document.getElementById('tipo-edit-id').value;
  const activo=document.getElementById('tipo-activo').classList.contains('on');
  const descripcion=document.getElementById('tipo-desc').value.trim();
  const btn=document.querySelector('#mod-tipo .btn-prim');
  if(btn){btn.disabled=true;btn.textContent='Guardando...';}
  try{
    const id=editId||('tipo_'+Date.now());
    const existing=editId?getTipos().find(x=>x.id===editId):null;
    await fbSaveTipo(id,{id,nombre,descripcion,activo,creado:existing?.creado||new Date().toISOString()});
    closeMod('mod-tipo');
    showToast(editId?'Tipo actualizado exitosamente':'Tipo creado exitosamente','ok');
  }catch(err){
    showToast('Error: '+err.message,'err');
  }finally{
    if(btn){btn.disabled=false;btn.textContent=editId?'Guardar Cambios':'Crear Tipo';}
  }
}

async function deleteTipo(id){
  if(!await vmzConfirm(
    '¿Eliminar tipo de servicio?',
    'Esta acción eliminará el tipo y no se puede deshacer.',
    {danger:true, confirm:'Sí, eliminar', cancel:'Cancelar'}
  )) return;
  try{
    await fbRemoveTipo(id);
    showToast('Tipo eliminado','ok');
    // listener auto-refreshes
  }catch(err){showToast('Error: '+err.message,'err');}
}

// ===================== CATEGORÍAS — Firebase =====================
let _selectedTipoId = '';

function refreshCatTipoSel(){
  // Update the hidden legacy filter + rebuild the tab sidebar
  const tipos = getTipos().filter(t => t.activo !== false);
  const filter = document.getElementById('cat-tipo-filter');
  if(filter){
    filter.innerHTML = '<option value="">-- Todos los tipos --</option>';
    tipos.forEach(t => {
      const o = document.createElement('option');
      o.value = t.id; o.textContent = t.nombre;
      if(t.id === _selectedTipoId) o.selected = true;
      filter.appendChild(o);
    });
  }
  _buildTipoTabs(tipos);
}

function _buildTipoTabs(tipos){
  const list = document.getElementById('cat-tipo-tabs-list'); if(!list) return;
  if(!tipos.length){
    list.innerHTML = '<div class="cat-tipo-empty">No hay tipos de servicio.<br>Crea uno primero en<br><strong>Tipos de Servicio</strong>.</div>';
    return;
  }
  const cats = getCats();
  list.innerHTML = tipos.map(t => {
    const count = cats.filter(c => c.tipoId === t.id).length;
    return `<div class="cat-tipo-tab${_selectedTipoId===t.id?' active':''}" onclick="selectTipoTab('${t.id}')">
      <span class="cat-tipo-tab-name">${t.nombre}</span>
      <span class="cat-tipo-tab-count">${count}</span>
    </div>`;
  }).join('');
}

function selectTipoTab(tipoId){
  _selectedTipoId = tipoId;
  const filter = document.getElementById('cat-tipo-filter');
  if(filter) filter.value = tipoId;
  // Show nueva btn
  const btn = document.getElementById('cat-nueva-btn');
  if(btn) btn.style.display = '';
  // Toggle panels
  const prompt = document.getElementById('cat-select-prompt');
  const wrap   = document.getElementById('cat-blocks-wrap');
  if(prompt) prompt.style.display = 'none';
  if(wrap)   wrap.style.display = '';
  _buildTipoTabs(getTipos().filter(t => t.activo !== false));
  renderCategorias();
}

function renderCategorias(){
  refreshCatTipoSel();
  const wrap = document.getElementById('cat-blocks-wrap'); if(!wrap) return;
  const tipoId = _selectedTipoId;
  if(!tipoId){ wrap.innerHTML = ''; return; }
  const tipo = getTipos().find(t => t.id === tipoId);
  let cats = getCats().filter(c => c.tipoId === tipoId);

  // Header for this tipo
  const hdrHtml = `<div class="cat-panel-hdr">
    <div>
      <div class="cat-panel-title">${tipo ? tipo.nombre : ''}</div>
      <div class="cat-panel-sub">${cats.length} categoría${cats.length!==1?'s':''} · ${cats.reduce((a,c)=>a+(c.items||[]).length,0)} ítems en total</div>
    </div>
  </div>`;

  if(!cats.length){
    wrap.innerHTML = hdrHtml + `<div class="cat-empty-state">
      <div class="cat-empty-ico">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="var(--acc)" stroke-width="2" stroke-linecap="round"/></svg>
      </div>
      <div class="cat-empty-title">Sin categorías aún</div>
      <div class="cat-empty-sub">Crea la primera categoría para <strong>${tipo?tipo.nombre:'este tipo'}</strong>.<br>Cada categoría agrupa ítems que el técnico evaluará.</div>
      <button class="btn-prim" onclick="openCatModal()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>
        Crear primera categoría
      </button>
    </div>`;
    return;
  }

  wrap.innerHTML = hdrHtml + cats.map(cat => `
    <div class="cat-card">
      <div class="cat-card-hdr">
        <div class="cat-card-left">
          <div class="cat-card-ico">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 12h6M9 16h6M9 8h6M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke="var(--acc)" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div>
            <div class="cat-card-title">${cat.nombre}</div>
            <div class="cat-card-count">${(cat.items||[]).length} ítem${(cat.items||[]).length!==1?'s':''}</div>
          </div>
        </div>
        <div class="cat-card-actions">
          <button class="btn-icon" onclick="editCat('${cat.id}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            Editar
          </button>
          <button class="btn-danger" onclick="deleteCat('${cat.id}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>
      ${(cat.items||[]).length
        ? `<div class="cat-items-grid">${(cat.items||[]).map(it=>`<span class="cat-item-chip"><span class="cat-item-chip-dot"></span>${it}</span>`).join('')}</div>`
        : '<div class="cat-no-items">Sin ítems — edita para agregar puntos de evaluación</div>'
      }
    </div>`).join('');
}

function openCatModal(){
  document.getElementById('cat-edit-id').value = '';
  document.getElementById('cat-nombre').value = '';
  document.getElementById('cat-tipo-sel').value = _selectedTipoId;
  document.getElementById('mod-cat-title').textContent = 'Nueva Categoría';
  const tipo = getTipos().find(t => t.id === _selectedTipoId);
  const lbl = document.getElementById('mod-cat-tipo-label');
  if(lbl) lbl.textContent = tipo ? 'Para: ' + tipo.nombre : '';
  document.getElementById('cat-items-editor').innerHTML = '';
  _updateItemCounter();
  addCatItemRow();
  const btn = document.getElementById('cat-save-btn');
  if(btn){ btn.disabled=false; btn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Guardar Categoría'; }
  openMod('mod-cat');
  setTimeout(()=>document.getElementById('cat-nombre').focus(), 80);
}

function editCat(id){
  const cat = getCats().find(x => x.id === id); if(!cat) return;
  document.getElementById('cat-edit-id').value = id;
  document.getElementById('cat-nombre').value = cat.nombre;
  document.getElementById('cat-tipo-sel').value = cat.tipoId || '';
  document.getElementById('mod-cat-title').textContent = 'Editar Categoría';
  const tipo = getTipos().find(t => t.id === cat.tipoId);
  const lbl = document.getElementById('mod-cat-tipo-label');
  if(lbl) lbl.textContent = tipo ? 'Tipo: ' + tipo.nombre : '';
  const ed = document.getElementById('cat-items-editor');
  ed.innerHTML = '';
  (cat.items||[]).forEach(it => _appendItemRow(it));
  if(!(cat.items||[]).length) _appendItemRow('');
  _updateItemCounter();
  const btn = document.getElementById('cat-save-btn');
  if(btn){ btn.disabled=false; btn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Guardar Cambios'; }
  openMod('mod-cat');
}

function _appendItemRow(value){
  const ed = document.getElementById('cat-items-editor');
  const idx = ed.querySelectorAll('.cat-item-row').length + 1;
  const row = document.createElement('div');
  row.className = 'cat-item-row';
  row.innerHTML = `
    <span class="cat-item-num">${idx}</span>
    <input class="form-input" value="${value}" placeholder="Ej: Nivel de aceite, Estado de frenos..." style="flex:1;border-radius:7px;padding:8px 12px;font-size:13px" oninput="_updateItemCounter()">
    <button style="width:28px;height:28px;border-radius:6px;background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.15);color:#DC2626;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;transition:all .15s" onmouseenter="this.style.background='rgba(220,38,38,.15)'" onmouseleave="this.style.background='rgba(220,38,38,.08)'" onclick="this.parentElement.remove();_updateItemCounter();_renumberItems()">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
    </button>`;
  ed.appendChild(row);
  if(value === '') row.querySelector('input').focus();
}

function _renumberItems(){
  document.querySelectorAll('#cat-items-editor .cat-item-num').forEach((el,i)=>{ el.textContent=i+1; });
}

function _updateItemCounter(){
  const count = [...document.querySelectorAll('#cat-items-editor input')].filter(i=>i.value.trim()).length;
  const el = document.getElementById('cat-item-counter');
  if(el) el.textContent = count + ' ítem' + (count!==1?'s':'');
}

function addCatItemRow(){
  _appendItemRow('');
  _updateItemCounter();
}

async function saveCat(){
  const nombre=document.getElementById('cat-nombre').value.trim();
  const tipoId=document.getElementById('cat-tipo-sel').value;
  if(!nombre){showToast('El nombre es obligatorio','err');return;}
  if(!tipoId){showToast('Selecciona un tipo de servicio','err');return;}
  const items=[...document.getElementById('cat-items-editor').querySelectorAll('input')].map(i=>i.value.trim()).filter(Boolean);
  const editId=document.getElementById('cat-edit-id').value;
  const btn=document.querySelector('#mod-cat .btn-prim');
  if(btn){btn.disabled=true;btn.textContent='Guardando...';}
  try{
    const id=editId||('cat_'+Date.now());
    const existing=editId?getCats().find(x=>x.id===editId):null;
    await fbSaveCat(id,{id,nombre,tipoId,items,creado:existing?.creado||new Date().toISOString()});
    closeMod('mod-cat');
    showToast(editId?'Categoría actualizada exitosamente':'Categoría creada exitosamente','ok');
  }catch(err){
    showToast('Error: '+err.message,'err');
  }finally{
    if(btn){btn.disabled=false;btn.textContent=editId?'Guardar Cambios':'Crear Categoría';}
  }
}

async function deleteCat(id){
  if(!await vmzConfirm(
    '¿Eliminar categoría?',
    'Se eliminará la categoría y todos sus ítems.',
    {danger:true, confirm:'Sí, eliminar', cancel:'Cancelar'}
  )) return;
  try{
    await fbRemoveCat(id);
    showToast('Categoría eliminada','ok');
  }catch(err){showToast('Error: '+err.message,'err');}
}

// ===================== GESTIÓN USUARIOS — Firebase Realtime DB =====================
// localUsers is kept IN MEMORY only, populated by the onValue listener.
// localStorage is NOT used for users — Firebase is the only source of truth.
let _localUsers = [];
let _usersListenerActive = false;

function getLocalUsers(){ return _localUsers; }

// Start real-time listener on /users node — auto-updates table whenever DB changes
function startUsersListener(){
  if(_usersListenerActive) return;
  if(!window._fbDb||!window._fbRef||!window._fbOnValue) return;
  _usersListenerActive = true;
  const usersRef = window._fbRef(window._fbDb, 'users');
  window._fbOnValue(usersRef, (snapshot) => {
    const data = snapshot.val() || {};
    // Usar entries para garantizar que uid = clave del nodo Firebase
    // (el campo uid interno puede estar vacío en registros antiguos)
    _localUsers = Object.entries(data).map(([nodeKey, u]) => ({
      ...u,
      uid: u.uid || nodeKey  // fallback al key del nodo si uid no está en el objeto
    }));
    renderUsuarios();
    // Also refresh technician selector if it's visible
    const techSel = document.getElementById('f-tecnico');
    if(techSel) populateTecnicoSelect();
    // Keep the public admin index in sync so technicians can notify admins
    _syncAdminIndex();
  }, (err) => {
    console.error('[Firebase] users listener error:', err);
    showToast('Error al leer los usuarios. Revisa tu conexión', 'err');
    _usersListenerActive = false;
  });
}

function renderUsuarios(){
  const users = _localUsers;
  const tbody = document.getElementById('users-body');
  if(!tbody) return;
  if(!users.length){
    tbody.innerHTML='<tr><td colspan="6" class="td-empty">No hay usuarios registrados. Crea el primero.</td></tr>';
    return;
  }
  const sorted = [...users].sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  tbody.innerHTML = sorted.map(u=>`
    <tr>
      <td style="color:var(--t1);font-weight:500">${u.name||'—'}</td>
      <td style="font-size:12px;color:var(--t2)">${u.email||'—'}</td>
      <td><span class="badge-role ${u.role==='admin'?'badge-admin':'badge-tech'}">${u.role==='admin'?'Admin':'Técnico'}</span></td>
      <td style="font-size:12px;color:var(--t2)">${u.city||'Tunja'}</td>
      <td><span class="${u.active!==false?'badge-act':'badge-ina'}">${u.active!==false?'Activo':'Inactivo'}</span></td>
      <td style="display:flex;gap:8px">
        <button class="btn-icon" onclick="editUser('${u.uid}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Editar</button>
        <button class="btn-danger" data-uid="${u.uid}" data-name="${u.name||''}" onclick="deleteUser(this.dataset.uid,this.dataset.name)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
      </td>
    </tr>`).join('');
}

function openUserModal(){
  document.getElementById('user-edit-id').value='';
  document.getElementById('user-nombre').value='';
  // Restablecer email a estado editable
  const emailEl = document.getElementById('user-email');
  emailEl.value = '';
  emailEl.readOnly = false;
  emailEl.style.cssText = '';
  const emailLbl = document.getElementById('user-email-label');
  if(emailLbl) emailLbl.innerHTML = 'Correo electrónico *';
  document.getElementById('user-pass').value='';
  document.getElementById('user-rol').value='tech';
  document.getElementById('user-ciudad').value='Tunja';
  document.getElementById('user-activo').classList.add('on');
  document.getElementById('mod-user-title').textContent='Nuevo Usuario';
  document.getElementById('user-pass-group').style.display='';
  document.getElementById('user-save-btn').textContent='Crear Usuario';
  const msg=document.getElementById('user-msg');msg.style.display='none';
  openMod('mod-user');
}

function editUser(uid){
  const u = _localUsers.find(x=>x.uid===uid);
  if(!u) return;
  document.getElementById('user-edit-id').value=uid;
  document.getElementById('user-nombre').value=u.name||'';
  // Correo: mostrar pero NO editable — no se puede cambiar el email de Auth desde el cliente
  const emailEl = document.getElementById('user-email');
  emailEl.value = u.email||'';
  emailEl.readOnly = true;
  emailEl.style.cssText = 'opacity:.55;cursor:not-allowed;pointer-events:none';
  const emailLbl = document.getElementById('user-email-label');
  if(emailLbl) emailLbl.innerHTML = 'Correo electrónico <span style="font-size:11px;color:var(--t3);font-weight:400;text-transform:none">(no editable)</span>';
  document.getElementById('user-pass').value='';
  document.getElementById('user-rol').value=u.role||'tech';
  document.getElementById('user-ciudad').value=u.city||'Tunja';
  const tog=document.getElementById('user-activo');
  u.active!==false?tog.classList.add('on'):tog.classList.remove('on');
  document.getElementById('mod-user-title').textContent='Editar Usuario';
  document.getElementById('user-pass-group').style.display='none';
  const saveBtn = document.getElementById('user-save-btn');
  saveBtn.disabled=false; saveBtn.textContent='Guardar Cambios';
  document.getElementById('user-msg').style.display='none';
  openMod('mod-user');
}

async function saveUser(){
  const nombre  = document.getElementById('user-nombre').value.trim();
  const pass    = document.getElementById('user-pass').value;
  const rol     = document.getElementById('user-rol').value;
  const ciudad  = document.getElementById('user-ciudad').value.trim()||'Tunja';
  const activo  = document.getElementById('user-activo').classList.contains('on');
  const editId  = document.getElementById('user-edit-id').value;
  const msg     = document.getElementById('user-msg');
  const btn     = document.getElementById('user-save-btn');

  // En edición el email viene de _localUsers (el campo es readonly, no confiable)
  // En creación viene del campo del formulario
  const existingUser = editId ? _localUsers.find(u => u.uid === editId) : null;
  const email = editId
    ? (existingUser ? existingUser.email : '')
    : document.getElementById('user-email').value.trim().toLowerCase();

  if(!nombre){ showToast('El nombre es obligatorio','err'); return; }
  if(!editId && !email){ showToast('El correo es obligatorio','err'); return; }
  if(!editId && pass.length < 6){ showToast('La contraseña debe tener al menos 6 caracteres','err'); return; }

  const showMsg=(text,isErr=false)=>{
    msg.style.display='block';
    msg.style.background=isErr?'rgba(239,68,68,.08)':'rgba(29,111,232,.1)';
    msg.style.color=isErr?'#f87171':'var(--blue-inst)';
    msg.style.border=isErr?'1px solid rgba(239,68,68,.2)':'1px solid rgba(29,111,232,.25)';
    msg.textContent=text;
  };

  if(editId){
    // ── EDIT: actualizar registro en Firebase DB ──
    const userData = {uid:editId, name:nombre, email, role:rol,
                      city:ciudad, active:activo, techName:nombre, display:nombre};
    if(!window._fbDb || !window._fbRef || !window._fbUpdate){
      showToast('Sin conexión a la base de datos','err'); return;    }
    btn.disabled=true; btn.textContent='Guardando...';
    showMsg('Guardando cambios...');
    try{
      await window._fbUpdate(window._fbRef(window._fbDb, 'users/'+editId), userData);
      btn.disabled=false; btn.textContent='Guardar Cambios';
      closeMod('mod-user');
      showToast('Usuario actualizado','ok');
    }catch(err){
      showMsg('Error al actualizar: '+err.message, true);
      btn.disabled=false; btn.textContent='Guardar Cambios';
    }

  } else {
    // ── CREATE: segunda instancia Firebase para no tocar la sesión del admin ──
    // El admin sigue autenticado en la app principal durante todo el proceso.
    // La app secundaria crea el usuario, escribe en la BD con SU token, y se destruye.
    if(_localUsers.some(u=>u.email===email)){
      showToast('Ya existe un usuario con ese correo','err');return;
    }
    if(!window._fbAuth||!window._fbCreateUser){
      showToast('Sin conexión al sistema de autenticación','err');return;
    }
    btn.disabled=true; btn.textContent='Creando...';
    showMsg('Creando usuario...');

    let secondaryApp = null;
    try{
      const cfg     = firebase.app().options;
      const tmpName = 'vmz_tmp_' + Date.now();
      secondaryApp  = firebase.initializeApp(cfg, tmpName);
      const secAuth = firebase.auth(secondaryApp);
      const secDb   = firebase.database(secondaryApp);

      // 1. Crear usuario en Auth con la app secundaria
      const cred = await secAuth.createUserWithEmailAndPassword(email, pass);
      const uid  = cred.user.uid;

      // 2. Escribir en la BD usando la conexión secundaria (token del nuevo usuario)
      //    Las reglas permiten escribir users/$uid si auth.uid === $uid
      const newUser = {uid, email, name:nombre, role:rol, city:ciudad,
                       active:activo, techName:nombre, display:nombre};
      showMsg('Guardando en base de datos...');
      await secDb.ref('users/' + uid).set(newUser);

      // 3. Cerrar app secundaria — la sesión del admin nunca se tocó
      await secondaryApp.delete();
      secondaryApp = null;

      closeMod('mod-user');
      showToast('Usuario creado correctamente','ok');
    }catch(err){
      if(secondaryApp){ try{ await secondaryApp.delete(); }catch(e2){} }
      const fbErrors = {
        'auth/email-already-in-use': 'Este correo ya está registrado',
        'auth/invalid-email':        'Formato de correo no válido',
        'auth/weak-password':        'Contraseña muy débil (mín. 6 caracteres)'
      };
      showMsg(fbErrors[err.code] || err.message, true);
      btn.disabled=false; btn.textContent='Crear Usuario';
    }
  }
}

async function deleteUser(uid, nombre){
  if(!await vmzConfirm(
    `¿Eliminar a ${nombre}?`,
    'Se eliminará de la base de datos. Si el usuario tiene cuenta de acceso, deberás revocarla manualmente desde el sistema de administración.',
    {danger:true, confirm:'Sí, eliminar', cancel:'Cancelar'}
  )) return;
  if(!window._fbDb||!window._fbRef||!window._fbRemove){
    showToast('Sin conexión a la base de datos','err');return;
  }
  try{
    await window._fbRemove(window._fbRef(window._fbDb,'users/'+uid));
    showToast('Usuario eliminado de la base de datos','ok');
    // onValue listener auto-refreshes the table
  }catch(err){
    showToast('Error al eliminar: '+err.message,'err');
  }
}

// ===================== SISTEMA DE NOTIFICACIONES =====================
// Firebase path: notifications/{uid}/{notifId}
// Reglas necesarias en Firebase (agregar a las rules existentes):
// "notifications": {
//   "$uid": {
//     ".read": "auth != null && auth.uid === $uid",
//     ".write": "auth != null"
//   }
// },
// "metadata": {
//   "admins": {
//     ".read": "auth != null",
//     ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'"
//   }
// }

let _notifListener     = null;
let _notifListenerUid  = null;
let _localNotifs       = {};      // { id: notifObject }
let _notifPanelOpen    = false;

// ── Helpers de tiempo ────────────────────────────────────────────────────────
function _timeAgo(isoStr){
  if(!isoStr) return '';
  const diff = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(diff/60000);
  if(m < 1)  return 'ahora';
  if(m < 60) return `hace ${m} min`;
  const h = Math.floor(m/60);
  if(h < 24) return `hace ${h}h`;
  const d = Math.floor(h/24);
  return `hace ${d} día${d>1?'s':''}`;
}

// ── Escribir notificación en Firebase ────────────────────────────────────────
async function _pushNotification(targetUid, type, title, body, meta){
  if(!targetUid) {
    console.warn('[Notif] _pushNotification abortada: targetUid vacío. type:', type, 'title:', title);
    return;
  }
  if(!window._fbDb) {
    console.warn('[Notif] _pushNotification abortada: _fbDb no disponible');
    return;
  }
  const id = 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
  const notif = {
    id, type, title, body,
    meta: meta || {},
    createdAt: new Date().toISOString(),
    read: false
  };
  try{
    await window._fbSet(
      window._fbRef(window._fbDb, `notifications/${targetUid}/${id}`),
      notif
    );
    console.log('[Notif] ✓ enviada a', targetUid, '→', title);
  }catch(e){
    console.error('[Notif] ✗ error escribiendo notif para', targetUid, ':', e.code, e.message);
  }
}


async function _notifyAllAdmins(type, title, body, meta){
  if(!window._fbDb) return;
  const adminUids = new Set();

  // 1) Índice público de admins — accesible SIEMPRE (técnico o admin)
  try{
    const snap = await window._fbGet(window._fbRef(window._fbDb, 'metadata/admins'));
    const idx  = snap.val() || {};
    Object.keys(idx).forEach(uid => adminUids.add(uid));
    console.log('[Notif] admins desde metadata/admins:', [...adminUids]);
  }catch(e){
    console.warn('[Notif] no se pudo leer metadata/admins:', e.message);
  }

  // 2) adminId guardado en el servicio — respaldo confiable
  if(meta?.serviceId){
    try{
      const snap = await window._fbGet(window._fbRef(window._fbDb, `services/${meta.serviceId}/inspection/adminId`));
      const uid  = snap.val();
      if(uid){ adminUids.add(uid); console.log('[Notif] adminId desde servicio:', uid); }
    }catch(e){
      console.warn('[Notif] no se pudo leer adminId del servicio:', e.message);
    }
  }

  // 3) Caché local (sesión de admin) — captura otros admins si hay varios
  _localUsers
    .filter(u => u.role === 'admin' && u.uid && u.active !== false)
    .forEach(u => adminUids.add(u.uid));

  if(!adminUids.size){
    console.warn('[Notif] No se encontraron admins para notificar');
    return;
  }

  console.log('[Notif] Enviando a admins:', [...adminUids]);
  for(const uid of adminUids){
    await _pushNotification(uid, type, title, body, meta);
  }
}

async function _syncAdminIndex(){
  if(!window._fbDb) return;
  if(currentUser?.role !== 'admin') return;
  try{
    const admins = _localUsers.filter(u => u.role === 'admin' && u.uid && u.active !== false);
    const index  = {};
    admins.forEach(u => { index[u.uid] = true; });
    await window._fbSet(window._fbRef(window._fbDb, 'metadata/admins'), index);
  }catch(e){
    console.warn('[Notif] _syncAdminIndex error:', e);
  }
}

// ── Iniciar listener de notificaciones del usuario actual ─────────────────────
function startNotificationsListener(uid){
  if(_notifListenerUid === uid) return;
  if(_notifListener){ _notifListener(); _notifListener=null; }
  _notifListenerUid = uid;
  let _isFirstLoad = true;   // bandera para ignorar toasts en la carga inicial
  const ref = window._fbRef(window._fbDb, `notifications/${uid}`);
  const unsub = window._fbOnValue(ref, (snap) => {
    const prev    = {..._localNotifs};
    _localNotifs  = snap.val() || {};
    console.log('[Notif] listener activo para uid:', uid, '| notifs:', Object.keys(_localNotifs).length);
    _renderNotifPanel();
    // Solo mostrar push toast en cambios NUEVOS (no en la carga inicial)
    if(!_isFirstLoad){
      Object.values(_localNotifs).forEach(n => {
        if(!n.read && !prev[n.id]){
          console.log('[Notif] nuevo push toast:', n.title);
          _showPushToast(n);
        }
      });
    }
    _isFirstLoad = false;
  }, (err) => {
    console.error('[Notif] listener error:', err.code, err.message);
    _notifListenerUid = null;
  });
  _notifListener = unsub;
}

// ── Marcar como leída ─────────────────────────────────────────────────────────
async function _markNotifRead(notifId){
  if(!_notifListenerUid || !_localNotifs[notifId]) return;
  try{
    await window._fbUpdate(
      window._fbRef(window._fbDb, `notifications/${_notifListenerUid}/${notifId}`),
      { read: true }
    );
  }catch(e){}
}

// ── Eliminar notificación ─────────────────────────────────────────────────────
async function dismissNotification(notifId){
  if(!_notifListenerUid) return;
  try{
    await window._fbRemove(
      window._fbRef(window._fbDb, `notifications/${_notifListenerUid}/${notifId}`)
    );
  }catch(e){ console.warn('[Notif] delete error:', e); }
}

// ── Limpiar todas ─────────────────────────────────────────────────────────────
async function clearAllNotifications(){
  if(!_notifListenerUid) return;
  try{
    await window._fbRemove(window._fbRef(window._fbDb, `notifications/${_notifListenerUid}`));
  }catch(e){}
}

// ── Render panel ──────────────────────────────────────────────────────────────
function _renderNotifPanel(){
  const list    = document.getElementById('notif-list');
  const empty   = document.getElementById('notif-empty');
  const badge   = document.getElementById('notif-count-badge');
  const dot     = document.getElementById('notif-dot');
  const panelCt = document.getElementById('notif-panel-count');
  const clearBtn= document.getElementById('notif-clear-all-btn');
  if(!list) return;

  const notifs  = Object.values(_localNotifs).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  const unread  = notifs.filter(n=>!n.read).length;

  // Badge on bell
  if(unread > 0){
    badge.textContent = unread > 99 ? '99+' : unread;
    badge.style.display = 'flex';
    dot.style.display   = 'block';
  } else {
    badge.style.display = 'none';
    dot.style.display   = 'none';
  }

  // Panel header count
  if(notifs.length > 0){
    panelCt.textContent = notifs.length;
    panelCt.style.display = '';
    clearBtn.style.display = '';
  } else {
    panelCt.style.display = 'none';
    clearBtn.style.display = 'none';
  }

  // List
  if(!notifs.length){
    empty.style.display = 'flex';
    list.innerHTML = '';
    return;
  }
  empty.style.display = 'none';

  const ICONS = {
    assign: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.8"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    started:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    done:   `<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/><path d="M8 12l3 3 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    info:       `<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/><path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    reasignado: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  };

  list.innerHTML = notifs.map(n => {
    const ico   = ICONS[n.type] || ICONS.info;
    const cls   = n.type || 'info';
    const unrec = !n.read ? ' unread' : '';
    return `<div class="notif-item${unrec}" id="notif-item-${n.id}" onclick="_markNotifRead('${n.id}')">
      <div class="notif-ico ${cls}">${ico}</div>
      <div class="notif-content">
        <div class="notif-title">${n.title||''}</div>
        <div class="notif-body">${n.body||''}</div>
        <div class="notif-time">${_timeAgo(n.createdAt)}</div>
      </div>
      <button class="notif-dismiss" onclick="event.stopPropagation();dismissNotification('${n.id}')" title="Descartar">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
      </button>
    </div>`;
  }).join('');
}

// ── Push toast visual ─────────────────────────────────────────────────────────
function _showPushToast(notif){
  const wrap = document.getElementById('push-toast-wrap');
  if(!wrap) return;
  const cls  = notif.type || 'info';
  const ICONS = {
    assign: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.8"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    started:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    done:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/><path d="M8 12l3 3 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    info:       `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/><path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    reasignado: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  };
  const DURATION = 5000;
  const el = document.createElement('div');
  el.className = `push-toast`;
  el.innerHTML = `
    <div class="push-toast-accent ${cls}"></div>
    <div class="push-toast-ico ${cls}">${ICONS[cls]||ICONS.info}</div>
    <div class="push-toast-body">
      <div class="push-toast-title">${notif.title||''}</div>
      <div class="push-toast-msg">${notif.body||''}</div>
    </div>
    <button class="push-toast-close" onclick="_dismissPushToast(this.parentElement)">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
    </button>
    <div class="push-toast-progress" style="--duration:${DURATION}ms"></div>`;
  wrap.appendChild(el);
  // Auto-dismiss
  const timer = setTimeout(()=>_dismissPushToast(el), DURATION);
  el._timer = timer;
  // Max 3 visible
  const all = wrap.querySelectorAll('.push-toast');
  if(all.length > 3) _dismissPushToast(all[0]);
}

function _dismissPushToast(el){
  if(!el || el._removing) return;
  el._removing = true;
  clearTimeout(el._timer);
  el.classList.add('removing');
  setTimeout(()=>{ try{ el.remove(); }catch(e){} }, 270);
}

// ── Panel toggle ──────────────────────────────────────────────────────────────
function toggleNotifPanel(){
  _notifPanelOpen ? closeNotifPanel() : openNotifPanel();
}
function openNotifPanel(){
  _notifPanelOpen = true;
  document.getElementById('notif-panel').classList.add('open');
  document.getElementById('notif-overlay').classList.add('open');
  _renderNotifPanel();
  // Mark all as read when panel opens
  Object.values(_localNotifs).forEach(n=>{
    if(!n.read) _markNotifRead(n.id);
  });
}
function closeNotifPanel(){
  _notifPanelOpen = false;
  document.getElementById('notif-panel').classList.remove('open');
  document.getElementById('notif-overlay').classList.remove('open');
}

// ── Hook en submitPeritaje — notificar al técnico al asignar servicio ─────────
// Se llama automáticamente después de que se guarda el servicio en Firebase
function _notifyTechOnAssign(payload){
  const techUid  = payload?.inspection?.technicianId;
  const techName = payload?.inspection?.technician || 'Técnico';
  const plate    = payload?.vehicle?.plate || 'S/N';
  const brand    = payload?.vehicle?.brand || '';
  const model    = payload?.vehicle?.model || '';
  console.log('[Notif] _notifyTechOnAssign → techUid:', techUid, '| techName:', techName);
  if(!techUid) {
    console.warn('[Notif] ⚠ technicianId vacío — la notificación no se enviará. Verifica que el técnico tiene uid en Firebase.');
    return;
  }
  _pushNotification(
    techUid,
    'assign',
    'Nuevo servicio asignado',
    `Se te asignó el vehículo ${brand} ${model} · Placa: ${plate}`,
    { serviceId: payload.id }
  );
}

// ── Hook en abrirAtender — notificar a admins cuando empieza inspección ───────
function _notifyAdminsOnStarted(p){
  const techName = p?.inspection?.technician || 'Un técnico';
  const plate    = p?.vehicle?.plate || 'S/N';
  const brand    = p?.vehicle?.brand || '';
  console.log('[Notif] Disparando notificación "inspección iniciada" para servicio', p?.id);
  _notifyAllAdmins(
    'started',
    'Inspección iniciada',
    `${techName} inició la inspección de ${brand} · Placa: ${plate}`,
    { serviceId: p.id }
  );
}

// ── Hook en finalizarPeritaje — notificar a admins al finalizar ───────────────
function _notifyAdminsOnDone(p){
  const techName = p?.inspection?.technician || 'Un técnico';
  const plate    = p?.vehicle?.plate || 'S/N';
  const brand    = p?.vehicle?.brand || '';
  console.log('[Notif] Disparando notificación "servicio finalizado" para servicio', p?.id);
  _notifyAllAdmins(
    'done',
    'Servicio finalizado',
    `${techName} finalizó el servicio de ${brand} · Placa: ${plate}. PDF listo.`,
    { serviceId: p.id }
  );
}

// ===================== FIN SISTEMA DE NOTIFICACIONES =====================

// ===================== PROPIETARIOS & VEHÍCULOS — Colecciones relacionales =====================
// owners/{docType_docNum}  →  { id, docType, docNum, name, tel, email, dir, city, depto }
// vehicles/{plate}         →  { plate, brand, model, year, color, vin, motor, fuel, trans, ownerId }

let _ownerLookupTimer = null;
let _vehicleLookupTimer = null;

// ── Buscar propietario por tipo+número de documento ───────────────────────────
function lookupOwner(){
  clearTimeout(_ownerLookupTimer);
  const doctype = document.getElementById('f-doctype').value;
  const docnum  = document.getElementById('f-docnum').value.trim();
  const ind     = document.getElementById('owner-lookup-indicator');
  const banner  = document.getElementById('owner-found-banner');
  if(!doctype || docnum.length < 4){ ind.style.display='none'; banner.style.display='none'; return; }
  ind.style.display='inline'; ind.style.color='var(--t3)'; ind.textContent='Buscando...';
  _ownerLookupTimer = setTimeout(async ()=>{
    try{
      const key  = _ownerKey(doctype, docnum);
      const snap = await window._fbGet(window._fbRef(window._fbDb, `owners/${key}`));
      const data = snap.val();
      if(data){
        _fillOwnerFields(data);
        ind.style.color='#16A34A'; ind.textContent='✓ Encontrado';
        banner.style.display='flex';
        document.getElementById('owner-found-txt').textContent=`Propietario encontrado: ${data.name} — datos cargados automáticamente`;
      } else {
        ind.style.color='var(--t3)'; ind.textContent='Nuevo';
        banner.style.display='none';
      }
    }catch(e){ ind.style.display='none'; }
  }, 500);
}

function _ownerKey(doctype, docnum){
  return (doctype+'-'+docnum).replace(/[^a-zA-Z0-9\-]/g,'_').slice(0,120);
}

function _fillOwnerFields(data){
  const set=(id,v)=>{ const el=document.getElementById(id); if(el) el.value=v||''; };
  // BD ya guarda firstName y lastName por separado desde esta versión
  if(data.firstName || data.lastName){
    set('f-nombre',  data.firstName||'');
    set('f-apellido',data.lastName||'');
  } else {
    // Compatibilidad con registros viejos que solo tienen 'name'
    const parts=(data.name||'').trim().split(/\s+/);
    if(parts.length>=3){
      set('f-nombre',  parts.slice(0,Math.ceil(parts.length/2)).join(' '));
      set('f-apellido',parts.slice(Math.ceil(parts.length/2)).join(' '));
    } else if(parts.length===2){
      set('f-nombre',  parts[0]);
      set('f-apellido',parts[1]);
    } else {
      set('f-nombre',  data.name||'');
      set('f-apellido','');
    }
  }
  set('f-tel',   data.tel);
  set('f-email', data.email);
  set('f-dir',   data.dir);
  set('f-ciudad',data.city||'Tunja');
  set('f-depto', data.depto||'Boyacá');
}

function clearOwnerFields(){
  ['f-nombre','f-apellido','f-tel','f-email','f-dir'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
  document.getElementById('f-ciudad').value='Tunja';
  document.getElementById('f-depto').value='Boyacá';
  document.getElementById('owner-found-banner').style.display='none';
  const ind=document.getElementById('owner-lookup-indicator'); if(ind) ind.style.display='none';
}

// ── Buscar vehículo por placa ─────────────────────────────────────────────────
function lookupVehicle(){
  clearTimeout(_vehicleLookupTimer);
  const plate = (document.getElementById('f-placa').value||'').trim().toUpperCase();
  const ind   = document.getElementById('vehicle-lookup-indicator');
  const banner= document.getElementById('vehicle-found-banner');
  if(plate.length < 5){ ind.style.display='none'; banner.style.display='none'; return; }
  ind.style.display='inline'; ind.style.color='var(--t3)'; ind.textContent='Buscando...';
  _vehicleLookupTimer = setTimeout(async ()=>{
    try{
      const snap = await window._fbGet(window._fbRef(window._fbDb, `vehicles/${plate}`));
      const data = snap.val();
      if(data){
        _fillVehicleFields(data);
        ind.style.color='#16A34A'; ind.textContent='✓ Encontrado';
        banner.style.display='flex';
        document.getElementById('vehicle-found-txt').textContent=`Vehículo encontrado: ${data.brand} ${data.model} ${data.year} — datos cargados`;
      } else {
        ind.style.color='var(--t3)'; ind.textContent='Nuevo';
        banner.style.display='none';
      }
    }catch(e){ ind.style.display='none'; }
  }, 500);
}

function _fillVehicleFields(data){
  const set=(id,v)=>{ const el=document.getElementById(id); if(el) el.value=v||''; };
  // Marca — activar el botón de marca correspondiente
  if(data.brand){
    selectedBrand=data.brand;
    document.querySelectorAll('.brand-btn').forEach(b=>{
      b.classList.toggle('selected', b.textContent.trim()===data.brand);
    });
  }
  set('f-modelo', data.model);
  set('f-color',  data.color);
  set('f-vin',    data.vin);
  set('f-motor',  data.motor);
  set('f-km',     data.km||'');
  const anioSel=document.getElementById('f-anio');
  if(anioSel&&data.year){ [...anioSel.options].forEach(o=>{ o.selected=o.value===String(data.year); }); }
  const fuelSel=document.getElementById('f-combust');
  if(fuelSel&&data.fuel){ [...fuelSel.options].forEach(o=>{ o.selected=o.value===data.fuel||o.text===data.fuel; }); }
  const transSel=document.getElementById('f-trans');
  if(transSel&&data.trans){ [...transSel.options].forEach(o=>{ o.selected=o.value===data.trans||o.text===data.trans; }); }
}

function clearVehicleFields(){
  selectedBrand='';
  document.querySelectorAll('.brand-btn').forEach(b=>b.classList.remove('selected'));
  ['f-modelo','f-color','f-vin','f-motor','f-km'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
  document.getElementById('vehicle-found-banner').style.display='none';
  const ind=document.getElementById('vehicle-lookup-indicator'); if(ind) ind.style.display='none';
}

// ── Guardar propietario y vehículo en colecciones relacionales ────────────────
async function _saveOwnerAndVehicle(payload){
  if(!window._fbDb) return;
  try{
    const doctype = payload.owner.docType || '';
    const docnum  = payload.owner.doc     || '';
    if(doctype && docnum){
      const ownerKey = _ownerKey(doctype, docnum);
      // Usar firstName/lastName del payload (ya vienen desde el form en submitPeritaje)
      // Si no existen (registros viejos), desglosar desde name
      let firstName = payload.owner.firstName || '';
      let lastName  = payload.owner.lastName  || '';
      if(!firstName && !lastName && payload.owner.name){
        const parts = payload.owner.name.trim().split(/\s+/);
        const mid   = Math.ceil(parts.length / 2);
        firstName   = parts.slice(0, mid).join(' ');
        lastName    = parts.slice(mid).join(' ');
      }
      const ownerData = {
        id:        ownerKey,
        docType:   doctype,
        docNum:    docnum,
        firstName,
        lastName,
        name:      (firstName+' '+lastName).trim(),
        tel:       payload.owner.tel    || '',
        email:     payload.owner.email  || '',
        dir:       payload.owner.address|| '',
        city:      payload.owner.city   || '',
        depto:     payload.owner.depto  || '',
        updatedAt: new Date().toISOString()
      };
      await window._fbSet(window._fbRef(window._fbDb, `owners/${ownerKey}`), ownerData);
    }
    const plate = (payload.vehicle.plate||'').toUpperCase();
    if(plate){
      const vehicleData = {
        plate,
        brand: payload.vehicle.brand        || '',
        model: payload.vehicle.model        || '',
        year:  payload.vehicle.year         || '',
        color: payload.vehicle.color        || '',
        vin:   payload.vehicle.vin          || '',
        motor: payload.vehicle.motor        || '',
        fuel:  payload.vehicle.fuel         || '',
        trans: payload.vehicle.transmission || '',
        km:    payload.vehicle.km           || '',
        ownerId: doctype&&docnum ? _ownerKey(doctype,docnum) : '',
        updatedAt: new Date().toISOString()
      };
      await window._fbSet(window._fbRef(window._fbDb, `vehicles/${plate}`), vehicleData);
    }
    console.log('[DB] Propietario y vehículo guardados en colecciones relacionales');
  }catch(e){
    console.warn('[DB] _saveOwnerAndVehicle error:', e.message);
  }
}

// También guardar al crear un servicio desde el admin (submitPeritaje)

function openMod(id){document.getElementById(id).classList.add('open');}
function closeMod(id){document.getElementById(id).classList.remove('open');}
// Cerrar modal haciendo clic fuera
document.querySelectorAll('.modal-overlay').forEach(m=>{
  m.addEventListener('click',e=>{if(e.target===m) m.classList.remove('open');});
});

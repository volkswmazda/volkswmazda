

function _initLoginLogic() {

const FB_ERRORS = {
  'auth/invalid-email':        'El correo electrónico no es válido.',
  'auth/user-not-found':       'No existe una cuenta con ese correo.',
  'auth/wrong-password':       'Contraseña incorrecta. Intente de nuevo.',
  'auth/too-many-requests':    'Demasiados intentos. Espere unos minutos.',
  'auth/user-disabled':        'Esta cuenta ha sido desactivada.',
  'auth/network-request-failed':'Error de red. Verifique su conexión.',
  'auth/invalid-credential':   'Credenciales incorrectas. Intente de nuevo.',
};

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

function spawnParticles(){
  const wrap = document.getElementById('particles-wrap');
  if(!wrap) return;
  for(let i=0;i<22;i++){
    const p = document.createElement('div');
    p.className = 'particle';
    const sz = 2 + Math.random()*5;
    p.style.cssText = `
      width:${sz}px;height:${sz}px;
      left:${Math.random()*100}%;
      top:${50+Math.random()*55}%;
      animation-duration:${6+Math.random()*14}s;
      animation-delay:${-Math.random()*14}s;
      opacity:${.1+Math.random()*.4}
    `;
    wrap.appendChild(p);
  }
}

document.getElementById('eye-btn').addEventListener('click',()=>{
  const p = document.getElementById('login-pass');
  p.type = p.type === 'password' ? 'text' : 'password';
});

function showLoginError(msg){
  const el = document.getElementById('login-err');
  document.getElementById('login-err-msg').textContent = msg;
  el.classList.add('show');
}
function hideLoginError(){
  document.getElementById('login-err').classList.remove('show');
}

function showToast(msg, type='ok'){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  clearTimeout(t._tid);
  t._tid = setTimeout(()=> t.classList.remove('show'), 3400);
}

function showRedirectOverlay(name, role){
  const ov = document.getElementById('redirect-overlay');
  document.getElementById('redirect-name').textContent = `¡Bienvenido, ${name}!`;
  document.getElementById('redirect-role').textContent =
    role === 'admin' ? '🔧 Administrador del Sistema' : '⚙️ Técnico';
  document.getElementById('redirect-msg').textContent =
    'Cargando panel de control...';
  ov.classList.add('show');
}

async function doLogin(){
  const email   = document.getElementById('login-user').value.trim().toLowerCase();
  const pass    = document.getElementById('login-pass').value;
  const btn     = document.getElementById('btn-login');
  const btnTxt  = document.getElementById('btn-login-txt');
  const btnSpin = document.getElementById('btn-login-spin');

  hideLoginError();

  if(!email || !pass){
    showLoginError('Por favor complete todos los campos.');
    return;
  }

  
  if(!window._fbAuth || !window._fbSignIn){
    showLoginError('El sistema aún se está iniciando. Espere un momento.');
    return;
  }

  
  btn.classList.add('loading');
  btnTxt.style.display = 'none';
  btnSpin.style.display = 'block';

  try {
    
    const cred = await window._fbSignIn(window._fbAuth, email, pass);
    const uid  = cred.user.uid;

    
    const snap = await window._fbGet(window._fbRef(window._fbDb, 'users/' + uid));

    let profile = null;

    if(snap.exists()){
      profile = snap.val();
    } else {
      await window._fbSignOut(window._fbAuth);
      showLoginError('Tu cuenta no está registrada. Contacta al administrador.');
      btn.classList.remove('loading');
      btnTxt.style.display = 'block';
      btnSpin.style.display = 'none';
      return;
    }

    
    if(profile.active === false){
      await window._fbSignOut(window._fbAuth);
      showLoginError('Tu cuenta ha sido desactivada. Contacta al administrador.');
      btn.classList.remove('loading');
      btnTxt.style.display = 'block';
      btnSpin.style.display = 'none';
      return;
    }

    
    const userData = {
      uid,
      email,
      name:    profile.name     || profile.displayName || email.split('@')[0],
      role:    profile.role     || 'tech',
      techName:profile.techName || profile.name || null,
      display: profile.display  || profile.name || null,
      city:    profile.city     || 'Tunja'
    };
    sessionStorage.setItem('vmz_user', JSON.stringify(userData));

    
    btn.style.background = '#16a34a';
    btnTxt.textContent = 'Acceso concedido';
    btnTxt.style.display = 'block';
    btnSpin.style.display = 'none';

    showRedirectOverlay(userData.name, userData.role);
    showToast(`Bienvenido, ${userData.name}`, 'ok');

    await sleep(1600);

    
    window.location.href = 'dashboard.html';

  } catch(err) {
    btn.classList.remove('loading');
    btnTxt.style.display = 'block';
    btnSpin.style.display = 'none';
    btn.style.background = '';
    btnTxt.textContent = 'INGRESAR AL SISTEMA';

    const msg = FB_ERRORS[err.code] || `Error: ${err.message}`;
    showLoginError(msg);
    document.getElementById('login-pass').value = '';
    document.getElementById('login-pass').focus();
  }
}

document.getElementById('btn-login').addEventListener('click', doLogin);
document.addEventListener('keydown', e => {
  if(e.key === 'Enter') doLogin();
});

window.addEventListener('load', () => {
  
  if(window.innerWidth <= 900){
    const ml = document.getElementById('mobile-logo');
    if(ml) ml.style.display = 'flex';
  }
  window.addEventListener('resize', ()=>{
    const ml = document.getElementById('mobile-logo');
    if(!ml) return;
    ml.style.display = window.innerWidth <= 900 ? 'flex' : 'none';
  });
  spawnParticles();
  const v = document.getElementById('bg-video');
  if(v){
    v.playbackRate = 0.65;
    
    const showVideo = () => { v.classList.add('loaded'); };
    v.addEventListener('canplay', showVideo, {once:true});
    
    setTimeout(showVideo, 3000);
    v.play().catch(()=>{});
    v.addEventListener('error', ()=>{
      const wrap = v.closest('.login-video-wrap');
      if(wrap){
        wrap.style.background = '#090a10';
        const img = document.createElement('img');
        img.src = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&q=80&auto=format';
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;filter:brightness(.18) saturate(.4)';
        v.replaceWith(img);
      }
    });
  }
});

window.addEventListener('firebase-ready', () => {
  const fl = document.getElementById('firebase-loading');
  fl.classList.add('hidden');
  setTimeout(()=>{ fl.style.display='none'; }, 400);

  
  window._fbOnAuth(window._fbAuth, async (user) => {
    if(user){
      
      try{
        const snap = await window._fbGet(window._fbRef(window._fbDb, 'users/' + user.uid));
        let p = snap.exists() ? snap.val() : null;
        if(p && p.active !== false){
          sessionStorage.setItem('vmz_user', JSON.stringify({
            uid: user.uid,
            email: user.email,
            name: p.name || (user.email||'').split('@')[0],
            role: p.role || 'tech',
            techName: p.techName || p.name || null,
            display: p.display || p.name || null,
            city: p.city || 'Tunja'
          }));
          window.location.href = 'dashboard.html';
        }
      }catch(e){}
    }
  });

  
  loadLoginStats();
});

setTimeout(()=>{
  const fl = document.getElementById('firebase-loading');
  if(fl && !fl.classList.contains('hidden')){
    fl.classList.add('hidden');
    setTimeout(()=>{ fl.style.display='none'; },400);
    
  }
}, 6000);

async function loadLoginStats(){
  if(!window._fbDb) return;
  try{
    
    
    const snap = await window._fbGetDoc(
      window._fbDoc(window._fbDb, 'metadata', 'stats')
    );
    if(snap.exists()){
      const d = snap.data();
      if(d.totalServices !== undefined)
        document.getElementById('stat-total').textContent = d.totalServices;
      if(d.todayActive !== undefined)
        document.getElementById('stat-pending').textContent = d.todayActive;
    }
  }catch(e){  }
}
} 

if (window._firebaseReady) {
  _initLoginLogic();
} else {
  window.addEventListener('firebase-ready', _initLoginLogic, { once: true });
}

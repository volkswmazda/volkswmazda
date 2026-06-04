(function initFirebase() {
  const cfg = {
    apiKey:            "AIzaSyBtwmqZqZ2Hj1Xt5ogIaTqEZJXd3vKVMig",
    authDomain:        "volkswmazda-ad26d.firebaseapp.com",
    databaseURL:       "https://volkswmazda-ad26d-default-rtdb.europe-west1.firebasedatabase.app",
    projectId:         "volkswmazda-ad26d",
    storageBucket:     "volkswmazda-ad26d.firebasestorage.app",
    messagingSenderId: "178846757029",
    appId:             "1:178846757029:web:4d54fee13233950c8c5d4c"
  };

  if (typeof firebase === 'undefined') return;
  if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(cfg);

  const db   = firebase.database();
  const auth = typeof firebase.auth === 'function' ? firebase.auth() : null;

  window._fbDb      = db;
  window._fbAuth    = auth;
  window._trackDb   = db; // alias usado por index.html tracking

  // Referencia — acepta (dbInst, path) o (ignorado, path)
  window._fbRef = function(dbOrIgnore, path) {
    var d = (dbOrIgnore && typeof dbOrIgnore.ref === 'function') ? dbOrIgnore : db;
    return path !== undefined ? d.ref(path) : db.ref(dbOrIgnore);
  };

  window._fbGet          = function(ref)          { return ref.once('value'); };
  window._fbSet          = function(ref, val)      { return ref.set(val); };
  window._fbUpdate       = function(ref, val)      { return ref.update(val); };
  window._fbRemove       = function(ref)           { return ref.remove(); };
  window._fbOnValue      = function(ref, cb, err)  { ref.on('value', cb, err); return function(){ ref.off('value', cb); }; };
  window._fbOff          = function(ref, cb)       { ref.off('value', cb); };
  window._fbSignIn       = function(_, email, pass){ return auth && auth.signInWithEmailAndPassword(email, pass); };
  window._fbSignOut      = function()              { return auth && auth.signOut(); };
  window._fbOnAuth       = function(_, cb)         { return auth && auth.onAuthStateChanged(cb); };
  window._fbCreateUser   = function(_, email, pass){ return auth && auth.createUserWithEmailAndPassword(email, pass); };
  window._fbDeleteAuthUser = function(user)        { return user && user.delete(); };

  window._firebaseReady = true;
  window.dispatchEvent(new Event('firebase-ready'));
})();

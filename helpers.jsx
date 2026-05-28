// Shared helpers for the Chai Quiz — sound, confetti, leaderboard storage.
// Leaderboard backends:
//   1. localStorage (default, per-device)
//   2. Firebase Realtime Database (cross-device, optional — set FIREBASE_CONFIG)
// The UI reads via subscribeLeaderboard(cb) which fires whenever the list
// changes (local writes or remote pushes).

(function () {
  // ── Audio ────────────────────────────────────────────────────────
  let _audioCtx = null;
  function getAC() {
    if (!_audioCtx) {
      try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { _audioCtx = null; }
    }
    if (_audioCtx && _audioCtx.state === 'suspended') _audioCtx.resume();
    return _audioCtx;
  }

  function playTone({ freq = 880, dur = 0.18, type = 'sine', vol = 0.12 } = {}) {
    const ac = getAC(); if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(vol, ac.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(); osc.stop(ac.currentTime + dur + 0.02);
  }

  const sfx = {
    correct: () => { playTone({ freq: 660, dur: 0.12 }); setTimeout(() => playTone({ freq: 990, dur: 0.18 }), 90); },
    wrong: () => { playTone({ freq: 220, dur: 0.18, type: 'triangle' }); setTimeout(() => playTone({ freq: 170, dur: 0.22, type: 'triangle' }), 120); },
    tick: () => playTone({ freq: 520, dur: 0.06, vol: 0.06 }),
    kettle: () => {
      const ac = getAC(); if (!ac) return;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, ac.currentTime + 0.7);
      gain.gain.setValueAtTime(0.0001, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.14, ac.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.9);
      osc.connect(gain).connect(ac.destination);
      osc.start(); osc.stop(ac.currentTime + 0.95);
    },
  };

  // ── Confetti ─────────────────────────────────────────────────────
  function Confetti({ active, colors = ['#c44d27', '#5a7a3a', '#d4a25a', '#3d2818', '#e8b86f'], count = 80 }) {
    const [pieces] = React.useState(() =>
      Array.from({ length: count }).map((_, i) => ({
        i, x: Math.random() * 100,
        delay: Math.random() * 1.2,
        dur: 2.6 + Math.random() * 2.4,
        rot: Math.random() * 360,
        size: 6 + Math.random() * 8,
        color: colors[i % colors.length],
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
      }))
    );
    if (!active) return null;
    return (
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
        {pieces.map((p) => (
          <div key={p.i}
            style={{
              position: 'absolute', left: `${p.x}%`, top: '-12%',
              width: p.size, height: p.shape === 'rect' ? p.size * 0.6 : p.size,
              background: p.color,
              borderRadius: p.shape === 'circle' ? '50%' : 2,
              transform: `rotate(${p.rot}deg)`,
              animation: `chai-confetti ${p.dur}s ${p.delay}s linear forwards`,
            }} />
        ))}
        <style>{`@keyframes chai-confetti {0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(120vh) rotate(720deg);opacity:.8}}`}</style>
      </div>
    );
  }

  Object.assign(window, { sfx, Confetti });

  // ═══════════════════════════════════════════════════════════════
  // LEADERBOARD — pluggable backend (localStorage OR Firebase)
  // ═══════════════════════════════════════════════════════════════

  const LB_KEY = 'chai-quiz-leaderboard-v1';

  // In-memory cache. Source of truth for sync reads. Kept in sync with
  // whichever backend is active.
  let _cache = (() => {
    try { return JSON.parse(localStorage.getItem(LB_KEY)) || []; }
    catch (e) { return []; }
  })();

  // Subscribers (UI hooks)
  const _subs = new Set();
  function emit() { _subs.forEach((cb) => { try { cb(_cache); } catch (e) {} }); }
  function subscribeLeaderboard(cb) {
    _subs.add(cb);
    // fire once immediately so subscriber has data
    try { cb(_cache); } catch (e) {}
    return () => _subs.delete(cb);
  }

  function _persistLocal() {
    try { localStorage.setItem(LB_KEY, JSON.stringify(_cache)); } catch (e) {}
  }

  // ── Firebase backend (optional) ──────────────────────────────────
  // To enable: edit firebase-config.js with your project's config.
  let _firebase = null; // { ref } once initialized
  let _firebaseReady = false;
  let _firebasePending = []; // queue of pending writes if Firebase not yet ready

  function _initFirebase() {
    const cfg = window.FIREBASE_CONFIG;
    if (!cfg || !cfg.apiKey) return; // no config → stay in localStorage mode
    if (typeof firebase === 'undefined') {
      console.warn('[Chai Quiz] FIREBASE_CONFIG set but Firebase SDK not loaded.');
      return;
    }
    try {
      const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(cfg);
      const db = firebase.database(app);
      const lbRef = db.ref('chai-quiz/leaderboard');
      _firebase = { ref: lbRef };

      lbRef.on('value', (snap) => {
        const val = snap.val() || {};
        // Map { id: entry } → [entry] keyed by Firebase key OR entry.id
        const list = Object.keys(val).map((k) => ({ ...val[k], id: val[k].id || k, _fbKey: k }));
        _cache = list;
        _persistLocal(); // keep a local mirror for offline view
        emit();
        if (!_firebaseReady) {
          _firebaseReady = true;
          // flush queued writes
          const pending = _firebasePending; _firebasePending = [];
          pending.forEach((fn) => fn());
        }
      }, (err) => {
        console.warn('[Chai Quiz] Firebase read error:', err.message);
      });
    } catch (e) {
      console.warn('[Chai Quiz] Firebase init failed:', e.message);
    }
  }

  // Init Firebase on next tick (after firebase-config.js + SDK load)
  setTimeout(_initFirebase, 0);

  // Public API ────────────────────────────────────────────────────
  function loadLeaderboard() { return _cache.slice(); }
  function sortedLeaderboard(list = _cache) {
    return [...list].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.elapsed || 0) - (b.elapsed || 0);
    });
  }

  // Dedupe by name+class, keeping each player's BEST run
  // (highest score, then fastest time). Used by the kid-facing leaderboard
  // so one player taking the quiz 30 times doesn't clog the screen.
  // Admin view still shows every individual entry.
  function bestPerPlayer(list = _cache) {
    const byKey = new Map();
    const key = (e) => `${(e.name || '').toLowerCase().trim()}|${(e.klass || '').toLowerCase().trim()}`;
    for (const e of list) {
      const k = key(e);
      const prev = byKey.get(k);
      const better = !prev || e.score > prev.score || (e.score === prev.score && (e.elapsed || 0) < (prev.elapsed || 0));
      if (better) byKey.set(k, e);
    }
    return sortedLeaderboard(Array.from(byKey.values()));
  }

  function addEntry({ name, klass, score, total, elapsed }) {
    const entry = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      name: (name || 'Anon').slice(0, 24),
      klass: (klass || '').slice(0, 16),
      score, total, elapsed,
      ts: Date.now(),
    };
    if (_firebase) {
      const run = () => _firebase.ref.child(entry.id).set(entry)
        .catch((e) => console.warn('[Chai Quiz] addEntry remote failed:', e.message));
      _firebaseReady ? run() : _firebasePending.push(run);
      // optimistic local update
      _cache = [..._cache, entry]; _persistLocal(); emit();
    } else {
      _cache = [..._cache, entry]; _persistLocal(); emit();
    }
    return entry;
  }

  // Bulk wipe — admin only
  function clearLeaderboard() {
    const ids = _cache.map((e) => e._fbKey || e.id);
    _cache = []; _persistLocal(); emit();
    if (_firebase) {
      _firebase.ref.set(null)
        .catch((e) => console.warn('[Chai Quiz] clearLeaderboard remote failed:', e.message));
    }
  }

  // Has this player already played? (name+class match, case-insensitive)
  function hasPlayed(name, klass) {
    const n = (name || '').toLowerCase().trim();
    const k = (klass || '').toLowerCase().trim();
    return _cache.some((e) => (e.name || '').toLowerCase().trim() === n && (e.klass || '').toLowerCase().trim() === k);
  }
  function findPlayerEntry(name, klass) {
    const n = (name || '').toLowerCase().trim();
    const k = (klass || '').toLowerCase().trim();
    return _cache.find((e) => (e.name || '').toLowerCase().trim() === n && (e.klass || '').toLowerCase().trim() === k);
  }

  function deleteEntry(id) {
    const target = _cache.find((e) => e.id === id);
    _cache = _cache.filter((e) => e.id !== id);
    _persistLocal(); emit();
    if (_firebase && target) {
      const key = target._fbKey || target.id;
      _firebase.ref.child(key).remove()
        .catch((e) => console.warn('[Chai Quiz] deleteEntry remote failed:', e.message));
    }
  }

  function updateEntry(id, patch) {
    const target = _cache.find((e) => e.id === id);
    if (!target) return;
    const merged = { ...target, ...patch };
    _cache = _cache.map((e) => e.id === id ? merged : e);
    _persistLocal(); emit();
    if (_firebase) {
      const key = target._fbKey || target.id;
      // strip _fbKey before sending
      const { _fbKey, ...clean } = merged;
      _firebase.ref.child(key).set(clean)
        .catch((e) => console.warn('[Chai Quiz] updateEntry remote failed:', e.message));
    }
  }

  function isCloudMode() { return !!_firebase; }

  Object.assign(window, {
    loadLeaderboard, sortedLeaderboard, bestPerPlayer,
    addEntry, deleteEntry, updateEntry, clearLeaderboard,
    hasPlayed, findPlayerEntry,
    subscribeLeaderboard, isCloudMode,
  });

  // ── Admin auth (local only — just a kid-deterrent) ──────────────
  const ADMIN_KEY = 'chai-quiz-admin-v1';
  const DEFAULT_ADMIN = { password: 'chai' };

  function loadAdmin() {
    try {
      const raw = localStorage.getItem(ADMIN_KEY);
      return { ...DEFAULT_ADMIN, ...(raw ? JSON.parse(raw) : {}) };
    } catch (e) { return { ...DEFAULT_ADMIN }; }
  }
  function saveAdmin(a) {
    const merged = { ...loadAdmin(), ...a };
    try { localStorage.setItem(ADMIN_KEY, JSON.stringify(merged)); } catch (e) {}
    return merged;
  }
  function checkAdminPassword(pw) { return (pw || '') === loadAdmin().password; }
  Object.assign(window, { loadAdmin, saveAdmin, checkAdminPassword });
})();

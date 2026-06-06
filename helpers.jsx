// ════════════════════════════════════════════════════════════════
// CHAI QUIZ v2 — helpers
// Audio · Confetti · Class normalisation · Player records (stars per
// level) · Messaging (cheers + praise) · Admin auth.
// Backends: localStorage by default; Firebase Realtime DB if configured.
// ════════════════════════════════════════════════════════════════
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
    const osc = ac.createOscillator(); const gain = ac.createGain();
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
    star: () => { playTone({ freq: 880, dur: 0.1 }); setTimeout(() => playTone({ freq: 1320, dur: 0.14 }), 80); },
    kettle: () => {
      const ac = getAC(); if (!ac) return;
      const osc = ac.createOscillator(); const gain = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, ac.currentTime + 0.7);
      gain.gain.setValueAtTime(0.0001, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.14, ac.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.9);
      osc.connect(gain).connect(ac.destination);
      osc.start(); osc.stop(ac.currentTime + 0.95);
    },
    chime: () => { playTone({ freq: 1046, dur: 0.1, vol: 0.08 }); },
  };

  // ── Confetti ─────────────────────────────────────────────────────
  function Confetti({ active, colors = ['#c44d27', '#5a7a3a', '#d4a25a', '#3d2818', '#e8b86f'], count = 80 }) {
    const [pieces] = React.useState(() =>
      Array.from({ length: count }).map((_, i) => ({
        i, x: Math.random() * 100, delay: Math.random() * 1.2,
        dur: 2.6 + Math.random() * 2.4, rot: Math.random() * 360,
        size: 6 + Math.random() * 8, color: colors[i % colors.length],
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
      }))
    );
    if (!active) return null;
    return (
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
        {pieces.map((p) => (
          <div key={p.i} style={{
            position: 'absolute', left: `${p.x}%`, top: '-12%',
            width: p.size, height: p.shape === 'rect' ? p.size * 0.6 : p.size,
            background: p.color, borderRadius: p.shape === 'circle' ? '50%' : 2,
            transform: `rotate(${p.rot}deg)`,
            animation: `chai-confetti ${p.dur}s ${p.delay}s linear forwards`,
          }} />
        ))}
        <style>{`@keyframes chai-confetti {0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(120vh) rotate(720deg);opacity:.8}}`}</style>
      </div>
    );
  }

  Object.assign(window, { sfx, Confetti });

  // ── Class normalisation ──────────────────────────────────────────
  // "6m best class ever" → 6M ; "6 B C rules" → 6BC ; else "Other"
  function normalizeClass(raw) {
    const s = (raw || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (s.includes('6bc')) return '6BC';
    if (s.includes('6m')) return '6M';
    return 'Other';
  }
  function playerKey(name, klass) {
    const n = (name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const c = normalizeClass(klass).toLowerCase().replace(/[^a-z0-9]/g, '');
    return (n || 'anon') + '__' + (c || 'other');
  }
  Object.assign(window, { normalizeClass, playerKey });

  // ═══════════════════════════════════════════════════════════════
  // STORAGE — players + messages, localStorage with optional Firebase
  // ═══════════════════════════════════════════════════════════════
  const PLAYERS_KEY = 'chai-quiz-players-v2';
  const MSG_KEY = 'chai-quiz-messages-v2';
  const CONTROL_KEY = 'chai-quiz-control-v2';
  const DEFAULT_CONTROL = { frozen: false, freezeMsg: '', musicEnabled: false, track: 'custom', customUrl: '', customName: '', unlockAllTs: 0, unlockKeys: {}, forceTheme: '', bans: {}, appVersion: '' };

  let _players = (() => { try { return JSON.parse(localStorage.getItem(PLAYERS_KEY)) || {}; } catch (e) { return {}; } })();
  let _messages = (() => { try { return JSON.parse(localStorage.getItem(MSG_KEY)) || []; } catch (e) { return []; } })();
  let _control = (() => { try { return { ...DEFAULT_CONTROL, ...(JSON.parse(localStorage.getItem(CONTROL_KEY)) || {}) }; } catch (e) { return { ...DEFAULT_CONTROL }; } })();

  const _playerSubs = new Set();
  const _msgSubs = new Set();
  const _ctrlSubs = new Set();
  function emitPlayers() { const arr = sortedPlayers(); _playerSubs.forEach((cb) => { try { cb(arr); } catch (e) {} }); }
  function emitMessages() { _msgSubs.forEach((cb) => { try { cb(_messages.slice()); } catch (e) {} }); }
  function emitControl() { _ctrlSubs.forEach((cb) => { try { cb({ ..._control }); } catch (e) {} }); }
  function _persistPlayers() { try { localStorage.setItem(PLAYERS_KEY, JSON.stringify(_players)); } catch (e) {} }
  function _persistMessages() { try { localStorage.setItem(MSG_KEY, JSON.stringify(_messages)); } catch (e) {} }
  function _persistControl() { try { localStorage.setItem(CONTROL_KEY, JSON.stringify(_control)); } catch (e) {} }

  // ── Firebase ──────────────────────────────────────────────────
  let _fb = null; // { players, messages } refs
  let _fbReady = false;

  function _initFirebase() {
    const cfg = window.FIREBASE_CONFIG;
    if (!cfg || !cfg.apiKey) return;
    if (typeof firebase === 'undefined') { console.warn('[Chai Quiz] Firebase config set but SDK not loaded.'); return; }
    try {
      const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(cfg);
      const db = firebase.database(app);
      const playersRef = db.ref('chai-quiz/v2/players');
      const messagesRef = db.ref('chai-quiz/v2/messages');
      const controlRef = db.ref('chai-quiz/v2/control');
      _fb = { players: playersRef, messages: messagesRef, control: controlRef };

      let firstPlayers = true;
      playersRef.on('value', (snap) => {
        const val = snap.val() || {};
        if (firstPlayers) {
          firstPlayers = false;
          // Migrate any local-only players up to the cloud once.
          const localOnly = Object.keys(_players).filter((k) => !val[k]);
          if (localOnly.length) {
            const updates = {};
            localOnly.forEach((k) => { updates[k] = _players[k]; });
            playersRef.update(updates).catch((e) => console.warn('[Chai Quiz] player migrate failed:', e.message));
          }
        }
        _players = val;
        _persistPlayers(); emitPlayers();
        if (!_fbReady) _fbReady = true;
      }, (e) => console.warn('[Chai Quiz] players read error:', e.message));

      messagesRef.limitToLast(80).on('value', (snap) => {
        const val = snap.val() || {};
        _messages = Object.keys(val).map((k) => ({ ...val[k], id: val[k].id || k }));
        _messages.sort((a, b) => (a.ts || 0) - (b.ts || 0));
        _persistMessages(); emitMessages();
      }, (e) => console.warn('[Chai Quiz] messages read error:', e.message));

      let firstControl = true;
      controlRef.on('value', (snap) => {
        const val = snap.val();
        if (firstControl) {
          firstControl = false;
          // If cloud has no control yet, seed it from local defaults.
          if (!val) { controlRef.set(_control).catch(() => {}); return; }
        }
        if (val) { _control = { ...DEFAULT_CONTROL, ...val }; _persistControl(); emitControl(); }
      }, (e) => console.warn('[Chai Quiz] control read error:', e.message));
    } catch (e) {
      console.warn('[Chai Quiz] Firebase init failed:', e.message);
    }
  }
  setTimeout(_initFirebase, 0);
  function isCloudMode() { return !!_fb; }

  // ── Player derived helpers ────────────────────────────────────
  function playerTotals(rec) {
    const levels = rec.levels || {};
    let stars = 0, correct = 0, elapsed = 0, done = 0;
    Object.keys(levels).forEach((lid) => {
      const l = levels[lid] || {};
      stars += l.stars || 0; correct += l.correct || 0; elapsed += l.elapsed || 0; done += 1;
    });
    return { stars, correct, elapsed, done };
  }
  function withTotals(rec) { return { ...rec, ...playerTotals(rec) }; }

  function sortedPlayers(klass) {
    let arr = Object.keys(_players).map((k) => withTotals({ ..._players[k], key: k }));
    if (klass && klass !== 'All') arr = arr.filter((p) => p.klass === klass);
    arr.sort((a, b) => {
      if (b.stars !== a.stars) return b.stars - a.stars;
      return (a.elapsed || 0) - (b.elapsed || 0);
    });
    return arr;
  }

  function getPlayer(name, klass) {
    const key = playerKey(name, klass);
    return _players[key] ? withTotals({ ..._players[key], key }) : null;
  }
  function getPlayerByKey(key) {
    return _players[key] ? withTotals({ ..._players[key], key }) : null;
  }

  // Save a level result, keeping the player's BEST run for that level.
  function recordLevel(name, klass, levelId, { stars, correct, elapsed }) {
    const key = playerKey(name, klass);
    const existing = _players[key] || {
      key, name: (name || 'Anon').slice(0, 24), klass: normalizeClass(klass),
      levels: {}, ts: Date.now(),
    };
    const prev = (existing.levels || {})[levelId];
    const better = !prev || stars > prev.stars || (stars === prev.stars && elapsed < prev.elapsed);
    const nextLevels = { ...(existing.levels || {}) };
    if (better) nextLevels[levelId] = { stars, correct, elapsed };
    const rec = { ...existing, name: (name || 'Anon').slice(0, 24), klass: normalizeClass(klass), levels: nextLevels, ts: Date.now() };
    _players = { ..._players, [key]: rec };
    _persistPlayers(); emitPlayers();
    if (_fb) _fb.players.child(key).set(rec).catch((e) => console.warn('[Chai Quiz] recordLevel remote failed:', e.message));
    return withTotals({ ...rec, key });
  }

  // Highest unlocked level number for a player (1-based). Level n unlocks
  // when level n-1 has been completed.
  function unlockedThrough(name, klass) {
    const rec = _players[playerKey(name, klass)];
    if (!rec || !rec.levels) return 1;
    let maxDone = 0;
    window.CHAI_LEVELS.forEach((lv) => { if (rec.levels[lv.id]) maxDone = Math.max(maxDone, lv.n); });
    return Math.min(window.CHAI_TOTAL_LEVELS, maxDone + 1);
  }

  function deletePlayer(key) {
    const next = { ..._players }; delete next[key]; _players = next;
    _persistPlayers(); emitPlayers();
    if (_fb) _fb.players.child(key).remove().catch((e) => console.warn('[Chai Quiz] deletePlayer remote failed:', e.message));
  }
  function clearAllPlayers() {
    _players = {}; _persistPlayers(); emitPlayers();
    if (_fb) _fb.players.set(null).catch((e) => console.warn('[Chai Quiz] clearAllPlayers remote failed:', e.message));
  }
  // Admin: overwrite a player's level stars/time (e.g. fix a cheat)
  function adminSetLevel(key, levelId, patch) {
    const rec = _players[key]; if (!rec) return;
    const levels = { ...(rec.levels || {}) };
    levels[levelId] = { ...(levels[levelId] || { stars: 0, correct: 0, elapsed: 0 }), ...patch };
    const next = { ...rec, levels };
    _players = { ..._players, [key]: next };
    _persistPlayers(); emitPlayers();
    if (_fb) _fb.players.child(key).set(next).catch((e) => console.warn('[Chai Quiz] adminSetLevel remote failed:', e.message));
  }

  function subscribePlayers(cb) { _playerSubs.add(cb); try { cb(sortedPlayers()); } catch (e) {} return () => _playerSubs.delete(cb); }

  Object.assign(window, {
    sortedPlayers, getPlayer, getPlayerByKey, recordLevel, unlockedThrough,
    deletePlayer, clearAllPlayers, adminSetLevel, subscribePlayers, playerTotals,
    isCloudMode,
  });

  // ── Messaging ─────────────────────────────────────────────────
  function _newId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return Date.now() + '-' + Math.random().toString(36).slice(2, 12);
  }
  // toType: 'all' | 'class' | 'player' ; kind: 'cheer' | 'praise'
  function sendMessage({ fromName, fromClass, toType, toKey, text, kind }) {
    const msg = {
      id: _newId(),
      fromName: (fromName || 'Someone').slice(0, 24),
      fromClass: normalizeClass(fromClass),
      toType: toType || 'all',
      toKey: toKey || '',
      text: (text || '').slice(0, 120),
      kind: kind || 'cheer',
      ts: Date.now(),
    };
    _messages = [..._messages, msg].slice(-80);
    _persistMessages(); emitMessages();
    if (_fb) _fb.messages.child(msg.id).set(msg).catch((e) => console.warn('[Chai Quiz] sendMessage failed:', e.message));
    return msg;
  }
  function deleteMessage(id) {
    _messages = _messages.filter((m) => m.id !== id);
    _persistMessages(); emitMessages();
    if (_fb) _fb.messages.child(id).remove().catch((e) => console.warn('[Chai Quiz] deleteMessage failed:', e.message));
  }
  function clearMessages() {
    _messages = []; _persistMessages(); emitMessages();
    if (_fb) _fb.messages.set(null).catch((e) => console.warn('[Chai Quiz] clearMessages failed:', e.message));
  }
  // Messages visible to a given player (their own + their class + all)
  function messagesFor(name, klass) {
    const key = playerKey(name, klass);
    const cls = normalizeClass(klass);
    return _messages.filter((m) =>
      m.toType === 'all' ||
      (m.toType === 'class' && m.toKey === cls) ||
      (m.toType === 'player' && m.toKey === key)
    );
  }
  function subscribeMessages(cb) { _msgSubs.add(cb); try { cb(_messages.slice()); } catch (e) {} return () => _msgSubs.delete(cb); }

  Object.assign(window, { sendMessage, deleteMessage, clearMessages, messagesFor, subscribeMessages });

  // ── Admin auth (local only — kid-deterrent) ───────────────────
  const ADMIN_KEY = 'chai-quiz-admin-v1';
  const DEFAULT_ADMIN = { password: 'chai' };
  function loadAdmin() { try { const r = localStorage.getItem(ADMIN_KEY); return { ...DEFAULT_ADMIN, ...(r ? JSON.parse(r) : {}) }; } catch (e) { return { ...DEFAULT_ADMIN }; } }
  function saveAdmin(a) { const m = { ...loadAdmin(), ...a }; try { localStorage.setItem(ADMIN_KEY, JSON.stringify(m)); } catch (e) {} return m; }
  function checkAdminPassword(pw) { return (pw || '') === loadAdmin().password; }
  Object.assign(window, { loadAdmin, saveAdmin, checkAdminPassword });

  // ── Global control (freeze + music) ───────────────────────────
  function getControl() { return { ..._control }; }
  function setControl(patch) {
    _control = { ..._control, ...patch };
    _persistControl(); emitControl();
    if (_fb) _fb.control.set(_control).catch((e) => console.warn('[Chai Quiz] setControl remote failed:', e.message));
    return { ..._control };
  }
  function subscribeControl(cb) { _ctrlSubs.add(cb); try { cb({ ..._control }); } catch (e) {} return () => _ctrlSubs.delete(cb); }

  // Ban a player by key for N seconds (default 10). Synced to all devices.
  function banPlayer(key, seconds = 10) {
    if (!key) return;
    const bans = { ..._control.bans };
    // prune expired entries while we're here
    const now = Date.now();
    Object.keys(bans).forEach((k) => { if (!bans[k] || bans[k] < now) delete bans[k]; });
    bans[key] = now + seconds * 1000;
    setControl({ bans });
  }
  function isBanned(key) {
    const exp = _control.bans && _control.bans[key];
    return exp && exp > Date.now() ? exp : 0;
  }
  Object.assign(window, { getControl, setControl, subscribeControl, banPlayer, isBanned });

  // ── Master ("all-might") auth — separate secret, only the owner knows
  const MASTER_KEY = 'chai-quiz-master-v1';
  const DEFAULT_MASTER = { password: 'godchai' };
  function loadMaster() { try { const r = localStorage.getItem(MASTER_KEY); return { ...DEFAULT_MASTER, ...(r ? JSON.parse(r) : {}) }; } catch (e) { return { ...DEFAULT_MASTER }; } }
  function saveMaster(a) { const m = { ...loadMaster(), ...a }; try { localStorage.setItem(MASTER_KEY, JSON.stringify(m)); } catch (e) {} return m; }
  function checkMasterPassword(pw) { return (pw || '') === loadMaster().password; }
  Object.assign(window, { loadMaster, saveMaster, checkMasterPassword });

  // ── Device lock — one laptop = one player (anti-cheat) ─────────
  // Locks live in each laptop's localStorage. God-mode frees them remotely
  // by broadcasting unlock signals through the synced control object:
  //   control.unlockAllTs       — any laptop locked before this frees itself
  //   control.unlockKeys[key]   — the laptop bound to that player frees itself
  const DEVICE_KEY = 'chai-quiz-device-v1';
  function getDeviceLock() { try { return JSON.parse(localStorage.getItem(DEVICE_KEY)) || null; } catch (e) { return null; } }
  function setDeviceLock(name, klass) {
    const v = { key: playerKey(name, klass), name: (name || '').trim().slice(0, 24), klass: normalizeClass(klass), ts: Date.now() };
    try { localStorage.setItem(DEVICE_KEY, JSON.stringify(v)); } catch (e) {}
    return v;
  }
  function clearDeviceLock() { try { localStorage.removeItem(DEVICE_KEY); } catch (e) {} }

  // Called whenever control changes — frees THIS laptop if god-mode asked.
  // Returns true if it just unlocked (so the UI can react).
  function applyRemoteUnlocks(control) {
    const lock = getDeviceLock();
    if (!lock) return false;
    const lockTs = lock.ts || 0;
    const c = control || (typeof getControl === 'function' ? getControl() : {});
    if (c.unlockAllTs && c.unlockAllTs > lockTs) { clearDeviceLock(); return true; }
    const byKey = c.unlockKeys && c.unlockKeys[lock.key];
    if (byKey && byKey > lockTs) { clearDeviceLock(); return true; }
    return false;
  }

  // God-mode triggers (write to synced control)
  function freeAllLaptops() { return setControl({ unlockAllTs: Date.now() }); }
  function freeLaptopFor(key) {
    const cur = getControl();
    const next = { ...(cur.unlockKeys || {}), [key]: Date.now() };
    return setControl({ unlockKeys: next });
  }

  Object.assign(window, { getDeviceLock, setDeviceLock, clearDeviceLock, applyRemoteUnlocks, freeAllLaptops, freeLaptopFor });

  // ── Personal "time machine" version (per device) ──────────────
  // '' = latest. Admin can override everyone via control.appVersion.
  const VERSION_KEY = 'chai-quiz-version-v1';
  function getLocalVersion() { try { return localStorage.getItem(VERSION_KEY) || ''; } catch (e) { return ''; } }
  function setLocalVersion(v) {
    try { v ? localStorage.setItem(VERSION_KEY, v) : localStorage.removeItem(VERSION_KEY); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('chai-version', { detail: v || '' })); } catch (e) {}
  }
  Object.assign(window, { getLocalVersion, setLocalVersion });
})();

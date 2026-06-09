// ════════════════════════════════════════════════════════════════
// CHAI QUIZ v2 — control & music
// Synth music engine (window.chaiMusic) + secret Master ("all-might")
// panel + global Freeze overlay + floating music button.
// Exposes window.SBMaster = { MasterPanel, FreezeOverlay, MusicButton }.
// ════════════════════════════════════════════════════════════════
(function () {
  const { useState, useEffect } = React;

  // ─── Music engine — 2 real tracks: Rock + Scary Cave ──────────
  // Original compositions (no copyrighted songs / Minecraft sounds).
  const chaiMusic = (function () {
    let ac = null, master = null, timer = null, step = 0;
    let track = 'custom', muted = false, playing = false;
    let mode = 'synth', customUrl = '', audioEl = null;
    let NB = null;                 // noise buffer
    let live = [];                 // persistent nodes (drones, wind) to stop on track change
    let caveDelay = null;          // shared echo for cave pings

    function ensureCtx() {
      if (!ac) {
        try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; return; }
        master = ac.createGain();
        master.gain.value = muted ? 0 : 0.9;
        master.connect(ac.destination);
        const len = Math.floor(ac.sampleRate * 1.2);
        NB = ac.createBuffer(1, len, ac.sampleRate);
        const d = NB.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ac.state === 'suspended') ac.resume();
    }

    // distortion curve for the rock guitar
    function distCurve(k) {
      const n = 1024, c = new Float32Array(n);
      for (let i = 0; i < n; i++) { const x = (i * 2) / n - 1; c[i] = ((3 + k) * x * 20 * Math.PI) / 180 / (Math.PI + k * Math.abs(x)); }
      return c;
    }

    // ── drum hits ──
    function kick(when, vol = 1) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(150, when);
      o.frequency.exponentialRampToValueAtTime(45, when + 0.13);
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(0.9 * vol, when + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.2);
      o.connect(g).connect(master); o.start(when); o.stop(when + 0.22);
    }
    function snare(when, vol = 1) {
      const n = ac.createBufferSource(); n.buffer = NB;
      const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1400;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.55 * vol, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.17);
      n.connect(f).connect(g).connect(master); n.start(when); n.stop(when + 0.2);
    }
    function hat(when, open) {
      const n = ac.createBufferSource(); n.buffer = NB;
      const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7500;
      const g = ac.createGain(); const dcy = open ? 0.14 : 0.045;
      g.gain.setValueAtTime(0.22, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + dcy);
      n.connect(f).connect(g).connect(master); n.start(when); n.stop(when + dcy + 0.03);
    }

    // ── rock guitar power chord (root + fifth, distorted) ──
    let guitarBus = null;
    function ensureGuitarBus() {
      if (guitarBus) return guitarBus;
      const ws = ac.createWaveShaper(); ws.curve = distCurve(8); ws.oversample = '4x';
      const tone = ac.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 2600;
      const g = ac.createGain(); g.gain.value = 0.16;
      ws.connect(tone).connect(g).connect(master);
      guitarBus = ws; return ws;
    }
    function chord(root, when, dur) {
      const bus = ensureGuitarBus();
      [1, 1.4983, 2].forEach((mult) => {
        const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = root * mult;
        const g = ac.createGain();
        g.gain.setValueAtTime(0.0001, when);
        g.gain.linearRampToValueAtTime(0.9, when + 0.008);
        g.gain.setValueAtTime(0.9, when + dur * 0.7);
        g.gain.exponentialRampToValueAtTime(0.02, when + dur);
        o.connect(g).connect(bus); o.start(when); o.stop(when + dur + 0.02);
      });
    }
    function bassNote(root, when, dur) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'triangle'; o.frequency.value = root / 2;
      g.gain.setValueAtTime(0.0001, when);
      g.gain.linearRampToValueAtTime(0.5, when + 0.01);
      g.gain.exponentialRampToValueAtTime(0.01, when + dur);
      o.connect(g).connect(master); o.start(when); o.stop(when + dur + 0.02);
    }

    // ROCK riff (16 sixteenth steps). Roots in Hz (E-based power riff).
    const E2 = 82.41, G2 = 98.0, A2 = 110.0, D2 = 73.42, C3 = 130.81;
    const ROCK_CHORDS = { 0: E2, 4: E2, 6: G2, 8: A2, 11: G2, 12: E2, 14: D2 };
    function rockStep(i, when, sixteenth) {
      // drums
      if (i % 4 === 0) kick(when);
      if (i === 6 || i === 14) kick(when, 0.7);
      if (i === 4 || i === 12) snare(when);
      hat(when, i % 4 === 2);
      // guitar + bass
      if (ROCK_CHORDS[i]) { const r = ROCK_CHORDS[i]; chord(r, when, sixteenth * 2.1); bassNote(r, when, sixteenth * 2); }
    }

    // ── scary cave ambience ──
    function startCave() {
      // echo for pings
      caveDelay = ac.createDelay(); caveDelay.delayTime.value = 0.33;
      const fb = ac.createGain(); fb.gain.value = 0.42;
      const wet = ac.createGain(); wet.gain.value = 0.5;
      caveDelay.connect(fb).connect(caveDelay); caveDelay.connect(wet).connect(master);
      live.push(caveDelay, fb, wet);
      // low drones (detuned)
      [41.2, 54.95, 55.5].forEach((f, idx) => {
        const o = ac.createOscillator(); o.type = idx === 0 ? 'sine' : 'triangle'; o.frequency.value = f;
        const g = ac.createGain(); g.gain.value = 0.0001;
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320;
        o.connect(g).connect(lp).connect(master); o.start();
        // slow swell LFO
        const lfo = ac.createOscillator(); lfo.frequency.value = 0.05 + idx * 0.03;
        const lg = ac.createGain(); lg.gain.value = 0.06;
        lfo.connect(lg).connect(g.gain); lfo.start();
        g.gain.setValueAtTime(0.0001, ac.currentTime);
        g.gain.linearRampToValueAtTime(0.09, ac.currentTime + 3);
        live.push(o, lfo);
      });
      // wind: filtered noise, slowly modulated
      const wind = ac.createBufferSource(); wind.buffer = NB; wind.loop = true;
      const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 480; bp.Q.value = 0.7;
      const wg = ac.createGain(); wg.gain.value = 0.03;
      const wlfo = ac.createOscillator(); wlfo.frequency.value = 0.08;
      const wlg = ac.createGain(); wlg.gain.value = 0.025;
      wlfo.connect(wlg).connect(wg.gain);
      wind.connect(bp).connect(wg).connect(master); wind.start(); wlfo.start();
      live.push(wind, wlfo);
    }
    function cavePing(when) {
      const o = ac.createOscillator(); o.type = 'sine';
      const f = 520 + Math.random() * 900;
      o.frequency.setValueAtTime(f, when);
      o.frequency.exponentialRampToValueAtTime(f * 0.94, when + 1.2);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(0.16, when + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 1.6);
      o.connect(g); g.connect(master); if (caveDelay) g.connect(caveDelay);
      o.start(when); o.stop(when + 1.7);
    }
    function caveGroan(when) {
      const o = ac.createOscillator(); o.type = 'sawtooth';
      const f = 70 + Math.random() * 60;
      o.frequency.setValueAtTime(f, when);
      o.frequency.linearRampToValueAtTime(f * 0.8, when + 1.4);
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, when);
      g.gain.linearRampToValueAtTime(0.12, when + 0.5);
      g.gain.exponentialRampToValueAtTime(0.001, when + 1.6);
      o.connect(lp).connect(g).connect(master); o.start(when); o.stop(when + 1.7);
    }
    function caveStep(when) {
      const r = Math.random();
      if (r < 0.22) cavePing(when + Math.random() * 0.2);
      else if (r < 0.32) caveGroan(when);
      // sometimes a distant "block" knock
      if (Math.random() < 0.12) { const k = when + 0.15; kick(k, 0.25); }
    }

    function clearLive() {
      live.forEach((n) => { try { n.stop ? n.stop() : n.disconnect(); } catch (e) {} });
      live = []; caveDelay = null;
    }

    function tick() {
      if (!ac) return;
      const when = ac.currentTime + 0.05;
      // Only the creepy cave is a synth track now (custom songs use <audio>).
      caveStep(when); step++;
    }

    function schedule() {
      clearInterval(timer);
      timer = setInterval(tick, 430);
    }

    function ensureAudio(url) {
      if (!audioEl) { audioEl = new Audio(); audioEl.loop = true; audioEl.volume = 0.6; audioEl.crossOrigin = 'anonymous'; }
      if (audioEl.src !== url) audioEl.src = url;
    }

    function startSynth() {
      clearLive();
      startCave();
      step = 0; schedule();
    }

    return {
      start() {
        ensureCtx(); if (!ac) return;
        playing = true;
        if (master) master.gain.value = muted ? 0 : 0.9;
        if (mode === 'custom' && customUrl) {
          clearInterval(timer); timer = null; clearLive();
          ensureAudio(customUrl);
          if (audioEl) { audioEl.muted = muted; const p = audioEl.play(); if (p && p.catch) p.catch(() => {}); }
        } else {
          // No link set → nothing plays (built-in synth tracks removed).
          clearInterval(timer); timer = null; clearLive();
          if (audioEl) audioEl.pause();
        }
      },
      stop() { playing = false; clearInterval(timer); timer = null; clearLive(); if (audioEl) audioEl.pause(); },
      isPlaying() { return playing; },
      setTrack(t) {
        track = t; mode = (t === 'custom') ? 'custom' : 'synth';
        if (playing) this.start();
      },
      setCustom(url) { customUrl = url || ''; if (mode === 'custom' && playing) this.start(); },
      getTrack() { return track; },
      setMuted(b) { muted = b; if (master) master.gain.value = b ? 0 : 0.9; if (audioEl) audioEl.muted = b; },
      isMuted() { return muted; },
      preview(t, url) {
        ensureCtx(); if (!ac) return;
        if (t === 'custom') {
          if (url) { ensureAudio(url); audioEl.muted = false; const p = audioEl.play(); if (p && p.catch) p.catch(() => {}); setTimeout(() => { if (mode !== 'custom' || !playing) audioEl && audioEl.pause(); }, 4500); }
          return;
        }
        // creepy cave audition
        const now = ac.currentTime;
        cavePing(now + 0.05); caveGroan(now + 0.5); cavePing(now + 1.4);
      },
    };
  })();
  window.chaiMusic = chaiMusic;

  const TRACK_LABELS = {};
  const TRACK_GROUPS = [];

  // ─── Floating music button (everyone, when music enabled) ─────
  function MusicButton({ P, m }) {
    const [muted, setMuted] = useState(() => localStorage.getItem('chai-quiz-music-muted') === '1');
    // keep engine in sync on mount
    useEffect(() => {
      chaiMusic.setMuted(muted);
      if (!muted) chaiMusic.start();
    }, []);
    const toggle = () => {
      const next = !muted;
      setMuted(next);
      localStorage.setItem('chai-quiz-music-muted', next ? '1' : '0');
      chaiMusic.setMuted(next);
      if (next) {
        chaiMusic.stop();           // mute = silence it fully
      } else {
        chaiMusic.setMuted(false);
        chaiMusic.start();          // unmute = (re)start the loop
      }
    };
    return (
      <button onClick={toggle} title={muted ? 'Turn music on' : 'Turn music off'} style={{
        position: 'fixed', bottom: 14, right: 14, zIndex: 200,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: m ? '0 14px' : '0 16px', height: m ? 48 : 54,
        borderRadius: 999,
        background: muted ? '#fff' : P.accent, color: muted ? P.ink : '#fff',
        border: `3px solid ${P.ink}`, boxShadow: `0 4px 0 ${P.ink}`,
        fontSize: m ? 18 : 22, cursor: 'pointer', fontFamily: 'inherit',
        fontWeight: 900, touchAction: 'manipulation',
      }}>
        <span>{muted ? '🔇' : '🎵'}</span>
        <span style={{ fontSize: m ? 13 : 14 }}>{muted ? 'Music off' : 'Music on'}</span>
      </button>
    );
  }

  // ─── Global freeze overlay (every device) ─────────────────────
  function FreezeOverlay({ P, m, control }) {
    if (!control.frozen) return null;
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 800,
        background: 'rgba(20,12,6,0.86)', color: '#fdf3dc',
        display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24,
        fontFamily: '"Nunito", sans-serif',
      }}>
        <div style={{ animation: 'sb-pop 400ms ease-out both' }}>
          <div style={{ fontSize: m ? 72 : 110, marginBottom: 10 }}>⏸️</div>
          <h1 style={{ fontFamily: '"Fraunces", serif', fontSize: m ? 40 : 64, fontWeight: 900, margin: '0 0 10px', color: '#fff' }}>
            Pencils down!
          </h1>
          <p style={{ fontSize: m ? 17 : 22, fontWeight: 700, opacity: 0.9, maxWidth: 520, margin: '0 auto' }}>
            {control.freezeMsg && control.freezeMsg.trim()
              ? control.freezeMsg
              : 'MC aayansh has paused the quiz. Look up here for a sec! 👀'}
          </p>
          <div style={{ marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(255,255,255,0.12)', borderRadius: 999, fontSize: m ? 13 : 15, fontWeight: 800 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff8b6a', boxShadow: '0 0 0 4px rgba(255,139,106,0.25)' }} />
            Paused · please wait
          </div>
        </div>
      </div>
    );
  }

  // ─── Ban overlay (a playful 10-second lockout for one player) ──
  function BanOverlay({ P, m, until }) {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
      const t = setInterval(() => setNow(Date.now()), 200);
      return () => clearInterval(t);
    }, []);
    const left = Math.max(0, Math.ceil((until - now) / 1000));
    if (left <= 0) return null;
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 850,
        background: 'rgba(40,8,4,0.92)', color: '#fff',
        display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24,
        fontFamily: '"Nunito", sans-serif',
      }}>
        <div style={{ animation: 'sb-pop 300ms ease-out both' }}>
          <div style={{ fontSize: m ? 80 : 120, marginBottom: 6 }}>🚫</div>
          <h1 style={{ fontFamily: '"Fraunces", serif', fontSize: m ? 36 : 56, fontWeight: 900, margin: '0 0 8px' }}>Banned!</h1>
          <p style={{ fontSize: m ? 16 : 20, fontWeight: 800, opacity: 0.9, margin: '0 0 16px' }}>A master zapped you. Sit tight…</p>
          <div style={{
            display: 'inline-grid', placeItems: 'center',
            width: m ? 96 : 120, height: m ? 96 : 120, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)', border: '4px solid #ff8b6a',
            fontFamily: '"Fraunces", serif', fontSize: m ? 44 : 58, fontWeight: 900,
          }}>{left}</div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // MASTER PANEL — the "all-might" room. Opened by the secret word.
  // ═══════════════════════════════════════════════════════════════
  function MasterPanel({ P, m, onClose }) {
    const [authed, setAuthed] = useState(false);
    const [pw, setPw] = useState('');
    const [err, setErr] = useState('');
    const tryLogin = (e) => { e && e.preventDefault(); if (window.checkMasterPassword(pw.trim())) { setAuthed(true); setErr(''); } else setErr('Wrong master code.'); };
    useEffect(() => { const h = (e) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);

    const GOLD = '#f6c25a';
    return (
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(8,4,2,0.82)', display: 'grid', placeItems: 'center', zIndex: 1000, padding: 12 }}>
        <div onClick={(e) => e.stopPropagation()} style={{
          width: '100%', maxWidth: 640, maxHeight: '92vh', overflowY: 'auto',
          background: 'linear-gradient(180deg, #1a0f0a, #0d0704)', color: '#fdf3dc',
          border: `4px solid ${GOLD}`, borderRadius: 24,
          boxShadow: `0 0 0 1px ${GOLD}55, 0 30px 90px rgba(0,0,0,0.8), inset 0 0 60px ${GOLD}11`,
          fontFamily: '"Nunito", sans-serif',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: m ? '16px 18px' : '22px 28px', borderBottom: `2px solid ${GOLD}44` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: m ? 30 : 40 }}>⚡</div>
              <div>
                <div style={{ fontSize: m ? 10 : 12, letterSpacing: '0.3em', color: GOLD, fontWeight: 900, textTransform: 'uppercase' }}>Secret · Owner Only</div>
                <h2 style={{ fontFamily: '"Fraunces", serif', fontSize: m ? 26 : 34, margin: '2px 0 0', fontWeight: 900, color: '#fff' }}>All-Might Control</h2>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: '50%', background: 'transparent', color: GOLD, border: `2px solid ${GOLD}66`, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
          </div>

          <div style={{ padding: m ? '18px' : '26px 28px 30px' }}>
            {!authed ? (
              <form onSubmit={tryLogin}>
                <div style={{ fontSize: m ? 13 : 14, color: '#fdf3dcaa', marginBottom: 16, lineHeight: 1.5 }}>
                  You found the secret room. 🤫 Enter the <strong style={{ color: GOLD }}>master code</strong> to take command.
                </div>
                <input type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Master code"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', background: '#000', color: GOLD, border: `2px solid ${GOLD}66`, borderRadius: 12, fontSize: 18, fontWeight: 800, letterSpacing: '0.2em', outline: 'none', fontFamily: 'inherit' }} />
                {err && <div style={{ marginTop: 8, color: '#ff8b6a', fontSize: 13, fontWeight: 800 }}>{err}</div>}
                <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                  <button type="submit" style={goldBtn(GOLD, m)}>⚡ Enter</button>
                  <button type="button" onClick={onClose} style={ghostBtn(m)}>Leave</button>
                </div>
                <div style={{ marginTop: 16, fontSize: 12, opacity: 0.5 }}>Default master code: <code style={{ background: '#000', padding: '2px 6px', borderRadius: 4, color: GOLD }}>godchai</code> — change it below once in.</div>
              </form>
            ) : <MasterBody P={P} m={m} GOLD={GOLD} />}
          </div>
        </div>
      </div>
    );
  }

  function MasterBody({ P, m, GOLD }) {
    const [control, setControl] = useState(() => window.getControl());
    const [freezeMsg, setFreezeMsg] = useState(control.freezeMsg || '');
    const [customUrl, setCustomUrl] = useState(control.customUrl || '');
    const [customName, setCustomName] = useState(control.customName || '');
    const [pwNew, setPwNew] = useState('');
    const [pwSaved, setPwSaved] = useState(false);
    const [deviceReset, setDeviceReset] = useState(false);
    const [allReset, setAllReset] = useState(false);
    useEffect(() => { const u = window.subscribeControl(setControl); return u; }, []);
    const cloud = window.isCloudMode && window.isCloudMode();
    const lock = window.getDeviceLock();

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: m ? 18 : 22 }}>
        <div style={{ padding: '8px 12px', borderRadius: 10, background: cloud ? '#16240f' : '#241409', border: `1px solid ${cloud ? '#9fc972' : GOLD + '44'}`, fontSize: 12.5, fontWeight: 800, color: cloud ? '#cfeab2' : '#fdf3dc', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 16 }}>{cloud ? '☁️' : '💾'}</span>
          {cloud ? 'Powers reach every device instantly.' : 'Local only — connect Firebase to control all devices.'}
        </div>

        {/* FREEZE */}
        <section>
          <div style={mTitle(GOLD)}>🛑 Stop Everyone</div>
          <div style={mCard(GOLD)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: m ? 16 : 18, color: '#fff' }}>{control.frozen ? 'Quiz is PAUSED' : 'Quiz is running'}</div>
                <div style={{ fontSize: 12.5, opacity: 0.7, marginTop: 2 }}>Freezes every player's screen at once.</div>
              </div>
              <button onClick={() => window.setControl({ frozen: !control.frozen, freezeMsg })} style={{
                padding: m ? '12px 18px' : '14px 24px', borderRadius: 999,
                background: control.frozen ? '#9fc972' : '#c0392b', color: '#fff',
                border: `2px solid ${control.frozen ? '#cfeab2' : '#ff8b6a'}`,
                fontWeight: 900, fontSize: m ? 14 : 16, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}>{control.frozen ? '▶ Resume' : '⏸ Freeze all'}</button>
            </div>
            <input value={freezeMsg} onChange={(e) => setFreezeMsg(e.target.value)} onBlur={() => control.frozen && window.setControl({ freezeMsg })}
              placeholder="Optional message shown on the pause screen…"
              style={{ width: '100%', boxSizing: 'border-box', marginTop: 10, padding: '10px 12px', background: '#000', color: '#fdf3dc', border: `2px solid ${GOLD}44`, borderRadius: 8, fontSize: 14, fontWeight: 700, outline: 'none', fontFamily: 'inherit' }} />
          </div>
        </section>

        {/* FORCE APPEARANCE — temporarily lock everyone to light or dark */}
        <section>
          <div style={mTitle(GOLD)}>🎭 Force appearance</div>
          <div style={mCard(GOLD)}>
            <div style={{ fontSize: 12.5, opacity: 0.75, marginBottom: 10, lineHeight: 1.5 }}>
              Temporarily lock <strong>every player's</strong> screen to Light or Dark. Their own toggle is disabled until you choose “Let them pick”.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { key: 'light', label: '☀️ Light' },
                { key: 'dark', label: '🌙 Dark' },
                { key: '', label: '🔓 Let them pick' },
              ].map((opt) => {
                const active = (control.forceTheme || '') === opt.key;
                return (
                  <button key={opt.key || 'free'} onClick={() => window.setControl({ forceTheme: opt.key })} style={{
                    padding: m ? '11px 8px' : '12px 10px', borderRadius: 12,
                    background: active ? GOLD : '#3a2418', color: active ? '#1a0f0a' : '#fdf3dc',
                    border: `2px solid ${GOLD}66`, fontWeight: 900, fontSize: m ? 12 : 13.5,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>{opt.label}</button>
                );
              })}
            </div>
            <div style={{ marginTop: 8, fontSize: 11.5, opacity: 0.55 }}>
              Now: <strong style={{ color: GOLD }}>{control.forceTheme === 'dark' ? 'Forced Dark' : control.forceTheme === 'light' ? 'Forced Light' : 'Players choose freely'}</strong>
            </div>
          </div>
        </section>

        {/* TIME MACHINE — send the whole class to a version */}
        <section>
          <div style={mTitle(GOLD)}>🕰️ Time machine</div>
          <div style={mCard(GOLD)}>
            <div style={{ fontSize: 12.5, opacity: 0.75, marginBottom: 10, lineHeight: 1.5 }}>
              Send <strong>every player</strong> back to an older version (old-photo look), or bring them all back to the latest.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr 1fr' : '1fr 1fr 1fr', gap: 8 }}>
              <button onClick={() => window.setControl({ appVersion: '' })} style={{
                padding: m ? '11px 8px' : '12px 10px', borderRadius: 12,
                background: !control.appVersion ? '#9fc972' : '#3a2418', color: !control.appVersion ? '#1a0f0a' : '#fdf3dc',
                border: `2px solid ${GOLD}66`, fontWeight: 900, fontSize: m ? 12 : 13, cursor: 'pointer', fontFamily: 'inherit',
                gridColumn: m ? '1 / -1' : 'auto',
              }}>🚀 Latest (now)</button>
              {(window.CHAI_VERSIONS || []).slice(0, -1).map((ver) => {
                const active = control.appVersion === ver.v;
                return (
                  <button key={ver.v} onClick={() => window.setControl({ appVersion: ver.v })} style={{
                    padding: m ? '11px 8px' : '12px 10px', borderRadius: 12,
                    background: active ? GOLD : '#3a2418', color: active ? '#1a0f0a' : '#fdf3dc',
                    border: `2px solid ${GOLD}66`, fontWeight: 900, fontSize: m ? 11.5 : 13, cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
                  }}>{ver.emoji} {ver.v}</button>
                );
              })}
            </div>
            <div style={{ marginTop: 8, fontSize: 11.5, opacity: 0.55 }}>
              Now: <strong style={{ color: GOLD }}>{control.appVersion ? control.appVersion + ' (forced for all)' : 'Latest — players can time-travel on their own'}</strong>
            </div>
          </div>
        </section>

        {/* MUSIC */}
        <section>
          <div style={mTitle(GOLD)}>🎵 Music</div>
          <div style={mCard(GOLD)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 900, fontSize: m ? 16 : 18, color: '#fff' }}>Background music</div>
              <button onClick={() => window.setControl({ musicEnabled: !control.musicEnabled })} style={{
                position: 'relative', width: 60, height: 32, borderRadius: 999, cursor: 'pointer',
                background: control.musicEnabled ? '#9fc972' : '#3a2418', border: `2px solid ${GOLD}66`,
              }}>
                <span style={{ position: 'absolute', top: 2, left: control.musicEnabled ? 30 : 2, width: 24, height: 24, borderRadius: '50%', background: '#fff', transition: 'left 160ms' }} />
              </button>
            </div>
            <div style={{ fontSize: 12.5, opacity: 0.7, marginTop: 4 }}>
              When ON, every player gets a 🎵 button to mute/unmute. Paste a direct audio link below.
            </div>

            {/* Direct audio link (the only music source) */}
            <div style={{ marginTop: 14, opacity: control.musicEnabled ? 1 : 0.4, pointerEvents: control.musicEnabled ? 'auto' : 'none' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, fontWeight: 900, marginBottom: 6 }}>Music link</div>
              <input value={customUrl} onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="Paste a direct audio link (ends in .mp3 / .ogg / .m4a)"
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: '#000', color: '#fdf3dc', border: `2px solid ${GOLD}44`, borderRadius: 8, fontSize: 13, fontWeight: 700, outline: 'none', fontFamily: 'inherit' }} />
              <input value={customName} onChange={(e) => setCustomName(e.target.value)}
                placeholder="Song name (optional)"
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 6, padding: '10px 12px', background: '#000', color: '#fdf3dc', border: `2px solid ${GOLD}44`, borderRadius: 8, fontSize: 13, fontWeight: 700, outline: 'none', fontFamily: 'inherit' }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <button onClick={() => { window.chaiMusic.setCustom(customUrl); window.chaiMusic.preview('custom', customUrl); }} style={ghostBtn(m)}>▶ Test it</button>
                <button onClick={() => { window.setControl({ track: 'custom', customUrl, customName }); window.chaiMusic.setCustom(customUrl); window.chaiMusic.setTrack('custom'); if (control.musicEnabled) window.chaiMusic.start(); }} style={{ ...goldBtn(GOLD, m), background: (control.track === 'custom' && control.customUrl) ? '#9fc972' : GOLD }}>{(control.track === 'custom' && control.customUrl) ? '✓ Playing this' : '🎶 Play for everyone'}</button>
                <button onClick={() => { window.setControl({ customUrl: '', customName: '' }); setCustomUrl(''); setCustomName(''); window.chaiMusic.setCustom(''); window.chaiMusic.stop(); }} style={ghostBtn(m)}>Clear</button>
              </div>
              <div style={{ marginTop: 10, fontSize: 11.5, opacity: 0.6, lineHeight: 1.55 }}>
                ⚠️ Use only music you're allowed to (your own file, royalty-free, or Creative Commons). I can't bundle copyrighted songs like the Minecraft "Lava Chicken" or in-game tracks — but if you have a direct link you're allowed to use, paste it here and it'll play for the class.
                <br /><br />
                💡 The link must point straight at the audio file (ending <code style={{ color: GOLD }}>.mp3</code>/<code style={{ color: GOLD }}>.ogg</code>), not a YouTube/Spotify page.
              </div>
            </div>
          </div>
        </section>

        {/* MASTER PASSWORD */}
        <section>
          <div style={mTitle(GOLD)}>🔑 Change master code</div>
          <div style={mCard(GOLD)}>
            <input type="text" value={pwNew} onChange={(e) => { setPwNew(e.target.value); setPwSaved(false); }} placeholder="New master code"
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', background: '#000', color: GOLD, border: `2px solid ${GOLD}55`, borderRadius: 10, fontSize: 16, fontWeight: 800, outline: 'none', fontFamily: 'inherit' }} />
            <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => { if (pwNew.trim().length < 3) { alert('At least 3 characters.'); return; } window.saveMaster({ password: pwNew.trim() }); setPwNew(''); setPwSaved(true); }} style={goldBtn(GOLD, m)}>Save</button>
              {pwSaved && <span style={{ fontSize: 12, color: GOLD, fontWeight: 800 }}>✓ Saved!</span>}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.55, lineHeight: 1.5 }}>
              🤫 To open this room: type the secret word <strong style={{ color: GOLD }}>kettle</strong> anywhere in the quiz.
            </div>
          </div>
        </section>

        {/* THIS DEVICE + GOD-MODE LAPTOP RESET */}
        <section>
          <div style={mTitle(GOLD)}>💻 Laptops</div>
          <div style={mCard(GOLD)}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fdf3dc', marginBottom: 8 }}>
              {lock ? <>This laptop is locked to <strong style={{ color: GOLD }}>{lock.name}</strong> ({lock.klass}).</> : 'This laptop is not locked yet.'}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => { window.clearDeviceLock(); setDeviceReset(true); setTimeout(() => setDeviceReset(false), 1500); }} style={ghostBtn(m)}>♻ Reset THIS laptop</button>
              <button onClick={() => {
                if (confirm('Free EVERY laptop in the class? Each device will let a new player sign in. (Scores are NOT deleted.)')) {
                  window.freeAllLaptops();
                  window.clearDeviceLock();
                  setAllReset(true); setTimeout(() => setAllReset(false), 2500);
                }
              }} style={goldBtn(GOLD, m)}>⚡ Reset ALL laptops</button>
            </div>
            {deviceReset && <div style={{ marginTop: 8, fontSize: 12, color: '#9fc972', fontWeight: 800 }}>✓ This laptop freed</div>}
            {allReset && <div style={{ marginTop: 8, fontSize: 12, color: '#9fc972', fontWeight: 800 }}>✓ Signal sent — every laptop frees itself within a moment</div>}
            <div style={{ marginTop: 8, fontSize: 11.5, opacity: 0.55, lineHeight: 1.5 }}>
              One laptop = one player. "Reset ALL" broadcasts through the cloud so every device unlocks — great for handing laptops to the next group. To free just one student's laptop, use the 💻 button by their name in Teacher tools below.
            </div>
          </div>
        </section>

        {/* FULL MC AAYANSH TOOLS */}
        <section>
          <div style={mTitle(GOLD)}>👑 MC aayansh tools (delete, edit, praise)</div>
          <div style={{ ...mCard(GOLD), padding: 0, overflow: 'hidden' }}>
            {window.SBSocial && window.SBSocial.AdminBody
              ? <div style={{ padding: 14 }}><window.SBSocial.AdminBody P={P} m={m} /></div>
              : <div style={{ padding: 14, fontSize: 13, opacity: 0.6 }}>MC aayansh tools unavailable.</div>}
          </div>
        </section>
      </div>
    );
  }

  function mTitle(GOLD) { return { fontFamily: '"Fraunces", serif', fontSize: 22, fontWeight: 900, color: GOLD, marginBottom: 10 }; }
  function mCard(GOLD) { return { background: 'rgba(0,0,0,0.4)', padding: 16, borderRadius: 14, border: `1px solid ${GOLD}33` }; }
  function goldBtn(GOLD, m) { return { padding: m ? '11px 20px' : '13px 24px', background: GOLD, color: '#1a0f0a', border: 'none', borderRadius: 999, fontWeight: 900, fontSize: m ? 14 : 15, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 0 #000' }; }
  function ghostBtn(m) { return { padding: m ? '10px 16px' : '11px 18px', background: 'transparent', color: '#fdf3dc', border: '2px solid #fdf3dc44', borderRadius: 999, fontWeight: 900, fontSize: m ? 13 : 14, cursor: 'pointer', fontFamily: 'inherit' }; }

  // ═══════════════════════════════════════════════════════════════
  // MEMORIES — version history. Opened by typing the word "memories".
  // A scrollable storybook timeline of how the Chai Quiz grew up.
  // ═══════════════════════════════════════════════════════════════
  const CHAI_VERSIONS = [
    {
      v: 'v1.0', name: 'The First Brew', emoji: '🍵',
      notes: ['15 chai trivia questions', 'Score counter, fun facts & confetti', 'Storybook look with cups and stickers'],
    },
    {
      v: 'v1.1', name: 'Name & Class', emoji: '✍️',
      notes: ['Kids sign in with name + class', 'Class leaderboard you can show on the big screen'],
    },
    {
      v: 'v1.2', name: 'Fair Play', emoji: '🎲',
      notes: ['Answer positions shuffled (no more "always A")', 'Mobile-friendly layout for phones'],
    },
    {
      v: 'v2.0', name: 'Levels & Friends', emoji: '🗺️',
      notes: ['67 levels of 5 questions each', 'Class battle: 6M vs 6BC', 'Send cheers & messages to each other'],
    },
    {
      v: 'v2.1', name: 'Teacher Tools', emoji: '🔒',
      notes: ['Ctrl+Shift+T teacher panel', 'Edit times, delete cheaters, send praise'],
    },
    {
      v: 'v2.2', name: 'The Cloud', emoji: '☁️',
      notes: ['Firebase shared leaderboard', 'Every laptop sees the same scores live'],
    },
    {
      v: 'v3.0', name: 'Teacher Powers', emoji: '⚡',
      notes: ['Hidden teacher controls', 'Stop Everyone freeze button', 'One laptop = one player'],
    },
    {
      v: 'v3.1', name: 'Music & Power', emoji: '🎵',
      notes: ['Background music with mute button', 'Reset ALL laptops at once', 'Players can remove themselves'],
    },
    {
      v: 'v3.2', name: 'Your Song', emoji: '🎶',
      notes: ['Music is now a direct audio link you choose', 'Paste a legal .mp3 link and it plays for the class'],
    },
    {
      v: 'v3.3', name: 'Memories', emoji: '📖',
      notes: ['This version-history page', 'A look back at how the quiz grew up'],
    },
  ];

  // Skin = a sepia "old photo" filter that gets stronger the further back you go.
  // Latest version = no filter. Used by the root to tint the whole quiz.
  function versionSkin(vId) {
    const last = CHAI_VERSIONS.length - 1;
    const idx = CHAI_VERSIONS.findIndex((x) => x.v === vId);
    if (idx < 0 || idx === last) return { filter: 'none', strength: 0, ver: CHAI_VERSIONS[last], idx: last, isLatest: true };
    const s = (last - idx) / last; // 0..1 — older = bigger
    const filter = `sepia(${(0.6 * s).toFixed(2)}) saturate(${(1 - 0.22 * s).toFixed(2)}) brightness(${(1 - 0.04 * s).toFixed(2)}) contrast(${(1 + 0.04 * s).toFixed(2)})`;
    return { filter, strength: s, ver: CHAI_VERSIONS[idx], idx, isLatest: false };
  }
  window.CHAI_VERSIONS = CHAI_VERSIONS;
  window.versionSkin = versionSkin;

  function MemoriesPanel({ P, m, onClose }) {
    const cur0 = window.getLocalVersion ? window.getLocalVersion() : '';
    const latestV = CHAI_VERSIONS[CHAI_VERSIONS.length - 1].v;
    const initIdx = (() => { const i = CHAI_VERSIONS.findIndex((x) => x.v === cur0); return i < 0 ? CHAI_VERSIONS.length - 1 : i; })();
    const [picked, setPicked] = useState(initIdx);
    useEffect(() => { const h = (e) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
    const cur = CHAI_VERSIONS[picked];
    const youAreHere = (cur0 || latestV) === cur.v || (!cur0 && cur.v === latestV);

    const travelTo = (vId) => {
      // Latest = clear the personal version; otherwise set it. Then "go there".
      window.setLocalVersion(vId === latestV ? '' : vId);
      onClose();
    };

    return (
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(20,12,6,0.7)', display: 'grid', placeItems: 'center', zIndex: 1000, padding: 12, fontFamily: '"Nunito", sans-serif' }}>
        <div onClick={(e) => e.stopPropagation()} style={{
          width: '100%', maxWidth: 720, maxHeight: '92vh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          background: P.paper, color: P.ink,
          border: `4px solid ${P.ink}`, borderRadius: 24,
          boxShadow: `0 14px 0 ${P.ink}, 0 30px 80px rgba(0,0,0,0.5)`,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: m ? '16px 18px' : '20px 26px', borderBottom: `3px dashed ${P.ink}33` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: m ? 30 : 38 }}>📖</div>
              <div>
                <div style={{ fontSize: m ? 10 : 12, letterSpacing: '0.24em', color: P.accent, fontWeight: 900, textTransform: 'uppercase' }}>Chai Quiz</div>
                <h2 style={{ fontFamily: '"Fraunces", serif', fontSize: m ? 26 : 34, margin: '2px 0 0', fontWeight: 900, color: P.ink }}>Memories</h2>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: '50%', background: P.surface, color: P.ink, border: `3px solid ${P.ink}`, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 3px 0 ${P.ink}` }}>✕</button>
          </div>

          <div style={{ display: 'flex', flex: 1, minHeight: 0, flexDirection: m ? 'column' : 'row' }}>
            {/* Version list (choose one) */}
            <div style={{
              width: m ? '100%' : 240, flexShrink: 0,
              maxHeight: m ? 150 : 'none', overflowY: 'auto',
              borderRight: m ? 'none' : `3px solid ${P.ink}18`,
              borderBottom: m ? `3px solid ${P.ink}18` : 'none',
              padding: 12, display: 'flex', flexDirection: m ? 'row' : 'column', gap: 8,
              flexWrap: m ? 'nowrap' : 'normal',
            }}>
              {CHAI_VERSIONS.map((ver, i) => {
                const active = i === picked;
                return (
                  <button key={ver.v} onClick={() => setPicked(i)} style={{
                    flexShrink: 0, textAlign: 'left',
                    padding: m ? '8px 12px' : '10px 12px', borderRadius: 12,
                    background: active ? P.accent : P.surface, color: active ? '#fff' : P.ink,
                    border: `3px solid ${P.ink}`, cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: active ? `0 3px 0 ${P.ink}` : 'none',
                    display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
                  }}>
                    <span style={{ fontSize: 18 }}>{ver.emoji}</span>
                    <span>
                      <span style={{ fontWeight: 900, fontSize: 13, display: 'block' }}>{ver.v}</span>
                      {!m && <span style={{ fontSize: 11, opacity: 0.8 }}>{ver.name}</span>}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Chosen version detail */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: m ? '18px' : '26px 30px' }}>
              <div style={{ fontSize: m ? 48 : 64, lineHeight: 1 }}>{cur.emoji}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                <h3 style={{ fontFamily: '"Fraunces", serif', fontSize: m ? 28 : 38, margin: 0, fontWeight: 900, color: P.ink }}>{cur.name}</h3>
                <span style={{ background: P.warm, color: P.ink, padding: '3px 12px', borderRadius: 999, border: `2px solid ${P.ink}`, fontWeight: 900, fontSize: 13 }}>{cur.v}</span>
              </div>
              <ul style={{ marginTop: 18, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {cur.notes.map((n, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: m ? 15 : 17, fontWeight: 700, lineHeight: 1.4 }}>
                    <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: '50%', background: P.leaf, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 900, border: `2px solid ${P.ink}` }}>✓</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 22, paddingTop: 18, borderTop: `2px dashed ${P.ink}22`, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {youAreHere ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderRadius: 999, background: P.leaf, color: '#fff', border: `3px solid ${P.ink}`, fontWeight: 900, fontSize: m ? 15 : 16, boxShadow: `0 4px 0 ${P.ink}` }}>
                    ⭐ You're here now
                  </div>
                ) : (
                  <button onClick={() => travelTo(cur.v)} style={{
                    padding: m ? '13px 22px' : '14px 26px', borderRadius: 999,
                    background: P.accent, color: '#fff', border: `3px solid ${P.ink}`,
                    fontWeight: 900, fontSize: m ? 16 : 18, cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: `0 5px 0 ${P.ink}`, touchAction: 'manipulation',
                  }}>
                    {cur.v === latestV ? '🚀 Go to the latest version' : '🕰️ Travel to this version →'}
                  </button>
                )}
                {cur.v !== latestV && (
                  <button onClick={() => travelTo(latestV)} style={{
                    padding: m ? '13px 18px' : '14px 20px', borderRadius: 999,
                    background: P.surface, color: P.ink, border: `3px solid ${P.ink}`,
                    fontWeight: 900, fontSize: m ? 14 : 15, cursor: 'pointer', fontFamily: 'inherit',
                  }}>Back to latest</button>
                )}
              </div>
              <div style={{ marginTop: 12, fontSize: 12.5, opacity: 0.6, fontWeight: 700, lineHeight: 1.5 }}>
                Travelling gives the quiz an old-photo look from that era. MC aayansh can send the whole class to a version too.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // DECOY PANEL — opened by typing "67". Looks like a boring dead-end.
  // Secretly: type "chai" while it's open to reveal the full
  // Godchai + MC aayansh combined control room.
  // ═══════════════════════════════════════════════════════════════
  function DecoyPanel({ P, m, onClose }) {
    const GOLD = '#f6c25a';
    const [revealed, setRevealed] = useState(false);

    // Listen for the secret unlock word "chai" while the decoy is open.
    // Escape always closes, in both decoy and revealed states.
    useEffect(() => {
      let buf = '';
      const onKey = (e) => {
        if (e.key === 'Escape') { onClose(); return; }
        if (revealed) return;
        const el = document.activeElement;
        if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
        if (e.key && e.key.length === 1) {
          buf = (buf + e.key.toLowerCase()).slice(-6);
          if (buf.endsWith('chai')) { buf = ''; setRevealed(true); }
        }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [revealed, onClose]);

    if (!revealed) {
      // The harmless-looking decoy
      return (
        <div onClick={onClose} style={{
          position: 'fixed', inset: 0, background: 'rgba(10,10,12,0.92)',
          display: 'grid', placeItems: 'center', zIndex: 1000, padding: 16,
          fontFamily: '"Nunito", sans-serif',
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: '100%', maxWidth: 460, textAlign: 'center',
            background: '#15161a', color: '#9aa0ab',
            border: '2px solid #2a2c33', borderRadius: 18,
            padding: m ? '34px 22px' : '48px 40px',
            boxShadow: '0 24px 70px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontSize: m ? 54 : 70, marginBottom: 10, filter: 'grayscale(1)', opacity: 0.7 }}>🚧</div>
            <h2 style={{ fontFamily: '"Fraunces", serif', fontSize: m ? 24 : 30, margin: '0 0 10px', color: '#c7ccd4', fontWeight: 900 }}>
              Nothing to see here…
            </h2>
            <p style={{ fontSize: m ? 14 : 16, lineHeight: 1.5, margin: '0 0 6px' }}>
              Hahaha — this is just a distraction. 😄
            </p>
            <p style={{ fontSize: 12.5, opacity: 0.6, margin: '0 0 22px' }}>
              (Page under construction. Move along!)
            </p>
            <button onClick={onClose} style={{
              padding: '11px 22px', borderRadius: 999,
              background: '#2a2c33', color: '#c7ccd4',
              border: '1px solid #3a3d45', fontWeight: 800,
              fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
            }}>OK, go back</button>
          </div>
        </div>
      );
    }

    // Revealed: the real combined Godchai + MC aayansh room
    return (
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(8,4,2,0.82)', display: 'grid', placeItems: 'center', zIndex: 1000, padding: 12 }}>
        <div onClick={(e) => e.stopPropagation()} style={{
          width: '100%', maxWidth: 640, maxHeight: '92vh', overflowY: 'auto',
          background: 'linear-gradient(180deg, #1a0f0a, #0d0704)', color: '#fdf3dc',
          border: `4px solid ${GOLD}`, borderRadius: 24,
          boxShadow: `0 0 0 1px ${GOLD}55, 0 30px 90px rgba(0,0,0,0.8), inset 0 0 60px ${GOLD}11`,
          fontFamily: '"Nunito", sans-serif',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: m ? '16px 18px' : '22px 28px', borderBottom: `2px solid ${GOLD}44` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: m ? 30 : 40 }}>👑</div>
              <div>
                <div style={{ fontSize: m ? 10 : 12, letterSpacing: '0.3em', color: GOLD, fontWeight: 900, textTransform: 'uppercase' }}>Godchai + MC aayansh</div>
                <h2 style={{ fontFamily: '"Fraunces", serif', fontSize: m ? 24 : 32, margin: '2px 0 0', fontWeight: 900, color: '#fff' }}>Master Control Room</h2>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: '50%', background: 'transparent', color: GOLD, border: `2px solid ${GOLD}66`, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
          </div>
          <div style={{ padding: m ? '18px' : '26px 28px 30px' }}>
            <MasterBody P={P} m={m} GOLD={GOLD} />
          </div>
        </div>
      </div>
    );
  }

  window.SBMaster = { MasterPanel, FreezeOverlay, MusicButton, MemoriesPanel, BanOverlay, DecoyPanel };
})();

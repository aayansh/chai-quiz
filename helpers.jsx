// Shared helpers for the Chai Quiz — sound, confetti, animation timing.

(function () {
  let _audioCtx = null;
  function getAC() {
    if (!_audioCtx) {
      try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { _audioCtx = null; }
    }
    if (_audioCtx && _audioCtx.state === 'suspended') _audioCtx.resume();
    return _audioCtx;
  }

  function playTone({ freq = 880, dur = 0.18, type = 'sine', vol = 0.12 } = {}) {
    const ac = getAC();
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(vol, ac.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + dur + 0.02);
  }

  const sfx = {
    correct: () => { playTone({ freq: 660, dur: 0.12 }); setTimeout(() => playTone({ freq: 990, dur: 0.18 }), 90); },
    wrong: () => { playTone({ freq: 220, dur: 0.18, type: 'triangle' }); setTimeout(() => playTone({ freq: 170, dur: 0.22, type: 'triangle' }), 120); },
    tick: () => playTone({ freq: 520, dur: 0.06, vol: 0.06 }),
    kettle: () => {
      // Rising whistle
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

  // Lightweight confetti — paper bits raining inside a positioned container.
  function Confetti({ active, colors = ['#c44d27', '#5a7a3a', '#d4a25a', '#3d2818', '#e8b86f'], count = 80 }) {
    const [pieces] = React.useState(() =>
      Array.from({ length: count }).map((_, i) => ({
        i,
        x: Math.random() * 100,
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
              position: 'absolute',
              left: `${p.x}%`, top: '-12%',
              width: p.size, height: p.shape === 'rect' ? p.size * 0.6 : p.size,
              background: p.color,
              borderRadius: p.shape === 'circle' ? '50%' : 2,
              transform: `rotate(${p.rot}deg)`,
              animation: `chai-confetti ${p.dur}s ${p.delay}s linear forwards`,
            }} />
        ))}
        <style>{`
          @keyframes chai-confetti {
            0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(120vh) rotate(720deg); opacity: 0.8; }
          }
        `}</style>
      </div>
    );
  }

  Object.assign(window, { sfx, Confetti });

  // ── Leaderboard storage ──────────────────────────────────────────
  const LB_KEY = 'chai-quiz-leaderboard-v1';

  function loadLeaderboard() {
    try {
      const raw = localStorage.getItem(LB_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }
  function saveLeaderboard(list) {
    try { localStorage.setItem(LB_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function addEntry({ name, klass, score, total, elapsed }) {
    const list = loadLeaderboard();
    list.push({
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      name: (name || 'Anon').slice(0, 24),
      klass: (klass || '').slice(0, 16),
      score, total, elapsed,
      ts: Date.now(),
    });
    saveLeaderboard(list);
    return list;
  }
  function clearLeaderboard() { saveLeaderboard([]); }

  // Higher score first; tiebreaker = faster time
  function sortedLeaderboard(list = loadLeaderboard()) {
    return [...list].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.elapsed || 0) - (b.elapsed || 0);
    });
  }

  Object.assign(window, { loadLeaderboard, saveLeaderboard, addEntry, clearLeaderboard, sortedLeaderboard });
})();

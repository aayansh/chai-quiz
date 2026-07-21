// ════════════════════════════════════════════════════════════════
// CHAI QUIZ v2 — main orchestrator
// Flow: home → entry → map → play → levelresult → leaderboard
// Admin via Ctrl+Shift+T. Pulls screens from window.SBScreens / SBSocial.
// ════════════════════════════════════════════════════════════════
(function () {
  const { useState, useEffect, useMemo } = React;

  function VariationStorybook({ animSpeed = 1, paletteIdx = 0 }) {
    const S = window.SB;
    const [control, setControlState] = useState(() => window.getControl());
    const [dark, setDark] = useState(() => localStorage.getItem('chai-quiz-dark') === '1');
    // Teacher can TEMPORARILY force everyone's appearance (overrides personal choice).
    const forceTheme = control && control.forceTheme;          // '' | 'light' | 'dark'
    const themeForced = forceTheme === 'light' || forceTheme === 'dark';
    const effDark = forceTheme === 'dark' ? true : forceTheme === 'light' ? false : dark;
    const P = S.getPalette(paletteIdx, effDark);
    const dur = (ms) => `${Math.round(ms / animSpeed)}ms`;
    const m = S.useIsMobile();

    // Apply page background + remember personal choice
    useEffect(() => {
      try { localStorage.setItem('chai-quiz-dark', dark ? '1' : '0'); } catch (e) {}
      const stage = document.getElementById('stage');
      if (effDark) {
        document.body.style.background = '#0e0905';
        if (stage) stage.style.background = P.paper;
      } else {
        document.body.style.background = '';
        if (stage) stage.style.background = '';
      }
    }, [dark, effDark, P.paper]);

    const [phase, setPhase] = useState('home');     // home|entry|map|play|levelresult|leaderboard
    const [player, setPlayer] = useState({ name: '', klass: '' });
    const [activeLevel, setActiveLevel] = useState(null);
    const [lastResult, setLastResult] = useState(null);
    const [adminOpen, setAdminOpen] = useState(false);
    const [masterOpen, setMasterOpen] = useState(false);
    const [decoyOpen, setDecoyOpen] = useState(false);
    const [memoriesOpen, setMemoriesOpen] = useState(false);
    const [inboxOpen, setInboxOpen] = useState(false);
    const [inboxCount, setInboxCount] = useState(0);
    const [seenCount, setSeenCount] = useState(0);
    const [localVersion, setLocalVersion] = useState(() => (window.getLocalVersion ? window.getLocalVersion() : ''));

    // Personal time-machine version changes (from the Memories panel)
    useEffect(() => {
      const onVer = (e) => setLocalVersion(e.detail || '');
      window.addEventListener('chai-version', onVer);
      return () => window.removeEventListener('chai-version', onVer);
    }, []);

    // Ctrl+Shift+T → admin
    useEffect(() => {
      const h = (e) => {
        const k = (e.key || '').toLowerCase();
        if (e.ctrlKey && e.shiftKey && k === 't') { e.preventDefault(); setAdminOpen((v) => !v); }
      };
      window.addEventListener('keydown', h);
      return () => window.removeEventListener('keydown', h);
    }, []);

    // Secret words: "67" → decoy door · "kettle" → master panel · "memories" → version history
    // (all ignored while typing in a field)
    useEffect(() => {
      let buf = '';
      const onKey = (e) => {
        const el = document.activeElement;
        if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
        if (e.key && e.key.length === 1) {
          buf = (buf + e.key.toLowerCase()).slice(-10);
          if (buf.endsWith('kettle')) { buf = ''; setMasterOpen(true); }
          else if (buf.endsWith('memories')) { buf = ''; setMemoriesOpen(true); }
          else if (buf.endsWith('67')) { buf = ''; setDecoyOpen(true); }
        }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Global control (freeze + music) — live across devices
    useEffect(() => {
      const u = window.subscribeControl((c) => {
        setControlState(c);
        // God-mode may have asked this laptop to free its device lock.
        window.applyRemoteUnlocks && window.applyRemoteUnlocks(c);
      });
      return u;
    }, []);

    // Manage music when the master toggles it / changes track
    useEffect(() => {
      // music is now a direct audio link only (no built-in synth tracks)
      window.chaiMusic.setCustom(control.customUrl || '');
      window.chaiMusic.setTrack('custom');
      if (control.musicEnabled && control.customUrl) {
        const muted = localStorage.getItem('chai-quiz-music-muted') === '1';
        window.chaiMusic.setMuted(muted);
        if (!muted) window.chaiMusic.start(); // gesture handler covers first-run autoplay
      } else {
        window.chaiMusic.stop();
      }
    }, [control.musicEnabled, control.track, control.customUrl]);

    // Unlock + start audio on the first tap (browser autoplay rule)
    useEffect(() => {
      const onGesture = () => {
        const c = window.getControl();
        if (c.musicEnabled && localStorage.getItem('chai-quiz-music-muted') !== '1') window.chaiMusic.start();
      };
      window.addEventListener('pointerdown', onGesture);
      return () => window.removeEventListener('pointerdown', onGesture);
    }, []);

    // Track unread messages for the player
    const signedIn = player.name.trim() && player.klass.trim();
    useEffect(() => {
      if (!signedIn) { setInboxCount(0); return; }
      const u = window.subscribeMessages(() => {
        const mine = window.messagesFor(player.name, player.klass);
        setInboxCount(Math.max(0, mine.length - seenCount));
      });
      return u;
    }, [signedIn, player.name, player.klass, seenCount]);

    const startPlay = () => {
      const lock = window.getDeviceLock();
      if (lock) {
        // This laptop is bound to one player — continue as them, skip sign-in.
        const bound = { name: lock.name, klass: lock.klass };
        setPlayer(bound);
        setSeenCount(window.messagesFor(bound.name, bound.klass).length);
        setPhase('map');
      } else {
        setPhase('entry');
      }
    };

    const beginEntry = () => {
      // normalise the typed class into 6M / 6BC / Other for display + keying
      const normName = player.name.trim();
      const normKlass = window.normalizeClass(player.klass);
      const normalized = { name: normName, klass: normKlass };
      // Bind this laptop to this player (anti-cheat: same laptop can't be
      // reused under a different name without a teacher reset).
      window.setDeviceLock(normName, normKlass);
      setPlayer(normalized);
      setSeenCount(window.messagesFor(normName, normKlass).length);
      setPhase('map');
    };

    const playLevel = (lv) => { setActiveLevel(lv); setPhase('play'); };

    const finishLevel = (res) => {
      const rec = window.recordLevel(player.name, player.klass, activeLevel.id, {
        stars: res.correct, correct: res.correct, elapsed: res.elapsed,
      });
      window.sfx.kettle();
      setLastResult({ ...res, stars: res.correct, levelId: activeLevel.id });
      setPhase('levelresult');
    };

    const nextLevel = () => {
      const nextN = activeLevel.n + 1;
      const lv = window.CHAI_LEVELS.find((l) => l.n === nextN);
      if (lv) { setActiveLevel(lv); setPhase('play'); }
      else setPhase('map');
    };

    const hasNext = activeLevel && window.CHAI_LEVELS.some((l) => l.n === activeLevel.n + 1);

    const openInbox = () => {
      setInboxOpen(true);
      setSeenCount(window.messagesFor(player.name, player.klass).length);
      setInboxCount(0);
    };

    const Sc = window.SBScreens;
    const So = window.SBSocial;

    const rootStyle = m
      ? { width: '100%', minHeight: '100%', position: 'relative', background: bg(P), paddingBottom: 20, fontFamily: S.NU, color: P.ink, fontWeight: 700 }
      : { width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: bg(P), fontFamily: S.NU, color: P.ink, fontWeight: 700 };

    // Time machine: admin force wins, else this device's personal pick.
    const effVer = control.appVersion || localVersion || '';
    const skin = window.versionSkin ? window.versionSkin(effVer) : { filter: 'none', isLatest: true };
    const onLatest = skin.isLatest;
    const verForced = !!control.appVersion;
    const leaveVersion = () => { if (!verForced) window.setLocalVersion(''); };

    // The filter must wrap ONLY the screens — not the fixed overlays/buttons
    // (CSS filter creates a containing block and would trap position:fixed).
    const screenWrap = { filter: skin.filter, width: '100%', height: m ? 'auto' : '100%', position: 'relative' };

    return (
      <div style={rootStyle}>
        <div style={screenWrap}>
        {phase === 'home' && <Sc.Home P={P} m={m} dur={dur} onPlay={startPlay} onLeaderboard={() => setPhase('leaderboard')} />}
        {phase === 'entry' && <Sc.Entry P={P} m={m} dur={dur} player={player} setPlayer={setPlayer} onBack={() => setPhase('home')} onBegin={beginEntry} />}
        {phase === 'map' && <Sc.LevelMap P={P} m={m} dur={dur} player={player} onPlayLevel={playLevel} onLeaderboard={() => setPhase('leaderboard')} onInbox={openInbox} inboxCount={inboxCount} onRemoveMe={() => {
          if (confirm(`Remove ${player.name} and all your stars? This can't be undone.`)) {
            window.deletePlayer(window.playerKey(player.name, player.klass));
            window.clearDeviceLock && window.clearDeviceLock();
            restartAll();
          }
        }} />}
        {phase === 'play' && activeLevel && <Sc.PlayLevel P={P} m={m} dur={dur} level={activeLevel} player={player} onFinish={finishLevel} onQuit={() => setPhase('map')} />}
        {phase === 'levelresult' && lastResult && <Sc.LevelResult P={P} m={m} dur={dur} level={activeLevel} result={lastResult} player={player} hasNext={hasNext} onNext={nextLevel} onMap={() => setPhase('map')} onLeaderboard={() => setPhase('leaderboard')} />}
        {phase === 'leaderboard' && <So.Leaderboard P={P} m={m} dur={dur} player={signedIn ? player : null} onBack={() => setPhase(signedIn ? 'map' : 'home')} />}
        </div>

        {/* Time-machine banner — shown when not on the latest version */}
        {!onLatest && skin.ver && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: m ? 8 : 14,
            padding: m ? '7px 10px' : '9px 16px',
            paddingTop: `calc(${m ? 7 : 9}px + env(safe-area-inset-top))`,
            background: P.ink, color: P.paper,
            fontFamily: S.NU, fontWeight: 900, fontSize: m ? 12 : 14,
            boxShadow: '0 3px 10px rgba(0,0,0,0.25)', flexWrap: 'wrap',
          }}>
            <span>🕰️ Time machine: <span style={{ color: P.warm }}>{skin.ver.v} · {skin.ver.name}</span></span>
            {verForced
              ? <span style={{ opacity: 0.8, fontWeight: 800 }}>· set by the MC</span>
              : <button onClick={leaveVersion} style={{
                  padding: '4px 12px', borderRadius: 999, background: P.warm, color: P.ink,
                  border: 'none', fontWeight: 900, fontSize: m ? 11 : 13, cursor: 'pointer', fontFamily: 'inherit',
                }}>Back to latest →</button>}
          </div>
        )}

        {inboxOpen && signedIn && <So.Inbox P={P} m={m} player={player} onClose={() => setInboxOpen(false)} />}
        {adminOpen && <So.AdminPanel P={P} m={m} onClose={() => setAdminOpen(false)} />}
        {masterOpen && <window.SBMaster.MasterPanel P={P} m={m} onClose={() => setMasterOpen(false)} />}
        {decoyOpen && <window.SBMaster.DecoyPanel P={P} m={m} onClose={() => setDecoyOpen(false)} />}
        {memoriesOpen && <window.SBMaster.MemoriesPanel P={P} m={m} onClose={() => setMemoriesOpen(false)} />}

        {/* Music button for everyone when the master turns music on AND a link is set */}
        {control.musicEnabled && control.customUrl && <window.SBMaster.MusicButton P={P} m={m} />}

        {/* Dark / light toggle — available to everyone (locked when the teacher forces it) */}
        <button onClick={() => !themeForced && setDark((v) => !v)} disabled={themeForced}
          title={themeForced ? 'Appearance set by the MC' : (effDark ? 'Light mode' : 'Dark mode')} style={{
          position: m ? 'fixed' : 'absolute',
          bottom: m ? 'calc(14px + env(safe-area-inset-bottom))' : 20,
          left: m ? 'calc(14px + env(safe-area-inset-left))' : 20,
          zIndex: 200,
          width: m ? 46 : 52, height: m ? 46 : 52, borderRadius: '50%',
          background: effDark ? P.surface : '#fff', color: P.ink,
          border: `3px solid ${P.ink}`, boxShadow: `0 4px 0 ${P.ink}`,
          fontSize: m ? 20 : 24, cursor: themeForced ? 'default' : 'pointer', fontFamily: 'inherit',
          opacity: themeForced ? 0.55 : 1,
          touchAction: 'manipulation', display: 'grid', placeItems: 'center',
        }}>{effDark ? '☀️' : '🌙'}</button>

        {/* Global pause overlay (every device) */}
        <window.SBMaster.FreezeOverlay P={P} m={m} control={control} />
        {/* Targeted 10-second ban overlay (only on the banned player's device) */}
        {signedIn && control.bans && control.bans[window.playerKey(player.name, player.klass)] > Date.now() && (
          <window.SBMaster.BanOverlay P={P} m={m} until={control.bans[window.playerKey(player.name, player.klass)]} />
        )}

        {/* hidden admin tap target for touch devices (5 quick taps not needed; corner) */}
        <button aria-label="admin" onClick={() => setAdminOpen(true)} style={{ position: 'fixed', bottom: 4, right: 4, width: 26, height: 26, opacity: 0, background: 'transparent', border: 'none' }}>·</button>

        <S.Keyframes />
      </div>
    );
  }

  function bg(P) {
    return `radial-gradient(circle at 20% 10%, ${P.warm}55, transparent 60%), radial-gradient(circle at 90% 90%, ${P.leaf}33, transparent 50%), ${P.paper}`;
  }

  window.VariationStorybook = VariationStorybook;
})();

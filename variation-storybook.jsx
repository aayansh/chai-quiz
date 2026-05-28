// Variation B — Storybook (playful, kid-first)
// Mobile responsive + per-question timer + hidden admin mode (Ctrl+Shift+T).
(function () {
  const { useState, useEffect, useRef, useCallback } = React;
  const { Cup, Leaf, Cardamom, Cinnamon, Biscuit, StarAnise, Kettle, Star, Check, Cross, iconForQuestion } = window;

  // ── viewport hook ────────────────────────────────────────────────
  // Bumped to 1024 so windowed browsers get the fluid layout instead of a
  // shrunken stage.
  function useIsMobile(bp = 1024) {
    const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth < bp);
    useEffect(() => {
      const onResize = () => setM(window.innerWidth < bp);
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }, [bp]);
    return m;
  }

  function VariationStorybook({ animSpeed = 1, paletteIdx = 0 }) {
    const palettes = [
      { paper: '#fff5e0', ink: '#3d2818', accent: '#e8702b', leaf: '#6a9a3a', warm: '#f6c25a', deep: '#7a3d18' },
      { paper: '#ffe9c4', ink: '#2a1810', accent: '#c44d27', leaf: '#5a7a3a', warm: '#e8b86f', deep: '#5a2810' },
      { paper: '#fdebd3', ink: '#3d2818', accent: '#d96a2c', leaf: '#7aa84a', warm: '#f4ce6a', deep: '#7a3d18' },
    ];
    const P = palettes[paletteIdx] || palettes[0];
    const dur = (ms) => `${Math.round(ms / animSpeed)}ms`;
    const m = useIsMobile();

    const [phase, setPhase] = useState('intro');
    const [player, setPlayer] = useState({ name: '', klass: '' });
    const [justSubmittedId, setJustSubmittedId] = useState(null);
    const [adminOpen, setAdminOpen] = useState(false);

    // Ctrl+Shift+T → toggle admin panel
    useEffect(() => {
      const handler = (e) => {
        const k = (e.key || '').toLowerCase();
        if (e.ctrlKey && e.shiftKey && k === 't') {
          e.preventDefault();
          setAdminOpen((v) => !v);
        }
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }, []);

    const Q = window.useQuiz({
      onCorrect: () => window.sfx.correct(),
      onWrong: () => window.sfx.wrong(),
      onFinish: () => window.sfx.kettle(),
    });

    useEffect(() => {
      if (phase === 'quiz' && Q.stage === 'intro') Q.begin();
    }, [phase, Q.stage]);

    const submitScore = () => {
      const entry = window.addEntry({
        name: player.name, klass: player.klass,
        score: Q.score, total: Q.total, elapsed: Q.elapsed,
      });
      setJustSubmittedId(entry && entry.id);
      setPhase('leaderboard');
    };

    const restartAll = () => {
      setPlayer({ name: '', klass: '' });
      setJustSubmittedId(null);
      Q.restart();
      setPhase('intro');
    };

    const rootStyle = m
      ? {
          width: '100%', minHeight: '100%', position: 'relative',
          background: `radial-gradient(circle at 20% 10%, ${P.warm}55, transparent 60%), radial-gradient(circle at 90% 90%, ${P.leaf}33, transparent 50%), ${P.paper}`,
          paddingBottom: 24, fontFamily: '"Nunito", system-ui, sans-serif', color: P.ink, fontWeight: 700,
        }
      : {
          width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
          background: `radial-gradient(circle at 20% 10%, ${P.warm}55, transparent 60%), radial-gradient(circle at 90% 90%, ${P.leaf}33, transparent 50%), ${P.paper}`,
          fontFamily: '"Nunito", system-ui, sans-serif', color: P.ink, fontWeight: 700,
        };

    return (
      <div style={rootStyle}>
        {!m && <Doodles P={P} />}
        {phase === 'intro' && <SIntro P={P} dur={dur} m={m} onStart={() => setPhase('entry')} onLeaderboard={() => setPhase('leaderboard')} />}
        {phase === 'entry' && <SEntry P={P} dur={dur} m={m} player={player} setPlayer={setPlayer} onBack={() => setPhase('intro')} onBegin={() => setPhase('quiz')} />}
        {phase === 'quiz' && Q.stage === 'q' && <SQuestion Q={Q} P={P} dur={dur} m={m} player={player} />}
        {phase === 'quiz' && Q.stage === 'result' && <SResult Q={Q} P={P} dur={dur} m={m} player={player} onSubmit={submitScore} onSkip={() => setPhase('leaderboard')} />}
        {phase === 'leaderboard' && <SLeaderboard P={P} dur={dur} m={m} highlightId={justSubmittedId} onBack={restartAll} />}

        {/* Tiny invisible admin tap target (bottom-right) for touch devices */}
        <button
          aria-label="Open admin"
          onClick={() => setAdminOpen(true)}
          style={{
            position: 'fixed', bottom: 6, right: 6, width: 28, height: 28,
            background: 'transparent', border: 'none', cursor: 'default',
            opacity: 0, color: P.ink, fontSize: 10, padding: 0,
          }}
        >·</button>

        {adminOpen && (
          <AdminPanel P={P} m={m} onClose={() => setAdminOpen(false)} />
        )}
        <SKeyframes />
      </div>
    );
  }

  function Doodles({ P }) {
    return (
      <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5 }} width="100%" height="100%" viewBox="0 0 1100 750" fill="none">
        <path d="M 40 60 Q 80 40 120 60" stroke={P.ink} strokeWidth="2" strokeLinecap="round" opacity="0.25" />
        <circle cx="1040" cy="80" r="6" fill={P.accent} opacity="0.5" />
        <circle cx="1020" cy="110" r="3" fill={P.leaf} opacity="0.5" />
        <path d="M 60 700 Q 90 680 120 700 T 180 700" stroke={P.ink} strokeWidth="2" strokeLinecap="round" opacity="0.25" />
        <path d="M 980 660 L 1000 680 L 1020 660" stroke={P.accent} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </svg>
    );
  }

  // Screen wrapper: absolute fill on desktop; flow layout on mobile.
  // `scroll` opts into a scrollable container on desktop so long screens
  // (like a packed leaderboard) work with the framed stage.
  function Screen({ m, children, style = {}, padding, scroll }) {
    return (
      <div style={{
        position: m ? 'relative' : 'absolute',
        inset: m ? undefined : 0,
        width: '100%',
        minHeight: m ? '100vh' : 'auto',
        padding: padding ?? (m ? '20px 16px' : '32px 56px'),
        boxSizing: 'border-box',
        overflowY: scroll ? 'auto' : undefined,
        WebkitOverflowScrolling: scroll ? 'touch' : undefined,
        ...style,
      }}>{children}</div>
    );
  }

  // ─── Intro ────────────────────────────────────────────────────────
  function SIntro({ P, dur, m, onStart, onLeaderboard }) {
    return (
      <Screen m={m} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: m ? '28px 16px' : 40 }}>
        <div style={{ textAlign: 'center', position: 'relative', animation: `sb-bounce ${dur(800)} cubic-bezier(.34,1.56,.64,1) both` }}>
          <div style={{ display: 'inline-block', position: 'relative' }}>
            <div style={{
              background: P.accent, color: '#fff',
              padding: m ? '12px 22px' : '18px 48px',
              borderRadius: m ? 22 : 32,
              fontSize: m ? 38 : 80,
              fontWeight: 900, letterSpacing: '-0.02em',
              transform: 'rotate(-2deg)',
              boxShadow: `0 ${m ? 5 : 8}px 0 ${P.deep}, 0 16px 40px ${P.accent}66`,
              border: `${m ? 3 : 4}px solid ${P.ink}`,
              fontFamily: '"Fraunces", "Nunito", sans-serif',
              whiteSpace: 'nowrap',
            }}>The Chai Quiz</div>
            <div style={{ position: 'absolute', top: m ? -12 : -24, right: m ? -14 : -36, transform: 'rotate(18deg)', animation: `sb-wiggle 3s ease-in-out infinite` }}>
              <div style={{ background: P.leaf, color: '#fff', padding: m ? '4px 10px' : '6px 14px', borderRadius: 999, fontSize: m ? 11 : 14, fontWeight: 900, border: `${m ? 2 : 3}px solid ${P.ink}` }}>15 Qs!</div>
            </div>
            <div style={{ position: 'absolute', bottom: m ? -12 : -24, left: m ? -16 : -42, transform: 'rotate(-14deg)' }}>
              <div style={{ background: P.warm, color: P.ink, padding: m ? '4px 10px' : '6px 14px', borderRadius: 999, fontSize: m ? 11 : 14, fontWeight: 900, border: `${m ? 2 : 3}px solid ${P.ink}` }}>For kids ⭐</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: m ? 14 : 30, alignItems: 'center', marginTop: m ? 36 : 40 }}>
            <div style={{ animation: `sb-float 3.6s ease-in-out infinite` }}><Cup size={m ? 60 : 100} fill={P.accent} stroke={P.ink} /></div>
            <div style={{ animation: `sb-float 3.2s ease-in-out infinite 0.4s` }}><Cup size={m ? 78 : 120} fill={P.deep} stroke={P.ink} /></div>
            <div style={{ animation: `sb-float 4s ease-in-out infinite 0.8s` }}><Cup size={m ? 60 : 100} fill={P.warm} stroke={P.ink} /></div>
          </div>

          <p style={{ fontSize: m ? 17 : 22, maxWidth: 540, margin: `${m ? 24 : 28}px auto ${m ? 22 : 24}px`, lineHeight: 1.5, color: P.ink, padding: m ? '0 4px' : 0 }}>
            Take 15 fun questions about chai. Earn stars. Find your chai-type!
          </p>

          <div style={{ display: 'flex', gap: m ? 10 : 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={onStart} style={primaryBtn(P, m)}>Start brewing! ▸</button>
            <button onClick={onLeaderboard} style={secondaryBtn(P, m)}>🏆 Leaderboard</button>
          </div>
        </div>
      </Screen>
    );
  }

  // ─── Entry ────────────────────────────────────────────────────────
  function SEntry({ P, dur, m, player, setPlayer, onBack, onBegin }) {
    const nameRef = useRef(null);
    useEffect(() => { nameRef.current && nameRef.current.focus(); }, []);
    const canStart = player.name.trim().length > 0 && player.klass.trim().length > 0;

    // Live "already played" check — fires on every keystroke so the kid
    // knows immediately if their name + class is taken.
    const existing = canStart ? window.findPlayerEntry(player.name, player.klass) : null;
    const submit = (e) => {
      e && e.preventDefault();
      if (!canStart) return;
      if (existing) return; // block — admin must delete the row first
      onBegin();
    };

    const fieldStyle = {
      width: '100%', padding: m ? '14px 16px' : '18px 22px',
      borderRadius: 18, border: `${m ? 3 : 4}px solid ${existing ? P.accent : P.ink}`,
      background: '#fff', color: P.ink,
      // 16px+ avoids iOS auto-zoom
      fontSize: m ? 18 : 22, fontWeight: 800, fontFamily: 'inherit',
      boxShadow: `0 5px 0 ${existing ? P.accent : P.ink}`, outline: 'none',
      boxSizing: 'border-box',
    };

    return (
      <Screen m={m} style={{ display: 'grid', placeItems: 'center', animation: `sb-pop ${dur(420)} cubic-bezier(.34,1.56,.64,1) both` }}>
        <form onSubmit={submit} style={{ width: '100%', maxWidth: 540 }}>
          <div style={{ textAlign: 'center', marginBottom: m ? 18 : 22 }}>
            <div style={{ display: 'inline-flex', gap: 10, alignItems: 'center', padding: '6px 14px', background: P.warm, border: `3px solid ${P.ink}`, borderRadius: 999, fontWeight: 900, fontSize: m ? 12 : 14, letterSpacing: '0.16em', textTransform: 'uppercase', boxShadow: `0 4px 0 ${P.ink}` }}>
              <Cup size={m ? 16 : 20} fill={P.accent} stroke={P.ink} steam={false} /> Sign in to play
            </div>
            <h1 style={{ fontFamily: '"Fraunces", serif', fontSize: m ? 34 : 50, lineHeight: 1, margin: `${m ? 12 : 14}px 0 8px`, color: P.ink, fontWeight: 900 }}>
              Tell us who's brewing!
            </h1>
            <p style={{ fontSize: m ? 14 : 16, color: P.ink, opacity: 0.75, margin: 0 }}>One try per kid — your score goes on the class leaderboard.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ display: 'block' }}>
              <div style={labelStyle(P, m)}>Your name</div>
              <input ref={nameRef} type="text" value={player.name} maxLength={24}
                onChange={(e) => setPlayer({ ...player, name: e.target.value })}
                placeholder="e.g. Priya" autoComplete="off" style={fieldStyle} />
            </label>
            <label style={{ display: 'block' }}>
              <div style={labelStyle(P, m)}>Class</div>
              <input type="text" value={player.klass} maxLength={16}
                onChange={(e) => setPlayer({ ...player, klass: e.target.value })}
                placeholder="e.g. 5B" autoComplete="off" style={fieldStyle} />
            </label>
          </div>

          {existing && (
            <div style={{
              marginTop: 16, padding: '12px 14px', borderRadius: 14,
              background: `${P.accent}1a`, border: `3px dashed ${P.accent}`,
              fontSize: m ? 13 : 14, fontWeight: 800, color: P.ink, lineHeight: 1.4,
            }}>
              <strong style={{ color: P.accent, fontSize: m ? 14 : 15, display: 'block', marginBottom: 4 }}>
                ⚠ You've already played, {existing.name}!
              </strong>
              You scored <strong>{existing.score}/{existing.total}</strong> in {existing.elapsed}s. This is a class quiz — one try per kid. Ask a teacher if you really need a re-try.
            </div>
          )}

          <div style={{
            display: 'flex', flexDirection: m ? 'column-reverse' : 'row',
            justifyContent: 'space-between', marginTop: m ? 22 : 26, gap: 10,
          }}>
            <button type="button" onClick={onBack} style={{
              ...secondaryBtn(P, m), width: m ? '100%' : 'auto',
            }}>← Back</button>
            <button type="submit" disabled={!canStart || !!existing} style={{
              ...primaryBtn(P, m),
              background: (canStart && !existing) ? P.ink : `${P.ink}55`,
              cursor: (canStart && !existing) ? 'pointer' : 'not-allowed',
              boxShadow: (canStart && !existing) ? `0 6px 0 ${P.accent}, 0 12px 30px ${P.ink}44` : 'none',
              width: m ? '100%' : 'auto',
            }}>{existing ? 'Already played' : "Let's brew! ▸"}</button>
          </div>
        </form>
      </Screen>
    );
  }

  // ─── Question ─────────────────────────────────────────────────────
  function SQuestion({ Q, P, dur, m, player }) {
    const Icon = iconForQuestion(Q.current);
    const showResult = Q.isAnswered;
    return (
      <Screen m={m} padding={m ? '14px 12px 20px' : '32px 56px'} style={{
        display: 'flex', flexDirection: 'column', gap: 0,
        animation: `sb-pop ${dur(420)} cubic-bezier(.34,1.56,.64,1) both`,
      }}>
        <div key={Q.idx} style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 0 }}>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: m ? 8 : 14, flexWrap: m ? 'wrap' : 'nowrap' }}>
            <div style={pill(P.ink, P.paper, m, true)}>Q {Q.idx + 1}/{Q.total}</div>
            {player && player.name && (
              <div style={{
                background: '#fff', color: P.ink, padding: m ? '6px 10px' : '8px 14px', borderRadius: 12,
                fontSize: m ? 12 : 14, fontWeight: 800, border: `3px solid ${P.ink}`,
                boxShadow: `0 4px 0 ${P.ink}`, display: 'flex', alignItems: 'center', gap: 6,
                maxWidth: m ? 150 : 240, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                <span style={{ fontWeight: 900 }}>{player.name}</span>
                {player.klass && <span style={{ background: P.warm, padding: '2px 6px', borderRadius: 99, fontSize: m ? 10 : 12, fontWeight: 900 }}>{player.klass}</span>}
              </div>
            )}
            {Q.timerSec > 0 && (
              <TimerPill remaining={Q.remaining} total={Q.timerSec} P={P} m={m} answered={showResult} />
            )}
            <div style={{
              flex: 1, minWidth: m ? '100%' : 0, order: m ? 5 : 0,
              height: m ? 14 : 18, background: '#fff',
              border: `3px solid ${P.ink}`, borderRadius: 999, overflow: 'hidden',
              boxShadow: `0 3px 0 ${P.ink}22`,
            }}>
              <div style={{ width: `${Q.progress * 100}%`, height: '100%', background: `linear-gradient(90deg, ${P.warm}, ${P.accent})`, transition: `width ${dur(420)} ease-out` }} />
            </div>
            <div style={{
              background: '#fff', padding: m ? '6px 10px' : '8px 14px', borderRadius: 12, border: `3px solid ${P.ink}`,
              display: 'flex', alignItems: 'center', gap: 6, fontWeight: 900, fontSize: m ? 15 : 20,
              boxShadow: `0 4px 0 ${P.ink}`,
            }}>
              <Star size={m ? 16 : 20} fill={P.accent} /> {Q.score}
            </div>
          </div>

          {/* Question card */}
          <div style={{
            marginTop: m ? 14 : 20,
            padding: m ? '14px 14px' : '20px 28px',
            background: '#fff', borderRadius: m ? 20 : 28,
            border: `${m ? 3 : 4}px solid ${P.ink}`, boxShadow: `0 ${m ? 4 : 6}px 0 ${P.ink}`,
            display: 'flex', flexDirection: m ? 'column' : 'row',
            alignItems: m ? 'flex-start' : 'center', gap: m ? 12 : 22,
          }}>
            <div style={{
              width: m ? 56 : 96, height: m ? 56 : 96, borderRadius: m ? 14 : 22, background: `${P.warm}55`,
              border: `3px solid ${P.ink}`, display: 'grid', placeItems: 'center', flexShrink: 0,
            }}>
              <Icon size={m ? 40 : 72} fill={P.accent} stroke={P.ink} />
            </div>
            <div style={{ fontSize: m ? 20 : 28, lineHeight: 1.2, fontWeight: 900, fontFamily: '"Fraunces", "Nunito", sans-serif', color: P.ink }}>
              {Q.current.q}
            </div>
          </div>

          {/* Options */}
          <div style={{
            flex: m ? 'none' : 1,
            display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr',
            gap: m ? 10 : 14, marginTop: m ? 14 : 20, alignContent: 'center',
          }}>
            {Q.current.options.map((opt, i) => {
              const chosen = Q.picked === i;
              const correct = !!opt.correct;
              let bg = '#fff';
              if (showResult && correct) bg = '#e8f4d8';
              else if (showResult && chosen && !correct) bg = '#fcdacc';
              return (
                <button key={i} onClick={() => Q.pick(i)} disabled={showResult}
                  style={{
                    textAlign: 'left', padding: m ? '14px 14px' : '18px 20px',
                    background: bg, border: `${m ? 3 : 4}px solid ${P.ink}`, borderRadius: m ? 16 : 22,
                    fontSize: m ? 17 : 21, fontWeight: 800, fontFamily: 'inherit', color: P.ink,
                    cursor: showResult ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: m ? 12 : 16,
                    boxShadow: `0 ${m ? 4 : 5}px 0 ${P.ink}`,
                    transition: `transform ${dur(180)}, background ${dur(240)}`,
                    transform: chosen && showResult ? 'translateY(2px)' : 'translateY(0)',
                    minHeight: 56, touchAction: 'manipulation', textAlign: 'left',
                  }}>
                  <span style={{
                    width: m ? 36 : 42, height: m ? 36 : 42, borderRadius: 12,
                    background: (showResult && correct) ? P.leaf : (showResult && chosen) ? P.accent : P.warm,
                    border: `3px solid ${P.ink}`, display: 'grid', placeItems: 'center',
                    fontSize: m ? 18 : 22, fontWeight: 900, color: P.ink, flexShrink: 0,
                    fontFamily: '"Fraunces", serif',
                  }}>{'ABCD'[i]}</span>
                  <span style={{ flex: 1 }}>{opt.label}</span>
                  {showResult && correct && <Check size={m ? 22 : 26} color={P.leaf} />}
                  {showResult && chosen && !correct && <Cross size={m ? 22 : 26} color={P.accent} />}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          {showResult && (
            <div style={{
              display: 'flex', flexDirection: m ? 'column' : 'row',
              alignItems: m ? 'stretch' : 'center', gap: m ? 10 : 14,
              marginTop: m ? 14 : 18,
              animation: `sb-slide ${dur(360)} ease-out both`,
            }}>
              <div style={{
                flex: 1, padding: m ? '12px 14px' : '14px 18px', borderRadius: m ? 14 : 18,
                background: Q.isCorrect ? P.leaf : P.accent, color: '#fff',
                border: `3px solid ${P.ink}`, boxShadow: `0 5px 0 ${P.ink}`,
                fontSize: m ? 14 : 17, fontWeight: 700, lineHeight: 1.35,
              }}>
                <strong style={{ marginRight: 8, letterSpacing: '0.04em', fontWeight: 900 }}>
                  {Q.isCorrect ? 'Yes! 🎉' : Q.timedOut ? '⏰ Time!' : 'Not quite —'}
                </strong>
                {Q.current.fact}
              </div>
              <button onClick={Q.next} style={{
                padding: m ? '14px 20px' : '16px 28px', borderRadius: m ? 14 : 18,
                background: P.ink, color: P.paper,
                fontSize: m ? 17 : 20, fontWeight: 900, border: `3px solid ${P.ink}`,
                boxShadow: `0 5px 0 ${P.accent}`,
                cursor: 'pointer', fontFamily: 'inherit',
                width: m ? '100%' : 'auto', touchAction: 'manipulation',
              }}>
                {Q.idx + 1 >= Q.total ? 'Result ▸' : 'Next ▸'}
              </button>
            </div>
          )}
        </div>
      </Screen>
    );
  }

  // Timer pill — color shifts red when low
  function TimerPill({ remaining, total, P, m, answered }) {
    const ratio = total > 0 ? remaining / total : 1;
    const low = ratio < 0.3;
    const bg = answered ? `${P.ink}22` : (low ? '#fcdacc' : '#fff');
    const fg = answered ? P.ink : (low ? P.accent : P.ink);
    return (
      <div style={{
        background: bg, color: fg,
        padding: m ? '6px 10px' : '8px 14px', borderRadius: 12,
        border: `3px solid ${P.ink}`, boxShadow: `0 4px 0 ${P.ink}`,
        display: 'flex', alignItems: 'center', gap: 6,
        fontWeight: 900, fontSize: m ? 15 : 18, fontFamily: 'inherit',
        minWidth: m ? 64 : 80, justifyContent: 'center',
      }}>
        <span style={{ fontSize: m ? 14 : 16 }}>⏱</span>
        {Math.max(0, remaining)}<span style={{ fontSize: 12, fontWeight: 800, opacity: 0.6 }}>s</span>
      </div>
    );
  }

  // ─── Result ───────────────────────────────────────────────────────
  function SResult({ Q, P, dur, m, player, onSubmit, onSkip }) {
    return (
      <Screen m={m} padding={m ? '20px 16px' : '40px 64px'} style={{
        display: m ? 'flex' : 'grid', flexDirection: m ? 'column' : undefined,
        gridTemplateColumns: m ? undefined : '1fr 1fr',
        gap: m ? 18 : 32, alignItems: 'center',
      }}>
        <window.Confetti active={true} />

        {m && <ResultCard Q={Q} P={P} dur={dur} m={m} />}

        <div style={{ animation: `sb-pop ${dur(600)} cubic-bezier(.34,1.56,.64,1) both`, textAlign: m ? 'center' : 'left', width: '100%' }}>
          <div style={{
            display: 'inline-block', background: P.warm, color: P.ink,
            padding: '8px 14px', borderRadius: 999, border: `3px solid ${P.ink}`,
            fontWeight: 900, fontSize: m ? 12 : 14, letterSpacing: '0.12em',
            boxShadow: `0 4px 0 ${P.ink}`,
          }}>
            {player && player.name ? `Nice work, ${player.name}!` : 'YOUR CHAI-TYPE'}
          </div>
          <h1 style={{
            fontFamily: '"Fraunces", serif', fontSize: m ? 44 : 72, lineHeight: 0.98,
            margin: `${m ? 14 : 18}px 0 ${m ? 8 : 14}px`,
            color: P.accent, fontWeight: 900, letterSpacing: '-0.02em',
            WebkitTextStroke: `2px ${P.ink}`,
          }}>{Q.result.title}!</h1>
          <p style={{ fontSize: m ? 15 : 19, lineHeight: 1.4, maxWidth: m ? '100%' : 440, margin: m ? '0 auto 18px' : '0 0 22px' }}>{Q.result.blurb}</p>
          <div style={{
            display: 'inline-flex', alignItems: 'baseline', gap: 8,
            padding: m ? '10px 16px' : '12px 20px', background: '#fff', borderRadius: m ? 16 : 20,
            border: `${m ? 3 : 4}px solid ${P.ink}`, boxShadow: `0 5px 0 ${P.ink}`,
            marginBottom: m ? 18 : 24,
          }}>
            <span style={{ fontSize: m ? 13 : 16, fontWeight: 800 }}>Score</span>
            <span style={{ fontSize: m ? 32 : 42, fontWeight: 900, color: P.accent, fontFamily: '"Fraunces", serif' }}>{Q.score}</span>
            <span style={{ fontSize: m ? 14 : 18, opacity: 0.55, fontWeight: 800 }}>/ {Q.total}</span>
            <span style={{ marginLeft: m ? 8 : 14, fontSize: m ? 11 : 14, fontWeight: 800, opacity: 0.6 }}>in {Q.elapsed}s</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: m ? 'center' : 'flex-start' }}>
            <button onClick={onSubmit} style={primaryBtn(P, m, P.accent)}>🏆 Save to leaderboard</button>
            <button onClick={onSkip} style={secondaryBtn(P, m)}>Skip →</button>
          </div>
        </div>

        {!m && <div style={{ display: 'grid', placeItems: 'center' }}><ResultCard Q={Q} P={P} dur={dur} m={m} /></div>}
      </Screen>
    );
  }

  function ResultCard({ Q, P, dur, m }) {
    return (
      <div style={{
        width: m ? 240 : 300, height: m ? 320 : 400, borderRadius: m ? 22 : 28,
        background: '#fff', border: `${m ? 4 : 5}px solid ${P.ink}`,
        boxShadow: `0 10px 0 ${P.ink}, 0 24px 60px ${P.accent}55`,
        padding: m ? 16 : 22, transform: 'rotate(-4deg)',
        display: 'flex', flexDirection: 'column', gap: 12, position: 'relative',
        animation: `sb-card ${dur(700)} cubic-bezier(.34,1.56,.64,1) both`,
        margin: m ? '8px auto' : 0,
      }}>
        <div style={{
          position: 'absolute', top: -16, left: 14,
          background: P.accent, color: '#fff', padding: '4px 12px',
          borderRadius: 999, border: `3px solid ${P.ink}`,
          fontWeight: 900, letterSpacing: '0.16em', fontSize: m ? 11 : 13,
          transform: 'rotate(-4deg)',
        }}>{Q.result.badge}</div>
        <div style={{
          flex: 1, background: `${P.warm}55`, borderRadius: m ? 14 : 18,
          border: `3px dashed ${P.ink}55`, display: 'grid', placeItems: 'center',
        }}>
          <Cup size={m ? 120 : 160} fill={Q.result.swatch} stroke={P.ink} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: '"Fraunces", serif', fontSize: m ? 20 : 26, fontWeight: 900, lineHeight: 1, color: P.ink }}>{Q.result.title}</div>
          <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center', gap: 4 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={m ? 16 : 20} fill={i < Math.ceil((Q.score / Q.total) * 5) ? P.accent : `${P.ink}25`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Leaderboard (no destructive buttons — admin only) ────────────
  function SLeaderboard({ P, dur, m, highlightId, onBack }) {
    // Dedupe to one row per player (keeps the best run). One spammy kid no
    // longer clogs the board.
    const [entries, setEntries] = useState(() => window.bestPerPlayer());
    const [allCount, setAllCount] = useState(() => window.loadLeaderboard().length);
    useEffect(() => {
      const unsub = window.subscribeLeaderboard((list) => {
        setEntries(window.bestPerPlayer(list));
        setAllCount(list.length);
      });
      return unsub;
    }, []);
    const cloud = window.isCloudMode && window.isCloudMode();
    const top3 = entries.slice(0, 3);
    const rest = entries.slice(3);

    return (
      <Screen m={m} padding={m ? '16px 14px 24px' : '24px 40px 28px'} scroll style={{
        display: 'flex', flexDirection: 'column', gap: m ? 12 : 14,
        animation: `sb-pop ${dur(420)} cubic-bezier(.34,1.56,.64,1) both`,
      }}>
        <div style={{
          display: 'flex', alignItems: m ? 'flex-start' : 'center', justifyContent: 'space-between',
          gap: m ? 10 : 16, flexDirection: m ? 'column' : 'row',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: m ? 10 : 14 }}>
            <div style={{ fontSize: m ? 38 : 52 }}>🏆</div>
            <div>
              <div style={{ fontSize: m ? 11 : 13, letterSpacing: '0.22em', fontWeight: 900, color: P.accent, textTransform: 'uppercase' }}>The Chai Quiz</div>
              <h1 style={{ fontFamily: '"Fraunces", serif', fontSize: m ? 32 : 52, lineHeight: 0.95, margin: '2px 0', fontWeight: 900, color: P.ink, letterSpacing: '-0.02em' }}>
                Class Leaderboard
              </h1>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, width: m ? '100%' : 'auto' }}>
            <button onClick={onBack} style={{
              ...primaryBtn(P, m), flex: m ? 1 : 'none',
              padding: m ? '12px 14px' : '14px 22px',
              fontSize: m ? 15 : 17,
            }}>↻ New player</button>
          </div>
        </div>

        {entries.length === 0 ? (
          <SEmptyBoard P={P} m={m} />
        ) : (
          <>
            <SPodium top3={top3} P={P} m={m} highlightId={highlightId} dur={dur} />
            <SBoardList entries={rest} startRank={4} P={P} m={m} highlightId={highlightId} />
            <div style={{ textAlign: 'center', fontSize: m ? 11 : 13, fontWeight: 800, color: P.ink, opacity: 0.55, marginTop: 4 }}>
              {entries.length} player{entries.length === 1 ? '' : 's'} · {cloud ? 'live across all devices ☁️' : 'saved on this device'} · top score & fastest time win
              {allCount > entries.length && (
                <div style={{ marginTop: 2, fontSize: m ? 10 : 11, opacity: 0.7 }}>
                  ({allCount} total runs — showing each player's best)
                </div>
              )}
            </div>
          </>
        )}
      </Screen>
    );
  }

  function SEmptyBoard({ P, m }) {
    return (
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', textAlign: 'center', padding: '30px 8px' }}>
        <div>
          <div style={{ fontSize: m ? 56 : 72, marginBottom: 8 }}>🫖</div>
          <h2 style={{ fontFamily: '"Fraunces", serif', fontSize: m ? 26 : 38, color: P.ink, margin: '0 0 8px' }}>The kettle is empty!</h2>
          <p style={{ fontSize: m ? 14 : 18, opacity: 0.7, maxWidth: 380, margin: '0 auto' }}>Be the first to take the quiz and your name will land on the board.</p>
        </div>
      </div>
    );
  }

  function SPodium({ top3, P, m, highlightId, dur }) {
    const order = [1, 0, 2]; // display: 2nd, 1st, 3rd
    // min-heights (not fixed) so content can push the card taller if needed
    const heights = m ? { 0: 168, 1: 144, 2: 132 } : { 0: 220, 1: 184, 2: 168 };
    const swatches = { 0: P.accent, 1: P.warm, 2: P.leaf };
    const labels = { 0: '1st', 1: '2nd', 2: '3rd' };
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: m ? 6 : 16, alignItems: 'end', padding: m ? '6px 0 0' : '10px 20px 0' }}>
        {order.map((rankIdx) => {
          const e = top3[rankIdx];
          if (!e) {
            return (
              <div key={rankIdx} style={{
                minHeight: heights[rankIdx], borderRadius: m ? 14 : 18,
                background: '#ffffffaa', border: `3px dashed ${P.ink}44`,
                display: 'grid', placeItems: 'center', color: `${P.ink}55`, fontWeight: 900, fontSize: m ? 16 : 22,
              }}>—</div>
            );
          }
          const isYou = e.id === highlightId;
          return (
            <div key={e.id} style={{
              position: 'relative', minHeight: heights[rankIdx], padding: m ? 10 : 14,
              borderRadius: m ? 14 : 18, background: swatches[rankIdx],
              border: `${m ? 3 : 4}px solid ${P.ink}`, boxShadow: `0 ${m ? 4 : 6}px 0 ${P.ink}`,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              gap: m ? 8 : 12,
              color: rankIdx === 0 ? '#fff' : P.ink, overflow: 'hidden',
              animation: isYou ? `sb-jiggle 700ms ${dur(0)} cubic-bezier(.34,1.56,.64,1)` : 'none',
            }}>
              {isYou && (
                <div style={{
                  position: 'absolute', top: m ? -10 : -14, right: m ? -6 : -10, padding: '4px 8px',
                  background: P.ink, color: P.paper, fontWeight: 900, fontSize: m ? 10 : 11,
                  letterSpacing: '0.1em', borderRadius: 99, transform: 'rotate(8deg)', zIndex: 2,
                }}>YOU!</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  fontFamily: '"Fraunces", serif', fontWeight: 900, fontSize: m ? 22 : 36, lineHeight: 1,
                }}>{labels[rankIdx]}</div>
                <div style={{ fontSize: m ? 20 : 28 }}>{rankIdx === 0 ? '🥇' : rankIdx === 1 ? '🥈' : '🥉'}</div>
              </div>
              <div>
                <div style={{
                  fontWeight: 900, fontSize: rankIdx === 0 ? (m ? 14 : 22) : (m ? 12 : 18), lineHeight: 1.1,
                  textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap',
                }}>{e.name}</div>
                <div style={{ fontSize: m ? 10 : 12, fontWeight: 800, opacity: 0.85, marginTop: 2 }}>{e.klass || '—'}</div>
                <div style={{
                  marginTop: m ? 4 : 6, display: 'inline-flex', gap: 4, alignItems: 'baseline',
                  background: '#fff', color: P.ink, padding: m ? '2px 6px' : '4px 10px', borderRadius: 99,
                  border: `2px solid ${P.ink}`, fontWeight: 900,
                }}>
                  <span style={{ fontSize: m ? 13 : 18 }}>{e.score}</span>
                  <span style={{ fontSize: m ? 9 : 11, opacity: 0.55 }}>/{e.total}</span>
                  {!m && <span style={{ fontSize: 11, opacity: 0.55 }}>· {e.elapsed}s</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function SBoardList({ entries, startRank, P, m, highlightId }) {
    if (!entries.length) return null;
    // Let the parent Screen handle scrolling instead of a nested scroll area
    // — nested scroll on Chromebooks was making the list feel stuck.
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {entries.map((e, i) => {
          const isYou = e.id === highlightId;
          return (
            <div key={e.id} style={{
              display: 'grid',
              gridTemplateColumns: m ? '32px 1fr auto auto' : '52px 1fr auto auto',
              gap: m ? 8 : 14,
              alignItems: 'center',
              padding: m ? '10px 12px' : '10px 16px', borderRadius: m ? 12 : 14,
              background: isYou ? P.warm : '#fff',
              border: `3px solid ${isYou ? P.ink : P.ink + '22'}`,
              boxShadow: isYou ? `0 4px 0 ${P.ink}` : `0 2px 0 ${P.ink}14`,
            }}>
              <div style={{ fontFamily: '"Fraunces", serif', fontSize: m ? 18 : 22, fontWeight: 900, color: P.ink }}>#{startRank + i}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 900, fontSize: m ? 14 : 17, color: P.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                {e.klass && <div style={{
                  background: P.leaf, color: '#fff', padding: '2px 8px', borderRadius: 99,
                  fontSize: m ? 10 : 11, fontWeight: 900, letterSpacing: '0.06em',
                }}>{e.klass}</div>}
                {isYou && <div style={{ fontSize: m ? 10 : 11, fontWeight: 900, color: P.ink, opacity: 0.8 }}>← you</div>}
              </div>
              <div style={{ fontWeight: 900, fontSize: m ? 16 : 18, color: P.accent, fontFamily: '"Fraunces", serif' }}>
                {e.score}<span style={{ fontSize: m ? 10 : 12, opacity: 0.5 }}>/{e.total}</span>
              </div>
              <div style={{ fontSize: m ? 11 : 13, fontWeight: 800, opacity: 0.55, minWidth: 36, textAlign: 'right' }}>{e.elapsed}s</div>
            </div>
          );
        })}
      </div>
    );
  }

  // ─── Style helpers ──────────────────────────────────────────────
  function primaryBtn(P, m, bg) {
    return {
      padding: m ? '14px 22px' : '18px 32px', borderRadius: 999,
      background: bg || P.ink, color: '#fff',
      fontSize: m ? 17 : 20, fontWeight: 900, border: 'none',
      cursor: 'pointer',
      boxShadow: `0 6px 0 ${bg ? P.deep : P.accent}, 0 12px 30px ${P.ink}33`,
      fontFamily: 'inherit', touchAction: 'manipulation',
    };
  }
  function secondaryBtn(P, m) {
    return {
      padding: m ? '14px 20px' : '16px 24px', borderRadius: 999,
      background: '#fff', color: P.ink,
      fontSize: m ? 15 : 17, fontWeight: 900,
      border: `${m ? 3 : 4}px solid ${P.ink}`, cursor: 'pointer',
      fontFamily: 'inherit', boxShadow: `0 5px 0 ${P.ink}`,
      touchAction: 'manipulation',
    };
  }
  function pill(bg, fg, m, shadow) {
    return {
      background: bg, color: fg,
      padding: m ? '6px 12px' : '8px 14px', borderRadius: 14,
      fontWeight: 900, fontSize: m ? 14 : 18,
      border: `3px solid #3d2818`,
      boxShadow: shadow ? `0 4px 0 #e8702b` : 'none',
    };
  }
  function labelStyle(P, m) {
    return {
      fontSize: m ? 12 : 14, fontWeight: 900, letterSpacing: '0.14em',
      textTransform: 'uppercase', marginBottom: 6, color: P.ink, opacity: 0.85,
    };
  }

  function SKeyframes() {
    return <style>{`
      @keyframes sb-pop { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
      @keyframes sb-bounce { 0% { opacity: 0; transform: scale(0.6); } 60% { opacity: 1; transform: scale(1.05); } 100% { transform: scale(1); } }
      @keyframes sb-wiggle { 0%,100% { transform: rotate(18deg); } 50% { transform: rotate(14deg) translateY(-3px); } }
      @keyframes sb-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
      @keyframes sb-slide { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes sb-card { 0% { opacity: 0; transform: rotate(-4deg) scale(0.7); } 70% { opacity: 1; transform: rotate(-4deg) scale(1.05); } 100% { transform: rotate(-4deg) scale(1); } }
      @keyframes sb-jiggle { 0%,100% { transform: translateY(0) rotate(0); } 30% { transform: translateY(-8px) rotate(-2deg); } 60% { transform: translateY(0) rotate(2deg); } }
    `}</style>;
  }

  // ════════════════════════════════════════════════════════════════
  // ADMIN PANEL — opens via Ctrl+Shift+T or hidden corner button.
  // Password-gated. Lets teachers tweak the quiz and manage scores.
  // ════════════════════════════════════════════════════════════════
  function AdminPanel({ P, m, onClose }) {
    const [authed, setAuthed] = useState(false);
    const [pw, setPw] = useState('');
    const [err, setErr] = useState('');

    const tryLogin = (e) => {
      e && e.preventDefault();
      if (window.checkAdminPassword(pw.trim())) { setAuthed(true); setErr(''); }
      else { setErr('Wrong password — try again.'); }
    };

    // ESC closes
    useEffect(() => {
      const handler = (e) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(20,12,6,0.65)',
        display: 'grid', placeItems: 'center', zIndex: 999, padding: 12,
      }}>
        <div onClick={(e) => e.stopPropagation()} style={{
          width: '100%', maxWidth: 720, maxHeight: '92vh', overflowY: 'auto',
          background: '#2a1810', color: '#fdf3dc',
          border: `4px solid ${P.warm}88`, borderRadius: 24,
          boxShadow: `0 24px 80px rgba(0,0,0,0.7)`,
          fontFamily: '"Nunito", system-ui, sans-serif',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: m ? '16px 18px' : '20px 26px',
            borderBottom: `2px dashed ${P.warm}44`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: m ? 28 : 36 }}>🔒</div>
              <div>
                <div style={{ fontSize: m ? 10 : 12, letterSpacing: '0.24em', color: P.warm, fontWeight: 900, textTransform: 'uppercase' }}>Teacher Control Panel</div>
                <h2 style={{ fontFamily: '"Fraunces", serif', fontSize: m ? 24 : 30, margin: '2px 0 0', fontWeight: 900, color: '#fdf3dc' }}>
                  Royal Chai Dashboard
                </h2>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close" style={adminCloseBtn(P, m)}>✕</button>
          </div>

          <div style={{ padding: m ? '18px 18px 22px' : '24px 26px 28px' }}>
            {!authed ? (
              <form onSubmit={tryLogin}>
                <div style={{ fontSize: m ? 13 : 14, color: '#fdf3dcaa', marginBottom: 16 }}>
                  This panel is for teachers. Enter the admin password to continue.
                </div>
                <div style={adminLabel(P, m)}>Admin password</div>
                <input type="password" autoFocus value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="••••••••"
                  style={adminInput(P, m)} />
                {err && <div style={{ marginTop: 8, color: '#ffb09a', fontSize: 13, fontWeight: 800 }}>{err}</div>}
                <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button type="submit" style={adminPrimary(P, m)}>🗝 Unlock</button>
                  <button type="button" onClick={onClose} style={adminGhost(P, m)}>Cancel</button>
                </div>
                <div style={{ marginTop: 18, fontSize: 12, opacity: 0.55 }}>
                  Default password: <code style={{ background: '#1d100a', padding: '2px 6px', borderRadius: 4, color: P.warm }}>chai</code> — change it below once you're in.
                </div>
              </form>
            ) : (
              <AdminAuthed P={P} m={m} onClose={onClose} />
            )}
          </div>
        </div>
      </div>
    );
  }

  function AdminAuthed({ P, m, onClose }) {
    const [entries, setEntries] = useState(() => window.sortedLeaderboard());
    const [pwNew, setPwNew] = useState('');
    const [pwSavedAt, setPwSavedAt] = useState(0);
    const [editingId, setEditingId] = useState(null);
    const [editVal, setEditVal] = useState('');

    // Live subscription — also catches remote Firebase pushes
    useEffect(() => {
      const unsub = window.subscribeLeaderboard((list) => {
        setEntries(window.sortedLeaderboard(list));
      });
      return unsub;
    }, []);

    const cloud = window.isCloudMode && window.isCloudMode();

    const startEdit = (e) => { setEditingId(e.id); setEditVal(String(e.elapsed)); };
    const cancelEdit = () => { setEditingId(null); setEditVal(''); };
    const saveEdit = (id) => {
      const n = parseInt(editVal, 10);
      if (!Number.isFinite(n) || n < 0) { alert('Enter a positive number of seconds.'); return; }
      window.updateEntry(id, { elapsed: n });
      cancelEdit();
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: m ? 18 : 22 }}>
        {/* Backend mode banner */}
        <div style={{
          padding: '10px 14px', borderRadius: 12,
          background: cloud ? '#1f3d2a' : '#3a2418',
          border: `2px solid ${cloud ? '#9fc972' : P.warm + '55'}`,
          color: cloud ? '#cfeab2' : '#fdf3dc',
          fontWeight: 800, fontSize: 13, lineHeight: 1.4,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>{cloud ? '☁️' : '💾'}</span>
          {cloud
            ? <span><strong>Cloud mode on</strong> — every device sees the same scores in real time.</span>
            : <span><strong>Local mode</strong> — scores live on this device only. To share across devices, set up <code style={{ background: '#1d100a', padding: '1px 5px', borderRadius: 4 }}>firebase-config.js</code>.</span>
          }
        </div>

        {/* Scores */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 10, flexWrap: 'wrap' }}>
            <div style={{ ...adminSectionTitle(P, m), marginBottom: 0 }}>
              🏆 Scores ({entries.length})
            </div>
            {entries.length > 0 && (
              <button onClick={() => {
                if (confirm(`Delete ALL ${entries.length} scores? This cannot be undone.`)) {
                  window.clearLeaderboard();
                }
              }} style={{
                padding: m ? '8px 14px' : '10px 16px',
                background: '#b73a1a', color: '#fff',
                border: `2px solid #ff8b6a`, borderRadius: 999,
                fontWeight: 900, fontSize: m ? 13 : 14, cursor: 'pointer',
                fontFamily: 'inherit',
              }}>🗑 Clear all scores</button>
            )}
          </div>
          {entries.length === 0 ? (
            <div style={{
              padding: '18px 16px', textAlign: 'center', opacity: 0.6,
              border: `2px dashed ${P.warm}44`, borderRadius: 14,
            }}>No scores yet. They'll appear here as kids play.</div>
          ) : (
            <div style={{
              maxHeight: m ? 340 : 380, overflowY: 'auto',
              border: `2px solid ${P.warm}33`, borderRadius: 14,
            }}>
              {entries.map((e, i) => {
                const isEditing = editingId === e.id;
                return (
                  <div key={e.id} style={{
                    display: 'grid',
                    gridTemplateColumns: m ? '32px 1fr 64px 100px 36px' : '40px 1fr 80px 140px 44px',
                    gap: m ? 6 : 10, alignItems: 'center',
                    padding: m ? '10px 10px' : '12px 14px',
                    borderBottom: `1px solid ${P.warm}22`,
                    background: i % 2 ? '#1d100a' : 'transparent',
                  }}>
                    <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 900, color: P.warm, fontSize: m ? 14 : 16 }}>#{i + 1}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 900, color: '#fdf3dc', fontSize: m ? 13 : 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                      <div style={{ fontSize: 11, opacity: 0.65, marginTop: 1 }}>{e.klass || '—'}</div>
                    </div>
                    <div style={{ fontWeight: 900, color: P.warm, fontFamily: '"Fraunces", serif', fontSize: m ? 14 : 17 }}>
                      {e.score}<span style={{ fontSize: 10, opacity: 0.6 }}>/{e.total}</span>
                    </div>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <input
                          type="number" min="0" autoFocus
                          value={editVal}
                          onChange={(ev) => setEditVal(ev.target.value)}
                          onKeyDown={(ev) => {
                            if (ev.key === 'Enter') saveEdit(e.id);
                            if (ev.key === 'Escape') cancelEdit();
                          }}
                          style={{
                            width: m ? 50 : 70, padding: '4px 6px', background: '#3a2418',
                            color: '#fdf3dc', border: `2px solid ${P.warm}`, borderRadius: 6,
                            fontFamily: 'inherit', fontSize: 13, fontWeight: 800, outline: 'none',
                          }} />
                        <span style={{ fontSize: 11, color: P.warm, fontWeight: 800 }}>s</span>
                        <button onClick={() => saveEdit(e.id)} style={tinyBtn(P, '#9fc972', '#1f3d2a')}>✓</button>
                        <button onClick={cancelEdit} style={tinyBtn(P, '#fdf3dc88', 'transparent')}>✕</button>
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: m ? 12 : 13, fontWeight: 800, opacity: 0.85,
                      }}>
                        <span>{e.elapsed}s</span>
                        <button
                          onClick={() => startEdit(e)}
                          title="Edit time (e.g. if cheated)"
                          style={tinyBtn(P, P.warm, '#3a2418')}>✎</button>
                      </div>
                    )}
                    <button onClick={() => {
                      if (confirm(`Delete ${e.name}'s score? This can't be undone.`)) {
                        window.deleteEntry(e.id);
                      }
                    }} title="Delete (cheated)" style={{
                      background: 'transparent', color: '#ffb09a',
                      border: `2px solid #ffb09a66`, borderRadius: 8,
                      fontWeight: 900, cursor: 'pointer', padding: '4px 6px', fontSize: 12,
                      fontFamily: 'inherit',
                    }}>🗑</button>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.6, lineHeight: 1.4 }}>
            ✎ edit a player's time (e.g. set a cheater to 999s so they drop the ranking). 🗑 delete a row entirely.
          </div>
        </section>

        {/* Password */}
        <section>
          <div style={adminSectionTitle(P, m)}>🔑 Change admin password</div>
          <div style={adminCard(P)}>
            <div style={adminLabel(P, m)}>New password</div>
            <input type="text" value={pwNew} onChange={(e) => setPwNew(e.target.value)}
              placeholder="Type a new password" style={adminInput(P, m)} />
            <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => {
                if (pwNew.trim().length < 3) { alert('Password must be at least 3 characters.'); return; }
                window.saveAdmin({ password: pwNew.trim() });
                setPwNew(''); setPwSavedAt(Date.now());
              }} style={adminPrimary(P, m)}>Save password</button>
              {pwSavedAt > 0 && <span style={{ fontSize: 12, color: P.warm, fontWeight: 800 }}>✓ Saved!</span>}
            </div>
            <div style={adminHint}>Stored on this device only. Tell your teachers — not the kids!</div>
          </div>
        </section>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
          <button onClick={onClose} style={adminPrimary(P, m)}>Done</button>
        </div>
      </div>
    );
  }

  function tinyBtn(P, color, bg) {
    return {
      width: 24, height: 24, lineHeight: 1, padding: 0,
      background: bg, color, border: `2px solid ${color}55`,
      borderRadius: 6, fontWeight: 900, cursor: 'pointer',
      fontFamily: 'inherit', fontSize: 12,
    };
  }

  // Admin styles
  function adminSectionTitle(P, m) {
    return {
      fontFamily: '"Fraunces", serif', fontSize: m ? 18 : 22,
      fontWeight: 900, color: '#fdf3dc', marginBottom: 10, letterSpacing: '-0.01em',
    };
  }
  function adminCard(P) {
    return {
      background: '#1d100a', padding: 14, borderRadius: 14,
      border: `2px solid ${P.warm}33`,
    };
  }
  function adminLabel(P, m) {
    return {
      fontSize: m ? 11 : 12, letterSpacing: '0.18em', textTransform: 'uppercase',
      color: P.warm, fontWeight: 900,
    };
  }
  function adminInput(P, m) {
    return {
      width: '100%', padding: '12px 14px', boxSizing: 'border-box',
      background: '#3a2418', color: '#fdf3dc',
      border: `2px solid ${P.warm}66`, borderRadius: 10,
      fontSize: m ? 15 : 16, fontWeight: 700, fontFamily: 'inherit',
      outline: 'none', marginTop: 6,
    };
  }
  function adminPrimary(P, m) {
    return {
      padding: m ? '10px 18px' : '12px 22px',
      background: P.accent, color: '#fff',
      border: `2px solid ${P.warm}`, borderRadius: 999,
      fontWeight: 900, fontSize: m ? 14 : 15, cursor: 'pointer',
      fontFamily: 'inherit', boxShadow: '0 4px 0 #1d100a',
    };
  }
  function adminGhost(P, m) {
    return {
      padding: m ? '8px 14px' : '10px 16px',
      background: 'transparent', color: '#fdf3dc',
      border: `2px solid #fdf3dc44`, borderRadius: 999,
      fontWeight: 900, fontSize: m ? 13 : 14, cursor: 'pointer',
      fontFamily: 'inherit',
    };
  }
  function adminCloseBtn(P, m) {
    return {
      width: 32, height: 32, borderRadius: '50%',
      background: 'transparent', color: '#fdf3dc',
      border: `2px solid #fdf3dc44`, fontWeight: 900,
      cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
    };
  }
  const adminHint = { marginTop: 8, fontSize: 12, opacity: 0.6, lineHeight: 1.4 };

  window.VariationStorybook = VariationStorybook;
})();

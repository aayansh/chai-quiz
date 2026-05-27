// Variation B — Storybook (playful, kid-first, big rounded shapes)
(function () {
  const { useState, useEffect, useRef } = React;
  const { Cup, Leaf, Cardamom, Cinnamon, Biscuit, StarAnise, Kettle, Star, Check, Cross, iconForQuestion } = window;

  function VariationStorybook({ animSpeed = 1, paletteIdx = 0 }) {
    const palettes = [
      { paper: '#fff5e0', ink: '#3d2818', accent: '#e8702b', leaf: '#6a9a3a', warm: '#f6c25a', deep: '#7a3d18' },
      { paper: '#ffe9c4', ink: '#2a1810', accent: '#c44d27', leaf: '#5a7a3a', warm: '#e8b86f', deep: '#5a2810' },
      { paper: '#fdebd3', ink: '#3d2818', accent: '#d96a2c', leaf: '#7aa84a', warm: '#f4ce6a', deep: '#7a3d18' },
    ];
    const P = palettes[paletteIdx] || palettes[0];
    const dur = (ms) => `${Math.round(ms / animSpeed)}ms`;

    // Outer flow: intro → entry → quiz (delegates to useQuiz) → leaderboard
    const [phase, setPhase] = useState('intro');
    const [player, setPlayer] = useState({ name: '', klass: '' });
    const [justSubmittedId, setJustSubmittedId] = useState(null);

    const Q = window.useQuiz({
      onCorrect: () => window.sfx.correct(),
      onWrong: () => window.sfx.wrong(),
      onFinish: () => window.sfx.kettle(),
    });

    // When entering the quiz phase, advance useQuiz from its internal 'intro' to 'q'.
    useEffect(() => {
      if (phase === 'quiz' && Q.stage === 'intro') Q.begin();
    }, [phase, Q.stage]);

    const submitScore = () => {
      const list = window.addEntry({
        name: player.name, klass: player.klass,
        score: Q.score, total: Q.total, elapsed: Q.elapsed,
      });
      // newest entry is last in list
      setJustSubmittedId(list[list.length - 1].id);
      setPhase('leaderboard');
    };

    const restartAll = () => {
      setPlayer({ name: '', klass: '' });
      setJustSubmittedId(null);
      Q.restart();
      setPhase('intro');
    };

    const baseFont = { fontFamily: '"Nunito", system-ui, sans-serif', color: P.ink, fontWeight: 700 };

    return (
      <div style={{
        width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
        background: `radial-gradient(circle at 20% 10%, ${P.warm}55, transparent 60%), radial-gradient(circle at 90% 90%, ${P.leaf}33, transparent 50%), ${P.paper}`,
        ...baseFont,
      }}>
        <Doodles P={P} />
        {phase === 'intro' && <SIntro P={P} dur={dur} onStart={() => setPhase('entry')} onLeaderboard={() => setPhase('leaderboard')} />}
        {phase === 'entry' && <SEntry P={P} dur={dur} player={player} setPlayer={setPlayer} onBack={() => setPhase('intro')} onBegin={() => setPhase('quiz')} />}
        {phase === 'quiz' && Q.stage === 'q' && <SQuestion Q={Q} P={P} dur={dur} player={player} />}
        {phase === 'quiz' && Q.stage === 'result' && <SResult Q={Q} P={P} dur={dur} player={player} onSubmit={submitScore} onSkip={() => setPhase('leaderboard')} />}
        {phase === 'leaderboard' && <SLeaderboard P={P} dur={dur} highlightId={justSubmittedId} onBack={restartAll} />}
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

  // ─── Intro ────────────────────────────────────────────────────────
  function SIntro({ P, dur, onStart, onLeaderboard }) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 40 }}>
        <div style={{ textAlign: 'center', position: 'relative', animation: `sb-bounce ${dur(800)} cubic-bezier(.34,1.56,.64,1) both` }}>
          <div style={{ display: 'inline-block', position: 'relative' }}>
            <div style={{
              background: P.accent, color: '#fff',
              padding: '18px 48px', borderRadius: 32,
              fontSize: 80, fontWeight: 900, letterSpacing: '-0.02em',
              transform: 'rotate(-2deg)',
              boxShadow: `0 8px 0 ${P.deep}, 0 16px 40px ${P.accent}66`,
              border: `4px solid ${P.ink}`,
              fontFamily: '"Fraunces", "Nunito", sans-serif',
            }}>
              The Chai Quiz
            </div>
            <div style={{ position: 'absolute', top: -24, right: -36, transform: 'rotate(18deg)', animation: `sb-wiggle 3s ease-in-out infinite` }}>
              <div style={{ background: P.leaf, color: '#fff', padding: '6px 14px', borderRadius: 999, fontSize: 14, fontWeight: 900, border: `3px solid ${P.ink}` }}>15 Qs!</div>
            </div>
            <div style={{ position: 'absolute', bottom: -24, left: -42, transform: 'rotate(-14deg)' }}>
              <div style={{ background: P.warm, color: P.ink, padding: '6px 14px', borderRadius: 999, fontSize: 14, fontWeight: 900, border: `3px solid ${P.ink}` }}>For kids ⭐</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 30, alignItems: 'center', marginTop: 40 }}>
            <div style={{ animation: `sb-float 3.6s ease-in-out infinite` }}><Cup size={100} fill={P.accent} stroke={P.ink} /></div>
            <div style={{ animation: `sb-float 3.2s ease-in-out infinite 0.4s` }}><Cup size={120} fill={P.deep} stroke={P.ink} /></div>
            <div style={{ animation: `sb-float 4s ease-in-out infinite 0.8s` }}><Cup size={100} fill={P.warm} stroke={P.ink} /></div>
          </div>

          <p style={{ fontSize: 22, maxWidth: 540, margin: '28px auto 24px', lineHeight: 1.5, color: P.ink }}>
            Take 15 fun questions about chai. Earn stars. Find your chai-type!
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
            <button onClick={onStart} style={{
              padding: '18px 40px', borderRadius: 999,
              background: P.ink, color: P.paper,
              fontSize: 22, fontWeight: 900, border: 'none',
              cursor: 'pointer',
              boxShadow: `0 6px 0 ${P.accent}, 0 12px 30px ${P.ink}44`,
              transition: `transform ${dur(200)}`,
              fontFamily: 'inherit',
            }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              Start brewing! ▸
            </button>
            <button onClick={onLeaderboard} style={{
              padding: '18px 26px', borderRadius: 999,
              background: '#fff', color: P.ink,
              fontSize: 18, fontWeight: 900, border: `4px solid ${P.ink}`,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: `0 6px 0 ${P.ink}`,
              transition: `transform ${dur(200)}`,
            }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              🏆 Leaderboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Entry (name + class) ─────────────────────────────────────────
  function SEntry({ P, dur, player, setPlayer, onBack, onBegin }) {
    const nameRef = useRef(null);
    useEffect(() => { nameRef.current && nameRef.current.focus(); }, []);
    const canStart = player.name.trim().length > 0 && player.klass.trim().length > 0;
    const submit = (e) => { e && e.preventDefault(); if (canStart) onBegin(); };

    const fieldStyle = {
      width: '100%', padding: '18px 22px',
      borderRadius: 18, border: `4px solid ${P.ink}`,
      background: '#fff', color: P.ink,
      fontSize: 24, fontWeight: 800, fontFamily: 'inherit',
      boxShadow: `0 5px 0 ${P.ink}`, outline: 'none',
    };

    return (
      <form onSubmit={submit} style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 40, animation: `sb-pop ${dur(420)} cubic-bezier(.34,1.56,.64,1) both` }}>
        <div style={{ width: 540, maxWidth: '92%' }}>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div style={{ display: 'inline-flex', gap: 10, alignItems: 'center', padding: '6px 14px', background: P.warm, border: `3px solid ${P.ink}`, borderRadius: 999, fontWeight: 900, fontSize: 14, letterSpacing: '0.16em', textTransform: 'uppercase', boxShadow: `0 4px 0 ${P.ink}` }}>
              <Cup size={20} fill={P.accent} stroke={P.ink} steam={false} /> Sign in to play
            </div>
            <h1 style={{ fontFamily: '"Fraunces", serif', fontSize: 52, lineHeight: 1, margin: '14px 0 8px', color: P.ink, fontWeight: 900 }}>
              Tell us who's brewing!
            </h1>
            <p style={{ fontSize: 17, color: P.ink, opacity: 0.75, margin: 0 }}>Your name will show on the class leaderboard.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{ display: 'block' }}>
              <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8, color: P.ink, opacity: 0.85 }}>Your name</div>
              <input ref={nameRef} type="text" value={player.name} maxLength={24}
                onChange={(e) => setPlayer({ ...player, name: e.target.value })}
                placeholder="e.g. Priya"
                style={fieldStyle} />
            </label>
            <label style={{ display: 'block' }}>
              <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8, color: P.ink, opacity: 0.85 }}>Class</div>
              <input type="text" value={player.klass} maxLength={16}
                onChange={(e) => setPlayer({ ...player, klass: e.target.value })}
                placeholder="e.g. 5B"
                style={fieldStyle} />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 26, gap: 12 }}>
            <button type="button" onClick={onBack} style={{
              padding: '16px 24px', borderRadius: 999,
              background: 'transparent', color: P.ink, border: `3px solid ${P.ink}`,
              fontSize: 17, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
            }}>← Back</button>
            <button type="submit" disabled={!canStart} style={{
              padding: '18px 38px', borderRadius: 999,
              background: canStart ? P.ink : `${P.ink}55`, color: P.paper,
              fontSize: 22, fontWeight: 900, border: 'none',
              cursor: canStart ? 'pointer' : 'not-allowed',
              boxShadow: canStart ? `0 6px 0 ${P.accent}, 0 12px 30px ${P.ink}44` : 'none',
              transition: `transform ${dur(200)}`,
              fontFamily: 'inherit',
            }}>
              Let's brew! ▸
            </button>
          </div>
        </div>
      </form>
    );
  }

  // ─── Question ─────────────────────────────────────────────────────
  function SQuestion({ Q, P, dur, player }) {
    const Icon = iconForQuestion(Q.idx);
    return (
      <div key={Q.idx} style={{ position: 'absolute', inset: 0, padding: '32px 56px', display: 'flex', flexDirection: 'column', animation: `sb-pop ${dur(420)} cubic-bezier(.34,1.56,.64,1) both` }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            background: P.ink, color: P.paper, padding: '10px 16px', borderRadius: 16,
            fontWeight: 900, fontSize: 18, letterSpacing: '0.02em',
            border: `3px solid ${P.ink}`, boxShadow: `0 4px 0 ${P.accent}`,
          }}>Q {Q.idx + 1}/{Q.total}</div>
          {player && (player.name || player.klass) && (
            <div style={{
              background: '#fff', color: P.ink, padding: '8px 14px', borderRadius: 14,
              fontSize: 15, fontWeight: 800, border: `3px solid ${P.ink}`,
              boxShadow: `0 4px 0 ${P.ink}`, display: 'flex', alignItems: 'center', gap: 8,
              maxWidth: 240, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              <span style={{ fontWeight: 900 }}>{player.name}</span>
              {player.klass && <span style={{ background: P.warm, padding: '2px 8px', borderRadius: 99, fontSize: 12, fontWeight: 900, letterSpacing: '0.05em' }}>{player.klass}</span>}
            </div>
          )}
          <div style={{ flex: 1, height: 18, background: '#fff', border: `3px solid ${P.ink}`, borderRadius: 999, overflow: 'hidden', boxShadow: `0 3px 0 ${P.ink}22` }}>
            <div style={{ width: `${Q.progress * 100}%`, height: '100%', background: `linear-gradient(90deg, ${P.warm}, ${P.accent})`, transition: `width ${dur(420)} ease-out` }} />
          </div>
          <div style={{
            background: '#fff', padding: '8px 14px', borderRadius: 14, border: `3px solid ${P.ink}`,
            display: 'flex', alignItems: 'center', gap: 6, fontWeight: 900, fontSize: 20,
            boxShadow: `0 4px 0 ${P.ink}`,
          }}>
            <Star size={20} fill={P.accent} /> {Q.score}
          </div>
        </div>

        {/* Question card */}
        <div style={{ marginTop: 20, padding: '20px 28px', background: '#fff', borderRadius: 28, border: `4px solid ${P.ink}`, boxShadow: `0 6px 0 ${P.ink}`, display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{
            width: 96, height: 96, borderRadius: 22, background: `${P.warm}55`,
            border: `3px solid ${P.ink}`, display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <Icon size={72} fill={P.accent} stroke={P.ink} />
          </div>
          <div style={{ fontSize: 30, lineHeight: 1.15, fontWeight: 900, fontFamily: '"Fraunces", "Nunito", sans-serif', color: P.ink }}>
            {Q.current.q}
          </div>
        </div>

        {/* Options grid */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 22, alignContent: 'center' }}>
          {Q.current.options.map((opt, i) => {
            const chosen = Q.picked === i;
            const showResult = Q.isAnswered;
            const correct = !!opt.correct;
            let bg = '#fff', accent = P.warm;
            if (showResult && correct) { bg = '#e8f4d8'; accent = P.leaf; }
            else if (showResult && chosen && !correct) { bg = '#fcdacc'; accent = P.accent; }
            else if (showResult) { bg = '#fff'; accent = `${P.ink}22`; }
            return (
              <button key={i} onClick={() => Q.pick(i)} disabled={Q.isAnswered}
                style={{
                  textAlign: 'left', padding: '20px 22px',
                  background: bg, border: `4px solid ${P.ink}`, borderRadius: 22,
                  fontSize: 22, fontWeight: 800, fontFamily: 'inherit', color: P.ink,
                  cursor: Q.isAnswered ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 16,
                  boxShadow: `0 6px 0 ${P.ink}`,
                  transition: `transform ${dur(180)}, background ${dur(240)}`,
                  transform: chosen && showResult ? 'translateY(2px)' : 'translateY(0)',
                  position: 'relative',
                }}
                onMouseEnter={(e) => { if (!Q.isAnswered) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 9px 0 ${P.ink}`; } }}
                onMouseLeave={(e) => { if (!Q.isAnswered) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 6px 0 ${P.ink}`; } }}>
                <span style={{
                  width: 44, height: 44, borderRadius: 12, background: accent,
                  border: `3px solid ${P.ink}`, display: 'grid', placeItems: 'center',
                  fontSize: 22, fontWeight: 900, color: P.ink, flexShrink: 0,
                  fontFamily: '"Fraunces", serif',
                }}>{'ABCD'[i]}</span>
                <span style={{ flex: 1 }}>{opt.label}</span>
                {showResult && correct && <Check size={28} color={P.leaf} />}
                {showResult && chosen && !correct && <Cross size={28} color={P.accent} />}
              </button>
            );
          })}
        </div>

        {/* Footer: fact + next */}
        {Q.isAnswered && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 18, animation: `sb-slide ${dur(360)} ease-out both` }}>
            <div style={{
              flex: 1, padding: '14px 18px', borderRadius: 18,
              background: Q.isCorrect ? P.leaf : P.accent, color: '#fff',
              border: `3px solid ${P.ink}`, boxShadow: `0 5px 0 ${P.ink}`,
              fontSize: 17, fontWeight: 700, lineHeight: 1.35,
            }}>
              <strong style={{ marginRight: 8, letterSpacing: '0.04em', fontWeight: 900 }}>
                {Q.isCorrect ? 'Yes! 🎉' : 'Not quite —'}
              </strong>
              {Q.current.fact}
            </div>
            <button onClick={Q.next} style={{
              padding: '16px 28px', borderRadius: 18, background: P.ink, color: P.paper,
              fontSize: 20, fontWeight: 900, border: `3px solid ${P.ink}`,
              boxShadow: `0 5px 0 ${P.accent}`,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {Q.idx + 1 >= Q.total ? 'Result ▸' : 'Next ▸'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── Result ───────────────────────────────────────────────────────
  function SResult({ Q, P, dur, player, onSubmit, onSkip }) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center', padding: '40px 64px' }}>
        <window.Confetti active={true} />
        <div style={{ animation: `sb-pop ${dur(600)} cubic-bezier(.34,1.56,.64,1) both` }}>
          <div style={{
            display: 'inline-block', background: P.warm, color: P.ink,
            padding: '8px 16px', borderRadius: 999, border: `3px solid ${P.ink}`,
            fontWeight: 900, fontSize: 14, letterSpacing: '0.12em',
            boxShadow: `0 4px 0 ${P.ink}`,
          }}>
            {player && player.name ? `Nice work, ${player.name}!` : 'YOUR CHAI-TYPE'}
          </div>
          <h1 style={{
            fontFamily: '"Fraunces", serif', fontSize: 78, lineHeight: 0.98, margin: '18px 0 14px',
            color: P.accent, fontWeight: 900, letterSpacing: '-0.02em',
            WebkitTextStroke: `2px ${P.ink}`,
          }}>{Q.result.title}!</h1>
          <p style={{ fontSize: 20, lineHeight: 1.4, maxWidth: 440, marginBottom: 22 }}>{Q.result.blurb}</p>
          <div style={{
            display: 'inline-flex', alignItems: 'baseline', gap: 8,
            padding: '12px 20px', background: '#fff', borderRadius: 20,
            border: `4px solid ${P.ink}`, boxShadow: `0 5px 0 ${P.ink}`,
            marginBottom: 24,
          }}>
            <span style={{ fontSize: 16, fontWeight: 800 }}>Score</span>
            <span style={{ fontSize: 44, fontWeight: 900, color: P.accent, fontFamily: '"Fraunces", serif' }}>{Q.score}</span>
            <span style={{ fontSize: 18, opacity: 0.55, fontWeight: 800 }}>/ {Q.total}</span>
            <span style={{ marginLeft: 14, fontSize: 14, fontWeight: 800, opacity: 0.6 }}>in {Q.elapsed}s</span>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={onSubmit} style={bigBtn(P.accent, P.ink, '#fff')}>🏆 Save to leaderboard</button>
            <button onClick={onSkip} style={bigBtn('#fff', P.ink, P.ink)}>Skip →</button>
          </div>
        </div>
        <div style={{ display: 'grid', placeItems: 'center' }}>
          <div style={{
            width: 300, height: 400, borderRadius: 28,
            background: '#fff', border: `5px solid ${P.ink}`,
            boxShadow: `0 10px 0 ${P.ink}, 0 24px 60px ${P.accent}55`,
            padding: 22, transform: 'rotate(-4deg)',
            display: 'flex', flexDirection: 'column', gap: 14, position: 'relative',
            animation: `sb-card ${dur(700)} cubic-bezier(.34,1.56,.64,1) both`,
          }}>
            <div style={{
              position: 'absolute', top: -18, left: 18,
              background: P.accent, color: '#fff', padding: '4px 14px',
              borderRadius: 999, border: `3px solid ${P.ink}`,
              fontWeight: 900, letterSpacing: '0.16em', fontSize: 13,
              transform: 'rotate(-4deg)',
            }}>{Q.result.badge}</div>
            <div style={{
              flex: 1, background: `${P.warm}55`, borderRadius: 18,
              border: `3px dashed ${P.ink}55`, display: 'grid', placeItems: 'center',
            }}>
              <Cup size={160} fill={Q.result.swatch} stroke={P.ink} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: '"Fraunces", serif', fontSize: 26, fontWeight: 900, lineHeight: 1, color: P.ink }}>{Q.result.title}</div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 4 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={20} fill={i < Math.ceil((Q.score / Q.total) * 5) ? P.accent : `${P.ink}25`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Leaderboard ──────────────────────────────────────────────────
  function SLeaderboard({ P, dur, highlightId, onBack }) {
    const [entries, setEntries] = useState(() => window.sortedLeaderboard());
    const [confirmClear, setConfirmClear] = useState(false);
    const top3 = entries.slice(0, 3);
    const rest = entries.slice(3);

    const reload = () => setEntries(window.sortedLeaderboard());
    const doClear = () => { window.clearLeaderboard(); reload(); setConfirmClear(false); };

    return (
      <div style={{ position: 'absolute', inset: 0, padding: '24px 40px 28px', display: 'flex', flexDirection: 'column', gap: 14, animation: `sb-pop ${dur(420)} cubic-bezier(.34,1.56,.64,1) both` }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 52 }}>🏆</div>
            <div>
              <div style={{ fontSize: 13, letterSpacing: '0.22em', fontWeight: 900, color: P.accent, textTransform: 'uppercase' }}>The Chai Quiz</div>
              <h1 style={{ fontFamily: '"Fraunces", serif', fontSize: 52, lineHeight: 0.95, margin: '2px 0', fontWeight: 900, color: P.ink, letterSpacing: '-0.02em' }}>
                Class Leaderboard
              </h1>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onBack} style={{
              padding: '12px 18px', borderRadius: 999, background: P.ink, color: P.paper,
              fontSize: 15, fontWeight: 900, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: `0 5px 0 ${P.accent}`,
            }}>↻ New player</button>
            <button onClick={() => setConfirmClear(true)} style={{
              padding: '12px 16px', borderRadius: 999, background: '#fff', color: P.ink,
              fontSize: 14, fontWeight: 900, border: `3px solid ${P.ink}`, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: `0 4px 0 ${P.ink}`,
            }}>🗑 Reset</button>
          </div>
        </div>

        {entries.length === 0 ? (
          <SEmptyBoard P={P} />
        ) : (
          <>
            {/* Podium */}
            <SPodium top3={top3} P={P} highlightId={highlightId} dur={dur} />
            {/* Rest of list */}
            <SBoardList entries={rest} startRank={4} P={P} highlightId={highlightId} />
            <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, color: P.ink, opacity: 0.55 }}>
              {entries.length} player{entries.length === 1 ? '' : 's'} · saved on this device · highest score & fastest time win
            </div>
          </>
        )}

        {confirmClear && (
          <SConfirm P={P} onCancel={() => setConfirmClear(false)} onConfirm={doClear} />
        )}
      </div>
    );
  }

  function SEmptyBoard({ P }) {
    return (
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 72, marginBottom: 8 }}>🫖</div>
          <h2 style={{ fontFamily: '"Fraunces", serif', fontSize: 38, color: P.ink, margin: '0 0 8px' }}>The kettle is empty!</h2>
          <p style={{ fontSize: 18, opacity: 0.7, maxWidth: 380, margin: '0 auto' }}>Be the first to take the quiz and your name will land on the board.</p>
        </div>
      </div>
    );
  }

  function SPodium({ top3, P, highlightId, dur }) {
    // Display order: 2nd, 1st, 3rd; visual heights vary
    const order = [1, 0, 2];
    const heights = { 0: 200, 1: 160, 2: 130 };
    const swatches = { 0: P.accent, 1: P.warm, 2: P.leaf };
    const labels = { 0: '1st', 1: '2nd', 2: '3rd' };
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, alignItems: 'end', padding: '10px 20px 0' }}>
        {order.map((rankIdx) => {
          const e = top3[rankIdx];
          if (!e) {
            return (
              <div key={rankIdx} style={{
                height: heights[rankIdx], borderRadius: 18,
                background: '#ffffffaa', border: `3px dashed ${P.ink}44`,
                display: 'grid', placeItems: 'center', color: `${P.ink}55`, fontWeight: 900, fontSize: 22,
              }}>—</div>
            );
          }
          const isYou = e.id === highlightId;
          return (
            <div key={e.id} style={{
              position: 'relative',
              height: heights[rankIdx], padding: 14,
              borderRadius: 18, background: swatches[rankIdx],
              border: `4px solid ${P.ink}`, boxShadow: `0 6px 0 ${P.ink}`,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              color: rankIdx === 0 ? '#fff' : P.ink,
              animation: isYou ? `sb-jiggle 700ms ${dur(0)} cubic-bezier(.34,1.56,.64,1)` : 'none',
            }}>
              {isYou && (
                <div style={{
                  position: 'absolute', top: -14, right: -10, padding: '4px 10px',
                  background: P.ink, color: P.paper, fontWeight: 900, fontSize: 11,
                  letterSpacing: '0.16em', borderRadius: 99, transform: 'rotate(8deg)',
                }}>YOU!</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  fontFamily: '"Fraunces", serif', fontWeight: 900, fontSize: 38, lineHeight: 1,
                }}>{labels[rankIdx]}</div>
                <div style={{ fontSize: 28 }}>{rankIdx === 0 ? '🥇' : rankIdx === 1 ? '🥈' : '🥉'}</div>
              </div>
              <div>
                <div style={{
                  fontWeight: 900, fontSize: rankIdx === 0 ? 22 : 18, lineHeight: 1.1,
                  textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap',
                }}>{e.name}</div>
                <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.85, marginTop: 2 }}>{e.klass || '—'}</div>
                <div style={{ marginTop: 6, display: 'inline-flex', gap: 6, alignItems: 'baseline',
                  background: '#fff', color: P.ink, padding: '4px 10px', borderRadius: 99,
                  border: `2px solid ${P.ink}`, fontWeight: 900,
                }}>
                  <span style={{ fontSize: 18 }}>{e.score}</span>
                  <span style={{ fontSize: 11, opacity: 0.55 }}>/ {e.total}</span>
                  <span style={{ fontSize: 11, opacity: 0.55 }}>· {e.elapsed}s</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function SBoardList({ entries, startRank, P, highlightId }) {
    if (!entries.length) return <div style={{ flex: 1 }} />;
    return (
      <div style={{
        flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 4px 4px 0',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {entries.map((e, i) => {
          const isYou = e.id === highlightId;
          return (
            <div key={e.id} style={{
              display: 'grid', gridTemplateColumns: '52px 1fr auto auto', gap: 14,
              alignItems: 'center',
              padding: '10px 16px', borderRadius: 14,
              background: isYou ? `${P.warm}` : '#fff',
              border: `3px solid ${isYou ? P.ink : P.ink + '22'}`,
              boxShadow: isYou ? `0 4px 0 ${P.ink}` : `0 2px 0 ${P.ink}14`,
            }}>
              <div style={{
                fontFamily: '"Fraunces", serif', fontSize: 24, fontWeight: 900, color: P.ink,
              }}>#{startRank + i}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ fontWeight: 900, fontSize: 17, color: P.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                {e.klass && <div style={{
                  background: P.leaf, color: '#fff', padding: '2px 10px', borderRadius: 99,
                  fontSize: 11, fontWeight: 900, letterSpacing: '0.06em',
                }}>{e.klass}</div>}
                {isYou && <div style={{ fontSize: 11, fontWeight: 900, color: P.ink, opacity: 0.8 }}>← you</div>}
              </div>
              <div style={{ fontWeight: 900, fontSize: 18, color: P.accent, fontFamily: '"Fraunces", serif' }}>
                {e.score}<span style={{ fontSize: 12, opacity: 0.5 }}>/{e.total}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.55, minWidth: 36, textAlign: 'right' }}>{e.elapsed}s</div>
            </div>
          );
        })}
      </div>
    );
  }

  function SConfirm({ P, onCancel, onConfirm }) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,12,6,0.5)', display: 'grid', placeItems: 'center', zIndex: 30 }}>
        <div style={{
          width: 380, padding: 24, borderRadius: 22, background: '#fff',
          border: `4px solid ${P.ink}`, boxShadow: `0 8px 0 ${P.ink}`,
        }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>🗑</div>
          <h3 style={{ fontFamily: '"Fraunces", serif', fontSize: 26, fontWeight: 900, color: P.ink, margin: '0 0 6px' }}>Clear the board?</h3>
          <p style={{ fontSize: 15, color: P.ink, opacity: 0.7, margin: '0 0 16px' }}>This deletes every saved score on this device. Can't be undone.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={onCancel} style={{
              padding: '12px 18px', borderRadius: 999, background: 'transparent',
              color: P.ink, border: `3px solid ${P.ink}`, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
            }}>Keep them</button>
            <button onClick={onConfirm} style={{
              padding: '12px 18px', borderRadius: 999, background: P.accent,
              color: '#fff', border: `3px solid ${P.ink}`, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: `0 4px 0 ${P.ink}`,
            }}>Yes, clear all</button>
          </div>
        </div>
      </div>
    );
  }

  function bigBtn(bg, ink, color) {
    return {
      padding: '16px 28px', borderRadius: 18, background: bg, color, border: `4px solid ${ink}`,
      fontSize: 20, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
      boxShadow: `0 5px 0 ${ink}`,
    };
  }

  function SKeyframes() {
    return <style>{`
      @keyframes sb-pop { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
      @keyframes sb-bounce { 0% { opacity: 0; transform: scale(0.6); } 60% { opacity: 1; transform: scale(1.05); } 100% { transform: scale(1); } }
      @keyframes sb-wiggle { 0%,100% { transform: rotate(18deg); } 50% { transform: rotate(14deg) translateY(-3px); } }
      @keyframes sb-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
      @keyframes sb-slide { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes sb-card { 0% { opacity: 0; transform: rotate(-4deg) scale(0.7); } 70% { opacity: 1; transform: rotate(-4deg) scale(1.05); } 100% { transform: rotate(-4deg) scale(1); } }
      @keyframes sb-jiggle { 0%,100% { transform: translateY(0) rotate(0); } 30% { transform: translateY(-8px) rotate(-2deg); } 60% { transform: translateY(0) rotate(2deg); } }
    `}</style>;
  }

  window.VariationStorybook = VariationStorybook;
})();

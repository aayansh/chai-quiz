// ════════════════════════════════════════════════════════════════
// CHAI QUIZ v2 — game screens
// Home · Entry · LevelMap · PlayLevel · LevelResult
// Exposes on window.SBScreens.
// ════════════════════════════════════════════════════════════════
(function () {
  const { useState, useEffect, useRef } = React;
  const S = window.SB;
  const { FR, NU } = S;

  // ─── Home ─────────────────────────────────────────────────────
  function Home({ P, m, dur, onPlay, onLeaderboard }) {
    const { Cup } = window;
    return (
      <S.Screen m={m} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: m ? '28px 16px' : 40 }}>
        <div style={{ textAlign: 'center', position: 'relative', animation: `sb-bounce ${dur(800)} cubic-bezier(.34,1.56,.64,1) both` }}>
          <div style={{ display: 'inline-block', position: 'relative' }}>
            <div style={{
              background: P.accent, color: '#fff',
              padding: m ? '12px 24px' : '18px 50px', borderRadius: m ? 22 : 32,
              fontSize: m ? 40 : 82, fontWeight: 900, letterSpacing: '-0.02em',
              transform: 'rotate(-2deg)',
              boxShadow: `0 ${m ? 5 : 8}px 0 ${P.deep}, 0 16px 40px ${P.accent}66`,
              border: `${m ? 3 : 4}px solid ${P.ink}`, fontFamily: FR, whiteSpace: 'nowrap',
            }}>Chai Quest</div>
            <div style={{ position: 'absolute', top: m ? -12 : -22, right: m ? -14 : -34, transform: 'rotate(16deg)', animation: `sb-wiggle 3s ease-in-out infinite` }}>
              <div style={S.chip(P.leaf, '#fff', P.ink, m)}>{window.CHAI_TOTAL_LEVELS} levels!</div>
            </div>
            <div style={{ position: 'absolute', bottom: m ? -12 : -22, left: m ? -16 : -38, transform: 'rotate(-12deg)' }}>
              <div style={S.chip(P.warm, P.ink, P.ink, m)}>⭐ collect stars</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: m ? 14 : 28, alignItems: 'center', marginTop: m ? 34 : 42 }}>
            <div style={{ animation: `sb-float 3.6s ease-in-out infinite` }}><Cup size={m ? 56 : 96} fill={P.accent} stroke={P.ink} /></div>
            <div style={{ animation: `sb-float 3.2s ease-in-out infinite 0.4s` }}><Cup size={m ? 74 : 118} fill={P.deep} stroke={P.ink} /></div>
            <div style={{ animation: `sb-float 4s ease-in-out infinite 0.8s` }}><Cup size={m ? 56 : 96} fill={P.warm} stroke={P.ink} /></div>
          </div>

          <p style={{ fontSize: m ? 16 : 21, maxWidth: 520, margin: `${m ? 24 : 28}px auto ${m ? 22 : 26}px`, lineHeight: 1.5, color: P.ink, fontWeight: 700 }}>
            Climb {window.CHAI_TOTAL_LEVELS} levels of tea trivia. Earn stars, cheer your friends, and brew your way up the class leaderboard!
          </p>

          <div style={{ display: 'flex', gap: m ? 10 : 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={onPlay} style={S.primaryBtn(P, m, P.accent)}>Play ▸</button>
            <button onClick={onLeaderboard} style={S.secondaryBtn(P, m)}>🏆 Leaderboard</button>
          </div>
        </div>
      </S.Screen>
    );
  }

  // ─── Entry (name + class, with live class detection) ──────────
  function Entry({ P, m, dur, player, setPlayer, onBack, onBegin }) {
    const nameRef = useRef(null);
    const { Cup } = window;
    useEffect(() => { nameRef.current && nameRef.current.focus(); }, []);
    const nameOk = player.name.trim().length > 0;
    const klassOk = player.klass.trim().length > 0;
    const detected = klassOk ? window.normalizeClass(player.klass) : null;
    const canStart = nameOk && klassOk;
    const submit = (e) => { e && e.preventDefault(); if (canStart) onBegin(); };

    const field = (ok) => ({
      width: '100%', padding: m ? '14px 16px' : '17px 20px', borderRadius: 18,
      border: `${m ? 3 : 4}px solid ${P.ink}`, background: P.surface, color: P.ink,
      fontSize: m ? 18 : 21, fontWeight: 800, fontFamily: NU,
      boxShadow: `0 5px 0 ${P.ink}`, outline: 'none', boxSizing: 'border-box',
    });
    const label = { fontSize: m ? 12 : 14, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6, color: P.ink, opacity: 0.85 };

    return (
      <S.Screen m={m} style={{ display: 'grid', placeItems: 'center', animation: `sb-pop ${dur(420)} cubic-bezier(.34,1.56,.64,1) both` }}>
        <form onSubmit={submit} style={{ width: '100%', maxWidth: 540 }}>
          <div style={{ textAlign: 'center', marginBottom: m ? 18 : 22 }}>
            <div style={S.chip(P.warm, P.ink, P.ink, m)}>
              <Cup size={m ? 16 : 20} fill={P.accent} stroke={P.ink} steam={false} /> Sign in to play
            </div>
            <h1 style={{ fontFamily: FR, fontSize: m ? 32 : 48, lineHeight: 1, margin: `${m ? 12 : 14}px 0 8px`, color: P.ink, fontWeight: 900 }}>
              Who's brewing?
            </h1>
            <p style={{ fontSize: m ? 14 : 16, color: P.ink, opacity: 0.75, margin: 0, fontWeight: 700 }}>Your stars are saved — come back any time to continue.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label>
              <div style={label}>Your name</div>
              <input ref={nameRef} type="text" value={player.name} maxLength={24}
                onChange={(e) => setPlayer({ ...player, name: e.target.value })}
                placeholder="e.g. Priya" autoComplete="off" style={field(nameOk)} />
            </label>
            <label>
              <div style={label}>Your class</div>
              <input type="text" value={player.klass} maxLength={24}
                onChange={(e) => setPlayer({ ...player, klass: e.target.value })}
                placeholder="e.g. 6M or 6BC" autoComplete="off" style={field(klassOk)} />
            </label>
          </div>

          {detected && (
            <div style={{
              marginTop: 12, display: 'flex', alignItems: 'center', gap: 10,
              fontSize: m ? 13 : 15, fontWeight: 800, color: P.ink,
            }}>
              Detected class:
              {detected === 'Other'
                ? <span style={{ ...S.chip(`${P.ink}22`, P.ink, P.ink, m), }}>Other</span>
                : <S.ClassBadge klass={detected} P={P} m={m} />}
              {detected === 'Other' && <span style={{ opacity: 0.6, fontWeight: 700 }}>(type 6M or 6BC if that's your class)</span>}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: m ? 'column-reverse' : 'row', justifyContent: 'space-between', marginTop: m ? 22 : 26, gap: 10 }}>
            <button type="button" onClick={onBack} style={{ ...S.secondaryBtn(P, m), width: m ? '100%' : 'auto' }}>← Back</button>
            <button type="submit" disabled={!canStart} style={{
              ...S.primaryBtn(P, m),
              background: canStart ? P.ink : `${P.ink}55`,
              cursor: canStart ? 'pointer' : 'not-allowed',
              boxShadow: canStart ? `0 6px 0 ${P.accent}` : 'none',
              width: m ? '100%' : 'auto',
            }}>Let's go! ▸</button>
          </div>
        </form>
      </S.Screen>
    );
  }

  // ─── Level map ────────────────────────────────────────────────
  function LevelMap({ P, m, dur, player, onPlayLevel, onLeaderboard, onInbox, inboxCount, onRemoveMe }) {
    const rec = window.getPlayer(player.name, player.klass);
    const levelStars = (rec && rec.levels) || {};
    const unlocked = window.unlockedThrough(player.name, player.klass);
    const totals = rec ? rec : { stars: 0, done: 0 };
    const rank = window.getChaiRank(totals.stars || 0);

    return (
      <S.Screen m={m} scroll style={{ display: 'flex', flexDirection: 'column', gap: m ? 14 : 18, animation: `sb-pop ${dur(380)} ease-out both` }}>
        {/* Player header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, flexWrap: 'wrap',
          background: P.surface, border: `${m ? 3 : 4}px solid ${P.ink}`, borderRadius: m ? 18 : 24,
          boxShadow: `0 6px 0 ${P.ink}`, padding: m ? '12px 14px' : '16px 22px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: m ? 10 : 14, minWidth: 0 }}>
            <div style={{ fontSize: m ? 34 : 46 }}>{rank.emoji}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: FR, fontSize: m ? 22 : 30, fontWeight: 900, color: P.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.name}</span>
                <S.ClassBadge klass={player.klass} P={P} m={m} />
              </div>
              <div style={{ fontSize: m ? 12 : 14, fontWeight: 800, color: P.accent }}>{rank.title}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: m ? 8 : 12 }}>
            <div style={{ textAlign: 'center', background: P.warm, border: `3px solid ${P.ink}`, borderRadius: 14, padding: m ? '6px 12px' : '8px 16px', boxShadow: `0 4px 0 ${P.ink}` }}>
              <div style={{ fontFamily: FR, fontSize: m ? 22 : 30, fontWeight: 900, color: P.ink, lineHeight: 1 }}>⭐ {totals.stars || 0}</div>
              <div style={{ fontSize: m ? 9 : 11, fontWeight: 800, color: P.ink, opacity: 0.7 }}>stars</div>
            </div>
            <button onClick={onInbox} style={{ position: 'relative', ...S.secondaryBtn(P, m), padding: m ? '10px 12px' : '12px 14px' }}>
              ✉
              {inboxCount > 0 && (
                <span style={{ position: 'absolute', top: -8, right: -8, background: P.accent, color: '#fff', borderRadius: 99, fontSize: 11, fontWeight: 900, padding: '1px 6px', border: `2px solid ${P.ink}` }}>{inboxCount}</span>
              )}
            </button>
            <button onClick={onLeaderboard} style={{ ...S.secondaryBtn(P, m), padding: m ? '10px 12px' : '12px 16px' }}>🏆</button>
            <button onClick={onRemoveMe} title="Remove me & sign out" style={{ ...S.secondaryBtn(P, m), padding: m ? '10px 12px' : '12px 14px' }}>🚪</button>
          </div>
        </div>

        {/* Level grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: m ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: m ? 10 : 14,
        }}>
          {window.CHAI_LEVELS.map((lv) => {
            const done = levelStars[lv.id];
            const isUnlocked = lv.n <= unlocked;
            const stars = done ? done.stars : 0;
            return (
              <button key={lv.id} disabled={!isUnlocked}
                onClick={() => isUnlocked && onPlayLevel(lv)}
                style={{
                  textAlign: 'left', position: 'relative',
                  padding: m ? '12px 12px' : '16px 16px',
                  borderRadius: m ? 16 : 20,
                  background: !isUnlocked ? `${P.ink}14` : done ? P.surface : P.warm,
                  border: `${m ? 3 : 4}px solid ${isUnlocked ? P.ink : P.ink + '44'}`,
                  boxShadow: isUnlocked ? `0 ${m ? 5 : 6}px 0 ${P.ink}` : 'none',
                  cursor: isUnlocked ? 'pointer' : 'not-allowed',
                  opacity: isUnlocked ? 1 : 0.6,
                  fontFamily: NU, color: P.ink,
                  transition: `transform ${dur(160)}`,
                  touchAction: 'manipulation',
                  minHeight: m ? 116 : 140,
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{
                    fontFamily: FR, fontWeight: 900, fontSize: m ? 14 : 16,
                    background: P.ink, color: P.paper, borderRadius: 10, padding: '2px 10px',
                  }}>Lv {lv.n}</div>
                  <div style={{ fontSize: m ? 26 : 32 }}>{isUnlocked ? lv.emoji : '🔒'}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: m ? 14 : 16, lineHeight: 1.15, marginBottom: 4 }}>{lv.title}</div>
                  {isUnlocked ? (
                    <S.StarRow count={stars} max={5} size={m ? 14 : 16} color={P.accent} dim={`${P.ink}22`} />
                  ) : (
                    <div style={{ fontSize: m ? 11 : 12, fontWeight: 800, opacity: 0.7 }}>Finish Lv {lv.n - 1} to open</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', fontSize: m ? 11 : 13, fontWeight: 800, color: P.ink, opacity: 0.55 }}>
          {totals.done || 0} / {window.CHAI_TOTAL_LEVELS} levels played · tap a cup on the leaderboard to cheer a friend
        </div>
      </S.Screen>
    );
  }

  // ─── Play a level ─────────────────────────────────────────────
  function PlayLevel({ P, m, dur, level, player, onFinish, onQuit }) {
    const Q = window.useLevelQuiz(level, {
      onCorrect: () => window.sfx.correct(),
      onWrong: () => window.sfx.wrong(),
      onFinish: (res) => onFinish(res),
    });
    const Icon = window.iconForQuestion(Q.current);
    const showResult = Q.isAnswered;

    return (
      <S.Screen m={m} padding={m ? '14px 12px 20px' : '26px 48px'} style={{ display: 'flex', flexDirection: 'column', animation: `sb-pop ${dur(380)} cubic-bezier(.34,1.56,.64,1) both` }}>
        <div key={Q.idx} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: m ? 8 : 12, flexWrap: m ? 'wrap' : 'nowrap' }}>
            <button onClick={onQuit} style={{ ...S.secondaryBtn(P, m), padding: m ? '8px 12px' : '10px 14px', fontSize: m ? 13 : 15 }}>✕</button>
            <div style={{ background: P.ink, color: P.paper, padding: m ? '8px 12px' : '8px 14px', borderRadius: 12, fontWeight: 900, fontSize: m ? 13 : 16, border: `3px solid ${P.ink}`, boxShadow: `0 4px 0 ${P.accent}`, fontFamily: NU }}>
              {level.emoji} Lv {level.n} · {Q.idx + 1}/{Q.total}
            </div>
            <div style={{ flex: 1, minWidth: m ? '100%' : 0, order: m ? 5 : 0, height: m ? 14 : 18, background: P.surface, border: `3px solid ${P.ink}`, borderRadius: 999, overflow: 'hidden', boxShadow: `0 3px 0 ${P.ink}22` }}>
              <div style={{ width: `${Q.progress * 100}%`, height: '100%', background: `linear-gradient(90deg, ${P.warm}, ${P.accent})`, transition: `width ${dur(420)} ease-out` }} />
            </div>
            <div style={{ background: P.surface, padding: m ? '6px 12px' : '8px 14px', borderRadius: 12, border: `3px solid ${P.ink}`, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 900, fontSize: m ? 15 : 19, boxShadow: `0 4px 0 ${P.ink}`, fontFamily: NU }}>
              <window.Star size={m ? 16 : 20} fill={P.accent} /> {Q.correct}
            </div>
          </div>

          {/* Question card */}
          <div style={{ marginTop: m ? 14 : 18, padding: m ? '14px' : '18px 24px', background: P.surface, borderRadius: m ? 20 : 26, border: `${m ? 3 : 4}px solid ${P.ink}`, boxShadow: `0 ${m ? 4 : 6}px 0 ${P.ink}`, display: 'flex', flexDirection: m ? 'column' : 'row', alignItems: m ? 'flex-start' : 'center', gap: m ? 12 : 20 }}>
            <div style={{ width: m ? 52 : 88, height: m ? 52 : 88, borderRadius: m ? 14 : 20, background: `${P.warm}55`, border: `3px solid ${P.ink}`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon size={m ? 38 : 66} fill={P.accent} stroke={P.ink} />
            </div>
            <div style={{ fontSize: m ? 19 : 27, lineHeight: 1.2, fontWeight: 900, fontFamily: FR, color: P.ink }}>{Q.current.q}</div>
          </div>

          {/* Options */}
          <div style={{ flex: m ? 'none' : 1, display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: m ? 10 : 14, marginTop: m ? 14 : 18, alignContent: 'center' }}>
            {Q.current.options.map((opt, i) => {
              const chosen = Q.picked === i;
              const correct = !!opt.correct;
              let bg = P.surface;
              if (showResult && correct) bg = P.ok;
              else if (showResult && chosen && !correct) bg = P.bad;
              return (
                <button key={i} onClick={() => Q.pick(i)} disabled={showResult} style={{
                  textAlign: 'left', padding: m ? '14px' : '17px 20px',
                  background: bg, border: `${m ? 3 : 4}px solid ${P.ink}`, borderRadius: m ? 16 : 20,
                  fontSize: m ? 16 : 20, fontWeight: 800, fontFamily: NU, color: P.ink,
                  cursor: showResult ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: m ? 12 : 16,
                  boxShadow: `0 ${m ? 4 : 5}px 0 ${P.ink}`,
                  transition: `transform ${dur(180)}, background ${dur(240)}`,
                  transform: chosen && showResult ? 'translateY(2px)' : 'translateY(0)',
                  minHeight: 56, touchAction: 'manipulation',
                }}>
                  <span style={{ width: m ? 36 : 42, height: m ? 36 : 42, borderRadius: 12, background: (showResult && correct) ? P.leaf : (showResult && chosen) ? P.accent : P.warm, border: `3px solid ${P.ink}`, display: 'grid', placeItems: 'center', fontSize: m ? 18 : 22, fontWeight: 900, color: P.ink, flexShrink: 0, fontFamily: FR }}>{'ABCD'[i]}</span>
                  <span style={{ flex: 1 }}>{opt.label}</span>
                  {showResult && correct && <window.Check size={m ? 22 : 26} color={P.leaf} />}
                  {showResult && chosen && !correct && <window.Cross size={m ? 22 : 26} color={P.accent} />}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          {showResult && (
            <div style={{ display: 'flex', flexDirection: m ? 'column' : 'row', alignItems: m ? 'stretch' : 'center', gap: m ? 10 : 14, marginTop: m ? 14 : 18, animation: `sb-slide ${dur(360)} ease-out both` }}>
              <div style={{ flex: 1, padding: m ? '12px 14px' : '14px 18px', borderRadius: m ? 14 : 18, background: Q.isCorrect ? P.leaf : P.accent, color: '#fff', border: `3px solid ${P.ink}`, boxShadow: `0 5px 0 ${P.ink}`, fontSize: m ? 14 : 17, fontWeight: 700, lineHeight: 1.35 }}>
                <strong style={{ marginRight: 8, fontWeight: 900 }}>{Q.isCorrect ? 'Yes! 🎉' : 'Not quite —'}</strong>{Q.current.fact}
              </div>
              <button onClick={Q.next} style={{ padding: m ? '14px 20px' : '16px 28px', borderRadius: m ? 14 : 18, background: P.ink, color: P.paper, fontSize: m ? 17 : 20, fontWeight: 900, border: `3px solid ${P.ink}`, boxShadow: `0 5px 0 ${P.accent}`, cursor: 'pointer', fontFamily: NU, width: m ? '100%' : 'auto', touchAction: 'manipulation' }}>
                {Q.idx + 1 >= Q.total ? 'Finish ▸' : 'Next ▸'}
              </button>
            </div>
          )}
        </div>
      </S.Screen>
    );
  }

  // ─── Level result ─────────────────────────────────────────────
  function LevelResult({ P, m, dur, level, result, player, hasNext, onNext, onMap, onLeaderboard }) {
    const stars = result.stars;
    const perfect = stars === 5;
    return (
      <S.Screen m={m} style={{ display: 'grid', placeItems: 'center', animation: `sb-pop ${dur(500)} cubic-bezier(.34,1.56,.64,1) both` }}>
        <window.Confetti active={stars >= 3} />
        <div style={{ textAlign: 'center', maxWidth: 520, width: '100%' }}>
          <div style={S.chip(P.warm, P.ink, P.ink, m)}>{level.emoji} Level {level.n} complete</div>
          <h1 style={{ fontFamily: FR, fontSize: m ? 38 : 56, lineHeight: 1, margin: `${m ? 14 : 18}px 0 6px`, color: P.ink, fontWeight: 900 }}>
            {perfect ? 'Perfect!' : stars >= 3 ? 'Great brewing!' : 'Nice try!'}
          </h1>
          <p style={{ fontSize: m ? 15 : 18, fontWeight: 700, color: P.ink, opacity: 0.8, margin: '0 0 18px' }}>
            {result.correct} of {result.total} correct in {result.elapsed}s
          </p>

          {/* Big stars */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: m ? 6 : 10, marginBottom: m ? 20 : 26 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ animation: i < stars ? `sb-star-pop ${dur(400)} ${dur(i * 140)} both` : 'none', opacity: i < stars ? 1 : 0.25 }}>
                <window.Star size={m ? 44 : 60} fill={i < stars ? P.accent : `${P.ink}30`} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {hasNext
              ? <button onClick={onNext} style={S.primaryBtn(P, m, P.accent)}>Next level ▸</button>
              : <button onClick={onMap} style={S.primaryBtn(P, m, P.accent)}>All done! 🎉</button>}
            <button onClick={onMap} style={S.secondaryBtn(P, m)}>Level map</button>
            <button onClick={onLeaderboard} style={S.secondaryBtn(P, m)}>🏆</button>
          </div>
        </div>
      </S.Screen>
    );
  }

  window.SBScreens = { Home, Entry, LevelMap, PlayLevel, LevelResult };
})();

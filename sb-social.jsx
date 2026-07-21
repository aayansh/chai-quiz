// ════════════════════════════════════════════════════════════════
// CHAI QUIZ v2 — social + admin
// Leaderboard (with class filter + cheering) · Inbox · CheerFeed ·
// AdminPanel. Exposes on window.SBSocial.
// ════════════════════════════════════════════════════════════════
(function () {
  const { useState, useEffect } = React;
  const S = window.SB;
  const { FR, NU } = S;

  // ─── Leaderboard ──────────────────────────────────────────────
  function Leaderboard({ P, m, dur, player, onBack }) {
    const [players, setPlayers] = useState(() => window.sortedPlayers());
    const [messages, setMessages] = useState(() => window.messagesFor ? [] : []);
    const [filter, setFilter] = useState('All');
    const [cheerFor, setCheerFor] = useState(null); // player obj to cheer

    useEffect(() => {
      const u1 = window.subscribePlayers(() => setPlayers(window.sortedPlayers()));
      const u2 = window.subscribeMessages((all) => setMessages(all.slice(-12).reverse()));
      return () => { u1(); u2(); };
    }, []);

    const cloud = window.isCloudMode && window.isCloudMode();
    const shown = filter === 'All' ? players : players.filter((p) => p.klass === filter);
    const top3 = shown.slice(0, 3);
    const rest = shown.slice(3);

    // Class totals (for "best class ever" bragging rights)
    const classTotals = { '6M': 0, '6BC': 0 };
    players.forEach((p) => { if (classTotals[p.klass] != null) classTotals[p.klass] += p.stars || 0; });
    const leadClass = classTotals['6M'] === classTotals['6BC'] ? null : (classTotals['6M'] > classTotals['6BC'] ? '6M' : '6BC');

    return (
      <S.Screen m={m} scroll padding={m ? '16px 14px 88px' : '22px 40px 84px'} style={{ display: 'flex', flexDirection: 'column', gap: m ? 12 : 16, animation: `sb-pop ${dur(380)} ease-out both` }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: m ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 10, flexDirection: m ? 'column' : 'row' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: m ? 10 : 14 }}>
            <div style={{ fontSize: m ? 36 : 50 }}>🏆</div>
            <div>
              <div style={{ fontSize: m ? 11 : 13, letterSpacing: '0.22em', fontWeight: 900, color: P.accent, textTransform: 'uppercase' }}>Chai Quest</div>
              <h1 style={{ fontFamily: FR, fontSize: m ? 30 : 48, lineHeight: 0.95, margin: '2px 0', fontWeight: 900, color: P.ink }}>Class Leaderboard</h1>
            </div>
          </div>
          <button onClick={onBack} style={{ ...S.primaryBtn(P, m), padding: m ? '12px 16px' : '14px 22px', fontSize: m ? 15 : 17, width: m ? '100%' : 'auto' }}>← Back to map</button>
        </div>

        {/* Class battle */}
        <div style={{ display: 'flex', gap: m ? 8 : 12 }}>
          {['6M', '6BC'].map((c) => {
            const lead = leadClass === c;
            return (
              <div key={c} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: m ? '10px 12px' : '12px 18px', borderRadius: m ? 14 : 18,
                background: c === '6BC' ? `${P.accent}1a` : `${P.leaf}1a`,
                border: `${m ? 3 : 4}px solid ${c === '6BC' ? P.accent : P.leaf}`,
                boxShadow: lead ? `0 5px 0 ${P.ink}` : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <S.ClassBadge klass={c} P={P} m={m} />
                  {lead && <span style={{ fontSize: m ? 16 : 20 }}>👑</span>}
                </div>
                <div style={{ fontFamily: FR, fontSize: m ? 22 : 30, fontWeight: 900, color: P.ink }}>⭐{classTotals[c]}</div>
              </div>
            );
          })}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8 }}>
          {['All', '6M', '6BC'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              flex: 1, padding: m ? '8px 0' : '10px 0', borderRadius: 999,
              background: filter === f ? P.ink : P.surface, color: filter === f ? P.paper : P.ink,
              border: `3px solid ${P.ink}`, fontWeight: 900, fontSize: m ? 13 : 15, cursor: 'pointer', fontFamily: NU,
              touchAction: 'manipulation',
            }}>{f}</button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div style={{ flex: 1, display: 'grid', placeItems: 'center', textAlign: 'center', padding: '30px 8px' }}>
            <div>
              <div style={{ fontSize: m ? 56 : 72, marginBottom: 8 }}>🫖</div>
              <h2 style={{ fontFamily: FR, fontSize: m ? 26 : 36, color: P.ink, margin: '0 0 8px' }}>No stars yet!</h2>
              <p style={{ fontSize: m ? 14 : 18, opacity: 0.7, maxWidth: 360, margin: '0 auto', fontWeight: 700 }}>Play a level and your name appears here.</p>
            </div>
          </div>
        ) : (
          <>
            <Podium top3={top3} P={P} m={m} dur={dur} me={player} onCheer={setCheerFor} />
            <BoardList entries={rest} startRank={4} P={P} m={m} me={player} onCheer={setCheerFor} />
            <div style={{ textAlign: 'center', fontSize: m ? 11 : 13, fontWeight: 800, color: P.ink, opacity: 0.55 }}>
              {shown.length} player{shown.length === 1 ? '' : 's'} · {cloud ? 'live across all devices ☁️' : 'on this device'} · tap a 🍵 to cheer
            </div>
            {player && player.name && players.some((p) => p.key === window.playerKey(player.name, player.klass)) && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
                <button onClick={() => {
                  if (confirm(`Remove yourself (${player.name}) from the leaderboard? This deletes all your stars and can't be undone.`)) {
                    window.deletePlayer(window.playerKey(player.name, player.klass));
                    window.clearDeviceLock && window.clearDeviceLock();
                    onBack();
                  }
                }} style={{
                  padding: m ? '9px 16px' : '10px 18px', borderRadius: 999,
                  background: 'transparent', color: P.ink, opacity: 0.7,
                  border: `2px solid ${P.ink}55`, fontWeight: 800, fontSize: m ? 12 : 13,
                  cursor: 'pointer', fontFamily: NU, touchAction: 'manipulation',
                }}>🗑 Remove me from the board</button>
              </div>
            )}
          </>
        )}

        {/* Cheer feed */}
        {messages.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontFamily: FR, fontSize: m ? 18 : 22, fontWeight: 900, color: P.ink, marginBottom: 8 }}>💬 Class cheers</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {messages.map((msg) => (
                <CheerLine key={msg.id} msg={msg} P={P} m={m} />
              ))}
            </div>
          </div>
        )}

        {cheerFor && (
          <CheerPicker P={P} m={m} target={cheerFor} me={player} onClose={() => setCheerFor(null)} />
        )}
      </S.Screen>
    );
  }

  function Podium({ top3, P, m, dur, me, onCheer }) {
    const order = [1, 0, 2];
    const heights = m ? { 0: 172, 1: 148, 2: 134 } : { 0: 220, 1: 188, 2: 170 };
    const sw = { 0: P.accent, 1: P.warm, 2: P.leaf };
    const lbl = { 0: '1st', 1: '2nd', 2: '3rd' };
    const medal = { 0: '🥇', 1: '🥈', 2: '🥉' };
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: m ? 6 : 14, alignItems: 'end' }}>
        {order.map((ri) => {
          const e = top3[ri];
          if (!e) return <div key={ri} style={{ minHeight: heights[ri], borderRadius: m ? 14 : 18, background: '#ffffffaa', border: `3px dashed ${P.ink}44`, display: 'grid', placeItems: 'center', color: `${P.ink}55`, fontWeight: 900 }}>—</div>;
          const isMe = me && e.key === window.playerKey(me.name, me.klass);
          return (
            <div key={e.key} style={{ position: 'relative', minHeight: heights[ri], padding: m ? 10 : 14, borderRadius: m ? 14 : 18, background: sw[ri], border: `${m ? 3 : 4}px solid ${P.ink}`, boxShadow: `0 ${m ? 4 : 6}px 0 ${P.ink}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: m ? 6 : 10, color: ri === 0 ? '#fff' : P.ink, overflow: 'hidden' }}>
              {isMe && <div style={{ position: 'absolute', top: m ? -10 : -12, right: m ? -6 : -8, background: P.ink, color: P.paper, fontWeight: 900, fontSize: m ? 10 : 11, letterSpacing: '0.1em', borderRadius: 99, padding: '3px 8px', transform: 'rotate(8deg)', zIndex: 2 }}>YOU!</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontFamily: FR, fontWeight: 900, fontSize: m ? 20 : 32, lineHeight: 1 }}>{lbl[ri]}</div>
                <div style={{ fontSize: m ? 20 : 28 }}>{medal[ri]}</div>
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: ri === 0 ? (m ? 14 : 20) : (m ? 12 : 17), lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                <div style={{ marginTop: 2, marginBottom: 4 }}><S.ClassBadge klass={e.klass} P={P} m={m} /></div>
                <div style={{ display: 'inline-flex', gap: 4, alignItems: 'baseline', background: P.surface, color: P.ink, padding: m ? '2px 8px' : '4px 10px', borderRadius: 99, border: `2px solid ${P.ink}`, fontWeight: 900 }}>
                  <span style={{ fontSize: m ? 14 : 18 }}>⭐{e.stars}</span>
                  {!m && <span style={{ fontSize: 11, opacity: 0.55 }}>· {e.elapsed}s</span>}
                </div>
                {!isMe && (
                  <button onClick={() => onCheer(e)} style={{ marginTop: 8, width: '100%', background: P.surface, border: `2px solid ${P.ink}`, borderRadius: 10, padding: m ? '4px' : '6px', cursor: 'pointer', fontWeight: 900, fontSize: m ? 12 : 13, fontFamily: NU, color: P.ink, touchAction: 'manipulation' }}>🍵 Cheer</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function BoardList({ entries, startRank, P, m, me, onCheer }) {
    if (!entries.length) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((e, i) => {
          const isMe = me && e.key === window.playerKey(me.name, me.klass);
          return (
            <div key={e.key} style={{ display: 'grid', gridTemplateColumns: m ? '30px 1fr auto auto' : '50px 1fr auto auto auto', gap: m ? 8 : 14, alignItems: 'center', padding: m ? '10px 12px' : '10px 16px', borderRadius: m ? 12 : 14, background: isMe ? P.warm : P.surface, border: `3px solid ${isMe ? P.ink : P.ink + '22'}`, boxShadow: isMe ? `0 4px 0 ${P.ink}` : `0 2px 0 ${P.ink}14` }}>
              <div style={{ fontFamily: FR, fontSize: m ? 18 : 22, fontWeight: 900, color: P.ink }}>#{startRank + i}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 900, fontSize: m ? 14 : 17, color: P.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                <S.ClassBadge klass={e.klass} P={P} m={m} />
                {isMe && <span style={{ fontSize: m ? 10 : 11, fontWeight: 900, color: P.ink, opacity: 0.8 }}>← you</span>}
              </div>
              <div style={{ fontWeight: 900, fontSize: m ? 15 : 18, color: P.accent, fontFamily: FR }}>⭐{e.stars}</div>
              {!m && <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.55, minWidth: 40, textAlign: 'right' }}>{e.elapsed}s</div>}
              {isMe ? <div style={{ width: m ? 0 : 64 }} /> : (
                <button onClick={() => onCheer(e)} style={{ background: P.surface, border: `2px solid ${P.ink}`, borderRadius: 10, padding: m ? '6px 8px' : '6px 10px', cursor: 'pointer', fontWeight: 900, fontSize: m ? 13 : 14, fontFamily: NU, color: P.ink, touchAction: 'manipulation' }}>🍵</button>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function CheerLine({ msg, P, m }) {
    const isPraise = msg.kind === 'praise';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: m ? '8px 10px' : '8px 12px', borderRadius: 12, background: isPraise ? `${P.warm}44` : P.surface, border: `2px solid ${isPraise ? P.accent : P.ink + '22'}`, fontSize: m ? 13 : 14, fontWeight: 700, color: P.ink }}>
        <span style={{ fontWeight: 900 }}>{isPraise ? '👑 ' : ''}{msg.fromName}</span>
        <span style={{ opacity: 0.5, fontSize: m ? 11 : 12 }}>
          {msg.toType === 'all' ? '→ everyone' : msg.toType === 'class' ? `→ ${msg.toKey}` : '→ a friend'}
        </span>
        <span style={{ marginLeft: 'auto', fontWeight: 800 }}>{msg.text}</span>
      </div>
    );
  }

  function CheerPicker({ P, m, target, me, onClose }) {
    const [sent, setSent] = useState(false);
    const send = (text) => {
      const from = (me && me.name) ? me : { name: 'A friend', klass: 'Other' };
      try {
        window.sendMessage({
          fromName: from.name, fromClass: from.klass,
          toType: 'player', toKey: target.key, text, kind: 'cheer',
        });
        window.sfx && window.sfx.chime && window.sfx.chime();
      } catch (e) { console.warn('cheer failed', e); }
      setSent(true);
      setTimeout(onClose, 700);
    };
    return (
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(20,12,6,0.55)', display: 'grid', placeItems: 'center', zIndex: 50, padding: 14 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: P.paper, border: `4px solid ${P.ink}`, borderRadius: 22, boxShadow: `0 10px 0 ${P.ink}`, padding: m ? 18 : 24 }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 48 }}>📨</div>
              <div style={{ fontFamily: FR, fontSize: 26, fontWeight: 900, color: P.ink }}>Cheer sent!</div>
            </div>
          ) : (
            <>
              <div style={{ fontFamily: FR, fontSize: m ? 22 : 26, fontWeight: 900, color: P.ink, marginBottom: 4 }}>Cheer {target.name} 🍵</div>
              <p style={{ fontSize: m ? 13 : 14, opacity: 0.7, margin: '0 0 14px', fontWeight: 700 }}>Pick a message to send:</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {window.CHAI_CHEERS.map((c) => (
                  <button key={c} onClick={() => send(c)} style={{ padding: m ? '12px 8px' : '14px 10px', background: P.surface, border: `3px solid ${P.ink}`, borderRadius: 14, fontWeight: 800, fontSize: m ? 14 : 15, cursor: 'pointer', fontFamily: NU, color: P.ink, boxShadow: `0 4px 0 ${P.ink}`, touchAction: 'manipulation' }}>{c}</button>
                ))}
              </div>
              <button onClick={onClose} style={{ ...S.secondaryBtn(P, m), width: '100%', marginTop: 14 }}>Cancel</button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── Inbox (messages addressed to the player) ─────────────────
  function Inbox({ P, m, player, onClose }) {
    const [msgs, setMsgs] = useState(() => window.messagesFor(player.name, player.klass));
    useEffect(() => {
      const u = window.subscribeMessages(() => setMsgs(window.messagesFor(player.name, player.klass)));
      return u;
    }, [player.name, player.klass]);
    const list = msgs.slice().reverse();
    return (
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(20,12,6,0.55)', display: 'grid', placeItems: 'center', zIndex: 50, padding: 14 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, maxHeight: 'calc(var(--app-h) - 20px)', overflowY: 'auto', background: P.paper, border: `4px solid ${P.ink}`, borderRadius: 22, boxShadow: `0 10px 0 ${P.ink}`, padding: m ? 18 : 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: FR, fontSize: m ? 24 : 28, fontWeight: 900, color: P.ink }}>✉ Your cheers</div>
            <button onClick={onClose} style={{ ...S.secondaryBtn(P, m), padding: '8px 14px' }}>✕</button>
          </div>
          {list.length === 0 ? (
            <p style={{ textAlign: 'center', opacity: 0.6, fontWeight: 700, padding: '24px 0' }}>No messages yet. Play well and the cheers will roll in! 🍵</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.map((msg) => (
                <div key={msg.id} style={{ padding: '12px 14px', borderRadius: 14, background: msg.kind === 'praise' ? `${P.warm}55` : P.surface, border: `3px solid ${msg.kind === 'praise' ? P.accent : P.ink + '22'}` }}>
                  <div style={{ fontSize: m ? 16 : 18, fontWeight: 900, color: P.ink }}>{msg.text}</div>
                  <div style={{ fontSize: m ? 12 : 13, fontWeight: 700, opacity: 0.6, marginTop: 2 }}>
                    {msg.kind === 'praise' ? '👑 from ' : 'from '}{msg.fromName}
                    {msg.toType === 'class' ? ` (to all ${msg.toKey})` : msg.toType === 'all' ? ' (to everyone)' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // ADMIN
  // ═══════════════════════════════════════════════════════════════
  function AdminPanel({ P, m, onClose }) {
    const [authed, setAuthed] = useState(false);
    const [pw, setPw] = useState('');
    const [err, setErr] = useState('');
    const tryLogin = (e) => { e && e.preventDefault(); if (window.checkAdminPassword(pw.trim())) { setAuthed(true); setErr(''); } else setErr('Wrong password — try again.'); };
    useEffect(() => { const h = (e) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);

    return (
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(20,12,6,0.65)', display: 'grid', placeItems: 'center', zIndex: 999, padding: 12 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 780, maxHeight: 'calc(var(--app-h) - 20px)', overflowY: 'auto', background: '#2a1810', color: '#fdf3dc', border: `4px solid ${P.warm}88`, borderRadius: 24, boxShadow: '0 24px 80px rgba(0,0,0,0.7)', fontFamily: NU }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: m ? '16px 18px' : '20px 26px', borderBottom: `2px dashed ${P.warm}44` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: m ? 28 : 36 }}>🔒</div>
              <div>
                <div style={{ fontSize: m ? 10 : 12, letterSpacing: '0.24em', color: P.warm, fontWeight: 900, textTransform: 'uppercase' }}>{window.getMcName ? window.getMcName() : 'MC'} Control Panel</div>
                <h2 style={{ fontFamily: FR, fontSize: m ? 24 : 30, margin: '2px 0 0', fontWeight: 900, color: '#fdf3dc' }}>Royal Chai Dashboard</h2>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'transparent', color: '#fdf3dc', border: '2px solid #fdf3dc44', fontWeight: 900, cursor: 'pointer', fontFamily: NU }}>✕</button>
          </div>
          <div style={{ padding: m ? '18px' : '24px 26px 28px' }}>
            {!authed ? (
              <form onSubmit={tryLogin}>
                <div style={{ fontSize: m ? 13 : 14, color: '#fdf3dcaa', marginBottom: 16 }}>For the MC only. Enter the admin password.</div>
                <div style={aLabel(P)}>Admin password</div>
                <input type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" style={aInput(P)} />
                {err && <div style={{ marginTop: 8, color: '#ffb09a', fontSize: 13, fontWeight: 800 }}>{err}</div>}
                <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                  <button type="submit" style={aPrimary(P, m)}>🗝 Unlock</button>
                  <button type="button" onClick={onClose} style={aGhost(P, m)}>Cancel</button>
                </div>
                <div style={{ marginTop: 16, fontSize: 12, opacity: 0.55 }}>Default password: <code style={{ background: '#1d100a', padding: '2px 6px', borderRadius: 4, color: P.warm }}>chai</code></div>
              </form>
            ) : <AdminBody P={P} m={m} />}
          </div>
        </div>
      </div>
    );
  }

  function AdminBody({ P, m }) {
    const [players, setPlayers] = useState(() => window.sortedPlayers());
    const [filter, setFilter] = useState('All');
    const [expanded, setExpanded] = useState(null);
    const [praiseFor, setPraiseFor] = useState(null);
    const [pwNew, setPwNew] = useState('');
    const [pwSaved, setPwSaved] = useState(false);

    useEffect(() => { const u = window.subscribePlayers(() => setPlayers(window.sortedPlayers())); return u; }, []);
    const cloud = window.isCloudMode && window.isCloudMode();
    const shown = filter === 'All' ? players : players.filter((p) => p.klass === filter);
    const classTotals = { '6M': 0, '6BC': 0, Other: 0 };
    players.forEach((p) => { classTotals[p.klass] = (classTotals[p.klass] || 0) + (p.stars || 0); });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: m ? 16 : 20 }}>
        {/* Cloud banner */}
        <div style={{ padding: '10px 14px', borderRadius: 12, background: cloud ? '#1f3d2a' : '#3a2418', border: `2px solid ${cloud ? '#9fc972' : P.warm + '55'}`, color: cloud ? '#cfeab2' : '#fdf3dc', fontWeight: 800, fontSize: 13, lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{cloud ? '☁️' : '💾'}</span>
          {cloud ? <span><strong>Cloud mode on</strong> — every device shares one leaderboard.</span> : <span><strong>Local mode</strong> — scores live on this device only. Add <code style={{ background: '#1d100a', padding: '1px 5px', borderRadius: 4 }}>firebase-config.js</code> to share.</span>}
        </div>

        {/* Class stats */}
        <section>
          <div style={aTitle(P)}>👑 Class scores</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {['6M', '6BC'].map((c) => (
              <div key={c} style={{ ...aCard(P), display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div><div style={{ fontFamily: FR, fontSize: 22, fontWeight: 900, color: '#fdf3dc' }}>{c}</div><div style={{ fontSize: 12, opacity: 0.6 }}>{players.filter((p) => p.klass === c).length} players</div></div>
                <div style={{ fontFamily: FR, fontSize: 34, fontWeight: 900, color: P.warm }}>⭐{classTotals[c] || 0}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Broadcast praise */}
        <section>
          <div style={aTitle(P)}>📣 Send praise</div>
          <div style={aCard(P)}>
            <BroadcastBox P={P} m={m} />
          </div>
        </section>

        {/* Players */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 10, flexWrap: 'wrap' }}>
            <div style={{ ...aTitle(P), marginBottom: 0 }}>🏆 Players ({shown.length})</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['All', '6M', '6BC', 'Other'].map((f) => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 12px', borderRadius: 999, background: filter === f ? P.accent : 'transparent', color: filter === f ? '#fff' : '#fdf3dc', border: `2px solid ${filter === f ? P.warm : '#fdf3dc44'}`, fontWeight: 900, fontSize: 12, cursor: 'pointer', fontFamily: NU }}>{f}</button>
              ))}
            </div>
          </div>
          {shown.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button onClick={() => { if (confirm(`Delete ALL ${players.length} players' progress? Cannot be undone.`)) window.clearAllPlayers(); }} style={{ padding: '8px 14px', background: '#b73a1a', color: '#fff', border: '2px solid #ff8b6a', borderRadius: 999, fontWeight: 900, fontSize: 13, cursor: 'pointer', fontFamily: NU }}>🗑 Clear all</button>
            </div>
          )}
          {shown.length === 0 ? (
            <div style={{ padding: '18px', textAlign: 'center', opacity: 0.6, border: `2px dashed ${P.warm}44`, borderRadius: 14 }}>No players yet.</div>
          ) : (
            <div style={{ border: `2px solid ${P.warm}33`, borderRadius: 14, overflow: 'hidden' }}>
              {shown.map((e, i) => (
                <div key={e.key}>
                  <div style={{ display: 'grid', gridTemplateColumns: m ? '28px 1fr auto auto' : '36px 1fr 70px 70px auto', gap: m ? 6 : 10, alignItems: 'center', padding: m ? '10px' : '12px 14px', borderBottom: `1px solid ${P.warm}22`, background: i % 2 ? '#1d100a' : 'transparent' }}>
                    <div style={{ fontFamily: FR, fontWeight: 900, color: P.warm, fontSize: m ? 13 : 16 }}>#{i + 1}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 900, color: '#fdf3dc', fontSize: m ? 13 : 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                      <div style={{ fontSize: 11, opacity: 0.65 }}>{e.klass} · {e.done} levels</div>
                    </div>
                    <div style={{ fontWeight: 900, color: P.warm, fontFamily: FR, fontSize: m ? 15 : 17 }}>⭐{e.stars}</div>
                    {!m && <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 800 }}>{e.elapsed}s</div>}
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => setExpanded(expanded === e.key ? null : e.key)} title="Edit levels" style={aMini(P, P.warm, '#3a2418')}>✎</button>
                      <button onClick={() => setPraiseFor(e)} title="Praise" style={aMini(P, '#9fc972', '#1f3d2a')}>👏</button>
                      <button onClick={() => { window.banPlayer(e.key, 10); alert(`${e.name} is banned for 10 seconds!`); }} title="Ban for 10 seconds" style={aMini(P, '#ffd27a', '#3a2a08')}>🚫</button>
                      <button onClick={() => { window.freeLaptopFor(e.key); alert(`${e.name}'s laptop will unlock within a moment, so they can sign in fresh.`); }} title="Free their laptop" style={aMini(P, '#8fd0ff', '#10283a')}>💻</button>
                      <button onClick={() => { if (confirm(`Delete ${e.name}? Removes all their stars.`)) window.deletePlayer(e.key); }} title="Delete" style={{ ...aMini(P, '#ffb09a', 'transparent'), borderColor: '#ffb09a66' }}>🗑</button>
                    </div>
                  </div>
                  {expanded === e.key && <LevelEditor P={P} m={m} player={e} />}
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.6, lineHeight: 1.4 }}>✎ fix stars/time · 👏 praise · 🚫 10-second ban · 💻 free their laptop · 🗑 remove them.</div>
        </section>

        {/* Messages admin */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={aTitle(P)}>💬 Messages</div>
            <button onClick={() => { if (confirm('Clear all cheers & praise?')) window.clearMessages(); }} style={aGhost(P, m)}>Clear feed</button>
          </div>
        </section>

        {/* Password */}
        <section>
          <div style={aTitle(P)}>🔑 Change admin password</div>
          <div style={aCard(P)}>
            <input type="text" value={pwNew} onChange={(e) => { setPwNew(e.target.value); setPwSaved(false); }} placeholder="New password" style={aInput(P)} />
            <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => { if (pwNew.trim().length < 3) { alert('At least 3 characters.'); return; } window.saveAdmin({ password: pwNew.trim() }); setPwNew(''); setPwSaved(true); }} style={aPrimary(P, m)}>Save</button>
              {pwSaved && <span style={{ fontSize: 12, color: P.warm, fontWeight: 800 }}>✓ Saved!</span>}
            </div>
          </div>
        </section>

        {praiseFor && <PraiseModal P={P} m={m} target={praiseFor} onClose={() => setPraiseFor(null)} />}
      </div>
    );
  }

  function LevelEditor({ P, m, player }) {
    const [, force] = useState(0);
    const rec = window.getPlayerByKey(player.key);
    const levels = (rec && rec.levels) || {};
    return (
      <div style={{ padding: m ? '8px 10px 12px' : '10px 14px 14px', background: '#160b06', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {window.CHAI_LEVELS.filter((lv) => levels[lv.id]).length === 0 && (
          <div style={{ fontSize: 12, opacity: 0.6 }}>No levels completed yet.</div>
        )}
        {window.CHAI_LEVELS.filter((lv) => levels[lv.id]).map((lv) => {
          const d = levels[lv.id];
          return (
            <div key={lv.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center', fontSize: 12 }}>
              <div style={{ color: '#fdf3dc', fontWeight: 800 }}>{lv.emoji} Lv{lv.n} {lv.title}</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, color: P.warm, fontWeight: 800 }}>
                ⭐<input type="number" min="0" max="5" defaultValue={d.stars} onBlur={(ev) => { const v = Math.max(0, Math.min(5, parseInt(ev.target.value, 10) || 0)); window.adminSetLevel(player.key, lv.id, { stars: v, correct: v }); force((x) => x + 1); }} style={miniNum(P)} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, color: P.warm, fontWeight: 800 }}>
                ⏱<input type="number" min="0" defaultValue={d.elapsed} onBlur={(ev) => { const v = Math.max(0, parseInt(ev.target.value, 10) || 0); window.adminSetLevel(player.key, lv.id, { elapsed: v }); force((x) => x + 1); }} style={miniNum(P)} />s
              </label>
            </div>
          );
        })}
      </div>
    );
  }

  function BroadcastBox({ P, m }) {
    const [to, setTo] = useState('all'); // all | 6M | 6BC
    const [text, setText] = useState('');
    const [sent, setSent] = useState(false);
    const doSend = (t) => {
      const body = (t || text).trim(); if (!body) return;
      window.sendMessage({ fromName: window.getMcName ? window.getMcName() : 'MC', fromClass: 'Other', toType: to === 'all' ? 'all' : 'class', toKey: to === 'all' ? '' : to, text: body, kind: 'praise' });
      setText(''); setSent(true); window.sfx.chime(); setTimeout(() => setSent(false), 1500);
    };
    return (
      <div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {['all', '6M', '6BC'].map((t) => (
            <button key={t} onClick={() => setTo(t)} style={{ padding: '6px 12px', borderRadius: 999, background: to === t ? P.accent : 'transparent', color: to === t ? '#fff' : '#fdf3dc', border: `2px solid ${to === t ? P.warm : '#fdf3dc44'}`, fontWeight: 900, fontSize: 12, cursor: 'pointer', fontFamily: NU }}>{t === 'all' ? 'Everyone' : t}</button>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {window.CHAI_PRAISE.map((p) => (
            <button key={p} onClick={() => doSend(p)} style={{ padding: '6px 10px', borderRadius: 10, background: '#3a2418', color: '#fdf3dc', border: `2px solid ${P.warm}55`, fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: NU }}>{p}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') doSend(); }} placeholder="Type your own message…" style={{ ...aInput(P), marginTop: 0, flex: 1 }} />
          <button onClick={() => doSend()} style={aPrimary(P, m)}>Send</button>
        </div>
        {sent && <div style={{ marginTop: 6, fontSize: 12, color: P.warm, fontWeight: 800 }}>✓ Sent!</div>}
      </div>
    );
  }

  function PraiseModal({ P, m, target, onClose }) {
    const send = (text) => {
      window.sendMessage({ fromName: window.getMcName ? window.getMcName() : 'MC', fromClass: 'Other', toType: 'player', toKey: target.key, text, kind: 'praise' });
      window.sfx.chime(); onClose();
    };
    const [text, setText] = useState('');
    return (
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 60, padding: 14 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: '#2a1810', border: `4px solid ${P.warm}88`, borderRadius: 20, padding: m ? 18 : 24, color: '#fdf3dc' }}>
          <div style={{ fontFamily: FR, fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Praise {target.name} 👏</div>
          <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 14 }}>{target.klass} · ⭐{target.stars}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {window.CHAI_PRAISE.map((p) => <button key={p} onClick={() => send(p)} style={{ padding: '8px 12px', borderRadius: 10, background: '#3a2418', color: '#fdf3dc', border: `2px solid ${P.warm}55`, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: NU }}>{p}</button>)}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && text.trim()) send(text.trim()); }} placeholder="Or type your own…" style={{ ...aInput(P), marginTop: 0, flex: 1 }} />
            <button onClick={() => text.trim() && send(text.trim())} style={aPrimary(P, m)}>Send</button>
          </div>
        </div>
      </div>
    );
  }

  // Admin styles
  function aTitle(P) { return { fontFamily: FR, fontSize: 22, fontWeight: 900, color: '#fdf3dc', marginBottom: 10 }; }
  function aCard(P) { return { background: '#1d100a', padding: 14, borderRadius: 14, border: `2px solid ${P.warm}33` }; }
  function aLabel(P) { return { fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: P.warm, fontWeight: 900 }; }
  function aInput(P) { return { width: '100%', padding: '12px 14px', boxSizing: 'border-box', background: '#3a2418', color: '#fdf3dc', border: `2px solid ${P.warm}66`, borderRadius: 10, fontSize: 16, fontWeight: 700, fontFamily: NU, outline: 'none', marginTop: 6 }; }
  function aPrimary(P, m) { return { padding: m ? '10px 18px' : '12px 22px', background: P.accent, color: '#fff', border: `2px solid ${P.warm}`, borderRadius: 999, fontWeight: 900, fontSize: m ? 14 : 15, cursor: 'pointer', fontFamily: NU, boxShadow: '0 4px 0 #1d100a', whiteSpace: 'nowrap' }; }
  function aGhost(P, m) { return { padding: m ? '8px 14px' : '10px 16px', background: 'transparent', color: '#fdf3dc', border: '2px solid #fdf3dc44', borderRadius: 999, fontWeight: 900, fontSize: m ? 13 : 14, cursor: 'pointer', fontFamily: NU }; }
  function aMini(P, color, bg) { return { width: 28, height: 28, lineHeight: 1, padding: 0, background: bg, color, border: `2px solid ${color}55`, borderRadius: 8, fontWeight: 900, cursor: 'pointer', fontFamily: NU, fontSize: 13 }; }
  function miniNum(P) { return { width: 48, padding: '4px 6px', background: '#3a2418', color: '#fdf3dc', border: `2px solid ${P.warm}66`, borderRadius: 6, fontFamily: NU, fontSize: 13, fontWeight: 800, outline: 'none' }; }

  window.SBSocial = { Leaderboard, Inbox, AdminPanel, AdminBody };
})();

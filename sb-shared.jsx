// ════════════════════════════════════════════════════════════════
// CHAI QUIZ v2 — shared UI building blocks
// Palettes, responsive hook, Screen wrapper, buttons, StarRow, keyframes.
// Exposes everything on window.SB.
// ════════════════════════════════════════════════════════════════
(function () {
  const { useState, useEffect } = React;

  // Each palette carries surface tokens so we can theme light & dark:
  //   surface = card bg · field = input bg · ok/bad = answer result bgs
  const PALETTES = [
    { paper: '#fff5e0', ink: '#3d2818', accent: '#e8702b', leaf: '#6a9a3a', warm: '#f6c25a', deep: '#7a3d18', surface: '#ffffff', field: '#ffffff', ok: '#e8f4d8', bad: '#fcdacc' },
    { paper: '#ffe9c4', ink: '#2a1810', accent: '#c44d27', leaf: '#5a7a3a', warm: '#e8b86f', deep: '#5a2810', surface: '#ffffff', field: '#ffffff', ok: '#e8f4d8', bad: '#fcdacc' },
    { paper: '#fdebd3', ink: '#3d2818', accent: '#d96a2c', leaf: '#7aa84a', warm: '#f4ce6a', deep: '#7a3d18', surface: '#ffffff', field: '#ffffff', ok: '#e8f4d8', bad: '#fcdacc' },
  ];
  // Dark mode: dark warm surfaces, cream "ink", slightly deeper accents so
  // cream text stays readable on chips/badges/buttons.
  const DARK = {
    paper: '#150e09', ink: '#f3e7cf', accent: '#ef7d34', leaf: '#6f9e3f', warm: '#c98e34',
    deep: '#000000', surface: '#241a12', field: '#1c1209', ok: '#2a3a1d', bad: '#3c211b', isDark: true,
  };
  const getPalette = (i, dark) => dark ? DARK : (PALETTES[i] || PALETTES[0]);

  function useIsMobile(bp = 1024) {
    const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth < bp);
    useEffect(() => {
      const onResize = () => setM(window.innerWidth < bp);
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }, [bp]);
    return m;
  }

  const FR = '"Fraunces", "Cormorant Garamond", Georgia, serif';
  const NU = '"Nunito", system-ui, sans-serif';

  // Page region. Desktop = absolute fill (optionally scroll); mobile = flow.
  function Screen({ m, children, style = {}, padding, scroll }) {
    return (
      <div style={{
        position: m ? 'relative' : 'absolute',
        inset: m ? undefined : 0,
        width: '100%', minHeight: m ? '100vh' : 'auto',
        padding: padding ?? (m ? '18px 14px' : '30px 48px'),
        boxSizing: 'border-box',
        overflowY: scroll ? 'auto' : undefined,
        WebkitOverflowScrolling: scroll ? 'touch' : undefined,
        ...style,
      }}>{children}</div>
    );
  }

  function primaryBtn(P, m, bg) {
    return {
      padding: m ? '14px 22px' : '16px 30px', borderRadius: 999,
      background: bg || P.ink, color: '#fff',
      fontSize: m ? 16 : 19, fontWeight: 900, border: 'none', cursor: 'pointer',
      boxShadow: `0 6px 0 ${bg ? P.deep : P.accent}, 0 12px 30px ${P.ink}33`,
      fontFamily: NU, touchAction: 'manipulation',
    };
  }
  function secondaryBtn(P, m) {
    return {
      padding: m ? '13px 20px' : '15px 24px', borderRadius: 999,
      background: P.surface, color: P.ink, fontSize: m ? 15 : 17, fontWeight: 900,
      border: `${m ? 3 : 4}px solid ${P.ink}`, cursor: 'pointer', fontFamily: NU,
      boxShadow: `0 5px 0 ${P.ink}`, touchAction: 'manipulation',
    };
  }
  function chip(bg, fg, ink, m) {
    return {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: bg, color: fg, padding: m ? '4px 10px' : '6px 12px',
      borderRadius: 999, border: `${m ? 2 : 3}px solid ${ink}`,
      fontWeight: 900, fontSize: m ? 11 : 13, fontFamily: NU,
    };
  }

  // Row of stars (filled vs empty), e.g. 3/5
  function StarRow({ count, max = 5, size = 20, color, dim }) {
    return (
      <div style={{ display: 'inline-flex', gap: 3 }}>
        {Array.from({ length: max }).map((_, i) => (
          <window.Star key={i} size={size} fill={i < count ? color : dim} />
        ))}
      </div>
    );
  }

  function ClassBadge({ klass, P, m }) {
    const bg = klass === '6BC' ? P.accent : klass === '6M' ? P.leaf : `${P.ink}66`;
    return (
      <span style={{
        background: bg, color: '#fff', padding: m ? '2px 8px' : '3px 10px',
        borderRadius: 99, fontSize: m ? 10 : 12, fontWeight: 900, letterSpacing: '0.06em',
        fontFamily: NU,
      }}>{klass}</span>
    );
  }

  function Keyframes() {
    return <style>{`
      @keyframes sb-pop { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
      @keyframes sb-bounce { 0% { opacity: 0; transform: scale(0.6); } 60% { opacity: 1; transform: scale(1.05); } 100% { transform: scale(1); } }
      @keyframes sb-wiggle { 0%,100% { transform: rotate(8deg); } 50% { transform: rotate(4deg) translateY(-3px); } }
      @keyframes sb-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      @keyframes sb-slide { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes sb-card { 0% { opacity: 0; transform: rotate(-4deg) scale(0.7); } 70% { opacity: 1; transform: rotate(-4deg) scale(1.05); } 100% { transform: rotate(-4deg) scale(1); } }
      @keyframes sb-jiggle { 0%,100% { transform: translateY(0) rotate(0); } 30% { transform: translateY(-8px) rotate(-2deg); } 60% { transform: translateY(0) rotate(2deg); } }
      @keyframes sb-star-pop { 0% { transform: scale(0) rotate(-30deg); opacity: 0; } 70% { transform: scale(1.3) rotate(10deg); } 100% { transform: scale(1) rotate(0); opacity: 1; } }
    `}</style>;
  }

  window.SB = { PALETTES, DARK, getPalette, useIsMobile, FR, NU, Screen, primaryBtn, secondaryBtn, chip, StarRow, ClassBadge, Keyframes };
})();

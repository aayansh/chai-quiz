// Shared illustrated icons for the Chai Quiz
// Hand-drawn-feel SVG primitives. Keep simple: cups, leaves, spices, stars.

(function () {
  const Cup = ({ size = 64, fill = '#c44d27', stroke = '#3d2818', steam = true }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {steam && (
        <g stroke={stroke} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.85">
          <path d="M22 12 C 19 8, 25 6, 22 2" />
          <path d="M32 12 C 29 7, 35 5, 32 1" />
          <path d="M42 12 C 39 8, 45 6, 42 2" />
        </g>
      )}
      <path d="M12 22 H 46 V 40 C 46 48, 40 54, 29 54 C 18 54, 12 48, 12 40 Z" fill={fill} stroke={stroke} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M46 26 C 56 26, 56 40, 46 40" stroke={stroke} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <ellipse cx="29" cy="22" rx="17" ry="3.5" fill={stroke} opacity="0.18" />
      <path d="M14 18 H 44" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );

  const Leaf = ({ size = 48, fill = '#5a7a3a', stroke = '#3d2818' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 40 C 8 20, 22 6, 42 6 C 42 26, 28 40, 8 40 Z" fill={fill} stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 38 L 38 10" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M16 36 C 18 30, 22 26, 28 24" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M20 34 C 24 32, 28 28, 32 22" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );

  const StarAnise = ({ size = 48, fill = '#a55a2a', stroke = '#3d2818' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(24 24)">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <ellipse key={i} cx="0" cy="-14" rx="4.5" ry="9" fill={fill} stroke={stroke} strokeWidth="1.5" transform={`rotate(${i * 45})`} />
        ))}
        <circle r="4" fill="#3d2818" />
      </g>
    </svg>
  );

  const Cardamom = ({ size = 40, fill = '#8caa5a', stroke = '#3d2818' }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 4 C 28 6, 32 14, 30 28 C 28 34, 24 36, 20 36 C 16 36, 12 34, 10 28 C 8 14, 12 6, 20 4 Z" fill={fill} stroke={stroke} strokeWidth="1.6" />
      <path d="M20 4 C 21 8, 21 14, 20 36" stroke={stroke} strokeWidth="1.2" fill="none" />
      <path d="M14 8 C 18 6, 22 6, 26 8" stroke={stroke} strokeWidth="1.2" fill="none" />
    </svg>
  );

  const Cinnamon = ({ size = 40, fill = '#a55a2a', stroke = '#3d2818' }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="14" width="32" height="12" rx="3" fill={fill} stroke={stroke} strokeWidth="1.6" transform="rotate(-12 20 20)" />
      <circle cx="6" cy="19" r="3" fill="#7a3d18" stroke={stroke} strokeWidth="1.2" transform="rotate(-12 20 20)" />
      <circle cx="34" cy="21" r="3" fill="#7a3d18" stroke={stroke} strokeWidth="1.2" transform="rotate(-12 20 20)" />
    </svg>
  );

  const Biscuit = ({ size = 40, fill = '#d4a25a', stroke = '#3d2818' }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="10" width="28" height="20" rx="3" fill={fill} stroke={stroke} strokeWidth="1.6" />
      <g fill={stroke}>
        <circle cx="12" cy="16" r="1.4" />
        <circle cx="20" cy="14" r="1.4" />
        <circle cx="28" cy="17" r="1.4" />
        <circle cx="14" cy="22" r="1.4" />
        <circle cx="22" cy="24" r="1.4" />
        <circle cx="30" cy="23" r="1.4" />
        <circle cx="18" cy="26" r="1.4" />
      </g>
    </svg>
  );

  const Kettle = ({ size = 56, fill = '#3d2818', stroke = '#3d2818', steam = true }) => (
    <svg width={size} height={size} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg" fill="none">
      {steam && (
        <g stroke={stroke} strokeWidth="1.6" strokeLinecap="round" opacity="0.8">
          <path d="M22 10 C 20 6, 26 4, 23 0" />
          <path d="M30 10 C 28 6, 34 4, 31 0" />
        </g>
      )}
      <path d="M8 24 H 36 V 42 C 36 48, 32 50, 22 50 C 12 50, 8 48, 8 42 Z" fill={fill} />
      <path d="M36 28 L 50 22 L 50 36 L 36 38" fill={fill} stroke={stroke} strokeWidth="1.6" />
      <rect x="18" y="18" width="10" height="6" rx="1.5" fill={fill} />
      <circle cx="23" cy="36" r="3" fill="#f5ebd9" />
    </svg>
  );

  const Star = ({ size = 24, fill = '#c44d27' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2 L 14.5 9 L 22 9.5 L 16 14 L 18 21 L 12 17 L 6 21 L 8 14 L 2 9.5 L 9.5 9 Z" fill={fill} />
    </svg>
  );

  const Check = ({ size = 24, color = '#5a7a3a' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill={color} />
      <path d="M7 12 L 11 16 L 17 9" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const Cross = ({ size = 24, color = '#c44d27' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill={color} />
      <path d="M8 8 L 16 16 M 16 8 L 8 16" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );

  // Lookup table: pass a question object (or its `icon` string) and get the
  // right component back. Questions in quiz-data.js carry an `icon` field;
  // we no longer key by position, so randomized order doesn't matter.
  const ICON_BY_NAME = {
    cup: Cup,
    leaf: Leaf,
    cardamom: Cardamom,
    cinnamon: Cinnamon,
    biscuit: Biscuit,
    'star-anise': StarAnise,
    kettle: Kettle,
  };
  function iconForQuestion(qOrName) {
    const name = typeof qOrName === 'string' ? qOrName : (qOrName && qOrName.icon);
    return ICON_BY_NAME[name] || Cup;
  }

  Object.assign(window, { Cup, Leaf, StarAnise, Cardamom, Cinnamon, Biscuit, Kettle, Star, Check, Cross, iconForQuestion });
})();

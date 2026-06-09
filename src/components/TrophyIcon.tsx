type Props = {
  size?: number;
  className?: string;
};

/**
 * FIFA World Cup trophy — inline SVG, scales to any size.
 * Uses gold gradient; works on any background.
 */
export default function TrophyIcon({ size = 32, className }: Props) {
  const id = 'tg'; // gradient id — short to avoid collisions when rendered multiple times
  const h = Math.round(size * 1.45);

  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 80 116"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={`${id}a`} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%"   stopColor="#F9E068" />
          <stop offset="25%"  stopColor="#C8940A" />
          <stop offset="50%"  stopColor="#F0C840" />
          <stop offset="75%"  stopColor="#9A7000" />
          <stop offset="100%" stopColor="#C8940A" />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#9A7000" />
          <stop offset="40%"  stopColor="#F0C840" />
          <stop offset="100%" stopColor="#9A7000" />
        </linearGradient>
      </defs>

      {/* ── Globe ── */}
      <circle cx="40" cy="20" r="18" fill={`url(#${id}a)`} />
      {/* Continent lines */}
      <path d="M30,10 C27,14 26,19 28,24 C30,29 29,32 27,35"
        stroke="rgba(255,255,255,0.30)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M42,7 C46,11 47,17 44,22 C42,27 43,31 41,35"
        stroke="rgba(255,255,255,0.30)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M48,12 C52,15 52,21 49,25"
        stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* ── Left wing ── */}
      <path
        d="M26,56
           C8,50 3,34 14,16
           C17,10 25,9 27,16
           C24,22 22,36 24,52
           Z"
        fill={`url(#${id}a)`}
      />

      {/* ── Right wing ── */}
      <path
        d="M54,56
           C72,50 77,34 66,16
           C63,10 55,9 53,16
           C56,22 58,36 56,52
           Z"
        fill={`url(#${id}a)`}
      />

      {/* ── Body ── */}
      <path
        d="M26,56
           C22,64 22,74 26,80
           L54,80
           C58,74 58,64 54,56
           C48,50 32,50 26,56
           Z"
        fill={`url(#${id}a)`}
      />

      {/* ── Figure head ── */}
      <circle cx="40" cy="54" r="5" fill={`url(#${id}a)`} />

      {/* ── Stem ── */}
      <rect x="34" y="80" width="12" height="12" rx="2" fill={`url(#${id}b)`} />

      {/* ── Base ring 1 ── */}
      <path d="M28,92 L26,100 L54,100 L52,92 Z" fill={`url(#${id}b)`} />
      <line x1="29" y1="96" x2="51" y2="96" stroke="rgba(255,255,255,0.22)" strokeWidth="0.8" />

      {/* ── Base ring 2 ── */}
      <path d="M22,100 L19,110 L61,110 L58,100 Z" fill={`url(#${id}a)`} />
      <line x1="24" y1="105" x2="56" y2="105" stroke="rgba(255,255,255,0.18)" strokeWidth="0.7" />

      {/* Light sheen on left side of globe */}
      <path d="M27,10 C24,15 24,22 27,28" stroke="rgba(255,255,255,0.45)" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Light sheen on left wing */}
      <path d="M18,42 C15,36 14,28 18,20" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

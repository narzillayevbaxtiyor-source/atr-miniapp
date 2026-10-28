// Rasm bo'lmasa, mahsulot nomidan rang olib chiroyli shisha chizadi
export default function Bottle({ name = '', image }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={name} className="bottle-img" loading="lazy" />;
  }
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  const a = `hsl(${h} 55% 45%)`;
  const b = `hsl(${(h + 40) % 360} 60% 22%)`;
  const id = 'g' + h;
  return (
    <svg viewBox="0 0 120 150" className="bottle-svg" role="img" aria-label={name}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect x="48" y="8" width="24" height="16" rx="3" fill="#c9a45c" />
      <rect x="54" y="24" width="12" height="12" fill="#a98746" />
      <rect x="22" y="36" width="76" height="102" rx="14" fill={`url(#${id})`} stroke="#c9a45c" strokeWidth="1.5" />
      <rect x="32" y="48" width="10" height="78" rx="5" fill="#fff" opacity="0.18" />
      <rect x="40" y="78" width="40" height="30" rx="3" fill="#14100c" opacity="0.55" stroke="#c9a45c" strokeWidth="0.8" />
      <text x="60" y="97" textAnchor="middle" fontSize="8" fill="#e8d4a2" fontFamily="Georgia, serif">
        {name.slice(0, 11).toUpperCase()}
      </text>
    </svg>
  );
}

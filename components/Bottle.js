// Rasm bo'lmasa, mahsulot nomidan rang olib chiroyli shisha chizadi
export default function Bottle({ name = '', image, className = '' }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={name} loading="lazy" className={`h-full w-full object-cover ${className}`} />;
  }
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  const a = `hsl(${h} 60% 52%)`;
  const b = `hsl(${(h + 40) % 360} 65% 20%)`;
  const id = 'g' + h + name.length;
  return (
    <svg viewBox="0 0 120 150" className={`h-full max-h-full ${className}`} role="img" aria-label={name}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
        <linearGradient id={id + 'c'} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1deaa" />
          <stop offset="1" stopColor="#a07a32" />
        </linearGradient>
      </defs>
      <rect x="47" y="6" width="26" height="18" rx="4" fill={`url(#${id}c)`} />
      <rect x="54" y="24" width="12" height="12" fill="#a98746" />
      <rect x="20" y="36" width="80" height="104" rx="16" fill={`url(#${id})`} stroke="#d7b36a" strokeWidth="1.2" />
      <rect x="30" y="46" width="9" height="80" rx="4.5" fill="#fff" opacity="0.2" />
      <rect x="40" y="80" width="42" height="32" rx="3" fill="#0d0a07" opacity="0.6" stroke="#d7b36a" strokeWidth="0.7" />
      <text x="61" y="99" textAnchor="middle" fontSize="7.5" fill="#e8d4a2" fontFamily="Georgia, serif" letterSpacing="0.6">
        {name.slice(0, 11).toUpperCase()}
      </text>
    </svg>
  );
}

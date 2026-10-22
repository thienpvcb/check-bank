import type { CSSProperties } from 'react';

interface IconProps {
  size?: number;
  color?: string;
  style?: CSSProperties;
}

// ---- Logo mark (CB shield) ----
export const LogoIcon = ({ size = 36, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" style={style}>
    <defs>
      <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#6aa3ff" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
    </defs>
    <rect width="36" height="36" rx="10" fill="url(#logo-g)" />
    {/* Shield outline */}
    <path d="M18 6L9 10v8c0 5.25 3.9 10.16 9 11.33C23.1 28.16 27 23.25 27 18v-8L18 6z"
      fill="none" stroke="white" strokeWidth="1.6" strokeLinejoin="round" />
    {/* CB letters */}
    <text x="18" y="22" textAnchor="middle"
      fontFamily="Inter, sans-serif" fontWeight="700" fontSize="9" fill="white" letterSpacing="-0.5">
      CB
    </text>
  </svg>
);

// ---- Crypto / Bitcoin ----
export const CryptoIcon = ({ size = 20, color = '#f59e0b', style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
    <path d="M9 7h4.5a2.5 2.5 0 0 1 0 5H9m0-5v10m0-5h5a2.5 2.5 0 0 1 0 5H9"
      stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="11" y1="7" x2="11" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="11" y1="18" x2="11" y2="17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="13" y1="7" x2="13" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="13" y1="18" x2="13" y2="17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// ---- Bank building ----
export const BankIcon = ({ size = 20, color = '#4f8ef7', style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4"
      stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ---- USDT (stablecoin circle T) ----
export const USDTIcon = ({ size = 18, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <circle cx="12" cy="12" r="10" fill="#26a17b" />
    <path d="M7 8h10M12 8v8" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <path d="M9.5 13c0 0 .8.5 2.5.5s2.5-.5 2.5-.5"
      stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// ---- ETH (diamond) ----
export const ETHIcon = ({ size = 18, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <circle cx="12" cy="12" r="10" fill="#627eea" />
    <path d="M12 4.5l-5 8 5 3 5-3-5-8z" fill="white" fillOpacity="0.8" />
    <path d="M12 17.5l-5-4.5 5 2 5-2-5 4.5z" fill="white" />
  </svg>
);

// ---- BNB ----
export const BNBIcon = ({ size = 18, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <circle cx="12" cy="12" r="10" fill="#f3ba2f" />
    <path d="M12 7l1.5 1.5L12 10 10.5 8.5 12 7zM8.5 10.5L10 9l1.5 1.5-1.5 1.5L8.5 10.5zM12 14l1.5-1.5 1.5 1.5-1.5 1.5L12 14zM15.5 10.5L14 9l-1.5 1.5 1.5 1.5 1.5-1.5zM12 11.5L10.5 10 12 8.5l1.5 1.5L12 11.5z"
      fill="white" />
  </svg>
);

// ---- TRX (hexagon) ----
export const TRXIcon = ({ size = 18, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <circle cx="12" cy="12" r="10" fill="#e50914" />
    <path d="M7 9h10l-5 7.5L7 9z" fill="white" fillOpacity="0.9" />
  </svg>
);

// ---- BTC ----
export const BTCIcon = ({ size = 18, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <circle cx="12" cy="12" r="10" fill="#f7931a" />
    <path d="M9.5 7.5h3.5a2 2 0 0 1 0 4H9.5m0-4v9m0-4.5h4a2 2 0 0 1 0 4H9.5"
      stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="11.5" y1="7.5" x2="11.5" y2="6.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="13" y1="7.5" x2="13" y2="6.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="11.5" y1="17" x2="11.5" y2="16" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="13" y1="17" x2="13" y2="16" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

// ---- Helper: get crypto icon by symbol ----
export const CryptoSymbolIcon = ({ symbol, size = 18 }: { symbol: string; size?: number }) => {
  switch (symbol) {
    case 'BTC':  return <BTCIcon  size={size} />;
    case 'ETH':  return <ETHIcon  size={size} />;
    case 'BNB':  return <BNBIcon  size={size} />;
    case 'TRX':  return <TRXIcon  size={size} />;
    case 'USDT': return <USDTIcon size={size} />;
    default:     return <USDTIcon size={size} />;
  }
};

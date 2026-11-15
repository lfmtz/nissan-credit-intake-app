import React from 'react';

export default function NissanLogo({ size = 80, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 170"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Logo Nissan"
      style={{
        filter:
          "drop-shadow(0 0 8px rgba(255, 30, 66, 0.85)) drop-shadow(0 0 20px rgba(195, 0, 47, 0.65))"
      }}
    >
      <defs>
        <linearGradient id="nissanRedGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff6b88" />
          <stop offset="50%" stopColor="#ff1e42" />
          <stop offset="100%" stopColor="#c3002f" />
        </linearGradient>
      </defs>

      {/* Arco superior con remates horizontales */}
      <path
        d="M 28 60 L 44 60 Q 48 60 51 55 A 58 58 0 0 1 149 55 Q 152 60 156 60 L 172 60"
        stroke="url(#nissanRedGlow)"
        strokeWidth="7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Arco inferior con remates horizontales */}
      <path
        d="M 28 110 L 44 110 Q 48 110 51 115 A 58 58 0 0 0 149 115 Q 152 110 156 110 L 172 110"
        stroke="url(#nissanRedGlow)"
        strokeWidth="7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Texto NISSAN estilizado */}
      <text
        x="100"
        y="93"
        textAnchor="middle"
        fill="#ff4d6d"
        stroke="#ff9eb0"
        strokeWidth="0.8"
        fontFamily="'Outfit', 'Inter', sans-serif"
        fontWeight="700"
        fontSize="26"
        letterSpacing="8.5"
      >
        NISSAN
      </text>
    </svg>
  );
}

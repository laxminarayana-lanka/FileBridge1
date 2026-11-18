import React from 'react';

export default function NearbyShareIllustration({ className = "w-72 h-44 sm:w-80 sm:h-48" }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 340 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm overflow-visible"
      >
        <defs>
          {/* Subtle soft shadows */}
          <filter id="soft-shadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.08" />
          </filter>

          {/* Badge glow */}
          <filter id="badge-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#1a73e8" floodOpacity="0.3" />
          </filter>

          {/* Gradients */}
          <linearGradient id="blueBlobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dbeafe" />
            <stop offset="100%" stopColor="#bfdbfe" />
          </linearGradient>

          <linearGradient id="mintBlobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d1fae5" />
            <stop offset="100%" stopColor="#a7f3d0" />
          </linearGradient>
        </defs>

        {/* --- LEFT BLOB (Lavender/Blue) --- */}
        <g className="animate-bounce-gentle">
          {/* Feet */}
          <ellipse cx="65" cy="155" rx="7" ry="12" fill="#bfdbfe" />
          <ellipse cx="95" cy="155" rx="7" ry="12" fill="#bfdbfe" />

          {/* Ears / Antennae */}
          <ellipse cx="60" cy="62" rx="7" ry="13" fill="#bfdbfe" transform="rotate(-15 60 62)" />
          <ellipse cx="100" cy="62" rx="7" ry="13" fill="#bfdbfe" transform="rotate(15 100 62)" />

          {/* Main Body */}
          <rect
            x="45"
            y="65"
            width="72"
            height="85"
            rx="36"
            fill="url(#blueBlobGrad)"
            filter="url(#soft-shadow)"
          />

          {/* Eyes */}
          <ellipse cx="70" cy="98" rx="3.5" ry="5.5" fill="#1e293b" />
          <circle cx="71.5" cy="96" r="1.5" fill="#ffffff" />

          <ellipse cx="92" cy="98" rx="3.5" ry="5.5" fill="#1e293b" />
          <circle cx="93.5" cy="96" r="1.5" fill="#ffffff" />

          {/* Smile */}
          <path
            d="M 76 109 Q 81 115 86 109"
            stroke="#1e293b"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* --- RIGHT BLOB (Mint / Green) --- */}
        <g className="animate-bounce-gentle" style={{ animationDelay: '0.4s' }}>
          {/* Feet */}
          <ellipse cx="245" cy="155" rx="7" ry="12" fill="#a7f3d0" />
          <ellipse cx="275" cy="155" rx="7" ry="12" fill="#a7f3d0" />

          {/* Ears / Antennae */}
          <ellipse cx="240" cy="62" rx="7" ry="13" fill="#a7f3d0" transform="rotate(-15 240 62)" />
          <ellipse cx="280" cy="62" rx="7" ry="13" fill="#a7f3d0" transform="rotate(15 280 62)" />

          {/* Main Body */}
          <rect
            x="223"
            y="65"
            width="72"
            height="85"
            rx="36"
            fill="url(#mintBlobGrad)"
            filter="url(#soft-shadow)"
          />

          {/* Eyes */}
          <ellipse cx="248" cy="98" rx="3.5" ry="5.5" fill="#1e293b" />
          <circle cx="249.5" cy="96" r="1.5" fill="#ffffff" />

          <ellipse cx="270" cy="98" rx="3.5" ry="5.5" fill="#1e293b" />
          <circle cx="271.5" cy="96" r="1.5" fill="#ffffff" />

          {/* Smile */}
          <path
            d="M 254 109 Q 259 115 264 109"
            stroke="#1e293b"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* --- FLOATING FILE DOCUMENTS --- */}
        {/* Document 1 floating left-to-center */}
        <g transform="translate(132, 75) rotate(-14)">
          <rect
            x="0"
            y="0"
            width="22"
            height="26"
            rx="4"
            fill="#ffffff"
            stroke="#bfdbfe"
            strokeWidth="1.5"
            filter="url(#soft-shadow)"
          />
          <line x1="5" y1="8" x2="17" y2="8" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
          <line x1="5" y1="13" x2="14" y2="13" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
          <line x1="5" y1="18" x2="11" y2="18" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Document 2 floating center-to-right */}
        <g transform="translate(190, 72) rotate(12)">
          <rect
            x="0"
            y="0"
            width="22"
            height="26"
            rx="4"
            fill="#ffffff"
            stroke="#a7f3d0"
            strokeWidth="1.5"
            filter="url(#soft-shadow)"
          />
          <line x1="5" y1="8" x2="17" y2="8" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" />
          <line x1="5" y1="13" x2="14" y2="13" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" />
          <line x1="5" y1="18" x2="11" y2="18" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* --- CENTRAL SHARE BADGE (Nearby Share Icon) --- */}
        <g filter="url(#badge-glow)">
          <circle cx="170" cy="72" r="18" fill="#1a73e8" />
          {/* Nearby Share dual wavy loops icon */}
          <path
            d="M 162 67 C 165 64, 169 64, 172 67 C 175 70, 178 70, 180 67"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 160 77 C 162 74, 165 74, 168 77 C 171 80, 175 80, 178 77"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </g>

      </svg>
    </div>
  );
}

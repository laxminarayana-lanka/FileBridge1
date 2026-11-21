import React from 'react';

export default function NearbyShareIllustration({ className = "w-72 h-44 sm:w-80 sm:h-48" }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 340 210"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm overflow-visible"
      >
        <defs>
          {/* Soft shadow for blobs */}
          <filter id="soft-shadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="5" stdDeviation="8" floodOpacity="0.10" />
          </filter>

          {/* Badge glow — Google Blue */}
          <filter id="badge-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#1a73e8" floodOpacity="0.35" />
          </filter>

          {/* Left blob gradient — periwinkle / cornflower blue like reference */}
          <linearGradient id="blueBlobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c7d7f7" />
            <stop offset="100%" stopColor="#aac2f5" />
          </linearGradient>

          {/* Right blob gradient — soft cyan / teal like reference */}
          <linearGradient id="mintBlobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b2eae8" />
            <stop offset="100%" stopColor="#8dddd8" />
          </linearGradient>

          {/* Ear/feet lighter shade for left blob */}
          <linearGradient id="blueAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d8e5fa" />
            <stop offset="100%" stopColor="#c0d3f8" />
          </linearGradient>

          {/* Ear/feet lighter shade for right blob */}
          <linearGradient id="mintAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c8eeec" />
            <stop offset="100%" stopColor="#aae4e1" />
          </linearGradient>
        </defs>

        {/* Sparkle dots ambient */}
        <circle cx="130" cy="40" r="2.5" fill="#c7d7f7" opacity="0.7" />
        <circle cx="210" cy="35" r="2" fill="#8dddd8" opacity="0.7" />
        <circle cx="155" cy="28" r="1.5" fill="#1a73e8" opacity="0.4" />
        <circle cx="185" cy="45" r="1.5" fill="#1a73e8" opacity="0.3" />

        {/* --- LEFT BLOB (Periwinkle Blue) --- */}
        <g className="animate-bounce-gentle">
          {/* Feet */}
          <ellipse cx="65" cy="162" rx="8" ry="13" fill="url(#blueAccentGrad)" />
          <ellipse cx="97" cy="162" rx="8" ry="13" fill="url(#blueAccentGrad)" />

          {/* Ears / Antennae */}
          <ellipse cx="58" cy="62" rx="8" ry="14" fill="url(#blueAccentGrad)" transform="rotate(-18 58 62)" />
          <ellipse cx="102" cy="62" rx="8" ry="14" fill="url(#blueAccentGrad)" transform="rotate(18 102 62)" />

          {/* Main Body */}
          <rect
            x="42"
            y="66"
            width="78"
            height="92"
            rx="39"
            fill="url(#blueBlobGrad)"
            filter="url(#soft-shadow)"
          />

          {/* Eyes */}
          <ellipse cx="68" cy="100" rx="4" ry="6" fill="#2d3748" />
          <circle cx="69.5" cy="97.5" r="1.8" fill="#ffffff" />

          <ellipse cx="93" cy="100" rx="4" ry="6" fill="#2d3748" />
          <circle cx="94.5" cy="97.5" r="1.8" fill="#ffffff" />

          {/* Smile */}
          <path
            d="M 75 112 Q 81 119 87 112"
            stroke="#2d3748"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* --- RIGHT BLOB (Soft Teal / Cyan) --- */}
        <g className="animate-bounce-gentle" style={{ animationDelay: '0.45s' }}>
          {/* Feet */}
          <ellipse cx="243" cy="162" rx="8" ry="13" fill="url(#mintAccentGrad)" />
          <ellipse cx="275" cy="162" rx="8" ry="13" fill="url(#mintAccentGrad)" />

          {/* Ears / Antennae */}
          <ellipse cx="238" cy="62" rx="8" ry="14" fill="url(#mintAccentGrad)" transform="rotate(-18 238 62)" />
          <ellipse cx="282" cy="62" rx="8" ry="14" fill="url(#mintAccentGrad)" transform="rotate(18 282 62)" />

          {/* Main Body */}
          <rect
            x="220"
            y="66"
            width="78"
            height="92"
            rx="39"
            fill="url(#mintBlobGrad)"
            filter="url(#soft-shadow)"
          />

          {/* Eyes */}
          <ellipse cx="246" cy="100" rx="4" ry="6" fill="#2d3748" />
          <circle cx="247.5" cy="97.5" r="1.8" fill="#ffffff" />

          <ellipse cx="272" cy="100" rx="4" ry="6" fill="#2d3748" />
          <circle cx="273.5" cy="97.5" r="1.8" fill="#ffffff" />

          {/* Smile */}
          <path
            d="M 253 112 Q 259 119 265 112"
            stroke="#2d3748"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* --- FLOATING FILE DOCUMENTS --- */}
        {/* Doc 1: left-of-center, tilted left */}
        <g transform="translate(129, 72) rotate(-16)">
          <rect x="0" y="0" width="24" height="29" rx="5" fill="#ffffff" stroke="#c7d7f7" strokeWidth="1.5" filter="url(#soft-shadow)" />
          <line x1="5" y1="9" x2="19" y2="9" stroke="#aac2f5" strokeWidth="2" strokeLinecap="round" />
          <line x1="5" y1="15" x2="15" y2="15" stroke="#aac2f5" strokeWidth="2" strokeLinecap="round" />
          <line x1="5" y1="21" x2="12" y2="21" stroke="#aac2f5" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Doc 2: right-of-center, tilted right */}
        <g transform="translate(189, 68) rotate(14)">
          <rect x="0" y="0" width="24" height="29" rx="5" fill="#ffffff" stroke="#b2eae8" strokeWidth="1.5" filter="url(#soft-shadow)" />
          <line x1="5" y1="9" x2="19" y2="9" stroke="#8dddd8" strokeWidth="2" strokeLinecap="round" />
          <line x1="5" y1="15" x2="15" y2="15" stroke="#8dddd8" strokeWidth="2" strokeLinecap="round" />
          <line x1="5" y1="21" x2="12" y2="21" stroke="#8dddd8" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* --- CENTRAL SHARE BADGE (Google Blue / Nearby Share icon) --- */}
        <g filter="url(#badge-glow)">
          <circle cx="170" cy="68" r="20" fill="#1a73e8" />
          {/* Nearby Share dual wavy ∞ loops — white */}
          <path
            d="M 160 63 C 163 60, 167 60, 170 63 C 173 66, 177 66, 180 63"
            stroke="#ffffff"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 158 73 C 161 70, 164 70, 167 73 C 170 76, 174 76, 182 71"
            stroke="#ffffff"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
        </g>

      </svg>
    </div>
  );
}

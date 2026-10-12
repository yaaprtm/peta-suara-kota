import React from 'react';
import type { ReportCategory, ReportStatus } from '../../types';

// ─── 1. Abstract Logo Mark: Sura, Baya & Tugu Pahlawan ───────────────────────
// Geometris, terinspirasi dinamika pusaran Sura (hiu) & Baya (buaya) + siluet tugu
export const SurabayaLogoMark: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Background Paper Circle with subtle 1px border */}
    <circle cx="16" cy="16" r="14.5" fill="#FAF6EE" stroke="#1E1B16" strokeWidth="1.5" />
    
    {/* Sura curve (Shark dorsal arc - kiri) */}
    <path
      d="M8.5 21.5C7.5 16 10 11 14 8.5C13.5 11.5 14.5 14 16 15C13 16 10 18.5 8.5 21.5Z"
      fill="#1E1B16"
    />
    
    {/* Baya curve (Crocodile tail arc - kanan bawah) */}
    <path
      d="M23.5 10.5C24.5 16 22 21 18 23.5C18.5 20.5 17.5 18 16 17C19 16 22 13.5 23.5 10.5Z"
      fill="#C0392B"
    />
    
    {/* Tugu Pahlawan Spire di poros tengah */}
    <path
      d="M16 5L17.2 18H14.8L16 5Z"
      fill="#1E1B16"
    />
    <rect x="13.5" y="18" width="5" height="2" rx="0.5" fill="#1E1B16" />
    <rect x="12" y="20" width="8" height="2" rx="0.5" fill="#1E1B16" />
    
    {/* Titik pahlawan emas di puncak tugu */}
    <circle cx="16" cy="4.5" r="1" fill="#C0392B" />
  </svg>
);

// ─── 2. Status Shapes (Berdasarkan Bentuk, Bukan Warna) ────────────────────────
// Baru: Outlined | Diproses: Half-filled | Selesai: Filled with check

export const StatusShape: React.FC<{
  status: ReportStatus;
  className?: string;
  size?: number;
}> = ({ status, className = '', size = 14 }) => {
  switch (status) {
    case 'BARU':
      // Outlined Circle
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 16 16"
          fill="none"
          className={`shrink-0 ${className}`}
          aria-label="Status: Baru masuk"
        >
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'DIPROSES':
      // Half-filled Circle
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 16 16"
          fill="none"
          className={`shrink-0 ${className}`}
          aria-label="Status: Lagi diproses"
        >
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 2 A6 6 0 0 1 8 14 Z" fill="currentColor" />
        </svg>
      );
    case 'SELESAI':
      // Filled with subtle checkmark
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 16 16"
          fill="none"
          className={`shrink-0 ${className}`}
          aria-label="Status: Wes beres"
        >
          <circle cx="8" cy="8" r="6.5" fill="currentColor" />
          <path
            d="M5.5 8.2L7.2 9.8L10.8 6.2"
            stroke="#FAF6EE"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'DITOLAK':
    default:
      // Crossed circle
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 16 16"
          fill="none"
          className={`shrink-0 ${className}`}
          aria-label="Status: Ditolak"
        >
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
          <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
  }
};

// ─── 3. Category Glyphs (Hand-drawn leaning stroke style, 2px stroke) ────────
// Infrastruktur = road crack / wrench
// Kebersihan = bin
// Keamanan = shield
// Banjir = water drop with wave line
// Lainnya = dot

export const CategoryGlyph: React.FC<{
  category: ReportCategory | string;
  className?: string;
  strokeColor?: string;
  size?: number;
}> = ({ category, className = 'w-4 h-4', strokeColor = 'currentColor', size = 18 }) => {
  const cat = (category || '').toUpperCase();
  switch (cat) {
    case 'INFRASTRUKTUR':
      // Wrench / Road crack
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={`shrink-0 ${className}`}
        >
          {/* Road crack path */}
          <path
            d="M14.5 4.5C13.2 5.2 12.3 6.6 12.5 8.2L5 15.7C4.2 16.5 4.2 17.8 5 18.6C5.8 19.4 7.1 19.4 7.9 18.6L15.4 11.1C17 11.3 18.4 10.4 19.1 9.1L15.5 8L16.2 5.5L14.5 4.5Z"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3 21L7 17"
            stroke={strokeColor}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'KEBERSIHAN':
      // Bin / Trash can
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={`shrink-0 ${className}`}
        >
          <path
            d="M4 7H20M9 7V4.5C9 4.2 9.2 4 9.5 4H14.5C14.8 4 15 4.2 15 4.5V7"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M6 7L7.2 19.2C7.3 19.7 7.7 20 8.2 20H15.8C16.3 20 16.7 19.7 16.8 19.2L18 7"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M10 11V16M14 11V16" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'KEAMANAN':
      // Shield
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={`shrink-0 ${className}`}
        >
          <path
            d="M12 3.5L5 6.5V11.5C5 16.2 8 19.8 12 21C16 19.8 19 16.2 19 11.5V6.5L12 3.5Z"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M12 8V16" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'BANJIR':
      // Water drop with wave line
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={`shrink-0 ${className}`}
        >
          <path
            d="M12 3.5C12 3.5 6 10.5 6 15C6 18.3 8.7 21 12 21C15.3 21 18 18.3 18 15C18 10.5 12 3.5 12 3.5Z"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.5 15C9.2 14.5 10.2 14.5 11 15C11.8 15.5 12.8 15.5 13.5 15C14.2 14.5 15.2 14.5 15.5 14.8"
            stroke={strokeColor}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'LAINNYA':
    default:
      // Solid distinct dot / concentric
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={`shrink-0 ${className}`}
        >
          <circle cx="12" cy="12" r="5" fill={strokeColor} />
          <circle cx="12" cy="12" r="8.5" stroke={strokeColor} strokeWidth="1.5" />
        </svg>
      );
  }
};

// ─── 4. Empty State Illustrations (Flat two-tone line, 1.5px stroke) ─────────
// Tema: Tugu Pahlawan dengan Payung, Suroboyo Bus, dan Becak Tanda Banjir

/**
 * Tugu Pahlawan dengan Payung saat kota aman / tidak ada laporan
 */
export const IllustrationTuguPahlawanUmbrella: React.FC<{ className?: string }> = ({
  className = 'w-36 h-36',
}) => (
  <svg
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Horizon line */}
    <path d="M15 138H145" stroke="#1E1B16" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M25 142H135" stroke="#CFC4AB" strokeWidth="1.2" strokeLinecap="round" />

    {/* Tugu Pahlawan Monument Base */}
    <rect x="70" y="128" width="20" height="10" rx="1" fill="#FAF6EE" stroke="#1E1B16" strokeWidth="1.5" />
    <rect x="73" y="118" width="14" height="10" rx="0.5" fill="#FAF6EE" stroke="#1E1B16" strokeWidth="1.5" />
    <rect x="75" y="106" width="10" height="12" rx="0.5" fill="#FAF6EE" stroke="#1E1B16" strokeWidth="1.5" />

    {/* Tugu Spire */}
    <path d="M80 44L83.5 106H76.5L80 44Z" fill="#FAF6EE" stroke="#1E1B16" strokeWidth="1.5" />
    <line x1="80" y1="44" x2="80" y2="106" stroke="#CFC4AB" strokeWidth="1.2" />

    {/* Big Umbrella covering the monument (Two-tone: Ink + Accent #2A7F86) */}
    {/* Umbrella Canopy */}
    <path
      d="M48 64C48 45 62 30 80 30C98 30 112 45 112 64C102 61 98 63 91 61C84 59 76 59 69 61C62 63 58 61 48 64Z"
      fill="#2A7F86"
      fillOpacity="0.18"
      stroke="#2A7F86"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Umbrella Ribs */}
    <path d="M80 30C75 42 71 52 69 61" stroke="#2A7F86" strokeWidth="1.2" />
    <path d="M80 30C85 42 89 52 91 61" stroke="#2A7F86" strokeWidth="1.2" />
    {/* Umbrella Top ferrule */}
    <line x1="80" y1="25" x2="80" y2="30" stroke="#1E1B16" strokeWidth="1.8" strokeLinecap="round" />
    {/* Umbrella Shaft */}
    <path d="M80 61V76C80 79.5 83 82.5 86.5 82.5C89 82.5 91 80.5 91 78" stroke="#1E1B16" strokeWidth="1.8" strokeLinecap="round" />

    {/* Clouds & Gentle Breeze lines */}
    <path d="M28 38C32 35 38 35 41 38" stroke="#CFC4AB" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M120 46C124 43 130 43 134 46" stroke="#CFC4AB" strokeWidth="1.5" strokeLinecap="round" />

    {/* Subtle rain dots falling harmlessly outside umbrella */}
    <line x1="34" y1="74" x2="31" y2="82" stroke="#2A7F86" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    <line x1="28" y1="92" x2="25" y2="100" stroke="#2A7F86" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    <line x1="128" y1="74" x2="125" y2="82" stroke="#2A7F86" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    <line x1="134" y1="94" x2="131" y2="102" stroke="#2A7F86" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
  </svg>
);

/**
 * Suroboyo Bus di jalanan kota (Dua nada: Ink + Accent Merah Suroboyo)
 */
export const IllustrationSuroboyoBus: React.FC<{ className?: string }> = ({
  className = 'w-36 h-36',
}) => (
  <svg
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Ground line */}
    <path d="M15 125H145" stroke="#1E1B16" strokeWidth="1.5" strokeLinecap="round" />

    {/* Bus Body */}
    <rect x="25" y="65" width="110" height="48" rx="4" fill="#FAF6EE" stroke="#1E1B16" strokeWidth="1.6" />
    
    {/* Bus Red Accent Stripe (Khas Suroboyo Bus) */}
    <rect x="25.5" y="88" width="109" height="7" fill="#C0392B" fillOpacity="0.8" />

    {/* Windshield */}
    <rect x="110" y="70" width="20" height="16" rx="2" fill="#2A7F86" fillOpacity="0.15" stroke="#1E1B16" strokeWidth="1.4" />

    {/* Passenger Windows */}
    <rect x="32" y="70" width="14" height="15" rx="1.5" fill="#2A7F86" fillOpacity="0.15" stroke="#1E1B16" strokeWidth="1.3" />
    <rect x="50" y="70" width="15" height="15" rx="1.5" fill="#2A7F86" fillOpacity="0.15" stroke="#1E1B16" strokeWidth="1.3" />
    <rect x="69" y="70" width="15" height="15" rx="1.5" fill="#2A7F86" fillOpacity="0.15" stroke="#1E1B16" strokeWidth="1.3" />
    <rect x="88" y="70" width="16" height="15" rx="1.5" fill="#2A7F86" fillOpacity="0.15" stroke="#1E1B16" strokeWidth="1.3" />

    {/* Wheels */}
    <circle cx="50" cy="113" r="10" fill="#FAF6EE" stroke="#1E1B16" strokeWidth="1.6" />
    <circle cx="50" cy="113" r="4" fill="#1E1B16" />
    <circle cx="112" cy="113" r="10" fill="#FAF6EE" stroke="#1E1B16" strokeWidth="1.6" />
    <circle cx="112" cy="113" r="4" fill="#1E1B16" />

    {/* Headlight */}
    <circle cx="134" cy="98" r="2.5" fill="#C0392B" />

    {/* Street sign "SURABAYA" */}
    <line x1="20" y1="50" x2="20" y2="125" stroke="#1E1B16" strokeWidth="1.4" />
    <rect x="12" y="44" width="26" height="10" rx="1" fill="#FAF6EE" stroke="#1E1B16" strokeWidth="1.2" />
    <line x1="15" y1="49" x2="35" y2="49" stroke="#CFC4AB" strokeWidth="2" strokeDasharray="2 2" />
  </svg>
);

/**
 * Becak Khas Surabaya dengan tanda air / flood
 */
export const IllustrationBecakFlood: React.FC<{ className?: string }> = ({
  className = 'w-36 h-36',
}) => (
  <svg
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Water ripples */}
    <path d="M15 125C25 123 35 127 45 125C55 123 65 127 75 125C85 123 95 127 105 125C115 123 125 127 145 125" stroke="#2A7F86" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M25 132C35 130 45 134 55 132C65 130 75 134 85 132C95 130 105 134 125 132" stroke="#2A7F86" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />

    {/* Becak Frame */}
    {/* Front Wheels */}
    <circle cx="50" cy="115" r="12" stroke="#1E1B16" strokeWidth="1.5" strokeDasharray="1 2" />
    <circle cx="50" cy="115" r="3" fill="#1E1B16" />

    {/* Passenger Canopy */}
    <path d="M35 106C35 88 48 82 62 82C72 82 76 90 76 106" stroke="#1E1B16" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M35 106H76" stroke="#1E1B16" strokeWidth="1.4" />
    <path d="M62 82L68 106" stroke="#CFC4AB" strokeWidth="1.2" />

    {/* Driver Frame & Back Wheel */}
    <path d="M76 98L98 94L112 115" stroke="#1E1B16" strokeWidth="1.6" />
    <line x1="98" y1="94" x2="98" y2="82" stroke="#1E1B16" strokeWidth="1.6" />
    <circle cx="112" cy="115" r="10" stroke="#1E1B16" strokeWidth="1.5" strokeDasharray="1 2" />

    {/* Water Warning Sign */}
    <line x1="130" y1="65" x2="130" y2="125" stroke="#1E1B16" strokeWidth="1.5" />
    <polygon points="130,60 144,84 116,84" fill="#FAF6EE" stroke="#2A7F86" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M125 76C127 74 133 74 135 76" stroke="#2A7F86" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

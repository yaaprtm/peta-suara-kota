import mapboxgl from 'mapbox-gl';
import { Report, CATEGORY_LABELS, STATUS_LABELS, URGENCY_LABELS, getUrgencyLevel } from '../../../types';

// ─── Pilihan Varian Pin ────────────────────────────────────────────────────────
// Ganti nilai konstanta ini untuk beralih antar varian:
// 'default' | 'stempel' | 'denyut' | 'cincin-status' | 'papan-jalan'
export type PinStyle = 'default' | 'stempel' | 'denyut' | 'cincin-status' | 'papan-jalan';

export const PIN_STYLE: PinStyle = 'default';

// ─── Token Warna Visual ────────────────────────────────────────────────────────
export const CATEGORY_COLORS: Record<string, string> = {
  INFRASTRUKTUR: '#9B8CE0',
  KEBERSIHAN: '#4FB69A',
  KEAMANAN: '#E8B33A',
  BANJIR: '#3BA0D8',
  LAINNYA: '#A8A39A',
};

export const SEVERITY_COLORS = {
  kritis: '#E5533D',
  tinggi: '#F08A3C',
};

// ─── Path Ikon Kategori (SVG Flat Murni) ───────────────────────────────────────
function getCategoryIconSvg(category: string, strokeColor = '#17181B', fillColor = 'none'): string {
  const cat = (category || '').toUpperCase();
  switch (cat) {
    case 'BANJIR':
      // Tetesan air (droplet)
      return `<path d="M12 3.5 C12 3.5 6.5 11 6.5 15.5 A5.5 5.5 0 1 0 17.5 15.5 C17.5 11 12 3.5 12 3.5 Z" fill="${strokeColor}" />`;
    case 'KEAMANAN':
      // Perisai (shield)
      return `<path d="M12 3.5 L5.5 6.5 V12 C5.5 16.5 8.2 19.8 12 21 C15.8 19.8 18.5 16.5 18.5 12 V6.5 L12 3.5 Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" stroke-linejoin="round" />`;
    case 'INFRASTRUKTUR':
      // Kunci pas (wrench)
      return `<path d="M15 4 A4 4 0 0 0 11.5 8.5 L5 15 A2.1 2.1 0 1 0 8 18 L14.5 11.5 A4 4 0 0 0 19 8 Z M14 6 L17 9" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`;
    case 'KEBERSIHAN':
      // Tempat sampah (trash can)
      return `<path d="M5 6 H19 M9 6 V3.5 H15 V6 M7 6 L8 19 A1.5 1.5 0 0 0 9.5 20.5 H14.5 A1.5 1.5 0 0 0 16 19 L17 6 M10 10 V16 M14 10 V16" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`;
    case 'LAINNYA':
    default:
      // Tiga titik horizontal
      return `<circle cx="6.5" cy="12" r="1.8" fill="${strokeColor}" /><circle cx="12" cy="12" r="1.8" fill="${strokeColor}" /><circle cx="17.5" cy="12" r="1.8" fill="${strokeColor}" />`;
  }
}

export interface PinRenderResult {
  element: HTMLElement;
  anchor: mapboxgl.Anchor;
}

// ─── Generator Pin Berdasarkan Varian ──────────────────────────────────────────

export function createPinElement(report: Report, style: PinStyle = PIN_STYLE): PinRenderResult {
  const catKey = (report.category || 'LAINNYA').toUpperCase();
  const categoryColor = CATEGORY_COLORS[catKey] || '#A8A39A';
  const urgency = getUrgencyLevel(report.skorUrgensi);
  const isKritis = urgency === 'kritis';
  const isTinggi = urgency === 'tinggi';
  const isSelesai = report.status === 'SELESAI';

  // Selesai tampil lebih redup dan memakai hijau #4FB69A
  const primaryColor = isSelesai ? '#4FB69A' : categoryColor;
  const opacityStyle = isSelesai ? 'opacity: 0.65;' : '';

  // Label aksesibilitas
  const catLabel = CATEGORY_LABELS[report.category] || report.category;
  const urgLabel = URGENCY_LABELS[urgency] || 'Rendah';
  const statLabel = STATUS_LABELS[report.status] || report.status;
  const ariaLabel = `${catLabel}, ${urgLabel}, ${statLabel}: ${report.title}`;

  let svgContent = '';
  let anchor: mapboxgl.Anchor = 'bottom';
  let anchorClass = 'anchor-bottom';

  switch (style) {
    // ─── 1. VARIAN: STEMPEL ───────────────────────────────────────────────────
    case 'stempel': {
      anchor = 'bottom';
      anchorClass = 'anchor-bottom';
      const iconSvg = getCategoryIconSvg(report.category, '#17181B', 'none');
      
      // Kotak rounded 36x36 rx 7 diputar 45 derajat jadi diamond
      // Outline kedua digeser ~5px ke kanan-bawah
      svgContent = `
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Bayangan / Outline stempel meleset (geser 5px) -->
          <rect x="-18" y="-18" width="36" height="36" rx="7" transform="translate(32, 29.5) rotate(45)" fill="none" stroke="${primaryColor}" stroke-width="1.6" opacity="0.8" />
          <!-- Diamond utama -->
          <rect x="-18" y="-18" width="36" height="36" rx="7" transform="translate(27, 24.5) rotate(45)" fill="${primaryColor}" stroke="#17181B" stroke-width="1.8" />
          <!-- Aksen severity jika Kritis / Tinggi -->
          ${isKritis ? `<circle cx="27" cy="6" r="3.5" fill="#E5533D" stroke="#17181B" stroke-width="1.5" />` : ''}
          ${isTinggi ? `<circle cx="27" cy="6" r="3.5" fill="#F08A3C" stroke="#17181B" stroke-width="1.5" />` : ''}
          <!-- Ikon Kategori di tengah -->
          <g transform="translate(16, 13.5) scale(0.9)">
            ${iconSvg}
          </g>
        </svg>
      `;
      break;
    }

    // ─── 2. VARIAN: DENYUT ────────────────────────────────────────────────────
    case 'denyut': {
      anchor = 'center';
      anchorClass = 'anchor-center';
      const coreColor = isKritis ? '#E5533D' : isTinggi ? '#F08A3C' : primaryColor;
      const iconSvg = getCategoryIconSvg(report.category, '#FAF6EE', 'none');

      svgContent = `
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Cincin Luar r=36 dengan stroke tipis -->
          <circle cx="40" cy="40" r="36" stroke="${coreColor}" stroke-width="1.2" opacity="0.3" class="pin-pulse-ring" />
          <!-- Cincin Dalam r=25 opacity 0.22 -->
          <circle cx="40" cy="40" r="25" fill="${coreColor}" opacity="0.22" class="pin-pulse-inner" />
          <!-- 4 Tick tanda bidik -->
          <line x1="40" y1="2" x2="40" y2="7" stroke="${coreColor}" stroke-width="1.5" stroke-linecap="round" />
          <line x1="40" y1="73" x2="40" y2="78" stroke="${coreColor}" stroke-width="1.5" stroke-linecap="round" />
          <line x1="2" y1="40" x2="7" y2="40" stroke="${coreColor}" stroke-width="1.5" stroke-linecap="round" />
          <line x1="73" y1="40" x2="78" y2="40" stroke="${coreColor}" stroke-width="1.5" stroke-linecap="round" />
          <!-- Titik Inti r=11 -->
          <circle cx="40" cy="40" r="11" fill="${coreColor}" stroke="#17181B" stroke-width="1.5" />
          <!-- Ikon Kategori kecil di tengah titik inti -->
          <g transform="translate(33, 33) scale(0.6)">
            ${iconSvg}
          </g>
        </svg>
      `;
      break;
    }

    // ─── 3. VARIAN: CINCIN-STATUS ─────────────────────────────────────────────
    case 'cincin-status': {
      anchor = 'bottom';
      anchorClass = 'anchor-bottom';
      
      // Radius arc = 18.5, keliling = 2 * PI * 18.5 ≈ 116.24
      const circumference = 116.24;
      let strokeDasharray = `${(circumference * 0.33).toFixed(1)} ${circumference}`;
      let arcColor = isKritis ? '#E5533D' : isTinggi ? '#F08A3C' : primaryColor;

      if (report.status === 'DIPROSES') {
        strokeDasharray = `${(circumference * 0.66).toFixed(1)} ${circumference}`;
      } else if (report.status === 'SELESAI') {
        strokeDasharray = `${circumference} 0`;
        arcColor = '#4FB69A';
      }

      const iconColor = isSelesai ? '#4FB69A' : primaryColor;
      const iconSvg = getCategoryIconSvg(report.category, iconColor, 'none');

      svgContent = `
        <svg width="52" height="60" viewBox="0 0 52 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Lingkaran gelap r=22 (cx=26, cy=24) -->
          <circle cx="26" cy="24" r="21.5" fill="#17181B" stroke="#2B2822" stroke-width="1" />
          <!-- Track abu #3A3D42 tebal 5 -->
          <circle cx="26" cy="24" r="18.5" fill="none" stroke="#3A3D42" stroke-width="5" />
          <!-- Arc progress status berputar dari atas (-90deg) -->
          <circle cx="26" cy="24" r="18.5" fill="none" stroke="${arcColor}" stroke-width="5"
                  stroke-dasharray="${strokeDasharray}" stroke-linecap="round"
                  transform="rotate(-90 26 24)" />
          <!-- Ekor segitiga kecil di bawah (anchor di ujung) -->
          <polygon points="21,43 31,43 26,52" fill="#17181B" stroke="#2B2822" stroke-width="1" />
          <!-- Ikon kategori berwarna di tengah -->
          <g transform="translate(17, 15) scale(0.75)">
            ${iconSvg}
          </g>
        </svg>
      `;
      break;
    }

    // ─── 4. VARIAN: PAPAN-JALAN ───────────────────────────────────────────────
    case 'papan-jalan': {
      anchor = 'bottom';
      anchorClass = 'anchor-bottom';
      const iconSvg = getCategoryIconSvg(report.category, '#17181B', 'none');
      const flagColor = isKritis ? '#E5533D' : isTinggi ? '#F08A3C' : '';

      svgContent = `
        <svg width="56" height="72" viewBox="0 0 56 72" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Bayangan elips kecil di tanah (y=68) -->
          <ellipse cx="28" cy="68" rx="8" ry="2.5" fill="#17181B" opacity="0.45" />
          <!-- Tiang abu 3px (dari bottom heksagon y=47 sampai y=68) -->
          <line x1="28" y1="47" x2="28" y2="68" stroke="#5C6068" stroke-width="3" stroke-linecap="round" />
          <!-- Heksagon pointy-top (r=22) warna kategori dengan stroke gelap 2px -->
          <polygon points="28,3 47,14 47,36 28,47 9,36 9,14" fill="${primaryColor}" stroke="#17181B" stroke-width="2" />
          <!-- Bendera kecil di pojok kanan atas untuk Kritis (merah) atau Tinggi (oranye) -->
          ${flagColor ? `
            <rect x="-4.5" y="-4.5" width="9" height="9" rx="1.5" transform="translate(47, 12) rotate(45)" fill="${flagColor}" stroke="#17181B" stroke-width="1.5" />
          ` : ''}
          <!-- Ikon kategori di tengah -->
          <g transform="translate(19, 16) scale(0.75)">
            ${iconSvg}
          </g>
        </svg>
      `;
      break;
    }

    // ─── DEFAULT (KOMBINASI): CINCIN-STATUS + DENYUT (UNTUK KRITIS BUKAN SELESAI) ───
    case 'default':
    default: {
      anchor = 'bottom';
      anchorClass = 'anchor-bottom';

      const circumference = 116.24;
      let strokeDasharray = `${(circumference * 0.33).toFixed(1)} ${circumference}`;
      let arcColor = isKritis ? '#E5533D' : isTinggi ? '#F08A3C' : primaryColor;

      if (report.status === 'DIPROSES') {
        strokeDasharray = `${(circumference * 0.66).toFixed(1)} ${circumference}`;
      } else if (report.status === 'SELESAI') {
        strokeDasharray = `${circumference} 0`;
        arcColor = '#4FB69A';
      }

      const iconColor = isSelesai ? '#4FB69A' : primaryColor;
      const iconSvg = getCategoryIconSvg(report.category, iconColor, 'none');

      // Efek denyut hanya untuk severity Kritis dengan status bukan Selesai
      const showPulseEffect = isKritis && !isSelesai;

      svgContent = `
        <svg width="68" height="68" viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${showPulseEffect ? `
            <!-- Cincin Denyut Radar di Belakang Pin Kritis -->
            <circle cx="34" cy="27" r="27" fill="none" stroke="#E5533D" stroke-width="1.6" class="pin-radar-ring" opacity="0.6" />
            <circle cx="34" cy="27" r="32" fill="none" stroke="#E5533D" stroke-width="1" class="pin-radar-ring-outer" opacity="0.3" />
          ` : ''}
          <!-- Lingkaran gelap r=22 (cx=34, cy=27) -->
          <circle cx="34" cy="27" r="21.5" fill="#17181B" stroke="#2B2822" stroke-width="1" />
          <!-- Track abu #3A3D42 tebal 5 -->
          <circle cx="34" cy="27" r="18.5" fill="none" stroke="#3A3D42" stroke-width="5" />
          <!-- Arc progress status berputar dari atas (-90deg) -->
          <circle cx="34" cy="27" r="18.5" fill="none" stroke="${arcColor}" stroke-width="5"
                  stroke-dasharray="${strokeDasharray}" stroke-linecap="round"
                  transform="rotate(-90 34 27)" />
          <!-- Ekor segitiga kecil di bawah (anchor di ujung bawah y=56) -->
          <polygon points="29,46 39,46 34,55" fill="#17181B" stroke="#2B2822" stroke-width="1" />
          <!-- Ikon kategori berwarna di tengah -->
          <g transform="translate(25, 18) scale(0.75)">
            ${iconSvg}
          </g>
        </svg>
      `;
      break;
    }
  }

  // Wrapper elemen HTML Mapbox Marker
  const wrapper = document.createElement('div');
  wrapper.className = 'psk-pin-wrapper';

  const inner = document.createElement('div');
  inner.className = `psk-pin-inner ${anchorClass}`;
  inner.setAttribute('role', 'button');
  inner.setAttribute('tabindex', '0');
  inner.setAttribute('aria-label', ariaLabel);
  if (opacityStyle) {
    inner.setAttribute('style', opacityStyle);
  }
  inner.innerHTML = svgContent.trim();

  wrapper.appendChild(inner);

  return { element: wrapper, anchor };
}

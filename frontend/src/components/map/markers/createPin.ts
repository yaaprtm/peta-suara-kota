import mapboxgl from 'mapbox-gl';
import { Report, CATEGORY_LABELS, STATUS_LABELS, URGENCY_LABELS, getUrgencyLevel } from '../../../types';

// ─── Token Warna Identitas Kategori (Muted, Sesuai Panduan Redesign) ─────────
export const CATEGORY_COLORS: Record<string, string> = {
  INFRASTRUKTUR: '#3E5C76',
  KEBERSIHAN:    '#5E7C4A',
  KEAMANAN:      '#5B3F6E',
  BANJIR:        '#2A7F86',
  LAINNYA:       '#8A7F70',
};

// Merah (#C0392B) HANYA untuk severity, oranye (#D9822B) untuk tinggi
export const SEVERITY_COLORS = {
  kritis: '#C0392B',
  tinggi: '#D9822B',
};

export type PinStyle = 'default' | 'newspaper';
export const PIN_STYLE: PinStyle = 'newspaper';

// ─── Path Ikon Kategori (Hand-drawn leaning stroke style, 2px stroke) ─────────
function getCategoryGlyphPath(category: string, strokeColor = '#1E1B16'): string {
  const cat = (category || '').toUpperCase();
  switch (cat) {
    case 'INFRASTRUKTUR':
      // Wrench / Road crack (2px stroke)
      return `
        <path d="M17.5 7.5C16.5 8 15.8 9 16 10.2L10.5 15.7C9.8 16.4 9.8 17.5 10.5 18.2C11.2 18.9 12.3 18.9 13 18.2L18.5 12.7C19.7 12.9 20.7 12.2 21.2 11.2L18.5 10.3L19 8.2L17.5 7.5Z" 
              stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M8.5 20.2L11.5 17.2" stroke="${strokeColor}" stroke-width="1.8" stroke-linecap="round" />
      `;
    case 'KEBERSIHAN':
      // Bin (2px stroke)
      return `
        <path d="M9 10H21M13 10V8C13 7.6 13.3 7.3 13.7 7.3H16.3C16.7 7.3 17 7.6 17 8V10" 
              stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" />
        <path d="M10.5 10L11.4 19.5C11.5 19.8 11.8 20.1 12.2 20.1H17.8C18.2 20.1 18.5 19.8 18.6 19.5L19.5 10" 
              stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" />
        <path d="M13.5 13V17M16.5 13V17" stroke="${strokeColor}" stroke-width="1.8" stroke-linecap="round" />
      `;
    case 'KEAMANAN':
      // Shield (2px stroke)
      return `
        <path d="M15 7.5L9.5 9.8V13.8C9.5 17.5 11.8 20.2 15 21.2C18.2 20.2 20.5 17.5 20.5 13.8V9.8L15 7.5Z" 
              stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M15 11V17" stroke="${strokeColor}" stroke-width="1.8" stroke-linecap="round" />
      `;
    case 'BANJIR':
      // Water drop with wave line (2px stroke)
      return `
        <path d="M15 7C15 7 10 12.5 10 16C10 18.8 12.2 21 15 21C17.8 21 20 18.8 20 16C20 12.5 15 7 15 7Z" 
              stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M12.2 16.2C12.8 15.7 13.6 15.7 14.2 16.2C14.8 16.7 15.6 16.7 16.2 16.2" 
              stroke="${strokeColor}" stroke-width="1.8" stroke-linecap="round" />
      `;
    case 'LAINNYA':
    default:
      // Distinct dot (2px stroke)
      return `
        <circle cx="15" cy="14" r="3.5" fill="${strokeColor}" />
        <circle cx="15" cy="14" r="6.5" stroke="${strokeColor}" stroke-width="1.8" />
      `;
  }
}

export interface PinRenderResult {
  element: HTMLElement;
  anchor: mapboxgl.Anchor;
}

// ─── Generator Pin Berdasarkan Kategori & Severity ────────────────────────────

export function createPinElement(report: Report, _style: PinStyle = PIN_STYLE): PinRenderResult {
  const catKey = (report.category || 'LAINNYA').toUpperCase();
  const catColor = CATEGORY_COLORS[catKey] || '#8A7F70';
  const urgency = getUrgencyLevel(report.skorUrgensi);
  const isKritis = urgency === 'kritis';
  const isTinggi = urgency === 'tinggi';
  const isSelesai = report.status === 'SELESAI';

  // Label aksesibilitas
  const catLabel = CATEGORY_LABELS[report.category] || report.category;
  const urgLabel = URGENCY_LABELS[urgency] || 'Rendah';
  const statLabel = STATUS_LABELS[report.status] || report.status;
  const ariaLabel = `${catLabel}, ${urgLabel}, ${statLabel}: ${report.title}`;

  // Severity indicator dot (merah untuk kritis, oranye untuk tinggi)
  let severityDot = '';
  if (isKritis) {
    severityDot = `
      <!-- Critical Red Accent Dot (#C0392B) -->
      <circle cx="23.5" cy="6.5" r="3.2" fill="#C0392B" stroke="#FAF6EE" stroke-width="1.4" />
    `;
  } else if (isTinggi) {
    severityDot = `
      <!-- High Orange Accent Dot (#D9822B) -->
      <circle cx="23.5" cy="6.5" r="2.8" fill="#D9822B" stroke="#FAF6EE" stroke-width="1.4" />
    `;
  }

  // Pulse effect if critical and not yet resolved
  const showPulse = isKritis && !isSelesai;

  const glyphSvg = getCategoryGlyphPath(report.category, catColor);

  const svgContent = `
    <svg width="34" height="42" viewBox="0 0 30 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      ${showPulse ? `
        <!-- Critical Pulse Ring -->
        <circle cx="15" cy="14" r="16" fill="none" stroke="#C0392B" stroke-width="1.4" opacity="0.6" class="pin-critical-ring" />
      ` : ''}

      <!-- Shadow drop on ground -->
      <ellipse cx="15" cy="36" rx="5" ry="2" fill="#1E1B16" opacity="0.25" />

      <!-- Pin Base Silhouette (Hand-drawn paper pin with 2px stroke) -->
      <path d="M15 35.5C14.2 32.5 7 21.5 7 14C7 9.58 10.58 6 15 6C19.42 6 23 9.58 23 14C23 21.5 15.8 32.5 15 35.5Z" 
            fill="#FAF6EE" 
            stroke="#1E1B16" 
            stroke-width="2" 
            stroke-linejoin="round" />

      <!-- Category Accent Head Rim (1.5px stroke in category color) -->
      <path d="M9.5 13C9.5 10 11.9 7.5 15 7.5C18.1 7.5 20.5 10 20.5 13" 
            stroke="${catColor}" 
            stroke-width="2" 
            stroke-linecap="round" />

      <!-- Category Distinct Glyph inside head -->
      <g>
        ${glyphSvg}
      </g>

      <!-- Severity Dot on top right if critical or high -->
      ${severityDot}

      <!-- Selesai checkmark stamp if resolved -->
      ${isSelesai ? `
        <circle cx="7.5" cy="20.5" r="3.2" fill="#5E7C4A" stroke="#FAF6EE" stroke-width="1" />
        <path d="M6 20.5L7 21.5L9 19.5" stroke="#FAF6EE" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
      ` : ''}
    </svg>
  `;

  // Wrapper elemen HTML Mapbox Marker
  const wrapper = document.createElement('div');
  wrapper.className = 'psk-pin-wrapper';
  wrapper.id = `map-pin-${report.id}`;
  wrapper.dataset.reportId = report.id;

  const inner = document.createElement('div');
  inner.className = 'psk-pin-inner anchor-bottom';
  inner.setAttribute('role', 'button');
  inner.setAttribute('tabindex', '0');
  inner.setAttribute('aria-label', ariaLabel);
  inner.innerHTML = svgContent.trim();

  wrapper.appendChild(inner);

  return { element: wrapper, anchor: 'bottom' };
}

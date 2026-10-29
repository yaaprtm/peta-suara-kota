import React from 'react';
import clsx from 'clsx';

/**
 * PatrolLogo — Logo + nama brand PATROL
 *
 * Layout referensi: [IMG | PATROL]
 *                         SUARA KOTA SURABAYA
 *
 * Mirip dengan Kebun Raya Cibinong: logo di kiri, dua baris teks di kanan.
 */

interface PatrolLogoProps {
  /** Ukuran logo gambar dalam px (default 36) */
  size?: number;
  /** Tambahan className pada wrapper */
  className?: string;
  /** Varian warna teks: 'dark' (default), 'light' (untuk bg gelap), 'navy' */
  variant?: 'dark' | 'light' | 'navy';
  /** Sembunyikan subtitle (baris kedua) */
  hideSubtitle?: boolean;
}

export const PatrolLogo: React.FC<PatrolLogoProps> = ({
  size = 36,
  className = '',
  variant = 'dark',
  hideSubtitle = false,
}) => {
  const textColor = {
    dark:  { name: 'text-[#1E1B16]', sub: 'text-[#6B6355]' },
    light: { name: 'text-white',     sub: 'text-white/70'   },
    navy:  { name: 'text-navy',      sub: 'text-navy/60'    },
  }[variant];

  return (
    <div className={clsx('flex items-center gap-2.5 select-none', className)}>
      {/* Logo image */}
      <img
        src="/patrol-logo.png"
        alt="PATROL logo"
        width={size}
        height={size}
        className="shrink-0 object-contain"
        draggable={false}
      />

      {/* Text stack — persis seperti Kebun Raya Cibinong */}
      <div className="flex flex-col justify-center leading-none min-w-0">
        <span
          className={clsx(
            'font-bold tracking-widest uppercase',
            textColor.name
          )}
          style={{ fontSize: Math.round(size * 0.45) }}
        >
          PATROL
        </span>
        {!hideSubtitle && (
          <span
            className={clsx(
              'font-medium uppercase tracking-wider',
              textColor.sub
            )}
            style={{ fontSize: Math.round(size * 0.24) }}
          >
            Suara Kota Surabaya
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Versi compact — hanya untuk header yang sangat sempit (tanpa subtitle)
 */
export const PatrolLogoCompact: React.FC<{ size?: number; className?: string; variant?: PatrolLogoProps['variant'] }> = (props) => (
  <PatrolLogo {...props} hideSubtitle />
);

export default PatrolLogo;

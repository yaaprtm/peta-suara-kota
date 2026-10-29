import React, { useState } from 'react';
import clsx from 'clsx';
// Path relatif dari Components/ui/ ke assets/ = ../../assets/
import patrolLogoSrc from '../../assets/patrol-logo.png';

/**
 * PatrolLogo — Logo + nama brand PATROL
 * Layout: [🖼 logo | PATROL            ]
 *                   [SUARA KOTA SURABAYA]
 */

interface PatrolLogoProps {
  size?: number;
  className?: string;
  variant?: 'dark' | 'light' | 'navy' | 'white-on-dark';
  hideSubtitle?: boolean;
}

export const PatrolLogo: React.FC<PatrolLogoProps> = ({
  size = 40,
  className = '',
  variant = 'dark',
  hideSubtitle = false,
}) => {
  const [imgError, setImgError] = useState(false);

  const colors = {
    dark:            { name: 'text-[#1E1B16]',  sub: 'text-[#7A6E5F]'    },
    light:           { name: 'text-white',        sub: 'text-white/65'     },
    navy:            { name: 'text-[#1E3A5F]',   sub: 'text-[#1E3A5F]/60' },
    'white-on-dark': { name: 'text-white',        sub: 'text-white/60'     },
  }[variant];

  const nameFontSize  = Math.round(size * 0.42);
  const subFontSize   = Math.round(size * 0.22);
  const dividerHeight = Math.round(size * 0.55);

  return (
    <div className={clsx('inline-flex items-center select-none', className)}>

      {/* Logo image — di-bundle oleh Vite, tidak butuh route Vercel */}
      {!imgError ? (
        <img
          src={patrolLogoSrc}
          alt="PATROL"
          height={size}
          style={{ height: size, width: 'auto', maxWidth: size * 1.8 }}
          className="shrink-0 object-contain"
          draggable={false}
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className="shrink-0 rounded flex items-center justify-center bg-navy text-white font-bold"
          style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
        >
          P
        </div>
      )}

      {/* Divider */}
      <div
        className={clsx(
          'mx-2.5 w-px shrink-0 opacity-25',
          variant === 'dark' || variant === 'navy' ? 'bg-slate-800' : 'bg-white'
        )}
        style={{ height: dividerHeight }}
      />

      {/* Text stack */}
      <div className="flex flex-col justify-center leading-none">
        <span
          className={clsx('font-black tracking-[0.18em] uppercase whitespace-nowrap', colors.name)}
          style={{ fontSize: nameFontSize, lineHeight: 1.1 }}
        >
          PATROL
        </span>
        {!hideSubtitle && (
          <span
            className={clsx('font-semibold uppercase tracking-[0.1em] whitespace-nowrap mt-0.5', colors.sub)}
            style={{ fontSize: subFontSize, lineHeight: 1.1 }}
          >
            Suara Kota Surabaya
          </span>
        )}
      </div>
    </div>
  );
};

export const PatrolLogoCompact: React.FC<
  Pick<PatrolLogoProps, 'size' | 'className' | 'variant'>
> = (props) => <PatrolLogo {...props} hideSubtitle />;

export default PatrolLogo;

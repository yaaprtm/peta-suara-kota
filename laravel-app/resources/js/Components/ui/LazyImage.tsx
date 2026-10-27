import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Lazy-loaded Image Component with Intersection Observer
 * Only loads image when it enters viewport
 * Shows placeholder/skeleton while loading
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  aspectRatio = '16/9',
  objectFit = 'cover',
  className = '',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' } // Start loading 50px before entering viewport
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div
      className={clsx('relative overflow-hidden bg-gray-100', className)}
      style={{ aspectRatio }}
    >
      {/* Skeleton/Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]" />
      )}

      {/* Actual Image */}
      {isInView && !hasError && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          className={clsx(
            'absolute inset-0 w-full h-full transition-opacity duration-300',
            objectFit === 'cover' && 'object-cover',
            objectFit === 'contain' && 'object-contain',
            objectFit === 'fill' && 'object-fill',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          {...props}
        />
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

/**
 * Progressive Image Loader
 * Loads low-quality placeholder first, then full image
 */
export const ProgressiveImage: React.FC<LazyImageProps & { placeholderSrc?: string }> = ({
  src,
  placeholderSrc,
  alt,
  className = '',
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc || src);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoading(false);
    };
  }, [src]);

  return (
    <div className={clsx('relative', className)}>
      <img
        src={currentSrc}
        alt={alt}
        className={clsx(
          'w-full h-full object-cover transition-all duration-500',
          isLoading && placeholderSrc && 'blur-sm scale-105'
        )}
        {...props}
      />
    </div>
  );
};

export default LazyImage;

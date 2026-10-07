import React, { useState } from 'react';
import { Luggage } from 'lucide-react';

interface ProductImageProps {
  src: string;
  alt: string;
  series: string;
  title: string;
  className?: string;
  eager?: boolean;
  useProxy?: boolean;
}

export function getProxiedImageUrl(src: string): string {
  const clean = (src || '').trim();
  if (!clean) return '';
  if (/^https?:\/\/(?:www\.)?abdesai\.mu\//i.test(clean)) {
    return `/api/proxy-image?url=${encodeURIComponent(
      clean.replace(/^http:\/\//i, 'https://')
    )}`;
  }
  return clean;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  series,
  title,
  className = '',
  eager = false,
  useProxy = false,
}) => {
  const cleanSrc = typeof src === 'string' ? src.trim() : '';
  const initialUrl = useProxy ? getProxiedImageUrl(cleanSrc) : cleanSrc;
  const fallbackProxyUrl = getProxiedImageUrl(cleanSrc);

  const [triedProxyFallback, setTriedProxyFallback] = useState(false);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!cleanSrc || failedSrc === cleanSrc) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F4F2ED] to-[#E6E2D8] text-[#141413] p-2 text-center ${className}`}
      >
        <Luggage className="w-7 h-7 text-[#0F2942]/60 mb-1 stroke-[1.5]" />
        <span className="text-[10px] text-[#65645E] leading-tight">
          American Tourister · {series}
        </span>
        <span className="text-[10px] font-semibold text-[#141413] mt-0.5 line-clamp-2 leading-tight">
          {title}
        </span>
      </div>
    );
  }

  const activeUrl =
    triedProxyFallback && fallbackProxyUrl !== initialUrl
      ? fallbackProxyUrl
      : initialUrl;

  return (
    <img
      src={activeUrl}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={eager ? 'eager' : 'lazy'}
      decoding={eager ? 'sync' : 'async'}
      onError={() => {
        if (!triedProxyFallback && fallbackProxyUrl !== initialUrl) {
          setTriedProxyFallback(true);
        } else {
          setFailedSrc(cleanSrc);
        }
      }}
      className={className}
    />
  );
};

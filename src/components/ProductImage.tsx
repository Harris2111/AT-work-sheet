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

export function getPublicCorsProxyUrl(src: string): string {
  const clean = (src || '').trim();
  if (!clean) return '';
  if (/^https?:\/\//i.test(clean)) {
    return `https://wsrv.nl/?url=${encodeURIComponent(
      clean.replace(/^http:\/\//i, 'https://')
    )}&output=png`;
  }
  return clean;
}

const corsCanvasImageCache = new Map<string, HTMLImageElement>();

/**
 * Loads a remote product image into an HTMLImageElement safe for HTML5 Canvas (.toDataURL / .toBlob)
 * in both the local Express development server AND the static deployed app (where /api/proxy-image is absent).
 */
export async function loadCorsSafeCanvasImage(
  src: string,
  fallbackSrc?: string
): Promise<HTMLImageElement | null> {
  const primaryCandidates = [src, fallbackSrc]
    .map((u) => (u || '').trim())
    .filter(Boolean);
  if (primaryCandidates.length === 0) return null;

  for (const rawUrl of primaryCandidates) {
    const cached = corsCanvasImageCache.get(rawUrl);
    if (cached && cached.complete && cached.naturalWidth > 0) {
      return cached;
    }

    const fetchUrls = Array.from(
      new Set(
        [
          getProxiedImageUrl(rawUrl),
          getPublicCorsProxyUrl(rawUrl),
          rawUrl,
        ].filter(Boolean)
      )
    );

    // 1. Try fetching as a CORS-safe Blob + ObjectURL (checks Content-Type is actually image/*)
    for (const targetUrl of fetchUrls) {
      try {
        const res = await fetch(targetUrl);
        const contentType = (res.headers.get('content-type') || '').toLowerCase();
        if (res.ok && contentType.startsWith('image/')) {
          const blob = await res.blob();
          if (blob.size > 0) {
            const objUrl = URL.createObjectURL(blob);
            const decodedImg = await new Promise<HTMLImageElement | null>(
              (resolve) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => resolve(null);
                img.src = objUrl;
              }
            );
            if (decodedImg && decodedImg.naturalWidth > 0) {
              if (typeof decodedImg.decode === 'function') {
                await decodedImg.decode().catch(() => {});
              }
              corsCanvasImageCache.set(rawUrl, decodedImg);
              return decodedImg;
            }
            URL.revokeObjectURL(objUrl);
          }
        }
      } catch {
        // Continue to next candidate
      }
    }

    // 2. Fallback: direct <img crossOrigin="anonymous"> across candidate URLs
    for (const targetUrl of fetchUrls) {
      const directImg = await new Promise<HTMLImageElement | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = targetUrl;
      });
      if (directImg && directImg.naturalWidth > 0) {
        corsCanvasImageCache.set(rawUrl, directImg);
        return directImg;
      }
    }
  }

  return null;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  series,
  title,
  className = '',
  eager = false,
}) => {
  const cleanSrc = typeof src === 'string' ? src.trim() : '';
  const [attemptState, setAttemptState] = useState<{
    forSrc: string;
    step: number;
  }>({ forSrc: cleanSrc, step: 0 });

  const currentStep =
    attemptState.forSrc === cleanSrc ? attemptState.step : 0;

  // Candidate chain:
  // 0: Direct abdesai.mu URL (always works in browser DOM in both Preview and Deployed Static App!)
  // 1: Local Express proxy /api/proxy-image
  // 2: Public CORS image proxy (wsrv.nl)
  const candidates = React.useMemo(() => {
    if (!cleanSrc) return [];
    const list = [cleanSrc];
    const localProxy = getProxiedImageUrl(cleanSrc);
    if (localProxy && localProxy !== cleanSrc) list.push(localProxy);
    const pubProxy = getPublicCorsProxyUrl(cleanSrc);
    if (pubProxy && !list.includes(pubProxy)) list.push(pubProxy);
    return list;
  }, [cleanSrc]);

  if (!cleanSrc || currentStep >= candidates.length) {
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

  const activeUrl = candidates[currentStep];

  return (
    <img
      src={activeUrl}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={eager ? 'eager' : 'lazy'}
      decoding={eager ? 'sync' : 'async'}
      onError={() => {
        setAttemptState({
          forSrc: cleanSrc,
          step: currentStep + 1,
        });
      }}
      className={className}
    />
  );
};

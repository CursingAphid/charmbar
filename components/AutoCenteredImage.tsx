'use client';

import Image, { type ImageProps } from 'next/image';
import { useCallback, useMemo, useState } from 'react';

// Cache computed translation per resolved image src (including Next Image optimized URLs).
const transformCache = new Map<string, { x: number; y: number }>();

function computeOpaqueBoundingBoxCenter(img: HTMLImageElement, alphaThreshold = 8): { cx: number; cy: number } | null {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) return null;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, w, h);
  let data: ImageData;
  try {
    data = ctx.getImageData(0, 0, w, h);
  } catch {
    // If canvas is tainted for any reason, just fall back to default.
    return null;
  }

  const pixels = data.data;
  let minX = w, minY = h, maxX = -1, maxY = -1;

  for (let y = 0; y < h; y++) {
    const rowStart = y * w * 4;
    for (let x = 0; x < w; x++) {
      const a = pixels[rowStart + x * 4 + 3];
      if (a > alphaThreshold) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0 || maxY < 0) return null; // fully transparent

  return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

type AutoCenteredImageProps = Omit<ImageProps, 'onLoadingComplete'> & {
  /** Default transform while computing or if bbox detection fails */
  fallbackTransform?: string;
  /** Alpha threshold (0-255) for considering a pixel opaque */
  alphaThreshold?: number;
};

export default function AutoCenteredImage({
  style,
  fallbackTransform = 'translate(0px, 0px)',
  alphaThreshold = 8,
  ...props
}: AutoCenteredImageProps) {
  const [computed, setComputed] = useState<{ x: number; y: number } | null>(null);

  const mergedStyle = useMemo(() => {
    const existingTransform = (style as any)?.transform as string | undefined;
    const computedTransform = computed ? `translate(${computed.x.toFixed(2)}px, ${computed.y.toFixed(2)}px)` : fallbackTransform;
    return {
      ...(style ?? {}),
      objectPosition: '50% 50%',
      transform: existingTransform ? `${existingTransform} ${computedTransform}` : computedTransform,
    } as React.CSSProperties;
  }, [style, computed, fallbackTransform]);

  const onLoadingComplete = useCallback(
    (img: HTMLImageElement) => {
      const cacheKey = img.currentSrc || img.src;
      const cached = transformCache.get(cacheKey);
      if (cached) {
        setComputed(cached);
        return;
      }

      const center = computeOpaqueBoundingBoxCenter(img, alphaThreshold);
      if (center) {
        // Compute how much to translate the *rendered* image so that the opaque bbox center aligns with the container center.
        const rect = img.getBoundingClientRect();
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const scale = Math.min(rect.width / w, rect.height / h);

        const dx = (w / 2 - center.cx) * scale;
        const dy = (h / 2 - center.cy) * scale;

        const t = { x: dx, y: dy };
        transformCache.set(cacheKey, t);
        setComputed(t);
      } else {
        setComputed(null);
      }
    },
    [alphaThreshold]
  );

  return <Image {...props} style={mergedStyle} onLoadingComplete={onLoadingComplete} />;
}



'use client';

import Image, { type ImageProps } from 'next/image';
import { useCallback, useMemo, useState, useRef, useEffect } from 'react';

// Cache computed normalized ratios per resolved image src to avoid re-running canvas logic.
const ratioCache = new Map<string, { rx: number; ry: number; nw: number; nh: number }>();

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
    // If canvas is tainted for any reason (CORS), just fall back to default.
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
  const [ratios, setRatios] = useState<{ rx: number; ry: number; nw: number; nh: number } | null>(null);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Track container size to handle scale-independent translations dynamically
  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          w: entry.contentRect.width,
          h: entry.contentRect.height
        });
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const computed = useMemo(() => {
    if (!ratios || !containerSize || containerSize.w === 0 || containerSize.h === 0) return null;

    const { rx, ry, nw, nh } = ratios;
    // Account for object-contain scaling logic
    const scale = Math.min(containerSize.w / nw, containerSize.h / nh);

    return {
      x: rx * nw * scale,
      y: ry * nh * scale
    };
  }, [ratios, containerSize]);

  const mergedStyle = useMemo(() => {
    const existingTransform = (style as any)?.transform as string | undefined;
    const computedTransform = computed
      ? `translate(${computed.x.toFixed(2)}px, ${computed.y.toFixed(2)}px)`
      : fallbackTransform;

    return {
      ...(style ?? {}),
      objectPosition: '50% 50%',
      transform: existingTransform ? `${existingTransform} ${computedTransform}` : computedTransform,
    } as React.CSSProperties;
  }, [style, computed, fallbackTransform]);

  const onLoadingComplete = useCallback(
    (img: HTMLImageElement) => {
      const cacheKey = img.currentSrc || img.src;
      const cached = ratioCache.get(cacheKey);

      if (cached) {
        setRatios(cached);
        return;
      }

      const center = computeOpaqueBoundingBoxCenter(img, alphaThreshold);
      if (center) {
        const nw = img.naturalWidth;
        const nh = img.naturalHeight;

        // Compute normalized shift ratios relative to natural size
        const rx = (nw / 2 - center.cx) / nw;
        const ry = (nh / 2 - center.cy) / nh;

        const r = { rx, ry, nw, nh };
        ratioCache.set(cacheKey, r);
        setRatios(r);
      } else {
        setRatios(null);
      }
    },
    [alphaThreshold]
  );

  return (
    <Image
      {...props}
      ref={imgRef}
      style={mergedStyle}
      onLoadingComplete={onLoadingComplete}
    />
  );
}



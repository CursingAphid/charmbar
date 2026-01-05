'use client';

import Image from 'next/image';
import { useStore, SelectedCharm } from '@/store/useStore';
import { getCharmImageUrl } from '@/lib/db';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Maximize, Minimize, RotateCw, ZoomIn, ZoomOut, GripVertical, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function PreviewCanvas() {
  const selectedBracelet = useStore((state) => state.selectedBracelet);
  const selectedCharms = useStore((state) => state.selectedCharms);
  const removeCharm = useStore((state) => state.removeCharm);
  const reorderCharms = useStore((state) => state.reorderCharms);
  const { t, language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const expandedViewportRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ w: 800, h: 350 });

  const handleToggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent background scrolling while expanded
  useEffect(() => {
    if (!isExpanded) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isExpanded]);

  // Fixed positions for charms on the chain based on the total count selected (1-7)
  const charmPositionsMap: Record<number, { x: number; y: number }[]> = {
    1: [{ x: 320, y: 170 }], // P4
    2: [
      { x: 210, y: 160 }, // P3
      { x: 430, y: 160 }, // P5
    ],
    3: [
      { x: 100, y: 120 }, // P2
      { x: 320, y: 170 }, // P4
      { x: 540, y: 120 }, // P6
    ],
    4: [
      { x: 0, y: 60 },   // P1
      { x: 210, y: 160 }, // P3
      { x: 430, y: 160 }, // P5
      { x: 650, y: 60 },  // P7
    ],
    5: [
      { x: 0, y: 60 },   // P1
      { x: 155, y: 140 }, // P2
      { x: 320, y: 170 }, // P4
      { x: 490, y: 140 }, // P6
      { x: 650, y: 60 },  // P7
    ],
    6: [
      { x: 50, y: 85 },   // P1
      { x: 155, y: 140 }, // P2
      { x: 270, y: 170 }, // P3
      { x: 380, y: 160 }, // P5
      { x: 490, y: 140 }, // P6
      { x: 590, y: 85 },  // P7
    ],
    7: [
      { x: 0, y: 60 },   // P1
      { x: 100, y: 120 }, // P2
      { x: 210, y: 160 }, // P3
      { x: 320, y: 170 }, // P4
      { x: 430, y: 160 }, // P5
      { x: 540, y: 120 }, // P6
      { x: 650, y: 60 },  // P7
    ],
  };

  const totalCharms = selectedCharms.length;
  const charmPositions = charmPositionsMap[totalCharms as keyof typeof charmPositionsMap] || charmPositionsMap[5];

  // Zoom: buttons only (no wheel/pinch). Allows zooming in and out.
  const MAX_ZOOM = 3.0;
  const MIN_ZOOM = 1.0;
  const ZOOM_STEP = 0.15;
  const canZoomIn = zoom < MAX_ZOOM - 0.0001;
  const canZoomOut = zoom > MIN_ZOOM + 0.0001;
  const canPan = zoom > 1.0001;

  // Clamp pan to prevent dragging outside visible bounds
  const clampPan = useMemo(() => {
    return (next: { x: number; y: number }, nextZoom: number) => {
      if (nextZoom <= 1.0001) return { x: 0, y: 0 };
      const maxX = (viewportSize.w * (nextZoom - 1)) / 2;
      const maxY = (viewportSize.h * (nextZoom - 1)) / 2;
      return {
        x: Math.max(-maxX, Math.min(maxX, next.x)),
        y: Math.max(-maxY, Math.min(maxY, next.y)),
      };
    };
  }, [viewportSize.h, viewportSize.w]);

  const clampedPan = useMemo(() => clampPan(pan, zoom), [clampPan, pan, zoom]);

  const handleZoomIn = () => {
    setZoom((z) => {
      const next = Math.min(MAX_ZOOM, z + ZOOM_STEP);
      setPan((prev) => clampPan(prev, next));
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoom((z) => {
      const next = Math.max(MIN_ZOOM, z - ZOOM_STEP);
      setPan((prev) => clampPan(prev, next));
      return next;
    });
  };

  // Measure viewport so pan clamping is correct in normal + expanded views
  useEffect(() => {
    const activeRef = isExpanded ? expandedViewportRef.current : viewportRef.current;
    if (!activeRef) return;

    const compute = () => {
      const rect = activeRef.getBoundingClientRect();
      setViewportSize({
        w: rect.width || 800,
        h: rect.height || 300,
      });
    };

    compute();
    const ro = new ResizeObserver(() => compute());
    ro.observe(activeRef);
    return () => ro.disconnect();
  }, [isExpanded]);

  // Global mouse move handler for smoother dragging
  useEffect(() => {
    if (!isDragging || !canPan) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const raw = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y };
      setPan(clampPan(raw, zoom));
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, canPan, clampPan, dragStart, zoom]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canPan) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - clampedPan.x,
      y: e.clientY - clampedPan.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!canPan || e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - clampedPan.x,
      y: e.touches[0].clientY - clampedPan.y,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !canPan || e.touches.length !== 1) return;
    e.preventDefault(); // Prevent scrolling
    const raw = {
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    };
    setPan(clampPan(raw, zoom));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Reset zoom and pan
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (!selectedBracelet) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
        <div className="text-center">
          <p className="text-gray-400 text-sm">Select a bracelet to see preview</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Normal preview */}
      <div className="w-full h-full rounded-xl flex flex-col bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 border-2 border-pink-200 overflow-hidden">
      {/* Stage */}
      <div className="relative flex-1 min-h-0">
        {/* Controls */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 flex gap-1 sm:gap-2">
          <button
            onClick={handleZoomIn}
            disabled={!canZoomIn}
            className={[
              'p-1.5 sm:p-2 bg-white rounded-lg shadow-md transition-colors',
              canZoomIn ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed',
            ].join(' ')}
            aria-label="Zoom in"
            type="button"
          >
            <ZoomIn className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={handleZoomOut}
            disabled={!canZoomOut}
            className={[
              'p-1.5 sm:p-2 bg-white rounded-lg shadow-md transition-colors',
              canZoomOut ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed',
            ].join(' ')}
            aria-label="Zoom out"
            type="button"
          >
            <ZoomOut className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={handleResetZoom}
            disabled={zoom <= 1.0001 && pan.x === 0 && pan.y === 0}
            className={[
              'p-1.5 sm:p-2 bg-white rounded-lg shadow-md transition-colors',
              zoom > 1.0001 || pan.x !== 0 || pan.y !== 0 ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed',
            ].join(' ')}
            aria-label="Reset zoom"
            type="button"
          >
            <RotateCw className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={handleToggleExpanded}
            className="p-1.5 sm:p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            aria-label={isExpanded ? 'Close expanded view' : 'Expand preview'}
            type="button"
          >
            {isExpanded ? (
              <Minimize className="w-4 h-4 text-gray-700" />
            ) : (
              <Maximize className="w-4 h-4 text-gray-700" />
            )}
          </button>
        </div>

        <div className="w-full h-full flex items-center justify-center p-2 sm:p-3">
          <div
            ref={viewportRef}
            className="w-full max-w-[1000px] aspect-[800/420] sm:aspect-[800/350] rounded-lg overflow-hidden bg-pink-50 relative"
          >
            <motion.div
              key={`${selectedBracelet.openImage || selectedBracelet.image}:${totalCharms}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="relative w-full h-full"
            >
              {/* Pan wrapper — handles dragging when zoomed in, but images remain non-interactive */}
              <div
                className="absolute inset-0"
                style={{
                  transform: `translate(${clampedPan.x}px, ${clampedPan.y}px)`,
                  cursor: canPan ? (isDragging ? 'grabbing' : 'grab') : 'default',
                  touchAction: canPan ? 'none' : 'auto',
                }}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Zoom container — scales the whole scene (charms + chain) */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: '50% 50%',
                  }}
                >
              {/* Charms positioned at fixed coordinates (behind the chain) */}
              <AnimatePresence>
                {selectedCharms.map((selectedCharm, index) => {
                  const position = charmPositions[index];
                  if (!position) return null;

                  return (
                    <motion.div
                      key={selectedCharm.id}
                      initial={{ opacity: 0, scale: 0.9, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                      className="absolute z-10"
                      style={{
                        // Position: scale from 800x300 coordinate system
                        left: `${(position.x / 800) * 100}%`,
                        top: `${(position.y / 300) * 100}%`,
                        // Size: scale proportionally (150px in 800px = 18.75% width, maintain square)
                        width: '18.75%', // 150/800 = 18.75%
                        aspectRatio: '1 / 1', // Keep square
                        transform: 'translateX(-50%)',
                      }}
                    >
                      <div className="relative w-full h-full pointer-events-none">
                        <Image
                          src={getCharmImageUrl(selectedCharm.charm)}
                          alt={selectedCharm.charm.name}
                          fill
                          className="object-contain drop-shadow-lg"
                          sizes="(max-width: 1024px) 18.75vw, 150px"
                          draggable={false}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Chain on top */}
              <div
                className="absolute inset-0 z-20 pointer-events-none"
                style={{ filter: selectedBracelet.grayscale ? 'saturate(0)' : 'none' }}
              >
                <Image
                  src={selectedBracelet.openImage || selectedBracelet.image}
                  alt={selectedBracelet.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 800px"
                  unoptimized
                  draggable={false}
                  priority
                />
              </div>
              </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-white/95 backdrop-blur-sm border-t border-pink-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">{selectedBracelet.name}</p>
            <p className="text-xs text-gray-600">
              {totalCharms} {totalCharms !== 1 ? t('charms.summary.charms_plural') : t('charms.summary.charms')} {t('charms.selected')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-pink-600">
              ${selectedBracelet.price.toFixed(2)}
            </p>
            {selectedCharms.length > 0 && (
              <p className="text-xs text-gray-500">
                + ${selectedCharms.reduce((sum, sc) => sum + sc.charm.price, 0).toFixed(2)} {totalCharms !== 1 ? t('charms.summary.charms_plural') : t('charms.summary.charms')}
              </p>
            )}
          </div>
        </div>

        {/* Reorderable Charm List */}
        {selectedCharms.length > 0 && (
          <div className="mt-2 pt-3 border-t border-gray-100">
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2">
              {language === 'nl' ? 'Sleep om volgorde te wijzigen' : 'Drag to reorder charms'}
            </p>
            <Reorder.Group
              axis="x"
              values={selectedCharms}
              onReorder={reorderCharms}
              className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
            >
              {selectedCharms.map((item) => (
                <Reorder.Item
                  key={item.id}
                  value={item}
                  className="flex-shrink-0 group relative"
                >
                  <div className="w-12 h-12 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center p-1 relative cursor-grab active:cursor-grabbing">
                    <div className="absolute top-0 left-0 w-full h-full bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                    </div>
                    <Image
                      src={getCharmImageUrl(item.charm)}
                      alt={item.charm.name}
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCharm(item.id);
                      }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-30"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}
      </div>
      </div>

      {/* Expanded modal overlay */}
      {isMounted &&
        createPortal(
          <AnimatePresence>
            {isExpanded && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleToggleExpanded}
                  className={[
                    'fixed inset-0 z-[2000]',
                    // Softer, more premium-looking backdrop than harsh black:
                    // - subtle vignette + brand-tinted gradient
                    // - blur to keep page context visible
                    'bg-gradient-to-br from-black/35 via-fuchsia-950/25 to-pink-950/25',
                    'backdrop-blur-md',
                  ].join(' ')}
                />
                {/* Expanded preview */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="fixed inset-0 z-[2010] flex items-center justify-center p-8"
                >
                  <div
                    className="w-full max-w-6xl bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 border-2 border-pink-200 rounded-xl overflow-hidden shadow-2xl pointer-events-auto flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                {/* Stage */}
                <div className="relative flex-1 min-h-0 pointer-events-auto">
                  {/* Controls */}
                  <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <button
                      onClick={handleZoomIn}
                      disabled={!canZoomIn}
                      className={[
                        'p-2 bg-white rounded-lg shadow-md transition-colors',
                        canZoomIn ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed',
                      ].join(' ')}
                      aria-label="Zoom in"
                      type="button"
                    >
                      <ZoomIn className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      onClick={handleZoomOut}
                      disabled={!canZoomOut}
                      className={[
                        'p-2 bg-white rounded-lg shadow-md transition-colors',
                        canZoomOut ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed',
                      ].join(' ')}
                      aria-label="Zoom out"
                      type="button"
                    >
                      <ZoomOut className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      onClick={handleResetZoom}
                      disabled={zoom <= 1.0001 && pan.x === 0 && pan.y === 0}
                      className={[
                        'p-2 bg-white rounded-lg shadow-md transition-colors',
                        zoom > 1.0001 || pan.x !== 0 || pan.y !== 0 ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed',
                      ].join(' ')}
                      aria-label="Reset zoom"
                      type="button"
                    >
                      <RotateCw className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      onClick={handleToggleExpanded}
                      className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
                      aria-label="Close expanded view"
                      type="button"
                    >
                      <Minimize className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>

                  <div className="w-full h-full flex items-center justify-center p-3">
                    <div
                      ref={expandedViewportRef}
                      className="w-full aspect-[800/350] rounded-lg overflow-hidden bg-pink-50 relative"
                    >
                      <motion.div
                        key={`${selectedBracelet.openImage || selectedBracelet.image}:${totalCharms}`}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.25 }}
                        className="relative w-full h-full"
                      >
                        {/* Pan wrapper — handles dragging when zoomed in, but images remain non-interactive */}
                        <div
                          className="absolute inset-0"
                          style={{
                            transform: `translate(${clampedPan.x}px, ${clampedPan.y}px)`,
                            cursor: canPan ? (isDragging ? 'grabbing' : 'grab') : 'default',
                            touchAction: canPan ? 'none' : 'auto',
                          }}
                          onMouseDown={handleMouseDown}
                          onMouseUp={handleMouseUp}
                          onMouseLeave={handleMouseLeave}
                          onTouchStart={handleTouchStart}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                        >
                          {/* Zoom container — scales the whole scene (charms + chain) */}
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              transform: `scale(${zoom})`,
                              transformOrigin: '50% 50%',
                            }}
                          >
                            {/* Charms positioned at fixed coordinates (behind the chain) */}
                            <AnimatePresence>
                              {selectedCharms.map((selectedCharm, index) => {
                                const position = charmPositions[index];
                                if (!position) return null;

                                return (
                                  <motion.div
                                    key={selectedCharm.id}
                                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                                    className="absolute z-10"
                                    style={{
                                      // Position: scale from 800x300 coordinate system
                                      left: `${(position.x / 800) * 100}%`,
                                      top: `${(position.y / 300) * 100}%`,
                                      // Size: scale proportionally (150px in 800px = 18.75% width, maintain square)
                                      width: '18.75%', // 150/800 = 18.75%
                                      aspectRatio: '1 / 1', // Keep square
                                      transform: 'translateX(-50%)',
                                    }}
                                  >
                                    <div className="relative w-full h-full pointer-events-none">
                                      <Image
                                        src={getCharmImageUrl(selectedCharm.charm)}
                                        alt={selectedCharm.charm.name}
                                        fill
                                        className="object-contain drop-shadow-lg"
                                        sizes="(max-width: 1024px) 18.75vw, 150px"
                                        draggable={false}
                                      />
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </AnimatePresence>

                            {/* Chain on top */}
                            <div
                              className="absolute inset-0 z-20 pointer-events-none"
                              style={{ filter: selectedBracelet.grayscale ? 'saturate(0)' : 'none' }}
                            >
                              <Image
                                src={selectedBracelet.openImage || selectedBracelet.image}
                                alt={selectedBracelet.name}
                                fill
                                className="object-contain"
                                sizes="(max-width: 1024px) 100vw, 800px"
                                unoptimized
                                draggable={false}
                                priority
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Info Panel */}
                <div className="bg-white/95 backdrop-blur-sm border-t border-pink-200 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{selectedBracelet.name}</p>
                      <p className="text-xs text-gray-600">
                        {totalCharms} {totalCharms !== 1 ? t('charms.summary.charms_plural') : t('charms.summary.charms')} {t('charms.selected')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-pink-600">
                        ${selectedBracelet.price.toFixed(2)}
                      </p>
                      {selectedCharms.length > 0 && (
                        <p className="text-xs text-gray-500">
                          + ${selectedCharms.reduce((sum, sc) => sum + sc.charm.price, 0).toFixed(2)} {totalCharms !== 1 ? t('charms.summary.charms_plural') : t('charms.summary.charms')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Reorderable Charm List */}
                  {selectedCharms.length > 0 && (
                    <div className="mt-2 pt-3 border-t border-gray-100">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2">
                        {language === 'nl' ? 'Sleep om volgorde te wijzigen' : 'Drag to reorder charms'}
                      </p>
                      <Reorder.Group
                        axis="x"
                        values={selectedCharms}
                        onReorder={reorderCharms}
                        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
                      >
                        {selectedCharms.map((item) => (
                          <Reorder.Item
                            key={item.id}
                            value={item}
                            className="flex-shrink-0 group relative"
                          >
                            <div className="w-12 h-12 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center p-1 relative cursor-grab active:cursor-grabbing">
                              <div className="absolute top-0 left-0 w-full h-full bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                <GripVertical className="w-4 h-4 text-gray-400" />
                              </div>
                              <Image
                                src={getCharmImageUrl(item.charm)}
                                alt={item.charm.name}
                                width={32}
                                height={32}
                                className="object-contain"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeCharm(item.id);
                                }}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-30"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </Reorder.Item>
                        ))}
                      </Reorder.Group>
                    </div>
                  )}
                </div>
              </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}


'use client';

import Image from 'next/image';
import { useStore, SelectedCharm } from '@/store/useStore';
import { getCharmImageUrl } from '@/lib/db';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Minimize, RotateCw, ZoomIn, ZoomOut, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DEFAULT_SNAP_POINTS, getBraceletSnapPoints } from '@/lib/braceletSnapPoints';

export default function PreviewCanvas() {
  const selectedBracelet = useStore((state) => state.selectedBracelet);
  const selectedCharms = useStore((state) => state.selectedCharms);
  const removeCharm = useStore((state) => state.removeCharm);
  const reorderCharms = useStore((state) => state.reorderCharms);
  const updateCharmPositions = useStore((state) => state.updateCharmPositions);
  const persistedCharmPositions = useStore((state) => state.charmPositions);
  const { t, language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [pinchStart, setPinchStart] = useState<{ distance: number; zoom: number } | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const expandedViewportRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ w: 800, h: 350 });
  const [charmPointIndexById, setCharmPointIndexById] = useState<Record<string, number>>({});
  const charmPointIndexByIdRef = useRef<Record<string, number>>({});
  const [draggingCharmId, setDraggingCharmId] = useState<string | null>(null);
  const [hoverPointIndex, setHoverPointIndex] = useState<number | null>(null);
  const dragOffsetRef = useRef<{ dx: number; dy: number } | null>(null); // in 800x350 design space
  const prevCharmCountRef = useRef<number>(0);
  // Once the user manually moves a charm (or we hydrate a saved design), we stop auto-reflowing
  // all charms on every add/remove. New charms will be placed into the next available empty slot.
  const layoutLockedRef = useRef<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const braceletId = selectedBracelet?.id ?? null;
  const snapPoints = useMemo(
    () => getBraceletSnapPoints(braceletId) ?? DEFAULT_SNAP_POINTS,
    [braceletId]
  );
  const snapPointCount = snapPoints.length;

  const handleToggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  // Prevent background scrolling while expanded
  useEffect(() => {
    if (!isExpanded) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isExpanded]);

  const totalCharms = selectedCharms.length;

  const getEvenlySpacedPointIndices = useCallback((count: number) => {
    if (count <= 0) return [] as number[];
    if (count === 1) return [Math.floor((snapPointCount - 1) / 2)];
    return Array.from({ length: count }, (_, i) =>
      Math.round((i * (snapPointCount - 1)) / (count - 1))
    );
  }, [snapPointCount]);

  useEffect(() => {
    charmPointIndexByIdRef.current = charmPointIndexById;
  }, [charmPointIndexById]);

  // Keep a stable mapping of charm instance -> point index (assign new charms to nearest available evenly-spaced slot)
  useEffect(() => {
    const nextCount = selectedCharms.length;
    if (nextCount === 0) {
      if (Object.keys(charmPointIndexById).length > 0) setCharmPointIndexById({});
      prevCharmCountRef.current = 0;
      layoutLockedRef.current = false;
      return;
    }

    // If we have persisted positions (e.g. coming from "Edit Design"), hydrate the local mapping from them.
    // This ensures the preview snaps exactly where the user left it.
    const desired = getEvenlySpacedPointIndices(nextCount);
    const occupied = new Set<number>();
    const fromPersisted: Record<string, number> = {};
    for (const sc of selectedCharms) {
      const idx = persistedCharmPositions?.[sc.id];
      if (typeof idx === 'number') {
        const clamped = Math.max(0, Math.min(snapPoints.length - 1, idx));
        fromPersisted[sc.id] = clamped;
        occupied.add(clamped);
      }
    }
    const hasAnyPersisted = Object.keys(fromPersisted).length > 0;
    if (hasAnyPersisted && Object.keys(charmPointIndexById).length === 0) {
      // Fill any missing with nearest available evenly-spaced slot
      for (const sc of selectedCharms) {
        if (fromPersisted[sc.id] === undefined) {
          let best = desired[0] ?? 0;
          for (const d of desired) {
            if (!occupied.has(d)) {
              best = d;
              break;
            }
          }
          fromPersisted[sc.id] = best;
          occupied.add(best);
        }
      }
      setCharmPointIndexById(fromPersisted);
      // Treat hydrated designs as "manual" so adding charms doesn't destroy the saved layout.
      layoutLockedRef.current = true;
      // Keep order aligned left->right
      const nextStoreOrder = [...selectedCharms].sort(
        (a, b) => (fromPersisted[a.id] ?? 0) - (fromPersisted[b.id] ?? 0)
      );
      const orderChanged = nextStoreOrder.some((sc, i) => sc.id !== selectedCharms[i].id);
      if (orderChanged) reorderCharms(nextStoreOrder);
      prevCharmCountRef.current = nextCount;
      return;
    }

    const countChanged = prevCharmCountRef.current !== nextCount;
    prevCharmCountRef.current = nextCount;

    if (countChanged) {
      const prevMapping = charmPointIndexByIdRef.current;

      // If the user has manually adjusted the layout, DO NOT reflow existing charms.
      // Only assign positions for new charms into empty slots.
      if (layoutLockedRef.current && Object.keys(prevMapping).length > 0) {
        const currentIds = new Set(selectedCharms.map((sc) => sc.id));
        const nextMapping: Record<string, number> = {};

        // Keep existing positions (and drop removed)
        for (const [id, idx] of Object.entries(prevMapping)) {
          if (currentIds.has(id) && typeof idx === 'number') {
            nextMapping[id] = idx;
          }
        }

        const occupied = new Set<number>(Object.values(nextMapping));
        const desired = getEvenlySpacedPointIndices(nextCount);

        // Place any new charms into an available slot (prefer an evenly-spaced desired index if free)
        for (const sc of selectedCharms) {
          if (nextMapping[sc.id] !== undefined) continue;

          let best: number | null = null;
          for (const d of desired) {
            if (!occupied.has(d)) {
              best = d;
              break;
            }
          }
          if (best == null) {
            for (let i = 0; i < snapPointCount; i++) {
              if (!occupied.has(i)) {
                best = i;
                break;
              }
            }
          }
          nextMapping[sc.id] = best ?? 0;
          occupied.add(nextMapping[sc.id]);
        }

        setCharmPointIndexById(nextMapping);

        // Keep the reorder strip/store order aligned with left→right point positions
        const nextStoreOrder = [...selectedCharms].sort(
          (a, b) => (nextMapping[a.id] ?? 0) - (nextMapping[b.id] ?? 0)
        );
        const orderChanged = nextStoreOrder.some((sc, i) => sc.id !== selectedCharms[i].id);
        if (orderChanged) {
          reorderCharms(nextStoreOrder);
        }
        return;
      }

      // Preserve prior left-to-right order (by previous point index) when reflowing
      const ordered = [...selectedCharms].sort((a, b) => {
        const ai = prevMapping[a.id];
        const bi = prevMapping[b.id];
        const aHas = typeof ai === 'number';
        const bHas = typeof bi === 'number';
        if (aHas && bHas) return ai - bi;
        if (aHas && !bHas) return -1;
        if (!aHas && bHas) return 1;
        return 0;
      });

      const nextMapping: Record<string, number> = {};
      for (let i = 0; i < ordered.length; i++) {
        nextMapping[ordered[i].id] = desired[i] ?? desired[desired.length - 1] ?? 0;
      }

      setCharmPointIndexById(nextMapping);

      // Keep the reorder strip/store order aligned with left→right point positions
      const nextStoreOrder = [...selectedCharms].sort(
        (a, b) => (nextMapping[a.id] ?? 0) - (nextMapping[b.id] ?? 0)
      );
      const orderChanged = nextStoreOrder.some((sc, i) => sc.id !== selectedCharms[i].id);
      if (orderChanged) {
        reorderCharms(nextStoreOrder);
      }
    } else {
      // If count is same, just ensure all IDs are in the mapping (defensive)
      const prevMapping = charmPointIndexByIdRef.current;
      const currentIds = new Set(selectedCharms.map(sc => sc.id));
      let mappingChanged = false;
      const nextMapping: Record<string, number> = {};

      // Cleanup
      for (const [id, idx] of Object.entries(prevMapping)) {
        if (currentIds.has(id)) {
          nextMapping[id] = idx;
        } else {
          mappingChanged = true;
        }
      }

      // Add missing
      if (Object.keys(nextMapping).length < nextCount) {
        const occupied = new Set(Object.values(nextMapping));
        const desired = getEvenlySpacedPointIndices(nextCount);
        for (const sc of selectedCharms) {
          if (nextMapping[sc.id] === undefined) {
            let best = 0;
            for (const d of desired) {
              if (!occupied.has(d)) {
                best = d;
                break;
              }
            }
            nextMapping[sc.id] = best;
            occupied.add(best);
            mappingChanged = true;
          }
        }
      }

      if (mappingChanged) {
        setCharmPointIndexById(nextMapping);
      }
    }
  }, [selectedCharms, charmPointIndexById, getEvenlySpacedPointIndices, persistedCharmPositions, reorderCharms, snapPoints.length]);

  // Zoom parameters
  const MAX_ZOOM = 3.0;
  const MIN_ZOOM = 1.0;
  const ZOOM_STEP = 0.15;
  const canZoomIn = zoom < MAX_ZOOM - 0.0001;
  const canZoomOut = zoom > MIN_ZOOM + 0.0001;
  const canPan = zoom > 1.0001;
  const canDragCharmsInPreview = zoom <= 1.0001;

  // If user zooms in, disable charm dragging entirely (so pan/zoom gestures work as expected)
  useEffect(() => {
    if (!canDragCharmsInPreview && draggingCharmId) {
      setDraggingCharmId(null);
      setHoverPointIndex(null);
      dragOffsetRef.current = null;
    }
  }, [canDragCharmsInPreview, draggingCharmId]);

  // Sync charm positions to global store
  useEffect(() => {
    updateCharmPositions(charmPointIndexById);
  }, [charmPointIndexById, updateCharmPositions]);

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

  const getActiveViewportEl = useCallback(() => {
    return (isExpanded ? expandedViewportRef.current : viewportRef.current) ?? null;
  }, [isExpanded]);

  const getBaseCoordsFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const el = getActiveViewportEl();
      if (!el) return null;
      const rect = el.getBoundingClientRect();

      // Pointer position in viewport pixel space
      const px = clientX - rect.left;
      const py = clientY - rect.top;

      // Undo pan (pan is applied in screen pixel space)
      const scaledX = px - clampedPan.x;
      const scaledY = py - clampedPan.y;

      // Undo zoom (zoom is applied around viewport center)
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const origX = cx + (scaledX - cx) / zoom;
      const origY = cy + (scaledY - cy) / zoom;

      // Convert to 800x350 design space
      const baseX = (origX / rect.width) * 800;
      const baseY = (origY / rect.height) * 350;
      return { baseX, baseY };
    },
    [clampedPan.x, clampedPan.y, getActiveViewportEl, zoom]
  );

  const getNearestPointIndexFromBase = useCallback((baseX: number, baseY: number) => {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < snapPoints.length; i++) {
      const p = snapPoints[i];
      const dx = p.x - baseX;
      const dy = p.y - baseY;
      const d = dx * dx + dy * dy;
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    return bestIdx;
  }, [snapPoints]);

  const getNearestPointIndexFromEvent = useCallback(
    (clientX: number, clientY: number, offset?: { dx: number; dy: number } | null) => {
      const coords = getBaseCoordsFromEvent(clientX, clientY);
      if (!coords) return null;
      const baseX = coords.baseX - (offset?.dx ?? 0);
      const baseY = coords.baseY - (offset?.dy ?? 0);
      return getNearestPointIndexFromBase(baseX, baseY);
    },
    [getBaseCoordsFromEvent, getNearestPointIndexFromBase]
  );

  const commitDragToPoint = useCallback(
    (dragId: string, target: number | null) => {
      if (typeof target !== 'number') return;

      const prev = charmPointIndexByIdRef.current;
      const from = prev[dragId];
      if (from == null) return;
      if (from === target) return;

      // User manually moved a charm — lock layout so future adds don't auto-reflow everything.
      layoutLockedRef.current = true;

      let swapId: string | null = null;
      for (const [id, idx] of Object.entries(prev)) {
        if (id !== dragId && idx === target) {
          swapId = id;
          break;
        }
      }

      const nextMapping: Record<string, number> = { ...prev, [dragId]: target };
      if (swapId) nextMapping[swapId] = from;

      setCharmPointIndexById(nextMapping);

      // Update store order so the reorder strip stays consistent with left->right positions
      const nextOrder = [...selectedCharms].sort(
        (a, b) => (nextMapping[a.id] ?? 0) - (nextMapping[b.id] ?? 0)
      );
      reorderCharms(nextOrder);
    },
    [reorderCharms, selectedCharms]
  );

  const getCharmPointIndex = useCallback(
    (selectedCharm: SelectedCharm, fallbackIndex: number) => {
      return charmPointIndexByIdRef.current[selectedCharm.id] ?? fallbackIndex;
    },
    []
  );

  const pickNearestCharmId = useCallback(
    (baseX: number, baseY: number) => {
      if (selectedCharms.length === 0) return null;

      // Only pick a charm if the click is reasonably close to one (avoid accidental drags on empty space)
      const CLICK_RADIUS = 95; // in 800x350 design space; roughly a bit bigger than half charm width
      const CLICK_RADIUS2 = CLICK_RADIUS * CLICK_RADIUS;

      const defaultEven = getEvenlySpacedPointIndices(totalCharms);
      let bestId: string | null = null;
      let bestDist = Infinity;

      for (let i = 0; i < selectedCharms.length; i++) {
        const sc = selectedCharms[i];
        const fallbackPointIndex = defaultEven[i] ?? defaultEven[defaultEven.length - 1] ?? 0;
        const pointIndex = getCharmPointIndex(sc, fallbackPointIndex);
        const p = snapPoints[pointIndex] ?? snapPoints[fallbackPointIndex] ?? snapPoints[0];
        const dx = p.x - baseX;
        const dy = p.y - baseY;
        const d = dx * dx + dy * dy;
        if (d < bestDist) {
          bestDist = d;
          bestId = sc.id;
        }
      }

      if (bestId && bestDist <= CLICK_RADIUS2) return bestId;
      return null;
    },
    [getCharmPointIndex, getEvenlySpacedPointIndices, selectedCharms, totalCharms]
  );

  const selectedCharmsDisplay = useMemo(() => {
    // Show charms in left-to-right order (by point index)
    const mapping = charmPointIndexByIdRef.current;
    return [...selectedCharms].sort((a, b) => (mapping[a.id] ?? 0) - (mapping[b.id] ?? 0));
  }, [selectedCharms]);

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

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom((z) => {
      const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta));
      setPan((prev) => clampPan(prev, next));
      return next;
    });
  };

  const getTouchDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      setPinchStart({ distance, zoom });
    } else if (e.touches.length === 1 && canPan) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - clampedPan.x,
        y: e.touches[0].clientY - clampedPan.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStart) {
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / pinchStart.distance;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchStart.zoom * scale));
      setZoom(newZoom);
      setPan((prev) => clampPan(prev, newZoom));
    } else if (e.touches.length === 1 && isDragging && canPan) {
      const raw = {
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      };
      setPan(clampPan(raw, zoom));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setIsDragging(false);
      setPinchStart(null);
    } else if (e.touches.length === 1 && pinchStart) {
      setPinchStart(null);
    }
  };

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

  const renderPreviewContent = (viewportRef: React.RefObject<HTMLDivElement | null>) => (
    <div
      ref={viewportRef}
      className="w-full max-w-[1000px] aspect-[800/350] rounded-lg overflow-hidden bg-gray-50 relative"
    >
      <motion.div
        id="preview-canvas-container"
        key={selectedBracelet.id}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="relative w-full h-full"
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${clampedPan.x}px, ${clampedPan.y}px)`,
            cursor: canPan ? (isDragging ? 'grabbing' : 'grab') : 'default',
            // Prevent browser panning/zooming in the preview area (fixes passive listener preventDefault warnings on mobile)
            touchAction: 'none',
            overscrollBehavior: 'contain',
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onPointerDown={(e) => {
            if (!canDragCharmsInPreview) return;
            if (selectedCharms.length === 0) return;

            const coords = getBaseCoordsFromEvent(e.clientX, e.clientY);
            if (!coords) return;

            const pickedId = pickNearestCharmId(coords.baseX, coords.baseY);
            if (!pickedId) return;

            e.stopPropagation();
            (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);

            // Compute grab offset from the picked charm's current center to the pointer
            const fallbackEven = getEvenlySpacedPointIndices(totalCharms);
            const pickedIndex = selectedCharms.findIndex((sc) => sc.id === pickedId);
            const pickedFallbackPointIndex =
              pickedIndex >= 0 ? (fallbackEven[pickedIndex] ?? fallbackEven[fallbackEven.length - 1] ?? 0) : 0;
            const pickedPointIndex =
              charmPointIndexByIdRef.current[pickedId] ?? pickedFallbackPointIndex;
            const pickedPoint =
              snapPoints[pickedPointIndex] ?? snapPoints[pickedFallbackPointIndex] ?? snapPoints[0];

            dragOffsetRef.current = {
              dx: coords.baseX - pickedPoint.x,
              dy: coords.baseY - pickedPoint.y,
            };

            setDraggingCharmId(pickedId);
            const idx = getNearestPointIndexFromEvent(e.clientX, e.clientY, dragOffsetRef.current);
            setHoverPointIndex(idx);
          }}
          onPointerMove={(e) => {
            if (!canDragCharmsInPreview) return;
            if (!draggingCharmId) return;
            const idx = getNearestPointIndexFromEvent(e.clientX, e.clientY, dragOffsetRef.current);
            setHoverPointIndex(idx);
          }}
          onPointerUp={(e) => {
            if (!canDragCharmsInPreview) return;
            if (!draggingCharmId) return;
            const target = getNearestPointIndexFromEvent(e.clientX, e.clientY, dragOffsetRef.current);
            commitDragToPoint(draggingCharmId, target);
            setDraggingCharmId(null);
            setHoverPointIndex(null);
            dragOffsetRef.current = null;
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: '50% 50%',
            }}
          >
            <AnimatePresence>
              {selectedCharms.map((selectedCharm, index) => {
                const defaultEven = getEvenlySpacedPointIndices(totalCharms);
                const fallbackPointIndex = defaultEven[index] ?? defaultEven[defaultEven.length - 1] ?? 0;
                const pointIndex =
                  draggingCharmId === selectedCharm.id && hoverPointIndex != null
                    ? hoverPointIndex
                    : charmPointIndexById[selectedCharm.id] ?? fallbackPointIndex;
                const position = snapPoints[pointIndex];
                if (!position) return null;

                return (
                  <motion.div
                    key={selectedCharm.id}
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      left: `${(position.x / 800) * 100}%`,
                      top: `${(position.y / 350) * 100}%`,
                    }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{
                      opacity: { type: 'spring', stiffness: 220, damping: 18 },
                      scale: { type: 'spring', stiffness: 220, damping: 18 },
                      y: { type: 'spring', stiffness: 220, damping: 18 },
                      left: { type: 'spring', stiffness: 300, damping: 30 },
                      top: { type: 'spring', stiffness: 300, damping: 30 },
                    }}
                    className="absolute z-10 pointer-events-none"
                    style={{
                      width: '18.75%',
                      aspectRatio: '1 / 1',
                      // Use CSS `translate` (not `transform`) so it composes with Framer Motion's transform
                      // and keeps the charm centered on the anchor point (fixes mouse/charm offset).
                      translate: '-50% -50%',
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

            {selectedBracelet && (selectedBracelet.openImage || selectedBracelet.image) ? (
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
                  placeholder="empty"
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <div className="text-gray-400 text-center">
                  <div className="text-4xl mb-2">⛓️</div>
                  <div className="text-sm">Select a bracelet to start</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderInfoPanel = () => (
    <div className="bg-white/95 backdrop-blur-sm border-t border-yellow-500 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">{selectedBracelet?.name || 'No bracelet selected'}</p>
          <p className="text-xs text-gray-600">
            {totalCharms} {totalCharms !== 1 ? t('charms.summary.charms_plural') : t('charms.summary.charms')} {t('charms.selected')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold bg-[linear-gradient(135deg,#4a3c00_0%,#8b6914_25%,#b8860b_50%,#8b6914_75%,#4a3c00_100%)] bg-clip-text text-transparent">
            €{selectedBracelet?.price.toFixed(2) || '0.00'}
          </p>
          {selectedCharms.length > 0 && (
            <p className="text-xs text-gray-500">
              + €{selectedCharms.reduce((sum, sc) => sum + sc.charm.price, 0).toFixed(2)} {totalCharms !== 1 ? t('charms.summary.charms_plural') : t('charms.summary.charms')}
            </p>
          )}
        </div>
      </div>

      {selectedCharms.length > 0 && (
        <div className="mt-2 pt-3 border-t border-gray-100">
          <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-3">
            {language === 'nl' ? 'Geselecteerde charms' : 'Selected charms'}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {selectedCharmsDisplay.map((item) => (
              <div key={item.id} className="group relative">
                <div className="w-16 bg-gray-50 rounded-lg border border-gray-200 flex flex-col items-center p-1.5 relative hover:bg-white hover:shadow-sm transition-all">
                  <div className="w-10 h-10 relative mb-1">
                    <Image
                      src={getCharmImageUrl(item.charm)}
                      alt={item.charm.name}
                      fill
                      className="object-contain"
                      sizes="40px"
                    />
                  </div>
                  <div className="text-center w-full px-0.5">
                    <p className="text-[9px] font-bold text-gray-600 mb-0.5 leading-tight">
                      Charm
                    </p>
                    <p className="text-[12px] font-bold bg-[linear-gradient(135deg,#4a3c00_0%,#8b6914_25%,#b8860b_50%,#8b6914_75%,#4a3c00_100%)] bg-clip-text text-transparent leading-none">
                      €{item.charm.price.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCharm(item.id);
                    }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-md z-30 hover:bg-red-600"
                    aria-label={`Remove ${item.charm.name}`}
                    type="button"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="w-full rounded-xl flex flex-col bg-gray-50 border-2 border-yellow-500 overflow-hidden">
        <div className="relative min-h-0">
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 flex gap-1 sm:gap-2">
            <button
              onClick={handleZoomIn}
              disabled={!canZoomIn}
              className={`p-1.5 sm:p-2 bg-white rounded-lg shadow-md transition-colors ${canZoomIn ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
              type="button"
            >
              <ZoomIn className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={handleZoomOut}
              disabled={!canZoomOut}
              className={`p-1.5 sm:p-2 bg-white rounded-lg shadow-md transition-colors ${canZoomOut ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
              type="button"
            >
              <ZoomOut className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={handleResetZoom}
              disabled={zoom <= 1.0001 && pan.x === 0 && pan.y === 0}
              className={`p-1.5 sm:p-2 bg-white rounded-lg shadow-md transition-colors ${zoom > 1.0001 || pan.x !== 0 || pan.y !== 0 ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
              type="button"
            >
              <RotateCw className="w-4 h-4 text-gray-700" />
            </button>
          </div>
          <div className="w-full flex items-center justify-center p-2 sm:p-3">
            {renderPreviewContent(viewportRef)}
          </div>
        </div>
        {renderInfoPanel()}
      </div>

      {isMounted && createPortal(
        <AnimatePresence>
          {isExpanded && (
            <div className="fixed inset-0 z-[2000]">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleToggleExpanded}
                className="absolute inset-0 bg-transparent"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="absolute inset-0 z-[2010] flex items-center justify-center p-4 sm:p-8 pointer-events-none"
              >
                <div
                  className="w-full max-w-6xl bg-gray-50 border-2 border-yellow-500 rounded-xl overflow-hidden shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative flex-1 min-h-0">
                    <div className="absolute top-4 right-4 z-20 flex gap-2">
                      <button
                        onClick={handleZoomIn}
                        disabled={!canZoomIn}
                        className={`p-2 bg-white rounded-lg shadow-md transition-colors ${canZoomIn ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
                        type="button"
                      >
                        <ZoomIn className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={handleZoomOut}
                        disabled={!canZoomOut}
                        className={`p-2 bg-white rounded-lg shadow-md transition-colors ${canZoomOut ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
                        type="button"
                      >
                        <ZoomOut className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={handleResetZoom}
                        disabled={zoom <= 1.0001 && pan.x === 0 && pan.y === 0}
                        className={`p-2 bg-white rounded-lg shadow-md transition-colors ${zoom > 1.0001 || pan.x !== 0 || pan.y !== 0 ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
                        type="button"
                      >
                        <RotateCw className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={handleToggleExpanded}
                        className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
                        type="button"
                      >
                        <Minimize className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>
                    <div className="w-full h-full flex items-center justify-center p-3">
                      {renderPreviewContent(expandedViewportRef)}
                    </div>
                  </div>
                  {renderInfoPanel()}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

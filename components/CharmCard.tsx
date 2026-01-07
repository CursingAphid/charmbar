'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Charm } from '@/lib/db';
import Card from './ui/Card';
import Button from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Image as ImageIcon, Plus } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from './ToastProvider';
import { getCharmImageUrl, getCharmBackgroundUrl, getCharmGlbUrl, cleanupCharmGlbUrl } from '@/lib/db';
import AutoCenteredImage from './AutoCenteredImage';

// Load the 3D renderer only when needed (keeps initial page load snappy)
const Charm3DIcon = dynamic(() => import('./Charm3DIcon'), {
  ssr: false,
});

interface CharmCardProps {
  charm: Charm;
}

export default function CharmCard({ charm }: CharmCardProps) {
  const selectedCharms = useStore((state) => state.selectedCharms);
  const addCharm = useStore((state) => state.addCharm);
  const reorderCharms = useStore((state) => state.reorderCharms);
  const [isHovered, setIsHovered] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMounted] = useState(true); // Components are mounted when they render
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [showBackground, setShowBackground] = useState(true); // Per-card background toggle
  const [isVisible, setIsVisible] = useState(true); // Track if card is visible on screen
  const [glbLoadError, setGlbLoadError] = useState(false); // Track if 3D model failed to load
  const [shouldLoad3D, setShouldLoad3D] = useState(false); // Lazy-load 3D only after user intent
  const [is3DLoaded, setIs3DLoaded] = useState(false); // Track if 3D model has finished loading
  const isPointerInsideRef = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const glbUrl = useMemo(() => getCharmGlbUrl(charm), [charm.id]);

  useEffect(() => {
    // Cleanup blob URLs and timeouts on unmount to prevent memory leaks
    return () => {
      cleanupCharmGlbUrl(charm.id);
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
  }, [charm.id]);

  // Load background URL asynchronously
  useEffect(() => {
    const loadBackground = async () => {
      try {
        const url = await getCharmBackgroundUrl(charm);
        setBackgroundUrl(url);
      } catch (error) {
        console.error('Error loading background for charm:', charm.id, error);
        setBackgroundUrl(null);
      }
    };

    loadBackground();
  }, [charm.id, charm.background_id]);

  // Intersection observer to reset 3D models on mobile when off-screen
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    // Only apply on mobile devices
    const isMobile = window.innerWidth < 768;

    if (!isMobile) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isIntersecting = entry.isIntersecting;

          setIsVisible(isIntersecting);

          // Reset hover state when card goes off-screen on mobile
          if (!isIntersecting && isHovered && !isInteracting && !isFullscreen) {
            setIsHovered(false);
            isPointerInsideRef.current = false;
          }

          // On mobile, unload 3D when offscreen to save resources (reset back to 2D)
          if (!isIntersecting) {
            setShouldLoad3D(false);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the card is visible
        rootMargin: '50px', // Add some margin for smoother transitions
      }
    );

    observer.observe(card);

    return () => {
      observer.disconnect();
    };
  }, [isHovered, isInteracting, isFullscreen]);

  const selectedInstances = selectedCharms.filter((sc) => sc.charm.id === charm.id);
  const quantity = selectedInstances.length;
  const isSelected = quantity > 0;
  const { showToast } = useToast();
  const { t, language } = useLanguage();

  const handleCardClick = () => {
    if (selectedCharms.length >= 7) {
      showToast(t('charms.limitReached'), 'error');
      return;
    }

    addCharm(charm);

    showToast(`${charm.name} added!`, 'success');
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    // Remove only one instance of this charm (the first one found)
    const charmToRemove = selectedCharms.find((sc) => sc.charm.id === charm.id);
    if (charmToRemove) {
      const newCharms = selectedCharms.filter((sc) => sc.id !== charmToRemove.id);
      reorderCharms(newCharms);
      showToast(`${charm.name} removed`, 'success');
    }
  };

  const handleInteractionChange = (interacting: boolean) => {
    setIsInteracting(interacting);
    // IMPORTANT: avoid state churn while dragging. When drag ends, sync hover once based on pointer location.
    if (!interacting && !isFullscreen) {
      setIsHovered(isPointerInsideRef.current);
    }
  };

  const handleGlbError = () => {
    console.warn('3D model failed to load for charm:', charm.id, '- falling back to 2D image');
    setGlbLoadError(true);
    setIs3DLoaded(false);
    setShouldLoad3D(false); // Reset to prevent continuous loading attempts
    // Clear the timeout
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  };

  const handle3DLoaded = () => {
    setIs3DLoaded(true);
    // Clear the timeout since loading succeeded
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  };

  // Auto-centered images now compute their own object-position from non-transparent pixels.

  const handleCardClickForFullscreen = () => {
    setIsFullscreen(true);
    setIsHovered(false);
    setIsInteracting(false);
    // Reset GLB error state when opening fullscreen, allowing retry
    if (glbLoadError) {
      setGlbLoadError(false);
      setIs3DLoaded(false);
    }
    // Load 3D when opening fullscreen
    if (!shouldLoad3D) {
      setShouldLoad3D(true);
      setIs3DLoaded(false); // Reset loaded state when starting to load
      // Set a timeout to prevent infinite loading
      loadTimeoutRef.current = setTimeout(() => {
        console.warn('3D model load timeout for charm:', charm.id, '- falling back to 2D image');
        setGlbLoadError(true);
        setIs3DLoaded(false);
        setShouldLoad3D(false);
      }, 30000); // 30 second timeout
    }
  };

  return (
    <>
      <Card
        ref={cardRef}
        onClick={handleCardClickForFullscreen}
        onMouseEnter={() => {
          if (!isFullscreen) {
            isPointerInsideRef.current = true;
            // While dragging, don't update hover state (prevents re-renders that can stutter the canvas)
            if (!isInteracting) setIsHovered(true);
          }
        }}
        onMouseLeave={() => {
          if (!isFullscreen) {
            isPointerInsideRef.current = false;
            // While dragging, don't update hover state (prevents re-renders that can stutter the canvas)
            if (!isInteracting) setIsHovered(false);
            // Clear load timeout if user leaves before model loads
            if (loadTimeoutRef.current && !is3DLoaded) {
              clearTimeout(loadTimeoutRef.current);
              loadTimeoutRef.current = null;
              // Reset loading state
              setShouldLoad3D(false);
              setIs3DLoaded(false);
            }
          }
        }}
        hover
        className={`relative overflow-hidden transition-all duration-300 cursor-pointer ${
          isSelected
            ? 'ring-2 ring-black ring-offset-2 bg-gray-50/50'
            : ''
        }`}
      >
        {/* Left side action buttons */}
        <div className="absolute top-2 left-2 z-10 flex gap-1">
          {/* Fullscreen button */}
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white/90 hover:bg-white text-gray-700 rounded-full p-1.5 shadow-lg transition-colors"
            aria-label="View charm in fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </motion.button>

          {/* Background toggle */}
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowBackground(!showBackground);
            }}
            className={`rounded-full p-1.5 shadow-lg transition-colors ${
              showBackground
                ? 'bg-[linear-gradient(135deg,#4a3c00_0%,#8b6914_25%,#b8860b_50%,#8b6914_75%,#4a3c00_100%)] text-white'
                : 'bg-white/90 hover:bg-white text-gray-600'
            }`}
            aria-label={showBackground ? 'Hide background' : 'Show background'}
            title={showBackground ? 'Hide background' : 'Show background'}
          >
            <ImageIcon className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Right side action buttons */}
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          {/* Add button - only shown when not selected */}
          {!isSelected && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              className="bg-[linear-gradient(135deg,#7a5a00_0%,#d4af37_25%,#ffef9a_50%,#d4af37_75%,#7a5a00_100%)] text-gray-900 ring-1 ring-black/10 rounded-full w-10 h-10 flex items-center justify-center shrink-0 shadow-lg transition-colors font-medium"
              aria-label="Add charm"
            >
              <Plus className="w-5 h-5" />
            </motion.button>
          )}

          {/* Remove button - only shown when selected */}
          {isSelected && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(e);
              }}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center shrink-0 shadow-lg transition-colors"
              aria-label="Remove charm"
            >
              <X className="w-5 h-5" />
            </motion.button>
          )}
        </div>

        {/* Quantity badge - shown when quantity > 1 */}
        {isSelected && quantity > 1 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 left-2 z-20 bg-pink-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-lg"
          >
            {quantity}
          </motion.div>
        )}

        <div
          className="relative h-40 sm:h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-3 sm:p-4"
          style={backgroundUrl && showBackground ? {
            backgroundImage: `url(${backgroundUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          } : undefined}
        >
          {/* Always show 2D image in card view */}
          <AutoCenteredImage
            src={getCharmImageUrl(charm)}
            alt={charm.name}
            fill
            className="object-contain"
            style={{
              filter: 'drop-shadow(0 16px 32px rgba(0, 0, 0, 0.6))',
            }}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            loading="lazy"
            fallbackTransform="translate(0px, 0px)"
          />
        </div>

        <div className="p-3 sm:p-4">
          <div className="mb-2">
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-0.5 sm:mb-1 line-clamp-1">{charm.name}</h3>
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-1 sm:line-clamp-2">{charm.description}</p>
          </div>
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <span className="text-base sm:text-lg font-bold bg-[linear-gradient(135deg,#4a3c00_0%,#8b6914_25%,#b8860b_50%,#8b6914_75%,#4a3c00_100%)] bg-clip-text text-transparent">€{charm.price.toFixed(2)}</span>
            {isSelected && (
              <div className="flex items-center gap-1">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Remove one instance
                    const charmToRemove = selectedCharms.find((sc) => sc.charm.id === charm.id);
                    if (charmToRemove) {
                      const newCharms = selectedCharms.filter((sc) => sc.id !== charmToRemove.id);
                      reorderCharms(newCharms);
                      showToast(`Removed ${charm.name}`, 'success');
                    }
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center shadow-sm transition-colors text-sm font-medium"
                  aria-label="Remove one charm"
                  title="Remove one charm"
                >
                  -
                </motion.button>
                <span className="text-sm font-semibold text-gray-900 min-w-[20px] text-center">
                  {quantity}
                </span>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick();
                  }}
                  className="bg-[linear-gradient(135deg,#7a5a00_0%,#d4af37_25%,#ffef9a_50%,#d4af37_75%,#7a5a00_100%)] text-gray-900 ring-1 ring-black/10 rounded-full w-6 h-6 flex items-center justify-center shadow-sm transition-colors text-sm font-medium"
                  aria-label="Add another charm"
                  title="Add another charm"
                >
                  +
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Fullscreen Modal (Portal to <body> so it isn't affected by Card's hover transforms) */}
      {isMounted && createPortal(
        <AnimatePresence>
          {isFullscreen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFullscreen(false)}
                className="fixed inset-0 z-[1000] bg-transparent cursor-pointer"
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed inset-0 z-[1010] flex items-center justify-center p-8"
                onClick={() => setIsFullscreen(false)}
              >
                <motion.div
                  className="relative max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Controls */}
                  <div className="absolute top-4 right-4 z-20 flex gap-2">
                    {/* Background toggle */}
                    <motion.button
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowBackground(!showBackground);
                      }}
                      className={`rounded-full p-2 shadow-lg transition-colors ${
                        showBackground
                          ? 'bg-[linear-gradient(135deg,#4a3c00_0%,#8b6914_25%,#b8860b_50%,#8b6914_75%,#4a3c00_100%)] text-white'
                          : 'bg-white/90 hover:bg-white text-gray-600'
                      }`}
                      aria-label={showBackground ? 'Hide background' : 'Show background'}
                      title={showBackground ? 'Hide background' : 'Show background'}
                    >
                      <ImageIcon className="w-5 h-5" />
                    </motion.button>

                    {/* Close button */}
                    <button
                      onClick={() => setIsFullscreen(false)}
                      className="bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 shadow-lg transition-colors"
                      aria-label="Close fullscreen"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Charm display */}
                  <div
                    className="relative h-[60vh] flex items-center justify-center p-8"
                    style={backgroundUrl && showBackground ? {
                      backgroundImage: `url(${backgroundUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    } : { background: 'linear-gradient(to-br, #f8fafc, #e2e8f0)' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative w-full h-full">
                      {glbUrl && !glbLoadError ? (
                        <>
                          {/* 3D Model - mount immediately in fullscreen so it can actually load */}
                          {shouldLoad3D ? (
                            <div className={`w-full h-full ${is3DLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
                              <Charm3DIcon
                                glbPath={glbUrl}
                                size={1.5}
                                color="#ec4899"
                                spin={true}
                                onInteractionChange={() => {}}
                                onError={handleGlbError}
                                onLoad={handle3DLoaded}
                                cameraZ={4}
                              />
                            </div>
                          ) : null}

                          {/* 2D Image - show when 3D is loading */}
                          <div className={`absolute inset-0 flex items-center justify-center ${is3DLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-200`}>
                            <AutoCenteredImage
                              src={getCharmImageUrl(charm)}
                              alt={charm.name}
                              fill
                              className="object-contain"
                              sizes="(max-width: 768px) 100vw, 50vw"
                              fallbackTransform="translate(0px, 0px)"
                            />
                          </div>

                          {/* Loading spinner for 3D */}
                          {shouldLoad3D && !is3DLoaded ? (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="flex flex-col items-center justify-center gap-3 bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-xl">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500/30 border-t-yellow-600"></div>
                                <span className="text-sm font-bold text-black px-2">
                                  {language === 'nl' ? '3D-model laden...' : '3D model loading...'}
                                </span>
                              </div>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <AutoCenteredImage
                            src={getCharmImageUrl(charm)}
                            alt={charm.name}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 50vw"
                            fallbackTransform="translate(0px, 0px)"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Charm info */}
                  <div className="p-6 bg-white">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{charm.name}</h2>
                      <p className="text-gray-600 mb-2">{charm.category}</p>
                      <p className="text-lg text-gray-700">{charm.description}</p>
                      <p className="text-2xl font-bold bg-[linear-gradient(135deg,#4a3c00_0%,#8b6914_25%,#b8860b_50%,#8b6914_75%,#4a3c00_100%)] bg-clip-text text-transparent mt-4">€{charm.price.toFixed(2)}</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}


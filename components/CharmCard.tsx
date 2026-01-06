'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Charm } from '@/data/products';
import Card from './ui/Card';
import Button from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from './ToastProvider';
import Charm3DIcon from './Charm3DIcon';
import { getCharmImageUrl, getCharmBackgroundUrl, getCharmGlbUrl, downloadCharmGlb, cleanupCharmGlbUrl } from '@/lib/db';

interface CharmCardProps {
  charm: Charm;
}

export default function CharmCard({ charm }: CharmCardProps) {
  const selectedCharms = useStore((state) => state.selectedCharms);
  const addCharm = useStore((state) => state.addCharm);
  const reorderCharms = useStore((state) => state.reorderCharms);
  const showCharmBackgrounds = useStore((state) => state.showCharmBackgrounds);
  const [isHovered, setIsHovered] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const isPointerInsideRef = useRef(false);
  const show3d = Boolean(getCharmGlbUrl(charm)) && (isHovered || isInteracting || isFullscreen);

  useEffect(() => {
    setIsMounted(true);

    // Cleanup blob URLs on unmount to prevent memory leaks
    return () => {
      cleanupCharmGlbUrl(charm.id);
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

  const selectedInstances = selectedCharms.filter((sc) => sc.charm.id === charm.id);
  const quantity = selectedInstances.length;
  const isSelected = quantity > 0;
  const { showToast } = useToast();
  const { t } = useLanguage();

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
    // Remove all instances of this charm from the grid view for simplicity
    const newCharms = selectedCharms.filter((sc) => sc.charm.id !== charm.id);
    reorderCharms(newCharms);
    showToast(`${charm.name} removed`, 'success');
  };

  const handleInteractionChange = (interacting: boolean) => {
    setIsInteracting(interacting);
    // IMPORTANT: avoid state churn while dragging. When drag ends, sync hover once based on pointer location.
    if (!interacting && !isFullscreen) {
      setIsHovered(isPointerInsideRef.current);
    }
  };

  return (
    <>
      <Card
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
          }
        }}
        hover
        className={`relative overflow-hidden transition-all duration-300 ${
          isSelected
            ? 'ring-2 ring-pink-500 ring-offset-2 bg-pink-50/50'
            : ''
        }`}
      >
        {/* Action buttons */}
        <div className="absolute top-2 right-2 z-20 flex gap-1">
          {/* Fullscreen button */}
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(true);
              setIsHovered(false);
              setIsInteracting(false);
            }}
            className="bg-white/90 hover:bg-white text-gray-700 rounded-full p-1.5 shadow-lg transition-colors"
            aria-label="View charm in fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </motion.button>

          {/* Remove button - only shown when selected */}
          {isSelected && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleRemove}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
              aria-label="Remove charm"
            >
              <X className="w-4 h-4" />
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
          className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4"
          style={backgroundUrl && showCharmBackgrounds ? {
            backgroundImage: `url(${backgroundUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          } : undefined}
        >
          {getCharmGlbUrl(charm) && (isHovered || isInteracting || isFullscreen) ? (
            <div className="w-full h-full">
              <Charm3DIcon
                iconName={charm.icon3d}
                glbPath={getCharmGlbUrl(charm)}
                size={1.2}
                color="#ec4899"
                spin={true}
                onInteractionChange={handleInteractionChange}
              />
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={getCharmImageUrl(charm)}
                alt={charm.name}
                fill
                className="object-contain"
                style={{
                  filter: 'drop-shadow(0 16px 32px rgba(0, 0, 0, 0.6))',
                  objectPosition: 'center 60%' // Position content lower in the container to center non-transparent parts
                }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="lazy"
              />
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="mb-2">
            <h3 className="font-semibold text-base text-gray-900 mb-1">{charm.name}</h3>
            <p className="text-xs text-gray-500 mb-2">{charm.category}</p>
            <p className="text-sm text-gray-600 line-clamp-2">{charm.description}</p>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-bold text-pink-600">${charm.price.toFixed(2)}</span>
            {isSelected && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-pink-600 font-medium"
              >
                {t('home.featured.added')}
              </motion.span>
            )}
          </div>
          <Button 
            fullWidth 
            size="sm" 
            onClick={handleCardClick}
            variant={isSelected ? 'secondary' : 'primary'}
          >
            {t('home.featured.add')}
          </Button>
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
                className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm cursor-pointer"
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
                  {/* Close button */}
                  <button
                    onClick={() => setIsFullscreen(false)}
                    className="absolute top-4 right-4 z-20 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 shadow-lg transition-colors"
                    aria-label="Close fullscreen"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {/* Charm display */}
                  <div
                    className="relative h-[60vh] flex items-center justify-center p-8"
                    style={backgroundUrl && showCharmBackgrounds ? {
                      backgroundImage: `url(${backgroundUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    } : { background: 'linear-gradient(to-br, #f8fafc, #e2e8f0)' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {getCharmGlbUrl(charm) ? (
                      <div className="w-full h-full">
                        <Charm3DIcon
                          glbPath={getCharmGlbUrl(charm)}
                          size={1.5}
                          color="#ec4899"
                          spin={true}
                          onInteractionChange={() => {}}
                          cameraZ={4}
                        />
                      </div>
                    ) : (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <Image
                          src={getCharmImageUrl(charm)}
                          alt={charm.name}
                          fill
                          className="object-contain"
                          style={{ filter: 'drop-shadow(0 24px 48px rgba(0, 0, 0, 0.7))' }}
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    )}
                  </div>

                  {/* Charm info */}
                  <div className="p-6 bg-white">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{charm.name}</h2>
                      <p className="text-gray-600 mb-2">{charm.category}</p>
                      <p className="text-lg text-gray-700">{charm.description}</p>
                      <p className="text-2xl font-bold text-pink-600 mt-4">${charm.price.toFixed(2)}</p>
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


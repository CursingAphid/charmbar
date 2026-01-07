'use client';

import { useEffect } from 'react';

export function OrientationHandler() {
  useEffect(() => {
    // Prevent page refresh on orientation change
    const handleOrientationChange = (event: Event) => {
      // Prevent default behavior that might cause refresh
      event.preventDefault();

      // Force viewport recalculation without refresh
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        // Temporarily modify viewport to force recalculation
        const originalContent = viewport.getAttribute('content');
        viewport.setAttribute('content', originalContent + ', user-scalable=no');

        // Restore after a brief delay
        setTimeout(() => {
          viewport.setAttribute('content', originalContent || '');
        }, 100);
      }

      // Dispatch a custom event that components can listen to for orientation changes
      window.dispatchEvent(new CustomEvent('orientationchange-custom'));
    };

    // Add orientation change listener
    window.addEventListener('orientationchange', handleOrientationChange, { passive: false });

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return null; // This component doesn't render anything
}

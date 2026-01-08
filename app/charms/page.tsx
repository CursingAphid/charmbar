'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getBracelets, getCharms, getCharmsByTag, getCharmCategories, getCharmImageUrl, type Bracelet, type Charm } from '@/lib/db';
import { useStore } from '@/store/useStore';
import { useLanguage } from '@/contexts/LanguageContext';
import CharmCard from '@/components/CharmCard';
import PreviewCanvas from '@/components/PreviewCanvas';
import Button from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, X, ChevronDown, Info, Eye, Filter, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { getCharmGlbUrl } from '@/lib/db';
import { useGLTF } from '@react-three/drei';
import html2canvas from 'html2canvas';
import { createClient } from '@/lib/supabase/client';

export default function CharmsPage() {
  const router = useRouter();
  const selectedBracelet = useStore((state) => state.selectedBracelet);
  const setBracelet = useStore((state) => state.setBracelet);
  const selectedCharms = useStore((state) => state.selectedCharms);
  const addCharm = useStore((state) => state.addCharm);
  const removeCharm = useStore((state) => state.removeCharm);
  const reorderCharms = useStore((state) => state.reorderCharms);
  const addToCart = useStore((state) => state.addToCart);
  const getTotalPrice = useStore((state) => state.getTotalPrice);
  const { t } = useLanguage();

  const [bracelets, setBracelets] = useState<Bracelet[]>([]);
  const [allCharms, setAllCharms] = useState<Charm[]>([]);
  const [charmCategories, setCharmCategories] = useState<string[]>(['All']);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['All']);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);

  // Load data from database
  useEffect(() => {
    async function loadData() {
      try {
        console.log('📦 Charms page: Loading data from database...');

        const [braceletsData, categoriesData] = await Promise.all([
          getBracelets(),
          getCharmCategories()
        ]);

        // Load all charms initially, we'll filter by tag on the client
        const charmsData = await getCharms();
        console.log('📦 Charms page: Data loaded -', {
          bracelets: braceletsData.length,
          charms: charmsData.length,
          categories: categoriesData
        });
        setBracelets(braceletsData);
        setAllCharms(charmsData);
        setCharmCategories(categoriesData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Note: Removed preloading to avoid overwhelming the server with requests for charms that don't have GLB data
  // 3D models will load on-demand when users hover over charms

  // Ensure a bracelet is always selected (defensive; store defaults to gold)
  // This hook must come before any conditional returns to maintain hooks order
  useEffect(() => {
    if (!selectedBracelet) {
      if (bracelets.length > 0) {
        const gold = bracelets.find((b) => b.id === 'bracelet-2') ?? bracelets[0];
        if (gold) setBracelet(gold);
      } else if (!loading) {
        // Fallback if no bracelets in database to prevent being stuck on loading screen
        setBracelet({
          id: 'default-bracelet',
          name: 'Gold Plated Chain',
          description: 'Luxurious gold-plated chain',
          price: 34.99,
          image: '/images/bracelets/bracelet_gold.png',
          openImage: '/images/bracelets/bracelet_open.png',
          grayscale: false,
          color: 'Gold',
          material: 'Gold Plated'
        });
      }
    }
  }, [selectedBracelet, setBracelet, bracelets, loading]);

  // Prevent background scroll when mobile preview is open
  useEffect(() => {
    if (!isMobilePreviewOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isMobilePreviewOpen]);

  const filteredCharms = useMemo(() => {
    const filtered = allCharms.filter((charm) => {
      const hasTags = charm.tags && charm.tags.length > 0;

      // Check if charm matches any selected category
      const matchesCategory = selectedCategories.includes('All') ||
        selectedCategories.some(selectedCat =>
          (hasTags && charm.tags!.includes(selectedCat)) ||
          (!hasTags && charm.category === selectedCat)
        );

      const matchesSearch =
        charm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        charm.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });

    // Sort by: Charms with backgrounds first, then by original order
    return [...filtered].sort((a, b) => {
      const aHasBackground = !!a.background_id;
      const bHasBackground = !!b.background_id;

      // Charms with backgrounds always come first
      if (aHasBackground && !bHasBackground) return -1;
      if (!aHasBackground && bHasBackground) return 1;

      return 0;
    });
  }, [allCharms, selectedCategories, searchQuery, selectedCharms]);

  // Handle clicks outside the filter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };

    if (showFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showFilterDropdown]);

  // All hooks must come before conditional returns
  const { showToast } = useToast();

  // Show loading state
  if (loading || !selectedBracelet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bracelet...</p>
        </div>
      </div>
    );
  }

  const handleAddToCart = async () => {
    setLoading(true); // Re-use loading state or create a specific one for "Adding to cart..."

    try {
      let previewUrl = undefined;
      const element = document.getElementById('preview-canvas-container');

      if (element) {
        // Capture the canvas
        const canvas = await html2canvas(element, {
          useCORS: true,
          backgroundColor: null, // Transparent background
          scale: 2, // Higher quality
          logging: false,
        });

        // Convert to blob
        const blob = await new Promise<Blob | null>(resolve =>
          canvas.toBlob(resolve, 'image/png')
        );

        if (blob) {
          // Upload to Supabase
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();

          // Allow anonymous uploads if needed, or structured by session ID/random ID if user not logged in
          // For now, use a random ID if no user, or user ID
          const userId = user?.id || 'anonymous';
          const fileName = `${userId}/${Date.now()}-preview.png`;

          const { data, error } = await supabase
            .storage
            .from('previews')
            .upload(fileName, blob, {
              contentType: 'image/png',
              cacheControl: '3600',
              upsert: false
            });

          if (!error && data) {
            // Get Public URL
            const { data: { publicUrl } } = supabase
              .storage
              .from('previews')
              .getPublicUrl(fileName);

            previewUrl = publicUrl;
          } else {
            console.error('Error uploading preview:', error);
          }
        }
      }

      // Add to cart with the preview URL
      addToCart(previewUrl);
      showToast('Added to cart!', 'success');
      router.push('/cart');
    } catch (err) {
      console.error('Error capturing preview:', err);
      // Fallback: add to cart without preview
      addToCart();
      showToast('Added to cart (without preview)', 'success');
      router.push('/cart');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => {
      if (category === 'All') {
        // Clicking "All" always selects only "All"
        return ['All'];
      }

      // Remove "All" if it was selected and we're selecting a specific category
      const withoutAll = prev.filter(cat => cat !== 'All');

      if (withoutAll.includes(category)) {
        // Category is already selected, remove it
        const newSelection = withoutAll.filter(cat => cat !== category);
        // If no categories left, select "All"
        return newSelection.length === 0 ? ['All'] : newSelection;
      } else {
        // Category is not selected, add it
        return [...withoutAll, category];
      }
    });
  };

  const totalCharmsCount = selectedCharms.length;

  return (
    <div className="min-h-screen">

      {/* Extra bottom padding on mobile so the fixed bottom bar never covers content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-32 lg:pb-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 py-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('charms.title')}
          </h1>
          <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
            {t('charms.description')}
          </p>
          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium">
            ✨ {t('charms.hero.customize')} ✨
          </div>
        </motion.div>

        {/* Bracelet Dropdown (inside editor) */}
        <div className="mb-8 max-w-md">
          <label htmlFor="bracelet-select" className="block text-sm font-medium text-gray-700 mb-2">
            {t('charms.chooseBracelet')}
          </label>
          <div className="relative">
            <select
              id="bracelet-select"
              value={selectedBracelet?.id || ''}
              onChange={(e) => {
                const bracelet = bracelets.find((b) => b.id === e.target.value);
                if (bracelet) setBracelet(bracelet);
              }}
              className="w-full pl-4 pr-10 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none appearance-none cursor-pointer text-gray-900 font-medium"
            >
              {bracelets.map((bracelet) => (
                <option key={bracelet.id} value={bracelet.id}>
                  {bracelet.name} (€{bracelet.price.toFixed(2)})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Side - Charms Grid */}
          <div className="lg:col-span-7 order-1 lg:order-1">
            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={t('charms.search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    type="button"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Filter Dropdown (Mobile only) */}
              <div className="relative z-40 lg:hidden" ref={filterDropdownRef}>
                <button
                  onClick={() => {
                    setShowFilterDropdown(!showFilterDropdown);
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${showFilterDropdown || !selectedCategories.includes('All')
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  type="button"
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {selectedCategories.includes('All') ? 'All Tags' :
                      selectedCategories.length === 1 ? selectedCategories[0] :
                        `${selectedCategories.length} Tags`}
                  </span>
                  <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showFilterDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                    <div className="py-2">
                      <button
                        onClick={() => {
                          handleCategoryToggle('All');
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-amber-50 transition-colors ${selectedCategories.includes('All')
                          ? 'bg-[linear-gradient(90deg,rgba(255,242,197,0.9)_0%,rgba(212,175,55,0.22)_50%,rgba(255,242,197,0.9)_100%)] text-amber-900 font-semibold'
                          : 'text-gray-700'
                          }`}
                        type="button"
                      >
                        All Tags
                      </button>
                      {charmCategories.filter(cat => cat !== 'All').map((category) => (
                        <button
                          key={category}
                          onClick={() => {
                            handleCategoryToggle(category);
                            setShowFilterDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-amber-50 transition-colors ${selectedCategories.includes(category)
                            ? 'bg-[linear-gradient(90deg,rgba(255,242,197,0.9)_0%,rgba(212,175,55,0.22)_50%,rgba(255,242,197,0.9)_100%)] text-amber-900 font-semibold'
                            : 'text-gray-700'
                            }`}
                          type="button"
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Horizontal Scroll Tags (Desktop/Tablet only) */}
              <div className="hidden lg:flex items-center gap-2 -mx-4 px-4 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 whitespace-nowrap">
                  {charmCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryToggle(category)}
                      className={[
                        'px-4 py-2 rounded-full text-sm font-medium transition-all',
                        selectedCategories.includes(category)
                          ? [
                            // Metallic-ish gold gradient (multi-stop)
                            "bg-[linear-gradient(135deg,#7a5a00_0%,#d4af37_25%,#ffef9a_50%,#d4af37_75%,#7a5a00_100%)]",
                            'text-gray-900',
                            'ring-1 ring-black/10',
                          ].join(' ')
                          : 'bg-white text-gray-700 border border-gray-300 hover:border-amber-300 hover:text-amber-700',
                      ].join(' ')}
                      type="button"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Charms Grid */}
            {filteredCharms.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filteredCharms.map((charm, index) => (
                  <motion.div
                    key={charm.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <CharmCard charm={charm} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
                <p className="text-gray-400">{t('charms.noResults')}</p>
              </div>
            )}
          </div>

          {/* Right Side - Preview */}
          <div className="hidden lg:block lg:col-span-5 order-2 lg:order-2">
            <div className="lg:sticky lg:top-24">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('charms.preview.title')}</h2>
                <p className="text-sm text-gray-600">
                  {t('charms.preview.description')}
                </p>
              </div>

              {/* Gold Tint Warning */}
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed italic">
                  {t('charms.preview.goldWarning')}
                </p>
              </div>

              <div className="mb-6">
                <PreviewCanvas />
              </div>

              {/* Summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('charms.summary.bracelet')}</span>
                    <span className="font-semibold">€{selectedBracelet.price.toFixed(2)}</span>
                  </div>
                  {selectedCharms.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {totalCharmsCount} {totalCharmsCount !== 1 ? t('charms.summary.charms_plural') : t('charms.summary.charms')}:
                      </span>
                      <span className="font-semibold">
                        €
                        {selectedCharms
                          .reduce((sum, sc) => sum + sc.charm.price, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="font-bold text-gray-900">{t('charms.summary.total')}</span>
                    <span className="font-bold text-lg bg-[linear-gradient(135deg,#4a3c00_0%,#8b6914_25%,#b8860b_50%,#8b6914_75%,#4a3c00_100%)] bg-clip-text text-transparent">
                      €{getTotalPrice().toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleAddToCart}
                  fullWidth
                  disabled={selectedCharms.length === 0}
                  className="flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {selectedCharms.length === 0
                    ? t('charms.button.add')
                    : `${t('charms.button.cart')} (${totalCharmsCount})`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Preview Bottom Sheet */}
      <AnimatePresence>
        {isMobilePreviewOpen && (
          <div className="lg:hidden fixed inset-0 z-[60]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsMobilePreviewOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl border-t border-gray-200 shadow-2xl pb-[env(safe-area-inset-bottom)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t('charms.preview.title')}</p>
                  <p className="text-xs text-gray-500">
                    {totalCharmsCount} {totalCharmsCount !== 1 ? t('charms.summary.charms_plural') : t('charms.summary.charms')} {t('charms.selected')}
                  </p>
                </div>
                <button
                  onClick={() => setIsMobilePreviewOpen(false)}
                  className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                  aria-label="Close preview"
                  type="button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-4 pb-4">
                <div className="w-full">
                  <PreviewCanvas />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Sticky Bottom Bar (modern) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 shadow-lg z-50">
        <div className="px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <button
              onClick={() => setIsMobilePreviewOpen(true)}
              className="shrink-0 h-11 w-11 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center"
              aria-label={t('charms.preview.title')}
              type="button"
            >
              <Eye className="w-5 h-5" />
            </button>

            {selectedCharms.length === 0 ? (
              <div className="flex-1 h-11 flex flex-col justify-center items-center bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-tight text-center">
                  {t('charms.hero.customize')}
                </p>
              </div>
            ) : (
              <>
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <p className="text-[15px] font-bold bg-[linear-gradient(135deg,#4a3c00_0%,#8b6914_25%,#b8860b_50%,#8b6914_75%,#4a3c00_100%)] bg-clip-text text-transparent leading-none mb-1">
                    €{getTotalPrice().toFixed(2)}
                  </p>
                  <p className="text-[11px] text-gray-500 font-medium truncate leading-none">
                    {totalCharmsCount} {totalCharmsCount !== 1 ? t('charms.summary.charms_plural') : t('charms.summary.charms')}
                  </p>
                </div>

                <Button
                  onClick={handleAddToCart}
                  size="sm"
                  className="flex-[1.8] flex items-center justify-center gap-2 h-11 px-4"
                >
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-bold whitespace-nowrap">
                    {t('charms.button.cart')}
                  </span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


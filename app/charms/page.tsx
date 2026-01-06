'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getBracelets, getCharms, getCharmsByTag, getCharmCategories, type Bracelet, type Charm } from '@/lib/db';
import { useStore } from '@/store/useStore';
import { useLanguage } from '@/contexts/LanguageContext';
import CharmCard from '@/components/CharmCard';
import PreviewCanvas from '@/components/PreviewCanvas';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, X, ChevronDown, Info, Image, Eye, Filter, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

export default function CharmsPage() {
  const router = useRouter();
  const selectedBracelet = useStore((state) => state.selectedBracelet);
  const setBracelet = useStore((state) => state.setBracelet);
  const selectedCharms = useStore((state) => state.selectedCharms);
  const addToCart = useStore((state) => state.addToCart);
  const getTotalPrice = useStore((state) => state.getTotalPrice);
  const { t } = useLanguage();

  const [bracelets, setBracelets] = useState<Bracelet[]>([]);
  const [allCharms, setAllCharms] = useState<Charm[]>([]);
  const [charmCategories, setCharmCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
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

  // Ensure a bracelet is always selected (defensive; store defaults to gold)
  // This hook must come before any conditional returns to maintain hooks order
  useEffect(() => {
    if (!selectedBracelet && bracelets.length > 0) {
      const gold = bracelets.find((b) => b.id === 'bracelet-2') ?? bracelets[0];
      if (gold) setBracelet(gold);
    }
  }, [selectedBracelet, setBracelet, bracelets]);

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
      const matchesCategory = selectedCategory === 'All' ||
        (hasTags && charm.tags!.includes(selectedCategory)) ||
        (!hasTags && charm.category === selectedCategory); // fallback for charms without tags

      const matchesSearch =
        charm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        charm.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });

    // Sort by: 1) Charms with backgrounds first, 2) Selected charms, 3) Rest
    return [...filtered].sort((a, b) => {
      const aHasBackground = !!a.background;
      const bHasBackground = !!b.background;
      const aIsSelected = selectedCharms.some((sc) => sc.charm.id === a.id);
      const bIsSelected = selectedCharms.some((sc) => sc.charm.id === b.id);

      // Charms with backgrounds always come first
      if (aHasBackground && !bHasBackground) return -1;
      if (!aHasBackground && bHasBackground) return 1;

      // If both have backgrounds or neither do, then sort by selection
      if (aIsSelected && !bIsSelected) return -1;
      if (!aIsSelected && bIsSelected) return 1;

      return 0;
    });
  }, [allCharms, selectedCategory, searchQuery, selectedCharms]);

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bracelet...</p>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart();
    showToast('Added to cart!', 'success');
    router.push('/cart');
  };

  const totalCharmsCount = selectedCharms.length;

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Extra bottom padding on mobile so the fixed bottom bar never covers content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-32 lg:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
            {t('charms.title')}
          </h1>
          <p className="text-gray-600">
            {t('charms.description')} {selectedBracelet?.name ?? ''}
          </p>
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
              className="w-full pl-4 pr-10 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none appearance-none cursor-pointer text-gray-900 font-medium"
            >
              {bracelets.map((bracelet) => (
                <option key={bracelet.id} value={bracelet.id}>
                  {bracelet.name} (${bracelet.price.toFixed(2)})
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
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none bg-white"
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

              {/* Filter Dropdown */}
              <div className="relative z-40" ref={filterDropdownRef}>
                <button
                  onClick={() => {
                    setShowFilterDropdown(!showFilterDropdown);
                  }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                    showFilterDropdown || selectedCategory !== 'All'
                      ? 'bg-pink-50 border-pink-300 text-pink-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                  type="button"
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {selectedCategory === 'All' ? 'All Tags' : selectedCategory}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showFilterDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setSelectedCategory('All');
                            setShowFilterDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-pink-50 transition-colors ${
                            selectedCategory === 'All' ? 'bg-pink-50 text-pink-700 font-medium' : 'text-gray-700'
                          }`}
                          type="button"
                        >
                          All Tags
                        </button>
                        {charmCategories.filter(cat => cat !== 'All').map((category) => (
                          <button
                            key={category}
                            onClick={() => {
                              setSelectedCategory(category);
                              setShowFilterDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-pink-50 transition-colors ${
                              selectedCategory === category ? 'bg-pink-50 text-pink-700 font-medium' : 'text-gray-700'
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
            </div>

            {/* Charms Grid */}
            {filteredCharms.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="mb-6">
                <PreviewCanvas />
              </div>

              {/* Gold Tint Warning */}
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed italic">
                  {t('charms.preview.goldWarning')}
                </p>
              </div>

              {/* Summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('charms.summary.bracelet')}</span>
                    <span className="font-semibold">${selectedBracelet.price.toFixed(2)}</span>
                  </div>
                  {selectedCharms.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {totalCharmsCount} {totalCharmsCount !== 1 ? t('charms.summary.charms_plural') : t('charms.summary.charms')}:
                      </span>
                      <span className="font-semibold">
                        $
                        {selectedCharms
                          .reduce((sum, sc) => sum + sc.charm.price, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="font-bold text-gray-900">{t('charms.summary.total')}</span>
                    <span className="font-bold text-lg text-pink-600">
                      ${getTotalPrice().toFixed(2)}
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
                <div className="h-[55vh]">
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
              <div className="flex-1 text-center">
                <p className="text-sm text-gray-600">
                  Select charms to continue
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tap charms above to add them
                </p>
              </div>
            ) : (
              <>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    ${getTotalPrice().toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {totalCharmsCount} {totalCharmsCount !== 1 ? t('charms.summary.charms_plural') : t('charms.summary.charms')} {t('charms.selected')}
                  </p>
                </div>

                <Button onClick={handleAddToCart} className="flex-1">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  {t('charms.button.cart')}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


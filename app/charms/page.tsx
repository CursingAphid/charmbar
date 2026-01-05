'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getBracelets, getCharms, getCharmsByCategory, getCharmCategories, type Bracelet, type Charm } from '@/data/products';
import { useStore } from '@/store/useStore';
import { useLanguage } from '@/contexts/LanguageContext';
import CharmCard from '@/components/CharmCard';
import PreviewCanvas from '@/components/PreviewCanvas';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { Search, ShoppingBag, X, ChevronDown, Info } from 'lucide-react';
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

  // Load data from database
  useEffect(() => {
    async function loadData() {
      try {
        console.log('📦 Charms page: Loading data from database...');
        const [braceletsData, charmsData, categoriesData] = await Promise.all([
          getBracelets(),
          getCharms(),
          getCharmCategories()
        ]);
        console.log('📦 Charms page: Data loaded -', {
          bracelets: braceletsData.length,
          charms: charmsData.length,
          categories: categoriesData
        });
        console.log('📦 Charms page: All charms:', charmsData);
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

  const filteredCharms = useMemo(() => {
    const filtered = allCharms.filter((charm) => {
      const matchesCategory = selectedCategory === 'All' || charm.category === selectedCategory;
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-28 lg:pb-8">
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
          <div className="lg:col-span-7 order-2 lg:order-1">
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
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap gap-2">
                {charmCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-pink-300 hover:text-pink-600'
                    }`}
                  >
                    {category}
                  </button>
                ))}
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
          <div className="lg:col-span-5 order-1 lg:order-2">
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

      {/* Mobile Sticky Button */}
      {selectedCharms.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 shadow-lg p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                ${getTotalPrice().toFixed(2)}
              </p>
              <p className="text-xs text-gray-600">
                {totalCharmsCount} {totalCharmsCount !== 1 ? t('charms.summary.charms_plural') : t('charms.summary.charms')} {t('charms.selected')}
              </p>
            </div>
            <Button onClick={handleAddToCart} className="flex-1">
              {t('charms.button.cart')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


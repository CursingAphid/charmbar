'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getCharmsWithBackgrounds, type Charm } from '@/data/products';
import { getCharmImageUrl } from '@/lib/db';
import { useStore } from '@/store/useStore';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MousePointerClick, ShoppingBag, Truck, CheckCircle } from 'lucide-react';
import Charm3DIcon from '@/components/Charm3DIcon';
import { useToast } from '@/components/ToastProvider';

function FeaturedCharmCard({ charm, selectedCharms, addCharm, t, showToast, router }: { 
  charm: any; 
  selectedCharms: any[]; 
  addCharm: (c: any) => void; 
  t: any; 
  showToast: any;
  router: any;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const isAdded = selectedCharms.some((sc) => sc.charm.id === charm.id);

  return (
    <Card 
      key={charm.id} 
      className="border border-pink-100 bg-white shadow-sm hover:shadow-md transition-shadow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        {(charm.glbPath || charm.icon3d) && (isHovered || isInteracting) ? (
          <div className="w-full h-full">
            <Charm3DIcon
              iconName={charm.icon3d}
              glbPath={charm.glbPath}
              size={1.2}
              color="#a855f7"
              spin
              onInteractionChange={setIsInteracting}
            />
          </div>
        ) : (
          <div className="relative w-full h-full">
            <Image
              src={getCharmImageUrl(charm)}
              alt={charm.name}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 300px"
            />
          </div>
        )}
      </div>

      <div className="p-5 text-center">
        <div className="mb-4">
          <p className="font-semibold text-lg text-gray-900 mb-1">{charm.name}</p>
          <p className="text-gray-600">${charm.price.toFixed(2)}</p>
        </div>

        <Button
          size="md"
          fullWidth
          onClick={() => {
            if (isAdded) {
              router.push('/charms');
              return;
            }
            const totalCount = selectedCharms.length;
            if (totalCount >= 7) {
              showToast(t('charms.limitReached'), 'error');
              return;
            }
            addCharm(charm);
            showToast(`${charm.name} added!`, 'success');
            router.push('/charms');
          }}
          className="text-sm font-bold"
        >
          {isAdded ? t('home.featured.added') : t('home.featured.add')}
        </Button>
      </div>
    </Card>
  );
}

export default function Home() {
  const [featuredCharms, setFeaturedCharms] = useState<Charm[]>([]);
  const router = useRouter();
  const addCharm = useStore((state) => state.addCharm);
  const selectedCharms = useStore((state) => state.selectedCharms);
  const { t } = useLanguage();
  const { showToast } = useToast();

  useEffect(() => {
    async function loadFeaturedCharms() {
      try {
        console.log('🏠 Home page: Loading featured charms...');
        const charms = await getCharmsWithBackgrounds();
        console.log('🏠 Home page: Featured charms loaded:', charms.length, 'charms');
        console.log('🏠 Home page: Setting first 3:', charms.slice(0, 3));
        setFeaturedCharms(charms.slice(0, 3));
      } catch (error) {
        console.error('🏠 Home page: Error loading featured charms:', error);
        setFeaturedCharms([]);
      }
    }
    loadFeaturedCharms();
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* In-Progress Designing Bar */}
      <AnimatePresence>
        {selectedCharms.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-pink-600 text-white overflow-hidden sticky top-16 z-40"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <span className="text-sm md:text-base font-medium">
                ✨ {t('home.inProgress')}
              </span>
              <button
                onClick={() => router.push('/charms')}
                className="bg-white text-pink-600 px-4 py-1 rounded-full text-sm font-bold hover:bg-pink-50 transition-colors"
              >
                {t('home.inProgressButton')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Hero Section */}
      <section className="relative w-full h-[45vh] sm:h-[35vh] min-h-[350px] sm:min-h-[280px] flex items-center justify-center overflow-hidden">
        {/* Soft Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-purple-100 to-pink-50" />
        
        {/* Floating Charm Silhouettes */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Heart Silhouettes */}
          <motion.div
            className="absolute"
            style={{ left: '10%', top: '20%' }}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" className="opacity-25">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" className="text-pink-500" />
            </svg>
          </motion.div>
          
          <motion.div
            className="absolute"
            style={{ left: '75%', top: '15%' }}
            animate={{
              y: [0, 25, 0],
              x: [0, -15, 0],
              rotate: [0, -8, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
          >
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" className="opacity-20">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" className="text-purple-500" />
            </svg>
          </motion.div>
          
          <motion.div
            className="absolute"
            style={{ left: '50%', top: '60%' }}
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
              rotate: [0, 10, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2,
            }}
          >
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" className="opacity-30">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" className="text-pink-500" />
            </svg>
          </motion.div>
          
          {/* Star Silhouettes */}
          <motion.div
            className="absolute"
            style={{ left: '20%', top: '50%' }}
            animate={{
              y: [0, 20, 0],
              x: [0, -10, 0],
              rotate: [0, -15, 0],
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
          >
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" className="opacity-22">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" className="text-purple-500" />
            </svg>
          </motion.div>
          
          <motion.div
            className="absolute"
            style={{ left: '80%', top: '45%' }}
            animate={{
              y: [0, -25, 0],
              x: [0, 15, 0],
              rotate: [0, 12, 0],
            }}
            transition={{
              duration: 11,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1.5,
            }}
          >
            <svg width="70" height="70" viewBox="0 0 24 24" fill="none" className="opacity-28">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" className="text-pink-500" />
            </svg>
          </motion.div>
          
          {/* Snowflake Silhouettes */}
          <motion.div
            className="absolute"
            style={{ left: '5%', top: '70%' }}
            animate={{
              y: [0, -15, 0],
              x: [0, 8, 0],
              rotate: [0, 360],
            }}
            transition={{
              y: { duration: 7, repeat: Infinity, ease: 'easeInOut' },
              x: { duration: 7, repeat: Infinity, ease: 'easeInOut' },
              rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
            }}
          >
            <svg width="90" height="90" viewBox="0 0 24 24" fill="none" className="opacity-25">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2" className="text-purple-500" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" className="text-purple-500" />
            </svg>
          </motion.div>
          
          <motion.div
            className="absolute"
            style={{ left: '90%', top: '75%' }}
            animate={{
              y: [0, 20, 0],
              x: [0, -12, 0],
              rotate: [0, -360],
            }}
            transition={{
              y: { duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 },
              x: { duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 },
              rotate: { duration: 25, repeat: Infinity, ease: 'linear' },
            }}
          >
            <svg width="65" height="65" viewBox="0 0 24 24" fill="none" className="opacity-30">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2" className="text-pink-500" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" className="text-pink-500" />
            </svg>
          </motion.div>
          
          <motion.div
            className="absolute"
            style={{ left: '30%', top: '10%' }}
            animate={{
              y: [0, 18, 0],
              x: [0, 5, 0],
              rotate: [0, 180, 0],
            }}
            transition={{
              y: { duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2.5 },
              x: { duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2.5 },
              rotate: { duration: 15, repeat: Infinity, ease: 'linear' },
            }}
          >
            <svg width="55" height="55" viewBox="0 0 24 24" fill="none" className="opacity-28">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2" className="text-purple-500" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" className="text-purple-500" />
            </svg>
          </motion.div>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-4 text-center flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6 sm:mb-6 flex justify-center"
          >
            <Image
              src="/images/charm_bazaar_logo.png?v=3"
              alt="Charm Bazaar"
              width={900}
              height={550}
              className="w-auto h-auto max-w-[85vw] sm:max-w-[95vw] md:max-w-[900px] drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]"
              style={{ marginTop: '0', marginBottom: '0' }}
              priority
              unoptimized
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Button
              size="lg"
              onClick={() => {
                router.push('/charms');
              }}
              className="text-lg px-8 py-4"
            >
              {t('home.hero.button')} →
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Featured Charms Section */}
      <section className="py-12 bg-white/30 backdrop-blur-sm border-y border-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full"
          >
            <div className="flex items-center justify-center gap-2 mb-10">
              <Sparkles className="w-6 h-6 text-purple-500" />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                {t('home.featured.title')}
              </h2>
              <Sparkles className="w-6 h-6 text-pink-500" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {featuredCharms.map((charm) => (
                <FeaturedCharmCard
                  key={charm.id}
                  charm={charm}
                  selectedCharms={selectedCharms}
                  addCharm={addCharm}
                  t={t}
                  showToast={showToast}
                  router={router}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('home.howItWorks.title')}
            </h2>
            <div className="w-20 h-1.5 bg-gradient-to-r from-pink-500 to-purple-600 mx-auto rounded-full" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Timeline Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-pink-100 -z-0" />

            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative z-10 text-center"
            >
              <div className="w-24 h-24 bg-white border-4 border-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl text-pink-500">
                <MousePointerClick className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('home.howItWorks.step1.title')}</h3>
              <p className="text-gray-600 text-sm px-4">{t('home.howItWorks.step1.description')}</p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative z-10 text-center"
            >
              <div className="w-24 h-24 bg-white border-4 border-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl text-purple-500">
                <Sparkles className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('home.howItWorks.step2.title')}</h3>
              <p className="text-gray-600 text-sm px-4">{t('home.howItWorks.step2.description')}</p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative z-10 text-center"
            >
              <div className="w-24 h-24 bg-white border-4 border-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl text-pink-500">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('home.howItWorks.step3.title')}</h3>
              <p className="text-gray-600 text-sm px-4">{t('home.howItWorks.step3.description')}</p>
            </motion.div>

            {/* Step 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="relative z-10 text-center"
            >
              <div className="w-24 h-24 bg-white border-4 border-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl text-purple-500">
                <Truck className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('home.howItWorks.step4.title')}</h3>
              <p className="text-gray-600 text-sm px-4">{t('home.howItWorks.step4.description')}</p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}

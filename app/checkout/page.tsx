'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { CreditCard, MapPin, Mail, User, Phone, ArrowLeft, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getCharmImageUrl } from '@/lib/db';
import { getBraceletSnapPoints, DEFAULT_SNAP_POINTS } from '@/lib/braceletSnapPoints';
import { placeOrder } from '@/app/actions/orders';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useStore((state) => state.cart);
  const getCartTotal = useStore((state) => state.getCartTotal);
  const clearSelection = useStore((state) => state.clearSelection);
  const clearCart = useStore((state) => state.clearCart);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    country: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user && user.email) {
        setFormData(prev => ({
          ...prev,
          email: user.email!,
          name: user.user_metadata?.full_name || prev.name
        }));
      }
      setIsLoadingAuth(false);
    }
    checkUser();
  }, []);


  if (cart.length === 0) {
    if (typeof window !== 'undefined') {
      router.push('/cart');
    }
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!user) {
      setError("Please log in to place an order.");
      setIsSubmitting(false);
      return;
    }

    try {
      const total = getCartTotal();
      const result = await placeOrder(cart, total);

      if (result?.error) {
        setError(result.error);
        setIsSubmitting(false);
      } else if (result?.success) {
        clearSelection();
        clearCart();
        router.push(`/checkout/success?orderId=${result.orderId}`);
      }
    } catch (e) {
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const isFormValid =
    formData.name &&
    formData.email &&
    formData.phone &&
    formData.address &&
    formData.city &&
    formData.zipCode &&
    formData.country;

  return (
    <div className="min-h-screen">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link href="/cart" className="inline-flex items-center text-gray-600 hover:text-yellow-600 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold bg-[linear-gradient(135deg,#7a5a00_0%,#d4af37_25%,#ffef9a_50%,#d4af37_75%,#7a5a00_100%)] bg-clip-text text-transparent mb-8">
            Checkout
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <Card className="p-4 sm:p-6">
                {!isLoadingAuth && !user ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-amber-500" />
                    </div>
                    <h2 className="text-xl font-bold text-stone-900 mb-2">Account Required</h2>
                    <p className="text-stone-500 mb-6">Please sign in or create an account to complete your purchase.</p>
                    <Link href="/login" className="inline-block bg-amber-400 text-amber-950 px-8 py-3 rounded-xl font-bold shadow-lg shadow-amber-200/50 hover:bg-amber-500 transition-transform hover:scale-105">
                      Sign In / Sign Up
                    </Link>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <User className="w-5 h-5 text-yellow-500" />
                      Shipping Information
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
                          placeholder="John Doe"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Email *
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              required
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
                              placeholder="john@example.com"
                              disabled // Email comes from auth
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="phone"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Phone *
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                              type="tel"
                              id="phone"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              required
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
                              placeholder="+1 234 567 8900"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="address"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Address *
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            required
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
                            placeholder="123 Main Street"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label
                            htmlFor="city"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            City *
                          </label>
                          <input
                            type="text"
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
                            placeholder="New York"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="zipCode"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            ZIP Code *
                          </label>
                          <input
                            type="text"
                            id="zipCode"
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
                            placeholder="10001"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="country"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Country *
                          </label>
                          <input
                            type="text"
                            id="country"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
                            placeholder="United States"
                          />
                        </div>
                      </div>

                      {error && (
                        <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg border border-red-100">
                          {error}
                        </div>
                      )}

                      {/* Mobile: keep primary CTA reachable while scrolling long forms */}
                      <div className="pt-4 sm:pt-6 sticky bottom-0 -mx-4 sm:mx-0 px-4 sm:px-0 py-4 bg-white/95 backdrop-blur border-t border-gray-100 sm:border-t-0">
                        <Button
                          type="submit"
                          fullWidth
                          size="lg"
                          disabled={!isFormValid || isSubmitting}
                          className="flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-5 h-5" />
                              Complete Order
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </>
                )}
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="p-4 sm:p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>

                  <div className="space-y-4 mb-6">
                    {cart.map((item) => {
                      const itemTotal =
                        item.bracelet.price +
                        item.charms.reduce((sum, sc) => sum + sc.charm.price, 0);
                      return (
                        <div key={item.id} className="border-b border-gray-200 pb-6 last:border-0">
                          {/* Full-width Mini Preview on Top */}
                          <div className="w-full aspect-[800/350] bg-gray-50 relative rounded-lg overflow-hidden mb-4 border border-gray-100">
                            {item.bracelet.openImage ? (
                              <Image
                                src={item.bracelet.openImage}
                                alt={item.bracelet.name}
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 100vw, 400px"
                              />
                            ) : (
                              <Image
                                src={item.bracelet.image}
                                alt={item.bracelet.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 400px"
                              />
                            )}

                            {/* Positioned charms */}
                            {item.charms.map((charmItem, charmIndex) => {
                              const positionIndex = (item as any).charmPositions?.[charmItem.id];
                              if (positionIndex === undefined) return null;

                              const snapPoints = getBraceletSnapPoints(item.bracelet.id) || DEFAULT_SNAP_POINTS;
                              const position = snapPoints[positionIndex];
                              if (!position) return null;

                              return (
                                <div
                                  key={charmItem.id}
                                  className="absolute z-10 pointer-events-none"
                                  style={{
                                    left: `${(position.x / 800) * 100}%`,
                                    top: `${(position.y / 350) * 100}%`,
                                    width: '18.75%',
                                    aspectRatio: '1 / 1',
                                    translate: '-50% -50%',
                                  }}
                                >
                                  <div className="relative w-full h-full">
                                    <Image
                                      src={getCharmImageUrl(charmItem.charm)}
                                      alt={charmItem.charm.name}
                                      fill
                                      className="object-contain drop-shadow-sm"
                                      sizes="40px"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-gray-900 block">{item.bracelet.name}</span>
                              {item.charms.length > 0 && (
                                <p className="text-xs text-gray-500 font-medium mt-0.5">
                                  {item.charms.length} {item.charms.length !== 1 ? 'Charms' : 'Charm'} included
                                </p>
                              )}
                            </div>
                            <span className="font-bold text-gray-900">
                              €{itemTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal:</span>
                      <span>€{getCartTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Shipping:</span>
                      <span>Free</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                      <span>Total:</span>
                      <span className="bg-[linear-gradient(135deg,#7a5a00_0%,#d4af37_25%,#ffef9a_50%,#d4af37_75%,#7a5a00_100%)] bg-clip-text text-transparent">€{getCartTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

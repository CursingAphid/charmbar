'use client';

import Image from 'next/image';
import { Trash2, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { getCharmImageUrl, type Charm, type Bracelet } from '@/lib/db';
import { getBraceletSnapPoints, DEFAULT_SNAP_POINTS } from '@/lib/braceletSnapPoints';
import Card from './ui/Card';
import Button from './ui/Button';
import { useToast } from './ToastProvider';

import { useLanguage } from '@/contexts/LanguageContext';

interface CartItemProps {
  cartItem: {
    id: string;
    bracelet: Bracelet;
    charms: Array<{
      id: string;
      charm: Charm;
    }>;
    charmPositions: Record<string, number>;
  };
}

export default function CartItem({ cartItem }: CartItemProps) {
  const router = useRouter();
  const removeFromCart = useStore((state) => state.removeFromCart);
  const setBracelet = useStore((state) => state.setBracelet);
  const reorderCharms = useStore((state) => state.reorderCharms);
  const updateCharmPositions = useStore((state) => state.updateCharmPositions);
  const setEditingCartItemId = useStore((state) => state.setEditingCartItemId);
  const { t } = useLanguage();

  const handleEdit = () => {
    // Restore the exact design into the editor (bracelet + charm instances + their positions)
    setBracelet(cartItem.bracelet);
    reorderCharms(cartItem.charms);
    updateCharmPositions(cartItem.charmPositions || {});
    setEditingCartItemId(cartItem.id);
    router.push('/charms');
  };

  const { showToast } = useToast();

  const handleRemove = () => {
    removeFromCart(cartItem.id);
    showToast('Item removed from cart', 'success');
  };

  const itemTotal =
    cartItem.bracelet.price +
    cartItem.charms.reduce((sum, sc) => sum + sc.charm.price, 0);

  // Group charms by ID for display
  const groupedCharms = cartItem.charms.reduce((acc, item) => {
    const existing = acc.find((a) => a.charm.id === item.charm.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      acc.push({ charm: item.charm, quantity: 1 });
    }
    return acc;
  }, [] as Array<{ charm: any; quantity: number }>);

  return (
    <Card className="overflow-hidden">
      {/* Full-width Bracelet Preview on Top */}
      <div className="w-full aspect-[800/350] bg-gray-50 relative border-b border-gray-100 overflow-hidden">
        {/* Bracelet background */}
        <div className="absolute inset-0">
          {cartItem.bracelet.openImage ? (
            <Image
              src={cartItem.bracelet.openImage}
              alt={cartItem.bracelet.name}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 800px"
              priority
            />
          ) : (
            <Image
              src={cartItem.bracelet.image}
              alt={cartItem.bracelet.name}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 800px"
              priority
            />
          )}
        </div>

        {/* Positioned charms */}
        {cartItem.charms.map((charmItem) => {
          const positionIndex = cartItem.charmPositions[charmItem.id];
          if (positionIndex === undefined) return null;

          const snapPoints = getBraceletSnapPoints(cartItem.bracelet.id) || DEFAULT_SNAP_POINTS;
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
                  className="object-contain drop-shadow-lg"
                  sizes="(max-width: 1024px) 18.75vw, 150px"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-6">
        <div className="flex flex-col gap-6">
          {/* Details */}
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {cartItem.bracelet.name}
                </h3>
                <p className="text-sm text-gray-600 font-medium">
                  {t('cart.item.bracelet')}: €{cartItem.bracelet.price.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold bg-[linear-gradient(135deg,#4a3c00_0%,#8b6914_25%,#b8860b_50%,#8b6914_75%,#4a3c00_100%)] bg-clip-text text-transparent">
                  €{itemTotal.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Charms List */}
            {groupedCharms.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-3">
                  {t('cart.item.included_charms')}:
                </p>
                <div className="flex flex-wrap gap-3">
                  {groupedCharms.map((group) => (
                    <div
                      key={group.charm.id}
                      className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 hover:bg-white hover:shadow-sm transition-all"
                    >
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <Image
                          src={getCharmImageUrl(group.charm)}
                          alt={group.charm.name}
                          fill
                          className="object-contain"
                          sizes="40px"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 leading-tight">
                          {group.charm.name}
                          {group.quantity > 1 && (
                            <span className="ml-1 text-yellow-500 font-extrabold text-xs">
                              (×{group.quantity})
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] font-bold bg-[linear-gradient(135deg,#4a3c00_0%,#8b6914_25%,#b8860b_50%,#8b6914_75%,#4a3c00_100%)] bg-clip-text text-transparent">
                          €{(group.charm.price * group.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
              <Button
                onClick={handleEdit}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                {t('cart.item.edit')}
              </Button>
              <Button
                variant="secondary"
                onClick={handleRemove}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border-none"
              >
                <Trash2 className="w-4 h-4" />
                {t('cart.remove')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}


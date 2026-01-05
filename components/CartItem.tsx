'use client';

import Image from 'next/image';
import { Trash2, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { getCharmImageUrl, type Charm, type Bracelet } from '@/lib/db';
import Card from './ui/Card';
import Button from './ui/Button';
import { useToast } from './ToastProvider';

interface CartItemProps {
  cartItem: {
    id: string;
    bracelet: Bracelet;
    charms: Array<{
      id: string;
      charm: Charm;
    }>;
  };
}

export default function CartItem({ cartItem }: CartItemProps) {
  const router = useRouter();
  const removeFromCart = useStore((state) => state.removeFromCart);
  const setBracelet = useStore((state) => state.setBracelet);

  const handleEdit = () => {
    // Use the bracelet data directly from the cart item
    setBracelet(cartItem.bracelet);
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
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Bracelet Image */}
          <div className="relative w-full md:w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={cartItem.bracelet.image}
              alt={cartItem.bracelet.name}
              fill
              className="object-cover"
              sizes="128px"
            />
          </div>

          {/* Details */}
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {cartItem.bracelet.name}
                </h3>
                <p className="text-sm text-gray-600">
                  ${cartItem.bracelet.price.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-pink-600">${itemTotal.toFixed(2)}</p>
              </div>
            </div>

            {/* Charms List */}
            {groupedCharms.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Charms:</p>
                <div className="flex flex-wrap gap-2">
                  {groupedCharms.map((group) => (
                    <div
                      key={group.charm.id}
                      className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <div className="relative w-8 h-8">
                        <Image
                          src={getCharmImageUrl(group.charm)}
                          alt={group.charm.name}
                          fill
                          className="object-cover rounded"
                          sizes="32px"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-gray-700">
                          {group.charm.name}
                        </span>
                        {group.quantity > 1 && (
                          <span className="text-xs text-gray-500">
                            (×{group.quantity})
                          </span>
                        )}
                        <span className="text-sm text-gray-600">
                          ${(group.charm.price * group.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRemove}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}


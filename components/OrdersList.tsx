'use client'

import Link from 'next/link'
import { Package, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { getBraceletSnapPoints, DEFAULT_SNAP_POINTS } from '@/lib/braceletSnapPoints'
import { getCharmImageUrl, Charm } from '@/lib/db'

interface SelectedCharm {
    id: string
    charm: Charm
}

interface Bracelet {
    id: string
    name: string
    price: number
    image: string
    material: string
    color: string
}

interface CartItem {
    id: string
    bracelet: Bracelet
    charms: SelectedCharm[]
    previewImage?: string
}

interface Order {
    id: string
    created_at: string
    total_amount: number
    status: string
    items: CartItem[]
}

interface OrdersListProps {
    orders: Order[]
}

export default function OrdersList({ orders }: OrdersListProps) {
    const { t, language } = useLanguage()

    return (
        <div className="min-h-screen bg-stone-50 pt-24 pb-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-amber-100 rounded-2xl">
                        <Package className="w-6 h-6 text-amber-700" />
                    </div>
                    <h1 className="text-3xl font-bold text-stone-900">{t('orders.title')}</h1>
                </div>

                {orders && orders.length > 0 ? (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-xs text-stone-500 uppercase font-bold tracking-wider">{t('orders.order')}</p>
                                        <p className="text-sm font-mono text-stone-700">{order.id.slice(0, 8)}...</p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-xs text-stone-500 uppercase font-bold tracking-wider">{t('orders.date')}</p>
                                        <p className="text-sm text-stone-700">
                                            {new Date(order.created_at).toLocaleDateString(language, {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-xs text-stone-500 uppercase font-bold tracking-wider">{t('orders.total')}</p>
                                        <p className="text-sm font-bold text-stone-900">€{order.total_amount.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {order.status === 'completed' && <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wide rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {t('orders.status')}</div>}
                                        {order.status === 'pending' && <div className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wide rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> {t('orders.status')}</div>}
                                        {order.status === 'cancelled' && <div className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wide rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" /> {t('orders.status')}</div>}
                                    </div>
                                </div>

                                <div className="p-6">
                                    <h4 className="text-sm font-medium text-stone-900 mb-4">{t('orders.items')}</h4>
                                    <div className="space-y-6">
                                        {(order.items as CartItem[]).map((item, index) => (
                                            <div key={index} className="bg-stone-50 rounded-2xl overflow-hidden border border-stone-200">
                                                {/* Large Preview Image */}
                                                <div className="w-full aspect-[800/350] bg-white border-b border-stone-200 relative p-4">
                                                    {(() => {
                                                        const hasPreviewImage = !!item.previewImage
                                                        const charmPositions = (item as any)?.charmPositions as Record<string, number> | undefined
                                                        const canRenderOverlay = !hasPreviewImage && !!item?.bracelet?.image && !!charmPositions && Array.isArray(item?.charms) && item.charms.length > 0

                                                        // #region agent log (H5)
                                                        fetch('http://127.0.0.1:7243/ingest/571757a8-8a49-401c-b0dc-95cc19c6385f', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'debug-session', runId: 'post-fix', hypothesisId: 'H5', location: 'components/OrdersList.tsx:renderPreview', message: 'Order item preview render decision', data: { hasPreviewImage, canRenderOverlay, charmsCount: item?.charms?.length ?? -1 }, timestamp: Date.now() }) }).catch(() => { });
                                                        // #endregion

                                                        if (hasPreviewImage) {
                                                            return <img src={item.previewImage} alt="Custom Bracelet Design" className="w-full h-full object-contain" />
                                                        }

                                                        if (item.bracelet.image) {
                                                            const baseImage = (item as any)?.bracelet?.openImage || item.bracelet.image
                                                            const snapPoints = getBraceletSnapPoints(item.bracelet.id) || DEFAULT_SNAP_POINTS

                                                            return (
                                                                <>
                                                                    <img src={baseImage} alt={item.bracelet.name} className="w-full h-full object-contain" />

                                                                    {/* If no screenshot was saved, render a deterministic overlay preview from stored charm positions */}
                                                                    {canRenderOverlay && item.charms.map((charmInstance) => {
                                                                        const positionIndex = charmPositions?.[charmInstance.id]
                                                                        if (positionIndex === undefined) return null
                                                                        const position = snapPoints[positionIndex]
                                                                        if (!position) return null

                                                                        return (
                                                                            <div
                                                                                key={charmInstance.id}
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
                                                                                    <img
                                                                                        src={getCharmImageUrl(charmInstance.charm)}
                                                                                        alt={charmInstance.charm.name}
                                                                                        className="w-full h-full object-contain drop-shadow-sm"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </>
                                                            )
                                                        }

                                                        return (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Package className="w-12 h-12 text-stone-300" />
                                                            </div>
                                                        )
                                                    })()}
                                                </div>

                                                <div className="p-6">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h5 className="text-lg font-bold text-stone-900">{item.bracelet.name}</h5>
                                                            <p className="text-sm text-stone-500">{item.bracelet.material} • {item.bracelet.color}</p>
                                                        </div>
                                                        <span className="text-lg font-bold text-amber-900">
                                                            €{(item.bracelet.price + item.charms.reduce((sum, c) => sum + c.charm.price, 0)).toFixed(2)}
                                                        </span>
                                                    </div>

                                                    {item.charms.length > 0 && (
                                                        <div className="mt-4 pt-4 border-t border-stone-200">
                                                            <p className="text-xs text-stone-400 mb-3 font-bold uppercase tracking-wide">Included Charms ({item.charms.length})</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {item.charms.map((charmInstance, i) => (
                                                                    <div key={i} className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-stone-200 shadow-sm">
                                                                        <div className="w-6 h-6 relative shrink-0">
                                                                            {/* Simple image check - assumed URL or legacy base64 if not migrated fully yet, though migration is done */}
                                                                            <img
                                                                                src={charmInstance.charm.image_url || '/placeholder.png'}
                                                                                alt={charmInstance.charm.name}
                                                                                className="w-full h-full object-contain"
                                                                            />
                                                                        </div>
                                                                        <span className="text-sm font-medium text-stone-700">{charmInstance.charm.name}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white rounded-3xl border border-stone-100 shadow-xl">
                        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Package className="w-10 h-10 text-amber-300" />
                        </div>
                        <h3 className="text-xl font-bold text-stone-900 mb-2">{t('orders.empty')}</h3>
                        <p className="text-stone-500 mb-8 max-w-sm mx-auto">{t('orders.empty.desc')}</p>
                        <Link
                            href="/charms"
                            className="inline-flex items-center gap-2 bg-amber-400 text-amber-950 px-6 py-3 rounded-xl font-medium shadow-lg shadow-amber-200/50 hover:bg-amber-500 transition-all transform hover:scale-105"
                        >
                            {t('orders.shop_now')} <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

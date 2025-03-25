// app/ui/price-history/search-result-card.tsx
'use client';

import { useState } from 'react';
import { CardDetails } from "@/app/lib/card-data";
import { formatCurrency } from "@/app/lib/utils";
import SimpleCardImage from "@/app/ui/card-image/simple-card-image";
import PriceHistoryModal from "@/app/ui/price-history/price-history-modal";
import { ChevronRightIcon, EyeIcon } from '@heroicons/react/24/outline';

interface SearchResultCardProps {
    card: CardDetails;
    isSelected: boolean;
    onSelect: (selected: boolean) => void;
}

export default function SearchResultCard({
    card,
    isSelected,
    onSelect
}: SearchResultCardProps) {
    const [isPriceHistoryOpen, setIsPriceHistoryOpen] = useState(false);

    // Card image URL (using Scryfall URLs from the card data)
    const cardImageUrl = card.image_uris?.small || 'public/card_back.jpg';

    // format date helper
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // determine rarity color for badge
    const getRarityColor = (rarity: string | undefined) => {
        if (!rarity) return 'bg-zinc-100 text-zinc-800';

        switch(rarity.toLowerCase()) {
            case 'mythic': return 'bg-amber-100 text-amber-800';
            case 'rare': return 'bg-yellow-100 text-yellow-800';
            case 'uncommon': return 'bg-blue-100 text-blue-800';
            default: return 'bg-zinc-100 text-zinc-800';
        }
    };

    return (
        <>
            <div 
                className={`p-5 rounded-xl border relative overflow-hidden transition-all duration-300 ease-in-out card
                    ${isSelected ? 'border-blue-400 shadow-md ring-1 ring-blue-200' : 'border-zinc-200'}`}
            >
                {/* Color spill overlay with improved animation */}
                <div
                    className={`absolute inset-0 bg-blue-50 transition-transform duration-500 ease-out origin-top-left
                        ${isSelected ? 'translate-x-0 opacity-70' : 'translate-x-[-100%] opacity-0'}`}
                    style={{ zIndex: 0 }}
                ></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-start gap-5">
                    {/* Checkbox for selection with improved styling */}
                    <div className="flex items-start pt-1">
                        <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500"
                            checked={isSelected}
                            onChange={(e) => onSelect(e.target.checked)}
                            id={`select-card-${card.card_key}`}
                        />
                    </div>

                    {/* Card Image */}
                    <div className="flex-shrink-0">
                        <SimpleCardImage
                            imageUrl={cardImageUrl}
                            cardName={card.name}
                            width={146}
                            height={204}
                            className="rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                        />
                    </div>

                    {/* Card Details with improved typography */}
                    <div className="flex-grow space-y-3">
                        <div>
                            <h3 className="font-semibold text-xl text-zinc-900 mb-1 leading-tight">{card.name}</h3>

                            <div className="flex flex-wrap gap-2 items-center text-sm text-zinc-600 mb-2">
                                <span>{card.set_name} ({card.set?.toUpperCase()})</span>
                                <span className="text-zinc-400">•</span>
                                <span>#{card.collector_number}</span>
                                
                                {card.rarity && (
                                    <>
                                        <span className="text-zinc-400">•</span>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRarityColor(card.rarity)}`}>
                                            {card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}
                                        </span>
                                    </>
                                )}
                                
                                {card.released_at && (
                                    <>
                                        <span className="text-zinc-400">•</span>
                                        <span>Released {formatDate(card.released_at)}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Card Type and Oracle Text with improved styling */}
                        <div className="space-y-2">
                            <div className="text-sm font-medium text-zinc-800">{card.type_line}</div>
                            <div className="text-sm text-zinc-700 line-clamp-2 italic">{card.oracle_text}</div>
                        </div>

                        {/* Price Information with enhanced styling */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                            {card.prices?.usd && (
                                <div className="bg-zinc-50 p-3 rounded-lg shadow-sm border border-zinc-100">
                                    <div className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Regular</div>
                                    <div className="font-medium text-zinc-900">{formatCurrency(parseFloat(card.prices.usd))}</div>
                                </div>
                            )}

                            {card.prices?.usd_foil && (
                                <div className="bg-gradient-to-br from-zinc-50 to-blue-50 p-3 rounded-lg shadow-sm border border-blue-100">
                                    <div className="text-xs uppercase tracking-wider text-blue-500 font-medium">Foil</div>
                                    <div className="font-medium text-zinc-900">{formatCurrency(parseFloat(card.prices.usd_foil))}</div>
                                </div>
                            )}
                            
                            {card.prices?.usd_etched && (
                                <div className="bg-gradient-to-br from-zinc-50 to-purple-50 p-3 rounded-lg shadow-sm border border-purple-100">
                                    <div className="text-xs uppercase tracking-wider text-purple-500 font-medium">Etched</div>
                                    <div className="font-medium text-zinc-900">{formatCurrency(parseFloat(card.prices.usd_etched))}</div>
                                </div>
                            )}

                            {/* View Details Button with proper button styling */}
                            <div className="bg-zinc-50 p-3 rounded-lg shadow-sm border border-zinc-100 hover:bg-white hover:shadow transition-all duration-200">
                                <button
                                    onClick={() => setIsPriceHistoryOpen(true)}
                                    className="w-full h-full flex items-center justify-center text-blue-600 hover:text-blue-800 text-sm font-medium gap-1.5"
                                >
                                    <EyeIcon className="h-4 w-4" />
                                    View Details
                                    <ChevronRightIcon className="h-3 w-3 opacity-70" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Price History Modal */}
            <PriceHistoryModal
                setCode={card.set || ''}
                collectorNumber={card.collector_number || ''}
                isOpen={isPriceHistoryOpen}
                onClose={() => setIsPriceHistoryOpen(false)}
            />
        </>                    
    );
}
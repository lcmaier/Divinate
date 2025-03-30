// app/ui/price-history/search-result-card.tsx
'use client';

import { useState, useEffect } from 'react';
import { CardDetails } from "@/app/lib/card-data";
import { formatCurrency } from "@/app/lib/utils";
import SimpleCardImage from "@/app/ui/card-image/simple-card-image";
import PriceHistoryModal from "@/app/ui/price-history/price-history-modal";
import { EyeIcon, ClockIcon } from '@heroicons/react/24/outline';

interface SearchResultCardProps {
    card: CardDetails;
    isSelected: boolean;
    onSelect: (selected: boolean) => void;
}

interface FinishPrice {
    type: string;
    price: number;
    daysStale: number;
}

export default function SearchResultCard({
    card,
    isSelected,
    onSelect
}: SearchResultCardProps) {
    const [isPriceHistoryOpen, setIsPriceHistoryOpen] = useState(false);
    const [allFinishes, setAllFinishes] = useState<FinishPrice[]>([]);
    const [isLoadingFinishes, setIsLoadingFinishes] = useState(false);

    // Card image URL (using Scryfall URLs from the card data)
    const cardImageUrl = card.image_uris?.small || card.image_uris?.normal || "/card_back.jpeg";

    // Format date helper
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Calculate days stale with proper timezone handling for 00:00:00 timestamps
    const getDaysStale = (dateString: string) => {
        if (!dateString) return 0;
        
        // Parse the date string
        const priceDate = new Date(dateString);
        
        // Get today's date at 00:00:00 in the local timezone
        const today = new Date();
        const todayAtMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        // Calculate difference in milliseconds
        const diffTime = todayAtMidnight.getTime() - priceDate.getTime();
        
        // Convert to days and ensure positive value
        return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    };

    // Get color for staleness indicator based on days
    const getStalenessColor = (days: number) => {
        if (days <= 2) return "text-amber-500"; // Yellow for 1-2 days
        if (days <= 6) return "text-orange-500"; // Orange for 3-6 days
        return "text-red-500"; // Red for 7+ days
    };

    // Fetch all available finishes on initial render
    useEffect(() => {
        const fetchAllFinishes = async () => {
            if (!card.set || !card.collector_number) return;
            
            setIsLoadingFinishes(true);
            try {
                // Use a longer time period to ensure we catch all possible finishes
                const response = await fetch(
                    `/api/price-history?setCode=${card.set.toLowerCase()}&collectorNumber=${card.collector_number}&days=180&finish=all`
                );
                
                if (!response.ok) {
                    throw new Error('Failed to fetch price history');
                }
                
                const data = await response.json();
                
                // Process all finishes and their data
                const finishes: FinishPrice[] = [];
                
                // Add current prices directly from card.prices if available
                if (card.prices?.usd) {
                    finishes.push({
                        type: 'nonfoil',
                        price: parseFloat(card.prices.usd),
                        daysStale: 0
                    });
                }
                
                if (card.prices?.usd_foil) {
                    finishes.push({
                        type: 'foil',
                        price: parseFloat(card.prices.usd_foil),
                        daysStale: 0
                    });
                }
                
                if (card.prices?.usd_etched) {
                    finishes.push({
                        type: 'etched',
                        price: parseFloat(card.prices.usd_etched),
                        daysStale: 0
                    });
                }
                
                // Handle each finish type from price history
                Object.entries(data.priceHistory).forEach(([finishType, pricePoints]) => {
                    // Skip if we already have current data for this finish
                    if (
                        (finishType === 'nonfoil' && card.prices?.usd) ||
                        (finishType === 'foil' && card.prices?.usd_foil) ||
                        (finishType === 'etched' && card.prices?.usd_etched)
                    ) {
                        return;
                    }
                    
                    // Skip if no price points available
                    if (!pricePoints || !Array.isArray(pricePoints) || pricePoints.length === 0) {
                        return;
                    }
                    
                    // Get the most recent price point
                    const sortedPoints = [...pricePoints].sort((a, b) => {
                        return new Date(b.date).getTime() - new Date(a.date).getTime();
                    });
                    
                    const latestPoint = sortedPoints[0];
                    const daysStale = getDaysStale(latestPoint.date.toString());
                    
                    finishes.push({
                        type: finishType,
                        price: latestPoint.price,
                        daysStale: daysStale
                    });
                });
                
                setAllFinishes(finishes);
                
            } catch (error) {
                console.error('Error fetching finishes:', error);
            } finally {
                setIsLoadingFinishes(false);
            }
        };
        
        fetchAllFinishes();
    }, [card.set, card.collector_number]);

    // Determine the grid layout based on number of items
    const getGridColumns = () => {
        const totalItems = allFinishes.length + 1; // +1 for the View Details button
        if (totalItems <= 2) return "grid-cols-1 md:grid-cols-2";
        if (totalItems === 3) return "grid-cols-1 md:grid-cols-3";
        return "grid-cols-1 md:grid-cols-4";
    };

    return (
        <>
            <div 
                className={`p-5 rounded-lg border relative overflow-hidden transition-all duration-300 ease-in-out
                    ${isSelected ? 'border-blue-400 shadow-md' : 'border-gray-200 shadow-sm'}`}
            >
                {/* Color spill overlay */}
                <div
                    className={`absolute inset-0 bg-blue-50 transition-transform duration-500 ease-out origin-top-left
                        ${isSelected ? 'translate-x-0 opacity-70' : 'translate-x-[-100%] opacity-0'}`}
                    style={{ zIndex: 0 }}
                ></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-start gap-5">
                    {/* Checkbox for selection */}
                    <div className="flex items-start pt-1">
                        <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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
                            className="rounded-lg shadow-md"
                        />
                    </div>

                    {/* Card Details */}
                    <div className="flex-grow">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">{card.name}</h3>

                        <div className="flex flex-wrap gap-2 items-center text-sm text-gray-600 mb-2">
                            <span>{card.set_name} ({card.set?.toUpperCase()})</span>
                            <span className="text-gray-400">•</span>
                            <span>#{card.collector_number}</span>
                            
                            {card.rarity && (
                                <>
                                    <span className="text-gray-400">•</span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        {card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}
                                    </span>
                                </>
                            )}
                            
                            {card.released_at && (
                                <>
                                    <span className="text-gray-400">•</span>
                                    <span>Released {formatDate(card.released_at)}</span>
                                </>
                            )}
                        </div>

                        {/* Card Type and Oracle Text */}
                        <div className="mb-3">
                            <div className="text-sm font-medium">{card.type_line}</div>
                            <div className="text-sm text-gray-700 line-clamp-2 italic">{card.oracle_text}</div>
                        </div>

                        {/* Price Information - With all available finishes */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
                            {/* Loading State */}
                            {isLoadingFinishes ? (
                                <div className="col-span-full flex items-center justify-center p-3 bg-gray-50 rounded-lg">
                                    <div className="animate-pulse flex space-x-2 items-center">
                                        <div className="h-3 w-3 bg-blue-400 rounded-full"></div>
                                        <div className="h-3 w-3 bg-blue-400 rounded-full"></div>
                                        <div className="h-3 w-3 bg-blue-400 rounded-full"></div>
                                        <span className="text-sm text-gray-500">Loading prices...</span>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Render each available finish */}
                                    {allFinishes.map(finish => {
                                        let bgColor = "bg-gray-50";
                                        let textColor = "text-gray-500";
                                        let label = "Regular";
                                        
                                        if (finish.type === 'foil') {
                                            bgColor = "bg-gradient-to-r from-gray-50 to-blue-50";
                                            textColor = "text-blue-500";
                                            label = "Foil";
                                        } else if (finish.type === 'etched') {
                                            bgColor = "bg-gradient-to-r from-gray-50 to-purple-50";
                                            textColor = "text-purple-500";
                                            label = "Etched";
                                        }
                                        
                                        return (
                                            <div key={finish.type} className={`${bgColor} p-3 rounded-lg shadow-sm border border-gray-100`}>
                                                <div className={`text-xs uppercase tracking-wider ${textColor} font-medium flex items-center justify-between`}>
                                                    <span>{label}</span>
                                                    {finish.daysStale > 0 && (
                                                        <span className={`flex items-center ${getStalenessColor(finish.daysStale)} font-medium`}>
                                                            <ClockIcon className="h-3 w-3 mr-1" />
                                                            {finish.daysStale}d
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="font-medium text-gray-900">
                                                    {formatCurrency(finish.price)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    
                                    {/* View Details Button - Always present */}
                                    <div>
                                        <button
                                            onClick={() => setIsPriceHistoryOpen(true)}
                                            className="w-full h-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-blue-600 hover:text-blue-800 bg-gray-50 rounded-lg border border-gray-100 shadow-sm hover:bg-white transition-colors duration-200"
                                        >
                                            <EyeIcon className="h-4 w-4" />
                                            View Details
                                        </button>
                                    </div>
                                </>
                            )}
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
// app/ui/price-history/search-result-card-v2.tsx
'use client';

import { useState } from "react";
import { CardDetails } from "@/app/lib/card-data";
import { formatCurrency } from "@/app/lib/utils";
import SimpleCardImage from "@/app/ui/card-image/simple-card-image";
import { CardDetailsPanel } from "../card-details/card-details-panel";
import { EyeIcon, ClockIcon } from '@heroicons/react/24/outline';
import { getPaletteFromColorIdentity } from "@/app/lib/color-identities";
import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { beleren } from '@/app/ui/fonts';

interface SearchResultCardProps {
    card: CardDetails;
    isSelected: boolean;
    onSelect: (selected: boolean) => void;
}

interface FinishPrice {
    type: string;
    price: number | null;
    daysStale: number
}

export default function SearchResultCard({
    card,
    isSelected,
    onSelect
}: SearchResultCardProps) {
    const [isPriceHistoryOpen, setIsPriceHistoryOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Get color palette based on card's color identity
    const palette = getPaletteFromColorIdentity(card.color_identity || []);

    // Card image url using Scryfall URLs from data, showing only front face for double-sided cards
    let cardImageUrl = card.image_uris?.small || card.image_uris?.normal || '/card_back.jpg';
    if (card.card_faces && card.card_faces.length === 2) {
        cardImageUrl = card.card_faces[0].image_uris?.small || card.card_faces[0].image_uris?.normal || '/card_back.jpg';
    } 

    // Format date helper
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // get prices for all finishes
    const finishes: FinishPrice[] = [];

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

    // Get color for staleness indicator based on days
    const getStalenessColor = (days: number) => {
        if (days <= 2) return "text-amber-500"; // yellow for 1-2 days
        if (days <= 6) return "text-orange-500"; // orange for 3-6 days
        return "text-red-500"; // red for 7+ days
    };

    // Get finish display name
    const getFinishDisplayName = (type: string) => {
        switch(type) {
            case 'nonfoil': return 'Regular';
            case 'foil': return 'Foil';
            case 'etched': return 'Etched';
            default: return type.charAt(0).toUpperCase() + type.slice(1);
        }
    };

    // Get background color for price boxes based on finish type
    const getFinishBgColor = (type: string) => {
        switch(type) {
            case 'nonfoil': return `${palette.primary}20`;
            case 'foil': return `${palette.secondary}20`;
            case 'etched': return `${palette.muted}30`;
            default: return 'bg-gray-50';
        }
    };

    return (
        <Card
            className={`relative overflow-hidden transition-all duration-300 ease-in-out hover:shadow-md p-3 ${isSelected ? 'ring-2' : 'ring-0'}`}
            style={{
                borderColor: isSelected ? palette.primary : palette.border,
                backgroundColor: isHovered ? `${palette.light}50` : 'white',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <CardContent className="p-0">
                <div className="flex items-center">
                    {/* Selection checkbox */}
                    <div className="mr-3">
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => onSelect(Boolean(checked))}
                            id={`select-card-${card.card_key}`}
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                    </div>

                    {/* Card Image */}
                    <div className="shrink-0 mr-4">
                        <SimpleCardImage
                            imageUrl={cardImageUrl}
                            cardName={card.name}
                            width={80}
                            height={112}
                            className="rounded-lg shadow-sm transition-transform duration-300 hover:scale-105"
                        />
                    </div>

                    {/* Card Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col">
                            {/* Card Title and Set Info */}
                            <div className="flex items-baseline gap-2 mb-1">
                                <h3 
                                    className={`${beleren.className} text-base font-semibold truncate`}
                                    style={{ color: palette.text.primary }}
                                >
                                    {card.name}
                                </h3>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <span>{card.set?.toUpperCase()}</span>
                                    <span>•</span>
                                    <span>#{card.collector_number}</span>
                                    {card.rarity && (
                                        <Badge
                                            variant="outline"
                                            className="text-xs font-medium h-5 px-1.5"
                                            style={{
                                                backgroundColor: `${palette.secondary}15`,
                                                borderColor: `${palette.secondary}30`,
                                                color: palette.dark
                                            }}
                                        >
                                            {card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Card Type */}
                            <p className="text-xs mb-2 truncate" style={{ color: palette.text.secondary }}>
                                {card.type_line}
                            </p>
                            
                            {/* Price Boxes and Details Button */}
                            <div className="flex items-center flex-wrap gap-2 mt-1">
                                {finishes.map(finish => (
                                    <div
                                        key={finish.type}
                                        className="rounded px-2 py-1 flex items-center"
                                        style={{ backgroundColor: getFinishBgColor(finish.type) }}
                                    >
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-xs font-medium" style={{ color: palette.text.secondary }}>
                                                {getFinishDisplayName(finish.type)}:
                                            </span>
                                            <span
                                                className="text-sm font-semibold"
                                                style={{ color: palette.text.primary }}
                                            >
                                                {formatCurrency(finish.price || 0)}
                                            </span>
                                            {finish.daysStale > 0 && (
                                                <div className={`flex items-center text-xs ${getStalenessColor(finish.daysStale)}`}>
                                                    <ClockIcon className="h-3 w-3 mr-0.5" />
                                                    <span>{finish.daysStale}d</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                
                                <button
                                    onClick={() => setIsPriceHistoryOpen(true)}
                                    className="flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium rounded border"
                                    style={{
                                        color: palette.text.primary,
                                        borderColor: palette.border,
                                    }}
                                >
                                    <EyeIcon className="h-3.5 w-3.5" />
                                    Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>

            {/* Card Details Modal Panel */}
            {isPriceHistoryOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm overflow-y-auto"
                    onClick={() => setIsPriceHistoryOpen(false)}
                >
                    <div    
                        className="w-full max-w-6xl relative my-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button section */}
                        <div className="relative bg-white rounded-xl overflow-hidden shadow-2xl">
                            <button 
                                onClick={() => setIsPriceHistoryOpen(false)}
                                className="absolute top-2 right-2 z-20 text-gray-500 hover:text-gray-700 bg-white/10 hover:bg-white rounded-full p-2 shadow-sm transition-all duration-200" 
                                aria-label="Close modal"
                            >
                                <X size={20} strokeWidth={2} />
                            </button>
                            <CardDetailsPanel card={card} />
                        </div>
                    </div>
                </div>
            )}
        </Card>
    )
}

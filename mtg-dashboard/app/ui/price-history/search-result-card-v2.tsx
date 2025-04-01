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
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
            className={`relative overflow-hidden transition-all duration-300 ease-in-out hover:shadow-md ${isSelected ? 'ring-2' : 'ring-0'}`}
            style={{
                borderColor: isSelected ? palette.primary : palette.border,
                backgroundColor: isHovered ? `${palette.light}50` : 'white',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Selection checkbox */}
            <div className="absolute top-4 left-4 z-10">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelect(Boolean(checked))}
                    id={`select-card-${card.card_key}`}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
            </div>

            <div className="flex flex-col md:flex-row">
                {/* Card Image Column */}
                <div className="md:w-1/4 lg:w-1/5 p-4 flex justify-center md:justify-start">
                    <div className="relative group">
                        <SimpleCardImage
                            imageUrl={cardImageUrl}
                            cardName={card.name}
                            width={146}
                            height={204}
                            className="rounded-lg shadow-md transition-transform duration-300 group-hover:scale-105"
                        />
                    </div>
                </div>

                {/* Content Column */}
                <div className="md:w-3/4 lg:w-4/5 p-4 pt-0 md:pt-4 flex flex-col">
                    {/* Card Header with Name, Set, Rarity */}
                    <CardHeader className="p-0 pb-2">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                            <div>
                                <CardTitle
                                    className={`text-xl font-bold ${beleren.className}`}
                                    style={{ color: palette.text.primary }}
                                >
                                    {card.name}
                                </CardTitle>
                                <CardDescription className="flex flex-wrap items-center gap-1 text-sm">
                                    <span>{card.set_name} ({card.set?.toUpperCase()})</span>
                                    <span style={{ color: palette.muted }}>•</span>
                                    <span>#{card.collector_number}</span>

                                    {card.rarity && (
                                        <>
                                            <span style={{ color: palette.muted }}>•</span>
                                            <Badge
                                                variant="outline"
                                                className="text-xs font-medium px-2 py-0"
                                                style={{
                                                    backgroundColor: `${palette.secondary}15`,
                                                    borderColor: `${palette.secondary}30`,
                                                    color: palette.dark
                                                }}
                                            >
                                                {card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}
                                            </Badge>
                                        </>
                                    )}

                                    {card.released_at && (
                                        <>
                                            <span style={{ color: palette.muted }}>•</span>
                                            <span className="text-sm" style={{ color: palette.text.secondary }}>Released {formatDate(card.released_at)}</span>
                                        </>
                                    )}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    {/* Card Type and Oracle Text */}
                    <div className="mb-3">
                        <div
                            className="text-sm font-medium"
                            style={{ color: palette.text.primary }}
                        >
                            {card.type_line}
                        </div>
                        <div
                            className="text-sm italic line-clamp-2 mt-1"
                            style={{ color: palette.text.secondary }}
                        >
                            {card.oracle_text}
                        </div>
                    </div>

                    {/* Price Information */}
                    <div className="mt-auto pt-3">
                        <div className="flex flex-wrap gap-3">
                            {/* Price boxes for each finish */}
                            {finishes.map(finish => (
                                <div
                                    key={finish.type}
                                    className="rounded-md shadow-sm p-2 flex items-center gap-3"
                                    style={{ backgroundColor: getFinishBgColor(finish.type) }}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium" style={{ color: palette.text.secondary }}>
                                            {getFinishDisplayName(finish.type)}
                                        </span>
                                        <span
                                            className="text-lg font-semibold"
                                            style={{ color: palette.text.primary }}
                                        >
                                            {formatCurrency(finish.price || 0)}
                                        </span>
                                        {finish.daysStale > 0 && (
                                            <div className={`flex items-center text-xs ${getStalenessColor(finish.daysStale)}`}>
                                                <ClockIcon className="h-3 w-3 mr-1" />
                                                <span>{finish.daysStale}d ago</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* View details button */}
                            <button
                                onClick={() => setIsPriceHistoryOpen(true)}
                                className="h-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 bg-gray-50 rounded-lg border border-gray-100 shadow-sm hover:bg-white transition-colors duration-200"
                                style={{
                                    color: palette.text.primary,
                                }}
                            >
                                <EyeIcon className="h-4 w-4" />
                                View Card Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>

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
                                className="absolute top-4 right-4 z-20 text-gray-500 hover:text-gray-700 bg-white/30 hover:bg-white rounded-full p-2 shadow-sm transition-all duration-200" 
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

// app/ui/card-details/card-details-panel.tsx
'use client';

import { useState } from "react";
import { PriceHistoryChart } from "@/app/ui/price-history/price-chart-v2";
import SimpleCardImage from "../card-image/simple-card-image";
import { CardDetails } from "@/app/lib/card-data";
import { usePriceChartData } from "@/app/hooks/usePriceChartData";
import { RawPricePoint } from "@/app/lib/price-types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { beleren } from '@/app/ui/fonts';
import { formatCurrency } from "@/app/lib/utils";
import { getPaletteFromColorIdentity, ColorPalette, colorlessPalette } from "@/app/lib/color-identities";
import FlippableCardImage from "../card-image/flippable-card-image";

interface CardDetailsPanelProps {
    card: CardDetails;
    priceData: RawPricePoint[];
}

export function CardDetailsPanel({
    card,
   priceData,
}: CardDetailsPanelProps) {
    // Use the hook to transform API data
    const { chartData, availableFinishes } = usePriceChartData(
        priceData,
        ['nonfoil', 'foil', 'etched'] // get as many finishes as are available
    );

    // State for tracking current face and whether to show back face (double-sided cards only)
    const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
    const [showBackFace, setShowBackFace] = useState(false);

    // Handler for flipping the card
    const handleCardFlip = () => {
        setShowBackFace(!showBackFace);
        setCurrentFaceIndex(showBackFace ? 0 : 1); // Toggle the current face index
    };

    // detection for double-faced
    const isDoubleFaced = Array.isArray(card.card_faces) && card.card_faces.length === 2;

    const currentFace = isDoubleFaced 
      ? card.card_faces![currentFaceIndex] 
      : null;

    // Get the correct image URLs and card data based on whether it's double-faced
    const cardImageUrls = isDoubleFaced && card.card_faces
    ? {
        front: {
        small: card.card_faces[0].image_uris?.small,
        normal: card.card_faces[0].image_uris?.normal,
        large: card.card_faces![0].image_uris?.large,
        },
        back: {
        small: card.card_faces[1].image_uris?.small,
        normal: card.card_faces[1].image_uris?.normal,
        large: card.card_faces[1].image_uris?.large,
        }
    }
    : {
        small: card.image_uris?.small,
        normal: card.image_uris?.normal,
        large: card.image_uris?.large,
    };

    // Get the actual image URLs for display
    const displayImageUrl = isDoubleFaced
    ? (currentFaceIndex === 0 ? cardImageUrls.front?.normal : cardImageUrls.back?.normal)
    : cardImageUrls.normal;

    const displayName = isDoubleFaced ? currentFace!.name : card.name;
    const displayTypeLine = isDoubleFaced ? currentFace!.type_line : card.type_line;
    const displayOracleText = isDoubleFaced ? currentFace!.oracle_text : card.oracle_text;


    // Get image URLs
    const smallImageURL = card.image_uris?.normal;
    const largeImageURL = card.image_uris?.large;

    // Grab the latest prices for quick reference
    const latestPrices = {
        nonfoil: card.prices?.usd ? parseFloat(card.prices.usd) : null,
        foil: card.prices?.usd_foil ? parseFloat(card.prices.usd_foil) : null,
        etched: card.prices?.usd_etched ? parseFloat(card.prices.usd_etched) : null,
    };

    // Get color palette based on card's color identity
    const palette = getPaletteFromColorIdentity(card.color_identity || []);

    return (
        <Card 
            className="overflow-hidden relative"
            style={{
                borderColor: palette.border,
                backgroundColor: `${palette.primary}20`,
                boxShadow: `0 1px 3px 0 ${palette.muted}40`
            }}
        >
            {/* Card Header with Name and Set Info */}
            <CardHeader 
                className="pb-3 border-b w-full"
                style={{
                    borderColor: palette.border,
                    //background: palette.header,
                    position: 'relative',
                }}
            >
                <div
                    className="absolute inset-0 z-0"
                    //style={{ background: palette.header }}
                />

                <div className="relative z-10 w-full">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle 
                                className={`text-2xl font-bold ${beleren.className}`}
                                style={{ color: palette.text.primary }}
                            >
                                {card.name}
                            </CardTitle>
                            <CardDescription 
                                className="flex items-center gap-2 text-sm"
                                style={{ color: palette.text.secondary }}
                            >
                                <span>{card.set_name} ({card.set?.toUpperCase()})</span>
                                <span style={{ color: palette.muted }}>•</span>
                                <span>#{card.collector_number}</span>
                                {card.rarity && (
                                    <>
                                        <span style={{ color: palette.muted }}>•</span>
                                        <span 
                                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                            style={{
                                                backgroundColor: `${palette.secondary}30`,
                                                color: palette.dark
                                            }}
                                        >
                                            {card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}
                                        </span>
                                    </>
                                )}
                            </CardDescription>
                        </div>

                        {/* Quick Prices Reference */}
                        <div className="hidden md:flex gap-3">
                        {latestPrices.nonfoil && (
                                <div 
                                    className="text-center px-3 py-1 rounded-md"
                                    style={{ backgroundColor: `${palette.primary}20` }}
                                >
                                    <div className="text-xs font-medium" style={{ color: palette.dark }}>Regular</div>
                                    <div className="font-semibold" style={{ color: palette.text.primary }}>
                                        {formatCurrency(latestPrices.nonfoil)}
                                    </div>
                                </div>
                            )}
                            {latestPrices.foil && (
                                <div 
                                    className="text-center px-3 py-1 rounded-md"
                                    style={{ backgroundColor: `${palette.secondary}20` }}
                                >
                                    <div className="text-xs font-medium" style={{ color: palette.dark }}>Foil</div>
                                    <div className="font-semibold" style={{ color: palette.text.primary }}>
                                        {formatCurrency(latestPrices.foil)}
                                    </div>
                                </div>
                            )}
                            {latestPrices.etched && (
                                <div 
                                    className="text-center px-3 py-1 rounded-md"
                                    style={{ backgroundColor: `${palette.muted}30` }}
                                >
                                    <div className="text-xs font-medium" style={{ color: palette.dark }}>Etched</div>
                                    <div className="font-semibold" style={{ color: palette.text.primary }}>
                                        {formatCurrency(latestPrices.etched)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardHeader>

            {/* Main Content Area */}
            <CardContent 
                className="pt-6 px-6"
                style={{ backgroundColor: palette.panel.background }}
            >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Left Column - Card Image and Oracle Text */}
                    <div className="md:col-span-4">
                        <div className="flex flex-col items-center gap-6">

                            {/* Card Image (with double-sided support) */}
                            <div className="flex justify-center">
                                {isDoubleFaced ? (
                                    <FlippableCardImage
                                        frontImageUrl={cardImageUrls.front?.normal || ''}
                                        backImageUrl={cardImageUrls.back?.normal || ''}
                                        frontCardName={card.card_faces![0].name}
                                        backCardName={card.card_faces![1].name}
                                        width={244}
                                        height={340}
                                        showBackFace={showBackFace}
                                        onFlip={handleCardFlip}
                                    />
                                ) : (
                                    smallImageURL ? (
                                        <SimpleCardImage
                                            imageUrl={smallImageURL}
                                            cardName={card.name}
                                            width={244}
                                            height={300}
                                        />
                                    ) : (
                                        <SimpleCardImage
                                            imageUrl="card_back.jpeg"
                                            cardName="Unknown"
                                            width={244}
                                            height={340}
                                        />
                                    )
                                )}
                            </div>

                            {/* Oracle Text Section - Now below the card image on mobile, next to it on desktop */}
                            {(displayTypeLine || displayOracleText) && (
                                <div 
                                    className="w-full p-4 rounded-lg shadow-inner"
                                    style={{
                                        backgroundColor: `${palette.light}80`,
                                        borderColor: palette.border,
                                        borderWidth: '1px'
                                    }}
                                >
                                    {displayTypeLine && (
                                        <p 
                                            className="font-semibold text-sm mb-2 pb-2 border-b"
                                            style={{
                                                borderColor: `${palette.border}80`,
                                                color: palette.text.primary
                                            }}
                                        >
                                            {displayTypeLine}
                                        </p>
                                    )}
                                    {displayOracleText && (
                                        <div 
                                            className="oracle-text text-sm"
                                            style={{ color: palette.text.primary }}
                                        >
                                            {displayOracleText.split('\n').map((paragraph, idx) => (
                                                <p key={idx} className="mb-2">{paragraph}</p>
                                            ))}
                                        </div>
                                    )}
                                    {card.loyalty && (
                                        <div 
                                            className="mt-2 text-right font-bold"
                                            style={{ color: palette.text.primary }}
                                        >
                                            {card.loyalty}
                                        </div>
                                    )}
                                    {card.power && card.toughness && (
                                        <div
                                            className="mt-2 text-right font-bold"
                                            style={{ color: palette.text.primary }}
                                        >
                                            {card.power}/{card.toughness}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Price History Chart */}
                    <div className="md:col-span-8">
                        <PriceHistoryChart
                            data={chartData}
                            finishesToShow={availableFinishes}
                            title="Price History"
                            subtitle={""}
                            colorPalette={palette}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
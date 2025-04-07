// app/ui/card-comparison/card-comparison-panel.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { CardDetails } from "@/app/lib/card-data";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SimpleCardImage from "../card-image/simple-card-image";
import FlippableCardImage from "../card-image/flippable-card-image";
import { beleren } from '@/app/ui/fonts';
import { usePriceChartData } from "@/app/hooks/usePriceChartData";
import { RawPricePoint } from "@/app/lib/price-types";
import { getPaletteFromColorIdentity, ColorPalette } from "@/app/lib/color-identities";
import { CardFinish, FinishType } from "@/app/lib/card-constants";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { MultiCardPriceChart } from "./multi-card-price-chart";

interface CardComparisonPanelProps {
    cards: CardDetails[];
    startDate?: string;
    endDate?: string;
    days?: number;
}

type FinishString = { 'usd': string, 'usd_foil': string, 'usd_etched': string };

export default function CardComparisonPanel({
    cards,
    startDate,
    endDate,
    days = 90
}: CardComparisonPanelProps) {
    // Calculate default dates if not provided
    const effectiveEndDate = endDate || new Date().toISOString().split('T')[0];
    const effectiveStartDate = startDate || (() => {
        const date = new Date();
        date.setDate(date.getDate() - (days || 90));
        return date.toISOString().split('T')[0];
    })(); // extra parens are calling the arrow function we just defined and assigning the *output* to effectiveStartDate

    // States
    const [activeCardIndex, setActiveCardIndex] = useState(0);
    const [showBackFace, setShowBackFace] = useState(false);
    const [cardPriceData, setCardPriceData] = useState<Record<string, RawPricePoint[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [activeFinish, setActiveFinish] = useState<CardFinish>('nonfoil');

    // get the active card
    const activeCard = cards[activeCardIndex] || null;

    // Get color palette for UI elements based on active card
    const uiPalette = useMemo(() =>
        activeCard ? getPaletteFromColorIdentity(activeCard.color_identity || []) : null,
    [activeCard]);

    // load price data for all selected cards
    useEffect(() => {
        const fetchAllCardPrices = async () => {
            setIsLoading(true);

            const priceDataMap: Record<string, RawPricePoint[]> = {};

            // create promises for all fetches
            const fetchPromises = cards.map(async card => {
                if (!card.set || !card.collector_number) return;

                try {
                    // build query with date parameters
                    const dateParams = startDate || endDate
                    ? `startDate=${effectiveStartDate}&endDate=${effectiveEndDate}`
                    : `days=${days}`;

                    const response = await fetch(
                        `/api/price-history?setCode=${card.set.toLowerCase()}&collectorNumber=${card.collector_number}&${dateParams}&finish=all`
                    );

                    if (!response.ok) return;

                    const data = await response.json();

                    // convert api response into RawPricePoint list
                    const rawPricePoints: RawPricePoint[] = [];

                    // process all finishes from response
                    Object.entries(data.priceHistory).forEach(([finish, points]) => {
                        if (Array.isArray(points)) {
                            (points as any[]).forEach(point => {
                                rawPricePoints.push({
                                    _id: `${finish}-${point.date}`,
                                    card_key: card.card_key,
                                    date: point.date,
                                    price: point.price,
                                    finish: finish as CardFinish,
                                    source: 'scryfall',
                                });
                            });
                        }
                    });

                    // add current prices if no history exists but we have current prices
                    if (rawPricePoints.length === 0 && card.prices) {
                        const now = new Date().toISOString();

                        if (card.prices.usd) {
                            rawPricePoints.push({
                                _id: `nonfoil-${now}`,
                                card_key: card.card_key,
                                date: now,
                                price: parseFloat(card.prices.usd),
                                finish: 'nonfoil',
                                source: 'scryfall'
                              });                   
                        }

                        if (card.prices.usd_foil) {
                            rawPricePoints.push({
                                _id: `foil-${now}`,
                                card_key: card.card_key,
                                date: now,
                                price: parseFloat(card.prices.usd_foil),
                                finish: 'foil',
                                source: 'scryfall'
                              });                   
                        }

                        if (card.prices.usd_etched) {
                            rawPricePoints.push({
                                _id: `etched-${now}`,
                                card_key: card.card_key,
                                date: now,
                                price: parseFloat(card.prices.usd_etched),
                                finish: 'etched',
                                source: 'scryfall'
                              });                   
                        }
                    }

                    // store price data for this card
                    priceDataMap[card.card_key] = rawPricePoints;
                } catch (err) {
                    console.error(`Error fetching price data for ${card.name}:`, err);
                }
            });

            // fetch all the data
            await Promise.all(fetchPromises);

            setCardPriceData(priceDataMap);
            setIsLoading(false);
        };

        if (cards.length > 0) {
            fetchAllCardPrices();
        } 
    }, [cards, startDate, endDate, days]);

    // navigate to next card
    const goToNextCard = () => {
        setActiveCardIndex(prev => (prev + 1) % cards.length);
        setShowBackFace(false); // reset to front face when switching cards
    };

    // navigate to previous card
    const goToPrevCard = () => {
        setActiveCardIndex(prev => (prev - 1 + cards.length) % cards.length);
        setShowBackFace(false); // reset to front face when switching cards
    };

    // toggle card face for double-sided cards
    const toggleCardFace = () => {
        setShowBackFace(prev => !prev);
    };

    // handle active finish changes
    const handleFinishChange = (finish: CardFinish) => {
        setActiveFinish(finish);
    };

    // If no cards, show empty state
    if (cards.length === 0) {
        return (
            <Card className="p-8 text-center">
                <CardTitle className="mb-4">No Cards Selected</CardTitle>
                <CardDescription>Select cards to compare their prices and details</CardDescription>
            </Card>
        );
    }

    // load critical card images on initialization, lazy load the rest
    useEffect(() => {
        // Function to get image URL for a card
        const getImageUrl = (card: CardDetails | undefined) => {
            if (!card) return null;
            
            const isDoubleFaced = Array.isArray(card.card_faces) && card.card_faces.length === 2;
            
            if (isDoubleFaced && card.card_faces) {
            return [
                card.card_faces[0].image_uris?.normal,
                card.card_faces[1].image_uris?.normal
            ].filter(Boolean);
            } else {
            return card.image_uris?.normal ? [card.image_uris.normal] : [];
            }
        };

        // immediately preload active and adjacent cards
        const preloadAdjacentCards = () => {
            if (cards.length === 0) return;


            const prevIndex = (activeCardIndex - 1 + cards.length) % cards.length;
            const nextIndex = (activeCardIndex + 1) % cards.length;

            const priorityCards = [
                cards[prevIndex],
                cards[activeCardIndex],
                cards[nextIndex]
            ];

            // create Image objects to trigger preloading
            priorityCards.forEach(card => {
                const imageUrls = getImageUrl(card);
                if (!imageUrls) return;
                imageUrls.forEach(url => {
                    if (url) {
                        const img = new Image();
                        img.src = url;
                    }
                });
            });
        };

        // Lazily load the rest in the background
        const lazyLoadRemainingCards = () => {
            if (cards.length <= 3) return; // Skip if we already loaded all cards
            
            // Get indices that we haven't preloaded yet
            const remainingIndices = Array.from({ length: cards.length }, (_, i) => i)
            .filter(i => 
                i !== activeCardIndex && 
                i !== (activeCardIndex - 1 + cards.length) % cards.length && 
                i !== (activeCardIndex + 1) % cards.length
            );
            
            // Load these in the background with a small delay
            let currentIndex = 0;
            
            const loadNext = () => {
            if (currentIndex >= remainingIndices.length) return;
            
            const cardIndex = remainingIndices[currentIndex];
            const imageUrls = getImageUrl(cards[cardIndex]);
            if (!imageUrls) return;
            
            imageUrls.forEach(url => {
                if (url) {
                const img = new Image();
                img.src = url;
                }
            });
            
            currentIndex++;
            setTimeout(loadNext, 150); // Load one card every 150ms to avoid network congestion
            };
            
            // Start the lazy loading process after a short delay
            setTimeout(loadNext, 500);
        };

        // Execute the preloading strategy
        preloadAdjacentCards();
        lazyLoadRemainingCards();
    }, [activeCardIndex, cards]);

    // determine if active card is double-faced
    const isDoubleFaced = activeCard &&
                            Array.isArray(activeCard.card_faces) &&
                            activeCard.card_faces.length === 2;

    // get current face data for active card (non double faced cards have no card_faces property)
    const currentFace = isDoubleFaced && showBackFace && activeCard?.card_faces
        ? activeCard.card_faces[1]
        : (isDoubleFaced && activeCard?.card_faces ? activeCard.card_faces[0] : null);
    
    // extract display data based on card face
    const displayName = currentFace ? currentFace.name : activeCard?.name || '';
    const displayTypeLine = currentFace ? currentFace.type_line : activeCard?.type_line || '';
    const displayOracleText = currentFace ? currentFace.oracle_text : activeCard?.oracle_text || '';
    const displayPower = currentFace ? currentFace.power : activeCard?.power;
    const displayToughness = currentFace ? currentFace.toughness : activeCard?.toughness;
    const displayLoyalty = currentFace ? currentFace.loyalty : activeCard?.loyalty;

    return (
        <Card
            className="overflow-hidden relative"
            style={uiPalette ? {
                borderColor: uiPalette.border,
                backgroundColor: `${uiPalette.primary}10`,
            } : {}}
        >
            {/* Card Header */}
            <CardHeader className="pb-3 border-b">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle
                            className={`text-2xl font-bold ${beleren.className}`}
                            style={uiPalette ? { color: uiPalette.text.primary } : {}}
                        >
                            Comparing {cards.length} Cards
                        </CardTitle>
                        <CardDescription>
                            Viewing card {activeCardIndex + 1} of {cards.length}
                        </CardDescription>
                    </div>

                    {/* Finish Type Selector */}
                    <div className="hidden md:flex gap-2">
                        {['nonfoil', 'foil', 'etched'].map((finish) => {
                            // Only show finishes that have data for at least one card
                            const hasFinishData = cards.some(card => {
                                const finish_str = `usd${finish === 'nonfoil' ? '' : '_' + finish}` as keyof typeof card.prices;
                                return card.prices && card.prices[finish_str];
                        });

                            if (!hasFinishData) return null;

                            return (
                                <Button
                                    key={finish}
                                    variant={activeFinish === finish ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleFinishChange(finish as CardFinish)}
                                    style={activeFinish === finish && uiPalette ? {
                                        backgroundColor: uiPalette.primary,
                                        borderColor: uiPalette.primary,
                                    } : {}}
                                >
                                    {finish === 'nonfoil' ? 'Regular' : finish.charAt(0).toUpperCase() + finish.slice(1)}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column - Card Gallery */}
                    <div className="lg:col-span-4">
                        <div className="flex flex-col items-center gap-6">
                            {/* Card Image with Navigation */}
                            <div className="relative flex justify-center w-full">
                                {/* Previous Card Button */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-0 top-1/2 transform -translate-y-1/2 h-10 w-10 bg-white/80 hover:bg-white shadow-md z-10"
                                    onClick={goToPrevCard}
                                    aria-label="Previous card"
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </Button>

                                {/* Card Image */}
                                <div className="flex justify-center">
                                {isDoubleFaced && activeCard.card_faces && activeCard.card_faces[0].image_uris && activeCard.card_faces[0].image_uris.normal && activeCard.card_faces[1].image_uris && activeCard.card_faces[1].image_uris.normal ? (
                                    <FlippableCardImage
                                    frontImageUrl={activeCard.card_faces[0].image_uris?.normal}
                                    backImageUrl={activeCard.card_faces[1].image_uris?.normal}
                                    frontCardName={activeCard?.card_faces?.[0].name || ''}
                                    backCardName={activeCard?.card_faces?.[1].name || ''}
                                    width={244}
                                    height={340}
                                    showBackFace={showBackFace}
                                    onFlip={toggleCardFace}
                                    />
                                ) : activeCard.image_uris && activeCard.image_uris?.normal ? (
                                    <SimpleCardImage
                                    imageUrl={activeCard.image_uris?.normal}
                                    cardName={activeCard?.name || ''}
                                    width={244}
                                    height={340}
                                    className="rounded-lg shadow-md"
                                    />
                                ) : (
                                    <div 
                                    className="w-[244px] h-[340px] bg-gray-100 rounded-lg flex items-center justify-center"
                                    style={uiPalette ? { backgroundColor: `${uiPalette.light}80` } : {}}
                                    >
                                    <span className="text-gray-400">No image</span>
                                    </div>
                                )}
                                </div>

                                {/* Next Card Button */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-1/2 transform -translate-y-1/2 h-10 w-10 bg-white/80 hover:bg-white shadow-md z-10"
                                    onClick={goToNextCard}
                                    aria-label="Next card"
                                >
                                    <ChevronRight className="h-6 w-6" />
                                </Button>
                            </div>

                            {/* Card Navigation Dots */}
                            <div className="flex gap-2 justify-center">
                                {cards.map((_, index) => (
                                <button
                                    key={index}
                                    className={`h-2.5 w-2.5 rounded-full transition-all ${
                                    index === activeCardIndex 
                                        ? 'bg-blue-600 scale-110' 
                                        : 'bg-gray-300 hover:bg-gray-400'
                                    }`}
                                    onClick={() => setActiveCardIndex(index)}
                                    style={index === activeCardIndex && uiPalette ? { backgroundColor: uiPalette.primary } : {}}
                                    aria-label={`Go to card ${index + 1}`}
                                />
                                ))}
                            </div>

                            {/* Card Details */}
                            <div
                                className="w-full p-4 rounded-lg shadow-inner"
                                style={uiPalette ? {
                                    backgroundColor: `${uiPalette.light}80`,
                                    borderColor: uiPalette.border,
                                    borderWidth: '1px'
                                } : { backgroundColor: 'rgba(249, 250, 251, 0.8' }}
                            >
                                {activeCard && (
                                    <>
                                        {/* Card Info */}
                                        <div 
                                            className="flex items-baseline gap-2 mb-2 pb-2 border-b" 
                                            style={uiPalette ? { borderColor: `${uiPalette.border}80` } : {}}
                                        >
                                            <h3 className="font-semibold" style={uiPalette ? { color: uiPalette.text.primary } : {}}>
                                                {displayName}
                                            </h3>
                                            <span className="text-xs text-gray-500">
                                                {activeCard.set_name} ({activeCard.set?.toUpperCase()}) • #{activeCard.collector_number}
                                            </span>
                                        </div>

                                        {/* Type Line */}
                                        {displayTypeLine && (
                                        <p 
                                            className="font-semibold text-sm mb-2"
                                            style={uiPalette ? { color: uiPalette.text.primary } : {}}
                                        >
                                            {displayTypeLine}
                                        </p>
                                        )}
                                        
                                        {/* Oracle Text */}
                                        {displayOracleText && (
                                        <div 
                                            className="oracle-text text-sm"
                                            style={uiPalette ? { color: uiPalette.text.primary } : {}}
                                        >
                                            {displayOracleText.split('\n').map((paragraph, idx) => (
                                            <p key={idx} className="mb-2">{paragraph}</p>
                                            ))}
                                        </div>
                                        )}
                                        
                                        {/* Power/Toughness or Loyalty */}
                                        {displayLoyalty && (
                                        <div 
                                            className="mt-2 text-right font-bold"
                                            style={uiPalette ? { color: uiPalette.text.primary } : {}}
                                        >
                                            {displayLoyalty}
                                        </div>
                                        )}
                                        {displayPower && displayToughness && (
                                        <div
                                            className="mt-2 text-right font-bold"
                                            style={uiPalette ? { color: uiPalette.text.primary } : {}}
                                        >
                                            {displayPower}/{displayToughness}
                                        </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Price Chart */}
                    <div className="lg:col-span-8">
                        <MultiCardPriceChart
                            cards={cards}
                            cardPriceData={cardPriceData}
                            activeCardKey={activeCard?.card_key || ''}
                            isLoading={isLoading}
                            activeFinish={activeFinish}
                            startDate={effectiveStartDate}
                            endDate={effectiveEndDate}
                            days={days}
                            onCardSelect={(index) => {
                                setActiveCardIndex(index);
                                setShowBackFace(false); // reset to front face when switching cards
                            }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
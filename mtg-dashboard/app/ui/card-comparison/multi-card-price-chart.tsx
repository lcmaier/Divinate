// app/ui/card-comparison/multi-card-price-chart.tsx
'use client';

import { useState, useMemo } from 'react';
import { CardDetails } from "@/app/lib/card-data";
import { RawPricePoint } from "@/app/lib/price-types";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart } from '@/app/ui/core/line-chart';
import { getPaletteFromColorIdentity } from "@/app/lib/color-identities";
import { formatCurrency } from "@/app/lib/utils";
import { TrendingUp, TrendingDown } from 'lucide-react';
import { CardFinish } from '@/app/lib/card-constants';

interface CardColorInfo {
    color: string;
    secondary: string;
    name: string;
    fullName: string;
}  

const MANA_COLORS = {
    'W': '#E9D7B7', // White - cream color
    'U': '#0E68AB', // Blue - medium blue
    'B': '#2D2A2C', // Black - dark gray
    'R': '#D32029', // Red - bright red
    'G': '#00733D', // Green - forest green
    'C': '#A9A9A9'  // Colorless - gray
};

type ColorKey = keyof typeof MANA_COLORS;

// Define fallback sets for each color (5 variations each)
const COLOR_FALLBACKS = {
    'W': ['#E9D7B7', '#F5F0E1', '#D8C9A3', '#C4B48C', '#B0A175'],
    'U': ['#0E68AB', '#1A8FE3', '#3178C6', '#4595D0', '#7FBCE9'],
    'B': ['#2D2A2C', '#3D3A3C', '#4D4A4C', '#5D5A5C', '#6D6A6C'],
    'R': ['#D32029', '#E74C3C', '#C0392B', '#F05545', '#A93226'],
    'G': ['#00733D', '#27AE60', '#2ECC71', '#58D68D', '#82E0AA'],
    'C': ['#A9A9A9', '#BDC3C7', '#D5DBDB', '#7F8C8D', '#95A5A6'],
};

interface MultiCardPriceChartProps {
    cards: CardDetails[];
    cardPriceData: Record<string, RawPricePoint[]>;
    activeCardKey: string;
    isLoading: boolean;
    activeFinish: CardFinish;
    startDate?: string;
    endDate?: string;
    days?: number;
    onCardSelect: (index: number) => void;
  }

export function MultiCardPriceChart({
    cards,
    cardPriceData,
    activeCardKey,
    isLoading,
    activeFinish,
    startDate,
    endDate,
    days = 90,
    onCardSelect
}: MultiCardPriceChartProps) {
    // Generate a unique id for each card to use in the chart
    const cardColorMap = useMemo(() => {
        // keep track of already used colors to handle collisions
        const usedColors = new Map<string, number>();
        
        return cards.slice(0, 6).reduce((acc: Record<string, CardColorInfo>, card, index) => {
            // Determine base color from card's color identity
            let colorKey: keyof typeof COLOR_FALLBACKS;
            let baseColor;

            if (!card.color_identity || card.color_identity.length === 0) {
                colorKey = 'C';
            } else if (card.color_identity.length === 1) {
                colorKey = card.color_identity[0] as ColorKey;
            } else {
                // If multiple colors, pick the one least used so far
                let leastUsedColor = card.color_identity[0];
                card.color_identity.forEach(color => {
                    if (!usedColors.has(color)) {
                        usedColors.set(color, 0);
                    }

                    const currentCount = usedColors.get(color) || 0;
                    const leastCount = usedColors.get(leastUsedColor) || 0;

                    if (currentCount < leastCount) {
                        leastUsedColor = color;
                    }
                });
                colorKey = leastUsedColor as ColorKey;
            };

            // count how many times this color has been used to select proper fallback
            const colorCount = usedColors.get(colorKey) || 0;
            usedColors.set(colorKey, colorCount + 1);

            // get the right color from the fallback set
            if (colorCount < COLOR_FALLBACKS[colorKey].length) {
                baseColor = COLOR_FALLBACKS[colorKey][colorCount];
            } else {
                // if we've exhausted the fallback set, use the last one
                baseColor = COLOR_FALLBACKS[colorKey][COLOR_FALLBACKS[colorKey].length - 1];
            }
            
            if (card.card_key && card.color_identity) {
                acc[card.card_key] = {
                    color: baseColor,
                    secondary: getPaletteFromColorIdentity(card.color_identity).secondary,
                    name: card.name.split(' // ')[0], // Use first face name for double-faced cards
                    fullName: card.name
                };
            };
              
              return acc;          
        }, {});
    }, [cards]);

    // Process price data into chart-friendly format, filter by date range provided
    const { chartData, trends } = useMemo(() => {
        // If data is loading or empty, return empty arrays
        if (isLoading || Object.keys(cardPriceData).length === 0) {
            return { chartData: [], trends: {} };
        }

        // calculate date range for filter
        const dateRange = {
            start: startDate ? new Date(startDate) : (() => {
                const date = new Date();
                date.setDate(date.getDate() - days);
                return date;
            }),
            end: endDate ? new Date(endDate) : new Date()
        };

        // Collect all dates from all cards
        const allDates = new Set<string>();
        const finishData: Record<string, Record<string, number>> = {};

        // initialize trend data store for all cards
        const trendData: Record<string, {
            first: number | null;
            last: number | null;
            min: number;
            max: number;
            avg: number;
            count: number;
            sum: number;
        }> = {};

        // first pass, collect all dates and organize data by card
        Object.entries(cardPriceData).forEach(([cardKey, prices]) => {
            // filter for active finish type and date range
            const cardFinishPrices = prices.filter(price => {
                if (price.finish !== activeFinish) return false;
                if (dateRange.start || dateRange.end) {
                    const priceDate = typeof price.date === 'string'
                        ? new Date(price.date)
                        : price.date;
                    
                    if (dateRange.start && priceDate < dateRange.start) return false;
                    if (dateRange.end && priceDate > dateRange.end) return false;
                }

                return true;
            });

            if (cardFinishPrices.length === 0) return;

            // initialize trend data for this card
            trendData[cardKey] = {
                first: null,
                last: null,
                min: Infinity,
                max: -Infinity,
                avg: 0,
                count: 0,
                sum: 0
            };

            // process each price point
            cardFinishPrices.forEach(pricePoint => {
                const dateStr = typeof pricePoint.date === 'string'
                    ? pricePoint.date.split('T')[0]
                    : pricePoint.date.toISOString().split('T')[0];
                
                allDates.add(dateStr);

                // initialize data for this date if needed
                if (!finishData[dateStr]) {
                    finishData[dateStr] = {};
                }

                finishData[dateStr][cardKey] = pricePoint.price;

                // update trend data
                if (trendData[cardKey].first === null) {
                    trendData[cardKey].first = pricePoint.price;
                }
                trendData[cardKey].last = pricePoint.price;
                trendData[cardKey].min = Math.min(trendData[cardKey].min, pricePoint.price);
                trendData[cardKey].max = Math.max(trendData[cardKey].max, pricePoint.price);
                trendData[cardKey].count++;
                trendData[cardKey].sum += pricePoint.price;
            });

            // calculate average
            if (trendData[cardKey].count > 0) {
                trendData[cardKey].avg = trendData[cardKey].sum / trendData[cardKey].count;
            }
        });

        // convert to array of points and sort by date
        const sortedDates = Array.from(allDates).sort();
        const chartDataPoints = sortedDates.map(date => {
            const point: Record<string, any> = { date };

            // add all the card data
            Object.keys(cardPriceData).forEach(cardKey => {
                point[cardKey] = finishData[date]?.[cardKey] || null;
            });

            return point;
        });

        // calc price trends
        const trends: Record<string, {
            change: number;
            percentChange: number;
            isPositive: boolean;
            min: number;
            max: number;
            avg: number;
        }> = {};

        // calculate change values for each card
        Object.entries(trendData).forEach(([cardKey, data]) => {
            if (data.first !== null && data.last != null) {
                const change = data.last - data.first;
                const percentChange = data.first > 0 ? (change / data.first) * 100 : 0;

                trends[cardKey] = {
                    change,
                    percentChange,
                    isPositive: change >= 0,
                    min: data.min === Infinity ? 0 : data.min,
                    max: data.max === -Infinity ? 0 : data.max,
                    avg: data.avg
                };
            }
        });

        return { chartData: chartDataPoints, trends };
    }, [cardPriceData, isLoading, activeFinish, startDate, endDate, days]);

    // generate chart configuration
    const chartConfig = useMemo(() => {
        return cards.reduce((acc, card) => {
            const colorInfo = cardColorMap[card.card_key];

            // for active card, use thicker line
            acc[card.card_key] = {
                label: card.name,
                color: colorInfo.color,
                lineStyle: card.card_key === activeCardKey ? 'solid' : 'dashed',
                lineWidth: card.card_key === activeCardKey ? 3 : 1.5,
                area: card.card_key === activeCardKey
            };

            return acc;
        }, {} as Record<string, any>);
    }, [cards, cardColorMap, activeCardKey]);

    // format date for chart tooltip
    const formatDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Custom tooltip component for the chart
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload || !payload.length) return null;

        return (
            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md">
                <p className="font-semibold text-gray-700 border-b pb-1 mb-2">{formatDate(label)}</p>
                <div className="space-y-1.5">
                    {payload.map((entry: any, index: number) => {
                        if (entry.value === null) return null;

                        const colorInfo = cardColorMap[entry.dataKey];
                        if (!colorInfo) return null;

                        return (
                            <div
                                key={`tooltip-${index}`}
                                className="flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: colorInfo.color }}
                                    />
                                    <span
                                        className={`text-sm ${entry.dataKey === activeCardKey ? 'font-semibold' : ''}`}
                                        style={{ color: entry.dataKey === activeCardKey ? colorInfo.color : 'inherit' }}
                                    >
                                        {colorInfo.name}
                                    </span>
                                </div>
                                <span className="font-medium">{formatCurrency(entry.value)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Loading screen
    if (isLoading) {
        return (
          <Card className="w-full h-full min-h-[400px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500">Loading price data...</p>
            </div>
          </Card>
        );
    }

    // Empty results screen
    if (chartData.length === 0) {
        return (
          <Card className="w-full h-full min-h-[400px] flex items-center justify-center">
            <div className="text-center p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Price Data Available</h3>
              <p className="text-gray-500">Price history could not be loaded for these cards.</p>
            </div>
          </Card>
        );
    }

    return (
        <Card className="w-full h-full">
            <CardContent className="p-4">
                {/* Price Chart */}
                <div className="mb-4">
                    <LineChart
                        data={chartData}
                        dataKeys={cards.map(card => card.card_key)}
                        xAxisKey="date"
                        config={chartConfig}
                        xAxisFormatter={formatDate}
                        yAxisFormatter={(value) => `$${value}`}
                        tooltipContent={<CustomTooltip />}
                        connectNulls={true}
                        isAnimationActive={true}
                        animationDuration={300}
                        showVerticalReferenceLine={true}
                    />
                </div>

                {/* Trend Summary */}
                <div className="grid grid-cols-1 gap-3 mt-6">
                    {cards.map((card, index) => {
                        const trend = trends[card.card_key];
                        if (!trend) return null;

                        const colorInfo = cardColorMap[card.card_key];
                        const isActive = card.card_key === activeCardKey;

                        return (
                            <div
                                key={card.card_key}
                                className={`p-3 rounded-lg border ${isActive ? 'ring-2 shadow-sm' : ''} cursor-pointer transition-all hover:shadow-md`}
                                style={{
                                    borderColor: isActive ? colorInfo.color : undefined,
                                    backgroundColor: isActive ? `${colorInfo.color}08` : undefined
                                }}
                                onClick={() => onCardSelect(index)}
                            >
                                {/* Card Name with Color Indicator */}
                                <div className="flex items-center gap-2 mb-2">
                                    <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: colorInfo.color }}
                                    />
                                        <h4 
                                            className="font-medium truncate"
                                            style={{ color: isActive ? colorInfo.color : 'inherit' }}
                                        >
                                            {card.name}
                                        </h4>
                                        <span className="text-xs text-gray-500">
                                                {card.set_name} ({card.set?.toUpperCase()}) • #{card.collector_number}
                                        </span>
                                    </div>

                                {/* Price Metrics in Row */}
                                <div className="grid grid-cols-4 gap-2">
                                    <div>
                                        <p className="text-xs text-gray-500">Change</p>
                                        <p className={`font-medium flex items-center ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {trend.isPositive ? (
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                        ) : (
                                            <TrendingDown className="h-3 w-3 mr-1" />
                                        )}
                                        {formatCurrency(Math.abs(trend.change))}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Low</p>
                                        <p className="font-medium">{formatCurrency(trend.min)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Avg</p>
                                        <p className="font-medium">{formatCurrency(trend.avg)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">High</p>
                                        <p className="font-medium">{formatCurrency(trend.max)}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
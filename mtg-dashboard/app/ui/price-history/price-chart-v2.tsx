// app/ui/price-history/price-chart-v2.tsx
'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import { LineChart } from '@/app/ui/core/line-chart';
import { colorlessPalette, ColorPalette } from "@/app/lib/color-identities";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

// Define a type for the finish color configuration
interface FinishColorConfig {
    label: string;
    color: string;
  }
  
  // Type for the complete chart colors mapping
  interface ChartColorMap {
    nonfoil: FinishColorConfig;
    foil: FinishColorConfig;
    etched: FinishColorConfig;
    [key: string]: FinishColorConfig; // Allow for other finish types
  }

// Custom tooltip content for price chart
const CustomTooltipContent = ({ 
    active, 
    payload, 
    label, 
    formatter,
    colorMap }: {
        active?: boolean;
        payload?: any[];
        label?: string;
        formatter?: (value: number) => string;
        colorMap: ChartColorMap;
    }) => {
    if (!active || !payload || payload.length === 0 || !label ) { return null; }

    // Tooltip needs its own date formatting
    const formattedDate = formatDate(label);

    return (
        <div className="bg-white/95 backdrop-blur-sm p-3 border border-gray-200 rounded-lg shadow-lg text-sm">
            <p className="font-semibold mb-2 text-gray-800 border-b pb-1.5">{formattedDate}</p>
            <div className="space-y-2.5">
                {payload.map((entry: any, index: number) => {
                    if (entry.value === null || entry.value === undefined) { return null; }

                    const finish = entry.dataKey;
                    const config = colorMap[finish as keyof typeof colorMap];

                    return (
                        <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: entry.stroke || entry.color }}
                                />
                                <span className="text-gray-700">{config?.label || finish}</span>
                            </div>
                            <span className="font-semibold">
                                {formatter ? formatter(entry.value) : entry.value}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Format date as MMM D (e.g., "Jan 1")
const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Legend component to show available finishes with toggle functionality
const Legend = ({ 
    finishes, 
    activeFinishes, 
    toggleFinish, 
    colorMap 
}: {
    finishes: string[],
    activeFinishes: string[],
    toggleFinish: (finish: string) => void,
    colorMap: ChartColorMap,
}) => (
    <div className="flex gap-3 pb-3">
        {finishes.map((finish) => {
            const isActive = activeFinishes.includes(finish);
            const config = colorMap[finish as keyof typeof colorMap];

            // Return a pill button for each finish type that can be toggled on/off
            return (
                <button
                    key={finish}
                    onClick={() => toggleFinish(finish)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all
                        ${isActive
                            ? 'bg-gray-100 shadow-sm border border-gray-200 font-medium hover:bg-gray-200'
                            : 'bg-white/50 text-gray-400 border border-gray-100 hover:border-gray-300'}`}
                >
                    <span
                        className={`w-3 h-3 rounded-full transition-opacity ${!isActive ? 'opacity-50' : ''}`}
                        style={{ backgroundColor: config?.color }}
                    />
                    <span>{config.label}</span>
                </button>
            );
        })}
    </div>
);

interface PriceChartProps {
    data: Array<{
        date: string;
        [finish: string]: any; // Allow for price values by finish type
    }>;
    finishesToShow: string[] // Array of finish types to show
    title: string
    subtitle?: string,
    height?: number, // Optional height for the chart container
    colorPalette?: ColorPalette,
}

export function PriceHistoryChart({
    data, // Required parameter for price history data
    finishesToShow = ['nonfoil', 'foil', 'etched'], // Default to show all finishes
    title = "Price History",
    subtitle = "Latest prices for each finish",
    height = 300, // Default height for the chart container
    colorPalette
}: PriceChartProps) {
    // Stateful logic to manage which finishes are active
    const [activeFinishes, setActiveFinishes] = useState<string[]>(finishesToShow);

    // Toggle function to show/hide specific finish data
    const toggleFinish = (finish: string) => {
        setActiveFinishes(prev => {
            // If finish is active, remove it
            if (prev.includes(finish)) {
                const newFinishes = prev.filter(f => f !== finish);
                // If no finishes are left, default to showing all
                return newFinishes.length > 0 ? newFinishes : prev;
            }
            // otherwise add it to the chart
            return [...prev, finish];
        });
    };

    // set palette
    const palette = colorPalette || colorlessPalette;
    // Create finish-specific colors based on card's palette
    const chartColors: ChartColorMap = {
        nonfoil: {
            label: "Regular",
            color: palette.primary,
        },
        foil: {
            label: "Foil",
            color: palette.secondary,
        },
        etched: {
            label: "Etched",
            color: palette.dark,
        },
    };
    
    // Filter config to only show selected finishes
    const filteredConfig = useMemo(() => {
        return Object.entries(chartColors)
        .filter(([finish]) => finishesToShow.includes(finish))
        .reduce((acc, [finish, config]) => ({ ...acc, [finish]: config }), {});
    }, [finishesToShow, chartColors]);

    const calculateTrends = (data: any[], finishes: string[]) => {
        return finishes.map((finish) => {
            const validData = data.filter(d => d[finish] !== null && d[finish] !== undefined);
            if (validData.length < 2) return { finish, change: null }; // Not enough data to calculate trend
    
            const startPrice = validData[0][finish];
            const endPrice = validData[validData.length - 1][finish];
            const change = endPrice - startPrice;
            const percentChange = (change / startPrice) * 100;
    
            return { finish, change, percentChange };
        });
    };
    
    const priceTrends = useMemo(() => calculateTrends(data, finishesToShow), [data, finishesToShow]);

    const chartBackgroundClass = `chart-bg-${palette.primary.replace('#', '')}`;
    
    // handle empty input data case
    if (!data || data.length === 0) {
        return (
            <Card className="max-w-3xl mx-auto border border-gray-200 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold text-gray-800">{title}</CardTitle>
                    <CardDescription className="text-gray-500">{subtitle}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-[220px] text-gray-400">
                    No price data available
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card className="max-w-3xl mx-auto bg-white/80 backdrop-blur-sm shadow-md border border-gray-100 overflow-hidden">
            <CardHeader className="pb-2 border-b border-gray-125">
                <CardTitle className="text-xl font-bold text-gray-800">{title}</CardTitle>
                <CardDescription className="text-gray-500">{subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                <Legend
                    finishes={finishesToShow}
                    activeFinishes={activeFinishes}
                    toggleFinish={toggleFinish}
                    colorMap={chartColors}
                /> 
                {/* Core Line Chart Component */}
                <LineChart
                    data={data}
                    dataKeys={finishesToShow}
                    xAxisKey="date"
                    config={filteredConfig}
                    activeKeys={activeFinishes}
                    xAxisFormatter={formatDate}
                    yAxisFormatter={(value) => `$${value}`}
                    tooltipContent={
                        <CustomTooltipContent
                            formatter={(value: number) => `$${Number(value).toFixed(2)}`}
                            colorMap={chartColors}
                        />
                    }
                    connectNulls={true}
                    isAnimationActive={true}
                    animationDuration={300}
                    margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                />
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm border-t border-gray-100 pt-3 bg-gray-50/50">
                {priceTrends.map(({ finish, change, percentChange }) => 
                change !== null ? (
                    <div key={finish} className="flex items-center gap-2 font-medium">
                        { change > 0 ? <TrendingUp className="text-emerald-500" size={16} /> : <TrendingDown className="text-rose-500" size={16} />}
                        <span className="flex gap-1.5">
                            <span className="font-semibold" style={{ color: chartColors[finish as keyof typeof chartColors].color }}>
                                {chartColors[finish as keyof typeof chartColors].label}:
                            </span>
                            <span className={change > 0 ? "text-emerald-600" : "text-rose-600"}>
                                {change > 0 ? "+" : "-"}${Math.abs(change).toFixed(2)}
                                <span className="text-gray-500 ml-1.5">
                                    ({percentChange.toFixed(1)}%)
                                </span>
                            </span>
                        </span>
                    </div>
                ) : null
              )}
            </CardFooter>
        </Card>
    );
}
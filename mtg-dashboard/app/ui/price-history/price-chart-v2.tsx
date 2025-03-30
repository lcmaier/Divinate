// app/ui/price-history/price-chart-v2.tsx
'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
  } from "@/components/ui/chart";

  const priceChartConfig = {
    nonfoil: {
        label: "Regular",
        color: "hsl(221, 83%, 53%)", // Blue
    },
    foil: {
        label: "Foil",
        color: "hsl(142, 71%, 45%)", // Green
    },
    etched: {
        label: "Etched",
        color: "hsl(262, 80%, 50%)", // Purple
    },
  } satisfies ChartConfig;

  // custom tooltip content for chart
  const CustomTooltipContent = ({ active, payload, label, formatter }: any) => {
    if (!active || !payload || payload.length === 0) { return null; }

    // Tooltip needs its own date formatting
    const formattedDate = formatDate(label);

    return (
        <div className="bg-white/95 backdrop-blur-sm p-3 border border-gray-200 rounded-lg shadow-lg text-sm">
            <p className="font-semibold mb-2 text-gray-800 border-b pb-1.5">{formattedDate}</p>
            <div className="space-y-2.5">
                {payload.map((entry: any, index: number) => {
                    if (entry.value === null || entry.value === undefined) { return null; }

                    const finish = entry.dataKey;
                    const config = priceChartConfig[finish as keyof typeof priceChartConfig];

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
  const Legend = ({ finishes, activeFinishes, toggleFinish }: {
    finishes: string[],
    activeFinishes: string[],
    toggleFinish: (finish: string) => void
  }) => (
    <div className="flex gap-3 pb-3">
        {finishes.map((finish) => {
            const isActive = activeFinishes.includes(finish);
            const config = priceChartConfig[finish as keyof typeof priceChartConfig];

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
    height?: number // Optional height for the chart container
  }

  export function PriceHistoryChart({
    data, // Required parameter for price history data
    finishesToShow = ['nonfoil', 'foil', 'etched'], // Default to show all finishes
    title = "Price History",
    subtitle = "Latest prices for each finish",
    height = 300 // Default height for the chart container
  }: PriceChartProps) {
    // Stateful logic to manage which finishes are active
    // stateful legend component to toggle finishes
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
    
    // Filter config to only show selected finishes
    const filteredConfig = useMemo(() => {
        return Object.entries(priceChartConfig)
        .filter(([finish]) => finishesToShow.includes(finish))
        .reduce((acc, [finish, config]) => ({ ...acc, [finish]: config }), {}) as ChartConfig;
    }, [finishesToShow]);

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
                /> 
                <ChartContainer config={filteredConfig}>
                    <LineChart
                        accessibilityLayer
                        data={data}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={formatDate}
                        />
                        <YAxis
                            tickFormatter={(value) => `$${value}`}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            width={45}
                            domain={['auto', 'auto']}
                            padding={{ top: 10, bottom: 10 }} // Add padding to avoid cutting off labels
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<CustomTooltipContent
                                formatter={(value: number) => `$${Number(value).toFixed(2)}`} // Format the price value
                            />} // Use the memoized tooltip content
                            //isAnimationActive={false} // Disable animation for performance
                        />


                        {/* Render lines for each selected finish */}
                        {finishesToShow.map((finish) => {
                            // skip if finish is not active or no data
                            if (!activeFinishes.includes(finish) || !data.some(item => item[finish] !== null && item[finish] !== undefined)) {
                                return null;
                            }

                            return (
                                <Line
                                    key={finish}
                                    dataKey={finish}
                                    type="monotone"
                                    stroke={`var(--color-${finish})`}
                                    strokeWidth={2}
                                    connectNulls={true} // Connect lines even if there are null values
                                    // animation properties
                                    isAnimationActive={true}
                                    animationDuration={300}
                                    dot={((props) => {
                                        // handle types safely
                                        if (!props || !props.payload || props.payload[props.dataKey] === null || props.payload[props.dataKey] === undefined) {
                                            return <></>;
                                        }
                                        return (
                                            <circle
                                                cx={props.cx}
                                                cy={props.cy}
                                                r={4} // Radius of the dot
                                                fill={`var(--color-${finish})`} // Use the same color as the line
                                                stroke="white" // Optional: add a white stroke for better visibility
                                                strokeWidth={1}
                                            />
                                        );
                                    })}
                                    activeDot={{
                                        r: 6,
                                        stroke: "white",
                                        strokeWidth: 2,
                                    }}
                                />
                            );
                        })}
                    </LineChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm border-t border-gray-100 pt-3 bg-gray-50/50">
                {priceTrends.map(({ finish, change, percentChange }) => 
                change !== null ? (
                    <div key={finish} className="flex items-center gap-2 font-medium">
                        { change > 0 ? <TrendingUp className="text-emerald-500" size={16} /> : <TrendingDown className="text-rose-500" size={16} />}
                        <span className="flex gap-1.5">
                            <span className="font-semibold" style={{ color: priceChartConfig[finish as keyof typeof priceChartConfig].color }}>
                                {priceChartConfig[finish as keyof typeof priceChartConfig].label}:
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
    )
  }
  
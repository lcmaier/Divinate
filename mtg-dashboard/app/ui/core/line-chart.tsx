// app/ui/charts/core/line-chart.tsx
'use client';

import { useMemo, ReactNode } from 'react';
import { CartesianGrid, Line, LineChart as RechartsLineChart, XAxis, YAxis } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";

export interface LineChartProps {
    // Data configuration
    data: any[];
    dataKeys: string[];
    xAxisKey: string;
    
    // Chart appearance
    height?: number;
    config: ChartConfig;
    activeKeys?: string[];
    backgroundColor?: string;
    
    // Formatting
    xAxisFormatter?: (value: any) => string;
    yAxisFormatter?: (value: any) => string;
    
    // Tooltip customization
    tooltipContent?: ReactNode;
    
    // Animation
    isAnimationActive?: boolean;
    animationDuration?: number;
    
    // Misc options
    connectNulls?: boolean;
    margin?: {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    };
}

export function LineChart({
    // Data configuration
    data,
    dataKeys,
    xAxisKey,
    
    // Chart appearance 
    height = 300,
    config,
    activeKeys,
    backgroundColor = 'transparent',
    
    // Formatting
    xAxisFormatter = (value) => value,
    yAxisFormatter = (value) => value,
    
    // Tooltip customization
    tooltipContent,
    
    // Animation
    isAnimationActive = true,
    animationDuration = 300,
    
    // Misc options
    connectNulls = true,
    margin = { top: 20, right: 30, left: 20, bottom: 5 }
}: LineChartProps) {
    // Filter for only active data keys if specified
    const keysToRender = activeKeys || dataKeys;
    
    // Filter config to only include keys that should be rendered
    const filteredConfig = useMemo(() => {
        return Object.entries(config)
            .filter(([key]) => keysToRender.includes(key))
            .reduce((acc, [key, keyConfig]) => ({ 
                ...acc, 
                [key]: keyConfig 
            }), {}) as ChartConfig;
    }, [config, keysToRender]);

    return (
        <ChartContainer 
            config={filteredConfig}
            style={{ background: backgroundColor }}
        >
            <RechartsLineChart
                accessibilityLayer
                data={data}
                margin={margin}
            >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                    dataKey={xAxisKey}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={xAxisFormatter}
                />
                <YAxis
                    tickFormatter={yAxisFormatter}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={45}
                    domain={['auto', 'auto']}
                    padding={{ top: 10, bottom: 10 }}
                />
                
                {tooltipContent ? (
                    <ChartTooltip
                        cursor={false}
                        content={tooltipContent as any}
                    />
                ) : (
                    <ChartTooltip cursor={false} />
                )}

                {keysToRender.map((dataKey) => {
                    // Only render lines for valid data
                    if (!data.some(item => item[dataKey] !== null && item[dataKey] !== undefined)) {
                        return null;
                    }

                    return (
                        <Line
                            key={dataKey}
                            dataKey={dataKey}
                            type="monotone"
                            stroke={`var(--color-${dataKey})`}
                            strokeWidth={2}
                            connectNulls={connectNulls}
                            isAnimationActive={isAnimationActive}
                            animationDuration={animationDuration}
                            dot={{
                                r: 4,
                                fill: `var(--color-${dataKey})`,
                                stroke: "white",
                                strokeWidth: 1,
                            }}
                            activeDot={{
                                r: 6,
                                stroke: "white",
                                strokeWidth: 2,
                            }}
                        />
                    );
                })}
            </RechartsLineChart>
        </ChartContainer>
    );
}
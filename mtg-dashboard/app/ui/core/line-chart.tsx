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
    showVerticalReferenceLine?: boolean;
    maxXAxisLabels?: number;
}

export function LineChart({
    // Data configuration
    data,
    dataKeys,
    xAxisKey,
    
    // Chart appearance 
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
    margin = { top: 20, right: 30, left: 20, bottom: 5 },
    showVerticalReferenceLine=true,
    maxXAxisLabels = 10
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
                <CartesianGrid 
                    vertical={false} 
                    strokeDasharray="3 3"
                    //stroke="rgba(0,0,0,0.1)"
                />
                <XAxis
                    dataKey={xAxisKey}
                    allowDataOverflow={true}
                    interval={Math.ceil(data.length / maxXAxisLabels)}
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
                        cursor={showVerticalReferenceLine ? {
                            stroke: "rgba(0,0,0,1)",
                            strokeDasharray: "3 3",
                            strokeWidth: 2.5
                        }: false}
                        content={tooltipContent as any}
                        
                    />
                ) : (
                    <ChartTooltip cursor={false} />
                )}

                {keysToRender.map((dataKey) => {
                    // Only render lines for valid data
                    const dataPointsForKey = data.filter(
                        item => item[dataKey] !== null && item[dataKey] !== undefined
                    );

                    if (dataPointsForKey.length === 0) return null;

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
                            dot={false}
                            activeDot={{
                                r: 6,
                            }}
                        />
                    );
                })}
            </RechartsLineChart>
        </ChartContainer>
    );
}
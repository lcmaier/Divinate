// app/hooks/usePriceChartData.ts
import { useMemo } from "react";
import { RawPricePoint, PriceHistoryData, ChartDataPoint } from "@/app/lib/price-types";

export function usePriceChartData(
    rawPriceData: RawPricePoint[],
    finishesToShow: string[] = ['nonfoil', 'foil', 'etched']
) {
    // transform raw data
    const { priceHistoryByFinish, chartData, availableFinishes } = useMemo(() => {
        // initializing result objects
        const priceHistoryByFinish: PriceHistoryData = {};
        const dateMap = new Map<string, ChartDataPoint>();
        const finishesWithData = new Set<string>();

        // iterate over each point in the raw data
        rawPriceData.forEach(point => {
            // Skip if finish type not in our target list
            if (!finishesToShow.includes(point.finish)) return;

            // Initialize the array for this point's finish if it's not already in priceHistoryByFinish
            if (!priceHistoryByFinish[point.finish]) {
                priceHistoryByFinish[point.finish] = [];
            }

            // Add the current point to the corresponding finish history
            priceHistoryByFinish[point.finish].push({
                date: point.date,
                price: point.price
            });

            // Record that this finish has data (so we can hide the finishes that don't)
            finishesWithData.add(point.finish);

            // Normalize date format (drop the timestamp and just keep YYYY-MM-DD)
            const dateStr = typeof point.date === 'string'
                ? point.date.split('T')[0]
                : new Date(point.date).toISOString().split('T')[0];
            
            // Initialize or update date in chart data (for display purposes)
            if (!dateMap.has(dateStr)) {
                dateMap.set(dateStr, { date: dateStr });
            }

            // Add price for this finish to chart data point
            const entry = dateMap.get(dateStr)!;
            entry[point.finish] = point.price;
        });

        // After iterating through raw data, convert date map to sorted array for chart data
        const sortedChartData = Array.from(dateMap.values())
            .sort((a, b) => a.date.localeCompare(b.date));
        
        // Filter to only finishes that have data
        const availableFinishes = finishesToShow
            .filter(finish => finishesWithData.has(finish));
        
        return {
            priceHistoryByFinish,
            chartData: sortedChartData,
            availableFinishes
        };
    }, [rawPriceData, finishesToShow]);

    return { chartData, priceHistoryByFinish, availableFinishes };
}
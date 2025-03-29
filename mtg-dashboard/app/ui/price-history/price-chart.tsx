// Modified PriceChart component with responsive sizing and conditional scrolling

import { useEffect, useState, useMemo, useRef } from "react";
import { PriceDataPoint, CardDetails } from "@/app/lib/card-data";
import { FinishType } from "@/app/lib/card-constants";
import { beleren } from '../fonts';
import { formatCurrency } from "@/app/lib/utils";
import HoverableCardImage from "../card-image/hoverable-card-image";

interface PriceChartProps {
    card: CardDetails | null;
    priceHistory: { [key: string]: PriceDataPoint[] };
    selectedFinish: FinishType;
    timeRange?: number;
}

// Chart component that displays price history
export default function PriceChart({
    card,
    priceHistory,
    selectedFinish,
    timeRange = 30
}: PriceChartProps) {
    // Setting up graceful handling when we can't grab an image for a card
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 200 });
    const [shouldScroll, setShouldScroll] = useState(false);

    // state variables for tooltip
    interface TooltipPoint {
        date: Date;
        price: number;
        finish: string;
        position: { x: number, y: number };
        [key: string]: any; // need to allow additional properties like PriceDataPoint type
      };
    const [tooltipData, setTooltipData] = useState<TooltipPoint | null>(null);

    const svgRef = useRef<SVGSVGElement>(null);
    
    // Process price history to ensure the format of incoming data from the API is correct
    const processedHistory = useMemo(() => {
        return Object.entries(priceHistory).reduce((acc, [finish, data]) => {
            
            if (!data || !Array.isArray(data)) {
                acc[finish] = [];
                return acc;
            }

            acc[finish] = data.map(point => {
                const dateStr = typeof point.date === 'string' ? point.date : String(point.date);
                const datePart = dateStr.split('T')[0];
                return {
                    ...point,
                    date: new Date(`${datePart}T12:00:00.00Z`),
                    price: typeof point.price === 'number' && isFinite(point.price) ? point.price : 0
                }
            });
            return acc;
        }, {} as { [key: string]: PriceDataPoint[] });
    }, [priceHistory]);

    
    const filteredHistory = useMemo(() => {
        // Calculate cutoff date based on number of days
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - timeRange);
        cutoffDate.setHours(0, 0, 0, 0);

        // filter each finish's data
        return Object.entries(processedHistory).reduce<{ [key: string]: PriceDataPoint[]}>((filtered, [finish, dataPoints]) => {
            filtered[finish] = dataPoints.filter(point =>
                point.date instanceof Date && point.date >= cutoffDate
            );
            return filtered;
        }, {})

    }, [processedHistory, timeRange]);
  

    // Create a function to get the min/max dates across all data
    const getConsistentDateDomain = () => {
        // Get all dates from all finishes
        const allDates = Object.values(filteredHistory)
        .flat()
        .map(point => point.date.getTime());
        
        if (allDates.length === 0) {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        return [thirtyDaysAgo, today];
        }
        
        const minDate = new Date(Math.min(...allDates));
        const maxDate = new Date(Math.max(...allDates));
        
        // Add padding
        const paddedMinDate = new Date(minDate);
        paddedMinDate.setDate(paddedMinDate.getDate() - 1);
        
        const paddedMaxDate = new Date(maxDate);
        paddedMaxDate.setDate(paddedMaxDate.getDate() + 1);
        
        return [paddedMinDate, paddedMaxDate];
    };
  
  // Calculate once and use consistently
  const [minDate, maxDate] = useMemo(() => getConsistentDateDomain(), [filteredHistory]);
  const timeRangeDuration = maxDate.getTime() - minDate.getTime();


    // Get an array of all available finishes that have data
    const availableFinishes = useMemo(() => {
        return Object.entries(filteredHistory)
            .filter(([_, data]) => data && data.length > 0)
            .map(([finish, _]) => finish);
    }, [filteredHistory]);

    // memoize the image to prevent flickering on swap
    const CardImage = useMemo(() => {
        if (!card || !card.image_uris) return null;

        const smallImageUrl = card.image_uris?.normal || card.image_uris?.small;
        const largeImageUrl = card.image_uris?.large || card.image_uris?.normal;

        if (!smallImageUrl) return null;

        return (
            <div className="mb-4 md:mb-0 transition-opacity duration-300">
                <HoverableCardImage
                    smallImageUrl={smallImageUrl}
                    largeImageUrl={largeImageUrl}
                    cardName={card.name}
                    size="normal"
                    width={244}
                    height={340}
                />
            </div>
        );
    }, [card?.image_uris, card?.name]);

    
    // For "all" finish, determine which finishes to display based on available data
    const finishesToShow = useMemo(() => { 
        return selectedFinish === 'all' ? availableFinishes : [selectedFinish] 
    }, [selectedFinish, availableFinishes]);

    // Color mapping for the different finishes
    const finishColors = {
        nonfoil: '#3b82fb', // blue
        foil: '#10b981', // green
        etched: '#8b5cf6' // purple
    };

    // Calculate relevant statistical values
    const [stats, setStats] = useState({
        min: 0,
        max: 0,
        avg: 0,
        current: 0,
        change: 0,
        changePercent: 0,
        finishData: {} as Record<string, {
            min: number;
            max: number;
            avg: number;
            current: number;
            change: number;
            changePercent: number;
        }>
    });

    // Memoize statistical calculations to prevent recalculation
    const calculatedStats = useMemo(() => {
        const allStats = {
            min: Number.MAX_VALUE,
            max: 0,
            avg: 0,
            current: 0,
            change: 0,
            changePercent: 0,
            finishData: {} as Record<string, any>
        };

        let totalPoints = 0;
        let sumPrices = 0;
        let hasData = false;

        // Calculate stats for each finish
        finishesToShow.forEach(finish => {
            const finishData = filteredHistory[finish] || [];

            if (finishData.length === 0) return;
            hasData = true;

            const prices = finishData.map(point => point.price);
            // filter out bad price values for safety
            const validPrices = prices.filter(price => typeof price === 'number' && isFinite(price));
            if (validPrices.length === 0) return;

            const min = Math.min(...validPrices);
            const max = Math.max(...validPrices);
            const avg = validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length;
            const current = validPrices[validPrices.length - 1];
            const first = validPrices[0];
            const change = current - first;
            const changePercent = first > 0 ? (change / first) * 100 : 0;

            // Update finish-specific stats
            allStats.finishData[finish] = {
                min, max, avg, current, change, changePercent
            };

            // Update global stats
            allStats.min = Math.min(allStats.min, min);
            allStats.max = Math.max(allStats.max, max);

            // For weighted avg
            sumPrices += avg * finishData.length;
            totalPoints += finishData.length;

            // For main display stats, use the selected finish or the first available one
            if (selectedFinish !== 'all' && finish === selectedFinish) {
                allStats.current = current;
                allStats.change = change;
                allStats.changePercent = changePercent;
            } else if (selectedFinish === 'all' && finish === finishesToShow[0]) {
                allStats.current = current;
                allStats.change = change;
                allStats.changePercent = changePercent;
            }
        });

        // If no data is available, set min to 0 to prevent Number.MAX_VALUE from being used
        if (!hasData || allStats.min === Number.MAX_VALUE) {
            allStats.min = 0;
        }

        // Ensure max is at least slightly larger than min to prevent division by zero
        if (allStats.max <= allStats.min) {
            allStats.max = allStats.min + 1;
        }

        // Calculate weighted avg
        if (totalPoints > 0) {
            allStats.avg = sumPrices / totalPoints;
        }

        return allStats;
    }, [filteredHistory, finishesToShow, selectedFinish]);

    // Update stats state only when calculated stats change
    useEffect(() => {
        setStats(calculatedStats);
    }, [calculatedStats]);

    // Get all data points for all finishes to calculate chart dimensions
    const allDataPoints = useMemo(() => 
        finishesToShow.flatMap(finish => filteredHistory[finish] || []),
    [finishesToShow, filteredHistory]);
    
    // Get all dates for x-axis from all finishes
    const allDates = useMemo(() => {
        return Array.from(
            new Set(
                allDataPoints.map(point => {
                    const pointDate = point.date instanceof Date ? point.date : new Date(point.date)
                    return pointDate.toISOString().split('T')[0];
                })
            )
        ).map(dateStr => new Date(dateStr + 'T12:00:00.00Z')).sort((a, b) => a.getTime() - b.getTime());
    }, [allDataPoints]);

    // Update chart dimensions on resize and initial load
    useEffect(() => {
        const updateChartDimensions = () => {
            if (chartContainerRef.current) {
                const containerWidth = chartContainerRef.current.offsetWidth;
                
                // Determine if we need scrolling based on data density
                // For datasets with many points or wide date ranges, enable scrolling
                const dataPointCount = allDates.length;
                const dateRangeInDays = allDates.length > 1 ? 
                    (allDates[allDates.length - 1].getTime() - allDates[0].getTime()) / (1000 * 60 * 60 * 24) : 0;
                
                // Calculate minimum width needed for the chart
                const minWidthNeeded = Math.max(
                    // Allow at least 40px per data point
                    dataPointCount * 40,
                    // Or at least 15px per day in the date range for sparse datasets
                    dateRangeInDays * 15
                );
                
                // If we need more than the container width (+margin for y-axis), enable scrolling
                const needsScrolling = minWidthNeeded > (containerWidth - 60);
                
                // Set chart width based on scrolling needs
                const chartWidth = needsScrolling ? minWidthNeeded : containerWidth - 60;
                
                setChartDimensions({ width: chartWidth, height: 200 });
                setShouldScroll(needsScrolling);
            }
        };

        // Initial update
        updateChartDimensions();
        
        // Update on window resize
        window.addEventListener('resize', updateChartDimensions);
        return () => {
            window.removeEventListener('resize', updateChartDimensions);
        };
    }, [allDates]);

    if (!card) {
        return (
            <div className="rounded-xl bg-gray-50 p-6">
                <h2 className={`${beleren.className} mb-4 text-xl`}>Card Not Found</h2>
                <p>Sorry, we couldn't find this card. Please check the set code and collector number.</p>
            </div>
        );
    }

    const hasPriceData = finishesToShow.some(finish =>
        filteredHistory[finish] && filteredHistory[finish].length > 0
    );

    if (!hasPriceData) {
        return (
            <div className="rounded-xl bg-gray-50 p-6">
                <h2 className={`${beleren.className} mb-4 text-xl`}>No Price Data</h2>
                <p>No price history available for this card in the selected time period.</p>
            </div>
        );
    }

    // Format dates for display on chart
    const formatDate = (date: Date) => {
        // get local datetime info
        const localDate = new Date(date.getTime());
        // get current date info
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const dateYear = localDate.getFullYear();

        // If we're displaying data across multiple years, we include the year field
        if (dateYear !== currentYear) {
            return localDate.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: '2-digit'
            });
        }

        // if the data is all within this year, omit the year
        return localDate.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
        });
    };
    
    // calculate chart scaling
    const minPrice = stats.min * 0.9; // padding the chart's bottom
    const maxPrice = stats.max * 1.1 // padding the chart's top
    const priceRange = maxPrice - minPrice;

    // Generate price markers for Y-axis
    const generatePriceMarkers = () => {
        const markers = [];
        // Create 5 evenly spaced price markers
        const numMarkers = 5;
        const step = priceRange / (numMarkers - 1);
        
        for (let i = 0; i < numMarkers; i++) {
            const price = minPrice + (step * i);
            // Calculate position from bottom (0) to top (chartHeight)
            const y = chartDimensions.height - ((price - minPrice) / priceRange) * chartDimensions.height;
            markers.push({ price, y });
        }
        
        return markers;
    };

    const priceMarkers = generatePriceMarkers();

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current) return;
      
        const svgRect = svgRef.current.getBoundingClientRect();
        const mouseX = e.clientX - svgRect.left;
        const mouseY = e.clientY - svgRect.top;
        
        // Convert mouse position to chart coordinates
        const chartX = (mouseX / svgRect.width) * chartDimensions.width;
        const chartY = mouseY;
        
        // Find closest data point for each visible finish
        let closestDistance = Infinity;
        let closestPoint: PriceDataPoint = {
            date: new Date(),
            price: 0,
            finish: ""
        };
        let closestFinish = '';
        let foundMatch = false;
      
        finishesToShow.forEach((finish) => {
          const finishData = filteredHistory[finish] || [];
          if (finishData.length === 0) return;
      
          const validDataPoints = finishData.filter(
            point => typeof point.price === 'number' && isFinite(point.price)
          );
      
          validDataPoints.forEach((point, index) => {
            // use dates to determine where points will be 
            const pointX = ((point.date.getTime() - minDate.getTime()) / timeRangeDuration) * chartDimensions.width;
            let pointY;
            if (priceRange <= 0) {
                pointY = chartDimensions.height / 2;
            } else {
                pointY = chartDimensions.height -
                        ((point.price - minPrice) / priceRange) * chartDimensions.height;
                pointY = Math.max(0, Math.min(chartDimensions.height, pointY));
            }

            // calc euclidian distance around every point for the hover element ((x_1-x_0)^2+(y_1-y_0)^2)
            const xDistance = pointX - chartX;
            const yDistance = pointY - chartY;
            const distance = Math.sqrt(xDistance * xDistance + yDistance * yDistance)
            
            // Check if this point is closer than the current closest
            const hoverRadius = 15;
            if (distance < closestDistance && distance < hoverRadius) {
              closestDistance = distance;
              closestPoint = point as PriceDataPoint;
              closestFinish = finish;
              foundMatch = true;
            }
          });
        });
      
        // Update tooltip if we found a close point
        if (foundMatch) {
          // Create a TooltipData object from the PriceDataPoint and other data
            setTooltipData({
                date: closestPoint.date,
                price: closestPoint.price,
                finish: closestFinish,
                position: { 
                x: mouseX, 
                y: mouseY 
                }
            });
        } else {
          setTooltipData(null);
        }
      };
      
      // Add this function to handle mouse leave
      const handleMouseLeave = () => {
        setTooltipData(null);
      };

    return (
        <div className="rounded-xl bg-gray-50 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className={`${beleren.className} mb-2 text-xl md:text-2xl`}>
                        {card.name}
                    </h2>
                    <p className="text-sm text-gray-500 mb-2">
                        {card.set_name} ({card.set?.toUpperCase()}) • #{card.collector_number} • {card.rarity ? card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1) : ''}
                    </p>
                </div>

                {/* Card image*/}
                {card?.image_uris && CardImage}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-md bg-white p-3 shadow-sm">
                    <p className="text-xs text-gray-500">Current</p>
                    <p className="text-lg font-medium">{formatCurrency(stats.current)}</p>
                </div>
                <div className="rounded-md bg-white p-3 shadow-sm">
                    <p className="text-xs text-gray-500">Change</p>
                    <p className={`text-lg font-medium ${stats.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(stats.change)} ({stats.changePercent.toFixed(2)}%)
                    </p>
                </div>
                <div className="rounded-md bg-white p-3 shadow-sm">
                    <p className="text-xs text-gray-500">Low</p>
                    <p className="text-lg font-medium">{formatCurrency(stats.min)}</p>
                </div>
                <div className="rounded-md bg-white p-3 shadow-sm">
                    <p className="text-xs text-gray-500">High</p>
                    <p className="text-lg font-medium">{formatCurrency(stats.max)}</p>
                </div>
            </div>

            <div className="mt-6 relative">
                <div className="flex justify-between items-center mb-4">
                    <h3 className={`${beleren.className} text-lg`}>Price History</h3>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4">
                        {finishesToShow.map(finish => (
                            <div key={finish} className="flex items-center gap-2">
                                <div
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: finishColors[finish as keyof typeof finishColors] }}
                                />
                                <span className="text-sm capitalize">
                                    {finish === 'nonfoil' ? 'Regular' : finish}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chart container with conditional scrolling */}
                <div 
                    ref={chartContainerRef} 
                    className={`relative h-[250px] ${shouldScroll ? 'overflow-x-auto' : ''}`}
                >
                    <div className="flex h-full" style={{ width: shouldScroll ? `${chartDimensions.width + 60}px` : '100%' }}>
                        {/* Y-axis with price markers */}
                        <div className="pr-2 w-16 relative h-full">
                            {priceMarkers.map((marker, index) => (
                                <div 
                                    key={index} 
                                    className="absolute flex items-center"
                                    style={{ 
                                        top: `${marker.y}px`,
                                        right: '8px',
                                        transform: 'translateY(-50%)'
                                    }}
                                >
                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                        {formatCurrency(marker.price)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Chart */}
                        <div className="flex-1 relative">
                            {/* Horizontal grid lines */}
                            {priceMarkers.map((marker, index) => (
                                <div 
                                    key={index} 
                                    className="absolute w-full border-t border-gray-200"
                                    style={{ 
                                        top: `${marker.y}px`,
                                    opacity: 0.5
                                    }}
                                />
                            ))}

                            <svg
                                ref={svgRef}
                                className="w-full"
                                viewBox={`-15 0 ${chartDimensions.width+30} ${chartDimensions.height}`}
                                height={chartDimensions.height}
                                width="100%"
                                preserveAspectRatio="none"
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                            >
                                {/* Draw a line for each finish */}
                                {finishesToShow.map(finish => {
                                    const finishData = filteredHistory[finish] || [];
                                    if (finishData.length === 0) return null;
                                    
                                    // filter for valid data points (removing infinite values/anything non-numeric)
                                    const validDataPoints = finishData.filter(
                                        point => typeof point.price === 'number' && isFinite(point.price)
                                    );

                                    if (validDataPoints.length < 2 ) return null;

                                    // Determine how to generate lines based on the number of data points
                                    let pathD = "";
                                    
                                    // Start the path
                                    validDataPoints.forEach((point, index) => {
                                        // Replace the current x-coordinate calculation with:
                                        const x = ((point.date.getTime() - minDate.getTime()) / timeRangeDuration) * chartDimensions.width;
                                        
                                        // Calculate y value with safety checks
                                        let y;
                                        if (priceRange <= 0) {
                                            y = chartDimensions.height / 2; // fallback to middle if no range present
                                        } else {
                                            y = chartDimensions.height - ((point.price - minPrice) / priceRange) * chartDimensions.height;
                                            // redundant safety check for divide by zero errors
                                            if (!isFinite(y)) y = chartDimensions.height / 2;
                                            y = Math.max(0, Math.min(chartDimensions.height, y));
                                        }
                                        
                                        // Start the path or continue it
                                        if (index === 0) {
                                            pathD = `M ${x},${y}`;
                                        } else {
                                            pathD += ` L ${x},${y}`;
                                        }
                                    });

                                    const color = finishColors[finish as keyof typeof finishColors]

                                    return (
                                        <g key={finish}>
                                            {/* Price line - using path for better rendering */}
                                            <path
                                                d={pathD}
                                                fill="none"
                                                stroke={color}
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />

                                            {/* Data points */}
                                            {validDataPoints.map((point, index) => {
                                                const x = ((point.date.getTime() - minDate.getTime()) / timeRangeDuration) * chartDimensions.width;

                                                let y;
                                                if (priceRange <= 0) {
                                                    y = chartDimensions.height / 2; // fallback to middle if no range
                                                } else {
                                                    const normalized = (point.price - minPrice) / priceRange;
                                                    if (!isFinite(normalized)) {
                                                        y = chartDimensions.height / 2;
                                                    } else {
                                                        y = chartDimensions.height - (normalized * chartDimensions.height);
                                                        y = Math.max(0, Math.min(chartDimensions.height, y));
                                                    }
                                                }

                                                return (
                                                    <circle
                                                        key={`${finish}-${index}`}
                                                        cx={x}
                                                        cy={y}
                                                        r="3"
                                                        fill={color}
                                                    />
                                                );
                                            })}
                                        </g>
                                    );
                                })}
                            </svg>

                            {tooltipData && (
                                 <div 
                                    className="absolute pointer-events-none bg-white border border-gray-200 rounded-md shadow-md p-2 z-50 text-sm"
                                    style={{ 
                                        left: `${tooltipData.position.x}px`, 
                                        top: `${tooltipData.position.y - 10}px`,
                                        transform: 'translate(-50%, -100%)'
                                    }}
                                    ref={(el) => {
                                        // Adjust position if tooltip is cut off at the edges
                                        if (el) {
                                            const rect = el.getBoundingClientRect();
                                            const parent = chartContainerRef.current?.getBoundingClientRect();
                                            
                                            if (parent) {
                                                // Handle right edge overflow
                                                if (rect.right > parent.right - 10) {
                                                    el.style.left = `${tooltipData.position.x - (rect.right - parent.right) - 10}px`;
                                                }
                                                
                                                // Handle left edge overflow
                                                if (rect.left < parent.left + 10) {
                                                    el.style.left = `${tooltipData.position.x + (parent.left - rect.left) + 10}px`;
                                                }
                                            }
                                        }
                                    }}
                                  >
                                    <div className="font-medium">{formatDate(tooltipData.date)}</div>
                                    <div className="flex items-center justify-between gap-3">
                                    <span className="text-gray-600 capitalize">{tooltipData.finish === 'nonfoil' ? 'Regular' : tooltipData.finish}</span>
                                    <span className="font-bold">{formatCurrency(tooltipData.price)}</span>
                                    </div>
                                </div>
                            )}

                            {/* X-axis labels */}
                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                                {allDates.map((date, index) => {
                                    // Calculate proper position based on chart width
                                    const position = ((date.getTime() - minDate.getTime()) / timeRangeDuration) * chartDimensions.width;
                                    
                                    // Show all labels if we have 10 or fewer, otherwise space them out
                                    const showLabel = allDates.length <= 10 || 
                                        index === 0 || 
                                        index === allDates.length - 1 || 
                                        index % Math.ceil(allDates.length / 8) === 0;
                                    
                                    if (!showLabel) return null;

                                    return (
                                        <div 
                                            key={index} 
                                            style={{ 
                                                position: 'absolute', 
                                                left: `${position}px`, 
                                                transform: 'translateX(-50%)' 
                                            }}
                                        >
                                            {formatDate(date)}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


function PriceTooltip({ 
    date, 
    price, 
    finish, 
    position 
  }: { 
    date: string; 
    price: string; 
    finish: string; 
    position: { x: number; y: number }; 
  }) {
    return (
      <div 
        className="absolute pointer-events-none bg-white border border-gray-200 rounded-md shadow-md p-2 z-50 text-sm"
        style={{ 
          left: `${position.x + 15}px`, 
          top: `${position.y - 40}px`,
          transform: 'translate(-50%, -100%)'
        }}
      >
        <div className="font-medium">{date}</div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-600 capitalize">{finish === 'nonfoil' ? 'Regular' : finish}</span>
          <span className="font-bold">{price}</span>
        </div>
      </div>
    );
  }  
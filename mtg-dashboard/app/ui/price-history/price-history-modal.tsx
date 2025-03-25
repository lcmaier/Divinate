// app/ui/price-history/price-history-modal.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import PriceChart from '@/app/ui/price-history/price-chart';
import { PriceDataPoint, CardDetails } from '@/app/lib/card-data';

// Define finish types
type FinishType = 'all' | 'nonfoil' | 'foil' | 'etched';

interface PriceHistoryModalProps {
    setCode: string;
    collectorNumber: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function PriceHistoryModal({
    setCode,
    collectorNumber,
    isOpen,
    onClose
}: PriceHistoryModalProps) {
    const [days, setDays] = useState('30');
    const [finish, setFinish] = useState<FinishType>('all');
    const [isLoading, setIsLoading] = useState(false);
    const [cardData, setCardData] = useState<{
        card: CardDetails | null;
        priceHistory: {
            [key: string]: PriceDataPoint[];
        };
    }>({
        card: null,
        priceHistory: {
            nonfoil: [],
            foil: [],
            etched: []
        }
    });

    // check if a finish has data (for disabling toggle buttons)
    const [availableFinishes, setAvailableFinishes] = useState<FinishType[]>(['all']);
    useEffect(() => {
      if (cardData.priceHistory) {
        const finishesWithData: FinishType[] = ['all'];

        // append each nonempty finish type to this variable
        Object.entries(cardData.priceHistory).forEach(([finish, data]) => {
          if (data && Array.isArray(data) && data.length > 0) {
            finishesWithData.push(finish as FinishType);
          }
        });

        // update for disabling empty finish buttons
        setAvailableFinishes(finishesWithData);

        // if currently selected finish has no data, switch to all
        if (!finishesWithData.includes(finish) && finish !== 'all') {
          setFinish('all');
        }
      }
    }, [cardData.priceHistory, finish]);

    // Use key to detect when data changes, but not when finish changes
    const dataKey = `${setCode}-${collectorNumber}-${days}`;

    // Memoize just the card data to prevent unnecessary re-renders
    const memoizedCardData = useMemo(() => {
        return cardData;
    }, [cardData]); // Only re-create when cardData changes


    // Fetch price history when modal opens (initial load only)
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            if (!isOpen || !setCode || !collectorNumber) return;

            setIsLoading(true);
            try {
                const response = await fetch(
                    `/api/price-history?setCode=${setCode.toLowerCase()}&collectorNumber=${collectorNumber}&days=${days}&finish=all`
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch price data');
                }

                const data = await response.json();
                setCardData(data);
            } catch (error) {
                console.error('Error fetching price data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [isOpen, setCode, collectorNumber, days]);


    // Prevents background scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const finishOptions: { value: FinishType; label: string }[] = [
        { value: 'all', label: 'All Finishes' },
        { value: 'nonfoil', label: 'Regular' },
        { value: 'foil', label: 'Foil' },
        { value: 'etched', label: 'Etched' }
    ];

    // Handle ESC key press to close modal
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={onClose}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Modal content */}
          <div 
            className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            {/* Modal header */}
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold">Price History</h2>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100" 
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
    
            {/* Modal body */}
            <div className="p-4">
              {/* Filter controls */}
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Time period selector */}
                  <div>
                    <label htmlFor="days" className="mb-1 block text-sm font-medium">
                      Time Period
                    </label>
                    <select
                      id="days"
                      name="days"
                      value={days}
                      onChange={(e) => setDays(e.target.value)}
                      className="block w-full rounded-md border border-gray-300 py-1.5 px-3 text-sm"
                    >
                      <option value="7">7 days</option>
                      <option value="14">14 days</option>
                      <option value="30">30 days</option>
                      <option value="90">3 months</option>
                      <option value="180">6 months</option>
                      <option value="365">1 year</option>
                    </select>
                  </div>
    
                  {/* Finish selector */}
                  <div className="flex-grow">
                    <label className="mb-1 block text-sm font-medium">
                      Card Finish
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {finishOptions.map((option) => {
                        const isAvailable = availableFinishes.includes(option.value);

                        if (!isAvailable && option.value !== 'all') {
                          return (
                            <div
                              key={option.value}
                              className="flex items-center justify-center px-3 py-1.5 rounded-md text-sm border opacity-50 cursor-not-allowed bg-white border-gray-300"
                            >
                              {option.label}
                            </div>
                          );
                        }

                        return (
                          <label
                            key={option.value}
                            className={`flex items-center justify-center px-3 py-1.5 rounded-md text-sm border
                              cursor-pointer
                              ${finish === option.value
                                ? 'bg-blue-100 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 hover:bg-gray-50'
                              }`}
                          >
                            <input
                              type="radio"
                              name="finish"
                              value={option.value}
                              checked={finish === option.value}
                              onChange={() => setFinish(option.value)}
                              className="sr-only"
                            />
                            {option.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
    
              {/* Visual Loading Indicator */}
              <div className="relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 rounded-xl">
                        <div className="flex flex-col items-center">
                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-2 text-sm text-gray-600">Updating chart...</p>
                        </div>
                    </div>
                )}
              </div>
            
              {/* Use the memoized chart component if we have it, else render from scratch */}
              {memoizedCardData.card ? (
                <div key={dataKey} className="price-chart-wrapper">
                  <PriceChart 
                    card={memoizedCardData.card}
                    priceHistory={memoizedCardData.priceHistory}
                    selectedFinish={finish}
                  />
                </div>
              ) : (
                <div className="w-full rounded-xl bg-gray-50 p-6">
                  <div className="h-7 w-40 rounded bg-gray-200 mb-4"></div>
                  <div className="h-60 w-full rounded bg-gray-200"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
} 
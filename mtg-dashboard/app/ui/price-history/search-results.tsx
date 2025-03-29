// app/dashboard/price-history/search-results.tsx
'use client';


import SearchResultCard from './search-result-card'; 
import { CardDetails } from "@/app/lib/card-data";
import { 
    ChevronLeftIcon, 
    ChevronRightIcon, 
    ArrowsUpDownIcon,
    AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from "@heroicons/react/24/outline";


interface SearchResultsProps {
    results: CardDetails[];
    isLoading: boolean;
    totalResults: number;
    currentPage: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (count: number) => void;
    onSortChange: (sortBy: string) => void;
    selectedCards: CardDetails[];
    onCardSelect: (card: CardDetails, selected: boolean) => void;
    onCompareSelected: () => void;
}

export default function SearchResults({
    results,
    isLoading,
    totalResults,
    currentPage,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    onSortChange,
    selectedCards,
    onCardSelect,
    onCompareSelected
}: SearchResultsProps) {
    const sortOptions = [
        { value: 'price_desc', label: 'Price (High to Low)' },
        { value: 'price_asc', label: 'Price (Low to High)'},
        { value: 'name_asc', label: 'Name (A-Z)' },
        { value: 'release_desc', label: 'Release Date (Newest)' },
        { value: 'release_asc', label: 'Release Date (Oldest)'}
        // { value: 'change_desc', label: 'Price Change % (Highest)'}
    ];

    const itemsPerPageOptions: number[] = [10, 20, 50];

    // calc total pages
    const totalPages = Math.ceil(totalResults / itemsPerPage);

    // generate array of page numbers for pagination
    const pageNumbers = [];

    // Show at most 5 page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    // Adjust start page if we're near the end
    if (endPage - startPage < 4 && startPage > 1) {
        startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    const clearSelections = () => {
        selectedCards.forEach(card => {
            onCardSelect(card, false);
        });
    };

    return (
        <div className="mt-8 bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                <h2 className="text-xl font-semibold text-zinc-900 flex items-center">
                    <span>Search Results</span>
                    {totalResults > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-sm rounded-full">
                            {totalResults}
                        </span>
                    )}
                </h2>

                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-zinc-600 whitespace-nowrap flex items-center">
                            <ArrowsUpDownIcon className="h-4 w-4 mr-1.5" />
                            Sort by:
                        </div>
                        <select
                            className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            onChange={(e) => onSortChange(e.target.value)}
                        >
                            {sortOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-zinc-600 whitespace-nowrap flex items-center">
                            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1.5" />
                            Show:
                        </div>
                        <select
                            className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            value={itemsPerPage}
                            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                        >
                            {itemsPerPageOptions.map((count: number) => {
                                return (
                                    <option key={count} value={count}>
                                        {count} per page
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>
            </div>
            

            {/* Compare Selected Panel - shows only when items are selected */}
            <div className="sticky top-0 z-20">
                <div 
                    className={`bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 
                    flex flex-col md:flex-row md:justify-between md:items-center gap-3
                    transition-all duration-300 ease-in-out overflow-hidden
                    ${selectedCards.length > 0 
                        ? 'max-h-24 opacity-100 transform translate-y-0 shadow-sm' 
                        : 'max-h-0 opacity-0 transform -translate-y-4 border-0 p-0 mb-0'}`}
                >
                    <div className="text-blue-800 font-medium flex items-center">
                        <CheckCircleIcon className="h-5 w-5 mr-2 text-blue-500" />
                        {selectedCards.length} card{selectedCards.length !== 1 ? 's' : ''} selected
                    </div>
                    <div className="flex space-x-3">
                        <button
                            className="px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 shadow-sm hover:shadow transition-all duration-200 font-medium text-zinc-700"
                            onClick={clearSelections}
                        >
                            Clear Selections
                        </button>
                        <button
                            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm hover:shadow transition-all duration-200 font-medium"
                            onClick={onCompareSelected}
                            disabled={selectedCards.length < 2}
                        >
                            Compare Selected
                        </button>
                    </div>
                </div>
            </div>

            {/* Search results states: Loading, Results found, No results */}
            {isLoading ? ( 
                <div className="space-y-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                            <div className="animate-pulse flex">
                                <div className="mr-4 h-5 w-5 bg-zinc-200 rounded"></div>
                                <div className="flex-1 space-y-4 py-1">
                                    <div className="h-36 w-24 bg-zinc-200 rounded-lg float-left mr-4"></div>
                                    <div className="space-y-2">
                                        <div className="h-5 w-3/4 bg-zinc-200 rounded"></div>
                                        <div className="h-4 w-1/2 bg-zinc-200 rounded"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-5/6 bg-zinc-200 rounded"></div>
                                        <div className="h-4 w-3/4 bg-zinc-200 rounded"></div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-3">
                                        <div className="h-10 bg-zinc-200 rounded"></div>
                                        <div className="h-10 bg-zinc-200 rounded"></div>
                                        <div className="h-10 bg-zinc-200 rounded"></div>
                                        <div className="h-10 bg-zinc-200 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : results.length > 0 ? (
                <div className="space-y-6">
                    {results.map(card => (
                        <SearchResultCard
                            key={card.card_key}
                            card={card}
                            isSelected={selectedCards.some(c => c.card_key === card.card_key)}
                            onSelect={(selected) => onCardSelect(card, selected)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 px-6 border border-dashed border-zinc-300 rounded-xl bg-zinc-50">
                    <div className="max-w-md mx-auto">
                        <h3 className="text-lg font-semibold text-zinc-900 mb-2">No results found</h3>
                        <p className="text-zinc-600 mb-6">Try adjusting your search criteria or using different keywords.</p>
                        <div className="text-sm text-zinc-500">
                            <p>Search tips:</p>
                            <ul className="mt-2 space-y-1 list-disc list-inside">
                                <li>Check for spelling errors</li>
                                <li>Use fewer or more general keywords</li>
                                <li>Try searching by set code (e.g., "ths" for Theros)</li>
                                <li>Remove format or rarity filters</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Pagination - Only show if we have multiple pages of results */}
            {totalPages > 1 && (
                <div className="mt-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div className="text-sm text-zinc-600">
                        Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, totalResults)}</span>-
                        <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalResults)}</span> of <span className="font-medium">{totalResults}</span> results
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            className="inline-flex items-center px-4 py-2 border border-zinc-300 rounded-lg bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:bg-zinc-100 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium shadow-sm"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeftIcon className="h-4 w-4 mr-1.5" />
                            Previous
                        </button>

                        {pageNumbers.map(number => (
                            <button
                                key={number}
                                className={`inline-flex items-center justify-center w-10 h-10 border rounded-lg font-medium transition-colors duration-200 text-sm ${
                                    number === currentPage
                                        ? "bg-blue-100 text-blue-700 border-blue-300 shadow-sm"
                                        : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50" 
                                }`}
                                onClick={() => onPageChange(number)}
                            >
                                {number}
                            </button>
                        ))}

                        <button
                            className="inline-flex items-center px-4 py-2 border border-zinc-300 rounded-lg bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:bg-zinc-100 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium shadow-sm"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                            <ChevronRightIcon className="h-4 w-4 ml-1.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

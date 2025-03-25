// app/dashboard/price-history/search-results.tsx
'use client';

import SearchResultCard from './search-result-card'; 
import { CardDetails } from "@/app/lib/card-data";


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
        <div className="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
                <h2 className="text-lg font-semibold">Search Results</h2>

                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="text-sm text-gray-500 whitespace-nowrap">Sort by:</div>
                        <select
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
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
                        <select
                            className="border border-gray-300 rounded px-2 py-1 text-sm min-w-[120px]"
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
            

            {/* Compare Selected Panel - shows only when items are selected, but we fix the position to not shove the screen down when it becomes visible */}
            <div className="sticky top-0 z-20">
                <div 
                    className={`bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 
                    flex flex-col md:flex-row md:justify-between md:items-center gap-2
                    transition-all duration-300 ease-in-out overflow-hidden
                    ${selectedCards.length > 0 
                        ? 'max-h-24 opacity-100 transform translate-y-0' 
                        : 'max-h-0 opacity-0 transform -translate-y-4 border-0 p-0 mb-0'}`}
                >
                    <div className="text-blue-800 font-medium">
                    {selectedCards.length} card{selectedCards.length !== 1 ? 's' : ''} selected
                    </div>
                    <div className="flex space-x-2">
                    <button
                        className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        onClick={clearSelections}
                    >
                        Clear Selections
                    </button>
                    <button
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        onClick={onCompareSelected}
                        disabled={selectedCards.length < 2}
                    >
                        Compare Selected
                    </button>
                    </div>
                </div>
                </div>

            {/* Search results in 3 parts: Loading block, Results found block, no results found block */}
            {isLoading ? ( 
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="animate-pulse flex">
                                <div className="mr-4 h-4 w-4 bg-gray-200 rounded"></div>
                                <div className="flex-1 space-y-4">
                                <div className="h-32 bg-gray-200 rounded"></div>
                                    <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                                    <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : results.length > 0 ? (
                <div className="space-y-4">
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
                <div className="text-center py-10 text-gray-500">
                    <p>No results found. Try adjusting your search criteria.</p>
                </div>
            )}

            {/* Pagination - Only show if we have multiple pages of results */}
            {totalPages > 1 && (
                <div className="mt-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div className="text-sm text-gray-500">
                        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalResults)}-
                        {Math.min(currentPage * itemsPerPage, totalResults)} of {totalResults} results
                    </div>
                    <div className="flex flex-wrap gap-1">
                        <button
                            className="px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>

                        {pageNumbers.map(number => (
                            <button
                                key={number}
                                className={`px-3 py-1 border rounded-md ${
                                    number === currentPage
                                        ? "bg-blue-50 text-blue-600 border-blue-300"
                                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50" 
                                }`}
                                onClick={() => onPageChange(number)}
                            >
                                {number}
                            </button>
                        ))}

                        <button
                            className="px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

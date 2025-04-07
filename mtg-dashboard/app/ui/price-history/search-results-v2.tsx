// app/ui/price-history/search-results-v2.tsx
'use client';

import { useState } from 'react';
import { CardDetails } from "@/app/lib/card-data";
import { 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal,
  ArrowUpDown,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import SearchResultCard from './search-result-card-v2';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface SearchResultsProps {
    results: CardDetails[];
    isLoading: boolean;
    totalResults: number;
    currentPage: number;
    itemsPerPage: number;
    sortBy: string;
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
    sortBy,
    onPageChange,
    onItemsPerPageChange,
    onSortChange,
    selectedCards,
    onCardSelect,
    onCompareSelected
}: SearchResultsProps) {
    // Sort options
    const sortOptions = [
        { value: 'price_desc', label: 'Price (High to Low)' },
        { value: 'price_asc', label: 'Price (Low to High)' },
        { value: 'name_asc', label: 'Name (A-Z)' },
        { value: 'release_desc', label: 'Release Date (Newest)' },
        { value: 'release_asc', label: 'Release Date (Oldest)' }
    ];

    // Items per page options
    const itemsPerPageOptions = [10, 20, 50];

    // Calculate pagination
    const totalPages = Math.ceil(totalResults / itemsPerPage);


    // Handle page number generation
    const getPageNumbers = () => {
        // Maximum number of page buttons to show
        const maxButtons = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);

        // Adjust to account for end of pagination smoothly
        if (endPage - startPage + 1 < maxButtons && startPage > 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        const pages = [];
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return { pages, startPage, endPage };
    };

    const { pages, startPage, endPage } = getPageNumbers();

    // Handle clearing all selected cards
    const clearSelections = () => {
        selectedCards.forEach(card => {
            onCardSelect(card, false);
        });
    };

    return (
        <div className="flex flex-col items-stretch border-2 border-red-500">
            {/* Selected Cards Notification Bar */}
            <div 
                className={`sticky top-2 z-20 transition-all duration-300 ease-in-out ${
                selectedCards.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
                }`}
            >
                <Card className="p-3 bg-blue-50 border border-blue-200 shadow-sm flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                <div className="flex items-center text-blue-800 font-medium">
                    <CheckCircle2 className="h-5 w-5 mr-2 text-blue-500" />
                    <span>
                    {selectedCards.length} card{selectedCards.length !== 1 ? 's' : ''} selected
                    </span>
                </div>
                <div className="flex gap-2">
                    <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearSelections}
                    className="h-9"
                    >
                    <XCircle className="h-4 w-4 mr-1.5" />
                    Clear Selection
                    </Button>
                    <Button 
                    variant="default" 
                    size="sm" 
                    onClick={onCompareSelected}
                    disabled={selectedCards.length < 2}
                    className="h-9"
                    >
                    Compare Selected
                    </Button>
                </div>
                </Card>
            </div>

            {/* Search Results Header with Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center">
                <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
                {totalResults > 0 && (
                    <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-100">
                    {totalResults}
                    </Badge>
                )}
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-3">
                {/* Sort Control */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 whitespace-nowrap flex items-center">
                    <ArrowUpDown className="h-4 w-4 mr-1.5" />
                    Sort by:
                    </span>
                    <Select
                    value={sortBy}
                    onValueChange={onSortChange}
                    >
                    <SelectTrigger className="h-9 w-[180px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        {sortOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>

                {/* Items Per Page Control */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 whitespace-nowrap flex items-center">
                    <SlidersHorizontal className="h-4 w-4 mr-1.5" />
                    Show:
                    </span>
                    <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => onItemsPerPageChange(Number(value))}
                    >
                    <SelectTrigger className="h-9 w-[140px]">
                        <SelectValue placeholder="Per page" />
                    </SelectTrigger>
                    <SelectContent>
                        {itemsPerPageOptions.map(option => (
                        <SelectItem key={option} value={option.toString()}>
                            {option} per page
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                </div>
            </div>

            {/* Results States: Loading, Results, Empty */}
            <div className="space-y-4">
                {isLoading ? (
                /* Loading Skeletons */
                Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-white">
                    <div className="flex items-start gap-3">
                        <Skeleton className="h-4 w-4 rounded mt-1" />
                        <Skeleton className="h-28 w-20 rounded-lg" />
                        <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="pt-1 flex flex-wrap gap-2">
                            <Skeleton className="h-8 w-20 rounded-md" />
                            <Skeleton className="h-8 w-20 rounded-md" />
                            <Skeleton className="h-8 w-20 rounded-md" />
                            <Skeleton className="h-8 w-16 rounded-md" />
                        </div>
                        </div>
                    </div>
                    </div>
                ))
                ) : results.length > 0 ? (
                /* Search Results */
                results.map(card => (
                    <SearchResultCard
                    key={card.card_key}
                    card={card}
                    isSelected={selectedCards.some(c => c.card_key === card.card_key)}
                    onSelect={(selected) => onCardSelect(card, selected)}
                    />
                ))
                ) : (
                /* No Results State */
                <div className="text-center py-16 px-6 border border-dashed rounded-lg bg-gray-50">
                    <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-600 mb-6">Try adjusting your search criteria or using different keywords.</p>
                    <div className="text-sm text-gray-500">
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
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
            <div className="mt-6 border-t pt-4">
                <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="text-sm text-gray-600">
                    Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, totalResults)}</span>-
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalResults)}</span> of <span className="font-medium">{totalResults}</span> results
                </div>
                
                <div className="flex items-center justify-center gap-1">
                    {/* Previous Button */}
                    <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="h-9 px-3"
                    >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Prev
                    </Button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center">
                    {startPage > 1 && (
                        <>
                        <Button
                            variant={currentPage === 1 ? "outline" : "ghost"}
                            size="sm"
                            onClick={() => onPageChange(1)}
                            className="h-9 w-9 p-0"
                        >
                            1
                        </Button>
                        
                        {startPage > 2 && (
                            <span className="mx-1 text-gray-500">...</span>
                        )}
                        </>
                    )}
                    
                    {pages.map(page => (
                        <Button
                        key={page}
                        variant={currentPage === page ? "outline" : "ghost"}
                        size="sm"
                        onClick={() => onPageChange(page)}
                        className="h-9 w-9 p-0 mx-0.5"
                        >
                        {page}
                        </Button>
                    ))}
                    
                    {endPage < totalPages && (
                        <>
                        {endPage < totalPages - 1 && (
                            <span className="mx-1 text-gray-500">...</span>
                        )}
                        
                        <Button
                            variant={currentPage === totalPages ? "outline" : "ghost"}
                            size="sm"
                            onClick={() => onPageChange(totalPages)}
                            className="h-9 w-9 p-0"
                        >
                            {totalPages}
                        </Button>
                        </>
                    )}
                    </div>
                    
                    {/* Next Button */}
                    <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="h-9 px-3"
                    >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
                </div>
            </div>
            )}
            </div>
    );
    
}

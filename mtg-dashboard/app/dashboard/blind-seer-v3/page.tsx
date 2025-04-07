// app/dashboard/blind-seer-v3/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { CardDetails } from "@/app/lib/card-data";
import { useSearch } from "@/app/hooks/useSearch";
import SearchBar from "@/app/ui/price-history/search-bar";
import AdvancedSearch from "@/app/ui/price-history/advanced-search";
import SearchResults from "@/app/ui/price-history/search-results-v2";
import CardComparisonPanel from "@/app/ui/card-comparison/card-comparison-panel";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BlindSeer() {
  // Search form states
  const [advancedSearch, setAdvancedSearch] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCompareMode, setIsCompareMode] = useState(false);

  // Advanced search states
  const [cardName, setCardName] = useState('');
  const [setCode, setSetCode] = useState('');
  const [manaCost, setManaCost] = useState('');
  const [selectedRarities, setSelectedRarities] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedCards, setSelectedCards] = useState<CardDetails[]>([]);

  // Search hook
  const {
    isLoading,
    searchResults,
    totalResults,
    currentPage,
    itemsPerPage,
    totalPages,
    sortBy,
    searchPerformed,
    performSearch,
    handlePageChange,
    handleItemsPerPageChange,
    handleSortChange
  } = useSearch();

  // Toggle advanced search
  const toggleAdvancedSearch = () => {
    setAdvancedSearch(!advancedSearch);
  };

  // Handle main search
  const handleSearch = async (query: string, startDate: string, endDate: string) => {
    setSearchQuery(query);
    setStartDate(startDate);
    setEndDate(endDate);

    // Perform search using the search hook
    performSearch({
      name: query,
      startDate,
      endDate,
      page: 1
    });
  };

  // Handle advanced search submit
  const handleAdvancedSearchSubmit = async () => {
    performSearch({
      name: cardName,
      setCode,
      manaCost,
      rarities: selectedRarities,
      formats: selectedFormats,
      startDate,
      endDate,
      page: 1 // Always start at page 1 for new searches
    });
  };

  // Handle card selection for comparison
  const handleCardSelect = (card: CardDetails, selected: boolean) => {
    if (selected) {
      setSelectedCards(prev => [...prev, card]);
    } else {
      setSelectedCards(prev => prev.filter(c => c.card_key !== card.card_key));
    }
  };

  // Handle compare selected cards
  const handleCompareSelected = () => {
    if (selectedCards.length >= 2) {
      setIsCompareMode(true);
    }
  };

  // Toggle rarity selection
  const toggleRarity = (rarity: string) => {
    if (selectedRarities.includes(rarity)) {
      setSelectedRarities(selectedRarities.filter(r => r !== rarity));
    } else {
      setSelectedRarities([...selectedRarities, rarity]);
    }
  };

  // Toggle format selection
  const toggleFormat = (format: string) => {
    if (selectedFormats.includes(format)) {
      setSelectedFormats(selectedFormats.filter(f => f !== format));
    } else {
      setSelectedFormats([...selectedFormats, format]);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setCardName('');
    setSetCode('');
    setManaCost('');
    setSelectedRarities([]);
    setSelectedFormats([]);
    setStartDate('');
    setEndDate('');
  };

  // Exit compare mode
  const exitCompareMode = () => {
    setIsCompareMode(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">MTG Price Explorer</h1>

      {/* Only show search when not in compare mode */}
      {!isCompareMode && (
        <div className="rounded-xl bg-gray-50 p-4 md:p-6 mb-6 border">
          <SearchBar
            onSubmit={handleSearch}
            isLoading={isLoading}
          />
          {/* Advanced Search Fields */}
          <AdvancedSearch 
            isOpen={advancedSearch}
            onToggle={toggleAdvancedSearch}
            cardName={cardName}
            setCardName={setCardName}
            setCode={setCode}
            setSetCode={setSetCode}
            manaCost={manaCost}
            setManaCost={setManaCost}
            selectedRarities={selectedRarities}
            toggleRarity={toggleRarity}
            selectedFormats={selectedFormats}
            toggleFormat={toggleFormat}
            clearFilters={clearFilters}
            onSubmit={handleAdvancedSearchSubmit}
          />
        </div>
      )}

      {/* Compare Panel - Show when in compare mode */}
      {isCompareMode ? (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Card Comparison</h2>
            <Button 
              variant="outline" 
              onClick={exitCompareMode}
              className="flex items-center gap-1.5"
            >
              <X size={16} />
              Exit Comparison
            </Button>
          </div>
          <CardComparisonPanel 
            cards={selectedCards}
            startDate={startDate}
            endDate={endDate}
            days={90} // Default to 90 days if no dates specified
          />
        </div>
      ) : searchPerformed ? (
        /* Search Results Component */
        <div className="mt-6">
          <SearchResults 
            results={searchResults}
            isLoading={isLoading}
            totalResults={totalResults}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            sortBy={sortBy}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            onSortChange={handleSortChange}
            selectedCards={selectedCards}
            onCardSelect={handleCardSelect}
            onCompareSelected={handleCompareSelected}
          />
        </div>
      ) : (
        /* Welcome/Empty State */
        <Card className="p-8 text-center bg-white">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold mb-3">Welcome to MTG Price Explorer V3</h2>
            <p className="text-gray-600 mb-6">
              Search for Magic: The Gathering cards to view their price history and trends. 
              Compare multiple cards to identify investment opportunities or analyze market patterns.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-semibold mb-2">Search</h3>
                <p className="text-sm text-gray-600">Find cards by name, set, mana cost, rarity or format.</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h3 className="font-semibold mb-2">View Details</h3>
                <p className="text-sm text-gray-600">Analyze price history, trends, and fluctuations.</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h3 className="font-semibold mb-2">Compare</h3>
                <p className="text-sm text-gray-600">Select multiple cards to compare prices side by side.</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
'use client';

// app/dashboard/blind-seer/page.tsx

import React, { useState } from 'react';
import AdvancedSearch from "@/app/ui/price-history/advanced-search";
import SearchResults from "@/app/ui/price-history/search-results";
import SearchBar from "@/app/ui/price-history/search-bar";
import { CardDetails } from "@/app/lib/card-data";
import { useSearch } from "@/app/hooks/useSearch";
// import { parseManaInput } from "@/app/lib/mana-cost-parser";

export default function SearchUI() {
  // Search form states
  const [advancedSearch, setAdvancedSearch] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Advanced search states
  const [cardName, setCardName] = useState('');
  const [setCode, setSetCode] = useState('');
  const [manaCost, setManaCost] = useState('');
  const [selectedRarities, setSelectedRarities] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedCards, setSelectedCards] = useState<CardDetails[]>([]);

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


  const toggleAdvancedSearch = () => {
    setAdvancedSearch(!advancedSearch);
  };

  const handleSearch = async (query: string, startDate: string, endDate: string) => {
    // Store date values from the main search
    setSearchQuery(query);
    setStartDate(startDate);
    setEndDate(endDate);

    // Don't actually perform a search with the main search bar yet
    // We'll implement this later with the complex search
    console.log("Main search will be implemented later:", { query, startDate, endDate });

  };

  // Handle advanced search submit
  const handleAdvancedSearchSubmit = async () => {
    console.log("Advanced search submitted with:", { cardName, setCode, manaCost, selectedRarities, selectedFormats });
    const parsedManaCost = manaCost;
    console.log("Parsed the old mana cost to ", parsedManaCost);

    performSearch({
      name: cardName,
      setCode,
      manaCost: parsedManaCost,
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
    // Implement comparison functionality later
    console.log('Comparing cards:', selectedCards);
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

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">MTG Price History Search</h1>

      {/* Main Scryfall-style Search Bar */}
      <div className="rounded-xl bg-gray-50 p-4 md:p-6 mb-6">
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
      
      {/* Search Results Component */}
      <SearchResults 
        results={searchResults}
        isLoading={isLoading}
        totalResults={totalResults}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        onSortChange={handleSortChange}
        selectedCards={selectedCards}
        onCardSelect={handleCardSelect}
        onCompareSelected={handleCompareSelected}
      />
    </div>
  );
}
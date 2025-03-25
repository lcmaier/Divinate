'use client';
// app/ui/price-history/search-bar.tsx

import { useState } from "react";
import { Search, Calendar } from 'lucide-react';

interface SearchBarProps {
    onSubmit: (query: string, startDate: string, endDate: string) => void;
    isLoading: boolean;
}

export default function SearchBar({ onSubmit, isLoading }: SearchBarProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(searchQuery, startDate, endDate);
    };

return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Scryfall-style primary search bar */}
      <div className="relative">
        <div className="flex w-full rounded-lg border border-gray-300 bg-white">
          <div className="flex-grow">
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-l-lg focus:outline-none"
              placeholder="Search card (e.g., name:'Thoughtseize' set:ths rarity:rare)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            className="bg-blue-500 text-white px-6 rounded-r-lg hover:bg-blue-600 flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <Search className="h-5 w-5" />
            )}
          </button>
        </div>
        
        {/* Date Range Selectors - Always visible */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <div className="relative">
              <input 
                type="date" 
                className="w-full px-4 py-2 rounded-lg border border-gray-300 pr-10"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <div className="relative">
              <input 
                type="date" 
                className="w-full px-4 py-2 rounded-lg border border-gray-300 pr-10"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
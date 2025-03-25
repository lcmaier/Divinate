// app/ui/price-history/advanced-search.tsx
'use client';

import { Settings, ChevronUp, ChevronDown } from 'lucide-react';
import { CARD_FORMATS, CARD_RARITIES } from '@/app/lib/card-constants';

interface AdvancedSearchProps {
    isOpen: boolean;
    onToggle: () => void;
    cardName: string,
    setCardName: (value: string) => void;
    setCode: string;
    setSetCode: (value: string) => void;
    manaCost: string;
    setManaCost: (value: string) => void;
    selectedRarities: string[];
    toggleRarity: (value: string) => void;
    selectedFormats: string[];
    toggleFormat: (format: string) => void;
    clearFilters: () => void;
    onSubmit: () => void;
}

export default function AdvancedSearch({
    isOpen,
    onToggle,
    cardName,
    setCardName,
    setCode,
    setSetCode,
    manaCost,
    setManaCost,
    selectedRarities,
    toggleRarity,
    selectedFormats,
    toggleFormat,
    clearFilters,
    onSubmit
}: AdvancedSearchProps) {
    // handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        //call parent component's onSubmit function to perform search
        onSubmit();
    }
    
    return (
        <>
            {/* Toggle Advanced Search Button */}
            <button
                type="button"
                className="mt-4 flex items-center text-sm text-blue-600 hover:text-blue-800"
                onClick={onToggle}
            >
                <Settings className="h-4 w-4 mr-1" />
                {isOpen ? 'Hide Advanced Search' : 'Show Advanced Search'}
                {isOpen ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
            </button>

            {/* Advanced Search Fields */}
            {isOpen && (
                <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2 space-y-4">
                    {/* First Row of Advanced Search Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Card Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Card Name</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300"
                                placeholder="e.g., Thoughseize"
                                value={cardName}
                                onChange={(e) => setCardName(e.target.value)}
                            />
                        </div>

                        {/* Set */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Set</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300"
                                placeholder="e.g., Theros or THS"
                                value={setCode}
                                onChange={(e) => setSetCode(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    {/* Second Row of Advanced Search Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Mana Cost */}
                        <div>
                            <label className="grid grid-cols-1 md:grid-cols-2 gap-4">Mana Cost</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300"
                                placeholder="e.g., 1B, 1WG/R"
                                value={manaCost}
                                onChange={(e) => setManaCost(e.target.value)}
                            />
                        </div>

                        {/* Rarity Buttons */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rarity</label>
                            <div className="flex flex-wrap gap-2">
                                {CARD_RARITIES.map(rarity => (
                                    <button
                                        key={rarity}
                                        type="button"
                                        className={`px-3 py-1 rounded-full text-sm ${
                                            selectedRarities.includes(rarity)
                                            ? "bg-blue-100 text-blue-800 border border-blue-300"
                                            : "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200"
                                        }`}
                                        onClick={() => toggleRarity(rarity)}
                                    >
                                        {rarity}
                                    </button>
                                ))}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                            Click to toggle rarity filters
                        </div>
                        </div>
                    </div>

                    {/* Format Legality Buttons */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Format Legality</label>
                        <div className="flex flex-wrap gap-2">
                            {CARD_FORMATS.map(format => (
                                <button
                                    key={format}
                                    type="button"
                                    className={`px-3 py-1 rounded-full text-sm ${
                                        selectedFormats.includes(format)
                                        ? "bg-blue-100 text-blue-800 border border-blue-300"
                                        : "bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200"
                                    }`}
                                    onClick={() => toggleFormat(format)}
                                >
                                    {format}
                                </button>
                            ))}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            Click to toggle format legality filters
                        </div>
                    </div>

                    {/* Clear/Apply buttons for Advanced Search */}
                    <div className="flex justify-end space-x-3 pt-2">
                        <button
                            type="button"
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            onClick={clearFilters}
                        >
                            Clear Filters
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Apply Filters
                        </button>
                    </div>
                </form>
            )}
        </>
    );
}
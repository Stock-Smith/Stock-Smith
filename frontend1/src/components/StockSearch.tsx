import React, { useState, useEffect, useRef } from "react";
import { SearchIcon, XIcon, LoaderIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const StockSearch = ({
  csvData,
  isLoading,
  onStockSelect,
  className
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  const MAX_SUGGESTIONS = 8;

  // Filter suggestions based on search term
  useEffect(() => {
    if (!searchTerm.trim() || !csvData.length) {
      setSuggestions([]);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = csvData
      .filter(stock => {
        const symbol = (stock?.Symbol || '').toLowerCase();
        const name = (stock?.['Security Name'] || '').toLowerCase();
        return symbol.includes(term) || name.includes(term);
      })
      .slice(0, MAX_SUGGESTIONS);
    
    setSuggestions(filtered);
  }, [searchTerm, csvData]);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!suggestions.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      handleSuggestionSelect(suggestions[highlightIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
    setHighlightIndex(-1);
  };

  const handleSuggestionSelect = (suggestion) => {
    if (onStockSelect) {
      onStockSelect(suggestion);
    }
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <div className="flex items-center relative">
        <div className="absolute left-3 text-gray-400">
          <SearchIcon className="h-4 w-4" />
        </div>
        
        <Input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search stocks by symbol or name..."
          className="pl-10 pr-10 bg-gray-800/50 border-gray-700 text-white w-full"
        />
        
        {isLoading ? (
          <div className="absolute right-3">
            <LoaderIcon className="h-4 w-4 text-gray-400 animate-spin" />
          </div>
        ) : searchTerm ? (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 h-8 w-8 p-0 text-gray-400 hover:text-white"
            onClick={clearSearch}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <motion.div
          ref={suggestionsRef}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute z-50 mt-1 w-full bg-gray-900/90 backdrop-blur-md shadow-lg rounded-lg border border-gray-700 overflow-hidden"
        >
          <div className="max-h-80 overflow-y-auto py-1">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.Symbol}
                className={`px-4 py-3 cursor-pointer flex items-center justify-between hover:bg-gray-800/60 transition-colors
                  ${highlightIndex === index ? 'bg-gray-800/80' : ''}`}
                onClick={() => handleSuggestionSelect(suggestion)}
                onMouseEnter={() => setHighlightIndex(index)}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-white">
                    {suggestion.Symbol}
                  </span>
                  <span className="text-sm text-gray-400">
                    {suggestion['Security Name']}
                  </span>
                </div>
                <div className="text-xs bg-blue-900/30 text-blue-400 py-1 px-2 rounded">
                  Add
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {showSuggestions && searchTerm && suggestions.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-50 mt-1 w-full bg-gray-900/90 backdrop-blur-md shadow-lg rounded-lg border border-gray-700 p-4 text-center"
        >
          <p className="text-gray-400">No matching stocks found</p>
        </motion.div>
      )}
    </div>
  );
};

export default StockSearch;
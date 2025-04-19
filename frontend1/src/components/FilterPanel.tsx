import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Search, Filter, XCircle } from 'lucide-react';
import { NewsQueryParams, SortOption } from '../lib/news';
import { formatDateForQuery } from '../lib/dateUtils';
import { getAllTopics, getAllTickers } from '../lib/mockData';

interface FilterPanelProps {
  onApplyFilters: (filters: NewsQueryParams) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onApplyFilters }) => {
  const [tickers, setTickers] = useState('');
  const [topics, setTopics] = useState('');
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [sort, setSort] = useState<SortOption>('LATEST');
  const [limit, setLimit] = useState<number>(10);
  
  // Get all available topics and tickers for autocomplete
  const availableTopics = getAllTopics();
  const availableTickers = getAllTickers();

  const handleApplyFilters = () => {
    const filters: NewsQueryParams = {
      tickers: tickers || undefined,
      topics: topics || undefined,
      time_from: fromDate ? formatDateForQuery(fromDate) : undefined,
      time_to: toDate ? formatDateForQuery(toDate) : undefined,
      sort,
      limit,
    };
    
    onApplyFilters(filters);
  };

  const handleResetFilters = () => {
    setTickers('');
    setTopics('');
    setFromDate(undefined);
    setToDate(undefined);
    setSort('LATEST');
    setLimit(10);
    
    onApplyFilters({
      sort: 'LATEST',
      limit: 10
    });
  };

  // Calculate active filters count for badge
  const getActiveFilterCount = () => {
    let count = 0;
    if (tickers) count++;
    if (topics) count++;
    if (fromDate) count++;
    if (toDate) count++;
    if (sort !== 'LATEST') count++;
    if (limit !== 10) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="w-full">
      <div className="hidden md:flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filter Results
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 ml-2">
              {activeFilterCount}
            </span>
          )}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          <Label htmlFor="tickers" className="text-sm font-medium text-gray-300">Tickers</Label>
          <div className="relative">
            <Input
              id="tickers"
              value={tickers}
              onChange={(e) => setTickers(e.target.value)}
              placeholder="AAPL, TSLA, BTC"
              className="pr-10 h-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
              list="ticker-options"
            />
            <datalist id="ticker-options">
              {availableTickers.map((ticker) => (
                <option key={ticker} value={ticker} />
              ))}
            </datalist>
            {tickers ? (
              <XCircle 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-white cursor-pointer" 
                onClick={() => setTickers('')}
              />
            ) : (
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="topics" className="text-sm font-medium text-gray-300">Topics</Label>
          <div className="relative">
            <Input
              id="topics"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="Blockchain, Finance"
              className="pr-10 h-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
              list="topic-options"
            />
            <datalist id="topic-options">
              {availableTopics.map((topic) => (
                <option key={topic} value={topic} />
              ))}
            </datalist>
            {topics ? (
              <XCircle 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-white cursor-pointer" 
                onClick={() => setTopics('')}
              />
            ) : (
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-300">Date Range</Label>
          <div className="flex space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex-1 justify-start text-left font-normal h-10 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  {fromDate ? (
                    fromDate.toLocaleDateString()
                  ) : (
                    <span className="text-gray-500">From</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 text-gray-400" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={setFromDate}
                  initialFocus
                  className="bg-gray-800 text-white"
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex-1 justify-start text-left font-normal h-10 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  {toDate ? (
                    toDate.toLocaleDateString()
                  ) : (
                    <span className="text-gray-500">To</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 text-gray-400" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={setToDate}
                  initialFocus
                  className="bg-gray-800 text-white"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="sort" className="text-sm font-medium text-gray-300">Sort By</Label>
            <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
              <SelectTrigger 
                id="sort" 
                className="h-10 bg-gray-800 border-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
              >
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="LATEST">Latest</SelectItem>
                <SelectItem value="RELEVANCE">Relevance</SelectItem>
                <SelectItem value="SENTIMENT">Sentiment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="limit" className="text-sm font-medium text-gray-300">Results</Label>
            <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
              <SelectTrigger 
                id="limit" 
                className="h-10 bg-gray-800 border-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
              >
                <SelectValue placeholder="Limit" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="10">10 items</SelectItem>
                <SelectItem value="20">20 items</SelectItem>
                <SelectItem value="50">50 items</SelectItem>
                <SelectItem value="100">100 items</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6 gap-3">
        <Button 
          variant="outline" 
          onClick={handleResetFilters}
          className="text-gray-300 border-gray-700 hover:bg-gray-800 hover:text-white transition-colors"
          disabled={!activeFilterCount}
        >
          Reset
        </Button>
        <Button 
          onClick={handleApplyFilters} 
          className="bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
};

export default FilterPanel;
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Search } from 'lucide-react';
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

  return (
    <div className="glass p-4 rounded-lg mb-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tickers">Tickers</Label>
          <div className="relative">
            <Input
              id="tickers"
              value={tickers}
              onChange={(e) => setTickers(e.target.value)}
              placeholder="AAPL,TSLA,BTC"
              className="pr-10"
              list="ticker-options"
            />
            <datalist id="ticker-options">
              {availableTickers.map((ticker) => (
                <option key={ticker} value={ticker} />
              ))}
            </datalist>
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="topics">Topics</Label>
          <div className="relative">
            <Input
              id="topics"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="Blockchain,Finance"
              className="pr-10"
              list="topic-options"
            />
            <datalist id="topic-options">
              {availableTopics.map((topic) => (
                <option key={topic} value={topic} />
              ))}
            </datalist>
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Date Range</Label>
          <div className="flex space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                  {fromDate ? (
                    fromDate.toLocaleDateString()
                  ) : (
                    <span className="text-muted-foreground">From</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={setFromDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                  {toDate ? (
                    toDate.toLocaleDateString()
                  ) : (
                    <span className="text-muted-foreground">To</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={setToDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="sort">Sort By</Label>
            <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
              <SelectTrigger id="sort">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LATEST">Latest</SelectItem>
                <SelectItem value="RELEVANCE">Relevance</SelectItem>
                <SelectItem value="SENTIMENT">Sentiment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="limit">Limit</Label>
            <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
              <SelectTrigger id="limit">
                <SelectValue placeholder="Limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-4 space-x-2">
        <Button variant="outline" onClick={handleResetFilters}>Reset</Button>
        <Button onClick={handleApplyFilters}>Apply Filters</Button>
      </div>
    </div>
  );
};

export default FilterPanel;
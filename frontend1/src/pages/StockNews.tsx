import React, { useState, useEffect } from 'react';
import NewsCard from '../components/NewsCard';
import FilterPanel from '../components/FilterPanel';
import NewsHeader from '../components/NewsHeader';
import { NewsItem, NewsQueryParams, ViewMode } from '../lib/news';
import { Info } from 'lucide-react';

interface StockNewsProps {
  ticker: string; // the stock symbol for which news is being shown
}

const StockNews: React.FC<StockNewsProps> = ({ ticker }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterVisible, setFilterVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only allow date filters; ticker is locked from props
  const fetchNews = async (params: Partial<Pick<NewsQueryParams, 'time_from' | 'time_to'>> = {}) => {
    setLoading(true);
    setError(null);

    try {
      const urlParams = new URLSearchParams();
      urlParams.append('tickers', ticker); // locked ticker from props
      if (params.time_from) urlParams.append('time_from', params.time_from);
      if (params.time_to) urlParams.append('time_to', params.time_to);
      // Optional: you can add default sort/limit
      urlParams.append('sort', 'LATEST');
      urlParams.append('limit', '12');

      const response = await fetch(`http://localhost/api/v1/news/market-news?${urlParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch news');

      const data = await response.json();
      setNews(Array.isArray(data) ? data.slice(0, 12) : []);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch news. Please try again later.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [ticker]); // refetch if ticker changes

  // Only pass through time_from and time_to from filter
  const handleFilterApply = (filters: Partial<Pick<NewsQueryParams, 'time_from' | 'time_to'>>) => {
    fetchNews(filters);
  };

  const toggleFilterPanel = () => {
    setFilterVisible(!filterVisible);
  };

  return (
    <div>
      <NewsHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onFilterToggle={toggleFilterPanel}
        filterVisible={filterVisible}
      />

      {filterVisible && (
        <div className="mb-6">
          <FilterPanel
            onApplyFilters={handleFilterApply}
            // Optionally, add a prop to hide ticker/topics in your FilterPanel
            hideTicker={true}
            hideTopics={true}
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="h-8 w-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-red-400 py-6 text-center">
          <p>{error}</p>
          <button
            onClick={() => fetchNews()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded mt-2"
          >
            Try Again
          </button>
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-8 text-gray-300">
          <Info className="inline-block h-6 w-6 mr-2" />
          No recent news found for {ticker}
        </div>
      ) : (
        <div className={`grid gap-6 ${
          viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
        }`}>
          {news.map((item, idx) => (
            <div key={`${item.title}-${idx}`}>
              <NewsCard news={item} isGrid={viewMode === 'grid'} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StockNews;

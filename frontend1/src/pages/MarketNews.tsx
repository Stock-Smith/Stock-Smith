import React, { useState, useEffect } from 'react';
import NewsCard from '../components/NewsCard';
import FilterPanel from '../components/FilterPanel';
import NewsHeader from '../components/NewsHeader';
import { NewsItem, NewsQueryParams, ViewMode } from '../lib/news';
import { Info, ArrowDown } from 'lucide-react';

const News = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterVisible, setFilterVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async (params: NewsQueryParams = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Use the ticker from params or default to AAPL
      const ticker = params.tickers?.toUpperCase() || 'AAPL';
      
      const response = await fetch(`http://localhost/api/v1/news/market-news?ticker=${ticker}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      
      const data = await response.json();
      
      // Apply additional filters
      let filteredNews = data;
      
      // Filter by topics if provided
      if (params.topics) {
        const topicList = params.topics.split(',').map(t => t.trim());
        filteredNews = filteredNews.filter((item: NewsItem) => 
          item.topics.some((t: {topic: string}) => 
            topicList.includes(t.topic)
          )
        );
      }
      
      // Filter by date range if provided
      if (params.time_from) {
        filteredNews = filteredNews.filter((item: NewsItem) => 
          item.time_published >= params.time_from!
        );
      }
      
      if (params.time_to) {
        filteredNews = filteredNews.filter((item: NewsItem) => 
          item.time_published <= params.time_to!
        );
      }
      
      // Sort the news
      if (params.sort) {
        switch (params.sort) {
          case 'LATEST':
            filteredNews.sort((a: NewsItem, b: NewsItem) => 
              b.time_published.localeCompare(a.time_published)
            );
            break;
          case 'SENTIMENT':
            filteredNews.sort((a: NewsItem, b: NewsItem) => 
              b.overall_sentiment_score - a.overall_sentiment_score
            );
            break;
        }
      }
      
      // Limit results
      const limit = params.limit || 15;
      filteredNews = filteredNews.slice(0, limit);
      
      setNews(filteredNews);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch news. Please try again later.');
      setLoading(false);
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNews({ sort: 'LATEST', limit: 15 });
  }, []);

  const handleFilterApply = (filters: NewsQueryParams) => {
    fetchNews(filters);
  };

  const toggleFilterPanel = () => {
    setFilterVisible(!filterVisible);
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 pb-8 mt-7">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 relative z-10">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold text-blue-400">
                MARKET NEWS
              </h1>
              <p className="text-gray-400 text-sm">Latest financial insights and analysis</p>
            </div>
          </div>
        </div>
        
        <NewsHeader 
          viewMode={viewMode} 
          onViewModeChange={setViewMode} 
          onFilterToggle={toggleFilterPanel}
          filterVisible={filterVisible}
        />
        
        {filterVisible && (
          <div className="mb-8 bg-gray-900 rounded-xl shadow-lg border border-gray-800 p-4 animate-fade-down">
            <FilterPanel onApplyFilters={handleFilterApply} />
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
              <div className="text-blue-400 text-lg">Loading news articles...</div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-gray-900 rounded-xl border border-gray-800 shadow-lg">
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={() => fetchNews({ sort: 'LATEST', limit: 15 })}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-16 bg-gray-900 rounded-xl border border-gray-800 shadow-lg">
            <div className="flex flex-col items-center">
              <Info className="h-8 w-8 text-blue-400 mb-4" />
              <p className="text-xl text-white mb-2">No news found</p>
              <p className="text-gray-400 mb-4">Try adjusting your filters to see more results</p>
              <button 
                onClick={() => fetchNews({ sort: 'LATEST', limit: 15 })}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        ) : (
          <div className={`grid gap-6 animate-fade-up ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {news.map((item, index) => (
              <div key={`${item.title}-${index}`} className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <NewsCard 
                  news={item} 
                  isGrid={viewMode === 'grid'} 
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default News;
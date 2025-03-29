import React, { useState, useEffect } from 'react';
import NewsCard from '../components/NewsCard';
import FilterPanel from '../components/FilterPanel';
import NewsHeader from '../components/NewsHeader';
import { NewsItem, NewsQueryParams, ViewMode } from '../lib/news';

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
    <div className="min-h-screen bg-background pb-16 mt-9">
      <div className="container px-4 py-8 mx-auto max-w-7xl">
        <NewsHeader 
          viewMode={viewMode} 
          onViewModeChange={setViewMode} 
          onFilterToggle={toggleFilterPanel}
          filterVisible={filterVisible}
        />
        
        {filterVisible && (
          <FilterPanel onApplyFilters={handleFilterApply} />
        )}
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
            <p className="text-muted-foreground">Loading news...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-destructive mb-4">{error}</p>
            <button 
              onClick={() => fetchNews({ sort: 'LATEST', limit: 15 })}
              className="text-primary hover:underline"
            >
              Try Again
            </button>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl mb-2">No news found</p>
            <p className="text-muted-foreground mb-4">Try adjusting your filters to see more results</p>
            <button 
              onClick={() => fetchNews({ sort: 'LATEST', limit: 15 })}
              className="text-primary hover:underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className={`grid gap-6 animate-fade-up ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {news.map((item, index) => (
              <NewsCard 
                key={`${item.title}-${index}`} 
                news={item} 
                isGrid={viewMode === 'grid'} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default News;
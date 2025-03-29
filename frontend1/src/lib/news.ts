export interface NewsItem {
    title: string;
    url: string;
    time_published: string;
    authors: string[];
    summary: string;
    banner_image: string;
    source: string;
    category_within_source: string;
    source_domain: string;
    topics: Topic[];
    overall_sentiment_score: number;
    overall_sentiment_label: string;
    ticker_sentiment: TickerSentiment[];
  }
  
  export interface Topic {
    topic: string;
    relevance_score: string;
  }
  
  export interface TickerSentiment {
    ticker: string;
    relevance_score: string;
    ticker_sentiment_score: string;
    ticker_sentiment_label: string;
  }
  
  export interface NewsQueryParams {
    tickers?: string;
    topics?: string;
    time_from?: string;
    time_to?: string;
    sort?: 'LATEST' | 'RELEVANCE' | 'SENTIMENT';
    limit?: number;
  }
  
  export type ViewMode = 'grid' | 'list';
  export type SortOption = 'LATEST' | 'RELEVANCE' | 'SENTIMENT';
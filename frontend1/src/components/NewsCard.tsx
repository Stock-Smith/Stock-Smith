import React, { useState } from 'react';
import { formatPublishedDate } from '../lib/dateUtils';
import { NewsItem } from '../lib/news';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Bookmark, Share } from 'lucide-react';

interface NewsCardProps {
  news: NewsItem;
  isGrid: boolean;
}

const NewsCard: React.FC<NewsCardProps> = ({ news, isGrid }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  const getSentimentColor = (label: string) => {
    switch(label) {
      case 'Bullish': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'Somewhat-Bullish': return 'bg-green-50 text-green-700 hover:bg-green-100';
      case 'Somewhat-Bearish': return 'bg-red-50 text-red-700 hover:bg-red-100';
      case 'Bearish': return 'bg-red-100 text-red-800 hover:bg-red-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };
  
  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };
  
  const handleShare = () => {
    navigator.share({
      title: news.title,
      url: news.url
    }).catch(err => console.error('Error sharing:', err));
  };
  
  if (isGrid) {
    return (
      <Card className="card-hover h-full overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 transition-all duration-300">
        <div className="relative aspect-video overflow-hidden">
          <div className={`absolute inset-0 bg-gray-200 dark:bg-gray-800 ${isImageLoaded ? 'hidden' : 'flex items-center justify-center'}`}>
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <img
            src={news.banner_image || 'https://via.placeholder.com/800x450?text=No+Image'}
            alt={news.title}
            className={`w-full h-full object-cover transition-all duration-700 ${isImageLoaded ? 'animate-image-load' : 'opacity-0'}`}
            onLoad={handleImageLoad}
          />
        </div>
        <CardHeader className="p-4">
          <div className="flex justify-between items-start mb-2">
            <Badge variant="outline" className="text-xs font-medium">{news.source}</Badge>
            <Badge className={`text-xs font-medium ${getSentimentColor(news.overall_sentiment_label)}`}>
              {news.overall_sentiment_label}
            </Badge>
          </div>
          <CardTitle className="text-lg font-semibold line-clamp-2 mb-1">
            <a href={news.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              {news.title}
            </a>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {formatPublishedDate(news.time_published)} · {news.authors.join(', ')}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-2">
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{news.summary}</p>
        </CardContent>
        <CardFooter className="px-4 py-3 flex justify-between border-t border-gray-100 dark:border-gray-800">
          <div className="flex flex-wrap gap-1">
            {news.topics.slice(0, 2).map((topic, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {topic.topic}
              </Badge>
            ))}
            {news.topics.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{news.topics.length - 2}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <Bookmark size={16} />
            </button>
            <button onClick={handleShare} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <Share size={16} />
            </button>
          </div>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="card-hover overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 transition-all duration-300">
      <div className="flex flex-col md:flex-row">
        <div className="relative md:w-1/3 aspect-video md:aspect-square overflow-hidden">
          <div className={`absolute inset-0 bg-gray-200 dark:bg-gray-800 ${isImageLoaded ? 'hidden' : 'flex items-center justify-center'}`}>
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <img
            src={news.banner_image || 'https://via.placeholder.com/800x450?text=No+Image'}
            alt={news.title}
            className={`w-full h-full object-cover transition-all duration-700 ${isImageLoaded ? 'animate-image-load' : 'opacity-0'}`}
            onLoad={handleImageLoad}
          />
        </div>
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start mb-2">
            <Badge variant="outline" className="text-xs font-medium">{news.source}</Badge>
            <Badge className={`text-xs font-medium ${getSentimentColor(news.overall_sentiment_label)}`}>
              {news.overall_sentiment_label}
            </Badge>
          </div>
          <h3 className="text-xl font-semibold mb-2">
            <a href={news.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              {news.title}
            </a>
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{news.summary}</p>
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              {formatPublishedDate(news.time_published)} · {news.authors.join(', ')}
            </div>
            <div className="flex gap-2">
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <Bookmark size={16} />
              </button>
              <button onClick={handleShare} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <Share size={16} />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-3">
            {news.topics.map((topic, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {topic.topic}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default NewsCard;
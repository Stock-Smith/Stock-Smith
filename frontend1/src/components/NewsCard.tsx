import React, { useState } from 'react';
import { formatPublishedDate } from '../lib/dateUtils';
import { NewsItem } from '../lib/news';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Bookmark, Share, Clock } from 'lucide-react';

interface NewsCardProps {
  news: NewsItem;
  isGrid: boolean;
}

const NewsCard: React.FC<NewsCardProps> = ({ news, isGrid }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  const getSentimentColor = (label: string) => {
    switch(label) {
      case 'Bullish': return 'bg-green-700 text-green-100 hover:bg-green-600';
      case 'Somewhat-Bullish': return 'bg-green-800 text-green-100 hover:bg-green-700';
      case 'Somewhat-Bearish': return 'bg-red-800 text-red-100 hover:bg-red-700';
      case 'Bearish': return 'bg-red-700 text-red-100 hover:bg-red-600';
      default: return 'bg-gray-700 text-gray-100 hover:bg-gray-600';
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
      <Card className="h-full overflow-hidden bg-gray-900 border-gray-800 hover:border-gray-700 transition-all duration-300 shadow-md">
        <div className="relative aspect-video overflow-hidden">
          <div className={`absolute inset-0 bg-gray-800 ${isImageLoaded ? 'hidden' : 'flex items-center justify-center'}`}>
            <div className="w-8 h-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
          </div>
          <img
            src={news.banner_image || '/api/placeholder/800/450?text=No+Image'}
            alt={news.title}
            className={`w-full h-full object-cover transition-all duration-700 ${isImageLoaded ? 'animate-fade-in' : 'opacity-0'}`}
            onLoad={handleImageLoad}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-50"></div>
        </div>
        <CardHeader className="p-4">
          <div className="flex justify-between items-start mb-2">
            <Badge variant="outline" className="text-xs font-medium text-gray-300 border-gray-700">
              {news.source}
            </Badge>
            <Badge className={`text-xs font-medium ${getSentimentColor(news.overall_sentiment_label)}`}>
              {news.overall_sentiment_label}
            </Badge>
          </div>
          <CardTitle className="text-lg font-semibold line-clamp-2 mb-1 text-white">
            <a href={news.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
              {news.title}
            </a>
          </CardTitle>
          <CardDescription className="text-xs text-gray-400 flex items-center gap-1">
            <Clock size={12} className="text-gray-500" />
            {formatPublishedDate(news.time_published)} · {news.authors.join(', ')}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-2">
          <p className="text-sm text-gray-300 line-clamp-3">{news.summary}</p>
        </CardContent>
        <CardFooter className="px-4 py-3 flex justify-between border-t border-gray-800">
          <div className="flex flex-wrap gap-1">
            {news.topics.slice(0, 2).map((topic, index) => (
              <Badge key={index} variant="secondary" className="text-xs bg-gray-800 text-gray-300 hover:bg-gray-700">
                {topic.topic}
              </Badge>
            ))}
            {news.topics.length > 2 && (
              <Badge variant="secondary" className="text-xs bg-gray-800 text-gray-300 hover:bg-gray-700">
                +{news.topics.length - 2}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <button className="text-gray-400 hover:text-blue-400 transition-colors" aria-label="Bookmark">
              <Bookmark size={16} />
            </button>
            <button onClick={handleShare} className="text-gray-400 hover:text-blue-400 transition-colors" aria-label="Share">
              <Share size={16} />
            </button>
          </div>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="overflow-hidden bg-gray-900 border-gray-800 hover:border-gray-700 transition-all duration-300 shadow-md">
      <div className="flex flex-col md:flex-row">
        <div className="relative md:w-1/3 aspect-video md:aspect-square overflow-hidden">
          <div className={`absolute inset-0 bg-gray-800 ${isImageLoaded ? 'hidden' : 'flex items-center justify-center'}`}>
            <div className="w-8 h-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
          </div>
          <img
            src={news.banner_image || '/api/placeholder/800/450?text=No+Image'}
            alt={news.title}
            className={`w-full h-full object-cover transition-all duration-700 ${isImageLoaded ? 'animate-fade-in' : 'opacity-0'}`}
            onLoad={handleImageLoad}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-transparent to-transparent opacity-50 md:block hidden"></div>
        </div>
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start mb-2">
            <Badge variant="outline" className="text-xs font-medium text-gray-300 border-gray-700">
              {news.source}
            </Badge>
            <Badge className={`text-xs font-medium ${getSentimentColor(news.overall_sentiment_label)}`}>
              {news.overall_sentiment_label}
            </Badge>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            <a href={news.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
              {news.title}
            </a>
          </h3>
          <p className="text-sm text-gray-300 mb-3">{news.summary}</p>
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Clock size={12} className="text-gray-500" />
              {formatPublishedDate(news.time_published)} · {news.authors.join(', ')}
            </div>
            <div className="flex gap-2">
              <button className="text-gray-400 hover:text-blue-400 transition-colors" aria-label="Bookmark">
                <Bookmark size={16} />
              </button>
              <button onClick={handleShare} className="text-gray-400 hover:text-blue-400 transition-colors" aria-label="Share">
                <Share size={16} />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-3">
            {news.topics.map((topic, index) => (
              <Badge key={index} variant="secondary" className="text-xs bg-gray-800 text-gray-300 hover:bg-gray-700">
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
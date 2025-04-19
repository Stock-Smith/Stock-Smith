import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Shield, Newspaper } from "lucide-react";

const API_BASE_URL = "http://localhost";

interface NewsItem {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

interface NewsFormData {
  tickers: string;
  topics: string;
  time_from: string;
  time_to: string;
  sort: string;
  limit: string;
}

const News = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<NewsFormData>({
    defaultValues: {
      tickers: "",
      topics: "general",
      sort: "latest",
      limit: "10"
    }
  });

  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}`;
  };

  const formatDateForDisplay = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const fetchNews = async (data: NewsFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (data.tickers) params.append("tickers", data.tickers);
      if (data.topics) params.append("topics", data.topics);
      if (data.time_from) params.append("time_from", data.time_from);
      if (data.time_to) params.append("time_to", data.time_to);
      if (data.sort) params.append("sort", data.sort);
      if (data.limit) params.append("limit", data.limit);
      
      const response = await axios.get(`${API_BASE_URL}/api/v1/news/market-news?${params.toString()}`);
      setNews(response.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || "Failed to fetch news. Please try again.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialNews = async () => {
      const defaultParams = {
        topics: "general",
        sort: "latest",
        limit: "10",
        tickers: "",
        time_from: "",
        time_to: ""
      };
      await fetchNews(defaultParams);
    };
    loadInitialNews();
  }, []);

  const onSubmit = (data: NewsFormData) => {
    fetchNews(data);
  };

  return (
    <div className="container mx-auto py-8 bg-gray-950 text-zinc-200 min-h-screen mt-20">
      <div className="flex items-center gap-3 mb-8">
        <Newspaper className="h-8 w-8 text-purple-500" />
        <h1 className="text-3xl font-bold text-white">Market News</h1>
      </div>
      
      <Card className="mb-8 bg-zinc-900 border-zinc-800 shadow-xl">
        <CardHeader className="border-b border-zinc-800">
          <CardTitle className="text-white">Search News</CardTitle>
          <CardDescription className="text-zinc-400">
            Filter market news by ticker symbols, topics, and date range
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tickers" className="text-zinc-300">Ticker Symbols (comma separated)</Label>
                <Input
                  id="tickers"
                  placeholder="AAPL,MSFT,TSLA"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-500 focus:ring-purple-500"
                  {...register("tickers")}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="topics" className="text-zinc-300">Topics</Label>
                <Input
                  id="topics"
                  placeholder="general"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-500 focus:ring-purple-500"
                  {...register("topics")}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time_from" className="text-zinc-300">From (YYYYMMDDTHHMM)</Label>
                <Input
                  id="time_from"
                  placeholder="20230101T0000"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-500 focus:ring-purple-500"
                  {...register("time_from")}
                />
                {errors.time_from && (
                  <p className="text-sm text-red-400">{errors.time_from.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time_to" className="text-zinc-300">To (YYYYMMDDTHHMM)</Label>
                <Input
                  id="time_to"
                  placeholder="20230101T2359"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-500 focus:ring-purple-500"
                  {...register("time_to")}
                />
                {errors.time_to && (
                  <p className="text-sm text-red-400">{errors.time_to.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sort" className="text-zinc-300">Sort By</Label>
                <Input
                  id="sort"
                  placeholder="latest"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-500 focus:ring-purple-500"
                  {...register("sort")}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="limit" className="text-zinc-300">Limit</Label>
                <Input
                  id="limit"
                  type="number"
                  placeholder="10"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-500 focus:ring-purple-500"
                  {...register("limit")}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                Reset
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loading ? "Loading..." : "Search News"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-4 bg-red-900 border-red-800 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center my-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-zinc-400">Loading news...</p>
          </div>
        </div>
      ) : news.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item) => (
            <Card key={item.id} className="h-full flex flex-col bg-zinc-900 border-zinc-800 shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <CardHeader className="border-b border-zinc-800 pb-3">
                <CardTitle className="line-clamp-2 text-white text-lg">{item.headline}</CardTitle>
                <CardDescription className="text-zinc-400 flex items-center justify-between mt-2">
                  <span className="font-medium">{item.source}</span>
                  <span className="text-purple-400 text-xs bg-zinc-800 px-2 py-1 rounded-full">{formatDateForDisplay(item.datetime)}</span>
                </CardDescription>
              </CardHeader>
              {item.image && (
                <div className="px-6 pt-4">
                  <img 
                    src={item.image} 
                    alt={item.headline} 
                    className="w-full h-48 object-cover rounded-md shadow-md ring-1 ring-zinc-800"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <CardContent className="flex-grow pt-4">
                <p className="line-clamp-3 text-sm text-zinc-300">{item.summary}</p>
                {item.related && (
                  <div className="mt-3 p-2 bg-zinc-800 rounded-md">
                    <span className="text-xs font-semibold text-purple-400">Related: </span>
                    <span className="text-xs text-zinc-400">{item.related}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t border-zinc-800 pt-4">
                <Button 
                  variant="outline" 
                  className="w-full border-zinc-700 text-purple-400 hover:bg-zinc-800 hover:text-purple-300 transition-colors"
                  onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                >
                  Read Full Article
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-zinc-900 rounded-lg border border-zinc-800 shadow-xl">
          <Shield className="h-16 w-16 mx-auto mb-4 text-zinc-700" />
          <h3 className="text-xl font-medium text-white">No news found</h3>
          <p className="text-zinc-400 mt-2">
            Try adjusting your search filters or check back later
          </p>
        </div>
      )}
    </div>
  );
};

export default News;
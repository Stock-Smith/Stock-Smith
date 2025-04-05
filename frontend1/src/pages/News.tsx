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
import { AlertCircle, Shield } from "lucide-react";

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
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Market News</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Search News</CardTitle>
          <CardDescription>
            Filter market news by ticker symbols, topics, and date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tickers">Ticker Symbols (comma separated)</Label>
                <Input
                  id="tickers"
                  placeholder="AAPL,MSFT,TSLA"
                  {...register("tickers")}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="topics">Topics</Label>
                <Input
                  id="topics"
                  placeholder="general"
                  {...register("topics")}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time_from">From (YYYYMMDDTHHMM)</Label>
                <Input
                  id="time_from"
                  placeholder="20230101T0000"
                  {...register("time_from")}
                />
                {errors.time_from && (
                  <p className="text-sm text-red-500">{errors.time_from.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time_to">To (YYYYMMDDTHHMM)</Label>
                <Input
                  id="time_to"
                  placeholder="20230101T2359"
                  {...register("time_to")}
                />
                {errors.time_to && (
                  <p className="text-sm text-red-500">{errors.time_to.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sort">Sort By</Label>
                <Input
                  id="sort"
                  placeholder="latest"
                  {...register("sort")}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="limit">Limit</Label>
                <Input
                  id="limit"
                  type="number"
                  placeholder="10"
                  {...register("limit")}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
              >
                Reset
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Loading..." : "Search News"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center my-12">
          <p>Loading news...</p>
        </div>
      ) : news.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item) => (
            <Card key={item.id} className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="line-clamp-2">{item.headline}</CardTitle>
                <CardDescription>
                  {item.source} • {formatDateForDisplay(item.datetime)}
                </CardDescription>
              </CardHeader>
              {item.image && (
                <div className="px-6">
                  <img 
                    src={item.image} 
                    alt={item.headline} 
                    className="w-full h-40 object-cover rounded-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <CardContent className="flex-grow">
                <p className="line-clamp-3 text-sm">{item.summary}</p>
                {item.related && (
                  <div className="mt-2">
                    <span className="text-xs font-semibold">Related: </span>
                    <span className="text-xs">{item.related}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                >
                  Read Full Article
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium">No news found</h3>
          <p className="text-gray-500">
            Try adjusting your search filters or check back later
          </p>
        </div>
      )}
    </div>
  );
};

export default News;
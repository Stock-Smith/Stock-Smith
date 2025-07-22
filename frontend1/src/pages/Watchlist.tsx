import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  LineChart,
  Plus,
  ArrowUp,
  ArrowDown,
  Search,
  BarChart4,
  Sparkles,
  Star,
  XCircle,
  CalendarClock,
  DollarSign,
  Wifi,
  WifiOff,
  Trash2,
  ExternalLink
} from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { io, Socket } from "socket.io-client";
import { Textarea } from "@/components/ui/textarea"; // Add this import for description field

// Define structure for real-time price data
interface PriceData {
  price?: number;
  change?: number;
  changePercent?: number;
  prevClose?: number;
  updatedAt?: Date;
  isFallbackData?: boolean; // Flag to indicate if data is from API fallback
}

// Define structure for the price state map
interface PriceState {
  [ticker: string]: PriceData;
}

// Define API response structure for watchlists
interface ApiWatchlist {
  _id: string;
  userId: string;
  name: string;
  description: string;
  stocksSymbols: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Define structure for watchlist data used in component
interface WatchlistData {
  id: string;
  name: string;
  description: string;
  stocks: string[];
}

// Define interface for Finnhub API response
interface FinnhubQuoteData {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

// TradingViewWidget component
function TradingViewWidget({ symbol }: { symbol: string }) {
  const container = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!container.current) return;
    
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com"
    });
    
    container.current.innerHTML = "";
    container.current.appendChild(script);
    
    return () => {
      if (container.current) container.current.innerHTML = "";
    };
  }, [symbol]);
  
  return (
    <div ref={container} className="w-full h-[500px]" />
  );
}

const Watchlist = () => {
  const navigate = useNavigate();
  const [watchlists, setWatchlists] = useState<WatchlistData[]>([]);
  const [activeWatchlistIndex, setActiveWatchlistIndex] = useState(0);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [newWatchlistDescription, setNewWatchlistDescription] = useState("");
  const [newStockTicker, setNewStockTicker] = useState("");
  const [selectedStock, setSelectedStock] = useState("");
  const [view, setView] = useState<"table" | "chart">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddWatchlist, setShowAddWatchlist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Socket.IO State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketStatus, setSocketStatus] = useState("Disconnected");
  const [priceData, setPriceData] = useState<PriceState>({});
  const [subscribedTickers, setSubscribedTickers] = useState<Set<string>>(new Set());
  const [isLoadingFallbackData, setIsLoadingFallbackData] = useState<{[ticker: string]: boolean}>({});
  
  const currentWatchlistTickersRef = useRef<string[]>([]);
  const activeWatchlist = watchlists[activeWatchlistIndex];
  
  // Get API key from environment variables - using Vite's approach
  const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
  
  // Get authentication token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token') || '';
  };
  
  // Fetch watchlists from API
  const fetchWatchlists = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost/api/v1/user/get-watchlist', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch watchlists: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform API response to component format
      const transformedWatchlists: WatchlistData[] = data.watchlists.map((wl: ApiWatchlist) => ({
        id: wl._id,
        name: wl.name,
        description: wl.description,
        stocks: wl.stocksSymbols.map(symbol => symbol.toUpperCase())
      }));
      
      setWatchlists(transformedWatchlists);
      
      // Set initial selected stock if available
      if (transformedWatchlists.length > 0 && transformedWatchlists[0].stocks.length > 0) {
        setSelectedStock(transformedWatchlists[0].stocks[0]);
      }
    } catch (err) {
      console.error('Error fetching watchlists:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch watchlists');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create new watchlist
  const createWatchlist = async () => {
    if (!newWatchlistName.trim()) return;
    
    try {
      const response = await fetch('http://localhost/api/v1/user/create-watchlist', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newWatchlistName,
          description: newWatchlistDescription,
          stocksSymbols: []
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create watchlist: ${response.status} ${response.statusText}`);
      }
      
      // Refresh watchlists after creation
      await fetchWatchlists();
      
      // Reset form
      setNewWatchlistName("");
      setNewWatchlistDescription("");
      setShowAddWatchlist(false);
      
      // Set active index to the newly created watchlist
      setActiveWatchlistIndex(watchlists.length);
    } catch (err) {
      console.error('Error creating watchlist:', err);
      alert(err instanceof Error ? err.message : 'Failed to create watchlist');
    }
  };
  
  // Add stock to watchlist
  const addStock = async () => {
    if (!newStockTicker.trim() || !activeWatchlist) return;
    
    const tickerToAdd = newStockTicker.toUpperCase();
    
    // Check if stock already exists in watchlist
    if (activeWatchlist.stocks.includes(tickerToAdd)) {
      alert(`${tickerToAdd} is already in this watchlist.`);
      setNewStockTicker("");
      return;
    }
    
    try {
      const response = await fetch('http://localhost/api/v1/user/add-to-watchlist', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          watchlistId: activeWatchlist.id,
          stocksSymbols: [newStockTicker.toLowerCase()]
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add stock: ${response.status} ${response.statusText}`);
      }
      
      // Update local state to avoid refetching all watchlists
      const updatedWatchlists = watchlists.map((watchlist, index) => {
        if (index === activeWatchlistIndex) {
          return {
            ...watchlist,
            stocks: [...watchlist.stocks, tickerToAdd]
          };
        }
        return watchlist;
      });
      
      setWatchlists(updatedWatchlists);
      setNewStockTicker("");
      
      // Immediately subscribe if connected
      if (socket && isConnected) {
        console.log('Subscribing to newly added stock:', tickerToAdd);
        socket.emit('subscribe', [tickerToAdd]);
      }
      
      // Always fetch fallback data for new stock
      fetchStockDataFallback(tickerToAdd);
    } catch (err) {
      console.error('Error adding stock:', err);
      alert(err instanceof Error ? err.message : 'Failed to add stock');
    }
  };
  
  // Delete watchlist
  const deleteWatchlist = async (watchlistId: string) => {
    if (!confirm("Are you sure you want to delete this watchlist?")) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost/api/v1/user/delete-watchlist?watchlistID=${watchlistId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete watchlist: ${response.status} ${response.statusText}`);
      }
      
      // Refresh watchlists after deletion
      await fetchWatchlists();
      
      // Adjust active index if needed
      if (activeWatchlistIndex >= watchlists.length - 1) {
        setActiveWatchlistIndex(Math.max(0, watchlists.length - 2));
      }
    } catch (err) {
      console.error('Error deleting watchlist:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete watchlist');
    }
  };
  
  // Remove stock from watchlist
  const removeStock = async (tickerToRemove: string) => {
    if (!activeWatchlist) return;
    const tickerUpper = tickerToRemove.toUpperCase();
  
    try {
      const response = await fetch(
        `http://localhost/api/v1/user/delete-stock?watchlistID=${activeWatchlist.id}&stockSymbol=${tickerUpper.toLowerCase()}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        }
      );
  
      if (!response.ok) {
        throw new Error(`Failed to remove stock: ${response.status} ${response.statusText}`);
      }
  
      // Update local watchlists state to remove the stock
      const updatedStocks = activeWatchlist.stocks.filter(stock => stock !== tickerUpper);
      const updatedWatchlists = watchlists.map((watchlist, index) => {
        if (index === activeWatchlistIndex) {
          return { ...watchlist, stocks: updatedStocks };
        }
        return watchlist;
      });
      setWatchlists(updatedWatchlists);
  
      // Unsubscribe from socket updates if connected
      if (socket && isConnected) {
        console.log('Unsubscribing from removed stock:', tickerUpper);
        socket.emit('unsubscribe', [tickerUpper]);
      }
  
      // Remove price data for the removed stock
      setPriceData(prevData => {
        const newData = { ...prevData };
        delete newData[tickerUpper];
        return newData;
      });
  
      // If selected stock was removed, update to next available or empty
      if (selectedStock === tickerUpper) {
        setSelectedStock(updatedStocks[0] || '');
      }
    } catch (err) {
      console.error('Error removing stock:', err);
      alert(err instanceof Error ? err.message : 'Failed to remove stock');
    }
  };
  
  
  // Fallback fetch function for when socket data is unavailable
  const fetchStockDataFallback = async (ticker: string) => {
    if (!FINNHUB_API_KEY) {
      console.error("Finnhub API key is not defined in environment variables");
      // Use a static fallback for demo/development purposes
      const mockData = getMockPriceData(ticker);
      setPriceData(prevData => ({
        ...prevData,
        [ticker]: {
          ...mockData,
          isFallbackData: true,
          updatedAt: new Date(),
        }
      }));
      return mockData;
    }
    
    const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`;
    
    try {
      setIsLoadingFallbackData(prev => ({ ...prev, [ticker]: true }));
      const response = await fetch(url);
      const data: FinnhubQuoteData = await response.json();
      
      // Update price data with fetched data
      setPriceData(prevData => {
        return {
          ...prevData,
          [ticker]: {
            price: data.c,
            change: data.d,
            changePercent: data.dp,
            prevClose: data.pc,
            updatedAt: new Date(),
            isFallbackData: true, // Flag to indicate this is fallback data
          }
        };
      });
      
      console.log(`Fallback data fetched for ${ticker}:`, data);
      return data;
    } catch (error) {
      console.error(`Error fetching fallback data for ${ticker}:`, error);
      // Use mock data as a last resort
      const mockData = getMockPriceData(ticker);
      setPriceData(prevData => ({
        ...prevData,
        [ticker]: {
          ...mockData,
          isFallbackData: true,
          updatedAt: new Date(),
        }
      }));
      return mockData;
    } finally {
      setIsLoadingFallbackData(prev => ({ ...prev, [ticker]: false }));
    }
  };
  
  // Function to generate mock price data for development/fallback
  const getMockPriceData = (ticker: string): PriceData => {
    // Generate deterministic but seemingly random values based on ticker
    const tickerSum = ticker.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const basePrice = (tickerSum % 1000) + 50;
    const change = ((tickerSum % 200) - 100) / 10;
    const prevClose = basePrice - change;
    const changePercent = (change / prevClose) * 100;
    
    return {
      price: basePrice,
      change: change,
      changePercent: changePercent,
      prevClose: prevClose,
      updatedAt: new Date(),
      isFallbackData: true
    };
  };
  
  // Function to check if we need fallback data for a ticker
  const checkAndFetchFallbackData = (ticker: string) => {
    const currentData = priceData[ticker];
    
    // If we don't have price data or it's showing as undefined/null
    if (!currentData || 
        currentData.price === undefined || 
        currentData.change === undefined || 
        currentData.changePercent === undefined) {
      // Avoid duplicate fetches
      if (!isLoadingFallbackData[ticker]) {
        console.log(`Fetching fallback data for ${ticker}`);
        fetchStockDataFallback(ticker);
      }
    }
  };
  
  // Function to navigate to stock prediction page
  const navigateToStockPrediction = (ticker: string) => {
    navigate(`/stock/${ticker}`);
  };
  
  const handleWatchlistNavigation = (direction: "prev" | "next") => {
    setActiveWatchlistIndex(prev => {
      if (direction === "prev" && prev > 0) return prev - 1;
      if (direction === "next" && prev < watchlists.length - 1) return prev + 1;
      return prev;
    });
    
    // Clear search when changing watchlist
    setSearchQuery("");
    
    // Set selected stock for chart view
    const nextWatchlistIndex = direction === "prev" 
      ? Math.max(0, activeWatchlistIndex - 1) 
      : Math.min(watchlists.length - 1, activeWatchlistIndex + 1);
    
    if (watchlists[nextWatchlistIndex]?.stocks.length > 0) {
      setSelectedStock(watchlists[nextWatchlistIndex].stocks[0]);
    } else {
      setSelectedStock("");
    }
  };
  
  // Initial fetch of watchlists
  useEffect(() => {
    fetchWatchlists();
  }, []);
  
  // Socket Connection Effect
  useEffect(() => {
    const userId = "user123"; // Replace with actual user ID or auth mechanism
    
    if (!userId) {
      console.log("User ID not available, skipping socket connection.");
      return;
    }
    
    console.log(`Attempting to connect socket for userId: ${userId}`);
    const newSocket = io('http://localhost:8006', {
      transports: ['websocket', 'polling']
    });
    
    setSocket(newSocket);
    setSocketStatus('Connecting...');
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      setSocketStatus(`Connected (ID: ${newSocket.id})`);
      console.log(`Socket connected: ${newSocket.id}, Transport: ${newSocket.io.engine.transport.name}`);
      newSocket.emit('authenticate', userId);
      console.log(`Emitted authenticate event for userId: ${userId}`);
    });
    
    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setSocketStatus('Disconnected');
      setSubscribedTickers(new Set());
      
      // When socket disconnects, fetch fallback data for all active tickers
      if (activeWatchlist) {
        activeWatchlist.stocks.forEach(ticker => {
          checkAndFetchFallbackData(ticker);
        });
      }
    });
    
    newSocket.on('error', (error) => {
      console.error('Socket Error:', error);
      setSocketStatus(`Error: ${error.message || JSON.stringify(error)}`);
    });
    
    // Price Update Handler
    newSocket.on('price', (data: { ticker: string; price: number; prevClose?: number }) => {
      const ticker = data.ticker?.toUpperCase();
      if (!ticker) {
        console.warn("Received price data without ticker:", data);
        return;
      }
      
      setPriceData(prevData => {
        const currentStockData = prevData[ticker] || {};
        const prevClose = data.prevClose ?? currentStockData.prevClose ?? data.price * 0.99;
        const change = data.price - prevClose;
        const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;
        
        return {
          ...prevData,
          [ticker]: {
            price: data.price,
            prevClose: prevClose,
            change: change,
            changePercent: changePercent,
            updatedAt: new Date(),
            isFallbackData: false,
          }
        };
      });
    });
    
    newSocket.on('subscribed', (tickers: string[]) => {
      console.log('Successfully subscribed to:', tickers);
      setSubscribedTickers(prev => new Set([...prev, ...tickers.map(t => t.toUpperCase())]));
    });
    
    newSocket.on('unsubscribed', (tickers: string[]) => {
      console.log('Successfully unsubscribed from:', tickers);
      setSubscribedTickers(prev => {
        const newSet = new Set(prev);
        tickers.forEach(t => newSet.delete(t.toUpperCase()));
        return newSet;
      });
    });
    
    newSocket.on('subscriptions_restored', (tickers: string[]) => {
      console.log('Restored subscriptions:', tickers);
      setSubscribedTickers(new Set(tickers.map(t => t.toUpperCase())));
    });
    
    return () => {
      console.log('Disconnecting socket...');
      newSocket.disconnect();
      setIsConnected(false);
      setSocketStatus('Disconnected');
      setSubscribedTickers(new Set());
    };
  }, []);
  
  // Subscription Management Effect
  useEffect(() => {
    if (!socket || !isConnected || !activeWatchlist) {
      return;
    }
    
    const newTickers = activeWatchlist.stocks;
    const oldTickers = currentWatchlistTickersRef.current;
    
    const tickersToUnsubscribe = oldTickers.filter(ticker => !newTickers.includes(ticker));
    const tickersToSubscribe = newTickers.filter(ticker => !oldTickers.includes(ticker));
    
    // Unsubscribe from stocks no longer in the active watchlist
    if (tickersToUnsubscribe.length > 0) {
      console.log('Unsubscribing from:', tickersToUnsubscribe);
      socket.emit('unsubscribe', tickersToUnsubscribe);
    }
    
    // Subscribe to new stocks in the active watchlist
    if (tickersToSubscribe.length > 0) {
      console.log('Subscribing to:', tickersToSubscribe);
      socket.emit('subscribe', tickersToSubscribe);
      
      // Fetch fallback data for new tickers immediately
      tickersToSubscribe.forEach(ticker => {
        fetchStockDataFallback(ticker);
      });
    }
    
    // Update the ref for the next comparison
    currentWatchlistTickersRef.current = newTickers;
  }, [activeWatchlist, isConnected, socket]);
  
  // Add a useEffect to check for missing data periodically
  useEffect(() => {
    if (!activeWatchlist) return;
    
    // Check for missing data in current watchlist
    const checkMissingData = () => {
      activeWatchlist.stocks.forEach(ticker => {
        checkAndFetchFallbackData(ticker);
      });
    };
    
    // Initial check
    checkMissingData();
    
    // Set up interval to periodically check for missing data
    const intervalId = setInterval(checkMissingData, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [activeWatchlist, priceData]);
  
  // Filter stocks based on search query
  const filteredStocks = activeWatchlist?.stocks.filter(stock =>
    stock.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  return (
    <Card className="w-full h-screen mt-8 bg-[#1a1a24] border-[#27272f] text-white pt-8">
      <CardHeader className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Watchlist Navigation and Title */}
          <div className="flex items-center gap-2">
            {/* Prev Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleWatchlistNavigation("prev")} 
              disabled={activeWatchlistIndex === 0 || watchlists.length === 0}
              className="text-slate-400 hover:text-indigo-400 hover:bg-[#24243c] rounded-full h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous watchlist</span>
            </Button>
            
            {/* Watchlist Name and Count */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                {watchlists.length > 0 ? `${activeWatchlistIndex + 1}/${watchlists.length}` : '0/0'}
              </span>
              <h3 className="text-lg font-semibold">
                {activeWatchlist?.name || "No Watchlists"}
              </h3>
            </div>
            
            {/* Next Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleWatchlistNavigation("next")} 
              disabled={activeWatchlistIndex === watchlists.length - 1 || watchlists.length === 0}
              className="text-slate-400 hover:text-indigo-400 hover:bg-[#24243c] rounded-full h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next watchlist</span>
            </Button>
            
            {/* Add Watchlist Button */}
            <Dialog open={showAddWatchlist} onOpenChange={setShowAddWatchlist}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-slate-400 hover:text-indigo-400 hover:bg-[#24243c] rounded-full h-8 w-8"
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add new watchlist</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1a24] border-[#27272f] text-white">
                <DialogHeader>
                  <DialogTitle>Create New Watchlist</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Enter a name and description for your new watchlist.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Input 
                    value={newWatchlistName} 
                    onChange={(e) => setNewWatchlistName(e.target.value)} 
                    placeholder="Enter watchlist name"
                    className="bg-[#24243c] border-[#27272f] text-slate-200 focus-visible:ring-indigo-500"
                  />
                  <Textarea
                    value={newWatchlistDescription}
                    onChange={(e) => setNewWatchlistDescription(e.target.value)}
                    placeholder="Enter watchlist description (optional)"
                    className="bg-[#24243c] border-[#27272f] text-slate-200 focus-visible:ring-indigo-500"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddWatchlist(false)} className="border-[#27272f] text-indigo-900 hover:bg-[#24243c] hover:text-white">Cancel</Button>
                  <Button onClick={createWatchlist} className="bg-indigo-600 hover:bg-indigo-700">Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Delete Watchlist Button (if a watchlist is active) */}
            {activeWatchlist && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => deleteWatchlist(activeWatchlist.id)}
                className="text-rose-400 hover:text-rose-300 hover:bg-rose-900/20 rounded-full h-8 w-8 ml-2"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete watchlist</span>
              </Button>
            )}
          </div>
          
          {/* Right Side Controls: Search, Add Stock, View Toggle, Status */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search stocks..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 bg-[#24243c] border-[#27272f] text-slate-200 text-sm w-32 sm:w-40 focus-visible:ring-indigo-500"
              />
            </div>
            
            {/* Add Stock Button & Dialog */}
            {activeWatchlist && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 bg-[#24243c] border-[#27272f] text-white hover:bg-[#2a2a42]"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Stock
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1a1a24] border-[#27272f] text-white">
                  <DialogHeader>
                    <DialogTitle>Add Stock to {activeWatchlist?.name}</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Enter a stock ticker symbol.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Input 
                      value={newStockTicker} 
                      onChange={(e) => setNewStockTicker(e.target.value)} 
                      placeholder="Enter stock ticker (e.g. AAPL)"
                      className="bg-[#24243c] border-[#27272f] text-slate-200 focus-visible:ring-indigo-500"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setNewStockTicker('')} className="border-[#27272f] text-indigo-900 hover:bg-[#24243c] hover:text-white">Cancel</Button>
                    <Button onClick={addStock} className="bg-indigo-600 hover:bg-indigo-700">Add</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            
            {/* View Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle 
                    pressed={view === "chart"} 
                    onClick={() => setView(view === "table" ? "chart" : "table")} 
                    className="bg-[#24243c] hover:bg-[#2a2a42] data-[state=on]:bg-indigo-600 border-[#27272f] h-8 text-white"
                  >
                    {view === "table" ? (
                      <BarChart4 className="h-4 w-4" />
                    ) : (
                      <LineChart className="h-4 w-4" />
                    )}
                    <span className="ml-2 hidden sm:inline">{view === "table" ? "Table" : "Chart"}</span>
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Switch to {view === "table" ? "Chart" : "Table"} View</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Socket Status Indicator */}
            <Badge variant="outline" className={`h-8 px-2 border-[#27272f] ${isConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isConnected ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
              <span className="text-xs">{socketStatus}</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <span className="ml-2 text-slate-400">Loading watchlists...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 p-4">
            <XCircle className="h-12 w-12 text-rose-500 mb-2" />
            <h3 className="text-lg font-medium text-rose-400">Error Loading Watchlists</h3>
            <p className="text-slate-400 text-center mt-2">{error}</p>
            <Button onClick={fetchWatchlists} className="mt-4 bg-indigo-600 hover:bg-indigo-700">
              Retry
            </Button>
          </div>
        ) : watchlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 p-4">
            <Star className="h-12 w-12 text-indigo-400 mb-2" />
            <h3 className="text-lg font-medium">No Watchlists Found</h3>
            <p className="text-slate-400 text-center mt-2">
              Create your first watchlist to start tracking stocks.
            </p>
            <Button 
              onClick={() => setShowAddWatchlist(true)} 
              className="mt-4 bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Watchlist
            </Button>
          </div>
        ) : view === "table" ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#27272f] hover:bg-transparent">
                  <TableHead className="text-slate-400">Symbol</TableHead>
                  <TableHead className="text-slate-400">Price</TableHead>
                  <TableHead className="text-slate-400">Change</TableHead>
                  <TableHead className="text-slate-400">Change %</TableHead>
                  <TableHead className="text-slate-400">Updated</TableHead>
                  <TableHead className="text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStocks.length > 0 ? filteredStocks.map((ticker) => {
                  const tickerUpper = ticker.toUpperCase();
                  const currentPriceData = priceData[tickerUpper];
                  
                  const price = currentPriceData?.price;
                  const change = currentPriceData?.change;
                  const changePercent = currentPriceData?.changePercent;
                  const updatedAt = currentPriceData?.updatedAt;
                  const isFallbackData = currentPriceData?.isFallbackData;
                  
                  // If we don't have data yet, trigger a fallback fetch
                  if ((price === undefined || change === undefined || changePercent === undefined) && 
                      !isLoadingFallbackData[tickerUpper]) {
                    checkAndFetchFallbackData(tickerUpper);
                  }
                  
                  const isPositive = change !== undefined && change >= 0;
                  const changeClass = change === undefined ? 'text-slate-400' : (isPositive ? 'text-emerald-400' : 'text-rose-400');
                  const arrow = change === undefined ? null : (isPositive ? <ArrowUp className="h-3 w-3 inline" /> : <ArrowDown className="h-3 w-3 inline" />);
                  
                  return (
                    <TableRow 
                      key={tickerUpper} 
                      className="border-[#27272f] cursor-pointer hover:bg-[#24243c]"
                      onClick={() => {
                        setSelectedStock(tickerUpper);
                        setView("chart");
                      }}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center bg-indigo-600 rounded-full h-6 w-6 text-xs">
                            {ticker.charAt(0)}
                          </div>
                          <span>{ticker}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {price !== undefined 
                          ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : isLoadingFallbackData[tickerUpper] ? 'Loading...' : '--'}
                      </TableCell>
                      <TableCell className={changeClass}>
                        {change !== undefined ? (
                          <span>
                            {arrow}
                            {change >= 0 ? '+' : ''}{change.toFixed(2)}
                          </span>
                        ) : (
                          isLoadingFallbackData[tickerUpper] ? 'Loading...' : '--'
                        )}
                      </TableCell>
                      <TableCell className={changeClass}>
                        {changePercent !== undefined ? (
                          <span>
                            {arrow}
                            {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                          </span>
                        ) : (
                          isLoadingFallbackData[tickerUpper] ? 'Loading...' : '--'
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">
                        {updatedAt
                          ? `${updatedAt.toLocaleTimeString()} ${isFallbackData ? '(API)' : '(Live)'}`
                          : '--'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToStockPrediction(ticker);
                            }}
                            className="h-7 w-7 rounded-full text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span className="sr-only">Analyze Deeply</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeStock(ticker);
                            }}
                            className="h-7 w-7 rounded-full text-rose-400 hover:text-rose-300 hover:bg-rose-900/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Remove from watchlist</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      {activeWatchlist?.stocks.length === 0 ? (
                        <>
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Star className="h-8 w-8 text-indigo-400" />
                            <p className="text-slate-400">This watchlist is empty.</p>
                            <p className="text-slate-500">Use "Add Stock" to add symbols.</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Search className="h-8 w-8 text-slate-400" />
                            <p className="text-slate-400">No stocks match your search "{searchQuery}".</p>
                          </div>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          // Chart View
          <div className="grid grid-cols-1 md:grid-cols-4 h-[600px]">
            {/* Stock List on the Left */}
            <div className="md:col-span-1 border-r border-[#27272f] overflow-y-auto">
              <div className="p-2 border-b border-[#27272f] bg-[#1e1e2a]">
                <h4 className="text-sm font-medium text-slate-300">Stocks</h4>
              </div>
              <ScrollArea className="h-[560px]">
                {activeWatchlist?.stocks.map((ticker) => {
                  const tickerUpper = ticker.toUpperCase();
                  const currentPriceData = priceData[tickerUpper];
                  
                  const price = currentPriceData?.price;
                  const change = currentPriceData?.change;
                  const changePercent = currentPriceData?.changePercent;
                  const isFallbackData = currentPriceData?.isFallbackData;
                  
                  // If we don't have data yet, trigger a fallback fetch
                  if ((price === undefined || change === undefined || changePercent === undefined) && 
                      !isLoadingFallbackData[tickerUpper]) {
                    checkAndFetchFallbackData(tickerUpper);
                  }
                  
                  const isPositive = change !== undefined && change >= 0;
                  const changeClass = change === undefined ? 'text-slate-400' : (isPositive ? 'text-emerald-400' : 'text-rose-400');
                  const arrow = change === undefined ? null : (isPositive ? <ArrowUp className="h-3 w-3 inline" /> : <ArrowDown className="h-3 w-3 inline" />);
                  
                  return (
                    <div 
                      key={tickerUpper}
                      onClick={() => setSelectedStock(tickerUpper)}
                      className={`cursor-pointer p-2 transition-colors group border-b border-[0.5px] border-white/[0.08] ${
                        selectedStock === tickerUpper ? "bg-indigo-600/20" : "hover:bg-[#1a1a24]"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{ticker}</div>
                        <div className="text-sm">
                          {price !== undefined 
                            ? `$${price.toFixed(2)}`
                            : isLoadingFallbackData[tickerUpper] ? 'Loading...' : '--'}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <div className={`text-xs ${changeClass}`}>
                          {change !== undefined && changePercent !== undefined ? (
                            <>
                              {arrow}
                              {change >= 0 ? '+' : ''}{change.toFixed(2)} (
                              {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
                            </>
                          ) : (
                            isLoadingFallbackData[tickerUpper] ? 'Loading...' : '--'
                          )}
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToStockPrediction(ticker);
                            }}
                            className="h-6 w-6 rounded-full text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span className="sr-only">Analyze Deeply</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeStock(ticker);
                            }}
                            className="h-6 w-6 rounded-full text-rose-400 hover:text-rose-300 hover:bg-rose-900/20"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span className="sr-only">Remove from watchlist</span>
                          </Button>
                        </div>
                      </div>
                      {isFallbackData && (
                        <div className="text-[10px] text-slate-500 mt-1">
                          API data (not live)
                        </div>
                      )}
                    </div>
                  );
                })}
              </ScrollArea>
            </div>
            
            {/* Chart on the Right */}
            <div className="md:col-span-3 p-4">
              {selectedStock ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{selectedStock} - Daily Chart</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigateToStockPrediction(selectedStock)}
                      className="text-xs bg-[#24243c] border-[#27272f] text-white hover:bg-[#2a2a42]"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                      Analyze Deeply
                    </Button>
                  </div>
                  <TradingViewWidget symbol={selectedStock} />
                  <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                    <span>Data source: {isConnected ? 'Real-time' : 'Finnhub API (static)'}</span>
                    <span>Daily Chart</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <LineChart className="h-12 w-12 text-slate-600 mb-2" />
                  <p className="text-slate-400">Select a stock to view its chart</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between items-center p-2 border-t border-[#27272f] text-xs text-slate-500">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setView(view === "table" ? "chart" : "table")}
          className="gap-2 text-xs text-slate-400 hover:text-indigo-300 hover:bg-[#24243c] h-8"
        >
          {view === "table" ? <LineChart className="h-3.5 w-3.5" /> : <BarChart4 className="h-3.5 w-3.5" />}
          Switch View
        </Button>
        <div className="flex items-center gap-1">
          {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {isConnected ? 'Live data available' : 'Using Finnhub API fallback data'}
        </div>
      </CardFooter>
    </Card>
  );
};

export default Watchlist;

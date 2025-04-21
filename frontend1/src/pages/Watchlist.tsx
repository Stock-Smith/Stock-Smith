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
import { Textarea } from "@/components/ui/textarea"; // Import for description field

// Define structure for real-time price data
interface PriceData {
  price?: number;
  change?: number;
  changePercent?: number;
  prevClose?: number;
  updatedAt?: Date;
}

// Define structure for the price state map
interface PriceState {
  [ticker: string]: PriceData;
}

interface Stock {
  stock_name: string;
}

interface WatchlistData {
  _id: string; // MongoDB ID from backend
  name: string; // Changed from watchlistName to match API
  description?: string; // Added to match API
  stocks: Stock[];
}

// --- TradingViewWidget component remains the same ---
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
    <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }}>
      <div className="tradingview-widget-container__widget" style={{ height: "calc(100% - 32px)", width: "100%" }}></div>
    </div>
  );
}
// --- End of TradingViewWidget component ---

const Watchlist = () => {
  const navigate = useNavigate();
  
  // State for API data
  const [watchlists, setWatchlists] = useState<WatchlistData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for UI
  const [activeWatchlistIndex, setActiveWatchlistIndex] = useState(0);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [newWatchlistDescription, setNewWatchlistDescription] = useState("");
  const [newStockTicker, setNewStockTicker] = useState("");
  const [selectedStock, setSelectedStock] = useState("");
  const [view, setView] = useState<"table" | "chart">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddWatchlist, setShowAddWatchlist] = useState(false);
  
  // Socket.IO State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketStatus, setSocketStatus] = useState("Disconnected");
  const [priceData, setPriceData] = useState<PriceState>({});
  const [subscribedTickers, setSubscribedTickers] = useState<Set<string>>(new Set());
  const currentWatchlistTickersRef = useRef<string[]>([]);
  
  // Get the active watchlist
  const activeWatchlist = watchlists[activeWatchlistIndex];

  // Get auth token - In a real app, you'd get this from your auth context/state
  const getAuthToken = () => {
    // Replace this with your actual token retrieval logic
    return localStorage.getItem('token') || 'your-auth-token';
  };

  // API calls
  const fetchWatchlists = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost/api/v1/user/get-watchlist', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch watchlists: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform API data to match our component's expected format
      const formattedWatchlists: WatchlistData[] = data.watchlists.map((watchlist: any) => ({
        _id: watchlist._id,
        name: watchlist.name,
        description: watchlist.description || "",
        stocks: Array.isArray(watchlist.stocksSymbols) 
          ? watchlist.stocksSymbols.map((symbol: string) => ({ stock_name: symbol }))
          : typeof watchlist.stocksSymbols === 'string'
            ? [{ stock_name: watchlist.stocksSymbols }]
            : []
      }));

      setWatchlists(formattedWatchlists);
      
      // Set the first stock as selected if available
      if (formattedWatchlists.length > 0 && formattedWatchlists[0].stocks.length > 0) {
        setSelectedStock(formattedWatchlists[0].stocks[0].stock_name);
      }
      
      setError(null);
    } catch (err) {
      console.error("Error fetching watchlists:", err);
      setError(`Failed to load watchlists: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

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
          stocksSymbols: "" // Create empty watchlist initially
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create watchlist: ${response.status}`);
      }

      // Refresh watchlists after creation
      await fetchWatchlists();
      
      // Reset form
      setNewWatchlistName("");
      setNewWatchlistDescription("");
      setShowAddWatchlist(false);
      
      // Optionally switch to the new watchlist
      setActiveWatchlistIndex(watchlists.length); // This will be the index of the new watchlist
    } catch (err) {
      console.error("Error creating watchlist:", err);
      alert(`Failed to create watchlist: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const addStock = async () => {
    if (!newStockTicker.trim() || !activeWatchlist) return;
    
    const tickerToAdd = newStockTicker.toUpperCase();
    
    // Prevent adding duplicates to the same watchlist
    if (activeWatchlist.stocks.some(s => s.stock_name.toUpperCase() === tickerToAdd)) {
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
          watchlistId: activeWatchlist._id,
          stocksSymbols: [tickerToAdd]
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to add stock: ${response.status}`);
      }

      // Refresh watchlists after adding stock
      await fetchWatchlists();
      
      // Reset form
      setNewStockTicker("");
      
      // Immediately subscribe if connected
      if (socket && isConnected) {
        console.log('Subscribing to newly added stock:', tickerToAdd);
        socket.emit('subscribe', [tickerToAdd]);
      }
    } catch (err) {
      console.error("Error adding stock:", err);
      alert(`Failed to add stock: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const removeStock = async (tickerToRemove: string) => {
    if (!activeWatchlist) return;
    
    // Since there's no specific endpoint to remove a single stock,
    // we'll get all current stocks, filter out the one to remove,
    // and update the watchlist with the remaining stocks
    
    try {
      const currentStocks = activeWatchlist.stocks
        .map(stock => stock.stock_name)
        .filter(symbol => symbol.toUpperCase() !== tickerToRemove.toUpperCase());
      
      const response = await fetch('http://localhost/api/v1/user/add-to-watchlist', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          watchlistId: activeWatchlist._id,
          stocksSymbols: currentStocks
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to remove stock: ${response.status}`);
      }

      // Refresh watchlists after removing stock
      await fetchWatchlists();
      
      // Unsubscribe if connected
      if (socket && isConnected) {
        console.log('Unsubscribing from removed stock:', tickerToRemove.toUpperCase());
        socket.emit('unsubscribe', [tickerToRemove.toUpperCase()]);
      }
    } catch (err) {
      console.error("Error removing stock:", err);
      alert(`Failed to remove stock: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const deleteWatchlist = async (watchlistId: string) => {
    try {
      const response = await fetch(`http://localhost/api/v1/user/delete-watchlist?watchlistID=${watchlistId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete watchlist: ${response.status}`);
      }

      // Refresh watchlists after deletion
      await fetchWatchlists();
      
      // Set active index to 0 if the deleted watchlist was active
      if (activeWatchlistIndex >= watchlists.length - 1) {
        setActiveWatchlistIndex(Math.max(0, watchlists.length - 2));
      }
    } catch (err) {
      console.error("Error deleting watchlist:", err);
      alert(`Failed to delete watchlist: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Initial fetch of watchlists
  useEffect(() => {
    fetchWatchlists();
  }, []);

  // Socket Connection Effect
  useEffect(() => {
    // Get user ID from auth context or similar
    const userId = "user123"; // Replace with actual user ID logic
    
    if (!userId) {
      console.log("User ID not available, skipping socket connection.");
      return;
    }
    
    console.log(`Attempting to connect socket for userId: ${userId}`);
    // Connect to the socket server
    const newSocket = io('http://localhost:8003', {
      transports: ['websocket', 'polling']
    });
    
    setSocket(newSocket);
    setSocketStatus('Connecting...');

    newSocket.on('connect', () => {
      setIsConnected(true);
      setSocketStatus(`Connected (ID: ${newSocket.id})`);
      console.log(`Socket connected: ${newSocket.id}, Transport: ${newSocket.io.engine.transport.name}`);
      // Authenticate with the server using the userId
      newSocket.emit('authenticate', userId);
      console.log(`Emitted authenticate event for userId: ${userId}`);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setSocketStatus('Disconnected');
      setSubscribedTickers(new Set());
      setPriceData({});
      console.log('Socket disconnected');
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
      
      // Optionally remove price data for unsubscribed tickers
      setPriceData(prevData => {
        const newData = { ...prevData };
        tickers.forEach(t => delete newData[t.toUpperCase()]);
        return newData;
      });
    });

    newSocket.on('subscriptions_restored', (tickers: string[]) => {
      console.log('Restored subscriptions:', tickers);
      setSubscribedTickers(new Set(tickers.map(t => t.toUpperCase())));
    });

    // Cleanup on component unmount
    return () => {
      console.log('Disconnecting socket...');
      newSocket.disconnect();
      setIsConnected(false);
      setSocketStatus('Disconnected');
      setSubscribedTickers(new Set());
      setPriceData({});
    };
  }, []);

  // Subscription Management Effect
  useEffect(() => {
    if (!socket || !isConnected || !activeWatchlist) {
      return;
    }

    const newTickers = activeWatchlist.stocks.map(stock => stock.stock_name.toUpperCase());
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
    }

    // Update the ref for the next comparison
    currentWatchlistTickersRef.current = newTickers;
  }, [activeWatchlist, isConnected, socket]);

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
      setSelectedStock(watchlists[nextWatchlistIndex].stocks[0].stock_name);
    }
  };

  // Function to navigate to stock prediction page
  const navigateToStockPrediction = (ticker: string) => {
    navigate(`/stock/${ticker}`);
  };

  // Filter stocks based on search query
  const filteredStocks = activeWatchlist?.stocks.filter(stock =>
    stock.stock_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Loading state
  if (isLoading && watchlists.length === 0) {
    return (
      <div className="flex flex-col h-full bg-[#121218] text-slate-200 p-4 gap-4 mt-10 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="text-slate-400 mt-4">Loading watchlists...</p>
      </div>
    );
  }

  // Error state
  if (error && watchlists.length === 0) {
    return (
      <div className="flex flex-col h-full bg-[#121218] text-slate-200 p-4 gap-4 mt-10 items-center justify-center">
        <XCircle className="h-12 w-12 text-rose-500" />
        <p className="text-slate-400 mt-4">{error}</p>
        <Button onClick={fetchWatchlists} className="mt-4 bg-indigo-600 hover:bg-indigo-700">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#121218] text-slate-200 p-4 gap-4 mt-10">
      <Card className="bg-[#1a1a24] border-[#27272f] shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
          {/* Watchlist Navigation and Title */}
          <div className="flex items-center gap-2">
            {/* Prev Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => 
                    handleWatchlistNavigation("prev")}
                    disabled={activeWatchlistIndex === 0 || watchlists.length === 0}
                    className="text-slate-400 hover:text-indigo-400 hover:bg-[#24243c] rounded-full h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Previous watchlist</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Watchlist Name and Count */}
            <div className="flex flex-col">
              <span className="text-xs text-slate-400">
                {watchlists.length > 0 ? `${activeWatchlistIndex + 1}/${watchlists.length}` : "0/0"}
              </span>
              <h2 className="text-lg font-semibold">
                {activeWatchlist?.name || "No Watchlists"}
              </h2>
            </div>

            {/* Next Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => 
                    handleWatchlistNavigation("next")}
                    disabled={activeWatchlistIndex === watchlists.length - 1 || watchlists.length === 0}
                    className="text-slate-400 hover:text-indigo-400 hover:bg-[#24243c] rounded-full h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Next watchlist</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Add Watchlist Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => 
                    setShowAddWatchlist(true)}
                    className="text-slate-400 hover:text-indigo-400 hover:bg-[#24243c] rounded-full h-8 w-8"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add new watchlist</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Delete Watchlist Button */}
            {watchlists.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete the "${activeWatchlist?.name}" watchlist?`)) {
                          deleteWatchlist(activeWatchlist._id);
                        }
                      }}
                      className="text-slate-400 hover:text-rose-400 hover:bg-[#24243c] rounded-full h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete watchlist</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Add Watchlist Dialog */}
          <Dialog open={showAddWatchlist} onOpenChange={setShowAddWatchlist}>
            <DialogContent className="bg-[#1a1a24] border-[#27272f] text-slate-200">
              <DialogHeader>
                <DialogTitle>Create New Watchlist</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Enter a name and optional description for your new watchlist.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="watchlist-name" className="text-sm font-medium text-slate-300">Name</label>
                  <Input
                    id="watchlist-name"
                    value={newWatchlistName}
                    onChange={(e) => setNewWatchlistName(e.target.value)}
                    placeholder="Enter watchlist name"
                    className="bg-[#24243c] border-[#27272f] text-slate-200 focus-visible:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="watchlist-description" className="text-sm font-medium text-slate-300">Description (Optional)</label>
                  <Textarea
                    id="watchlist-description"
                    value={newWatchlistDescription}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewWatchlistDescription(e.target.value)}
                    placeholder="Enter watchlist description"
                    className="bg-[#24243c] border-[#27272f] text-slate-200 focus-visible:ring-indigo-500"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => 
                  setShowAddWatchlist(false)} className="border-[#27272f] text-slate-300 hover:bg-[#24243c]">Cancel</Button>
                <Button onClick={createWatchlist} className="bg-indigo-600 hover:bg-indigo-700">Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Right Side Controls: Search, Add Stock, View Toggle, Status */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 bg-[#24243c] border-[#27272f] text-slate-200 text-sm w-32 sm:w-40 focus-visible:ring-indigo-500"
                disabled={!activeWatchlist}
              />
            </div>

            {/* Add Stock Button & Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  className="h-8 bg-indigo-600 hover:bg-indigo-700"
                  disabled={!activeWatchlist}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Stock
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1a24] border-[#27272f] text-slate-200">
                <DialogHeader>
                  <DialogTitle>Add Stock to {activeWatchlist?.name}</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Enter a stock ticker symbol.
                  </DialogDescription>
                </DialogHeader>
                <Input
                  value={newStockTicker}
                  onChange={(e) => setNewStockTicker(e.target.value)}
                  placeholder="Enter stock ticker (e.g. AAPL)"
                  className="bg-[#24243c] border-[#27272f] text-slate-200 focus-visible:ring-indigo-500"
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => 
                    setNewStockTicker('')} className="border-[#27272f] text-slate-300 hover:bg-[#24243c]">Cancel</Button>
                  <Button onClick={addStock} className="bg-indigo-600 hover:bg-indigo-700">Add</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* View Toggle */}
            <Toggle
              pressed={view === "chart"}
              onPressedChange={() => setView(view === "table" ? "chart" : "table")}
              className="bg-[#24243c] hover:bg-[#2a2a42] data-[state=on]:bg-indigo-600 border-[#27272f] h-8"
              disabled={!activeWatchlist || activeWatchlist.stocks.length === 0}
            >
              {view === "table" ? (
                <BarChart4 className="h-4 w-4 mr-1" />
              ) : (
                <LineChart className="h-4 w-4 mr-1" />
              )}
              {view === "table" ? "Table" : "Chart"}
            </Toggle>

            {/* Socket Status Indicator */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                    {isConnected ? <Wifi className="h-4 w-4 text-emerald-400" /> : <WifiOff className="h-4 w-4 text-rose-400" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{socketStatus}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* No watchlists state */}
          {watchlists.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Star className="h-12 w-12 mb-4 text-indigo-500/30" />
              <h3 className="text-lg font-medium mb-2">No Watchlists Yet</h3>
              <p className="text-sm text-center max-w-md mb-4">
                Create your first watchlist to start tracking stocks and get real-time updates.
              </p>
              <Button 
                onClick={() => setShowAddWatchlist(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" /> Create Watchlist
              </Button>
            </div>
          ) : (
            /* Conditional Rendering: Table or Chart */
            view === "table" ? (
              <Table className="border-collapse">
                <TableHeader className="bg-[#24243c]">
                  <TableRow className="border-b border-[#27272f]">
                    <TableHead className="text-slate-400 font-medium">Symbol</TableHead>
                    <TableHead className="text-slate-400 font-medium text-right">Price</TableHead>
                    <TableHead className="text-slate-400 font-medium text-right">Change</TableHead>
                    <TableHead className="text-slate-400 font-medium text-right">Change %</TableHead>
                    <TableHead className="text-slate-400 font-medium text-right">Updated</TableHead>
                    <TableHead className="text-slate-400 font-medium text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStocks.length > 0 ? filteredStocks.map((stock) => {
                    const tickerUpper = stock.stock_name.toUpperCase();
                    const currentPriceData = priceData[tickerUpper];
                    const price = currentPriceData?.price;
                    const change = currentPriceData?.change;
                    const changePercent = currentPriceData?.changePercent;
                    const updatedAt = currentPriceData?.updatedAt;
                    const isPositive = change !== undefined && change >= 0;
                    const changeClass = change === undefined ? 'text-slate-400' : (isPositive ? 'text-emerald-400' : 'text-rose-400');
                    const arrow = change === undefined ? null : (isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />);

                    return (
                      <TableRow 
                        key={stock.stock_name} 
                        className="border-b border-[#27272f] hover:bg-[#24243c] cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedStock(tickerUpper);
                          setView("chart");
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.title = `Click to analyze ${stock.stock_name} in chart view or use "Analyze Deeply" for prediction`;
                        }}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="bg-indigo-600 h-6 w-6 rounded-full flex items-center justify-center text-xs">
                              {stock.stock_name.charAt(0)}
                            </div>
                            {stock.stock_name}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {price !== undefined ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Loading...'}
                        </TableCell>
                        <TableCell className={`text-right ${changeClass}`}>
                          {change !== undefined ? (
                            <div className="flex items-center justify-end gap-1">
                              {arrow}
                              {change >= 0 ? '+' : ''}{change.toFixed(2)}
                            </div>
                          ) : (
                            '--'
                          )}
                        </TableCell>
                        <TableCell className={`text-right ${changeClass}`}>
                          {changePercent !== undefined ? (
                            <div className="flex items-center justify-end gap-1">
                              {arrow}
                              {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                            </div>
                          ) : (
                            '--'
                          )}
                        </TableCell>
                        <TableCell className="text-right text-slate-400 text-sm">
                          {updatedAt ? updatedAt.toLocaleTimeString() : '--'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-slate-400 hover:text-indigo-400 hover:bg-[#2a2a42]"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigateToStockPrediction(stock.stock_name);
                                    }}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Analyze Deeply</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-slate-400 hover:text-rose-400 hover:bg-[#2a2a42]"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeStock(stock.stock_name);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Remove from watchlist</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        {activeWatchlist?.stocks.length === 0 ? (
                          <>
                            <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                              <XCircle className="h-8 w-8" />
                              <p>This watchlist is empty.</p>
                              <p className="text-sm">Use "Add Stock" to add symbols.</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                              <Search className="h-8 w-8" />
                              <p>No stocks match your search "{searchQuery}".</p>
                            </div>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            ) : (
              // Chart View
              <div className="flex flex-col md:flex-row h-[600px]">
                {/* Stock List on the Left */}
                <div className="md:w-1/4 border-r border-[#27272f] p-2">
                  <div className="text-sm font-medium text-slate-400 mb-2 px-2">Stocks</div>
                  <ScrollArea className="h-[560px]">
                    {activeWatchlist?.stocks.map((stock) => {
                      const tickerUpper = stock.stock_name.toUpperCase();
                      const currentPriceData = priceData[tickerUpper];
                      const price = currentPriceData?.price;
                      const change = currentPriceData?.change;
                      const changePercent = currentPriceData?.changePercent;
                      const isPositive = change !== undefined && change >= 0;
                      const changeClass = change === undefined ? 'text-slate-400' : (isPositive ? 'text-emerald-400' : 'text-rose-400');
                      const arrow = change === undefined ? null : (isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />);

                      return (
                        <div
                          key={stock.stock_name}
                          onClick={() => setSelectedStock(tickerUpper)}
                          className={`cursor-pointer p-2 rounded-md transition-colors group ${
                            selectedStock === tickerUpper ? "bg-indigo-600/20" : "hover:bg-[#1a1a24]"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            {/* Stock Name */}
                            <div className="font-medium">{stock.stock_name}</div>
                            {/* Price */}
                            <div>{price !== undefined ? `$${price.toFixed(2)}` : '--'}</div>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            {/* Change and Change Percent */}
                            <div className={changeClass}>
                              {change !== undefined && changePercent !== undefined ? (
                                <>
                                  <span className="flex items-center gap-1">
                                    {arrow}
                                    {change >= 0 ? '+' : ''}{change.toFixed(2)} (
                                    {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
                                  </span>
                                </>
                              ) : (
                                '--'
                              )}
                            </div>
                            
                            {/* Action buttons that appear on hover */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6 text-slate-400 hover:text-indigo-400 hover:bg-[#2a2a42]"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigateToStockPrediction(stock.stock_name);
                                      }}
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Analyze Deeply</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6 text-slate-400 hover:text-rose-400 hover:bg-[#2a2a42]"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeStock(stock.stock_name);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Remove from watchlist</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </ScrollArea>
                </div>

                {/* Chart on the Right */}
                <div className="md:w-3/4 p-2">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold">{selectedStock} - Daily Chart</h3>
                    <Button 
                      size="sm" 
                      className="bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => navigateToStockPrediction(selectedStock)}
                    >
                      <Sparkles className="h-4 w-4 mr-1" /> Analyze Deeply
                    </Button>
                  </div>
                  <div className="h-[520px] bg-[#1a1a24] rounded-md overflow-hidden">
                    <TradingViewWidget symbol={selectedStock} />
                  </div>
                  <div className="text-xs text-slate-400 mt-2 flex justify-between items-center">
                    <div>Data updated: {isConnected ? 'Real-time' : new Date().toLocaleTimeString()}</div>
                    <Badge variant="outline" className="border-indigo-600/30 text-indigo-400">
                      <CalendarClock className="h-3 w-3 mr-1" /> Daily Chart
                    </Badge>
                  </div>
                </div>
              </div>
            )
          )}
        </CardContent>

        <CardFooter className="border-t border-[#27272f] p-2">
          {/* Footer View Toggle (for smaller screens perhaps) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView(view === "table" ? "chart" : "table")}
            className="gap-2 text-xs text-slate-400 hover:text-indigo-300 hover:bg-[#24243c] h-8"
            disabled={!activeWatchlist || activeWatchlist.stocks.length === 0}
          >
            {view === "table" ? <LineChart className="h-3 w-3" /> : <BarChart4 className="h-3 w-3" />}
            Switch View
          </Button>
          
          {/* Refresh button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchWatchlists}
            className="ml-auto gap-2 text-xs text-slate-400 hover:text-indigo-300 hover:bg-[#24243c] h-8"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M3 21v-5h5"></path>
            </svg>
            Refresh
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Watchlist;

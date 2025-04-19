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
  XCircle,
  CalendarClock,
  Wifi,
  WifiOff,
  Trash2,
  ExternalLink,
  Loader2 as LoaderIcon,
  AlertCircle,
  Settings,
  AlertTriangle
} from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { io, Socket } from "socket.io-client";
import Papa from "papaparse";

const CSV_URL = "merged_symbols.csv";

interface CsvStock {
  Symbol: string;
  "Security Name": string;
}

interface PriceData {
  price?: number;
  change?: number;
  changePercent?: number;
  prevClose?: number;
  updatedAt?: Date;
}

interface PriceState {
  [ticker: string]: PriceData;
}

interface Stock {
  stock_name: string;
}

interface WatchlistData {
  s_no: number;
  watchlistName: string;
  stocks: Stock[];
}

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

const Watchlist = () => {
  const navigate = useNavigate();
  const userId = "user123";
  const initialWatchlists: WatchlistData[] = [
    { s_no: 1, watchlistName: "Tech Stocks", stocks: [{ stock_name: "AAPL" }, { stock_name: "MSFT" }, { stock_name: "GOOGL" }] },
    { s_no: 2, watchlistName: "Energy Sector", stocks: [{ stock_name: "XOM" }, { stock_name: "CVX" }] },
    { s_no: 3, watchlistName: "Cryptocurrency", stocks: [{ stock_name: "BTC" }, { stock_name: "ETH" }] },
  ];
  const [watchlists, setWatchlists] = useState(initialWatchlists);
  const [activeWatchlistIndex, setActiveWatchlistIndex] = useState(0);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [newStockTicker, setNewStockTicker] = useState("");
  const [selectedStock, setSelectedStock] = useState(watchlists[0]?.stocks[0]?.stock_name || "AAPL");
  const [view, setView] = useState<"table" | "chart">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddWatchlist, setShowAddWatchlist] = useState(false);
  const [showDeleteWatchlist, setShowDeleteWatchlist] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketStatus, setSocketStatus] = useState("Disconnected");
  const [priceData, setPriceData] = useState<PriceState>({});
  const [subscribedTickers, setSubscribedTickers] = useState<Set<string>>(new Set());
  const currentWatchlistTickersRef = useRef<string[]>([]);
  const [csvData, setCsvData] = useState<CsvStock[]>([]);
  const [isLoadingCSV, setIsLoadingCSV] = useState(true);
  const [errorCSV, setErrorCSV] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const MAX_SUGGESTIONS = 10;

  // Get the active watchlist
  const activeWatchlist = watchlists[activeWatchlistIndex];

  useEffect(() => {
    // Initialize currentWatchlistTickersRef with the stocks from the active watchlist
    if (activeWatchlist) {
      currentWatchlistTickersRef.current = activeWatchlist.stocks.map(stock => stock.stock_name.toUpperCase());
    }
  }, []);

  useEffect(() => {
    fetch(CSV_URL)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
        }
        return response.text();
      })
      .then(data => {
        const results = Papa.parse<CsvStock>(data, {
          header: true,
          skipEmptyLines: true
        });
        
        if (results.errors.length > 0) {
          setErrorCSV("Error parsing stock data: " + results.errors.map(e => e.message).join(', '));
          return;
        }
        
        setCsvData(results.data);
        setIsLoadingCSV(false);
      })
      .catch(err => {
        setErrorCSV("Failed to load stock symbols: " + err.message);
        setIsLoadingCSV(false);
      });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const newSocket = io('http://localhost:8003', {
      transports: ['websocket', 'polling']
    });
    setSocket(newSocket);
    setSocketStatus('Connecting...');

    newSocket.on('connect', () => {
      setIsConnected(true);
      setSocketStatus(`Connected (ID: ${newSocket.id})`);
      newSocket.emit('authenticate', userId);
      
      // Subscribe to current watchlist's stocks on initial connection
      if (activeWatchlist && activeWatchlist.stocks.length > 0) {
        const tickers = activeWatchlist.stocks.map(stock => stock.stock_name.toUpperCase());
        newSocket.emit('subscribe', tickers);
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setSocketStatus('Disconnected');
      setSubscribedTickers(new Set());
      setPriceData({});
    });

    newSocket.on('error', (error) => {
      console.error('Socket Error:', error);
      setSocketStatus(`Error: ${error.message || JSON.stringify(error)}`);
    });

    newSocket.on('price', (data: { ticker: string; price: number; prevClose?: number }) => {
      const ticker = data.ticker?.toUpperCase();
      if (!ticker) return;

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
      if (!Array.isArray(tickers)) return;
      setSubscribedTickers(prev => new Set([...prev, ...tickers.map(t => t.toUpperCase())]));
    });

    newSocket.on('unsubscribed', (tickers: string[]) => {
      if (!Array.isArray(tickers)) return;
      setSubscribedTickers(prev => {
        const newSet = new Set(prev);
        tickers.forEach(t => newSet.delete(t.toUpperCase()));
        return newSet;
      });
      setPriceData(prevData => {
        const newData = { ...prevData };
        tickers.forEach(t => delete newData[t.toUpperCase()]);
        return newData;
      });
    });

    return () => {
      newSocket.disconnect();
      setIsConnected(false);
      setSocketStatus('Disconnected');
      setSubscribedTickers(new Set());
      setPriceData({});
    };
  }, [userId]);

  // Effect for managing subscriptions when the active watchlist changes
  useEffect(() => {
    if (!socket || !isConnected || !activeWatchlist) return;

    const newTickers = activeWatchlist.stocks.map(stock => stock.stock_name.toUpperCase());
    const oldTickers = currentWatchlistTickersRef.current;
    
    // Determine which tickers to subscribe/unsubscribe
    const tickersToUnsubscribe = oldTickers.filter(ticker => !newTickers.includes(ticker));
    const tickersToSubscribe = newTickers.filter(ticker => !oldTickers.includes(ticker));

    if (tickersToUnsubscribe.length > 0) {
      socket.emit('unsubscribe', tickersToUnsubscribe);
    }

    if (tickersToSubscribe.length > 0) {
      socket.emit('subscribe', tickersToSubscribe);
    }

    // Update the ref with the current tickers
    currentWatchlistTickersRef.current = newTickers;
  }, [activeWatchlistIndex, isConnected, socket]); // Using activeWatchlistIndex instead of activeWatchlist

  const createWatchlist = () => {
    if (!newWatchlistName.trim()) return;
    setWatchlists([
      ...watchlists,
      {
        s_no: watchlists.length + 1,
        watchlistName: newWatchlistName,
        stocks: []
      },
    ]);
    setNewWatchlistName("");
    setShowAddWatchlist(false);
    // Set active watchlist to the newly created one
    setActiveWatchlistIndex(watchlists.length);
  };

  const removeWatchlist = () => {
    if (watchlists.length <= 1) {
      // Don't allow removing the last watchlist
      return;
    }
    
    // Create a new array without the current watchlist
    const updatedWatchlists = watchlists.filter((_, index) => index !== activeWatchlistIndex);
    
    // Update watchlist numbers
    const renumberedWatchlists = updatedWatchlists.map((watchlist, index) => ({
      ...watchlist,
      s_no: index + 1
    }));
    
    setWatchlists(renumberedWatchlists);
    
    // Handle active watchlist index after deletion
    if (activeWatchlistIndex >= updatedWatchlists.length) {
      // If we removed the last watchlist, set active to the new last one
      setActiveWatchlistIndex(Math.max(0, updatedWatchlists.length - 1));
    }
    
    setShowDeleteWatchlist(false);
  };

  const addStock = () => {
    if (!newStockTicker.trim()) return;
    const tickerToAdd = newStockTicker.toUpperCase();
    
    if (activeWatchlist.stocks.some(s => s.stock_name.toUpperCase() === tickerToAdd)) {
      alert(`${tickerToAdd} is already in this watchlist.`);
      setNewStockTicker("");
      return;
    }

    const newStock: Stock = { stock_name: tickerToAdd };
    const updatedWatchlists = watchlists.map((watchlist, index) => {
      if (index === activeWatchlistIndex) {
        return { ...watchlist, stocks: [...watchlist.stocks, newStock] };
      }
      return watchlist;
    });

    setWatchlists(updatedWatchlists);
    setNewStockTicker("");
    
    if (socket && isConnected) {
      socket.emit('subscribe', [tickerToAdd]);
    }
  };

  const removeStock = (tickerToRemove: string) => {
    const tickerUpper = tickerToRemove.toUpperCase();
    const updatedWatchlists = watchlists.map((watchlist, index) => {
      if (index === activeWatchlistIndex) {
        return {
          ...watchlist,
          stocks: watchlist.stocks.filter(stock => stock.stock_name.toUpperCase() !== tickerUpper),
        };
      }
      return watchlist;
    });

    setWatchlists(updatedWatchlists);
    
    // If this was the selected stock, update selected stock to another one in the watchlist
    if (selectedStock === tickerUpper) {
      const updatedActiveWatchlist = updatedWatchlists[activeWatchlistIndex];
      if (updatedActiveWatchlist.stocks.length > 0) {
        setSelectedStock(updatedActiveWatchlist.stocks[0].stock_name.toUpperCase());
      } else {
        setSelectedStock("AAPL"); // Default value if watchlist becomes empty
      }
    }
    
    if (socket && isConnected) {
      socket.emit('unsubscribe', [tickerUpper]);
    }
  };

  const navigateToStockPrediction = (ticker: string) => {
    navigate(`/stock/${ticker}`);
  };

  const handleWatchlistNavigation = (direction: "prev" | "next") => {
    const nextWatchlistIndex = direction === "prev"
      ? Math.max(0, activeWatchlistIndex - 1)
      : Math.min(watchlists.length - 1, activeWatchlistIndex + 1);
    
    setActiveWatchlistIndex(nextWatchlistIndex);
    setSearchQuery("");
    
    // Update selected stock when changing watchlists
    const nextWatchlist = watchlists[nextWatchlistIndex];
    if (nextWatchlist && nextWatchlist.stocks.length > 0) {
      setSelectedStock(nextWatchlist.stocks[0].stock_name.toUpperCase());
    } else {
      setSelectedStock("AAPL"); // Default fallback
    }
  };

  const filteredStocks = activeWatchlist?.stocks.filter(stock =>
    stock.stock_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b bg-gray-950 text-gray-100 p-6 mt-10">
      <Card className="shadow-2xl overflow-hidden bg-gradient-to-b from-gray-900/90 to-gray-800/90 backdrop-blur-sm border border-gray-700/50">
        <CardHeader className="flex flex-row items-center justify-between p-5 pb-3 border-b border-gray-700/50">
          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleWatchlistNavigation("prev")}
                    disabled={activeWatchlistIndex === 0}
                    className="text-slate-400 hover:text-indigo-400 hover:bg-gray-700/20 rounded-full h-9 w-9 transition-all"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-800 text-slate-200 border border-gray-600">
                  <p>Previous watchlist</p>
                </TooltipContent>
              </Tooltip>
  
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleWatchlistNavigation("next")}
                    disabled={activeWatchlistIndex === watchlists.length - 1}
                    className="text-slate-400 hover:text-indigo-400 hover:bg-gray-700/20 rounded-full h-9 w-9 transition-all"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-800 text-slate-200 border border-gray-600">
                  <p>Next watchlist</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
  
            <div className="flex flex-col">
              <span className="text-xs text-indigo-400 font-medium tracking-wider">
                {activeWatchlistIndex + 1}/{watchlists.length}
              </span>
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
                {activeWatchlist?.watchlistName || "Loading..."}
              </h2>
            </div>
  
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAddWatchlist(true)}
                    className="text-slate-400 hover:text-indigo-400 hover:bg-gray-700/20 rounded-full h-9 w-9 transition-all"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-800 text-slate-200 border border-gray-600">
                  <p>Add new watchlist</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Delete Watchlist Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDeleteWatchlist(true)}
                    className="text-slate-400 hover:text-rose-400 hover:bg-gray-700/20 rounded-full h-9 w-9 transition-all"
                    disabled={watchlists.length <= 1}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-800 text-slate-200 border border-gray-600">
                  <p>{watchlists.length <= 1 ? "Cannot delete last watchlist" : "Delete watchlist"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Add Watchlist Dialog */}
          <Dialog open={showAddWatchlist} onOpenChange={setShowAddWatchlist}>
            <DialogContent className="bg-gray-900 border border-gray-700 text-slate-200 rounded-xl shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
                  Create New Watchlist
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Enter a name for your new watchlist
                </DialogDescription>
              </DialogHeader>
              <Input
                value={newWatchlistName}
                onChange={(e) => setNewWatchlistName(e.target.value)}
                placeholder="Enter watchlist name"
                className="bg-gray-800 border border-gray-600 text-slate-200 focus-visible:ring-indigo-500 rounded-lg"
              />
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddWatchlist(false)} 
                  className="border-gray-600 text-slate-300 hover:bg-gray-700/20"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={createWatchlist}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-900/20"
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Watchlist Confirmation Dialog */}
          <Dialog open={showDeleteWatchlist} onOpenChange={setShowDeleteWatchlist}>
            <DialogContent className="bg-gray-900 border border-gray-700 text-slate-200 rounded-xl shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Delete Watchlist
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Are you sure you want to delete "{activeWatchlist?.watchlistName}"? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteWatchlist(false)} 
                  className="border-gray-600 text-slate-300 hover:bg-gray-700/20"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={removeWatchlist}
                  className="bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-900/20"
                >
                  Delete Watchlist
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
  
          {/* Right Side Controls */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
              <Input
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-10 bg-gray-800 border border-gray-600 text-slate-200 text-sm rounded-full w-36 sm:w-44 focus-visible:ring-indigo-500"
              />
            </div>
  
            {/* Add Stock Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="h-9 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-full px-4 shadow-lg shadow-indigo-900/20 transition-all"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Stock
                </Button>
              </DialogTrigger>
              
              {/* Dialog content remains the same but with updated border colors */}
              <DialogContent className="bg-gray-900 border border-gray-700 text-slate-200 rounded-xl shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
                    Add Stock to {activeWatchlist?.watchlistName}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Search and select a stock to add
                  </DialogDescription>
                </DialogHeader>
                
                <div className="relative">
                  <Input
                    value={newStockTicker}
                    onChange={(e) => {
                      setNewStockTicker(e.target.value);
                      setShowSuggestions(e.target.value.length > 0);
                    }}
                    placeholder="Search by symbol or name..."
                    className="bg-[#14142a] border-[#2e2e45] text-slate-200 focus-visible:ring-indigo-500 rounded-lg"
                  />
                  
                  {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#0a0a12] border border-[#1e1e2d] rounded-lg shadow-2xl z-50 max-h-64 overflow-y-auto">
                      {isLoadingCSV ? (
                        <div className="p-4 text-sm text-slate-400 flex items-center">
                          <LoaderIcon className="h-5 w-5 mr-3 animate-spin text-indigo-400" />
                          Loading stock data...
                        </div>
                      ) : errorCSV ? (
                        <div className="p-4 text-sm text-rose-400 flex items-center">
                          <AlertCircle className="h-5 w-5 mr-3" />
                          {errorCSV}
                        </div>
                      ) : (
                        csvData
                          .filter(stock => {
                            const searchTerm = newStockTicker.toLowerCase();
                            return (
                              stock.Symbol.toLowerCase().includes(searchTerm) ||
                              stock["Security Name"].toLowerCase().includes(searchTerm)
                            );
                          })
                          .slice(0, MAX_SUGGESTIONS)
                          .map(stock => (
                            <div
                              key={stock.Symbol}
                              className="flex items-center justify-between p-4 hover:bg-[#14142a] cursor-pointer transition-colors"
                              onClick={() => {
                                setNewStockTicker(stock.Symbol);
                                setShowSuggestions(false);
                              }}
                            >
                              <div>
                                <div className="font-bold text-slate-200">{stock.Symbol}</div>
                                <div className="text-xs text-slate-400 mt-1">{stock["Security Name"]}</div>
                              </div>
                              <ExternalLink className="h-4 w-4 text-indigo-400 ml-4" />
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>
  
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setNewStockTicker('');
                      setShowSuggestions(false);
                    }} 
                    className="border-[#2e2e45] text-slate-300 hover:bg-[#161626] transition-all duration-300"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={addStock} 
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-900/20 transition-all duration-300"
                    disabled={!newStockTicker.trim()}
                  >
                    Add Stock
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
  
            {/* View Toggle */}
          <Toggle
            pressed={view === "chart"}
            onPressedChange={() => setView(view === "table" ? "chart" : "table")}
            className="bg-gray-800 hover:bg-gray-700 data-[state=on]:bg-gradient-to-r data-[state=on]:from-indigo-600 data-[state=on]:to-violet-600 border border-gray-600 h-9 rounded-full px-4 transition-all"
          >
            {view === "table" ? (
              <BarChart4 className="h-4 w-4 mr-2" />
            ) : (
              <LineChart className="h-4 w-4 mr-2" />
            )}
            {view === "table" ? "Table" : "Chart"}
          </Toggle>

          {/* Connection Status */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full text-slate-400 hover:bg-gray-700/20 transition-all"
                >
                  {isConnected ? 
                    <Wifi className="h-5 w-5 text-emerald-400" /> : 
                    <WifiOff className="h-5 w-5 text-rose-400" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-800 text-slate-200 border border-gray-600">
                <p>{socketStatus}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      {/* Table/Chart Content */}
      <CardContent className="p-0 bg-gray-950">
        {/* Table and Chart content remains the same but with updated background colors */}
        {view === "table" ? (
          <Table className="border-collapse">
              <TableHeader className="bg-[#0f0f1a]">
                <TableRow className="border-b border-[#1e1e2d]">
                  <TableHead className="text-indigo-400 font-medium">Symbol</TableHead>
                  <TableHead className="text-indigo-400 font-medium text-right">Price</TableHead>
                  <TableHead className="text-indigo-400 font-medium text-right">Change</TableHead>
                  <TableHead className="text-indigo-400 font-medium text-right">% Change</TableHead>
                  <TableHead className="text-indigo-400 font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStocks.length > 0 ? (
                  filteredStocks.map((stock) => {
                    const ticker = stock.stock_name.toUpperCase();
                    const stockData = priceData[ticker] || {};
                    const isSubscribed = subscribedTickers.has(ticker);
                    const priceValue = stockData.price || 0;
                    const priceChange = stockData.change || 0;
                    const priceChangePercent = stockData.changePercent || 0;
                    const lastUpdated = stockData.updatedAt;
                    
                    const isPositive = priceChange > 0;
                    const isNegative = priceChange < 0;
                    const colorClass = isPositive ? "text-emerald-400" : isNegative ? "text-rose-400" : "text-slate-400";
                    
                    return (
                      <TableRow 
                        key={ticker} 
                        className={`border-b border-[#1e1e2d] cursor-pointer hover:bg-[#14142a] transition-colors ${selectedStock === ticker ? 'bg-[#14142a]' : ''}`}
                        onClick={() => setSelectedStock(ticker)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center text-slate-300">
                            <span className="mr-2">{ticker}</span>
                            {!isSubscribed && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <AlertCircle className="h-4 w-4 text-amber-400" />
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-gray-800 text-slate-200 border border-gray-600">
                                    <p>Not subscribed to real-time data</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-slate-300">
                          {priceValue ? priceValue.toFixed(2) : '—'}
                        </TableCell>
                        <TableCell className={`text-right font-mono ${colorClass}`}>
                          <div className="flex items-center justify-end">
                            {isPositive ? (
                              <ArrowUp className="h-3 w-3 mr-1" />
                            ) : isNegative ? (
                              <ArrowDown className="h-3 w-3 mr-1" />
                            ) : null}
                            {priceChange ? Math.abs(priceChange).toFixed(2) : '—'}
                          </div>
                        </TableCell>
                        <TableCell className={`text-right font-mono ${colorClass}`}>
                          <div className="flex items-center justify-end text-slate-300">
                            {priceChangePercent ? `${Math.abs(priceChangePercent).toFixed(2)}%` : '—'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full text-slate-400 hover:text-indigo-400 hover:bg-gray-700/20"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigateToStockPrediction(ticker);
                                    }}
                                  >
                                    <Sparkles className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-800 text-slate-200 border border-gray-600">
                                  <p>View predictions</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full text-slate-400 hover:text-rose-400 hover:bg-gray-700/20"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeStock(ticker);
                                    }}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-800 text-slate-200 border border-gray-600">
                                  <p>Remove from watchlist</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {lastUpdated && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-full text-slate-400 hover:text-sky-400 hover:bg-gray-700/20"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <CalendarClock className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-gray-800 text-slate-200 border border-gray-600">
                                    <p>Last updated: {lastUpdated.toLocaleTimeString()}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                      {activeWatchlist?.stocks.length === 0 ? (
                        <div className="flex flex-col items-center space-y-2">
                          <Settings className="h-10 w-10 text-indigo-400/40" />
                          <p>This watchlist is empty. Add stocks to get started.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-2">
                          <Search className="h-10 w-10 text-indigo-400/40" />
                          <p>No results found for "{searchQuery}"</p>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        ) : (
          <div className="h-[70vh] w-full">
            <TradingViewWidget symbol={selectedStock} />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-wrap justify-between items-center p-3 bg-[#0f0f1a] border-t border-[#1e1e2d]">
        <div className="flex items-center space-x-2">
          <Badge className="bg-indigo-600 text-white">
            {filteredStocks.length} stocks
          </Badge>
          
          {isConnected ? (
            <Badge className="bg-emerald-600 text-white">
              Live Data
            </Badge>
          ) : (
            <Badge className="bg-rose-600 text-white">
              Offline
            </Badge>
          )}
        </div>
        
        <div className="text-xs text-slate-400">
          Last update: {new Date().toLocaleTimeString()}
        </div>
      </CardFooter>
    </Card>
  </div>
);
};

export default Watchlist;
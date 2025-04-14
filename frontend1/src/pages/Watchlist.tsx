import { useState, useEffect, useRef } from "react";
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
  Wifi, // Icon for connection status
  WifiOff // Icon for disconnection status
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
import { io, Socket } from "socket.io-client"; // Import socket.io-client

// Define structure for real-time price data
interface PriceData {
  price?: number;
  change?: number;
  changePercent?: number;
  prevClose?: number; // Store previous close if available
  updatedAt?: Date;
  // You can add rawData if needed: rawData?: any;
}

// Define structure for the price state map
interface PriceState {
  [ticker: string]: PriceData;
}

interface Stock {
  stock_name: string;
  // Removed Price and volume as they will come from real-time data or initial fetch
  // Price: number;
  // volume: number;
}

interface WatchlistData { // Renamed from Watchlist to avoid conflict
  s_no: number;
  watchlistName: string;
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
  // Assume userId is obtained from auth context or props
  // For demonstration, using a hardcoded ID. Replace with your actual user ID logic.
  const userId = "user123"; 

  // Mock initial watchlists (stocks only contain names now)
  const initialWatchlists: WatchlistData[] = [
    { s_no: 1, watchlistName: "Tech Stocks", stocks: [{ stock_name: "AAPL" }, { stock_name: "MSFT" }, { stock_name: "GOOGL" }] },
    { s_no: 2, watchlistName: "Energy Sector", stocks: [{ stock_name: "XOM" }, { stock_name: "CVX" }] },
    { s_no: 3, watchlistName: "Cryptocurrency", stocks: [{ stock_name: "BTC" }, { stock_name: "ETH" }] }, // Assuming socket server handles crypto too
  ];

  const [watchlists, setWatchlists] = useState<WatchlistData[]>(initialWatchlists);
  const [activeWatchlistIndex, setActiveWatchlistIndex] = useState(0);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [newStockTicker, setNewStockTicker] = useState("");
  const [selectedStock, setSelectedStock] = useState(watchlists[0]?.stocks[0]?.stock_name || "AAPL");
  const [view, setView] = useState<"table" | "chart">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddWatchlist, setShowAddWatchlist] = useState(false);

  // --- Socket.IO State ---
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketStatus, setSocketStatus] = useState("Disconnected");
  const [priceData, setPriceData] = useState<PriceState>({});
  const [subscribedTickers, setSubscribedTickers] = useState<Set<string>>(new Set());
  const currentWatchlistTickersRef = useRef<string[]>([]); // Ref to hold tickers for the current active watchlist

  const activeWatchlist = watchlists[activeWatchlistIndex];

  // --- Socket Connection Effect ---
  useEffect(() => {
    if (!userId) {
      console.log("User ID not available, skipping socket connection.");
      return;
    }

    console.log(`Attempting to connect socket for userId: ${userId}`);
    // Connect to the socket server (update URL if needed)
    const newSocket = io('http://localhost:8003', {
      transports: ['websocket', 'polling'] // Match transports from example
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
      setSubscribedTickers(new Set()); // Clear subscriptions on disconnect
      setPriceData({}); // Optionally clear price data on disconnect
      console.log('Socket disconnected');
    });

    newSocket.on('error', (error) => {
      console.error('Socket Error:', error);
      setSocketStatus(`Error: ${error.message || JSON.stringify(error)}`);
    });

    // --- Price Update Handler ---
    newSocket.on('price', (data: { ticker: string; price: number; prevClose?: number /* Add other fields if sent */ }) => {
      // console.log('Raw price data received:', data);
      const ticker = data.ticker?.toUpperCase(); // Normalize ticker
      if (!ticker) {
        console.warn("Received price data without ticker:", data);
        return;
      }

      setPriceData(prevData => {
        const currentStockData = prevData[ticker] || {};
        // Use received prevClose or existing one, else estimate (as in example)
        const prevClose = data.prevClose ?? currentStockData.prevClose ?? data.price * 0.99;
        const change = data.price - prevClose;
        const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

        return {
          ...prevData,
          [ticker]: {
            price: data.price,
            prevClose: prevClose, // Store prevClose for future calculations
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
        // Optionally request initial prices for restored tickers if needed
    });

    // Cleanup on component unmount or userId change
    return () => {
      console.log('Disconnecting socket...');
      newSocket.disconnect();
      setIsConnected(false);
      setSocketStatus('Disconnected');
      setSubscribedTickers(new Set());
       setPriceData({});
    };
  }, [userId]); // Reconnect if userId changes

  // --- Subscription Management Effect ---
  useEffect(() => {
    if (!socket || !isConnected || !activeWatchlist) {
      return; // Only manage subscriptions if connected and watchlist exists
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

  }, [activeWatchlist, isConnected, socket]); // Rerun when watchlist changes or connection status changes


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
    // Optionally switch to the new watchlist
    // setActiveWatchlistIndex(watchlists.length);
  };

  const addStock = () => {
    if (!newStockTicker.trim()) return;
    const tickerToAdd = newStockTicker.toUpperCase();

    // Prevent adding duplicates to the same watchlist
    if (activeWatchlist.stocks.some(s => s.stock_name.toUpperCase() === tickerToAdd)) {
        alert(`${tickerToAdd} is already in this watchlist.`);
        setNewStockTicker("");
        return;
    }


    const newStock: Stock = {
      stock_name: tickerToAdd,
    };
    const updatedWatchlists = watchlists.map((watchlist, index) => {
      if (index === activeWatchlistIndex) {
        return {
          ...watchlist,
          stocks: [...watchlist.stocks, newStock],
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
  };

  // Function to remove stock (Example - requires adding remove buttons)
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

      // Unsubscribe if connected
      if (socket && isConnected) {
          console.log('Unsubscribing from removed stock:', tickerUpper);
          socket.emit('unsubscribe', [tickerUpper]);
      }
  };


  const handleWatchlistNavigation = (direction: "prev" | "next") => {
    // --- Important: Unsubscribe from current before switching ---
    // (The useEffect hook handles this now, but explicit unsubscribe here could be faster)
    // if (socket && isConnected && activeWatchlist) {
    //   const currentTickers = activeWatchlist.stocks.map(s => s.stock_name.toUpperCase());
    //   if (currentTickers.length > 0) {
    //      console.log('Unsubscribing before navigation:', currentTickers);
    //      socket.emit('unsubscribe', currentTickers);
    //   }
    // }

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
    setSelectedStock(watchlists[nextWatchlistIndex]?.stocks[0]?.stock_name || "AAPL");
  };

  // Filter stocks based on search query
  const filteredStocks = activeWatchlist?.stocks.filter(stock =>
    stock.stock_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []; // Handle case where activeWatchlist might be undefined briefly

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200 p-6 font-sans">
      <Card className="bg-[#121218] border border-[#27272f] shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="border-b border-[#27272f] p-4 bg-[#1a1a24]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Watchlist Navigation and Title */}
            <div className="flex items-center gap-3">
               {/* Prev Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleWatchlistNavigation("prev")}
                      disabled={activeWatchlistIndex === 0}
                      className="text-slate-400 hover:text-indigo-400 hover:bg-[#24243c] rounded-full h-8 w-8"
                    >
                      <ChevronLeft size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"><p>Previous watchlist</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Watchlist Name and Count */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-normal px-2 py-1 bg-[#24243c] text-indigo-300 border-indigo-600/30">
                  {activeWatchlistIndex + 1}/{watchlists.length}
                </Badge>
                <h2 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
                  <Star size={16} className="text-indigo-400" />
                  {activeWatchlist?.watchlistName || "Loading..."}
                </h2>
              </div>

               {/* Next Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                     <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleWatchlistNavigation("next")}
                        disabled={activeWatchlistIndex === watchlists.length - 1}
                        className="text-slate-400 hover:text-indigo-400 hover:bg-[#24243c] rounded-full h-8 w-8"
                      >
                        <ChevronRight size={18} />
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"><p>Next watchlist</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Add Watchlist Button */}
              <TooltipProvider>
                <Tooltip>
                   <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowAddWatchlist(true)}
                        className="text-slate-400 hover:text-indigo-400 hover:bg-[#24243c] rounded-full h-8 w-8"
                      >
                        <Plus size={18} />
                      </Button>
                  </TooltipTrigger>
                   <TooltipContent side="bottom"><p>Add new watchlist</p></TooltipContent>
                 </Tooltip>
              </TooltipProvider>

               {/* Add Watchlist Dialog */}
              <Dialog open={showAddWatchlist} onOpenChange={setShowAddWatchlist}>
                 <DialogContent className="bg-[#1a1a24] border-[#27272f] sm:max-w-[425px]">
                   <DialogHeader>
                      <DialogTitle className="text-slate-100 flex items-center gap-2">
                        <Plus size={16} className="text-indigo-400" /> Create New Watchlist
                      </DialogTitle>
                      <DialogDescription className="text-slate-400">Enter a name for your new watchlist.</DialogDescription>
                   </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <Input
                        value={newWatchlistName}
                        onChange={(e) => setNewWatchlistName(e.target.value)}
                        placeholder="Enter watchlist name"
                        className="bg-[#24243c] border-[#27272f] text-slate-200 focus-visible:ring-indigo-500"
                       />
                    </div>
                   <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddWatchlist(false)} className="border-[#27272f] text-slate-300 hover:bg-[#24243c]">Cancel</Button>
                      <Button onClick={createWatchlist} className="bg-indigo-600 hover:bg-indigo-700 text-white">Create</Button>
                   </DialogFooter>
                 </DialogContent>
              </Dialog>
            </div>

            {/* Right Side Controls: Search, Add Stock, View Toggle, Status */}
            <div className="flex items-center gap-2">
               {/* Search Input */}
              <div className="relative">
                <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search stocks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 bg-[#24243c] border-[#27272f] text-slate-200 text-sm w-32 sm:w-40 focus-visible:ring-indigo-500"
                />
              </div>

               {/* Add Stock Button & Dialog */}
               <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                     <Dialog>
                       <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-1 h-8 text-xs border-[#27272f] bg-[#24243c] hover:bg-[#2a2a42] hover:text-indigo-300">
                            <Plus size={14} /> Add Stock
                          </Button>
                       </DialogTrigger>
                       <DialogContent className="bg-[#1a1a24] border-[#27272f]">
                         <DialogHeader>
                            <DialogTitle className="text-slate-100 flex items-center gap-2">
                                <Plus size={16} className="text-indigo-400" /> Add Stock to {activeWatchlist?.watchlistName}
                            </DialogTitle>
                            <DialogDescription className="text-slate-400">Enter a stock ticker symbol.</DialogDescription>
                          </DialogHeader>
                          <div className="flex gap-2 mt-2">
                            <Input
                                value={newStockTicker}
                                onChange={(e) => setNewStockTicker(e.target.value)}
                                placeholder="Enter stock ticker (e.g. AAPL)"
                                className="bg-[#24243c] border-[#27272f] text-slate-200 focus-visible:ring-indigo-500"
                             />
                          </div>
                          <DialogFooter>
                             <Button variant="outline" onClick={() => setNewStockTicker('')} className="border-[#27272f] text-slate-300 hover:bg-[#24243c]">Cancel</Button>
                             <Button onClick={addStock} className="bg-indigo-600 hover:bg-indigo-700">Add</Button>
                          </DialogFooter>
                       </DialogContent>
                     </Dialog>
                   </TooltipTrigger>
                   <TooltipContent side="bottom"><p>Add stock to this watchlist</p></TooltipContent>
                 </Tooltip>
               </TooltipProvider>

                {/* View Toggle */}
              <div className="hidden md:block">
                 <Toggle
                    aria-label="Toggle view"
                    pressed={view === "chart"}
                    onPressedChange={() => setView(view === "table" ? "chart" : "table")}
                    className="bg-[#24243c] hover:bg-[#2a2a42] data-[state=on]:bg-indigo-600 border-[#27272f] h-8"
                  >
                    {view === "table" ? (
                        <div className="flex items-center gap-1"><BarChart4 size={14} /> Table</div>
                    ) : (
                         <div className="flex items-center gap-1"><LineChart size={14} /> Chart</div>
                    )}
                  </Toggle>
              </div>
              
              {/* Socket Status Indicator */}
              <TooltipProvider>
                 <Tooltip>
                   <TooltipTrigger>
                      <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
                      </div>
                   </TooltipTrigger>
                    <TooltipContent side="bottom"><p>{socketStatus}</p></TooltipContent>
                 </Tooltip>
              </TooltipProvider>

            </div>
          </div>
        </CardHeader>

        {/* Conditional Rendering: Table or Chart */}
        {view === "table" ? (
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#27272f] bg-[#1a1a24] hover:bg-transparent">
                    <TableHead className="text-slate-400 font-medium">Symbol</TableHead>
                    <TableHead className="text-slate-400 font-medium">Price</TableHead>
                    <TableHead className="text-slate-400 font-medium">Change</TableHead>
                    <TableHead className="text-slate-400 font-medium">Change %</TableHead>
                    {/* <TableHead className="text-slate-400 font-medium">Volume</TableHead>  */}
                    {/* <TableHead className="text-slate-400 font-medium">High</TableHead> */}
                    {/* <TableHead className="text-slate-400 font-medium">Low</TableHead> */}
                     <TableHead className="text-slate-400 font-medium">Updated</TableHead>
                     {/* Add header for Remove button if implementing */}
                     {/* <TableHead className="text-slate-400 font-medium text-right">Actions</TableHead> */}
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
                    const arrow = change === undefined ? null : (isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />);

                    return (
                      <TableRow
                        key={tickerUpper}
                        className="border-[#27272f] cursor-pointer transition-colors hover:bg-[#1a1a24]"
                        onClick={() => {
                           setSelectedStock(tickerUpper); // Use normalized ticker
                           setView("chart");
                        }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {/* Use a generic icon or fetch logos later */}
                            <DollarSign size={14} className="text-indigo-400" />
                            <span className="font-medium text-white">{stock.stock_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className={`font-medium ${price === undefined ? 'text-slate-500' : 'text-slate-200'}`}>
                          {price !== undefined ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Loading...'}
                        </TableCell>
                        <TableCell className={changeClass}>
                          {change !== undefined ? (
                             <div className="flex items-center gap-1">
                               {arrow}
                               {/* Show sign explicitly */}
                               {change >= 0 ? '+' : ''}{change.toFixed(2)}
                             </div>
                           ) : (
                            <span>--</span>
                           )}
                        </TableCell>
                         <TableCell className={changeClass}>
                           {changePercent !== undefined ? (
                             <div className="flex items-center gap-1 font-medium">
                               {arrow}
                               {/* Show sign explicitly */}
                               {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                             </div>
                           ) : (
                            <span>--</span>
                           )}
                        </TableCell>
                         <TableCell className="text-xs text-slate-500">
                            {updatedAt ? updatedAt.toLocaleTimeString() : '--'}
                        </TableCell>
                         {/* Add Remove button cell if implementing */}
                         {/* <TableCell className="text-right">
                             <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-500 hover:bg-rose-900/50" onClick={(e) => { e.stopPropagation(); removeStock(stock.stock_name); }}>
                                 <XCircle size={14} />
                             </Button>
                         </TableCell> */}
                      </TableRow>
                    );
                  }) : (
                    <TableRow className="border-0">
                        <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                             {activeWatchlist?.stocks.length === 0 ? (
                                <>
                                    <Star size={32} className="mb-2 opacity-50 mx-auto" />
                                    <p>This watchlist is empty.</p>
                                    <p className="text-xs">Use "Add Stock" to add symbols.</p>
                                </>
                             ) : (
                                 <>
                                    <XCircle size={32} className="mb-2 opacity-50 mx-auto" />
                                    <p>No stocks match your search "{searchQuery}".</p>
                                 </>
                             )}
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        ) : (
          // Chart View
          <div className="p-0 h-[500px] bg-[#0a0a0f] flex">
          {/* Stock List on the Left */}
          <div className="w-[30%] bg-[#121218] border-r border-[#27272f] overflow-y-auto">
            <div className="p-2 border-b border-[#27272f] bg-[#1a1a24]">
              <h3 className="text-sm font-semibold text-slate-300">Stocks</h3>
            </div>
            <ul className="p-2">
              {activeWatchlist?.stocks.map((stock) => {
                const tickerUpper = stock.stock_name.toUpperCase();
                const currentPriceData = priceData[tickerUpper];
                const price = currentPriceData?.price;
                const change = currentPriceData?.change;
                const changePercent = currentPriceData?.changePercent;

                const isPositive = change !== undefined && change >= 0;
                const changeClass = change === undefined ? 'text-slate-400' : (isPositive ? 'text-emerald-400' : 'text-rose-400');
                const arrow = change === undefined ? null : (isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />);

                return (
                  <li
                    key={tickerUpper}
                    onClick={() => setSelectedStock(tickerUpper)}
                    className={`cursor-pointer p-2 rounded-md transition-colors ${
                      selectedStock === tickerUpper ? "bg-indigo-600/20" : "hover:bg-[#1a1a24]"
                    }`}
                  >
                    <div className="flex justify-between items-center text-sm">
                      {/* Stock Name */}
                      <span className="text-slate-200">{stock.stock_name}</span>
                      {/* Price */}
                      <span className={`font-medium ${price === undefined ? 'text-slate-500' : 'text-slate-200'}`}>
                        {price !== undefined ? `$${price.toFixed(2)}` : '--'}
                      </span>
                    </div>
                    {/* Change and Change Percent */}
                    <div className={`flex justify-between items-center text-xs ${changeClass}`}>
                      {change !== undefined && changePercent !== undefined ? (
                        <>
                          {arrow}
                          {change >= 0 ? '+' : ''}{change.toFixed(2)} (
                          {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
                        </>
                      ) : (
                        '--'
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Chart on the Right */}
          <div className="w-[70%] h-full flex flex-col">
            <div className="flex justify-between items-center p-2 border-b border-[#27272f] bg-[#1a1a24]">
              <span className="text-sm font-semibold text-slate-300">{selectedStock} - Daily Chart</span>
            </div>
            {/* Ensure TradingViewWidget receives the selected stock */}
            <TradingViewWidget symbol={selectedStock} />
          </div>
        </div>
        )}

        <CardFooter className="border-t border-[#27272f] p-3 flex justify-between items-center bg-[#1a1a24]">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <CalendarClock size={12} />
             {/* Display last update time from socket status or a general time */}
            Data updated: {isConnected ? 'Real-time' : new Date().toLocaleTimeString()}
          </div>
           {/* Footer View Toggle (for smaller screens perhaps) */}
           <div className="md:hidden">
               <Button
                variant="ghost"
                size="sm"
                onClick={() => setView(view === "table" ? "chart" : "table")}
                className="gap-2 text-xs text-slate-400 hover:text-indigo-300 hover:bg-[#24243c] h-8"
              >
                {view === "table" ? <LineChart size={14} /> : <BarChart4 size={14} />}
                 Switch View
              </Button>
           </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Watchlist;
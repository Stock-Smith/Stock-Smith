import { useState, useEffect, useRef } from "react";
import { tsParticles } from "tsparticles-engine";
import Particles from "react-tsparticles";
import { motion, AnimatePresence } from "framer-motion";
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
  DollarSign
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

interface Stock {
  stock_name: string;
  Price: number;
  volume: number;
}

interface Watchlist {
  s_no: number;
  watchlistName: string;
  stocks: Stock[];
}

// Add Tweet interface
interface Tweet {
  id: number;
  text: string;
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
  const initialWatchlists: Watchlist[] = [
    {
      s_no: 1,
      watchlistName: "Tech Stocks",
      stocks: [
        { stock_name: "AAPL", Price: 175.25, volume: 20000 },
        { stock_name: "MSFT", Price: 315.5, volume: 18000 },
        { stock_name: "GOOGL", Price: 2800.75, volume: 12000 },
      ],
    },
    {
      s_no: 2,
      watchlistName: "Energy Sector",
      stocks: [
        { stock_name: "XOM", Price: 105.3, volume: 25000 },
        { stock_name: "CVX", Price: 160.45, volume: 14000 },
      ],
    },
    {
      s_no: 3,
      watchlistName: "Cryptocurrency",
      stocks: [
        { stock_name: "BTC", Price: 43250.65, volume: 5000 },
        { stock_name: "ETH", Price: 3200.4, volume: 8000 },
      ],
    },
  ];

  const [watchlists, setWatchlists] = useState<Watchlist[]>(initialWatchlists);
  const [activeWatchlistIndex, setActiveWatchlistIndex] = useState(0);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [newStockTicker, setNewStockTicker] = useState("");
  const [selectedStock, setSelectedStock] = useState("AAPL");
  const [view, setView] = useState<"table" | "chart">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddWatchlist, setShowAddWatchlist] = useState(false);
  const [tweets, setTweets] = useState<Tweet[]>([]); // Add tweets state
  const activeWatchlist = watchlists[activeWatchlistIndex];

  // Add tweet effect
  useEffect(() => {
    const tweetMessages = [
      "AAPL up by 2% in pre-market trading",
      "TSLA announces new battery technology",
      "Market sentiment bullish on tech stocks",
      "Federal Reserve interest rate decision tomorrow",
      "Gold prices hit new all-time high",
      "BTC surges past $60,000 mark",
      "AMZN acquires autonomous vehicle startup",
      "GOOGL partners with major healthcare provider",
      "NASDAQ reaches record high",
      "Oil prices drop amid demand concerns",
    ];

    const addTweetInterval = setInterval(() => {
      setTweets((prev) => {
        const newTweet = {
          id: Date.now(),
          text: tweetMessages[Math.floor(Math.random() * tweetMessages.length)],
        };
    
        // Remove the oldest tweet if more than 5 tweets are active
        const updatedTweets = [...prev, newTweet].slice(-5);
    
        return updatedTweets;
      });
    
      setTimeout(() => {
        setTweets((prev) => prev.slice(1)); // Remove the first (oldest) tweet
      }, 5000);
    }, 2000);

    return () => {
      clearInterval(addTweetInterval);
    };
  }, []);

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
  };

  const addStock = () => {
    if (!newStockTicker.trim()) return;
    const mockPrice = Math.random() * 1000 + 50;
    const mockVolume = Math.floor(Math.random() * 100000) + 1000;

    const newStock: Stock = {
      stock_name: newStockTicker.toUpperCase(),
      Price: mockPrice,
      volume: mockVolume,
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
  };

  const handleWatchlistNavigation = (direction: "prev" | "next") => {
    setActiveWatchlistIndex(prev => {
      if (direction === "prev" && prev > 0) return prev - 1;
      if (direction === "next" && prev < watchlists.length - 1) return prev + 1;
      return prev;
    });
  };

  const filteredStocks = activeWatchlist.stocks.filter(stock => 
    stock.stock_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-100 relative overflow-hidden">
      <Particles
        id="tsparticles"
        className="absolute inset-0 z-0"
        options={{
          particles: {
            number: { value: 50 },
            color: { value: ["#3b82f6", "#8b5cf6", "#10b981"] },
            opacity: { value: 0.3 },
            size: { value: 1 },
            move: {
              enable: true,
              speed: 0.5,
              direction: "none",
              random: true,
              straight: false,
              out_mode: "out",
              bounce: false,
            },
          },
          interactivity: {
            events: {
              onhover: {
                enable: true,
                mode: "repulse",
              },
            },
          },
          retina_detect: true,
        }}
      />
  
      <AnimatePresence>
        {tweets.map((tweet) => (
          <motion.div
            key={tweet.id}
            initial={{ opacity: 0, y: "100vh" }}
            animate={{ opacity: 0.7, y: "-100vh" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 8, ease: "linear" }}
            className="fixed pointer-events-none text-sm z-10 text-gray-300/80"
            style={{
              left: `${Math.random() * 80 + 10}%`,
              bottom: "0px",
              textShadow: "0 0 8px rgba(255,255,255,0.1)"
            }}
          >
            {tweet.text}
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="w-full max-w-7xl mx-auto p-6 relative z-10 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.5, y: 0 }}
          transition={{ duration: 0.6 }}
        >

      <div className="w-full max-w-7xl mx-auto p-6 relative z-10 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="bg-gray-800/20 backdrop-blur-xl border border-gray-600/20 shadow-xl rounded-xl overflow-hidden">
            <CardHeader className="border-b border-gray-600/20 p-4 bg-gray-800/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div whileHover={{ scale: 1.05 }}>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleWatchlistNavigation("prev")}
                            disabled={activeWatchlistIndex === 0}
                            className="text-slate-400 hover:text-indigo-400 hover:bg-gray-700/20 rounded-full h-8 w-8"
                          >
                            <ChevronLeft size={18} />
                          </Button>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Previous watchlist</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs px-2 py-1 bg-indigo-900/30 text-indigo-300 border-indigo-600/30">
                      {activeWatchlistIndex + 1}/{watchlists.length}
                    </Badge>
                    <motion.h2 
                      className="text-lg font-semibold tracking-tight text-white flex items-center gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <Star size={16} className="text-indigo-400" />
                      {activeWatchlist.watchlistName}
                    </motion.h2>
                  </div>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div whileHover={{ scale: 1.05 }}>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleWatchlistNavigation("next")}
                            disabled={activeWatchlistIndex === watchlists.length - 1}
                            className="text-slate-400 hover:text-indigo-400 hover:bg-gray-700/20 rounded-full h-8 w-8"
                          >
                            <ChevronRight size={18} />
                          </Button>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Next watchlist</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div whileHover={{ scale: 1.1 }}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setShowAddWatchlist(true)}
                            className="text-slate-400 hover:text-indigo-400 hover:bg-gray-700/20 rounded-full h-8 w-8"
                          >
                            <Plus size={18} />
                          </Button>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Add new watchlist</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <Dialog open={showAddWatchlist} onOpenChange={setShowAddWatchlist}>
                    <DialogContent className="bg-gray-800/30 backdrop-blur-lg border-gray-600/20 sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle className="text-slate-100 flex items-center gap-2">
                          <Plus size={16} className="text-indigo-400" /> 
                          Create New Watchlist
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                          Enter a name for your new watchlist below.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <Input
                          value={newWatchlistName}
                          onChange={(e) => setNewWatchlistName(e.target.value)}
                          placeholder="Enter watchlist name"
                          className="bg-gray-700/20 border-gray-600/20 text-slate-200 focus-visible:ring-indigo-500"
                        />
                      </div>
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowAddWatchlist(false)} 
                          className="border-gray-600/20 text-slate-300 hover:bg-gray-700/20"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={createWatchlist} 
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                        >
                          Create
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search stocks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 pl-8 bg-gray-700/20 border-gray-600/20 text-slate-200 text-sm w-40 focus-visible:ring-indigo-500"
                    />
                  </div>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div whileHover={{ scale: 1.05 }}>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="gap-1 h-8 text-xs border-gray-600/20 bg-gray-700/20 hover:bg-gray-600/30 hover:text-indigo-300"
                              >
                                <Plus size={14} /> Add Stock
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-gray-800/30 backdrop-blur-lg border-gray-600/20">
                              <DialogHeader>
                                <DialogTitle className="text-slate-100 flex items-center gap-2">
                                  <Plus size={16} className="text-indigo-400" />
                                  Add Stock to {activeWatchlist.watchlistName}
                                </DialogTitle>
                                <DialogDescription className="text-slate-400">
                                  Enter a stock ticker symbol to add to your watchlist.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex gap-2 mt-2">
                                <Input
                                  value={newStockTicker}
                                  onChange={(e) => setNewStockTicker(e.target.value)}
                                  placeholder="Enter stock ticker (e.g. AAPL)"
                                  className="bg-gray-700/20 border-gray-600/20 text-slate-200 focus-visible:ring-indigo-500"
                                />
                              </div>
                              <DialogFooter>
                                <Button 
                                  variant="outline" 
                                  className="border-gray-600/20 text-slate-300 hover:bg-gray-700/20"
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={addStock} 
                                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                                >
                                  Add
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Add a new stock to this watchlist</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <div className="hidden md:block">
                    <Toggle
                      aria-label="Toggle view"
                      pressed={view === "chart"}
                      onPressedChange={() => setView(view === "table" ? "chart" : "table")}
                      className="bg-gray-700/20 hover:bg-gray-600/30 data-[state=on]:bg-indigo-600 border-gray-600/20 h-8"
                    >
                      {view === "table" ? (
                        <div className="flex items-center gap-1">
                          <LineChart size={14} /> Chart
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <BarChart4 size={14} /> Table
                        </div>
                      )}
                    </Toggle>
                  </div>
                </div>
              </div>
            </CardHeader>

            {view === "table" ? (
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-600/20 bg-gray-800/30 hover:bg-transparent">
                        <TableHead className="text-slate-400 font-medium">Symbol</TableHead>
                        <TableHead className="text-slate-400 font-medium">Price</TableHead>
                        <TableHead className="text-slate-400 font-medium">Change</TableHead>
                        <TableHead className="text-slate-400 font-medium">Change %</TableHead>
                        <TableHead className="text-slate-400 font-medium">Volume</TableHead>
                        <TableHead className="text-slate-400 font-medium">High</TableHead>
                        <TableHead className="text-slate-400 font-medium">Low</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStocks.map((stock, idx) => {
                        const change = (Math.random() * 10 - 5).toFixed(2);
                        const isPositive = parseFloat(change) > 0;
                        const changePercent = (Math.abs(parseFloat(change)) / stock.Price * 100).toFixed(2);
                        const high = (stock.Price * 1.05).toFixed(2);
                        const low = (stock.Price * 0.95).toFixed(2);

                        return (
                          <motion.tr 
                            key={idx} 
                            className="border-gray-600/20 cursor-pointer transition-colors hover:bg-gray-800/20"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => {
                              setSelectedStock(stock.stock_name);
                              setView("chart");
                            }}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <DollarSign size={14} className="text-indigo-400" />
                                <span className="font-medium text-white">{stock.stock_name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-slate-200">
                              ${stock.Price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            
                            <TableCell className={`${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                              <motion.div 
                                className="flex items-center gap-1"
                                whileHover={{ scale: 1.05 }}
                              >
                                {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                ${Math.abs(parseFloat(change)).toFixed(2)}
                              </motion.div>
                            </TableCell>

                            <TableCell className={`${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                              <motion.div 
                                className="flex items-center gap-1 font-medium"
                                whileHover={{ scale: 1.05 }}
                              >
                                {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                {changePercent}%
                              </motion.div>
                            </TableCell>
                            
                            <TableCell>
                              <Badge variant="outline" className="bg-indigo-900/30 border-indigo-600/30 text-indigo-300">
                                {(stock.volume / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}K
                              </Badge>
                            </TableCell>
                            
                            <TableCell className="text-emerald-400">${high}</TableCell>
                            <TableCell className="text-rose-400">${low}</TableCell>
                          </motion.tr>
                        );
                      })}
                    </TableBody>
                  </Table>
                  
                  {filteredStocks.length === 0 && (
                    <motion.div 
                      className="flex flex-col items-center justify-center py-12 text-slate-400"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <XCircle size={32} className="mb-2 opacity-50" />
                      <p>No stocks found matching your search</p>
                      <motion.div whileHover={{ scale: 1.05 }}>
                        <Button 
                          variant="link" 
                          onClick={() => setSearchQuery("")} 
                          className="text-indigo-400 hover:text-indigo-300 mt-2"
                        >
                          Clear search
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            ) : (
              <div className="flex flex-col md:flex-row h-[600px]">
                <div className="md:w-1/4 border-r border-gray-600/20 bg-gray-800/20">
                  <div className="p-3 border-b border-gray-600/20">
                    <div className="relative">
                      <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder="Filter stocks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 pl-8 bg-gray-700/20 border-gray-600/20 text-slate-200 text-sm focus-visible:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <ScrollArea className="h-[calc(600px-3rem)]">
                    {filteredStocks.map((stock, idx) => {
                      const change = (Math.random() * 10 - 5).toFixed(2);
                      const isPositive = parseFloat(change) > 0;
                      const changePercent = (Math.abs(parseFloat(change)) / stock.Price * 100).toFixed(2);
                      
                      return (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <div
                            onClick={() => setSelectedStock(stock.stock_name)}
                            className={`flex justify-between items-center p-3 hover:bg-gray-700/20 cursor-pointer transition-colors ${
                              selectedStock === stock.stock_name ? "bg-gray-700/20 border-l-2 border-indigo-500" : ""
                            }`}
                          >
                            <div>
                              <div className="font-medium text-white flex items-center gap-1">
                                <DollarSign size={12} className="text-indigo-400" />
                                {stock.stock_name}
                              </div>
                              <div className="text-xs text-slate-400 mt-1">
                                ${stock.Price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>
                            <div className={`text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                              <div className="flex items-center gap-1">
                                {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                {changePercent}%
                              </div>
                            </div>
                          </div>
                          {idx < filteredStocks.length - 1 && <Separator className="bg-gray-600/20" />}
                        </motion.div>
                      );
                    })}
                    
                    {filteredStocks.length === 0 && (
                      <motion.div 
                        className="flex flex-col items-center justify-center py-12 text-slate-400"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <XCircle size={24} className="mb-2 opacity-50" />
                        <p className="text-sm">No stocks found</p>
                        <motion.div whileHover={{ scale: 1.05 }}>
                          <Button 
                            variant="link" 
                            onClick={() => setSearchQuery("")} 
                            className="text-indigo-400 hover:text-indigo-300 mt-2 text-sm"
                          >
                            Clear search
                          </Button>
                        </motion.div>
                      </motion.div>
                    )}
                  </ScrollArea>
                </div>
                <div className="md:w-3/4 bg-gray-900/20">
                  <div className="h-10 bg-gray-800/30 border-b border-gray-600/20 flex items-center px-4 justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-indigo-900/30 border-indigo-600/30 text-indigo-300">
                        {selectedStock}
                      </Badge>
                      <span className="text-xs text-slate-400">Daily Chart</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.div whileHover={{ scale: 1.1 }}>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-200">
                          <CalendarClock size={14} />
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.1 }}>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-200">
                          <Sparkles size={14} />
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                  <TradingViewWidget symbol={selectedStock} />
                </div>
              </div>
            )}

            <CardFooter className="border-t border-gray-600/20 p-3 flex justify-between items-center bg-gray-800/30">
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <CalendarClock size={12} />
                Last updated: {new Date().toLocaleTimeString()}
              </div>
              <div className="flex gap-2">
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setView(view === "table" ? "chart" : "table")}
                    className="gap-2 text-xs text-slate-400 hover:text-indigo-300 hover:bg-gray-700/20 h-8"
                  >
                    {view === "table" ? <LineChart size={14} /> : <BarChart4 size={14} />}
                    {view === "table" ? "View Chart" : "View Table"}
                  </Button>
                </motion.div>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      <style>
        {`
          @keyframes gradientPulse {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .shadow-glow-blue {
            box-shadow: 0 0 12px rgba(59, 130, 246, 0.2);
          }
          .drop-shadow-glow-green {
            filter: drop-shadow(0 0 4px rgba(16, 185, 129, 0.3));
          }
          .drop-shadow-glow-red {
            filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.3));
          }
          .animate-text-shimmer {
            background-size: 200% auto;
            animation: gradientPulse 3s ease infinite;
          }
        `}
      </style>
      </motion.div>
    </div>
    </div>
  );
};


export default Watchlist;
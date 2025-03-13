import { useState, useEffect, useRef, memo } from "react";
import {
  Settings,
  ChevronLeft,
  ChevronRight,
  LineChart,
  Grid,
  RefreshCw,
  Plus,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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
  const [showChart, setShowChart] = useState(false);
  const [selectedStock, setSelectedStock] = useState("AAPL");
  const activeWatchlist = watchlists[activeWatchlistIndex];

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

  return (
    <div className="min-h-screen bg-[#121826] text-[#e0e6f0] p-6 font-sans">
      <Card className="bg-[#1e293b] border border-gray-600 shadow-lg rounded-2xl">
        <CardHeader className="flex justify-between items-center border-b border-gray-600">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => handleWatchlistNavigation("prev")}>
              <ChevronLeft />
            </Button>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{activeWatchlist.watchlistName}</h2>
              <span className="text-sm text-gray-400">
                ({activeWatchlistIndex + 1} of {watchlists.length})
              </span>
            </div>
            <Button variant="ghost" onClick={() => handleWatchlistNavigation("next")}>
              <ChevronRight />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus size={16} /> New Watchlist
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Watchlist</DialogTitle>
                </DialogHeader>
                <Input
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  placeholder="Enter watchlist name"
                />
                <DialogFooter>
                  <Button onClick={createWatchlist}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus size={16} /> Add Stock
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Stock to {activeWatchlist.watchlistName}</DialogTitle>
                </DialogHeader>
                <Input
                  value={newStockTicker}
                  onChange={(e) => setNewStockTicker(e.target.value)}
                  placeholder="Enter stock ticker"
                />
                <DialogFooter>
                  <Button onClick={addStock}>Add</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        {!showChart ? (
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="text-[#d9dbe1]">
                  <TableHead>Stock</TableHead>
                  <TableHead>Live Price</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Change %</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Today's High</TableHead>
                  <TableHead>Today's Low</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeWatchlist.stocks.map((stock, idx) => {
                  const change = (Math.random() * 10 - 5).toFixed(2);
                  const isPositive = parseFloat(change) > 0;
                  const changePercent = (Math.abs(parseFloat(change)) / stock.Price * 100).toFixed(2);
                  const high = (stock.Price * 1.05).toFixed(2);
                  const low = (stock.Price * 0.95).toFixed(2);

                  return (
                    <TableRow key={idx} className="hover:bg-gray-700">
                      <TableCell className="text-[#fafaf9] font-semibold">{stock.stock_name}</TableCell>
                      <TableCell className="text-[#fafaf9] font-medium">
                        ${stock.Price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      
                      <TableCell className={`${isPositive ? 'text-green-500' : 'text-red-500'}`}>
  <div className="flex items-center gap-1">
    {isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
    ${Math.abs(parseFloat(change)).toFixed(2)}
  </div>
</TableCell>

<TableCell className={`${isPositive ? 'text-green-500' : 'text-red-500'}`}>
  <div className="flex items-center gap-1">
    {isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
    {isPositive ? '+' : '-'}{changePercent}%
  </div>
</TableCell>

                      
                      <TableCell className="text-[#38bdf8] font-medium">
                        {(stock.volume / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}K
                      </TableCell>
                      
                      <TableCell className="text-[#10b981]">${high}</TableCell>
                      <TableCell className="text-[#ef4444]">${low}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        ) : (
          <div className="flex h-[600px]">
            <div className="w-1/4 border-r border-gray-600 overflow-y-auto">
              {activeWatchlist.stocks.map((stock, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedStock(stock.stock_name)}
                  className={`p-4 hover:bg-white-700 cursor-pointer text-white ${
                    selectedStock === stock.stock_name ? "bg-gray-700" : ""
                  }`}
                >
                  {stock.stock_name}
                </div>
              ))}
            </div>
            <div className="w-3/4">
              <TradingViewWidget symbol={selectedStock} />
            </div>
          </div>
        )}

        <div className="p-4 border-t border-gray-600 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => setShowChart(!showChart)}
            className="gap-2"
          >
            <LineChart size={18} />
            {showChart ? "Hide Chart" : "Show Chart"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Watchlist;
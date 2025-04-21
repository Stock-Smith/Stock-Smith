import React, { useState, useEffect, useRef,useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Briefcase,
  PieChart,
  BarChart3,
  ArrowUp,
  ArrowDown,
  PlusCircle,
  MinusCircle,
  X,
  Wifi,
  WifiOff,
  Trash2,
  Plus,
  Minus,
  Info,
} from "lucide-react";
import DailyGainLoss from "@/components/DailyGainLoss";
import AssetsSummary from "@/components/AssetsSummary";
import PortfolioTable from "@/components/PortfolioTable";
import { io, Socket } from "socket.io-client";
import Papa from "papaparse";

interface SectorData {
  name: string;
  latestValue: number;
  investedValue: number;
  weight: number;
  color?: string;
  stocks: StockDataWithCalculations[];
  avgPerformance: number;
}

interface StockData {
  ticker: string;
  sector: string;
  investedValue: number;
  quantity: number;
  currentQuantity: number;
  marketCap: MarketCapType;
  beta: number;
}

interface StockDataWithCalculations extends StockData {
  name: string;
  price: number;
  change: number;
  changePercent: number;
  latestValue: number;
  investedValue: number;
  weight: number;
  beta: number;
}

interface PriceData {
  price?: number;
  change?: number;
  changePercent?: number;
  prevClose?: number;
  beta?: number;
  updatedAt?: Date;
}

interface PriceState {
  [ticker: string]: PriceData;
}

type MarketCapType = "All" | "Large Cap" | "Mid Cap" | "Small Cap";

interface CsvStock {
  Symbol: string;
  "Security Name": string;
}

// Use environment variable or a proper path
const CSV_URL = "/merged_symbols.csv"; 

const initialStockData: StockData[] = [
  { ticker: "AAPL", sector: "Technology", investedValue: 404550, quantity: 1000, currentQuantity: 850, marketCap: "Large Cap", beta: 1.20 },
  { ticker: "MSFT", sector: "Technology", investedValue: 292087.5, quantity: 150, currentQuantity: 150, marketCap: "Large Cap", beta: 0.90 },
  { ticker: "GOOGL", sector: "Technology", investedValue: 224495, quantity: 100, currentQuantity: 100, marketCap: "Large Cap", beta: 1.10 },
  { ticker: "AMZN", sector: "Consumer Discretionary", investedValue: 205971.2, quantity: 320, currentQuantity: 280, marketCap: "Large Cap", beta: 1.25 },
  { ticker: "META", sector: "Communication Services", investedValue: 162900, quantity: 300, currentQuantity: 300, marketCap: "Large Cap", beta: 1.30 },
  { ticker: "TSLA", sector: "Consumer Discretionary", investedValue: 221700, quantity: 1000, currentQuantity: 950, marketCap: "Large Cap", beta: 2.00 },
  { ticker: "NVDA", sector: "Technology", investedValue: 114950, quantity: 200, currentQuantity: 200, marketCap: "Large Cap", beta: 1.50 },
  { ticker: "XOM", sector: "Energy", investedValue: 130800, quantity: 100, currentQuantity: 125, marketCap: "Large Cap", beta: 0.95 },
  { ticker: "JPM", sector: "Financials", investedValue: 110682.5, quantity: 50, currentQuantity: 50, marketCap: "Large Cap", beta: 1.10 },
  { ticker: "BAC", sector: "Financials", investedValue: 170070, quantity: 100, currentQuantity: 100, marketCap: "Large Cap", beta: 1.20 },
  { ticker: "DIS", sector: "Communication Services", investedValue: 103935, quantity: 100, currentQuantity: 75, marketCap: "Large Cap", beta: 1.05 },
  { ticker: "PFE", sector: "Healthcare", investedValue: 162887.5, quantity: 50, currentQuantity: 60, marketCap: "Large Cap", beta: 0.70 },
  { ticker: "PYPL", sector: "Financials", investedValue: 145000, quantity: 200, currentQuantity: 175, marketCap: "Mid Cap", beta: 1.35 },
  { ticker: "INTC", sector: "Technology", investedValue: 138500, quantity: 350, currentQuantity: 350, marketCap: "Mid Cap", beta: 1.10 },
  { ticker: "AMD", sector: "Technology", investedValue: 175500, quantity: 250, currentQuantity: 225, marketCap: "Mid Cap", beta: 1.40 },
  { ticker: "UBER", sector: "Technology", investedValue: 128000, quantity: 200, currentQuantity: 200, marketCap: "Mid Cap", beta: 1.60 },
  { ticker: "ABNB", sector: "Consumer Discretionary", investedValue: 112500, quantity: 75, currentQuantity: 75, marketCap: "Mid Cap", beta: 1.45 },
  { ticker: "CRWD", sector: "Technology", investedValue: 115000, quantity: 50, currentQuantity: 65, marketCap: "Mid Cap", beta: 1.55 },
  { ticker: "PLTR", sector: "Technology", investedValue: 89500, quantity: 500, currentQuantity: 450, marketCap: "Small Cap", beta: 2.10 },
  { ticker: "SOFI", sector: "Financials", investedValue: 65000, quantity: 1000, currentQuantity: 1000, marketCap: "Small Cap", beta: 1.80 },
  { ticker: "HOOD", sector: "Financials", investedValue: 78000, quantity: 600, currentQuantity: 550, marketCap: "Small Cap", beta: 2.20 },
  { ticker: "RIVN", sector: "Consumer Discretionary", investedValue: 87500, quantity: 700, currentQuantity: 650, marketCap: "Small Cap", beta: 2.50 },
  { ticker: "DKNG", sector: "Consumer Discretionary", investedValue: 72000, quantity: 400, currentQuantity: 400, marketCap: "Small Cap", beta: 2.30 },
  { ticker: "NIO", sector: "Consumer Discretionary", investedValue: 56000, quantity: 800, currentQuantity: 750, marketCap: "Small Cap", beta: 2.40 },
];


const sectorColors: Record<string, string> = {
  "Technology": "#3b82f6",
  "Financials": "#8b5cf6",
  "Healthcare": "#ec4899",
  "Energy": "#10b981",
  "Consumer Discretionary": "#f59e0b",
  "Communication Services": "#6366f1",
  "Industrials": "#ef4444",
  "Materials": "#0ea5e9",
  "Utilities": "#14b8a6",
  "Consumer Staples": "#a855f7",
  "Real Estate": "#f97316",
};

interface AddStockForm {
  ticker: string;
  sector: string;
  investedValue: number;
  quantity: number;
  currentQuantity: number;
  marketCap: MarketCapType;
}

interface QuantityAdjustment {
  stockId: string;
  amount: number;
}

interface Transaction {
  ticker: string;
  type: string;
  quantity: number;
  price: number;
  totalValue: number;
  date: string;
}

async function getStockData(ticker: string) {
  // Only include this if you have an API key
  const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
  if (!API_KEY) {
    console.error("API key missing");
    return { price: undefined, change: undefined, changePercent: undefined };
  }
  
  const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();

    const price = data.c;
    const change = data.d;
    const changePercent = data.dp;

    console.log(`Ticker: ${ticker}`);
    console.log(`Price: $${price}`);
    console.log(`Change: $${change}`);
    console.log(`Change %: ${changePercent}%`);

    return { price, change, changePercent };
  } catch (error) {
    console.error("Error fetching stock data:", error);
    return { price: undefined, change: undefined, changePercent: undefined };
  }
}

const Portfolio = () => {
  const userId = "user123";
  const [activeMarketCap, setActiveMarketCap] = useState<MarketCapType>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [stockData, setStockData] = useState<StockData[]>(initialStockData);
  const [stocksWithCalculations, setStocksWithCalculations] = useState<StockDataWithCalculations[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addStockForm, setAddStockForm] = useState<AddStockForm>({
    ticker: "",
    sector: "",
    investedValue: 0,
    quantity: 0,
    currentQuantity: 0,
    marketCap: "Large Cap",
  });
  const [sectorData, setSectorData] = useState<SectorData[]>([]);
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const [quantityAdjustment, setQuantityAdjustment] = useState<Record<string, number>>({});
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([]);
  const [csvData, setCsvData] = useState<CsvStock[]>([]);
  const [isLoadingCSV, setIsLoadingCSV] = useState(true);
  const [errorCSV, setErrorCSV] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketStatus, setSocketStatus] = useState("Disconnected");
  const [priceData, setPriceData] = useState<PriceState>({});
  const [subscribedTickers, setSubscribedTickers] = useState<Set<string>>(new Set());
  const tickersRef = useRef<string[]>([]);

  // Function to handle sector click that was missing
  const handleSectorClick = (sectorName: string) => {
    setActiveSector(activeSector === sectorName ? null : sectorName);
  };

  useEffect(() => {
    fetch(CSV_URL)
      .then(response => {
        if (!response.ok) throw new Error(`Failed to fetch CSV: ${response.status}`);
        return response.text();
      })
      .then(data => {
        const results = Papa.parse(data, { header: true, skipEmptyLines: true });
        if (results.errors && results.errors.length > 0) {
          setErrorCSV("CSV parse error: " + results.errors.map(e => e.message).join(', '));
          return;
        }
        setCsvData(results.data as CsvStock[]);
        setIsLoadingCSV(false);
        setIsLoading(false); // Set initial loading state to false
      })
      .catch(err => {
        setErrorCSV("Failed to load stock data: " + err.message);
        setIsLoadingCSV(false);
        setIsLoading(false); // Still stop loading even if there's an error
      });
  }, []);

  const fetchStockName = (ticker: string): string => {
    if (isLoadingCSV) return "Loading...";
    if (errorCSV) return "Unknown Company";
    const stockInfo = csvData.find(stock => stock.Symbol === ticker);
    return stockInfo?.["Security Name"] || "Unknown Company";
  };

  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateStockFields = async (stocks: StockData[]): Promise<StockDataWithCalculations[]> => {
    const enhancedStocks = await Promise.all(stocks.map(async (stock) => {
      const name = fetchStockName(stock.ticker);
      const tickerUpperCase = stock.ticker.toUpperCase();
      const tickerData = priceData[tickerUpperCase];
      const price = tickerData?.price ?? 0;
      const beta = tickerData?.beta || stock.beta;
      const latestValue = price * stock.currentQuantity;
      const currentToOriginalRatio = stock.currentQuantity / stock.quantity;
      const adjustedInvestedValue = stock.currentQuantity === stock.quantity 
        ? stock.investedValue 
        : stock.investedValue * currentToOriginalRatio;
      const change = latestValue - adjustedInvestedValue;
      const changePercent = (change / adjustedInvestedValue) * 100;

      return {
        ...stock,
        name,
        price,
        change,
        changePercent,
        latestValue,
        investedValue: adjustedInvestedValue,
        weight: 0,
        beta
      };
    }));

    const totalPortfolioValue = enhancedStocks.reduce((sum, stock) => sum + stock.latestValue, 0);
    return enhancedStocks.map(stock => ({
      ...stock,
      weight: (stock.latestValue / totalPortfolioValue) * 100
    }));
  };

  const generateSectorData = (stocks: StockDataWithCalculations[]): SectorData[] => {
    const sectorGroups = stocks.reduce((acc, stock) => {
      if (!acc[stock.sector]) acc[stock.sector] = [];
      acc[stock.sector].push(stock);
      return acc;
    }, {} as Record<string, StockDataWithCalculations[]>);

    const totalValue = stocks.reduce((sum, stock) => sum + stock.latestValue, 0);

    return Object.entries(sectorGroups).map(([sectorName, sectorStocks]) => {
      const latestValue = sectorStocks.reduce((sum, stock) => sum + stock.latestValue, 0);
      const investedValue = sectorStocks.reduce((sum, stock) => sum + stock.investedValue, 0);
      const weight = (latestValue / totalValue) * 100;
      const avgPerformance = sectorStocks.reduce((sum, stock) => sum + stock.changePercent, 0) / sectorStocks.length;

      return {
        name: sectorName,
        latestValue,
        investedValue,
        weight,
        color: sectorColors[sectorName] || `#${Math.floor(Math.random()*16777215).toString(16)}`,
        stocks: sectorStocks,
        avgPerformance
      };
    });
  };

  const handleFormChange = (field: keyof AddStockForm, value: string | number) => {
    setAddStockForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddStock = () => {
    if (!addStockForm.ticker || !addStockForm.sector || addStockForm.investedValue <= 0 || addStockForm.quantity <= 0) {
      alert("Please fill all required fields with valid values");
      return;
    }

    const currentQuantity = addStockForm.currentQuantity > 0 
      ? addStockForm.currentQuantity 
      : addStockForm.quantity;

    const newStock: StockData = {
      ticker: addStockForm.ticker.toUpperCase(),
      sector: addStockForm.sector,
      investedValue: addStockForm.investedValue,
      quantity: addStockForm.quantity,
      currentQuantity,
      marketCap: addStockForm.marketCap,
      beta: 1.0
    };

    const initialTransaction: Transaction = {
      ticker: newStock.ticker,
      type: 'buy',
      quantity: newStock.quantity,
      price: newStock.investedValue / newStock.quantity,
      totalValue: newStock.investedValue,
      date: new Date().toISOString(),
    };

    setStockData(prev => [...prev, newStock]);
    setTransactionHistory(prev => [...prev, initialTransaction]);
    setShowAddForm(false);
    setAddStockForm({
      ticker: "",
      sector: "",
      investedValue: 0,
      quantity: 0,
      currentQuantity: 0,
      marketCap: "Large Cap"
    });
  };

  const handleRemoveStock = (ticker: string) => {
    if (window.confirm(`Remove ${ticker} from portfolio?`)) {
      setStockData(prev => prev.filter(stock => stock.ticker !== ticker));
    }
  };

  const handleQuantityAdjustmentChange = (ticker: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setQuantityAdjustment(prev => ({ ...prev, [ticker]: numValue }));
  };

  const handleQuantityAdjust = (ticker: string, isAdd: boolean) => {
    const amount = quantityAdjustment[ticker] || 0;
    if (amount <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    setStockData(prevStocks => prevStocks.map(stock => {
      if (stock.ticker === ticker) {
        const newQuantity = Math.max(0, isAdd ? stock.currentQuantity + amount : stock.currentQuantity - amount);
        const stockPrice = priceData[ticker]?.price || stocksWithCalculations.find(s => s.ticker === ticker)?.price || 0;
        
        const transaction: Transaction = {
          ticker,
          type: isAdd ? 'buy' : 'sell',
          quantity: amount,
          price: stockPrice,
          totalValue: amount * stockPrice,
          date: new Date().toISOString(),
        };

        setTransactionHistory(prev => [...prev, transaction]);

        return { ...stock, currentQuantity: newQuantity };
      }
      return stock;
    }));

    setQuantityAdjustment(prev => ({ ...prev, [ticker]: 0 }));
  };

  const getFilteredStocks = () => activeMarketCap === "All" 
    ? stocksWithCalculations 
    : stocksWithCalculations.filter(stock => stock.marketCap === activeMarketCap);

  const calculatePortfolioBeta = (): number => {
    const stocksWithBeta = stocksWithCalculations.filter(stock => stock.beta !== undefined);
    if (stocksWithBeta.length === 0) return 1.0;
    
    const totalValueWithBeta = stocksWithBeta.reduce((sum, stock) => sum + stock.latestValue, 0);
    if (totalValueWithBeta === 0) return 1.0;
    
    return stocksWithBeta.reduce((sum, stock) => {
      const weight = stock.latestValue / totalValueWithBeta;
      return sum + stock.beta * weight;
    }, 0);
  };

  // Sort sectors by weight for display
  const sortedSectors = [...sectorData].sort((a, b) => b.weight - a.weight);

  // Socket.IO connection and price updates
  useEffect(() => {
    if (!userId) return;

    // Use a more configurable socket URL (could be from env vars)
    const socketUrl = import.meta.env.VITE_SOCKET_URL || "https://api.example.com";
    const newSocket = io(socketUrl, { transports: ["websocket", "polling"] });
    setSocket(newSocket);
    setSocketStatus("Connecting...");

    newSocket.on("connect", () => {
      setIsConnected(true);
      setSocketStatus(`Connected (ID: ${newSocket.id})`);
      newSocket.emit("authenticate", userId);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      setSocketStatus("Disconnected");
      setSubscribedTickers(new Set());
    });

    newSocket.on("price", (data: { ticker: string; price?: number; prevClose?: number; beta?: number }) => {
      const ticker = data.ticker?.toUpperCase();
      if (!ticker) return;

      setPriceData(prev => ({
        ...prev,
        [ticker]: {
          price: data.price,
          prevClose: data.prevClose,
          beta: data.beta,
          updatedAt: new Date()
        }
      }));
    });

    return () => {
      newSocket.disconnect();
      setIsConnected(false);
      setSocketStatus("Disconnected");
    };
  }, [userId]);

  useEffect(() => {
    if (!socket || !isConnected || !stockData.length) return;

    const allTickers = stockData.map(stock => stock.ticker.toUpperCase());
    const oldTickers = tickersRef.current;

    const tickersToUnsubscribe = oldTickers.filter(t => !allTickers.includes(t));
    const tickersToSubscribe = allTickers.filter(t => !oldTickers.includes(t));

    if (tickersToUnsubscribe.length > 0) socket.emit("unsubscribe", tickersToUnsubscribe);
    if (tickersToSubscribe.length > 0) socket.emit("subscribe", tickersToSubscribe);

    tickersRef.current = allTickers;
  }, [stockData, isConnected, socket]);

  useEffect(() => {
    const updateStocks = async () => {
      const calculatedStocks = await calculateStockFields(stockData);
      setStocksWithCalculations(calculatedStocks);
    };
    updateStocks();
  }, [stockData, priceData]);

  useEffect(() => {
    const filteredStocks = getFilteredStocks();
    setSectorData(generateSectorData(filteredStocks));
  }, [stocksWithCalculations, activeMarketCap]);

  const filteredStocks = getFilteredStocks();
 

  const {
    totalPortfolioValue,
    portfolioInvestmentCost,
    portfolioOverallGain,
    portfolioOverallGainPercentage,
    todayGain,
    todayGainPercentage,
    realizedGain,
    capitalGain,
    otherGain
  } = useMemo(() => {
    // Total portfolio calculations
    const totalPortfolioValue = filteredStocks.reduce((sum, stock) => sum + stock.latestValue, 0);
    const portfolioInvestmentCost = filteredStocks.reduce((sum, stock) => sum + stock.investedValue, 0);
    const portfolioOverallGain = totalPortfolioValue - portfolioInvestmentCost;
    const portfolioOverallGainPercentage = (portfolioOverallGain / portfolioInvestmentCost) * 100 || 0;
  
    // Today's gain calculations
    const todayGain = filteredStocks.reduce((sum, stock) => {
      const prevCloseValue = (priceData[stock.ticker]?.prevClose || 0) * stock.currentQuantity;
      return sum + (stock.latestValue - prevCloseValue);
    }, 0);
    
    const previousDayValue = filteredStocks.reduce((sum, stock) => 
      sum + ((priceData[stock.ticker]?.prevClose || 0) * stock.currentQuantity), 0);
    const todayGainPercentage = previousDayValue !== 0 ? 
      (todayGain / previousDayValue) * 100 : 0;
  
    // Realized gains from transaction history
    const realizedGain = transactionHistory.reduce((sum, transaction) => {
      if (transaction.type === 'sell') {
        const stock = stockData.find(s => s.ticker === transaction.ticker);
        if (stock) {
          const costBasis = (stock.investedValue / stock.quantity) * transaction.quantity;
          return sum + (transaction.totalValue - costBasis);
        }
      }
      return sum;
    }, 0);
    
    return {
      totalPortfolioValue,
      portfolioInvestmentCost,
      portfolioOverallGain,
      portfolioOverallGainPercentage,
      todayGain,
      todayGainPercentage,
      realizedGain,
      capitalGain: realizedGain, // Assuming all realized gains are capital gains
      otherGain: 0 // Requires additional data to calculate
    };
  }, [filteredStocks, priceData, transactionHistory, stockData]);

  return (
    <div className="min-h-screen bg-black text-gray-100 pb-8 mt-7">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 relative z-10">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold text-blue-400">
                PORTFOLIO VISTA
              </h1>
              <p className="text-gray-400 text-sm">Market Cap Classification & Analysis</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-800 text-gray-300">
                {isConnected ? (
                  <Wifi className="h-3 w-3 text-green-400" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-400" />
                )}
                <span>{isConnected ? "Connected" : "Disconnected"}</span>
              </div>
              {errorCSV && (
                <div className="text-xs px-3 py-1 rounded-md bg-red-950/30 text-red-400">
                  {errorCSV}
                </div>
              )}
              {isLoadingCSV && (
                <div className="text-xs px-3 py-1 rounded-md bg-amber-950/30 text-amber-400">
                  Loading stock symbols...
                </div>
              )}
              <div className="bg-gray-900 rounded-xl p-4 flex flex-col items-center border border-gray-800">
                <p className="text-sm text-gray-400 mb-1">Portfolio Value</p>
                <p className="text-2xl font-bold text-blue-400">
                  ${totalPortfolioValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </div>
  
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
              <div className="text-blue-400 text-lg">Loading portfolio data...</div>
            </div>
          </div>
        ) : (
          <div>
            <AssetsSummary
  data={{
    latestValue: totalPortfolioValue,
    investmentCost: portfolioInvestmentCost,
    overallGain: portfolioOverallGain,
    overallGainPercentage: portfolioOverallGainPercentage,
    todayGain: todayGain,
    todayGainPercentage: todayGainPercentage,
    realizedGain: realizedGain,
    capitalGain: capitalGain,
    otherGain: otherGain,
    beta: calculatePortfolioBeta()
  }}
/>
  
            <DailyGainLoss 
              userId={userId}
              stockData={stocksWithCalculations} 
              priceData={priceData}
            />
  
            <Card className="bg-gray-900 overflow-hidden rounded-xl border border-gray-800 mb-6">
              <CardHeader className="py-4 bg-black border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-900/20 rounded-lg">
                      <Briefcase className="h-5 w-5 text-blue-400" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-100">
                      Market Overview
                    </CardTitle>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-blue-900/20 text-blue-400 border-blue-800 hover:bg-blue-900 hover:text-blue-300"
                  >
                    {showAddForm ? (
                      <>
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </>
                    ) : (
                      <>
                        <PlusCircle className="h-4 w-4 mr-1" /> Add Stock
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
  
              {showAddForm && (
                <div className="p-4 bg-gray-950 border-b border-gray-800">
                  <h3 className="text-lg font-medium text-blue-400 mb-4">
                    Add New Stock to Portfolio
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Ticker Symbol *</label>
                      <Input 
                        value={addStockForm.ticker}
                        onChange={(e) => handleFormChange('ticker', e.target.value)}
                        placeholder="AAPL"
                        className="bg-gray-800 border-gray-700 text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Sector *</label>
                      <Select 
                        value={addStockForm.sector}
                        onValueChange={(value) => handleFormChange('sector', value)}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                          <SelectValue placeholder="Select sector" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700 text-gray-100">
                          {Object.keys(sectorColors).map((sector) => (
                            <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Market Cap *</label>
                      <Select 
                        value={addStockForm.marketCap}
                        onValueChange={(value) => handleFormChange('marketCap', value as MarketCapType)}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                          <SelectValue placeholder="Select market cap" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700 text-gray-100">
                          <SelectItem value="Large Cap">Large Cap</SelectItem>
                          <SelectItem value="Mid Cap">Mid Cap</SelectItem>
                          <SelectItem value="Small Cap">Small Cap</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Invested Value ($) *</label>
                      <Input 
                        type="number"
                        value={addStockForm.investedValue === 0 ? "" : addStockForm.investedValue}
                        onChange={(e) => handleFormChange('investedValue', parseFloat(e.target.value) || 0)}
                        placeholder="10000"
                        className="bg-gray-800 border-gray-700 text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Initial Quantity *</label>
                      <Input 
                        type="number"
                        value={addStockForm.quantity === 0 ? "" : addStockForm.quantity}
                        onChange={(e) => handleFormChange('quantity', parseInt(e.target.value) || 0)}
                        placeholder="100"
                        className="bg-gray-800 border-gray-700 text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Current Quantity (Optional)</label>
                      <Input 
                        type="number"
                        value={addStockForm.currentQuantity === 0 ? "" : addStockForm.currentQuantity}
                        onChange={(e) => handleFormChange('currentQuantity', parseInt(e.target.value) || 0)}
                        placeholder="Same as initial"
                        className="bg-gray-800 border-gray-700 text-gray-100"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button 
                      onClick={handleAddStock}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Add to Portfolio
                    </Button>
                  </div>
                </div>
              )}
  
              <CardContent className="p-0">
                <Tabs defaultValue="All" className="w-full">
                  <div className="border-b border-gray-800 px-4">
                    <TabsList className="bg-transparent border-b-0">
                      <TabsTrigger 
                        value="All" 
                        onClick={() => setActiveMarketCap("All")}
                        className={`pb-3 pt-2 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:text-blue-400 rounded-none text-gray-400`}
                      >
                        All Assets
                      </TabsTrigger>
                      <TabsTrigger 
                        value="Large Cap" 
                        onClick={() => setActiveMarketCap("Large Cap")}
                        className={`pb-3 pt-2 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:text-blue-400 rounded-none text-gray-400`}
                      >
                        Large Cap
                      </TabsTrigger>
                      <TabsTrigger 
                        value="Mid Cap" 
                        onClick={() => setActiveMarketCap("Mid Cap")}
                        className={`pb-3 pt-2 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:text-blue-400 rounded-none text-gray-400`}
                      >
                        Mid Cap
                      </TabsTrigger>
                      <TabsTrigger 
                        value="Small Cap" 
                        onClick={() => setActiveMarketCap("Small Cap")}
                        className={`pb-3 pt-2 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:text-blue-400 rounded-none text-gray-400`}
                      >
                        Small Cap
                      </TabsTrigger>
                    </TabsList>
                  </div>
  
                  <TabsContent value="All" className="p-0 m-0">
                    <div className="p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                        {/* Sector Distribution Chart */}
                        <div className="lg:col-span-2 bg-gray-950 rounded-xl border border-gray-800 p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-gray-200">Sector Distribution</h3>
                            <div className="flex items-center gap-2">
                              <Info className="h-4 w-4 text-gray-500" />
                              <span className="text-xs text-gray-500">Click sector to filter</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {sortedSectors.map((sector) => (
                              <Badge
                                key={sector.name}
                                variant="outline"
                                className={`cursor-pointer px-3 py-1 border ${
                                  activeSector === sector.name 
                                    ? 'bg-opacity-20 bg-blue-900 border-blue-600' 
                                    : 'border-gray-700 hover:border-gray-600'
                                }`}
                                style={{
                                  borderLeftWidth: '4px',
                                  borderLeftColor: sector.color || '#888',
                                }}
                                onClick={() => handleSectorClick(sector.name)}
                              >
                                {sector.name}
                                <span className="ml-2 text-xs text-gray-400">
                                  {sector.weight.toFixed(1)}%
                                </span>
                              </Badge>
                            ))}
                          </div>
                          <div className="h-8 rounded-lg overflow-hidden bg-gray-900 mb-4 flex">
                            {sortedSectors.map((sector) => (
                              <div
                                key={sector.name}
                                className="h-full transition-all duration-300 hover:opacity-80"
                                style={{
                                  backgroundColor: sector.color || '#888',
                                  width: `${sector.weight}%`,
                                  minWidth: sector.weight < 3 ? '3%' : undefined,
                                }}
                                title={`${sector.name}: ${sector.weight.toFixed(1)}%`}
                              />
                            ))}
                          </div>
                          <div className="space-y-3">
                            {sortedSectors.map((sector) => (
                              <div key={sector.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: sector.color }}
                                  />
                                  <span className="text-sm text-gray-300">{sector.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-sm text-gray-400">
                                    {formatCurrency(sector.latestValue)}
                                  </span>
                                  <div className="w-20 text-right">
                                    <span
                                      className={`text-sm ${
                                        sector.avgPerformance >= 0
                                          ? 'text-green-400'
                                          : 'text-red-400'
                                      }`}
                                    >
                                      {sector.avgPerformance >= 0 ? '+' : ''}
                                      {sector.avgPerformance.toFixed(2)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Market Cap Distribution */}
                        <div className="bg-gray-950 rounded-xl border border-gray-800 p-4">
                          <h3 className="font-medium text-gray-200 mb-4">Market Cap Distribution</h3>
                          <div className="space-y-4">
                            {['Large Cap', 'Mid Cap', 'Small Cap'].map((capType) => {
                              const capStocks = stocksWithCalculations.filter(s => s.marketCap === capType);
                              const capValue = capStocks.reduce((sum, s) => sum + s.latestValue, 0);
                              const capWeight = (capValue / totalPortfolioValue) * 100;
                              const avgPerformance = capStocks.length 
                                ? capStocks.reduce((sum, s) => sum + s.changePercent, 0) / capStocks.length
                                : 0;
                                
                              return (
                                <div key={capType} className="space-y-1">
                                  <div className="flex justify-between items-center">
                                    <div className="text-sm text-gray-300">{capType}</div>
                                    <div className="text-sm text-gray-400">{capWeight.toFixed(1)}%</div>
                                  </div>
                                  <Progress 
  value={capWeight} 
  className={`h-2 bg-gray-800 ${
    capType === "Large Cap" ? "[&>div]:bg-blue-500" : 
    capType === "Mid Cap" ? "[&>div]:bg-purple-500" : "[&>div]:bg-amber-500"
  }`}
/>
                                  <div className="flex justify-between text-xs">
                                    <div className="text-gray-400">
                                      {formatCurrency(capValue)}
                                    </div>
                                    <div className={avgPerformance >= 0 ? "text-green-400" : "text-red-400"}>
                                      {avgPerformance >= 0 ? "+" : ""}{avgPerformance.toFixed(2)}%
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="mt-6 pt-4 border-t border-gray-800">
                            <h4 className="text-sm font-medium text-gray-300 mb-2">Risk Analysis</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <div className="text-xs text-gray-400">Portfolio Beta</div>
                                <div className="text-sm font-medium text-blue-400">{calculatePortfolioBeta().toFixed(2)}</div>
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="text-xs text-gray-400">Market Correlation</div>
                                <div className="text-sm font-medium text-blue-400">{(calculatePortfolioBeta() * 0.8).toFixed(2)}</div>
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="text-xs text-gray-400">Volatility Indicator</div>
                                <div className="text-sm font-medium text-blue-400">
                                  {calculatePortfolioBeta() < 0.8 ? "Low" : calculatePortfolioBeta() < 1.2 ? "Moderate" : "High"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Content for other tabs will use the same layout */}
                  <TabsContent value="Large Cap" className="p-4 m-0">
                    {/* Will show filtered content based on activeMarketCap state */}
                  </TabsContent>
                  <TabsContent value="Mid Cap" className="p-4 m-0">
                    {/* Will show filtered content based on activeMarketCap state */}
                  </TabsContent>
                  <TabsContent value="Small Cap" className="p-4 m-0">
                    {/* Will show filtered content based on activeMarketCap state */}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            <PortfolioTable 
              stocks={filteredStocks}
              activeSector={activeSector}
              quantityAdjustment={quantityAdjustment}
              handleQuantityAdjustmentChange={handleQuantityAdjustmentChange}
              handleQuantityAdjust={handleQuantityAdjust}
              handleRemoveStock={handleRemoveStock}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;
import React, { useState, useEffect, useRef, useMemo } from "react";
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

// Type definitions
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
  isFallbackData?: boolean;
}

interface PriceState {
  [ticker: string]: PriceData;
}

type MarketCapType = "All" | "Large Cap" | "Mid Cap" | "Small Cap";

interface CsvStock {
  Symbol: string;
  "Security Name": string;
}

interface AddStockForm {
  ticker: string;
  sector: string;
  investedValue: number;
  quantity: number;
  currentQuantity: number;
  marketCap: MarketCapType;
}

interface QuantityAdjustment {
  [stockId: string]: number;
}

interface Transaction {
  ticker: string;
  type: string;
  quantity: number;
  price: number;
  totalValue: number;
  date: string;
}

// Use environment variable or a proper path
const CSV_URL = "/merged_symbols.csv";

// Initial stock data
const initialStockData: StockData[] = [
  { ticker: "AAPL", sector: "Technology", investedValue: 404550, quantity: 1000, currentQuantity: 850, marketCap: "Large Cap", beta: 1.20 },
  { ticker: "MSFT", sector: "Technology", investedValue: 292087.5, quantity: 150, currentQuantity: 150, marketCap: "Large Cap", beta: 0.90 },
  { ticker: "GOOGL", sector: "Technology", investedValue: 224495, quantity: 100, currentQuantity: 100, marketCap: "Large Cap", beta: 1.10 },
  { ticker: "AMZN", sector: "Consumer Discretionary", investedValue: 205971.2, quantity: 320, currentQuantity: 280, marketCap: "Large Cap", beta: 1.25 },
  { ticker: "META", sector: "Communication Services", investedValue: 162900, quantity: 300, currentQuantity: 300, marketCap: "Large Cap", beta: 1.30 },
  { ticker: "TSLA", sector: "Consumer Discretionary", investedValue: 221700, quantity: 1000, currentQuantity: 950, marketCap: "Large Cap", beta: 2.00 },
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

// Fallback data fetching function
async function fetchStockDataFallback(ticker: string): Promise<PriceData> {
  const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
  
  if (!API_KEY) {
    console.error("API key missing for fallback data fetch");
    return { 
      price: 0, 
      change: 0, 
      changePercent: 0, 
      isFallbackData: true 
    };
  }

  const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${API_KEY}`;
  
  try {
    console.log(`Fetching fallback data for ${ticker}`);
    const response = await fetch(url);
    const data = await response.json();
    
    return {
      price: data.c,
      change: data.d,
      changePercent: data.dp,
      prevClose: data.pc,
      updatedAt: new Date(),
      isFallbackData: true
    };
  } catch (error) {
    console.error(`Error fetching fallback data for ${ticker}:`, error);
    return { 
      price: 0, 
      change: 0, 
      changePercent: 0, 
      isFallbackData: true 
    };
  }
}

const Portfolio = () => {
  // State variables
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
  const [quantityAdjustment, setQuantityAdjustment] = useState<QuantityAdjustment>({});
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([]);
  const [csvData, setCsvData] = useState<CsvStock[]>([]);
  const [isLoadingCSV, setIsLoadingCSV] = useState(true);
  const [errorCSV, setErrorCSV] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketStatus, setSocketStatus] = useState("Disconnected");
  const [priceData, setPriceData] = useState<PriceState>({});
  const [subscribedTickers, setSubscribedTickers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  
  // Refs
  const currentTickersRef = useRef<string[]>([]);
  
  // Function to handle sector click
  const handleSectorClick = (sectorName: string) => {
    setActiveSector(activeSector === sectorName ? null : sectorName);
  };

  // Load CSV data
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
        setIsLoading(false);
      })
      .catch(err => {
        setErrorCSV("Failed to load stock data: " + err.message);
        setIsLoadingCSV(false);
        setIsLoading(false);
      });
  }, []);

  // Socket connection setup
  useEffect(() => {
    // Use a dummy user ID for authentication
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
      stockData.forEach(stock => {
        checkAndFetchFallbackData(stock.ticker);
      });
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
    if (!socket || !isConnected || !stockData.length) return;
    
    const allTickers = stockData.map(stock => stock.ticker.toUpperCase());
    const oldTickers = currentTickersRef.current;
    
    const tickersToUnsubscribe = oldTickers.filter(ticker => !allTickers.includes(ticker));
    const tickersToSubscribe = allTickers.filter(ticker => !oldTickers.includes(ticker));
    
    // Unsubscribe from stocks no longer in the portfolio
    if (tickersToUnsubscribe.length > 0) {
      console.log('Unsubscribing from:', tickersToUnsubscribe);
      socket.emit('unsubscribe', tickersToUnsubscribe);
    }
    
    // Subscribe to new stocks in the portfolio
    if (tickersToSubscribe.length > 0) {
      console.log('Subscribing to:', tickersToSubscribe);
      socket.emit('subscribe', tickersToSubscribe);
      
      // Fetch fallback data for new tickers immediately
      tickersToSubscribe.forEach(ticker => {
        fetchStockDataFallback(ticker).then(data => {
          setPriceData(prev => ({
            ...prev,
            [ticker]: data
          }));
        });
      });
    }
    
    // Update the ref for the next comparison
    currentTickersRef.current = allTickers;
  }, [stockData, isConnected, socket]);
  
  // Function to check and fetch fallback data if needed
  const checkAndFetchFallbackData = (ticker: string) => {
    const upperTicker = ticker.toUpperCase();
    const currentData = priceData[upperTicker];
    
    // If no data or data is older than 5 minutes, fetch fallback
    const needsFallbackData = !currentData || 
      !currentData.updatedAt || 
      (new Date().getTime() - new Date(currentData.updatedAt).getTime() > 5 * 60 * 1000);
    
    if (needsFallbackData) {
      console.log(`Fetching fallback data for ${upperTicker} (missing or stale data)`);
      fetchStockDataFallback(upperTicker).then(data => {
        setPriceData(prev => ({
          ...prev,
          [upperTicker]: data
        }));
      });
    }
  };
  
  // Periodically check for missing data
  useEffect(() => {
    if (!stockData.length) return;
    
    // Check for missing data in current portfolio
    const checkMissingData = () => {
      stockData.forEach(stock => {
        checkAndFetchFallbackData(stock.ticker);
      });
    };
    
    // Initial check
    checkMissingData();
    
    // Set up interval to periodically check for missing data
    const intervalId = setInterval(checkMissingData, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [stockData, priceData]);

  // Helper functions
  const fetchStockName = (ticker: string): string => {
    if (isLoadingCSV) return "Loading...";
    if (errorCSV) return "Unknown Company";
    const stockInfo = csvData.find(stock => stock.Symbol === ticker);
    return stockInfo?.["Security Name"] || "Unknown Company";
  };

  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculate enhanced stock data with latest prices
  const calculateStockFields = async (stocks: StockData[]): Promise<StockDataWithCalculations[]> => {
    const enhancedStocks = await Promise.all(stocks.map(async (stock) => {
      const name = fetchStockName(stock.ticker);
      const tickerUpperCase = stock.ticker.toUpperCase();
      const tickerData = priceData[tickerUpperCase];
      
      // Use price data from socket or fallback to 0
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

  // Generate sector data from stocks
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

  // Form handlers
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

  // Filter stocks based on market cap
  const getFilteredStocks = () => activeMarketCap === "All"
    ? stocksWithCalculations
    : stocksWithCalculations.filter(stock => stock.marketCap === activeMarketCap);

  // Calculate portfolio beta
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

  // Update stocks with calculations when price data changes
  useEffect(() => {
    const updateStocks = async () => {
      const calculatedStocks = await calculateStockFields(stockData);
      setStocksWithCalculations(calculatedStocks);
    };
    
    updateStocks();
  }, [stockData, priceData]);

  // Update sector data when stocks or filter changes
  useEffect(() => {
    const filteredStocks = getFilteredStocks();
    setSectorData(generateSectorData(filteredStocks));
  }, [stocksWithCalculations, activeMarketCap]);

  // Get filtered stocks
  const filteredStocks = getFilteredStocks();
  
  // Sort sectors by weight for display
  const sortedSectors = [...sectorData].sort((a, b) => b.weight - a.weight);

  // Calculate portfolio metrics
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
    <div className="p-4 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">PORTFOLIO VISTA</h1>
      <h2 className="text-xl mb-4">Market Cap Classification & Analysis</h2>
      
      {/* Socket Connection Status */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        {isConnected ? (
          <Wifi className="h-4 w-4 text-green-400" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-400" />
        )}
        <span className={isConnected ? "text-green-400" : "text-red-400"}>
          {isConnected ? "Connected" : "Disconnected"}
        </span>
        <span className="text-gray-400 text-xs">{socketStatus}</span>
      </div>
      
      {/* Error Message */}
      {errorCSV && (
        <div className="bg-red-900/30 text-red-300 p-4 mb-4 rounded-md">
          {errorCSV}
        </div>
      )}
      
      {/* Loading State */}
      {isLoadingCSV && (
        <div className="bg-blue-900/30 text-blue-300 p-4 mb-4 rounded-md">
          Loading stock symbols...
        </div>
      )}
      
      {/* Portfolio Value Card */}
      <Card className="mb-6 bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-2xl text-white">
            Portfolio Value
            <span className="block text-3xl font-bold text-blue-400">
              ${totalPortfolioValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </CardTitle>
        </CardHeader>
      </Card>
      
      {isLoading ? (
        <div className="bg-blue-900/30 text-blue-300 p-4 mb-4 rounded-md">
          Loading portfolio data...
        </div>
      ) : (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4 bg-gray-800 border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-400">
              <PieChart className="h-4 w-4 mr-2" />
              Market Overview
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-400">
              <Briefcase className="h-4 w-4 mr-2" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-400">
              <BarChart3 className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            {/* Add Stock Button */}
            <Button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-900/20 text-blue-400 border-blue-800 hover:bg-blue-900 hover:text-blue-300 mb-4"
              size="sm"
            >
              {showAddForm ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Stock
                </>
              )}
            </Button>
            
            {/* Add Stock Form */}
            {showAddForm && (
              <Card className="mb-6 bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg">Add New Stock to Portfolio</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Ticker Symbol *</label>
                      <Input 
                        value={addStockForm.ticker}
                        onChange={(e) => handleFormChange('ticker', e.target.value)}
                        placeholder="AAPL"
                        className="bg-gray-800 border-gray-700 text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="text-sm mb-1 block text-slate-100">Sector *</label>
                      <Select 
                        value={addStockForm.sector}
                        onValueChange={(value) => handleFormChange('sector', value)}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white-100">
                          <SelectValue placeholder="Select sector" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700 text-white-100">
                          {Object.keys(sectorColors).map((sector) => (
                            <SelectItem key={sector} value={sector}>
                              {sector}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-white-400 mb-1 block">Market Cap *</label>
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
                      <label className="text-sm text-blue-400 mb-1 block">Invested Value ($) *</label>
                      <Input 
                        type="number"
                        value={addStockForm.investedValue || ''}
                        onChange={(e) => handleFormChange('investedValue', parseFloat(e.target.value) || 0)}
                        placeholder="10000"
                        className="bg-gray-800 border-gray-700 text-white-100"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-white-400 mb-1 block">Initial Quantity *</label>
                      <Input 
                        type="number"
                        value={addStockForm.quantity || ''}
                        onChange={(e) => handleFormChange('quantity', parseInt(e.target.value) || 0)}
                        placeholder="100"
                        className="bg-gray-800 border-gray-700 text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Current Quantity (Optional)</label>
                      <Input 
                        type="number"
                        value={addStockForm.currentQuantity || ''}
                        onChange={(e) => handleFormChange('currentQuantity', parseInt(e.target.value) || 0)}
                        placeholder="Same as initial"
                        className="bg-gray-800 border-gray-700 text-gray-100"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleAddStock}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Add to Portfolio
                  </Button>
                </CardFooter>
              </Card>
            )}
            
            {/* Market Cap Filters */}
            <div className="mb-6">
              <TabsList className="w-full bg-transparent border-b border-gray-700">
                <TabsTrigger 
                  value="All" 
                  onClick={() => setActiveMarketCap("All")}
                  className={`pb-3 pt-2 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:text-blue-400 rounded-none text-gray-400`}
                  data-state={activeMarketCap === "All" ? "active" : "inactive"}
                >
                  All Assets
                </TabsTrigger>
                <TabsTrigger 
                  value="LargeCap" 
                  onClick={() => setActiveMarketCap("Large Cap")}
                  className={`pb-3 pt-2 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:text-blue-400 rounded-none text-gray-400`}
                  data-state={activeMarketCap === "Large Cap" ? "active" : "inactive"}
                >
                  Large Cap
                </TabsTrigger>
                <TabsTrigger 
                  value="MidCap" 
                  onClick={() => setActiveMarketCap("Mid Cap")}
                  className={`pb-3 pt-2 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:text-blue-400 rounded-none text-gray-400`}
                  data-state={activeMarketCap === "Mid Cap" ? "active" : "inactive"}
                >
                  Mid Cap
                </TabsTrigger>
                <TabsTrigger 
                  value="SmallCap" 
                  onClick={() => setActiveMarketCap("Small Cap")}
                  className={`pb-3 pt-2 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:text-blue-400 rounded-none text-gray-400`}
                  data-state={activeMarketCap === "Small Cap" ? "active" : "inactive"}
                >
                  Small Cap
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Sector Distribution Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-400">Sector Distribution</CardTitle>
                  <p className="text-white/70">Click sector to filter</p>

                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sortedSectors.map((sector) => (
                      <div 
                        key={sector.name}
                        className={`cursor-pointer p-2 rounded-md ${activeSector === sector.name ? 'bg-gray-700' : ''}`}
                        onClick={() => handleSectorClick(sector.name)}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2 text-white" 
                              style={{ backgroundColor: sector.color }}
                            ></div>
                            <span className ="text-sm text-white" >{sector.name}</span>
                          </div>
                          <span className="text-sm text-white">{sector.weight.toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={sector.weight} 
                          className="h-2 bg-gray-700" 
                          style={{ 
                            '--progress-background': sector.color 
                          } as React.CSSProperties} 
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-400">Sector Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sortedSectors.map((sector) => (
                      <div key={sector.name} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: sector.color }}
                          ></div>
                          <span className="text-white">{sector.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-white">{formatCurrency(sector.latestValue)}</span>
                          <span className={`text-sm ${sector.avgPerformance >= 0
                            ? 'text-green-400'
                            : 'text-red-400'
                          }`}>
                            {sector.avgPerformance >= 0 ? '+' : ''}
                            {sector.avgPerformance.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Market Cap Distribution */}
            <Card className="mb-6 bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-blue-400">Market Cap Distribution</CardTitle>
              </CardHeader>
              <CardContent>
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
                          <span className="text-white">{capType}</span>
                          <span className="text-white">{capWeight.toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={capWeight} 
                          className={`h-2 bg-gray-700 ${
                            capType === "Large Cap" ? "[&>div]:bg-blue-500" : 
                            capType === "Mid Cap" ? "[&>div]:bg-purple-500" : "[&>div]:bg-amber-500"
                          }`}
                        />
                        <div className="flex justify-between text-sm">
                          <span className="text-white">{formatCurrency(capValue)}</span>
                          <span className={avgPerformance >= 0 ? "text-green-400" : "text-red-400"}>
                            {avgPerformance >= 0 ? "+" : ""}{avgPerformance.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            {/* Risk Analysis */}
            <Card className="mb-6 bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-blue-400">Risk Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-700/50 p-4 rounded-md">
                    <div className="text-sm text-white mb-1">Portfolio Beta</div>
                    <div className="text-xl font-bold">{calculatePortfolioBeta().toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-700/50 p-4 rounded-md">
                    <div className="text-sm text-white mb-1">Market Correlation</div>
                    <div className="text-xl font-bold">{(calculatePortfolioBeta() * 0.8).toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-700/50 p-4 rounded-md">
                    <div className="text-sm text-white mb-1">Volatility Indicator</div>
                    <div className="text-xl font-bold">
                      {calculatePortfolioBeta() < 0.8 ? "Low" : calculatePortfolioBeta() < 1.2 ? "Moderate" : "High"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="portfolio">
            {/* Portfolio Table */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">Portfolio Holdings</CardTitle>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search stocks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-xs bg-gray-700 border-gray-600"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-2 text-blue-500">Stock</th>
                        <th className="text-left p-2 text-blue-500">Sector</th>
                        <th className="text-right p-2 text-blue-500">Price</th>
                        <th className="text-right p-2 text-blue-500">Change</th>
                        <th className="text-right p-2 text-blue-500">Shares</th>
                        <th className="text-right p-2 text-blue-500">Value</th>
                        <th className="text-right p-2 text-blue-500 ">Weight</th>
                        <th className="text-right p-2 text-blue-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStocks
                        .filter(stock => 
                          stock.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          stock.sector.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((stock) => {
                          const tickerData = priceData[stock.ticker.toUpperCase()];
                          const isFallbackData = tickerData?.isFallbackData || false;
                          
                          return (
                            <tr key={stock.ticker} className="border-b border-gray-700 hover:bg-gray-700/50">
                              <td className="p-2">
                                <div className="font-medium text-slate-300">{stock.ticker}</div>
                                <div className="text-sm text-gray-400">{stock.name}</div>
                                {isFallbackData && (
                                  <Badge variant="outline" className="text-xs bg-yellow-900/20 text-yellow-400 border-yellow-800">
                                    Fallback Data
                                  </Badge>
                                )}
                              </td>
                              <td className="p-2 text-slate-300">{stock.sector}</td>
                              <td className="text-right p-2 text-slate-300">${stock.price.toFixed(2)}</td>
                              <td className={`text-right p-2 ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
  {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
</td>

                              <td className="text-right p-2 text-slate-300">{stock.currentQuantity}</td>
                              <td className="text-right p-2 text-slate-300">${stock.latestValue.toFixed(2)}</td>
                              <td className="text-right p-2 text-slate-300">{stock.weight.toFixed(2)}%</td>
                              <td className="text-right p-2 text-slate-300">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="flex items-center">
                                    <Input
                                      type="number"
                                      value={quantityAdjustment[stock.ticker] || ''}
                                      onChange={(e) => handleQuantityAdjustmentChange(stock.ticker, e.target.value)}
                                      className="w-16 h-8 text-xs bg-gray-700 border-gray-600"
                                      placeholder="Qty"
                                    />
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleQuantityAdjust(stock.ticker, true)}
                                      className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-900/20"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleQuantityAdjust(stock.ticker, false)}
                                      className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleRemoveStock(stock.ticker)}
                                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="performance">
  {/* Performance metrics would go here */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <DailyGainLoss 
      // Replace this:
      // todayGain={todayGain} 
      // todayGainPercentage={todayGainPercentage}
      
      // With this:
      stockData={stocksWithCalculations}
      priceData={priceData}
      todayGain={todayGain}
      todayGainPercentage={todayGainPercentage}
    />
    <AssetsSummary 
      totalValue={totalPortfolioValue}
      investmentCost={portfolioInvestmentCost}
      overallGain={portfolioOverallGain}
      overallGainPercentage={portfolioOverallGainPercentage}
    />
  </div>
            
            {/* Transaction History */}
            <Card className="mt-6 bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Stock</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-right p-2">Quantity</th>
                        <th className="text-right p-2">Price</th>
                        <th className="text-right p-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactionHistory.map((transaction, index) => (
                        <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50">
                          <td className="p-2">{new Date(transaction.date).toLocaleDateString()}</td>
                          <td className="p-2">{transaction.ticker}</td>
                          <td className="p-2">
                            <Badge className={transaction.type === 'buy' ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}>
                              {transaction.type.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="text-right p-2">{transaction.quantity}</td>
                          <td className="text-right p-2">${transaction.price.toFixed(2)}</td>
                          <td className="text-right p-2">${transaction.totalValue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Portfolio;


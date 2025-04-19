import React, { useState, useEffect, useRef } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Info
} from "lucide-react";
import DailyGainLoss from "@/components/DailyGainLoss";
import AssetsSummary from "@/components/AssetsSummary";
import { stockNameDatabase } from "../lib/stockData";
import { io, Socket } from "socket.io-client";

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
}

// Extended interface with calculated fields and fetched data
interface StockDataWithCalculations extends StockData {
  name: string;
  price: number;
  change: number;
  changePercent: number;
  latestValue: number;
  investedValue: number;
  weight: number;
}

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

type MarketCapType = "All" | "Large Cap" | "Mid Cap" | "Small Cap";

// Initial sector colors
// Stock data - without name and price which will be fetched
const initialStockData: StockData[] = [
  { ticker: "AAPL", sector: "Technology", investedValue: 404550, quantity: 1000, currentQuantity: 850, marketCap: "Large Cap" },
  { ticker: "MSFT", sector: "Technology", investedValue: 292087.5, quantity: 150, currentQuantity: 150, marketCap: "Large Cap" },
  { ticker: "GOOGL", sector: "Technology", investedValue: 224495, quantity: 100, currentQuantity: 100, marketCap: "Large Cap" },
  { ticker: "AMZN", sector: "Consumer Discretionary", investedValue: 205971.2, quantity: 320, currentQuantity: 280, marketCap: "Large Cap" },
  { ticker: "META", sector: "Communication Services", investedValue: 162900, quantity: 300, currentQuantity: 300, marketCap: "Large Cap" },
  { ticker: "TSLA", sector: "Consumer Discretionary", investedValue: 221700, quantity: 1000, currentQuantity: 950, marketCap: "Large Cap" },
  { ticker: "NVDA", sector: "Technology", investedValue: 114950, quantity: 200, currentQuantity: 200, marketCap: "Large Cap" },
  { ticker: "XOM", sector: "Energy", investedValue: 130800, quantity: 100, currentQuantity: 125, marketCap: "Large Cap" },
  { ticker: "JPM", sector: "Financials", investedValue: 110682.5, quantity: 50, currentQuantity: 50, marketCap: "Large Cap" },
  { ticker: "BAC", sector: "Financials", investedValue: 170070, quantity: 100, currentQuantity: 100, marketCap: "Large Cap" },
  { ticker: "DIS", sector: "Communication Services", investedValue: 103935, quantity: 100, currentQuantity: 75, marketCap: "Large Cap" },
  { ticker: "PFE", sector: "Healthcare", investedValue: 162887.5, quantity: 50, currentQuantity: 60, marketCap: "Large Cap" },
  { ticker: "PYPL", sector: "Financials", investedValue: 145000, quantity: 200, currentQuantity: 175, marketCap: "Mid Cap" },
  { ticker: "INTC", sector: "Technology", investedValue: 138500, quantity: 350, currentQuantity: 350, marketCap: "Mid Cap" },
  { ticker: "AMD", sector: "Technology", investedValue: 175500, quantity: 250, currentQuantity: 225, marketCap: "Mid Cap" },
  { ticker: "UBER", sector: "Technology", investedValue: 128000, quantity: 200, currentQuantity: 200, marketCap: "Mid Cap" },
  { ticker: "ABNB", sector: "Consumer Discretionary", investedValue: 112500, quantity: 75, currentQuantity: 75, marketCap: "Mid Cap" },
  { ticker: "CRWD", sector: "Technology", investedValue: 115000, quantity: 50, currentQuantity: 65, marketCap: "Mid Cap" },
  { ticker: "PLTR", sector: "Technology", investedValue: 89500, quantity: 500, currentQuantity: 450, marketCap: "Small Cap" },
  { ticker: "SOFI", sector: "Financials", investedValue: 65000, quantity: 1000, currentQuantity: 1000, marketCap: "Small Cap" },
  { ticker: "HOOD", sector: "Financials", investedValue: 78000, quantity: 600, currentQuantity: 550, marketCap: "Small Cap" },
  { ticker: "RIVN", sector: "Consumer Discretionary", investedValue: 87500, quantity: 700, currentQuantity: 650, marketCap: "Small Cap" },
  { ticker: "DKNG", sector: "Consumer Discretionary", investedValue: 72000, quantity: 400, currentQuantity: 400, marketCap: "Small Cap" },
  { ticker: "NIO", sector: "Consumer Discretionary", investedValue: 56000, quantity: 800, currentQuantity: 750, marketCap: "Small Cap" },
];

// Updated sector colors
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

// Form state interface for adding new stock
interface AddStockForm {
  ticker: string;
  sector: string;
  investedValue: number;
  quantity: number;
  currentQuantity: number;
  marketCap: MarketCapType;
}

// Interface for quantity adjustments
interface QuantityAdjustment {
  stockId: string;
  amount: number;
}

const Portfolio = () => {
  // Assume userId is obtained from auth context or props
  // For demonstration, using a hardcoded ID. Replace with your actual user ID logic.
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
    marketCap: "Large Cap"
  });
  const [sectorData, setSectorData] = useState<SectorData[]>([]);
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const [quantityAdjustment, setQuantityAdjustment] = useState<Record<string, number>>({});

  // --- Socket.IO State ---
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketStatus, setSocketStatus] = useState("Disconnected");
  const [priceData, setPriceData] = useState<PriceState>({});
  const [subscribedTickers, setSubscribedTickers] = useState<Set<string>>(new Set());
  const tickersRef = useRef<string[]>([]); // Ref to hold all portfolio tickers

  // Function to format currency string for display only
  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Function to fetch stock name from database
  const fetchStockName = (ticker: string): string => {
    // Use the imported stockNameDatabase instead of an inline object
    return stockNameDatabase[ticker] || "Unknown Company";
  };

  // Function to fetch stock price from API or socket data
  const fetchStockPrice = async (ticker: string): Promise<number> => {
    // First check if we already have a price from the socket
    if (priceData[ticker.toUpperCase()]?.price) {
      return priceData[ticker.toUpperCase()].price!;
    }
    
    // In a real implementation, this would be an API call
    // For now, we'll simulate it with a random price based on the ticker code
    // This creates a deterministic but seemingly random price
    await new Promise(resolve => setTimeout(resolve, 10)); // Simulate network delay
    const tickerSum = ticker.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return parseFloat((300 + (tickerSum % 2500)).toFixed(2));
  };

  // --- Socket Connection Effect ---
  useEffect(() => {
    if (!userId) {
      console.log("User ID not available, skipping socket connection.");
      return;
    }

    console.log(`Attempting to connect socket for userId: ${userId}`);
    // Connect to the socket server (update URL if needed)
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
      setSubscribedTickers(new Set()); // Clear subscriptions on disconnect
      console.log('Socket disconnected');
    });

    newSocket.on('error', (error) => {
      console.error('Socket Error:', error);
      setSocketStatus(`Error: ${error.message || JSON.stringify(error)}`);
    });

    // --- Price Update Handler ---
    newSocket.on('price', (data: { ticker: string; price: number; prevClose?: number }) => {
      const ticker = data.ticker?.toUpperCase(); // Normalize ticker
      if (!ticker) {
        console.warn("Received price data without ticker:", data);
        return;
      }

      // Store price data
      setPriceData(prevData => {
        const currentStockData = prevData[ticker] || {};
        // Use received prevClose or existing one, else estimate
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

      // Update stocksWithCalculations when price data is received
      setStocksWithCalculations(prevStocks => {
        const updatedStocks = [...prevStocks];
        const stockIndex = updatedStocks.findIndex(s => s.ticker.toUpperCase() === ticker);
        
        if (stockIndex !== -1) {
          const stock = updatedStocks[stockIndex];
          const newPrice = data.price;
          
          // Calculate new values based on new price
          const latestValue = newPrice * stock.currentQuantity;
          const change = latestValue - stock.investedValue;
          const changePercent = (change / stock.investedValue) * 100;
          
          updatedStocks[stockIndex] = {
            ...stock,
            price: newPrice,
            latestValue,
            change,
            changePercent
          };
          
          console.log(`Updated price for ${ticker}: $${newPrice.toFixed(2)}`);
        }
        
        return updatedStocks;
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
    if (!socket || !isConnected || !stockData.length) {
      return; // Only manage subscriptions if connected and stocks exist
    }

    // Get all ticker symbols from the portfolio
    const allTickers = stockData.map(stock => stock.ticker.toUpperCase());
    
    // Store in ref for comparison on next update
    const oldTickers = tickersRef.current;
    
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
    }

    // Update the ref for the next comparison
    tickersRef.current = allTickers;

  }, [stockData, isConnected, socket]);

  // List of available sectors for dropdown
  const availableSectors = Array.from(new Set(stockData.map(stock => stock.sector)));

  // Function to calculate stocks with all necessary fields
  const calculateStockFields = async (stocks: StockData[]): Promise<StockDataWithCalculations[]> => {
    // For each stock, fetch name and price, then calculate values
    const enhancedStocks = await Promise.all(stocks.map(async (stock) => {
      const name = fetchStockName(stock.ticker);
      const price = await fetchStockPrice(stock.ticker);
      
      // Use currentQuantity for latest value calculation instead of original quantity
      const latestValue = price * stock.currentQuantity;
      
      // Calculate the adjusted invested value based on current quantity ratio
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
        weight: 0 // Will be calculated in the next step
      };
    }));

    // Calculate total portfolio value based on current quantities
    const totalPortfolioValue = enhancedStocks.reduce(
      (sum, stock) => sum + stock.latestValue, 
      0
    );

    // Now calculate weights based on latest values
    return enhancedStocks.map(stock => ({
      ...stock,
      weight: (stock.latestValue / totalPortfolioValue) * 100
    }));
  };

  // Function to generate sector data from stock data
  const generateSectorData = (stocks: StockDataWithCalculations[]): SectorData[] => {
    // Group stocks by sector
    const sectorGroups = stocks.reduce((acc, stock) => {
      if (!acc[stock.sector]) {
        acc[stock.sector] = [];
      }
      acc[stock.sector].push(stock);
      return acc;
    }, {} as Record<string, StockDataWithCalculations[]>);

    // Calculate total portfolio value
    const totalValue = stocks.reduce((sum, stock) => sum + stock.latestValue, 0);

    // Generate sector data
    return Object.entries(sectorGroups).map(([sectorName, sectorStocks]) => {
      // Calculate sector values
      const latestValue = sectorStocks.reduce((sum, stock) => sum + stock.latestValue, 0);
      const investedValue = sectorStocks.reduce((sum, stock) => sum + stock.investedValue, 0);
      
      // Calculate sector weight
      const weight = (latestValue / totalValue) * 100;
      
      // Calculate average performance for sector
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

  // Handle form input changes
  const handleFormChange = (field: keyof AddStockForm, value: string | number) => {
    setAddStockForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission to add new stock
  const handleAddStock = () => {
    if (!addStockForm.ticker || !addStockForm.sector || 
        addStockForm.investedValue <= 0 || addStockForm.quantity <= 0) {
      alert("Please fill all fields with valid values");
      return;
    }
    
    // If currentQuantity is not set, default to same as original quantity
    const currentQuantity = addStockForm.currentQuantity > 0 
      ? addStockForm.currentQuantity 
      : addStockForm.quantity;
    
    // Create new stock object
    const newStock: StockData = {
      ticker: addStockForm.ticker.toUpperCase(),
      sector: addStockForm.sector,
      investedValue: addStockForm.investedValue,
      quantity: addStockForm.quantity,
      currentQuantity: currentQuantity,
      marketCap: addStockForm.marketCap
    };
    
    // Add new stock
    const updatedStocks = [...stockData, newStock];
    setStockData(updatedStocks);
    setShowAddForm(false);
    
    // Reset form
    setAddStockForm({
      ticker: "",
      sector: "",
      investedValue: 0,
      quantity: 0,
      currentQuantity: 0,
      marketCap: "Large Cap"
    });
  };

  // Handle removing a stock from portfolio
  const handleRemoveStock = (ticker: string) => {
    if (window.confirm(`Are you sure you want to remove ${ticker} from your portfolio?`)) {
      const updatedStocks = stockData.filter(stock => stock.ticker !== ticker);
      setStockData(updatedStocks);
    }
  };

  // Handle quantity adjustment input
  const handleQuantityAdjustmentChange = (ticker: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setQuantityAdjustment(prev => ({
      ...prev,
      [ticker]: numValue
    }));
  };

  // Apply quantity adjustment (add or remove shares)
  const handleQuantityAdjust = (ticker: string, isAdd: boolean) => {
    const amount = quantityAdjustment[ticker] || 0;
    if (amount <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    setStockData(prevStocks => {
      return prevStocks.map(stock => {
        if (stock.ticker === ticker) {
          const newQuantity = isAdd 
            ? stock.currentQuantity + amount 
            : stock.currentQuantity - amount;
          
          // Prevent negative quantities
          if (newQuantity < 0) {
            alert("Cannot reduce quantity below zero");
            return stock;
          }
          
          return {
            ...stock,
            currentQuantity: newQuantity
          };
        }
        return stock;
      });
    });

    // Reset the adjustment input for this stock
    setQuantityAdjustment(prev => ({
      ...prev,
      [ticker]: 0
    }));
  };

  // Get filtered stock data based on active market cap
  const getFilteredStocks = () => {
    return activeMarketCap === "All" 
      ? stocksWithCalculations 
      : stocksWithCalculations.filter(stock => stock.marketCap === activeMarketCap);
  };

  // Update calculations whenever stock data changes
  useEffect(() => {
    const updateStocks = async () => {
      const calculatedStocks = await calculateStockFields(stockData);
      setStocksWithCalculations(calculatedStocks);
    };
    
    updateStocks();
  }, [stockData]);

  // Update sectors when calculated stocks or market cap filter changes
  useEffect(() => {
    const filteredStocks = getFilteredStocks();
    const currentSectorData = generateSectorData(filteredStocks);
    setSectorData(currentSectorData);
  }, [stocksWithCalculations, activeMarketCap]);

  const filteredStocks = getFilteredStocks();

  // Calculate portfolio value for display in the header
  const totalPortfolioValue = filteredStocks.reduce(
    (sum, stock) => sum + stock.latestValue, 
    0
  );
  
  // Calculate values for MyAssets component
  const portfolioLatestValue = totalPortfolioValue;
  const portfolioInvestmentCost = filteredStocks.reduce(
    (sum, stock) => sum + stock.investedValue, 
    0
  );
  const portfolioOverallGain = portfolioLatestValue - portfolioInvestmentCost;
  const portfolioOverallGainPercentage = (portfolioOverallGain / portfolioInvestmentCost) * 100;
  const portfolioTodayGain = portfolioLatestValue * 0.015 * (Math.random() > 0.5 ? 1 : -1); // ±1.5% of latest value
  const portfolioTodayGainPercentage = (portfolioTodayGain / portfolioLatestValue) * 100;
  const portfolioRealizedGain = portfolioLatestValue * 0.12; // 12% of latest value
  const portfolioCapitalGain = portfolioLatestValue * 0.08; // 8% of latest value
  const portfolioOtherGain = portfolioLatestValue * 0.04; // 4% of latest value

  // Prepare data for MyAssets component
  const assetsData = {
    latestValue: portfolioLatestValue,
    investmentCost: portfolioInvestmentCost,
    overallGain: portfolioOverallGain,
    overallGainPercentage: portfolioOverallGainPercentage,
    todayGain: portfolioTodayGain,
    todayGainPercentage: portfolioTodayGainPercentage,
    realizedGain: portfolioRealizedGain,
    capitalGain: portfolioCapitalGain,
    otherGain: portfolioOtherGain
  };

  // Simulated loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Sort sectors by weight
  const sortedSectors = [...sectorData].sort((a, b) => b.weight - a.weight);

  // Show sector detail when clicked
  const handleSectorClick = (sectorName: string) => {
    if (activeSector === sectorName) {
      setActiveSector(null); // Toggle off if already selected
    } else {
      setActiveSector(sectorName); // Set new active sector
    }
  };

  // Get the active sector data if available
  const activeSectorData = activeSector 
    ? sectorData.find(sector => sector.name === activeSector) 
    : null;

  // Connection Status Component
  const ConnectionStatus = () => (
    <div className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-800 text-gray-300">
      {isConnected ? (
        <Wifi className="h-3 w-3 text-green-400" />
      ) : (
        <WifiOff className="h-3 w-3 text-red-400" />
      )}
      <span>{isConnected ? "Connected" : "Disconnected"}</span>
    </div>
  );

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
              <ConnectionStatus />
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
            <AssetsSummary data={{
      latestValue: portfolioLatestValue,
      investmentCost: portfolioInvestmentCost,
      overallGain: portfolioOverallGain,
      overallGainPercentage: portfolioOverallGainPercentage,
      todayGain: portfolioTodayGain,
      todayGainPercentage: portfolioTodayGainPercentage,
      realizedGain: portfolioRealizedGain,
      capitalGain: portfolioCapitalGain,
      otherGain: portfolioOtherGain
    }} />
    
    {/* Daily Gain/Loss with proper props */}
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
                    <CardTitle className="text-xl font-bold text-gray-100">Market Overview</CardTitle>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-blue-900/20 text-blue-400 border-blue-800 hover:bg-blue-900 hover:text-blue-300"
                  >
                    {showAddForm ? (
                      <><X className="h-4 w-4 mr-1" /> Cancel</>
                    ) : (
                      <><PlusCircle className="h-4 w-4 mr-1" /> Add Stock</>
                    )}
                  </Button>
                </div>
              </CardHeader>

              {showAddForm && (
                <div className="p-4 bg-gray-950 border-b border-gray-800">
                  <h3 className="text-lg font-medium text-blue-400 mb-4">Add New Stock to Portfolio</h3>
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
                          {availableSectors.map((sector) => (
                            <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                          ))}
                          <SelectItem value="Technology">Technology</SelectItem>
                          <SelectItem value="Financials">Financials</SelectItem>
                          <SelectItem value="Healthcare">Healthcare</SelectItem>
                          <SelectItem value="Energy">Energy</SelectItem>
                          <SelectItem value="Consumer Discretionary">Consumer Discretionary</SelectItem>
                          <SelectItem value="Communication Services">Communication Services</SelectItem>
                          <SelectItem value="Industrials">Industrials</SelectItem>
                          <SelectItem value="Materials">Materials</SelectItem>
                          <SelectItem value="Utilities">Utilities</SelectItem>
                          <SelectItem value="Consumer Staples">Consumer Staples</SelectItem>
                          <SelectItem value="Real Estate">Real Estate</SelectItem>
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
                        value={addStockForm.investedValue || ''}
                        onChange={(e) => handleFormChange('investedValue', parseFloat(e.target.value))}
                        placeholder="10000"
                        className="bg-gray-800 border-gray-700 text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Quantity *</label>
                      <Input 
                        type="number"
                        value={addStockForm.quantity || ''}
                        onChange={(e) => handleFormChange('quantity', parseInt(e.target.value))}
                        placeholder="100"
                        className="bg-gray-800 border-gray-700 text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Current Quantity</label>
                      <Input 
                        type="number"
                        value={addStockForm.currentQuantity || ''}
                        onChange={(e) => handleFormChange('currentQuantity', parseInt(e.target.value))}
                        placeholder="Same as quantity"
                        className="bg-gray-800 border-gray-700 text-gray-100"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
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
                  <div className="px-4 py-2 bg-gray-950 border-b border-gray-800">
                    <TabsList className="bg-gray-800 p-1">
                      <TabsTrigger 
                        value="All" 
                        onClick={() => setActiveMarketCap("All")}
                        className={`${activeMarketCap === "All" ? "bg-blue-900/30 text-blue-400" : "text-gray-400"}`}
                      >
                        All
                      </TabsTrigger>
                      <TabsTrigger 
                        value="Large Cap" 
                        onClick={() => setActiveMarketCap("Large Cap")}
                        className={`${activeMarketCap === "Large Cap" ? "bg-blue-900/30 text-blue-400" : "text-gray-400"}`}
                      >
                        Large Cap
                      </TabsTrigger>
                      <TabsTrigger 
                        value="Mid Cap" 
                        onClick={() => setActiveMarketCap("Mid Cap")}
                        className={`${activeMarketCap === "Mid Cap" ? "bg-blue-900/30 text-blue-400" : "text-gray-400"}`}
                      >
                        Mid Cap
                      </TabsTrigger>
                      <TabsTrigger 
                        value="Small Cap" 
                        onClick={() => setActiveMarketCap("Small Cap")}
                        className={`${activeMarketCap === "Small Cap" ? "bg-blue-900/30 text-blue-400" : "text-gray-400"}`}
                      >
                        Small Cap
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="All" className="mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
                      {/* Sector overview chart */}
                      <Card className="bg-gray-900 rounded-lg border border-gray-800">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <PieChart className="h-4 w-4 text-blue-400" />
                              <CardTitle className="text-sm font-medium text-gray-300">
                                Sector Allocation
                              </CardTitle>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {/* Here you would typically render a pie chart using recharts */}
                          <div className="h-64 flex flex-col justify-center items-center">
                            {/* Placeholder for pie chart */}
                            <div className="text-center text-gray-500">
                              <Info className="h-8 w-8 mx-auto mb-2" />
                              <p>Pie chart visualization would be rendered here</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Performance chart */}
                      <Card className="bg-gray-900 rounded-lg border border-gray-800">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <BarChart3 className="h-4 w-4 text-blue-400" />
                              <CardTitle className="text-sm font-medium text-gray-300">
                                Sector Performance
                              </CardTitle>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {/* Here you would typically render a bar chart using recharts */}
                          <div className="h-64 flex flex-col justify-center items-center">
                            {/* Placeholder for bar chart */}
                            <div className="text-center text-gray-500">
                              <Info className="h-8 w-8 mx-auto mb-2" />
                              <p>Bar chart visualization would be rendered here</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Sector breakdown */}
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-blue-400 mb-4">Sector Breakdown</h3>
                      <div className="grid gap-4">
                        {sortedSectors.map((sector) => (
                          <div 
                            key={sector.name}
                            className={`p-4 rounded-lg border ${activeSector === sector.name ? 'bg-gray-800 border-blue-700' : 'bg-gray-900 border-gray-800'} cursor-pointer transition-all`}
                            onClick={() => handleSectorClick(sector.name)}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded-full mr-3" 
                                  style={{ backgroundColor: sector.color }}
                                ></div>
                                <h4 className="font-medium text-gray-200">{sector.name}</h4>
                              </div>
                              <div className="flex items-center">
                                <span className="text-sm text-gray-400 mr-2">{sector.weight.toFixed(1)}%</span>
                                <span className={`flex items-center ${sector.avgPerformance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {sector.avgPerformance >= 0 ? (
                                    <ArrowUp className="h-3 w-3 mr-1" />
                                  ) : (
                                    <ArrowDown className="h-3 w-3 mr-1" />
                                  )}
                                  {Math.abs(sector.avgPerformance).toFixed(2)}%
                                </span>
                              </div>
                            </div>
                            <Progress 
  value={sector.weight} 
  className="h-1 bg-gray-800" 
  style={{ color: sector.color }}
/>
                            
                            {activeSector === sector.name && (
                              <div className="mt-4 pt-4 border-t border-gray-800">
                                <div className="flex justify-between text-sm text-gray-400 mb-2">
                                  <span>Value: {formatCurrency(sector.latestValue)}</span>
                                  <span>Invested: {formatCurrency(sector.investedValue)}</span>
                                </div>
                                <div className="mt-4">
                                  <h5 className="text-xs uppercase text-gray-500 mb-2">Stocks in this sector</h5>
                                  <div className="space-y-2">
                                    {sector.stocks.map((stock) => (
                                      <div key={stock.ticker} className="flex items-center justify-between p-2 bg-gray-900 rounded-md">
                                        <div className="flex items-center">
                                          <div className="mr-3">
                                            <Badge variant="outline" className="bg-gray-800 border-none font-mono text-xs">
                                              {stock.ticker}
                                            </Badge>
                                          </div>
                                          <div>
                                            <p className="text-sm text-gray-300">{stock.name}</p>
                                            <p className="text-xs text-gray-500">{formatCurrency(stock.price)} per share</p>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-sm text-gray-300">{formatCurrency(stock.latestValue)}</p>
                                          <p className={`text-xs flex items-center justify-end ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {stock.changePercent >= 0 ? (
                                              <ArrowUp className="h-3 w-3 mr-1" />
                                            ) : (
                                              <ArrowDown className="h-3 w-3 mr-1" />
                                            )}
                                            {Math.abs(stock.changePercent).toFixed(2)}%
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Stock listings by market cap */}
                  <TabsContent value="Large Cap" className="p-0 mt-0">
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-blue-400 mb-4">
                        {activeMarketCap} Stocks
                      </h3>
                      <div className="space-y-4">
                        {filteredStocks.map((stock) => (
                          <div key={stock.ticker} className="p-4 bg-gray-900 rounded-lg border border-gray-800">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                              <div className="flex items-center flex-wrap gap-2">
                                <Badge className="font-mono bg-blue-900/30 text-blue-400 border-none">
                                  {stock.ticker}
                                </Badge>
                                <h4 className="text-gray-100 font-medium">{stock.name}</h4>
                                <Badge variant="outline" className="bg-gray-800 border-none text-gray-400">
                                  {stock.sector}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-gray-300 font-medium">{formatCurrency(stock.price)}</p>
                                  <p className={`flex items-center text-sm ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {stock.changePercent >= 0 ? (
                                      <ArrowUp className="h-3 w-3 mr-1" />
                                    ) : (
                                      <ArrowDown className="h-3 w-3 mr-1" />
                                    )}
                                    {Math.abs(stock.changePercent).toFixed(2)}%
                                  </p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleRemoveStock(stock.ticker)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                              <div className="bg-gray-800 p-3 rounded-md">
                                <p className="text-xs text-gray-500 mb-1">Market Value</p>
                                <p className="text-gray-200">{formatCurrency(stock.latestValue)}</p>
                              </div>
                              <div className="bg-gray-800 p-3 rounded-md">
                                <p className="text-xs text-gray-500 mb-1">Initial Investment</p>
                                <p className="text-gray-200">{formatCurrency(stock.investedValue)}</p>
                              </div>
                              <div className="bg-gray-800 p-3 rounded-md">
                                <p className="text-xs text-gray-500 mb-1">Gain/Loss</p>
                                <p className={`${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {formatCurrency(stock.change)}
                                </p>
                              </div>
                              <div className="bg-gray-800 p-3 rounded-md">
                                <p className="text-xs text-gray-500 mb-1">Current Shares</p>
                                <p className="text-gray-200">{stock.currentQuantity.toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-800">
                              <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center space-x-2">
                                  <Input 
                                    type="number"
                                    value={quantityAdjustment[stock.ticker] || ''}
                                    onChange={(e) => handleQuantityAdjustmentChange(stock.ticker, e.target.value)}
                                    placeholder="Shares"
                                    className="w-24 bg-gray-800 border-gray-700 text-gray-100"
                                  />
                                  <Button 
                                    size="sm"
                                    onClick={() => handleQuantityAdjust(stock.ticker, true)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <Plus className="h-4 w-4 mr-1" /> Buy
                                  </Button>
                                  <Button 
                                    size="sm"
                                    onClick={() => handleQuantityAdjust(stock.ticker, false)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    <Minus className="h-4 w-4 mr-1" /> Sell
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="Mid Cap" className="p-0 mt-0">
  <div className="p-4">
    <h3 className="text-lg font-medium text-blue-400 mb-4">
      {activeMarketCap} Stocks
    </h3>
    <div className="space-y-4">
      {filteredStocks.map((stock) => (
        <div key={stock.ticker} className="p-4 bg-gray-900 rounded-lg border border-gray-800">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center flex-wrap gap-2">
              <Badge className="font-mono bg-blue-900/30 text-blue-400 border-none">
                {stock.ticker}
              </Badge>
              <h4 className="text-gray-100 font-medium">{stock.name}</h4>
              <Badge variant="outline" className="bg-gray-800 border-none text-gray-400">
                {stock.sector}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-gray-300 font-medium">{formatCurrency(stock.price)}</p>
                <p className={`flex items-center text-sm ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stock.changePercent >= 0 ? (
                    <ArrowUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(stock.changePercent).toFixed(2)}%
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleRemoveStock(stock.ticker)}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="bg-gray-800 p-3 rounded-md">
              <p className="text-xs text-gray-500 mb-1">Market Value</p>
              <p className="text-gray-200">{formatCurrency(stock.latestValue)}</p>
            </div>
            <div className="bg-gray-800 p-3 rounded-md">
              <p className="text-xs text-gray-500 mb-1">Initial Investment</p>
              <p className="text-gray-200">{formatCurrency(stock.investedValue)}</p>
            </div>
            <div className="bg-gray-800 p-3 rounded-md">
              <p className="text-xs text-gray-500 mb-1">Gain/Loss</p>
              <p className={`${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(stock.change)}
              </p>
            </div>
            <div className="bg-gray-800 p-3 rounded-md">
              <p className="text-xs text-gray-500 mb-1">Current Shares</p>
              <p className="text-gray-200">{stock.currentQuantity.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Input 
                  type="number"
                  value={quantityAdjustment[stock.ticker] || ''}
                  onChange={(e) => handleQuantityAdjustmentChange(stock.ticker, e.target.value)}
                  placeholder="Shares"
                  className="w-24 bg-gray-800 border-gray-700 text-gray-100"
                />
                <Button 
                  size="sm"
                  onClick={() => handleQuantityAdjust(stock.ticker, true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-1" /> Buy
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleQuantityAdjust(stock.ticker, false)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Minus className="h-4 w-4 mr-1" /> Sell
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</TabsContent>

<TabsContent value="Small Cap" className="p-0 mt-0">
  <div className="p-4">
    <h3 className="text-lg font-medium text-blue-400 mb-4">
      {activeMarketCap} Stocks
    </h3>
    <div className="space-y-4">
      {filteredStocks.map((stock) => (
        <div key={stock.ticker} className="p-4 bg-gray-900 rounded-lg border border-gray-800">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center flex-wrap gap-2">
              <Badge className="font-mono bg-blue-900/30 text-blue-400 border-none">
                {stock.ticker}
              </Badge>
              <h4 className="text-gray-100 font-medium">{stock.name}</h4>
              <Badge variant="outline" className="bg-gray-800 border-none text-gray-400">
                {stock.sector}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-gray-300 font-medium">{formatCurrency(stock.price)}</p>
                <p className={`flex items-center text-sm ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stock.changePercent >= 0 ? (
                    <ArrowUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(stock.changePercent).toFixed(2)}%
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleRemoveStock(stock.ticker)}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="bg-gray-800 p-3 rounded-md">
              <p className="text-xs text-gray-500 mb-1">Market Value</p>
              <p className="text-gray-200">{formatCurrency(stock.latestValue)}</p>
            </div>
            <div className="bg-gray-800 p-3 rounded-md">
              <p className="text-xs text-gray-500 mb-1">Initial Investment</p>
              <p className="text-gray-200">{formatCurrency(stock.investedValue)}</p>
            </div>
            <div className="bg-gray-800 p-3 rounded-md">
              <p className="text-xs text-gray-500 mb-1">Gain/Loss</p>
              <p className={`${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(stock.change)}
              </p>
            </div>
            <div className="bg-gray-800 p-3 rounded-md">
              <p className="text-xs text-gray-500 mb-1">Current Shares</p>
              <p className="text-gray-200">{stock.currentQuantity.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Input 
                  type="number"
                  value={quantityAdjustment[stock.ticker] || ''}
                  onChange={(e) => handleQuantityAdjustmentChange(stock.ticker, e.target.value)}
                  placeholder="Shares"
                  className="w-24 bg-gray-800 border-gray-700 text-gray-100"
                />
                <Button 
                  size="sm"
                  onClick={() => handleQuantityAdjust(stock.ticker, true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-1" /> Buy
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleQuantityAdjust(stock.ticker, false)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Minus className="h-4 w-4 mr-1" /> Sell
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="p-4 border-t border-gray-800 bg-gray-950">
                <p className="text-xs text-gray-500">
                  Last updated: {new Date().toLocaleString()}
                </p>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;
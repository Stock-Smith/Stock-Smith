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
import PortfolioTable, { Stock } from "@/components/PortfolioTable";
import { io, Socket } from "socket.io-client";
import Papa from "papaparse";
import { Check, Edit } from "lucide-react";
import AnimatedBackground from "@/components/Background1";
import ParticlesBackground from "@/components/Background";
// --- Types ---
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
  _id?: string;
  portfolioId: string; // ADD THIS FIELD
  ticker: string;
  sector: string;
  investedValue: number;
  quantity: number;
  currentQuantity: number;
  marketCap: MarketCapType;
  beta: number;
  purchaseDate?: string;
}

interface StockDataWithCalculations extends StockData {
  portfolioId: string; // This will be inherited from StockData
  name: string;
  price: number;
  change: number;
  changePercent: number;
  latestValue: number;
  investedValue: number;
  weight: number;
  beta: number;
}

interface Portfolio {
  _id: string; // This is the portfolioId used in delete operations
  userId: string;
  holdings: StockData[]; // Array of stock holdings
  createdAt?: string;
  updatedAt?: string;
}

interface PriceData {
  price: number;
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
  investedValue: number;
  quantity: number;
  currentQuantity: number;
  purchaseDate?: string;
}

interface QuantityAdjustment {
  [portfolioId: string]: { [ticker: string]: number };
}

interface handleRemoveStock{
  portfolioId: string;
  holdingId: string;
}

interface Transaction {
  ticker: string;
  type: string;
  quantity: number;
  price: number;
  totalValue: number;
  date: string;
}

// --- Constants ---
const CSV_URL = "/merged_symbols.csv";
const API_BASE = "http://localhost/api/v1/user";
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

// --- Fallback Data Fetch ---
async function fetchStockDataFallback(ticker: string): Promise<PriceData> {
  const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
  if (!API_KEY) {
    console.error("API key missing for fallback data fetch");
    return {
      price: 0,
      change: 0,
      changePercent: 0,
      beta: 0,
      isFallbackData: true,
    };
  }

  try {
    const [quoteRes, profileRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${API_KEY}`),
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${API_KEY}`)
    ]);

    if (!quoteRes.ok || !profileRes.ok) throw new Error("API response not OK");

    const quoteData = await quoteRes.json();
    const profileData = await profileRes.json();

    return {
      price: quoteData.c ?? 0,
      change: quoteData.d ?? 0,
      changePercent: quoteData.dp ?? 0,
      prevClose: quoteData.pc ?? 0,
      beta: profileData.beta ?? 0,
      updatedAt: new Date(),
      isFallbackData: true,
    };
  } catch (error) {
    console.error(`Error fetching fallback data for ${ticker}:`, error);
    return {
      price: 0,
      change: 0,
      changePercent: 0,
      beta: 0,
      isFallbackData: true,
    };
  }
}




const Portfolio = () => {
  // --- State ---
  const [activeMarketCap, setActiveMarketCap] = useState<MarketCapType>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [stocksWithCalculations, setStocksWithCalculations] = useState<StockDataWithCalculations[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addStockForm, setAddStockForm] = useState<AddStockForm>({
    ticker: "",
    investedValue: 0,
    quantity: 0,
    currentQuantity: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
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

  // --- Refs ---
  const currentTickersRef = useRef<string[]>([]);

  // --- Sector Click ---
  const handleSectorClick = (sectorName: string) => {
    setActiveSector(activeSector === sectorName ? null : sectorName);
  };

  // --- Fetch Holdings ---
  const fetchHoldings = async () => {
  setIsLoading(true);
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("No authentication token found.");
    
    const response = await fetch(`${API_BASE}/holdings`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Unauthorized: Please log in again.');
      throw new Error('Failed to fetch holdings');
    }

    const data = await response.json();
    
    // FIXED: Preserve portfolio ID when flattening
    const holdings = (data || []).flatMap((portfolio: any) =>
      (portfolio.holdings || []).map((stock: any) => ({
        _id: stock._id,
        portfolioId: portfolio._id, // ADD THIS: Preserve the portfolio ID
        ticker: stock.ticker,
        sector: stock.sector || "Unknown",
        investedValue: (stock.investedPrice ?? 0) * (stock.investedQuantity ?? 0),
        quantity: stock.investedQuantity ?? 0,
        currentQuantity: stock.currentQuantity ?? 0,
        marketCap: stock.marketCap || "Large Cap",
        beta: stock.beta ?? 1.0,
        purchaseDate: stock.purchaseDate ? new Date(stock.purchaseDate).toISOString().slice(0, 10) : "",
      }))
    );

    setStockData(holdings);
  } catch (error: any) {
    console.error("Error fetching holdings:", error);
  } finally {
    setIsLoading(false);
  }
};

  // --- Load CSV Data ---
  useEffect(() => {
    Papa.parse<CsvStock>(CSV_URL, {
      download: true,
      header: true,
      complete: (results) => {
        setCsvData(results.data);
        setIsLoadingCSV(false);
      },
      error: (error) => {
        setErrorCSV(error.message);
        setIsLoadingCSV(false);
      },
    });
  }, []);
// Outside the component OR at top-level of file
const betaCache = new Map<string, number>();

async function fetchBeta(ticker: string): Promise<number> {
  const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
  if (!API_KEY) {
    console.warn("Missing Finnhub API key. Cannot fetch beta.");
    return 0;
  }

  try {
    const res = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${API_KEY}`);
    if (!res.ok) {
      console.warn(`API error while fetching beta for ${ticker}: ${res.status}`);
      return 0;
    }

    const data = await res.json();

    const beta = data?.beta ?? 0;
    betaCache.set(ticker, beta);  // cache for later
    return beta;
  } catch (err) {
    console.error(`Failed to fetch beta for ${ticker}:`, err);
    return 0;
  }
}


  // --- Socket Setup ---
  useEffect(() => {
    const userId = localStorage.getItem('userId') || "user123";
    if (!userId) return;
    const newSocket = io('http://localhost:8006', {
      transports: ['websocket', 'polling']
    });
    setSocket(newSocket);
    setSocketStatus('Connecting...');
    newSocket.on('connect', () => {
      setIsConnected(true);
      setSocketStatus(`Connected (ID: ${newSocket.id})`);
      newSocket.emit('authenticate', userId);
    });
    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setSocketStatus('Disconnected');
      setSubscribedTickers(new Set());
      stockData.forEach(stock => checkAndFetchFallbackData(stock.ticker));
    });
    newSocket.on('error', (error) => {
      setSocketStatus(`Error: ${error.message || JSON.stringify(error)}`);
    });
    newSocket.on('price', async (data: { ticker: string; price: number; beta?: number; prevClose?: number }) => {
  const ticker = data.ticker?.toUpperCase();
  if (!ticker) return;

  let beta = data.beta ?? betaCache.get(ticker);

  // If beta not cached, fetch it
  if (beta === undefined) {
    beta = await fetchBeta(ticker); // This will update the cache
  }

  setPriceData(prevData => {
    const currentStockData = prevData[ticker] || {};
    const prevClose = data.prevClose ?? currentStockData.prevClose ?? (data.price * 0.99);
    const change = data.price - prevClose;
    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

    return {
      ...prevData,
      [ticker]: {
        price: data.price ?? 0,
        prevClose,
        change,
        changePercent,
        beta: beta ?? 0,
        updatedAt: new Date(),
        isFallbackData: false,
      }
    };
  });
});

    newSocket.on('subscribed', (tickers: string[]) => {
      setSubscribedTickers(prev => new Set([...prev, ...tickers.map(t => t.toUpperCase())]));
    });
    newSocket.on('unsubscribed', (tickers: string[]) => {
      setSubscribedTickers(prev => {
        const newSet = new Set(prev);
        tickers.forEach(t => newSet.delete(t.toUpperCase()));
        return newSet;
      });
    });
    newSocket.on('subscriptions_restored', (tickers: string[]) => {
      setSubscribedTickers(new Set(tickers.map(t => t.toUpperCase())));
    });
    return () => {
      newSocket.disconnect();
      setIsConnected(false);
      setSocketStatus('Disconnected');
      setSubscribedTickers(new Set());
    };
  }, []);

  // --- Fetch Holdings on Mount ---
  useEffect(() => {
    fetchHoldings();
  }, []);

  // --- Subscription Management ---
  useEffect(() => {
    if (!socket || !isConnected || !stockData.length) return;
    const allTickers = stockData.map(stock => stock.ticker.toUpperCase());
    const prevTickers = currentTickersRef.current;
    // Unsubscribe from tickers no longer in portfolio
    const toUnsubscribe = prevTickers.filter(ticker => !allTickers.includes(ticker));
    if (toUnsubscribe.length > 0) {
      socket.emit('unsubscribe', toUnsubscribe);
    }
    // Subscribe to new tickers
    const toSubscribe = allTickers.filter(ticker => !prevTickers.includes(ticker));
    if (toSubscribe.length > 0) {
      socket.emit('subscribe', toSubscribe);
      toSubscribe.forEach(ticker => {
        fetchStockDataFallback(ticker).then(data => {
          setPriceData(prev => ({ ...prev, [ticker]: data }));
        });
      });
    }
    currentTickersRef.current = allTickers;
  }, [stockData, isConnected, socket]);

  // --- Check and Fetch Fallback Data ---
  const checkAndFetchFallbackData = (ticker: string) => {
    const upperTicker = ticker.toUpperCase();
    const currentData = priceData[upperTicker];
    const needsFallbackData = !currentData || !currentData.updatedAt ||
      (new Date().getTime() - new Date(currentData.updatedAt).getTime() > 5 * 60 * 1000);
    if (needsFallbackData) {
      fetchStockDataFallback(upperTicker).then(data => {
        setPriceData(prev => ({ ...prev, [upperTicker]: data }));
      });
    }
  };

  // --- Periodically Check for Missing Data ---
  useEffect(() => {
    if (!stockData.length) return;
    const checkMissingData = () => {
      stockData.forEach(stock => checkAndFetchFallbackData(stock.ticker));
    };
    checkMissingData();
    const intervalId = setInterval(checkMissingData, 60000);
    return () => clearInterval(intervalId);
  }, [stockData, priceData]);

  // --- Helper Functions ---
  const fetchStockName = (ticker: string): string => {
    if (isLoadingCSV) return "Loading...";
    if (errorCSV) return "Unknown Company";
    const stockInfo = csvData.find(stock => stock.Symbol === ticker);
    return stockInfo?.["Security Name"] || "Unknown Company";
  };

  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // --- Calculate Enhanced Stock Data ---
  const calculateStockFields = async (stocks: StockData[]): Promise<StockDataWithCalculations[]> => {
    const enhancedStocks = await Promise.all(stocks.map(async (stock) => {
      const name = fetchStockName(stock.ticker);
      const tickerUpperCase = stock.ticker.toUpperCase();
      const tickerData = priceData[tickerUpperCase];
      const price = tickerData?.price ?? 0;
      const beta = tickerData?.beta || stock.beta;
      const latestValue = price * stock.currentQuantity;
      const currentToOriginalRatio = stock.currentQuantity / stock.quantity;
      const adjustedInvestedValue = stock.investedValue * currentToOriginalRatio;
      const change = latestValue - adjustedInvestedValue;
      const changePercent = adjustedInvestedValue !== 0 ? (change / adjustedInvestedValue) * 100 : 0;
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
      weight: totalPortfolioValue !== 0 ? (stock.latestValue / totalPortfolioValue) * 100 : 0
    }));
  };

  // --- Generate Sector Data ---
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
      const weight = totalValue !== 0 ? (latestValue / totalValue) * 100 : 0;
      const avgPerformance = sectorStocks.length > 0 ? sectorStocks.reduce((sum, stock) => sum + stock.changePercent, 0) / sectorStocks.length : 0;
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

  // --- Form Handlers ---
  const handleFormChange = (field: keyof AddStockForm, value: string | number) => {
    setAddStockForm(prev => ({ ...prev, [field]: value }));
  };

const [editingStock, setEditingStock] = useState<string | null>(null);
const [editValues, setEditValues] = useState<{
  quantity: number;
  investedPrice: number;
  purchaseDate: string;
}>({ quantity: 0, investedPrice: 0, purchaseDate: '' });

  // --- Add Holding ---
  const handleAddStock = async () => {
  try {
    const token = localStorage.getItem("token");
    // Prepare the payload to match backend expectations
   const payload = {
  ticker: addStockForm.ticker,
  investedPrice: addStockForm.investedValue,
  investedQuantity: addStockForm.quantity,
  currentQuantity: addStockForm.currentQuantity,
  purchaseDate: addStockForm.purchaseDate   // <-- ADD THIS
};


    const response = await fetch(`${API_BASE}/holdings/add-holding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Optional: show user-friendly error
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to add stock");
    }

    await fetchHoldings();
    setShowAddForm(false);
    setAddStockForm({
  ticker: "",
  investedValue: 0,
  quantity: 0,
  currentQuantity: 0,
  purchaseDate: new Date().toISOString().split('T')[0]
});

    // Optional: show success feedback
    // alert("Stock added successfully!");
  } catch (error) {
    console.error("Failed to add stock:", error);
    // Optional: show user-friendly error
    // alert(error.message || "Failed to add stock");
  }
};

const updateHoldingQuantity = async (holdingId: string, ticker: string, currentQuantity: number) => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(
      `${API_BASE}/holdings/update-holding-quantity?holdingId=${holdingId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticker,
          currentQuantity
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update holding quantity');
    }

    const result = await response.json();
    
    // Refresh holdings data after successful update
    await fetchHoldings();
    
    console.log('Holding quantity updated successfully');
    return result;
    
  } catch (error) {
    console.error('Error updating holding quantity:', error);
    throw error; // Re-throw to handle in calling component
  }
};

const updateHoldingInvestedPrice = async (holdingId: string, ticker: string, investedPrice: number) => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(
      `${API_BASE}/holdings/update-holding-invested-price?holdingId=${holdingId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticker,
          investedPrice
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update invested price');
    }

    const result = await response.json();
    
    // Refresh holdings data after successful update
    await fetchHoldings();
    
    console.log('Invested price updated successfully');
    return result;
    
  } catch (error) {
    console.error('Error updating invested price:', error);
    throw error; // Re-throw to handle in calling component
  }
};

const updateHoldingPurchaseDate = async (holdingId: string, ticker: string, purchaseDate: string) => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(
      `${API_BASE}/holdings/update-holding-purchase-date?holdingId=${holdingId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticker,
          purchaseDate
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update purchase date');
    }

    const result = await response.json();
    
    // Refresh holdings data after successful update
    await fetchHoldings();
    
    console.log('Purchase date updated successfully');
    return result;
    
  } catch (error) {
    console.error('Error updating purchase date:', error);
    throw error; // Re-throw to handle in calling component
  }
};

const handleEditStart = (stock: StockDataWithCalculations) => {
  setEditingStock(stock.ticker);
  setEditValues({
    quantity: stock.currentQuantity,
    investedPrice: stock.investedValue || 0,
    purchaseDate: stock.purchaseDate || ''
  });
};

const handleEditCancel = () => {
  setEditingStock(null);
  setEditValues({ quantity: 0, investedPrice: 0, purchaseDate: '' });
};

const handleQuantityUpdate = async (stock: StockDataWithCalculations, newQuantity: number) => {
  try {
    if (newQuantity < 0) {
      alert('Quantity cannot be negative');
      return;
    }
    if (newQuantity > stock.quantity) {
      alert('Current quantity cannot be greater than invested quantity');
      return;
    }
    await updateHoldingQuantity(stock.portfolioId, stock.ticker, newQuantity);
  } catch (error: any) {
    alert('Failed to update quantity: ' + error.message);
  }
};

const handleInvestedPriceUpdate = async (stock: StockDataWithCalculations, newPrice: number) => {
  try {
    if (newPrice <= 0) {
      alert('Price must be greater than 0');
      return;
    }
    await updateHoldingInvestedPrice(stock.portfolioId, stock.ticker, newPrice);
  } catch (error: any) {
    alert('Failed to update invested price: ' + error.message);
  }
};

const handlePurchaseDateUpdate = async (stock: StockDataWithCalculations, newDate: string) => {
  try {
    if (!newDate) {
      alert('Please provide a valid date');
      return;
    }
    await updateHoldingPurchaseDate(stock.portfolioId, stock.ticker, newDate);
  } catch (error: any) {
    alert('Failed to update purchase date: ' + error.message);
  }
};

  // --- Remove Holding ---
 const handleRemoveStock = async (portfolioId: string, holdingId: string) => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(
      `${API_BASE}/holdings/delete-holding?portfolioId=${portfolioId}&holdingId=${holdingId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to remove holding');
    }
    
    // Successfully deleted, refresh the holdings
    await fetchHoldings();
    
    // Optionally show success message
    console.log('Holding removed successfully');
    
  } catch (error) {
    console.error('Error removing holding:', error);
    // Optionally show user feedback with the actual error message
    // For example, if you're using a toast notification:
    // showToast('Error removing holding: ' + error.message, 'error');
  }
};

  // --- Filtering ---
  const getFilteredStocks = () => {
    let filtered = stocksWithCalculations;
    if (activeMarketCap !== "All") {
      filtered = filtered.filter(stock => stock.marketCap === activeMarketCap);
    }
    if (activeSector) {
      filtered = filtered.filter(stock => stock.sector === activeSector);
    }
    return filtered;
  };

  // --- Portfolio Beta ---
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

  // --- Update stocksWithCalculations on price/stockData change ---
  useEffect(() => {
    const updateStocks = async () => {
      const calculatedStocks = await calculateStockFields(stockData);
      setStocksWithCalculations(calculatedStocks);
    };
    updateStocks();
  }, [stockData, priceData]);

  // --- Update sector data when stocks or filter changes ---
  useEffect(() => {
    const filteredStocks = getFilteredStocks();
    setSectorData(generateSectorData(filteredStocks));
  }, [stocksWithCalculations, activeMarketCap, activeSector]);

  // --- Get filtered stocks ---
  const filteredStocks = getFilteredStocks();

  // --- Sort sectors by weight ---
  const sortedSectors = [...sectorData].sort((a, b) => b.weight - a.weight);

  // --- Portfolio Metrics ---
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
    const totalPortfolioValue = filteredStocks.reduce((sum, stock) => sum + stock.latestValue, 0);
    const portfolioInvestmentCost = filteredStocks.reduce((sum, stock) => sum + stock.investedValue, 0);
    const portfolioOverallGain = totalPortfolioValue - portfolioInvestmentCost;
    const portfolioOverallGainPercentage = portfolioInvestmentCost !== 0 ? (portfolioOverallGain / portfolioInvestmentCost) * 100 : 0;
    const todayGain = filteredStocks.reduce((sum, stock) => {
      const prevCloseValue = (priceData[stock.ticker]?.prevClose || 0) * stock.currentQuantity;
      return sum + (stock.latestValue - prevCloseValue);
    }, 0);
    const previousDayValue = filteredStocks.reduce((sum, stock) =>
      sum + ((priceData[stock.ticker]?.prevClose || 0) * stock.currentQuantity), 0);
    const todayGainPercentage = previousDayValue !== 0 ? (todayGain / previousDayValue) * 100 : 0;
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
      capitalGain: realizedGain,
      otherGain: 0
    };
  }, [filteredStocks, priceData, transactionHistory, stockData]);

  // --- Render ---
  return (
  <div className="relative min-h-screen bg-[#1a1a24] overflow-hidden text-white mt-9">
    {/* Particles in background */}
    <ParticlesBackground />

    {/* Content layered above */}
    <div className="relative z-10 p-8 text-center">
      <h1 className="text-4xl font-bold mb-4">PORTFOLIO VISTA</h1>
      <h2 className="text-lg">Market Cap Classification & Analysis</h2>

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

      {/* Portfolio Value */}
      <div className="mb-8">
        <h3 className="text-2xl text-white mb-2">Portfolio Value</h3>
        <div className="text-4xl font-bold text-blue-400">
          ${totalPortfolioValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-blue-900/30 text-blue-300 p-4 mb-4 rounded-md">
          Loading portfolio data...
        </div>
      ) : (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4 bg-gray-800 border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-400">
              <PieChart className="h-4 w-4 mr-2" />
              Add Stocks
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

          {/* --- Overview Tab --- */}
          <TabsContent value="overview">
            {/* Add Stock Button */}
            <Button 
  onClick={() => setShowAddForm(!showAddForm)}
  className="bg-blue-900/20 text-blue-400 border-blue-800 hover:bg-blue-900/30 hover:text-blue-300 mb-4 px-6 py-3 text-base rounded-md"
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
              <div className="mb-6 p-6 bg-gray-800/50 rounded-lg">
                <h3 className="text-lg text-white mb-4">Add New Stock to Portfolio</h3>
                <div className="grid gap-4">
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
                      <label className="text-sm text-gray-400 mb-1 block">Invested Value ($) *</label>
                      <Input 
                        type="number"
                        value={addStockForm.investedValue || ''}
                        onChange={(e) => handleFormChange('investedValue', parseFloat(e.target.value) || 0)}
                        placeholder="10000"
                        className="bg-gray-800 border-gray-700 text-gray-100" 
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Initial Quantity *</label>
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
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Purchase Date (Optional)</label>
                      <Input 
                        type="date"
                        value={addStockForm.purchaseDate}
                        onChange={(e) => handleFormChange('purchaseDate', e.target.value)}
                        className="bg-gray-800 border-gray-700 text-gray-100"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleAddStock}
                    className="bg-blue-600 hover:bg-blue-700 text-white mt-4"
                  >
                    Add to Portfolio
                  </Button>
                </div>
              </div>
            )}
            {/* Risk Analysis */}
            <div className="flex justify-center">
  <div className="mb-8 bg-gray-800/30 p-6 rounded-lg w-full max-w-4xl">
    <h3 className="text-lg text-blue-400 mb-4 text-center">Risk Analysis</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-gray-700/50 p-4 rounded-md text-center">
        <div className="text-sm text-white mb-1">Portfolio Beta</div>
        <div className="text-xl font-bold">{calculatePortfolioBeta().toFixed(2)}</div>
      </div>
    </div>
  </div>
</div>
          </TabsContent>

          <TabsContent value="portfolio">
            {/* Search input */}
            <div className="flex items-center mb-4">
              <Input
                className="bg-gray-800 border-gray-700 text-gray-100 w-64"
                placeholder="Search by ticker, name, or sector"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full bg-gray-800/30 border border-gray-700 rounded-md">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="p-2 text-blue-400 text-left">Ticker</th>
                    <th className="p-2 text-blue-400 text-left">Name</th>
                    <th className="p-2 text-blue-400 text-left">Sector</th>
                    <th className="p-2 text-blue-400 text-right">Market Cap</th>
                    <th className="p-2 text-blue-400 text-right">Price</th>
                    <th className="p-2 text-blue-400 text-right">Beta</th>
                    <th className="p-2 text-blue-400 text-right">Quantity</th>
                    <th className="p-2 text-blue-400 text-right">Current Value</th>
                    <th className="p-2 text-blue-400 text-right">Invested</th>
                    <th className="p-2 text-blue-400 text-right">Gain/Loss</th>
                    <th className="p-2 text-blue-400 text-right">Change %</th>
                    <th className="p-2 text-blue-400 text-right">Purchase Date</th>
                    <th className="p-2 text-blue-400 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStocks
                    .filter(stock =>
                      stock.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      stock.sector.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(stock => (
                      <tr key={stock._id || stock.ticker} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="p-2 text-white font-mono">{stock.ticker}</td>
                        <td className="p-2 text-white">{stock.name}</td>
                        <td className="p-2 text-white">{stock.sector}</td>
                        <td className="p-2 text-white text-right">{stock.marketCap}</td>
                        <td className="p-2 text-white text-right">
                          {stock.price ? `$${stock.price.toFixed(2)}` : <span className="text-gray-400">-</span>}
                        </td>
                        <td className="p-2 text-white text-right">
                          {stock.beta ? `${stock.beta.toFixed(2)}` : <span className="text-gray-400">-</span>}
                        </td>
                        {/* Editable Quantity */}
                        <td className="p-2 text-white text-right">
                          {editingStock === stock.ticker ? (
                            <input
                              type="number"
                              className="w-16 bg-gray-700 border border-gray-600 rounded px-1 text-right text-white text-sm"
                              value={editValues.quantity}
                              min="0"
                              max={stock.quantity}
                              onChange={(e) => setEditValues(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                              onBlur={() => handleQuantityUpdate(stock, editValues.quantity)}
                            />
                          ) : (
                            <span 
                              className="cursor-pointer hover:bg-gray-600 px-1 rounded"
                              onClick={() => handleEditStart(stock)}
                            >
                              {stock.currentQuantity}
                            </span>
                          )}
                          <div className="text-xs text-gray-400">of {stock.quantity}</div>
                        </td>
                        
                        <td className="p-2 text-white text-right">
                          {stock.latestValue ? `$${stock.latestValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "-"}
                        </td>
                        
                        {/* Editable Invested Value */}
                        <td className="p-2 text-white text-right">
                          {editingStock === stock.ticker ? (
                            <input
                              type="number"
                              step="0.01"
                              className="w-20 bg-gray-700 border border-gray-600 rounded px-1 text-right text-white text-sm"
                              value={editValues.investedPrice}
                              min="0"
                              onChange={(e) => setEditValues(prev => ({ ...prev, investedPrice: Number(e.target.value) }))}
                              onBlur={() => handleInvestedPriceUpdate(stock, editValues.investedPrice)}
                            />
                          ) : (
                            <span 
                              className="cursor-pointer hover:bg-gray-600 px-1 rounded"
                              onClick={() => handleEditStart(stock)}
                            >
                              {stock.investedValue ? `$${stock.investedValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "-"}
                            </span>
                          )}
                        </td>
                        
                        <td className={`p-2 text-right ${stock.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {stock.change >= 0 ? "+" : ""}
                          {stock.change ? `$${stock.change.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "-"}
                        </td>
                        <td className={`p-2 text-right ${stock.changePercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {stock.changePercent >= 0 ? "+" : ""}
                          {stock.changePercent ? `${stock.changePercent.toFixed(2)}%` : "-"}
                        </td>
                        
                        {/* Editable Purchase Date */}
                        <td className="p-2 text-white text-right">
                          {editingStock === stock.ticker ? (
                            <input
                              type="date"
                              className="w-32 bg-gray-700 border border-gray-600 rounded px-1 text-white text-xs"
                              value={editValues.purchaseDate}
                              onChange={(e) => setEditValues(prev => ({ ...prev, purchaseDate: e.target.value }))}
                              onBlur={() => handlePurchaseDateUpdate(stock, editValues.purchaseDate)}
                            />
                          ) : (
                            <span 
                              className="cursor-pointer hover:bg-gray-600 px-1 rounded text-sm"
                              onClick={() => handleEditStart(stock)}
                            >
                              {stock.purchaseDate || 'Set date'}
                            </span>
                          )}
                        </td>
                        
                        <td className="p-2 text-center">
                          <div className="flex gap-1 justify-center">
                            {editingStock === stock.ticker ? (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-green-400 hover:bg-green-900/20 w-6 h-6"
                                  onClick={handleEditCancel}
                                  title="Done editing"
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-blue-400 hover:bg-blue-900/20 w-6 h-6"
                                  onClick={() => handleEditStart(stock)}
                                  title="Edit stock"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-red-400 hover:bg-red-900/20 w-6 h-6"
                                  onClick={() => {
                                    if (stock._id && stock.portfolioId) {
                                      handleRemoveStock(stock.portfolioId, stock._id);
                                    } else {
                                      console.error('Missing required IDs for stock removal');
                                    }
                                  }}
                                  title="Remove stock"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  {filteredStocks.length === 0 && (
                    <tr>
                      <td colSpan={12} className="text-center text-gray-400 p-4">
                        No stocks found in your portfolio.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* --- Performance Tab --- */}
          <TabsContent value="performance">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DailyGainLoss
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
            <div className="mt-6 bg-gray-800/30 p-6 rounded-lg">
              <h3 className="text-lg text-white mb-4">Transaction History</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left p-2 text-blue-500">Date</th>
                      <th className="text-left p-2 text-blue-500">Stock</th>
                      <th className="text-left p-2 text-blue-500">Type</th>
                      <th className="text-right p-2 text-blue-500">Quantity</th>
                      <th className="text-right p-2 text-blue-500">Price</th>
                      <th className="text-right p-2 text-blue-500">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionHistory.map((transaction, index) => (
                      <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="p-2 text-white">{new Date(transaction.date).toLocaleDateString()}</td>
                        <td className="p-2 text-white">{transaction.ticker}</td>
                        <td className="p-2">
                          <Badge className={transaction.type === 'buy' ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}>
                            {transaction.type.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="text-right p-2 text-white">{transaction.quantity}</td>
                        <td className="text-right p-2 text-white">${transaction.price.toFixed(2)}</td>
                        <td className="text-right p-2 text-white">${transaction.totalValue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  </div>

  );
};

export default Portfolio;



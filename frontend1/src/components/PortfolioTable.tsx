// PortfolioTable.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Info, Trash, Plus, Minus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Socket } from "socket.io-client";
import Papa from "papaparse";

// Define CSV data interface
interface CsvStock {
  Symbol: string;
  "Security Name": string;
}

interface StockData {
  ticker: string;
  sector: string;
  investedValue: number;
  quantity: number;
  currentQuantity: number;
  marketCap: MarketCapType;
}

// Define interfaces for component props and state
interface StockDataWithCalculations {
  ticker: string;
  name: string;
  sector: string;
  investedValue: number;
  quantity: number;
  currentQuantity: number;
  marketCap: string;
  price: number;
  change: number;
  changePercent: number;
  latestValue: number;
  weight: number;
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

interface Transaction {
  ticker: string;
  type: string;
  quantity: number;
  price: number;
  totalValue: number;
  date: string;
}

interface PortfolioTableProps {
  stocks: StockDataWithCalculations[];
  activeSector: string | null;
  quantityAdjustment: Record<string, number>;
  handleQuantityAdjustmentChange: (ticker: string, value: string) => void;
  handleQuantityAdjust: (ticker: string, isAdd: boolean) => void;
  handleRemoveStock: (ticker: string) => void;
  
  // Original props
  stocksWithCalculations?: StockDataWithCalculations[];
  priceData?: PriceState;
  totalPortfolioValue?: number;
  transactionHistory?: Transaction[];
  userId?: string;
  socket?: Socket | null;
  isConnected?: boolean;
}

type MarketCapType = "All" | "Large Cap" | "Mid Cap" | "Small Cap";

// Fallback beta values (used if socket connection fails)
const fallbackBetaValues: Record<string, number> = {
  AAPL: 1.21,
  MSFT: 1.05,
  GOOGL: 1.10,
  AMZN: 1.35,
  META: 1.42,
  TSLA: 1.91,
  NVDA: 1.72,
  XOM: 0.78,
  JPM: 1.15,
  BAC: 1.28,
  DIS: 1.18,
  PFE: 0.68,
  PYPL: 1.45,
  INTC: 0.95,
  AMD: 1.65,
  UBER: 1.52,
  LYFT: 1.61,
  SNAP: 1.78,
  NFLX: 1.55,
  ADBE: 1.32,
  CRM: 1.40,
  TSM: 0.85,
  ORCL: 0.80,
  V: 1.12,
  MA: 1.25,
  WMT: 0.55,
  HD: 1.02,
  PG: 0.45,
  JNJ: 0.50,
  UNH: 0.92,
  KO: 0.58,
  PEP: 0.62,
  MRK: 0.70,
  TMO: 1.08,
  LIN: 1.17,
  DHR: 1.03,
  NEE: 0.75,
  CMCSA: 1.00,
  VZ: 0.40,
  T: 0.60,
  CVX: 0.82,
  SLB: 1.30,
  COP: 1.15,
  BMY: 0.65,
  CVS: 0.88,
  WFC: 1.20,
  USB: 1.05,
  AXP: 1.35,
  LOW: 1.10,
  CAT: 1.22,
  DE: 1.38,
  BA: 1.45,
  LMT: 0.95,
  RTX: 1.05,
  MCD: 0.72,
  SBUX: 1.15,
  NKE: 1.28,
  TJX: 0.98,
  COST: 1.12,
  AMT: 0.65,
  PLD: 0.78,
  CCI: 0.85,
  EQIX: 1.10,
  SPG: 1.20,
  AVGO: 1.55,
  QCOM: 1.42,
  TXN: 1.08,
  HON: 1.18,
  ADP: 0.90,
  BLK: 1.25,
  SCHW: 1.32,
  MSCI: 1.40,
  INTU: 1.38,
  NOW: 1.62,
  PANW: 1.70,
  SNOW: 1.85,
  DDOG: 1.92,
  ZS: 2.00,
  OKTA: 1.75,
  TEAM: 1.68,
  ZI: 1.52,
  MELI: 1.80,
  SHOP: 1.90,
  SE: 2.05,
  GME: 2.20,
  AMC: 2.30,
  UPST: 2.10,
  COIN: 2.40,
  RBLX: 1.70,
  SQ: 1.60,
  ROKU: 1.80,
  SPOT: 1.75,
  DOCU: 1.50,
  ZM: 1.65,
  TDOC: 1.95,
  PTON: 2.15,
  RDFN: 2.35,
  OPEN: 2.25,
  LMND: 2.00,
  WISH: 2.10,
  FUBO: 1.90,
  WKHS: 2.05,
  CLOV: 1.85,
  DNA: 1.75,
  BB: 1.95
};

const PortfolioTable: React.FC<PortfolioTableProps> = ({
  // New props
  stocks,
  activeSector,
  quantityAdjustment,
  handleQuantityAdjustmentChange,
  handleQuantityAdjust,
  handleRemoveStock,
  
  // Original props with defaults
  priceData = {},
  totalPortfolioValue = 0,
  transactionHistory = [],
  userId = "",
  socket = null,
  isConnected = false
}) => {
  // Use stocks as the source of stock data
  const stocksWithCalculations = stocks;

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  }>({
    key: 'latestValue',
    direction: 'descending'
  });
  const [sortedStocks, setSortedStocks] = useState<StockDataWithCalculations[]>([]);
  const [betaValues, setBetaValues] = useState<Record<string, number>>(fallbackBetaValues);
  const [socketStatus, setSocketStatus] = useState<string>("connecting");
  const [realizedPLMap, setRealizedPLMap] = useState<Record<string, number>>({});
  const [subscribedTickers, setSubscribedTickers] = useState<Set<string>>(new Set());
  const tickersRef = useRef<string[]>([]);

  // CSV stock name database
  const CSV_URL = "merged_symbols.csv";
  const [csvData, setCsvData] = useState<CsvStock[]>([]);
  const [isLoadingCSV, setIsLoadingCSV] = useState<boolean>(true);
  const [errorCSV, setErrorCSV] = useState<string | null>(null);

  // Fetch CSV data on component mount
  useEffect(() => {
    fetch(CSV_URL)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
        }
        return response.text();
      })
      .then(data => {
        const results = Papa.parse(data, {
          header: true,
          skipEmptyLines: true
        });

        if (results.errors.length > 0) {
          setErrorCSV("Error parsing stock data: " + results.errors.map(e => e.message).join(', '));
          return;
        }

        setCsvData(results.data as CsvStock[]);
        setIsLoadingCSV(false);
      })
      .catch(err => {
        setErrorCSV("Failed to load stock symbols: " + err.message);
        setIsLoadingCSV(false);
      });
  }, []);

  // Function to get company name from CSV data
  const getCompanyName = (ticker: string): string => {
    if (isLoadingCSV) return ticker;

    const stockInfo = csvData.find(stock => stock.Symbol === ticker);
    return stockInfo ? stockInfo["Security Name"] : ticker;
  };

  // Function to format currency string for display
  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Function to format percentage for display
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  // Calculate realized P/L from transaction history
  useEffect(() => {
    const calculatedPL: Record<string, number> = {};

    // Process transaction history to calculate realized P/L
    transactionHistory.forEach(transaction => {
      const { ticker, type, quantity, price } = transaction;

      if (!calculatedPL[ticker]) {
        calculatedPL[ticker] = 0;
      }

      // Only consider sell transactions for realized P/L calculation
      if (type.toLowerCase() === 'sell') {
        calculatedPL[ticker] += quantity * price;
      } else if (type.toLowerCase() === 'buy') {
        calculatedPL[ticker] -= quantity * price;
      }
    });
    setRealizedPLMap(calculatedPL);
  }, [transactionHistory]);

  // --- Socket Subscription Management Effect ---
  useEffect(() => {
    if (!socket || !isConnected || !stocksWithCalculations.length) {
      return; // Only manage subscriptions if connected and stocks exist
    }

    // Request beta values for our stocks
    const tickers = stocksWithCalculations.map(stock => stock.ticker);
    socket.emit("subscribeBeta", tickers);

    // Listen for beta value updates
    const handleBetaUpdate = (data: Record<string, number>) => {
      setBetaValues(prevBetas => ({
        ...prevBetas,
        ...data
      }));
    };

    socket.on("betaUpdate", handleBetaUpdate);

    // Get all ticker symbols from the portfolio for subscription management
    const allTickers = stocksWithCalculations.map(stock => stock.ticker.toUpperCase());

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

    // Clean up socket listeners on unmount or when dependencies change
    return () => {
      socket.off("betaUpdate", handleBetaUpdate);
    };
  }, [stocksWithCalculations, isConnected, socket]);

  // Get per unit cost (average cost basis)
  const getPerUnitCost = (stock: StockDataWithCalculations): number => {
    return stock.quantity > 0 ? stock.investedValue / stock.quantity : 0;
  };

  // Calculate unrealized gain percentage
  const getUnrealizedGainPercentage = (stock: StockDataWithCalculations): number => {
    return ((stock.latestValue - stock.investedValue) / stock.investedValue) * 100;
  };

  // Get the latest price from either priceData or the stock.price
  const getLatestPrice = (ticker: string): number => {
    if (priceData[ticker] && priceData[ticker].price) {
      return priceData[ticker].price;
    }
    const stock = stocksWithCalculations.find(s => s.ticker === ticker);
    return stock ? stock.price : 0;
  };

  // Get price change information
  const getPriceChange = (ticker: string): { change: number; changePercent: number } => {
    if (priceData[ticker]) {
      return {
        change: priceData[ticker].change || 0,
        changePercent: priceData[ticker].changePercent || 0
      };
    }
    const stock = stocksWithCalculations.find(s => s.ticker === ticker);
    return {
      change: 0,
      changePercent: stock ? stock.changePercent : 0
    };
  };

  // Get beta value for a stock (from socket data or fallback)
  const getBetaValue = (ticker: string): number => {
    return betaValues[ticker] || 1.0;
  };

  // Get realized P/L for a stock (calculated from transaction history)
  const getRealizedPL = (ticker: string): number => {
    return realizedPLMap[ticker] || 0;
  };

  // Function to recalculate weights based on latest values
  const recalculateWeights = (stocks: StockDataWithCalculations[]): StockDataWithCalculations[] => {
    if (!stocks || stocks.length === 0) return [];

    // Calculate total portfolio value
    const totalValue = stocks.reduce((sum, stock) => sum + stock.latestValue, 0);

    // Calculate weights based on latest values
    return stocks.map(stock => ({
      ...stock,
      weight: (stock.latestValue / totalValue) * 100
    }));
  };

  // Handle sorting logic
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting to stocks
  useEffect(() => {
    if (!stocksWithCalculations || stocksWithCalculations.length === 0) return;

    // First recalculate weights to ensure they're up to date
    let stocksToSort = recalculateWeights([...stocksWithCalculations]);

    // Filter stocks by sector if activeSector is set
    if (activeSector && activeSector !== "All") {
      stocksToSort = stocksToSort.filter(stock => stock.sector === activeSector);
    }

    if (sortConfig.key) {
      stocksToSort.sort((a, b) => {
        // Handle special cases
        if (sortConfig.key === 'perUnitCost') {
          return (getPerUnitCost(a) - getPerUnitCost(b)) * (sortConfig.direction === 'ascending' ? 1 : -1);
        }
        if (sortConfig.key === 'unrealizedGain') {
          return (getUnrealizedGainPercentage(a) - getUnrealizedGainPercentage(b)) * (sortConfig.direction === 'ascending' ? 1 : -1);
        }
        if (sortConfig.key === 'realizedPL') {
          return (getRealizedPL(a.ticker) - getRealizedPL(b.ticker)) * (sortConfig.direction === 'ascending' ? 1 : -1);
        }
        if (sortConfig.key === 'beta') {
          return (getBetaValue(a.ticker) - getBetaValue(b.ticker)) * (sortConfig.direction === 'ascending' ? 1 : -1);
        }
        if (sortConfig.key === 'price') {
          return (getLatestPrice(a.ticker) - getLatestPrice(b.ticker)) * (sortConfig.direction === 'ascending' ? 1 : -1);
        }
        if (sortConfig.key === 'priceChange') {
          return (getPriceChange(a.ticker).changePercent - getPriceChange(b.ticker).changePercent) * (sortConfig.direction === 'ascending' ? 1 : -1);
        }

        // Default case for any other field
        if (a[sortConfig.key as keyof StockDataWithCalculations] < b[sortConfig.key as keyof StockDataWithCalculations]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key as keyof StockDataWithCalculations] > b[sortConfig.key as keyof StockDataWithCalculations]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    setSortedStocks(stocksToSort);
  }, [stocksWithCalculations, sortConfig, priceData, betaValues, realizedPLMap, activeSector]);

  const getSortIndicator = (key: string): string | null => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };

  // If no stocks data, show loading
  if (!stocksWithCalculations || stocksWithCalculations.length === 0) {
    return <div className="p-4 text-center text-gray-500">Loading portfolio data...</div>;
  }

  return (
    <div className="w-full overflow-auto">
      <div className="flex flex-wrap gap-2 mb-4">
        {errorCSV && (
          <div className="text-xs px-3 py-1 rounded-md inline-block bg-red-950/30 text-red-400">
            {errorCSV}
          </div>
        )}
        {isLoadingCSV && (
          <div className="text-xs px-3 py-1 rounded-md inline-block bg-amber-950/30 text-amber-400">
            Loading stock symbols data...
          </div>
        )}
        {socketStatus !== "connected" && (
          <div className={`text-xs px-3 py-1 rounded-md inline-block 
            ${socketStatus === "connecting" ? "bg-amber-950/30 text-amber-400" :
              socketStatus === "error" ? "bg-red-950/30 text-red-400" :
              "bg-gray-950/30 text-gray-400"}`}>
            Beta data: {socketStatus === "connecting" ? "Connecting..." :
              socketStatus === "error" ? "Connection error, using fallback data" :
              "Disconnected, using fallback data"}
          </div>
        )}
        {(!transactionHistory || transactionHistory.length === 0) && (
          <div className="text-xs px-3 py-1 rounded-md inline-block bg-gray-950/30 text-gray-400">
            No transaction history available for realized P/L calculation
          </div>
        )}
      </div>

      <Table className="w-full">
        <TableCaption>Comprehensive Stock Portfolio Overview</TableCaption>
        <TableHeader className="bg-gray-950">
          <TableRow>
            <TableHead
              className="text-gray-400 cursor-pointer hover:text-blue-400"
              onClick={() => requestSort('ticker')}
            >
              Stock {getSortIndicator('ticker')}
            </TableHead>
            <TableHead className="text-gray-400">Name</TableHead>
            <TableHead className="text-gray-400">Sector</TableHead>
            <TableHead
              className="text-gray-400 text-right cursor-pointer hover:text-blue-400"
              onClick={() => requestSort('weight')}
            >
              Weight {getSortIndicator('weight')}
            </TableHead>
            <TableHead
              className="text-gray-400 text-right cursor-pointer hover:text-blue-400"
              onClick={() => requestSort('latestValue')}
            >
              Latest Value {getSortIndicator('latestValue')}
            </TableHead>
            <TableHead
              className="text-gray-400 text-right cursor-pointer hover:text-blue-400"
              onClick={() => requestSort('price')}
            >
              Live Price {getSortIndicator('price')}
            </TableHead>
            <TableHead
              className="text-gray-400 text-right cursor-pointer hover:text-blue-400"
              onClick={() => requestSort('priceChange')}
            >
              Change {getSortIndicator('priceChange')}
            </TableHead>
            <TableHead
              className="text-gray-400 text-right cursor-pointer hover:text-blue-400"
              onClick={() => requestSort('currentQuantity')}
            >
              Quantity {getSortIndicator('currentQuantity')}
            </TableHead>
            <TableHead
              className="text-gray-400 text-right cursor-pointer hover:text-blue-400"
              onClick={() => requestSort('perUnitCost')}
            >
              Per Unit Cost {getSortIndicator('perUnitCost')}
            </TableHead>
            <TableHead
              className="text-gray-400 text-right cursor-pointer hover:text-blue-400"
              onClick={() => requestSort('investedValue')}
            >
              Invested Value {getSortIndicator('investedValue')}
            </TableHead>
            <TableHead
              className="text-gray-400 text-right cursor-pointer hover:text-blue-400"
              onClick={() => requestSort('unrealizedGain')}
            >
              Unrealized Gain {getSortIndicator('unrealizedGain')}
            </TableHead>
            <TableHead
              className="text-gray-400 text-right cursor-pointer hover:text-blue-400"
              onClick={() => requestSort('realizedPL')}
            >
              Realized P/L {getSortIndicator('realizedPL')}
            </TableHead>
            <TableHead
              className="text-gray-400 text-right cursor-pointer hover:text-blue-400"
              onClick={() => requestSort('beta')}
            >
              Beta {getSortIndicator('beta')}
            </TableHead>
            <TableHead className="text-gray-400 text-right">Market Cap</TableHead>
            <TableHead className="text-gray-400 text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedStocks.map((stock) => (
            <TableRow key={stock.ticker}>
              <TableCell className="font-medium">{stock.ticker}</TableCell>
              <TableCell>{getCompanyName(stock.ticker)}</TableCell>
              <TableCell>{stock.sector}</TableCell>
              <TableCell className="text-right">{formatPercentage(stock.weight)}</TableCell>
              <TableCell className="text-right">{formatCurrency(stock.latestValue)}</TableCell>
              <TableCell className="text-right">{formatCurrency(getLatestPrice(stock.ticker))}</TableCell>
              <TableCell className="text-right">
                {getPriceChange(stock.ticker).change > 0 ? (
                  <Badge variant="outline" className="gap-1 border-green-500 text-green-500">
                    <ArrowUp className="h-3 w-3" />
                    {formatPercentage(getPriceChange(stock.ticker).changePercent)}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 border-red-500 text-red-500">
                    <ArrowDown className="h-3 w-3" />
                    {formatPercentage(getPriceChange(stock.ticker).changePercent)}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">{stock.currentQuantity}</TableCell>
              <TableCell className="text-right">{formatCurrency(getPerUnitCost(stock))}</TableCell>
              <TableCell className="text-right">{formatCurrency(stock.investedValue)}</TableCell>
              <TableCell className="text-right">
                {getUnrealizedGainPercentage(stock) > 0 ? (
                  <span className="text-green-500">
                    {formatCurrency(stock.latestValue - stock.investedValue)} ({formatPercentage(getUnrealizedGainPercentage(stock))})
                  </span>
                ) : (
                  <span className="text-red-500">
                    {formatCurrency(stock.latestValue - stock.investedValue)} ({formatPercentage(getUnrealizedGainPercentage(stock))})
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {getRealizedPL(stock.ticker) > 0 ? (
                  <span className="text-green-500">{formatCurrency(getRealizedPL(stock.ticker))}</span>
                ) : (
                  <span className="text-red-500">{formatCurrency(getRealizedPL(stock.ticker))}</span>
                )}
              </TableCell>
              <TableCell className="text-right">{getBetaValue(stock.ticker)}</TableCell>
              <TableCell className="text-right">{stock.marketCap}</TableCell>
              <TableCell className="text-center">
                <div className="flex items-center space-x-2 justify-center">
                  <div className="flex items-center space-x-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityAdjust(stock.ticker, false)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      className="w-16 h-8 text-center"
                      value={quantityAdjustment[stock.ticker] || 0}
                      onChange={(e) => handleQuantityAdjustmentChange(stock.ticker, e.target.value)}
                    />
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityAdjust(stock.ticker, true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-red-500 hover:text-red-400" onClick={() => handleRemoveStock(stock.ticker)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PortfolioTable;
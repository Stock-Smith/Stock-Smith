import React, { useState, useEffect, useMemo, useRef } from "react";
import { tsParticles } from "tsparticles-engine";
import Particles from "react-tsparticles";
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from "framer-motion";
import { Resizable, ResizableProps } from "re-resizable";

import {
  Card,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

import { ChevronRight, TrendingDown, TrendingUp, Briefcase, PieChart, BarChart3, DollarSign, Info } from "lucide-react";


// Type definitions for sector data
interface SectorData {
  name: string;
  latestValue: string;
  investedValue: string;
  weight: number;
  performanceData: number[];
}

// Type definitions for stock data
interface StockData {
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  latestValue: string;
  investedValue: string;
  weight: number;
  marketCap: MarketCapType;
  peRatio: number; // Added for expanded row content
  volume: number; // Added for expanded row content
  dividendYield: number; // Added for expanded row content
  priceHistory: number[]; // Added for sparkline chart
}

// Market cap type definition
type MarketCapType = "All" | "Large Cap" | "Mid Cap" | "Small Cap";

// Tweet interface for floating tweets
interface Tweet {
  id: number;
  text: string;
}

// Column configuration interface for the table
interface ColumnConfig {
  key: string;
  label: string;
  width: number;
  sortable?: boolean;
  resizable?: boolean;
}

// Sort configuration interface
interface SortConfig {
  key: keyof StockData;
  direction: 'asc' | 'desc';
}

// SparkLine component to show price history
const SparkLine = ({ 
  data, 
  width, 
  height, 
  margin, 
  children 
}: { 
  data: number[]; 
  width: number; 
  height: number; 
  margin: { top: number; right: number; bottom: number; left: number };
  children: (props: { path: string | null }) => React.ReactNode;
}) => {
  // Calculate dimensions
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  // Return null if no data
  if (!data || data.length === 0) return null;
  
  // Calculate scales
  const xScale = (i: number) => (i / (data.length - 1)) * innerWidth;
  const yScale = (d: number) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    return innerHeight - ((d - min) / (max - min || 1)) * innerHeight;
  };
  
  // Generate path
  const path = data.length > 1 
    ? `M${data.map((d, i) => `${xScale(i) + margin.left},${yScale(d) + margin.top}`).join('L')}`
    : null;
  
  return (
    <svg width={width} height={height}>
      {children({ path })}
    </svg>
  );
};

const Portfolio = () => {
  // State declarations
  const [activeMarketCap, setActiveMarketCap] = useState<MarketCapType>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filterText, setFilterText] = useState("");
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [isResizing, setIsResizing] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Calculate total portfolio value
  const totalPortfolioValue = 1458750; // Mock value - in a real app this would be calculated from actual data

  // Generate random price history for sparkline
  const generatePriceHistory = (length: number, volatility: number) => {
    const history = [];
    let price = 100;
    
    for (let i = 0; i < length; i++) {
      price = price + (Math.random() * volatility * 2) - volatility;
      price = Math.max(50, Math.min(150, price)); // Keep within reasonable bounds
      history.push(price);
    }
    
    return history;
  };

  // Tweet effect
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

    // Initialize tsparticles
    tsParticles.load("tsparticles", {
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
    });

    // Simulate data loading
    setTimeout(() => setIsLoading(false), 1500);

    return () => {
      clearInterval(addTweetInterval);
      tsParticles.domItem(0)?.destroy(); // Cleanup tsparticles on unmount
    };
  }, []);

  // Generate random currency values
  const randomCurrencyValue = () => {
    return `$${(Math.random() * 500000 + 50000).toFixed(2)}`;
  };
  
  // Sector data for different market cap types
  const marketCapSectorData: Record<Exclude<MarketCapType, "All">, SectorData[]> = {
    "Large Cap": [
      { name: "Technology", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 22.35, performanceData: generatePriceHistory(30, 2) },
      { name: "Financial Services", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 15.80, performanceData: generatePriceHistory(30, 1.8) },
      { name: "Healthcare", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 12.45, performanceData: generatePriceHistory(30, 1.5) },
      { name: "Consumer Discretionary", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 9.30, performanceData: generatePriceHistory(30, 2.2) },
      { name: "Communication Services", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 8.75, performanceData: generatePriceHistory(30, 1.7) },
      { name: "Industrials", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 7.20, performanceData: generatePriceHistory(30, 2.1) },
      { name: "Consumer Staples", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 5.85, performanceData: generatePriceHistory(30, 1.2) },
      { name: "Energy", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 4.15, performanceData: generatePriceHistory(30, 2.5) },
    ],
    "Mid Cap": [
      { name: "Industrials", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 17.50, performanceData: generatePriceHistory(30, 2.3) },
      { name: "Technology", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 14.90, performanceData: generatePriceHistory(30, 2.8) },
      { name: "Healthcare", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 13.25, performanceData: generatePriceHistory(30, 1.9) },
      { name: "Financial Services", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 11.75, performanceData: generatePriceHistory(30, 2.0) },
      { name: "Consumer Discretionary", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 9.60, performanceData: generatePriceHistory(30, 2.4) },
      { name: "Real Estate", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 7.85, performanceData: generatePriceHistory(30, 1.6) },
      { name: "Materials", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 6.45, performanceData: generatePriceHistory(30, 2.1) },
      { name: "Utilities", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 4.30, performanceData: generatePriceHistory(30, 1.3) },
    ],
    "Small Cap": [
      { name: "Industrials", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 18.20, performanceData: generatePriceHistory(30, 2.6) },
      { name: "Healthcare", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 15.35, performanceData: generatePriceHistory(30, 2.0) },
      { name: "Financial Services", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 12.80, performanceData: generatePriceHistory(30, 2.2) },
      { name: "Technology", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 10.45, performanceData: generatePriceHistory(30, 3.0) },
      { name: "Consumer Discretionary", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 8.90, performanceData: generatePriceHistory(30, 2.5) },
      { name: "Materials", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 7.65, performanceData: generatePriceHistory(30, 2.1) },
      { name: "Energy", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 5.95, performanceData: generatePriceHistory(30, 2.8) },
      { name: "Real Estate", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 4.80, performanceData: generatePriceHistory(30, 1.9) },
    ],
  };

  // Stock data with market cap classification and additional properties for expanded view
  const allStockData: StockData[] = [
    // Large Cap Stocks
    { 
      name: "Apple", 
      sector: "Technology", 
      price: 187.45, 
      change: 3.28, 
      changePercent: 1.78, 
      latestValue: randomCurrencyValue(), 
      investedValue: randomCurrencyValue(), 
      weight: 8.75, 
      marketCap: "Large Cap",
      peRatio: 28.5,
      volume: 32450620,
      dividendYield: 0.0058,
      priceHistory: generatePriceHistory(20, 3)
    },
    { 
      name: "JPMorgan Chase", 
      sector: "Financial Services", 
      price: 204.65, 
      change: -1.85, 
      changePercent: -0.90, 
      latestValue: randomCurrencyValue(), 
      investedValue: randomCurrencyValue(), 
      weight: 7.20, 
      marketCap: "Large Cap",
      peRatio: 12.8,
      volume: 9876540,
      dividendYield: 0.022,
      priceHistory: generatePriceHistory(20, 2)
    },
    { 
      name: "Johnson & Johnson", 
      sector: "Healthcare", 
      price: 156.25, 
      change: 2.45, 
      changePercent: 1.59, 
      latestValue: randomCurrencyValue(), 
      investedValue: randomCurrencyValue(), 
      weight: 5.65, 
      marketCap: "Large Cap",
      peRatio: 22.3,
      volume: 5432190,
      dividendYield: 0.026,
      priceHistory: generatePriceHistory(20, 1.5)
    },
    { 
      name: "Amazon", 
      sector: "Consumer Discretionary", 
      price: 175.85, 
      change: 4.35, 
      changePercent: 2.54, 
      latestValue: randomCurrencyValue(), 
      investedValue: randomCurrencyValue(), 
      weight: 6.45, 
      marketCap: "Large Cap",
      peRatio: 45.7,
      volume: 28763450,
      dividendYield: 0,
      priceHistory: generatePriceHistory(20, 4)
    },
    
    // Mid Cap Stocks
    { 
      name: "Fortinet", 
      sector: "Technology", 
      price: 173.80, 
      change: -2.15, 
      changePercent: -2.83, 
      latestValue: randomCurrencyValue(), 
      investedValue: randomCurrencyValue(), 
      weight: 5.95, 
      marketCap: "Mid Cap",
      peRatio: 35.8,
      volume: 3456270,
      dividendYield: 0,
      priceHistory: generatePriceHistory(20, 5)
    },
    { 
      name: "Teradyne", 
      sector: "Industrials", 
      price: 137.50, 
      change: 2.75, 
      changePercent: 2.04, 
      latestValue: randomCurrencyValue(), 
      investedValue: randomCurrencyValue(), 
      weight: 5.35, 
      marketCap: "Mid Cap",
      peRatio: 28.3,
      volume: 1234560,
      dividendYield: 0.0038,
      priceHistory: generatePriceHistory(20, 3)
    },
    { 
      name: "Bio-Rad Labs", 
      sector: "Healthcare", 
      price: 322.45, 
      change: 5.60, 
      changePercent: 1.77, 
      latestValue: randomCurrencyValue(), 
      investedValue: randomCurrencyValue(), 
      weight: 4.85, 
      marketCap: "Mid Cap",
      peRatio: 42.1,
      volume: 987650,
      dividendYield: 0,
      priceHistory: generatePriceHistory(20, 3.5)
    },
    { 
      name: "First Horizon", 
      sector: "Financial Services", 
      price: 15.78, 
      change: -0.22, 
      changePercent: -1.37, 
      latestValue: randomCurrencyValue(), 
      investedValue: randomCurrencyValue(), 
      weight: 4.25, 
      marketCap: "Mid Cap",
      peRatio: 9.7,
      volume: 4567890,
      dividendYield: 0.035,
      priceHistory: generatePriceHistory(20, 2)
    },
    
    // Small Cap Stocks
    { 
      name: "Cornerstone Building", 
      sector: "Industrials", 
      price: 32.45, 
      change: 0.85, 
      changePercent: 2.69, 
      latestValue: randomCurrencyValue(), 
      investedValue: randomCurrencyValue(), 
      weight: 4.85, 
      marketCap: "Small Cap",
      peRatio: 18.6,
      volume: 876540,
      dividendYield: 0.015,
      priceHistory: generatePriceHistory(20, 4)
    },
    { 
      name: "Addus HomeCare", 
      sector: "Healthcare", 
      price: 115.60, 
      change: -3.15, 
      changePercent: -2.65, 
      latestValue: randomCurrencyValue(), 
      investedValue: randomCurrencyValue(), 
      weight: 4.35, 
      marketCap: "Small Cap",
      peRatio: 32.5,
      volume: 345620,
      dividendYield: 0,
      priceHistory: generatePriceHistory(20, 5)
    },
    { 
      name: "Glacier Bancorp", 
      sector: "Financial Services", 
      price: 42.75, 
      change: 0.65, 
      changePercent: 1.54, 
      latestValue: randomCurrencyValue(), 
      investedValue: randomCurrencyValue(), 
      weight: 3.80, 
      marketCap: "Small Cap",
      peRatio: 14.3,
      volume: 765430,
      dividendYield: 0.028,
      priceHistory: generatePriceHistory(20, 2.5)
    },
    { 
      name: "Forrester Research", 
      sector: "Technology", 
      price: 18.35, 
      change: -0.45, 
      changePercent: -2.39, 
      latestValue: randomCurrencyValue(), 
      investedValue: randomCurrencyValue(), 
      weight: 3.25, 
      marketCap: "Small Cap",
      peRatio: 22.9,
      volume: 234560,
      dividendYield: 0.012,
      priceHistory: generatePriceHistory(20, 3)
    },
  ];

  // Table column configuration
  const stockColumns: ColumnConfig[] = [
    { key: 'name', label: 'Stock', width: 200, sortable: true, resizable: true },
    { key: 'sector', label: 'Sector', width: 150, sortable: true, resizable: true },
    { key: 'price', label: 'Price', width: 120, sortable: true, resizable: true },
    { key: 'change', label: 'Change', width: 120, sortable: true, resizable: true },
    { key: 'history', label: 'History', width: 150, resizable: true },
    { key: 'value', label: 'Value', width: 150, sortable: true, resizable: true },
  ];

  // Fix the typo in Fortinet stock price
  const correctedStockData = useMemo(() => {
    return allStockData.map(stock => {
      if (stock.name === "Fortinet") {
        return { ...stock, price: 73.80 }; // Fix the A73.80 typo
      }
      return stock;
    });
  }, []);

  // Sorting implementation
  const sortedStocks = useMemo(() => {
    if (!sortConfig) return correctedStockData;
    return [...correctedStockData].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) 
        return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) 
        return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [correctedStockData, sortConfig]);

  const currentSectorData = useMemo(() => {
    if (activeMarketCap === "All") {
      return Object.values(marketCapSectorData).flat();
    }
    return marketCapSectorData[activeMarketCap];
  }, [activeMarketCap]);

  const getSectorColor = (sector: string) => {
    const colors: Record<string, string> = {
      Technology: 'linear-gradient(45deg, #3b82f6, #2563eb)',
      'Financial Services': 'linear-gradient(45deg, #10b981, #059669)',
      Healthcare: 'linear-gradient(45deg, #8b5cf6, #6d28d9)',
      Industrials: 'linear-gradient(45deg, #f59e0b, #d97706)',
      'Consumer Discretionary': 'linear-gradient(45deg, #ec4899, #db2777)',
      'Communication Services': 'linear-gradient(45deg, #84cc16, #65a30d)',
      Energy: 'linear-gradient(45deg, #f97316, #ea580c)',
      Utilities: 'linear-gradient(45deg, #14b8a6, #0d9488)',
      Materials: 'linear-gradient(45deg, #6366f1, #4f46e5)',
      'Real Estate': 'linear-gradient(45deg, #eab308, #ca8a04)'
    };
    return colors[sector] || '#6b7280';
  };

  // Filtering by market cap and search text
  const filteredStocks = useMemo(() => {
    let result = sortedStocks;
    
    // Filter by market cap if not "All"
    if (activeMarketCap !== "All") {
      result = result.filter(stock => stock.marketCap === activeMarketCap);
    }
    
    // Filter by search text
    if (filterText) {
      result = result.filter(stock =>
        stock.name.toLowerCase().includes(filterText.toLowerCase()) ||
        stock.sector.toLowerCase().includes(filterText.toLowerCase())
      );
    }
    
    return result;
  }, [sortedStocks, activeMarketCap, filterText]);

  // Virtualization setup for table rows
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredStocks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => expandedRow ? 120 : 60,
    overscan: 10,
  });

  // Responsive design setup
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Column resizing handler
  const handleResize = (key: string, newWidth: number) => {
    setColumnWidths(prev => ({ ...prev, [key]: newWidth }));
  };

  // Resizable header component for table columns
 // Update the ResizableHeader component
 const ResizableHeader = ({ column }: { column: ColumnConfig }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

const updateColumnWidth = (key: string, newWidth: number) => {
  setColumnWidths((prev) => ({
    ...prev,
    [key]: newWidth,
  }));
};
  const handleColumnResize: ResizableProps['onResize'] = (
    e,
    direction, 
    elementRef,
    delta
  ) => {
    if (!elementRef || !elementRef.offsetWidth) {
      console.warn(`Resize error: Invalid elementRef for column ${column.key}`);
      return;
    }
    updateColumnWidth(column.key, elementRef.offsetWidth); // Avoid recursive call
  };

  return (
    <Resizable
      defaultSize={{
        width: columnWidths[column.key] ?? column.width ?? 100, // Default width if undefined
        height: 0
      }}
      onResize={handleColumnResize}
      onResizeStart={() => setIsResizing(true)}
      onResizeStop={() => setIsResizing(false)}
      enable={{
        right: true,
        left: false,
        top: false,
        bottom: false,
      }}
      handleComponent={{
        right: (
          <span
            className={`absolute right-0 top-0 h-full w-1 bg-gray-600/30 hover:bg-blue-400 cursor-col-resize ${
              isResizing ? 'bg-blue-400' : ''
            }`}
            style={{ transform: `translateX(50%)` }}
          />
        )
      }}
    >
      <div
        className={`flex items-center justify-between h-full ${
          isResizing ? 'cursor-col-resize' : 'cursor-pointer'
        }`}
      >
        <span
          className="hover:text-blue-300 transition-colors"
          onClick={() => {
            if (!column.sortable || !setSortConfig) return;
            setSortConfig(prev => ({
              key: column.key as keyof StockData,
              direction: prev?.key === column.key && prev.direction === 'asc' ? 'desc' : 'asc'
            }));
          }}
        >
          {column.label}
          {column.sortable && sortConfig?.key === column.key && (
            <span className="ml-1 text-xs">
              {sortConfig.direction === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </span>
      </div>
    </Resizable>
  );
};


  // Row expansion content component
  const ExpandedRowContent = ({ stock }: { stock: StockData }) => (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="grid grid-cols-2 gap-4 p-4 bg-gray-800/20"
    >
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-blue-400" />
        <span className="text-xs font-medium">P/E Ratio:</span>
        <span className="text-xs font-mono">{stock.peRatio.toFixed(2)}</span>
      </div>
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-purple-400" />
        <span className="text-xs font-medium">Volume:</span>
        <span className="text-xs font-mono">{stock.volume.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-green-400" />
        <span className="text-xs font-medium">Dividend Yield:</span>
        <span className="text-xs font-mono">{(stock.dividendYield * 100).toFixed(2)}%</span>
      </div>
    </motion.div>
  );

  // Virtualized table component for stocks
  const StockTable = () => (
    <div className="rounded-lg border border-gray-600/20 overflow-hidden">
      {/* Search filter */}
      <div className="p-4 bg-gray-800/20 flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Filter stocks..."
          className="bg-gray-700/20 text-gray-100 px-3 py-1.5 rounded-md text-sm flex-grow"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
      </div>
      
      {/* Stock table with virtualization */}
      <div ref={parentRef} className="h-[600px] overflow-auto relative">
        <table className="w-full" style={{ minWidth: isMobile ? '700px' : 'auto' }}>
        <thead className="bg-gray-800/20 backdrop-blur-sm sticky top-0 z-10">
  <tr>
    {stockColumns.map((column) => (
      <th
        key={column.key}
        className="text-left py-3 px-4 text-sm font-semibold text-gray-300/80 relative"
        style={{ 
          width: columnWidths[column.key] || column.width,
          minWidth: column.width // Add minimum width
        }}
      >
        <ResizableHeader column={column} />
      </th>
    ))}
  </tr>
</thead>
          
          <tbody
            className="divide-y divide-gray-600/20"
            style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const stock = filteredStocks[virtualRow.index];
              return (
                <motion.tr
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  className="hover:bg-gray-700/10 cursor-pointer group"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  onClick={() => setExpandedRow(expandedRow === stock.name ? null : stock.name)}
                >
                  {/* Stock name cell */}
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="mr-3">
                        {stock.marketCap === 'Large Cap' ? (
                          <DollarSign className="h-4 w-4 text-blue-400/80" />
                        ) : stock.marketCap === 'Mid Cap' ? (
                          <BarChart3 className="h-4 w-4 text-purple-400/80" />
                        ) : (
                          <PieChart className="h-4 w-4 text-green-400/80" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-100/90">
                        {stock.name}
                      </span>
                    </div>
                  </td>
                  
                  {/* Sector cell */}
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-300/80">
                      {stock.sector}
                    </span>
                  </td>
                  
                  {/* Price cell */}
                  <td className="py-3 px-4">
                    <span className="text-sm font-mono text-gray-100/90">
                      ${stock.price.toFixed(2)}
                    </span>
                  </td>
                  
                  {/* Change cell */}
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      {stock.change >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-400/80 mr-1 drop-shadow-glow-green" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-400/80 mr-1 drop-shadow-glow-red" />
                      )}
                      <span 
                        className={`text-sm font-mono ${
                          stock.change >= 0 ? 'text-green-400/90' : 'text-red-400/90'
                        }`}
                      >
                        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </td>
                  
                  {/* Price history sparkline cell */}
                  <td className="py-3 px-4">
                    <div className="w-[100px] h-8">
                      <SparkLine
                        data={stock.priceHistory}
                        width={100}
                        height={32}
                        margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
                      >
                        {(props) => (
                          <path
                            d={props.path || ''}
                            stroke={stock.change >= 0 ? '#10b981' : '#ef4444'}
                            strokeWidth={1}
                            fill="none"
                          />
                        )}
                      </SparkLine>
                    </div>
                  </td>

                  {/* Value cell */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300/80 font-mono">
                        {stock.latestValue}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400/50 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        
        {/* Expanded row overlay */}
        <AnimatePresence>
          {expandedRow && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0
              }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-sm p-4"
            >
              <ExpandedRowContent 
                stock={filteredStocks.find(s => s.name === expandedRow)!} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  // Main return function
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
      initial={{ opacity: 0, y: "100vh" }} // Start off-screen at the bottom
      animate={{ opacity: 0.7, y: "-100vh" }} // Move straight up
      exit={{ opacity: 0 }}
      transition={{ duration: 8, ease: "linear" }}
      className="fixed pointer-events-none text-sm z-10 text-gray-300/80"
      style={{
        left: `${Math.random() * 80 + 10}%`, // Random horizontal start
        bottom: "0px", // Start from the bottom of the screen
        textShadow: "0 0 8px rgba(255,255,255,0.1)"
      }}
    >
      {tweet.text}
    </motion.div>
  ))}
</AnimatePresence>


      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 relative z-10 pt-20">
        <div className="mb-8 pt-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text">
                PORTFOLIO
              </h1>
            </motion.div>
            
            <motion.div 
              className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-sm rounded-xl p-5 flex flex-col items-center border border-blue-400/20 shadow-glow-blue"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <p className="text-sm text-blue-300/80 mb-1">Portfolio Value</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-text-shimmer">
                ${totalPortfolioValue.toLocaleString()}
              </p>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0.7, y: 20 }}
          animate={{ opacity: 0.7, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="bg-gray-800/10 backdrop-blur-xl border border-gray-600/20 shadow-lg">
            <CardHeader className="bg-transparent">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-900/20 rounded-lg backdrop-blur-sm">
                  <Briefcase className="h-5 w-5 text-blue-400/80" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-100/90">
                  Market Overview
                </CardTitle>
              </div>
            </CardHeader>

            <Tabs defaultValue="stocks" className="w-full">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between px-6 pt-4 pb-2 bg-gray-900/10">
                <TabsList className="grid grid-cols-2 max-w-[300px] bg-gray-800/20 p-1 rounded-lg mb-4 md:mb-0 backdrop-blur-sm">
                  <TabsTrigger 
                    value="sectors" 
                    className="text-gray-300/80 data-[state=active]:bg-gray-600/30 data-[state=active]:text-blue-300/90 border-0"
                  >
                    <PieChart className="h-4 w-4 mr-1" />
                    Sectors
                  </TabsTrigger>
                  <TabsTrigger 
                    value="stocks" 
                    className="text-gray-300/80 data-[state=active]:bg-gray-600/30 data-[state=active]:text-blue-300/90 border-0"
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Stocks
                  </TabsTrigger>
                </TabsList>

                <div className="flex flex-wrap gap-2">
                  {(["All", "Large Cap", "Mid Cap", "Small Cap"] as MarketCapType[]).map((cap) => (
                    <button
                      key={cap}
                      onClick={() => setActiveMarketCap(cap)}
                      className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                        activeMarketCap === cap
                          ? "bg-gradient-to-br from-blue-500/30 to-purple-500/30 text-blue-300 shadow-glow-blue"
                          : "bg-gray-700/20 text-gray-300/80 hover:bg-gray-600/30"
                      }`}
                    >
                      {cap}
                    </button>
                  ))}
                </div>
              </div>

              <TabsContent value="sectors" className="p-4">
  <div className="rounded-lg border border-gray-600/20 overflow-hidden">
    <div className="p-4 bg-gray-800/20 flex flex-wrap gap-2">
      <input
        type="text"
        placeholder="Filter sectors..."
        className="bg-gray-700/20 text-gray-100 px-3 py-1.5 rounded-md text-sm flex-grow"
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
      />
    </div>
    
    <div className="h-[600px] overflow-auto relative">
      <table className="w-full" style={{ minWidth: isMobile ? '700px' : 'auto' }}>
        <thead className="bg-gray-800/20 backdrop-blur-sm sticky top-0 z-10">
          <tr>
            {[
              { key: 'name', label: 'Sector', width: 250 },
              { key: 'allocation', label: 'Allocation', width: 150 },
              { key: 'latestValue', label: 'Latest Value', width: 150 },
              { key: 'investedValue', label: 'Invested', width: 150 },
              { key: 'performance', label: '1M Performance', width: 200 },
            ].map((column) => (
              <th
                key={column.key}
                className="text-left py-3 px-4 text-sm font-semibold text-gray-300/80"
                style={{ width: column.width }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="cursor-pointer hover:text-blue-300 transition-colors"
                    onClick={() => {
                      if (column.key === 'name' || column.key === 'allocation') {
                        setSortConfig({
                          key: column.key === 'allocation' ? 'weight' : column.key,
                          direction: sortConfig?.key === column.key ? 
                            (sortConfig.direction === 'asc' ? 'desc' : 'asc') : 'desc'
                        });
                      }
                    }}
                  >
                    {column.label}
                    {(sortConfig?.key === (column.key === 'allocation' ? 'weight' : column.key)) && (
                      <span className="ml-1 text-xs">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </span>
                  <div className="w-1 bg-gray-600/30 hover:bg-blue-400 cursor-col-resize" />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody className="divide-y divide-gray-600/20">
        {currentSectorData
  .filter(sector => 
    sector.name.toLowerCase().includes(filterText.toLowerCase())
  )
  .sort((a, b) => {
    if (!sortConfig) return 0;
    
    const key = sortConfig.key as keyof SectorData; // ✅ Cast key properly
    const direction = sortConfig.direction === 'asc' ? 1 : -1;
  
    if (key === 'weight') return (b.weight - a.weight) * direction;
    if (key === 'name') return a.name.localeCompare(b.name) * direction;
  
    // Ensure values exist before processing
    const aValue = a[key];
    const bValue = b[key];
  
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      // Handle currency values
      const parsedA = parseFloat(aValue.replace(/[^0-9.]/g, '')) || 0;
      const parsedB = parseFloat(bValue.replace(/[^0-9.]/g, '')) || 0;
      return (parsedB - parsedA) * direction;
    }
  
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return (bValue - aValue) * direction;
    }
  
    return 0;
  })
 

            
            .map((sector, index) => (
              <motion.tr
                key={sector.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-700/10 cursor-pointer group"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <div
                      className="h-2 w-2 rounded-full mr-3"
                      style={{ 
                        background: getSectorColor(sector.name),
                        boxShadow: `0 0 8px ${getSectorColor(sector.name)}40`
                      }}
                    />
                    <span className="text-sm font-medium text-gray-100/90">
                      {sector.name}
                    </span>
                  </div>
                </td>
                
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={sector.weight} 
                      className="h-2 w-24 bg-gray-700/30"
                      style={{ 
                        backgroundImage: getSectorColor(sector.name),
                        backgroundSize: '200% 200%'
                      }}
                    />
                    <span className="text-sm text-gray-300/80">
                      {sector.weight.toFixed(1)}%
                    </span>
                  </div>
                </td>
                
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-100/90 font-mono">
                    {sector.latestValue}
                  </span>
                </td>
                
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-300/80 font-mono">
                    {sector.investedValue}
                  </span>
                </td>
                
                <td className="py-3 px-4">
                  <div className="w-[150px] h-8">
                    <SparkLine
                      data={sector.performanceData}
                      width={150}
                      height={32}
                      margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
                    >
                      {(props) => (
                        <path
                          d={props.path || ''}
                          stroke={getSectorColor(sector.name)}
                          strokeWidth={1}
                          fill="none"
                        />
                      )}
                    </SparkLine>
                  </div>
                </td>
              </motion.tr>
            ))}
        </tbody>
      </table>
    </div>
  </div>
</TabsContent>
             

              <TabsContent value="stocks" className="p-4">
                <StockTable />
              </TabsContent>
            </Tabs>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-6 text-center text-xs text-gray-400/50"
        >
          Data updated: {new Date().toLocaleDateString()}
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
    </div>
  );
};

export default Portfolio;
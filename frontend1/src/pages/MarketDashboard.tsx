import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, 
  LineChartIcon, AlertCircleIcon, SearchIcon,
  ExternalLinkIcon, ChevronRightIcon, ActivityIcon,
  Layers, Bell, BarChart3, TrendingDown, XIcon
} from "lucide-react";
import Papa from "papaparse";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12
    }
  }
};

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

// CSV Configuration
const CSV_URL = "merged_symbols.csv";
type CsvStock = {
  Symbol: string;
  "Security Name": string;
};

// Market Data Types
interface MarketDataItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percentChange: number;
  status: "up" | "down";
  volume: string;
}

interface TopPerformer {
  name: string;
  change: number;
}

interface DowData {
  value: number;
  change: number;
  percentChange: number;
}

interface AdvanceDecline {
  advance: number;
  decline: number;
}

interface InstitutionalActivity {
  date: string;
  netBuying: number;
  netSelling: number;
}

interface ActiveStock {
  symbol: string;
  company: string;
  price: number;
  change: number;
  value: number;
  status: "up" | "down";
}

interface USMarketData {
  dow: DowData;
  advanceDecline: AdvanceDecline;
  institutionalActivity: InstitutionalActivity[];
  activeStocks: ActiveStock[];
}

// Update your props interface
interface MarketDataProps {
  marketData: MarketDataItem[];
  topPerformers: TopPerformer[];
  usMarketData: USMarketData;
}

const MAX_SUGGESTIONS = 6;

const MarketDashboard: React.FC<MarketDataProps> = ({ marketData, topPerformers, usMarketData }) => {
  // States for search functionality
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState<MarketDataItem[]>(marketData);
  const [timeframe, setTimeframe] = useState("1D");
  const [marketView, setMarketView] = useState("dow");
  const [institutionalView, setInstitutionalView] = useState("buying");
  const [chartHovered, setChartHovered] = useState(false);
  
  // Advanced search states
  const [csvData, setCsvData] = useState<CsvStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [stockSuggestions, setStockSuggestions] = useState<CsvStock[]>([]);
  const [highlightedSuggestion, setHighlightedSuggestion] = useState(-1);
  
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load CSV data on component mount
  useEffect(() => {
    fetch(CSV_URL)
      .then(response => response.text())
      .then(data => {
        const results = Papa.parse<CsvStock>(data, {
          header: true,
          skipEmptyLines: true
        });
        
        if (results.errors.length > 0) {
          setError("CSV parsing errors: " + results.errors.map(e => e.message).join(', '));
          return;
        }
        
        setCsvData(results.data);
        setIsLoading(false);
      })
      .catch(err => {
        setError("Failed to load stock symbols: " + err.message);
        setIsLoading(false);
      });
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation for suggestions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedSuggestion(prev => 
            prev < stockSuggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedSuggestion(prev => prev > 0 ? prev - 1 : 0);
          break;
        case 'Enter':
          if (highlightedSuggestion >= 0 && highlightedSuggestion < stockSuggestions.length) {
            handleSuggestionSelect(stockSuggestions[highlightedSuggestion]);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSuggestions, highlightedSuggestion, stockSuggestions]);

  // Handle search functionality
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim() === "") {
      setFilteredData(marketData);
      setShowSuggestions(false);
      setStockSuggestions([]);
      return;
    }
    
    // Filter market data for the table
    const filtered = marketData.filter(
      stock => 
        stock.symbol.toLowerCase().includes(term.toLowerCase()) || 
        stock.name.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredData(filtered);
    
    // Generate suggestions from CSV data
    if (csvData && csvData.length > 0) {
      const suggestions = csvData
        .filter(stock => {
          const symbol = stock?.Symbol?.toLowerCase() || '';
          const securityName = stock?.['Security Name']?.toLowerCase() || '';
          return symbol.includes(term.toLowerCase()) || securityName.includes(term.toLowerCase());
        })
        .slice(0, MAX_SUGGESTIONS);
      
      setStockSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
      setHighlightedSuggestion(-1);
    }
  };

  const handleSuggestionSelect = (suggestion: CsvStock) => {
    // Find if the stock exists in our market data
    const stockMatch = marketData.find(s => s.symbol === suggestion.Symbol);
    
    if (stockMatch) {
      setSearchTerm(stockMatch.symbol);
      setFilteredData([stockMatch]);
    } else {
      // Handle case when stock is in CSV but not in our market data
      setSearchTerm(suggestion.Symbol);
      setFilteredData([]);
    }
    
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setFilteredData(marketData);
    setShowSuggestions(false);
  };

  // Time periods for chart selection
  const timePeriods = ["1D", "5D", "1M", "3M", "6M", "1Y", "2Y"];

  // Generate chart points based on market data
  const generateChartPoints = () => {
    const isPositive = usMarketData.dow.change > 0;

    // Path for positive or negative trend
    if (isPositive) {
      return "M0,50 C20,48 40,45 60,40 C80,35 100,30 120,35 C140,40 160,25 180,20 C200,15 220,10 240,15 C260,20 280,25 300,20";
    } else {
      return "M0,20 C20,25 40,30 60,35 C80,40 100,45 120,40 C140,35 160,50 180,55 C200,60 220,65 240,60 C260,55 280,50 300,55";
    }
  };

  // Error display component
  const ErrorDisplay = ({ error }: { error: string | null }) => {
    if (!error) return null;
    
    return (
      <motion.div 
        className="mb-4 p-4 bg-red-900/30 rounded-lg border border-red-700/40 flex items-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <AlertCircleIcon className="w-5 h-5 mr-2 text-red-400" />
        <span className="text-red-300">{error}</span>
      </motion.div>
    );
  };

  return (
    <motion.div 
      className="max-w-7xl mx-auto w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Live Market Indicator */}
      <motion.div
        variants={fadeInUp}
        className="flex justify-between items-center mb-6"
      >
        <div className="flex items-center">
          <ActivityIcon className="w-5 h-5 mr-2 text-blue-500" />
          <span className="text-sm font-medium text-gray-400">Live Market Data</span>
          <div className="ml-3 w-2 h-2 rounded-full bg-green-500 animate-pulse-subtle"></div>
        </div>
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-400 mr-2">Last update: Just now</span>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20">
            NYSE: Open
          </Badge>
        </div>
      </motion.div>

      {/* Display errors if any */}
      {error && <ErrorDisplay error={error} />}

      {/* Main Market Dashboard */}
      <motion.div variants={itemVariants}>
        <Card className="glassmorphism mb-8 overflow-hidden">
          <CardHeader className="pb-3 border-b border-gray-800">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-medium flex items-center text-gray-100">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                Market Dashboard
              </CardTitle>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                Live Data
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left: Most Active Stocks */}
              <motion.div 
                className="glassmorphism-light rounded-lg p-4 hover-lift"
                whileHover={{ scale: 1.005 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-medium text-blue-400 flex items-center">
                    <TrendingUpIcon className="w-4 h-4 mr-1.5" />
                    Most Active Stocks
                  </h3>
                  <Badge className="bg-transparent hover:bg-blue-500/10 border border-blue-500/30 text-blue-400 cursor-pointer">
                    <a href="#" className="flex items-center text-xs">
                      View Details <ExternalLinkIcon className="w-3 h-3 ml-1" />
                    </a>
                  </Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs border-b border-gray-800">
                        <th className="text-left py-2 font-medium text-gray-400">Symbol</th>
                        <th className="text-left py-2 font-medium text-gray-400">Company</th>
                        <th className="text-right py-2 font-medium text-gray-400">Price</th>
                        <th className="text-right py-2 font-medium text-gray-400">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usMarketData.activeStocks.map((stock, index) => (
                        <motion.tr 
                          key={index} 
                          className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ backgroundColor: "rgba(31, 41, 55, 0.4)" }}
                        >
                          <td className="py-2.5 text-sm font-semibold text-blue-500">{stock.symbol}</td>
                          <td className="py-2.5 text-sm font-medium text-gray-300">{stock.company}</td>
                          <td className="py-2.5 text-right text-sm font-medium text-gray-300">${stock.price.toFixed(2)}</td>
                          <td className={`py-2.5 text-right text-sm font-medium flex items-center justify-end ${stock.status === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                            {stock.status === 'up' ? 
                              <ArrowUpIcon className="w-3 h-3 mr-1" /> : 
                              <ArrowDownIcon className="w-3 h-3 mr-1" />
                            }
                            {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 text-right">
                    <a href="#" className="text-blue-400 hover:text-blue-300 text-xs flex items-center justify-end group">
                      View All Active Stocks 
                      <ChevronRightIcon className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Center: Index Chart */}
              <motion.div 
                className="glassmorphism-light rounded-lg p-4 hover-lift"
                whileHover={{ scale: 1.005 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-3">
                  <Tabs defaultValue="dow" onValueChange={setMarketView} className="w-full">
                    <TabsList className="grid grid-cols-2 mb-2 bg-gray-800/50 p-0.5">
                      <TabsTrigger value="dow" className="text-sm text-gray-400 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
                        Dow Jones
                      </TabsTrigger>
                      <TabsTrigger value="snp" className="text-sm text-gray-400 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
                        S&P 500
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {timePeriods.map((period) => (
                      <Button 
                        key={period} 
                        variant="outline"
                        size="sm"
                        onClick={() => setTimeframe(period)}
                        className={`px-2.5 py-0.5 text-xs h-7 ${timeframe === period 
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' 
                          : 'bg-gray-800/50 text-gray-400 border-gray-700 hover:bg-gray-700/50 hover:text-gray-300'}`}
                      >
                        {period}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="text-center mb-2">
                  <div className="flex items-baseline justify-center">
                    <motion.span 
                      className="text-2xl font-bold mr-3 text-gray-100"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      {usMarketData.dow.value.toLocaleString()}
                    </motion.span>
                    <motion.span 
                      className={`text-sm font-medium ${usMarketData.dow.percentChange < 0 ? 'text-red-400' : 'text-green-400'}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      {usMarketData.dow.change > 0 ? '+' : ''}
                      {usMarketData.dow.change.toFixed(2)} ({usMarketData.dow.percentChange.toFixed(2)}%)
                    </motion.span>
                  </div>
                </div>
                <motion.div 
                  className="mt-2 h-36 w-full bg-gray-800/40 rounded-md relative overflow-hidden border border-gray-700"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  onHoverStart={() => setChartHovered(true)}
                  onHoverEnd={() => setChartHovered(false)}
                >
                  {/* Animated Line Chart */}
                  <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end">
                    <motion.svg 
                      width="100%" height="100%" 
                      viewBox="0 0 300 100" 
                      preserveAspectRatio="none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={usMarketData.dow.change > 0 ? "rgba(52, 211, 153, 0.2)" : "rgba(248, 113, 113, 0.2)"} />
                          <stop offset="100%" stopColor="rgba(30, 41, 59, 0)" />
                        </linearGradient>
                        <clipPath id="chartClip">
                          <path d={`${generateChartPoints()} L300,100 L0,100 Z`} />
                        </clipPath>
                      </defs>
                      
                      {/* Area fill */}
                      <motion.path 
                        d={`${generateChartPoints()} L300,100 L0,100 Z`}
                        fill="url(#chartGradient)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                      />
                      
                      {/* Line path */}
                      <motion.path 
                        d={generateChartPoints()}
                        fill="none" 
                        stroke={usMarketData.dow.change > 0 ? "#10b981" : "#f43f5e"} 
                        strokeWidth="1.5"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                      />
                      
                      {/* Data points */}
                      <motion.g>
                        <motion.circle cx="0" cy="50" r="3" fill={usMarketData.dow.change > 0 ? "#10b981" : "#f43f5e"} 
                          initial={{ opacity: 0 }} animate={{ opacity: chartHovered ? 1 : 0 }} transition={{ duration: 0.3 }} />
                        <motion.circle cx="60" cy="40" r="3" fill={usMarketData.dow.change > 0 ? "#10b981" : "#f43f5e"} 
                          initial={{ opacity: 0 }} animate={{ opacity: chartHovered ? 1 : 0 }} transition={{ duration: 0.3, delay: 0.1 }} />
                        <motion.circle cx="120" cy="35" r="3" fill={usMarketData.dow.change > 0 ? "#10b981" : "#f43f5e"} 
                          initial={{ opacity: 0 }} animate={{ opacity: chartHovered ? 1 : 0 }} transition={{ duration: 0.3, delay: 0.2 }} />
                        <motion.circle cx="180" cy="20" r="3" fill={usMarketData.dow.change > 0 ? "#10b981" : "#f43f5e"} 
                          initial={{ opacity: 0 }} animate={{ opacity: chartHovered ? 1 : 0 }} transition={{ duration: 0.3, delay: 0.3 }} />
                        <motion.circle cx="240" cy="15" r="3" fill={usMarketData.dow.change > 0 ? "#10b981" : "#f43f5e"} 
                          initial={{ opacity: 0 }} animate={{ opacity: chartHovered ? 1 : 0 }} transition={{ duration: 0.3, delay: 0.4 }} />
                        <motion.circle cx="300" cy="20" r="3" fill={usMarketData.dow.change > 0 ? "#10b981" : "#f43f5e"} 
                          initial={{ opacity: 0 }} animate={{ opacity: chartHovered ? 1 : 0 }} transition={{ duration: 0.3, delay: 0.5 }} />
                      </motion.g>
                    </motion.svg>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 px-2 pt-1 pb-1 bg-gray-800/40">
                    <span>9:30</span>
                    <span>12:00</span>
                    <span>16:00</span>
                  </div>
                </motion.div>
                <div className="mt-2 text-center">
                  <span className="text-xs text-gray-500">Market {usMarketData.dow.change > 0 ? "Up" : "Down"} • Trading Volume: 3.42B shares</span>
                </div>
              </motion.div>

              {/* Right: Advance/Decline and Institutional Activity */}
              <div className="space-y-4">
                {/* Advance/Decline */}
                <motion.div 
                  className="glassmorphism-light rounded-lg p-4 hover-lift"
                  whileHover={{ scale: 1.005 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-medium text-blue-400 flex items-center">
                      <Layers className="w-4 h-4 mr-1.5" />
                      Advance / Decline
                    </h3>
                    <span className="text-xs text-gray-500">NYSE</span>
                  </div>
                  <div className="relative h-8 bg-gray-800/70 rounded-md overflow-hidden border border-gray-700">
                    <motion.div 
                      className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-green-600/80 to-green-500/80" 
                      initial={{ width: 0 }}
                      animate={{ width: `${(usMarketData.advanceDecline.advance / (usMarketData.advanceDecline.advance + usMarketData.advanceDecline.decline)) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    ></motion.div>
                    <motion.div 
                      className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-red-600/80 to-red-500/80" 
                      initial={{ width: 0 }}
                      animate={{ width: `${(usMarketData.advanceDecline.decline / (usMarketData.advanceDecline.advance + usMarketData.advanceDecline.decline)) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    ></motion.div>
                    <div className="absolute inset-0 flex justify-between items-center px-4 text-xs font-medium">
                      <motion.div 
                        className="flex items-center text-gray-100"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <span className="mr-1 font-bold text-sm">+{usMarketData.advanceDecline.advance}</span>
                        <ArrowUpIcon className="w-3 h-3 text-green-400" />
                      </motion.div>
                      <motion.div 
                        className="flex items-center text-gray-100"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <ArrowDownIcon className="w-3 h-3 text-red-400 mr-1" />
                        <span className="font-bold text-sm">-{usMarketData.advanceDecline.decline}</span>
                      </motion.div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between items-center text-xs text-gray-400">
                    <div>Advancing: {((usMarketData.advanceDecline.advance / (usMarketData.advanceDecline.advance + usMarketData.advanceDecline.decline)) * 100).toFixed(1)}%</div>
                    <div>Declining: {((usMarketData.advanceDecline.decline / (usMarketData.advanceDecline.advance + usMarketData.advanceDecline.decline)) * 100).toFixed(1)}%</div>
                  </div>
                </motion.div>

                {/* Institutional Activity */}
                <motion.div 
                  className="glassmorphism-light rounded-lg p-4 hover-lift"
                  whileHover={{ scale: 1.005 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-3">
                    <h3 className="text-base font-medium text-blue-400 flex items-center mb-3">
                      <Bell className="w-4 h-4 mr-1.5" />
                      Institutional Activity
                    </h3>
                    <Tabs defaultValue="buying" onValueChange={setInstitutionalView} className="w-full">
                      <TabsList className="grid grid-cols-2 mb-2 bg-gray-800/50 p-0.5">
                        <TabsTrigger value="buying" className="text-xs text-gray-400 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
                          Net Buying
                        </TabsTrigger>
                        <TabsTrigger value="selling" className="text-xs text-gray-400 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
                          Net Selling
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-xs border-b border-gray-800">
                          <th className="text-left py-2 font-medium text-gray-400">Date</th>
                          <th className="text-right py-2 font-medium text-gray-400">Net Buying</th>
                          <th className="text-right py-2 font-medium text-gray-400">Net Selling</th>
                        </tr>
                      </thead>
                      <tbody>
                      {usMarketData.institutionalActivity.map((item, index) => (
  <motion.tr 
    key={index} 
    className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer"
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ backgroundColor: "rgba(31, 41, 55, 0.4)" }}
  >
    <td className="py-2 text-sm font-medium text-gray-300">{item.date}</td>
    <td className="py-2 text-right text-sm font-medium text-green-400">${item.netBuying.toLocaleString()}</td>
    <td className="py-2 text-right text-sm font-medium text-red-400">${item.netSelling.toLocaleString()}</td>
  </motion.tr>
))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stock Lookup and Search */}
      <motion.div variants={itemVariants}>
        <Card className="glassmorphism mb-8">
          <CardHeader className="pb-3 border-b border-gray-800">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-medium flex items-center text-gray-100">
                <SearchIcon className="w-5 h-5 mr-2 text-blue-500" />
                Stock Search
              </CardTitle>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                {marketData.length} Stocks
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="mb-6 relative">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  ref={searchInputRef}
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-9 pr-9 py-2 bg-gray-900/70 border-gray-700 focus:border-blue-500/50 focus:ring-blue-500/30"
                  placeholder="Search by symbol or company name..."
                />
                {searchTerm && (
                  <button 
                    onClick={clearSearch} 
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Stock Suggestions */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div 
                    ref={suggestionsRef}
                    className="absolute z-10 mt-1 w-full bg-gray-900 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ul className="py-1">
                      {stockSuggestions.map((suggestion, index) => (
                        <li 
                          key={index} 
                          className={`px-4 py-2 hover:bg-gray-800 cursor-pointer flex justify-between items-center ${
                            index === highlightedSuggestion ? 'bg-gray-800' : ''
                          }`}
                          onClick={() => handleSuggestionSelect(suggestion)}
                          onMouseEnter={() => setHighlightedSuggestion(index)}
                        >
                          <div>
                            <span className="font-medium text-blue-400 mr-2">{suggestion.Symbol}</span>
                            <span className="text-sm text-gray-400">{suggestion['Security Name']}</span>
                          </div>
                          <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                        </li>
                      ))}
                      {stockSuggestions.length === 0 && (
                        <li className="px-4 py-2 text-gray-500 text-sm">No results found</li>
                      )}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.div 
              className="overflow-x-auto"
              variants={fadeInUp}
            >
              <Table>
                <TableHeader className="bg-gray-900/50">
                  <TableRow className="hover:bg-gray-800/50 border-gray-800">
                    <TableHead className="text-gray-400 font-medium">Symbol</TableHead>
                    <TableHead className="text-gray-400 font-medium">Company</TableHead>
                    <TableHead className="text-gray-400 font-medium text-right">Price</TableHead>
                    <TableHead className="text-gray-400 font-medium text-right">Change</TableHead>
                    <TableHead className="text-gray-400 font-medium text-right">% Change</TableHead>
                    <TableHead className="text-gray-400 font-medium text-right">Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item, index) => (
                    <TableRow 
                      key={index} 
                      className="hover:bg-gray-800/50 border-gray-800 cursor-pointer"
                    >
                      <TableCell className="font-semibold text-blue-500">{item.symbol}</TableCell>
                      <TableCell className="text-gray-300">{item.name}</TableCell>
                      <TableCell className="text-right text-gray-300">${item.price.toFixed(2)}</TableCell>
                      <TableCell className={`text-right ${item.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        <div className="flex items-center justify-end">
                          {item.change >= 0 ? 
                            <ArrowUpIcon className="w-3 h-3 mr-1" /> : 
                            <ArrowDownIcon className="w-3 h-3 mr-1" />
                          }
                          {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell className={`text-right ${item.percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {item.percentChange >= 0 ? '+' : ''}{item.percentChange.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right text-gray-300">{item.volume}</TableCell>
                    </TableRow>
                  ))}
                  {filteredData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-t-blue-500 border-gray-700 rounded-full animate-spin mr-2"></div>
                            Loading stocks...
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <AlertCircleIcon className="w-6 h-6 mb-2 text-gray-500" />
                            No stocks found matching "{searchTerm}"
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </motion.div>
            {filteredData.length > 0 && (
              <div className="mt-4 text-xs text-gray-500 text-right">
                Showing {filteredData.length} of {marketData.length} stocks
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Performers */}
      <motion.div variants={itemVariants}>
        <Card className="glassmorphism mb-8">
          <CardHeader className="pb-3 border-b border-gray-800">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-medium flex items-center text-gray-100">
                <TrendingUpIcon className="w-5 h-5 mr-2 text-blue-500" />
                Top Performers
              </CardTitle>
              <Button variant="outline" size="sm" className="bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topPerformers.map((performer, index) => (
               <motion.div 
               key={index}
               className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 hover-lift"
               whileHover={{ scale: 1.005 }}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ 
                 duration: 0.2,
                 delay: index * 0.1 
               }}
             >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-200">{performer.name}</h3>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      <span className="flex items-center">
                        <TrendingUpIcon className="w-3 h-3 mr-1" />
                        +{performer.change.toFixed(2)}%
                      </span>
                    </Badge>
                  </div>
                  <div className="h-10 w-full relative">
                    <div className="absolute inset-0">
                      <svg width="100%" height="100%" viewBox="0 0 100 30">
                        <path 
                          d="M0,15 C10,13 20,8 30,15 C40,22 50,25 60,20 C70,15 80,10 90,5 L100,0" 
                          stroke="#10b981" 
                          strokeWidth="1.5"
                          fill="none"
                        />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer Message */}
      <motion.div 
        variants={fadeInUp}
        className="text-center text-gray-500 text-sm mb-8"
      >
        <p>Data refreshes automatically every 5 minutes. Last update: Just now</p>
      </motion.div>
    </motion.div>
  );
};

export default MarketDashboard;
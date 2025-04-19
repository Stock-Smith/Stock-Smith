import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../context/AuthContext";
import Papa from "papaparse";
import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
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
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  TrendingUpIcon, 
  BarChart2Icon, 
  AlertCircleIcon,
  SearchIcon,
  LogInIcon,
  UserPlusIcon,
  ExternalLinkIcon,
  LoaderIcon,
  XIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

// CSV Configuration
const CSV_URL = "merged_symbols.csv";
type CsvStock = {
  Symbol: string;
  "Security Name": string;
};


// Mock Data Interfaces
interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percentChange: number;
  status: "up" | "down";
  volume: string;
}

interface ActiveStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  value: number;
  status: "up" | "down";
}

// Mock Data
const mockMarketData: MarketData[] = [
  { symbol: "AAPL", name: "Apple Inc.", price: 189.45, change: 2.37, percentChange: 1.27, status: "up", volume: "32.4M" },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 128.63, change: -1.95, percentChange: -1.49, status: "down", volume: "18.7M" },
  { symbol: "MSFT", name: "Microsoft Corporation", price: 332.87, change: 1.22, percentChange: 0.37, status: "up", volume: "24.2M" },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: 176.29, change: 0.56, percentChange: 0.32, status: "up", volume: "21.1M" }
];
// Add this right after the mockMarketData declaration
const topPerformers = [
  { name: "Technology", change: 2.4 },
  { name: "Healthcare", change: 1.8 },
  { name: "Consumer", change: 0.9 }
];

const chartData = [
  { time: '09:30', value: 38500 },
  { time: '10:00', value: 38620 },
  { time: '10:30', value: 38750 },
  { time: '11:00', value: 38680 },
  { time: '11:30', value: 38800 },
  { time: '12:00', value: 38720 },
  { time: '12:30', value: 38650 },
  { time: '13:00', value: 38590 },
  { time: '13:30', value: 38630 },
  { time: '14:00', value: 38540 },
  { time: '14:30', value: 38480 },
  { time: '15:00', value: 38560 },
  { time: '15:30', value: 38610 },
  { time: '16:00', value: 38530 },
];

const usMarketData = {
  dow: { value: 38623.74, change: -314.33, percentChange: -0.81 },
  advanceDecline: { advance: 153, decline: 347 },
  institutionalActivity: [
    { date: "2025-03-08", netBuying: 11246.82, netSelling: -9308.63 },
    { date: "2025-03-07", netBuying: 8726.54, netSelling: -7427.11 }
  ]
};

// Animation Configurations
const scrollVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20, duration: 0.5 }
  }
};

const tableRowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.3 }
  })
};

const MAX_SUGGESTIONS = 10;

const SkeletonRow = () => (
  <TableRow>
    <TableCell><div className="h-4 bg-gray-700 rounded w-12 animate-pulse" /></TableCell>
    <TableCell><div className="h-4 bg-gray-700 rounded w-32 animate-pulse" /></TableCell>
    <TableCell><div className="h-4 bg-gray-700 rounded w-16 animate-pulse ml-auto" /></TableCell>
    <TableCell><div className="h-4 bg-gray-700 rounded w-16 animate-pulse" /></TableCell>
  </TableRow>
);

const Home = () => {
  // State Management
  const [isLoading, setIsLoading] = useState(true);
  const [csvData, setCsvData] = useState<CsvStock[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState<MarketData[]>([]);
  const [timeframe, setTimeframe] = useState('1D');
  const [activeStockSearchTerm, setActiveStockSearchTerm] = useState('');
  const [activeStockSuggestions, setActiveStockSuggestions] = useState<CsvStock[]>([]);
  const [showActiveSuggestions, setShowActiveSuggestions] = useState(false);
  const [filteredActiveStocks, setFilteredActiveStocks] = useState<ActiveStock[]>([]);
  const [stockHighlightIndex, setStockHighlightIndex] = useState<number | null>(null);
  const [selectedStock, setSelectedStock] = useState<MarketData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs and Animations
  const heroRef = useRef<HTMLDivElement>(null);
  const activeSuggestionsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const shouldReduceMotion = useReducedMotion();
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const { isAuthenticated, user } = useAuthStore();

  // CSV Data Loading
// Update the CSV parsing useEffect
useEffect(() => {
  fetch(CSV_URL)
    .then(response => response.text())
    .then(data => {
      console.log("Raw CSV data:", data);
      
      const results = Papa.parse<CsvStock>(data, {
        header: true,
        skipEmptyLines: true
      });
      
      console.log("Parsed results:", results);
      
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

  // Search Handlers
  // Update the handleSearch function with null checks
const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
  const term = e.target.value.trim().toLowerCase();
  setSearchTerm(term);
  
  if (!term) {
    setFilteredData([]);
    return;
  }

  const results = csvData
    .filter(stock => {
      // Add null-safe checks
      const symbol = stock?.Symbol?.toLowerCase() || '';
      const securityName = stock?.['Security Name']?.toLowerCase() || '';
      return symbol.includes(term) || securityName.includes(term);
    })
    .map(csvStock => {
      const mock = mockMarketData.find(m => m.symbol === csvStock.Symbol);
      return mock || {
        symbol: csvStock.Symbol || 'N/A',
        name: csvStock['Security Name'] || 'Unknown Company',
      };
    });

  setFilteredData(results as MarketData[]);
};

const ErrorDisplay = ({ error }: { error: string | null }) => {
  if (!error) return null;
  
  return (
    <div className="mb-4 p-4 bg-red-900/30 rounded-lg border border-red-700/40 flex items-center">
      <AlertCircleIcon className="w-5 h-5 mr-2 text-red-400" />
      <span className="text-red-300">{error}</span>
    </div>
  );
};

const handleActiveStockSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
  const term = e.target.value;
  setActiveStockSearchTerm(term);
  
  const suggestions = csvData
    .filter(stock => {
      const symbol = stock?.Symbol?.toLowerCase() || '';
      const securityName = stock?.['Security Name']?.toLowerCase() || '';
      return (
        symbol.startsWith(term.toLowerCase()) ||
        securityName.includes(term.toLowerCase())
      );
    })
    .slice(0, MAX_SUGGESTIONS);
  
  setActiveStockSuggestions(suggestions);
  setShowActiveSuggestions(term.length > 0);
};

  // Stock Selection Handlers
  const handleSuggestionClick = (suggestion: CsvStock) => {
    setActiveStockSearchTerm('');
    setShowActiveSuggestions(false);

    const mockData = mockMarketData.find(m => m.symbol === suggestion.Symbol);
    const newStock: ActiveStock = {
      symbol: suggestion.Symbol,
      name: suggestion['Security Name'],
      price: mockData?.price || 0,
      change: mockData?.change || 0,
      value: (mockData?.price || 0) * 1000,
      status: mockData?.status || 'up'
    };

    setFilteredActiveStocks(prev => [...prev, newStock]);
    setSelectedStock(mockData || {
      symbol: suggestion.Symbol,
      name: suggestion['Security Name'],
      price: 0,
      change: 0,
      percentChange: 0,
      status: 'up',
      volume: 'N/A'
    });
  };

  const handleStockClick = (symbol: string) => {
    const stock = mockMarketData.find(m => m.symbol === symbol) || 
      filteredData.find(f => f.symbol === symbol);
    if (stock) setSelectedStock(stock);
  };

  // UI Helpers
  const highlightStock = (index: number) => {
    setStockHighlightIndex(index);
    setTimeout(() => setStockHighlightIndex(null), 1500);
  };

  const clearSearch = () => {
    setActiveStockSearchTerm('');
    setActiveStockSuggestions([]);
    setShowActiveSuggestions(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 p-6">
      {/* Hero Section */}
      <motion.div 
        ref={heroRef}
        style={{ scale: shouldReduceMotion ? 1 : heroScale, opacity: shouldReduceMotion ? 1 : heroOpacity }}
        className="flex flex-col items-center justify-center mb-12 pt-12 space-y-6 bg-gray-900/20 backdrop-blur-sm rounded-2xl border border-white/10 p-8"
      >
        <div className="flex items-center mb-2">
          <BarChart2Icon className="w-10 h-10 mr-3 text-blue-400 animate-pulse" />
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-gradient-x">
            Stock-Smith
          </h1>
        </div>
        <p className="text-xl text-gray-200 max-w-2xl text-center leading-relaxed">
          Your intelligent companion for market insights and investment decisions powered by AI analytics
        </p>

        {!isAuthenticated ? (
          <div className="flex gap-4 mb-8">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium px-8 py-6 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all duration-200 transform hover:-translate-y-1 hover:scale-105 flex items-center gap-2"
              asChild
            >
              <Link to="/auth?type=login">
                <LogInIcon className="w-5 h-5" />
                <span className="text-lg">Login</span>
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-gray-800/70 border-2 border-blue-500/50 text-blue-400 hover:bg-blue-900/20 hover:text-blue-300 font-medium px-8 py-6 rounded-xl shadow-lg hover:shadow-blue-500/10 transition-all duration-200 transform hover:-translate-y-1 hover:scale-105 flex items-center gap-2"
              asChild
            >
              <Link to="/auth?type=signup">
                <UserPlusIcon className="w-5 h-5" />
                <span className="text-lg">Sign Up</span>
              </Link>
            </Button>
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
          >
            <Card className="mb-6 bg-gray-800/30 backdrop-blur-md border border-white/10 shadow-xl hover:shadow-blue-900/20 transition hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <p className="text-xl font-semibold text-gray-200">
                  Welcome back, <span className="text-blue-400">{user?.name}</span>!
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/30 rounded-lg border border-red-700/40 flex items-center">
          <AlertCircleIcon className="w-5 h-5 mr-2 text-red-400" />
          <span className="text-red-300">{error}</span>
        </div>
      )}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ margin: "0px 0px -100px 0px", once: false }}
        variants={shouldReduceMotion ? undefined : scrollVariants}
      >
        <Card className="bg-gray-800/30 backdrop-blur-lg border border-white/10 shadow-2xl mb-8">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold flex items-center">
                <BarChart2Icon className="w-5 h-5 mr-2 text-blue-400" />
                Market Dashboard
              </CardTitle>
              <Badge variant="outline" className="bg-blue-900/30 text-blue-300 border-blue-700">
                Live Data
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Active Stocks Panel */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ margin: "0px 0px -50px 0px" }}
                variants={shouldReduceMotion ? undefined : scrollVariants}
              >
                <div className="bg-gray-900/20 backdrop-blur-md rounded-xl p-4 border border-white/10">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium text-blue-300">Most Active Stocks</h3>
                    <Badge className="bg-gray-800/50 hover:bg-gray-700 cursor-pointer">
                      <Link to="#" className="flex items-center text-xs text-blue-300">
                        Options <ExternalLinkIcon className="w-3 h-3 ml-1" />
                      </Link>
                    </Badge>
                  </div>


                  {/* Search input for active stocks with suggestions */}
                  <div className="relative mb-4">
                    <div className="flex items-center relative">
                      <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input 
                        ref={searchInputRef}
                        type="text" 
                        placeholder="Search active stocks..." 
                        value={activeStockSearchTerm}
                        onChange={handleActiveStockSearch}
                        className="pl-8 py-1 h-9 text-sm bg-gray-900/30 border-gray-700 text-white placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500 pr-8"
                      />
                      {activeStockSearchTerm && (
                        <button onClick={clearSearch} className="absolute right-2 top-2 text-gray-400 hover:text-gray-300">
                          <XIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {showActiveSuggestions && activeStockSuggestions.length > 0 && (
                      <div 
                        ref={activeSuggestionsRef}
                        className="absolute z-10 mt-1 w-full bg-gray-800 rounded-md shadow-lg border border-gray-700 max-h-60 overflow-auto"
                      >
                        {activeStockSuggestions.map((suggestion) => (
                          <div
                            key={suggestion.Symbol}
                            className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-700 text-sm"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            <span className="font-medium text-blue-400 mr-2">{suggestion.Symbol}</span>
                            <span className="text-gray-300 truncate">{suggestion['Security Name']}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {isLoading ? (
                     <table className="w-full">
                     <tbody>
                       <SkeletonRow />
                       <SkeletonRow />
                       <SkeletonRow />
                     </tbody>
                   </table>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-sm border-b border-white/10">
                            <th className="text-left py-2 font-semibold text-white">Symbol</th>
                            <th className="text-left py-2 font-semibold text-white">Company</th>
                            <th className="text-right py-2 font-semibold text-white">Price</th>
                            <th className="text-right py-2 font-semibold text-white">Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredActiveStocks.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center py-6">
                                <p className="text-gray-400">No active stocks selected</p>
                              </td>
                            </tr>
                          ) : (
                            filteredActiveStocks.map((stock, index) => (
                              <motion.tr 
                                key={stock.symbol}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className={`border-b border-white/10 hover:bg-gray-800/30 cursor-pointer transition-colors group ${
                                  stockHighlightIndex === index ? 'bg-blue-900/30' : ''
                                }`}
                                onClick={() => {
                                  handleStockClick(stock.symbol);
                                  highlightStock(index);
                                }}
                              >
                                <td className="py-2 text-sm font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                                  {stock.symbol}
                                </td>
                                <td className="py-2 text-sm font-medium text-white">{stock.name}</td>
                                <td className="py-2 text-right text-sm font-medium text-white">
                                  ${stock.price.toFixed(2)}
                                </td>
                                <td className={`py-2 text-right text-sm font-medium ${
                                  stock.status === 'up' ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}
                                </td>
                              </motion.tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ margin: "0px 0px -50px 0px" }}
                variants={shouldReduceMotion ? undefined : scrollVariants}
                className="col-span-2"
              >
                <div className="bg-gray-900/20 backdrop-blur-md rounded-xl p-4 border border-white/10 h-full">
                  <div className="flex justify-between mb-3">
                    <h3 className="text-lg font-medium text-blue-300">Market Overview</h3>
                    <div className="flex space-x-2">
                      {["1D", "1W", "1M", "3M", "1Y"].map((tf) => (
                        <Badge 
                          key={tf}
                          variant={timeframe === tf ? "default" : "outline"}
                          className={`cursor-pointer ${
                            timeframe === tf 
                              ? "bg-blue-600 hover:bg-blue-700" 
                              : "bg-gray-800/30 hover:bg-gray-700/50 text-gray-300"
                          }`}
                          onClick={() => setTimeframe(tf)}
                        >
                          {tf}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="time" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "rgba(17, 24, 39, 0.8)", 
                            borderColor: "rgba(59, 130, 246, 0.5)",
                            color: "#fff"
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {selectedStock && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 bg-blue-900/20 border border-blue-700/40 rounded-lg"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-lg font-bold text-blue-300">{selectedStock.symbol}</h4>
                          <p className="text-sm text-gray-300">{selectedStock.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">${selectedStock.price.toFixed(2)}</p>
                          <p className={`text-sm ${selectedStock.status === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                            {selectedStock.change > 0 ? '+' : ''}{selectedStock.change.toFixed(2)}
                            {selectedStock.percentChange !== 0 && ` (${selectedStock.percentChange.toFixed(2)}%)`}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      {/* Search Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ margin: "0px 0px -100px 0px", once: false }}
        variants={shouldReduceMotion ? undefined : scrollVariants}
      >
        <Card className="bg-gray-800/30 backdrop-blur-lg border border-white/10 shadow-2xl mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              <SearchIcon className="w-5 h-5 mr-2 text-blue-400" />
              Search Stocks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-6">
              <SearchIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <Input 
                type="text" 
                placeholder="Search by symbol or company name..." 
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 bg-gray-900/20 border-gray-700 text-white placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Symbol</TableHead>
                    <TableHead className="text-gray-300">Name</TableHead>
                    <TableHead className="text-right text-gray-300">Price</TableHead>
                    <TableHead className="text-right text-gray-300">Change</TableHead>
                    <TableHead className="text-right text-gray-300">% Change</TableHead>
                    <TableHead className="text-right text-gray-300">Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <>
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                    </>
                  ) : filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        <p className="text-gray-400">No matching stocks found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((stock, i) => {
                      const mockStock = mockMarketData.find(m => m.symbol === stock.symbol);
                      return (
                        <motion.tr
                          key={stock.symbol}
                          custom={i}
                          variants={tableRowVariants}
                          initial="hidden"
                          animate="visible"
                          className="border-b border-gray-700 hover:bg-gray-800/30 cursor-pointer transition-colors"
                          onClick={() => handleStockClick(stock.symbol)}
                        >
                          <TableCell className="font-medium text-blue-400">{stock.symbol}</TableCell>
                          <TableCell>{stock.name}</TableCell>
                          <TableCell className="text-right">${mockStock?.price.toFixed(2) || 'N/A'}</TableCell>
                          <TableCell className={`text-right ${mockStock?.status === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                            {mockStock ? `${mockStock.change > 0 ? '+' : ''}${mockStock.change.toFixed(2)}` : 'N/A'}
                          </TableCell>
                          <TableCell className={`text-right ${mockStock?.status === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                            {mockStock ? `${mockStock.percentChange > 0 ? '+' : ''}${mockStock.percentChange.toFixed(2)}%` : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">{mockStock?.volume || 'N/A'}</TableCell>
                        </motion.tr>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      {/* Market Trends Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ margin: "0px 0px -100px 0px", once: false }}
        variants={shouldReduceMotion ? undefined : scrollVariants}
      >
        <Card className="bg-gray-800/30 backdrop-blur-lg border border-white/10 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              <TrendingUpIcon className="w-5 h-5 mr-2 text-blue-400" />
              Market Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="sector">
              <TabsList className="mb-6 bg-gray-900/30">
                <TabsTrigger value="sector">Sector Performance</TabsTrigger>
                <TabsTrigger value="institutional">Institutional Activity</TabsTrigger>
                <TabsTrigger value="advance">Advance/Decline</TabsTrigger>
              </TabsList>
              
              <TabsContent value="sector">
                <div className="space-y-4">
                  {topPerformers.map((sector, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-900/20 p-4 rounded-lg border border-white/10 flex justify-between items-center"
                    >
                      <h3 className="text-lg font-medium">{sector.name}</h3>
                      <div className="flex items-center text-green-400">
                        <ArrowUpIcon className="w-4 h-4 mr-1" />
                        <span>+{sector.change}%</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="institutional">
                <div className="space-y-4">
                  {usMarketData.institutionalActivity.map((day, index) => (
                    <div key={index} className="bg-gray-900/20 p-4 rounded-lg border border-white/10">
                      <h3 className="text-lg font-medium mb-3">{day.date}</h3>
                      <div className="flex flex-wrap gap-4">
                        <div className="bg-green-900/20 p-3 rounded border border-green-700/30 flex-1">
                          <p className="text-sm text-gray-300 mb-1">Net Buying</p>
                          <p className="text-green-400 text-lg font-semibold">
                            ${day.netBuying.toLocaleString()}M
                          </p>
                        </div>
                        <div className="bg-red-900/20 p-3 rounded border border-red-700/30 flex-1">
                          <p className="text-sm text-gray-300 mb-1">Net Selling</p>
                          <p className="text-red-400 text-lg font-semibold">
                            ${Math.abs(day.netSelling).toLocaleString()}M
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="advance">
                <div className="bg-gray-900/20 p-4 rounded-lg border border-white/10">
                  <h3 className="text-lg font-medium mb-3">S&P 500 Components</h3>
                  <div className="flex gap-4">
                    <div className="bg-green-900/20 p-3 rounded border border-green-700/30 flex-1">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-300">Advancing</p>
                        <ArrowUpIcon className="w-4 h-4 text-green-400" />
                      </div>
                      <p className="text-green-400 text-2xl font-semibold">
                        {usMarketData.advanceDecline.advance}
                      </p>
                    </div>
                    <div className="bg-red-900/20 p-3 rounded border border-red-700/30 flex-1">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-300">Declining</p>
                        <ArrowDownIcon className="w-4 h-4 text-red-400" />
                      </div>
                      <p className="text-red-400 text-2xl font-semibold">
                        {usMarketData.advanceDecline.decline}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Footer Section */}
      <footer className="mt-12 py-8 border-t border-white/10 text-center text-gray-400">
        <p>© {new Date().getFullYear()} Stock-Smith. All rights reserved.</p>
        <p className="mt-2 text-sm">
          Market data is for informational purposes only. Not financial advice.
        </p>
      </footer>
    </div>
  );
};

export default Home;
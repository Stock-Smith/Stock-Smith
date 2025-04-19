
import React, { useState, useEffect } from "react";
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
  Layers, Bell, BarChart3, TrendingDown
} from "lucide-react";

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

const MarketDashboard: React.FC<MarketDataProps> = ({ marketData, topPerformers, usMarketData }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState(marketData);
  const [timeframe, setTimeframe] = useState("1D");
  const [marketView, setMarketView] = useState("dow");
  const [institutionalView, setInstitutionalView] = useState("buying");
  const [chartHovered, setChartHovered] = useState(false);

  // Handle search functionality
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim() === "") {
      setFilteredData(marketData);
    } else {
      const filtered = marketData.filter(
        stock => 
          stock.symbol.toLowerCase().includes(term.toLowerCase()) || 
          stock.name.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredData(filtered);
    }
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
                        {usMarketData.institutionalActivity.map((item, index) => {
                          const dateParts = item.date.split('-');
                          const formattedDate = `${dateParts[1]}/${dateParts[2]}/${dateParts[0].slice(2)}`;
                          
                          return (
                            <motion.tr 
                              key={index} 
                              className="border-b border-gray-800/50 hover:bg-gray-800/30"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ backgroundColor: "rgba(31, 41, 55, 0.4)" }}
                            >
                              <td className="py-2.5 text-xs font-medium text-gray-300">{formattedDate}</td>
                              <td className="py-2.5 text-right text-xs font-medium text-green-400">
                                +${(item.netBuying/1000).toFixed(2)}B
                              </td>
                              <td className="py-2.5 text-right text-xs font-medium text-red-400">
                                ${(item.netSelling/1000).toFixed(2)}B
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 text-right">
                    <a href="#" className="text-blue-400 hover:text-blue-300 text-xs flex items-center justify-end group">
                      View Full Report 
                      <ChevronRightIcon className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Market Movers and Sector Performance Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Market Movers Card */}
        <motion.div variants={itemVariants} className="col-span-3 md:col-span-2">
          <Card className="glassmorphism overflow-hidden">
            <CardHeader className="pb-3 border-b border-gray-800">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-medium flex items-center text-gray-100">
                  <LineChartIcon className="w-5 h-5 mr-2 text-blue-500" />
                  Market Movers
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                    Top Movers
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex items-center mb-4 relative">
                <SearchIcon className="w-4 h-4 absolute left-3 text-gray-500" />
                <Input
                  placeholder="Search by symbol or company name..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-9 bg-gray-800/40 border-gray-700 focus:border-blue-500 focus:ring-blue-500/20 text-gray-200 text-sm h-9"
                />
              </div>
              <div className="rounded-lg overflow-hidden border border-gray-800">
                <Table>
                  <TableHeader className="bg-gray-800/60">
                    <TableRow className="hover:bg-gray-800/80 border-b-0">
                      <TableHead className="text-gray-400 font-medium text-xs">Symbol</TableHead>
                      <TableHead className="text-gray-400 font-medium text-xs">Name</TableHead>
                      <TableHead className="text-gray-400 font-medium text-xs text-right">Price</TableHead>
                      <TableHead className="text-gray-400 font-medium text-xs text-right">Change</TableHead>
                      <TableHead className="text-gray-400 font-medium text-xs text-right">Volume</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredData.map((stock, index) => (
                        <motion.tr 
                          key={stock.symbol} 
                          className="cursor-pointer hover:bg-gray-800/40 transition border-b border-gray-800/60 group"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          whileHover={{ backgroundColor: "rgba(31, 41, 55, 0.4)" }}
                        >
                          <TableCell className="font-bold text-blue-500 py-3">{stock.symbol}</TableCell>
                          <TableCell className="text-gray-200 font-medium py-3">{stock.name}</TableCell>
                          <TableCell className="text-right font-medium text-gray-200 py-3">${stock.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right py-3">
                            <div className={`flex items-center justify-end font-medium ${stock.status === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                              {stock.status === 'up' ? (
                                <ArrowUpIcon className="w-3.5 h-3.5 mr-1" />
                              ) : (
                                <ArrowDownIcon className="w-3.5 h-3.5 mr-1" />
                              )}
                              {stock.change.toFixed(2)} ({stock.percentChange.toFixed(2)}%)
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-blue-400 font-medium py-3">
                            <div className="flex items-center justify-end">
                              {stock.volume}
                              <span className="opacity-0 group-hover:opacity-100 ml-2 transition-opacity">
                                <ChevronRightIcon className="w-4 h-4 text-blue-500" />
                              </span>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
              <div className="mt-3 flex justify-end">
                <a href="#" className="text-blue-400 hover:text-blue-300 text-xs flex items-center group">
                  View All Market Data
                  <ChevronRightIcon className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sector Performance */}
        <motion.div 
          variants={itemVariants}
          className="glassmorphism rounded-lg col-span-3 md:col-span-1 overflow-hidden"
        >
          <Card className="bg-transparent border-none">
            <CardHeader className="pb-3 border-b border-gray-800">
              <CardTitle className="text-xl font-medium flex items-center text-gray-100">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                Top Sectors
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {topPerformers.map((sector, i) => (
                <motion.div 
                  key={i} 
                  className="flex justify-between items-center p-3 mb-2.5 bg-gray-800/40 rounded-lg hover:bg-gray-700/40 transition cursor-pointer hover-lift"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + (i * 0.1) }}
                  whileHover={{ scale: 1.02 }}
                >
                  <span className="font-medium text-gray-200">{sector.name}</span>
                  <span className="text-green-400 font-medium flex items-center">
                    <ArrowUpIcon className="w-3.5 h-3.5 mr-1" />
                    {sector.change}%
                  </span>
                </motion.div>
              ))}
              <motion.div 
                className="mt-5 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/15 transition cursor-pointer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-start">
                  <AlertCircleIcon className="w-4 h-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Markets are showing positive momentum across technology sectors as Q4 earnings exceed expectations. Recent Fed comments indicate stabilizing rates.
                  </p>
                </div>
              </motion.div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <motion.button 
                  className="flex items-center justify-center py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 text-blue-400 text-xs font-medium transition"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.7 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <TrendingUpIcon className="w-3.5 h-3.5 mr-1.5" />
                  Gainers
                </motion.button>
                <motion.button 
                  className="flex items-center justify-center py-2 rounded-lg bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700 text-gray-400 text-xs font-medium transition"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.8 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <TrendingDown className="w-3.5 h-3.5 mr-1.5" />
                  Losers
                </motion.button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MarketDashboard;
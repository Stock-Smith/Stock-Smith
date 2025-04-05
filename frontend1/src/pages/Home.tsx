import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../context/AuthContext";
import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area
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
  ExternalLinkIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

const marketData = [
  { symbol: "AAPL", name: "Apple Inc.", price: 189.45, change: 2.37, percentChange: 1.27, status: "up", volume: "32.4M" },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 128.63, change: -1.95, percentChange: -1.49, status: "down", volume: "18.7M" },
  { symbol: "MSFT", name: "Microsoft Corporation", price: 332.87, change: 1.22, percentChange: 0.37, status: "up", volume: "24.2M" },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: 176.29, change: 0.56, percentChange: 0.32, status: "up", volume: "21.1M" }
];

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
  dow: {
    value: 38623.74,
    change: -314.33,
    percentChange: -0.81
  },
  advanceDecline: {
    advance: 153,
    decline: 347
  },
  institutionalActivity: [
    { date: "2025-03-08", netBuying: 11246.82, netSelling: -9308.63 },
    { date: "2025-03-07", netBuying: 8726.54, netSelling: -7427.11 }
  ],
  activeStocks: [
    { symbol: "TSLA", company: "Tesla, Inc.", price: 178.21, change: -6.40, value: 12.5, status: "down" },
    { symbol: "NVDA", company: "NVIDIA Corp", price: 824.12, change: 15.73, value: 8.4, status: "up" },
    { symbol: "AMD", company: "Advanced Micro Devices", price: 172.88, change: 8.25, value: 6.7, status: "up" },
    { symbol: "META", company: "Meta Platforms Inc", price: 474.32, change: -11.25, value: 5.9, status: "down" }
  ]
};

const scrollVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      duration: 0.5
    }
  }
};

const tableRowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3
    }
  })
};

const Home = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState(marketData);
  const [timeframe, setTimeframe] = useState("1D");
  const [marketView, setMarketView] = useState("dow");
  const [institutionalView, setInstitutionalView] = useState("buying");
  const [isLoading, setIsLoading] = useState(true);
  const shouldReduceMotion = useReducedMotion();
  
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);

  useEffect(() => {
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    setFilteredData(
      term.trim() === "" 
        ? marketData 
        : marketData.filter(stock =>
            stock.symbol.toLowerCase().includes(term.toLowerCase()) || 
            stock.name.toLowerCase().includes(term.toLowerCase())
          )
    );
  };

  const SkeletonRow = () => (
    <div className="animate-pulse flex items-center justify-between p-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-4 bg-gray-700 rounded" style={{ width: `${25 - i*5}%` }} />
      ))}
    </div>
  );

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

      {/* Market Dashboard */}
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
                  {isLoading ? (
                    <div className="space-y-4">
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                    </div>
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
                          {usMarketData.activeStocks.map((stock, index) => (
                            <tr 
                              key={index} 
                              className="border-b border-white/10 hover:bg-gray-800/30 cursor-pointer transition-colors group"
                            >
                              <td className="py-2 text-sm font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                                {stock.symbol}
                              </td>
                              <td className="py-2 text-sm font-medium text-white">{stock.company}</td>
                              <td className="py-2 text-right text-sm font-medium text-white">
                                ${stock.price.toFixed(2)}
                              </td>
                              <td className={`py-2 text-right text-sm font-medium ${
                                stock.status === 'up' ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}
                              </td>
                            </tr>
                          ))}
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
              >
                <div className="bg-gray-900/20 backdrop-blur-md rounded-xl p-4 border border-white/10">
                  <div className="mb-3">
                    <Tabs defaultValue="dow" onValueChange={setMarketView} className="w-full">
                      <TabsList className="grid grid-cols-2 mb-2 bg-gray-800/50">
                        <TabsTrigger value="dow" className="text-gray-300 data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-200">
                          Dow Jones
                        </TabsTrigger>
                        <TabsTrigger value="snp" className="text-gray-300 data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-200">
                          S&P 500
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {["1D", "5D", "1M", "3M", "6M", "1Y", "2Y"].map((period) => (
                        <Button 
                          key={period} 
                          variant="outline"
                          size="sm"
                          onClick={() => setTimeframe(period)}
                          className={`px-3 py-1 text-xs ${
                            timeframe === period 
                              ? 'bg-blue-900/40 text-blue-200 border-blue-600' 
                              : 'bg-gray-800/50 text-gray-300 border-gray-700 hover:bg-gray-700 hover:text-gray-200'
                          }`}
                        >
                          {period}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 h-48 w-full bg-gray-900/30 rounded-xl relative overflow-hidden border border-white/10">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                        <XAxis dataKey="time" tick={{ fill: '#6b7280' }} />
                        <YAxis tick={{ fill: '#6b7280' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          fill="url(#chartGradient)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ margin: "0px 0px -50px 0px" }}
                variants={shouldReduceMotion ? undefined : scrollVariants}
                className="space-y-4"
              >
                <div className="bg-gray-900/20 backdrop-blur-md rounded-xl p-4 border border-white/10">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium text-blue-300">Advance / Decline (NYSE)</h3>
                    <Link to="#" className="text-blue-400 hover:text-blue-300 text-xs flex items-center">
                      View More <ExternalLinkIcon className="w-3 h-3 ml-1" />
                    </Link>
                  </div>
                  <div className="relative h-8 bg-gray-800/50 rounded-full overflow-hidden border border-white/10">
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-green-600 to-green-500" 
                      style={{ width: `${(usMarketData.advanceDecline.advance / (usMarketData.advanceDecline.advance + usMarketData.advanceDecline.decline)) * 100}%` }}
                    />
                    <div 
                      className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-red-600 to-red-500" 
                      style={{ width: `${(usMarketData.advanceDecline.decline / (usMarketData.advanceDecline.advance + usMarketData.advanceDecline.decline)) * 100}%` }}
                    />
                    <div className="absolute inset-0 flex justify-between items-center px-6 text-sm font-medium">
                      <span className="text-white z-10 drop-shadow-md">{usMarketData.advanceDecline.advance}</span>
                      <span className="text-white z-10 drop-shadow-md">{usMarketData.advanceDecline.decline}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/20 backdrop-blur-md rounded-xl p-4 border border-white/10">
                  <div className="mb-2">
                    <h3 className="text-lg font-medium text-blue-300 mb-3">Institutional Activity ($ Mil)</h3>
                    <Tabs defaultValue="buying" onValueChange={setInstitutionalView} className="w-full">
                      <TabsList className="grid grid-cols-2 mb-2 bg-gray-800/50">
                        <TabsTrigger value="buying" className="text-gray-300 data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-200">
                          Net Buying
                        </TabsTrigger>
                        <TabsTrigger value="selling" className="text-gray-300 data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-200">
                          Net Selling
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  {isLoading ? (
                    <div className="space-y-4">
                      <SkeletonRow />
                      <SkeletonRow />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-sm border-b border-white/10">
                            <th className="text-left py-2 font-semibold text-white">Date</th>
                            <th className="text-right py-2 font-semibold text-white">Net Buying</th>
                            <th className="text-right py-2 font-semibold text-white">Net Selling</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usMarketData.institutionalActivity.map((item, index) => {
                            const dateParts = item.date.split('-');
                            const formattedDate = `${dateParts[1]}/${dateParts[2]}/${dateParts[0].slice(2)}`;
                            
                            return (
                              <tr 
                                key={index} 
                                className="border-b border-white/10 hover:bg-gray-800/30 transition-colors"
                              >
                                <td className="py-2 text-sm font-medium text-white">{formattedDate}</td>
                                <td className="py-2 text-right text-sm font-medium text-green-400">
                                  +${(item.netBuying/1000).toFixed(2)}B
                                </td>
                                <td className="py-2 text-right text-sm font-medium text-red-400">
                                  ${(item.netSelling/1000).toFixed(2)}B
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Market Movers Grid */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ margin: "0px 0px -100px 0px", once: false }}
        variants={shouldReduceMotion ? undefined : scrollVariants}
      >
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-800/30 backdrop-blur-lg border border-white/10 shadow-xl col-span-3 md:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-semibold flex items-center">
                  <TrendingUpIcon className="w-5 h-5 mr-2 text-blue-400" />
                  Market Movers
                </CardTitle>
                <Badge variant="outline" className="bg-blue-900/30 text-blue-300 border-blue-700">
                  Live Data
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-4 relative">
                <SearchIcon className="w-4 h-4 absolute left-3 text-gray-400" />
                <Input
                  placeholder="Search stocks..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-9 bg-gray-900/50 border-white/10 focus:border-blue-500 text-gray-200"
                />
              </div>
              {isLoading ? (
                <div className="space-y-4">
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden border border-white/10">
                  <Table>
                    <TableHeader className="bg-gray-800/50 backdrop-blur">
                      <TableRow className="hover:bg-gray-800/30">
                        <TableHead className="text-white font-semibold">Symbol</TableHead>
                        <TableHead className="text-white font-semibold">Name</TableHead>
                        <TableHead className="text-white font-semibold text-right">Price</TableHead>
                        <TableHead className="text-white font-semibold text-right">Change</TableHead>
                        <TableHead className="text-white font-semibold text-right">Volume</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((stock, index) => (
                        <motion.tr
                          key={stock.symbol}
                          custom={index}
                          initial="hidden"
                          animate="visible"
                          variants={shouldReduceMotion ? undefined : tableRowVariants}
                          className="group hover:bg-gray-800/30 transition-colors duration-200 even:bg-gray-800/20"
                        >
                          <TableCell className="font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                            {stock.symbol}
                          </TableCell>
                          <TableCell className="text-white font-medium">{stock.name}</TableCell>
                          <TableCell className="text-right font-medium text-white">
                            ${stock.price.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className={`flex items-center justify-end font-medium ${
                              stock.status === 'up' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {stock.status === 'up' ? (
                                <ArrowUpIcon className="w-4 h-4 mr-1" />
                              ) : (
                                <ArrowDownIcon className="w-4 h-4 mr-1" />
                              )}
                              {stock.change.toFixed(2)} ({stock.percentChange.toFixed(2)}%)
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-blue-200 font-medium">
                            {stock.volume}
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sector Performance */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ margin: "0px 0px -100px 0px", once: false }}
            variants={shouldReduceMotion ? undefined : scrollVariants}
          >
            <Card className="bg-gray-800/30 backdrop-blur-lg border border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <BarChart2Icon className="w-5 h-5 mr-2 text-blue-400" />
                  Top Sectors Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </div>
                ) : (
                  <>
                    {topPerformers.map((sector, i) => (
                      <motion.div
                        key={i}
                        whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
                        whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                      >
                        <div className="flex justify-between items-center p-3 mb-2 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition cursor-pointer group">
                          <span className="font-medium text-white">{sector.name}</span>
                          <span className="text-green-400 font-medium flex items-center">
                            <ArrowUpIcon className="w-4 h-4 mr-1 group-hover:animate-bounce" />
                            {sector.change}%
                          </span>
                        </div>
                      </motion.div>
                    ))}
                    <div className="mt-4 p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
                      <div className="flex items-start">
                        <AlertCircleIcon className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-white">
                          Markets are showing positive momentum across technology sectors as Q4 earnings exceed expectations.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* CTA Banner */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ margin: "0px 0px -100px 0px", once: false }}
        variants={shouldReduceMotion ? undefined : scrollVariants}
        whileHover={shouldReduceMotion ? undefined : { scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Card className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 backdrop-blur-lg border border-white/10 shadow-2xl">
          <CardContent className="p-8 flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-2xl font-bold text-white mb-2">
                Ready to start investing smarter?
              </h3>
              <p className="text-gray-200">
                Join thousands of investors making data-driven decisions.
              </p>
            </div>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium px-6 py-6 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all duration-200 transform hover:-translate-y-1 hover:scale-105 flex items-center gap-2"
              asChild
            >
              <Link to="/auth?type=signup">
                <UserPlusIcon className="w-5 h-5" />
                <span className="text-lg">Get Started Now</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Home;
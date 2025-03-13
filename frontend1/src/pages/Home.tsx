import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../context/AuthContext";
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

// US market data
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

const Home = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState(marketData);
  const [timeframe, setTimeframe] = useState("1D");
  const [marketView, setMarketView] = useState("dow");
  const [institutionalView, setInstitutionalView] = useState("buying");

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

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 p-6">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center mb-12 pt-8">
        <div className="flex items-center mb-2">
          <BarChart2Icon className="w-8 h-8 mr-2 text-blue-400" />
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
            Stock-Smith
          </h1>
        </div>
        <p className="text-xl text-gray-300 max-w-lg text-center mt-2 mb-8">
          Your intelligent companion for market insights and investment decisions
        </p>

        {!isAuthenticated ? (
          <div className="flex gap-4 mb-8">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium px-8 py-6 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all duration-200 transform hover:-translate-y-1 flex items-center gap-2">
              <LogInIcon className="w-5 h-5" />
              <Link to="/auth?type=login" className="text-lg">Login</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-gray-800/70 border-2 border-blue-500/50 text-blue-400 hover:bg-blue-900/20 hover:text-blue-300 font-medium px-8 py-6 rounded-xl shadow-lg hover:shadow-blue-500/10 transition-all duration-200 transform hover:-translate-y-1 flex items-center gap-2">
              <UserPlusIcon className="w-5 h-5" />
              <Link to="/auth?type=signup" className="text-lg">Sign Up</Link>
            </Button>
          </div>
        ) : (
          <Card className="mb-6 bg-gray-800/50 border border-gray-700 shadow-lg hover:shadow-blue-900/20 transition">
            <CardContent className="p-6 text-center">
              <p className="text-xl font-semibold text-gray-200">Welcome back, <span className="text-blue-400">{user?.name}</span>!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* US Market Dashboard - New Section */}
      <Card className="bg-gray-800/50 border border-gray-700 shadow-lg mb-8">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Most Active Stocks */}
            <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-blue-300">Most Active Stocks</h3>
                <Badge className="bg-gray-800 hover:bg-gray-700 cursor-pointer">
                  <Link to="#" className="flex items-center text-xs text-blue-300">
                    Options <ExternalLinkIcon className="w-3 h-3 ml-1" />
                  </Link>
                </Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-sm border-b border-gray-700">
                      <th className="text-left py-2 font-semibold text-white">Symbol</th>
                      <th className="text-left py-2 font-semibold text-white">Company</th>
                      <th className="text-right py-2 font-semibold text-white">Price</th>
                      <th className="text-right py-2 font-semibold text-white">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usMarketData.activeStocks.map((stock, index) => (
                      <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors">
                        <td className="py-2 text-sm font-bold text-blue-400">{stock.symbol}</td>
                        <td className="py-2 text-sm font-medium text-white">{stock.company}</td>
                        <td className="py-2 text-right text-sm font-medium text-white">${stock.price.toFixed(2)}</td>
                        <td className={`py-2 text-right text-sm font-medium ${stock.status === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                          {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 text-right">
                  <Link to="#" className="text-blue-400 hover:text-blue-300 text-sm flex items-center justify-end">
                    View More <ExternalLinkIcon className="w-3 h-3 ml-1" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Center: Index Chart */}
            <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700">
              <div className="mb-3">
                <Tabs defaultValue="dow" onValueChange={setMarketView} className="w-full">
                  <TabsList className="grid grid-cols-2 mb-2 bg-gray-800/50">
                    <TabsTrigger value="dow" className="text-gray-300 data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-200">Dow Jones</TabsTrigger>
                    <TabsTrigger value="snp" className="text-gray-300 data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-200">S&P 500</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="flex flex-wrap gap-1 mb-3">
                  {["1D", "5D", "1M", "3M", "6M", "1Y", "2Y"].map((period) => (
                    <Button 
                      key={period} 
                      variant="outline"
                      size="sm"
                      onClick={() => setTimeframe(period)}
                      className={`px-3 py-1 text-xs ${timeframe === period 
                        ? 'bg-blue-900/40 text-blue-200 border-blue-600' 
                        : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700 hover:text-gray-200'}`}
                    >
                      {period}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-baseline justify-center">
                  <span className="text-2xl font-bold mr-3 text-white">{usMarketData.dow.value.toLocaleString()}</span>
                  <span className={`text-sm font-medium ${usMarketData.dow.percentChange < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {usMarketData.dow.change > 0 ? '+' : ''}
                    {usMarketData.dow.change.toFixed(2)} ({usMarketData.dow.percentChange.toFixed(2)}%)
                  </span>
                </div>
              </div>
              <div className="mt-4 h-36 w-full bg-gray-900/80 rounded-md relative overflow-hidden border border-gray-800">
                {/* Simplified Line Chart - You'd replace this with an actual chart component */}
                <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end">
                  <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none">
                    <path 
                      d="M0,50 C20,40 40,45 60,35 C80,25 100,30 120,35 C140,40 160,20 180,10 C200,0 220,15 240,30 C260,45 280,60 300,70" 
                      fill="none" 
                      stroke="#3b82f6" 
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400 px-2">
                  <span>10:00</span>
                  <span>12:00</span>
                  <span>14:00</span>
                </div>
              </div>
            </div>

            {/* Right: Advance/Decline and Institutional Activity */}
            <div className="space-y-4">
              {/* Advance/Decline */}
              <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium text-blue-300">Advance / Decline (NYSE)</h3>
                  <Link to="#" className="text-blue-400 hover:text-blue-300 text-xs flex items-center">
                    View More <ExternalLinkIcon className="w-3 h-3 ml-1" />
                  </Link>
                </div>
                <div className="relative h-8 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                  <div 
                    className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-green-600 to-green-500" 
                    style={{ width: `${(usMarketData.advanceDecline.advance / (usMarketData.advanceDecline.advance + usMarketData.advanceDecline.decline)) * 100}%` }}
                  ></div>
                  <div 
                    className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-red-600 to-red-500" 
                    style={{ width: `${(usMarketData.advanceDecline.decline / (usMarketData.advanceDecline.advance + usMarketData.advanceDecline.decline)) * 100}%` }}
                  ></div>
                  <div className="absolute inset-0 flex justify-between items-center px-6 text-sm font-medium">
                    <span className="text-white z-10 drop-shadow-md">{usMarketData.advanceDecline.advance}</span>
                    <span className="text-white z-10 drop-shadow-md">{usMarketData.advanceDecline.decline}</span>
                  </div>
                </div>
              </div>

              {/* Institutional Activity */}
              <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700">
                <div className="mb-2">
                  <h3 className="text-lg font-medium text-blue-300 mb-3">Institutional Activity ($ Mil)</h3>
                  <Tabs defaultValue="buying" onValueChange={setInstitutionalView} className="w-full">
                    <TabsList className="grid grid-cols-2 mb-2 bg-gray-800/50">
                      <TabsTrigger value="buying" className="text-gray-300 data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-200">Net Buying</TabsTrigger>
                      <TabsTrigger value="selling" className="text-gray-300 data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-200">Net Selling</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-sm border-b border-gray-700">
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
                          <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Market Summary Card */}
        <Card className="bg-gray-800/50 border border-gray-700 shadow-lg col-span-3 md:col-span-2">
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
                className="pl-9 bg-gray-900/50 border-gray-700 focus:border-blue-500 text-gray-200"
              />
            </div>
            <div className="rounded-lg overflow-hidden border border-gray-700">
              <Table>
                <TableHeader className="bg-gray-800">
                  <TableRow className="hover:bg-gray-800/80">
                    <TableHead className="text-white font-semibold">Symbol</TableHead>
                    <TableHead className="text-white font-semibold">Name</TableHead>
                    <TableHead className="text-white font-semibold text-right">Price</TableHead>
                    <TableHead className="text-white font-semibold text-right">Change</TableHead>
                    <TableHead className="text-white font-semibold text-right">Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((stock) => (
                    <TableRow 
                      key={stock.symbol} 
                      className="cursor-pointer hover:bg-gray-700/40 transition"
                    >
                      <TableCell className="font-bold text-blue-400">{stock.symbol}</TableCell>
                      <TableCell className="text-white font-medium">{stock.name}</TableCell>
                      <TableCell className="text-right font-medium text-white">${stock.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className={`flex items-center justify-end font-medium ${stock.status === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                          {stock.status === 'up' ? (
                            <ArrowUpIcon className="w-4 h-4 mr-1" />
                          ) : (
                            <ArrowDownIcon className="w-4 h-4 mr-1" />
                          )}
                          {stock.change.toFixed(2)} ({stock.percentChange.toFixed(2)}%)
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-blue-200 font-medium">{stock.volume}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Sector Performance */}
        <Card className="bg-gray-800/50 border border-gray-700 shadow-lg row-start-1 md:row-auto col-span-3 md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <BarChart2Icon className="w-5 h-5 mr-2 text-blue-400" />
              Top Sectors Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPerformers.map((sector, i) => (
              <div key={i} className="flex justify-between items-center p-3 mb-2 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition cursor-pointer">
                <span className="font-medium text-white">{sector.name}</span>
                <span className="text-green-400 font-medium flex items-center">
                  <ArrowUpIcon className="w-4 h-4 mr-1" />
                  {sector.change}%
                </span>
              </div>
            ))}
            <div className="mt-4 p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
              <div className="flex items-start">
                <AlertCircleIcon className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-white">
                  Markets are showing positive momentum across technology sectors as Q4 earnings exceed expectations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Join Now Banner */}
      <Card className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-800/50 shadow-lg mb-8">
        <CardContent className="p-8 flex flex-col md:flex-row justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Ready to start investing smarter?</h3>
            <p className="text-gray-300 mb-4 md:mb-0">Join thousands of investors making data-driven decisions.</p>
          </div>
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium px-6 py-6 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all duration-200 transform hover:-translate-y-1 flex items-center gap-2">
            <UserPlusIcon className="w-5 h-5" />
            <Link to="/auth?type=signup" className="text-lg">Get Started Now</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
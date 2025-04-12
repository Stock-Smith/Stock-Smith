import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Briefcase, PieChart, BarChart3, ArrowUp, ArrowDown } from "lucide-react";
import PortfolioScore from "@/components/PortfolioScore";
import DailyGainLoss from "@/components/DailyGainLoss";
import AssetsSummary from "@/components/AssetsSummary";
interface SectorData {
  name: string;
  latestValue: string;
  investedValue: string;
  weight: number;
  color?: string;
}

interface StockData {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  latestValue: string;
  investedValue: string;
  weight: number;
  marketCap: MarketCapType;
}

type MarketCapType = "All" | "Large Cap" | "Mid Cap" | "Small Cap";

// Sector data for "All" market cap
const allSectorsData: SectorData[] = [
  { name: "Chemicals", weight: 21.59, latestValue: "", investedValue: "", color: "#3b82f6" },
  { name: "Banks", weight: 14.25, latestValue: "", investedValue: "", color: "#8b5cf6" },
  { name: "Finance", weight: 11.90, latestValue: "", investedValue: "", color: "#ec4899" },
  { name: "Metals & Mining", weight: 9.72, latestValue: "", investedValue: "", color: "#10b981" },
  { name: "Power", weight: 6.91, latestValue: "", investedValue: "", color: "#f59e0b" },
  { name: "Healthcare", weight: 6.72, latestValue: "", investedValue: "", color: "#6366f1" },
  { name: "FMCG", weight: 5.93, latestValue: "", investedValue: "", color: "#ef4444" },
  { name: "Software & IT Services", weight: 4.04, latestValue: "", investedValue: "", color: "#0ea5e9" },
  { name: "Oil & Gas", weight: 2.96, latestValue: "", investedValue: "", color: "#14b8a6" },
  { name: "Retailing", weight: 2.75, latestValue: "", investedValue: "", color: "#a855f7" },
  { name: "Industrial Gases & Fuels", weight: 2.33, latestValue: "", investedValue: "", color: "#f97316" },
  { name: "Diversified", weight: 2.07, latestValue: "", investedValue: "", color: "#64748b" },
];

// Stock data
const allStockData: StockData[] = [
  { ticker: "VEDL", name: "Vedanta", sector: "Metals & Mining", price: 394.75, change: -9.80, changePercent: -2.42, weight: 9.72, marketCap: "Large Cap", latestValue: "", investedValue: "" },
  { ticker: "KOTAKBANK", name: "Kotak Mahindra", sector: "Banks", price: 1902.95, change: -44.60, changePercent: -2.29, weight: 7.26, marketCap: "Large Cap", latestValue: "", investedValue: "" },
  { ticker: "HINDUNILVR", name: "HUL", sector: "FMCG", price: 2190.25, change: -54.70, changePercent: -2.44, weight: 5.93, marketCap: "Large Cap", latestValue: "", investedValue: "" },
  { ticker: "UPL", name: "UPL", sector: "Chemicals", price: 632.95, change: -10.70, changePercent: -1.66, weight: 5.78, marketCap: "Mid Cap", latestValue: "", investedValue: "" },
  { ticker: "NATCO", name: "Natco Labs", sector: "Healthcare", price: 527.20, change: -15.80, changePercent: -2.91, weight: 5.58, marketCap: "Mid Cap", latestValue: "", investedValue: "" },
  { ticker: "JIOFIN", name: "Jio Financial", sector: "Finance", price: 207.61, change: -14.09, changePercent: -6.36, weight: 5.11, marketCap: "Large Cap", latestValue: "", investedValue: "" },
  { ticker: "CHAMBLFERT", name: "Chambal Fert", sector: "Chemicals", price: 533.70, change: -41.05, changePercent: -7.14, weight: 3.29, marketCap: "Small Cap", latestValue: "", investedValue: "" },
  { ticker: "CYIENT", name: "Cyient", sector: "Software & IT Services", price: 1267.15, change: -40.85, changePercent: -3.12, weight: 3.28, marketCap: "Mid Cap", latestValue: "", investedValue: "" },
  { ticker: "ASIANPAINT", name: "Asian Paints", sector: "Chemicals", price: 2179.75, change: -33.90, changePercent: -1.53, weight: 3.22, marketCap: "Large Cap", latestValue: "", investedValue: "" },
  { ticker: "HDFCBANK", name: "HDFC Bank", sector: "Banks", price: 1732.40, change: 31.70, changePercent: 1.86, weight: 3.20, marketCap: "Large Cap", latestValue: "", investedValue: "" },
  { ticker: "DEEPAKFERT", name: "Deepak Fert", sector: "Chemicals", price: 963.15, change: -76.20, changePercent: -7.34, weight: 3.17, marketCap: "Small Cap", latestValue: "", investedValue: "" },
  { ticker: "CAMS", name: "CAMS", sector: "Finance", price: 3143.10, change: -114.65, changePercent: -3.52, weight: 3.10, marketCap: "Mid Cap", latestValue: "", investedValue: "" },
];

const Portfolio = () => {
  const [activeMarketCap, setActiveMarketCap] = useState<MarketCapType>("All");
  const [isLoading, setIsLoading] = useState(true);

  // Generate random currency values
  const randomCurrencyValue = () => `$${(Math.random() * 500000 + 50000).toFixed(2)}`;
  const randomNumericValue = () => Math.random() * 500000 + 50000;

  // Existing sector data for specific market caps
  const marketCapSectorData: Record<Exclude<MarketCapType, "All">, SectorData[]> = {
    "Large Cap": [
      { name: "Technology", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 22.35, color: "#3b82f6" },
      { name: "Financial Services", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 15.80, color: "#8b5cf6" },
      { name: "Healthcare", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 12.45, color: "#ec4899" },
      { name: "Consumer Goods", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 10.25, color: "#10b981" },
      { name: "Energy", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 9.45, color: "#f59e0b" },
    ],
    "Mid Cap": [
      { name: "Industrials", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 17.50, color: "#6366f1" },
      { name: "Technology", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 14.90, color: "#0ea5e9" },
      { name: "Healthcare", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 13.25, color: "#14b8a6" },
      { name: "Consumer Discretionary", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 12.90, color: "#a855f7" },
      { name: "Materials", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 10.80, color: "#f97316" },
    ],
    "Small Cap": [
      { name: "Industrials", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 18.20, color: "#ec4899" },
      { name: "Healthcare", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 15.35, color: "#8b5cf6" },
      { name: "Financial Services", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 12.80, color: "#3b82f6" },
      { name: "Technology", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 11.50, color: "#10b981" },
      { name: "Real Estate", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 9.75, color: "#f59e0b" },
    ],
  };

  // Parse currency values for calculations
  const parseCurrency = (value: string) => parseFloat(value.replace('$', '').replace(',', ''));

  // Get current sector data
  const getCurrentSectorData = () => {
    if (activeMarketCap === "All") {
      return allSectorsData.map(sector => ({
        ...sector,
        latestValue: randomCurrencyValue(),
        investedValue: randomCurrencyValue(),
      }));
    }
    return marketCapSectorData[activeMarketCap];
  };

  // Get filtered stock data
  const getFilteredStocks = () => {
    const stocks = allStockData.map(stock => ({
      ...stock,
      latestValue: randomCurrencyValue(),
      investedValue: randomCurrencyValue(),
    }));
    return activeMarketCap === "All" ? stocks : stocks.filter(stock => stock.marketCap === activeMarketCap);
  };

  const currentSectorData = getCurrentSectorData();
  const filteredStocks = getFilteredStocks();

  // Sort sectors by weight
  const sortedSectors = [...currentSectorData].sort((a, b) => b.weight - a.weight);

  // Calculate portfolio value for display in the header
  const totalPortfolioValue = filteredStocks.reduce((sum, stock) => sum + parseCurrency(stock.latestValue), 0);
  
  // Calculate values for MyAssets component
  const portfolioLatestValue = randomNumericValue();
  const portfolioInvestmentCost = portfolioLatestValue * 0.85; // 85% of latest value
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

  // Prepare data for GainSummary component
  const gainSummaryData = {
    dividendGain: portfolioLatestValue * 0.02, // 2% dividend gain
    interestGain: portfolioLatestValue * 0.015, // 1.5% interest gain
    shortTermGain: portfolioLatestValue * 0.03, // 3% short term gain
    longTermGain: portfolioLatestValue * 0.05, // 5% long term gain
    totalGain: portfolioOverallGain
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black text-gray-100 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 relative z-10">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold text-blue-400">
                PORTFOLIO VISTA
              </h1>
              <p className="text-gray-400 text-sm">Market Cap Classification & Analysis</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 flex flex-col items-center border border-gray-800">
              <p className="text-sm text-gray-400 mb-1">Portfolio Value</p>
              <p className="text-2xl font-bold text-blue-400">
                ${totalPortfolioValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
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
            <DailyGainLoss />
            
            {/* Portfolio Score Component */}
            <div className="mt-6">
              <PortfolioScore />
            </div>
            
            {/* Assets Summary Component */}
            <AssetsSummary />

            <Card className="bg-gray-900 overflow-hidden rounded-xl border border-gray-800">
              <CardHeader className="py-4 bg-black border-b border-gray-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-900/20 rounded-lg">
                    <Briefcase className="h-5 w-5 text-blue-400" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-100">Market Overview</CardTitle>
                </div>
              </CardHeader>

              <Tabs defaultValue="sectors" className="w-full">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between px-6 pt-2 pb-2 bg-black">
                  <TabsList className="grid grid-cols-2 max-w-[300px] bg-gray-800 p-1 rounded-lg mb-4 md:mb-0">
                    <TabsTrigger value="sectors" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-blue-300 border-0">
                      <PieChart className="h-4 w-4 mr-1" /> Sectors
                    </TabsTrigger>
                    <TabsTrigger value="stocks" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-blue-300 border-0">
                      <BarChart3 className="h-4 w-4 mr-1" /> Stocks
                    </TabsTrigger>
                  </TabsList>
                  <div className="flex flex-wrap gap-2">
                    {(["All", "Large Cap", "Mid Cap", "Small Cap"] as MarketCapType[]).map((cap) => (
                      <button
                        key={cap}
                        onClick={() => setActiveMarketCap(cap)}
                        className={`px-3 py-1.5 text-xs rounded-md transition-all ${activeMarketCap === cap ? "bg-blue-900 text-blue-300 font-medium" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
                      >
                        {cap}
                      </button>
                    ))}
                  </div>
                </div>

                <TabsContent value="sectors" className="p-4 bg-black">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {sortedSectors.map((sector, index) => (
                      <div key={sector.name} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                        <Card className="bg-gray-900 overflow-hidden hover:bg-gray-800 transition-all duration-300 border border-gray-800 h-full">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="text-sm font-semibold text-gray-100">{sector.name}</h3>
                              <Badge variant="outline" className="bg-gray-800 text-xs border-gray-700">
                                {sector.weight.toFixed(2)}%
                              </Badge>
                            </div>
                            
                            <Progress 
                              value={sector.weight} 
                              max={25} 
                              className="h-2 w-full bg-gray-800 mt-1 mb-3 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-indigo-500" 
                            />
                            
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-400">Latest Value:</span>
                                <span className="text-gray-100">{sector.latestValue}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-400">Invested Value:</span>
                                <span className="text-gray-100">{sector.investedValue}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="stocks" className="p-4 bg-black">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStocks.map((stock, index) => {
                      const latest = parseCurrency(stock.latestValue);
                      const invested = parseCurrency(stock.investedValue);
                      const change = latest - invested;
                      const changePercent = (change / invested) * 100;
                      return (
                        <div key={stock.ticker} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <Card className="bg-gray-900 overflow-hidden hover:bg-gray-800 transition-all duration-300 border border-gray-800 h-full">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center">
                                    <h3 className="text-sm font-semibold text-gray-100">{stock.name}</h3>
                                    <span className="ml-2 text-xs px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">{stock.ticker}</span>
                                  </div>
                                  <Badge variant="outline" className="mt-1 bg-gray-800 text-xs border-gray-700">
                                    {stock.sector}
                                  </Badge>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-gray-100">${stock.price.toFixed(2)}</p>
                                  <div className={`flex items-center justify-end text-xs ${stock.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                                    {stock.change >= 0 ? (
                                      <ArrowUp className="h-3 w-3 mr-1" />
                                    ) : (
                                      <ArrowDown className="h-3 w-3 mr-1" />
                                    )}
                                    {stock.change.toFixed(2)} ({Math.abs(stock.changePercent).toFixed(2)}%)
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-4 space-y-2">
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-400">Latest Value:</span>
                                  <span className="text-gray-100">{stock.latestValue}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-400">Invested Value:</span>
                                  <span className="text-gray-100">{stock.investedValue}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-400">Performance:</span>
                                  <span className={change >= 0 ? "text-green-400" : "text-red-400"}>
                                    {change >= 0 ? "+" : ""}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-400">Weight:</span>
                                  <span className="text-gray-100">{stock.weight.toFixed(2)}%</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-gray-500">
          Data updated: {new Date().toLocaleDateString()} • Portfolio Vista Dashboard
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
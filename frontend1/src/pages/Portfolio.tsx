import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface SectorData {
  name: string;
  latestValue: string;
  investedValue: string;
  weight: number;
}

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
}

type MarketCapType = "All" | "Large Cap" | "Mid Cap" | "Small Cap";

const Portfolio = () => {
  const [activeMarketCap, setActiveMarketCap] = useState<MarketCapType>("All");

  // Generate random currency values
  const randomCurrencyValue = () => {
    return `$${(Math.random() * 500000 + 50000).toFixed(2)}`;
  };
  
  // Sector data for different market cap types
  const marketCapSectorData: Record<Exclude<MarketCapType, "All">, SectorData[]> = {
    "Large Cap": [
      { name: "Technology", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 22.35 },
      { name: "Financial Services", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 15.80 },
      { name: "Healthcare", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 12.45 },
      { name: "Consumer Discretionary", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 9.30 },
      { name: "Communication Services", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 8.75 },
      { name: "Industrials", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 7.20 },
      { name: "Consumer Staples", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 5.85 },
      { name: "Energy", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 4.15 },
    ],
    "Mid Cap": [
      { name: "Industrials", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 17.50 },
      { name: "Technology", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 14.90 },
      { name: "Healthcare", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 13.25 },
      { name: "Financial Services", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 11.75 },
      { name: "Consumer Discretionary", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 9.60 },
      { name: "Real Estate", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 7.85 },
      { name: "Materials", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 6.45 },
      { name: "Utilities", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 4.30 },
    ],
    "Small Cap": [
      { name: "Industrials", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 18.20 },
      { name: "Healthcare", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 15.35 },
      { name: "Financial Services", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 12.80 },
      { name: "Technology", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 10.45 },
      { name: "Consumer Discretionary", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 8.90 },
      { name: "Materials", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 7.65 },
      { name: "Energy", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 5.95 },
      { name: "Real Estate", latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 4.80 },
    ],
  };

  // Stock data with market cap classification
  const allStockData: StockData[] = [
    // Large Cap Stocks
    { name: "Apple", sector: "Technology", price: 187.45, change: 3.28, changePercent: 1.78, latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 8.75, marketCap: "Large Cap" },
    { name: "JPMorgan Chase", sector: "Financial Services", price: 204.65, change: -1.85, changePercent: -0.90, latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 7.20, marketCap: "Large Cap" },
    { name: "Johnson & Johnson", sector: "Healthcare", price: 156.25, change: 2.45, changePercent: 1.59, latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 5.65, marketCap: "Large Cap" },
    { name: "Amazon", sector: "Consumer Discretionary", price: 175.85, change: 4.35, changePercent: 2.54, latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 6.45, marketCap: "Large Cap" },
    
    // Mid Cap Stocks
    { name: "Fortinet", sector: "Technology", price: 73.80, change: -2.15, changePercent: -2.83, latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 5.95, marketCap: "Mid Cap" },
    { name: "Teradyne", sector: "Industrials", price: 137.50, change: 2.75, changePercent: 2.04, latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 5.35, marketCap: "Mid Cap" },
    { name: "Bio-Rad Labs", sector: "Healthcare", price: 322.45, change: 5.60, changePercent: 1.77, latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 4.85, marketCap: "Mid Cap" },
    { name: "First Horizon", sector: "Financial Services", price: 15.78, change: -0.22, changePercent: -1.37, latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 4.25, marketCap: "Mid Cap" },
    
    // Small Cap Stocks
    { name: "Cornerstone Building", sector: "Industrials", price: 32.45, change: 0.85, changePercent: 2.69, latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 4.85, marketCap: "Small Cap" },
    { name: "Addus HomeCare", sector: "Healthcare", price: 115.60, change: -3.15, changePercent: -2.65, latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 4.35, marketCap: "Small Cap" },
    { name: "Glacier Bancorp", sector: "Financial Services", price: 42.75, change: 0.65, changePercent: 1.54, latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 3.80, marketCap: "Small Cap" },
    { name: "Forrester Research", sector: "Technology", price: 18.35, change: -0.45, changePercent: -2.39, latestValue: randomCurrencyValue(), investedValue: randomCurrencyValue(), weight: 3.25, marketCap: "Small Cap" },
  ];

  // Get current sector data based on active market cap
  const getCurrentSectorData = () => {
    if (activeMarketCap === "All") {
      // For "All", combine and average the weights from all categories
      const allSectors = Object.values(marketCapSectorData).flat();
      const sectorMap = new Map<string, { weightSum: number, count: number, latestValue: string, investedValue: string }>();
      
      allSectors.forEach(sector => {
        if (!sectorMap.has(sector.name)) {
          sectorMap.set(sector.name, { 
            weightSum: sector.weight, 
            count: 1, 
            latestValue: sector.latestValue,
            investedValue: sector.investedValue
          });
        } else {
          const existing = sectorMap.get(sector.name)!;
          sectorMap.set(sector.name, { 
            weightSum: existing.weightSum + sector.weight, 
            count: existing.count + 1,
            latestValue: randomCurrencyValue(),
            investedValue: randomCurrencyValue()
          });
        }
      });
      
      return Array.from(sectorMap.entries()).map(([name, data]) => ({
        name,
        weight: data.weightSum / data.count,
        latestValue: data.latestValue,
        investedValue: data.investedValue
      }));
    }
    
    return marketCapSectorData[activeMarketCap];
  };

  // Get filtered stock data based on active market cap
  const getFilteredStocks = () => {
    if (activeMarketCap === "All") {
      return allStockData;
    }
    return allStockData.filter(stock => stock.marketCap === activeMarketCap);
  };

  const currentSectorData = getCurrentSectorData();
  const filteredStocks = getFilteredStocks();

  // Sort sectors by weight (highest to lowest)
  const sortedSectors = [...currentSectorData].sort((a, b) => b.weight - a.weight);

  // Calculate total weight
  const totalWeight = currentSectorData.reduce((acc, sector) => acc + sector.weight, 0);

  // Get top sectors (for color coding)
  const topSectors = [...currentSectorData].sort((a, b) => b.weight - a.weight).slice(0, 4);

  // Function to get color based on sector weight importance and market cap
  const getSectorColor = (sector: string) => {
    const colorMaps: Record<MarketCapType, Record<string, string>> = {
      "All": {
        "Technology": "#10b981", // emerald-500
        "Financial Services": "#3b82f6", // blue-500
        "Healthcare": "#8b5cf6", // violet-500
        "Consumer Discretionary": "#f59e0b", // amber-500
      },
      "Large Cap": {
        "Technology": "#10b981", // emerald-500
        "Financial Services": "#3b82f6", // blue-500
        "Healthcare": "#8b5cf6", // violet-500
        "Consumer Discretionary": "#f59e0b", // amber-500
      },
      "Mid Cap": {
        "Industrials": "#ec4899", // pink-500
        "Technology": "#06b6d4", // cyan-500
        "Healthcare": "#f97316", // orange-500
        "Financial Services": "#84cc16", // lime-500
      },
      "Small Cap": {
        "Industrials": "#14b8a6", // teal-500
        "Healthcare": "#d946ef", // fuchsia-500
        "Financial Services": "#6366f1", // indigo-500
        "Technology": "#eab308", // yellow-500
      }
    };
    
    // Check if sector is in top sectors and has specific color
    if (colorMaps[activeMarketCap] && colorMaps[activeMarketCap][sector]) {
      return colorMaps[activeMarketCap][sector];
    }
    
    // Check if sector is in the top sectors
    const isTopSector = topSectors.some(s => s.name === sector);
    
    // Return default color
    return isTopSector ? "#ec4899" : "#6b7280";
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? "text-green-500" : "text-red-500";
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-50">
      {/* Full-page dark background */}
      <div className="w-full max-w-6xl mx-auto p-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="border-b border-gray-800">
            <CardTitle className="text-2xl font-bold text-gray-50">MARKET CAP CLASSIFICATION</CardTitle>
          </CardHeader>
          <Tabs defaultValue="sectors" className="w-full">
            <TabsList className="grid grid-cols-2 max-w-[400px] mx-4 mt-4 bg-gray-800">
              <TabsTrigger value="stocks" className="text-gray-200 data-[state=active]:bg-gray-700">Stocks</TabsTrigger>
              <TabsTrigger value="sectors" className="text-gray-200 data-[state=active]:bg-gray-700">Sectors</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sectors" className="p-4">
              <div className="mb-4">
                <div className="flex space-x-2">
                  {(["All", "Large Cap", "Mid Cap", "Small Cap"] as MarketCapType[]).map((cap) => (
                    <button
                      key={cap}
                      onClick={() => setActiveMarketCap(cap)}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeMarketCap === cap
                          ? "bg-gray-700 text-gray-100"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
                      }`}
                    >
                      {cap}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {sortedSectors.map((sector) => (
                  <Card key={sector.name} className="bg-gray-800 border-gray-700 overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg font-medium text-gray-100">{sector.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <p className="text-xs text-gray-400">Latest Value</p>
                          <p className="text-sm font-medium text-gray-200">{sector.latestValue}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Invested Value</p>
                          <p className="text-sm font-medium text-gray-200">{sector.investedValue}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Weight(%)</p>
                          <p className="text-sm font-medium text-gray-200">{sector.weight.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress 
                          value={(sector.weight / totalWeight) * 100} 
                          className="h-2 bg-gray-700"
                          style={{ 
                            '--progress-background': getSectorColor(sector.name)
                          } as React.CSSProperties}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="stocks" className="p-4">
              <div className="mb-4">
                <div className="flex space-x-2">
                  {(["All", "Large Cap", "Mid Cap", "Small Cap"] as MarketCapType[]).map((cap) => (
                    <button
                      key={cap}
                      onClick={() => setActiveMarketCap(cap)}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeMarketCap === cap
                          ? "bg-gray-700 text-gray-100"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
                      }`}
                    >
                      {cap}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStocks.map((stock) => (
                  <Card key={stock.name} className="bg-gray-800 border-gray-700 overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h3 className="text-lg font-medium text-gray-100">{stock.name}</h3>
                          <p className="text-sm text-gray-400">{stock.sector}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-medium text-gray-100">{stock.price.toFixed(2)}</p>
                          <p className={`text-sm ${getChangeColor(stock.change)}`}>
                            {stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)} ({stock.change >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%)
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        <div>
                          <p className="text-xs text-gray-400">Latest Value</p>
                          <p className="text-sm font-medium text-gray-200">{stock.latestValue}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Invested Value</p>
                          <p className="text-sm font-medium text-gray-200">{stock.investedValue}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Weight(%)</p>
                          <p className="text-sm font-medium text-gray-200">{stock.weight.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="flex justify-end mt-4">
                <button className="px-4 py-2 bg-gray-800 text-gray-100 border border-gray-700 rounded-md hover:bg-gray-700 transition-colors">See All</button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Portfolio;
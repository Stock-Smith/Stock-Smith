import React, { useState, useEffect, useRef } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

// Updated interfaces to better reflect portfolio data structure
interface StockPerformance {
  ticker: string;
  name: string;
  price: number;
  changePercent: number;
}

interface GainLossData {
  gaining: number;
  losing: number;
  total: number;
  gainingPercent: number;
  losingPercent: number;
  topGainers: StockPerformance[];
  topLosers: StockPerformance[];
}

interface UnrealizedGainData {
  inProfit: number;
  inLoss: number;
  total: number;
  inProfitPercent: number;
  inLossPercent: number;
  highestProfit: StockPerformance[];
  highestLoss: StockPerformance[];
}

interface StockData {
  ticker: string;
  name: string;
  price: number;
  changePercent?: number;
  latestValue?: number;
  investedValue?: number;
  change?: number;
}

interface DailyGainLossProps {
  userId?: string;
  stockData: StockData[]; // Updated with more specific type
  priceData: Record<string, any>; // Price data from socket
}

const DailyGainLoss: React.FC<DailyGainLossProps> = ({ userId, stockData, priceData }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [todayData, setTodayData] = useState<GainLossData | null>(null);
  const [unrealizedData, setUnrealizedData] = useState<UnrealizedGainData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to track if component is mounted
  const isMounted = useRef(true);

  // Helper function to format percentages with + or - sign
  const formatPercent = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  // Helper function to determine text color based on value
  const getPercentColor = (value: number) => {
    return value >= 0 ? 'text-green-500' : 'text-red-500';
  };

  // Process real stock data instead of using mock data
  useEffect(() => {
    if (!stockData || stockData.length === 0) {
      setError("No stock data available");
      setIsLoading(false);
      return;
    }

    try {
      // Process stock data with price information
      const processedStocks = stockData.map(stock => {
        const ticker = stock.ticker?.toUpperCase() || '';
        const priceInfo = priceData[ticker] || {};
        
        // Ensure all required properties exist with fallbacks
        return {
          ...stock,
          name: stock.name || ticker,
          price: priceInfo.price || stock.price || 0,
          change: priceInfo.change || 0,
          changePercent: priceInfo.changePercent || stock.changePercent || 0,
          latestValue: stock.latestValue || 0,
          investedValue: stock.investedValue || 0
        };
      });

      // Calculate today's gain/loss
      const gainers = processedStocks.filter(stock => stock.changePercent > 0);
      const losers = processedStocks.filter(stock => stock.changePercent <= 0);
      
      const avgGainPercent = gainers.length > 0 
        ? gainers.reduce((sum, stock) => sum + stock.changePercent, 0) / gainers.length 
        : 0;
        
      const avgLossPercent = losers.length > 0 
        ? losers.reduce((sum, stock) => sum + stock.changePercent, 0) / losers.length 
        : 0;
      
      // Sort gainers and losers by changePercent
      const sortedGainers = [...gainers].sort((a, b) => b.changePercent - a.changePercent);
      const sortedLosers = [...losers].sort((a, b) => a.changePercent - b.changePercent);
      
      // Calculate unrealized gain/loss - fixing potential undefined values
      const inProfit = processedStocks.filter(stock => 
        (stock.latestValue > 0 && stock.investedValue > 0) && 
        (stock.latestValue > stock.investedValue)
      );
      
      const inLoss = processedStocks.filter(stock => 
        (stock.latestValue > 0 && stock.investedValue > 0) &&
        (stock.latestValue <= stock.investedValue)
      );
      
      // Calculate overall profit/loss percentages - with safety checks
      // Fixed: Added explicit type for 'stocks' parameter
      const calculateOverallPercent = (stocks: StockData[]): number => {
        if (stocks.length === 0) return 0;
        const totalInvested = stocks.reduce((sum, stock) => sum + (stock.investedValue || 0), 0);
        const totalLatest = stocks.reduce((sum, stock) => sum + (stock.latestValue || 0), 0);
        return totalInvested > 0 ? ((totalLatest - totalInvested) / totalInvested) * 100 : 0;
      };
      
      const inProfitPercent = calculateOverallPercent(inProfit);
      const inLossPercent = calculateOverallPercent(inLoss);
      
      // Sort by performance (latestValue / investedValue) with safety checks
      const sortedByPerformance = [...processedStocks]
        .filter(stock => stock.investedValue > 0) // Avoid division by zero
        .sort((a, b) => {
          const aPerf = (a.latestValue / a.investedValue) - 1;
          const bPerf = (b.latestValue / b.investedValue) - 1;
          return bPerf - aPerf;
        });
      
      // Map to StockPerformance format with safety checks
      const mapToPerformance = (stock: StockData): StockPerformance => ({
        ticker: stock.ticker || '',
        name: stock.name || stock.ticker || 'Unknown',
        price: stock.price || 0,
        changePercent: stock.changePercent || 0
      });
      
      // Get top performers with safety for empty arrays
      const topGainers = sortedGainers.length > 0 
        ? sortedGainers.slice(0, Math.min(3, sortedGainers.length)).map(mapToPerformance)
        : [];
        
      const topLosers = sortedLosers.length > 0
        ? sortedLosers.slice(0, Math.min(3, sortedLosers.length)).map(mapToPerformance)
        : [];
      
      // Get highest profit/loss with safety for empty arrays
      const highestProfit = sortedByPerformance.length > 0
        ? sortedByPerformance.slice(0, Math.min(3, sortedByPerformance.length)).map(stock => ({
            ticker: stock.ticker || '',
            name: stock.name || stock.ticker || 'Unknown',
            price: stock.price || 0,
            changePercent: stock.investedValue > 0 
              ? ((stock.latestValue / stock.investedValue) - 1) * 100 
              : 0
          }))
        : [];
      
      const highestLoss = sortedByPerformance.length > 0
        ? [...sortedByPerformance].reverse().slice(0, Math.min(3, sortedByPerformance.length)).map(stock => ({
            ticker: stock.ticker || '',
            name: stock.name || stock.ticker || 'Unknown',
            price: stock.price || 0,
            changePercent: stock.investedValue > 0 
              ? ((stock.latestValue / stock.investedValue) - 1) * 100 
              : 0
          }))
        : [];

      // Set data state
      setTodayData({
        gaining: gainers.length,
        losing: losers.length,
        total: processedStocks.length,
        gainingPercent: avgGainPercent,
        losingPercent: avgLossPercent,
        topGainers,
        topLosers
      });
      
      setUnrealizedData({
        inProfit: inProfit.length,
        inLoss: inLoss.length,
        total: processedStocks.length,
        inProfitPercent,
        inLossPercent,
        highestProfit,
        highestLoss
      });
      
      setIsLoading(false);
    } catch (err) {
      console.error("Error processing stock data:", err);
      setError("Failed to process stock data");
      setIsLoading(false);
    }
  }, [stockData, priceData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((placeholder) => (
          <div key={placeholder} className="bg-black bg-opacity-95 rounded-xl p-6 shadow-xl border border-gray-800 animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="flex justify-center">
                <div className="w-32 h-32 bg-gray-800 rounded-full"></div>
              </div>
              <div className="space-y-4">
                <div className="h-6 bg-gray-800 rounded w-3/4"></div>
                <div className="h-6 bg-gray-800 rounded w-2/3"></div>
                <div className="h-6 bg-gray-800 rounded w-3/4"></div>
                <div className="h-6 bg-gray-800 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error || !todayData || !unrealizedData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-black bg-opacity-95 rounded-xl p-6 shadow-xl border border-red-800">
          <h2 className="text-red-500 text-xl font-bold mb-4">Error Loading Data</h2>
          <p className="text-gray-300">{error || "Failed to load data. Please try again later."}</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Safety check for empty lists to avoid rendering errors
  const hasGainers = todayData.topGainers && todayData.topGainers.length > 0;
  const hasLosers = todayData.topLosers && todayData.topLosers.length > 0;
  const hasProfit = unrealizedData.highestProfit && unrealizedData.highestProfit.length > 0;
  const hasLoss = unrealizedData.highestLoss && unrealizedData.highestLoss.length > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Today's Gain */}
      <div className="bg-black bg-opacity-95 rounded-xl p-6 shadow-xl border border-gray-800">
        <h2 className="text-white text-xl font-bold mb-4">TODAY'S GAIN</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Donut chart */}
          <div className="flex justify-center">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Background circle */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="transparent" 
                  stroke="#333" 
                  strokeWidth="15" 
                />
                
                {/* Gaining segment - protect against NaN */}
                {todayData.total > 0 && (
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent" 
                    stroke="#22c55e" 
                    strokeWidth="15" 
                    strokeDasharray="251.2" 
                    strokeDashoffset={251.2 - (251.2 * todayData.gaining / todayData.total)}
                    transform="rotate(-90 50 50)" 
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-sm text-gray-300">
                <span className="text-xs">% Investment</span>
              </div>
            </div>
          </div>
          
          {/* Right side - Stats */}
          <div className="flex flex-col justify-center">
            {/* Gaining stocks */}
            <div className="mb-4">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-gray-300">{todayData.gaining} of {todayData.total} Gaining</span>
              </div>
              <div className={`text-lg font-semibold ${getPercentColor(todayData.gainingPercent)} ml-4`}>
                <ArrowUpRight size={16} className="inline mr-1" />
                {formatPercent(todayData.gainingPercent)}
              </div>
            </div>
            
            {/* Losing stocks */}
            <div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                <span className="text-gray-300">{todayData.losing} of {todayData.total} Losing</span>
              </div>
              <div className={`text-lg font-semibold ${getPercentColor(todayData.losingPercent)} ml-4`}>
                <ArrowDownRight size={16} className="inline mr-1" />
                {formatPercent(todayData.losingPercent)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Top gainers and losers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Top Gainers */}
          <div>
            <h3 className="text-green-500 text-sm font-medium mb-2 border-b border-gray-800 pb-1">GAINING STOCKS</h3>
            {hasGainers ? (
              todayData.topGainers.map((stock, index) => (
                <div key={`gainer-${stock.ticker}-${index}`} className="mb-2">
                  <div className="text-gray-300">{stock.name}</div>
                  <div className="flex justify-between items-center">
                    <div className="text-gray-400">${stock.price.toFixed(2)}</div>
                    <div className={`${getPercentColor(stock.changePercent)}`}>
                      <ArrowUpRight size={12} className="inline mr-1" />
                      {formatPercent(stock.changePercent)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400">No gaining stocks to display</div>
            )}
          </div>
          
          {/* Top Losers */}
          <div>
            <h3 className="text-red-500 text-sm font-medium mb-2 border-b border-gray-800 pb-1">LOSING STOCKS</h3>
            {hasLosers ? (
              todayData.topLosers.map((stock, index) => (
                <div key={`loser-${stock.ticker}-${index}`} className="mb-2">
                  <div className="text-gray-300">{stock.name}</div>
                  <div className="flex justify-between items-center">
                    <div className="text-gray-400">${stock.price.toFixed(2)}</div>
                    <div className={`${getPercentColor(stock.changePercent)}`}>
                      <ArrowDownRight size={12} className="inline mr-1" />
                      {formatPercent(stock.changePercent)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400">No losing stocks to display</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Unrealized Gain */}
      <div className="bg-black bg-opacity-95 rounded-xl p-6 shadow-xl border border-gray-800">
        <h2 className="text-white text-xl font-bold mb-4">UNREALIZED GAIN</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Donut chart */}
          <div className="flex justify-center">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Background circle */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="transparent" 
                  stroke="#333" 
                  strokeWidth="15" 
                />
                
                {/* In profit segment - protect against NaN */}
                {unrealizedData.total > 0 && (
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent" 
                    stroke="#10b981" 
                    strokeWidth="15" 
                    strokeDasharray="251.2" 
                    strokeDashoffset={251.2 - (251.2 * unrealizedData.inProfit / unrealizedData.total)}
                    transform="rotate(-90 50 50)" 
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-sm text-gray-300">
                <span className="text-xs">% Investment</span>
              </div>
            </div>
          </div>
          
          {/* Right side - Stats */}
          <div className="flex flex-col justify-center">
            {/* In profit stocks */}
            <div className="mb-4">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-gray-300">{unrealizedData.inProfit} of {unrealizedData.total} In Profit</span>
              </div>
              <div className={`text-lg font-semibold ${getPercentColor(unrealizedData.inProfitPercent)} ml-4`}>
                <ArrowUpRight size={16} className="inline mr-1" />
                {formatPercent(unrealizedData.inProfitPercent)}
              </div>
            </div>
            
            {/* In loss stocks */}
            <div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                <span className="text-gray-300">{unrealizedData.inLoss} of {unrealizedData.total} In Loss</span>
              </div>
              <div className={`text-lg font-semibold ${getPercentColor(unrealizedData.inLossPercent)} ml-4`}>
                <ArrowDownRight size={16} className="inline mr-1" />
                {formatPercent(unrealizedData.inLossPercent)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Highest profit and loss */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Highest Profit */}
          <div>
            <h3 className="text-green-500 text-sm font-medium mb-2 border-b border-gray-800 pb-1">HIGHEST PROFIT</h3>
            {hasProfit ? (
              unrealizedData.highestProfit.map((stock, index) => (
                <div key={`profit-${stock.ticker}-${index}`} className="mb-2">
                  <div className="text-gray-300">{stock.name}</div>
                  <div className="flex justify-between items-center">
                    <div className="text-gray-400">${stock.price.toFixed(2)}</div>
                    <div className={`${getPercentColor(stock.changePercent)}`}>
                      <ArrowUpRight size={12} className="inline mr-1" />
                      {formatPercent(stock.changePercent)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400">No stocks in profit to display</div>
            )}
          </div>
          
          {/* Highest Loss */}
          <div>
            <h3 className="text-red-500 text-sm font-medium mb-2 border-b border-gray-800 pb-1">HIGHEST LOSS</h3>
            {hasLoss ? (
              unrealizedData.highestLoss.map((stock, index) => (
                <div key={`loss-${stock.ticker}-${index}`} className="mb-2">
                  <div className="text-gray-300">{stock.name}</div>
                  <div className="flex justify-between items-center">
                    <div className="text-gray-400">
                      ${stock.price.toFixed(2)}
                    </div>
                    <div className={`${getPercentColor(stock.changePercent)}`}>
                      <ArrowDownRight size={12} className="inline mr-1" />
                      {formatPercent(stock.changePercent)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400">No stocks in loss to display</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyGainLoss;
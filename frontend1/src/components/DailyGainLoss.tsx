import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { GainLossData, UnrealizedGainData } from "../lib/portfolioTypes";
import { todayGainLossData, unrealizedGainLossData } from "../lib/portfolioData";

interface DailyGainLossProps {
  todayData?: GainLossData;
  unrealizedData?: UnrealizedGainData;
}

const DailyGainLoss: React.FC<DailyGainLossProps> = ({ 
  todayData = todayGainLossData, 
  unrealizedData = unrealizedGainLossData 
}) => {
  // Helper function to format percentages with + or - sign
  const formatPercent = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  // Helper function to determine text color based on value
  const getPercentColor = (value: number) => {
    return value >= 0 ? 'text-green-500' : 'text-red-500';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                
                {/* Gaining segment */}
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
            {todayData.topGainers.map((stock, index) => (
              <div key={index} className="mb-2">
                <div className="text-gray-300">{stock.name}</div>
                <div className="flex justify-between items-center">
                  <div className="text-gray-400">{stock.price.toFixed(2)}</div>
                  <div className={`${getPercentColor(stock.changePercent)}`}>
                    <ArrowUpRight size={12} className="inline mr-1" />
                    {formatPercent(stock.changePercent)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Top Losers */}
          <div>
            <h3 className="text-red-500 text-sm font-medium mb-2 border-b border-gray-800 pb-1">LOSING STOCKS</h3>
            {todayData.topLosers.map((stock, index) => (
              <div key={index} className="mb-2">
                <div className="text-gray-300">{stock.name}</div>
                <div className="flex justify-between items-center">
                  <div className="text-gray-400">{stock.price.toFixed(2)}</div>
                  <div className={`${getPercentColor(stock.changePercent)}`}>
                    <ArrowDownRight size={12} className="inline mr-1" />
                    {formatPercent(stock.changePercent)}
                  </div>
                </div>
              </div>
            ))}
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
                
                {/* In profit segment */}
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
            {unrealizedData.highestProfit.map((stock, index) => (
              <div key={index} className="mb-2">
                <div className="text-gray-300">{stock.name}</div>
                <div className="flex justify-between items-center">
                  <div className="text-gray-400">{stock.price.toFixed(2)}</div>
                  <div className={`${getPercentColor(stock.changePercent)}`}>
                    <ArrowUpRight size={12} className="inline mr-1" />
                    {formatPercent(stock.changePercent)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Highest Loss */}
          <div>
            <h3 className="text-red-500 text-sm font-medium mb-2 border-b border-gray-800 pb-1">HIGHEST LOSS</h3>
            {unrealizedData.highestLoss.map((stock, index) => (
              <div key={index} className="mb-2">
                <div className="text-gray-300">{stock.name}</div>
                <div className="flex justify-between items-center">
                  <div className="text-gray-400">
                    {stock.price ? stock.price.toFixed(2) : "N/A"}
                  </div>
                  <div className={`${getPercentColor(stock.changePercent)}`}>
                    <ArrowDownRight size={12} className="inline mr-1" />
                    {formatPercent(stock.changePercent)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyGainLoss;
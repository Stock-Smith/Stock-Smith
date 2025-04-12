import React from "react";
import { ArrowUpRight, ArrowDownRight, ArrowRight } from "lucide-react";
import { AssetsSummary as AssetsSummaryType, PortfolioScoreData } from "../lib/portfolioTypes";
import { assetsSummaryData, portfolioScoreData } from "../lib/portfolioData";

interface AssetsSummaryProps {
  data?: AssetsSummaryType;
  scoreData?: PortfolioScoreData;
}

const AssetsSummary: React.FC<AssetsSummaryProps> = ({ 
  data = assetsSummaryData,
  scoreData = portfolioScoreData
}) => {
  // Helper function to format percentages with + or - sign
  const formatPercent = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  // Helper function to determine text color based on value
  const getValueColor = (value: string) => {
    return value.includes('(') ? 'text-red-500' : 'text-green-500';
  };

  const getPercentColor = (value: number) => {
    return value >= 0 ? 'text-green-500' : 'text-red-500';
  };

  // Helper function to determine icons
  const getIcon = (value: number) => {
    return value >= 0 ? 
      <ArrowUpRight size={14} className="inline mr-1" /> : 
      <ArrowDownRight size={14} className="inline mr-1" />;
  };

  return (
    <div className="bg-black bg-opacity-95 rounded-xl p-6 shadow-xl border border-gray-800 mt-6">
      <h2 className="text-white text-xl font-bold mb-6">MY ASSETS</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left side - Asset values */}
        <div className="lg:col-span-3 bg-black bg-opacity-70 rounded-lg p-4">
          <div className="mb-6">
            <div className="text-gray-400 text-sm mb-1">Latest Value</div>
            <div className="text-white text-2xl font-bold">{data.latestValue}</div>
          </div>
          
          <div>
            <div className="text-gray-400 text-sm mb-1">Investment Cost</div>
            <div className="text-white text-2xl font-bold">{data.investmentCost}</div>
          </div>
        </div>
        
        {/* Middle - Unrealized Gain */}
        <div className="lg:col-span-4 bg-black bg-opacity-70 rounded-lg p-4">
          <h3 className="text-gray-300 text-lg mb-4">Unrealized Gain</h3>
          
          <div className="mb-4">
            <div className="text-gray-400 text-sm mb-1">Overall Gain</div>
            <div className="flex justify-between">
              <div className={`font-semibold ${getValueColor(data.unrealizedGain.overallGain.value)}`}>
                {data.unrealizedGain.overallGain.value}
              </div>
              <div className={`font-semibold ${getPercentColor(data.unrealizedGain.overallGain.percent)}`}>
                ({formatPercent(data.unrealizedGain.overallGain.percent)})
              </div>
            </div>
          </div>
          
          <div>
            <div className="text-gray-400 text-sm mb-1">Today's Gain</div>
            <div className="flex justify-between">
              <div className={`font-semibold ${getValueColor(data.unrealizedGain.todaysGain.value)}`}>
                {data.unrealizedGain.todaysGain.value}
              </div>
              <div className={`font-semibold ${getPercentColor(data.unrealizedGain.todaysGain.percent)}`}>
                ({formatPercent(data.unrealizedGain.todaysGain.percent)})
              </div>
            </div>
          </div>
        </div>
        
        {/* Right - Realized Gain */}
        <div className="lg:col-span-5 bg-black bg-opacity-70 rounded-lg p-4">
          <h3 className="text-gray-300 text-lg mb-4">Realized Gain</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-gray-400 text-sm mb-1">Realized Gain</div>
              <div className="text-green-500 font-semibold">{data.realizedGain.total}</div>
            </div>
            
            <div>
              <div className="text-gray-400 text-sm mb-1">Capital Gain</div>
              <div className="text-green-500 font-semibold">{data.realizedGain.capitalGain}</div>
            </div>
            
            <div>
              <div className="text-gray-400 text-sm mb-1">Other Gain</div>
              <div className="text-green-500 font-semibold">{data.realizedGain.otherGain}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 text-center mt-4">
        Unrealized and Realized gain for current holdings in portfolio
      </div>
      
      {/* Portfolio Score */}
      <div className="mt-8 border-t border-gray-800 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-xl font-bold">PORTFOLIO SCORE</h2>
          <button className="text-gray-400 hover:text-white">
            <ArrowRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-6">
          {/* Main score gauge */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="transparent" 
                stroke="#333" 
                strokeWidth="8" 
              />
              
              {/* Progress circle */}
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="transparent" 
                stroke="url(#scoreGradient)" 
                strokeWidth="8" 
                strokeDasharray="283" 
                strokeDashoffset={283 - (283 * scoreData.overallScore / 100)}
                transform="rotate(-90 50 50)" 
              />
              
              {/* Gradient definition */}
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="50%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Score text */}
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold text-white">{scoreData.overallScore}</span>
              <span className="text-gray-400 text-xs">/100</span>
            </div>
          </div>

          {/* Score breakdown */}
          <div className="grid grid-cols-3 gap-4 w-full">
            {/* Quality Score */}
            <div className="bg-black bg-opacity-60 border border-green-900 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-green-500">
                {scoreData.qualityScore}
                <span className="text-gray-400 text-xs ml-1">/100</span>
              </div>
              <div className="text-gray-300 text-xs mt-1">Quality Score</div>
            </div>
            
            {/* Momentum Score */}
            <div className="bg-black bg-opacity-60 border border-yellow-900 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-yellow-500">
                {scoreData.momentumScore}
                <span className="text-gray-400 text-xs ml-1">/100</span>
              </div>
              <div className="text-gray-300 text-xs mt-1">Momentum Score</div>
            </div>
            
            {/* Diversification Score */}
            <div className="bg-black bg-opacity-60 border border-green-900 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-green-500">
                {scoreData.diversificationScore}
                <span className="text-gray-400 text-xs ml-1">/100</span>
              </div>
              <div className="text-gray-300 text-xs mt-1">Diversification Score</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetsSummary;
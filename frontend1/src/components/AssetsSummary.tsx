import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface AssetsSummaryProps {
  data: {
    latestValue: number;
    investmentCost: number;
    overallGain: number;
    overallGainPercentage: number;
    todayGain: number;
    todayGainPercentage: number;
    realizedGain: number;
    capitalGain: number;
    otherGain: number;
    beta : number;
    
  };
}

const AssetsSummary: React.FC<AssetsSummaryProps> = ({ data }) => {
  // Helper function to format currency 
  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper function to format percentages with + or - sign
  const formatPercent = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  // Helper function to determine text color based on value
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
            <div className="text-white text-2xl font-bold">{formatCurrency(data.latestValue)}</div>
          </div>
          
          <div>
            <div className="text-gray-400 text-sm mb-1">Investment Cost</div>
            <div className="text-white text-2xl font-bold">{formatCurrency(data.investmentCost)}</div>
          </div>
        </div>
        
        {/* Middle - Unrealized Gain */}
        <div className="lg:col-span-4 bg-black bg-opacity-70 rounded-lg p-4">
          <h3 className="text-gray-300 text-lg mb-4">Unrealized Gain</h3>
          
          <div className="mb-4">
            <div className="text-gray-400 text-sm mb-1">Overall Gain</div>
            <div className="flex justify-between">
              <div className={`font-semibold ${getPercentColor(data.overallGain)}`}>
                {formatCurrency(data.overallGain)}
              </div>
              <div className={`font-semibold ${getPercentColor(data.overallGainPercentage)}`}>
                {getIcon(data.overallGainPercentage)}
                {formatPercent(data.overallGainPercentage)}
              </div>
            </div>
          </div>
          
          <div>
            <div className="text-gray-400 text-sm mb-1">Today's Gain</div>
            <div className="flex justify-between">
              <div className={`font-semibold ${getPercentColor(data.todayGain)}`}>
                {formatCurrency(data.todayGain)}
              </div>
              <div className={`font-semibold ${getPercentColor(data.todayGainPercentage)}`}>
                {getIcon(data.todayGainPercentage)}
                {formatPercent(data.todayGainPercentage)}
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
              <div className="text-green-500 font-semibold">{formatCurrency(data.realizedGain)}</div>
            </div>
            
            <div>
              <div className="text-gray-400 text-sm mb-1">Capital Gain</div>
              <div className="text-green-500 font-semibold">{formatCurrency(data.capitalGain)}</div>
            </div>
            
            <div>
              <div className="text-gray-400 text-sm mb-1">Other Gain</div>
              <div className="text-green-500 font-semibold">{formatCurrency(data.otherGain)}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 text-center mt-4">
        Unrealized and Realized gain for current holdings in portfolio
      </div>
    </div>
  );
};

export default AssetsSummary;
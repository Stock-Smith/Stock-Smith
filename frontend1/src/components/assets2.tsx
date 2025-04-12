import React from "react";
import { ArrowUp, ArrowDown, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StockGain {
  name: string;
  price: number;
  changePercent: number;
}

interface GainSummaryProps {
  todayGainingStocks: number;
  todayLosingStocks: number;
  totalStocks: number;
  todayGainPercent: number;
  todayLossPercent: number;
  profitStocks: number;
  lossStocks: number;
  overallGainPercent: number;
  overallLossPercent: number;
  topGainingStocks: StockGain[];
  topLosingStocks: StockGain[];
  highestProfitStocks: StockGain[];
  highestLossStocks: StockGain[];
}

const GainSummary: React.FC<GainSummaryProps> = ({
  todayGainingStocks,
  todayLosingStocks,
  totalStocks,
  todayGainPercent,
  todayLossPercent,
  profitStocks,
  lossStocks,
  overallGainPercent,
  overallLossPercent,
  topGainingStocks,
  topLosingStocks,
  highestProfitStocks,
  highestLossStocks,
}) => {
  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Gain */}
        <Card className="bg-gray-900 rounded-xl border border-gray-800">
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-gray-100 font-medium uppercase text-sm">TODAY'S GAIN</h3>
            </div>
            <div className="p-4 flex">
              {/* Progress Donut Chart */}
              <div className="w-24 h-24 relative flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Red background circle (losing) */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f87171" strokeWidth="16" />
                  
                  {/* Green overlay for gaining portion */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="16"
                    strokeDasharray={`${(todayGainingStocks / totalStocks) * 251.2} 251.2`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-300">
                  <span>% Investment</span>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex-1 ml-4">
                <div className="mb-4">
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="font-medium">{todayGainingStocks}</span>
                    <span className="text-gray-400 ml-1">of {totalStocks} Gaining</span>
                  </div>
                  <div className="flex items-center text-green-400 text-sm mt-1 ml-4">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    <span>{todayGainPercent.toFixed(1)}%</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                    <span className="font-medium">{todayLosingStocks}</span>
                    <span className="text-gray-400 ml-1">of {totalStocks} Losing</span>
                  </div>
                  <div className="flex items-center text-red-400 text-sm mt-1 ml-4">
                    <ArrowDown className="h-3 w-3 mr-1" />
                    <span>{Math.abs(todayLossPercent).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stock Lists */}
            <div className="grid grid-cols-2 gap-4 p-4 pt-0">
              <div>
                <h4 className="uppercase text-xs font-medium text-green-500 mb-2 border-b border-gray-800 pb-1">
                  GAINING STOCKS
                </h4>
                <ul className="space-y-2">
                  {topGainingStocks.map((stock, index) => (
                    <li key={index} className="text-sm">
                      <div className="text-gray-200">{stock.name}</div>
                      <div className="flex items-center">
                        <span className="text-gray-400">{stock.price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}</span>
                        <span className="flex items-center text-green-400 ml-2 text-xs">
                          <ArrowUp className="h-3 w-3 mr-1" /> {stock.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="uppercase text-xs font-medium text-red-500 mb-2 border-b border-gray-800 pb-1">
                  LOSING STOCKS
                </h4>
                <ul className="space-y-2">
                  {topLosingStocks.map((stock, index) => (
                    <li key={index} className="text-sm">
                      <div className="text-gray-200">{stock.name}</div>
                      <div className="flex items-center">
                        <span className="text-gray-400">{stock.price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}</span>
                        <span className="flex items-center text-red-400 ml-2 text-xs">
                          <ArrowDown className="h-3 w-3 mr-1" /> {Math.abs(stock.changePercent).toFixed(2)}%
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Unrealized Gain */}
        <Card className="bg-gray-900 rounded-xl border border-gray-800">
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-gray-100 font-medium uppercase text-sm">UNREALIZED GAIN</h3>
            </div>
            <div className="p-4 flex">
              {/* Progress Donut Chart */}
              <div className="w-24 h-24 relative flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Red background circle (losing) */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f87171" strokeWidth="16" strokeDasharray="251.2" />
                  
                  {/* Green overlay for profit portion */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="16"
                    strokeDasharray={`${(profitStocks / totalStocks) * 251.2} 251.2`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-300">
                  <span>% Investment</span>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex-1 ml-4">
                <div className="mb-4">
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="font-medium">{profitStocks}</span>
                    <span className="text-gray-400 ml-1">of {totalStocks} In Profit</span>
                  </div>
                  <div className="flex items-center text-green-400 text-sm mt-1 ml-4">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    <span>{overallGainPercent.toFixed(1)}%</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                    <span className="font-medium">{lossStocks}</span>
                    <span className="text-gray-400 ml-1">of {totalStocks} In Loss</span>
                  </div>
                  <div className="flex items-center text-red-400 text-sm mt-1 ml-4">
                    <ArrowDown className="h-3 w-3 mr-1" />
                    <span>{Math.abs(overallLossPercent).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stock Lists */}
            <div className="grid grid-cols-2 gap-4 p-4 pt-0">
              <div>
                <h4 className="uppercase text-xs font-medium text-green-500 mb-2 border-b border-gray-800 pb-1">
                  HIGHEST PROFIT
                </h4>
                <ul className="space-y-2">
                  {highestProfitStocks.map((stock, index) => (
                    <li key={index} className="text-sm">
                      <div className="text-gray-200">{stock.name}</div>
                      <div className="flex items-center">
                        <span className="text-gray-400">{stock.price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}</span>
                        <span className="flex items-center text-green-400 ml-2 text-xs">
                          <ArrowUp className="h-3 w-3 mr-1" /> {stock.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="uppercase text-xs font-medium text-red-500 mb-2 border-b border-gray-800 pb-1">
                  HIGHEST LOSS
                </h4>
                <ul className="space-y-2">
                  {highestLossStocks.map((stock, index) => (
                    <li key={index} className="text-sm">
                      <div className="text-gray-200">{stock.name}</div>
                      <div className="flex items-center">
                        <span className="text-gray-400">{stock.price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}</span>
                        <span className="flex items-center text-red-400 ml-2 text-xs">
                          <ArrowDown className="h-3 w-3 mr-1" /> {Math.abs(stock.changePercent).toFixed(2)}%
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Portfolio Score Card */}
        <Card className="md:col-span-2 bg-gray-900 rounded-xl border border-gray-800">
          <CardContent className="p-0">
            <div className="p-4 flex justify-between items-center border-b border-gray-800">
              <h3 className="text-gray-100 font-medium uppercase text-sm">PORTFOLIO SCORE</h3>
              <ChevronRight className="h-5 w-5 text-blue-400" />
            </div>
            
            <div className="p-6 flex items-center">
              {/* Score Meter */}
              <div className="w-20 h-20 relative flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Gray background circle */}
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#374151" strokeWidth="10" />
                  
                  {/* Colored progress arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#scoreGradient)"
                    strokeWidth="10"
                    strokeDasharray={`${(79/100) * 282.6} 282.6`}
                    strokeLinecap="round"
                    transform="rotate(-180 50 50)"
                  />
                  
                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="50%" stopColor="#eab308" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-green-400">79</span>
                  <span className="text-xs text-gray-400">/100</span>
                </div>
              </div>
              
              {/* Score Breakdowns */}
              <div className="flex-1 ml-8 grid grid-cols-3 gap-2">
                <div className="border border-green-600 bg-green-900/10 rounded-md p-3">
                  <div className="text-green-400 font-medium">100<span className="text-xs text-gray-400 ml-1">/100</span></div>
                  <div className="text-xs text-gray-300 mt-1">Quality <span className="text-gray-400">Score</span></div>
                </div>
                
                <div className="border border-yellow-600 bg-yellow-900/10 rounded-md p-3">
                  <div className="text-yellow-400 font-medium">40<span className="text-xs text-gray-400 ml-1">/100</span></div>
                  <div className="text-xs text-gray-300 mt-1">Momentum <span className="text-gray-400">Score</span></div>
                </div>
                
                <div className="border border-green-600 bg-green-900/10 rounded-md p-3">
                  <div className="text-green-400 font-medium">70<span className="text-xs text-gray-400 ml-1">/100</span></div>
                  <div className="text-xs text-gray-300 mt-1">Diversification <span className="text-gray-400">Score</span></div>
                </div>
              </div>
            </div>
            
            {/* Links */}
            <div className="p-4 border-t border-gray-800 text-xs text-gray-400">
              <div className="flex flex-wrap gap-2">
                <span className="font-medium">More on Stocks »</span>
                <span className="text-blue-400">Transaction History</span>
                <span className="text-gray-500">|</span>
                <span className="text-blue-400">Live Prices</span>
                <span className="text-gray-500">|</span>
                <span className="text-blue-400">Annualized Returns</span>
                <span className="text-gray-500">|</span>
                <span className="text-blue-400">Compare Performance</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GainSummary;
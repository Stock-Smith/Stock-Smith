import React from "react";
import { ArrowRight, CircleCheck } from "lucide-react";
import { PortfolioScoreData } from "../lib/portfolioTypes";
import { portfolioScoreData } from "../lib/portfolioData";

interface PortfolioScoreProps {
  data?: PortfolioScoreData;
}

const PortfolioScore: React.FC<PortfolioScoreProps> = ({ data = portfolioScoreData }) => {
  // Determine the color of the score gauge based on the score value
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="bg-black bg-opacity-95 rounded-xl p-6 shadow-xl border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-xl font-bold">PORTFOLIO SCORE</h2>
        <button className="text-gray-400 hover:text-white">
          <ArrowRight size={20} />
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Main score gauge */}
        <div className="relative w-36 h-36 flex items-center justify-center">
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
            
            {/* Progress circle - dynamically calculated based on score */}
            <circle 
              cx="50" 
              cy="50" 
              r="45" 
              fill="transparent" 
              stroke="url(#scoreGradient)" 
              strokeWidth="8" 
              strokeDasharray="283" 
              strokeDashoffset={283 - (283 * data.overallScore / 100)}
              transform="rotate(-90 50 50)" 
            />
            
            {/* Gradient definition for the progress circle */}
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Score text in the center */}
          <div className="absolute flex flex-col items-center">
            <span className={`text-3xl font-bold ${getScoreColor(data.overallScore)}`}>
              {data.overallScore}
            </span>
            <span className="text-gray-400 text-xs">/100</span>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {/* Quality Score */}
          <div className="bg-black bg-opacity-60 border border-green-900 rounded-lg p-4 text-center flex flex-col items-center">
            <div className="text-3xl font-bold text-green-500">
              {data.qualityScore}
              <span className="text-gray-400 text-sm ml-1">/100</span>
            </div>
            <div className="text-gray-300 text-sm mt-1">Quality Score</div>
          </div>
          
          {/* Momentum Score */}
          <div className="bg-black bg-opacity-60 border border-yellow-900 rounded-lg p-4 text-center flex flex-col items-center">
            <div className="text-3xl font-bold text-yellow-500">
              {data.momentumScore}
              <span className="text-gray-400 text-sm ml-1">/100</span>
            </div>
            <div className="text-gray-300 text-sm mt-1">Momentum Score</div>
          </div>
          
          {/* Diversification Score */}
          <div className="bg-black bg-opacity-60 border border-green-900 rounded-lg p-4 text-center flex flex-col items-center">
            <div className="text-3xl font-bold text-green-500">
              {data.diversificationScore}
              <span className="text-gray-400 text-sm ml-1">/100</span>
            </div>
            <div className="text-gray-300 text-sm mt-1">Diversification Score</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioScore;
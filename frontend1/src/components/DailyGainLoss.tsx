import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Stock {
  ticker: string;
  investedValue: number;
  quantity: number;
}

// Update PriceData interface to match parent's type
interface PriceData {
  [ticker: string]: {
    price: number;       // Required
    prevClose?: number;  // Optional
  };
}


interface DailyGainLossProps {
  stockData: Stock[];
  priceData: PriceData;
  todayGain?: number;
  todayGainPercentage?: number;
}



const DailyGainLoss: React.FC<DailyGainLossProps> = ({
  stockData,
  priceData,
  todayGain,
  todayGainPercentage,
}) => {
  // Calculate today's gain/loss if not provided
  let gain = 0;
  let invested = 0;
  let gainPct = 0;

  if (todayGain === undefined || todayGainPercentage === undefined) {
    stockData.forEach((stock) => {
      const priceObj = priceData[stock.ticker];
      if (priceObj?.prevClose !== undefined && priceObj.price !== undefined) {
        const diff = (priceObj.price - priceObj.prevClose) * stock.quantity;
        gain += diff;
        invested += stock.investedValue;
      }
    });
    gainPct = invested ? (gain / invested) * 100 : 0;
  } else {
    gain = todayGain;
    gainPct = todayGainPercentage;
  }

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatPercent = (value: number) => {
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
  <div className="bg-gray-800/20 p-4 rounded-lg">
    <h3 className="text-lg font-semibold mb-2">Today's Gain/Loss</h3>
    
    <div className={`text-2xl font-bold ${gain >= 0 ? "text-green-500" : "text-red-500"}`}>
      {gain >= 0 ? "+" : ""}{formatCurrency(gain)}
    </div>
    
    <div className={`text-lg ${gainPct >= 0 ? "text-green-500" : "text-red-500"}`}>
      {formatPercent(gainPct)}
    </div>
    
    <p className="text-sm text-gray-600 mt-2">
      Calculated based on today's price change across all holdings.
    </p>
  </div>
);
}

export default DailyGainLoss;


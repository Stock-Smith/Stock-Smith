export interface SectorData {
    name: string;
    weight: number;
    latestValue: string;
    investedValue: string;
    color: string;
  }
  
  export interface StockData {
    ticker: string;
    name: string;
    sector: string;
    price: number;
    change: number;
    changePercent: number;
    weight: number;
    marketCap: "Large Cap" | "Mid Cap" | "Small Cap";
    latestValue: string;
    investedValue: string;
  }
  
  export type MarketCapType = "All" | "Large Cap" | "Mid Cap" | "Small Cap";
  
  export interface StockSummary {
    ticker: string;
    name: string;
    price: number;
    changePercent: number;
  }
  
  export interface GainLossData {
    gaining: number;
    gainingPercent: number;
    losing: number;
    losingPercent: number;
    total: number;
    topGainers: StockSummary[];
    topLosers: StockSummary[];
  }
  
  export interface UnrealizedGainData {
    inProfit: number;
    inProfitPercent: number;
    inLoss: number;
    inLossPercent: number;
    total: number;
    highestProfit: StockSummary[];
    highestLoss: StockSummary[];
  }
  
  export interface PortfolioScoreData {
    overallScore: number;
    qualityScore: number;
    momentumScore: number;
    diversificationScore: number;
  }
  
  export interface AssetsSummary {
    latestValue: string;
    investmentCost: string;
    unrealizedGain: {
      overallGain: {
        value: string;
        percent: number;
      };
      todaysGain: {
        value: string;
        percent: number;
      };
    };
    realizedGain: {
      total: string;
      capitalGain: string;
      otherGain: string;
    };
  }
  
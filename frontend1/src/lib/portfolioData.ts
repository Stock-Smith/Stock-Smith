import { 
    SectorData, 
    StockData, 
    MarketCapType, 
    GainLossData, 
    UnrealizedGainData,
    PortfolioScoreData,
    AssetsSummary
  } from "../lib/portfolioTypes";
  
  // Sector data
  export const allSectorsData: SectorData[] = [
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
  export const allStockData: StockData[] = [
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
  
  // Market cap sector data
  export const marketCapSectorData: Record<Exclude<MarketCapType, "All">, SectorData[]> = {
    "Large Cap": [
      { name: "Technology", latestValue: "$243,891.25", investedValue: "$220,501.40", weight: 22.35, color: "#3b82f6" },
      { name: "Financial Services", latestValue: "$187,425.60", investedValue: "$165,320.75", weight: 15.80, color: "#8b5cf6" },
      { name: "Healthcare", latestValue: "$142,390.18", investedValue: "$130,478.10", weight: 12.45, color: "#ec4899" },
      { name: "Consumer Goods", latestValue: "$121,587.45", investedValue: "$109,254.30", weight: 10.25, color: "#10b981" },
      { name: "Energy", latestValue: "$103,478.25", investedValue: "$98,630.45", weight: 9.45, color: "#f59e0b" },
    ],
    "Mid Cap": [
      { name: "Industrials", latestValue: "$142,390.18", investedValue: "$130,478.10", weight: 17.50, color: "#6366f1" },
      { name: "Technology", latestValue: "$121,587.45", investedValue: "$109,254.30", weight: 14.90, color: "#0ea5e9" },
      { name: "Healthcare", latestValue: "$103,478.25", investedValue: "$98,630.45", weight: 13.25, color: "#14b8a6" },
      { name: "Consumer Discretionary", latestValue: "$98,760.35", investedValue: "$95,410.20", weight: 12.90, color: "#a855f7" },
      { name: "Materials", latestValue: "$87,254.15", investedValue: "$82,410.30", weight: 10.80, color: "#f97316" },
    ],
    "Small Cap": [
      { name: "Industrials", latestValue: "$87,254.15", investedValue: "$82,410.30", weight: 18.20, color: "#ec4899" },
      { name: "Healthcare", latestValue: "$75,430.65", investedValue: "$70,125.80", weight: 15.35, color: "#8b5cf6" },
      { name: "Financial Services", latestValue: "$65,890.70", investedValue: "$59,480.25", weight: 12.80, color: "#3b82f6" },
      { name: "Technology", latestValue: "$54,780.25", investedValue: "$51,320.40", weight: 11.50, color: "#10b981" },
      { name: "Real Estate", latestValue: "$45,670.85", investedValue: "$42,890.10", weight: 9.75, color: "#f59e0b" }
    ],
  };
  
  // Today's gain/loss data
  export const todayGainLossData: GainLossData = {
    gaining: 3,
    gainingPercent: 1.3,
    losing: 36,
    losingPercent: -2.8,
    total: 39,
    topGainers: [
      { ticker: "HDFCBANK", name: "HDFC Bank", price: 1731.10, changePercent: 1.86 },
      { ticker: "GMM", name: "GMM Pfaudler", price: 1111.45, changePercent: 1.02 }
    ],
    topLosers: [
      { ticker: "GRANULES", name: "Granules India", price: 461.55, changePercent: -9.09 },
      { ticker: "DEEPAKFERT", name: "Deepak Fert", price: 952.90, changePercent: -7.28 }
    ]
  };
  
  // Unrealized gain/loss data
  export const unrealizedGainLossData: UnrealizedGainData = {
    inProfit: 16,
    inProfitPercent: 39,
    inLoss: 23,
    inLossPercent: -14.8,
    total: 39,
    highestProfit: [
      { ticker: "VEDL", name: "Vedanta", price: 394.75, changePercent: 77.79 },
      { ticker: "CHAMBLFERT", name: "Chambal Fert", price: 533.70, changePercent: 97.92 }
    ],
    highestLoss: [
      { ticker: "BAJAJAMINE", name: "Bajaj Amines", price: 0, changePercent: -33.22 },
      { ticker: "ALLCARGO", name: "Allcargo", price: 0, changePercent: -49.31 }
    ]
  };
  
  // Portfolio score data
  export const portfolioScoreData: PortfolioScoreData = {
    overallScore: 79,
    qualityScore: 100,
    momentumScore: 40,
    diversificationScore: 70
  };
  
  // Assets summary data
  export const assetsSummaryData: AssetsSummary = {
    latestValue: "$1,245,780.35",
    investmentCost: "$1,350,420.65",
    unrealizedGain: {
      overallGain: {
        value: "($104,640.30)",
        percent: -7.20
      },
      todaysGain: {
        value: "($31,920.50)",
        percent: -2.56
      }
    },
    realizedGain: {
      total: "$87,450.25",
      capitalGain: "$75,320.10",
      otherGain: "$12,130.15"
    }
  };
  
  // Mock function to get data with random currency values
  export const getSectorData = (marketCap: MarketCapType): SectorData[] => {
    if (marketCap === "All") {
      return allSectorsData.map(sector => ({
        ...sector,
        latestValue: `$${(Math.random() * 500000 + 50000).toFixed(2)}`,
        investedValue: `$${(Math.random() * 450000 + 45000).toFixed(2)}`
      }));
    }
    
    return marketCapSectorData[marketCap];
  };
  
  export const getStockData = (marketCap: MarketCapType): StockData[] => {
    if (marketCap === "All") {
      return allStockData.map(stock => ({
        ...stock,
        latestValue: `$${(Math.random() * 100000 + 10000).toFixed(2)}`,
        investedValue: `$${(Math.random() * 90000 + 9000).toFixed(2)}`
      }));
    }
    
    return allStockData
      .filter(stock => stock.marketCap === marketCap)
      .map(stock => ({
        ...stock,
        latestValue: `$${(Math.random() * 100000 + 10000).toFixed(2)}`,
        investedValue: `$${(Math.random() * 90000 + 9000).toFixed(2)}`
      }));
  };
  
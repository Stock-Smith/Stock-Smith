// Type definition for stock data
export interface StockData {
    Symbol: string;
    AssetType: string;
    Name: string;
    Description: string;
    CIK: string;
    Exchange: string;
    Currency: string;
    Country: string;
    Sector: string;
    Industry: string;
    Address: string;
    OfficialSite: string;
    FiscalYearEnd: string;
    LatestQuarter: string;
    MarketCapitalization: string;
    EBITDA: string;
    PERatio: string;
    PEGRatio: string;
    BookValue: string;
    DividendPerShare: string;
    DividendYield: string;
    EPS: string;
    RevenuePerShareTTM: string;
    ProfitMargin: string;
    OperatingMarginTTM: string;
    ReturnOnAssetsTTM: string;
    ReturnOnEquityTTM: string;
    RevenueTTM: string;
    GrossProfitTTM: string;
    DilutedEPSTTM: string;
    QuarterlyEarningsGrowthYOY: string;
    QuarterlyRevenueGrowthYOY: string;
    AnalystTargetPrice: string;
    AnalystRatingStrongBuy: string;
    AnalystRatingBuy: string;
    AnalystRatingHold: string;
    AnalystRatingSell: string;
    AnalystRatingStrongSell: string;
    TrailingPE: string;
    ForwardPE: string;
    PriceToSalesRatioTTM: string;
    PriceToBookRatio: string;
    EVToRevenue: string;
    EVToEBITDA: string;
    Beta: string;
    "52WeekHigh": string;
    "52WeekLow": string;
    "50DayMovingAverage": string;
    "200DayMovingAverage": string;
    SharesOutstanding: string;
    DividendDate: string;
    ExDividendDate: string;
  }
  
  // Mock data for demonstration
  export const MOCK_STOCK_DATA: StockData = {
    Symbol: "AAPL",
    AssetType: "Common Stock",
    Name: "Apple Inc",
    Description:
      "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company offers iPhone, a line of smartphones; Mac, a line of personal computers; iPad, a line of multi-purpose tablets; and wearables, home, and accessories comprising AirPods, Apple TV, Apple Watch, Beats products, and HomePod.",
    CIK: "320193",
    Exchange: "NASDAQ",
    Currency: "USD",
    Country: "USA",
    Sector: "TECHNOLOGY",
    Industry: "Consumer Electronics",
    Address: "ONE INFINITE LOOP, CUPERTINO, CA, US",
    OfficialSite: "https://www.apple.com",
    FiscalYearEnd: "September",
    LatestQuarter: "2024-12-31",
    MarketCapitalization: "2970000000000",
    EBITDA: "137352004000",
    PERatio: "34.16",
    PEGRatio: "2.84",
    BookValue: "4.12",
    DividendPerShare: "0.99",
    DividendYield: "0.0046",
    EPS: "6.14",
    RevenuePerShareTTM: "25.97",
    ProfitMargin: "0.243",
    OperatingMarginTTM: "0.345",
    ReturnOnAssetsTTM: "28.32",
    ReturnOnEquityTTM: "163.43",
    RevenueTTM: "395760009000",
    GrossProfitTTM: "184102994000",
    DilutedEPSTTM: "6.31",
    QuarterlyEarningsGrowthYOY: "0.101",
    QuarterlyRevenueGrowthYOY: "0.04",
    AnalystTargetPrice: "252.59",
    AnalystRatingStrongBuy: "7",
    AnalystRatingBuy: "21",
    AnalystRatingHold: "13",
    AnalystRatingSell: "2",
    AnalystRatingStrongSell: "2",
    TrailingPE: "34.59",
    ForwardPE: "29.76",
    PriceToSalesRatioTTM: "50.13",
    PriceToBookRatio: "49.12",
    EVToRevenue: "8.39",
    EVToEBITDA: "24.19",
    Beta: "1.27",
    "52WeekHigh": "199.62",
    "52WeekLow": "124.17",
    "50DayMovingAverage": "183.45",
    "200DayMovingAverage": "177.80",
    SharesOutstanding: "15022100000",
    DividendDate: "2025-02-13",
    ExDividendDate: "2025-02-10",
  };
  
  // Format large numbers with commas and abbreviations
  export const formatNumber = (num: string | number): string => {
    const n = typeof num === "string" ? Number.parseFloat(num) : num;
  
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  
    return n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  
  // Format percentage values
  export const formatPercentage = (value: string | number): string => {
    const num = typeof value === "string" ? Number.parseFloat(value) : value;
    return `${(num * 100).toFixed(2)}%`;
  };
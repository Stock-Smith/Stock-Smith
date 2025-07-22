import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDown, ArrowUp, DollarSign, Building, Globe, BarChart3 } from "lucide-react";
import { TradingViewWidget } from "../components/TradingViewWidget";
import { MOCK_STOCK_DATA, formatNumber, formatPercentage, StockData } from "../lib/StockUtils";
import StockNews from './StockNews';  

interface StockDetailPageProps {
  ticker?: string;
}

export const StockDetailPage: React.FC<StockDetailPageProps> = ({ ticker = "AAPL" }) => {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<{
    price?: number;
    change?: number;
    changePercent?: number;
  }>({});

  // Effect to set the page background when component mounts
  useEffect(() => {
    document.body.classList.add('bg-black');
    document.documentElement.classList.add('bg-black');

    return () => {
      document.body.classList.remove('bg-black');
      document.documentElement.classList.remove('bg-black');
    };
  }, []);

  // Function to fetch real-time price data from Finnhub
  const fetchPriceData = async (symbol: string) => {
    const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
    if (!API_KEY) {
      console.error("API key missing");
      return { price: undefined, change: undefined, changePercent: undefined };
    }

    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      const price = data.c;
      const change = data.d;
      const changePercent = data.dp;
      console.log(`Ticker: ${symbol}`);
      console.log(`Price: $${price}`);
      console.log(`Change: $${change}`);
      console.log(`Change %: ${changePercent}%`);
      return { price, change, changePercent };
    } catch (error) {
      console.error("Error fetching stock data:", error);
      return { price: undefined, change: undefined, changePercent: undefined };
    }
  };

  useEffect(() => {
    const fetchStockData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch stock details
        const response = await fetch(`http://localhost:8006/api/v1/stock/details?ticker=${ticker}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch data for ${ticker}`);
        }

        const data = await response.json();
        setStockData(data);

        // Fetch real-time price data
        const priceInfo = await fetchPriceData(ticker);
        setPriceData(priceInfo);
      } catch (err) {
        console.error("Error fetching stock data:", err);
        setError(`Failed to load data for ${ticker}. Using mock data instead.`);
        setStockData(MOCK_STOCK_DATA); // Fallback to mock data
        
        // Try to fetch price data even if other data failed
        try {
          const priceInfo = await fetchPriceData(ticker);
          setPriceData(priceInfo);
        } catch (priceErr) {
          console.error("Error fetching price data:", priceErr);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStockData();
  }, [ticker]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto py-6 px-4 max-w-7xl flex justify-center items-center h-64 bg-black text-gray-200">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-200 mx-auto mb-4"></div>
            <p>Loading stock data for {ticker}...</p>
          </div>
        </div>
      </div>
    );
  }

  // If no data is available, show error
  if (!stockData) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto py-6 px-4 max-w-7xl bg-black text-gray-200">
          <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> Could not load stock data for {ticker}.</span>
          </div>
        </div>
      </div>
    );
  }

  const {
    Symbol,
    Name,
    Exchange,
    MarketCapitalization,
    PERatio,
    EPS,
    DividendYield,
    ProfitMargin,
    Description,
    Sector,
    Industry,
    Country,
    Address,
    OfficialSite,
    "52WeekHigh": weekHigh,
    "52WeekLow": weekLow,
    AnalystTargetPrice,
    AnalystRatingStrongBuy,
    AnalystRatingBuy,
    AnalystRatingHold,
    AnalystRatingSell,
    AnalystRatingStrongSell,
  } = stockData;

  // Use real price data if available, otherwise fall back to mock data
  const currentPrice = priceData.price ?? 210.35;
  const priceChange = priceData.change ?? (210.35 - 208.76);
  const priceChangePercentage = priceData.changePercent ?? ((priceChange / 208.76) * 100);
  const isPriceUp = priceChange >= 0;

  // Calculate total analyst ratings
  const totalRatings =
    Number.parseInt(AnalystRatingStrongBuy) +
    Number.parseInt(AnalystRatingBuy) +
    Number.parseInt(AnalystRatingHold) +
    Number.parseInt(AnalystRatingSell) +
    Number.parseInt(AnalystRatingStrongSell);

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Show error message if there was an issue but we're using mock data */}
        {error && (
          <div className="bg-yellow-900 border border-yellow-700 text-yellow-300 px-4 py-3 rounded relative mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Header with stock name and current price */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                {Name} <span className="text-gray-400 text-lg">({Symbol})</span>
              </h1>
              <p className="text-gray-400">{Exchange} • {Sector} • {Industry}</p>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-3xl font-bold">${currentPrice.toFixed(2)}</div>
              <div className={`flex items-center ${isPriceUp ? "text-green-400" : "text-red-400"}`}>
                {isPriceUp ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
                <span>${Math.abs(priceChange).toFixed(2)} ({priceChangePercentage.toFixed(2)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main content with tabs */}
        <Tabs defaultValue="overview" className="w-full">
          {/* Tabs List */}
          <TabsList className="mb-4 bg-gray-900">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="chart" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">Chart</TabsTrigger>
            <TabsTrigger value="financials" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">Financials</TabsTrigger>
            <TabsTrigger value="analysts" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">Analysts</TabsTrigger>
            <TabsTrigger value="news" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">News</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Stats */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Key Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">Market Cap</p>
                    <p className="text-lg font-medium text-white">{formatNumber(MarketCapitalization)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">P/E Ratio</p>
                    <p className="text-lg font-medium text-white">{PERatio}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">EPS</p>
                    <p className="text-lg font-medium text-white">${EPS}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">Dividend Yield</p>
                    <p className="text-lg font-medium text-white">{formatPercentage(DividendYield)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">52-Week High</p>
                    <p className="text-lg font-medium text-white">${weekHigh}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">52-Week Low</p>
                    <p className="text-lg font-medium text-white">${weekLow}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">Profit Margin</p>
                    <p className="text-lg font-medium text-white">{formatPercentage(ProfitMargin)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">About {Name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-200">{Description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">Headquarters</p>
                        <p className="text-gray-400">{Address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">Website</p>
                        <a
                          href={OfficialSite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          {OfficialSite}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <BarChart3 className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">Sector & Industry</p>
                        <p className="text-gray-400">
                          {Sector} • {Industry}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">Currency</p>
                        <p className="text-gray-400">{stockData.Currency}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chart Tab */}
          <TabsContent value="chart">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Price Chart</CardTitle>
                <CardDescription className="text-gray-400">Historical price data for {Symbol}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-black rounded-md overflow-hidden">
                  <TradingViewWidget symbol={Symbol} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financials Tab */}
          <TabsContent value="financials">
            <Card className="bg-gray-900 border-gray-800 rounded-lg shadow-md">
              <CardHeader className="pb-4 border-b border-gray-800">
                <CardTitle className="text-xl font-semibold text-white">Financial Information</CardTitle>
                <CardDescription className="text-gray-400">Key financial metrics and ratios</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                  {/* Profitability Section */}
                  <div className="bg-gray-800 p-5 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-medium mb-4 text-white">Profitability</h3>
                    <div className="space-y-4">
                      {[
                        { label: "Profit Margin", value: formatPercentage(stockData.ProfitMargin) },
                        { label: "Operating Margin", value: formatPercentage(stockData.OperatingMarginTTM) },
                        { label: "Return on Assets", value: `${stockData.ReturnOnAssetsTTM}%` },
                        { label: "Return on Equity", value: `${stockData.ReturnOnEquityTTM}%` },
                      ].map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-gray-400">{item.label}</span>
                          <span className="font-medium text-white">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Valuation Section */}
                  <div className="bg-gray-800 p-5 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-medium mb-4 text-white">Valuation</h3>
                    <div className="space-y-4">
                      {[
                        { label: "P/E Ratio (Trailing)", value: stockData.TrailingPE },
                        { label: "P/E Ratio (Forward)", value: stockData.ForwardPE },
                        { label: "Price to Sales", value: stockData.PriceToSalesRatioTTM },
                        { label: "Price to Book", value: stockData.PriceToBookRatio },
                      ].map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-gray-400">{item.label}</span>
                          <span className="font-medium text-white">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Growth Section */}
                  <div className="bg-gray-800 p-5 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-medium mb-4 text-white">Growth</h3>
                    <div className="space-y-4">
                      {[
                        { label: "Quarterly Earnings Growth (YoY)", value: formatPercentage(stockData.QuarterlyEarningsGrowthYOY) },
                        { label: "Quarterly Revenue Growth (YoY)", value: formatPercentage(stockData.QuarterlyRevenueGrowthYOY) },
                      ].map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-gray-400">{item.label}</span>
                          <span className="font-medium text-white">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dividends Section */}
                  <div className="bg-gray-800 p-5 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-medium mb-4 text-white">Dividends</h3>
                    <div className="space-y-4">
                      {[
                        { label: "Dividend Per Share", value: `$${stockData.DividendPerShare}` },
                        { label: "Dividend Yield", value: formatPercentage(stockData.DividendYield) },
                        { label: "Dividend Date", value: stockData.DividendDate },
                        { label: "Ex-Dividend Date", value: stockData.ExDividendDate },
                      ].map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-gray-400">{item.label}</span>
                          <span className="font-medium text-white">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {/* Analysts Tab */}
          <TabsContent value="analysts">
            <Card className="bg-gray-900 border-gray-800 rounded-lg shadow-md">
              <CardHeader className="pb-4 border-b border-gray-800">
                <CardTitle className="text-xl font-semibold text-white">Analyst Ratings</CardTitle>
                <CardDescription className="text-gray-400">Professional opinions and price targets</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Consensus Section */}
                  <div className="bg-gray-800 p-5 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-medium mb-4 text-white">Consensus</h3>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-full bg-blue-900 flex items-center justify-center shadow-md">
                        <span className="text-lg font-bold text-blue-300">Buy</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Based on {totalRatings} analyst ratings</p>
                        <p className="text-lg font-medium text-white">Target: ${AnalystTargetPrice}</p>
                      </div>
                    </div>

                    {/* Ratings Breakdown */}
                    <div className="space-y-3 mt-4">
                      {[
                        { label: "Strong Buy", value: AnalystRatingStrongBuy, color: "text-green-400" },
                        { label: "Buy", value: AnalystRatingBuy, color: "text-green-500" },
                        { label: "Hold", value: AnalystRatingHold, color: "text-gray-400" },
                        { label: "Sell", value: AnalystRatingSell, color: "text-red-400" },
                        { label: "Strong Sell", value: AnalystRatingStrongSell, color: "text-red-500" },
                      ].map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className={item.color}>{item.label}</span>
                          <span className="text-white">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                {/* Price Target Section */}
                <div className="bg-gray-800 p-5 rounded-lg shadow hover:shadow-lg transition-shadow flex flex-col justify-center">
                  <h3 className="text-lg font-medium mb-4 text-white text-center">Price Target</h3>
                  <div className="space-y-4">
                    {[
                      { 
                        label: "Current Price", 
                        value: `$${priceData.price ? priceData.price.toFixed(2) : "N/A"}`, 
                        color: "text-white" 
                      },
                      { 
                        label: "Analyst Target", 
                        value: `$${AnalystTargetPrice}`, 
                        color: "text-white" 
                      },
                      {
                        label: `Potential ${
                          Number.parseFloat(AnalystTargetPrice) > (priceData.price || 0) ? "Upside" : "Downside"
                        }`,
                        value: priceData.price ? 
                          Math.abs(
                            ((Number.parseFloat(AnalystTargetPrice) - priceData.price) / priceData.price) * 100
                          ).toFixed(2) + "%" : "N/A",
                        color:
                          Number.parseFloat(AnalystTargetPrice) > (priceData.price || 0)
                            ? "text-green-400"
                            : "text-red-400",
                      },
                      {
                        label: "52-Week Range",
                        value: `$${weekLow} - $${weekHigh}`,
                        color: "text-white",
                      },
                    ].map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-400">{item.label}</span>
                        <span className={`font-medium ${item.color}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>

                </div>

                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {/* News Tab */}
          <TabsContent value="news">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Latest News</CardTitle>
                <CardDescription className="text-gray-400">Recent news and updates about {Name}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* News content placeholder - this would be populated with real news data */}
                <div className="space-y-6" id="stock-news-container">
                  {/* This div will be populated with news data */}
                  <StockNews ticker={ticker} /> 
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StockDetailPage;
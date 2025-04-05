import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDown, ArrowUp, DollarSign, Building, Globe, BarChart3 } from "lucide-react";
import { TradingViewWidget } from "../components/TradingViewWidget";
import { MOCK_STOCK_DATA, formatNumber, formatPercentage, StockData } from "../lib/StockUtils";

interface StockDetailPageProps {
  ticker?: string;
}

export const StockDetailPage: React.FC<StockDetailPageProps> = ({ ticker = "AAPL" }) => {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStockData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`http://localhost:8003/api/v1/stock/details?ticker=${ticker}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data for ${ticker}`);
        }
        
        const data = await response.json();
        setStockData(data);
      } catch (err) {
        console.error("Error fetching stock data:", err);
        setError(`Failed to load data for ${ticker}. Using mock data instead.`);
        setStockData(MOCK_STOCK_DATA); // Fallback to mock data
      } finally {
        setIsLoading(false);
      }
    };

    fetchStockData();
  }, [ticker]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-7xl flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p>Loading stock data for {ticker}...</p>
        </div>
      </div>
    );
  }

  // If no data is available, show error
  if (!stockData) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> Could not load stock data for {ticker}.</span>
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

  // Calculate price change (this would normally come from real-time data)
  const mockCurrentPrice = 210.35;
  const mockPreviousClose = 208.76;
  const priceChange = mockCurrentPrice - mockPreviousClose;
  const priceChangePercentage = (priceChange / mockPreviousClose) * 100;
  const isPriceUp = priceChange >= 0;

  // Calculate total analyst ratings
  const totalRatings =
    Number.parseInt(AnalystRatingStrongBuy) +
    Number.parseInt(AnalystRatingBuy) +
    Number.parseInt(AnalystRatingHold) +
    Number.parseInt(AnalystRatingSell) +
    Number.parseInt(AnalystRatingStrongSell);

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Show error message if there was an issue but we're using mock data */}
      {error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-6" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* Header with stock name and current price */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {Name} <span className="text-muted-foreground text-lg">({Symbol})</span>
            </h1>
            <p className="text-muted-foreground">
              {Exchange} • {Sector} • {Industry}
            </p>
          </div>

          <div className="flex flex-col items-end">
            <div className="text-3xl font-bold">${mockCurrentPrice.toFixed(2)}</div>
            <div className={`flex items-center ${isPriceUp ? "text-green-500" : "text-red-500"}`}>
              {isPriceUp ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
              <span>
                ${Math.abs(priceChange).toFixed(2)} ({priceChangePercentage.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content with tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chart">Chart</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="analysts">Analysts</TabsTrigger>
          <TabsTrigger value="news">News</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Key Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Market Cap</p>
                  <p className="text-lg font-medium">{formatNumber(MarketCapitalization)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">P/E Ratio</p>
                  <p className="text-lg font-medium">{PERatio}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">EPS</p>
                  <p className="text-lg font-medium">${EPS}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Dividend Yield</p>
                  <p className="text-lg font-medium">{formatPercentage(DividendYield)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">52-Week High</p>
                  <p className="text-lg font-medium">${weekHigh}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">52-Week Low</p>
                  <p className="text-lg font-medium">${weekLow}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Profit Margin</p>
                  <p className="text-lg font-medium">{formatPercentage(ProfitMargin)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About {Name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{Description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Headquarters</p>
                      <p className="text-muted-foreground">{Address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Website</p>
                      <a
                        href={OfficialSite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {OfficialSite}
                      </a>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <BarChart3 className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Sector & Industry</p>
                      <p className="text-muted-foreground">
                        {Sector} • {Industry}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Currency</p>
                      <p className="text-muted-foreground">{stockData.Currency}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chart Tab */}
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Price Chart</CardTitle>
              <CardDescription>Historical price data for {Symbol}</CardDescription>
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
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
              <CardDescription>Key financial metrics and ratios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Profitability</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Profit Margin</span>
                      <span className="font-medium">{formatPercentage(stockData.ProfitMargin)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Operating Margin</span>
                      <span className="font-medium">{formatPercentage(stockData.OperatingMarginTTM)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Return on Assets</span>
                      <span className="font-medium">{stockData.ReturnOnAssetsTTM}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Return on Equity</span>
                      <span className="font-medium">{stockData.ReturnOnEquityTTM}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Valuation</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">P/E Ratio (Trailing)</span>
                      <span className="font-medium">{stockData.TrailingPE}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">P/E Ratio (Forward)</span>
                      <span className="font-medium">{stockData.ForwardPE}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Price to Sales</span>
                      <span className="font-medium">{stockData.PriceToSalesRatioTTM}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Price to Book</span>
                      <span className="font-medium">{stockData.PriceToBookRatio}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Growth</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Quarterly Earnings Growth (YoY)</span>
                      <span className="font-medium">
                        {formatPercentage(stockData.QuarterlyEarningsGrowthYOY)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Quarterly Revenue Growth (YoY)</span>
                      <span className="font-medium">{formatPercentage(stockData.QuarterlyRevenueGrowthYOY)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Dividends</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Dividend Per Share</span>
                      <span className="font-medium">${stockData.DividendPerShare}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Dividend Yield</span>
                      <span className="font-medium">{formatPercentage(stockData.DividendYield)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Dividend Date</span>
                      <span className="font-medium">{stockData.DividendDate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Ex-Dividend Date</span>
                      <span className="font-medium">{stockData.ExDividendDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysts Tab */}
        <TabsContent value="analysts">
          <Card>
            <CardHeader>
              <CardTitle>Analyst Ratings</CardTitle>
              <CardDescription>Professional opinions and price targets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Consensus</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-lg font-bold text-blue-700">Buy</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Based on {totalRatings} analyst ratings</p>
                      <p className="text-lg font-medium">Target: ${AnalystTargetPrice}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-green-600">Strong Buy</span>
                      <span>{AnalystRatingStrongBuy}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-green-500">Buy</span>
                      <span>{AnalystRatingBuy}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Hold</span>
                      <span>{AnalystRatingHold}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-red-500">Sell</span>
                      <span>{AnalystRatingSell}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-red-600">Strong Sell</span>
                      <span>{AnalystRatingStrongSell}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Price Target</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Current Price</span>
                      <span className="font-medium">${mockCurrentPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Analyst Target</span>
                      <span className="font-medium">${AnalystTargetPrice}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Potential {Number.parseFloat(AnalystTargetPrice) > mockCurrentPrice ? "Upside" : "Downside"}
                      </span>
                      <span
                        className={`font-medium ${Number.parseFloat(AnalystTargetPrice) > mockCurrentPrice ? "text-green-500" : "text-red-500"}`}
                      >
                        {Math.abs(
                          ((Number.parseFloat(AnalystTargetPrice) - mockCurrentPrice) / mockCurrentPrice) * 100,
                        ).toFixed(2)}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">52-Week Range</span>
                      <span className="font-medium">
                        ${weekLow} - ${weekHigh}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* News Tab */}
        <TabsContent value="news">
          <Card>
            <CardHeader>
              <CardTitle>Latest News</CardTitle>
              <CardDescription>Recent news and updates about {Name}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* News content placeholder - this would be populated with real news data */}
              <div className="space-y-6" id="stock-news-container">
                {/* This div will be populated with news data */}
                <div className="p-8 border border-dashed rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground text-center">News content will be loaded here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockDetailPage;
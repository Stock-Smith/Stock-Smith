import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ArrowUpRight, ArrowDownRight, Info, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import StockDetailPage from "./stockdetails";

interface PredictionData {
  predictions: number[];
  dates: string[];
  mape_values: number;
}


const StockPredictionPage = ({ ticker = 'AAPL' }: { ticker?: string }) => {
  const [localTicker, setLocalTicker] = useState<string>(ticker);
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState<boolean>(false);

  useEffect(() => {
    // Extract ticker from URL if available
    const urlParams = new URLSearchParams(window.location.search);
    const tickerParam = urlParams.get("ticker");
    if (tickerParam) {
      setLocalTicker(tickerParam);
    }
  }, []);

  // Function to fetch current price from Finnhub
  const fetchCurrentPrice = async (symbol: string) => {
    setPriceLoading(true);
    const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
    
    if (!API_KEY) {
      console.error("API key missing");
      toast.error("API Key Missing", {
        description: "Please check your environment variables.",
      });
      setPriceLoading(false);
      return null;
    }

    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      const price = data.c;
      
      console.log(`Ticker: ${symbol}`);
      console.log(`Price: $${price}`);
      
      setCurrentPrice(price);
      setPriceLoading(false);
      return price;
    } catch (error) {
      console.error("Error fetching stock data:", error);
      toast.error("Error Fetching Price", {
        description: "Could not retrieve current stock price.",
      });
      setPriceLoading(false);
      return null;
    }
  };

  // Fetch current price when ticker changes
  useEffect(() => {
    if (localTicker) {
      fetchCurrentPrice(localTicker);
    }
  }, [localTicker]);

  const getPrediction = async () => {
    setLoading(true);
    try {
      // Ensure we have the latest price before generating prediction
      const latestPrice = currentPrice || await fetchCurrentPrice(localTicker);
      
      if (!latestPrice) {
        throw new Error('Could not retrieve current price for prediction');
      }
      
      // Mock data for demonstration
      // setTimeout(() => {
      //   const mockData = {
      //     predictions: [
      //       latestPrice * 1.01, 
      //       latestPrice * 1.02, 
      //       latestPrice * 1.015, 
      //       latestPrice * 1.025, 
      //       latestPrice * 1.03
      //     ],
      //     dates: ["2025-04-16", "2025-04-17", "2025-04-18", "2025-04-19", "2025-04-20"],
      //   };
      //   setPredictionData(mockData);
      //   toast.success("Prediction Generated", {
      //     description: "Stock price predictions have been updated.",
      //   });
      //   setLoading(false);
      // }, 1500);

      // Uncomment for real API call
      
      const response = await fetch(`http://127.0.0.1:8007/api/prediction_price?ticker=${localTicker}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch prediction data');
      }
      const data = await response.json();
      setPredictionData(data);
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
      setLoading(false);
    }
  };

  const formatChartData = () => {
    if (!predictionData || currentPrice === null) return [];

    // Start with today's price
    const chartData = [
      {
        day: "Today",
        price: currentPrice,
        date: new Date().toISOString().split("T")[0],
        label: "Today"
      },
    ];

    // Add prediction data with T+n labels
    predictionData.predictions.forEach((price, index) => {
      chartData.push({
        day: `Day ${index + 1}`,
        price: price,
        date: predictionData.dates[index],
        label: `T+${index + 1}`
      });
    });

    return chartData;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#050508] p-3 border border-[#1a1a2e] rounded-lg shadow-lg">
          <p className="text-blue-400 font-medium">{payload[0].payload.label}</p>
          <p className="text-white font-bold">${payload[0].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white p-6 overflow-hidden relative mt-10">
      {/* Background elements remain the same */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#000000] via-[#050508] to-[#0a0a1a] opacity-90 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(#101030_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-900 rounded-full filter blur-3xl opacity-5 animate-pulse"></div>
      <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-indigo-900 rounded-full filter blur-3xl opacity-5 animate-pulse delay-1000"></div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
            {localTicker} Stock Analysis
          </h1>
          <p className="text-gray-400 mt-2">Advanced ML-powered price predictions and market insights</p>
        </div>

        {/* Stock Detail Component */}
        <Card className="bg-black/40 backdrop-blur-lg rounded-2xl border border-blue-900/20 shadow-[0_0_20px_rgba(0,0,100,0.15)] overflow-hidden">
          <div className="p-6">
            <StockDetailPage ticker={localTicker} />
          </div>
        </Card>

        {/* Prediction Section */}
        <Card className="bg-[#050508]/80 border-[#1a1a2e] shadow-[0_0_15px_rgba(0,0,30,0.5)]">
          <CardHeader className="border-b border-[#1a1a2e]">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold flex items-center gap-3 text-blue-400">
                <TrendingUp className="text-blue-500 w-5 h-5" />
                5-Day Price Prediction
              </CardTitle>
              <Button
                onClick={getPrediction}
                disabled={loading || priceLoading || currentPrice === null}
                className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 ease-in-out transform hover:scale-105 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              >
                {loading ? (
                  <span className="flex items-center">
                    <RefreshCw className="animate-spin mr-2 h-4 w-4" />
                    Generating...
                  </span>
                ) : priceLoading ? (
                  <span className="flex items-center">
                    <RefreshCw className="animate-spin mr-2 h-4 w-4" />
                    Fetching Price...
                  </span>
                ) : (
                  `Get Prediction for ${localTicker}`
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {predictionData && currentPrice !== null ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Chart in left 2/3 */}
                  <div className="lg:col-span-2">
                    <div className="h-[400px] w-full bg-[#030305] p-4 rounded-xl border border-[#1a1a2e]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={formatChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        {/* Lighter, more subtle grid */}
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" opacity={0.3} />
                        <XAxis
                          dataKey="label"
                          stroke="#3b82f6"
                          tick={{ fill: "#8fbfff" }}
                          axisLine={{ stroke: "#1a1a2e" }}
                        />
                        <YAxis
                          stroke="#3b82f6"
                          tick={{ fill: "#8fbfff" }}
                          domain={["dataMin - 2", "dataMax + 2"]}
                          axisLine={{ stroke: "#1a1a2e" }}
                          tickCount={5}
                          width={40}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="linear"
                          dataKey="price"
                          stroke="url(#colorGradient)"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#030305", stroke: "#3b82f6", strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: "#3b82f6", stroke: "#8fbfff", strokeWidth: 2 }}
                          isAnimationActive={true}
                          animationDuration={1500}
                        />
                        <defs>
                          <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#4f46e5" />
                          </linearGradient>
                        </defs>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {predictionData && predictionData.mape_values !== undefined && (
                  <div className="mt-2 flex items-center justify-end">
                    <div className="text-sm text-gray-400 bg-[#030305] px-3 py-1 rounded-md border border-[#1a1a2e]">
                      <span className="font-medium text-blue-400">MAPE:</span> {predictionData.mape_values.toFixed(2)}%
                      <span className="ml-1 text-xs text-gray-500 cursor-help" title="Mean Absolute Percentage Error - lower values indicate better prediction accuracy">
                        <Info className="inline h-3 w-3" />
                      </span>
                    </div>
                  </div>
                )}
              </div>
          

                  {/* Table in right 1/3 */}
                  <div className="lg:col-span-1">
                    <div className="h-full bg-[#030305] rounded-xl border border-[#1a1a2e] overflow-hidden">
                      <div className="p-3 bg-[#0a0a1a] border-b border-[#1a1a2e]">
                        <h3 className="text-blue-400 font-medium">Price Forecast</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-[#0a0a1a]">
                            <tr>
                              <th className="py-3 px-4 text-left text-blue-400 font-medium">Day</th>
                              <th className="py-3 px-4 text-right text-blue-400 font-medium">Price</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1a1a2e]">
                            <tr className="bg-[#050508]">
                              <td className="py-3 px-4 text-gray-300">Today</td>
                              <td className="py-3 px-4 text-right text-white font-medium">${currentPrice.toFixed(2)}</td>
                            </tr>
                            {predictionData.predictions.map((price, index) => (
                              <tr key={index} className={index % 2 === 0 ? "bg-[#050508]" : "bg-[#070710]"}>
                                <td className="py-3 px-4 text-gray-300">T+{index + 1}</td>
                                <td className="py-3 px-4 text-right text-white font-medium">${price.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-[#030305] border-[#1a1a2e]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-blue-400">Initial Price</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">${currentPrice.toFixed(2)}</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-[#030305] border-[#1a1a2e]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-blue-400">Predicted High</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-emerald-500">
                        ${Math.max(...predictionData.predictions).toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-[#030305] border-[#1a1a2e]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-blue-400">Overall Change</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const lastPrediction = predictionData.predictions[predictionData.predictions.length - 1];
                        const change = lastPrediction - currentPrice;
                        const percentChange = (change / currentPrice) * 100;
                        const isPositive = change >= 0;
                        
                        return (
                          <div className={`text-2xl font-bold flex items-center ${isPositive ? "text-emerald-500" : "text-rose-500"}`}>
                            {isPositive ? <ArrowUpRight className="h-5 w-5 mr-1" /> : <ArrowDownRight className="h-5 w-5 mr-1" />}
                            {percentChange.toFixed(2)}%
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                {priceLoading ? (
                  <div className="flex flex-col items-center">
                    <RefreshCw className="h-12 w-12 text-blue-500 mb-4 animate-spin" />
                    <h3 className="text-xl font-medium text-gray-300 mb-2">Fetching Current Price...</h3>
                  </div>
                ) : (
                  <>
                    <Info className="h-12 w-12 text-blue-500 mb-4 opacity-50" />
                    <h3 className="text-xl font-medium text-gray-300 mb-2">No Prediction Data</h3>
                    <p className="text-gray-400 max-w-md">
                      Click the "Get Prediction" button to generate a 5-day price forecast for {localTicker}.
                    </p>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Market Insights Card remains the same */}
        <Card className="bg-[#050508]/80 border-[#1a1a2e] shadow-[0_0_15px_rgba(0,0,30,0.5)]">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-blue-400">Market Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#030305] rounded-lg border border-[#1a1a2e]">
                <h3 className="text-lg font-medium text-white mb-2">Technical Analysis</h3>
                <p className="text-gray-400">
                  Based on recent market trends and technical indicators, {localTicker} shows a
                  <span className="text-emerald-500 font-medium"> bullish pattern</span> with strong support at $185.
                </p>
              </div>
              <div className="p-4 bg-[#030305] rounded-lg border border-[#1a1a2e]">
                <h3 className="text-lg font-medium text-white mb-2">Market Sentiment</h3>
                <p className="text-gray-400">
                  Investor sentiment for {localTicker} is currently
                  <span className="text-blue-500 font-medium"> positive</span>, with increased trading volume in the
                  past week.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StockPredictionPage;

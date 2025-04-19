// stockData.ts

// Interface for the ticker to name mapping
export interface StockNameMapping {
    [ticker: string]: string;
  }
  
  // Export the ticker to name mapping
export const stockNameDatabase: Record<string, string> = {
  "AAPL": "Apple Inc.",
  "MSFT": "Microsoft Corporation",
  "GOOGL": "Alphabet Inc.",
  "AMZN": "Amazon.com Inc.",
  "META": "Meta Platforms Inc.",
  "TSLA": "Tesla Inc.",
  "NVDA": "NVIDIA Corporation",
  "XOM": "Exxon Mobil Corporation",
  "JPM": "JPMorgan Chase & Co.",
  "BAC": "Bank of America Corporation",
  "DIS": "The Walt Disney Company",
  "PFE": "Pfizer Inc.",
  "PYPL": "PayPal Holdings Inc.",
  "INTC": "Intel Corporation",
  "AMD": "Advanced Micro Devices Inc.",
  "UBER": "Uber Technologies Inc.",
  "ABNB": "Airbnb Inc.",
  "CRWD": "CrowdStrike Holdings Inc.",
  "PLTR": "Palantir Technologies Inc.",
  "SOFI": "SoFi Technologies Inc.",
  "HOOD": "Robinhood Markets Inc.",
  "RIVN": "Rivian Automotive Inc.",
  "DKNG": "DraftKings Inc.",
  "NIO": "NIO Inc.",
};
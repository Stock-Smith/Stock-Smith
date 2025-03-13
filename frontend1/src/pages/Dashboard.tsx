import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUpIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Line } from 'react-chartjs-2';
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [portfolio, setPortfolio] = useState([
    { symbol: "AAPL", quantity: 10, avgBuyPrice: 180, currentPrice: 189.45 },
    { symbol: "MSFT", quantity: 5, avgBuyPrice: 320, currentPrice: 332.87 },
    { symbol: "AMZN", quantity: 15, avgBuyPrice: 172, currentPrice: 176.29 }
  ]);

  const [marketMovers] = useState([
    { symbol: "NVDA", price: 515.44, change: 5.2 },
    { symbol: "AAPL", price: 189.45, change: 3.1 },
    { symbol: "TSLA", price: 199.32, change: -2.1 }
  ]);

  const portfolioValue = portfolio.reduce((acc, stock) => acc + (stock.quantity * stock.currentPrice), 0);

  const chartData = {
    labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"],
    datasets: [
      {
        label: "Portfolio Value ($)",
        data: [5800, 5900, 6000, 6100, portfolioValue],
        borderColor: "#3b82f6",
        fill: false
      }
    ]
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="bg-gray-800/50 border border-gray-700">
        <CardHeader>
          <CardTitle>Welcome to your Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-blue-400">Portfolio Value: ${portfolioValue.toFixed(2)}</h2>
            <Button>
              <Link to="/portfolio">View Portfolio</Link>
            </Button>
          </div>
          <Line data={chartData} />
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border border-gray-700">
        <CardHeader>
          <CardTitle>Market Movers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marketMovers.map((stock, index) => (
                <TableRow key={index}>
                  <TableCell>{stock.symbol}</TableCell>
                  <TableCell>${stock.price.toFixed(2)}</TableCell>
                  <TableCell className={stock.change >= 0 ? "text-green-400" : "text-red-400"}>
                    {stock.change >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
                    {stock.change}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border border-gray-700">
        <CardHeader>
          <CardTitle>Watchlist</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline">
            <Link to="/watchlist">View Watchlist</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
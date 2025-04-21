import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import HeroSection from "./hero";
import MarketDashboard from "./MarketDashboard";


interface MarketDataItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percentChange: number;
  status: "up" | "down";
  volume: string;
}

interface TopPerformer {
  name: string;
  change: number;
}

interface USMarketData {
  dow: {
    value: number;
    change: number;
    percentChange: number;
  };
  advanceDecline: {
    advance: number;
    decline: number;
  };
  institutionalActivity: {
    date: string;
    netBuying: number;
    netSelling: number;
  }[];
  activeStocks: {
    symbol: string;
    company: string;
    price: number;
    change: number;
    value: number;
    status: "up" | "down";
  }[];
}

const marketData: MarketDataItem[] = [
  { symbol: "AAPL", name: "Apple Inc.", price: 189.45, change: 2.37, percentChange: 1.27, status: "up", volume: "32.4M" },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 128.63, change: -1.95, percentChange: -1.49, status: "down", volume: "18.7M" },
  { symbol: "MSFT", name: "Microsoft Corporation", price: 332.87, change: 1.22, percentChange: 0.37, status: "up", volume: "24.2M" },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: 176.29, change: 0.56, percentChange: 0.32, status: "up", volume: "21.1M" }
];

const topPerformers: TopPerformer[] = [
  { name: "Technology", change: 2.4 },
  { name: "Healthcare", change: 1.8 },
  { name: "Consumer", change: 0.9 }
];

const usMarketData: USMarketData = {
  dow: {
    value: 38623.74,
    change: -314.33,
    percentChange: -0.81
  },
  advanceDecline: {
    advance: 153,
    decline: 347
  },
  institutionalActivity: [
    { date: "2025-03-08", netBuying: 11246.82, netSelling: -9308.63 },
    { date: "2025-03-07", netBuying: 8726.54, netSelling: -7427.11 }
  ],
  activeStocks: [
    { symbol: "TSLA", company: "Tesla, Inc.", price: 178.21, change: -6.40, value: 12.5, status: "down" },
    { symbol: "NVDA", company: "NVIDIA Corp", price: 824.12, change: 15.73, value: 8.4, status: "up" },
    { symbol: "AMD", company: "Advanced Micro Devices", price: 172.88, change: 8.25, value: 6.7, status: "up" },
    { symbol: "META", company: "Meta Platforms Inc", price: 474.32, change: -11.25, value: 5.9, status: "down" }
  ]
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8 } }
};

// Animation for subtle background elements
const pulseAnimation = {
  initial: { opacity: 0.05 },
  animate: (i: number) => ({
    opacity: [0.02, 0.08, 0.02],
    scale: [1, 1.03, 1],
    transition: {
      opacity: { repeat: Infinity, duration: 8 + i, ease: "easeInOut" },
      scale: { repeat: Infinity, duration: 10 + i, ease: "easeInOut" }
    }
  })
};

const Home = () => {
  // Mock AuthContext - in a real app this would come from your auth provider
  const isAuthenticated = true;
  const user = { name: "John Doe" };
  
  // State for dynamic background elements
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Track mouse position for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX - window.innerWidth / 2) * 0.05,
        y: (e.clientY - window.innerHeight / 2) * 0.05
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="flex flex-col min-h-screen bg-black text-gray-200 px-4 py-8 md:px-8 relative overflow-hidden"
    >
      {/* Deep Black Professional Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary deep black gradient with subtle color tint */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-black"></div>
        
        {/* Very subtle dark overlay texture */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(20,20,20,0.2)_0%,rgba(0,0,0,0.4)_70%)] opacity-30"></div>
        
        {/* Subtle geometric patterns */}
        <div className="absolute inset-0 opacity-4">
          {/* Horizontal lines - representing market data visualization */}
          <div className="absolute inset-0">
            <div className="h-full w-full bg-[linear-gradient(to_right,#222222_1px,transparent_1px),linear-gradient(to_bottom,#222222_1px,transparent_1px)] bg-[size:60px_60px]"></div>
          </div>
          
          {/* Diagonal grid for depth */}
          <div className="absolute inset-0 rotate-45 scale-150 translate-x-1/4 -translate-y-1/4">
            <div className="h-full w-full bg-[linear-gradient(to_right,#1a1a1a_0.5px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_0.5px,transparent_1px)] bg-[size:80px_80px]"></div>
          </div>
        </div>
        
        {/* Subtle background shapes/elements */}
        <div className="absolute inset-0">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`shape-${i}`}
              custom={i}
              variants={pulseAnimation}
              initial="initial"
              animate="animate"
              className="absolute rounded-full blur-3xl"
              style={{
                background: i % 2 === 0 
                  ? 'radial-gradient(circle, rgba(25,25,25,0.6) 0%, rgba(0,0,0,0) 70%)' 
                  : 'radial-gradient(circle, rgba(30,30,30,0.5) 0%, rgba(0,0,0,0) 70%)',
                width: `${300 + i * 100}px`,
                height: `${300 + i * 100}px`,
                left: `${10 + i * 20}%`,
                top: `${10 + (i * 15) % 70}%`,
                transform: `translateX(${mousePosition.x * 0.02 * (i + 1)}px) translateY(${mousePosition.y * 0.02 * (i + 1)}px)`
              }}
            />
          ))}
        </div>
        
        {/* Subtle accent elements - very minimal color */}
        <div className="absolute inset-0">
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-gray-900/20 via-gray-900/10 to-transparent"></div>
          
          {/* Bottom depth element */}
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-gray-900/30 to-transparent"></div>
        </div>

        {/* Digital pattern - minimalistic data flow lines */}
        <div className="absolute inset-0">
          {/* Horizontal data flow lines */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`data-flow-${i}`}
              className="absolute h-px bg-gradient-to-r from-transparent via-gray-700/20 to-transparent"
              style={{
                width: '100%',
                top: `${15 + i * 10}%`,
                left: 0,
                opacity: 0.05,
                height: '1px'
              }}
              animate={{
                x: ['-100%', '100%'],
                transition: {
                  repeat: Infinity,
                  duration: 15 + i * 3,
                  ease: "linear"
                }
              }}
            />
          ))}
          
          {/* Vertical data lines */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`v-data-${i}`}
              className="absolute w-px bg-gradient-to-b from-transparent via-gray-700/20 to-transparent"
              style={{
                height: '100%',
                left: `${20 + i * 15}%`,
                opacity: 0.03
              }}
              animate={{
                y: ['-100%', '100%'],
                transition: {
                  repeat: Infinity,
                  duration: 20 + i * 4,
                  ease: "linear"
                }
              }}
            />
          ))}
        </div>
        
        {/* Extremely subtle accent color elements */}
        <div className="absolute inset-0">
          {/* Subtle green accent for financial theme - barely visible */}
          <motion.div
            className="absolute rounded-full blur-3xl opacity-5"
            style={{
              background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, rgba(0,0,0,0) 70%)',
              width: '500px',
              height: '500px',
              right: '10%',
              top: '30%'
            }}
            animate={{
              opacity: [0.03, 0.06, 0.03],
              transition: {
                repeat: Infinity,
                duration: 12,
                ease: "easeInOut"
              }
            }}
          />
          
          {/* Subtle red accent - barely visible */}
          <motion.div
            className="absolute rounded-full blur-3xl opacity-4"
            style={{
              background: 'radial-gradient(circle, rgba(220,38,38,0.04) 0%, rgba(0,0,0,0) 70%)',
              width: '400px',
              height: '400px',
              left: '15%',
              bottom: '20%'
            }}
            animate={{
              opacity: [0.02, 0.05, 0.02],
              transition: {
                repeat: Infinity,
                duration: 14,
                ease: "easeInOut"
              }
            }}
          />
        </div>
        
        {/* Market graph silhouette - extremely subtle */}
        <div className="absolute bottom-0 left-0 right-0 h-48 opacity-5">
          <svg 
            className="w-full h-full"
            viewBox="0 0 1200 200" 
            preserveAspectRatio="none"
          >
            <path
              d="M0,200 L0,160 C50,140 100,180 150,170 C200,160 250,140 300,130 C350,120 400,110 450,120 C500,130 550,150 600,140 C650,130 700,100 750,90 C800,80 850,90 900,100 C950,110 1000,120 1050,110 C1100,100 1150,80 1200,70 L1200,200 Z"
              fill="url(#marketGradient)"
              opacity="0.3"
            />
            <defs>
              <linearGradient id="marketGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#333333" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#222222" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <HeroSection 
  onScrollClick={() => {
    // Use a class or id selector instead of ref
    const heroElement = document.querySelector(".hero-section") as HTMLElement;
    window.scrollTo({
      top: heroElement?.offsetHeight || 0,
      behavior: 'smooth'
    });
  }}
/>
        
        {/* Market Dashboard */}
        <div className="dark">
          <MarketDashboard 
            marketData={marketData}
            topPerformers={topPerformers}
            usMarketData={usMarketData}
          />
        </div>
      </div>
      
      {/* Footer */}
      <div className="relative z-10 mt-auto pt-12 pb-4 text-center text-gray-500 text-sm">
        <p>© 2025 Market Prediction Analytics. All rights reserved.</p>
      </div>
    </motion.div>
  );
};

export default Home;
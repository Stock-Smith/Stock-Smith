import React, { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Hero from "./hero";
import MarketDashboard from "./MarketDashboard";
import { Link } from "react-router-dom";
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  TrendingUpIcon, 
  BarChart2Icon, 
  SearchIcon,
  LogInIcon,
  UserPlusIcon,
  ExternalLinkIcon,
  XIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// AuthContext to manage user authentication state
interface User {
  name: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Create a simple authentication store
export const useAuthStore = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful login
    setIsAuthenticated(true);
    setUser({ name: email.split('@')[0] });
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify({ name: email.split('@')[0] }));
  };

  const signup = async (name: string, email: string, password: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful signup
    setIsAuthenticated(true);
    setUser({ name });
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify({ name }));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
  };

  // Load auth state from localStorage on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedUser = localStorage.getItem('user');
    
    if (storedAuth === 'true' && storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return {
    isAuthenticated,
    user,
    login,
    signup,
    logout
  };
};

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

// Mock Data
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

// Animation configurations
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

// Login Component
const LoginForm = ({ onSwitch }: { onSwitch: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await login(email, password);
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/50 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-2xl w-full max-w-md"
    >
      <h2 className="text-2xl font-bold text-white mb-6 text-center">Login to Your Account</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded text-red-300 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-gray-800/50 border-gray-700 text-white w-full"
            placeholder="your@email.com"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-gray-800/50 border-gray-700 text-white w-full"
            placeholder="••••••••"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
              Remember me
            </label>
          </div>
          
          <div className="text-sm">
            <Link to="#" className="text-blue-400 hover:text-blue-300">
              Forgot password?
            </Link>
          </div>
        </div>
        
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow transition-colors"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">
          Don't have an account?{' '}
          <button
            onClick={onSwitch}
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            Sign up
          </button>
        </p>
      </div>
    </motion.div>
  );
};

// SignUp Component
const SignupForm = ({ onSwitch }: { onSwitch: () => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signup } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      await signup(name, email, password);
    } catch (err) {
      setError('Could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/50 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-2xl w-full max-w-md"
    >
      <h2 className="text-2xl font-bold text-white mb-6 text-center">Create an Account</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded text-red-300 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="bg-gray-800/50 border-gray-700 text-white w-full"
            placeholder="John Doe"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-gray-800/50 border-gray-700 text-white w-full"
            placeholder="your@email.com"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-gray-800/50 border-gray-700 text-white w-full"
            placeholder="••••••••"
          />
        </div>
        
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="bg-gray-800/50 border-gray-700 text-white w-full"
            placeholder="••••••••"
          />
        </div>
        
        <div className="flex items-center">
          <input
            id="agree-terms"
            type="checkbox"
            required
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-300">
            I agree to the <Link to="#" className="text-blue-400 hover:text-blue-300">Terms of Service</Link> and <Link to="#" className="text-blue-400 hover:text-blue-300">Privacy Policy</Link>
          </label>
        </div>
        
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow transition-colors"
        >
          {loading ? 'Creating account...' : 'Sign up'}
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">
          Already have an account?{' '}
          <button
            onClick={onSwitch}
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </motion.div>
  );
};

// Authentication Modal Component
const AuthModal = ({ isOpen, onClose, initialMode = 'login' }: { isOpen: boolean, onClose: () => void, initialMode?: 'login' | 'signup' }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const { isAuthenticated } = useAuthStore();

  // If user is authenticated, close the modal
  useEffect(() => {
    if (isAuthenticated) {
      onClose();
    }
  }, [isAuthenticated, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <XIcon className="h-6 w-6" />
        </button>
        
        {mode === 'login' ? (
          <LoginForm onSwitch={() => setMode('signup')} />
        ) : (
          <SignupForm onSwitch={() => setMode('login')} />
        )}
      </div>
    </div>
  );
};

const Home = () => {
  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  
  // State for dynamic background elements
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Use the auth store
  const { isAuthenticated, user, logout } = useAuthStore();
  
  // Animation refs and hooks
  const heroRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  
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

  // Open auth modal with specific mode
  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

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
        {/* Hero Section - Custom hero with authentication buttons */}
        <motion.div 
          ref={heroRef}
          style={{ scale: shouldReduceMotion ? 1 : heroScale, opacity: shouldReduceMotion ? 1 : heroOpacity }}
          className="flex flex-col items-center justify-center mb-12 pt-12 space-y-6 bg-gray-900/20 backdrop-blur-sm rounded-2xl border border-white/10 p-8"
        >
          <div className="flex items-center mb-2">
            <BarChart2Icon className="w-10 h-10 mr-3 text-blue-400 animate-pulse" />
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-gradient-x">
              Market Prediction Analytics
            </h1>
          </div>
          <p className="text-xl text-gray-200 max-w-2xl text-center leading-relaxed">
            Advanced financial insights powered by AI analytics to help you make smarter investment decisions
          </p>

          {!isAuthenticated ? (
            <div className="flex gap-4 mb-8">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium px-8 py-6 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all duration-200 transform hover:-translate-y-1 hover:scale-105 flex items-center gap-2"
                onClick={() => openAuthModal('login')}
              >
                <LogInIcon className="w-5 h-5" />
                <span className="text-lg">Login</span>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-gray-800/70 border-2 border-blue-500/50 text-blue-400 hover:bg-blue-900/20 hover:text-blue-300 font-medium px-8 py-6 rounded-xl shadow-lg hover:shadow-blue-500/10 transition-all duration-200 transform hover:-translate-y-1 hover:scale-105 flex items-center gap-2"
                onClick={() => openAuthModal('signup')}
              >
                <UserPlusIcon className="w-5 h-5" />
                <span className="text-lg">Sign Up</span>
              </Button>
            </div>
          ) : (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="w-full max-w-md"
            >
              <div className="mb-6 bg-gray-800/30 backdrop-blur-md border border-white/10 shadow-xl hover:shadow-blue-900/20 transition hover:-translate-y-1 p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-semibold text-gray-200">
                      Welcome back, <span className="text-blue-400">{user?.name}</span>!
                    </p>
                    <p className="text-gray-400 text-sm mt-1">Access your personalized dashboard</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-red-500/30 text-red-400 hover:bg-red-900/20"
                    onClick={logout}
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
        
        {/* Market Dashboard */}
        <div className="dark">
          <MarketDashboard 
            marketData={marketData}
            topPerformers={topPerformers}
            usMarketData={usMarketData}
          />
        </div>
      </div>
      
      {/* Authentication Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        initialMode={authModalMode} 
      />
      
      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Key Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-gray-900/50 backdrop-blur-md border border-white/10 p-6 rounded-xl hover:shadow-lg hover:shadow-blue-900/20 transition"
            >
              <div className="bg-blue-900/30 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <TrendingUpIcon className="text-blue-400 w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-3">AI-Powered Predictions</h3>
              <p className="text-gray-400">
                Advanced machine learning algorithms analyze market trends to provide accurate forecasting
              </p>
            </motion.div>
            
            {/* Feature 2 */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-gray-900/50 backdrop-blur-md border border-white/10 p-6 rounded-xl hover:shadow-lg hover:shadow-blue-900/20 transition"
            >
              <div className="bg-purple-900/30 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <BarChart2Icon className="text-purple-400 w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-3">Real-time Analytics</h3>
              <p className="text-gray-400">
                Monitor market movements as they happen with customizable dashboards and alerts
              </p>
            </motion.div>
            
            {/* Feature 3 */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-gray-900/50 backdrop-blur-md border border-white/10 p-6 rounded-xl hover:shadow-lg hover:shadow-blue-900/20 transition"
            >
              <div className="bg-pink-900/30 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <SearchIcon className="text-pink-400 w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-3">Comprehensive Research</h3>
              <p className="text-gray-400">
                Access deep analysis and research on companies, sectors, and global economic trends
              </p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16">
        <motion.div 
          whileInView={{ opacity: [0, 1], y: [20, 0] }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 p-8 md:p-12 rounded-2xl text-center shadow-xl"
        >
          <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            Ready to Transform Your Investment Strategy?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of investors who have improved their returns with our AI-powered analytics platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-8 py-6 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all duration-200 transform hover:-translate-y-1"
              onClick={() => openAuthModal('signup')}
            >
              Get Started Free
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-transparent border-2 border-white/20 text-gray-200 hover:bg-white/5 font-medium px-8 py-6 rounded-xl shadow-lg transition-all duration-200 transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Learn More <ExternalLinkIcon className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </section>
      
      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <BarChart2Icon className="w-8 h-8 mr-2 text-blue-400" />
              <span className="text-xl font-bold text-gray-200">Market Prediction Analytics</span>
            </div>
            
            <div className="flex gap-8">
              <Link to="#" className="text-gray-400 hover:text-blue-400 transition">About</Link>
              <Link to="#" className="text-gray-400 hover:text-blue-400 transition">Features</Link>
              <Link to="#" className="text-gray-400 hover:text-blue-400 transition">Pricing</Link>
              <Link to="#" className="text-gray-400 hover:text-blue-400 transition">Contact</Link>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Market Prediction Analytics. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

export default Home;
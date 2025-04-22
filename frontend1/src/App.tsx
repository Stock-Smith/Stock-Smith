import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams, useParams } from "react-router-dom";
import { useAuthStore } from "./context/AuthContext";
import Home from "./pages/home1";
import Portfolio from "./pages/Portfolio";
import Watchlist from "./pages/Watchlist";
import News from "./pages/MarketNews";
import About from "./pages/About";
import PaymentForm from "./pages/payment";
import StockDetailPage from "./pages/stockdetails";
import Navbar from "./components/Navbar";
import AuthForm from "./components/AuthForm";
import UserSubscription from "./pages/UserService";
import StockPredictionPage from './pages/PredictionPage';

// Auth wrapper component to handle query parameters
const AuthWrapper = () => {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') === 'signup' ? 'signup' : 'login';
  
  return <AuthForm type={type} />;
};

// Stock Prediction wrapper to pass ticker parameter from URL to component
const StockPredictionWrapper = () => {
  const { ticker } = useParams();
  return <StockPredictionPage ticker={ticker} />;
};

const App = () => {
  const { isAuthenticated } = useAuthStore();
  
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<AuthForm type="login" />} />
            <Route path="/register" element={<AuthForm type="signup" />} />
            <Route path="/auth" element={<AuthWrapper />} />
            <Route 
              path="/portfolio" 
              element={isAuthenticated ? <Portfolio /> : <Navigate to="/auth?type=login" />} 
            />
            {/* Note: There was a duplicate watchlist route in your code */}
            <Route 
              path="/watchlist" 
              element={isAuthenticated ? <Watchlist /> : <Navigate to="/auth?type=login" />} 
            />
            <Route 
              path="/payment" 
              element={isAuthenticated ? <PaymentForm /> : <Navigate to="/auth?type=login" />} 
            />
            <Route 
              path="/subscription" 
              element={isAuthenticated ? <UserSubscription /> : <Navigate to="/auth?type=login" />} 
            />
            <Route 
              path="/news" 
              element={isAuthenticated ? <News /> : <Navigate to="/auth?type=login" />} 
            />
            <Route path="/stock/:ticker" element={<StockPredictionWrapper />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
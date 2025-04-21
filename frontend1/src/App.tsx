import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from "react-router-dom";
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
import  StockPredictionPage from './pages/PredictionPage'
// Auth wrapper component to handle query parameters
const AuthWrapper = () => {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') === 'signup' ? 'signup' : 'login';
  
  return <AuthForm type={type} />;
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
            <Route path="/watchlist" element={isAuthenticated ? <Watchlist /> : <Navigate to="/login" />} />
            <Route path="/news" element={isAuthenticated ? <News /> : <Navigate to="/login" />} />
            <Route path="/stock/:ticker" element={<StockPredictionPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
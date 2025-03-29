import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./context/AuthContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import Watchlist from "./pages/Watchlist";
import News from "./pages/MarketNews";
import About from "./pages/About";
import PaymentForm from "./pages/payment";
import Navbar from "./components/Navbar";
import AuthForm from "./components/AuthForm";

const App = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<AuthForm type="login" />} />
            <Route path="/portfolio" element={isAuthenticated ? <Portfolio /> : <Navigate to="/auth?type=login" />} />
            <Route path="/watchlist" element={isAuthenticated ? <Watchlist /> : <Navigate to="/auth?type=login" />} />
            <Route path="/subscription" element={isAuthenticated ? <PaymentForm /> : <Navigate to="/auth?type=login" />} />
            <Route path="/news" element={isAuthenticated ? <News /> : <Navigate to="/auth?type=login" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;

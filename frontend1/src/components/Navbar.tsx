import { Link } from "react-router-dom";
import { useAuthStore } from "../context/AuthContext";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <nav className="flex justify-between items-center p-4 bg-blue-600 text-white">
      {/* Brand Name */}
      <h1 className="text-2xl font-bold">StockSmith</h1>

      {/* Navigation Links */}
      {isAuthenticated ? (
        <div className="flex items-center gap-6">
          <Link to="/portfolio" className="hover:underline">Portfolio Management</Link>
          <Link to="/news" className="hover:underline">News</Link>
          <Link to="/about" className="hover:underline">About</Link>
          <span className="font-semibold">Hello, {user?.name}!</span>
          <button 
            onClick={logout} 
            className="px-4 py-2 bg-red-500 rounded-md">
            Logout
          </button>
        </div>
      ) : (
        <div className="flex gap-4">
          <Link to="/auth?type=login" className="px-4 py-2 bg-white text-blue-600 rounded-md">
            Login
          </Link>
          <Link to="/auth?type=signup" className="px-4 py-2 bg-white text-blue-600 rounded-md">
            Sign Up
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

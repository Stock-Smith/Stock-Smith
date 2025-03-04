import { Link } from "react-router-dom";
import { useAuthStore } from "../context/AuthContext";


const Home = () => {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Welcome to Stock-Smith</h1>

      {!isAuthenticated ? (
        <div className="flex gap-4">
          <Link to="/auth?type=login" className="px-4 py-2 bg-blue-500 text-white rounded-md">
            Login
          </Link>
          <Link to="/auth?type=signup" className="px-4 py-2 bg-green-500 text-white rounded-md">
            Sign Up
          </Link>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-lg font-semibold">Hello, {user?.name}!</p>
          <Link to="/dashboard" className="mt-4 block px-4 py-2 bg-purple-500 text-white rounded-md">
            Go to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;

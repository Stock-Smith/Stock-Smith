import { create } from "zustand";
import axios from "axios";

const API_BASE_URL = "http://localhost";

interface AuthState {
  isAuthenticated: boolean;
  user: { name: string; email: string } | null;
  isLoading: boolean;
  login: (userData: { name: string; email: string }, token: string) => void;
  logout: () => void;
  verifyAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  isAuthenticated: false,
  user: null,
  isLoading: true,

  login: (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    set({ isAuthenticated: true, user: userData, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ isAuthenticated: false, user: null, isLoading: false });
  },

  verifyAuth: async () => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      set({ isAuthenticated: false, user: null, isLoading: false });
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Assuming the verify route returns user data on success
      const userData = response.data.user || JSON.parse(localStorage.getItem("user") || "null");
      
      set({ 
        isAuthenticated: true, 
        user: userData,
        isLoading: false 
      });
    } catch (error) {
      // Token is invalid or expired
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      set({ isAuthenticated: false, user: null, isLoading: false });
    }
  }
}));

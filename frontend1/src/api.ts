import axios from "axios";

const API_URL = "/api/auth";

export const loginUser = async (email: string, password: string) => {
  const response = await axios.post(`${API_URL}/login`, { email, password });
  return response.data;
};

export const signupUser = async (name: string, email: string, password: string) => {
  const response = await axios.post(`${API_URL}/signup`, { name, email, password });
  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem("token");
};

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

// Import shadcn UI components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Shield, XIcon, LogInIcon, UserPlusIcon } from "lucide-react";
import { motion } from "framer-motion";

const API_BASE_URL = "http://localhost"; // Using localhost

type AuthFormProps = {
  type: "login" | "signup";
};

type AuthFormValues = {
  name?: string;
  email: string;
  password: string;
};

type MfaFormValues = {
  token: string;
};

const AuthForm = ({ type }: AuthFormProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm<AuthFormValues>();
  const { register: registerMfa, handleSubmit: handleSubmitMfa } = useForm<MfaFormValues>();
  const navigate = useNavigate();
  const isSignup = type === "signup";
  
  const [authStage, setAuthStage] = useState<"credentials" | "mfa">("credentials");
  const [userEmail, setUserEmail] = useState("");
  const [tempMfaToken, setTempMfaToken] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for existing session token
  useEffect(() => {
    const sessionToken = localStorage.getItem("token");
    if (sessionToken) {
      navigate("/");
    }
  }, [navigate]);

  const handleAuthSubmit = async (data: AuthFormValues) => {
    setIsSubmitting(true);
    try {
      if (isSignup) {
        await axios.post(`${API_BASE_URL}/api/v1/auth/register`, data);
        alert("Registration successful! Please login.");
        navigate("/login");
        return;
      }

      // Clear previous session data
      localStorage.removeItem("token");
      localStorage.removeItem("tempMfaToken");
      
      const loginResponse = await axios.post(
        `${API_BASE_URL}/api/v1/auth/login`,
        data
      );

      setUserEmail(data.email);

      // Check if MFA is required
      if (loginResponse.data.isMfaActive) {
        // MFA is already set up for this user
        setTempMfaToken(loginResponse.data.tempToken);
        localStorage.setItem("tempMfaToken", loginResponse.data.tempToken);
        setAuthStage("mfa");
      } else {
        // No MFA, user is logged in
        localStorage.setItem("token", loginResponse.data.token);
        // Use window.location.reload() for a full page refresh
        window.location.reload();
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || "Authentication failed"
        : "An unexpected error occurred";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const setupMfa = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/auth/mfa/setup`,
        { email: userEmail }
      );
      
      setQrCode(response.data.qrCode);
      setTempMfaToken(response.data.tempToken);
      localStorage.setItem("tempMfaToken", response.data.tempToken);
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || "Failed to set up MFA"
        : "An unexpected error occurred";
      alert(errorMessage);
    }
  };

  const handleMfaVerify = async ({ token }: MfaFormValues) => {
    setIsSubmitting(true);
    try {
      setMfaError("");
      
      const savedTempToken = localStorage.getItem("tempMfaToken") || tempMfaToken;
      
      const { data } = await axios.post(
        `${API_BASE_URL}/api/v1/auth/mfa/verify`,
        { 
          email: userEmail,
          token,
          tempMfaToken: savedTempToken
        }
      );

      // Update token in localStorage
      localStorage.setItem("token", data.token);
      
      // Clean up the temporary token
      localStorage.removeItem("tempMfaToken");
      
      // Use window.location.reload() for a full page refresh instead of navigate
      window.location.reload();
    } catch (err) {
      setMfaError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Verification failed"
          : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = prompt("Enter your email for password reset:");
    if (!email) return;

    try {
      await axios.post(`${API_BASE_URL}/api/v1/auth/forgotpassword`, { email });
      alert("If an account exists, password reset instructions have been sent.");
    } catch (err) {
      alert("Error sending reset instructions. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {authStage === "mfa" ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/50 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-2xl w-full max-w-md"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-blue-400 mr-2" />
              <h2 className="text-2xl font-bold text-white">Two-Factor Authentication</h2>
            </div>
            <button
              onClick={() => navigate("/")}
              className="text-gray-400 hover:text-white"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
          
          <p className="text-gray-400 mb-6">Verify your identity to continue</p>

          <Alert className="mb-6 bg-gray-800/50 border-blue-700/20 text-gray-200">
            <AlertCircle className="h-4 w-4 text-blue-400" />
            <AlertDescription>
              Enter the 6-digit code from your authenticator app below.
            </AlertDescription>
          </Alert>

          {qrCode && (
            <div className="text-center mb-6 bg-white p-4 rounded-lg">
              <img 
                src={qrCode} 
                alt="QR Code for MFA" 
                className="mx-auto mb-2 max-w-full h-auto" 
              />
              <p className="text-sm text-gray-600">
                Scan this QR code with your authenticator app
              </p>
            </div>
          )}

          <form onSubmit={handleSubmitMfa(handleMfaVerify)} className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-300 mb-1">Verification Code</label>
              <Input
                id="token"
                placeholder="Enter 6-digit code"
                className="bg-gray-800/50 border-gray-700 text-white w-full"
                {...registerMfa("token", {
                  required: "Verification code is required",
                  pattern: {
                    value: /^\d{6}$/,
                    message: "Must be a 6-digit number"
                  }
                })}
              />
              {mfaError && <p className="text-red-400 text-sm mt-1">{mfaError}</p>}
            </div>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow transition-colors"
            >
              {isSubmitting ? "Verifying..." : "Verify Identity"}
            </Button>
          </form>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/50 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-2xl w-full max-w-md"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white text-center">
              {isSignup ? "Create an Account" : "Login to Your Account"}
            </h2>
            <button
              onClick={() => navigate("/")}
              className="text-gray-400 hover:text-white"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit(handleAuthSubmit)} className="space-y-4">
            {isSignup && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <Input
                  id="name"
                  className="bg-gray-800/50 border-gray-700 text-white w-full"
                  placeholder="John Doe"
                  {...register("name", { required: "Name is required" })}
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <Input
                id="email"
                type="email"
                className="bg-gray-800/50 border-gray-700 text-white w-full"
                placeholder="your@email.com"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email format"
                  }
                })}
              />
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <Input
                id="password"
                type="password"
                className="bg-gray-800/50 border-gray-700 text-white w-full"
                placeholder="••••••••"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Minimum 8 characters required"
                  }
                })}
              />
              {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>}
            </div>

            {!isSignup && (
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
                  <button 
                    type="button"
                    onClick={handlePasswordReset}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            )}

            {isSignup && (
              <div className="flex items-center mt-4">
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
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {isSignup ? <UserPlusIcon className="w-5 h-5" /> : <LogInIcon className="w-5 h-5" />}
              <span>{isSubmitting ? (isSignup ? 'Creating account...' : 'Signing in...') : (isSignup ? 'Sign up' : 'Sign in')}</span>
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              {isSignup ? 'Already have an account? ' : "Don't have an account? "}
              <Link
                to={isSignup ? "/login" : "/signup"}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                {isSignup ? 'Sign in' : 'Sign up'}
              </Link>
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AuthForm;
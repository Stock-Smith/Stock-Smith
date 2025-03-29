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
import { AlertCircle, Shield } from "lucide-react";

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
    <div className="max-w-md mx-auto mt-10">
      {authStage === "mfa" ? (
        <Card className="bg-gray-900 border-gray-800 text-gray-100">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-2">
              <Shield className="h-10 w-10 text-blue-400" />
            </div>
            <CardTitle className="text-2xl text-center">Two-Factor Authentication</CardTitle>
            <CardDescription className="text-gray-400 text-center">
              Verify your identity to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Alert className="mb-4 bg-gray-800 border-blue-800 text-gray-200">
                <AlertCircle className="h-4 w-4 text-blue-400" />
                <AlertDescription>
                  Enter the 6-digit code from your authenticator app below.
                </AlertDescription>
              </Alert>

              {qrCode && (
                <div className="text-center mb-4">
                  <img 
                    src={qrCode} 
                    alt="QR Code for MFA" 
                    className="mx-auto mb-2 max-w-full h-auto" 
                  />
                  <p className="text-sm text-gray-400">
                    Scan this QR code with your authenticator app
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmitMfa(handleMfaVerify)}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="token" className="text-gray-300">Verification Code</Label>
                    <Input
                      id="token"
                      placeholder="Enter 6-digit code"
                      className="bg-gray-800 border-gray-700 text-gray-100 focus:ring-blue-500 focus:ring-opacity-50"
                      {...registerMfa("token", {
                        required: "Verification code is required",
                        pattern: {
                          value: /^\d{6}$/,
                          message: "Must be a 6-digit number"
                        }
                      })}
                    />
                    {mfaError && <p className="text-red-400 text-sm">{mfaError}</p>}
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSubmitting ? "Verifying..." : "Verify Identity"}
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gray-900 border-gray-800 text-gray-100">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {isSignup ? "Create New Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-gray-400 text-center">
              {isSignup 
                ? "Enter your details to create your account" 
                : "Enter your credentials to access your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleAuthSubmit)}>
              <div className="grid gap-4">
                {isSignup && (
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-gray-300">Full Name</Label>
                    <Input
                      id="name"
                      className="bg-gray-800 border-gray-700 text-gray-100 focus:ring-blue-500 focus:ring-opacity-50"
                      {...register("name", { required: "Name is required" })}
                    />
                    {errors.name && <p className="text-red-400 text-sm">{errors.name.message}</p>}
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    className="bg-gray-800 border-gray-700 text-gray-100 focus:ring-blue-500 focus:ring-opacity-50"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email format"
                      }
                    })}
                  />
                  {errors.email && <p className="text-red-400 text-sm">{errors.email.message}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-gray-300">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    className="bg-gray-800 border-gray-700 text-gray-100 focus:ring-blue-500 focus:ring-opacity-50"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 8,
                        message: "Minimum 8 characters required"
                      }
                    })}
                  />
                  {errors.password && (
                    <p className="text-red-400 text-sm">{errors.password.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white" 
                  disabled={isSubmitting}
                >
                  {isSubmitting 
                    ? "Processing..." 
                    : isSignup 
                      ? "Create Account" 
                      : "Sign In"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center pt-0">
            {!isSignup && (
              <Button 
                variant="link" 
                className="px-0 mb-2 text-blue-400 hover:text-blue-300"
                onClick={handlePasswordReset}
              >
                Forgot your password?
              </Button>
            )}
            <div className="text-center text-sm text-gray-400">
              {isSignup ? (
                <p>Already registered?{" "}
                  <Link to="/login" className="text-blue-400 hover:text-blue-300 hover:underline">
                    Login here
                  </Link>
                </p>
              ) : (
                <p>New user?{" "}
                  <Link to="/signup" className="text-blue-400 hover:text-blue-300 hover:underline">
                    Create account
                  </Link>
                </p>
              )}
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default AuthForm;
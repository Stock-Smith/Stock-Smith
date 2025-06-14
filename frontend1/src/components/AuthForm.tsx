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
  confirmPassword?: string;
};

type MfaFormValues = {
  token: string;
};

type ResetFormValues = {
  email?: string;
  resetToken?: string;
  password?: string;
};

const AuthForm = ({ type }: AuthFormProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm<AuthFormValues>();
  const { register: registerMfa, handleSubmit: handleSubmitMfa } = useForm<MfaFormValues>();
  const { register: registerReset, handleSubmit: handleSubmitReset, formState: { errors: resetErrors } } = useForm<ResetFormValues>();
  const navigate = useNavigate();
  const isSignup = type === "signup";

  const [authStage, setAuthStage] = useState<"credentials" | "mfa">("credentials");
  const [userEmail, setUserEmail] = useState("");
  const [tempMfaToken, setTempMfaToken] = useState("");
  const [setupMfa, setSetupMfa] = useState(false);

  const [mfaError, setMfaError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reset password popup states
  const [showResetPopup, setShowResetPopup] = useState(false);
  const [resetStep, setResetStep] = useState<"email" | "token">("email");
  const [resetEmail, setResetEmail] = useState("");

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
        // If MFA setup is checked, send MFA setup request
        if (setupMfa) {
          try {
            await axios.post(`${API_BASE_URL}/api/v1/auth/mfa/setup`, data);
            alert('Multi-Factor Authentication QR code has been sent to your email. Please scan it with your authenticator app.');
          } catch (mfaError) {
            alert('Registration successful, but MFA setup failed. You can set it up later.');
          }
        }
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

  // const setupMfa = async () => {
  //   try {
  //     const response = await axios.post(
  //       `${API_BASE_URL}/api/v1/auth/mfa/setup`,
  //       { email: userEmail }
  //     );
  //     setTempMfaToken(response.data.tempToken);
  //     localStorage.setItem("tempMfaToken", response.data.tempToken);
  //   } catch (err) {
  //     const errorMessage = axios.isAxiosError(err)
  //       ? err.response?.data?.message || "Failed to set up MFA"
  //       : "An unexpected error occurred";
  //     alert(errorMessage);
  //   }
  // };

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

  // Updated forgot password handler to show popup
  const handlePasswordReset = () => {
    setShowResetPopup(true);
    setResetStep("email");
  };

  // Handle email submission for forgot password
  const handleResetEmailSubmit = async (data: ResetFormValues) => {
    setIsSubmitting(true);
    try {
      await axios.post(`${API_BASE_URL}/api/v1/auth/forgotpassword`, { email: data.email });
      setResetEmail(data.email || "");
      setResetStep("token");
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || "Error sending reset instructions"
        : "An unexpected error occurred";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reset password with token
  const handleResetPasswordSubmit = async (data: ResetFormValues) => {
    setIsSubmitting(true);
    try {
      await axios.put(`${API_BASE_URL}/api/v1/auth/resetpassword/${data.resetToken}`, {
        password: data.password
      });
      alert("Password reset successfully! Please login with your new password.");
      setShowResetPopup(false);
      setResetStep("email");
      setResetEmail("");
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || "Password reset failed"
        : "An unexpected error occurred";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeResetPopup = () => {
    setShowResetPopup(false);
    setResetStep("email");
    setResetEmail("");
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Reset Password Popup */}
        {showResetPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="bg-gray-800 border-gray-700 w-full max-w-md mx-4">
              <CardHeader className="space-y-1 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                    <Shield className="h-6 w-6 text-blue-400" />
                    Reset Password
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {resetStep === "email" ? "Enter your email address" : "Enter reset token and new password"}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeResetPopup}
                  className="text-gray-400 hover:text-white"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {resetStep === "email" ? (
                  <form onSubmit={handleSubmitReset(handleResetEmailSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-white">Email Address</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="Enter your email"
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        {...registerReset("email", { 
                          required: "Email is required",
                          pattern: {
                            value: /^\S+@\S+$/i,
                            message: "Invalid email address"
                          }
                        })}
                      />
                      {resetErrors.email && (
                        <Alert className="border-red-500 bg-red-500/10">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <AlertDescription className="text-red-500">
                            {resetErrors.email?.message}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Sending..." : "Send Reset Email"}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-500/10 border border-green-500 rounded-lg">
                      <p className="text-green-400 text-sm">
                        Reset instructions have been sent to <strong>{resetEmail}</strong>. 
                        Please check your email and enter the reset token along with your new password below.
                      </p>
                    </div>
                    <form onSubmit={handleSubmitReset(handleResetPasswordSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-token" className="text-white">Reset Token</Label>
                        <Input
                          id="reset-token"
                          type="text"
                          placeholder="Enter reset token from email"
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          {...registerReset("resetToken", { 
                            required: "Reset token is required"
                          })}
                        />
                        {resetErrors.resetToken && (
                          <Alert className="border-red-500 bg-red-500/10">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <AlertDescription className="text-red-500">
                              {resetErrors.resetToken?.message}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="new-password" className="text-white">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="Enter new password"
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          {...registerReset("password", { 
                            required: "Password is required",
                            minLength: { value: 6, message: "Password must be at least 6 characters" }
                          })}
                        />
                        {resetErrors.password && (
                          <Alert className="border-red-500 bg-red-500/10">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <AlertDescription className="text-red-500">
                              {resetErrors.password?.message}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Resetting..." : "Reset Password"}
                      </Button>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {authStage === "mfa" ? (
          // Existing MFA form - unchanged
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="space-y-1 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <Shield className="h-6 w-6 text-blue-400" />
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Verify your identity to continue
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="text-gray-400 hover:text-white"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-300">
                  Enter the 6-digit code from your authenticator app below.
                </p>
                <form onSubmit={handleSubmitMfa(handleMfaVerify)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="token" className="text-white">Verification Code</Label>
                    <Input
                      id="token"
                      type="text"
                      placeholder="Enter 6-digit code"
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      {...registerMfa("token", { required: true })}
                    />
                    {mfaError && <Alert className="border-red-500 bg-red-500/10">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <AlertDescription className="text-red-500">{mfaError}</AlertDescription>
                    </Alert>}
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Verifying..." : "Verify Identity"}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Existing login/signup form - only forgot password button changed
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="space-y-1 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  {isSignup ? <UserPlusIcon className="h-6 w-6 text-blue-400" /> : <LogInIcon className="h-6 w-6 text-blue-400" />}
                  {isSignup ? "Create an Account" : "Login to Your Account"}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {isSignup ? "Join us today" : "Welcome back"}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="text-gray-400 hover:text-white"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(handleAuthSubmit)} className="space-y-4">
                {isSignup && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      {...register("name", { required: "Name is required" })}
                    />
                    {errors.name && <Alert className="border-red-500 bg-red-500/10">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <AlertDescription className="text-red-500">{errors.name?.message}</AlertDescription>
                    </Alert>}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    {...register("email", { 
                      required: "Email is required",
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: "Invalid email address"
                      }
                    })}
                  />
                  {errors.email && <Alert className="border-red-500 bg-red-500/10">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-500">{errors.email?.message}</AlertDescription>
                  </Alert>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    {...register("password", { 
                      required: "Password is required",
                      minLength: { value: 6, message: "Password must be at least 6 characters" }
                    })}
                  />
                  {errors.password && <Alert className="border-red-500 bg-red-500/10">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-500">{errors.password?.message}</AlertDescription>
                  </Alert>}
                </div>

                {!isSignup && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="remember" className="rounded" />
                      <Label htmlFor="remember" className="text-sm text-gray-300">Remember me</Label>
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      className="text-blue-400 hover:text-blue-300 p-0"
                      onClick={handlePasswordReset}
                    >
                      Forgot password?
                    </Button>
                  </div>
                )}

                {isSignup && (
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="setupMfa" 
                      className="rounded" 
                      checked={setupMfa}
                      onChange={(e) => setSetupMfa(e.target.checked)}
                    />
                    <Label htmlFor="setupMfa" className="text-sm text-gray-300">
                      Setup Multi-Factor Authentication (MFA will be sent via email)
                    </Label>
                  </div>
                )}


                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSignup ? <UserPlusIcon className="mr-2 h-4 w-4" /> : <LogInIcon className="mr-2 h-4 w-4" />}
                  {isSubmitting ? (isSignup ? 'Creating account...' : 'Signing in...') : (isSignup ? 'Sign up' : 'Sign in')}
                </Button>
              </form>
            </CardContent>
            <CardFooter>
              <p className="text-center text-sm text-gray-400 w-full">
                {isSignup ? 'Already have an account? ' : "Don't have an account? "}
                <Link
                  to={isSignup ? '/login' : '/register'}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  {isSignup ? 'Sign in' : 'Sign up'}
                </Link>
              </p>
            </CardFooter>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

export default AuthForm;

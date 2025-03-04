import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

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
  const [mfaError, setMfaError] = useState("");

  // Add session validation effect
  useEffect(() => {
    const verifySession = async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/v1/auth/status`, {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });
      } catch (err) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    if (localStorage.getItem("token")) {
      verifySession();
    }
  }, [navigate]);

  const handleAuthSubmit = async (data: AuthFormValues) => {
    try {
      if (isSignup) {
        await axios.post(`${API_BASE_URL}/api/v1/auth/register`, data);
        alert("Registration successful! Please login.");
        navigate("/login");
        return;
      }

      // Clear previous session data
      localStorage.removeItem("token");
      
      const loginResponse = await axios.post(
        `${API_BASE_URL}/api/v1/auth/login`,
        data,
        { withCredentials: true }
      );

      setUserEmail(data.email);

      // Get fresh auth status
      const statusResponse = await axios.get(
        `${API_BASE_URL}/api/v1/auth/status`,
        { 
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${loginResponse.data.token}`
          }
        }
      );

      if (!statusResponse.data.user.isMfaActive) {
        await axios.post(
          `${API_BASE_URL}/api/v1/auth/mfa/setup`,
          {},
          { 
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${loginResponse.data.token}`
            }
          }
        );
      }
      
      setAuthStage("mfa");
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || "Authentication failed"
        : "An unexpected error occurred";
      alert(errorMessage);
    }
  };

  const handleMfaVerify = async ({ token }: MfaFormValues) => {
    try {
      setMfaError("");
      const { data } = await axios.post(
        `${API_BASE_URL}/api/v1/auth/mfa/verify`,
        { token },
        { 
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      // Update token and session
      localStorage.setItem("token", data.token);
      
      // Force session refresh
      const statusResponse = await axios.get(
        `${API_BASE_URL}/api/v1/auth/status`,
        { 
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${data.token}`
          }
        }
      );

      if (statusResponse.data.user?.isMfaActive) {
        navigate("/dashboard", { replace: true });
        window.location.reload(); // Ensure fresh session state
      }
    } catch (err) {
      setMfaError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Verification failed"
          : "An unexpected error occurred"
      );
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
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-lg shadow-lg">
      {authStage === "mfa" ? (
        <div>
          <h2 className="text-2xl font-bold mb-4">Two-Factor Authentication</h2>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800">
              We've sent a QR code to <span className="font-semibold">{userEmail}</span>. 
              Scan it with your authenticator app and enter the 6-digit code below.
            </p>
          </div>

          <form onSubmit={handleSubmitMfa(handleMfaVerify)}>
            <div className="mb-4">
              <input
                {...registerMfa("token", {
                  required: "Verification code is required",
                  pattern: {
                    value: /^\d{6}$/,
                    message: "Must be a 6-digit number"
                  }
                })}
                className="w-full p-2 border rounded"
                placeholder="Enter 6-digit code"
              />
              {mfaError && <p className="text-red-500 text-sm mt-1">{mfaError}</p>}
            </div>
            <button
              type="submit"
              className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Verify Identity
            </button>
          </form>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold mb-4">
            {isSignup ? "Create New Account" : "Welcome Back"}
          </h2>
          <form onSubmit={handleSubmit(handleAuthSubmit)}>
            {isSignup && (
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Full Name</label>
                <input
                  {...register("name", { required: "Name is required" })}
                  className="w-full p-2 border rounded"
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Email Address</label>
              <input
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email format"
                  }
                })}
                type="email"
                className="w-full p-2 border rounded"
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Password</label>
              <input
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Minimum 8 characters required"
                  }
                })}
                type="password"
                className="w-full p-2 border rounded"
              />
              {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {isSignup ? "Create Account" : "Continue to Security Check"}
            </button>

            {!isSignup && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="text-blue-600 hover:underline"
                >
                  Forgot your password?
                </button>
              </div>
            )}
          </form>

          <div className="mt-6 text-center text-sm">
            {isSignup ? (
              <p>Already registered?{" "}
                <a href="/login" className="text-blue-600 hover:underline">Login here</a>
              </p>
            ) : (
              <p>New user?{" "}
                <a href="/signup" className="text-blue-600 hover:underline">Create account</a>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthForm;
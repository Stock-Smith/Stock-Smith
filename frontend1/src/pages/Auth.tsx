import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import AuthForm from "../components/AuthForm";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const paramType = searchParams.get("type");

  // Ensure the type is either "login" or "signup", otherwise default to "login"
  const initialForm: "login" | "signup" = paramType === "signup" ? "signup" : "login";
  const [formType, setFormType] = useState<"login" | "signup">(initialForm);

  return (
    <div className="flex flex-col items-center gap-4">
      <AuthForm type={formType} />
      <button 
        onClick={() => setFormType(formType === "login" ? "signup" : "login")} 
        className="text-blue-500 underline"
      >
        {formType === "login" ? "New? Sign up here" : "Already have an account? Login"}
      </button>
    </div>
  );
};

export default Auth;

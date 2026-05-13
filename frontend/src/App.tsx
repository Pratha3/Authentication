import AuthForm from "./components/authForm";


export function LoginView() {
  const handleAuthSubmit = async (email: string, password?: string) => {
    if (!password) {
      // 1. FORGOT PASSWORD API TRIGGER
      const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      alert(await response.text());
    } else {
      // 2. STANDARD LOGIN API TRIGGER
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      alert(await response.text());
    }
  };

  return (
    <AuthForm 
      title="Login" 
      buttonText="Sign In" 
      toggleText="Don't have an account? Sign Up" 
      onToggle={() => console.log("Go to signup")} 
      onSubmit={handleAuthSubmit}
      showForgotPasswordLink={true} // Enables password recovery navigation route trigger options
    />
  );
}

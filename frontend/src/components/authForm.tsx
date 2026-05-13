import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";

interface AuthFormProps {
  title: string;
  buttonText: string;
  onSubmit: (email: string, password?: string) => void; // Password made optional for Forgot Password
  toggleText: string;
  onToggle: () => void;
  showForgotPasswordLink?: boolean; // New prop to show/hide the link on Login page
}

export default function AuthForm({ title, buttonText, onSubmit, toggleText, onToggle, showForgotPasswordLink = false }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isForgotPasswordView, setIsForgotPasswordView] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isForgotPasswordView) {
      onSubmit(email); // Sends only email to backend /forgot-password endpoint
    } else {
      onSubmit(email, password); // Sends both for signup/login
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-900">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
            {isForgotPasswordView ? "Reset Password" : title}
          </CardTitle>
          <CardDescription className="text-center">
            {isForgotPasswordView 
              ? "Enter your email address and we'll send you a recovery link" 
              : "Enter your email and password below to continue"}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Email Input Field */}
            <div className="space-y-2">
              <Input 
                type="email" 
                placeholder="name@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="w-full" 
              />
            </div>

            {/* Conditionally Render Password Field */}
            {!isForgotPasswordView && (
              <div className="space-y-2">
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="w-full" 
                />
                
                {/* Inline Forgot Password Toggle Trigger */}
                {showForgotPasswordLink && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordView(true)}
                      className="text-xs text-blue-600 hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-2">
            <Button type="submit" variant="default" className="w-full">
              {isForgotPasswordView ? "Send Recovery Link" : buttonText}
            </Button>
            
            <Button 
              type="button" 
              variant="link" 
              onClick={isForgotPasswordView ? () => setIsForgotPasswordView(false) : onToggle} 
              className="w-full text-sm text-slate-500 hover:text-slate-900"
            >
              {isForgotPasswordView ? "Back to Login" : toggleText}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

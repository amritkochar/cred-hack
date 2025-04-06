"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LoginRequest, RegisterRequest } from "@/types/auth";

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function AuthForm() {
  // State for form view toggle
  const [isLogin, setIsLogin] = useState(true);
  
  // Form data state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
  });
  
  // Form validation state
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    username: "",
    form: "",
  });
  
  // Auth context
  const { login, register, isLoading, error } = useAuth();

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear field error when typing
    if (errors[name as keyof typeof errors]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {
      email: "",
      password: "",
      username: "",
      form: "",
    };
    
    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    
    // Username validation (only for register)
    if (!isLogin && !formData.username) {
      newErrors.username = "Username is required";
    }
    
    setErrors(newErrors);
    
    // Return true if no errors
    return !Object.values(newErrors).some(error => error);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear form error
    setErrors({ ...errors, form: "" });
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      if (isLogin) {
        // Login
        const loginData: LoginRequest = {
          email: formData.email,
          password: formData.password,
        };
        await login(loginData);
      } else {
        // Register
        const registerData: RegisterRequest = {
          email: formData.email,
          password: formData.password,
          username: formData.username,
        };
        await register(registerData);
      }
    } catch (err) {
      // Error is handled by the auth context and displayed below
      setErrors({ ...errors, form: (err as Error).message || "An unexpected error occurred" });
    }
  };

  // Toggle between login and register views
  const toggleView = () => {
    setIsLogin(!isLogin);
    // Clear errors when switching views
    setErrors({
      email: "",
      password: "",
      username: "",
      form: "",
    });
  };

  return (
    <div className="w-[320px] mx-auto glass rounded-[28px] p-6 md:p-8 flex flex-col items-center justify-between min-h-[420px] animate-fade-in shadow-lg hover:shadow-xl transition-all">
      <h1 className="text-3xl xs:text-4xl md:text-5xl font-bold text-white tracking-tight mt-4 md:mt-6">
        {isLogin ? "Login" : "Register"}
      </h1>
      
      <form onSubmit={handleSubmit} className="w-full max-w-[280px] space-y-5 mt-6">
        {/* Email Field */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">
            Email
          </label>
          <div className="relative">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 rounded-lg bg-gray-800/80 border ${
                errors.email ? "border-red-500" : "border-gray-700/50"
              } text-white focus:ring-2 focus:ring-purple-500/70 focus:border-purple-500 shadow-sm hover:bg-gray-700/80 mb-2 transition-all`}
              placeholder="your@email.com"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-400 mt-1">{errors.email}</p>
          )}
        </div>
        
        {/* Username Field (Register only) */}
        {!isLogin && (
          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-lg bg-gray-800/80 border ${
                  errors.username ? "border-red-500" : "border-gray-700/50"
                } text-white focus:ring-2 focus:ring-purple-500/70 focus:border-purple-500 shadow-sm hover:bg-gray-700/80 mb-2 transition-all`}
                placeholder="username"
              />
            </div>
            {errors.username && (
              <p className="text-xs text-red-400 mt-1">{errors.username}</p>
            )}
          </div>
        )}
        
        {/* Password Field */}
        <div className="space-y-2 mb-4 border-b border-gray-700/50 pb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-300">
            Password
          </label>
          <div className="relative">
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 rounded-lg bg-gray-800/80 border ${
          errors.password ? "border-red-500" : "border-gray-700/50"
              } text-white focus:ring-2 focus:ring-purple-500/70 focus:border-purple-500 shadow-sm hover:bg-gray-700/80 mb-2 transition-all`}
              placeholder="••••••••"
            />
          </div>
          {errors.password && (
            <p className="text-xs text-red-400 mt-1">{errors.password}</p>
          )}
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary py-2.5 mt-8 flex items-center justify-center rounded-lg text-white font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] border border-gray-700/50 mt-4"
        >
          {isLoading ? (
            <span className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></span>
          ) : null}
          {isLogin ? "Login" : "Register"}
        </button>
        
        {/* Form Error */}
        {(errors.form || error) && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 mt-4">
            <p className="text-sm text-red-400 text-center">
              {errors.form || error}
            </p>
          </div>
        )}
      </form>
      
      {/* Toggle View */}
      <div className="mt-6 mb-4 text-center">
        <p className="text-gray-400 text-sm">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            type="button"
            onClick={toggleView}
            className="w-full btn-primary py-2.5 mt-8 flex items-center justify-center rounded-lg text-white font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] border border-gray-700/50 mt-4"
            >
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}

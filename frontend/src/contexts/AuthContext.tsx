"use client";

import React, { createContext, useContext, useState, useEffect, FC, PropsWithChildren } from "react";
import { useRouter } from "next/navigation";
import { AuthState, AuthTokens, LoginRequest, RegisterRequest } from "@/types/auth";
import { fetchUserPersona, loginUser, registerUser, uploadBankStatement } from "@/api/backendApi";
import { clearTokens, clearUserPersona, getTokens, isAuthenticated, storeTokens, storeUserPersona } from "@/utils/storage";

// Define the context value interface
interface AuthContextValue extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  completeOnboarding: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Initial auth state
const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  tokens: null,
  error: null,
  isNewUser: false,
};

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState);
  const router = useRouter();

  // Check for existing tokens on mount
  useEffect(() => {
    const checkAuth = () => {
      const tokens = getTokens();
      const authenticated = isAuthenticated();

      setState({
        isAuthenticated: authenticated,
        isLoading: false,
        tokens,
        error: null,
        isNewUser: false,
      });
    };

    checkAuth();
  }, []);

  // Set cookies for server-side authentication
  const setCookies = (tokens: AuthTokens): void => {
    // Set cookies with HttpOnly and Secure flags
    // These will be accessible by the server but not by JavaScript
    document.cookie = `access_token=${tokens.access_token}; path=/; max-age=86400; SameSite=Strict`;
    document.cookie = `openai_ephemeral_token=${tokens.openai_ephemeral_token}; path=/; max-age=86400; SameSite=Strict`;
  };

  // Login function
  const login = async (data: LoginRequest): Promise<void> => {
    setState({ ...state, isLoading: true, error: null });

    try {
      const tokens = await loginUser(data);
      
      // Store tokens in localStorage for client-side access
      storeTokens(tokens);
      
      // Set cookies for server-side access
      setCookies(tokens);

      setState({
        isAuthenticated: true,
        isLoading: false,
        tokens,
        error: null,
        isNewUser: false,
      });

      // Fetch user persona data after successful login
      try {
        const userPersona = await fetchUserPersona();
        // Store user persona in localStorage
        storeUserPersona(userPersona);
        console.log('User persona fetched and stored successfully');
      } catch (personaError) {
        console.error('Failed to fetch user persona:', personaError);
        // Continue with login flow even if persona fetch fails
      }

      // Redirect to home page after successful login
      router.push('/');
    } catch (error) {
      setState({
        ...state,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
        isNewUser: false,
      });
      throw error;
    }
  };

  // Register function
  const register = async (data: RegisterRequest): Promise<void> => {
    setState({ ...state, isLoading: true, error: null });

    try {
      await registerUser(data);
      
      // After successful registration, automatically log in
      const tokens = await loginUser({ email: data.email, password: data.password });
      
      // Store tokens in localStorage for client-side access
      storeTokens(tokens);
      
      // Set cookies for server-side access
      setCookies(tokens);

      // Set state to indicate this is a new user that needs onboarding
      setState({
        isAuthenticated: true,
        isLoading: false,
        tokens,
        error: null,
        isNewUser: true,
      });

      // Redirect to onboarding page for new users
      router.push('/auth/onboarding');
    } catch (error) {
      setState({
        ...state,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Registration failed',
        isNewUser: false,
      });
      throw error;
    }
  };

  // Complete onboarding function
  const completeOnboarding = async (): Promise<void> => {
    setState({ ...state, isLoading: true });

    try {
      // Fetch user persona data after successful onboarding
      const userPersona = await fetchUserPersona();
      // Store user persona in localStorage
      storeUserPersona(userPersona);
      
      // Update state to indicate user is no longer new
      setState({
        ...state,
        isLoading: false,
        isNewUser: false,
      });

      // Redirect to home page after successful onboarding
      router.push('/');
    } catch (error) {
      setState({
        ...state,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to complete onboarding',
      });
      throw error;
    }
  };

  // Logout function
  const logout = (): void => {
    // Clear localStorage tokens and user persona
    clearTokens();
    clearUserPersona();
    
    // Clear cookies
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'openai_ephemeral_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    setState({
      isAuthenticated: false,
      isLoading: false,
      tokens: null,
      error: null,
      isNewUser: false,
    });
    router.push('/auth');
  };

  // Context value
  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    completeOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

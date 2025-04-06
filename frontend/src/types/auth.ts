/**
 * Authentication related types
 */

// Register request payload
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

// Login request payload
export interface LoginRequest {
  email: string;
  password: string;
}

// Authentication tokens returned from login
export interface AuthTokens {
  access_token: string;
  openai_ephemeral_token: string;
}

// Authentication state
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  tokens: AuthTokens | null;
  error: string | null;
  isNewUser: boolean;
}

// User information
export interface User {
  email: string;
  username: string;
}

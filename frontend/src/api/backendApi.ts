/**
 * Backend API service for authentication and user data
 */

import { API_ENDPOINTS } from "@/config/apiConfig";
import { AuthTokens, LoginRequest, RegisterRequest } from "@/types/auth";
import { UserPersona } from "@/types/userPersona";
import { getAccessToken } from "@/utils/storage";

/**
 * Register a new user
 */
export const registerUser = async (data: RegisterRequest): Promise<void> => {
  const response = await fetch(API_ENDPOINTS.register, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Registration failed');
  }

  return;
};

/**
 * Login a user and get authentication tokens
 */
export const loginUser = async (data: LoginRequest): Promise<AuthTokens> => {
  const response = await fetch(API_ENDPOINTS.login, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Login failed');
  }

  const tokens: AuthTokens = await response.json();
  return tokens;
};

/**
 * Create an authenticated fetch function that includes the access token
 */
export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    throw new Error('No access token available');
  }

  const authOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
    },
  };

  return fetch(url, authOptions);
};

/**
 * Fetch user persona data
 */
export const fetchUserPersona = async (): Promise<UserPersona> => {
  const response = await authFetch(API_ENDPOINTS.userPersona);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch user persona');
  }

  const userPersona: UserPersona = await response.json();
  return userPersona;
};

/**
 * Upload bank statement for user onboarding
 */
export const uploadBankStatement = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await authFetch(API_ENDPOINTS.onboardBanking, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to upload bank statement');
  }

  return response.json();
};

/**
 * Local storage utilities for authentication and user data
 */

import { AuthTokens } from "@/types/auth";
import { UserPersona } from "@/types/userPersona";

// Storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const OPENAI_EPHEMERAL_TOKEN_KEY = 'openai_ephemeral_token';
const USER_PERSONA_KEY = 'user_persona';
const IS_NEW_USER_KEY = 'is_new_user';

/**
 * Check if code is running in a browser environment
 * This is needed for Next.js which does server-side rendering
 */
const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

/**
 * Store authentication tokens in local storage
 */
export const storeTokens = (tokens: AuthTokens): void => {
  if (!isBrowser()) {
    return;
  }
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  localStorage.setItem(OPENAI_EPHEMERAL_TOKEN_KEY, tokens.openai_ephemeral_token);
};

/**
 * Retrieve authentication tokens from local storage
 */
export const getTokens = (): AuthTokens | null => {
  if (!isBrowser()) {
    return null;
  }
  
  const access_token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const openai_ephemeral_token = localStorage.getItem(OPENAI_EPHEMERAL_TOKEN_KEY);

  if (!access_token || !openai_ephemeral_token) {
    return null;
  }

  return {
    access_token,
    openai_ephemeral_token
  };
};

/**
 * Get access token from local storage
 */
export const getAccessToken = (): string | null => {
  if (!isBrowser()) {
    return null;
  }
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Get OpenAI ephemeral token from local storage
 */
export const getOpenAIEphemeralToken = (): string | null => {
  if (!isBrowser()) {
    return null;
  }
  return localStorage.getItem(OPENAI_EPHEMERAL_TOKEN_KEY);
};

/**
 * Clear all authentication tokens from local storage
 */
export const clearTokens = (): void => {
  if (!isBrowser()) {
    return;
  }
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(OPENAI_EPHEMERAL_TOKEN_KEY);
};

/**
 * Check if user is authenticated (has tokens)
 */
export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

/**
 * Store user persona data in local storage
 */
export const storeUserPersona = (userPersona: UserPersona): void => {
  if (!isBrowser()) {
    return;
  }
  localStorage.setItem(USER_PERSONA_KEY, JSON.stringify(userPersona));
};

/**
 * Retrieve user persona data from local storage
 */
export const getUserPersona = (): UserPersona | null => {
  if (!isBrowser()) {
    return null;
  }
  
  const userPersonaStr = localStorage.getItem(USER_PERSONA_KEY);
  
  if (!userPersonaStr) {
    return null;
  }
  
  try {
    return JSON.parse(userPersonaStr) as UserPersona;
  } catch (error) {
    console.error('Error parsing user persona from local storage:', error);
    return null;
  }
};

/**
 * Clear user persona data from local storage
 */
export const clearUserPersona = (): void => {
  if (!isBrowser()) {
    return;
  }
  localStorage.removeItem(USER_PERSONA_KEY);
};

/**
 * Store isNewUser flag in local storage
 */
export const storeIsNewUser = (isNewUser: boolean): void => {
  if (!isBrowser()) {
    return;
  }
  localStorage.setItem(IS_NEW_USER_KEY, isNewUser ? 'true' : 'false');
};

/**
 * Retrieve isNewUser flag from local storage
 */
export const getIsNewUser = (): boolean => {
  if (!isBrowser()) {
    return false;
  }
  
  const isNewUserStr = localStorage.getItem(IS_NEW_USER_KEY);
  return isNewUserStr === 'true';
};

/**
 * Clear isNewUser flag from local storage
 */
export const clearIsNewUser = (): void => {
  if (!isBrowser()) {
    return;
  }
  localStorage.removeItem(IS_NEW_USER_KEY);
};

/**
 * Backend API configuration
 */

// Base URL for the backend API
export const API_BASE_URL = 'http://127.0.0.1:8000';

// API endpoints
export const API_ENDPOINTS = {
  register: `${API_BASE_URL}/auth/register`,
  login: `${API_BASE_URL}/auth/token`,
  userPersona: `${API_BASE_URL}/users/persona`,
  onboardBanking: `${API_BASE_URL}/users/onboard-banking`,
};

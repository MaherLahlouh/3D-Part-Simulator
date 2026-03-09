//@ts-nocheck

import { jwtDecode } from "jwt-decode";

const TOKEN_KEY = "token";

export const authService = {
  // Save the token after login
  setToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  // Get the token for API calls
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Decode the token to see User info (Role, ID)
  getUser: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    try {
      return jwtDecode(token);
    } catch (error) {
      return null;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    //------------------------------------------------------need edit to redirect to login page-----------------------------
    window.location.href = "/src/client/pages/dashboard.html";
    console.log("User logged out, redirecting to home page.");
  },

  //  Check if token is expired
  isLoggedIn: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    try {
      const { exp } = jwtDecode(token);
      return exp * 1000 > Date.now(); 
    } catch {
      return false;
    }
  }
};
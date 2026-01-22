"use client";

import { createContext, useContext, useEffect, useState } from "react";
const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = sessionStorage.getItem("auth_token");
    const storedUser = sessionStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

const login = (token, user, sessionId) => {
    sessionStorage.setItem("auth_token", token);
    sessionStorage.setItem("user", JSON.stringify(user));
    sessionStorage.setItem("sessionId", sessionId)
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("sessionId");
    setToken(null);
    setUser(null);
  };

  return (
<AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}

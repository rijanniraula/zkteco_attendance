import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getToken, makeApiRequest, setToken } from "@/helpers/api";
import { ENDPOINTS } from "@/helpers/constants";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(getToken()));

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const response = await makeApiRequest({ endpoint: ENDPOINTS.ME });
    setUser(response.user);
    return response.user;
  }, []);

  // Restore the session from a saved token
  useEffect(() => {
    if (!getToken()) return;
    refreshUser()
      .catch(() => logout())
      .finally(() => setIsLoading(false));
  }, [refreshUser, logout]);

  // api.js fires this on any 401
  useEffect(() => {
    window.addEventListener("auth:logout", logout);
    return () => window.removeEventListener("auth:logout", logout);
  }, [logout]);

  const login = async (email, password) => {
    const response = await makeApiRequest({
      endpoint: ENDPOINTS.LOGIN,
      method: "POST",
      requestBody: { email, password },
    });
    setToken(response.token);
    setUser(response.user);
    return response.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin: user?.role === "super_admin",
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await SecureStore.getItemAsync("access_token");
      if (token) {
        const { data } = await api.get("/profiles/me");
        setProfile(data);
        setUser({ id: data.id });
      }
    } catch {
      await SecureStore.deleteItemAsync("access_token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    await SecureStore.setItemAsync("access_token", data.access_token);
    await SecureStore.setItemAsync("refresh_token", data.refresh_token);
    setUser(data.user);
    await loadUser();
    return data;
  };

  const register = async (email, password, name) => {
    const { data } = await api.post("/auth/register", { email, password, name });
    return data;
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates) => {
    const { data } = await api.patch("/profiles/me", updates);
    setProfile(data);
    await loadUser();
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
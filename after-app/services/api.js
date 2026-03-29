import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = "http://192.168.1.156:3000/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Ajoute le token automatiquement
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh token si expiré
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refresh = await SecureStore.getItemAsync("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refresh,
          });
          await SecureStore.setItemAsync("access_token", data.access_token);
          error.config.headers.Authorization = `Bearer ${data.access_token}`;
          return api(error.config);
        } catch {
          await SecureStore.deleteItemAsync("access_token");
          await SecureStore.deleteItemAsync("refresh_token");
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

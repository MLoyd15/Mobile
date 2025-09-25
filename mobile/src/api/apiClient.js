// src/api/apiClient.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Platform } from "react-native";

// Keep this near the top of apiClient.js, after imports
axios.interceptors.request.use(async (config) => {
  try {
    // If header already set (e.g., after login), keep it
    if (!config.headers?.Authorization) {
      const t = await AsyncStorage.getItem("pos-token");
      if (t) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${t}`;
      }
    }
  } catch {}
  return config;
});

/**
 * Base URL selection
 * - Prefer EXPO_PUBLIC_API_URL (e.g. http://192.168.1.23:5000/api)
 * - Otherwise choose a sensible default per platform
 *   • Android emulator → http://10.0.2.2:5000/api
 *   • iOS simulator / Web → http://localhost:5000/api
 * For a real device on Wi-Fi, set EXPO_PUBLIC_API_URL to your LAN IP.
 */
const ENV_URL = process.env.EXPO_PUBLIC_API_URL;

const FALLBACK_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:5000/api"
    : "http://localhost:5000/api";

export const API_URL = ENV_URL || FALLBACK_URL;

// Base origin (strip trailing /api)
export const API_ORIGIN = API_URL.replace(/\/api$/, "");

/** Turn relative image paths (e.g. "/uploads/a.jpg") into absolute URLs */
export const toAbsoluteUrl = (u) => {
  if (!u) return null;
  try {
    return new URL(u).href; // already absolute
  } catch {
    return `${API_ORIGIN}/${String(u).replace(/^\/+/, "")}`;
  }
};

/* =========================
   Auth/token helpers
   ========================= */
export const setToken = async (token) => {
  if (token) {
    await AsyncStorage.setItem("pos-token", token);
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    await AsyncStorage.removeItem("pos-token");
    delete axios.defaults.headers.common.Authorization;
  }
};

export const getToken = async () => {
  const t = await AsyncStorage.getItem("pos-token");
  if (t) axios.defaults.headers.common.Authorization = `Bearer ${t}`;
  return t;
};

export const setUser = async (user) =>
  AsyncStorage.setItem("pos-user", JSON.stringify(user || {}));

export const getUser = async () => {
  const raw = await AsyncStorage.getItem("pos-user");
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearAuth = async () => {
  await AsyncStorage.multiRemove(["pos-token", "pos-user"]);
  delete axios.defaults.headers.common.Authorization;
};

/** Simple validator used in checkout */
export const isValidGcash = (num) => /^09\d{9}$/.test((num || "").trim());

/* =========================
   API calls (correct paths)
   ========================= */
/** Auth */
export const register = (payload) => axios.post(`${API_URL}/auth/register`, payload);
export const login = (payload) => axios.post(`${API_URL}/auth/login`, payload);

/** Catalog */
export const getProducts = () => axios.get(`${API_URL}/products`);
export const getProductApi = (id) => axios.get(`${API_URL}/products/${id}`);
export const getCategories = () => axios.get(`${API_URL}/categories`);

/** Reviews */
export const addReviewApi = (productId, payload, token) =>
  axios.post(`${API_URL}/products/${productId}/reviews`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getMyReviewsApi = (token) =>
  axios.get(`${API_URL}/products/my/reviews`, {
    headers: { Authorization: `Bearer ${token}` },
  });

/** Cart */
export const getCart = (userId) => axios.get(`${API_URL}/cart/${userId}`);
export const setCartApi = (payload) => axios.post(`${API_URL}/cart`, payload);

/** Orders */
export const getOrders = (userId) => axios.get(`${API_URL}/orders/${userId}`);
export const createOrder = (payload) => axios.post(`${API_URL}/orders`, payload);

// --- Deliveries (current user) ---
export const listMyDeliveries = () => axios.get(`${API_URL}/delivery/mine`);
export const getDeliveryForOrder = (orderId) =>
  axios.get(`${API_URL}/delivery/by-order/${orderId}`);
export const getDriverContact = (deliveryId) =>
  axios.get(`${API_URL}/delivery/${deliveryId}/driver`);

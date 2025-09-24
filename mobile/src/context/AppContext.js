import { useRouter } from "expo-router";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

// ---- Backend API (axios) ----
import {
  addReviewApi,
  createOrder as apiCreateOrder,
  getCart as apiGetCart,
  getOrders as apiGetOrders,
  login as apiLogin,
  register as apiRegister,
  clearAuth,
  getCategories,
  getMyReviewsApi,
  getProductApi,
  getProducts,
  getToken,
  isValidGcash,
  setUser as persistUser,
  getUser as readUser,
  setCartApi,
  setToken,
  toAbsoluteUrl,
} from "../api/apiClient";

// ---- Guest cart (AsyncStorage only) ----
import { clearCart, loadCart, saveCart } from "./cartOrdersServices";

export const AppCtx = createContext(null);

export default function AppProvider({ children }) {
  const router = useRouter();

  // data state
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productDetail, setProductDetail] = useState(null);
  const [myReviews, setMyReviews] = useState([]);

  // categories map {id: name}
  const [categoryMap, setCategoryMap] = useState({});

  // UI/filter state
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [lastAddedCategory, setLastAddedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // checkout state
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [gcashNumber, setGcashNumber] = useState("");

  // derived
  const isLoggedIn = !!user?._id || !!user?.id || !!user?.email;
  const userId = useMemo(() => user?._id || user?.id || user?.email || "guest", [user]);

  // boot
  useEffect(() => {
    (async () => {
      try {
        await getToken(); // primes axios Authorization if token exists
        const u = await readUser();
        if (u) setUserState(u);

        const [prod, cats] = await Promise.all([
          getProducts(),
          getCategories().catch(() => ({ data: [] })),
        ]);

        setProducts(Array.isArray(prod?.data) ? prod.data : []);
        const map = {};
        (cats.data || []).forEach((c) => {
          map[String(c._id)] = c.name || c.categoryName || "";
        });
        setCategoryMap(map);

        if (u) {
          await refreshAuthedData(u);
        } else {
          const guestCart = await loadCart();
          setCart(Array.isArray(guestCart?.items) ? guestCart.items : []);
        }
      } catch (e) {
        console.warn("App boot failed:", e?.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // refresh backend data for authed user
const refreshAuthedData = useCallback(async (u = user) => {
  if (!u) return;
  const id = u?._id || u?.id || u?.email;
  if (!id) return;

  try {
    const [cartResp, ordersResp] = await Promise.allSettled([
      apiGetCart(id),
      apiGetOrders(id),
    ]);

    if (cartResp.status === "fulfilled") {
      const items = cartResp.value?.data?.items;
      setCart(Array.isArray(items) ? items : []);
    } else {
      setCart([]);
    }

    if (ordersResp.status === "fulfilled") {
      const data = ordersResp.value?.data;
      setOrders(Array.isArray(data) ? data : []);
    } else {
      setOrders([]);
    }
  } catch {
    setCart([]);
    setOrders([]);
  }
}, [user]);

  // guard: block guests from protected actions
  const ensureAuthed = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return false;
    }
    return true;
  };

  // ---- cart persistence helper ----
  const persistCart = async (items) => {
    try {
      if (isLoggedIn) {
        await setCartApi({ userId, items });
      } else {
        await saveCart({ items, total: 0 });
      }
    } catch (e) {
      console.warn("persist cart failed:", e?.message);
    }
  };

  // ---------------- CART ACTIONS ----------------

  const handleAddToCart = async (product) => {
    const idx = cart.findIndex((i) => i.productId === product._id);
    const updated =
      idx > -1
        ? cart.map((i, k) => (k === idx ? { ...i, quantity: Number(i.quantity || 0) + 1 } : i))
        : [
            ...cart,
            {
              productId: product._id,
              name: product.name,
              price: Number(product.price || 0),
              imageUrl: product.imageUrl || product.images?.[0] || "",
              quantity: 1,
            },
          ];

    setCart(updated);
    persistCart(updated);
    setLastAddedCategory(product?.category ?? "Uncategorized");
  };

  // Set absolute qty; removes line if qty <= 0
  const setQty = async (productId, qty) => {
    const nextQty = Math.max(0, Number(qty) || 0);
    const updated = cart
      .map((i) => (i.productId === productId ? { ...i, quantity: nextQty } : i))
      .filter((i) => Number(i.quantity || 0) > 0);

    setCart(updated);
    persistCart(updated);
  };

  const incrementCartQty = (productId) => {
    const current = cart.find((i) => i.productId === productId)?.quantity || 0;
    return setQty(productId, Number(current) + 1);
  };

  const decrementCartQty = (productId) => {
    const current = cart.find((i) => i.productId === productId)?.quantity || 0;
    return setQty(productId, Number(current) - 1);
  };

  // ⚠️ now removes ONE at a time; deletes line only when it hits 0
  const handleRemoveFromCart = (productId) => {
    return decrementCartQty(productId);
  };

  // Explicit full delete (trash button)
  const handleRemoveLine = async (productId) => {
    const updated = cart.filter((i) => i.productId !== productId);
    setCart(updated);
    persistCart(updated);
  };

// place order
  const handlePlaceOrder = async () => {
    if (!ensureAuthed()) return { success: false, message: "Not logged in" };
    if (!deliveryAddress) return { success: false, message: "Delivery address is required" };
    if (paymentMethod === "GCash" && !isValidGcash(gcashNumber)) {
      return { success: false, message: "Invalid GCash number" };
    }

    const total = cart.reduce((s, it) => s + Number(it.price || 0) * Number(it.quantity || 0), 0);
    if (!Array.isArray(cart) || cart.length === 0 || total <= 0) {
      return { success: false, message: "Your cart is empty." };
    }

    const payload = {
      userId,
      items: cart,
      total,
      address: deliveryAddress,
      paymentMethod,
      status: "Pending",
      gcashNumber: paymentMethod === "GCash" ? gcashNumber.trim() : undefined,
    };

    try {
      const resp = await apiCreateOrder(payload);
      const order = resp?.data || null;

      // ✅ optimistic: show new order immediately
      setOrders((prev) => (order ? [order, ...(prev || [])] : (prev || [])));

      // clear checkout + cart
      setCart([]);
      setDeliveryAddress("");
      setGcashNumber("");

      // ✅ kick off a refresh, but DO NOT await (non-blocking)
      refreshAuthedData(user);

      return { success: true, order };
    } catch (e) {
      console.error("place order failed:", e?.message);
      return { success: false, message: e?.message || "Order failed" };
    }
  };

    // merge guest cart on login/register
    const mergeGuestCartInto = async (u) => {
      const guestCart = await loadCart();
      if (guestCart?.items?.length > 0) {
        try {
          await setCartApi({ userId: u._id || u.id || u.email, items: guestCart.items });
          await clearCart();
          Alert.alert("Cart Saved", "Your guest cart has been saved to your account.");
        } catch (e) {
          console.warn("merge guest cart failed:", e?.message);
        }
      }
    };

  // auth actions
  const doLogin = async ({ email, password }) => {
    const resp = await apiLogin({ email, password });
    const { token, user: u } = resp.data || {};
    await setToken(token);
    await persistUser(u);
    setUserState(u);

    await mergeGuestCartInto(u);
    await refreshAuthedData(u);

    router.replace("/tabs/home");
  };

  const doRegister = async ({ name, email, password }) => {
    const resp = await apiRegister({ name, email, password });
    const { token, user: u } = resp.data || {};
    await setToken(token);
    await persistUser(u);
    setUserState(u);

    await mergeGuestCartInto(u);
    await refreshAuthedData(u);

    router.replace("/tabs/home");
  };

  const handleLogout = async () => {
    await clearAuth();
    setUserState(null);
    setCart([]);
    setOrders([]);
    router.replace("/tabs/home");
  };

  // --- category helpers ---
  const categoryLabelOf = (p) => {
    const c = p?.category;
    if (!c) return "Uncategorized";
    if (typeof c === "string") return categoryMap[c] || c;
    if (typeof c === "object") return c?.name || c?.categoryName || "Uncategorized";
    return "Uncategorized";
  };

  // derived UI helpers
  const categories = useMemo(() => {
    const set = new Set((products || []).map((p) => categoryLabelOf(p)));
    return ["All", ...Array.from(set)];
  }, [products, categoryMap]);

  const filteredProducts = useMemo(() => {
    const q = (searchQuery || "").toLowerCase();
    return (products || []).filter((p) => {
      const name = (p?.name || "").toLowerCase();
      const cat = categoryLabelOf(p);
      return (selectedCategory === "All" || cat === selectedCategory) && name.includes(q);
    });
  }, [products, selectedCategory, searchQuery, categoryMap]);

  const recommendedProducts = useMemo(() => {
    return lastAddedCategory
      ? (products || [])
          .filter((p) => categoryLabelOf(p) === lastAddedCategory)
          .slice(0, 3)
      : (products || []).slice(0, 3);
  }, [products, lastAddedCategory, categoryMap]);

  const cartTotal = useMemo(
    () => cart.reduce((s, it) => s + Number(it.price || 0) * Number(it.quantity || 0), 0),
    [cart]
  );

  // Fetch single product with reviews
  const fetchProductDetail = async (id) => {
    try {
      const res = await getProductApi(id);
      setProductDetail(res.data);
    } catch (e) {
      console.warn("fetchProductDetail failed:", e.message);
    }
  };

  // Submit review
  const submitReview = async (productId, rating, comment, imageUrls = []) => {
    try {
      const token = await getToken();
      const res = await addReviewApi(productId, { rating, comment, imageUrls }, token);
      setProductDetail(res.data);
    } catch (e) {
      console.warn("submitReview failed:", e.message);
    }
  };

  const fetchMyReviews = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await getMyReviewsApi(token);
      setMyReviews(res.data || []);
    } catch (e) {
      console.warn("fetchMyReviews failed:", e.message);
    }
  };

  const value = {
    // state
    loading,
    products,
    cart,
    setCart, // ← expose so screens can optimistically adjust if ever needed
    orders,
    user,
    selectedCategory,
    setSelectedCategory,
    lastAddedCategory,
    setLastAddedCategory,
    searchQuery,
    setSearchQuery,
    deliveryAddress,
    setDeliveryAddress,
    paymentMethod,
    setPaymentMethod,
    gcashNumber,
    setGcashNumber,

    // derived
    isLoggedIn,
    categories,
    filteredProducts,
    recommendedProducts,
    cartTotal,

    // actions
    ensureAuthed,
    handleAddToCart,
    handleRemoveFromCart, // now removes one
    handleRemoveLine,     // full delete
    incrementCartQty,
    decrementCartQty,
    setQty,
    handlePlaceOrder,
    handleLogout,
    doLogin,
    doRegister,
    refreshAuthedData, 

    // product & reviews
    productDetail,
    fetchProductDetail,
    submitReview,
    myReviews,
    fetchMyReviews,

    // helpers
    categoryMap,
    categoryLabelOf,
    toAbsoluteUrl,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

import { useRouter } from "expo-router";
import { createContext, useEffect, useMemo, useState } from "react";
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
  getProducts, // ✅ added
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
  const refreshAuthedData = async (u = user) => {
    if (!u) return;
    const id = u?._id || u?.id || u?.email;
    if (!id) return;

    try {
      const cartResp = await apiGetCart(id);
      setCart(Array.isArray(cartResp?.data?.items) ? cartResp.data.items : []);
    } catch {
      setCart([]);
    }

    try {
      const ordersResp = await apiGetOrders(id);
      setOrders(Array.isArray(ordersResp?.data) ? ordersResp.data : []);
    } catch {
      setOrders([]);
    }
  };

  // guard: block guests from protected actions
  const ensureAuthed = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return false;
    }
    return true;
  };

  // cart actions
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

    try {
      if (isLoggedIn) {
        await setCartApi({ userId, items: updated }); // backend
      } else {
        await saveCart({ items: updated, total: 0 }); // guest local
      }
      setLastAddedCategory(product?.category ?? "Uncategorized");
    } catch (e) {
      console.error("save cart failed:", e?.message);
    }
  };

  const handleRemoveFromCart = async (productId) => {
    const updated = cart.filter((i) => i.productId !== productId);
    setCart(updated);

    try {
      if (isLoggedIn) {
        await setCartApi({ userId, items: updated });
      } else {
        await saveCart({ items: updated, total: 0 });
      }
    } catch (e) {
      console.error("remove from cart failed:", e?.message);
    }
  };

  // place order
  const handlePlaceOrder = async () => {
    if (!ensureAuthed()) return;
    if (!deliveryAddress) return;
    if (paymentMethod === "GCash" && !isValidGcash(gcashNumber)) return;

    const total = cart.reduce(
      (s, it) => s + Number(it.price || 0) * Number(it.quantity || 0),
      0
    );

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
      await apiCreateOrder(payload);
      await refreshAuthedData(user);

      setDeliveryAddress("");
      setGcashNumber("");

      router.push("/tabs/orders");
    } catch (e) {
      console.error("place order failed:", e?.message);
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
    handleRemoveFromCart,
    handlePlaceOrder,
    handleLogout,
    doLogin,
    doRegister,
    
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

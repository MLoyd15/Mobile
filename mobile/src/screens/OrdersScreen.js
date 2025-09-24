import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AppCtx } from "../context/AppContext";

const GREEN = "#10B981";
const GREEN_BG = "#ECFDF5";     // light green background
const GREEN_BORDER = "#A7F3D0"; // light green border
const GREEN_DARK = "#065F46";   // dark green text
const GRAY = "#6B7280";
const BORDER = "#E5E7EB";
const BLUE = "#3B82F6";

export default function OrdersScreen() {
  const {
    cart,
    cartTotal,
    orders,
    deliveryAddress,
    setDeliveryAddress,
    paymentMethod,
    setPaymentMethod,
    gcashNumber,
    setGcashNumber,
    handlePlaceOrder,   // returns { success, order?, message? }
    isLoggedIn,
    refreshAuthedData,
  } = useContext(AppCtx);

  const [placing, setPlacing] = useState(false);
  const isGCash = paymentMethod === "GCash";

  // --- lightweight toast (no libs) ---
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);
  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };
  useEffect(() => () => toastTimer.current && clearTimeout(toastTimer.current), []);

  // safe refresh on focus (guard against overlap & identity loops)
  const refreshingRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn || refreshingRef.current) return;
      refreshingRef.current = true;
      Promise.resolve(refreshAuthedData?.()).finally(() => {
        refreshingRef.current = false;
      });
    }, [isLoggedIn]) // keep deps minimal
  );

  // validations
  const addrError = useMemo(() => {
    const txt = (deliveryAddress || "").trim();
    if (!txt) return "Delivery address is required.";
    if (txt.length < 5) return "Please enter a more specific address.";
    return "";
  }, [deliveryAddress]);

  const gcashError = useMemo(() => {
    if (!isGCash) return "";
    const n = (gcashNumber || "").trim();
    return /^(09\d{9})$/.test(n) ? "" : "Enter a valid 11-digit GCash number starting with 09.";
  }, [gcashNumber, isGCash]);

  const disabled =
    !isLoggedIn ||
    cartTotal <= 0 ||
    !!addrError ||
    !!gcashError ||
    placing;

  const onPlace = async () => {
    if (disabled) return;
    setPlacing(true);
    try {
      const res = await handlePlaceOrder();
      if (res?.success) {
        const shortId = String(res.order?._id || res.order?.id || "").slice(-6).toUpperCase();
        showToast(`Order #${shortId} placed! ✅`);
      } else {
        Alert.alert("Order failed", res?.message || "Please try again.");
      }
    } finally {
      setPlacing(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.h1}>Orders</Text>

        {/* Checkout Card */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Checkout</Text>

          {/* Address */}
          <Text style={s.label}>Delivery Address</Text>
          <TextInput
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            placeholder="House no., Street, Barangay, City"
            style={[s.input, !!addrError && s.inputError]}
            multiline
          />
          {!!addrError && <Text style={s.errorText}>{addrError}</Text>}

          {/* Payment */}
          <Text style={[s.label, { marginTop: 14 }]}>Payment Method</Text>
          <View style={s.chipsRow}>
            <Chip
              label="COD"
              active={!isGCash}
              onPress={() => {
                setPaymentMethod("COD");
                setGcashNumber(""); // clear and hide
              }}
            />
            <Chip
              label="GCash"
              active={isGCash}
              onPress={() => setPaymentMethod("GCash")}
            />
          </View>

          {/* GCash Number — only when GCash selected */}
          {isGCash && (
            <>
              <Text style={[s.label, { marginTop: 12 }]}>GCash Number</Text>
              <TextInput
                value={gcashNumber}
                onChangeText={(t) => setGcashNumber(t.replace(/[^\d]/g, "").slice(0, 11))}
                placeholder="09xxxxxxxxx"
                keyboardType="number-pad"
                style={[s.input, !!gcashError && s.inputError]}
              />
              {!!gcashError && <Text style={s.errorText}>{gcashError}</Text>}
            </>
          )}

          {/* Total + CTA */}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total:</Text>
            <Text style={s.totalVal}>₱{cartTotal.toFixed(2)}</Text>
          </View>

          <TouchableOpacity
            style={[s.btn, disabled ? s.btnDisabled : null]}
            activeOpacity={0.8}
            onPress={onPlace}
            disabled={disabled}
          >
            {placing ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>PLACE ORDER</Text>}
          </TouchableOpacity>
        </View>

        {/* History */}
        <Text style={[s.sectionTitle, { marginTop: 16 }]}>Order History</Text>
        {orders.length === 0 ? (
          <View style={s.empty}>
            <Text style={{ color: GRAY }}>You have no past orders.</Text>
          </View>
        ) : (
          orders.map((o) => (
            <View key={o._id} style={s.orderRow}>
              {/* optional green accent bar */}
              <View style={s.orderAccent} />
              <View style={{ flex: 1 }}>
                <Text style={s.orderId}>#{String(o._id).slice(-6).toUpperCase()}</Text>
                <Text style={s.orderMeta}>{new Date(o.createdAt).toLocaleString()}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={s.orderAmt}>₱{Number(o.totalAmount || o.total || 0).toFixed(2)}</Text>
                <Text style={s.orderStatus}>{o.status || "Pending"}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Toast overlay */}
      {toast ? (
        <View style={s.toast}>
          <Text style={s.toastTxt}>{toast}</Text>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, marginRight: 8 },
        active ? { backgroundColor: GREEN, borderColor: GREEN } : { backgroundColor: "#F3F4F6", borderColor: BORDER },
      ]}
    >
      <Text style={{ color: active ? "#fff" : "#111827", fontWeight: "700" }}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { padding: 16 },
  h1: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  card: { borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 12, backgroundColor: "#fff" },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 10 },
  label: { fontWeight: "700", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff" },
  inputError: { borderColor: "#EF4444" },
  errorText: { color: "#DC2626", marginTop: 4 },
  chipsRow: { flexDirection: "row", marginBottom: 4 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, marginBottom: 10 },
  totalLabel: { fontWeight: "800" },
  totalVal: { fontWeight: "800" },
  btn: { backgroundColor: BLUE, alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 8 },
  btnDisabled: { backgroundColor: "#93C5FD" },
  btnTxt: { color: "#fff", fontWeight: "800" },

  empty: { alignItems: "center", paddingVertical: 20, borderWidth: 1, borderColor: BORDER, borderRadius: 12, marginTop: 8 },

  // GREEN order cards
  orderRow: {
    marginTop: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    backgroundColor: GREEN_BG,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    position: "relative",
    gap: 12,
  },
  orderAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: GREEN,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  orderId: { fontWeight: "800", color: GREEN_DARK },
  orderMeta: { color: "#065F46AA", marginTop: 2 },
  orderAmt: { fontWeight: "800", color: GREEN_DARK },
  orderStatus: { color: GREEN, textTransform: "capitalize", fontWeight: "700", marginTop: 2 },

  // toast
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#059669",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  toastTxt: { color: "#fff", fontWeight: "800" },
});



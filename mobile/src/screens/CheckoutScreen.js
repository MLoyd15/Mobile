import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
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
const GREEN_BG = "#ECFDF5";
const GREEN_BORDER = "#A7F3D0";
const GREEN_DARK = "#065F46";
const GRAY = "#6B7280";
const BORDER = "#E5E7EB";
const BLUE = "#3B82F6";

export default function CheckoutScreen() {
  const router = useRouter();

  const {
    cart,
    cartTotal,
    deliveryAddress,
    setDeliveryAddress,
    paymentMethod,
    setPaymentMethod,
    gcashNumber,
    setGcashNumber,
    handlePlaceOrder,
    isLoggedIn,
    refreshAuthedData,
  } = useContext(AppCtx);

  const [deliveryMethod, setDeliveryMethod] = useState("in-house");
  const [placing, setPlacing] = useState(false);
  const isGCash = paymentMethod === "GCash";

  // --- toast ---
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);
  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };
  useEffect(() => () => toastTimer.current && clearTimeout(toastTimer.current), []);

  // refresh on focus
  const refreshingRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn || refreshingRef.current) return;
      refreshingRef.current = true;
      Promise.resolve(refreshAuthedData?.()).finally(() => {
        refreshingRef.current = false;
      });
    }, [isLoggedIn])
  );

  // validations
  const addrError = useMemo(() => {
    // Only require address for in-house and third-party delivery
    if (deliveryMethod === "pickup") return "";
    
    const txt = (deliveryAddress || "").trim();
    if (!txt) return "Delivery address is required.";
    if (txt.length < 5) return "Please enter a more specific address.";
    return "";
  }, [deliveryAddress, deliveryMethod]);

  const gcashError = useMemo(() => {
    if (!isGCash) return "";
    const n = (gcashNumber || "").trim();
    return /^(09\d{9})$/.test(n) ? "" : "Enter a valid 11-digit GCash number starting with 09.";
  }, [gcashNumber, isGCash]);

  const disabled =
    !isLoggedIn || cartTotal <= 0 || !!addrError || !!gcashError || placing;

  const onPlace = async () => {
    if (disabled) return;
    setPlacing(true);
    try {
      const res = await handlePlaceOrder();
      if (res?.success) {
        const orderId = res.order?._id || res.order?.id;
        const shortId = String(orderId || "").slice(-6).toUpperCase();
        showToast(`Order #${shortId} placed! ✅`);
        
        // Navigate to order history after successful order
        setTimeout(() => {
          router.push("/tabs/orders");
        }, 1000);
      } else {
        Alert.alert("Order failed", res?.message || "Please try again.");
      }
    } finally {
      setPlacing(false);
    }
  };

  const getDeliveryFee = (method) => {
    switch (method) {
      case "pickup":
        return 0;
      case "in-house":
        return 50;
      case "third-party":
        return 80;
      default:
        return 0;
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={s.container}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backTxt}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.h1}>Checkout</Text>
          <View style={{ width: 64 }} />
        </View>

        {/* Checkout Card */}
        <View style={s.card}>
          {/* Delivery Method */}
          <Text style={s.label}>Delivery Method</Text>
          <View style={s.deliveryMethodContainer}>
            <DeliveryMethodCard
              icon="🏠"
              title="In-house Delivery"
              subtitle="Our team delivers to you"
              fee="₱50"
              selected={deliveryMethod === "in-house"}
              onPress={() => setDeliveryMethod("in-house")}
            />
            <DeliveryMethodCard
              icon="🚶"
              title="Pickup"
              subtitle="Pick up from our store"
              fee="FREE"
              selected={deliveryMethod === "pickup"}
              onPress={() => setDeliveryMethod("pickup")}
            />
            <DeliveryMethodCard
              icon="🚚"
              title="Third-party"
              subtitle="Delivered by partner"
              fee="₱80"
              selected={deliveryMethod === "third-party"}
              onPress={() => setDeliveryMethod("third-party")}
            />
          </View>

          {/* Address - Only show for delivery methods that need it */}
          {deliveryMethod !== "pickup" && (
            <>
              <Text style={[s.label, { marginTop: 16 }]}>
                {deliveryMethod === "in-house" ? "Delivery Address" : "Delivery Address"}
              </Text>
              <TextInput
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                placeholder="House no., Street, Barangay, City"
                style={[s.input, !!addrError && s.inputError]}
                multiline
              />
              {!!addrError && <Text style={s.errorText}>{addrError}</Text>}
            </>
          )}

          {/* Pickup Instructions - Show only for pickup */}
          {deliveryMethod === "pickup" && (
            <View style={s.pickupInfo}>
              <Text style={s.pickupTitle}>📍 Pickup Location</Text>
              <Text style={s.pickupAddress}>
                123 Main Street, Barangay San Antonio{'\n'}
                Paranaque City, Metro Manila{'\n'}
                Business Hours: 9:00 AM - 8:00 PM
              </Text>
              <Text style={s.pickupNote}>
                💡 Please bring a valid ID when picking up your order
              </Text>
            </View>
          )}

          {/* Payment */}
          <Text style={[s.label, { marginTop: 14 }]}>Payment Method</Text>
          <View style={s.chipsRow}>
            <Chip
              label="COD"
              active={!isGCash}
              onPress={() => {
                setPaymentMethod("COD");
                setGcashNumber("");
              }}
            />
            <Chip
              label="GCash"
              active={isGCash}
              onPress={() => setPaymentMethod("GCash")}
            />
          </View>

          {/* GCash Number */}
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
            <View>
              <Text style={s.totalLabel}>Subtotal: ₱{cartTotal.toFixed(2)}</Text>
              <Text style={s.totalLabel}>
                Delivery Fee: {
                  deliveryMethod === "pickup" ? "FREE" : 
                  deliveryMethod === "in-house" ? "₱50.00" : "₱80.00"
                }
              </Text>
            </View>
            <Text style={s.totalVal}>
              ₱{(cartTotal + getDeliveryFee(deliveryMethod)).toFixed(2)}
            </Text>
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
      </ScrollView>

      {/* Toast */}
      {toast ? (
        <View style={s.toast}>
          <Text style={s.toastTxt}>{toast}</Text>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

function DeliveryMethodCard({ icon, title, subtitle, fee, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[s.deliveryCard, selected && s.deliveryCardSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={s.deliveryCardContent}>
        <Text style={s.deliveryIcon}>{icon}</Text>
        <View style={s.deliveryInfo}>
          <Text style={[s.deliveryTitle, selected && s.deliveryTitleSelected]}>{title}</Text>
          <Text style={s.deliverySubtitle}>{subtitle}</Text>
        </View>
        <View style={s.deliveryFee}>
          <Text style={[s.deliveryFeeText, selected && s.deliveryFeeSelected]}>{fee}</Text>
          {selected && <View style={s.selectedIndicator} />}
        </View>
      </View>
    </TouchableOpacity>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backBtn: { 
    paddingVertical: 6, 
    paddingHorizontal: 8,
  },
  backTxt: { 
    fontSize: 16, 
    color: GREEN, 
    fontWeight: "700" 
  },
  h1: { 
    fontSize: 20, 
    fontWeight: "700", 
    textAlign: "center",
    flex: 1,
  },
  card: { 
    borderWidth: 1, 
    borderColor: BORDER, 
    borderRadius: 12, 
    padding: 16, 
    backgroundColor: "#fff" 
  },
  label: { fontWeight: "700", marginBottom: 6 },
  input: { 
    borderWidth: 1, 
    borderColor: BORDER, 
    borderRadius: 10, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    backgroundColor: "#fff" 
  },
  inputError: { borderColor: "#EF4444" },
  errorText: { color: "#DC2626", marginTop: 4 },
  chipsRow: { flexDirection: "row", marginBottom: 4 },
  totalRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginTop: 12, 
    marginBottom: 10 
  },
  totalLabel: { fontWeight: "800" },
  totalVal: { fontWeight: "800", fontSize: 18 },
  btn: { 
    backgroundColor: BLUE, 
    alignItems: "center", 
    justifyContent: "center", 
    paddingVertical: 14, 
    borderRadius: 8 
  },
  btnDisabled: { backgroundColor: "#93C5FD" },
  btnTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },

  // Delivery Method Styles
  deliveryMethodContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  deliveryCard: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  deliveryCardSelected: {
    borderColor: GREEN,
    backgroundColor: GREEN_BG,
  },
  deliveryCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  deliveryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  deliveryTitleSelected: {
    color: GREEN_DARK,
  },
  deliverySubtitle: {
    fontSize: 13,
    color: GRAY,
  },
  deliveryFee: {
    alignItems: "flex-end",
    position: "relative",
  },
  deliveryFeeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  deliveryFeeSelected: {
    color: GREEN_DARK,
  },
  selectedIndicator: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },

  // Pickup Info Styles
  pickupInfo: {
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  pickupTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  pickupAddress: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 8,
  },
  pickupNote: {
    fontSize: 12,
    color: "#1E40AF",
    fontStyle: "italic",
  },

  // Toast
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: GREEN,
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
import { useContext, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AppCtx } from "../context/AppContext";

export default function OrdersScreen({ route }) {
  const {
    orders,
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
  } = useContext(AppCtx);

  const [confirming, setConfirming] = useState(false);

  // If navigated from cart "Proceed to Checkout"
  useEffect(() => {
    if (route?.params?.openCheckout && isLoggedIn && cart.length > 0) {
      // Checkout form is shown above order history
    }
  }, [route?.params, isLoggedIn, cart.length]);

  const confirmOrder = () => {
    Alert.alert(
      "Confirm Order",
      `You are about to place an order of ₱${cartTotal.toFixed(2)}. Proceed?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: handlePlaceOrder },
      ]
    );
  };

  const requestRefund = (orderId) => {
    Alert.alert("Refund Requested", `Refund requested for order ${orderId}`);
    // Later: call backend POST /orders/:id/refund
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }} style={s.container}>
      <Text style={s.title}>Checkout</Text>
      <Text style={s.label}>Delivery Address</Text>
      <TextInput
        multiline
        numberOfLines={4}
        placeholder="Enter full address"
        value={deliveryAddress}
        onChangeText={setDeliveryAddress}
        style={s.textArea}
      />

      <Text style={s.label}>Payment Method</Text>
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 8 }}>
        <TouchableOpacity
          onPress={() => setPaymentMethod("COD")}
          style={[s.chip, paymentMethod === "COD" && s.active]}
        >
          <Text style={[s.ct, paymentMethod === "COD" && s.cta]}>COD</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setPaymentMethod("GCash")}
          style={[s.chip, paymentMethod === "GCash" && s.active]}
        >
          <Text style={[s.ct, paymentMethod === "GCash" && s.cta]}>GCash</Text>
        </TouchableOpacity>
      </View>

      {paymentMethod === "GCash" && (
        <>
          <Text style={s.label}>GCash Number</Text>
          <TextInput
            keyboardType="number-pad"
            placeholder="09171234567"
            value={gcashNumber}
            onChangeText={setGcashNumber}
            style={s.input}
          />
        </>
      )}

      <View style={s.footer}>
        <Text style={s.bold}>Total:</Text>
        <Text style={s.bold}>₱{cartTotal.toFixed(2)}</Text>
      </View>
      <Button
        title="Place Order"
        onPress={confirmOrder}
        disabled={
          !deliveryAddress ||
          (paymentMethod === "GCash" && !/^09\d{9}$/.test((gcashNumber || "").trim())) ||
          cart.length === 0
        }
      />

      <View style={{ height: 24 }} />

      <Text style={s.title}>Order History</Text>
      {orders.length === 0 ? (
        <Text style={s.muted}>You have no past orders.</Text>
      ) : (
        orders.map((o) => (
          <View key={o._id} style={s.orderCard}>
            <View style={s.orderHeader}>
              <Text style={s.muted}>Order ID: {String(o._id).slice(0, 8)}…</Text>
              <View
                style={[
                  s.badge,
                  o.status === "Pending"
                    ? { backgroundColor: "#FEF3C7" }
                    : { backgroundColor: "#DCFCE7" },
                ]}
              >
                <Text style={{ color: "#065F46", fontWeight: "600", fontSize: 12 }}>
                  {o.status}
                </Text>
              </View>
            </View>
            <View style={s.hr} />
            {o.items.map((it, idx) => (
              <View key={(it.productId || idx)} style={s.orderRow}>
                <Text>
                  {it.name} x {it.quantity}
                </Text>
                <Text style={s.bold}>
                  ₱{(Number(it.price || 0) * Number(it.quantity || 0)).toFixed(2)}
                </Text>
              </View>
            ))}
            <View style={s.hr} />
            <View style={s.footer}>
              <Text style={s.bold}>Total:</Text>
              <Text style={s.bold}>₱{Number(o.total || 0).toFixed(2)}</Text>
            </View>
            <Text style={s.mutedSmall}>Address: {o.address}</Text>
            <Text style={s.mutedSmall}>
              Payment: {o.paymentMethod}
              {o.gcashNumber ? ` (${o.gcashNumber})` : ""}
            </Text>

            {o.status === "Completed" && (
              <View style={{ marginTop: 8 }}>
                <Button title="Request Refund" onPress={() => requestRefund(o._id)} />
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 8 },
  label: { fontWeight: "700", color: "#4B5563", marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    backgroundColor: "white",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "white",
    minHeight: 80,
    textAlignVertical: "top",
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
  },
  active: { backgroundColor: "#059669" },
  ct: { color: "#374151", fontWeight: "600" },
  cta: { color: "white" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 12,
  },
  bold: { fontWeight: "700" },
  muted: { color: "#6B7280", textAlign: "center", marginTop: 12 },
  mutedSmall: { color: "#6B7280", fontSize: 12 },
  orderCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
    elevation: 1,
  },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  orderRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  hr: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 8 },
});

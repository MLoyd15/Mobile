import { useContext } from "react";
import { Button, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppCtx } from "../context/AppContext";

export default function CartScreen({ navigation }) {
  const { cart, cartTotal, handleRemoveFromCart } = useContext(AppCtx);

  return (
    <View style={s.container}>
      <Text style={s.title}>Your Cart</Text>

      <FlatList
        data={cart}
        keyExtractor={(it, i) => (it.productId || i).toString()}
        renderItem={({ item }) => (
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.bold}>{item.name}</Text>
              <Text style={s.muted}>
                ₱{Number(item.price || 0).toFixed(2)} × {Number(item.quantity || 0)}
              </Text>
            </View>
            <Text style={s.bold}>
              ₱{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
            </Text>
            <TouchableOpacity
              onPress={() => handleRemoveFromCart(item.productId)}
              style={{ marginLeft: 8 }}
            >
              <Text style={{ color: "#DC2626", fontWeight: "700" }}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={s.muted}>Your cart is empty.</Text>}
      />

      {cart.length > 0 && (
        <>
          <View style={s.footer}>
            <Text style={s.bold}>Total:</Text>
            <Text style={s.bold}>₱{cartTotal.toFixed(2)}</Text>
          </View>
          <Button
            title="Proceed to Checkout"
            onPress={() => navigation.navigate("orders", { openCheckout: true })}
          />
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  bold: { fontWeight: "700" },
  muted: { color: "#6B7280", marginTop: 12, textAlign: "center" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 12,
  },
});

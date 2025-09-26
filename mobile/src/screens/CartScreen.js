import { useRouter } from "expo-router";
import { useContext } from "react";
import {
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppCtx } from "../context/AppContext";

export default function CartScreen({ navigation }) {
  const router = useRouter();
  const {
    cart,
    cartTotal,
    incrementCartQty,
    decrementCartQty,
    handleRemoveLine,
  } = useContext(AppCtx);

  const goBackToShop = () => {
    if (navigation?.navigate) navigation.navigate("home");
    else router.replace("/tabs/home");
  };

  const goToCheckout = () => {
    // Navigate to the new checkout screen
    router.push("/checkout");
  };

  const renderItem = ({ item }) => {
    const qty = Number(item.quantity || 0);
    const price = Number(item.price || 0);
    const img = item.imageUrl || "https://via.placeholder.com/120x120.png?text=Item";

    return (
      <>
        <View style={s.itemRow}>
          {/* left: image + name + links */}
          <View style={{ flexDirection: "row", flex: 1, gap: 12 }}>
            <Image source={{ uri: img }} style={s.thumb} />
            <View style={{ flex: 1 }}>
              <Text style={s.itemName} numberOfLines={2}>
                {item.name}
              </Text>

              <TouchableOpacity onPress={() => handleRemoveLine(item.productId)}>
                <Text style={s.linkDanger}>Remove</Text>
              </TouchableOpacity>

              {/* Save for later omitted as requested */}
            </View>
          </View>

          {/* right: price + qty */}
          <View style={s.rightCol}>
            <Text style={s.priceRight}>
              ₱ {price.toLocaleString("en-PH", { minimumFractionDigits: 0 })}
            </Text>

            <View style={s.qtyWrap}>
              <Text style={s.qtyLabel}>Quantity</Text>
              <View style={s.stepper}>
                <TouchableOpacity
                  style={[s.stepBtn, s.stepBtnLeft]}
                  onPress={() => decrementCartQty(item.productId)}
                >
                  <Text style={s.stepTxt}>−</Text>
                </TouchableOpacity>

                <View style={s.qtyBox}>
                  <Text style={s.qtyTxt}>{qty}</Text>
                </View>

                <TouchableOpacity
                  style={[s.stepBtn, s.stepBtnRight]}
                  onPress={() => incrementCartQty(item.productId)}
                >
                  <Text style={s.stepTxt}>＋</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={s.sep} />
      </>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <Text style={s.h1}>Your cart items</Text>
      <TouchableOpacity onPress={goBackToShop}>
        <Text style={s.backLink}>Back to shopping</Text>
      </TouchableOpacity>

      {/* Table header */}
      <View style={s.tableHdr}>
        <Text style={s.thLeft}>Product</Text>
        <Text style={s.thRight}>Price</Text>
      </View>

      <View style={s.hr} />

      {/* List */}
      <FlatList
        data={cart}
        keyExtractor={(it, i) => (it.productId || i).toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <Text style={{ color: "#6B7280" }}>Your cart is empty.</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 140 }}
      />

      {/* Totals footer */}
      {cart.length > 0 && (
        <View style={s.footerCard}>
          <View style={s.subRow}>
            <Text style={s.subLabel}>Sub-total</Text>
            <Text style={s.subValue}>
              ₱ {cartTotal.toLocaleString("en-PH", { minimumFractionDigits: 0 })}
            </Text>
          </View>
          <Text style={s.taxNote}>
            Tax and shipping cost will be calculated later
          </Text>

          <TouchableOpacity
            style={s.checkoutBtn}
            onPress={goToCheckout}
          >
            <Text style={s.checkoutTxt}>Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const GREEN = "#10B981";

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // header
  h1: { fontSize: 22, fontWeight: "800", textAlign: "center", marginTop: 8 },
  backLink: {
    color: GREEN,
    textAlign: "center",
    marginTop: 6,
    textDecorationLine: "underline",
    fontWeight: "600",
  },

  // table header
  tableHdr: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  thLeft: { color: "#6B7280", fontWeight: "600" },
  thRight: { color: "#6B7280", fontWeight: "600" },
  hr: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginTop: 8,
    marginBottom: 10,
  },

  // row
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 8,
  },
  thumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: "#F3F4F6" },
  itemName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  linkDanger: {
    marginTop: 6,
    color: GREEN,
    textDecorationLine: "underline",
    fontWeight: "600",
  },

  rightCol: { alignItems: "flex-end", justifyContent: "space-between" },
  priceRight: { fontWeight: "700", color: "#111827", marginBottom: 6 },

  qtyWrap: { alignItems: "flex-end" },
  qtyLabel: { color: "#6B7280", marginBottom: 6 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: GREEN,
    overflow: "hidden",
  },
  stepBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  stepBtnLeft: { borderRightWidth: 1, borderRightColor: GREEN },
  stepBtnRight: { borderLeftWidth: 1, borderLeftColor: GREEN },
  stepTxt: { fontSize: 18, fontWeight: "800", color: "#111827" },
  qtyBox: { minWidth: 44, height: 36, alignItems: "center", justifyContent: "center" },
  qtyTxt: { fontSize: 16, fontWeight: "700" },

  sep: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginTop: 12,
    marginHorizontal: 4,
  },

  // footer
  footerCard: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 4,
  },
  subRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  subLabel: { fontSize: 16, fontWeight: "800", color: "#111827" },
  subValue: { fontSize: 16, fontWeight: "800", color: "#111827" },
  taxNote: { marginTop: 6, color: "#6B7280" },

  checkoutBtn: {
    marginTop: 14,
    backgroundColor: GREEN,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },
  checkoutTxt: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
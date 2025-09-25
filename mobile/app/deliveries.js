// app/deliveries.js
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { getDeliveryForOrder, getToken, listMyDeliveries } from "../src/api/apiClient";
import { AppCtx } from "../src/context/AppContext";

export default function DeliveriesPage() {
  const { orderId } = useLocalSearchParams(); // optional ?orderId=...
  const { isLoggedIn } = useContext(AppCtx);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);
  const [focusId, setFocusId] = useState(null);

  const fetchAll = useCallback(async (focusOrderId) => {
    await getToken(); // ensure Authorization header is on axios
    console.log("Auth header:", axios.defaults.headers.common.Authorization);

    const [mine, specific] = await Promise.allSettled([
      listMyDeliveries(),
      focusOrderId ? getDeliveryForOrder(String(focusOrderId)) : Promise.resolve({ data: null }),
    ]);

    const deliveries = mine.status === "fulfilled" ? (mine.value?.data?.deliveries || []) : [];
    setItems(deliveries);

    if (specific.status === "fulfilled" && specific.value?.data?.delivery?._id) {
      setFocusId(specific.value.data.delivery._id);
    } else {
      setFocusId(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!isLoggedIn) return;
        setLoading(true);
        await fetchAll(orderId);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isLoggedIn, orderId, fetchAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchAll(orderId);
    } finally {
      setRefreshing(false);
    }
  }, [orderId, fetchAll]);

  const renderItem = ({ item }) => {
    const isFocused = item._id === focusId;
    return (
      <TouchableOpacity
        onPress={() => router.push({ pathname: "/orders", params: { focusOrderId: item.order?._id } })}
        style={[s.card, isFocused && s.focus]}
      >
        <View style={s.rowBetween}>
          <Text style={s.id}>Delivery #{String(item._id).slice(0, 8)}…</Text>
          <Text style={[s.status, colorByStatus(item.status)]}>
            {String(item.status || "pending").toUpperCase()}
          </Text>
        </View>
        <Text style={s.muted}>Order: {String(item.order?._id || "").slice(0, 8)}…</Text>
        <Text style={s.muted}>Type: {item.type || "-"}</Text>
        <Text style={s.muted}>Driver: {item.driverPhone || "Not assigned yet"}</Text>
        <Text style={s.muted}>
          Vehicle: {item.assignedVehicle?.model || "-"} ({item.assignedVehicle?.plate || "—"})
        </Text>
        <Text style={s.muted}>Address: {item.deliveryAddress || item.order?.address || "-"}</Text>
        <Text style={[s.muted, { marginTop: 4 }]}>
          Created: {new Date(item.createdAt).toLocaleString()}
        </Text>
        <Text style={s.link}>Tap to view order →</Text>
      </TouchableOpacity>
    );
  };

  if (!isLoggedIn) {
    return (
      <View style={s.center}>
        <Text>Please login to view deliveries.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(it) => it._id}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      ListEmptyComponent={<Text style={s.muted}>No deliveries yet.</Text>}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
  );
}

function colorByStatus(st) {
  const v = String(st || "").toLowerCase();
  if (v === "in-transit") return { color: "#1D4ED8" };
  if (v === "assigned") return { color: "#7C3AED" };
  if (v === "completed") return { color: "#059669" };
  if (v === "cancelled") return { color: "#DC2626" };
  return { color: "#92400E" }; // pending/default
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  focus: { borderWidth: 2, borderColor: "#059669" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  id: { fontWeight: "700", fontSize: 15 },
  status: { fontWeight: "800", fontSize: 13 },
  muted: { color: "#6B7280", marginTop: 2, fontSize: 13 },
  link: { marginTop: 6, color: "#059669", fontWeight: "600", fontSize: 13 },
});


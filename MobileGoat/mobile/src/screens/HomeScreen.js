import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, router } from "expo-router";
import { useContext } from "react";
import { Alert, Button, Text, View } from "react-native";
import { AppCtx } from "../context/AppContext";

export default function HomeScreen() {
  const { recommendedProducts } = useContext(AppCtx);

  const logout = async () => {
    await AsyncStorage.multiRemove(["pos-token", "pos-user"]);
    Alert.alert("Logged out");
    router.replace("/login");
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "600", textAlign: "center", marginBottom: 12 }}>
        Home
      </Text>

      <Link href="/tabs/products">Go to Products</Link>

      <View style={{ marginVertical: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: "700" }}>Recommended for You</Text>
        {recommendedProducts.length === 0 ? (
          <Text style={{ marginTop: 6, color: "#6B7280" }}>No recommendations yet.</Text>
        ) : (
          recommendedProducts.map((p) => (
            <Text key={p._id} style={{ marginTop: 6 }}>
              ⭐ {p.name}
            </Text>
          ))
        )}
      </View>

      <Button title="Logout" onPress={logout} />
    </View>
  );
}

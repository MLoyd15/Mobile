import { useContext, useEffect } from "react";
import { Button, FlatList, StyleSheet, Text, View } from "react-native";
import { AppCtx } from "../context/AppContext";

export default function ProfileScreen({ navigation }) {
  const { user, isLoggedIn, handleLogout, myReviews, fetchMyReviews } = useContext(AppCtx);

  useEffect(() => {
    if (isLoggedIn) fetchMyReviews();
  }, [isLoggedIn]);

  return (
    <View style={s.container}>
      <Text style={s.title}>Profile</Text>

      {isLoggedIn ? (
        <>
          <Text style={s.row}>Name: {user?.name || "-"}</Text>
          <Text style={s.row}>Email: {user?.email || "-"}</Text>

          <View style={{ marginVertical: 12 }}>
            <Button title="Edit Profile" onPress={() => navigation.navigate("editProfile")} />
          </View>
          <View style={{ marginVertical: 12 }}>
            <Button title="Manage Addresses" onPress={() => navigation.navigate("addresses")} />
          </View>
          <View style={{ marginVertical: 12 }}>
            <Button title="Order History" onPress={() => navigation.navigate("orders")} />
          </View>

          <View style={{ marginVertical: 16, width: "100%" }}>
            <Text style={s.row}>🎁 Loyalty Rewards</Text>
            <Text>- Earn card after 5 purchases or ₱5000 spend</Text>
            <Text>- Status: {user?.loyaltyStatus || "Not yet earned"}</Text>
          </View>

          <View style={{ marginTop: 20, width: "100%" }}>
            <Text style={s.subtitle}>📝 My Reviews</Text>
            {myReviews.length === 0 ? (
              <Text style={s.muted}>You haven’t written any reviews yet.</Text>
            ) : (
              <FlatList
                data={myReviews}
                keyExtractor={(_, i) => i.toString()}
                renderItem={({ item }) => (
                  <View style={s.reviewCard}>
                    <Text style={s.bold}>{item.productName}</Text>
                    <Text style={s.stars}>
                      {"★".repeat(item.rating)}
                      {"☆".repeat(5 - item.rating)}
                    </Text>
                    <Text>{item.comment}</Text>
                    <Text style={s.mutedSmall}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              />
            )}
          </View>

          <View style={{ marginTop: 16, width: "100%" }}>
            <Button title="Logout" onPress={handleLogout} />
          </View>
        </>
      ) : (
        <>
          <Button title="Login" onPress={() => navigation.navigate("login")} />
          <View style={{ height: 10 }} />
          <Button title="Register" onPress={() => navigation.navigate("register")} />
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 12 },
  row: { fontSize: 16, marginVertical: 4 },

  // #6 additional styles:
  subtitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  muted: { color: "#6B7280", textAlign: "center", marginVertical: 8 },
  reviewCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#F9FAFB",
    width: "100%",
  },
  stars: { color: "#F59E0B", marginBottom: 4 },
  mutedSmall: { color: "#6B7280", fontSize: 12 },
  bold: { fontWeight: "700" },
});

// src/screens/ProductsScreen.js
import { router } from "expo-router";
import { useContext } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ProductCard from "../components/ProductCard";
import { AppCtx } from "../context/AppContext";

export default function ProductsScreen() {
  const {
    filteredProducts,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    loading,
  } = useContext(AppCtx);

  return (
    <View style={s.container}>
      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search products..."
        style={s.input}
      />

      <View style={s.chips}>
        {categories.map((c) => (
          <TouchableOpacity
            key={c}
            style={[s.chip, selectedCategory === c && s.active]}
            onPress={() => setSelectedCategory(c)}
          >
            <Text style={[s.ct, selectedCategory === c && s.cta]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 50 }}
        ListEmptyComponent={
          <Text style={s.muted}>{loading ? "Loading..." : "No products found."}</Text>
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() =>
              router.push({ pathname: "/product/[id]", params: { id: item._id } })
            }
          />
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    marginRight: 8,
    marginBottom: 8,
  },
  active: { backgroundColor: "#059669" },
  ct: { color: "#374151", fontWeight: "600" },
  cta: { color: "white" },
  muted: { textAlign: "center", marginTop: 20, color: "#6B7280" },
});

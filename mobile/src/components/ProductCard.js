import { useContext } from "react";
import {
  Button,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity
} from "react-native";
import { AppCtx } from "../context/AppContext";

const PLACEHOLDER = "https://via.placeholder.com/400x300.png?text=No+Image";

function pickImage(product, toAbsoluteUrl) {
  const first = product?.imageUrl || product?.images?.[0] || null;
  if (!first) return PLACEHOLDER;
  return toAbsoluteUrl ? toAbsoluteUrl(first) : first;
}

export default function ProductCard({ product, onPress }) {
  const { handleAddToCart, categoryLabelOf, toAbsoluteUrl } = useContext(AppCtx);
  const img = pickImage(product, toAbsoluteUrl);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={s.card}
    >
      <Image source={{ uri: img }} style={s.image} resizeMode="cover" />
      <Text style={s.name} numberOfLines={2}>
        {product?.name || "Unnamed Product"}
      </Text>
      <Text style={s.category}>
        {categoryLabelOf?.(product) || "Uncategorized"}
      </Text>
      <Text style={s.price}>₱{Number(product?.price || 0).toFixed(2)}</Text>
      <Button title="Add to Cart" onPress={() => handleAddToCart(product)} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  name: { fontSize: 14, fontWeight: "700", marginTop: 8 },
  category: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  price: { fontSize: 14, color: "#059669", fontWeight: "700", marginVertical: 6 },
});

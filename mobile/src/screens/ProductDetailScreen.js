// src/screens/ProductDetailScreen.js
import { router } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
    Button,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { AppCtx } from "../context/AppContext";

export default function ProductDetailScreen({ route }) {
  const { id } = route.params;
  const {
    productDetail,
    fetchProductDetail,
    submitReview,
    handleAddToCart,
    toAbsoluteUrl,
  } = useContext(AppCtx);

  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    fetchProductDetail(id);
  }, [id]);

  if (!productDetail) {
    return (
      <View style={s.loadingBox}>
        <Text>Loading product…</Text>
      </View>
    );
  }

  const p = productDetail;
  const img = p.imageUrl
    ? toAbsoluteUrl?.(p.imageUrl) || p.imageUrl
    : "https://placehold.co/600x400/png?text=No+Image";

  const handleSubmit = () => {
    if (!newRating || !newComment.trim()) return;
    submitReview(p._id, newRating, newComment);
    setNewRating(0);
    setNewComment("");
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Header / Back */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>
          {p.name}
        </Text>
        <View style={{ width: 64 }} />{/* spacer to balance layout */}
      </View>

      <Image source={{ uri: img }} style={s.image} resizeMode="cover" />

      <Text style={s.name}>{p.name}</Text>
      <Text style={s.price}>₱{Number(p.price || 0).toFixed(2)}</Text>
      <Text style={s.desc}>{p.description || "No description available."}</Text>

      {!!p.tags?.length && (
        <View style={s.tags}>
          {p.tags.map((t, i) => (
            <Text key={i} style={s.tag}>#{t}</Text>
          ))}
        </View>
      )}

      <Button title="Add to Cart" onPress={() => handleAddToCart(p)} />

      {/* Reviews */}
      <View style={{ marginTop: 24 }}>
        <Text style={s.sectionTitle}>Ratings & Reviews</Text>

        <Text style={s.avg}>
          ⭐{" "}
          {p.reviews?.length
            ? (
                p.reviews.reduce((s, r) => s + (r.rating || 0), 0) /
                p.reviews.length
              ).toFixed(1)
            : "No ratings yet"}
        </Text>

        <View style={s.reviewBox}>
          <Text style={s.subTitle}>Your Review</Text>
          <View style={s.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setNewRating(n)}>
                <Text style={{ fontSize: 22, color: n <= newRating ? "#F59E0B" : "#D1D5DB" }}>
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Write your review..."
            style={s.input}
            multiline
          />
          <Button title="Submit Review" onPress={handleSubmit} />
        </View>

        {p.reviews?.map((r, i) => (
          <View key={i} style={s.reviewCard}>
            <Text style={s.reviewUser}>{r.userId?.name || "Anonymous"}</Text>
            <Text style={s.reviewStars}>
              {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
            </Text>
            <Text>{r.comment}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  header: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { paddingVertical: 6, paddingHorizontal: 8 },
  backTxt: { fontSize: 16, color: "#10B981", fontWeight: "700" },
  headerTitle: { flex: 1, textAlign: "center", fontWeight: "800", fontSize: 16, color: "#111827" },

  image: { width: "100%", height: 220, borderRadius: 10, marginHorizontal: 16, marginBottom: 12, backgroundColor: "#eee" },
  name: { fontSize: 20, fontWeight: "800", paddingHorizontal: 16 },
  price: { fontSize: 18, color: "#059669", marginVertical: 6, paddingHorizontal: 16 },
  desc: { fontSize: 14, color: "#374151", marginBottom: 12, paddingHorizontal: 16 },

  tags: { flexDirection: "row", flexWrap: "wrap", marginVertical: 8, paddingHorizontal: 16 },
  tag: { fontSize: 12, color: "#6B7280", marginRight: 6 },

  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6, paddingHorizontal: 16 },
  avg: { fontSize: 16, fontWeight: "600", marginBottom: 12, paddingHorizontal: 16 },

  reviewBox: { marginBottom: 16, paddingHorizontal: 16 },
  subTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  stars: { flexDirection: "row", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 8,
    minHeight: 60,
    marginBottom: 8,
    textAlignVertical: "top",
    backgroundColor: "#fff",
  },

  reviewCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#F9FAFB",
  },
  reviewUser: { fontWeight: "700", marginBottom: 2 },
  reviewStars: { color: "#F59E0B", marginBottom: 4 },
});

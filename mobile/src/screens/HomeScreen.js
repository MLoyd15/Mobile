import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useContext } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppCtx } from "../context/AppContext";

export default function HomeScreen() {
  const { recommendedProducts } = useContext(AppCtx);

  const logout = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.multiRemove(["pos-token", "pos-user"]);
            Alert.alert("Success", "Signed out successfully");
            router.replace("/login");
          },
        },
      ]
    );
  };

  const ProductCard = ({ product }) => (
    <TouchableOpacity style={styles.productCard} activeOpacity={0.7}>
      <View style={styles.productImagePlaceholder}>
        <Text style={styles.productImageText}>📦</Text>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>₱{product.price || '0.00'}</Text>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>⭐ 4.5</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const CategoryCard = ({ title, icon, onPress, color = "#007AFF" }) => (
    <TouchableOpacity 
      style={[styles.categoryCard, { backgroundColor: color }]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.categoryIcon}>{icon}</Text>
      <Text style={styles.categoryTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const FeatureCard = ({ title, subtitle, onPress, icon }) => (
    <TouchableOpacity 
      style={styles.featureCard} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.featureContent}>
        <View style={styles.featureIconContainer}>
          <Text style={styles.featureIcon}>{icon}</Text>
        </View>
        <View style={styles.featureText}>
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureSubtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Hello! 👋</Text>
            <Text style={styles.headerSubtitle}>What are you looking for today?</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <TouchableOpacity style={styles.searchBar} onPress={() => router.push("/search")}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search products...</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shop by Category</Text>
        <View style={styles.categoriesContainer}>
          <View style={styles.categoriesRow}>
            <CategoryCard
              title="Electronics"
              icon="📱"
              color="#007AFF"
              onPress={() => router.push("/category/electronics")}
            />
            <CategoryCard
              title="Fashion"
              icon="👕"
              color="#FF9500"
              onPress={() => router.push("/category/fashion")}
            />
          </View>
          <View style={styles.categoriesRow}>
            <CategoryCard
              title="Home & Garden"
              icon="🏡"
              color="#34C759"
              onPress={() => router.push("/category/home")}
            />
            <CategoryCard
              title="Sports"
              icon="⚽"
              color="#FF3B30"
              onPress={() => router.push("/category/sports")}
            />
          </View>
        </View>
      </View>

      {/* Recommended Products */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended for You</Text>
          {recommendedProducts.length > 0 && (
            <TouchableOpacity onPress={() => router.push("/tabs/products")}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          )}
        </View>

        {recommendedProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🛍️</Text>
            <Text style={styles.emptyStateTitle}>Discover Amazing Products</Text>
            <Text style={styles.emptyStateSubtitle}>
              Browse our catalog to get personalized recommendations
            </Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => router.push("/tabs/products")}
            >
              <Text style={styles.browseButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsScroll}>
            <View style={styles.productsContainer}>
              {recommendedProducts.slice(0, 8).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Quick Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.featuresContainer}>
          <FeatureCard
            title="My Orders"
            subtitle="Track your purchases"
            icon="📦"
            onPress={() => router.push("/orders")}
          />
          <FeatureCard
            title="Wishlist"
            subtitle="Save items for later"
            icon="❤️"
            onPress={() => router.push("/wishlist")}
          />
          <FeatureCard
            title="Customer Support"
            subtitle="Get help anytime"
            icon="💬"
            onPress={() => router.push("/support")}
          />
        </View>
      </View>

      {/* Special Offers Banner */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.offerBanner}>
          <View style={styles.offerContent}>
            <View style={styles.offerText}>
              <Text style={styles.offerTitle}>🎉 Special Offers</Text>
              <Text style={styles.offerSubtitle}>Up to 50% off selected items</Text>
            </View>
            <View style={styles.offerButton}>
              <Text style={styles.offerButtonText}>Shop Now</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Sign Out Button */}
      <View style={styles.signOutContainer}>
        <TouchableOpacity style={styles.signOutButton} onPress={logout} activeOpacity={0.8}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  profileButton: {
    width: 40,
    height: 40,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  profileIcon: {
    fontSize: 18,
  },
  searchSection: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  seeAllText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  categoriesContainer: {
    marginTop: 16,
  },
  categoriesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  categoryCard: {
    flex: 1,
    aspectRatio: 1.5,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  productsScroll: {
    marginTop: 16,
  },
  productsContainer: {
    flexDirection: "row",
    paddingRight: 20,
  },
  productCard: {
    width: 140,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImagePlaceholder: {
    height: 100,
    backgroundColor: "#F3F4F6",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  productImageText: {
    fontSize: 32,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
    lineHeight: 18,
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#007AFF",
  },
  ratingBadge: {
    backgroundColor: "#FFF3CD",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: "600",
  },
  featuresContainer: {
    marginTop: 16,
    gap: 8,
  },
  featureCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  featureContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  featureIcon: {
    fontSize: 18,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  featureSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  chevron: {
    fontSize: 20,
    color: "#C7C7CC",
    fontWeight: "300",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  browseButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  offerBanner: {
    backgroundColor: "#007AFF",
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  offerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  offerText: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  offerSubtitle: {
    fontSize: 14,
    color: "#E3F2FD",
  },
  offerButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  offerButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  signOutContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  signOutButton: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  signOutButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
});
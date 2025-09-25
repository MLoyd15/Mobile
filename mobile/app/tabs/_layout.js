import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useContext } from "react";
import AppProvider, { AppCtx } from "../../src/context/AppContext";

export default function TabsLayout() {
  return (
    <AppProvider>
      <TabsInner />
    </AppProvider>
  );
}

function TabsInner() {
  const { orders = [] } = useContext(AppCtx);
  const showDeliveriesTab = orders.length > 0; // appears only after first order

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#34D399" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700", fontSize: 18, color: "#fff" },
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#d1d5db",
        tabBarStyle: {
          backgroundColor: "#34D399",
          borderTopWidth: 0,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color, size }) => <Ionicons name="pricetags" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size }) => <Ionicons name="cart" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt" color={color} size={size} />,
        }}
      />

      {/* 🚚 Deliveries tab: hidden until an order exists */}
      <Tabs.Screen
        name="deliveries"
        options={{
          title: "Deliveries",
          href: showDeliveriesTab ? "/deliveries" : null, // hides when null
          tabBarIcon: ({ color, size }) => <Ionicons name="bicycle" color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}


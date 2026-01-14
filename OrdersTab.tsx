import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import OrderCard from "./OrderCard";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type Order = {
  id: string;
  items: CartItem[];
  total: number;
  deliveryName?: string;
  deliveryAddress?: string;
  timestamp?: any;
  status?: string;
  uid?: string | null;
};

interface OrdersTabProps {
  user: any;
  orders: Order[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onNavigateHome: () => void;
}

export default function OrdersTab({
  user,
  orders,
  isRefreshing,
  onRefresh,
  onNavigateHome,
}: OrdersTabProps) {
  if (!user) {
    return (
      <View style={styles.centered}>
        <Icon name="shopping-bag" size={64} color="#999" />
        <Text style={styles.emptyTitle}>Sign In to View Orders</Text>
        <Text style={styles.emptyText}>
          Sign in to see your order history
        </Text>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.centered}>
        <Icon name="shopping-bag" size={64} color="#999" />
        <Text style={styles.emptyTitle}>No Orders Yet</Text>
        <Text style={styles.emptyText}>
          Your order history will appear here
        </Text>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onNavigateHome}
        >
          <Text style={styles.actionButtonText}>Start Ordering</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      renderItem={({ item }) => <OrderCard order={item} />}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#ff6b00"
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  centered: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 32 
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: "#ff6b00",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Feather";

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

interface OrderCardProps {
  order: Order;
}

const statusColors: Record<string, string> = {
  pending: "#FFC107",
  confirmed: "#17A2B8",
  preparing: "#F1A208",
  out_for_delivery: "#007BFF",
  delivered: "#28A745",
  cancelled: "#DC3545",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return "";
  let date: Date;
  if (timestamp?.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return "";
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function OrderCard({ order }: OrderCardProps) {
  const statusColor = statusColors[order.status || "pending"] || "#999";
  const statusLabel = statusLabels[order.status || "pending"] || "Pending";

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderId}>
            Order #{order.id.slice(0, 8).toUpperCase()}
          </Text>
          <Text style={styles.orderDate}>
            {formatDate(order.timestamp)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.orderItemsContainer}>
        {order.items.slice(0, 2).map((orderItem, index) => (
          <Text key={index} style={styles.orderItemText}>
            {orderItem.name} x {orderItem.quantity}
          </Text>
        ))}
        {order.items.length > 2 && (
          <Text style={styles.moreItemsText}>
            +{order.items.length - 2} more item{order.items.length - 2 > 1 ? "s" : ""}
          </Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>
          R{order.total.toFixed(2)}
        </Text>
        <Icon name="chevron-right" size={20} color="#999" />
      </View>

      {order.deliveryAddress && (
        <View style={styles.deliveryInfo}>
          <Icon name="map-pin" size={14} color="#666" />
          <Text style={styles.deliveryText} numberOfLines={1}>
            {order.deliveryAddress}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  orderCard: { 
    backgroundColor: "#fff", 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "flex-start", 
    marginBottom: 12,
  },
  orderId: { 
    fontSize: 16, 
    fontWeight: "600",
    color: "#111",
  },
  orderDate: { 
    fontSize: 13, 
    color: "#666",
    marginTop: 4,
  },
  statusBadge: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20,
  },
  statusText: { 
    color: "#fff", 
    fontSize: 12, 
    fontWeight: "600",
  },
  orderItemsContainer: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  orderItemText: {
    fontSize: 14,
    color: "#444",
    marginBottom: 4,
  },
  moreItemsText: {
    fontSize: 13,
    color: "#999",
    fontStyle: "italic",
    marginTop: 2,
  },
  orderFooter: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
    marginBottom: 8,
  },
  orderTotal: { 
    fontSize: 18,
    fontWeight: "700",
    color: "#ff6b00",
  },
  deliveryInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  deliveryText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
});
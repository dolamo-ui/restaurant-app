import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

interface OrderCardAdminProps {
  order: any;
  formatZAR: (value: number) => string;
  onUpdateStatus: (orderId: string, status: string) => void;
  onDelete: (orderId: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Pending":
      return { backgroundColor: "#fff3cd", borderColor: "#ffc107" };
    case "In Progress":
      return { backgroundColor: "#cfe2ff", borderColor: "#007bff" };
    case "Delivered":
      return { backgroundColor: "#d1e7dd", borderColor: "#28a745" };
    case "Cancelled":
      return { backgroundColor: "#f8d7da", borderColor: "#dc3545" };
    default:
      return { backgroundColor: "#e2e3e5", borderColor: "#6c757d" };
  }
};

export default function OrderCardAdmin({
  order,
  formatZAR,
  onUpdateStatus,
  onDelete,
}: OrderCardAdminProps) {
  return (
    <View style={styles.orderItem}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
        <Text style={styles.orderTotal}>{formatZAR(order.total)}</Text>
      </View>

      <View style={styles.orderStatusContainer}>
        <View style={[styles.statusBadge, getStatusColor(order.status)]}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>

      <Text style={styles.orderDate}>
        {order.createdAt
          ? typeof order.createdAt.toDate === "function"
            ? order.createdAt.toDate().toLocaleString()
            : order.createdAt instanceof Date
            ? order.createdAt.toLocaleString()
            : String(order.createdAt)
          : "No timestamp"}
      </Text>

      <Text style={styles.orderActionsLabel}>Update Status:</Text>
      <View style={styles.orderActions}>
        <TouchableOpacity
          style={styles.statusBtn}
          onPress={() => onUpdateStatus(order.id, "Pending")}
        >
          <Feather name="clock" size={18} color="#ffc107" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.statusBtn}
          onPress={() => onUpdateStatus(order.id, "In Progress")}
        >
          <Feather name="loader" size={18} color="#007bff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.statusBtn}
          onPress={() => onUpdateStatus(order.id, "Delivered")}
        >
          <Feather name="check-circle" size={18} color="#28a745" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.statusBtn}
          onPress={() => onUpdateStatus(order.id, "Cancelled")}
        >
          <Feather name="x-circle" size={18} color="#6c757d" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statusBtn, styles.deleteOrderBtn]}
          onPress={() => onDelete(order.id)}
        >
          <Feather name="trash-2" size={18} color="#dc3545" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  orderItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderId: {
    fontWeight: "700",
    fontSize: 16,
    color: "#212529",
  },
  orderTotal: {
    fontWeight: "700",
    fontSize: 18,
    color: "#28a745",
  },
  orderStatusContainer: {
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  orderDate: {
    color: "#6c757d",
    fontSize: 12,
    marginBottom: 16,
  },
  orderActionsLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
  },
  orderActions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  statusBtn: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  deleteOrderBtn: {
    backgroundColor: "#f8d7da",
    borderColor: "#dc3545",
  },
});
import React from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import OrderCardAdmin from "./OrderCardAdmin";

interface OrdersModalProps {
  visible: boolean;
  orders: any[];
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: string) => void;
  onDelete: (orderId: string) => void;
  formatZAR: (value: number) => string;
}

export default function OrdersModal({
  visible,
  orders,
  onClose,
  onUpdateStatus,
  onDelete,
  formatZAR,
}: OrdersModalProps) {
  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>All Orders</Text>
            <Text style={styles.headerSub}>
              {orders.length} order{orders.length !== 1 ? "s" : ""} total
            </Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.75}>
            <Feather name="x" size={20} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        {/* Summary strip */}
        {orders.length > 0 && (
          <View style={styles.summaryStrip}>
            {["pending", "preparing", "delivered"].map((s) => {
              const count = orders.filter((o) => (o.status || "pending") === s).length;
              const labels: Record<string, string> = { pending: "Pending", preparing: "Preparing", delivered: "Delivered" };
              const colors: Record<string, string> = { pending: "#B45309", preparing: "#92400E", delivered: "#065F46" };
              const bgs: Record<string, string> = { pending: "#FEF3C7", preparing: "#FDE68A", delivered: "#D1FAE5" };
              return (
                <View key={s} style={[styles.summaryChip, { backgroundColor: bgs[s] }]}>
                  <Text style={[styles.summaryCount, { color: colors[s] }]}>{count}</Text>
                  <Text style={[styles.summaryLabel, { color: colors[s] }]}>{labels[s]}</Text>
                </View>
              );
            })}
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <View style={styles.emptyIconInner}>
                  <Feather name="package" size={36} color="#FF5722" />
                </View>
              </View>
              <Text style={styles.emptyTitle}>No Orders Yet</Text>
              <Text style={styles.emptySubtext}>Orders will appear here as customers place them</Text>
            </View>
          ) : (
            orders.map((order) => (
              <OrderCardAdmin
                key={order.id}
                order={order}
                formatZAR={formatZAR}
                onUpdateStatus={onUpdateStatus}
                onDelete={onDelete}
              />
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#FAFAF8",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0EDE8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1A1A1A",
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: "#aaa",
    fontWeight: "600",
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F2EE",
    justifyContent: "center",
    alignItems: "center",
  },

  // Summary strip
  summaryStrip: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#fff",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EDE8",
  },
  summaryChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
  },
  summaryCount: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: 2,
  },

  // Content
  content: {
    padding: 20,
    paddingBottom: 60,
  },

  // Empty
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#FFF0EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyIconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFE0D6",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1A1A1A",
    letterSpacing: -0.3,
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 21,
  },
});
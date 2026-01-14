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
        <View style={styles.fixedHeader}>
          <Text style={styles.modalHeading}>All Orders</Text>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.ordersContent}>
          {orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="package" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No orders yet</Text>
              <Text style={styles.emptySubtext}>Orders will appear here</Text>
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
    backgroundColor: "#f8f9fa",
  },
  fixedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  modalHeading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212529",
  },
  ordersContent: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    color: "#6c757d",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    color: "#adb5bd",
    fontSize: 14,
    marginTop: 8,
  },
});
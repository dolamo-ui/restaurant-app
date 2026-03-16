import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
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

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  pending:          { color: "#B45309", bg: "#FEF3C7", icon: "clock",        label: "Pending" },
  confirmed:        { color: "#0E7490", bg: "#CFFAFE", icon: "check-circle",  label: "Confirmed" },
  preparing:        { color: "#92400E", bg: "#FDE68A", icon: "tool",          label: "Preparing" },
  out_for_delivery: { color: "#1D4ED8", bg: "#DBEAFE", icon: "truck",         label: "On the Way" },
  delivered:        { color: "#065F46", bg: "#D1FAE5", icon: "check-circle",  label: "Delivered" },
  cancelled:        { color: "#991B1B", bg: "#FEE2E2", icon: "x-circle",      label: "Cancelled" },
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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const cfg = STATUS_CONFIG[order.status || "pending"] || STATUS_CONFIG.pending;
  const dateStr = formatDate(order.timestamp);

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: cfg.color }]} />

      <View style={styles.inner}>
        {/* Header row */}
        <View style={styles.header}>
          <View>
            <Text style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
            {dateStr ? <Text style={styles.date}>{dateStr}</Text> : null}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Icon name={cfg.icon as any} size={12} color={cfg.color} style={{ marginRight: 5 }} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Items */}
        <View style={styles.itemsSection}>
          {order.items.slice(0, 2).map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={styles.itemDot} />
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemQty}>×{item.quantity}</Text>
            </View>
          ))}
          {order.items.length > 2 && (
            <Text style={styles.moreItems}>
              +{order.items.length - 2} more item{order.items.length - 2 > 1 ? "s" : ""}
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.totalWrap}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>R{order.total.toFixed(2)}</Text>
          </View>
          {order.deliveryAddress ? (
            <View style={styles.addressWrap}>
              <Icon name="map-pin" size={12} color="#FF5722" />
              <Text style={styles.addressText} numberOfLines={1}>{order.deliveryAddress}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0EDE8",
    shadowColor: "#1A1A1A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  accentBar: {
    width: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  inner: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.3,
  },
  date: {
    fontSize: 12,
    color: "#aaa",
    marginTop: 3,
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 50,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: "#F5F2EE",
    marginBottom: 12,
  },
  itemsSection: {
    marginBottom: 14,
    gap: 6,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF5722",
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: "#444",
    fontWeight: "500",
  },
  itemQty: {
    fontSize: 13,
    color: "#999",
    fontWeight: "700",
  },
  moreItems: {
    fontSize: 12,
    color: "#bbb",
    fontStyle: "italic",
    marginLeft: 14,
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#F5F2EE",
    paddingTop: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  totalWrap: {},
  totalLabel: {
    fontSize: 10,
    color: "#bbb",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FF5722",
    letterSpacing: -0.5,
  },
  addressWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
    maxWidth: "60%",
  },
  addressText: {
    fontSize: 12,
    color: "#888",
    flex: 1,
    fontWeight: "500",
  },
});
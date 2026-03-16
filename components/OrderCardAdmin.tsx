import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";

// ─── Types ────────────────────────────────────────────────────────────────────
type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  extras?: { id: string; label: string; price: number }[];
};

interface OrderCardAdminProps {
  order: any;
  formatZAR: (value: number) => string;
  onUpdateStatus: (orderId: string, status: string) => void;
  onDelete: (orderId: string) => void;
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  pending:          { color: "#F59E0B", bg: "#F59E0B18", icon: "clock",        label: "Pending" },
  confirmed:        { color: "#3B82F6", bg: "#3B82F618", icon: "check-circle", label: "Confirmed" },
  preparing:        { color: "#8B5CF6", bg: "#8B5CF618", icon: "tool",         label: "Preparing" },
  out_for_delivery: { color: "#06B6D4", bg: "#06B6D418", icon: "truck",        label: "Out for Delivery" },
  delivered:        { color: "#10B981", bg: "#10B98118", icon: "package",      label: "Delivered" },
  cancelled:        { color: "#EF4444", bg: "#EF444418", icon: "x-circle",     label: "Cancelled" },
};

const STATUS_FLOW = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTimestamp(ts: any): string {
  if (!ts) return "Unknown time";
  try {
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60)   return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "Unknown time";
  }
}

function getItems(order: any): CartItem[] {
  // Handle both field names used across the app
  return order.items || order.cartItems || [];
}

function getOrderTotal(order: any): number {
  return Number(order.total) || 0;
}

// ─── Status Progress Bar ──────────────────────────────────────────────────────
function StatusProgress({ currentStatus }: { currentStatus: string }) {
  const currentIndex = STATUS_FLOW.indexOf(currentStatus);
  if (currentStatus === "cancelled" || currentIndex === -1) return null;

  return (
    <View style={p.wrap}>
      {STATUS_FLOW.map((status, index) => {
        const cfg = STATUS_CONFIG[status];
        const isCompleted = index <= currentIndex;
        const isCurrent   = index === currentIndex;
        return (
          <React.Fragment key={status}>
            <View style={p.step}>
              <View style={[
                p.dot,
                isCompleted ? { backgroundColor: cfg.color } : { backgroundColor: "#2A2A3A" },
                isCurrent   ? { borderWidth: 2, borderColor: cfg.color + "80" } : {},
              ]}>
                {isCompleted ? (
                  <Feather name={cfg.icon as any} size={10} color="#fff" />
                ) : (
                  <View style={[p.dotInner, { backgroundColor: "#3A3A4A" }]} />
                )}
              </View>
              <Text style={[p.label, { color: isCompleted ? cfg.color : "#444" }]} numberOfLines={1}>
                {cfg.label.split(" ").slice(-1)[0]}
              </Text>
            </View>
            {index < STATUS_FLOW.length - 1 && (
              <View style={[p.line, { backgroundColor: index < currentIndex ? STATUS_CONFIG[STATUS_FLOW[index + 1]].color : "#2A2A3A" }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OrderCardAdmin({
  order,
  formatZAR,
  onUpdateStatus,
  onDelete,
}: OrderCardAdminProps) {
  const [expanded, setExpanded]   = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;

  const items  = getItems(order);
  const total  = getOrderTotal(order);
  const status = order.status || "pending";
  const cfg    = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  const toggle = () => {
    const toValue = expanded ? 0 : 1;
    Animated.parallel([
      Animated.spring(rotateAnim, { toValue, useNativeDriver: true, tension: 80, friction: 10 }),
    ]).start();
    setExpanded(!expanded);
  };

  const chevronRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const isActive = !["delivered", "cancelled"].includes(status);

  return (
    <View style={[s.card, isActive && { borderLeftColor: cfg.color, borderLeftWidth: 3 }]}>
      {/* ── Header row ── */}
      <TouchableOpacity style={s.header} onPress={toggle} activeOpacity={0.85}>
        <View style={[s.statusDot, { backgroundColor: cfg.color }]} />

        <View style={s.headerInfo}>
          <View style={s.headerTop}>
            <Text style={s.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
            <View style={[s.statusPill, { backgroundColor: cfg.bg }]}>
              <Feather name={cfg.icon as any} size={10} color={cfg.color} />
              <Text style={[s.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>
          <Text style={s.customerName} numberOfLines={1}>
            {order.deliveryName || "Unknown customer"}
          </Text>
          <View style={s.metaRow}>
            <Feather name="map-pin" size={10} color="#444" />
            <Text style={s.metaText} numberOfLines={1}>{order.deliveryAddress || "No address"}</Text>
          </View>
          <View style={s.metaRow}>
            <Feather name="clock" size={10} color="#444" />
            <Text style={s.metaText}>{formatTimestamp(order.createdAt || order.timestamp)}</Text>
            <Text style={s.metaDot}>·</Text>
            <Text style={s.metaText}>{items.length} item{items.length !== 1 ? "s" : ""}</Text>
          </View>
        </View>

        <View style={s.headerRight}>
          <Text style={s.totalAmount}>{formatZAR(total)}</Text>
          <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
            <Feather name="chevron-down" size={16} color="#555" />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* ── Expanded body ── */}
      {expanded && (
        <View style={s.body}>

          {/* Progress */}
          <StatusProgress currentStatus={status} />

          {/* Items list */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Order Items</Text>
            {items.length === 0 ? (
              <Text style={s.emptyText}>No items recorded</Text>
            ) : (
              items.map((item: CartItem, i: number) => (
                <View key={item.id + i} style={s.itemRow}>
                  <View style={s.itemQtyBadge}>
                    <Text style={s.itemQty}>{item.quantity}</Text>
                  </View>
                  <View style={s.itemInfo}>
                    <Text style={s.itemName} numberOfLines={1}>{item.name}</Text>
                    {item.extras && item.extras.length > 0 && (
                      <Text style={s.itemExtras} numberOfLines={1}>
                        + {item.extras.map(e => e.label).join(", ")}
                      </Text>
                    )}
                  </View>
                  <Text style={s.itemPrice}>{formatZAR(item.price * item.quantity)}</Text>
                </View>
              ))
            )}

            {/* Totals */}
            <View style={s.divider} />
            {order.deliveryFee != null && (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Delivery fee</Text>
                <Text style={s.totalValue}>{formatZAR(order.deliveryFee)}</Text>
              </View>
            )}
            <View style={[s.totalRow, s.grandTotalRow]}>
              <Text style={s.grandTotalLabel}>Total</Text>
              <Text style={s.grandTotalValue}>{formatZAR(total)}</Text>
            </View>
          </View>

          {/* Payment status */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Payment</Text>
            <View style={s.paymentRow}>
              <View style={[s.payBadge, {
                backgroundColor: order.paymentStatus === "paid" ? "#10B98118" : "#EF444418",
              }]}>
                <Feather
                  name={order.paymentStatus === "paid" ? "check-circle" : "alert-circle"}
                  size={12}
                  color={order.paymentStatus === "paid" ? "#10B981" : "#EF4444"}
                />
                <Text style={[s.payBadgeText, {
                  color: order.paymentStatus === "paid" ? "#10B981" : "#EF4444",
                }]}>
                  {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                </Text>
              </View>
              {order.paymentMethod && (
                <Text style={s.payMethod}>{order.paymentMethod}</Text>
              )}
              {order.uid && (
                <Text style={s.payUid} numberOfLines={1}>UID: {order.uid.slice(0, 12)}…</Text>
              )}
            </View>
          </View>

          {/* Status update buttons */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Update Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statusButtons}>
              {Object.entries(STATUS_CONFIG).map(([key, c]) => {
                const isActive = status === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      s.statusBtn,
                      { backgroundColor: c.bg },
                      isActive && { borderWidth: 1.5, borderColor: c.color },
                    ]}
                    onPress={() => onUpdateStatus(order.id, key)}
                    activeOpacity={0.75}
                  >
                    <Feather name={c.icon as any} size={12} color={c.color} />
                    <Text style={[s.statusBtnText, { color: c.color }]}>{c.label}</Text>
                    {isActive && <Feather name="check" size={10} color={c.color} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Delete */}
          <TouchableOpacity style={s.deleteBtn} onPress={() => onDelete(order.id)} activeOpacity={0.8}>
            <Feather name="trash-2" size={14} color="#EF4444" />
            <Text style={s.deleteBtnText}>Delete Order</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F0EDE8",
    overflow: "hidden",
    shadowColor: "#1A1A1A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  headerInfo: { flex: 1, gap: 3 },
  headerTop:  { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  orderId: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusPillText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.3 },
  customerName: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11, color: "#888", fontWeight: "500", flexShrink: 1 },
  metaDot:  { fontSize: 11, color: "#ccc", marginHorizontal: 2 },
  headerRight: { alignItems: "flex-end", gap: 6 },
  totalAmount: { fontSize: 18, fontWeight: "900", color: "#10B981", letterSpacing: -0.3 },

  // Body
  body: { borderTopWidth: 1, borderTopColor: "#F5F2EE", paddingHorizontal: 16, paddingBottom: 16 },
  section: { marginTop: 16 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#bbb",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  // Items
  emptyText: { fontSize: 13, color: "#ccc", fontStyle: "italic" },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  itemQtyBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#FFF0EB",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  itemQty:    { fontSize: 12, fontWeight: "900", color: "#FF5722" },
  itemInfo:   { flex: 1 },
  itemName:   { fontSize: 14, fontWeight: "700", color: "#1A1A1A" },
  itemExtras: { fontSize: 11, color: "#aaa", marginTop: 1 },
  itemPrice:  { fontSize: 14, fontWeight: "800", color: "#555" },
  divider:    { height: 1, backgroundColor: "#F5F2EE", marginVertical: 10 },
  totalRow:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  totalLabel: { fontSize: 13, color: "#888", fontWeight: "500" },
  totalValue: { fontSize: 13, color: "#888", fontWeight: "600" },
  grandTotalRow:  { marginTop: 4 },
  grandTotalLabel:{ fontSize: 15, fontWeight: "800", color: "#1A1A1A" },
  grandTotalValue:{ fontSize: 18, fontWeight: "900", color: "#FF5722", letterSpacing: -0.3 },

  // Payment
  paymentRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  payBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  payBadgeText: { fontSize: 12, fontWeight: "800" },
  payMethod: { fontSize: 12, color: "#aaa", fontWeight: "500", textTransform: "capitalize" },
  payUid:    { fontSize: 11, color: "#ddd", fontWeight: "500" },

  // Status buttons
  statusButtons: { gap: 8, paddingVertical: 2 },
  statusBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 0,
  },
  statusBtnText: { fontSize: 12, fontWeight: "700" },

  // Delete
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  deleteBtnText: { color: "#EF4444", fontSize: 14, fontWeight: "700" },
});

// ─── Progress bar styles ──────────────────────────────────────────────────────
const p = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 16,
    paddingHorizontal: 4,
  },
  step: { alignItems: "center", gap: 4, width: 52 },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  dotInner: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 9, fontWeight: "700", textAlign: "center", textTransform: "uppercase", letterSpacing: 0.3 },
  line: { flex: 1, height: 2, marginTop: 12, borderRadius: 1 },
});
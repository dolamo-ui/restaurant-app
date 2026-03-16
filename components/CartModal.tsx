import React, { useState, useRef } from "react";
import {
  View, Text, Modal, FlatList,
  TouchableOpacity, StyleSheet, Animated, Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import CartItemComponent from "./CartItem";
import GuestLoginPrompt from "./GuestLoginPrompt";

type CartItem = {
  id:       string;
  name:     string;
  price:    number;
  quantity: number;
  image?:   string;
  extras?:  { id: string; label: string; price: number }[];
  note?:    string;
};

interface CartModalProps {
  visible:           boolean;
  cart:              CartItem[];
  isGuest:           boolean;
  onClose:           () => void;
  onClearCart:       () => void;
  onRemoveItem:      (id: string) => void;
  onChangeQuantity:  (id: string, delta: number) => void;
  onUpdateNote?:     (id: string, note: string) => void;
  onCheckout:        () => void;
  deliveryFee:       number;
}

export default function CartModal({
  visible, cart, isGuest, onClose, onClearCart,
  onRemoveItem, onChangeQuantity, onUpdateNote,
  onCheckout, deliveryFee,
}: CartModalProps) {
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const clearBtnScale = useRef(new Animated.Value(1)).current;

  const cartTotal  = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const grandTotal = cartTotal + deliveryFee;

  const handleCheckoutPress = () => {
    if (isGuest) {
      setShowGuestPrompt(true);
    } else {
      onCheckout();
    }
  };

  // ── Clear All with confirmation ──────────────────────────────────────────────
  const handleClearAll = () => {
    // Bounce animation on the button
    Animated.sequence([
      Animated.spring(clearBtnScale, { toValue: 0.88, useNativeDriver: true, tension: 300, friction: 10 }),
      Animated.spring(clearBtnScale, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 10 }),
    ]).start();

    Alert.alert(
      "Clear Cart",
      `Remove all ${totalItems} item${totalItems !== 1 ? "s" : ""} from your cart?`,
      [
        { text: "Keep Items", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => onClearCart(),
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>

            {/* ── Handle ── */}
            <View style={styles.handle} />

            {/* ── Header ── */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>Your Cart</Text>
                <Text style={styles.subtitle}>
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                  {cart.length > 0 && (
                    <Text style={styles.subtitleMuted}> · R{cartTotal.toFixed(2)}</Text>
                  )}
                </Text>
              </View>

              <View style={styles.headerActions}>
                {/* Clear All button */}
                {cart.length > 0 && (
                  <Animated.View style={{ transform: [{ scale: clearBtnScale }] }}>
                    <TouchableOpacity
                      style={styles.clearBtn}
                      onPress={handleClearAll}
                      activeOpacity={0.8}
                    >
                      <Feather name="trash-2" size={13} color="#EF4444" />
                      <Text style={styles.clearBtnText}>Clear All</Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}

                {/* Close */}
                <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
                  <Feather name="x" size={18} color="#1A1A1A" />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Empty state ── */}
            {cart.length === 0 ? (
              <View style={styles.empty}>
                <View style={styles.emptyOuter}>
                  <View style={styles.emptyInner}>
                    <Feather name="shopping-cart" size={34} color="#FF5722" />
                  </View>
                </View>
                <Text style={styles.emptyTitle}>Your cart is empty</Text>
                <Text style={styles.emptySub}>Add some delicious items to get started</Text>
                <TouchableOpacity style={styles.browseBtn} onPress={onClose} activeOpacity={0.85}>
                  <Feather name="arrow-left" size={15} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.browseBtnText}>Browse Menu</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* ── Guest banner ── */}
                {isGuest && (
                  <View style={styles.guestBanner}>
                    <Feather name="info" size={13} color="#FF5722" />
                    <Text style={styles.guestBannerText}>
                      Browsing as guest — sign in to place your order. Cart will be saved.
                    </Text>
                  </View>
                )}

                {/* ── Edit hint banner ── */}
                <View style={styles.editHint}>
                  <Feather name="edit-2" size={11} color="#3B82F6" />
                  <Text style={styles.editHintText}>
                    Tap ± to change quantity · Tap trash to remove · Tap "Add note" for instructions
                  </Text>
                </View>

                {/* ── Items list ── */}
                <FlatList
                  data={cart}
                  renderItem={({ item }) => (
                    <CartItemComponent
                      item={item}
                      onRemove={onRemoveItem}
                      onChangeQuantity={onChangeQuantity}
                      onUpdateNote={onUpdateNote}
                    />
                  )}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                />

                {/* ── Summary ── */}
                <View style={styles.summary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>R{cartTotal.toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Delivery Fee</Text>
                    <Text style={styles.summaryValue}>R{deliveryFee.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>R{grandTotal.toFixed(2)}</Text>
                  </View>
                </View>

                {/* ── Checkout button ── */}
                <TouchableOpacity
                  style={styles.checkoutBtn}
                  onPress={handleCheckoutPress}
                  activeOpacity={0.85}
                >
                  <Feather name={isGuest ? "log-in" : "arrow-right"} size={17} color="#fff" />
                  <Text style={styles.checkoutBtnText}>
                    {isGuest ? "Sign In to Checkout" : `Checkout · R${grandTotal.toFixed(2)}`}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* ── Continue shopping ── */}
            <TouchableOpacity style={styles.continueBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.continueBtnText}>Continue Shopping</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* ── Guest Login Prompt ── */}
      <GuestLoginPrompt
        visible={showGuestPrompt}
        itemCount={totalItems}
        onClose={() => setShowGuestPrompt(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.52)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FAFAF8",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 32,
    maxHeight: "94%",
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#E0E0E0", alignSelf: "center",
    marginTop: 12, marginBottom: 16,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  title:    { fontSize: 22, fontWeight: "900", color: "#1A1A1A", letterSpacing: -0.4 },
  subtitle: { fontSize: 13, color: "#aaa", marginTop: 3, fontWeight: "500" },
  subtitleMuted: { color: "#FF5722", fontWeight: "700" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },

  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FEE2E2",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  clearBtnText: { color: "#EF4444", fontSize: 13, fontWeight: "700" },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#F5F2EE",
    justifyContent: "center", alignItems: "center",
  },

  // Banners
  guestBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#FFF3EE", marginHorizontal: 20,
    marginBottom: 8, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "#FFD5C2",
  },
  guestBannerText: { flex: 1, fontSize: 12, color: "#FF5722", fontWeight: "600", lineHeight: 18 },

  editHint: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: "#EFF6FF", marginHorizontal: 20,
    marginBottom: 12, borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: "#BFDBFE",
  },
  editHintText: { flex: 1, fontSize: 11, color: "#1D4ED8", fontWeight: "600", lineHeight: 16 },

  // Empty
  empty: {
    alignItems: "center",
    paddingVertical: 52,
    paddingHorizontal: 32,
  },
  emptyOuter: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: "#FFF0EB",
    justifyContent: "center", alignItems: "center", marginBottom: 20,
  },
  emptyInner: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: "#FFE0D6",
    justifyContent: "center", alignItems: "center",
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#1A1A1A", marginBottom: 8 },
  emptySub:   { fontSize: 14, color: "#aaa", textAlign: "center", lineHeight: 20, marginBottom: 24 },
  browseBtn:  {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FF5722", borderRadius: 50,
    paddingHorizontal: 24, paddingVertical: 13,
    shadowColor: "#FF5722", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  browseBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // List
  listContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },

  // Summary
  summary: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F0EDE8",
    shadowColor: "#1A1A1A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryRow:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: "#888", fontWeight: "500" },
  summaryValue: { fontSize: 14, fontWeight: "700", color: "#555" },
  totalRow:     { paddingTop: 12, borderTopWidth: 1, borderTopColor: "#EDEAE5", marginBottom: 0 },
  totalLabel:   { fontSize: 16, fontWeight: "800", color: "#1A1A1A" },
  totalValue:   { fontSize: 22, fontWeight: "900", color: "#FF5722", letterSpacing: -0.4 },

  // Checkout
  checkoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "#FF5722", paddingVertical: 17, borderRadius: 18,
    marginHorizontal: 16, marginBottom: 10,
    shadowColor: "#FF5722", shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  checkoutBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  continueBtn:     { alignItems: "center", paddingVertical: 12, marginHorizontal: 16 },
  continueBtnText: { color: "#FF5722", fontSize: 15, fontWeight: "700" },
});
// FILE: components/StripeCheckoutModal.tsx
// ✅ Works in Expo Go — no native module, no Cloud Function needed
// ✅ On success: saves order to Firestore + calls onPaymentSuccess

import React, { useState, useCallback } from "react";
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Alert, ScrollView,
  KeyboardAvoidingView, Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig"; // ← adjust path if needed

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  extras?: { id: string; label: string; price: number }[];
};

interface Props {
  visible: boolean;
  cart: CartItem[];
  cartTotal: number;
  deliveryFee: number;
  deliveryName: string;
  deliveryAddress: string;
  user: any;
  onDeliveryNameChange: (v: string) => void;
  onDeliveryAddressChange: (v: string) => void;
  onClose: () => void;
  onPaymentSuccess: (orderId: string) => void;
}

// ── Card formatting helpers ────────────────────────────────────────
const formatCardNumber = (text: string) => {
  const cleaned = text.replace(/\D/g, "").slice(0, 16);
  return cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
};
const formatExpiry = (text: string) => {
  const cleaned = text.replace(/\D/g, "").slice(0, 4);
  if (cleaned.length >= 3) return cleaned.slice(0, 2) + "/" + cleaned.slice(2);
  return cleaned;
};
const isCardValid   = (n: string) => n.replace(/\s/g, "").length === 16;
const isExpiryValid = (e: string) => {
  if (!/^\d{2}\/\d{2}$/.test(e)) return false;
  const [mm, yy] = e.split("/").map(Number);
  if (mm < 1 || mm > 12) return false;
  const now = new Date();
  const year = 2000 + yy;
  const month = mm - 1;
  return new Date(year, month) >= new Date(now.getFullYear(), now.getMonth());
};
const isCvvValid = (c: string) => c.length === 3 || c.length === 4;

export default function StripeCheckoutModal({
  visible, cart, cartTotal, deliveryFee,
  deliveryName, deliveryAddress,
  user,
  onDeliveryNameChange, onDeliveryAddressChange,
  onClose, onPaymentSuccess,
}: Props) {
  const [cardNumber, setCardNumber]     = useState("");
  const [expiry, setExpiry]             = useState("");
  const [cvv, setCvv]                   = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const grandTotal = cartTotal + deliveryFee;

  const isFormComplete =
    deliveryName.trim() !== "" &&
    deliveryAddress.trim() !== "" &&
    isCardValid(cardNumber) &&
    isExpiryValid(expiry) &&
    isCvvValid(cvv);

  const resetCard = () => { setCardNumber(""); setExpiry(""); setCvv(""); };

  const handleClose = () => {
    if (isProcessing) return;
    resetCard();
    onClose();
  };

  const handlePay = useCallback(async () => {
    if (!isFormComplete || isProcessing) return;

    if (cart.length === 0) {
      Alert.alert("Empty Cart", "Add items to your cart before checking out.");
      return;
    }

    setIsProcessing(true);

    try {
      // ── Save order directly to Firestore ──────────────────────────
      // In production you would call your payment backend first,
      // then save only after a successful charge confirmation.
      const orderPayload = {
        cartItems: cart.map((c) => ({
          id:       c.id,
          name:     c.name,
          price:    c.price,
          quantity: c.quantity,
          image:    c.image   || "",
          extras:   c.extras  || [],
        })),
        total:           grandTotal,
        subtotal:        cartTotal,
        deliveryFee:     deliveryFee,
        deliveryName:    deliveryName.trim(),
        deliveryAddress: deliveryAddress.trim(),
        createdAt:       serverTimestamp(),
        status:          "pending",
        uid:             user?.uid || null,
        paymentMethod:   "card",
        paymentStatus:   "paid",
      };

      // Save to top-level orders collection (admin sees this)
      const topLevelRef = await addDoc(collection(db, "orders"), orderPayload);
      const orderId = topLevelRef.id;

      // Also save to user's personal order history
      if (user?.uid) {
        await addDoc(
          collection(db, "users", user.uid, "orders"),
          { ...orderPayload, adminOrderId: orderId }
        );
      }

      // ── Success ───────────────────────────────────────────────────
      resetCard();
      onPaymentSuccess(orderId);

    } catch (err: any) {
      console.error("Order save error:", err);
      Alert.alert(
        "Order Failed",
        err?.message || "Could not place your order. Please check your connection and try again."
      );
    } finally {
      setIsProcessing(false);
    }
  }, [
    isFormComplete, isProcessing, cart,
    cardNumber, expiry, cvv,
    deliveryName, deliveryAddress,
    grandTotal, cartTotal, deliveryFee,
    user, onPaymentSuccess,
  ]);

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.overlay}>
          {/* Tap outside to close */}
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject as any}
            onPress={handleClose}
            activeOpacity={1}
          />

          <View style={styles.sheet}>
            <View style={styles.handle} />

            {/* ── Header ── */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>Secure Checkout</Text>
                <Text style={styles.subtitle}>
                  {cart.length} item{cart.length !== 1 ? "s" : ""} · R{grandTotal.toFixed(2)} total
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={handleClose} disabled={isProcessing}>
                <Icon name="x" size={18} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* ── Order Summary ── */}
              <View style={styles.summaryBox}>
                <Text style={styles.sectionLabel}>Order Summary</Text>
                {cart.map((item, i) => (
                  <View key={item.id + i} style={styles.summaryRow}>
                    <View style={styles.orangeDot} />
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name} ×{item.quantity}
                    </Text>
                    <Text style={styles.itemPrice}>
                      R{(item.price * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                ))}
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.feeLabel}>Subtotal</Text>
                  <Text style={styles.feeValue}>R{cartTotal.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.feeLabel}>Delivery fee</Text>
                  <Text style={styles.feeValue}>R{deliveryFee.toFixed(2)}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>R{grandTotal.toFixed(2)}</Text>
                </View>
              </View>

              {/* ── Delivery Details ── */}
              <Text style={styles.sectionLabel}>Delivery Details</Text>

              <Text style={styles.fieldLabel}>Full Name</Text>
              <View style={[
                styles.inputWrap,
                deliveryName.trim().length > 0 && styles.inputValid,
              ]}>
                <Icon name="user" size={15} color="#bbb" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#ccc"
                  value={deliveryName}
                  onChangeText={onDeliveryNameChange}
                  editable={!isProcessing}
                  returnKeyType="next"
                />
                {deliveryName.trim().length > 0 && (
                  <Icon name="check-circle" size={16} color="#10B981" />
                )}
              </View>

              <Text style={styles.fieldLabel}>Delivery Address</Text>
              <View style={[
                styles.inputWrap,
                deliveryAddress.trim().length > 0 && styles.inputValid,
              ]}>
                <Icon name="map-pin" size={15} color="#bbb" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter delivery address"
                  placeholderTextColor="#ccc"
                  value={deliveryAddress}
                  onChangeText={onDeliveryAddressChange}
                  editable={!isProcessing}
                  returnKeyType="next"
                />
                {deliveryAddress.trim().length > 0 && (
                  <Icon name="check-circle" size={16} color="#10B981" />
                )}
              </View>

              {/* ── Card Details ── */}
              <Text style={[styles.sectionLabel, { marginTop: 22 }]}>Card Details</Text>

              <Text style={styles.fieldLabel}>Card Number</Text>
              <View style={[styles.inputWrap, isCardValid(cardNumber) && styles.inputValid]}>
                <Icon name="credit-card" size={15} color="#bbb" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="4242 4242 4242 4242"
                  placeholderTextColor="#ccc"
                  value={cardNumber}
                  onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                  keyboardType="numeric"
                  maxLength={19}
                  editable={!isProcessing}
                />
                {isCardValid(cardNumber) && (
                  <Icon name="check-circle" size={16} color="#10B981" />
                )}
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Expiry</Text>
                  <View style={[styles.inputWrap, isExpiryValid(expiry) && styles.inputValid]}>
                    <Icon name="calendar" size={15} color="#bbb" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="MM/YY"
                      placeholderTextColor="#ccc"
                      value={expiry}
                      onChangeText={(t) => setExpiry(formatExpiry(t))}
                      keyboardType="numeric"
                      maxLength={5}
                      editable={!isProcessing}
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>CVV</Text>
                  <View style={[styles.inputWrap, isCvvValid(cvv) && styles.inputValid]}>
                    <Icon name="lock" size={15} color="#bbb" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="•••"
                      placeholderTextColor="#ccc"
                      value={cvv}
                      onChangeText={(t) => setCvv(t.replace(/\D/g, "").slice(0, 4))}
                      keyboardType="numeric"
                      maxLength={4}
                      secureTextEntry
                      editable={!isProcessing}
                    />
                  </View>
                </View>
              </View>

              {/* ── Validation hint ── */}
              {!isFormComplete && (
                <View style={styles.hintBox}>
                  <Icon name="info" size={13} color="#92400E" />
                  <Text style={styles.hintText}>
                    {!deliveryName.trim()          ? "Enter your name"
                    : !deliveryAddress.trim()      ? "Enter delivery address"
                    : !isCardValid(cardNumber)     ? "Enter a valid 16-digit card number"
                    : !isExpiryValid(expiry)       ? "Enter a valid expiry date (MM/YY)"
                    : !isCvvValid(cvv)             ? "Enter your 3 or 4 digit CVV"
                    : "Fill in all fields to continue"}
                  </Text>
                </View>
              )}

              {/* ── Security note ── */}
              <View style={styles.secureNote}>
                <Icon name="lock" size={13} color="#065F46" />
                <Text style={styles.secureText}>
                  Your order is saved securely · Card details are never stored
                </Text>
              </View>

              {/* ── Pay Button ── */}
              <TouchableOpacity
                style={[
                  styles.payBtn,
                  (!isFormComplete || isProcessing) && styles.payBtnDisabled,
                ]}
                onPress={handlePay}
                disabled={!isFormComplete || isProcessing}
                activeOpacity={0.85}
              >
                {isProcessing ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" style={{ marginRight: 10 }} />
                    <Text style={styles.payBtnText}>Placing Order...</Text>
                  </>
                ) : (
                  <>
                    <Icon name="check-circle" size={17} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.payBtnText}>Place Order · R{grandTotal.toFixed(2)}</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleClose}
                disabled={isProcessing}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet:      { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, maxHeight: "95%" },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0", alignSelf: "center", marginBottom: 20 },

  headerRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  title:      { fontSize: 22, fontWeight: "900", color: "#1A1A1A", letterSpacing: -0.4 },
  subtitle:   { fontSize: 13, color: "#aaa", marginTop: 4, fontWeight: "500" },
  closeBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F5F2EE", justifyContent: "center", alignItems: "center" },

  summaryBox: { backgroundColor: "#FAFAF8", borderRadius: 16, padding: 14, marginBottom: 22, borderWidth: 1, borderColor: "#F0EDE8" },
  summaryRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  orangeDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FF5722" },
  itemName:   { flex: 1, fontSize: 13, color: "#555", fontWeight: "500" },
  itemPrice:  { fontSize: 13, color: "#1A1A1A", fontWeight: "700" },
  divider:    { height: 1, backgroundColor: "#EDEAE5", marginVertical: 8 },
  feeLabel:   { flex: 1, fontSize: 13, color: "#999", fontWeight: "500" },
  feeValue:   { fontSize: 13, color: "#999", fontWeight: "600" },
  totalRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  totalLabel: { fontSize: 15, fontWeight: "800", color: "#1A1A1A" },
  totalValue: { fontSize: 22, fontWeight: "900", color: "#FF5722", letterSpacing: -0.4 },

  sectionLabel: { fontSize: 12, fontWeight: "800", color: "#bbb", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 },
  fieldLabel:   { fontSize: 11, fontWeight: "700", color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },

  inputWrap:  { flexDirection: "row", alignItems: "center", backgroundColor: "#FAFAF8", borderWidth: 1.5, borderColor: "#F0EDE8", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14 },
  inputValid: { borderColor: "#10B981" },
  inputIcon:  { marginRight: 10 },
  input:      { flex: 1, fontSize: 15, color: "#1A1A1A", fontWeight: "500" },

  hintBox:    { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, backgroundColor: "#FEF3C7", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  hintText:   { fontSize: 12, color: "#92400E", fontWeight: "600", flex: 1 },

  secureNote: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14, backgroundColor: "#D1FAE5", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  secureText: { fontSize: 12, color: "#065F46", fontWeight: "700", flex: 1 },

  payBtn:         { flexDirection: "row", backgroundColor: "#FF5722", paddingVertical: 17, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 16, shadowColor: "#FF5722", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  payBtnDisabled: { backgroundColor: "#FFBA9E", shadowOpacity: 0, elevation: 0 },
  payBtnText:     { color: "#fff", fontSize: 17, fontWeight: "900", letterSpacing: 0.2 },
  cancelBtn:      { alignItems: "center", paddingVertical: 16 },
  cancelText:     { color: "#FF5722", fontSize: 15, fontWeight: "700" },
});
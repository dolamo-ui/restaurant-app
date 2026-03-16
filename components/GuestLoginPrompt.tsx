/**
 * GuestLoginPrompt.tsx
 * Animated bottom sheet shown when a GUEST taps "Proceed to Checkout"
 * Cart is preserved — nothing is lost when they sign in.
 */
import React, { useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, Animated, Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, Href } from "expo-router";

const { height } = Dimensions.get("window");

interface GuestLoginPromptProps {
  visible:   boolean;
  onClose:   () => void;
  itemCount: number;
}

export default function GuestLoginPrompt({ visible, onClose, itemCount }: GuestLoginPromptProps) {
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : height,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [visible]);

  const goTo = (route: string) => {
    onClose();
    setTimeout(() => router.push(route as Href), 300);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Dimmed backdrop */}
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      {/* Sliding sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.handle} />

        {/* Cart reminder badge */}
        <View style={styles.cartBadge}>
          <View style={styles.cartBadgeIcon}>
            <Feather name="shopping-bag" size={20} color="#FF5722" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cartBadgeTitle}>
              {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
            </Text>
            <Text style={styles.cartBadgeSub}>
              Sign in to complete your order — your cart will be saved
            </Text>
          </View>
        </View>

        {/* Heading */}
        <Text style={styles.title}>Almost there! 🍽️</Text>
        <Text style={styles.subtitle}>
          Create a free account or sign in to place your order, track delivery, and earn rewards.
        </Text>

        {/* Perks */}
        <View style={styles.perks}>
          {[
            { icon: "map-pin",   text: "Track your order in real-time"  },
            { icon: "clock",     text: "Order history & easy reordering" },
            { icon: "tag",       text: "Exclusive deals for members"     },
          ].map((p) => (
            <View key={p.text} style={styles.perk}>
              <View style={styles.perkIcon}>
                <Feather name={p.icon as any} size={13} color="#FF5722" />
              </View>
              <Text style={styles.perkText}>{p.text}</Text>
            </View>
          ))}
        </View>

        {/* CTA buttons */}
        <TouchableOpacity style={styles.primaryBtn} onPress={() => goTo("/register")} activeOpacity={0.85}>
          <Feather name="user-plus" size={17} color="#fff" />
          <Text style={styles.primaryBtnText}>Create Free Account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => goTo("/login")} activeOpacity={0.85}>
          <Feather name="log-in" size={17} color="#FF5722" />
          <Text style={styles.secondaryBtnText}>Sign In to Existing Account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelBtnText}>Continue Browsing</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },

  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 44, paddingTop: 12,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#E0E0E0", alignSelf: "center", marginBottom: 22,
  },

  // Cart badge
  cartBadge: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#FFF3EE", borderRadius: 14, padding: 14,
    marginBottom: 22, borderWidth: 1, borderColor: "#FFD5C2",
  },
  cartBadgeIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#FFE8DE", justifyContent: "center", alignItems: "center",
  },
  cartBadgeTitle: { fontSize: 14, fontWeight: "800", color: "#1A1A1A" },
  cartBadgeSub:   { fontSize: 12, color: "#888", fontWeight: "500", marginTop: 2 },

  // Text
  title:    { fontSize: 24, fontWeight: "900", color: "#1A1A1A", letterSpacing: -0.4, marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#888", lineHeight: 20, marginBottom: 20 },

  // Perks
  perks: { gap: 10, marginBottom: 26 },
  perk:  { flexDirection: "row", alignItems: "center", gap: 10 },
  perkIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: "#FFF0EB", justifyContent: "center", alignItems: "center",
  },
  perkText: { fontSize: 13, color: "#555", fontWeight: "500" },

  // Buttons
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "#FF5722", borderRadius: 16, paddingVertical: 16, marginBottom: 12,
    shadowColor: "#FF5722", shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  secondaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "#FFF3EE", borderRadius: 16, paddingVertical: 16, marginBottom: 6,
    borderWidth: 1.5, borderColor: "#FF5722",
  },
  secondaryBtnText: { color: "#FF5722", fontSize: 16, fontWeight: "700" },

  cancelBtn:     { alignItems: "center", paddingVertical: 12 },
  cancelBtnText: { color: "#aaa", fontSize: 14, fontWeight: "600" },
});
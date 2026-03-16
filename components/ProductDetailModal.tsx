/**
 * ProductDetailModal.tsx
 *
 * A stunning product detail bottom sheet with:
 * - Large hero image with gradient overlay
 * - Item name, description, rating, tags
 * - Extra add-ons (customisations) with multi-select
 * - Quantity selector
 * - Special instructions text input
 * - Animated entrance / dismissal
 * - Total price updates live as you pick extras
 */

import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

const { width, height } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────
type MenuItem = {
  id: string;
  name: string;
  price: string;
  category?: string;
  description?: string;
  image?: string;
  status?: string;
  tags?: string[];
};

type Extra = {
  id: string;
  label: string;
  price: number;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  extras?: Extra[];
  note?: string;
};

interface ProductDetailModalProps {
  item: MenuItem | null;
  visible: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

// ─── Extra add-ons per category ───────────────────────────────────────────────
const EXTRAS_BY_CATEGORY: Record<string, Extra[]> = {
  "Street Eats": [
    { id: "e1", label: "Extra Sauce",     price: 5  },
    { id: "e2", label: "Jalapeños",       price: 8  },
    { id: "e3", label: "Cheese Slice",    price: 12 },
    { id: "e4", label: "Double Protein",  price: 25 },
    { id: "e5", label: "Crispy Onions",   price: 8  },
  ],
  "Comfort Classics": [
    { id: "c1", label: "Extra Gravy",     price: 10 },
    { id: "c2", label: "Side Coleslaw",   price: 18 },
    { id: "c3", label: "Garlic Bread",    price: 15 },
    { id: "c4", label: "Cheese Sauce",    price: 12 },
  ],
  "Global Bowls": [
    { id: "g1", label: "Extra Rice",      price: 10 },
    { id: "g2", label: "Avocado",         price: 20 },
    { id: "g3", label: "Poached Egg",     price: 15 },
    { id: "g4", label: "Chilli Flakes",   price: 5  },
  ],
  "Plant Forward": [
    { id: "p1", label: "Vegan Cheese",    price: 15 },
    { id: "p2", label: "Extra Hummus",    price: 12 },
    { id: "p3", label: "Hemp Seeds",      price: 10 },
    { id: "p4", label: "Cashew Cream",    price: 18 },
  ],
  "Seafood & Grill": [
    { id: "s1", label: "Lemon Butter",    price: 8  },
    { id: "s2", label: "Tartare Sauce",   price: 8  },
    { id: "s3", label: "Grilled Veggies", price: 20 },
    { id: "s4", label: "Garlic Aioli",    price: 10 },
  ],
  "Desserts & Drinks": [
    { id: "d1", label: "Extra Scoop",     price: 18 },
    { id: "d2", label: "Caramel Drizzle", price: 10 },
    { id: "d3", label: "Whipped Cream",   price: 8  },
    { id: "d4", label: "Chocolate Sauce", price: 10 },
  ],
  default: [
    { id: "x1", label: "Extra Portion",  price: 20 },
    { id: "x2", label: "Side Salad",     price: 22 },
    { id: "x3", label: "Soft Drink",     price: 18 },
    { id: "x4", label: "Garlic Bread",   price: 15 },
  ],
};

// ─── Tag colours ──────────────────────────────────────────────────────────────
const TAG_STYLES: Record<string, { bg: string; color: string }> = {
  "Popular":     { bg: "#FEF3C7", color: "#B45309" },
  "Spicy":       { bg: "#FEE2E2", color: "#DC2626" },
  "Vegan":       { bg: "#D1FAE5", color: "#065F46" },
  "Vegetarian":  { bg: "#DCFCE7", color: "#166534" },
  "New":         { bg: "#EDE9FE", color: "#7C3AED" },
  "Combo":       { bg: "#DBEAFE", color: "#1D4ED8" },
  "Chef's Pick": { bg: "#FFE0D6", color: "#C2410C" },
  "Gluten Free": { bg: "#FDF4FF", color: "#9333EA" },
};

// ─── Extra toggle chip ────────────────────────────────────────────────────────
function ExtraChip({
  extra,
  selected,
  onToggle,
}: {
  extra: Extra;
  selected: boolean;
  onToggle: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.93, useNativeDriver: true, tension: 300, friction: 10 }),
      Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 10 }),
    ]).start();
    onToggle();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.extraChip, selected && styles.extraChipSelected]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <View style={[styles.extraCheckBox, selected && styles.extraCheckBoxSelected]}>
          {selected && <Icon name="check" size={11} color="#fff" />}
        </View>
        <Text style={[styles.extraLabel, selected && styles.extraLabelSelected]}>
          {extra.label}
        </Text>
        <Text style={[styles.extraPrice, selected && styles.extraPriceSelected]}>
          +R{extra.price}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function ProductDetailModal({
  item,
  visible,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const [quantity, setQuantity]         = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set());
  const [note, setNote]                 = useState("");
  const [noteVisible, setNoteVisible]   = useState(false);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const addBtnScale = useRef(new Animated.Value(1)).current;

  // Reset state when item changes
  useEffect(() => {
    if (item) {
      setQuantity(1);
      setSelectedExtras(new Set());
      setNote("");
      setNoteVisible(false);
    }
  }, [item?.id]);

  // Animate in/out
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: height, duration: 300, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!item) return null;

  const basePrice  = parseFloat(item.price || "0");
  const availableExtras =
    EXTRAS_BY_CATEGORY[item.category || ""] || EXTRAS_BY_CATEGORY.default;
  const extrasArr  = Array.from(selectedExtras)
    .map((id) => availableExtras.find((e) => e.id === id))
    .filter(Boolean) as Extra[];
  const extrasTotal = extrasArr.reduce((sum, e) => sum + e.price, 0);
  const totalPrice  = (basePrice + extrasTotal) * quantity;

  const toggleExtra = (id: string) => {
    setSelectedExtras((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Get tags based on category
  const autoTags: string[] = [];
  if (item.category === "Plant Forward") autoTags.push("Vegan", "Vegetarian");
  if (item.category === "Street Eats")   autoTags.push("Popular");
  if (item.category === "Desserts & Drinks") autoTags.push("New");
  const tags = [...(item.tags || []), ...autoTags].slice(0, 3);

  const handleAddToCart = () => {
    // Button bounce
    Animated.sequence([
      Animated.spring(addBtnScale, { toValue: 0.95, useNativeDriver: true, tension: 200, friction: 8 }),
      Animated.spring(addBtnScale, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 8 }),
    ]).start();

    onAddToCart({
      id:       item.id,
      name:     item.name,
      price:    (basePrice + extrasTotal),
      quantity,
      image:    item.image,
      extras:   extrasArr,
      note:     note.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>

      {/* ── Backdrop ─────────────────────────────────────────── */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropAnim }]}
      >
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* ── Sheet ────────────────────────────────────────────── */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>

        {/* ── Hero image ──────────────────────────────────────── */}
        <View style={styles.heroWrap}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Icon name="image" size={52} color="#333" />
            </View>
          )}

          {/* Gradient overlay */}
          <View style={styles.heroGradient} />

          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.85}>
            <Icon name="x" size={18} color="#1A1A1A" />
          </TouchableOpacity>

          {/* Tags overlaid on image */}
          {tags.length > 0 && (
            <View style={styles.tagsOnImage}>
              {tags.map((tag) => {
                const ts = TAG_STYLES[tag] || { bg: "#F0EDE8", color: "#555" };
                return (
                  <View key={tag} style={[styles.tag, { backgroundColor: ts.bg }]}>
                    <Text style={[styles.tagText, { color: ts.color }]}>{tag}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Category badge */}
          {item.category && (
            <View style={styles.catBadgeOnImage}>
              <Icon name={(
                item.category === "Plant Forward" ? "feather" :
                item.category === "Street Eats"   ? "zap"     :
                item.category === "Desserts & Drinks" ? "coffee" : "tag"
              ) as any} size={12} color="#FF5722" />
              <Text style={styles.catBadgeText}>{item.category}</Text>
            </View>
          )}
        </View>

        {/* ── Scrollable content ──────────────────────────────── */}
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.contentPad}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name + base price */}
          <View style={styles.nameRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.basePrice}>R{basePrice.toFixed(2)}</Text>
          </View>

          {/* Description */}
          {item.description ? (
            <Text style={styles.description}>{item.description}</Text>
          ) : (
            <Text style={styles.description}>
              A carefully prepared dish made with fresh, quality ingredients. Enjoy every bite!
            </Text>
          )}

          {/* Quick info pills */}
          <View style={styles.infoPills}>
            <View style={styles.infoPill}>
              <Icon name="clock" size={12} color="#FF5722" />
              <Text style={styles.infoPillText}>15–25 min</Text>
            </View>
            <View style={styles.infoPill}>
              <Icon name="star" size={12} color="#FF5722" />
              <Text style={styles.infoPillText}>4.8 (124)</Text>
            </View>
            <View style={styles.infoPill}>
              <Icon name="zap" size={12} color="#FF5722" />
              <Text style={styles.infoPillText}>Fresh daily</Text>
            </View>
          </View>

          {/* ── Divider ──────────────────────────────────────── */}
          <View style={styles.sectionDivider} />

          {/* ── Extras ───────────────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIconWrap}>
                <Icon name="plus-circle" size={16} color="#FF5722" />
              </View>
              <Text style={styles.sectionTitle}>Add Extras</Text>
              <Text style={styles.sectionOptional}>Optional</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Customise your order to perfection</Text>
          </View>

          <View style={styles.extrasGrid}>
            {availableExtras.map((extra) => (
              <ExtraChip
                key={extra.id}
                extra={extra}
                selected={selectedExtras.has(extra.id)}
                onToggle={() => toggleExtra(extra.id)}
              />
            ))}
          </View>

          {/* ── Divider ──────────────────────────────────────── */}
          <View style={styles.sectionDivider} />

          {/* ── Quantity ─────────────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIconWrap}>
                <Icon name="hash" size={16} color="#FF5722" />
              </View>
              <Text style={styles.sectionTitle}>Quantity</Text>
            </View>
          </View>

          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={[styles.qtyBtn, quantity <= 1 && styles.qtyBtnDisabled]}
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              activeOpacity={0.8}
            >
              <Icon name="minus" size={18} color={quantity <= 1 ? "#ccc" : "#1A1A1A"} />
            </TouchableOpacity>

            <View style={styles.qtyDisplay}>
              <Text style={styles.qtyValue}>{quantity}</Text>
            </View>

            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity((q) => q + 1)}
              activeOpacity={0.8}
            >
              <Icon name="plus" size={18} color="#1A1A1A" />
            </TouchableOpacity>
          </View>

          {/* ── Special instructions ─────────────────────────── */}
          <View style={styles.sectionDivider} />

          <TouchableOpacity
            style={styles.noteToggle}
            onPress={() => setNoteVisible((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIconWrap}>
                <Icon name="edit-3" size={16} color="#FF5722" />
              </View>
              <Text style={styles.sectionTitle}>Special Instructions</Text>
              <Text style={styles.sectionOptional}>Optional</Text>
            </View>
            <Icon name={noteVisible ? "chevron-up" : "chevron-down"} size={18} color="#bbb" />
          </TouchableOpacity>

          {noteVisible && (
            <TextInput
              placeholder="E.g. No onions, extra crispy, sauce on the side..."
              placeholderTextColor="#ccc"
              value={note}
              onChangeText={setNote}
              multiline
              style={styles.noteInput}
              maxLength={160}
            />
          )}

          {/* ── Price breakdown ───────────────────────────────── */}
          {selectedExtras.size > 0 && (
            <View style={styles.priceBreakdown}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Base price × {quantity}</Text>
                <Text style={styles.priceVal}>R{(basePrice * quantity).toFixed(2)}</Text>
              </View>
              {extrasArr.map((e) => (
                <View key={e.id} style={styles.priceRow}>
                  <Text style={styles.priceLabel}>{e.label} × {quantity}</Text>
                  <Text style={styles.priceVal}>R{(e.price * quantity).toFixed(2)}</Text>
                </View>
              ))}
              <View style={[styles.priceRow, styles.priceTotalRow]}>
                <Text style={styles.priceTotalLabel}>Total</Text>
                <Text style={styles.priceTotalVal}>R{totalPrice.toFixed(2)}</Text>
              </View>
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* ── Sticky Add to Cart footer ────────────────────────── */}
        <View style={styles.footer}>
          <View style={styles.footerTotal}>
            <Text style={styles.footerTotalLabel}>Total</Text>
            <Text style={styles.footerTotalValue}>R{totalPrice.toFixed(2)}</Text>
          </View>

          <Animated.View style={[styles.addBtnWrap, { transform: [{ scale: addBtnScale }] }]}>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={handleAddToCart}
              activeOpacity={0.88}
            >
              <Icon name="shopping-cart" size={18} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.addBtnText}>Add to Cart</Text>
              <View style={styles.addBtnQtyBadge}>
                <Text style={styles.addBtnQtyText}>{quantity}</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: height * 0.92,
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
  },

  // Hero
  heroWrap: {
    width: "100%",
    height: 240,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    // Simulated gradient
    backgroundColor: "transparent",
    borderBottomLeftRadius: 0,
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.92)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  tagsOnImage: {
    position: "absolute",
    bottom: 14,
    left: 16,
    flexDirection: "row",
    gap: 7,
    flexWrap: "wrap",
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  catBadgeOnImage: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  catBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  // Content
  contentScroll: { flex: 1 },
  contentPad: { paddingHorizontal: 20, paddingTop: 20 },

  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 12,
  },
  itemName: {
    flex: 1,
    fontSize: 22,
    fontWeight: "900",
    color: "#1A1A1A",
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  basePrice: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FF5722",
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 14,
    color: "#888",
    lineHeight: 22,
    marginBottom: 16,
  },
  infoPills: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFF0EB",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  infoPillText: {
    fontSize: 12,
    color: "#FF5722",
    fontWeight: "700",
  },

  // Section
  sectionDivider: {
    height: 1,
    backgroundColor: "#F5F2EE",
    marginVertical: 20,
  },
  sectionHeader: { marginBottom: 14 },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFF0EB",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.2,
  },
  sectionOptional: {
    fontSize: 11,
    color: "#bbb",
    fontWeight: "600",
    backgroundColor: "#F5F2EE",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#aaa",
    marginLeft: 42,
    lineHeight: 18,
  },

  // Extras
  extrasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  extraChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FAFAF8",
    borderWidth: 1.5,
    borderColor: "#E8E4DF",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  extraChipSelected: {
    backgroundColor: "#FFF0EB",
    borderColor: "#FF5722",
  },
  extraCheckBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#D0CCC7",
    justifyContent: "center",
    alignItems: "center",
  },
  extraCheckBoxSelected: {
    backgroundColor: "#FF5722",
    borderColor: "#FF5722",
  },
  extraLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
  },
  extraLabelSelected: {
    color: "#1A1A1A",
    fontWeight: "700",
  },
  extraPrice: {
    fontSize: 12,
    color: "#aaa",
    fontWeight: "600",
  },
  extraPriceSelected: {
    color: "#FF5722",
    fontWeight: "700",
  },

  // Quantity
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  qtyBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F5F2EE",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E8E4DF",
  },
  qtyBtnDisabled: {
    backgroundColor: "#FAFAF8",
    borderColor: "#F0EDE8",
  },
  qtyDisplay: {
    width: 72,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
  },

  // Note
  noteToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noteInput: {
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: "#F0EDE8",
    borderRadius: 16,
    padding: 14,
    fontSize: 14,
    color: "#1A1A1A",
    backgroundColor: "#FAFAF8",
    minHeight: 90,
    textAlignVertical: "top",
    lineHeight: 22,
  },

  // Price breakdown
  priceBreakdown: {
    backgroundColor: "#FAFAF8",
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#F0EDE8",
    gap: 8,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priceLabel: { fontSize: 13, color: "#888", fontWeight: "500" },
  priceVal:   { fontSize: 13, color: "#555", fontWeight: "700" },
  priceTotalRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EDEAE5",
    marginTop: 4,
  },
  priceTotalLabel: { fontSize: 15, fontWeight: "800", color: "#1A1A1A" },
  priceTotalVal:   { fontSize: 18, fontWeight: "900", color: "#FF5722", letterSpacing: -0.4 },

  // Footer
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: "#F5F2EE",
    backgroundColor: "#fff",
    gap: 14,
  },
  footerTotal: { alignItems: "flex-start" },
  footerTotalLabel: {
    fontSize: 11,
    color: "#bbb",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  footerTotalValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1A1A1A",
    letterSpacing: -0.5,
  },
  addBtnWrap: { flex: 1 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5722",
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: "#FF5722",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  addBtnQtyBadge: {
    marginLeft: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnQtyText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },
});
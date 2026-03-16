import React, { useRef, useState } from "react";
import {
  View, Text, Image, TouchableOpacity,
  TextInput, StyleSheet, Animated,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  extras?: { id: string; label: string; price: number }[];
  note?: string;
};

interface CartItemProps {
  item: CartItem;
  onRemove: (id: string) => void;
  onChangeQuantity: (id: string, delta: number) => void;
  onUpdateNote?: (id: string, note: string) => void;
}

export default function CartItemComponent({
  item,
  onRemove,
  onChangeQuantity,
  onUpdateNote,
}: CartItemProps) {
  const [editingNote, setEditingNote] = useState(false);
  const [noteValue, setNoteValue]     = useState(item.note || "");
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const deleteAnim = useRef(new Animated.Value(1)).current;

  const itemBase  = item.price;
  const itemTotal = itemBase * item.quantity;

  const bounce = (scale: number) =>
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: scale, useNativeDriver: true, tension: 300, friction: 10 }),
      Animated.spring(scaleAnim, { toValue: 1,     useNativeDriver: true, tension: 300, friction: 10 }),
    ]).start();

  const handleRemove = () => {
    Animated.timing(deleteAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() =>
      onRemove(item.id)
    );
  };

  const handleMinus = () => {
    bounce(0.92);
    onChangeQuantity(item.id, -1);
  };

  const handlePlus = () => {
    bounce(1.08);
    onChangeQuantity(item.id, 1);
  };

  const saveNote = () => {
    setEditingNote(false);
    onUpdateNote?.(item.id, noteValue.trim());
  };

  return (
    <Animated.View style={[styles.card, { opacity: deleteAnim, transform: [{ scale: deleteAnim }] }]}>

      {/* ── Main row ── */}
      <View style={styles.row}>

        {/* Image */}
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.img} />
        ) : (
          <View style={styles.imgPlaceholder}>
            <Icon name="image" size={22} color="#ccc" />
          </View>
        )}

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>

          {/* Extras summary */}
          {item.extras && item.extras.length > 0 && (
            <Text style={styles.extrasText} numberOfLines={1}>
              + {item.extras.map(e => e.label).join(", ")}
            </Text>
          )}

          {/* Unit price */}
          <Text style={styles.unitPrice}>R{itemBase.toFixed(2)} each</Text>
        </View>

        {/* Delete */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleRemove} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="trash-2" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* ── Controls row ── */}
      <View style={styles.controlsRow}>

        {/* Quantity stepper */}
        <Animated.View style={[styles.stepper, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity
            style={[styles.stepBtn, item.quantity <= 1 && styles.stepBtnDisabled]}
            onPress={handleMinus}
            activeOpacity={0.8}
          >
            <Icon name={item.quantity <= 1 ? "trash-2" : "minus"} size={14} color={item.quantity <= 1 ? "#EF4444" : "#1A1A1A"} />
          </TouchableOpacity>

          <View style={styles.qtyBox}>
            <Text style={styles.qtyText}>{item.quantity}</Text>
          </View>

          <TouchableOpacity style={styles.stepBtn} onPress={handlePlus} activeOpacity={0.8}>
            <Icon name="plus" size={14} color="#1A1A1A" />
          </TouchableOpacity>
        </Animated.View>

        {/* Line total */}
        <View style={styles.totalWrap}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>R{itemTotal.toFixed(2)}</Text>
        </View>
      </View>

      {/* ── Note row ── */}
      <View style={styles.noteRow}>
        {editingNote ? (
          <View style={styles.noteEditWrap}>
            <TextInput
              style={styles.noteInput}
              value={noteValue}
              onChangeText={setNoteValue}
              placeholder="E.g. No onions, extra sauce…"
              placeholderTextColor="#ccc"
              multiline
              maxLength={120}
              autoFocus
            />
            <TouchableOpacity style={styles.noteSaveBtn} onPress={saveNote} activeOpacity={0.8}>
              <Icon name="check" size={14} color="#fff" />
              <Text style={styles.noteSaveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.noteToggle} onPress={() => setEditingNote(true)} activeOpacity={0.75}>
            <Icon name={noteValue ? "edit-2" : "plus"} size={12} color="#FF5722" />
            <Text style={styles.noteToggleText}>
              {noteValue ? noteValue : "Add note"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0EDE8",
    overflow: "hidden",
    shadowColor: "#1A1A1A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Main row
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    gap: 12,
  },
  img: {
    width: 64,
    height: 64,
    borderRadius: 12,
    flexShrink: 0,
  },
  imgPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#F5F2EE",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  extrasText: {
    fontSize: 11,
    color: "#FF5722",
    fontWeight: "600",
  },
  unitPrice: {
    fontSize: 12,
    color: "#aaa",
    fontWeight: "500",
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  // Controls
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 12,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F2EE",
    borderRadius: 50,
    padding: 4,
    gap: 2,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 50,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  stepBtnDisabled: {
    backgroundColor: "#FEE2E2",
  },
  qtyBox: {
    width: 36,
    alignItems: "center",
  },
  qtyText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1A1A1A",
    letterSpacing: -0.3,
  },
  totalWrap: {
    alignItems: "flex-end",
  },
  totalLabel: {
    fontSize: 10,
    color: "#bbb",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FF5722",
    letterSpacing: -0.4,
  },

  // Note
  noteRow: {
    borderTopWidth: 1,
    borderTopColor: "#F5F2EE",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  noteToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  noteToggleText: {
    fontSize: 12,
    color: "#FF5722",
    fontWeight: "600",
    flexShrink: 1,
  },
  noteEditWrap: {
    gap: 8,
  },
  noteInput: {
    backgroundColor: "#FAFAF8",
    borderWidth: 1.5,
    borderColor: "#FFD5C2",
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    color: "#1A1A1A",
    minHeight: 60,
    textAlignVertical: "top",
    lineHeight: 20,
  },
  noteSaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FF5722",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: "flex-end",
  },
  noteSaveBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});
import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Feather";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

interface CartItemProps {
  item: CartItem;
  onRemove: (id: string) => void;
  onChangeQuantity: (id: string, delta: number) => void;
}

export default function CartItemComponent({ item, onRemove, onChangeQuantity }: CartItemProps) {
  const itemTotal = item.price * item.quantity;

  return (
    <View style={styles.cartItemCard}>
      <View style={styles.cartItemRow}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.cartItemImage} />
        ) : (
          <View style={styles.cartItemImagePlaceholder}>
            <Icon name="image" size={24} color="#888" />
          </View>
        )}
        
        <View style={styles.cartItemInfo}>
          <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cartItemPrice}>R{itemTotal.toFixed(2)}</Text>
        </View>

        <Pressable onPress={() => onRemove(item.id)} style={styles.removeButton}>
          <Icon name="trash-2" size={18} color="#DC3545" />
        </Pressable>
      </View>

      <View style={styles.quantityRow}>
        <Pressable
          onPress={() => onChangeQuantity(item.id, -1)}
          style={styles.quantityButton}
        >
          <Icon name="minus" size={18} color="#111" />
        </Pressable>
        <Text style={styles.quantityValue}>{item.quantity}</Text>
        <Pressable
          onPress={() => onChangeQuantity(item.id, 1)}
          style={styles.quantityButton}
        >
          <Icon name="plus" size={18} color="#111" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cartItemCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cartItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  cartItemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  cartItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ff6b00",
    marginTop: 4,
  },
  removeButton: {
    padding: 8,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: "center",
  },
});
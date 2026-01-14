import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Feather";

type MenuItem = {
  id: string;
  name: string;
  price: string;
  category?: string;
  description?: string;
  image?: string;
  status?: string;
};

interface FoodItemProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

export default function FoodItem({ item, onAddToCart }: FoodItemProps) {
  return (
    <View style={styles.card}>
      <View style={styles.foodImage}>
        {item.image ? (
          <Image 
            source={{ uri: item.image }} 
            style={{ width: 100, height: 100, borderRadius: 8 }} 
          />
        ) : (
          <Icon name="image" size={32} color="#888" />
        )}
      </View>
      <View style={styles.foodInfo}>
        <View>
          <Text style={styles.foodTitle}>{item.name}</Text>
          <Text style={styles.foodDesc}>{item.description}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.price}>R{parseFloat(item.price || "0").toFixed(2)}</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => onAddToCart(item)}>
            <Icon name="plus" color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { 
    flexDirection: "row", 
    padding: 12, 
    backgroundColor: "#f4f4f4", 
    borderRadius: 12, 
    marginBottom: 12,
  },
  foodImage: { 
    width: 100, 
    height: 100, 
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    justifyContent: "center", 
    alignItems: "center", 
    marginRight: 12,
  },
  foodInfo: { flex: 1, justifyContent: "space-between" },
  foodTitle: { fontSize: 16, fontWeight: "700" },
  foodDesc: { color: "#666", marginVertical: 4, fontSize: 13 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  price: { fontWeight: "700", fontSize: 16, color: "#111" },
  addBtn: { backgroundColor: "#ff6b00", padding: 8, borderRadius: 8 },
});
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import FoodItem from "./FoodItem";

type MenuItem = {
  id: string;
  name: string;
  price: string;
  category?: string;
  description?: string;
  image?: string;
  status?: string;
};

interface HomeTabProps {
  menuItems: MenuItem[];
  categories: { id: string; name: string }[];
  selectedCategory: string | null;
  loadingMenu: boolean;
  onSelectCategory: (category: string | null) => void;
  onAddToCart: (item: MenuItem) => void;
}

export default function HomeTab({
  menuItems,
  categories,
  selectedCategory,
  loadingMenu,
  onSelectCategory,
  onAddToCart,
}: HomeTabProps) {
  const filteredItems = selectedCategory
    ? menuItems.filter((i) => i.category === selectedCategory)
    : menuItems;

  return (
    <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
      <Text style={styles.header}>FoodHub</Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categories}
      >
        <TouchableOpacity
          style={[styles.chip, selectedCategory === null && styles.chipActive]}
          onPress={() => onSelectCategory(null)}
        >
          <Text style={selectedCategory === null ? styles.chipTextActive : undefined}>
            All
          </Text>
        </TouchableOpacity>
        {categories.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.chip, selectedCategory === c.name && styles.chipActive]}
            onPress={() => onSelectCategory(c.name)}
          >
            <Text style={selectedCategory === c.name ? styles.chipTextActive : undefined}>
              {c.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loadingMenu ? (
        <ActivityIndicator size="large" color="#ff6b00" style={{ marginTop: 40 }} />
      ) : filteredItems.length === 0 ? (
        <View style={styles.centered}>
          <Icon name="coffee" size={64} color="#888" />
          <Text>No Menu Items</Text>
          <Text>The menu is empty.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={({ item }) => <FoodItem item={item} onAddToCart={onAddToCart} />}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 32, fontWeight: "700", marginBottom: 16 },
  categories: { flexDirection: "row", marginBottom: 16 },
  chip: { 
    padding: 8, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: "#ccc", 
    marginRight: 8 
  },
  chipActive: { backgroundColor: "#ff6b00", borderColor: "#ff6b00" },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  centered: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 32 
  },
});
import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  image?: string;
  status?: string;
  createdAt?: any;
  updatedAt?: any;
};

interface MenuItemCardProps {
  item: MenuItem;
  isEditing: boolean;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  formatZAR: (value: number) => string;
}

export default function MenuItemCard({
  item,
  isEditing,
  onEdit,
  onDelete,
  formatZAR,
}: MenuItemCardProps) {
  return (
    <View style={styles.menuItem}>
      <View style={styles.menuItemHeader}>
        <View style={styles.menuItemInfo}>
          <Text style={styles.menuItemName}>{item.name}</Text>
          <Text style={styles.menuItemPrice}>{formatZAR(item.price)}</Text>
          <Text style={styles.menuItemCategory}>{item.category}</Text>
          {item.description ? (
            <Text style={styles.menuItemDescription} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          {isEditing && (
            <View style={styles.editingBadge}>
              <Feather name="edit-2" size={12} color="#007bff" />
              <Text style={styles.editingText}>Currently editing this item</Text>
            </View>
          )}
        </View>

        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.menuItemImage} />
        ) : (
          <View style={styles.menuItemImagePlaceholder}>
            <Feather name="image" size={24} color="#ccc" />
          </View>
        )}
      </View>

      <View style={styles.menuItemActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => onEdit(item)}
        >
          <Feather name="edit-2" size={16} color="#007bff" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(item.id)}
        >
          <Feather name="trash-2" size={16} color="#dc3545" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  menuItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  menuItemName: {
    fontWeight: "bold",
    fontSize: 17,
    color: "#212529",
    marginBottom: 6,
  },
  menuItemPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#28a745",
    marginBottom: 4,
  },
  menuItemCategory: {
    fontSize: 13,
    color: "#6c757d",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuItemDescription: {
    color: "#6c757d",
    fontSize: 14,
    lineHeight: 20,
  },
  menuItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  menuItemImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  editingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e7f3ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: "flex-start",
    gap: 6,
    borderWidth: 1,
    borderColor: "#007bff",
  },
  editingText: {
    color: "#007bff",
    fontSize: 12,
    fontWeight: "700",
  },
  menuItemActions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: "#e7f3ff",
    borderWidth: 1,
    borderColor: "#007bff",
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#007bff",
  },
  deleteButton: {
    backgroundColor: "#f8d7da",
    borderWidth: 1,
    borderColor: "#dc3545",
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#dc3545",
  },
});
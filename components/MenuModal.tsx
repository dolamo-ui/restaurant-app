import React from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import MenuForm from "./MenuForm";
import MenuItemCard from "./MenuItemCard";

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

interface MenuModalProps {
  visible: boolean;
  menu: MenuItem[];
  form: Partial<MenuItem>;
  editingId: string | null;
  saving: boolean;
  loading: boolean;
  onClose: () => void;
  onFormChange: (updates: Partial<MenuItem>) => void;
  onPickImage: () => void;
  onSave: () => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  formatZAR: (value: number) => string;
}

export default function MenuModal({
  visible,
  menu,
  form,
  editingId,
  saving,
  loading,
  onClose,
  onFormChange,
  onPickImage,
  onSave,
  onEdit,
  onDelete,
  formatZAR,
}: MenuModalProps) {
  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.fixedHeader}>
          <Text style={styles.modalHeading}>
            {editingId ? "Edit Menu Item" : "Add Menu Item"}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          <MenuForm
            form={form}
            editingId={editingId}
            saving={saving}
            onFormChange={onFormChange}
            onPickImage={onPickImage}
            onSave={onSave}
            onCancel={onClose}
          />

          <View style={styles.menuListSection}>
            <Text style={styles.sectionHeading}>All Menu Items ({menu.length})</Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.loadingText}>Loading menu items...</Text>
              </View>
            ) : menu.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Feather name="coffee" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No menu items yet</Text>
                <Text style={styles.emptySubtext}>Add your first item above!</Text>
              </View>
            ) : (
              menu.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  isEditing={editingId === item.id}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  formatZAR={formatZAR}
                />
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  fixedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  modalContent: {
    padding: 20,
  },
  modalHeading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212529",
  },
  menuListSection: {
    marginTop: 8,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#212529",
  },
  loadingContainer: {
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: "#6c757d",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    color: "#6c757d",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    color: "#adb5bd",
    fontSize: 14,
    marginTop: 8,
  },
});
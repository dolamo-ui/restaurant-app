import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

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

interface MenuFormProps {
  form: Partial<MenuItem>;
  editingId: string | null;
  saving: boolean;
  onFormChange: (updates: Partial<MenuItem>) => void;
  onPickImage: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function MenuForm({
  form,
  editingId,
  saving,
  onFormChange,
  onPickImage,
  onSave,
  onCancel,
}: MenuFormProps) {
  return (
    <View style={styles.formSection}>
      <Text style={styles.label}>Item Name</Text>
      <TextInput
        placeholder="Enter item name"
        style={styles.input}
        value={form.name}
        onChangeText={(t) => onFormChange({ name: t })}
      />

      <Text style={styles.label}>Price (R)</Text>
      <TextInput
        placeholder="0.00"
        style={styles.input}
        keyboardType="numeric"
        value={form.price !== undefined && form.price !== null ? String(form.price) : ""}
        onChangeText={(t) => {
          const cleaned = t.replace(/[^0-9.]/g, "");
          onFormChange({ price: cleaned === "" ? 0 : Number(cleaned) });
        }}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        placeholder="Enter description"
        style={[styles.input, styles.textArea]}
        multiline
        numberOfLines={4}
        value={form.description}
        onChangeText={(t) => onFormChange({ description: t })}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={form.category}
          onValueChange={(itemValue) => onFormChange({ category: itemValue })}
          style={styles.picker}
        >
          <Picker.Item label="Street Eats" value="Street Eats" />
          <Picker.Item label="Comfort Classics" value="Comfort Classics" />
          <Picker.Item label="Global Bowls" value="Global Bowls" />
          <Picker.Item label="Plant Forward" value="Plant Forward" />
          <Picker.Item label="Seafood & Grill" value="Seafood & Grill" />
          <Picker.Item label="Small Plates & Shareables" value="Small Plates & Shareables" />
          <Picker.Item label="Desserts & Drinks" value="Desserts & Drinks" />
        </Picker>
      </View>

      <Text style={styles.label}>Image</Text>
      <TouchableOpacity style={styles.imageBtn} onPress={onPickImage}>
        <Feather name="upload" size={20} color="#007bff" />
        <Text style={styles.imageText}>{form.image ? "Change Image" : "Upload Image"}</Text>
      </TouchableOpacity>

      <TextInput
        placeholder="Or paste image URL"
        style={styles.input}
        value={form.image}
        onChangeText={(t) => onFormChange({ image: t })}
      />

      {form.image ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: form.image }} style={styles.preview} resizeMode="cover" />
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={onSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Feather name={editingId ? "save" : "plus"} size={20} color="#fff" />
            <Text style={styles.saveText}>{editingId ? "Update Item" : "Add Item"}</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  formSection: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#212529",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  imageBtn: {
    backgroundColor: "#e7f3ff",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#007bff",
    borderStyle: "dashed",
  },
  imageText: {
    fontWeight: "600",
    color: "#007bff",
    fontSize: 15,
  },
  previewContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  preview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  saveBtn: {
    backgroundColor: "#28a745",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#28a745",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  cancelBtn: {
    alignItems: "center",
    padding: 12,
  },
  cancelText: {
    color: "#6c757d",
    fontSize: 16,
    fontWeight: "600",
  },
});
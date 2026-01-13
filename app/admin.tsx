import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

import { getAuth, onAuthStateChanged, User, getIdTokenResult } from "firebase/auth";

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

export default function AdminDashboard() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [menuModal, setMenuModal] = useState(false);
  const [ordersModal, setOrdersModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);

  const [form, setForm] = useState<Partial<MenuItem>>({
    name: "",
    price: 0,
    category: "Street Eats",
    description: "",
    image: "",
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const categories = [...new Set(menu.map((m) => m.category || "Uncategorized"))];
  const totalItems = menu.length;

  useEffect(() => {
    const auth = getAuth();
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (!user) {
        setIsAdmin(false);
        return;
      }
      try {
        const idTokenResult = await getIdTokenResult(user, true);
        setIsAdmin(Boolean(idTokenResult.claims?.admin));
      } catch (err) {
        console.error("Error fetching token claims:", err);
        setIsAdmin(false);
      }
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "menuItems"),
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: MenuItem[] = snapshot.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data.name,
            price: typeof data.price === "number" ? data.price : Number(data.price) || 0,
            category: data.category || "Uncategorized",
            description: data.description || "",
            image: data.image || "",
            status: data.status,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
        });
        setMenu(items);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore onSnapshot error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedOrders = snapshot.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            status: data.status || "Pending",
            total: data.total || 0,
            createdAt: data.createdAt,
            ...data,
          };
        });

        setOrders(fetchedOrders);
      },
      (error) => {
        console.error("Firestore orders onSnapshot error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setForm((f) => ({ ...f, image: result.assets[0].uri }));
      }
    } catch (err) {
      console.error("Image picker error:", err);
      Alert.alert("Error", "Could not pick image.");
    }
  };

  const saveItem = async () => {
    if (saving) return;
    if (!form.name || form.name.trim() === "" || form.price === undefined || form.price === null) {
      Alert.alert("Error", "Name and price are required");
      return;
    }

    setSaving(true);
    try {
      const priceNumber = Number(form.price);
      if (Number.isNaN(priceNumber)) {
        Alert.alert("Error", "Price must be a valid number");
        setSaving(false);
        return;
      }

      if (editingId) {
        console.log("Updating item with ID:", editingId);
        const itemRef = doc(db, "menuItems", editingId);
        await updateDoc(itemRef, {
          name: form.name,
          price: priceNumber,
          category: form.category,
          description: form.description || "",
          image: form.image || "",
          updatedAt: serverTimestamp(),
        });
        Alert.alert("Success", "Item updated successfully!");
      } else {
        console.log("Adding new item");
        await addDoc(collection(db, "menuItems"), {
          name: form.name,
          price: priceNumber,
          category: form.category,
          description: form.description || "",
          image: form.image || "",
          status: "active",
          createdAt: serverTimestamp(),
        });
        Alert.alert("Success", "Item added successfully!");
      }

      resetForm();
    } catch (error) {
      console.error("Error saving item:", error);
      Alert.alert("Error", "Could not save item. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  const editItem = (item: MenuItem) => {
    console.log("=== EDITING ITEM ===");
    console.log("Item ID:", item.id);
    console.log("Item Data:", item);
    
    setForm({
      name: item.name,
      price: item.price,
      category: item.category || "Street Eats",
      description: item.description || "",
      image: item.image || "",
    });
    setEditingId(item.id);
    
    
    setTimeout(() => {
      setMenuModal(true);
      console.log("Modal opened, editing ID:", item.id);
    }, 100);
  };

  const deleteItem = (id: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this item?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "menuItems", id));
            if (editingId === id) {
              resetForm();
            }
            Alert.alert("Deleted", "Menu item removed.");
          } catch (error) {
            console.error("Error deleting item:", error);
            Alert.alert("Error", "Could not delete item.");
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    console.log("Resetting form");
    setForm({ name: "", price: 0, category: "Street Eats", description: "", image: "" });
    setEditingId(null);
    setMenuModal(false);
  };

  const formatZAR = (value: number) => `R${Number(value || 0).toFixed(2)}`;

  const editOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });
      Alert.alert("Success", "Order status updated.");
    } catch (error) {
      console.error("Error updating order:", error);
      Alert.alert("Error", "Could not update order.");
    }
  };

  const deleteOrder = (orderId: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this order?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "orders", orderId));
            Alert.alert("Deleted", "Order removed.");
          } catch (error) {
            console.error("Error deleting order:", error);
            Alert.alert("Error", "Could not delete order.");
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Overview</Text>
      <View style={styles.row}>
        <StatCard icon="dollar-sign" value={formatZAR(1200)} label="Revenue" />
        <StatCard icon="shopping-bag" value={String(orders.length)} label="Orders" />
      </View>

      <Text style={styles.heading}>Inventory</Text>
      <View style={styles.row}>
        <StatCard icon="grid" value={String(categories.length)} label="Categories" />
        <StatCard icon="coffee" value={String(totalItems)} label="Menu Items" />
      </View>

      <Action icon="menu" label="Manage Menu Items" onPress={() => setMenuModal(true)} />
      <Action icon="package" label="View All Orders" onPress={() => setOrdersModal(true)} />

     
      <Modal visible={menuModal} animationType="slide">
        <View style={styles.modalContainer}>
          
          <View style={styles.fixedHeader}>
            <Text style={styles.modalHeading}>
              {editingId ? "Edit Menu Item" : "Add Menu Item"}
            </Text>
            <TouchableOpacity onPress={resetForm}>
              <Feather name="x" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            
            <View style={styles.formSection}>
              <Text style={styles.label}>Item Name</Text>
              <TextInput
                placeholder="Enter item name"
                style={styles.input}
                value={form.name}
                onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
              />

              <Text style={styles.label}>Price (R)</Text>
              <TextInput
                placeholder="0.00"
                style={styles.input}
                keyboardType="numeric"
                value={form.price !== undefined && form.price !== null ? String(form.price) : ""}
                onChangeText={(t) => {
                  const cleaned = t.replace(/[^0-9.]/g, "");
                  setForm((f) => ({ ...f, price: cleaned === "" ? 0 : Number(cleaned) }));
                }}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                placeholder="Enter description"
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={4}
                value={form.description}
                onChangeText={(t) => setForm((f) => ({ ...f, description: t }))}
              />

              <Text style={styles.label}>Category</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={form.category}
                  onValueChange={(itemValue) => setForm((f) => ({ ...f, category: itemValue }))}
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
              <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
                <Feather name="upload" size={20} color="#007bff" />
                <Text style={styles.imageText}>{form.image ? "Change Image" : "Upload Image"}</Text>
              </TouchableOpacity>

              <TextInput
                placeholder="Or paste image URL"
                style={styles.input}
                value={form.image}
                onChangeText={(t) => setForm((f) => ({ ...f, image: t }))}
              />
              
              {form.image ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: form.image }} style={styles.preview} resizeMode="cover" />
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={saveItem}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Feather name={editingId ? "save" : "plus"} size={20} color="#fff" />
                    <Text style={styles.saveText}>
                      {editingId ? "Update Item" : "Add Item"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            
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
                  <View key={item.id} style={styles.menuItem}>
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
                        {editingId === item.id && (
                          <View style={styles.editingBadge}>
                            <Feather name="edit-2" size={12} color="#007bff" />
                            <Text style={styles.editingText}>Currently editing this item</Text>
                          </View>
                        )}
                      </View>

                      {item.image ? (
                        <Image
                          source={{ uri: item.image }}
                          style={styles.menuItemImage}
                        />
                      ) : (
                        <View style={styles.menuItemImagePlaceholder}>
                          <Feather name="image" size={24} color="#ccc" />
                        </View>
                      )}
                    </View>

                    <View style={styles.menuItemActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => editItem(item)}
                      >
                        <Feather name="edit-2" size={16} color="#007bff" />
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => deleteItem(item.id)}
                      >
                        <Feather name="trash-2" size={16} color="#dc3545" />
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      
      <Modal visible={ordersModal} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.fixedHeader}>
            <Text style={styles.modalHeading}>All Orders</Text>
            <TouchableOpacity onPress={() => setOrdersModal(false)}>
              <Feather name="x" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.ordersContent}>
            {orders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Feather name="package" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No orders yet</Text>
                <Text style={styles.emptySubtext}>Orders will appear here</Text>
              </View>
            ) : (
              orders.map((o) => (
                <View key={o.id} style={styles.orderItem}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderId}>#{o.id.slice(0, 8).toUpperCase()}</Text>
                    <Text style={styles.orderTotal}>{formatZAR(o.total)}</Text>
                  </View>
                  
                  <View style={styles.orderStatusContainer}>
                    <View style={[styles.statusBadge, getStatusColor(o.status)]}>
                      <Text style={styles.statusText}>{o.status}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.orderDate}>
                    {o.createdAt
                      ? typeof o.createdAt.toDate === "function"
                        ? o.createdAt.toDate().toLocaleString()
                        : o.createdAt instanceof Date
                        ? o.createdAt.toLocaleString()
                        : String(o.createdAt)
                      : "No timestamp"}
                  </Text>

                  <Text style={styles.orderActionsLabel}>Update Status:</Text>
                  <View style={styles.orderActions}>
                    <TouchableOpacity
                      style={styles.statusBtn}
                      onPress={() => editOrderStatus(o.id, "Pending")}
                    >
                      <Feather name="clock" size={18} color="#ffc107" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.statusBtn}
                      onPress={() => editOrderStatus(o.id, "In Progress")}
                    >
                      <Feather name="loader" size={18} color="#007bff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.statusBtn}
                      onPress={() => editOrderStatus(o.id, "Delivered")}
                    >
                      <Feather name="check-circle" size={18} color="#28a745" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.statusBtn}
                      onPress={() => editOrderStatus(o.id, "Cancelled")}
                    >
                      <Feather name="x-circle" size={18} color="#6c757d" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.statusBtn, styles.deleteOrderBtn]}
                      onPress={() => deleteOrder(o.id)}
                    >
                      <Feather name="trash-2" size={18} color="#dc3545" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}


const getStatusColor = (status: string) => {
  switch (status) {
    case "Pending":
      return { backgroundColor: "#fff3cd", borderColor: "#ffc107" };
    case "In Progress":
      return { backgroundColor: "#cfe2ff", borderColor: "#007bff" };
    case "Delivered":
      return { backgroundColor: "#d1e7dd", borderColor: "#28a745" };
    case "Cancelled":
      return { backgroundColor: "#f8d7da", borderColor: "#dc3545" };
    default:
      return { backgroundColor: "#e2e3e5", borderColor: "#6c757d" };
  }
};

const StatCard = ({ icon, value, label }: any) => (
  <View style={styles.card}>
    <Feather name={icon} size={24} color="#007bff" />
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.cardLabel}>{label}</Text>
  </View>
);

const Action = ({ icon, label, onPress }: any) => (
  <TouchableOpacity style={styles.action} onPress={onPress}>
    <View style={styles.actionIconContainer}>
      <Feather name={icon} size={20} color="#007bff" />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
    <Feather name="chevron-right" size={20} color="#999" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 16,
    color: "#212529",
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  value: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 12,
    color: "#212529",
  },
  cardLabel: {
    color: "#6c757d",
    fontSize: 13,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
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
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e7f3ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
  },
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
  ordersContent: {
    padding: 20,
  },
  orderItem: {
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
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderId: {
    fontWeight: "700",
    fontSize: 16,
    color: "#212529",
  },
  orderTotal: {
    fontWeight: "700",
    fontSize: 18,
    color: "#28a745",
  },
  orderStatusContainer: {
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  orderDate: {
    color: "#6c757d",
    fontSize: 12,
    marginBottom: 16,
  },
  orderActionsLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
  },
  orderActions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  statusBtn: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  deleteOrderBtn: {
    backgroundColor: "#f8d7da",
    borderColor: "#dc3545",
  },
});

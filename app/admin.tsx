import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
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

// Import components
import StatCard from "../components/StatCard";
import ActionButton from "../components/ActionButton";
import MenuModal from "../components/MenuModal";
import OrdersModal from "../components/OrdersModal";

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

  const handleFormChange = (updates: Partial<MenuItem>) => {
    setForm((prev) => ({ ...prev, ...updates }));
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

      <ActionButton
        icon="menu"
        label="Manage Menu Items"
        onPress={() => setMenuModal(true)}
      />
      <ActionButton
        icon="package"
        label="View All Orders"
        onPress={() => setOrdersModal(true)}
      />

      <MenuModal
        visible={menuModal}
        menu={menu}
        form={form}
        editingId={editingId}
        saving={saving}
        loading={loading}
        onClose={resetForm}
        onFormChange={handleFormChange}
        onPickImage={pickImage}
        onSave={saveItem}
        onEdit={editItem}
        onDelete={deleteItem}
        formatZAR={formatZAR}
      />

      <OrdersModal
        visible={ordersModal}
        orders={orders}
        onClose={() => setOrdersModal(false)}
        onUpdateStatus={editOrderStatus}
        onDelete={deleteOrder}
        formatZAR={formatZAR}
      />
    </ScrollView>
  );
}

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
});

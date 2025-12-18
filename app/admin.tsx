
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
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
    category: "Burgers",
    description: "",
    image: "",
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  
  const categories = [...new Set(menu.map((m) => m.category || "Uncategorized"))];

 
  const totalItems = menu.length;
  const categoryCounts = menu.reduce<Record<string, number>>((acc, item) => {
    const cat = item.category || "Uncategorized";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  
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
    const q = query(collection(db, "orders"));

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

        const getTime = (t: any) => {
          if (!t) return 0;
          if (typeof t.toMillis === "function") return t.toMillis();
          if (t instanceof Date) return t.getTime();
          if (typeof t === "number") return t;
          const parsed = Date.parse(String(t));
          return Number.isNaN(parsed) ? 0 : parsed;
        };

        fetchedOrders.sort((a: any, b: any) => getTime(b.createdAt) - getTime(a.createdAt));

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
        setForm({ ...form, image: result.assets[0].uri });
      }
    } catch (err) {
      console.error("Image picker error:", err);
      Alert.alert("Error", "Could not pick image.");
    }
  };

  
  const saveItem = async () => {
    // only allow save if admin (client-side guard)
    if (!isAdmin) {
      Alert.alert("Unauthorized", "Only admins can add or update menu items.");
      return;
    }

    if (!form.name || form.name.trim() === "" || form.price === undefined || form.price === null) {
      Alert.alert("Error", "Name and price are required");
      return;
    }

    try {
      const priceNumber = Number(form.price);
      if (Number.isNaN(priceNumber)) {
        Alert.alert("Error", "Price must be a valid number");
        return;
      }

      if (editingId) {
        const itemRef = doc(db, "menuItems", editingId);
        await updateDoc(itemRef, {
          name: form.name,
          price: priceNumber,
          category: form.category,
          description: form.description,
          image: form.image || "",
        });
        Alert.alert("Success", "Item updated");
      } else {
        await addDoc(collection(db, "menuItems"), {
          name: form.name,
          price: priceNumber,
          category: form.category,
          description: form.description,
          image: form.image || "",
          status: "active",
          createdAt: serverTimestamp(),
        });
        Alert.alert("Success", "Item added");
      }
      resetForm();
    } catch (error) {
      console.error("Error saving item:", error);
      Alert.alert("Error", "Could not save item. Check console for details.");
    }
  };

 
  const editItem = (item: MenuItem) => {
    if (!isAdmin) {
      Alert.alert("Unauthorized", "Only admins can edit menu items.");
      return;
    }
    setForm({
      name: item.name,
      price: item.price,
      category: item.category || "Burgers",
      description: item.description || "",
      image: item.image || "",
    });
    setEditingId(item.id);
    setMenuModal(true);
  };

  
  const deleteItem = (id: string) => {
    if (!isAdmin) {
      Alert.alert("Unauthorized", "Only admins can delete menu items.");
      return;
    }

    Alert.alert("Confirm Delete", "Are you sure you want to delete this item?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "menuItems", id));
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
    setForm({ name: "", price: 0, category: "Burgers", description: "", image: "" });
    setEditingId(null);
    setMenuModal(false);
  };

  
  const formatZAR = (value: number) => `R${Number(value || 0).toFixed(2)}`;

  return (
    <View style={styles.container}>
      
      <Text style={styles.heading}>Overview</Text>
      <View style={styles.row}>
        <StatCard icon="dollar-sign" value={formatZAR(1200)} label="Revenue" />
        <StatCard icon="shopping-bag" value={String(orders.length)} label="Orders" />
      </View>
      <View style={styles.row}>
        <StatCard icon="clock" value="10" label="Pending" />
        <StatCard icon="check-circle" value="35" label="Delivered" />
      </View>

      
      <Text style={styles.heading}>Inventory</Text>
      <View style={styles.row}>
        <StatCard icon="grid" value={String(categories.length)} label="Categories" />
        <StatCard icon="coffee" value={String(totalItems)} label="Menu Items" />
      </View>

      
      <View style={{ marginTop: 10 }}>
        <Text style={{ fontWeight: "700", marginBottom: 6 }}>By Category</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {Object.keys(categoryCounts).length === 0 ? (
            <Text style={{ color: "#666" }}>No inventory yet</Text>
          ) : (
            Object.entries(categoryCounts).map(([cat, count]) => (
              <View key={cat} style={styles.categoryBadge}>
                <Text style={{ fontWeight: "700" }}>{cat}</Text>
                <Text style={{ marginLeft: 8 }}>{count}</Text>
              </View>
            ))
          )}
        </View>
      </View>

      
      <Text style={styles.heading}>Quick Actions</Text>

      <Action icon="menu" label="Manage Menu Items" onPress={() => setMenuModal(true)} />
      <Action icon="package" label="View All Orders" onPress={() => setOrdersModal(true)} />

      
      <Modal visible={menuModal} animationType="slide">
        <ScrollView contentContainerStyle={styles.modal}>
          <Text style={styles.heading}>{editingId ? "Edit Menu Item" : "Add Menu Item"}</Text>

          <TextInput
            placeholder="Item Name"
            style={styles.input}
            value={form.name}
            onChangeText={(t) => setForm({ ...form, name: t })}
          />

          <TextInput
            placeholder="Price (R)"
            style={styles.input}
            keyboardType="numeric"
            value={form.price !== undefined ? String(form.price) : ""}
            onChangeText={(t) => {
              const cleaned = t.replace(/[^0-9.]/g, "");
              setForm({ ...form, price: cleaned === "" ? 0 : Number(cleaned) });
            }}
          />

          <TextInput
            placeholder="Description"
            style={[styles.input, { height: 80 }]}
            multiline
            value={form.description}
            onChangeText={(t) => setForm({ ...form, description: t })}
          />

          <Picker
            selectedValue={form.category}
            onValueChange={(itemValue) => setForm({ ...form, category: itemValue })}
            style={styles.picker}
          >
            <Picker.Item label="Street Eats" value="Street Eats" />
            <Picker.Item label= "Comfort Classics" value="Comfort Classics" />
            <Picker.Item label="Global Bowls" value="Global Bowls" />
            <Picker.Item label="Plant Forward" value="Plant Forward" />
            <Picker.Item label="Seafood & Grill" value="Seafood & Grill" />
            <Picker.Item label="Small Plates & Shareables" value="Small Plates & Shareables" />
            <Picker.Item label="Desserts & Drinks" value="Desserts & Drinks" />
          </Picker>

          <Text style={{ marginBottom: 6 }}>Image:</Text>
          <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
            <Text style={styles.imageText}>{form.image ? "Change Image" : "Upload Image"}</Text>
          </TouchableOpacity>
          <TextInput
            placeholder="Or enter image URL"
            style={styles.input}
            value={form.image}
            onChangeText={(t) => setForm({ ...form, image: t })}
          />
          {form.image ? <Image source={{ uri: form.image }} style={styles.preview} resizeMode="cover" /> : null}

          <TouchableOpacity style={styles.saveBtn} onPress={saveItem}>
            <Text style={styles.saveText}>{editingId ? "Update Item" : "Save Item"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          {/* LIST OF MENU ITEMS */}
          {loading ? (
            <ActivityIndicator size="large" />
          ) : (
            <FlatList
              data={menu}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.menuItem}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View>
                      <Text style={{ fontWeight: "bold" }}>{item.name}</Text>
                      <Text>
                        {formatZAR(item.price)} • {item.category}
                      </Text>
                    </View>

                    {item.image ? <Image source={{ uri: item.image }} style={{ width: 56, height: 40, borderRadius: 6 }} /> : null}
                  </View>

                  <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                    
                    {isAdmin ? (
                      <>
                        <TouchableOpacity onPress={() => editItem(item)}>
                          <Feather name="edit-2" size={20} color="#007bff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteItem(item.id)}>
                          <Feather name="trash" size={20} color="red" />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <Text style={{ color: "#666", fontSize: 12 }}>Admin only</Text>
                    )}
                  </View>
                </View>
              )}
            />
          )}
        </ScrollView>
      </Modal>

      
      <Modal visible={ordersModal} animationType="slide">
        <View style={styles.modal}>
          <Text style={styles.heading}>All Orders</Text>
          {orders.length === 0 ? (
            <Text style={{ color: "#666", textAlign: "center", marginTop: 20 }}>No orders yet</Text>
          ) : (
            <ScrollView style={{ width: "100%" }}>
              {orders.map((o) => (
                <View key={o.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: "#eee" }}>
                  <Text style={{ fontWeight: "700" }}>#{o.id}</Text>
                  <Text>Status: {o.status}</Text>
                  <Text>Total: {formatZAR(o.total)}</Text>
                  <Text style={{ color: "#666", fontSize: 12 }}>
                    {o.createdAt
                      ? typeof o.createdAt.toDate === "function"
                        ? o.createdAt.toDate().toLocaleString()
                        : o.createdAt instanceof Date
                        ? o.createdAt.toLocaleString()
                        : String(o.createdAt)
                      : "No timestamp"}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
          <TouchableOpacity onPress={() => setOrdersModal(false)}>
            <Text style={styles.close}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}


const StatCard = ({ icon, value, label }: any) => (
  <View style={styles.card}>
    <Feather name={icon} size={22} />
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const Action = ({ icon, label, onPress }: any) => (
  <TouchableOpacity style={styles.action} onPress={onPress}>
    <Feather name={icon} size={20} />
    <Text style={styles.actionLabel}>{label}</Text>
    <Feather name="chevron-right" size={20} />
  </TouchableOpacity>
);

const StatusBar = ({ label, percent, success }: any) => (
  <>
    <Text>{label}</Text>
    <View style={styles.bar}>
      <View style={[styles.fill, { width: `${percent}%`, backgroundColor: success ? "#28a745" : "#ffc107" }]} />
    </View>
  </>
);

const styles = StyleSheet.create({
  container: { padding: 20 },
  heading: { fontSize: 20, fontWeight: "bold", marginVertical: 12 },
  row: { flexDirection: "row", gap: 12 },
  card: { flex: 1, backgroundColor: "#fff", padding: 16, borderRadius: 8 },
  value: { fontSize: 22, fontWeight: "bold" },
  label: { color: "#755" },
  bar: { height: 8, backgroundColor: "#eee", borderRadius: 4 },
  fill: { height: 8, borderRadius: 4 },
  action: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 14, borderRadius: 8, marginBottom: 10 },
  actionLabel: { flex: 1, marginLeft: 10 },
  modal: { flex: 1, padding: 20 },
  addBtn: { backgroundColor: "#007bff", padding: 10, borderRadius: 6 },
  addText: { color: "#fff", textAlign: "center" },
  menuItem: { paddingVertical: 12, borderBottomWidth: 1, borderColor: "#eee" },
  close: { marginTop: 20, color: "red", textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, marginBottom: 12 },
  picker: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, marginBottom: 12 },
  imageBtn: { backgroundColor: "#eee", padding: 14, borderRadius: 8, alignItems: "center", marginBottom: 12 },
  imageText: { fontWeight: "600" },
  preview: { width: "100%", height: 180, borderRadius: 10, marginBottom: 15 },
  saveBtn: { backgroundColor: "#28a745", padding: 16, borderRadius: 10, alignItems: "center", marginBottom: 10 },
  saveText: { color: "#fff", fontWeight: "700" },
  cancelBtn: { alignItems: "center", marginBottom: 20 },
  cancelText: { color: "#455" },
  categoryBadge: { backgroundColor: "#f5f5f5", padding: 8, borderRadius: 8, marginRight: 8, flexDirection: "row", alignItems: "center" },
});

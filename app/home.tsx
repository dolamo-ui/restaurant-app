
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { auth, db } from "../firebase/firebaseConfig";
import { logoutUser } from "../services/authService";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";


type TabType = "home" | "orders" | "profile";
type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};
type Order = {
  id: string;
  items: CartItem[];
  total: number;
  deliveryName?: string;
  deliveryAddress?: string;
  timestamp?: any;
  status?: string;
  uid?: string | null;
};
type MenuItem = {
  id: string;
  name: string;
  price: string;
  category?: string;
  description?: string;
  image?: string;
  status?: string;
};

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartVisible, setCartVisible] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryName, setDeliveryName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({
    name: "",
    surname: "",
    phone: "",
    address: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");

  
  const [orderConfirmedVisible, setOrderConfirmedVisible] = useState(false);
  const [lastOrderId, setLastOrderId] = useState("");

  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setProfileEmail(currentUser.email || "");
        await loadUserProfile(currentUser.uid);
      } else {
        setProfile({
          name: "",
          surname: "",
          phone: "",
          address: "",
          cardNumber: "",
          expiry: "",
          cvv: "",
        });
        setProfileName("");
        setProfileEmail("");
        setOrders((prev) => prev.filter((o) => !o.uid)); 
      }
    });
    return () => unsubscribe();
  }, []);

  
  
  
  
  useEffect(() => {
    if (!user) return;

    const userOrdersRef = collection(db, "users", user.uid, "orders");
    const q = query(userOrdersRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: Order[] = snapshot.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            items: data.items || [],
            total: data.total || 0,
            deliveryName: data.deliveryName,
            deliveryAddress: data.deliveryAddress,
            timestamp: data.timestamp,
            status: data.status,
            uid: data.uid || user.uid,
          };
        });
        setOrders(fetched);
      },
      (err) => {
        console.error("Error subscribing to user orders:", err);
      }
    );

    return () => unsubscribe();
  }, [user]);

 
  useEffect(() => {
    const q = query(collection(db, "menuItems"), where("status", "==", "active"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: MenuItem[] = snapshot.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data.name || "",
            price: data.price || "",
            category: data.category || "Uncategorized",
            description: data.description || "",
            image: data.image || "",
            status: data.status || "",
          };
        });

       
        items.sort((a: any, b: any) => {
          const aVal = a.createdAt?.seconds ?? a.createdAt?.toMillis?.() ?? 0;
          const bVal = b.createdAt?.seconds ?? b.createdAt?.toMillis?.() ?? 0;
          return bVal - aVal;
        });

        setMenuItems(items);

        
        const uniqueCategories = new Set<string>();
        items.forEach((item) => {
          const cat = (item.category || "Uncategorized").trim();
          uniqueCategories.add(cat);
        });

        const catArray = Array.from(uniqueCategories)
          .sort()
          .map((cat, idx) => ({
            id: String(idx + 1),
            name: cat,
          }));

        setCategories(catArray);
        setLoadingMenu(false);
      },
      (err) => {
        console.error("Error fetching menu items:", err);
        setLoadingMenu(false);
      }
    );

    return () => unsubscribe();
  }, []);

  
  const loadUserProfile = async (uid: string) => {
    try {
      const profileDoc = await getDoc(doc(db, "users", uid));
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        setProfile(data);
        setProfileName(`${data.name || ""} ${data.surname || ""}`.trim());
        setDeliveryName(`${data.name || ""} ${data.surname || ""}`.trim());
        setDeliveryAddress(data.address || "");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  
  const saveUserProfile = async () => {
    if (!user) return;

    if (profile.cardNumber && profile.cardNumber.replace(/\s/g, "").length !== 16) {
      Alert.alert("Error", "Card number must be 16 digits");
      return;
    }

    if (profile.expiry && !/^\d{2}\/\d{2}$/.test(profile.expiry)) {
      Alert.alert("Error", "Expiry must be in MM/YY format");
      return;
    }

    if (profile.cvv && (profile.cvv.length < 3 || profile.cvv.length > 4)) {
      Alert.alert("Error", "CVV must be 3 or 4 digits");
      return;
    }

    try {
      const [name, ...surnameArr] = profileName.split(" ");
      const surname = surnameArr.join(" ");
      const updatedProfile = {
        ...profile,
        name: name || "",
        surname: surname || "",
      };
      await setDoc(doc(db, "users", user.uid), updatedProfile, { merge: true });
      setProfile(updatedProfile);
      Alert.alert("Success", "Profile updated successfully!");
      setEditProfileVisible(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  
  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
    return formatted.substring(0, 19);
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + "/" + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const maskCardNumber = (cardNumber: string) => {
    if (!cardNumber) return "Not set";
    const cleaned = cardNumber.replace(/\s/g, "");
    if (cleaned.length !== 16) return cardNumber;
    return `•••• •••• •••• ${cleaned.slice(-4)}`;
  };

  
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      } else {
        return [
          ...prev,
          {
            id: item.id,
            name: item.name,
            price: parseFloat(item.price) || 0,
            quantity: 1,
          },
        ];
      }
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((ci) => ci.id !== itemId));
  };

  const changeQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev.map((ci) =>
        ci.id === itemId ? { ...ci, quantity: Math.max(1, ci.quantity + delta) } : ci
      )
    );
  };

  const cartTotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  const proceedToCheckout = () => {
    setCartVisible(false);
    setCheckoutVisible(true);
  };

  /**
   * confirmCheckout
   * - stores order in user's subcollection (users/{uid}/orders)
   * - stores order in top-level "orders" collection for admin access
   * - Orders tab is populated from the user's subcollection via subscription above
   */
  const confirmCheckout = async () => {
    if (!deliveryName || !deliveryAddress) {
      Alert.alert("Error", "Please enter delivery details!");
      return;
    }

    const orderPayload = {
      items: cart.map((c) => ({ ...c })),
      total: cartTotal(),
      deliveryName,
      deliveryAddress,
      timestamp: serverTimestamp(),
      status: "pending",
      uid: user ? user.uid : null,
    };

    try {
     
      const topLevelRef = await addDoc(collection(db, "orders"), orderPayload);
      const adminOrderId = topLevelRef.id;

      
      if (user) {
        
        await addDoc(collection(db, "users", user.uid, "orders"), {
          ...orderPayload,
          adminOrderId,
        });
      } else {
        
        
      }

     
      setLastOrderId(adminOrderId);
      setOrders((prev) => [
        {
          id: adminOrderId,
          items: cart,
          total: cartTotal(),
          deliveryName,
          deliveryAddress,
          timestamp: new Date(),
          status: "pending",
          uid: user ? user.uid : null,
        },
        ...prev,
      ]);

      setCart([]);
      setDeliveryName(profileName);
      setDeliveryAddress(profile.address || "");
      setCheckoutVisible(false);
      setOrderConfirmedVisible(true);
      setActiveTab("orders");
    } catch (error) {
      console.error("Error saving order to Firestore:", error);
      Alert.alert("Error", "There was a problem placing your order. Please try again.");
    }
  };

  
  const handleLogout = async () => {
    try {
      await logoutUser();
      Alert.alert("Success", "Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to logout");
    }
  };

 
  const filteredItems = selectedCategory
    ? menuItems.filter((i) => i.category === selectedCategory)
    : menuItems;

  
  const renderFoodItem = ({ item }: { item: MenuItem }) => (
    <View style={styles.card}>
      <View style={styles.foodImage}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={{ width: 100, height: 100 }} />
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
          <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
            <Icon name="plus" color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

 
  const renderHome = () => (
    <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
      <Text style={styles.header}>FoodHub</Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categories}
      >
        <TouchableOpacity
          style={[styles.chip, selectedCategory === null && styles.chipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={selectedCategory === null ? styles.chipTextActive : undefined}>
            All
          </Text>
        </TouchableOpacity>
        {categories.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.chip, selectedCategory === c.name && styles.chipActive]}
            onPress={() => setSelectedCategory(c.name)}
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
          renderItem={renderFoodItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </ScrollView>
  );

  
  const renderOrders = () => (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      {orders.length === 0 ? (
        <View style={styles.centered}>
          <Text>No orders yet.</Text>
        </View>
      ) : (
        orders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <Text style={{ fontWeight: "700" }}>Order #{order.id}</Text>
            {order.items.map((item) => (
              <Text key={item.id}>
                {item.name} x {item.quantity} = R{(item.price * item.quantity).toFixed(2)}
              </Text>
            ))}
            <Text style={{ fontWeight: "700" }}>Total: R{(order.total).toFixed(2)}</Text>
            <Text style={{ color: "#666", marginTop: 6 }}>
              {order.deliveryName || ""} • {order.deliveryAddress || ""}
            </Text>
            <Text style={{ color: "#666", marginTop: 4 }}>Status: {order.status || "pending"}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );

 
  const ProfileItem = ({
    icon,
    label,
    value,
    onPress,
  }: {
    icon: string;
    label: string;
    value?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity style={styles.profileItem} onPress={onPress}>
      <View style={styles.profileItemLeft}>
        <Icon name={icon as any} size={20} color="#ff6b00" />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.profileItemText}>{label}</Text>
          {value && <Text style={styles.profileItemValue}>{value}</Text>}
        </View>
      </View>
      <Icon name="chevron-right" size={20} color="#999" />
    </TouchableOpacity>
  );

  const renderProfile = () => (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Icon name="user" size={32} color="#fff" />
        </View>
        <Text style={styles.profileName}>{profileName || "Guest User"}</Text>
        <Text style={styles.profileEmail}>{profileEmail || "Not logged in"}</Text>
        <TouchableOpacity
          style={styles.editProfileBtn}
          onPress={() => setEditProfileVisible(true)}
        >
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <ProfileItem
          icon="shopping-bag"
          label="Order History"
          onPress={() => setActiveTab("orders")}
        />
        <ProfileItem
          icon="credit-card"
          label="Payment Methods"
          value={maskCardNumber(profile.cardNumber)}
          onPress={() => setEditProfileVisible(true)}
        />
        <ProfileItem
          icon="map-pin"
          label="Delivery Address"
          value={profile.address || "Not set"}
          onPress={() => setEditProfileVisible(true)}
        />
        <ProfileItem icon="bell" label="Notifications" />
      </View>

      <View style={styles.profileSection}>
        <ProfileItem icon="help-circle" label="Help & Support" />
        <ProfileItem icon="info" label="About" />
        {user && <ProfileItem icon="log-out" label="Logout" onPress={handleLogout} />}
      </View>
    </ScrollView>
  );

  
  return (
    <View style={styles.container}>
      {activeTab === "home" && renderHome()}
      {activeTab === "orders" && renderOrders()}
      {activeTab === "profile" && renderProfile()}

      
      {cart.length > 0 && (
        <TouchableOpacity style={styles.cartFab} onPress={() => setCartVisible(true)}>
          <Text style={styles.cartBadge}>{totalItems()}</Text>
          <Icon name="shopping-cart" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      
      <Modal visible={cartVisible} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: "700" }}>Cart</Text>
              {cart.length > 0 && (
                <Text style={{ fontSize: 16, color: "#666", marginLeft: 8 }}>
                  ({totalItems()} {totalItems() === 1 ? "item" : "items"})
                </Text>
              )}
            </View>
            {cart.length === 0 ? (
              <Text>Your cart is empty.</Text>
            ) : (
              <>
                <FlatList
                  data={cart}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => {
                    const foodItem = menuItems.find((fi) => fi.id === item.id);
                    return (
                      <View style={[styles.cartRow, { alignItems: "center" }]}>
                        <View
                          style={{
                            width: 60,
                            height: 60,
                            borderRadius: 8,
                            backgroundColor: "#eee",
                            justifyContent: "center",
                            alignItems: "center",
                            marginRight: 8,
                          }}
                        >
                          {foodItem?.image ? (
                            <Image
                              source={{ uri: foodItem.image }}
                              style={{ width: 60, height: 60, borderRadius: 8 }}
                            />
                          ) : (
                            <Icon name="image" size={24} color="#888" />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: "600" }}>{item.name}</Text>
                          <View style={styles.quantityRow}>
                            <TouchableOpacity onPress={() => changeQuantity(item.id, -1)}>
                              <Icon name="minus" size={20} />
                            </TouchableOpacity>
                            <Text style={styles.quantityText}>{item.quantity}</Text>
                            <TouchableOpacity onPress={() => changeQuantity(item.id, 1)}>
                              <Icon name="plus" size={20} />
                            </TouchableOpacity>
                          </View>
                        </View>
                        <Text>R{(item.price * item.quantity).toFixed(2)}</Text>
                        <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                          <Icon name="trash-2" size={20} color="red" />
                        </TouchableOpacity>
                      </View>
                    );
                  }}
                />
                <Text style={styles.totalText}>Total: R{cartTotal().toFixed(2)}</Text>
                <TouchableOpacity style={styles.placeOrderBtn} onPress={proceedToCheckout}>
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Checkout</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    marginTop: 8,
                    padding: 12,
                    borderRadius: 8,
                    alignItems: "center",
                    backgroundColor: "#ccc",
                  }}
                  onPress={() => setCart([])}
                >
                  <Text style={{ color: "#111", fontWeight: "600" }}>Clear Cart</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={{ marginTop: 8 }} onPress={() => setCartVisible(false)}>
              <Text style={{ color: "#ff6b00", textAlign: "center" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

     
      <Modal visible={checkoutVisible} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: "700" }}>Checkout</Text>
              <Text style={{ fontSize: 16, color: "#666", marginLeft: 8 }}>
                ({totalItems()} {totalItems() === 1 ? "item" : "items"})
              </Text>
            </View>
            <FlatList
              data={cart}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.cartRow}>
                  <Text>
                    {item.name} x {item.quantity}
                  </Text>
                  <Text>R{(item.price * item.quantity).toFixed(2)}</Text>
                </View>
              )}
            />
            <Text style={{ fontWeight: "700", marginTop: 16 }}>
              Total: R{cartTotal().toFixed(2)}
            </Text>
            <TextInput
              placeholder="Full Name"
              value={deliveryName}
              onChangeText={setDeliveryName}
              style={styles.input}
            />
            <TextInput
              placeholder="Delivery Address"
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              style={styles.input}
            />
            <TouchableOpacity style={styles.placeOrderBtn} onPress={confirmCheckout}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>Confirm Order</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginTop: 8 }}
              onPress={() => setCheckoutVisible(false)}
            >
              <Text style={{ color: "#ff6b00", textAlign: "center" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      
      <Modal visible={orderConfirmedVisible} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: "#28a745",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Icon name="check" size={48} color="#fff" />
              </View>
              <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 8 }}>
                Order Placed!
              </Text>
              <Text style={{ textAlign: "center", color: "#988", marginBottom: 16 }}>
                Your order has been successfully placed and is being prepared.
              </Text>
              <View
                style={{
                  backgroundColor: "#f4f4f4",
                  padding: 16,
                  borderRadius: 8,
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>Order ID</Text>
                <Text style={{ fontSize: 18, fontWeight: "700" }}>
                  #{lastOrderId.slice(0, 8)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", padding: 8 }}>
                <Icon name="clock" size={24} color="#111" />
                <View style={{ marginLeft: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: "600" }}>Estimated Delivery</Text>
                  <Text style={{ color: "#666", marginTop: 4 }}>30-45 minutes</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: "#ff6b00",
                padding: 12,
                borderRadius: 8,
                alignItems: "center",
                marginBottom: 8,
              }}
              onPress={() => Alert.alert("Track Order", "Order ID: " + lastOrderId)}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>Track Order</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: "#f4f4f4",
                padding: 12,
                borderRadius: 8,
                alignItems: "center",
              }}
              onPress={() => setOrderConfirmedVisible(false)}
            >
              <Text style={{ color: "#111", fontWeight: "600" }}>Back to Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

     
      <Modal visible={editProfileVisible} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <ScrollView
            style={{ width: "90%", maxHeight: "90%" }}
            contentContainerStyle={{ paddingVertical: 20 }}
          >
            <View style={[styles.modalContainer, { maxHeight: undefined }]}>
              <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 16 }}>
                Edit Profile
              </Text>
              
              <Text style={styles.sectionTitle}>Personal Information</Text>
              <TextInput
                placeholder="Full Name"
                value={profileName}
                onChangeText={setProfileName}
                style={styles.input}
              />
              <TextInput
                placeholder="Email"
                value={profileEmail}
                editable={false}
                style={[styles.input, { backgroundColor: "#f4f4f4" }]}
              />
              <TextInput
                placeholder="Phone"
                value={profile.phone}
                onChangeText={(text) => setProfile({ ...profile, phone: text })}
                style={styles.input}
                keyboardType="phone-pad"
              />
              
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Payment Information</Text>
              <Text style={styles.sectionSubtitle}>
                Your payment info is stored securely
              </Text>
              <View style={styles.inputContainer}>
                <Icon name="credit-card" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  placeholder="Card Number (16 digits)"
                  value={profile.cardNumber}
                  onChangeText={(text) =>
                    setProfile({ ...profile, cardNumber: formatCardNumber(text) })
                  }
                  style={[styles.input, { flex: 1, marginTop: 0 }]}
                  keyboardType="numeric"
                  maxLength={19}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Icon name="calendar" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    placeholder="MM/YY"
                    value={profile.expiry}
                    onChangeText={(text) =>
                      setProfile({ ...profile, expiry: formatExpiry(text) })
                    }
                    style={[styles.input, { flex: 1, marginTop: 0 }]}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Icon name="lock" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    placeholder="CVV"
                    value={profile.cvv}
                    onChangeText={(text) =>
                      setProfile({ ...profile, cvv: text.replace(/\D/g, "") })
                    }
                    style={[styles.input, { flex: 1, marginTop: 0 }]}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>
              <View style={styles.securityNote}>
                <Icon name="shield" size={16} color="#28a745" />
                <Text style={styles.securityText}>
                  Your payment information is encrypted and secure
                </Text>
              </View>
              
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              <TextInput
                placeholder="Delivery Address"
                value={profile.address}
                onChangeText={(text) => setProfile({ ...profile, address: text })}
                style={styles.input}
                multiline
              />
              <TouchableOpacity style={styles.placeOrderBtn} onPress={saveUserProfile}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ marginTop: 8, padding: 12, alignItems: "center" }} onPress={() => setEditProfileVisible(false)}>
                <Text style={{ color: "#ff6b00", fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      
      <View style={styles.tabs}>
        <TouchableOpacity onPress={() => setActiveTab("home")} style={styles.tabBtn}>
          <Icon name="home" size={24} color={activeTab === "home" ? "#ff6b00" : "#999"} />
          <Text style={{ color: activeTab === "home" ? "#ff6b00" : "#999" }}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab("orders")} style={styles.tabBtn}>
          <Icon name="package" size={24} color={activeTab === "orders" ? "#ff6b00" : "#999"} />
          <Text style={{ color: activeTab === "orders" ? "#ff6b00" : "#999" }}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab("profile")} style={styles.tabBtn}>
          <Icon name="user" size={24} color={activeTab === "profile" ? "#ff6b00" : "#999"} />
          <Text style={{ color: activeTab === "profile" ? "#ff6b00" : "#999" }}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { fontSize: 32, fontWeight: "700", marginBottom: 16, paddingHorizontal: 16 },
  categories: { flexDirection: "row", marginBottom: 16, paddingHorizontal: 16 },
  chip: { padding: 8, borderRadius: 20, borderWidth: 1, borderColor: "#ccc", marginRight: 8 },
  chipActive: { backgroundColor: "#ff6b00" },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 },
  card: { flexDirection: "row", padding: 12, backgroundColor: "#f4f4f4", borderRadius: 12, marginBottom: 12, marginHorizontal: 16 },
  foodImage: { width: 100, height: 100, justifyContent: "center", alignItems: "center", marginRight: 12 },
  foodInfo: { flex: 1, justifyContent: "space-between" },
  foodTitle: { fontSize: 16, fontWeight: "700" },
  foodDesc: { color: "#788", marginVertical: 4 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  price: { fontWeight: "700" },
  addBtn: { backgroundColor: "#ff6b00", padding: 8, borderRadius: 8 },
  cartFab: { position: "absolute", bottom: 70, right: 16, backgroundColor: "#ff6b00", borderRadius: 30, padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  cartBadge: { position: "absolute", top: -6, right: -6, backgroundColor: "#fff", color: "#ff6b00", borderRadius: 8, paddingHorizontal: 6, fontWeight: "700", fontSize: 12 },
  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContainer: { width: "90%", backgroundColor: "#fff", padding: 16, borderRadius: 12, maxHeight: "80%" },
  cartRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  quantityRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  quantityText: { marginHorizontal: 8 },
  totalText: { fontWeight: "700", fontSize: 18, marginTop: 8 },
  placeOrderBtn: { backgroundColor: "#ff6b00", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 8 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, marginTop: 8 },
  orderCard: { backgroundColor: "#f4f4f4", padding: 12, borderRadius: 12, marginBottom: 12 },
  profileCard: { backgroundColor: "#f4f4f4", padding: 16, borderRadius: 12, alignItems: "center", marginBottom: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#ff6b00", justifyContent: "center", alignItems: "center", marginBottom: 8 },
  profileName: { fontWeight: "700", fontSize: 18 },
  profileEmail: { color: "#789", marginBottom: 8 },
  editProfileBtn: { backgroundColor: "#ff6b00", padding: 8, borderRadius: 8 },
  editProfileText: { color: "#fff", fontWeight: "600" },
  profileSection: { marginBottom: 16 },
  profileItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderColor: "#eee", alignItems: "center" },
  profileItemLeft: { flexDirection: "row", alignItems: "center" },
  profileItemText: { marginLeft: 12, fontSize: 16, fontWeight: "600" },
  profileItemValue: { marginLeft: 12, fontSize: 14, color: "#666", marginTop: 2 },
  tabs: { flexDirection: "row", borderTopWidth: 1, borderColor: "#eee", height: 60, justifyContent: "space-around", alignItems: "center" },
  tabBtn: { alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8, color: "#111" },
  sectionSubtitle: { fontSize: 13, color: "#666", marginBottom: 12 },
  inputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginTop: 8, paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  securityNote: { flexDirection: "row", alignItems: "center", backgroundColor: "#f0f9f4", padding: 12, borderRadius: 8, marginTop: 12 },
  securityText: { fontSize: 12, color: "#28a745", flex: 1 },

  /* skeleton styles */
  skeletonCard: { flexDirection: "row", padding: 12, backgroundColor: "#fff", borderRadius: 12, marginBottom: 12, alignItems: "center" },
  skeletonImage: { width: 100, height: 80, backgroundColor: "#eee", borderRadius: 8 },
  skeletonLineShort: { width: "40%", height: 12, backgroundColor: "#eee", borderRadius: 6, marginTop: 6 },
  skeletonLineLong: { width: "70%", height: 12, backgroundColor: "#eee", borderRadius: 6, marginTop: 8 },
  skeletonPrice: { width: 60, height: 20, backgroundColor: "#eee", borderRadius: 6 },
  skeletonBtn: { width: 40, height: 28, backgroundColor: "#eee", borderRadius: 6 },
});

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  FlatList,
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

// Import components
import FoodItem from "../components/FoodItem";
import CartItemComponent from "../components/CartItem";
import OrderCard from "../components/OrderCard";
import CartModal from "../components/CartModal";
import HomeTab from "../components/HomeTab";
import OrdersTab from "../components/OrdersTab";

type TabType = "home" | "orders" | "profile";
type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
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
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const deliveryFee = 5.0;

  // Auth state listener
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
        setOrders([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Orders listener
  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    const userOrdersRef = collection(db, "users", user.uid, "orders");
    const q = query(userOrdersRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: Order[] = snapshot.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: data.adminOrderId || d.id,
            items: data.items || [],
            total: data.total || 0,
            deliveryName: data.deliveryName,
            deliveryAddress: data.deliveryAddress,
            timestamp: data.createdAt || data.timestamp,
            status: data.status || "pending",
            uid: data.uid || user.uid,
          };
        });
        setOrders(fetched);
        setIsRefreshing(false);
      },
      (err) => {
        console.error("Error subscribing to user orders:", err);
        const fallbackQ = query(userOrdersRef);
        onSnapshot(fallbackQ, (snapshot) => {
          const fetched: Order[] = snapshot.docs.map((d) => {
            const data = d.data() as any;
            return {
              id: data.adminOrderId || d.id,
              items: data.items || [],
              total: data.total || 0,
              deliveryName: data.deliveryName,
              deliveryAddress: data.deliveryAddress,
              timestamp: data.createdAt || data.timestamp,
              status: data.status || "pending",
              uid: data.uid || user.uid,
            };
          });
          setOrders(fetched);
          setIsRefreshing(false);
        });
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Menu items listener
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
            image: item.image,
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

  const handleClearCart = () => {
    Alert.alert(
      "Clear Cart",
      "Are you sure you want to remove all items from your cart?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: () => setCart([]) },
      ]
    );
  };

  const cartTotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  const proceedToCheckout = () => {
    if (!user) {
      Alert.alert(
        "Sign In Required",
        "Please sign in to proceed with checkout",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sign In", onPress: () => { /* Navigate to login */ } },
        ]
      );
      return;
    }
    setCartVisible(false);
    setCheckoutVisible(true);
  };

  const confirmCheckout = async () => {
    if (!deliveryName || !deliveryAddress) {
      Alert.alert("Error", "Please enter delivery details!");
      return;
    }

    if (isProcessingOrder) return;
    setIsProcessingOrder(true);

    const now = new Date();
    const orderPayload = {
      items: cart.map((c) => ({ ...c })),
      total: cartTotal() + deliveryFee,
      deliveryName,
      deliveryAddress,
      createdAt: serverTimestamp(),
      status: "pending",
      uid: user ? user.uid : null,
    };

    try {
      const topLevelRef = await addDoc(collection(db, "orders"), orderPayload);
      const adminOrderId = topLevelRef.id;

      if (user) {
        try {
          const userOrderPayload = {
            ...orderPayload,
            adminOrderId,
          };
          
          await addDoc(
            collection(db, "users", user.uid, "orders"), 
            userOrderPayload
          );
          
          setOrders((prev) => [
            {
              id: adminOrderId,
              items: cart,
              total: cartTotal() + deliveryFee,
              deliveryName,
              deliveryAddress,
              timestamp: now,
              status: "pending",
              uid: user.uid,
            },
            ...prev,
          ]);
        } catch (userOrderError: any) {
          console.error("Error saving to user orders:", userOrderError);
          if (userOrderError.code === "permission-denied") {
            Alert.alert(
              "Warning", 
              "Order was created but not saved to your history. Please check Firestore rules."
            );
          }
        }
      }

      setLastOrderId(adminOrderId);
      setCart([]);
      setDeliveryName(profileName);
      setDeliveryAddress(profile.address || "");
      setCheckoutVisible(false);
      setOrderConfirmedVisible(true);
      
    } catch (error: any) {
      console.error("Error saving order to Firestore:", error);
      
      let errorMessage = "There was a problem placing your order. Please try again.";
      
      if (error.code === "permission-denied") {
        errorMessage = "Permission denied. Please check your Firestore security rules.";
      } else if (error.code === "unavailable") {
        errorMessage = "Service unavailable. Please check your internet connection.";
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setIsProcessingOrder(false);
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

  const handleTrackOrder = () => {
    setOrderConfirmedVisible(false);
    setActiveTab("orders");
  };

  const handleBackToMenu = () => {
    setOrderConfirmedVisible(false);
    setActiveTab("home");
  };

  const onRefresh = () => {
    setIsRefreshing(true);
  };

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
      {activeTab === "home" && (
        <HomeTab
          menuItems={menuItems}
          categories={categories}
          selectedCategory={selectedCategory}
          loadingMenu={loadingMenu}
          onSelectCategory={setSelectedCategory}
          onAddToCart={addToCart}
        />
      )}
      {activeTab === "orders" && (
        <OrdersTab
          user={user}
          orders={orders}
          isRefreshing={isRefreshing}
          onRefresh={onRefresh}
          onNavigateHome={() => setActiveTab("home")}
        />
      )}
      {activeTab === "profile" && renderProfile()}

      {/* Cart FAB */}
      {cart.length > 0 && (
        <TouchableOpacity style={styles.cartFab} onPress={() => setCartVisible(true)}>
          <Text style={styles.cartBadge}>{totalItems()}</Text>
          <Icon name="shopping-cart" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Cart Modal */}
      <CartModal
        visible={cartVisible}
        cart={cart}
        onClose={() => setCartVisible(false)}
        onClearCart={handleClearCart}
        onRemoveItem={removeFromCart}
        onChangeQuantity={changeQuantity}
        onCheckout={proceedToCheckout}
        deliveryFee={deliveryFee}
      />

      {/* Checkout Modal */}
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
              Total: R{(cartTotal() + deliveryFee).toFixed(2)}
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
            <TouchableOpacity 
              style={[styles.placeOrderBtn, isProcessingOrder && { opacity: 0.6 }]} 
              onPress={confirmCheckout}
              disabled={isProcessingOrder}
            >
              {isProcessingOrder ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700" }}>Confirm Order</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginTop: 8 }}
              onPress={() => setCheckoutVisible(false)}
              disabled={isProcessingOrder}
            >
              <Text style={{ color: "#ff6b00", textAlign: "center" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Order Confirmation Modal */}
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
              <Text style={{ textAlign: "center", color: "#666", marginBottom: 16 }}>
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
                  #{lastOrderId.slice(0, 8).toUpperCase()}
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
              onPress={handleTrackOrder}
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
              onPress={handleBackToMenu}
            >
              <Text style={{ color: "#111", fontWeight: "600" }}>Back to Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
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
              <TouchableOpacity 
                style={{ marginTop: 8, padding: 12, alignItems: "center" }} 
                onPress={() => setEditProfileVisible(false)}
              >
                <Text style={{ color: "#ff6b00", fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Bottom Tabs */}
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
  header: { fontSize: 32, fontWeight: "700", marginBottom: 16 },
  categories: { flexDirection: "row", marginBottom: 16 },
  chip: { padding: 8, borderRadius: 20, borderWidth: 1, borderColor: "#ccc", marginRight: 8 },
  chipActive: { backgroundColor: "#ff6b00", borderColor: "#ff6b00" },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
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
  cartFab: { 
    position: "absolute", 
    bottom: 70, 
    right: 16, 
    backgroundColor: "#ff6b00", 
    borderRadius: 30, 
    padding: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  cartBadge: { 
    position: "absolute", 
    top: -6, 
    right: -6, 
    backgroundColor: "#DC3545", 
    color: "#fff", 
    borderRadius: 10, 
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6, 
    fontWeight: "700", 
    fontSize: 12,
    textAlign: "center",
    lineHeight: 20,
  },
  modalBackground: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    justifyContent: "flex-end",
  },
  modalContainer: { 
    width: "100%", 
    backgroundColor: "#fff", 
    padding: 16, 
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  enhancedModalContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 24,
    paddingBottom: 32,
    maxHeight: "90%",
  },
  cartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  cartTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
  },
  cartSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  clearCartText: {
    color: "#DC3545",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyCart: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyCartText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
    marginTop: 16,
  },
  emptyCartSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  cartListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
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
  cartSummary: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  totalRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ff6b00",
  },
  checkoutButton: {
    backgroundColor: "#ff6b00",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 12,
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  closeCartButton: {
    paddingVertical: 12,
    alignItems: "center",
    marginHorizontal: 20,
  },
  closeCartText: {
    color: "#ff6b00",
    fontSize: 16,
    fontWeight: "600",
  },
  cartRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 8,
    paddingVertical: 4,
  },
  totalText: { fontWeight: "700", fontSize: 18, marginTop: 8 },
  placeOrderBtn: { 
    backgroundColor: "#ff6b00", 
    padding: 14, 
    borderRadius: 12, 
    alignItems: "center", 
    marginTop: 16,
  },
  input: { 
    borderWidth: 1, 
    borderColor: "#ddd", 
    padding: 14, 
    borderRadius: 12, 
    marginTop: 12,
    fontSize: 15,
  },
  orderCard: { 
    backgroundColor: "#fff", 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "flex-start", 
    marginBottom: 12,
  },
  orderId: { 
    fontSize: 16, 
    fontWeight: "600",
    color: "#111",
  },
  orderDate: { 
    fontSize: 13, 
    color: "#666",
    marginTop: 4,
  },
  statusBadge: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20,
  },
  statusText: { 
    color: "#fff", 
    fontSize: 12, 
    fontWeight: "600",
  },
  orderItemsContainer: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  orderItemText: {
    fontSize: 14,
    color: "#444",
    marginBottom: 4,
  },
  moreItemsText: {
    fontSize: 13,
    color: "#999",
    fontStyle: "italic",
    marginTop: 2,
  },
  orderFooter: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
    marginBottom: 8,
  },
  orderTotal: { 
    fontSize: 18,
    fontWeight: "700",
    color: "#ff6b00",
  },
  deliveryInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  deliveryText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: "#ff6b00",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signInButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  profileCard: { 
    backgroundColor: "#f4f4f4", 
    padding: 16, 
    borderRadius: 12, 
    alignItems: "center", 
    marginBottom: 16,
  },
  avatar: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    backgroundColor: "#ff6b00", 
    justifyContent: "center", 
    alignItems: "center", 
    marginBottom: 8,
  },
  profileName: { fontWeight: "700", fontSize: 18 },
  profileEmail: { color: "#666", marginBottom: 8 },
  editProfileBtn: { backgroundColor: "#ff6b00", padding: 8, borderRadius: 8, marginTop: 8 },
  editProfileText: { color: "#fff", fontWeight: "600" },
  profileSection: { marginBottom: 16 },
  profileItem: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderColor: "#eee", 
    alignItems: "center",
  },
  profileItemLeft: { flexDirection: "row", alignItems: "center" },
  profileItemText: { fontSize: 16, fontWeight: "600" },
  profileItemValue: { fontSize: 14, color: "#666", marginTop: 2 },
  tabs: { 
    flexDirection: "row", 
    borderTopWidth: 1, 
    borderColor: "#eee", 
    height: 60, 
    justifyContent: "space-around", 
    alignItems: "center",
    backgroundColor: "#fff",
  },
  tabBtn: { alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8, color: "#111", marginTop: 8 },
  sectionSubtitle: { fontSize: 13, color: "#666", marginBottom: 12 },
  inputContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    borderWidth: 1, 
    borderColor: "#ddd", 
    borderRadius: 12, 
    marginTop: 12, 
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  securityNote: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#f0f9f4", 
    padding: 12, 
    borderRadius: 8, 
    marginTop: 12,
  },
  securityText: { fontSize: 12, color: "#28a745", marginLeft: 8, flex: 1 },
});
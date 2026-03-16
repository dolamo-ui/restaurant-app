import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Animated,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import OrderCard from "./OrderCard";

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

interface OrdersTabProps {
  user: any;
  orders: Order[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onNavigateHome: () => void;
}

function EmptyState({
  icon,
  title,
  subtitle,
  buttonLabel,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  buttonLabel?: string;
  onPress?: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.emptyWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.emptyIconCircle}>
        <View style={styles.emptyIconInner}>
          <Icon name={icon as any} size={36} color="#FF5722" />
        </View>
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
      {buttonLabel && onPress && (
        <TouchableOpacity style={styles.emptyBtn} onPress={onPress} activeOpacity={0.85}>
          <Icon name="arrow-right" size={16} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.emptyBtnText}>{buttonLabel}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

function ListHeader({ count }: { count: number }) {
  return (
    <View style={styles.listHeader}>
      <View>
        <Text style={styles.listHeaderTitle}>Your Orders</Text>
        <Text style={styles.listHeaderSub}>{count} order{count !== 1 ? "s" : ""} placed</Text>
      </View>
      <View style={styles.listHeaderBadge}>
        <Icon name="package" size={16} color="#FF5722" />
      </View>
    </View>
  );
}

export default function OrdersTab({
  user,
  orders,
  isRefreshing,
  onRefresh,
  onNavigateHome,
}: OrdersTabProps) {
  if (!user) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="lock"
          title="Sign In to View Orders"
          subtitle="Your order history is waiting for you"
          buttonLabel="Sign In"
        />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="shopping-bag"
          title="No Orders Yet"
          subtitle="Your order history will appear here once you place your first order"
          buttonLabel="Browse Menu"
          onPress={onNavigateHome}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={({ item }) => <OrderCard order={item} />}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<ListHeader count={orders.length} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#FF5722"
            colors={["#FF5722"]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAF8",
  },

  // List header
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 54,
    paddingBottom: 20,
  },
  listHeaderTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1A1A1A",
    letterSpacing: -0.5,
  },
  listHeaderSub: {
    fontSize: 13,
    color: "#aaa",
    fontWeight: "600",
    marginTop: 3,
  },
  listHeaderBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF0EB",
    justifyContent: "center",
    alignItems: "center",
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  // Empty state
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#FFF0EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyIconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFE0D6",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1A1A1A",
    letterSpacing: -0.4,
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF5722",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 50,
    shadowColor: "#FF5722",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
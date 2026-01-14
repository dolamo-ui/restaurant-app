import React from "react";
import { 
  View, 
  Text, 
  Modal, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet 
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import CartItemComponent from "./CartItem";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

interface CartModalProps {
  visible: boolean;
  cart: CartItem[];
  onClose: () => void;
  onClearCart: () => void;
  onRemoveItem: (id: string) => void;
  onChangeQuantity: (id: string, delta: number) => void;
  onCheckout: () => void;
  deliveryFee: number;
}

export default function CartModal({
  visible,
  cart,
  onClose,
  onClearCart,
  onRemoveItem,
  onChangeQuantity,
  onCheckout,
  deliveryFee,
}: CartModalProps) {
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackground}>
        <View style={styles.enhancedModalContainer}>
          <View style={styles.cartHeader}>
            <View>
              <Text style={styles.cartTitle}>Your Cart</Text>
              <Text style={styles.cartSubtitle}>
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClearCart}>
              <Text style={styles.clearCartText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <Icon name="shopping-cart" size={64} color="#ccc" />
              <Text style={styles.emptyCartText}>Your cart is empty</Text>
              <Text style={styles.emptyCartSubtext}>Add some delicious items to get started</Text>
            </View>
          ) : (
            <>
              <FlatList
                data={cart}
                renderItem={({ item }) => (
                  <CartItemComponent
                    item={item}
                    onRemove={onRemoveItem}
                    onChangeQuantity={onChangeQuantity}
                  />
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.cartListContent}
                showsVerticalScrollIndicator={false}
              />

              <View style={styles.cartSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>R{cartTotal.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery Fee</Text>
                  <Text style={styles.summaryValue}>R{deliveryFee.toFixed(2)}</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>R{(cartTotal + deliveryFee).toFixed(2)}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.checkoutButton} onPress={onCheckout}>
                <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.closeCartButton} onPress={onClose}>
            <Text style={styles.closeCartText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackground: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    justifyContent: "flex-end",
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
});
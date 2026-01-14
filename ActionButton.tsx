import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

interface ActionButtonProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}

export default function ActionButton({ icon, label, onPress }: ActionButtonProps) {
  return (
    <TouchableOpacity style={styles.action} onPress={onPress}>
      <View style={styles.actionIconContainer}>
        <Feather name={icon} size={20} color="#007bff" />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
      <Feather name="chevron-right" size={20} color="#999" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
});
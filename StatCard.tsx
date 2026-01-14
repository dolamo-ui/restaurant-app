import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

interface StatCardProps {
  icon: keyof typeof Feather.glyphMap;
  value: string;
  label: string;
}

export default function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Feather name={icon} size={24} color="#007bff" />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
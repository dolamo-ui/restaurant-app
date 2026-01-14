import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, Href } from "expo-router";
import { registerUser } from "../services/authService";

export default function RegisterScreen() {
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  const update = (key: string, value: string) =>
    setForm({ ...form, [key]: value });

  

  const validateStep1 = () => {
    if (!form.name || !form.surname || !form.email || !form.password) {
      Alert.alert("Error", "Fill in all fields");
      return false;
    }
    if (!form.email.includes("@")) {
      Alert.alert("Error", "Invalid email");
      return false;
    }
    if (form.password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!form.phone || !form.address) {
      Alert.alert("Error", "Fill in all fields");
      return false;
    }
    return true;
  };

  

  const next = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;

    if (step < 3) setStep(step + 1);
  };

  const back = () => {
    if (step > 1) setStep(step - 1);
  };

  

  const handleRegister = async () => {
    try {
      await registerUser(form.email, form.password, {
        name: form.name,
        surname: form.surname,
        phone: form.phone,
        address: form.address,
        cardNumber: form.cardNumber,
        expiry: form.expiry,
        cvv: form.cvv,
      });

      Alert.alert("Success", "Account created!");
      router.replace("/home" as Href); 
    } catch (error: any) {
      Alert.alert("Registration failed", error.message);
    }
  };

  

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
      
      <LinearGradient colors={["#ff9d6c", "#ff6a88"]} style={styles.header}>
        <Text style={styles.headerTitle}>
          {step === 1
            ? "Personal Information"
            : step === 2
            ? "Contact Details"
            : "Payment Details"}
        </Text>
        <Text style={styles.headerSubtitle}>
          {step === 1
            ? "Create your account to get started"
            : step === 2
            ? "How can we reach you?"
            : "Add a card (optional)"}
        </Text>
      </LinearGradient>

      
      <View style={styles.steps}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.stepRow}>
            <View
              style={[
                styles.dot,
                i <= step && { backgroundColor: "#ff6b00" },
              ]}
            >
              <Text style={styles.dotText}>{i}</Text>
            </View>
            {i < 3 && (
              <View
                style={[
                  styles.line,
                  i < step && { backgroundColor: "#ff6b00" },
                ]}
              />
            )}
          </View>
        ))}
      </View>

      <View style={styles.container}>
        
        {step === 1 && (
          <>
            <Input label="First Name" value={form.name} onChange={(t) => update("name", t)} />
            <Input label="Last Name" value={form.surname} onChange={(t) => update("surname", t)} />
            <Input label="Email" value={form.email} onChange={(t) => update("email", t)} />
            <Input
              label="Password"
              secure
              value={form.password}
              onChange={(t) => update("password", t)}
            />
          </>
        )}

       
        {step === 2 && (
          <>
            <Input label="Phone Number" value={form.phone} onChange={(t) => update("phone", t)} />
            <Input label="Delivery Address" value={form.address} onChange={(t) => update("address", t)} />
          </>
        )}

       
        {step === 3 && (
          <>
            <Input
              label="Card Number"
              value={form.cardNumber}
              onChange={(t) => update("cardNumber", t)}
            />
            <View style={styles.row}>
              <Input
                label="Expiry"
                half
                value={form.expiry}
                onChange={(t) => update("expiry", t)}
              />
              <Input
                label="CVV"
                half
                secure
                value={form.cvv}
                onChange={(t) => update("cvv", t)}
              />
            </View>
            <Text style={styles.note}>
              You can skip this step and add payment details later
            </Text>
          </>
        )}

        
        <View style={styles.buttons}>
          {step > 1 && (
            <TouchableOpacity style={styles.backBtn} onPress={back}>
              <Text>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.nextBtn}
            onPress={async () => {
              if (step < 3) {
                next(); // go to next step
              } else {
                await handleRegister(); 
              }
            }}
          >
            <Text style={styles.nextText}>
              {step === 3 ? "Create Account" : "Next"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.replace("/login" as Href)}>
          <Text style={styles.loginLink}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}



function Input({
  label,
  value,
  onChange,
  secure,
  half,
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  secure?: boolean;
  half?: boolean;
}) {
  return (
    <View style={[styles.inputBox, half && { width: "48%" }]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        secureTextEntry={secure}
        onChangeText={onChange}
      />
    </View>
  );
}



const styles = StyleSheet.create({
  header: {
    padding: 35,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#fff",
    opacity: 0.9,
    marginTop: 5,
  },
  steps: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 20,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },
  dotText: {
    color: "#fff",
    fontSize: 12,
  },
  line: {
    width: 40,
    height: 2,
    backgroundColor: "#eee",
    marginHorizontal: 8,
  },
  container: {
    padding: 20,
  },
  inputBox: {
    marginBottom: 15,
  },
  label: {
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  note: {
    textAlign: "center",
    color: "#666",
    fontSize: 13,
    marginTop: 10,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 25,
  },
  backBtn: {
    flex: 1,
    height: 48,
    backgroundColor: "#f1f1f1",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  nextBtn: {
    flex: 2,
    height: 48,
    backgroundColor: "#ff6b00",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  nextText: {
    color: "#fff",
    fontWeight: "700",
  },
  loginLink: {
    textAlign: "center",
    color: "#ff6b00",
    marginTop: 15,
    fontWeight: "600",
  },
});

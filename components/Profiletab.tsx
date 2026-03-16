import React, { useRef, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

interface ProfileTabProps {
  user: any;
  profile: any;
  profileName: string;
  profileEmail: string;
  onEditProfile: () => void;
  onNavigateOrders: () => void;
  onLogout: () => void;
  maskCardNumber: (card: string) => string;
}

function AnimatedRow({
  icon, label, value, onPress, accent, index,
}: {
  icon: string; label: string; value?: string;
  onPress?: () => void; accent?: boolean; index: number;
}) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, delay: index * 60, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, delay: index * 60, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={styles.rowItem}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <View style={[styles.rowIconWrap, accent && styles.rowIconWrapAccent]}>
          <Feather name={icon as any} size={18} color={accent ? "#DC3545" : "#FF5722"} />
        </View>
        <View style={styles.rowTextWrap}>
          <Text style={[styles.rowLabel, accent && styles.rowLabelAccent]}>{label}</Text>
          {value ? <Text style={styles.rowValue} numberOfLines={1}>{value}</Text> : null}
        </View>
        {onPress && <Feather name="chevron-right" size={18} color={accent ? "#DC3545" : "#CCC"} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionCardTitle}>{title}</Text>
      <View style={styles.sectionCardInner}>{children}</View>
    </View>
  );
}

export default function ProfileTab({
  user, profile, profileName, profileEmail,
  onEditProfile, onNavigateOrders, onLogout, maskCardNumber,
}: ProfileTabProps) {
  const headerFade  = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const logoutScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  // ✅ FIXED: Sign Out button handler
  // Runs a quick press animation then calls onLogout()
  // onLogout() is defined in home.tsx — it:
  //   1. Shows a confirm Alert
  //   2. Awaits Firebase signOut()
  //   3. Clears all state
  //   4. Calls router.replace("/login")
  const handleSignOutPress = () => {
    Animated.sequence([
      Animated.spring(logoutScale, { toValue: 0.95, useNativeDriver: true, tension: 200, friction: 10 }),
      Animated.spring(logoutScale, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 10 }),
    ]).start(() => {
      // ✅ Called AFTER animation completes — triggers the full logout flow
      onLogout();
    });
  };

  // ✅ Guest navigation handlers
  const goToLogin    = () => router.replace("/login");
  const goToRegister = () => router.push("/register");

  const initials = profileName
    ? profileName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Profile</Text>
        {user && (
          <TouchableOpacity style={styles.editIconBtn} onPress={onEditProfile} activeOpacity={0.8}>
            <Feather name="edit-2" size={18} color="#FF5722" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Hero card ── */}
      <Animated.View style={[styles.heroCard, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
        <View style={styles.blobTR} />
        <View style={styles.blobBL} />
        <View style={styles.avatarWrap}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          {user && (
            <TouchableOpacity style={styles.avatarEditBtn} onPress={onEditProfile}>
              <Feather name="camera" size={13} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.heroName}>{profileName || "Guest User"}</Text>
        <Text style={styles.heroEmail}>{profileEmail || "Not logged in"}</Text>
        {user ? (
          <TouchableOpacity style={styles.heroBtn} onPress={onEditProfile} activeOpacity={0.85}>
            <Feather name="edit-2" size={14} color="#FF5722" style={{ marginRight: 6 }} />
            <Text style={styles.heroBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.heroBtn} onPress={goToLogin} activeOpacity={0.85}>
            <Feather name="log-in" size={14} color="#FF5722" style={{ marginRight: 6 }} />
            <Text style={styles.heroBtnText}>Sign in to your account</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* ── Quick stats (logged-in only) ── */}
      {user && (
        <View style={styles.statsRow}>
          {[
            { icon: "map-pin",     label: "Address", value: profile?.address    ? "Set"   : "Not set" },
            { icon: "credit-card", label: "Payment", value: profile?.cardNumber ? "Saved" : "Not set" },
            { icon: "phone",       label: "Phone",   value: profile?.phone      || "Not set" },
          ].map((stat, i) => (
            <TouchableOpacity key={i} style={styles.statCard} onPress={onEditProfile} activeOpacity={0.8}>
              <View style={styles.statIconWrap}>
                <Feather name={stat.icon as any} size={16} color="#FF5722" />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Account section ── */}
      <SectionCard title="Account">
        <AnimatedRow icon="shopping-bag" label="Order History" onPress={onNavigateOrders} index={0} />
        {user && (
          <>
            <View style={styles.rowDivider} />
            <AnimatedRow icon="credit-card" label="Payment Methods" value={maskCardNumber(profile?.cardNumber || "")} onPress={onEditProfile} index={1} />
            <View style={styles.rowDivider} />
            <AnimatedRow icon="map-pin" label="Delivery Address" value={profile?.address || "Not set"} onPress={onEditProfile} index={2} />
            <View style={styles.rowDivider} />
            <AnimatedRow icon="bell" label="Notifications" onPress={onEditProfile} index={3} />
          </>
        )}
      </SectionCard>

      {/* ── Support section ── */}
      <SectionCard title="Support">
        <AnimatedRow icon="help-circle" label="Help & Support" onPress={() => {}} index={4} />
        <View style={styles.rowDivider} />
        <AnimatedRow icon="info" label="About" onPress={() => {}} index={5} />
      </SectionCard>

      {/* ══════════════════════════════════════════════
          ── LOGGED IN → Sign Out button
          ── GUEST     → Sign In + Sign Up buttons
          ══════════════════════════════════════════════ */}
      {user ? (

        <View style={styles.logoutSection}>
          {/* Signed-in indicator */}
          <View style={styles.signedInRow}>
            <View style={styles.signedInDot} />
            <Text style={styles.signedInText}>Signed in as </Text>
            <Text style={styles.signedInEmail} numberOfLines={1}>{profileEmail}</Text>
          </View>

          {/* ✅ Sign Out button — onPress triggers full logout + navigation */}
          <Animated.View style={{ transform: [{ scale: logoutScale }] }}>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleSignOutPress}   // ← THIS calls onLogout() → router.replace("/login")
              activeOpacity={0.85}
            >
              <View style={styles.logoutIconWrap}>
                <Feather name="log-out" size={20} color="#DC3545" />
              </View>
              <View style={styles.logoutTextWrap}>
                <Text style={styles.logoutTitle}>Sign Out</Text>
                <Text style={styles.logoutSubtitle}>You'll be redirected to login</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#DC354580" />
            </TouchableOpacity>
          </Animated.View>
        </View>

      ) : (

        <View style={styles.guestSection}>
          {/* Info banner */}
          <View style={styles.guestBanner}>
            <Feather name="info" size={15} color="#FF5722" style={{ marginRight: 8, marginTop: 1 }} />
            <Text style={styles.guestBannerText}>
              Sign in to track orders, save your address and payment methods.
            </Text>
          </View>

          {/* ✅ Sign In → /login */}
          <TouchableOpacity style={styles.signInBtn} onPress={goToLogin} activeOpacity={0.85}>
            <Feather name="log-in" size={18} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>

          {/* ✅ Sign Up → /register */}
          <TouchableOpacity style={styles.registerBtn} onPress={goToRegister} activeOpacity={0.85}>
            <Text style={styles.registerBtnText}>
              Don't have an account?{"  "}
              <Text style={styles.registerBtnLink}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>

      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAF8" },
  content:   { paddingBottom: 20 },

  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 54, paddingBottom: 16 },
  pageTitle:   { fontSize: 26, fontWeight: "900", color: "#1A1A1A", letterSpacing: -0.5 },
  editIconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFF0EB", justifyContent: "center", alignItems: "center" },

  heroCard:      { marginHorizontal: 20, marginBottom: 20, borderRadius: 24, backgroundColor: "#1A1A1A", padding: 28, alignItems: "center", overflow: "hidden" },
  blobTR:        { position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: "#FF5722", opacity: 0.15 },
  blobBL:        { position: "absolute", bottom: -50, left: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: "#FF9800", opacity: 0.1 },
  avatarWrap:    { position: "relative", marginBottom: 14 },
  avatarRing:    { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: "#FF5722", justifyContent: "center", alignItems: "center" },
  avatar:        { width: 76, height: 76, borderRadius: 38, backgroundColor: "#FF5722", justifyContent: "center", alignItems: "center" },
  avatarText:    { fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: 1 },
  avatarEditBtn: { position: "absolute", bottom: 0, right: -2, width: 26, height: 26, borderRadius: 13, backgroundColor: "#FF5722", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#1A1A1A" },
  heroName:      { fontSize: 22, fontWeight: "900", color: "#fff", letterSpacing: -0.4, marginBottom: 4 },
  heroEmail:     { fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 20 },
  heroBtn:       { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,87,34,0.15)", borderWidth: 1, borderColor: "rgba(255,87,34,0.35)", paddingHorizontal: 18, paddingVertical: 9, borderRadius: 50 },
  heroBtnText:   { color: "#FF8A65", fontSize: 14, fontWeight: "700" },

  statsRow:     { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  statCard:     { flex: 1, backgroundColor: "#fff", borderRadius: 16, paddingVertical: 14, paddingHorizontal: 10, alignItems: "center", borderWidth: 1, borderColor: "#F0EDE8", shadowColor: "#1A1A1A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#FFF0EB", justifyContent: "center", alignItems: "center", marginBottom: 8 },
  statValue:    { fontSize: 13, fontWeight: "800", color: "#1A1A1A", marginBottom: 2, textAlign: "center" },
  statLabel:    { fontSize: 10, color: "#aaa", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3, textAlign: "center" },

  sectionCard:      { marginHorizontal: 20, marginBottom: 16 },
  sectionCardTitle: { fontSize: 13, fontWeight: "800", color: "#aaa", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10, paddingLeft: 4 },
  sectionCardInner: { backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "#F0EDE8", shadowColor: "#1A1A1A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },

  rowItem:           { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 15 },
  rowIconWrap:       { width: 38, height: 38, borderRadius: 12, backgroundColor: "#FFF0EB", justifyContent: "center", alignItems: "center", marginRight: 14 },
  rowIconWrapAccent: { backgroundColor: "#FEE2E2" },
  rowTextWrap:       { flex: 1 },
  rowLabel:          { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  rowLabelAccent:    { color: "#DC3545" },
  rowValue:          { fontSize: 12, color: "#aaa", marginTop: 2, fontWeight: "500" },
  rowDivider:        { height: 1, backgroundColor: "#F5F2EE", marginLeft: 68 },

  // ── Logged-in: Sign Out ──
  logoutSection:  { paddingHorizontal: 20, marginTop: 4 },
  signedInRow:    { flexDirection: "row", alignItems: "center", marginBottom: 12, paddingHorizontal: 4 },
  signedInDot:    { width: 7, height: 7, borderRadius: 4, backgroundColor: "#10B981", marginRight: 7 },
  signedInText:   { fontSize: 12, color: "#aaa", fontWeight: "500" },
  signedInEmail:  { fontSize: 12, color: "#888", fontWeight: "700", flex: 1 },
  logoutBtn:      { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#FECACA", borderRadius: 18, padding: 16, gap: 14, shadowColor: "#DC3545", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  logoutIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#FEE2E2", justifyContent: "center", alignItems: "center" },
  logoutTextWrap: { flex: 1 },
  logoutTitle:    { fontSize: 16, fontWeight: "800", color: "#DC3545", letterSpacing: -0.2 },
  logoutSubtitle: { fontSize: 11, color: "#aaa", marginTop: 2, fontWeight: "500" },

  // ── Guest: Sign In / Sign Up ──
  guestSection:    { paddingHorizontal: 20, marginTop: 4, gap: 12 },
  guestBanner:     { flexDirection: "row", alignItems: "flex-start", backgroundColor: "#FFF0EB", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#FFD5C8" },
  guestBannerText: { flex: 1, fontSize: 13, color: "#FF5722", fontWeight: "600", lineHeight: 19 },
  signInBtn:       { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#FF5722", paddingVertical: 16, borderRadius: 18, shadowColor: "#FF5722", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  signInBtnText:   { color: "#fff", fontSize: 16, fontWeight: "800" },
  registerBtn:     { alignItems: "center", paddingVertical: 6 },
  registerBtnText: { fontSize: 14, color: "#aaa", fontWeight: "500" },
  registerBtnLink: { color: "#FF5722", fontWeight: "800" },
});
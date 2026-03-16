import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  StatusBar,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import FoodItem from "./FoodItem";

const { width } = Dimensions.get("window");

type MenuItem = {
  id: string;
  name: string;
  price: string;
  category?: string;
  description?: string;
  image?: string;
  status?: string;
};

interface HomeTabProps {
  menuItems: MenuItem[];
  categories: { id: string; name: string }[];
  selectedCategory: string | null;
  loadingMenu: boolean;
  onSelectCategory: (category: string | null) => void;
  onAddToCart: (item: MenuItem) => void;
  onNavigateMenu?: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  "Street Eats": "zap",
  "Comfort Classics": "heart",
  "Global Bowls": "globe",
  "Plant Forward": "feather",
  "Seafood & Grill": "anchor",
  "Small Plates & Shareables": "share-2",
  "Desserts & Drinks": "coffee",
  All: "grid",
};

const PROMOS = [
  { id: "1", title: "Free Delivery", subtitle: "On your first order",    badge: "NEW USER", accent: "#FF5722", bg: "#1A1A1A", icon: "truck"   },
  { id: "2", title: "20% OFF",       subtitle: "Street Eats today only", badge: "LIMITED",  accent: "#FF9800", bg: "#2C1810", icon: "zap"     },
  { id: "3", title: "Combo Deals",   subtitle: "Meal + Drink from R89",  badge: "POPULAR",  accent: "#4CAF50", bg: "#0D2010", icon: "package" },
];

// ─── Promo Banner Card ───────────────────────────────────────────────────────
// FIX: use setTimeout so animation fires AFTER the horizontal ScrollView mounts.
// Using Animated.delay inside a nested ScrollView often gets swallowed — setTimeout is reliable.
function PromoCard({ promo, index }: { promo: typeof PROMOS[0]; index: number }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(80)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    const delay = 120 + index * 160; // 120ms base + 160ms stagger per card
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 55,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.88}
        style={[styles.promoCard, { backgroundColor: promo.bg }]}
      >
        <View style={[styles.promoBlob, { backgroundColor: promo.accent }]} />
        <View style={styles.promoContent}>
          <View style={[styles.promoBadge, { borderColor: promo.accent }]}>
            <Text style={[styles.promoBadgeText, { color: promo.accent }]}>{promo.badge}</Text>
          </View>
          <Text style={styles.promoTitle}>{promo.title}</Text>
          <Text style={styles.promoSubtitle}>{promo.subtitle}</Text>
          <View style={[styles.promoBtn, { backgroundColor: promo.accent }]}>
            <Text style={styles.promoBtnText}>Grab it →</Text>
          </View>
        </View>
        <View style={[styles.promoIconCircle, { backgroundColor: promo.accent + "22" }]}>
          <Icon name={promo.icon as any} size={20} color={promo.accent} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Featured Item Card ───────────────────────────────────────────────────────
function FeaturedCard({ item, onAdd, index }: { item: MenuItem; onAdd: (item: MenuItem) => void; index: number }) {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const price = parseFloat(item.price || "0");

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 9, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start();
    }, 80 + index * 90);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.featuredCardWrap, { transform: [{ translateX: slideAnim }], opacity: fadeAnim }]}>
      <TouchableOpacity activeOpacity={0.92} style={styles.featuredCard}>
        <View style={styles.featuredImgWrap}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.featuredImg} resizeMode="cover" />
          ) : (
            <View style={styles.featuredImgPlaceholder}>
              <Icon name="image" size={28} color="#555" />
            </View>
          )}
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>⭐ Popular</Text>
          </View>
        </View>
        <View style={styles.featuredInfo}>
          <Text style={styles.featuredName} numberOfLines={2}>{item.name}</Text>
          {item.description ? <Text style={styles.featuredDesc} numberOfLines={1}>{item.description}</Text> : null}
          <View style={styles.featuredBottom}>
            <Text style={styles.featuredPrice}>R{price.toFixed(2)}</Text>
            <TouchableOpacity style={styles.featuredAddBtn} onPress={() => onAdd(item)} activeOpacity={0.85}>
              <Icon name="plus" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Animated Category Chip ───────────────────────────────────────────────────
function AnimatedCategoryChip({ label, isActive, onPress, index }: {
  label: string; isActive: boolean; onPress: () => void; index: number;
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const iconName  = CATEGORY_ICONS[label] || "tag";

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, delay: index * 55, useNativeDriver: true, tension: 80, friction: 8 }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={[styles.chip, isActive && styles.chipActive]}>
        <Icon name={iconName as any} size={13} color={isActive ? "#fff" : "#888"} style={{ marginRight: 5 }} />
        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection({ onViewMenu }: { onViewMenu?: () => void }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const [greeting, setGreeting] = useState("Good Day");

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12)      setGreeting("Good Morning");
    else if (h < 17) setGreeting("Good Afternoon");
    else             setGreeting("Good Evening");

    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.heroContainer}>
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />
      <View style={styles.blobCenter} />
      <Animated.View style={[styles.heroContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.heroBadge}>
          <View style={styles.heroBadgeDot} />
          <Text style={styles.heroBadgeText}>Open Now • Fast Delivery</Text>
        </View>
        <Text style={styles.heroGreeting}>{greeting} 👋</Text>
        <Text style={styles.heroTitle}>
          What are you{"\n"}<Text style={styles.heroTitleAccent}>craving</Text> today?
        </Text>
        <Text style={styles.heroSubtitle}>Fresh ingredients. Bold flavors. Right to your door.</Text>
        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.heroPrimaryBtn} onPress={onViewMenu} activeOpacity={0.85}>
            <Icon name="menu" size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.heroPrimaryBtnText}>View Full Menu</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.heroSecondaryBtn} activeOpacity={0.85}>
            <Icon name="search" size={16} color="#FF5722" />
          </TouchableOpacity>
        </View>
        <View style={styles.heroStats}>
          {[
            { val: "30–45", label: "min delivery" },
            { val: "4.9★",  label: "rating" },
            { val: "R5",    label: "delivery fee" },
            { val: "50+",   label: "dishes" },
          ].map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={styles.heroStatDivider} />}
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{s.val}</Text>
                <Text style={styles.heroStatLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, onSeeAll }: { title: string; subtitle?: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} style={styles.seeAllBtn}>
          <Text style={styles.seeAllText}>See all</Text>
          <Icon name="arrow-right" size={13} color="#FF5722" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main HomeTab ──────────────────────────────────────────────────────────────
export default function HomeTab({
  menuItems, categories, selectedCategory, loadingMenu,
  onSelectCategory, onAddToCart, onNavigateMenu,
}: HomeTabProps) {
  const filteredItems  = selectedCategory ? menuItems.filter((i) => i.category === selectedCategory) : menuItems;
  const featuredItems  = menuItems.slice(0, 6);
  const allCategories  = [{ id: "all", name: "All" }, ...categories];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAF8" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Top Bar ── */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.appName}>FoodHub</Text>
            <View style={styles.locationRow}>
              <Icon name="map-pin" size={12} color="#FF5722" />
              <Text style={styles.locationText}>Deliver to current location</Text>
              <Icon name="chevron-down" size={12} color="#FF5722" />
            </View>
          </View>
          <View style={styles.topBarActions}>
            <TouchableOpacity style={styles.topBarBtn}>
              <Icon name="bell" size={19} color="#1A1A1A" />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Hero ── */}
        <HeroSection onViewMenu={onNavigateMenu} />

        {/* ── 🔥 Hot Deals Promos ── */}
        <SectionHeader title="🔥 Hot Deals" subtitle="Limited time offers" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.promoScrollContent}
          style={styles.promoScroll}
        >
          {PROMOS.map((promo, i) => (
            <PromoCard key={promo.id} promo={promo} index={i} />
          ))}
        </ScrollView>

        {/* ── ⭐ Popular ── */}
        {!loadingMenu && featuredItems.length > 0 && (
          <>
            <SectionHeader title="⭐ Popular Right Now" subtitle="Most ordered today" onSeeAll={onNavigateMenu} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScrollContent}
              style={{ marginBottom: 28 }}
            >
              {featuredItems.map((item, index) => (
                <FeaturedCard key={item.id} item={item} onAdd={onAddToCart} index={index} />
              ))}
            </ScrollView>
          </>
        )}

        {/* ── Browse Menu ── */}
        <View style={styles.browseDivider}>
          <View style={styles.browseDividerLine} />
          <Text style={styles.browseDividerText}>BROWSE MENU</Text>
          <View style={styles.browseDividerLine} />
        </View>

        <View style={styles.menuCountRow}>
          <Text style={styles.menuCountText}>{filteredItems.length} items available</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer} style={styles.categoriesScroll}>
          {allCategories.map((c, index) => (
            <AnimatedCategoryChip
              key={c.id}
              label={c.name}
              isActive={c.name === "All" ? selectedCategory === null : selectedCategory === c.name}
              onPress={() => onSelectCategory(c.name === "All" ? null : c.name)}
              index={index}
            />
          ))}
        </ScrollView>

        {loadingMenu ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF5722" />
            <Text style={styles.loadingText}>Loading fresh menu…</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Icon name="coffee" size={38} color="#FF5722" />
            </View>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyText}>Try a different category</Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            renderItem={({ item, index }) => <FoodItem item={item} onAddToCart={onAddToCart} index={index} />}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          />
        )}

        <View style={{ height: 130 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: "#FAFAF8" },
  scrollView:    { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  topBar:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 54, paddingBottom: 12 },
  appName:       { fontSize: 26, fontWeight: "900", color: "#1A1A1A", letterSpacing: -0.5 },
  locationRow:   { flexDirection: "row", alignItems: "center", marginTop: 3, gap: 3 },
  locationText:  { fontSize: 12, color: "#888", marginHorizontal: 2 },
  topBarActions: { flexDirection: "row", gap: 10 },
  topBarBtn:     { width: 44, height: 44, borderRadius: 22, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  notifDot:      { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF5722", borderWidth: 1.5, borderColor: "#fff" },

  heroContainer: { marginHorizontal: 20, marginTop: 8, marginBottom: 28, borderRadius: 28, backgroundColor: "#1A1A1A", padding: 26, overflow: "hidden", minHeight: 260 },
  blobTopRight:  { position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: "#FF5722", opacity: 0.16 },
  blobBottomLeft:{ position: "absolute", bottom: -60, left: -30, width: 200, height: 200, borderRadius: 100, backgroundColor: "#FF9800", opacity: 0.1 },
  blobCenter:    { position: "absolute", top: "40%", right: "30%", width: 80, height: 80, borderRadius: 40, backgroundColor: "#FF5722", opacity: 0.06 },
  heroContent:   { zIndex: 1 },
  heroBadge:     { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,87,34,0.18)", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,87,34,0.3)" },
  heroBadgeDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: "#FF5722", marginRight: 7 },
  heroBadgeText: { color: "#FF8A65", fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  heroGreeting:  { fontSize: 14, color: "rgba(255,255,255,0.45)", fontWeight: "600", marginBottom: 4 },
  heroTitle:     { fontSize: 30, fontWeight: "900", color: "#fff", lineHeight: 36, letterSpacing: -0.8, marginBottom: 8 },
  heroTitleAccent: { color: "#FF5722", fontStyle: "italic" },
  heroSubtitle:  { fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 20, lineHeight: 19 },
  heroActions:   { flexDirection: "row", gap: 10, marginBottom: 20, alignItems: "center" },
  heroPrimaryBtn:{ flexDirection: "row", alignItems: "center", backgroundColor: "#FF5722", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 50, shadowColor: "#FF5722", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  heroPrimaryBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  heroSecondaryBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,87,34,0.15)", borderWidth: 1, borderColor: "rgba(255,87,34,0.3)", justifyContent: "center", alignItems: "center" },
  heroStats:     { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 14, padding: 14 },
  heroStat:      { flex: 1, alignItems: "center" },
  heroStatValue: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: -0.3 },
  heroStatLabel: { color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 2 },
  heroStatDivider: { width: 1, height: 26, backgroundColor: "rgba(255,255,255,0.1)" },

  sectionHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 20, marginBottom: 14 },
  sectionTitle:    { fontSize: 19, fontWeight: "800", color: "#1A1A1A", letterSpacing: -0.3 },
  sectionSubtitle: { fontSize: 12, color: "#aaa", marginTop: 2 },
  seeAllBtn:       { flexDirection: "row", alignItems: "center", gap: 4 },
  seeAllText:      { fontSize: 13, color: "#FF5722", fontWeight: "700" },

  // KEY FIX: overflow visible so translateX animation isn't clipped
  promoScroll:        { marginBottom: 28, overflow: "visible" },
  promoScrollContent: { paddingHorizontal: 20, gap: 10, paddingVertical: 4 },
  promoCard:          { width: width * -7, borderRadius: 18, padding: 14, overflow: "hidden", flexDirection: "row", alignItems: "center", justifyContent: "space-between", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 },
  promoBlob:          { position: "absolute", top: -20, right: -20, width: 70, height: 70, borderRadius: 35, opacity: 0.15 },
  promoContent:       { flex: 1, zIndex: 1 },
  promoBadge:         { alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 1, marginBottom: 5 },
  promoBadgeText:     { fontSize: 8, fontWeight: "800", letterSpacing: 0.6 },
  promoTitle:         { fontSize: 16, fontWeight: "900", color: "#fff", letterSpacing: -0.3, marginBottom: 2 },
  promoSubtitle:      { fontSize: 10, color: "rgba(255,255,255,0.6)", marginBottom: 10, lineHeight: 14 },
  promoBtn:           { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  promoBtnText:       { color: "#fff", fontSize: 10, fontWeight: "800" },
  promoIconCircle:    { width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center", zIndex: 1 },

  featuredScrollContent: { paddingHorizontal: 20, gap: 12, paddingVertical: 4 },
  featuredCardWrap: { shadowColor: "#1A1A1A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  featuredCard:     { width: 170, backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "#F0EDE8" },
  featuredImgWrap:  { width: "100%", height: 130, position: "relative" },
  featuredImg:      { width: "100%", height: "100%" },
  featuredImgPlaceholder: { width: "100%", height: "100%", backgroundColor: "#2A2A2A", justifyContent: "center", alignItems: "center" },
  featuredBadge:    { position: "absolute", bottom: 8, left: 8, backgroundColor: "rgba(26,26,26,0.8)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  featuredBadgeText:{ color: "#FFD700", fontSize: 10, fontWeight: "700" },
  featuredInfo:     { padding: 12 },
  featuredName:     { fontSize: 14, fontWeight: "800", color: "#1A1A1A", marginBottom: 4, lineHeight: 19 },
  featuredDesc:     { fontSize: 11, color: "#aaa", marginBottom: 10 },
  featuredBottom:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  featuredPrice:    { fontSize: 16, fontWeight: "900", color: "#FF5722" },
  featuredAddBtn:   { width: 32, height: 32, borderRadius: 16, backgroundColor: "#FF5722", justifyContent: "center", alignItems: "center", shadowColor: "#FF5722", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 4 },

  browseDivider:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 16 },
  browseDividerLine: { flex: 1, height: 1, backgroundColor: "#EDEAE5" },
  browseDividerText: { marginHorizontal: 12, fontSize: 11, fontWeight: "800", color: "#bbb", letterSpacing: 1.2 },
  menuCountRow:      { paddingHorizontal: 20, marginBottom: 14 },
  menuCountText:     { fontSize: 13, color: "#aaa", fontWeight: "600" },

  categoriesScroll:    { marginBottom: 20 },
  categoriesContainer: { paddingHorizontal: 20, gap: 8, paddingVertical: 4 },
  chip:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingVertical: 9, borderRadius: 50, backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#E8E8E8", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  chipActive: { backgroundColor: "#FF5722", borderColor: "#FF5722", shadowColor: "#FF5722", shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  chipText:       { fontSize: 13, color: "#666", fontWeight: "600" },
  chipTextActive: { color: "#fff", fontWeight: "700" },

  listContent:      { paddingHorizontal: 20 },
  loadingContainer: { paddingVertical: 60, alignItems: "center" },
  loadingText:      { marginTop: 14, color: "#aaa", fontSize: 14, fontWeight: "600" },
  emptyContainer:   { paddingVertical: 60, alignItems: "center" },
  emptyIconWrap:    { width: 88, height: 88, borderRadius: 44, backgroundColor: "#FFF0EB", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  emptyTitle:       { fontSize: 18, fontWeight: "800", color: "#1A1A1A", marginBottom: 6 },
  emptyText:        { fontSize: 14, color: "#aaa" },
});
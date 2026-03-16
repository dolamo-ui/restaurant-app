/**
 * MenuTab.tsx  — v2
 *
 * Sections:
 *  🔥 Popular Items        — top-rated / most ordered
 *  🎁 Combo Meals          — combos category
 *  ⚡ Special Offers       — discounted / highlighted items
 *  🌿 Vegetarian & Vegan   — Plant Forward category
 *
 * Features:
 *  - Tap any item → ProductDetailModal (extras, qty, note, live price)
 *  - Search bar with focus glow
 *  - Section tab bar (All / Popular / Combos / Offers / Veg)
 *  - Category filter chips + Sort modal (in All view)
 *  - Grid / List view toggle
 *  - Smooth staggered animations
 */

import React, { useRef, useEffect, useState, useMemo } from "react";
import {
  View, Text, TextInput, ScrollView,
  TouchableOpacity, Image, StyleSheet,
  Animated, Dimensions, Modal, StatusBar, ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import ProductDetailModal from "./ProductDetailModal";

const { width } = Dimensions.get("window");
const GRID_CARD_WIDTH = (width - 56) / 2;

type MenuItem = {
  id: string; name: string; price: string;
  category?: string; description?: string;
  image?: string; status?: string;
};
type CartItem = {
  id: string; name: string; price: number; quantity: number;
  image?: string; extras?: any[]; note?: string;
};
interface MenuTabProps {
  menuItems: MenuItem[];
  categories: { id: string; name: string }[];
  loadingMenu: boolean;
  onAddToCart: (item: CartItem) => void;
}
type SortOption = "popular" | "price_asc" | "price_desc" | "name";
type ViewMode = "list" | "grid";
type ActiveSection = "all" | "popular" | "combos" | "offers" | "veg";

const CAT_ICONS: Record<string, string> = {
  "Street Eats": "zap", "Comfort Classics": "heart", "Global Bowls": "globe",
  "Plant Forward": "feather", "Seafood & Grill": "anchor",
  "Small Plates & Shareables": "share-2", "Desserts & Drinks": "coffee", All: "grid",
};
const SORT_OPTIONS: { key: SortOption; label: string; icon: string }[] = [
  { key: "popular", label: "Popular", icon: "trending-up" },
  { key: "price_asc", label: "Price: Low → High", icon: "arrow-up" },
  { key: "price_desc", label: "Price: High → Low", icon: "arrow-down" },
  { key: "name", label: "A → Z", icon: "type" },
];
const SECTION_TABS: { key: ActiveSection; icon: string; label: string; color: string; bg: string }[] = [
  { key: "all",     icon: "grid",        label: "All",       color: "#FF5722", bg: "#FFF0EB" },
  { key: "popular", icon: "trending-up", label: "Popular",   color: "#B45309", bg: "#FEF3C7" },
  { key: "combos",  icon: "package",     label: "Combos",    color: "#1D4ED8", bg: "#DBEAFE" },
  { key: "offers",  icon: "tag",         label: "Offers",    color: "#065F46", bg: "#D1FAE5" },
  { key: "veg",     icon: "feather",     label: "Veg/Vegan", color: "#166534", bg: "#DCFCE7" },
];

const isVeg   = (i: MenuItem) => i.category === "Plant Forward" || i.name.toLowerCase().includes("veg") || (i.description || "").toLowerCase().includes("vegan");
const isCombo = (i: MenuItem) => i.category === "Combo Meals"  || i.name.toLowerCase().includes("combo") || (i.description || "").toLowerCase().includes("combo");
const isOffer = (i: MenuItem) => parseFloat(i.price || "0") < 60 || i.name.toLowerCase().includes("special") || i.name.toLowerCase().includes("deal");

// ─── Animated wrapper ────────────────────────────────────────────────────────
function CardWrap({ index, children }: { index: number; children: React.ReactNode }) {
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 360, delay: index * 50, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, delay: index * 50, tension: 75, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>{children}</Animated.View>;
}

// ─── Veg dot ─────────────────────────────────────────────────────────────────
function VegDot() {
  return (
    <View style={s.vegDot}>
      <View style={s.vegDotCore} />
    </View>
  );
}

// ─── List Card ────────────────────────────────────────────────────────────────
function ListCard({ item, onPress, index }: { item: MenuItem; onPress: () => void; index: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const price = parseFloat(item.price || "0");
  return (
    <CardWrap index={index}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() => Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, tension: 200, friction: 10 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start()}
        onPress={onPress}
        style={{ marginBottom: 12 }}
      >
        <Animated.View style={[s.listCard, { transform: [{ scale }] }]}>
          <View style={s.listImgWrap}>
            {item.image
              ? <Image source={{ uri: item.image }} style={s.listImg} resizeMode="cover" />
              : <View style={s.listImgPh}><Icon name="image" size={24} color="#444" /></View>
            }
            {isVeg(item) && <VegDot />}
          </View>
          <View style={s.listInfo}>
            <View>
              <Text style={s.listName} numberOfLines={2}>{item.name}</Text>
              {item.category && (
                <View style={s.listCatBadge}>
                  <Text style={s.listCatText}>{item.category}</Text>
                </View>
              )}
              {item.description ? <Text style={s.listDesc} numberOfLines={2}>{item.description}</Text> : null}
            </View>
            <View style={s.listBottom}>
              <View>
                <Text style={s.listPriceLabel}>From</Text>
                <Text style={s.listPrice}>R{price.toFixed(2)}</Text>
              </View>
              <View style={s.tapHint}>
                <Icon name="edit-2" size={12} color="#FF5722" />
                <Text style={s.tapHintText}>Customise</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </CardWrap>
  );
}

// ─── Grid Card ────────────────────────────────────────────────────────────────
function GridCard({ item, onPress, index }: { item: MenuItem; onPress: () => void; index: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const price = parseFloat(item.price || "0");
  return (
    <CardWrap index={index}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, tension: 200, friction: 10 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start()}
        onPress={onPress}
        style={{ marginBottom: 14 }}
      >
        <Animated.View style={[s.gridCard, { transform: [{ scale }] }]}>
          <View style={s.gridImgWrap}>
            {item.image
              ? <Image source={{ uri: item.image }} style={s.gridImg} resizeMode="cover" />
              : <View style={s.gridImgPh}><Icon name="image" size={24} color="#444" /></View>
            }
            {isVeg(item) && <VegDot />}
            {item.category && (
              <View style={s.gridCatBadge}>
                <Text style={s.gridCatText}>{item.category}</Text>
              </View>
            )}
          </View>
          <View style={s.gridInfo}>
            <Text style={s.gridName} numberOfLines={2}>{item.name}</Text>
            {item.description ? <Text style={s.gridDesc} numberOfLines={1}>{item.description}</Text> : null}
            <View style={s.gridBottom}>
              <Text style={s.gridPrice}>R{price.toFixed(2)}</Text>
              <View style={s.gridEditBtn}>
                <Icon name="edit-2" size={13} color="#FF5722" />
              </View>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </CardWrap>
  );
}

// ─── Section banner ───────────────────────────────────────────────────────────
function Banner({ emoji, title, sub, blobColor, bgColor }: { emoji: string; title: string; sub: string; blobColor: string; bgColor: string }) {
  return (
    <View style={[s.banner, { backgroundColor: bgColor }]}>
      <View style={[s.bannerBlob, { backgroundColor: blobColor }]} />
      <View style={[s.bannerBlobB, { backgroundColor: blobColor }]} />
      <View style={s.bannerContent}>
        <Text style={s.bannerEmoji}>{emoji}</Text>
        <Text style={s.bannerTitle}>{title}</Text>
        <Text style={s.bannerSub}>{sub}</Text>
      </View>
    </View>
  );
}

// ─── Section heading row ──────────────────────────────────────────────────────
function SecHeading({ icon, label, count, color, bg }: { icon: string; label: string; count: number; color: string; bg: string }) {
  return (
    <View style={s.secHeading}>
      <View style={[s.secHeadingIcon, { backgroundColor: bg }]}>
        <Icon name={icon as any} size={16} color={color} />
      </View>
      <Text style={s.secHeadingLabel}>{label}</Text>
      <View style={s.secHeadingLine} />
      <View style={[s.secHeadingBadge, { backgroundColor: bg }]}>
        <Text style={[s.secHeadingCount, { color }]}>{count}</Text>
      </View>
    </View>
  );
}

// ─── Sort modal ───────────────────────────────────────────────────────────────
function SortModal({ visible, current, onSelect, onClose }: { visible: boolean; current: SortOption; onSelect: (s: SortOption) => void; onClose: () => void }) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity style={s.sortOverlay} onPress={onClose} activeOpacity={1}>
        <View style={s.sortSheet}>
          <View style={s.sortHandle} />
          <Text style={s.sortTitle}>Sort By</Text>
          {SORT_OPTIONS.map((o) => (
            <TouchableOpacity key={o.key} style={[s.sortOpt, current === o.key && s.sortOptActive]} onPress={() => { onSelect(o.key); onClose(); }}>
              <View style={[s.sortOptIcon, current === o.key && s.sortOptIconActive]}>
                <Icon name={o.icon as any} size={16} color={current === o.key ? "#fff" : "#888"} />
              </View>
              <Text style={[s.sortOptText, current === o.key && s.sortOptTextActive]}>{o.label}</Text>
              {current === o.key && <Icon name="check" size={15} color="#FF5722" />}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MenuTab({ menuItems, categories, loadingMenu, onAddToCart }: MenuTabProps) {
  const [search, setSearch]             = useState("");
  const [selCat, setSelCat]             = useState<string | null>(null);
  const [viewMode, setViewMode]         = useState<ViewMode>("list");
  const [sortBy, setSortBy]             = useState<SortOption>("popular");
  const [sortVisible, setSortVisible]   = useState(false);
  const [section, setSection]           = useState<ActiveSection>("all");
  const [focused, setFocused]           = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [detailOpen, setDetailOpen]     = useState(false);

  const open = (item: MenuItem) => { setSelectedItem(item); setDetailOpen(true); };

  const allCats = [{ id: "all", name: "All" }, ...categories];

  const popular = useMemo(() => menuItems.slice(0, 12), [menuItems]);
  const combos  = useMemo(() => menuItems.filter(isCombo), [menuItems]);
  const offers  = useMemo(() => menuItems.filter(isOffer), [menuItems]);
  const veg     = useMemo(() => menuItems.filter(isVeg),   [menuItems]);

  const processed = useMemo(() => {
    let items = [...menuItems];
    if (selCat) items = items.filter((i) => i.category === selCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q) || (i.description || "").toLowerCase().includes(q) || (i.category || "").toLowerCase().includes(q));
    }
    if (sortBy === "price_asc")  items.sort((a, b) => parseFloat(a.price || "0") - parseFloat(b.price || "0"));
    if (sortBy === "price_desc") items.sort((a, b) => parseFloat(b.price || "0") - parseFloat(a.price || "0"));
    if (sortBy === "name")       items.sort((a, b) => a.name.localeCompare(b.name));
    return items;
  }, [menuItems, selCat, search, sortBy]);

  const groups = useMemo(() => {
    if (selCat || search.trim()) return [{ cat: selCat || "Results", items: processed }];
    const map = new Map<string, MenuItem[]>();
    processed.forEach((item) => {
      const c = item.category || "Uncategorized";
      if (!map.has(c)) map.set(c, []);
      map.get(c)!.push(item);
    });
    return Array.from(map.entries()).map(([cat, items]) => ({ cat, items }));
  }, [processed, selCat, search]);

  const renderItems = (items: MenuItem[], startIdx = 0) =>
    viewMode === "grid" ? (
      <View style={s.gridWrap}>
        {items.map((item, i) => <GridCard key={item.id} item={item} onPress={() => open(item)} index={startIdx + i} />)}
      </View>
    ) : (
      items.map((item, i) => <ListCard key={item.id} item={item} onPress={() => open(item)} index={startIdx + i} />)
    );

  const sectionCount = section === "all" ? processed.length : section === "popular" ? popular.length : section === "combos" ? combos.length : section === "offers" ? offers.length : veg.length;

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAF8" />

      {/* ── Header ──────────────────────────────────────────────── */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.headerTitle}>Menu</Text>
            <Text style={s.headerSub}>{menuItems.length} dishes available</Text>
          </View>
          <View style={s.viewToggle}>
            {(["list", "grid"] as ViewMode[]).map((m) => (
              <TouchableOpacity key={m} style={[s.viewBtn, viewMode === m && s.viewBtnActive]} onPress={() => setViewMode(m)}>
                <Icon name={m === "list" ? "list" : "grid"} size={17} color={viewMode === m ? "#FF5722" : "#aaa"} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Search */}
        <View style={[s.searchBar, focused && s.searchFocused]}>
          <Icon name="search" size={16} color={focused ? "#FF5722" : "#bbb"} />
          <TextInput
            placeholder="Search dishes, categories..."
            placeholderTextColor="#ccc"
            value={search}
            onChangeText={setSearch}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={s.searchInput}
          />
          {search.length > 0 && <TouchableOpacity onPress={() => setSearch("")}><Icon name="x" size={15} color="#aaa" /></TouchableOpacity>}
        </View>

        {/* Section tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.sectionTabsContent} style={{ marginBottom: 10 }}>
          {SECTION_TABS.map((tab) => {
            const active = section === tab.key;
            return (
              <TouchableOpacity key={tab.key}
                style={[s.sectionTab, active && { backgroundColor: tab.bg, borderColor: tab.color + "55" }]}
                onPress={() => setSection(tab.key)} activeOpacity={0.8}
              >
                <Icon name={tab.icon as any} size={13} color={active ? tab.color : "#bbb"} style={{ marginRight: 5 }} />
                <Text style={[s.sectionTabText, active && { color: tab.color, fontWeight: "800" }]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Category chips + sort (all section only) */}
        {section === "all" && (
          <View style={s.filterRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }} style={{ flex: 1 }}>
              {allCats.map((c) => {
                const active = c.name === "All" ? selCat === null : selCat === c.name;
                return (
                  <TouchableOpacity key={c.id} style={[s.chip, active && s.chipActive]} onPress={() => setSelCat(c.name === "All" ? null : c.name)} activeOpacity={0.75}>
                    <Icon name={(CAT_ICONS[c.name] || "tag") as any} size={12} color={active ? "#fff" : "#888"} style={{ marginRight: 4 }} />
                    <Text style={[s.chipText, active && s.chipTextActive]}>{c.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={s.sortBtn} onPress={() => setSortVisible(true)}>
              <Icon name="sliders" size={14} color="#FF5722" />
            </TouchableOpacity>
          </View>
        )}

        <View style={s.resultRow}>
          <Text style={s.resultCount}>{sectionCount} items</Text>
          <Text style={s.tapGlobal}>👆 Tap to customise & add extras</Text>
        </View>
      </View>

      {/* ── Content ─────────────────────────────────────────────── */}
      {loadingMenu ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color="#FF5722" />
          <Text style={s.loadingText}>Loading fresh menu…</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

          {/* ALL */}
          {section === "all" && (
            processed.length === 0 ? (
              <View style={s.emptyWrap}>
                <View style={s.emptyCircle}><Icon name="search" size={32} color="#FF5722" /></View>
                <Text style={s.emptyTitle}>No results</Text>
                <Text style={s.emptySubtitle}>{search ? `Nothing matches "${search}"` : "Try a different filter"}</Text>
                <TouchableOpacity style={s.emptyBtn} onPress={() => { setSearch(""); setSelCat(null); }}>
                  <Text style={s.emptyBtnText}>Clear Filters</Text>
                </TouchableOpacity>
              </View>
            ) : (
              groups.map((g) => (
                <View key={g.cat}>
                  <SecHeading icon={CAT_ICONS[g.cat] || "tag"} label={g.cat} count={g.items.length} color="#FF5722" bg="#FFF0EB" />
                  {renderItems(g.items)}
                </View>
              ))
            )
          )}

          {/* POPULAR */}
          {section === "popular" && (
            <View>
              <Banner emoji="🔥" title="Most Loved" sub="Tried, tested, and absolutely delicious. Order these with confidence." blobColor="#FF5722" bgColor="#1A1A1A" />
              <SecHeading icon="trending-up" label="Popular Items" count={popular.length} color="#B45309" bg="#FEF3C7" />
              {renderItems(popular)}
            </View>
          )}

          {/* COMBOS */}
          {section === "combos" && (
            <View>
              <Banner emoji="🎁" title="Combo Meals" sub="Bundle up and save! Complete meals at unbeatable value." blobColor="#3B82F6" bgColor="#0F172A" />
              {combos.length === 0 ? (
                <View>
                  <View style={s.notice}>
                    <Text style={s.noticeEmoji}>🍱</Text>
                    <Text style={s.noticeTitle}>Combos Coming Soon!</Text>
                    <Text style={s.noticeSub}>We're building amazing meal deals. Browse the full menu and build your own combo for now!</Text>
                  </View>
                  <SecHeading icon="grid" label="All Dishes" count={menuItems.length} color="#1D4ED8" bg="#DBEAFE" />
                  {renderItems(menuItems.slice(0, 12))}
                </View>
              ) : (
                <>
                  <SecHeading icon="package" label="Combo Deals" count={combos.length} color="#1D4ED8" bg="#DBEAFE" />
                  {renderItems(combos)}
                </>
              )}
            </View>
          )}

          {/* OFFERS */}
          {section === "offers" && (
            <View>
              <Banner emoji="⚡" title="Special Offers" sub="Amazing value for money. Grab these deals before they're gone!" blobColor="#22C55E" bgColor="#052E16" />
              {offers.length === 0 ? (
                <View style={s.notice}>
                  <Text style={s.noticeEmoji}>🏷️</Text>
                  <Text style={s.noticeTitle}>No Offers Today</Text>
                  <Text style={s.noticeSub}>Check back soon for daily specials and limited-time deals!</Text>
                </View>
              ) : (
                <>
                  <SecHeading icon="tag" label="Today's Specials" count={offers.length} color="#065F46" bg="#D1FAE5" />
                  {renderItems(offers)}
                </>
              )}
            </View>
          )}

          {/* VEG/VEGAN */}
          {section === "veg" && (
            <View>
              <Banner emoji="🌿" title="Veg & Vegan" sub="Plant-powered dishes full of colour, flavour, and goodness." blobColor="#4ADE80" bgColor="#052E16" />
              {veg.length === 0 ? (
                <View>
                  <View style={s.notice}>
                    <Text style={s.noticeEmoji}>🥑</Text>
                    <Text style={s.noticeTitle}>Coming Soon!</Text>
                    <Text style={s.noticeSub}>Our plant-based menu is growing. In the meantime, explore our Plant Forward category in All.</Text>
                  </View>
                </View>
              ) : (
                <View>
                  <View style={s.vegLegend}>
                    <View style={s.vegDotLarge}><View style={s.vegDotCore} /></View>
                    <Text style={s.vegLegendText}>Green dot = Vegetarian / Vegan friendly</Text>
                  </View>
                  <SecHeading icon="feather" label="Vegetarian & Vegan" count={veg.length} color="#166534" bg="#DCFCE7" />
                  {renderItems(veg)}
                </View>
              )}
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      <SortModal visible={sortVisible} current={sortBy} onSelect={setSortBy} onClose={() => setSortVisible(false)} />

      <ProductDetailModal
        item={selectedItem}
        visible={detailOpen}
        onClose={() => setDetailOpen(false)}
        onAddToCart={onAddToCart}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAF8" },
  header: { backgroundColor: "#FAFAF8", paddingTop: 54, paddingHorizontal: 20, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#F0EDE8", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 3 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#1A1A1A", letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: "#aaa", marginTop: 2, fontWeight: "600" },
  viewToggle: { flexDirection: "row", backgroundColor: "#F0EDE8", borderRadius: 12, padding: 3, gap: 2 },
  viewBtn: { width: 36, height: 32, borderRadius: 9, justifyContent: "center", alignItems: "center" },
  viewBtnActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1.5, borderColor: "#F0EDE8", gap: 10, marginBottom: 12 },
  searchFocused: { borderColor: "#FF5722", shadowColor: "#FF5722", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  searchInput: { flex: 1, fontSize: 14, color: "#1A1A1A", fontWeight: "500" },
  sectionTabsContent: { gap: 8, paddingVertical: 2 },
  sectionTab: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#E8E8E8" },
  sectionTabText: { fontSize: 13, color: "#bbb", fontWeight: "600" },
  filterRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 50, backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#E8E8E8" },
  chipActive: { backgroundColor: "#FF5722", borderColor: "#FF5722" },
  chipText: { fontSize: 12, color: "#666", fontWeight: "600" },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  sortBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFF0EB", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#FFD5C2" },
  resultRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 6 },
  resultCount: { fontSize: 12, color: "#aaa", fontWeight: "600" },
  tapGlobal: { fontSize: 11, color: "#FF5722", fontWeight: "700" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },

  // Banner
  banner: { borderRadius: 22, padding: 22, marginBottom: 22, overflow: "hidden", minHeight: 130, position: "relative" },
  bannerBlob: { position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: 70, opacity: 0.16 },
  bannerBlobB: { position: "absolute", bottom: -50, left: -20, width: 160, height: 160, borderRadius: 80, opacity: 0.1 },
  bannerContent: { zIndex: 1 },
  bannerEmoji: { fontSize: 30, marginBottom: 6 },
  bannerTitle: { fontSize: 22, fontWeight: "900", color: "#fff", letterSpacing: -0.4, marginBottom: 6 },
  bannerSub: { fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 19 },

  // Section heading
  secHeading: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16, marginTop: 4 },
  secHeadingIcon: { width: 34, height: 34, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  secHeadingLabel: { fontSize: 17, fontWeight: "800", color: "#1A1A1A", letterSpacing: -0.2 },
  secHeadingLine: { flex: 1, height: 1, backgroundColor: "#EDEAE5" },
  secHeadingBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10 },
  secHeadingCount: { fontSize: 12, fontWeight: "700" },

  // List card
  listCard: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "#F0EDE8", shadowColor: "#1A1A1A", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  listImgWrap: { width: 110, height: 110, position: "relative" },
  listImg: { width: "100%", height: "100%" },
  listImgPh: { width: "100%", height: "100%", backgroundColor: "#1E1E1E", justifyContent: "center", alignItems: "center" },
  listInfo: { flex: 1, padding: 13, justifyContent: "space-between" },
  listName: { fontSize: 15, fontWeight: "800", color: "#1A1A1A", letterSpacing: -0.3, lineHeight: 21, marginBottom: 3 },
  listCatBadge: { backgroundColor: "#F5F2EE", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start", marginBottom: 4 },
  listCatText: { fontSize: 10, color: "#888", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  listDesc: { fontSize: 12, color: "#999", lineHeight: 17 },
  listBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 8 },
  listPriceLabel: { fontSize: 10, color: "#bbb", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 1 },
  listPrice: { fontSize: 18, fontWeight: "900", color: "#FF5722", letterSpacing: -0.5 },
  tapHint: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#FFF0EB", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  tapHintText: { fontSize: 11, color: "#FF5722", fontWeight: "700" },

  // Grid card
  gridWrap: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  gridCard: { width: GRID_CARD_WIDTH, backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#F0EDE8", shadowColor: "#1A1A1A", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  gridImgWrap: { width: "100%", height: 130, position: "relative" },
  gridImg: { width: "100%", height: "100%" },
  gridImgPh: { width: "100%", height: "100%", backgroundColor: "#1E1E1E", justifyContent: "center", alignItems: "center" },
  gridCatBadge: { position: "absolute", bottom: 7, left: 7, backgroundColor: "rgba(26,26,26,0.78)", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  gridCatText: { color: "#fff", fontSize: 8, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  gridInfo: { padding: 12 },
  gridName: { fontSize: 13, fontWeight: "800", color: "#1A1A1A", marginBottom: 3, lineHeight: 18 },
  gridDesc: { fontSize: 11, color: "#aaa", marginBottom: 10 },
  gridBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  gridPrice: { fontSize: 16, fontWeight: "900", color: "#FF5722", letterSpacing: -0.4 },
  gridEditBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#FFF0EB", borderWidth: 1.5, borderColor: "#FFD5C2", justifyContent: "center", alignItems: "center" },

  // Veg
  vegDot: { position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 2 },
  vegDotCore: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#22C55E" },
  vegDotLarge: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#E0E0E0" },
  vegLegend: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#F0FDF4", borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#BBF7D0" },
  vegLegendText: { fontSize: 13, color: "#166534", fontWeight: "600", flex: 1 },

  // Notice
  notice: { alignItems: "center", backgroundColor: "#FAFAF8", borderRadius: 18, padding: 28, marginBottom: 20, borderWidth: 1, borderColor: "#F0EDE8" },
  noticeEmoji: { fontSize: 40, marginBottom: 10 },
  noticeTitle: { fontSize: 18, fontWeight: "900", color: "#1A1A1A", marginBottom: 6 },
  noticeSub: { fontSize: 13, color: "#aaa", textAlign: "center", lineHeight: 19 },

  // Loading / empty
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 14, color: "#aaa", fontSize: 14, fontWeight: "600" },
  emptyWrap: { alignItems: "center", paddingTop: 60, paddingHorizontal: 40 },
  emptyCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#FFF0EB", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#1A1A1A", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#aaa", textAlign: "center", marginBottom: 24, lineHeight: 20 },
  emptyBtn: { backgroundColor: "#FF5722", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 50 },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Sort modal
  sortOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sortSheet: { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
  sortHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0", alignSelf: "center", marginBottom: 20 },
  sortTitle: { fontSize: 18, fontWeight: "900", color: "#1A1A1A", marginBottom: 16 },
  sortOpt: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 12, borderRadius: 14, marginBottom: 8, gap: 14, backgroundColor: "#FAFAF8", borderWidth: 1, borderColor: "#F0EDE8" },
  sortOptActive: { backgroundColor: "#FFF0EB", borderColor: "#FFD5C2" },
  sortOptIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#F0EDE8", justifyContent: "center", alignItems: "center" },
  sortOptIconActive: { backgroundColor: "#FF5722" },
  sortOptText: { flex: 1, fontSize: 15, fontWeight: "600", color: "#555" },
  sortOptTextActive: { color: "#1A1A1A", fontWeight: "800" },
});
import React, { useState } from "react";
import {
  View, Text, Modal, ScrollView, TouchableOpacity,
  TextInput, Image, ActivityIndicator, StyleSheet,
  Dimensions, Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

const { width } = Dimensions.get("window");

type Extra = { id: string; label: string; price: number };

type MenuItem = {
  id: string; name: string; price: number; category: string;
  description: string; image?: string; status?: string;
  isPopular?: boolean; isCombo?: boolean; isOffer?: boolean; isVeg?: boolean;
  extras?: Extra[];
  createdAt?: any; updatedAt?: any;
};

interface AdminMenuModalProps {
  visible: boolean;
  menu: MenuItem[];
  form: Partial<MenuItem>;
  editingId: string | null;
  saving: boolean;
  loading: boolean;
  onClose: () => void;
  onFormChange: (updates: Partial<MenuItem>) => void;
  onPickImage: () => void;
  onSave: () => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string, name?: string) => void;
  formatZAR: (value: number) => string;
}

// ─── Section Toggle Pill ──────────────────────────────────────────────────────
function SectionToggle({ label, icon, active, color, onPress }: {
  label: string; icon: any; active: boolean; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        st.toggle,
        active
          ? { backgroundColor: color, borderColor: color }
          : { backgroundColor: color + "0D", borderColor: color + "35" },
      ]}
    >
      <Feather name={icon} size={13} color={active ? "#fff" : color} />
      <Text style={[st.toggleText, { color: active ? "#fff" : color }]}>{label}</Text>
      {active && (
        <View style={st.toggleCheck}>
          <Feather name="check" size={10} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
function TabBtn({ label, active, count, onPress }: {
  label: string; active: boolean; count?: number; onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[st2.tabBtn, active && st2.tabBtnActive]}>
      <Text style={[st2.tabBtnText, active && st2.tabBtnTextActive]}>{label}</Text>
      {count != null && (
        <View style={[st2.tabBadge, active && st2.tabBadgeActive]}>
          <Text style={[st2.tabBadgeText, active && st2.tabBadgeTextActive]}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Menu Item Card ───────────────────────────────────────────────────────────
// THE FIX: The Alert confirmation lives INSIDE ItemCard.
// Previously onDelete was called directly from onPress, which meant the
// parent's Alert.alert was running — and inside a Modal on Android that can
// silently swallow native alerts. By moving the Alert here (inside the Modal's
// own component tree), it fires reliably. The parent's deleteDoc call is
// still executed via the onDelete prop after the user confirms.
function ItemCard({
  item,
  isEditing,
  onEdit,
  onDelete,
  formatZAR,
}: {
  item: MenuItem;
  isEditing: boolean;
  onEdit: (i: MenuItem) => void;
  onDelete: (id: string, name?: string) => void;
  formatZAR: (v: number) => string;
}) {
  const tags = [
    item.isPopular && { label: "Popular", color: "#F59E0B" },
    item.isCombo   && { label: "Combo",   color: "#3B82F6" },
    item.isOffer   && { label: "Offer",   color: "#10B981" },
    item.isVeg     && { label: "Veg",     color: "#22C55E" },
  ].filter(Boolean) as { label: string; color: string }[];

  // Capture id & name into stable local vars before the Alert closure
  const id   = item.id;
  const name = item.name;

  const confirmDelete = () => {
    Alert.alert(
      "Delete Item",
      `Remove "${name}" from the menu?\n\nThis cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // This now calls the parent's deleteDoc directly — no second Alert
            onDelete(id, name);
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={[ic.card, isEditing && ic.cardEditing]}>
      {isEditing && (
        <View style={ic.editBanner}>
          <Feather name="edit-3" size={11} color="#FF5722" />
          <Text style={ic.editBannerText}>Currently editing</Text>
        </View>
      )}
      <View style={ic.row}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={ic.img} />
        ) : (
          <View style={ic.imgPlaceholder}>
            <Feather name="image" size={20} color="#2A2A3C" />
          </View>
        )}
        <View style={ic.info}>
          <Text style={ic.name} numberOfLines={1}>{item.name}</Text>
          <Text style={ic.price}>{formatZAR(item.price)}</Text>
          <View style={ic.catRow}>
            <Feather name="grid" size={9} color="#444" />
            <Text style={ic.cat}>{item.category}</Text>
          </View>
          {tags.length > 0 && (
            <View style={ic.tags}>
              {tags.map((t, i) => (
                <View key={i} style={[ic.tag, { backgroundColor: t.color + "1A", borderColor: t.color + "35" }]}>
                  <Text style={[ic.tagText, { color: t.color }]}>{t.label}</Text>
                </View>
              ))}
            </View>
          )}
          {item.extras && item.extras.length > 0 && (
            <View style={ic.extrasRow}>
              <Feather name="plus-circle" size={10} color="#555" />
              <Text style={ic.extrasCount}>
                {item.extras.length} extra{item.extras.length !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={ic.actions}>
        <TouchableOpacity
          style={ic.editBtn}
          onPress={() => onEdit(item)}
          activeOpacity={0.8}
        >
          <Feather name="edit-2" size={13} color="#FF5722" />
          <Text style={ic.editBtnText}>Edit</Text>
        </TouchableOpacity>

        {/* confirmDelete lives inside this Modal so the Alert fires correctly */}
        <TouchableOpacity
          style={ic.deleteBtn}
          onPress={confirmDelete}
          activeOpacity={0.8}
        >
          <Feather name="trash-2" size={13} color="#EF4444" />
          <Text style={ic.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Extras Manager ───────────────────────────────────────────────────────────
function ExtrasManager({ extras, onChange }: {
  extras: Extra[];
  onChange: (extras: Extra[]) => void;
}) {
  const [newLabel, setNewLabel] = useState("");
  const [newPrice, setNewPrice] = useState("");

  const addExtra = () => {
    const label = newLabel.trim();
    const price = parseFloat(newPrice);
    if (!label) { Alert.alert("Validation", "Enter a name for the extra."); return; }
    if (isNaN(price) || price < 0) { Alert.alert("Validation", "Enter a valid price (0 or more)."); return; }
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    onChange([...extras, { id, label, price }]);
    setNewLabel("");
    setNewPrice("");
  };

  const removeExtra = (id: string) => onChange(extras.filter((e) => e.id !== id));

  return (
    <View style={ex.wrap}>
      <View style={ex.header}>
        <View style={ex.headerIcon}>
          <Feather name="plus-circle" size={14} color="#FF5722" />
        </View>
        <Text style={ex.title}>Add-on Extras</Text>
        {extras.length > 0 && (
          <View style={ex.badge}>
            <Text style={ex.badgeText}>{extras.length}</Text>
          </View>
        )}
      </View>

      {extras.map((e) => (
        <View key={e.id} style={ex.row}>
          <View style={ex.dot} />
          <Text style={ex.label}>{e.label}</Text>
          <Text style={ex.price}>+R{e.price.toFixed(2)}</Text>
          <TouchableOpacity onPress={() => removeExtra(e.id)} style={ex.removeBtn} activeOpacity={0.8}>
            <Feather name="x" size={12} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ))}

      {extras.length === 0 && (
        <Text style={ex.emptyText}>No item-specific extras yet</Text>
      )}

      <View style={ex.addRow}>
        <TextInput
          style={[ex.addInput, { flex: 1 }]}
          placeholder="Extra name (e.g. Extra Cheese)"
          placeholderTextColor="#2E2E42"
          value={newLabel}
          onChangeText={setNewLabel}
        />
        <TextInput
          style={[ex.addInput, { width: 75 }]}
          placeholder="R 0"
          placeholderTextColor="#2E2E42"
          keyboardType="numeric"
          value={newPrice}
          onChangeText={setNewPrice}
        />
        <TouchableOpacity style={ex.addBtn} onPress={addExtra} activeOpacity={0.8}>
          <Feather name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function AdminMenuModal({
  visible, menu, form, editingId, saving, loading,
  onClose, onFormChange, onPickImage, onSave, onEdit, onDelete, formatZAR,
}: AdminMenuModalProps) {
  const [activeTab, setActiveTab] = useState<"form" | "all" | "popular" | "combo" | "offers" | "veg">("form");

  const popularItems = menu.filter((m) => m.isPopular);
  const comboItems   = menu.filter((m) => m.isCombo);
  const offerItems   = menu.filter((m) => m.isOffer);
  const vegItems     = menu.filter((m) => m.isVeg);

  const renderItems = (items: MenuItem[]) =>
    items.length === 0 ? (
      <View style={s.empty}>
        <View style={s.emptyIconWrap}>
          <Feather name="inbox" size={28} color="#222" />
        </View>
        <Text style={s.emptyTitle}>No items here yet</Text>
        <Text style={s.emptyText}>Tag items using the form to populate this section</Text>
      </View>
    ) : (
      items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          isEditing={editingId === item.id}
          onEdit={(i) => { onEdit(i); setActiveTab("form"); }}
          onDelete={onDelete}
          formatZAR={formatZAR}
        />
      ))
    );

  const SECTION_INFO = {
    popular: { emoji: "🔥", title: "Popular Items",      sub: "Top picks shown first on the customer menu", color: "#F59E0B", count: popularItems.length },
    combo:   { emoji: "🎁", title: "Combo Meals",        sub: "Bundle deals shown in the Combos section",   color: "#3B82F6", count: comboItems.length },
    offers:  { emoji: "⚡", title: "Special Offers",     sub: "Deals & discounts highlighted for customers", color: "#10B981", count: offerItems.length },
    veg:     { emoji: "🌿", title: "Vegetarian / Vegan", sub: "Plant-based options in the Veg section",     color: "#22C55E", count: vegItems.length },
  };

  const renderSectionBanner = (key: "popular" | "combo" | "offers" | "veg") => {
    const info = SECTION_INFO[key];
    return (
      <View style={[s.sectionBanner, { borderLeftColor: info.color }]}>
        <Text style={s.sectionBannerEmoji}>{info.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionBannerTitle}>{info.title}</Text>
          <Text style={s.sectionBannerSub}>{info.sub}</Text>
        </View>
        <Text style={[s.sectionBannerCount, { color: info.color }]}>{info.count}</Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={s.root}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>
              {editingId ? "✏️  Edit Item" : "Menu Manager"}
            </Text>
            <Text style={s.headerSub}>
              {menu.length} item{menu.length !== 1 ? "s" : ""} · {[...new Set(menu.map(m => m.category))].length} categories
            </Text>
          </View>
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Feather name="x" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Tabs ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.tabsScroll}
          contentContainerStyle={s.tabsContent}
        >
          <TabBtn label="＋ Form"    active={activeTab === "form"}    onPress={() => setActiveTab("form")} />
          <TabBtn label="All Items"  active={activeTab === "all"}     count={menu.length}         onPress={() => setActiveTab("all")} />
          <TabBtn label="🔥 Popular" active={activeTab === "popular"} count={popularItems.length} onPress={() => setActiveTab("popular")} />
          <TabBtn label="🎁 Combos"  active={activeTab === "combo"}   count={comboItems.length}   onPress={() => setActiveTab("combo")} />
          <TabBtn label="⚡ Offers"  active={activeTab === "offers"}  count={offerItems.length}   onPress={() => setActiveTab("offers")} />
          <TabBtn label="🌿 Veg"     active={activeTab === "veg"}     count={vegItems.length}     onPress={() => setActiveTab("veg")} />
        </ScrollView>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
        >

          {/* ════════════════ FORM TAB ════════════════ */}
          {activeTab === "form" && (
            <View style={s.formCard}>

              <Text style={s.fieldLabel}>Item Name</Text>
              <TextInput
                style={s.input}
                placeholder="e.g. Spicy Chicken Wrap"
                placeholderTextColor="#2A2A3C"
                value={form.name}
                onChangeText={(t) => onFormChange({ name: t })}
              />

              <Text style={s.fieldLabel}>Price (R)</Text>
              <TextInput
                style={s.input}
                placeholder="0.00"
                placeholderTextColor="#2A2A3C"
                keyboardType="numeric"
                value={form.price !== undefined ? String(form.price) : ""}
                onChangeText={(t) => {
                  const cleaned = t.replace(/[^0-9.]/g, "");
                  onFormChange({ price: cleaned === "" ? 0 : Number(cleaned) });
                }}
              />

              <Text style={s.fieldLabel}>Description</Text>
              <TextInput
                style={[s.input, s.textArea]}
                placeholder="Describe this dish..."
                placeholderTextColor="#2A2A3C"
                multiline
                numberOfLines={3}
                value={form.description}
                onChangeText={(t) => onFormChange({ description: t })}
              />

              <Text style={s.fieldLabel}>Category</Text>
              <View style={s.pickerWrap}>
                <Picker
                  selectedValue={form.category}
                  onValueChange={(v) => onFormChange({ category: v })}
                  style={s.picker}
                  dropdownIconColor="#FF5722"
                >
                  {[
                    "Street Eats", "Comfort Classics", "Global Bowls",
                    "Plant Forward", "Seafood & Grill",
                    "Small Plates & Shareables", "Desserts & Drinks",
                  ].map((cat) => (
                    <Picker.Item key={cat} label={cat} value={cat} color="#fff" />
                  ))}
                </Picker>
              </View>

              <Text style={s.fieldLabel}>Section Tags</Text>
              <Text style={s.fieldHint}>Tag this item to appear in special menu sections</Text>
              <View style={s.togglesRow}>
                <SectionToggle label="Popular" icon="trending-up" color="#F59E0B" active={!!form.isPopular} onPress={() => onFormChange({ isPopular: !form.isPopular })} />
                <SectionToggle label="Combo"   icon="package"     color="#3B82F6" active={!!form.isCombo}   onPress={() => onFormChange({ isCombo:   !form.isCombo })} />
                <SectionToggle label="Offer"   icon="tag"         color="#10B981" active={!!form.isOffer}   onPress={() => onFormChange({ isOffer:   !form.isOffer })} />
                <SectionToggle label="Veg"     icon="feather"     color="#22C55E" active={!!form.isVeg}     onPress={() => onFormChange({ isVeg:     !form.isVeg })} />
              </View>

              <Text style={s.fieldLabel}>Image</Text>
              <TouchableOpacity style={s.imageUploadBtn} onPress={onPickImage} activeOpacity={0.8}>
                <Feather name="upload-cloud" size={18} color="#FF5722" />
                <Text style={s.imageUploadText}>{form.image ? "Change Image" : "Upload from Gallery"}</Text>
              </TouchableOpacity>
              <TextInput
                style={s.input}
                placeholder="Or paste an image URL"
                placeholderTextColor="#2A2A3C"
                value={form.image}
                onChangeText={(t) => onFormChange({ image: t })}
              />
              {!!form.image && (
                <View style={s.previewWrap}>
                  <Image source={{ uri: form.image }} style={s.preview} resizeMode="cover" />
                  <TouchableOpacity style={s.removeImgBtn} onPress={() => onFormChange({ image: "" })} activeOpacity={0.8}>
                    <Feather name="x" size={13} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}

              <Text style={s.fieldLabel}>Item-specific Extras</Text>
              <Text style={s.fieldHint}>These appear only for this item (alongside global extras)</Text>
              <ExtrasManager
                extras={form.extras || []}
                onChange={(extras) => onFormChange({ extras })}
              />

              <TouchableOpacity
                style={[s.saveBtn, saving && { opacity: 0.55 }]}
                onPress={onSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Feather name={editingId ? "save" : "plus-circle"} size={19} color="#fff" />
                    <Text style={s.saveBtnText}>{editingId ? "Update Item" : "Add to Menu"}</Text>
                  </>
                )}
              </TouchableOpacity>

              {editingId && (
                <TouchableOpacity style={s.cancelBtn} onPress={onClose} activeOpacity={0.8}>
                  <Feather name="x-circle" size={15} color="#444" />
                  <Text style={s.cancelBtnText}>Cancel Editing</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {activeTab === "all" && (
            loading ? (
              <View style={s.loadingWrap}>
                <ActivityIndicator size="large" color="#FF5722" />
                <Text style={s.loadingText}>Loading menu...</Text>
              </View>
            ) : renderItems(menu)
          )}

          {activeTab === "popular" && <>{renderSectionBanner("popular")}{renderItems(popularItems)}</>}
          {activeTab === "combo"   && <>{renderSectionBanner("combo")}{renderItems(comboItems)}</>}
          {activeTab === "offers"  && <>{renderSectionBanner("offers")}{renderItems(offerItems)}</>}
          {activeTab === "veg"     && <>{renderSectionBanner("veg")}{renderItems(vegItems)}</>}

        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#080810" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: "#0E0E1A", borderBottomWidth: 1, borderBottomColor: "#ffffff08",
  },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  headerSub:   { fontSize: 12, color: "#444", fontWeight: "600", marginTop: 3 },
  closeBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "#ffffff0C", justifyContent: "center", alignItems: "center",
  },
  tabsScroll:    { maxHeight: 54, backgroundColor: "#0E0E1A", borderBottomWidth: 1, borderBottomColor: "#ffffff07" },
  tabsContent:   { paddingHorizontal: 14, alignItems: "center", gap: 7, paddingVertical: 10 },
  scrollContent: { padding: 16, paddingBottom: 70 },
  formCard: {
    backgroundColor: "#0E0E1A", borderRadius: 22, padding: 20,
    borderWidth: 1, borderColor: "#ffffff07",
  },
  fieldLabel: {
    fontSize: 11, fontWeight: "800", color: "#666",
    textTransform: "uppercase", letterSpacing: 1, marginTop: 18, marginBottom: 7,
  },
  fieldHint: { fontSize: 11, color: "#333", marginTop: -5, marginBottom: 8, fontWeight: "500" },
  input: {
    backgroundColor: "#161625", borderWidth: 1, borderColor: "#ffffff0A",
    borderRadius: 13, padding: 14, fontSize: 15, color: "#fff", marginBottom: 4,
  },
  textArea: { height: 85, textAlignVertical: "top", paddingTop: 14 },
  pickerWrap: {
    backgroundColor: "#161625", borderWidth: 1, borderColor: "#ffffff0A",
    borderRadius: 13, marginBottom: 4, overflow: "hidden",
  },
  picker: { color: "#fff", height: 52 },
  togglesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  imageUploadBtn: {
    flexDirection: "row", alignItems: "center", gap: 9,
    backgroundColor: "#FF572212", borderWidth: 1, borderColor: "#FF572235",
    borderStyle: "dashed", borderRadius: 13, padding: 15,
    justifyContent: "center", marginBottom: 10,
  },
  imageUploadText: { color: "#FF5722", fontWeight: "700", fontSize: 14 },
  previewWrap: { borderRadius: 14, overflow: "hidden", marginBottom: 10, position: "relative" },
  preview:     { width: "100%", height: 180 },
  removeImgBtn: {
    position: "absolute", top: 10, right: 10,
    backgroundColor: "#00000090", borderRadius: 14,
    width: 28, height: 28, justifyContent: "center", alignItems: "center",
  },
  saveBtn: {
    backgroundColor: "#FF5722", borderRadius: 15, padding: 17,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, marginTop: 22,
    shadowColor: "#FF5722", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  saveBtnText:  { color: "#fff", fontSize: 16, fontWeight: "900", letterSpacing: -0.2 },
  cancelBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, padding: 14 },
  cancelBtnText:{ color: "#444", fontSize: 14, fontWeight: "700" },
  sectionBanner: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#0E0E1A", borderRadius: 16,
    padding: 16, marginBottom: 14, gap: 14,
    borderLeftWidth: 3, borderWidth: 1, borderColor: "#ffffff07",
  },
  sectionBannerEmoji: { fontSize: 24 },
  sectionBannerTitle: { fontSize: 17, fontWeight: "900", color: "#fff", letterSpacing: -0.3 },
  sectionBannerSub:   { fontSize: 11, color: "#444", fontWeight: "500", marginTop: 3 },
  sectionBannerCount: { fontSize: 30, fontWeight: "900", letterSpacing: -1 },
  loadingWrap: { alignItems: "center", paddingVertical: 70, gap: 14 },
  loadingText: { color: "#444", fontSize: 14, fontWeight: "600" },
  empty: { alignItems: "center", paddingVertical: 70, gap: 10 },
  emptyIconWrap: {
    width: 60, height: 60, borderRadius: 20,
    backgroundColor: "#161625", justifyContent: "center", alignItems: "center", marginBottom: 6,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#333" },
  emptyText:  { fontSize: 12, color: "#2A2A3C", textAlign: "center", lineHeight: 18 },
});

const st = StyleSheet.create({
  toggle: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 50, borderWidth: 1.5,
  },
  toggleText:  { fontSize: 12, fontWeight: "800" },
  toggleCheck: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center", alignItems: "center",
  },
});

const st2 = StyleSheet.create({
  tabBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50,
    backgroundColor: "#161625", flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: "#ffffff07",
  },
  tabBtnActive:       { backgroundColor: "#FF5722", borderColor: "#FF5722" },
  tabBtnText:         { fontSize: 13, fontWeight: "700", color: "#444" },
  tabBtnTextActive:   { color: "#fff" },
  tabBadge:           { backgroundColor: "#ffffff12", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeActive:     { backgroundColor: "#ffffff30" },
  tabBadgeText:       { fontSize: 10, fontWeight: "800", color: "#444" },
  tabBadgeTextActive: { color: "#fff" },
});

const ic = StyleSheet.create({
  card: {
    backgroundColor: "#0E0E1A", borderRadius: 18, marginBottom: 10,
    overflow: "hidden", borderWidth: 1, borderColor: "#ffffff07",
  },
  cardEditing: { borderColor: "#FF572245", borderWidth: 1.5 },
  editBanner: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: "#FF572218", paddingHorizontal: 14, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: "#FF572220",
  },
  editBannerText: { fontSize: 11, color: "#FF5722", fontWeight: "800" },
  row:  { flexDirection: "row", padding: 14, gap: 13 },
  img:  { width: 74, height: 74, borderRadius: 13 },
  imgPlaceholder: {
    width: 74, height: 74, borderRadius: 13,
    backgroundColor: "#161625", justifyContent: "center", alignItems: "center",
  },
  info:    { flex: 1, gap: 3 },
  name:    { fontSize: 15, fontWeight: "800", color: "#fff", letterSpacing: -0.2 },
  price:   { fontSize: 16, fontWeight: "900", color: "#FF5722" },
  catRow:  { flexDirection: "row", alignItems: "center", gap: 4 },
  cat:     { fontSize: 11, color: "#444", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  tags:    { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 3 },
  tag:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  tagText: { fontSize: 10, fontWeight: "800" },
  extrasRow:   { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  extrasCount: { fontSize: 10, color: "#555", fontWeight: "600" },
  actions: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#ffffff07" },
  editBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 7, paddingVertical: 12,
    borderRightWidth: 1, borderRightColor: "#ffffff07",
  },
  editBtnText:   { fontSize: 13, fontWeight: "800", color: "#FF5722" },
  deleteBtn:     { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 12 },
  deleteBtnText: { fontSize: 13, fontWeight: "800", color: "#EF4444" },
});

const ex = StyleSheet.create({
  wrap: {
    backgroundColor: "#161625", borderRadius: 15, padding: 14,
    marginBottom: 4, borderWidth: 1, borderColor: "#FF572218",
  },
  header:     { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  headerIcon: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: "#FF572215", justifyContent: "center", alignItems: "center",
  },
  title:     { fontSize: 13, fontWeight: "800", color: "#FF5722", flex: 1 },
  badge:     { backgroundColor: "#FF572220", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: "900", color: "#FF5722" },
  row: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#ffffff06",
  },
  dot:       { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#FF5722" },
  label:     { flex: 1, fontSize: 14, color: "#ccc", fontWeight: "600" },
  price:     { fontSize: 13, color: "#FF5722", fontWeight: "800" },
  removeBtn: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: "#EF444415", justifyContent: "center", alignItems: "center",
  },
  emptyText: { fontSize: 12, color: "#2A2A3C", fontStyle: "italic", marginBottom: 12, textAlign: "center" },
  addRow:    { flexDirection: "row", gap: 8, marginTop: 12, alignItems: "center" },
  addInput: {
    backgroundColor: "#0E0E1A", borderWidth: 1, borderColor: "#ffffff09",
    borderRadius: 11, padding: 11, fontSize: 14, color: "#fff",
  },
  addBtn: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: "#FF5722", justifyContent: "center", alignItems: "center",
  },
});
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CATEGORY_ORDER = [
  "ΠΡΟΤΕΙΝΟΜΕΝΑ", "ΚΑΦΕΔΕΣ", "ΑΝΑΨΥΚΤΙΚΑ", "ΡΟΦΗΜΑΤΑ", "ΠΡΩΙΝΟ", "ΜΠΥΡΕΣ", "ΣΝΑΚΣ", "ΣΥΝΟΔΕΥΤΙΚΑ", "ΣΑΛΑΤΕΣ", "ΖΥΜΑΡΙΚΑ", "ΠΙΤΣΕΣ", "ΑΛΜΥΡΕΣ ΚΡΕΠΕΣ", "ΓΛΥΚΕΣ ΚΡΕΠΕΣ", "ΓΛΥΚΑ", "ΠΟΤΑ"
];

export default function AdminProducts({ storeId, theme }) {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("ΟΛΑ"); 
  const [searchQuery, setSearchQuery] = useState("");

  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkCategory, setBulkCategory] = useState("ΚΑΦΕΔΕΣ");
  const [bulkPriceChange, setBulkPriceChange] = useState(0);

  const isDark = theme === "dark";

  const [editForm, setEditForm] = useState({
    name: "", name_en: "", name_tr: "",
    description: "", description_en: "", description_tr: "",
    price: 0,
    category: "", category_en: "", category_tr: "",
    station: "bar",
    is_available: true,
    is_recommended: false,
    image_url: "",
    sort_order: 0,
    addons: [],
  });
  
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (data) setProducts(data);
  };
  
  useEffect(() => {
    if (storeId) fetchProducts();
  }, [storeId]);

  const handleQuickSort = async (product, changeAmount) => {
    const newSortOrder = (product.sort_order || 0) + changeAmount;
    await supabase.from("products").update({ sort_order: newSortOrder }).eq("id", product.id);
    fetchProducts();
  };

  const handleBulkPriceUpdate = async () => {
    if (!bulkCategory || bulkPriceChange === 0) return alert("Επιλέξτε κατηγορία και ποσό αλλαγής.");
    if (window.confirm(`Είστε σίγουροι ότι θέλετε να αλλάξετε τις τιμές στην κατηγορία "${bulkCategory}" κατά ${bulkPriceChange > 0 ? '+' : ''}${bulkPriceChange}€;`)) {
      setIsUploading(true);
      const productsToUpdate = products.filter(p => p.category === bulkCategory);
      
      const updates = productsToUpdate.map(p => 
        supabase.from("products").update({ price: Math.max(0, p.price + bulkPriceChange) }).eq("id", p.id)
      );
      
      await Promise.all(updates);
      alert("Οι τιμές ενημερώθηκαν επιτυχώς!");
      setBulkPriceChange(0);
      fetchProducts();
      setIsUploading(false);
    }
  };

  const handleBulkAvailability = async (status) => {
    if (!bulkCategory) return;
    if (window.confirm(`Θέλετε να κάνετε ${status ? 'ΕΝΕΡΓΑ (ON)' : 'ΑΝΕΝΕΡΓΑ (OFF)'} όλα τα είδη στην κατηγορία "${bulkCategory}";`)) {
      setIsUploading(true);
      const productsToUpdate = products.filter(p => p.category === bulkCategory);
      
      const updates = productsToUpdate.map(p => 
        supabase.from("products").update({ is_available: status }).eq("id", p.id)
      );
      
      await Promise.all(updates);
      fetchProducts();
      setIsUploading(false);
    }
  };

  const handleToggleAvailable = async (product) => {
    await supabase.from("products").update({ is_available: !product.is_available }).eq("id", product.id);
    fetchProducts();
  };

  const handleToggleRecommended = async (product) => {
    await supabase.from("products").update({ is_recommended: !product.is_recommended }).eq("id", product.id);
    fetchProducts();
  };

  const handleDuplicate = async (product) => {
    if (window.confirm(`Να δημιουργηθεί αντίγραφο του "${product.name}";`)) {
      const { id, created_at, ...productWithoutId } = product;
      const clonedProduct = {
        ...productWithoutId,
        name: `${product.name} (Αντίγραφο)`,
        is_available: false,
      };
      await supabase.from("products").insert([clonedProduct]);
      fetchProducts();
    }
  };

  const saveEdit = async () => {
    await supabase.from("products").update({ ...editForm, addons: editForm.addons || [] }).eq("id", editingId);
    setEditingId(null);
    fetchProducts();
  };

  const addNewProduct = async () => {
    await supabase.from("products").insert([{ ...editForm, store_id: storeId }]);
    setIsAdding(false);
    fetchProducts();
  };

  const handleDelete = async (id) => {
    if (window.confirm("ΠΡΟΣΟΧΗ: Θέλετε σίγουρα να διαγράψετε αυτό το προϊόν;")) {
      await supabase.from("products").delete().eq("id", id);
      fetchProducts();
    }
  };

  const uploadImage = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const fileName = `${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("product-images").upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
      setEditForm({ ...editForm, image_url: data.publicUrl });
    }
    setIsUploading(false);
  };

  const addAddonGroup = () => setEditForm({ ...editForm, addons: [...(editForm.addons || []), { id: Date.now(), name: "", name_en: "", name_tr: "", isRequired: false, maxSelections: 1, options: [] }] });
  const removeAddonGroup = (groupId) => setEditForm({ ...editForm, addons: editForm.addons.filter((g) => g.id !== groupId) });
  const updateAddonGroup = (groupId, field, value) => setEditForm({ ...editForm, addons: editForm.addons.map((g) => g.id === groupId ? { ...g, [field]: value } : g) });
  const addAddonOption = (groupId) => setEditForm({ ...editForm, addons: editForm.addons.map((g) => g.id === groupId ? { ...g, options: [...g.options, { name: "", name_en: "", name_tr: "", price: 0 }] } : g) });
  const removeAddonOption = (groupId, optionIndex) => setEditForm({ ...editForm, addons: editForm.addons.map((g) => { if (g.id === groupId) { const newOptions = [...g.options]; newOptions.splice(optionIndex, 1); return { ...g, options: newOptions }; } return g; }) });
  const updateAddonOption = (groupId, optionIndex, field, value) => setEditForm({ ...editForm, addons: editForm.addons.map((g) => { if (g.id === groupId) { const newOptions = [...g.options]; newOptions[optionIndex][field] = value; return { ...g, options: newOptions }; } return g; }) });

  // Η ΣΥΝΑΡΤΗΣΗ ΠΟΥ ΕΛΕΙΠΕ
  const copyAddonsToCategory = async () => {
    if (!editForm.category) return alert("Ορίστε κατηγορία πρώτα.");
    if (window.confirm(`Αντιγραφή επιλογών σε όλη την κατηγορία "${editForm.category}"; Προσοχή, αυτό θα αντικαταστήσει τις υπάρχουσες επιλογές των άλλων προϊόντων.`)) {
      await supabase.from("products").update({ addons: editForm.addons || [] }).eq("store_id", storeId).eq("category", editForm.category);
      alert("Επιτυχία! Όλα τα προϊόντα της κατηγορίας ενημερώθηκαν.");
      fetchProducts();
    }
  };

  const categories = [...new Set(products.map((p) => p.category))].filter(Boolean).sort((a, b) => {
    let idxA = CATEGORY_ORDER.indexOf(a); let idxB = CATEGORY_ORDER.indexOf(b);
    if (idxA === -1) idxA = 999; if (idxB === -1) idxB = 999; return idxA - idxB;
  });

  const filteredProducts = products.filter(p => {
    const matchCat = activeCategory === "ΟΛΑ" || p.category === activeCategory;
    const matchSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.name_en?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="max-w-5xl mx-auto pb-24 px-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className={`text-2xl font-black italic uppercase tracking-tighter ${isDark ? "text-blue-400" : "text-blue-600"}`}>
          Διαχειριση Καταλογου
        </h2>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input 
              type="text" 
              placeholder="Αναζήτηση..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-2xl font-bold text-sm border outline-none transition-colors ${isDark ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500" : "bg-white border-gray-200 focus:border-blue-500"}`}
            />
          </div>
          <button
            onClick={() => setShowBulkActions(!showBulkActions)}
            className={`px-4 py-3 rounded-2xl font-black text-[10px] uppercase shadow-sm border transition-colors ${showBulkActions ? "bg-purple-600 text-white border-purple-600" : isDark ? "bg-gray-800 text-purple-400 border-purple-900/50 hover:bg-gray-700" : "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100"}`}
          >
            ⚡ Μαζικες Ενεργειες
          </button>
          <button
            onClick={() => {
              setIsAdding(true);
              setEditingId(null);
              setEditForm({ name: "", name_en: "", name_tr: "", description: "", description_en: "", description_tr: "", price: 0, category: activeCategory !== "ΟΛΑ" ? activeCategory : "", category_en: "", category_tr: "", station: "bar", is_available: true, is_recommended: false, image_url: "", sort_order: 0, addons: [] });
            }}
            className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg transition-transform active:scale-95 whitespace-nowrap"
          >
            + Νεο Προϊον
          </button>
        </div>
      </div>

      {showBulkActions && (
        <div className={`mb-6 p-6 rounded-[2rem] border-2 border-dashed shadow-sm animate-fade-in ${isDark ? "bg-purple-900/10 border-purple-900/50" : "bg-purple-50/50 border-purple-200"}`}>
          <h3 className={`text-sm font-black uppercase mb-4 ${isDark ? "text-purple-400" : "text-purple-700"}`}>⚡ Εργαλεια Κατηγοριας</h3>
          
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-1/3">
              <label className={`block text-[10px] font-black uppercase mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>1. Επιλογη Κατηγοριας</label>
              <select className={`w-full p-3 rounded-xl font-bold border outline-none ${isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"}`} value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)}>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            
            <div className={`w-full md:w-2/3 flex flex-col md:flex-row gap-4 p-4 rounded-2xl border ${isDark ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-100 shadow-sm"}`}>
              <div className="flex-1 flex flex-col gap-2 border-r-0 md:border-r border-b md:border-b-0 pb-4 md:pb-0 pr-0 md:pr-4 dark:border-gray-700">
                <label className={`text-[10px] font-black uppercase ${isDark ? "text-gray-400" : "text-gray-600"}`}>2A. Αλλαγη Τιμων (€)</label>
                <div className="flex gap-2">
                  <input type="number" step="0.10" placeholder="+/- 0.50" value={bulkPriceChange} onChange={(e) => setBulkPriceChange(parseFloat(e.target.value) || 0)} className={`w-24 p-2 text-center rounded-lg font-bold border outline-none ${isDark ? "bg-gray-800 border-gray-600 text-white" : "bg-gray-50 border-gray-200"}`} />
                  <button onClick={handleBulkPriceUpdate} disabled={isUploading} className="flex-1 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase transition-transform active:scale-95 disabled:opacity-50">Εφαρμογη</button>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col gap-2">
                <label className={`text-[10px] font-black uppercase ${isDark ? "text-gray-400" : "text-gray-600"}`}>2B. Διαθεσιμοτητα</label>
                <div className="flex gap-2">
                  <button onClick={() => handleBulkAvailability(true)} disabled={isUploading} className="flex-1 bg-green-500 text-white py-2 rounded-lg font-black text-[10px] uppercase active:scale-95 disabled:opacity-50">Ολα ΟΝ</button>
                  <button onClick={() => handleBulkAvailability(false)} disabled={isUploading} className="flex-1 bg-red-500 text-white py-2 rounded-lg font-black text-[10px] uppercase active:scale-95 disabled:opacity-50">Ολα ΟFF</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`flex overflow-x-auto gap-2 pb-4 mb-6 border-b no-scrollbar transition-colors ${isDark ? "border-gray-800" : "border-gray-200"}`}>
        <button
          onClick={() => setActiveCategory("ΟΛΑ")}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-colors ${activeCategory === "ΟΛΑ" ? (isDark ? "bg-white text-black" : "bg-black text-white") : (isDark ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}`}
        >
          ΟΛΑ
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-colors ${activeCategory === cat ? (isDark ? "bg-white text-black" : "bg-black text-white") : (isDark ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {(isAdding || editingId) && (
        <div className={`p-6 md:p-8 rounded-[2.5rem] mb-8 shadow-2xl transition-colors border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
          <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-black uppercase italic">{isAdding ? "Νέο Προϊόν" : "Επεξεργασία Προϊόντος"}</h3>
            <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-gray-400 hover:text-red-500 font-black text-xl">✕</button>
          </div>

          <div className="flex flex-col md:flex-row gap-8 mb-8">
            <div className={`flex flex-col items-center justify-center w-full md:w-48 h-48 border-2 border-dashed rounded-3xl relative transition-colors ${isDark ? "border-gray-600 bg-gray-900" : "border-gray-300 bg-gray-50"}`}>
              {editForm.image_url ? (
                <div className="relative w-full h-full p-2">
                  <img src={editForm.image_url} alt="Preview" className="w-full h-full object-cover rounded-2xl shadow-md" />
                  <button onClick={() => setEditForm({ ...editForm, image_url: "" })} className="absolute -top-3 -right-3 bg-red-500 text-white w-8 h-8 rounded-full font-bold shadow-lg">✕</button>
                </div>
              ) : (
                <>
                  <span className="text-4xl mb-2">📷</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Ανέβασμα</span>
                  <input type="file" accept="image/*" onChange={uploadImage} disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </>
              )}
            </div>

            <div className="flex-1 space-y-5">
              <div className={`p-4 rounded-2xl border-2 ${isDark ? "bg-gray-900 border-blue-900/50" : "bg-blue-50/30 border-blue-100"}`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-3">ΕΛΛΗΝΙΚΑ (Βασικη Γλωσσα)</p>
                <div className="space-y-3">
                  <input type="text" placeholder="Όνομα (π.χ. Φρέντο Εσπρέσο)" className={`w-full p-3.5 rounded-xl font-black text-sm border outline-none transition-colors ${isDark ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500" : "bg-white border-gray-200 focus:border-blue-500"}`} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  <textarea rows="2" placeholder="Συστατικά / Περιγραφή..." className={`w-full p-3.5 rounded-xl font-medium border text-xs outline-none resize-none transition-colors ${isDark ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500" : "bg-white border-gray-200 focus:border-blue-500"}`} value={editForm.description || ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${isDark ? "bg-gray-900/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Μεταφρασεις (Προαιρετικο)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-gray-400 uppercase">🇬🇧 English</span>
                    <input type="text" placeholder="Name" className={`w-full p-2.5 rounded-lg font-bold border text-xs outline-none ${isDark ? "bg-gray-800 border-gray-600 text-white focus:border-blue-500" : "bg-white border-gray-200 focus:border-blue-500"}`} value={editForm.name_en || ""} onChange={(e) => setEditForm({ ...editForm, name_en: e.target.value })} />
                    <input type="text" placeholder="Description" className={`w-full p-2.5 rounded-lg font-medium border text-xs outline-none ${isDark ? "bg-gray-800 border-gray-600 text-white focus:border-blue-500" : "bg-white border-gray-200 focus:border-blue-500"}`} value={editForm.description_en || ""} onChange={(e) => setEditForm({ ...editForm, description_en: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-gray-400 uppercase">🇹🇷 Türkçe</span>
                    <input type="text" placeholder="İsim" className={`w-full p-2.5 rounded-lg font-bold border text-xs outline-none ${isDark ? "bg-gray-800 border-gray-600 text-white focus:border-blue-500" : "bg-white border-gray-200 focus:border-blue-500"}`} value={editForm.name_tr || ""} onChange={(e) => setEditForm({ ...editForm, name_tr: e.target.value })} />
                    <input type="text" placeholder="Açıklama" className={`w-full p-2.5 rounded-lg font-medium border text-xs outline-none ${isDark ? "bg-gray-800 border-gray-600 text-white focus:border-blue-500" : "bg-white border-gray-200 focus:border-blue-500"}`} value={editForm.description_tr || ""} onChange={(e) => setEditForm({ ...editForm, description_tr: e.target.value })} />
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-3xl border border-gray-100 dark:border-gray-700/50">
            <div className="col-span-2 md:col-span-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Τιμη (€)</p>
              <input type="number" step="0.10" className={`w-full border p-4 rounded-xl font-black text-blue-600 text-lg outline-none transition-colors ${isDark ? "bg-gray-900 border-gray-700 focus:border-blue-500" : "bg-white border-gray-200 focus:border-blue-500"}`} value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })} />
            </div>
            
            <div className="col-span-2 md:col-span-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Κατηγορια (GR / EN / TR)</p>
              <div className="flex flex-col gap-2">
                 <input type="text" placeholder="π.χ. ΚΑΦΕΔΕΣ" className={`w-full border p-3 rounded-xl font-bold text-sm outline-none ${isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-200"}`} value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value.toUpperCase() })} />
                 <div className="flex gap-2">
                    <input type="text" placeholder="EN" className={`w-1/2 border p-2 rounded-lg font-bold text-xs outline-none ${isDark ? "bg-gray-900 border-gray-700 text-gray-300" : "bg-white border-gray-200"}`} value={editForm.category_en || ""} onChange={(e) => setEditForm({ ...editForm, category_en: e.target.value.toUpperCase() })} />
                    <input type="text" placeholder="TR" className={`w-1/2 border p-2 rounded-lg font-bold text-xs outline-none ${isDark ? "bg-gray-900 border-gray-700 text-gray-300" : "bg-white border-gray-200"}`} value={editForm.category_tr || ""} onChange={(e) => setEditForm({ ...editForm, category_tr: e.target.value.toUpperCase() })} />
                 </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Σταθμος</p>
              <select className={`w-full border p-4 rounded-xl font-bold text-sm outline-none h-[54px] ${isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-200"}`} value={editForm.station || "bar"} onChange={(e) => setEditForm({ ...editForm, station: e.target.value })}>
                <option value="bar">🍹 Μπαρ</option>
                <option value="kitchen">🍳 Κουζίνα</option>
              </select>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Σειρα</p>
              <input type="number" className={`w-full border p-4 rounded-xl font-bold text-sm outline-none h-[54px] text-center ${isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-200"}`} value={editForm.sort_order || 0} onChange={(e) => setEditForm({ ...editForm, sort_order: parseInt(e.target.value) })} />
            </div>
          </div>

          <div className={`mb-8 border-t pt-6 ${isDark ? "border-gray-700" : "border-gray-100"}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`font-black uppercase tracking-widest text-sm ${isDark ? "text-gray-300" : "text-gray-800"}`}>Επιλογες (Add-ons)</h3>
              <button onClick={addAddonGroup} className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase transition-colors shadow-sm ${isDark ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}>+ Προσθηκη Ομαδας</button>
            </div>
            
            <div className="space-y-4">
              {(editForm.addons || []).map((group, gIndex) => (
                <div key={group.id} className={`p-5 rounded-3xl border shadow-sm ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input type="text" placeholder="GR: Όνομα Ομάδας" className={`p-3 rounded-xl font-bold border text-sm outline-none ${isDark ? "bg-gray-800 border-gray-600 text-white" : "bg-gray-50 border-gray-200"}`} value={group.name} onChange={(e) => updateAddonGroup(group.id, "name", e.target.value)} />
                      <input type="text" placeholder="EN: Group Name" className={`p-3 rounded-xl font-bold border text-sm outline-none ${isDark ? "bg-gray-800 border-gray-600 text-white" : "bg-gray-50 border-gray-200"}`} value={group.name_en || ""} onChange={(e) => updateAddonGroup(group.id, "name_en", e.target.value)} />
                      <input type="text" placeholder="TR: Turkish" className={`p-3 rounded-xl font-bold border text-sm outline-none ${isDark ? "bg-gray-800 border-gray-600 text-white" : "bg-gray-50 border-gray-200"}`} value={group.name_tr || ""} onChange={(e) => updateAddonGroup(group.id, "name_tr", e.target.value)} />
                    </div>
                    <button onClick={() => removeAddonGroup(group.id)} className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center font-bold ${isDark ? "bg-red-900/30 text-red-500" : "bg-red-50 text-red-500"}`}>✕</button>
                  </div>

                  <div className={`flex gap-6 mb-5 items-center p-4 rounded-2xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
                    <label className={`flex items-center gap-2 text-xs font-black uppercase cursor-pointer ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      <input type="checkbox" checked={group.isRequired} onChange={(e) => updateAddonGroup(group.id, "isRequired", e.target.checked)} className="w-5 h-5 rounded text-blue-600 accent-blue-600" /> Ειναι Υποχρεωτικο;
                    </label>
                    <div className={`flex items-center gap-3 text-xs font-black uppercase border-l pl-6 ${isDark ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-700"}`}>
                      <span>Μεγιστες Επιλογες:</span>
                      <input type="number" min="1" value={group.maxSelections} onChange={(e) => updateAddonGroup(group.id, "maxSelections", parseInt(e.target.value))} className={`w-16 border-2 rounded-xl p-2 text-center outline-none ${isDark ? "bg-gray-900 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4 pl-2 sm:pl-6 border-l-4 border-blue-400">
                    {group.options.map((opt, oIndex) => (
                      <div key={oIndex} className="flex flex-col sm:flex-row gap-2 items-center">
                        <div className="flex-1 grid grid-cols-3 gap-2 w-full">
                          <input type="text" placeholder="GR: Επιλογή" className={`p-2.5 rounded-lg font-bold border text-xs outline-none ${isDark ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} value={opt.name} onChange={(e) => updateAddonOption(group.id, oIndex, "name", e.target.value)} />
                          <input type="text" placeholder="EN: Option" className={`p-2.5 rounded-lg font-bold border text-xs outline-none ${isDark ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} value={opt.name_en || ""} onChange={(e) => updateAddonOption(group.id, oIndex, "name_en", e.target.value)} />
                          <input type="text" placeholder="TR: Turkish" className={`p-2.5 rounded-lg font-bold border text-xs outline-none ${isDark ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} value={opt.name_tr || ""} onChange={(e) => updateAddonOption(group.id, oIndex, "name_tr", e.target.value)} />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <div className={`w-24 shrink-0 flex items-center border rounded-lg pr-2 ${isDark ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
                            <input type="number" placeholder="0.00" step="0.10" className={`w-full bg-transparent p-2 text-xs font-bold outline-none text-center ${isDark ? "text-blue-400" : "text-blue-600"}`} value={opt.price} onChange={(e) => updateAddonOption(group.id, oIndex, "price", parseFloat(e.target.value))} />
                            <span className="text-gray-400 font-bold text-xs">€</span>
                          </div>
                          <button onClick={() => removeAddonOption(group.id, oIndex)} className="w-10 shrink-0 text-red-400 hover:text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg font-bold">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => addAddonOption(group.id)} className="text-blue-500 font-black text-[10px] uppercase ml-2 sm:ml-6 hover:underline flex items-center gap-1"><span className="text-lg leading-none">+</span> Προσθηκη Επιλογης</button>
                </div>
              ))}
            </div>
            
            {editForm.addons && editForm.addons.length > 0 && editForm.category && (
              <div className={`mt-6 pt-4 border-t flex justify-end ${isDark ? "border-gray-700" : "border-gray-100"}`}>
                <button onClick={copyAddonsToCategory} className={`px-5 py-3 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 border transition-colors shadow-sm ${isDark ? "bg-purple-900/30 text-purple-400 border-purple-900/50" : "bg-purple-50 text-purple-700 border-purple-200"}`}>
                  <span className="text-sm">🪄</span> Αντιγραφη Addons σε ολο το "{editForm.category}"
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-6">
            <button onClick={isAdding ? addNewProduct : saveEdit} disabled={isUploading} className="flex-[2] bg-green-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-50 transition-transform active:scale-95 shadow-lg hover:bg-green-400">
              {isAdding ? "Δημιουργια Προϊοντος" : "Αποθηκευση Αλλαγων"}
            </button>
            <button onClick={() => { setIsAdding(false); setEditingId(null); }} className={`flex-1 py-5 rounded-2xl font-black text-xs uppercase transition-colors border ${isDark ? "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
              Ακυρωση
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center text-gray-500 font-bold uppercase mt-10">Δεν βρέθηκαν προϊόντα.</div>
        ) : (
          filteredProducts.map((p) => (
            <div
              key={p.id}
              className={`border p-4 rounded-[2.5rem] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm transition-all hover:shadow-md ${
                !p.is_available ? (isDark ? "opacity-60 border-red-900/50 bg-red-900/10" : "opacity-60 border-red-100 bg-red-50/20") : (isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")
              }`}
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className={`w-20 h-20 shrink-0 rounded-2xl bg-cover bg-center shadow-inner flex items-center justify-center text-2xl ${isDark ? "bg-gray-900" : "bg-gray-100"}`} style={p.image_url ? { backgroundImage: `url(${p.image_url})` } : {}}>
                  {!p.image_url && "🍽️"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-black uppercase text-base leading-tight ${isDark ? "text-gray-100" : "text-gray-900"}`}>{p.name}</h3>
                    {p.is_recommended && <span className="text-yellow-500 text-xs" title="Προτεινόμενο">⭐</span>}
                    {!p.is_available && <span className="bg-red-500 text-white px-2 py-0.5 rounded-md text-[9px] font-black uppercase">OFF</span>}
                  </div>
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wide mb-1">
                    {p.category} | <span className="text-blue-400">ΣΕΙΡΑ: {p.sort_order || 0}</span>
                  </p>
                  <p className="text-blue-500 font-black text-sm">
                    {p.price.toFixed(2)}€ <span className="text-gray-400 font-bold mx-1">•</span> 
                    <span className={p.station === "kitchen" ? "text-orange-500" : "text-purple-500"}>{p.station === "kitchen" ? "🍳 Κουζίνα" : "🍹 Μπαρ"}</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 mt-1 sm:mt-0 dark:border-gray-700 items-center">
                <div className={`flex flex-col bg-gray-50 dark:bg-gray-900 rounded-xl border ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                  <button onClick={() => handleQuickSort(p, -1)} className={`w-10 h-6 flex items-center justify-center text-xs font-black transition-colors ${isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black"}`}>▲</button>
                  <div className={`h-[1px] w-full ${isDark ? "bg-gray-700" : "bg-gray-200"}`}></div>
                  <button onClick={() => handleQuickSort(p, 1)} className={`w-10 h-6 flex items-center justify-center text-xs font-black transition-colors ${isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black"}`}>▼</button>
                </div>

                <div className={`h-10 w-[1px] mx-1 ${isDark ? "bg-gray-700" : "bg-gray-200"}`}></div>

                <button onClick={() => handleToggleRecommended(p)} className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-colors ${p.is_recommended ? (isDark ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-50 text-yellow-500") : (isDark ? "bg-gray-900 text-gray-500" : "bg-gray-100 text-gray-400")}`}>⭐</button>
                <button onClick={() => handleToggleAvailable(p)} className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-[10px] transition-colors ${p.is_available ? (isDark ? "bg-green-900/30 text-green-500" : "bg-green-50 text-green-600") : (isDark ? "bg-red-900/30 text-red-500" : "bg-red-50 text-red-500")}`}>{p.is_available ? "ON" : "OFF"}</button>
                <button onClick={() => handleDuplicate(p)} className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-colors ${isDark ? "bg-purple-900/30 text-purple-400" : "bg-purple-50 text-purple-500"}`}>📋</button>
                <button onClick={() => { setEditingId(p.id); setEditForm({ ...p, station: p.station || "bar", addons: p.addons || [] }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-colors ${isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-500"}`}>✏️</button>
                <button onClick={() => handleDelete(p.id)} className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-colors ${isDark ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-500"}`}>🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

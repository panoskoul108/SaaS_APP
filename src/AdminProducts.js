import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CATEGORY_ORDER = [
  "ΠΡΟΤΕΙΝΟΜΕΝΑ", "ΚΑΦΕΔΕΣ", "ΑΝΑΨΥΚΤΙΚΑ", "ΡΟΦΗΜΑΤΑ", "ΠΡΩΙΝΟ", "ΜΠΥΡΕΣ", "ΣΝΑΚΣ", "ΣΥΝΟΔΕΥΤΙΚΑ", "ΣΑΛΑΤΕΣ", "ΖΥΜΑΡΙΚΑ", "ΠΙΤΣΕΣ", "ΑΛΜΥΡΕΣ ΚΡΕΠΕΣ", "ΓΛΥΚΕΣ ΚΡΕΠΕΣ", "ΓΛΥΚΑ",
];

export default function AdminProducts({ storeId, theme }) {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("ΟΛΑ"); 

  const isDark = theme === "dark"; // Έλεγχος για το θέμα

  const [editForm, setEditForm] = useState({
    name: "",
    name_en: "",
    price: 0,
    category: "",
    category_en: "",
    station: "bar",
    is_available: true,
    is_recommended: false,
    image_url: "",
    addons: [],
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .order("category");
    if (data) setProducts(data);
  };
  
  useEffect(() => {
    if (storeId) fetchProducts();
  }, [storeId]);

  const handleToggleAvailable = async (product) => {
    await supabase
      .from("products")
      .update({ is_available: !product.is_available })
      .eq("id", product.id);
    fetchProducts();
  };

  const handleToggleRecommended = async (product) => {
    await supabase
      .from("products")
      .update({ is_recommended: !product.is_recommended })
      .eq("id", product.id);
    fetchProducts();
  };

  const saveEdit = async () => {
    await supabase
      .from("products")
      .update({ ...editForm, addons: editForm.addons || [] })
      .eq("id", editingId);
    setEditingId(null);
    fetchProducts();
  };

  const addNewProduct = async () => {
    await supabase
      .from("products")
      .insert([{ ...editForm, store_id: storeId }]);
    setIsAdding(false);
    fetchProducts();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Διαγραφή προϊόντος;")) {
      await supabase.from("products").delete().eq("id", id);
      fetchProducts();
    }
  };

  const uploadImage = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const fileName = `${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);
      setEditForm({ ...editForm, image_url: data.publicUrl });
    }
    setIsUploading(false);
  };

  const addAddonGroup = () =>
    setEditForm({
      ...editForm,
      addons: [
        ...(editForm.addons || []),
        { id: Date.now(), name: "", name_en: "", isRequired: false, maxSelections: 1, options: [] },
      ],
    });
  const removeAddonGroup = (groupId) => setEditForm({ ...editForm, addons: editForm.addons.filter((g) => g.id !== groupId) });
  const updateAddonGroup = (groupId, field, value) => setEditForm({ ...editForm, addons: editForm.addons.map((g) => g.id === groupId ? { ...g, [field]: value } : g) });
  const addAddonOption = (groupId) => setEditForm({ ...editForm, addons: editForm.addons.map((g) => g.id === groupId ? { ...g, options: [...g.options, { name: "", name_en: "", price: 0 }] } : g) });
  const removeAddonOption = (groupId, optionIndex) => setEditForm({ ...editForm, addons: editForm.addons.map((g) => { if (g.id === groupId) { const newOptions = [...g.options]; newOptions.splice(optionIndex, 1); return { ...g, options: newOptions }; } return g; }) });
  const updateAddonOption = (groupId, optionIndex, field, value) => setEditForm({ ...editForm, addons: editForm.addons.map((g) => { if (g.id === groupId) { const newOptions = [...g.options]; newOptions[optionIndex][field] = value; return { ...g, options: newOptions }; } return g; }) });

  const copyAddonsToCategory = async () => {
    if (!editForm.category) return alert("Ορίστε κατηγορία πρώτα.");
    if (window.confirm(`Αντιγραφή επιλογών σε όλη την κατηγορία "${editForm.category}";`)) {
      await supabase.from("products").update({ addons: editForm.addons || [] }).eq("store_id", storeId).eq("category", editForm.category);
      alert("Επιτυχία!");
      fetchProducts();
    }
  };

  const categories = [...new Set(products.map((p) => p.category))].filter(Boolean).sort((a, b) => {
    let idxA = CATEGORY_ORDER.indexOf(a); let idxB = CATEGORY_ORDER.indexOf(b);
    if (idxA === -1) idxA = 999; if (idxB === -1) idxB = 999; return idxA - idxB;
  });

  const filteredProducts = activeCategory === "ΟΛΑ" ? products : products.filter((p) => p.category === activeCategory);

  return (
    <div className="max-w-4xl mx-auto pb-24 px-2">
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-black italic uppercase tracking-tighter ${isDark ? "text-blue-400" : "text-blue-600"}`}>
          Κατάλογος
        </h2>
        <button
          onClick={() => {
            setIsAdding(true);
            setEditForm({ name: "", name_en: "", price: 0, category: "", category_en: "", station: "bar", is_available: true, is_recommended: false, image_url: "", addons: [] });
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg transition-transform active:scale-95"
        >
          + Προσθήκη
        </button>
      </div>

      {/* --- ΦΙΛΤΡΑ ΚΑΤΗΓΟΡΙΩΝ --- */}
      <div className={`flex overflow-x-auto gap-2 pb-4 mb-4 border-b no-scrollbar transition-colors ${isDark ? "border-gray-800" : "border-gray-200"}`}>
        <button
          onClick={() => setActiveCategory("ΟΛΑ")}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-colors ${
            activeCategory === "ΟΛΑ"
              ? (isDark ? "bg-white text-black" : "bg-black text-white")
              : (isDark ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200")
          }`}
        >
          ΟΛΑ
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? (isDark ? "bg-white text-black" : "bg-black text-white")
                : (isDark ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200")
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {(isAdding || editingId) && (
        <div className={`p-6 rounded-[2rem] mb-8 shadow-xl transition-colors border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
          <div className={`mb-6 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl relative transition-colors ${isDark ? "border-gray-600 bg-gray-900" : "border-gray-200 bg-gray-50"}`}>
            {editForm.image_url ? (
              <div className="relative">
                <img src={editForm.image_url} alt="Preview" className="h-32 w-32 object-cover rounded-2xl shadow-md" />
                <button onClick={() => setEditForm({ ...editForm, image_url: "" })} className="absolute -top-3 -right-3 bg-red-500 text-white w-8 h-8 rounded-full font-bold">✕</button>
              </div>
            ) : (
              <>
                <span className="text-3xl mb-2">📷</span>
                <input type="file" accept="image/*" onChange={uploadImage} disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              placeholder="Όνομα Προϊόντος (Ελληνικά)"
              className={`p-4 rounded-xl font-bold border outline-none transition-colors ${isDark ? "bg-gray-900 border-gray-700 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 focus:border-blue-500"}`}
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Product Name (English)"
              className={`p-4 rounded-xl font-bold border outline-none transition-colors ${isDark ? "bg-gray-900 border-gray-700 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 focus:border-blue-500"}`}
              value={editForm.name_en || ""}
              onChange={(e) => setEditForm({ ...editForm, name_en: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-8">
            <input
              type="number"
              placeholder="Τιμή"
              className={`border p-4 rounded-xl font-bold outline-none transition-colors ${isDark ? "bg-gray-900 border-gray-700 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 focus:border-blue-500"}`}
              value={editForm.price}
              onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
            />
            <select
              className={`border p-4 rounded-xl font-bold outline-none transition-colors ${isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-200"}`}
              value={editForm.station || "bar"}
              onChange={(e) => setEditForm({ ...editForm, station: e.target.value })}
            >
              <option value="bar">🍹 Πάσο / Μπαρ</option>
              <option value="kitchen">🍳 Κουζίνα / Φαγητό</option>
            </select>
            <input
              type="text"
              placeholder="Κατηγορία (Ελληνικά)"
              className={`border p-4 rounded-xl font-bold outline-none transition-colors ${isDark ? "bg-gray-900 border-gray-700 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 focus:border-blue-500"}`}
              value={editForm.category}
              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
            />
            <input
              type="text"
              placeholder="Category (English)"
              className={`border p-4 rounded-xl font-bold outline-none transition-colors ${isDark ? "bg-gray-900 border-gray-700 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 focus:border-blue-500"}`}
              value={editForm.category_en || ""}
              onChange={(e) => setEditForm({ ...editForm, category_en: e.target.value })}
            />
          </div>

          <div className={`mb-8 border-t-2 border-dashed pt-6 ${isDark ? "border-gray-700" : "border-gray-200"}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`font-black uppercase tracking-widest text-xs ${isDark ? "text-gray-400" : "text-gray-800"}`}>
                Επιλογες / Add-ons
              </h3>
              <button onClick={addAddonGroup} className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase transition-colors ${isDark ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}>
                + Νεα Ομαδα
              </button>
            </div>
            <div className="space-y-4">
              {(editForm.addons || []).map((group, gIndex) => (
                <div key={group.id} className={`p-5 rounded-2xl border ${isDark ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <input
                      type="text"
                      placeholder="Όνομα ομάδας (GR)"
                      className={`flex-1 p-3 rounded-xl font-bold border text-sm outline-none transition-colors ${isDark ? "bg-gray-800 border-gray-600 text-white focus:border-blue-500" : "bg-white border-gray-200 focus:border-blue-500"}`}
                      value={group.name}
                      onChange={(e) => updateAddonGroup(group.id, "name", e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Group Name (EN)"
                      className={`flex-1 p-3 rounded-xl font-bold border text-sm outline-none transition-colors ${isDark ? "bg-gray-800 border-gray-600 text-white focus:border-blue-500" : "bg-white border-gray-200 focus:border-blue-500"}`}
                      value={group.name_en || ""}
                      onChange={(e) => updateAddonGroup(group.id, "name_en", e.target.value)}
                    />
                    <button onClick={() => removeAddonGroup(group.id)} className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold transition-colors ${isDark ? "bg-red-900/30 text-red-500 hover:bg-red-900/50" : "bg-red-50 text-red-500 hover:bg-red-100"}`}>✕</button>
                  </div>

                  <div className={`flex gap-4 mb-4 items-center p-3 rounded-xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                    <label className={`flex items-center gap-2 text-xs font-black uppercase cursor-pointer ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      <input type="checkbox" checked={group.isRequired} onChange={(e) => updateAddonGroup(group.id, "isRequired", e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
                      Υποχρεωτικο
                    </label>
                    <div className={`flex items-center gap-2 text-xs font-black uppercase ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      <span>Μεγιστες:</span>
                      <input type="number" min="1" value={group.maxSelections} onChange={(e) => updateAddonGroup(group.id, "maxSelections", parseInt(e.target.value))} className={`w-16 border rounded-lg p-1 text-center outline-none ${isDark ? "bg-gray-900 border-gray-600 text-white" : "bg-gray-50 border-gray-200"}`} />
                    </div>
                  </div>
                  <div className="space-y-2 mb-3 pl-4 border-l-2 border-blue-400">
                    {group.options.map((opt, oIndex) => (
                      <div key={oIndex} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Επιλογή (GR)"
                          className={`flex-1 p-2 rounded-lg font-bold border text-xs outline-none ${isDark ? "bg-gray-800 border-gray-600 text-white focus:border-blue-500" : "bg-white border-gray-200 focus:border-blue-500"}`}
                          value={opt.name}
                          onChange={(e) => updateAddonOption(group.id, oIndex, "name", e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Option (EN)"
                          className={`flex-1 p-2 rounded-lg font-bold border text-xs outline-none ${isDark ? "bg-gray-800 border-gray-600 text-white focus:border-blue-500" : "bg-white border-gray-200 focus:border-blue-500"}`}
                          value={opt.name_en || ""}
                          onChange={(e) => updateAddonOption(group.id, oIndex, "name_en", e.target.value)}
                        />
                        <div className={`w-24 flex items-center border rounded-lg pr-2 ${isDark ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
                          <input type="number" placeholder="0.00" step="0.10" className={`w-full bg-transparent p-2 text-xs font-bold outline-none ${isDark ? "text-white" : ""}`} value={opt.price} onChange={(e) => updateAddonOption(group.id, oIndex, "price", parseFloat(e.target.value))} />
                          <span className="text-gray-400 font-bold text-xs">€</span>
                        </div>
                        <button onClick={() => removeAddonOption(group.id, oIndex)} className="text-red-400 hover:text-red-500 p-2">✕</button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => addAddonOption(group.id)} className="text-blue-500 font-black text-[10px] uppercase ml-4 hover:text-blue-400">+ Προσθηκη Επιλογης</button>
                </div>
              ))}
            </div>
            {editForm.addons && editForm.addons.length > 0 && editForm.category && (
              <div className={`mt-4 pt-4 border-t flex justify-end ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                <button onClick={copyAddonsToCategory} className={`px-4 py-3 rounded-xl font-black text-[9px] uppercase flex items-center gap-2 border transition-colors ${isDark ? "bg-purple-900/30 text-purple-400 border-purple-900/50 hover:bg-purple-900/50" : "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200"}`}>
                  <span className="text-sm">🪄</span> Αντιγραφη σε ολα τα ειδη "{editForm.category}"
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={isAdding ? addNewProduct : saveEdit} disabled={isUploading} className="flex-1 bg-green-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50 transition-transform active:scale-95">Αποθήκευση</button>
            <button onClick={() => { setIsAdding(false); setEditingId(null); }} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase transition-colors ${isDark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}>Ακύρωση</button>
          </div>
        </div>
      )}

      {/* --- ΕΜΦΑΝΙΣΗ ΛΙΣΤΑΣ ΠΡΟΪΟΝΤΩΝ --- */}
      <div className="space-y-3">
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            className={`border p-3 rounded-[2rem] flex justify-between items-center shadow-sm transition-all ${
              !p.is_available
                ? (isDark ? "opacity-50 border-red-900/50 bg-red-900/10" : "opacity-50 border-red-100 bg-red-50/20")
                : (isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl bg-cover bg-center shadow-inner flex items-center justify-center text-xl ${isDark ? "bg-gray-900" : "bg-gray-100"}`}
                style={p.image_url ? { backgroundImage: `url(${p.image_url})` } : {}}
              >
                {!p.image_url && "🍽️"}
              </div>
              <div>
                <p className={`font-black uppercase text-sm ${isDark ? "text-gray-100" : "text-gray-800"}`}>
                  {p.name}{" "}
                  {p.name_en && (
                    <span className="text-gray-500 text-[10px] lowercase ml-1">({p.name_en})</span>
                  )}{" "}
                  {!p.is_available && (
                    <span className="text-red-500 text-[9px] ml-2">(OFF)</span>
                  )}
                  {p.is_recommended && (
                    <span className="text-yellow-500 text-[10px] ml-2">⭐</span>
                  )}
                </p>
                <p className="text-blue-500 font-black text-xs mt-1">
                  {p.price.toFixed(2)}€ <span className="text-gray-500 font-bold">• {p.category} {p.category_en && `(${p.category_en})`}</span> •{" "}
                  <span className={p.station === "kitchen" ? "text-orange-500" : "text-purple-500"}>
                    {p.station === "kitchen" ? "🍳 Κουζίνα" : "🍹 Μπαρ"}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-1 flex-col sm:flex-row">
              <button
                onClick={() => handleToggleRecommended(p)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-colors ${
                  p.is_recommended 
                    ? (isDark ? "bg-yellow-900/30 text-yellow-400 border border-yellow-700/50" : "bg-yellow-100 text-yellow-500 border border-yellow-200") 
                    : (isDark ? "bg-gray-900 text-gray-600 border border-transparent hover:bg-gray-700" : "bg-gray-50 text-gray-300 border border-transparent hover:bg-gray-100")
                }`}
              >
                ⭐
              </button>
              <button
                onClick={() => handleToggleAvailable(p)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${
                  p.is_available
                    ? (isDark ? "bg-green-900/30 text-green-500" : "bg-green-100 text-green-600")
                    : (isDark ? "bg-red-900/30 text-red-500" : "bg-red-100 text-red-500")
                }`}
              >
                {p.is_available ? "ON" : "OFF"}
              </button>
              <button
                onClick={() => { setEditingId(p.id); setEditForm({ ...p, station: p.station || "bar", addons: p.addons || [] }); }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${isDark ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50" : "bg-blue-50 text-blue-500 hover:bg-blue-100"}`}
              >
                ✎
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${isDark ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-red-50 text-red-400 hover:bg-red-100"}`}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


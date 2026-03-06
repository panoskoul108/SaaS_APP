import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://vgyzevaxkayyobopznyr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZneXpldmF4a2F5eW9ib3B6bnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNjI2MDksImV4cCI6MjA4NjYzODYwOX0.u-kO33BloFq4MU3sZsxN8QVcNTjOOZtsDT4srhbdsCw";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CATEGORY_ORDER = [
  "ΠΡΟΤΕΙΝΟΜΕΝΑ",
  "ΚΑΦΕΔΕΣ",
  "ΑΝΑΨΥΚΤΙΚΑ",
  "ΡΟΦΗΜΑΤΑ",
  "ΠΡΩΙΝΟ",
  "ΜΠΥΡΕΣ",
  "ΣΝΑΚΣ",
  "ΣΥΝΟΔΕΥΤΙΚΑ",
  "ΣΑΛΑΤΕΣ",
  "ΖΥΜΑΡΙΚΑ",
  "ΠΙΤΣΕΣ",
  "ΑΛΜΥΡΕΣ ΚΡΕΠΕΣ",
  "ΓΛΥΚΕΣ ΚΡΕΠΕΣ",
  "ΓΛΥΚΑ",
];

export default function AdminProducts({ storeId }) {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Φίλτρο Κατηγορίας
  const [filterCategory, setFilterCategory] = useState("ΟΛΑ");

  const [editForm, setEditForm] = useState({
    name: "",
    name_en: "",
    description: "",
    description_en: "",
    price: 0,
    category: "",
    category_en: "",
    station: "bar",
    sort_order: 0, // Νέο πεδίο για την ταξινόμηση
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
      .order("sort_order", { ascending: true })
      .order("category")
      .order("name");
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
        {
          id: Date.now(),
          name: "",
          name_en: "",
          isRequired: false,
          maxSelections: 1,
          options: [],
        },
      ],
    });
  const removeAddonGroup = (groupId) =>
    setEditForm({
      ...editForm,
      addons: editForm.addons.filter((g) => g.id !== groupId),
    });
  const updateAddonGroup = (groupId, field, value) =>
    setEditForm({
      ...editForm,
      addons: editForm.addons.map((g) =>
        g.id === groupId ? { ...g, [field]: value } : g
      ),
    });
  const addAddonOption = (groupId) =>
    setEditForm({
      ...editForm,
      addons: editForm.addons.map((g) =>
        g.id === groupId
          ? {
              ...g,
              options: [...g.options, { name: "", name_en: "", price: 0 }],
            }
          : g
      ),
    });
  const removeAddonOption = (groupId, optionIndex) =>
    setEditForm({
      ...editForm,
      addons: editForm.addons.map((g) => {
        if (g.id === groupId) {
          const newOptions = [...g.options];
          newOptions.splice(optionIndex, 1);
          return { ...g, options: newOptions };
        }
        return g;
      }),
    });
  const updateAddonOption = (groupId, optionIndex, field, value) =>
    setEditForm({
      ...editForm,
      addons: editForm.addons.map((g) => {
        if (g.id === groupId) {
          const newOptions = [...g.options];
          newOptions[optionIndex][field] = value;
          return { ...g, options: newOptions };
        }
        return g;
      }),
    });

  const copyAddonsToCategory = async () => {
    if (!editForm.category) return alert("Ορίστε κατηγορία πρώτα.");
    if (
      window.confirm(
        `Αντιγραφή επιλογών σε όλη την κατηγορία "${editForm.category}";`
      )
    ) {
      await supabase
        .from("products")
        .update({ addons: editForm.addons || [] })
        .eq("store_id", storeId)
        .eq("category", editForm.category);
      alert("Επιτυχία!");
      fetchProducts();
    }
  };

  // Φιλτράρισμα Προϊόντων με βάση την επιλεγμένη κατηγορία
  const filteredProducts =
    filterCategory === "ΟΛΑ"
      ? products
      : products.filter((p) => p.category === filterCategory);

  // Δυναμική λίστα κατηγοριών για το φίλτρο (ταξινομημένη με το CATEGORY_ORDER)
  const uniqueCategories = [...new Set(products.map((p) => p.category))].sort(
    (a, b) => {
      let idxA = CATEGORY_ORDER.indexOf(a);
      let idxB = CATEGORY_ORDER.indexOf(b);
      if (idxA === -1) idxA = 999;
      if (idxB === -1) idxB = 999;
      return idxA - idxB;
    }
  );

  return (
    <div className="max-w-4xl mx-auto pb-24 px-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-blue-600">
          Κατάλογος
        </h2>
        <button
          onClick={() => {
            setIsAdding(true);
            setEditForm({
              name: "",
              name_en: "",
              description: "",
              description_en: "",
              price: 0,
              category: filterCategory !== "ΟΛΑ" ? filterCategory : "", // Παίρνει αυτόματα την κατηγορία αν έχουμε φίλτρο
              category_en: "",
              station: "bar",
              sort_order: 0,
              is_available: true,
              is_recommended: false,
              image_url: "",
              addons: [],
            });
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg w-full sm:w-auto text-center"
        >
          + Προσθήκη Προϊοντος
        </button>
      </div>

      {/* --- ΦΙΛΤΡΟ ΚΑΤΗΓΟΡΙΩΝ --- */}
      {!isAdding && !editingId && (
        <div className="mb-8 overflow-x-auto pb-2 no-scrollbar">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterCategory("ΟΛΑ")}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${
                filterCategory === "ΟΛΑ"
                  ? "bg-gray-800 text-white shadow-md"
                  : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              ΟΛΑ
            </button>
            {uniqueCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${
                  filterCategory === cat
                    ? "bg-gray-800 text-white shadow-md"
                    : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {(isAdding || editingId) && (
        <div className="bg-white p-6 rounded-[2rem] mb-8 border border-gray-100 shadow-xl">
          <div className="mb-6 flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 relative">
            {editForm.image_url ? (
              <div className="relative">
                <img
                  src={editForm.image_url}
                  alt="Preview"
                  className="h-32 w-32 object-cover rounded-2xl shadow-md"
                />
                <button
                  onClick={() => setEditForm({ ...editForm, image_url: "" })}
                  className="absolute -top-3 -right-3 bg-red-500 text-white w-8 h-8 rounded-full font-bold shadow-lg"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <span className="text-3xl mb-2">📷</span>
                <span className="text-xs font-bold text-gray-400 uppercase">
                  ΠΡΟΣΘΗΚΗ ΕΙΚΟΝΑΣ
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={uploadImage}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              placeholder="Όνομα Προϊόντος (Ελληνικά)"
              className="bg-gray-50 p-4 rounded-xl font-bold border border-gray-200 outline-none focus:border-blue-500"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Product Name (English)"
              className="bg-gray-50 p-4 rounded-xl font-bold border border-gray-200 outline-none focus:border-blue-500"
              value={editForm.name_en || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, name_en: e.target.value })
              }
            />
          </div>

          {/* ΠΕΔΙΑ ΓΙΑ ΥΛΙΚΑ / ΠΕΡΙΓΡΑΦΗ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <textarea
              placeholder="Υλικά / Περιγραφή (Ελληνικά)"
              className="bg-gray-50 p-4 rounded-xl font-bold text-sm border border-gray-200 outline-none focus:border-blue-500 resize-none h-20"
              value={editForm.description || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
            />
            <textarea
              placeholder="Ingredients / Description (English)"
              className="bg-gray-50 p-4 rounded-xl font-bold text-sm border border-gray-200 outline-none focus:border-blue-500 resize-none h-20"
              value={editForm.description_en || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, description_en: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-8">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-400 uppercase mb-1 ml-1">
                ΤΙΜΗ (€)
              </span>
              <input
                type="number"
                placeholder="Τιμή"
                className="bg-gray-50 border border-gray-200 p-4 rounded-xl font-black text-blue-600 outline-none focus:border-blue-500"
                value={editForm.price}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    price: parseFloat(e.target.value),
                  })
                }
              />
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-400 uppercase mb-1 ml-1">
                ΣΕΙΡΑ (ΜΙΚΡΟΤΕΡΟ=ΠΡΩΤΟ)
              </span>
              <input
                type="number"
                placeholder="Σειρά"
                className="bg-gray-50 border border-gray-200 p-4 rounded-xl font-bold outline-none focus:border-blue-500"
                value={editForm.sort_order || 0}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    sort_order: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-400 uppercase mb-1 ml-1">
                ΣΤΑΘΜΟΣ
              </span>
              <select
                className="bg-gray-50 border border-gray-200 p-4 rounded-xl font-bold outline-none focus:border-blue-500 h-[58px]"
                value={editForm.station || "bar"}
                onChange={(e) =>
                  setEditForm({ ...editForm, station: e.target.value })
                }
              >
                <option value="bar">🍹 Πάσο</option>
                <option value="kitchen">🍳 Κουζίνα</option>
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-400 uppercase mb-1 ml-1">
                ΚΑΤΗΓΟΡΙΑ (GR)
              </span>
              <input
                type="text"
                placeholder="π.χ. ΚΑΦΕΔΕΣ"
                className="bg-gray-50 border border-gray-200 p-4 rounded-xl font-bold outline-none focus:border-blue-500 uppercase h-[58px]"
                value={editForm.category}
                onChange={(e) =>
                  setEditForm({ ...editForm, category: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-400 uppercase mb-1 ml-1">
                ΚΑΤΗΓΟΡΙΑ (EN)
              </span>
              <input
                type="text"
                placeholder="π.χ. COFFEES"
                className="bg-gray-50 border border-gray-200 p-4 rounded-xl font-bold outline-none focus:border-blue-500 uppercase h-[58px]"
                value={editForm.category_en || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, category_en: e.target.value })
                }
              />
            </div>
          </div>

          <div className="mb-8 border-t-2 border-dashed border-gray-200 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-gray-800 uppercase tracking-widest text-xs">
                Επιλογες / Add-ons
              </h3>
              <button
                onClick={addAddonGroup}
                className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-black text-[9px] uppercase hover:bg-blue-100 transition-colors"
              >
                + Νεα Ομαδα
              </button>
            </div>
            <div className="space-y-4">
              {(editForm.addons || []).map((group, gIndex) => (
                <div
                  key={group.id}
                  className="bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-inner"
                >
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <input
                      type="text"
                      placeholder="Όνομα ομάδας (GR) π.χ. Ζάχαρη"
                      className="flex-1 bg-white p-3 rounded-xl font-bold border border-gray-200 text-sm outline-none focus:border-blue-500"
                      value={group.name}
                      onChange={(e) =>
                        updateAddonGroup(group.id, "name", e.target.value)
                      }
                    />
                    <input
                      type="text"
                      placeholder="Group Name (EN) e.g. Sugar"
                      className="flex-1 bg-white p-3 rounded-xl font-bold border border-gray-200 text-sm outline-none focus:border-blue-500"
                      value={group.name_en || ""}
                      onChange={(e) =>
                        updateAddonGroup(group.id, "name_en", e.target.value)
                      }
                    />
                    <button
                      onClick={() => removeAddonGroup(group.id)}
                      className="bg-red-50 text-red-500 w-12 h-12 rounded-xl flex items-center justify-center font-bold hover:bg-red-100 transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex gap-4 mb-4 items-center bg-white p-3 rounded-xl border border-gray-100">
                    <label className="flex items-center gap-2 text-xs font-black uppercase text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={group.isRequired}
                        onChange={(e) =>
                          updateAddonGroup(
                            group.id,
                            "isRequired",
                            e.target.checked
                          )
                        }
                        className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                      />{" "}
                      Υποχρεωτικο
                    </label>
                    <div className="flex items-center gap-2 text-xs font-black uppercase text-gray-600">
                      <span>Μεγιστες:</span>
                      <input
                        type="number"
                        min="1"
                        value={group.maxSelections}
                        onChange={(e) =>
                          updateAddonGroup(
                            group.id,
                            "maxSelections",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-16 bg-gray-50 border border-gray-200 rounded-lg p-1 text-center outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mb-3 pl-4 border-l-2 border-blue-200">
                    {group.options.map((opt, oIndex) => (
                      <div key={oIndex} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Επιλογή (GR)"
                          className="flex-1 bg-white p-2 rounded-lg font-bold border border-gray-200 text-xs outline-none focus:border-blue-500"
                          value={opt.name}
                          onChange={(e) =>
                            updateAddonOption(
                              group.id,
                              oIndex,
                              "name",
                              e.target.value
                            )
                          }
                        />
                        <input
                          type="text"
                          placeholder="Option (EN)"
                          className="flex-1 bg-white p-2 rounded-lg font-bold border border-gray-200 text-xs outline-none focus:border-blue-500"
                          value={opt.name_en || ""}
                          onChange={(e) =>
                            updateAddonOption(
                              group.id,
                              oIndex,
                              "name_en",
                              e.target.value
                            )
                          }
                        />
                        <div className="w-24 flex items-center bg-white border border-gray-200 rounded-lg pr-2 focus-within:border-blue-500">
                          <input
                            type="number"
                            placeholder="0.00"
                            step="0.10"
                            className="w-full bg-transparent p-2 text-xs font-bold outline-none"
                            value={opt.price}
                            onChange={(e) =>
                              updateAddonOption(
                                group.id,
                                oIndex,
                                "price",
                                parseFloat(e.target.value)
                              )
                            }
                          />
                          <span className="text-gray-400 font-bold text-xs">
                            €
                          </span>
                        </div>
                        <button
                          onClick={() => removeAddonOption(group.id, oIndex)}
                          className="text-red-400 hover:text-red-600 p-2 bg-red-50 rounded-lg"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => addAddonOption(group.id)}
                    className="text-blue-500 font-black text-[10px] uppercase ml-4 mt-2 hover:text-blue-700"
                  >
                    + Προσθηκη Επιλογης
                  </button>
                </div>
              ))}
            </div>
            {editForm.addons &&
              editForm.addons.length > 0 &&
              editForm.category && (
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={copyAddonsToCategory}
                    className="bg-purple-100 text-purple-700 px-4 py-3 rounded-xl font-black text-[9px] uppercase hover:bg-purple-200 transition-colors border border-purple-200 flex items-center gap-2 shadow-sm"
                  >
                    <span className="text-sm">🪄</span> Αντιγραφη σε ολα τα ειδη
                    "{editForm.category}"
                  </button>
                </div>
              )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={isAdding ? addNewProduct : saveEdit}
              disabled={isUploading}
              className="flex-[2] bg-green-600 text-white py-4 rounded-xl font-black text-[11px] uppercase tracking-widest disabled:opacity-50 hover:bg-green-700 shadow-lg transition-colors"
            >
              {isAdding ? "Δημιουργια Προϊοντος" : "Αποθηκευση Αλλαγων"}
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="flex-1 bg-gray-200 text-gray-600 py-4 rounded-xl font-black text-[11px] uppercase hover:bg-gray-300 transition-colors"
            >
              Ακυρωση
            </button>
          </div>
        </div>
      )}

      {/* ΛΙΣΤΑ ΠΡΟΪΟΝΤΩΝ ΜΕ ΒΑΣΗ ΤΟ ΦΙΛΤΡΟ */}
      <div className="space-y-3">
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            className={`bg-white border p-3 rounded-[2rem] flex justify-between items-center shadow-sm transition-all ${
              !p.is_available
                ? "opacity-50 border-red-100 bg-red-50/20"
                : "border-gray-100 hover:shadow-md"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl bg-gray-100 bg-cover bg-center shadow-inner flex items-center justify-center text-xl shrink-0"
                style={
                  p.image_url ? { backgroundImage: `url(${p.image_url})` } : {}
                }
              >
                {!p.image_url && "🍽️"}
              </div>
              <div>
                <p className="font-black uppercase text-gray-800 text-sm leading-tight">
                  {p.name}{" "}
                  {p.name_en && (
                    <span className="text-gray-400 text-[10px] lowercase ml-1 font-bold">
                      ({p.name_en})
                    </span>
                  )}{" "}
                  {!p.is_available && (
                    <span className="bg-red-500 text-white px-2 py-0.5 rounded text-[9px] ml-2 font-black">
                      OFF
                    </span>
                  )}
                  {p.is_recommended && (
                    <span className="bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded text-[9px] ml-2 font-black">
                      ⭐ REC
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[10px] font-black uppercase text-gray-500">
                  <span className="text-blue-600 text-xs">
                    {p.price.toFixed(2)}€
                  </span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded-md">
                    {p.category} {p.category_en && `(${p.category_en})`}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md border ${
                      p.station === "kitchen"
                        ? "bg-orange-50 border-orange-200 text-orange-600"
                        : "bg-purple-50 border-purple-200 text-purple-600"
                    }`}
                  >
                    {p.station === "kitchen" ? "🍳 Κουζίνα" : "🍹 Πάσο"}
                  </span>
                  {p.sort_order > 0 && (
                    <span className="text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded">
                      Σειρα: {p.sort_order}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-1 flex-col sm:flex-row ml-2 shrink-0">
              <button
                onClick={() => handleToggleRecommended(p)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-colors ${
                  p.is_recommended
                    ? "bg-yellow-100 text-yellow-500"
                    : "bg-gray-50 text-gray-300 hover:bg-gray-100"
                }`}
                title="Προτεινόμενο"
              >
                ⭐
              </button>
              <button
                onClick={() => handleToggleAvailable(p)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[9px] transition-colors ${
                  p.is_available
                    ? "bg-green-100 text-green-600 hover:bg-green-200"
                    : "bg-red-100 text-red-500 hover:bg-red-200"
                }`}
                title="Διαθεσιμότητα"
              >
                {p.is_available ? "ON" : "OFF"}
              </button>
              <button
                onClick={() => {
                  setEditingId(p.id);
                  setEditForm({
                    ...p,
                    station: p.station || "bar",
                    sort_order: p.sort_order || 0,
                    addons: p.addons || [],
                  });
                  window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll πάνω
                }}
                className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center font-bold hover:bg-blue-100 transition-colors"
                title="Επεξεργασία"
              >
                ✎
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                className="w-10 h-10 bg-red-50 text-red-400 rounded-xl flex items-center justify-center font-bold hover:bg-red-100 hover:text-red-600 transition-colors"
                title="Διαγραφή"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="text-center text-gray-400 font-bold py-10 uppercase text-sm">
            Δεν υπαρχουν προϊοντα στην κατηγορια "{filterCategory}"
          </div>
        )}
      </div>
    </div>
  );
}

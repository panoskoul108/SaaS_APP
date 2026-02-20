import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://vgyzevaxkayyobopznyr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZneXpldmF4a2F5eW9ib3B6bnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNjI2MDksImV4cCI6MjA4NjYzODYwOX0.u-kO33BloFq4MU3sZsxN8QVcNTjOOZtsDT4srhbdsCw";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function AdminProducts({ storeId }) {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);

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

  // ΝΕΟ: Τα νέα Addons παίρνουν αυτόματα και το name_en (κενό στην αρχή)
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

  return (
    <div className="max-w-4xl mx-auto pb-24 px-2">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-blue-600">
          Κατάλογος
        </h2>
        <button
          onClick={() => {
            setIsAdding(true);
            setEditForm({
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
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg"
        >
          + Προσθήκη
        </button>
      </div>

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
                  className="absolute -top-3 -right-3 bg-red-500 text-white w-8 h-8 rounded-full font-bold"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <span className="text-3xl mb-2">📷</span>
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
              className="bg-gray-50 p-4 rounded-xl font-bold border border-gray-200"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Product Name (English)"
              className="bg-gray-50 p-4 rounded-xl font-bold border border-gray-200"
              value={editForm.name_en || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, name_en: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-8">
            <input
              type="number"
              placeholder="Τιμή"
              className="bg-gray-50 border border-gray-200 p-4 rounded-xl font-bold"
              value={editForm.price}
              onChange={(e) =>
                setEditForm({ ...editForm, price: parseFloat(e.target.value) })
              }
            />
            <select
              className="bg-gray-50 border border-gray-200 p-4 rounded-xl font-bold outline-none"
              value={editForm.station || "bar"}
              onChange={(e) =>
                setEditForm({ ...editForm, station: e.target.value })
              }
            >
              <option value="bar">🍹 Πάσο / Μπαρ</option>
              <option value="kitchen">🍳 Κουζίνα / Φαγητό</option>
            </select>
            <input
              type="text"
              placeholder="Κατηγορία (Ελληνικά)"
              className="bg-gray-50 border border-gray-200 p-4 rounded-xl font-bold"
              value={editForm.category}
              onChange={(e) =>
                setEditForm({ ...editForm, category: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Category (English)"
              className="bg-gray-50 border border-gray-200 p-4 rounded-xl font-bold"
              value={editForm.category_en || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, category_en: e.target.value })
              }
            />
          </div>

          <div className="mb-8 border-t-2 border-dashed border-gray-200 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-gray-800 uppercase tracking-widest text-xs">
                Επιλογες / Add-ons
              </h3>
              <button
                onClick={addAddonGroup}
                className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-black text-[9px] uppercase"
              >
                + Νεα Ομαδα
              </button>
            </div>
            <div className="space-y-4">
              {(editForm.addons || []).map((group, gIndex) => (
                <div
                  key={group.id}
                  className="bg-gray-50 p-5 rounded-2xl border border-gray-200"
                >
                  {/* ΔΙΓΛΩΣΣΗ ΟΜΑΔΑ */}
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <input
                      type="text"
                      placeholder="Όνομα ομάδας (GR)"
                      className="flex-1 bg-white p-3 rounded-xl font-bold border border-gray-200 text-sm"
                      value={group.name}
                      onChange={(e) =>
                        updateAddonGroup(group.id, "name", e.target.value)
                      }
                    />
                    <input
                      type="text"
                      placeholder="Group Name (EN)"
                      className="flex-1 bg-white p-3 rounded-xl font-bold border border-gray-200 text-sm"
                      value={group.name_en || ""}
                      onChange={(e) =>
                        updateAddonGroup(group.id, "name_en", e.target.value)
                      }
                    />
                    <button
                      onClick={() => removeAddonGroup(group.id)}
                      className="bg-red-50 text-red-500 w-12 h-12 rounded-xl flex items-center justify-center font-bold"
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
                        className="w-4 h-4 rounded text-blue-600"
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
                        className="w-16 bg-gray-50 border border-gray-200 rounded-lg p-1 text-center"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mb-3 pl-4 border-l-2 border-blue-200">
                    {group.options.map((opt, oIndex) => (
                      // ΔΙΓΛΩΣΣΗ ΕΠΙΛΟΓΗ
                      <div key={oIndex} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Επιλογή (GR)"
                          className="flex-1 bg-white p-2 rounded-lg font-bold border border-gray-200 text-xs"
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
                          className="flex-1 bg-white p-2 rounded-lg font-bold border border-gray-200 text-xs"
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
                        <div className="w-24 flex items-center bg-white border border-gray-200 rounded-lg pr-2">
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
                          className="text-red-400 hover:text-red-600 p-2"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => addAddonOption(group.id)}
                    className="text-blue-500 font-black text-[10px] uppercase ml-4"
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
                    className="bg-purple-100 text-purple-700 px-4 py-3 rounded-xl font-black text-[9px] uppercase hover:bg-purple-200 transition-colors border border-purple-200 flex items-center gap-2"
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
              className="flex-1 bg-green-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
            >
              Αποθήκευση
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="flex-1 bg-gray-200 text-gray-600 py-4 rounded-xl font-black text-[10px] uppercase"
            >
              Ακύρωση
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {products.map((p) => (
          <div
            key={p.id}
            className={`bg-white border p-3 rounded-[2rem] flex justify-between items-center shadow-sm transition-all ${
              !p.is_available
                ? "opacity-50 border-red-100 bg-red-50/20"
                : "border-gray-100"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl bg-gray-100 bg-cover bg-center shadow-inner flex items-center justify-center text-xl"
                style={
                  p.image_url ? { backgroundImage: `url(${p.image_url})` } : {}
                }
              >
                {!p.image_url && "🍽️"}
              </div>
              <div>
                <p className="font-black uppercase text-gray-800 text-sm">
                  {p.name}{" "}
                  {p.name_en && (
                    <span className="text-gray-400 text-[10px] lowercase ml-1">
                      ({p.name_en})
                    </span>
                  )}{" "}
                  {!p.is_available && (
                    <span className="text-red-500 text-[9px] ml-2">(OFF)</span>
                  )}
                  {p.is_recommended && (
                    <span className="text-yellow-500 text-[10px] ml-2">⭐</span>
                  )}
                </p>
                <p className="text-blue-500 font-black text-xs mt-1">
                  {p.price.toFixed(2)}€ • {p.category}{" "}
                  {p.category_en && `(${p.category_en})`} •{" "}
                  <span
                    className={
                      p.station === "kitchen"
                        ? "text-orange-500"
                        : "text-purple-500"
                    }
                  >
                    {p.station === "kitchen" ? "🍳 Κουζίνα" : "🍹 Μπαρ"}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-1 flex-col sm:flex-row">
              <button
                onClick={() => handleToggleRecommended(p)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gray-50 text-gray-300"
              >
                ⭐
              </button>
              <button
                onClick={() => handleToggleAvailable(p)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                  p.is_available
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-500"
                }`}
              >
                {p.is_available ? "ON" : "OFF"}
              </button>
              <button
                onClick={() => {
                  setEditingId(p.id);
                  setEditForm({
                    ...p,
                    station: p.station || "bar",
                    addons: p.addons || [],
                  });
                }}
                className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center font-bold"
              >
                ✎
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                className="w-10 h-10 bg-red-50 text-red-400 rounded-xl flex items-center justify-center font-bold"
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

import React from "react";

// Βοηθητική συνάρτηση που αφαιρεί τους τόνους και τα κάνει όλα κεφαλαία
const normalizeStr = (str) => 
  str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() : "";

export default function ProductModal({
  activeProduct,
  lang,
  t,
  editingCartId,
  closeProductModal,
  addonSelections,
  toggleAddon,
  themeColor,
  quantity,
  setQuantity,
  currentProductNote,
  setCurrentProductNote,
  confirmAddons,
  theme,
}) {
  if (!activeProduct) return null;

  const activeDispDesc = lang === "en" && activeProduct.description_en ? activeProduct.description_en : activeProduct.description;
  const isDark = theme === "dark";

  // --- ΑΠΟΛΥΤΑ ΕΞΥΠΝΟ ΣΥΣΤΗΜΑ ---
  let isSketosSelected = false;
  (activeProduct.addons || []).forEach((group) => {
    const selections = addonSelections[group.id] || [];
    selections.forEach((selIndex) => {
      const optName = normalizeStr(group.options[selIndex]?.name);
      if (optName.includes("ΣΚΕΤ") || optName.includes("ΧΩΡΙΣ")) { 
        isSketosSelected = true;
      }
    });
  });

  const visibleAddons = (activeProduct.addons || []).filter(group => {
    const groupNameUpper = normalizeStr(group.name);
    // Κρύβει ό,τι έχει ΖΑΧΑΡ ή ΓΛΥΚΑΝΤΙΚ
    if (isSketosSelected && (groupNameUpper.includes("ΖΑΧΑΡ") || groupNameUpper.includes("ΓΛΥΚΑΝΤΙΚ"))) return false;
    return true;
  });

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex flex-col justify-end animate-fade-in"
      onClick={closeProductModal}
    >
      <div
        className={`${isDark ? "bg-gray-800" : "bg-white"} w-full rounded-t-[2.5rem] p-6 shadow-2xl animate-slide-up max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex justify-between items-start mb-4 border-b pb-4 ${isDark ? "border-gray-700" : "border-gray-100"}`}>
          <div className="flex flex-col pr-4">
            <h2 className={`font-black text-xl uppercase italic ${isDark ? "text-white" : "text-gray-900"}`}>
              {lang === "en" && activeProduct.name_en ? activeProduct.name_en : activeProduct.name}
            </h2>
            {activeDispDesc && (
              <p className="text-xs text-gray-500 mt-1 font-medium italic">{activeDispDesc}</p>
            )}
            {editingCartId && (
              <span className="text-[10px] text-blue-500 mt-1 font-black uppercase">{t.edit}</span>
            )}
          </div>
          <button
            onClick={closeProductModal}
            className={`w-10 h-10 rounded-full font-black flex items-center justify-center shrink-0 transition-colors ${isDark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >✕</button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-6 pb-6 no-scrollbar">
          {visibleAddons.map((group) => {
            const groupDispName = lang === "en" && group.name_en ? group.name_en : group.name;
            return (
              <div key={group.id} className={`p-4 rounded-3xl border ${isDark ? "bg-gray-900/50 border-gray-700" : "bg-gray-50/50 border-gray-100"}`}>
                <div className="flex justify-between items-end mb-3">
                  <h3 className={`font-black uppercase text-sm ${isDark ? "text-gray-100" : "text-gray-800"}`}>{groupDispName}</h3>
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg shadow-sm border ${isDark ? "bg-gray-800 border-gray-700 text-gray-400" : "bg-white border-gray-100 text-gray-400"}`}>
                    {group.isRequired ? t.req : t.opt} {group.maxSelections > 1 ? `(${t.upTo} ${group.maxSelections})` : `(${t.select1})`}
                  </span>
                </div>
                <div className="space-y-2">
                  {group.options.map((opt, i) => {
                    const isSelected = (addonSelections[group.id] || []).includes(i);
                    const optDispName = lang === "en" && opt.name_en ? opt.name_en : opt.name;
                    return (
                      <div
                        key={i}
                        onClick={() => toggleAddon(group.id, i, group.maxSelections)}
                        className={`flex justify-between items-center p-4 rounded-2xl cursor-pointer transition-all border-2 ${isSelected ? isDark ? "bg-blue-900/30" : "bg-blue-50/50" : isDark ? "border-gray-700 bg-gray-800 hover:border-gray-600" : "border-gray-200/50 bg-white hover:border-gray-300"}`}
                        style={isSelected ? { borderColor: themeColor } : {}}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "" : isDark ? "border-gray-500" : "border-gray-300"}`} style={isSelected ? { borderColor: themeColor, backgroundColor: themeColor } : {}}>
                            {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                          </div>
                          <span className={`font-bold uppercase text-xs ${isSelected ? isDark ? "text-white" : "text-gray-900" : isDark ? "text-gray-300" : "text-gray-600"}`}>
                            {optDispName}
                          </span>
                        </div>
                        <span className="font-black text-sm" style={opt.price > 0 ? { color: themeColor } : { color: "#9CA3AF" }}>
                          {opt.price > 0 ? `+${opt.price.toFixed(2)}€` : t.free}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className={`flex items-center justify-between p-5 rounded-3xl border ${isDark ? "bg-gray-900/50 border-gray-700" : "bg-gray-50/50 border-gray-100"}`}>
            <span className={`font-black uppercase text-sm ${isDark ? "text-gray-100" : "text-gray-800"}`}>{t.qty}</span>
            <div className={`flex items-center gap-4 px-2 py-1 rounded-2xl border shadow-sm ${isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"}`}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center text-2xl font-bold text-gray-500 hover:text-gray-400 transition-colors">−</button>
              <span className="font-black text-xl w-6 text-center">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center text-2xl font-bold hover:opacity-80 transition-colors" style={{ color: themeColor }}>+</button>
            </div>
          </div>

          <div className={`p-4 rounded-3xl border ${isDark ? "bg-gray-900/50 border-gray-700" : "bg-gray-50/50 border-gray-100"}`}>
            <span className={`font-black uppercase text-sm mb-2 block tracking-tight ${isDark ? "text-gray-100" : "text-gray-800"}`}>{t.note}</span>
            <textarea rows="2" placeholder={t.itemNotePlaceholder} value={currentProductNote} onChange={(e) => setCurrentProductNote(e.target.value)} className={`w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none font-bold resize-none shadow-sm ${isDark ? "bg-gray-800 border-gray-600 text-white focus:border-blue-400" : "bg-white border-gray-200 focus:border-blue-400"}`}></textarea>
          </div>
        </div>

        <button onClick={confirmAddons} className="w-full text-white py-5 rounded-2xl font-black uppercase text-sm tracking-widest mt-4 shadow-xl active:scale-95 transition-transform flex justify-between px-6" style={{ backgroundColor: themeColor }}>
          <span>{editingCartId ? t.save : t.addToCart}</span>
          <span>{!editingCartId && quantity > 1 ? `x${quantity}` : ""}</span>
        </button>
      </div>
    </div>
  );
}

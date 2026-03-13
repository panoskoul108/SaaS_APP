import React from "react";

export default function ProductModal({
  theme,
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
  canOrder // Προσθέσαμε αυτό το prop!
}) {
  if (!activeProduct) return null;

  const isDark = theme === "dark";
  
  // Έξυπνη επιλογή Γλώσσας για τον Τίτλο και την Περιγραφή
  const dispName = lang === "tr" && activeProduct.name_tr ? activeProduct.name_tr : (lang === "en" && activeProduct.name_en ? activeProduct.name_en : activeProduct.name);
  const dispDesc = lang === "tr" && activeProduct.description_tr ? activeProduct.description_tr : (lang === "en" && activeProduct.description_en ? activeProduct.description_en : activeProduct.description);

  let extraPrice = 0;
  (activeProduct.addons || []).forEach((g) => {
    const sels = addonSelections[g.id] || [];
    sels.forEach((idx) => { extraPrice += g.options[idx].price; });
  });
  const currentTotal = (activeProduct.price + extraPrice) * quantity;

  return (
    <div className="fixed inset-0 bg-black/80 z-[300] flex items-end sm:items-center justify-center animate-fade-in" onClick={closeProductModal}>
      <div 
        className={`w-full max-w-lg h-[85vh] sm:h-[90vh] sm:rounded-[3rem] rounded-t-[3rem] flex flex-col shadow-2xl relative overflow-hidden transform transition-transform translate-y-0 ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Eικόνας */}
        <div className={`relative h-48 sm:h-64 shrink-0 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          {activeProduct.image_url ? (
             <img src={activeProduct.image_url} alt={dispName} className="w-full h-full object-cover" />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-4xl opacity-50">🍔</div>
          )}
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/60 to-transparent"></div>
          <button onClick={closeProductModal} className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full text-white flex items-center justify-center text-xl hover:bg-white/30 transition-colors">✕</button>
        </div>

        <div className={`flex-1 overflow-y-auto p-6 no-scrollbar ${canOrder ? 'pb-24' : 'pb-6'}`}>
          <h2 className={`text-2xl font-black uppercase mb-2 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{dispName}</h2>
          <p className="text-xl font-black mb-4" style={{ color: themeColor }}>{activeProduct.price.toFixed(2)}€</p>
          {dispDesc && <p className={`text-sm font-medium mb-6 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{dispDesc}</p>}

          {canOrder && (activeProduct.addons || []).map((group) => {
            const groupName = lang === "tr" && group.name_tr ? group.name_tr : (lang === "en" && group.name_en ? group.name_en : group.name);
            const isReq = group.isRequired;
            const maxSel = group.maxSelections || 1;
            const selectedCount = (addonSelections[group.id] || []).length;
            
            return (
              <div key={group.id} className="mb-6">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <h3 className={`font-black uppercase text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{groupName}</h3>
                    <p className={`text-[10px] font-bold mt-1 uppercase ${isReq ? 'text-red-500' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {isReq ? `* ${t.req}` : t.opt} {maxSel > 1 ? `(${t.upTo} ${maxSel})` : `(${t.select1})`}
                    </p>
                  </div>
                  {isReq && selectedCount === 0 && <span className="text-[10px] font-black text-red-500 bg-red-100 px-2 py-1 rounded-lg uppercase">!</span>}
                </div>
                
                <div className="space-y-2">
                  {group.options.map((opt, idx) => {
                    const optName = lang === "tr" && opt.name_tr ? opt.name_tr : (lang === "en" && opt.name_en ? opt.name_en : opt.name);
                    const isSelected = (addonSelections[group.id] || []).includes(idx);
                    return (
                      <div 
                        key={idx} 
                        onClick={() => toggleAddon(group.id, idx, maxSel)}
                        className={`flex justify-between items-center p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.98] ${isSelected ? 'border-blue-500 bg-blue-50/10' : isDark ? 'border-gray-700 bg-gray-800/50 hover:border-gray-600' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                        style={isSelected ? { borderColor: themeColor, backgroundColor: isDark ? `${themeColor}20` : `${themeColor}10` } : {}}
                      >
                        <span className={`text-sm font-black uppercase ${isSelected ? '' : isDark ? 'text-gray-300' : 'text-gray-700'}`} style={isSelected ? { color: themeColor } : {}}>
                          {optName}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-black ${isSelected ? '' : isDark ? 'text-gray-400' : 'text-gray-500'}`} style={isSelected ? { color: themeColor } : {}}>
                            {opt.price > 0 ? `+${opt.price.toFixed(2)}€` : t.free}
                          </span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-blue-500 bg-blue-500' : isDark ? 'border-gray-600' : 'border-gray-300'}`} style={isSelected ? { borderColor: themeColor, backgroundColor: themeColor } : {}}>
                            {isSelected && <span className="text-white text-[10px]">✓</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {canOrder && (
            <div className="mt-8">
              <h3 className={`font-black uppercase text-sm mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{t.note}</h3>
              <textarea
                className={`w-full border-2 p-4 rounded-2xl text-sm font-bold focus:outline-none transition-colors resize-none ${isDark ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'}`}
                style={{ focusRingColor: themeColor }}
                rows="2"
                placeholder={t.itemNotePlaceholder}
                value={currentProductNote}
                onChange={(e) => setCurrentProductNote(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Footer (Ποσότητα & Προσθήκη) εμφανίζεται μόνο αν canOrder είναι true */}
        {canOrder && (
          <div className={`absolute bottom-0 left-0 right-0 p-4 border-t shadow-[0_-10px_20px_rgba(0,0,0,0.05)] bg-opacity-95 backdrop-blur-md ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <div className="flex gap-4">
              <div className={`flex items-center justify-between px-2 rounded-2xl border-2 w-32 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className={`w-10 h-10 text-xl font-black ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>−</button>
                <span className={`text-lg font-black ${isDark ? 'text-white' : 'text-black'}`}>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 text-xl font-black" style={{ color: themeColor }}>+</button>
              </div>
              
              <button 
                onClick={confirmAddons}
                className="flex-1 text-white rounded-2xl font-black uppercase text-sm shadow-xl flex items-center justify-between px-6 transition-transform active:scale-95"
                style={{ backgroundColor: themeColor }}
              >
                <span>{editingCartId ? t.save : t.add}</span>
                <span>{currentTotal.toFixed(2)}€</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

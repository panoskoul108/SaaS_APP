import React from "react";

const normalizeStr = (str) => 
  str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() : "";

export default function PosProductModal({
  posActiveProduct,
  setPosActiveProduct,
  editingCartId,
  setEditingCartId,
  posAddonSelections,
  togglePosAddon,
  posQuantity,
  setPosQuantity,
  posCurrentNote,
  setPosCurrentNote,
  confirmPosAddons,
}) {
  if (!posActiveProduct) return null;

  // --- ΑΠΟΛΥΤΑ ΕΞΥΠΝΟ ΣΥΣΤΗΜΑ ΓΙΑ POS ---
  let isSketosSelected = false;
  (posActiveProduct.addons || []).forEach((group) => {
    const selections = posAddonSelections[group.id] || [];
    selections.forEach((selIndex) => {
      const optName = normalizeStr(group.options[selIndex]?.name);
      if (optName.includes("ΣΚΕΤ") || optName.includes("ΧΩΡΙΣ")) {
        isSketosSelected = true;
      }
    });
  });

  const visibleAddons = (posActiveProduct.addons || []).filter(group => {
    const groupNameUpper = normalizeStr(group.name);
    if (isSketosSelected && (groupNameUpper.includes("ΖΑΧΑΡ") || groupNameUpper.includes("ΓΛΥΚΑΝΤΙΚ"))) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] flex items-center justify-center p-4 animate-fade-in" onClick={() => { setPosActiveProduct(null); setEditingCartId(null); }}>
      <div className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4 border-b pb-4">
          <div className="flex flex-col pr-4">
            <h2 className="font-black text-xl uppercase italic text-gray-900">{posActiveProduct.name}</h2>
            {editingCartId && <span className="text-[10px] text-blue-500 mt-1 font-black uppercase">ΕΠΕΞΕΡΓΑΣΙΑ</span>}
          </div>
          <button onClick={() => { setPosActiveProduct(null); setEditingCartId(null); }} className="w-10 h-10 bg-gray-100 rounded-full font-black text-gray-600 hover:bg-gray-200 shrink-0 transition-colors">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-4 pr-2 no-scrollbar">
          {visibleAddons.map((group) => (
            <div key={group.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-black uppercase text-sm text-gray-800">{group.name}</h3>
                <span className="text-[9px] font-bold text-gray-500 uppercase">{group.isRequired ? "ΥΠΟΧΡΕΩΤΙΚΟ" : "ΠΡΟΑΙΡΕΤΙΚΟ"} ({group.maxSelections > 1 ? `ΕΩΣ ${group.maxSelections}` : "ΕΠΙΛΕΞΤΕ 1"})</span>
              </div>
              <div className="space-y-2">
                {group.options.map((opt, i) => {
                  const isSelected = (posAddonSelections[group.id] || []).includes(i);
                  return (
                    <div key={i} onClick={() => togglePosAddon(group.id, i, group.maxSelections)} className={`flex justify-between items-center p-4 rounded-xl cursor-pointer border-2 transition-all ${isSelected ? "bg-blue-50 border-blue-500" : "bg-white border-gray-200"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                        <span className={`font-bold text-xs uppercase ${isSelected ? "text-gray-900" : "text-gray-600"}`}>{opt.name}</span>
                      </div>
                      <span className={`font-black text-xs ${opt.price > 0 ? "text-blue-600" : "text-gray-400"}`}>{opt.price > 0 ? `+${opt.price.toFixed(2)}€` : "ΔΩΡΕΑΝ"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <span className="font-black uppercase text-sm text-gray-800">ΠΟΣΟΤΗΤΑ</span>
            <div className="flex items-center gap-4 bg-white px-2 py-1 rounded-xl shadow-sm border border-gray-200">
              <button onClick={() => setPosQuantity(Math.max(1, posQuantity - 1))} className="w-10 h-10 font-bold text-2xl text-gray-500 flex items-center justify-center">−</button>
              <span className="font-black text-lg w-6 text-center">{posQuantity}</span>
              <button onClick={() => setPosQuantity(posQuantity + 1)} className="w-10 h-10 font-bold text-2xl text-blue-600 flex items-center justify-center">+</button>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <span className="font-black text-gray-800 uppercase text-xs mb-2 block">ΣΗΜΕΙΩΣΗ ΠΡΟΪΟΝΤΟΣ</span>
            <textarea rows="2" placeholder="Π.χ. Χωρίς ζάχαρη..." value={posCurrentNote} onChange={(e) => setPosCurrentNote(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 font-bold resize-none"></textarea>
          </div>
        </div>

        <button onClick={confirmPosAddons} className="w-full mt-6 bg-blue-600 text-white py-5 rounded-xl font-black uppercase text-sm shadow-lg hover:bg-blue-700 active:scale-95 transition-transform flex justify-between px-6">
          <span>{editingCartId ? "ΑΠΟΘΗΚΕΥΣΗ" : "ΠΡΟΣΘΗΚΗ"}</span>
          <span>{!editingCartId && posQuantity > 1 ? `x${posQuantity}` : ""}</span>
        </button>
      </div>
    </div>
  );
}

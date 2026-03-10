import React from "react";

export default function CartModal({
  isCartOpen,
  setIsCartOpen,
  cart,
  updateCartItemQuantity,
  handleEditCartItem,
  removeFromCart,
  getItemDisplayName,
  themeColor,
  t,
  lang,
  products,
  handleProductClick,
  getSmartImage,
  generalNote,
  setGeneralNote,
  paymentMethod,
  setPaymentMethod,
  isAcceptingOrders,
  tableNum,
  handleSendOrderClick,
  isLocating,          
  openPrivacy,          
  currentCartTotal,
  theme,
}) {
  if (!isCartOpen) return null;
  const isDark = theme === "dark";

  // ΛΟΓΙΚΗ ΕΞΥΠΝΟΥ UPSELLING: Βρίσκει τα 4 top προτεινόμενα που ΔΕΝ έχει ο πελάτης στο καλάθι!
  const cartItemIds = cart.map(item => item.id);
  const recommendations = (products || [])
    .filter(p => p.is_available && p.is_recommended && !cartItemIds.includes(p.id))
    .slice(0, 4);

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col animate-slide-up ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* HEADER */}
      <div className={`p-4 flex justify-between items-center shadow-sm border-b shrink-0 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
        <h2 className={`font-black uppercase text-lg ${isDark ? "text-white" : "text-gray-800"}`}>
          {t.yourOrder}
        </h2>
        <button
          onClick={() => setIsCartOpen(false)}
          className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-colors ${
            isDark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          ✕
        </button>
      </div>

      {/* ΚΥΡΙΩΣ ΣΩΜΑ - ΕΔΩ ΡΟΛΑΡΟΥΝ ΟΛΑ (Προϊόντα, Upsell, Σημειώσεις, Πληρωμή) */}
      <div className={`flex-1 overflow-y-auto p-4 no-scrollbar pb-32 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
        
        {/* ΛΙΣΤΑ ΠΡΟΪΟΝΤΩΝ */}
        <div className="space-y-4 mb-8">
          {cart.map((item) => (
            <div
              key={item.cartId}
              className={`p-4 rounded-3xl shadow-sm border flex flex-col gap-2 relative overflow-hidden ${
                isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-3">
                  <h4 className={`font-black uppercase text-sm leading-tight ${isDark ? "text-white" : "text-gray-800"}`}>
                    {getItemDisplayName(item)}
                  </h4>
                  {item.note && (
                    <p
                      className={`text-[10px] font-bold italic mt-1 p-2 rounded-xl inline-block border ${
                        isDark ? "bg-gray-900 border-gray-700 text-gray-400" : "bg-gray-50 border-gray-100 text-gray-500"
                      }`}
                    >
                      📝 {item.note}
                    </p>
                  )}
                </div>
                <span className="font-black text-base" style={{ color: themeColor }}>
                  {(item.price * (item.quantity || 1)).toFixed(2)}€
                </span>
              </div>

              <div className={`flex justify-between items-center mt-2 pt-3 border-t ${isDark ? "border-gray-700" : "border-gray-50"}`}>
                <div className={`flex items-center rounded-xl p-1 shadow-inner ${isDark ? "bg-gray-900" : "bg-gray-100"}`}>
                  <button
                    onClick={() => updateCartItemQuantity(item.cartId, -1)}
                    className={`w-8 h-8 flex items-center justify-center font-black active:scale-90 transition-transform ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    −
                  </button>
                  <span className={`font-black text-sm w-6 text-center ${isDark ? "text-white" : "text-gray-800"}`}>
                    {item.quantity || 1}
                  </span>
                  <button
                    onClick={() => updateCartItemQuantity(item.cartId, 1)}
                    className="w-8 h-8 flex items-center justify-center font-black text-blue-500 active:scale-90 transition-transform"
                  >
                    +
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditCartItem(item)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-transform border ${
                      isDark ? "bg-blue-900/30 text-blue-400 border-blue-900/50" : "bg-blue-50 text-blue-500 border-blue-100"
                    }`}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => removeFromCart(item.cartId)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-transform border ${
                      isDark ? "bg-red-900/30 text-red-400 border-red-900/50" : "bg-red-50 text-red-500 border-red-100"
                    }`}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ΕΞΥΠΝΕΣ ΠΡΟΤΑΣΕΙΣ (UPSELLING) */}
        {recommendations.length > 0 && (
          <div className="mb-8">
            <p className="font-black text-[10px] uppercase text-indigo-500 mb-3 tracking-widest px-1">
              {t.freqBought}
            </p>
            <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar px-1">
              {recommendations.map(prod => (
                <div
                  key={prod.id}
                  onClick={() => handleProductClick(prod)}
                  className={`min-w-[150px] max-w-[150px] flex flex-col p-2.5 rounded-2xl border cursor-pointer transition-transform active:scale-95 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-sm"}`}
                >
                  <div className="w-full h-20 rounded-xl bg-cover bg-center mb-2" style={{ backgroundImage: `url(${getSmartImage(prod)})` }}></div>
                  <div className="flex flex-col flex-1 justify-between">
                    <span className={`text-[10px] font-black uppercase line-clamp-2 leading-tight ${isDark ? "text-white" : "text-gray-800"}`}>
                      {lang === 'en' && prod.name_en ? prod.name_en : prod.name}
                    </span>
                    <span className="text-xs font-black mt-1" style={{ color: themeColor }}>+{prod.price.toFixed(2)}€</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ΓΕΝΙΚΗ ΣΗΜΕΙΩΣΗ (Μπήκε στο scroll) */}
        <div className="mb-6">
          <p className="font-black text-[10px] uppercase text-gray-400 mb-2 tracking-widest px-1">{t.genNoteTitle}</p>
          <textarea
            rows="2"
            placeholder={t.note}
            value={generalNote}
            onChange={(e) => setGeneralNote(e.target.value)}
            className={`w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none font-bold resize-none shadow-sm ${
              isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"
            }`}
          ></textarea>
        </div>

        {/* ΤΡΟΠΟΣ ΠΛΗΡΩΜΗΣ (Μπήκε στο scroll) */}
        <div className={`flex flex-col mb-4 p-3 rounded-2xl border shadow-sm ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <span className="font-black text-[9px] uppercase text-gray-500 tracking-widest mb-2 text-center">
            {t.payMethod} <span className="text-red-500">*</span>
          </span>
          <div className={`flex p-1.5 rounded-xl shadow-inner ${isDark ? "bg-gray-900" : "bg-gray-100"}`}>
            <button
              onClick={() => setPaymentMethod("ΜΕΤΡΗΤΑ")}
              className={`flex-1 py-3 rounded-lg font-black text-xs uppercase transition-all flex items-center justify-center gap-2 ${
                paymentMethod === "ΜΕΤΡΗΤΑ"
                  ? isDark
                    ? "bg-gray-700 text-white shadow-md scale-[1.02]"
                    : "bg-white shadow-md text-gray-900 scale-[1.02]"
                  : "text-gray-400 hover:text-gray-500"
              }`}
              style={paymentMethod === "ΜΕΤΡΗΤΑ" ? { color: themeColor } : {}}
            >
              💵 {t.cash}
            </button>
            <button
              onClick={() => setPaymentMethod("ΚΑΡΤΑ")}
              className={`flex-1 py-3 rounded-lg font-black text-xs uppercase transition-all flex items-center justify-center gap-2 ${
                paymentMethod === "ΚΑΡΤΑ"
                  ? isDark
                    ? "bg-gray-700 text-white shadow-md scale-[1.02]"
                    : "bg-white shadow-md text-gray-900 scale-[1.02]"
                  : "text-gray-400 hover:text-gray-500"
              }`}
              style={paymentMethod === "ΚΑΡΤΑ" ? { color: themeColor } : {}}
            >
              💳 {t.card}
            </button>
          </div>
        </div>

      </div>

      {/* STICKY FOOTER (ΜΟΝΟ ΤΟ ΚΟΥΜΠΙ ΚΑΙ Η ΠΟΛΙΤΙΚΗ ΑΠΟΡΡΗΤΟΥ) */}
      <div className={`p-4 shrink-0 border-t shadow-[0_-10px_20px_rgba(0,0,0,0.05)] ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
        {!isAcceptingOrders ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl font-black text-center text-xs uppercase border-2 border-red-200 mb-2">
            ⚠️ {t.pausedCartMsg}
          </div>
        ) : (
          <button
            onClick={handleSendOrderClick}
            disabled={!paymentMethod || !tableNum || isLocating}
            className={`w-full py-5 rounded-2xl font-black flex justify-between px-6 items-center transition-all active:scale-95 mb-1 ${
              paymentMethod && tableNum && !isLocating
                ? "text-white shadow-xl hover:opacity-90"
                : isDark
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            style={
              paymentMethod && tableNum && !isLocating ? { backgroundColor: themeColor } : {}
            }
          >
            <span className="uppercase text-sm tracking-widest">
              {!tableNum ? t.requiredTable : isLocating ? t.locFinding : (!paymentMethod ? t.selPay : t.send)}
            </span>
            <span className="text-xl">{currentCartTotal.toFixed(2)}€</span>
          </button>
        )}

        <div className="text-center mt-2">
          <button 
            onClick={openPrivacy} 
            className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${
              isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {t.privacyLink}
          </button>
        </div>
      </div>
    </div>
  );
}

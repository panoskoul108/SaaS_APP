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
  t, // Εδώ δέχεται το λεξικό από το Menu.js (Αυτόματη Μετάφραση!)
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

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col animate-slide-up ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className={`p-4 flex justify-between items-center shadow-sm border-b ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
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

      <div className={`flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
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

      <div className={`p-6 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
        <div className="mb-4">
          <p className="font-black text-[10px] uppercase text-gray-400 mb-2 tracking-widest">{t.genNoteTitle}</p>
          <textarea
            rows="1"
            placeholder={t.note}
            value={generalNote}
            onChange={(e) => setGeneralNote(e.target.value)}
            className={`w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none font-bold resize-none ${
              isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-200/80 text-gray-900"
            }`}
          ></textarea>
        </div>

        <div className={`flex flex-col mb-4 p-2.5 rounded-2xl border ${isDark ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
          <span className="font-black text-[9px] uppercase text-gray-500 tracking-widest mb-1.5 text-center">
            {t.payMethod} <span className="text-red-500">*</span>
          </span>
          <div className={`flex p-1 rounded-xl shadow-inner ${isDark ? "bg-gray-800" : "bg-gray-200/50"}`}>
            <button
              onClick={() => setPaymentMethod("ΜΕΤΡΗΤΑ")}
              className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase transition-all flex items-center justify-center gap-1 ${
                paymentMethod === "ΜΕΤΡΗΤΑ"
                  ? isDark
                    ? "bg-gray-700 text-white shadow-sm scale-105"
                    : "bg-white shadow-sm text-gray-900 scale-105"
                  : "text-gray-400 hover:text-gray-500"
              }`}
              style={paymentMethod === "ΜΕΤΡΗΤΑ" ? { color: themeColor } : {}}
            >
              💵 {t.cash}
            </button>
            <button
              onClick={() => setPaymentMethod("ΚΑΡΤΑ")}
              className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase transition-all flex items-center justify-center gap-1 ${
                paymentMethod === "ΚΑΡΤΑ"
                  ? isDark
                    ? "bg-gray-700 text-white shadow-sm scale-105"
                    : "bg-white shadow-sm text-gray-900 scale-105"
                  : "text-gray-400 hover:text-gray-500"
              }`}
              style={paymentMethod === "ΚΑΡΤΑ" ? { color: themeColor } : {}}
            >
              💳 {t.card}
            </button>
          </div>
        </div>

        {!isAcceptingOrders ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl font-black text-center text-xs uppercase border-2 border-red-200 mb-2">
            ⚠️ {t.pausedCartMsg}
          </div>
        ) : (
          <button
            onClick={handleSendOrderClick}
            disabled={!paymentMethod || !tableNum || isLocating}
            className={`w-full py-5 rounded-2xl font-black flex justify-between px-6 items-center transition-all active:scale-95 mb-2 ${
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

        <div className="text-center mt-1">
          <button 
            onClick={openPrivacy} 
            className={`text-[8px] font-bold uppercase tracking-widest transition-colors ${
              isDark ? "text-gray-600 hover:text-gray-400" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {t.privacyLink}
          </button>
        </div>

      </div>
    </div>
  );
}

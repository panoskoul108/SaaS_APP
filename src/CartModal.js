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
  generalNote,
  setGeneralNote,
  paymentMethod,
  setPaymentMethod,
  isAcceptingOrders,
  tableNum,
  sendOrder,
  currentCartTotal,
}) {
  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-50 z-[200] flex flex-col animate-slide-up">
      <div className="bg-white p-4 flex justify-between items-center shadow-sm border-b border-gray-100">
        <h2 className="font-black uppercase text-lg text-gray-800">
          {t.yourOrder}
        </h2>
        <button
          onClick={() => setIsCartOpen(false)}
          className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center font-black text-gray-600 hover:bg-gray-200"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-gray-50">
        {cart.map((item) => (
          <div
            key={item.cartId}
            className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-2 relative overflow-hidden"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 pr-3">
                <h4 className="font-black uppercase text-gray-800 text-sm leading-tight">
                  {getItemDisplayName(item)}
                </h4>
                {item.note && (
                  <p className="text-[10px] text-gray-500 font-bold italic mt-1 bg-gray-50 p-2 rounded-xl inline-block border border-gray-100">
                    📝 {item.note}
                  </p>
                )}
              </div>
              <span
                className="font-black text-base"
                style={{ color: themeColor }}
              >
                {(item.price * (item.quantity || 1)).toFixed(2)}€
              </span>
            </div>

            <div className="flex justify-between items-center mt-2 pt-3 border-t border-gray-50">
              <div className="flex items-center bg-gray-100 rounded-xl p-1 shadow-inner">
                <button
                  onClick={() => updateCartItemQuantity(item.cartId, -1)}
                  className="w-8 h-8 flex items-center justify-center font-black text-gray-600 active:scale-90 transition-transform"
                >
                  −
                </button>
                <span className="font-black text-sm w-6 text-center">
                  {item.quantity || 1}
                </span>
                <button
                  onClick={() => updateCartItemQuantity(item.cartId, 1)}
                  className="w-8 h-8 flex items-center justify-center font-black text-blue-600 active:scale-90 transition-transform"
                >
                  +
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditCartItem(item)}
                  className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm active:scale-95 transition-transform border border-blue-100"
                >
                  ✏️
                </button>
                <button
                  onClick={() => removeFromCart(item.cartId)}
                  className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shadow-sm active:scale-95 transition-transform border border-red-100"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border-t border-gray-100">
        <div className="mb-6">
          <p className="font-black text-[10px] uppercase text-gray-400 mb-2 tracking-widest">
            {t.genNoteTitle}
          </p>
          <textarea
            rows="1"
            placeholder={t.note}
            value={generalNote}
            onChange={(e) => setGeneralNote(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200/80 rounded-2xl px-4 py-3 text-sm focus:outline-none font-bold resize-none"
          ></textarea>
        </div>

        <div className="flex flex-col mb-6 bg-gray-50 p-3 rounded-2xl border border-gray-100">
          <span className="font-black text-[10px] uppercase text-gray-500 tracking-widest mb-2 text-center">
            {t.payMethod} <span className="text-red-500">*</span>
          </span>
          <div className="flex bg-gray-200/50 p-1 rounded-xl shadow-inner">
            <button
              onClick={() => setPaymentMethod("ΜΕΤΡΗΤΑ")}
              className={`flex-1 py-3 rounded-lg font-black text-[10px] uppercase transition-all flex items-center justify-center gap-1 ${
                paymentMethod === "ΜΕΤΡΗΤΑ"
                  ? "bg-white shadow-sm text-gray-900 scale-105"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              style={paymentMethod === "ΜΕΤΡΗΤΑ" ? { color: themeColor } : {}}
            >
              💵 {t.cash}
            </button>
            <button
              onClick={() => setPaymentMethod("ΚΑΡΤΑ")}
              className={`flex-1 py-3 rounded-lg font-black text-[10px] uppercase transition-all flex items-center justify-center gap-1 ${
                paymentMethod === "ΚΑΡΤΑ"
                  ? "bg-white shadow-sm text-gray-900 scale-105"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              style={paymentMethod === "ΚΑΡΤΑ" ? { color: themeColor } : {}}
            >
              💳 {t.card}
            </button>
          </div>
        </div>

        {!isAcceptingOrders ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl font-black text-center text-xs uppercase border-2 border-red-200">
            ⚠️ {t.pausedCartMsg}
          </div>
        ) : (
          <button
            onClick={sendOrder}
            disabled={!paymentMethod || !tableNum}
            className={`w-full py-5 rounded-2xl font-black flex justify-between px-6 items-center transition-all active:scale-95 ${
              paymentMethod && tableNum
                ? "text-white shadow-xl hover:opacity-90"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            style={
              paymentMethod && tableNum ? { backgroundColor: themeColor } : {}
            }
          >
            <span className="uppercase text-sm tracking-widest">
              {!tableNum ? t.requiredTable : paymentMethod ? t.send : t.selPay}
            </span>
            <span className="text-xl">{currentCartTotal.toFixed(2)}€</span>
          </button>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";

export default function OrderList({
  orders,
  isKitchen,
  userRole,
  updateStatus,
  deleteOrders,
  setViewingOrder,
  setActivePrintOrder,
  setIsPrinting,
  toggleReceipt, // ΝΕΟ PROP: Για να αποθηκεύει αν κόπηκε απόδειξη
}) {
  const statuses = ["pending", "preparing", "ready"];

  // --- LIVE TIMER ---
  const LiveTimer = ({ createdAt }) => {
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
      const calculateTime = () => {
        const start = new Date(createdAt).getTime();
        const now = new Date().getTime();
        setElapsedTime(Math.floor((now - start) / 1000));
      };

      calculateTime();
      const interval = setInterval(calculateTime, 1000);
      return () => clearInterval(interval);
    }, [createdAt]);

    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    let timerColorClass = "text-gray-400 bg-gray-100";
    if (isKitchen) timerColorClass = "text-gray-400 bg-gray-800";

    if (minutes >= 15) {
      timerColorClass = "text-red-600 bg-red-100 animate-pulse font-black border border-red-300"; 
    } else if (minutes >= 8) {
      timerColorClass = "text-orange-600 bg-orange-100 font-bold border border-orange-200"; 
    }

    return (
      <span className={`text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 ${timerColorClass}`}>
        ⏱️ {formattedTime}
      </span>
    );
  };

  const OrderCard = ({ order }) => {
    const displayItems = isKitchen
      ? order.items?.filter((it) => it.station === "kitchen") || []
      : order.items;
    
    if (isKitchen && displayItems.length === 0) return null;

    const currentStatus = isKitchen
      ? order.kitchen_status || "pending"
      : order.status || "pending";
    const hasKitchenItem = order.items?.some((it) => it.station === "kitchen");
    const kitchenIsReady = (order.kitchen_status || "pending") === "ready";

    return (
      <div
        onClick={() => setViewingOrder(order)}
        className={`${
          isKitchen
            ? "bg-gray-800 border-gray-700 text-white"
            : "bg-white border-gray-100 text-gray-800"
        } rounded-2xl p-4 mb-4 shadow-sm border cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden`}
      >
        {order.is_loyalty_reward && (
          <div className="mb-3 p-3 rounded-xl bg-purple-100 border-2 border-purple-400 text-purple-900 text-center shadow-inner">
            <span className="font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2">
              🎁 ΠΕΛΑΤΗΣ LOYALTY
            </span>
          </div>
        )}

        <div className={`flex justify-between items-start mb-3 border-b pb-2 ${isKitchen ? "border-gray-700" : ""}`}>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-black text-xl ${isKitchen ? "text-orange-400" : ""}`}>
                #{order.table_number || "---"}
              </span>
              {currentStatus !== "ready" && currentStatus !== "completed" && (
                <LiveTimer createdAt={order.created_at} />
              )}
            </div>
            <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isKitchen ? "text-gray-400" : "text-blue-500"}`}>
              {order.payment_method}
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <span className="text-[10px] text-gray-400 font-bold">
              {new Date(order.created_at).toLocaleTimeString("el-GR", { hour: '2-digit', minute: '2-digit' })}
            </span>
            
            {/* --- ΔΙΑΚΟΠΤΗΣ ΤΑΜΕΙΑΚΗΣ (ΚΡΥΦΟΣ ΑΠΟ ΤΗΝ ΚΟΥΖΙΝΑ) --- */}
            {!isKitchen && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (toggleReceipt) toggleReceipt(order.id, !order.receipt_printed);
                }}
                className={`text-[9px] px-2 py-1.5 rounded-lg font-black uppercase flex items-center gap-1 transition-colors border shadow-sm ${
                  order.receipt_printed 
                    ? "bg-green-100 text-green-700 border-green-300" 
                    : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {order.receipt_printed ? "✅ ΤΑΜΕΙΑΚΗ" : "🧾 ΑΠΟΔΕΙΞΗ;"}
              </button>
            )}
          </div>
        </div>

        {order.general_note && (
          <div className={`mb-3 p-2 rounded-xl border ${isKitchen ? "bg-orange-900/30 border-orange-800 text-orange-200" : "bg-blue-50 border-blue-100 text-blue-800"}`}>
            <span className="font-black text-[9px] uppercase tracking-widest">ΣΗΜΕΙΩΣΗ:</span>
            <p className="text-xs font-bold italic">{order.general_note}</p>
          </div>
        )}

        <ul className="mb-4 space-y-3">
          {displayItems.map((it, i) => (
            <li key={i} className="flex flex-col">
              <span className={`text-sm font-bold uppercase italic ${isKitchen ? "text-white text-base" : ""}`}>
                {it.quantity > 1 ? (
                  <span className={isKitchen ? "text-orange-400 mr-1 text-lg font-black" : "text-blue-600 mr-1 text-lg font-black"}>{it.quantity}x</span>
                ) : ("• ")}
                {it.name}
              </span>
              {it.note && (
                <span className={`text-xs px-2 py-1.5 rounded-lg mt-1 font-black uppercase inline-block border ${isKitchen ? "bg-yellow-400 text-black border-yellow-500 shadow-sm" : "bg-yellow-100 text-yellow-800 border-yellow-200"}`}>
                  📝 {it.note}
                </span>
              )}
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
          {currentStatus === "pending" && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setActivePrintOrder(order);
                  setIsPrinting(true);
                  setTimeout(() => {
                    window.print();
                    setIsPrinting(false);
                    updateStatus(order.id, "preparing", isKitchen); 
                  }, 500);
                }}
                className={`flex-[2] py-3 rounded-xl font-black text-[10px] uppercase shadow-lg transition-transform active:scale-95 ${isKitchen ? "bg-gray-600 text-white hover:bg-gray-500" : "bg-blue-600 text-white hover:bg-blue-500"}`}
              >
                🖨️ ΕΚΤΥΠΩΣΗ
              </button>
              
              <button
                onClick={() => updateStatus(order.id, "preparing", isKitchen)}
                className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-transform active:scale-95 border ${isKitchen ? "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"}`}
              >
                📝 ΧΩΡΙΣ ΧΑΡΤΙ
              </button>
            </div>
          )}
          {currentStatus === "preparing" && (
            <button onClick={() => updateStatus(order.id, "ready", isKitchen)} className={`w-full text-white py-4 rounded-xl font-black text-xs uppercase shadow-lg transition-transform active:scale-95 ${isKitchen ? "bg-green-600 hover:bg-green-500" : "bg-orange-500 hover:bg-orange-400"}`}>
              ✅ ΕΤΟΙΜΗ
            </button>
          )}
          {currentStatus === "ready" && !isKitchen && (hasKitchenItem && !kitchenIsReady ? (
              <button disabled className="w-full bg-orange-50 text-orange-600 py-4 rounded-xl font-black text-[10px] uppercase border-2 border-orange-200 opacity-80">
                ⏳ ΑΝΑΜΟΝΗ ΚΟΥΖΙΝΑΣ
              </button>
            ) : (
              <button onClick={() => updateStatus(order.id, "completed", false)} className="w-full bg-green-600 text-white py-4 rounded-xl font-black text-xs uppercase shadow-lg transition-transform active:scale-95 hover:bg-green-500">
                🏁 ΟΛΟΚΛΗΡΩΣΗ
              </button>
            ))}
          {userRole === "admin" && (
            <button onClick={() => deleteOrders([order.id])} className="text-[9px] font-black text-gray-400 mt-3 self-center hover:text-red-500 transition-colors">
              🗑️ Διαγραφή Παραγγελίας
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {statuses.map((s, idx) => {
        const columnOrders = orders.filter((o) => {
          if (o.status === "completed") return false;
          const stat = isKitchen ? o.kitchen_status || "pending" : o.status || "pending";
          if (isKitchen && !o.items?.some((it) => it.station === "kitchen")) return false;
          return stat === s;
        });

        const labelMap = { pending: "ΝΕΕΣ ΠΑΡΑΓΓΕΛΙΕΣ", preparing: "ΣΕ ΠΡΟΕΤΟΙΜΑΣΙΑ", ready: "ΕΤΟΙΜΕΣ / ΠΑΡΑΔΟΣΗ" };

        return (
          <div key={s} className={`rounded-[2rem] p-5 min-h-[80vh] border ${isKitchen ? "bg-gray-800/40 border-gray-700" : s === "pending" ? "bg-blue-50/40 border-blue-100" : s === "preparing" ? "bg-orange-50/40 border-orange-100" : "bg-green-50/40 border-green-100"}`}>
            <div className="flex justify-between items-center mb-5 px-2">
              <h2 className={`font-black text-[12px] uppercase italic tracking-widest ${isKitchen ? "text-gray-400" : s === "pending" ? "text-blue-700" : s === "preparing" ? "text-orange-700" : "text-green-700"}`}>
                {labelMap[s]}
              </h2>
              <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${isKitchen ? "bg-gray-700 text-white" : "bg-white border text-gray-600"}`}>
                {columnOrders.length}
              </span>
            </div>
            {columnOrders.map((o) => <OrderCard key={o.id} order={o} />)}
            {columnOrders.length === 0 && <div className={`text-center mt-10 text-[10px] font-bold uppercase tracking-widest ${isKitchen ? "text-gray-600" : "text-gray-400"}`}>Καμια παραγγελια</div>}
          </div>
        );
      })}
    </div>
  );
}

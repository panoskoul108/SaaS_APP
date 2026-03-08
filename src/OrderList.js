import React from "react";

export default function OrderList({
  orders,
  isKitchen,
  userRole,
  updateStatus,
  deleteOrders,
  setViewingOrder,
  setActivePrintOrder,
  setIsPrinting,
}) {
  const statuses = ["pending", "preparing", "ready"];

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

        <div
          className={`flex justify-between items-start mb-3 border-b pb-2 ${
            isKitchen ? "border-gray-700" : ""
          }`}
        >
          <div>
            <span
              className={`font-black text-lg ${
                isKitchen ? "text-orange-400" : ""
              }`}
            >
              #{order.table_number || "---"}
            </span>
            <p
              className={`text-[9px] font-black uppercase tracking-widest ${
                isKitchen ? "text-gray-400" : "text-blue-500"
              }`}
            >
              {order.payment_method}
            </p>
          </div>
          <span className="text-[10px] text-gray-400 font-bold">
            {new Date(order.created_at).toLocaleTimeString("el-GR")}
          </span>
        </div>

        {order.general_note && (
          <div
            className={`mb-3 p-2 rounded-xl border ${
              isKitchen
                ? "bg-orange-900/30 border-orange-800 text-orange-200"
                : "bg-blue-50 border-blue-100 text-blue-800"
            }`}
          >
            <p className="text-xs font-bold italic">{order.general_note}</p>
          </div>
        )}

        <ul className="mb-4 space-y-2">
          {displayItems.map((it, i) => (
            <li key={i} className="flex flex-col">
              <span
                className={`text-sm font-bold uppercase italic ${
                  isKitchen ? "text-white text-base" : ""
                }`}
              >
                {it.quantity > 1 ? (
                  <span
                    className={
                      isKitchen ? "text-orange-400 mr-1" : "text-blue-500 mr-1"
                    }
                  >
                    {it.quantity}x
                  </span>
                ) : (
                  "• "
                )}
                {it.name}
              </span>
              {it.note && (
                <span
                  className={`text-[10px] px-2 py-1 rounded-lg mt-1 font-black italic inline-block ${
                    isKitchen
                      ? "bg-gray-700 text-yellow-400"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  📝 {it.note}
                </span>
              )}
            </li>
          ))}
        </ul>

        <div
          className="flex flex-col gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {currentStatus === "pending" && (
            <div className="flex gap-2">
              {!isKitchen && (
                <button
                  onClick={() => {
                    setActivePrintOrder(order);
                    setIsPrinting(true);
                    setTimeout(() => {
                      window.print();
                      setIsPrinting(false);
                      updateStatus(order.id, "preparing", false);
                    }, 500);
                  }}
                  className="flex-[2] bg-blue-600 text-white py-3 rounded-xl font-black text-[10px] uppercase shadow-lg"
                >
                  ΕΚΤΥΠΩΣΗ
                </button>
              )}
              <button
                onClick={() => updateStatus(order.id, "preparing", isKitchen)}
                className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase ${
                  isKitchen
                    ? "bg-orange-600 text-white shadow-lg"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {isKitchen ? "ΕΝΑΡΞΗ" : "ΧΩΡΙΣ ΧΑΡΤΙ"}
              </button>
            </div>
          )}
          {currentStatus === "preparing" && (
            <button
              onClick={() => updateStatus(order.id, "ready", isKitchen)}
              className={`w-full text-white py-4 rounded-xl font-black text-[10px] uppercase ${
                isKitchen ? "bg-green-600" : "bg-orange-500"
              }`}
            >
              ΕΤΟΙΜΗ
            </button>
          )}
          {currentStatus === "ready" &&
            !isKitchen &&
            (hasKitchenItem && !kitchenIsReady ? (
              <button
                disabled
                className="w-full bg-orange-50 text-orange-600 py-4 rounded-xl font-black text-[10px] uppercase border-2 border-orange-200 opacity-80"
              >
                ⏳ ΑΝΑΜΟΝΗ ΚΟΥΖΙΝΑΣ
              </button>
            ) : (
              <button
                onClick={() => updateStatus(order.id, "completed", false)}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-black text-[10px] uppercase shadow-lg"
              >
                ΟΛΟΚΛΗΡΩΣΗ
              </button>
            ))}
          {userRole === "admin" && (
            <button
              onClick={() => deleteOrders([order.id])}
              className="text-[9px] font-black text-gray-300 mt-2 self-center hover:text-red-500"
            >
              Διαγραφή
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
          const stat = isKitchen
            ? o.kitchen_status || "pending"
            : o.status || "pending";
          if (isKitchen && !o.items?.some((it) => it.station === "kitchen"))
            return false;
          return stat === s;
        });

        return (
          <div
            key={s}
            className={`rounded-[2rem] p-5 min-h-[80vh] border ${
              isKitchen
                ? "bg-gray-800/50 border-gray-700"
                : s === "pending"
                ? "bg-blue-50/40 border-blue-100"
                : s === "preparing"
                ? "bg-orange-50/40 border-orange-100"
                : "bg-green-50/40 border-green-100"
            }`}
          >
            <h2
              className={`font-black text-[11px] uppercase mb-4 px-2 italic ${
                isKitchen
                  ? "text-gray-400"
                  : s === "pending"
                  ? "text-blue-700"
                  : s === "preparing"
                  ? "text-orange-700"
                  : "text-green-700"
              }`}
            >
              {idx + 1}.{" "}
              {s === "pending"
                ? "ΝΕΕΣ"
                : s === "preparing"
                ? "ΕΤΟΙΜΑΖΟΝΤΑΙ"
                : "ΕΤΟΙΜΕΣ"}{" "}
              ({columnOrders.length})
            </h2>
            {columnOrders.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

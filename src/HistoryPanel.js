import React, { useState } from "react";

export default function HistoryPanel({
  isKitchen,
  userRole,
  dateRange,
  setDateRange,
  specificDate,
  setSpecificDate,
  historySearch,
  setHistorySearch,
  totalRevenue,
  totalOrdersCount,
  avgOrderValue,
  cashTotal,
  cardTotal,
  topProducts,
  peakHours,
  historyOrders,
  selectedOrderIds,
  setSelectedOrderIds,
  deleteOrders,
  downloadReportFile,
  theme,
  setViewingOrder, 
}) {
  const [paymentFilter, setPaymentFilter] = useState("ALL"); 

  const maxProductCount = topProducts.length > 0 ? topProducts[0][1] : 1;
  const maxHourCount = peakHours.length > 0 ? peakHours[0][1] : 1;
  const isDark = theme === "dark" || isKitchen;

  const displayedOrders = historyOrders.filter((o) => {
    if (paymentFilter !== "ALL" && o.payment_method !== paymentFilter) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div
        className={`p-4 rounded-[2rem] shadow-sm flex flex-col md:flex-row gap-4 justify-between border transition-colors ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
        }`}
      >
        <div
          className={`flex p-1 rounded-2xl gap-1 overflow-x-auto no-scrollbar transition-colors ${
            isDark ? "bg-gray-900" : "bg-gray-50"
          }`}
        >
          {["today", "week", "month", "all"].map((r) => (
            <button
              key={r}
              onClick={() => {
                setDateRange(r);
                setSpecificDate("");
              }}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-colors ${
                dateRange === r
                  ? isDark
                    ? "bg-gray-700 text-white shadow-md"
                    : "bg-white text-blue-600 shadow-md"
                  : isDark
                  ? "text-gray-500 hover:text-gray-300"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {r === "today"
                ? "ΣΗΜΕΡΑ"
                : r === "week"
                ? "ΕΒΔΟΜΑΔΑ"
                : r === "month"
                ? "ΜΗΝΑΣ"
                : "ΟΛΑ"}
            </button>
          ))}
          <input
            type="date"
            value={specificDate}
            onChange={(e) => {
              setSpecificDate(e.target.value);
              if (e.target.value) setDateRange("specific");
            }}
            className={`ml-2 px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all shadow-sm cursor-pointer outline-none border ${
              isDark 
                ? "bg-gray-800 text-white border-gray-700" 
                : "bg-white border-transparent"
            } ${dateRange === "specific" ? "ring-2 ring-blue-500" : ""}`}
          />
        </div>
        <input
          type="text"
          placeholder="Αναζήτηση Τραπεζιού..."
          className={`px-4 py-3 rounded-2xl text-sm font-bold shadow-inner outline-none transition-colors ${
            isDark 
              ? "bg-gray-900 text-white placeholder-gray-500 border border-gray-700 focus:border-blue-500" 
              : "bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-100"
          }`}
          value={historySearch}
          onChange={(e) => setHistorySearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className={`${
            isDark ? "bg-blue-900/40 border border-blue-800" : "bg-blue-600 border border-transparent"
          } text-white p-6 rounded-[2rem] shadow-lg flex flex-col justify-between transition-colors`}
        >
          <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-blue-300" : "opacity-80"}`}>
            Συνολικός Τζίρος
          </span>
          <span className={`text-4xl font-black italic mt-2 ${isDark ? "text-blue-100" : "text-white"}`}>
            {totalRevenue.toFixed(2)}€
          </span>
        </div>
        <div
          className={`p-6 rounded-[2rem] shadow-sm flex flex-col justify-between border transition-colors ${
            isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-100 text-gray-800"
          }`}
        >
          <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-gray-500" : "text-gray-400"}`}>
            Παραγγελίες
          </span>
          <span className="text-4xl font-black italic mt-2">
            {totalOrdersCount}
          </span>
        </div>
        <div
          className={`p-6 rounded-[2rem] shadow-sm flex flex-col justify-between border transition-colors ${
            isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-100 text-gray-800"
          }`}
        >
          <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-gray-500" : "text-gray-400"}`}>
            Μέση Αξία / Παρ.
          </span>
          <span className="text-4xl font-black italic mt-2">
            {avgOrderValue.toFixed(2)}€
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className={`p-4 rounded-[2rem] flex justify-between items-center shadow-sm border transition-colors ${
            isDark
              ? "bg-green-900/20 border-green-900/50 text-green-400"
              : "bg-green-50 border-green-200 text-green-800"
          }`}
        >
          <span className="font-black text-[10px] uppercase">💵 ΜΕΤΡΗΤΑ</span>
          <span className="font-black text-2xl">{cashTotal.toFixed(2)}€</span>
        </div>
        <div
          className={`p-4 rounded-[2rem] flex justify-between items-center shadow-sm border transition-colors ${
            isDark
              ? "bg-blue-900/20 border-blue-900/50 text-blue-400"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          <span className="font-black text-[10px] uppercase">💳 ΚΑΡΤΑ</span>
          <span className="font-black text-2xl">{cardTotal.toFixed(2)}€</span>
        </div>
        <button
          onClick={downloadReportFile}
          className={`p-4 rounded-[2rem] shadow-lg font-black uppercase text-[11px] transition-transform active:scale-95 ${
            isDark 
              ? "bg-gray-700 text-white hover:bg-gray-600 border border-gray-600" 
              : "bg-gray-900 text-white hover:bg-gray-800"
          }`}
        >
          💾 ΕΞΑΓΩΓΗ ΑΝΑΦΟΡΑΣ (Z)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className={`p-6 rounded-[2rem] shadow-sm border transition-colors ${
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
          }`}
        >
          <h3 className={`text-[11px] font-black uppercase mb-4 border-b pb-2 ${isDark ? "text-gray-500 border-gray-700" : "text-gray-400"}`}>
            Top 5 Προϊόντα
          </h3>
          <div className="space-y-4">
            {topProducts.map(([name, count]) => (
              <div key={name} className="relative">
                <div
                  className={`flex justify-between text-xs font-black uppercase italic mb-1 z-10 relative px-2 ${
                    isDark ? "text-gray-200" : "text-gray-800"
                  }`}
                >
                  <span>{name}</span>
                  <span>{count} τεμ.</span>
                </div>
                <div
                  className={`w-full h-8 rounded-xl overflow-hidden relative ${
                    isDark ? "bg-gray-900" : "bg-gray-50"
                  }`}
                >
                  <div
                    className={`h-full rounded-xl transition-all duration-1000 ${
                      isDark ? "bg-blue-900/50" : "bg-blue-100"
                    }`}
                    style={{ width: `${(count / maxProductCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div
          className={`p-6 rounded-[2rem] shadow-sm border transition-colors ${
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
          }`}
        >
          <h3 className={`text-[11px] font-black uppercase mb-4 border-b pb-2 ${isDark ? "text-gray-500 border-gray-700" : "text-gray-400"}`}>
            Ώρες Αιχμής
          </h3>
          <div className="space-y-4">
            {peakHours.map(([hour, count]) => (
              <div key={hour} className="relative">
                <div
                  className={`flex justify-between text-xs font-black uppercase italic mb-1 z-10 relative px-2 ${
                    isDark ? "text-gray-200" : "text-gray-800"
                  }`}
                >
                  <span>{hour}</span>
                  <span>{count} πάρ.</span>
                </div>
                <div
                  className={`w-full h-8 rounded-xl overflow-hidden relative ${
                    isDark ? "bg-gray-900" : "bg-gray-50"
                  }`}
                >
                  <div
                    className={`h-full rounded-xl transition-all duration-1000 ${
                      isDark ? "bg-orange-900/50" : "bg-orange-100"
                    }`}
                    style={{ width: `${(count / maxHourCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 px-2 gap-4">
          <h3
            className={`text-lg font-black italic uppercase tracking-tighter ${
              isDark ? "text-white" : "text-gray-800"
            }`}
          >
            Λίστα Παραγγελιών
          </h3>
          
          <div className="flex items-center gap-2">
            {["ALL", "ΜΕΤΡΗΤΑ", "ΚΑΡΤΑ"].map((f) => (
              <button
                key={f}
                onClick={() => setPaymentFilter(f)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors ${
                  paymentFilter === f
                    ? (isDark ? "bg-white text-black" : "bg-black text-white")
                    : (isDark ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-200 text-gray-600 hover:bg-gray-300")
                }`}
              >
                {f === "ALL" ? "ΟΛΕΣ" : f}
              </button>
            ))}
            
            {userRole === "admin" && (
              <button
                onClick={() => deleteOrders(selectedOrderIds)}
                disabled={selectedOrderIds.length === 0}
                className={`ml-4 px-4 py-2 rounded-xl font-black text-[9px] uppercase transition-all ${
                  selectedOrderIds.length > 0
                    ? "bg-red-500 text-white shadow-lg"
                    : (isDark ? "bg-gray-800 text-gray-600" : "bg-gray-100 text-gray-300")
                }`}
              >
                ΔΙΑΓΡΑΦΗ ΕΠΙΛΕΓΜΕΝΩΝ ({selectedOrderIds.length})
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayedOrders.map((o) => {
            // Υπολογισμός χρόνου προετοιμασίας (αν υπάρχει completed_at)
            let prepTimeText = "";
            if (o.completed_at && o.created_at) {
              const diffMs = new Date(o.completed_at) - new Date(o.created_at);
              const diffMins = Math.floor(diffMs / 60000);
              if (diffMins > 0) {
                prepTimeText = `⏱️ ${diffMins} λεπτά`;
              }
            }

            return (
              <div
                key={o.id}
                className={`p-4 rounded-[2rem] flex justify-between items-center transition-all border-2 ${
                  selectedOrderIds.includes(o.id)
                    ? (isDark ? "border-blue-500 bg-blue-900/30" : "border-blue-500 bg-blue-50")
                    : isDark
                    ? "border-gray-700 bg-gray-800 shadow-sm hover:border-gray-600"
                    : "border-gray-50 bg-white shadow-sm hover:border-gray-200"
                }`}
              >
                <div 
                  className="flex-1 cursor-pointer flex justify-between items-center pr-4"
                  onClick={() => setViewingOrder(o)}
                >
                  <div>
                    <span
                      className={`font-black italic text-base ${
                        isDark ? "text-blue-400" : "text-blue-600"
                      }`}
                    >
                      #{o.table_number}
                    </span>
                    <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">
                      {new Date(o.created_at).toLocaleTimeString("el-GR")} • {o.payment_method}
                    </p>
                    {/* ΝΕΟ: Εμφάνιση του χρόνου προετοιμασίας */}
                    {prepTimeText && (
                      <p className={`text-[9px] font-black uppercase mt-1 ${isDark ? "text-orange-400" : "text-orange-500"}`}>
                        {prepTimeText}
                      </p>
                    )}
                  </div>
                  <span
                    className={`font-black text-lg tracking-tighter ${
                      isDark ? "text-gray-100" : "text-gray-800"
                    }`}
                  >
                    {(isKitchen
                      ? o.items
                          ?.filter((it) => it.station === "kitchen")
                          .reduce((s, it) => s + it.price * (it.quantity || 1), 0)
                      : o.total_price
                    )?.toFixed(2)}
                    €
                  </span>
                </div>

                {userRole === "admin" && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrderIds((prev) =>
                        prev.includes(o.id)
                          ? prev.filter((i) => i !== o.id)
                          : [...prev, o.id]
                      );
                    }}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${
                      selectedOrderIds.includes(o.id) 
                        ? "bg-blue-500 border-blue-500 text-white" 
                        : (isDark ? "border-gray-600 text-transparent hover:border-gray-400" : "border-gray-300 text-transparent hover:border-gray-400")
                    }`}
                  >
                    ✓
                  </div>
                )}
              </div>
            );
          })}
          
          {displayedOrders.length === 0 && (
             <div className={`col-span-full text-center py-10 text-xs font-black uppercase tracking-widest ${isDark ? "text-gray-600" : "text-gray-400"}`}>
               Δεν υπαρχουν παραγγελιες
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

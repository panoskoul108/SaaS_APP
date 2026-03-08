import React from "react";

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
}) {
  const maxProductCount = topProducts.length > 0 ? topProducts[0][1] : 1;
  const maxHourCount = peakHours.length > 0 ? peakHours[0][1] : 1;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div
        className={`p-4 rounded-[2rem] shadow-sm flex flex-col md:flex-row gap-4 justify-between ${
          isKitchen ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
        }`}
      >
        <div
          className={`flex p-1 rounded-2xl gap-1 overflow-x-auto no-scrollbar ${
            isKitchen ? "bg-gray-900" : "bg-gray-50"
          }`}
        >
          {["today", "week", "month", "all"].map((r) => (
            <button
              key={r}
              onClick={() => {
                setDateRange(r);
                setSpecificDate("");
              }}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase whitespace-nowrap ${
                dateRange === r
                  ? isKitchen
                    ? "bg-gray-700 text-orange-500 shadow-md"
                    : "bg-white shadow-md text-blue-600"
                  : "text-gray-400"
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
            className={`ml-2 px-3 py-2 rounded-xl text-xs font-bold uppercase ${
              isKitchen ? "bg-gray-700 text-white" : "bg-white"
            } ${dateRange === "specific" ? "ring-2 ring-blue-500" : ""}`}
          />
        </div>
        <input
          type="text"
          placeholder="Αναζήτηση..."
          className={`px-4 py-3 rounded-2xl text-sm font-bold ${
            isKitchen ? "bg-gray-900 text-white" : "bg-gray-50"
          }`}
          value={historySearch}
          onChange={(e) => setHistorySearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white font-black italic">
        <div
          className={`${
            isKitchen ? "bg-orange-600" : "bg-blue-600"
          } p-6 rounded-[2rem] shadow-lg`}
        >
          <span className="text-[10px] uppercase opacity-80">Τζίρος</span>
          <p className="text-4xl mt-2">{totalRevenue.toFixed(2)}€</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-[2rem] shadow-sm">
          <span className="text-[10px] uppercase text-gray-400">
            Παραγγελίες
          </span>
          <p className="text-4xl mt-2">{totalOrdersCount}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-[2rem] shadow-sm">
          <span className="text-[10px] uppercase text-gray-400">Μέση Αξία</span>
          <p className="text-4xl mt-2">{avgOrderValue.toFixed(2)}€</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className={`p-4 rounded-[2rem] flex justify-between items-center shadow-sm border ${
            isKitchen
              ? "bg-gray-800 border-gray-700 text-white"
              : "bg-green-50 border-green-200 text-green-800"
          }`}
        >
          <span className="font-black text-[10px] uppercase">💵 ΜΕΤΡΗΤΑ</span>
          <span className="font-black text-2xl">{cashTotal.toFixed(2)}€</span>
        </div>
        <div
          className={`p-4 rounded-[2rem] flex justify-between items-center shadow-sm border ${
            isKitchen
              ? "bg-gray-800 border-gray-700 text-white"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          <span className="font-black text-[10px] uppercase">💳 ΚΑΡΤΑ</span>
          <span className="font-black text-2xl">{cardTotal.toFixed(2)}€</span>
        </div>
        <button
          onClick={downloadReportFile}
          className="bg-gray-900 text-white p-4 rounded-[2rem] shadow-lg font-black uppercase text-[11px] hover:bg-gray-800 transition-colors"
        >
          💾 ΕΞΑΓΩΓΗ ΑΝΑΦΟΡΑΣ (Z)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className={`${
            isKitchen
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-100"
          } p-6 rounded-[2rem] shadow-sm border`}
        >
          <h3 className="text-[11px] font-black uppercase text-gray-400 mb-4 border-b pb-2">
            Top 5 Προϊόντα
          </h3>
          <div className="space-y-4">
            {topProducts.map(([name, count]) => (
              <div key={name} className="relative">
                <div
                  className={`flex justify-between text-xs font-black uppercase italic mb-1 z-10 relative px-2 ${
                    isKitchen ? "text-white" : "text-gray-800"
                  }`}
                >
                  <span>{name}</span>
                  <span>{count} τεμ.</span>
                </div>
                <div
                  className={`w-full h-8 rounded-xl overflow-hidden relative ${
                    isKitchen ? "bg-gray-900" : "bg-gray-50"
                  }`}
                >
                  <div
                    className={`h-full rounded-xl ${
                      isKitchen ? "bg-orange-900" : "bg-blue-100"
                    }`}
                    style={{ width: `${(count / maxProductCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div
          className={`${
            isKitchen
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-100"
          } p-6 rounded-[2rem] shadow-sm border`}
        >
          <h3 className="text-[11px] font-black uppercase text-gray-400 mb-4 border-b pb-2">
            Ώρες Αιχμής
          </h3>
          <div className="space-y-4">
            {peakHours.map(([hour, count]) => (
              <div key={hour} className="relative">
                <div
                  className={`flex justify-between text-xs font-black uppercase italic mb-1 z-10 relative px-2 ${
                    isKitchen ? "text-white" : "text-gray-800"
                  }`}
                >
                  <span>{hour}</span>
                  <span>{count} πάρ.</span>
                </div>
                <div
                  className={`w-full h-8 rounded-xl overflow-hidden relative ${
                    isKitchen ? "bg-gray-900" : "bg-gray-50"
                  }`}
                >
                  <div
                    className={`h-full rounded-xl ${
                      isKitchen ? "bg-orange-900" : "bg-orange-100"
                    }`}
                    style={{ width: `${(count / maxHourCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4">
        <div className="flex justify-between items-center mb-4 px-2">
          <h3
            className={`text-lg font-black italic uppercase ${
              isKitchen ? "text-white" : "text-gray-800"
            }`}
          >
            Λίστα Παραγγελιών
          </h3>
          {userRole === "admin" && (
            <button
              onClick={() => deleteOrders(selectedOrderIds)}
              disabled={selectedOrderIds.length === 0}
              className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase transition-all ${
                selectedOrderIds.length > 0
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-300"
              }`}
            >
              ΔΙΑΓΡΑΦΗ ΕΠΙΛΕΓΜΕΝΩΝ
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {historyOrders.map((o) => (
            <div
              key={o.id}
              onClick={() =>
                userRole === "admin" &&
                setSelectedOrderIds((prev) =>
                  prev.includes(o.id)
                    ? prev.filter((i) => i !== o.id)
                    : [...prev, o.id]
                )
              }
              className={`p-4 rounded-[2rem] flex justify-between items-center cursor-pointer transition-all border-2 ${
                selectedOrderIds.includes(o.id)
                  ? "border-blue-500 bg-blue-50"
                  : isKitchen
                  ? "border-gray-700 bg-gray-800 shadow-sm"
                  : "border-gray-50 bg-white shadow-sm"
              }`}
            >
              <div>
                <span
                  className={`font-black italic text-base ${
                    isKitchen ? "text-orange-400" : "text-blue-600"
                  }`}
                >
                  #{o.table_number}
                </span>
                <p className="text-[9px] font-bold text-gray-400 uppercase">
                  {new Date(o.created_at).toLocaleTimeString("el-GR")} •{" "}
                  {o.payment_method}
                </p>
              </div>
              <span
                className={`font-black text-lg ${
                  isKitchen ? "text-white" : "text-gray-800"
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
          ))}
        </div>
      </div>
    </div>
  );
}

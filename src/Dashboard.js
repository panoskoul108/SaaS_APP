import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import AdminProducts from "./AdminProducts";
import { PrintTicket } from "./PrintTicket";
import Login from "./Login";

const SUPABASE_URL = "https://vgyzevaxkayyobopznyr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZneXpldmF4a2F5eW9ib3B6bnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNjI2MDksImV4cCI6MjA4NjYzODYwOX0.u-kO33BloFq4MU3sZsxN8QVcNTjOOZtsDT4srhbdsCw";
const NOTIFICATION_SOUND =
  "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const TABLES_LIST = [
  ...Array.from({ length: 20 }, (_, i) => `A${i + 1}`),
  ...Array.from({ length: 6 }, (_, i) => `Γ${i + 1}`),
  ...Array.from({ length: 20 }, (_, i) => `Δ${i + 1}`),
  "ΠΑΚΕΤΟ",
];

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [storeId, setStoreId] = useState(null);
  const [storeName, setStoreName] = useState("");

  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("orders");
  const [isMuted, setIsMuted] = useState(false);
  const [backupMode, setBackupMode] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [dateRange, setDateRange] = useState("today");
  const [specificDate, setSpecificDate] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [prevOrdersCount, setPrevOrdersCount] = useState(0);
  const [activePrintOrder, setActivePrintOrder] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [selectedTableForQR, setSelectedTableForQR] = useState(null);

  const isKitchen = userRole === "kitchen";

  const fetchData = async () => {
    if (!isAuthenticated || !storeId) return;
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });
    if (ordersData) setOrders(ordersData);
    const { data: storeData } = await supabase
      .from("stores")
      .select("name, backup_mode")
      .eq("id", storeId)
      .single();
    if (storeData) {
      setBackupMode(storeData.backup_mode);
      setStoreName(storeData.name);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, storeId]);
  useEffect(() => {
    const pendingCount = orders.filter((o) => {
      if (o.status === "completed") return false;
      if (isKitchen) {
        return (
          (o.kitchen_status || "pending") === "pending" &&
          o.items?.some((i) => i.station === "kitchen")
        );
      } else {
        return (o.status || "pending") === "pending";
      }
    }).length;

    if (pendingCount > prevOrdersCount && !isMuted)
      new Audio(NOTIFICATION_SOUND).play().catch(() => {});
    setPrevOrdersCount(pendingCount);
  }, [orders, isMuted, isKitchen, prevOrdersCount]);

  const updateStatus = async (id, newStatus, forKitchen = false) => {
    const updatePayload = forKitchen
      ? { kitchen_status: newStatus }
      : { status: newStatus };
    await supabase.from("orders").update(updatePayload).eq("id", id);
    fetchData();
  };

  const deleteOrders = async (ids) => {
    if (ids.length === 0) return;
    if (window.confirm(`Διαγραφή ${ids.length} παραγγελιών;`)) {
      await supabase.from("orders").delete().in("id", ids);
      setSelectedOrderIds([]);
      fetchData();
    }
  };
  const toggleBackupMode = async () => {
    const newStatus = !backupMode;
    await supabase
      .from("stores")
      .update({ backup_mode: newStatus })
      .eq("id", storeId);
    setBackupMode(newStatus);
  };

  const downloadQR = async (tableNumber) => {
    try {
      const qrData = encodeURIComponent(
        `${window.location.origin}/?store=${storeId}&table=${tableNumber}`
      );
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${qrData}`;
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `QR_Store${storeId}_Table_${tableNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      alert("Σφάλμα. Δοκιμάστε ξανά.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setStoreId(null);
    setTab("orders");
  };

  if (!isAuthenticated)
    return (
      <Login
        onLoginSuccess={(role, store) => {
          setIsAuthenticated(true);
          setUserRole(role);
          setStoreId(store);
        }}
      />
    );
  if (isPrinting)
    return (
      <div className="bg-white">
        <PrintTicket order={activePrintOrder} />
      </div>
    );

  const historyOrders = orders.filter((o) => {
    if (o.status !== "completed") return false;
    const orderDate = new Date(o.created_at);
    const tableIdentifier = String(o.table_number || "");
    const matchesSearch = tableIdentifier
      .toLowerCase()
      .includes(historySearch.toLowerCase());
    let matchesTime = true;
    const now = new Date();
    if (dateRange === "today")
      matchesTime = orderDate.toDateString() === now.toDateString();
    else if (dateRange === "week")
      matchesTime = orderDate >= new Date(now - 7 * 24 * 60 * 60 * 1000);
    else if (dateRange === "month")
      matchesTime =
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear();
    else if (dateRange === "specific" && specificDate) {
      matchesTime =
        `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(orderDate.getDate()).padStart(2, "0")}` === specificDate;
    }

    const hasKitchenItem = o.items?.some((it) => it.station === "kitchen");
    if (isKitchen && !hasKitchenItem) return false;

    return matchesSearch && matchesTime;
  });

  // --- ΑΠΟΛΥΤΟ ΦΙΛΤΡΟ ΓΙΑ ΤΑ ΣΤΑΤΙΣΤΙΚΑ ΤΗΣ ΚΟΥΖΙΝΑΣ ---
  const totalRevenue = historyOrders.reduce((sum, o) => {
    if (isKitchen) {
      // Η κουζίνα μετράει ΜΟΝΟ τον τζίρο των δικών της πιάτων
      const kitchenSum =
        o.items
          ?.filter((it) => it.station === "kitchen")
          .reduce((s, it) => s + it.price, 0) || 0;
      return sum + kitchenSum;
    }
    return sum + (o.total_price || 0);
  }, 0);

  const totalOrdersCount = historyOrders.length;
  const avgOrderValue =
    totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
  const activeTables = [
    ...new Set(
      orders.filter((o) => o.status !== "completed").map((o) => o.table_number)
    ),
  ];

  const productCounts = {};
  historyOrders.forEach((o) => {
    o.items?.forEach((item) => {
      // Η κουζίνα "Αγνοεί" τα προϊόντα που δεν είναι δικά της
      if (isKitchen && item.station !== "kitchen") return;
      productCounts[item.name] = (productCounts[item.name] || 0) + 1;
    });
  });
  const topProducts = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxProductCount = topProducts.length > 0 ? topProducts[0][1] : 1;

  const hourCounts = {};
  historyOrders.forEach((o) => {
    const hour = new Date(o.created_at).getHours();
    const hourLabel = `${hour}:00 - ${hour + 1}:00`;
    hourCounts[hourLabel] = (hourCounts[hourLabel] || 0) + 1;
  });
  const peakHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const maxHourCount = peakHours.length > 0 ? peakHours[0][1] : 1;

  const OrderCard = ({ order }) => {
    const displayItems = isKitchen
      ? order.items?.filter((it) => it.station === "kitchen") || []
      : order.items;
    if (isKitchen && displayItems.length === 0) return null;

    const currentStatus = isKitchen
      ? order.kitchen_status || "pending"
      : order.status || "pending";

    return (
      <div
        onClick={() => setViewingOrder(order)}
        className={`${
          isKitchen
            ? "bg-gray-800 border-gray-700 text-white"
            : "bg-white border-gray-100 text-gray-800"
        } rounded-2xl p-4 mb-4 shadow-sm border cursor-pointer hover:shadow-md transition-shadow`}
      >
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
            <span className="font-black text-[9px] uppercase tracking-widest">
              ΣΗΜΕΙΩΣΗ:
            </span>
            <p className="text-xs font-bold italic">{order.general_note}</p>
          </div>
        )}

        {!isKitchen && order.items?.some((it) => it.station === "kitchen") && (
          <div
            className={`mb-3 p-2 rounded-xl flex items-center justify-between border ${
              (order.kitchen_status || "pending") === "ready"
                ? "bg-green-50 border-green-200 text-green-700"
                : (order.kitchen_status || "pending") === "preparing"
                ? "bg-orange-50 border-orange-200 text-orange-700"
                : "bg-gray-50 border-gray-200 text-gray-500"
            }`}
          >
            <span className="font-black text-[9px] uppercase tracking-widest flex items-center gap-1">
              🍳 Κουζινα:
            </span>
            <span className="text-xs font-black italic">
              {(order.kitchen_status || "pending") === "ready"
                ? "ΕΤΟΙΜΗ ✅"
                : (order.kitchen_status || "pending") === "preparing"
                ? "ΕΤΟΙΜΑΖΕΤΑΙ ⏳"
                : "ΣΕ ΑΝΑΜΟΝΗ 🕒"}
            </span>
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
                • {it.name}
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
                {isKitchen ? "ΕΝΑΡΞΗ ΠΡΟΕΤΟΙΜΑΣΙΑΣ" : "ΧΩΡΙΣ ΧΑΡΤΙ"}
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
          {currentStatus === "ready" && !isKitchen && (
            <button
              onClick={() => updateStatus(order.id, "completed", false)}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-black text-[10px] uppercase"
            >
              ΟΛΟΚΛΗΡΩΣΗ
            </button>
          )}
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
    <div
      className={`min-h-screen font-sans print:bg-white ${
        isKitchen ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <div className="print:hidden">
        <header
          className={`border-b p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm ${
            isKitchen ? "bg-gray-900 border-gray-800" : "bg-white"
          }`}
        >
          <h1
            className={`font-black italic text-xl tracking-tighter ${
              isKitchen ? "text-white" : "text-gray-800"
            }`}
          >
            {storeName ? storeName.toUpperCase() : `ΜΑΓΑΖΙ ${storeId}`}{" "}
            <span className={isKitchen ? "text-orange-500" : "text-blue-600"}>
              {isKitchen ? "KITCHEN" : userRole === "admin" ? "ADMIN" : "STAFF"}
            </span>
          </h1>
          <div className="flex gap-3 items-center">
            {userRole === "admin" && (
              <button
                onClick={toggleBackupMode}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase ${
                  backupMode
                    ? "bg-orange-500 text-white shadow-lg"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                Backup: {backupMode ? "ON" : "OFF"}
              </button>
            )}
            <button onClick={() => setIsMuted(!isMuted)} className="text-lg">
              {isMuted ? "🔇" : "🔊"}
            </button>
            <button
              onClick={handleLogout}
              className={`text-xs font-black px-3 py-1 rounded-full border transition-colors ${
                isKitchen
                  ? "text-gray-400 border-gray-700 hover:text-white"
                  : "text-gray-400 border-gray-200 hover:text-red-500"
              }`}
            >
              ΕΞΟΔΟΣ
            </button>
          </div>
        </header>

        <div
          className={`flex border-b px-4 py-2 gap-2 sticky top-[65px] z-20 shadow-sm overflow-x-auto no-scrollbar ${
            isKitchen ? "bg-gray-900 border-gray-800" : "bg-white"
          }`}
        >
          {["orders", "tables", "history", "products"].map((t) => {
            if (userRole === "staff" && t !== "orders") return null;
            if (isKitchen && (t === "tables" || t === "products")) return null;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 min-w-[100px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  tab === t
                    ? isKitchen
                      ? "bg-orange-600 text-white shadow-lg"
                      : "bg-black text-white shadow-lg"
                    : isKitchen
                    ? "bg-gray-800 text-gray-400"
                    : "bg-gray-50 text-gray-400"
                }`}
              >
                {t === "orders"
                  ? "ΠΑΡΑΓΓΕΛΙΕΣ"
                  : t === "tables"
                  ? "ΤΡΑΠΕΖΙΑ"
                  : t === "history"
                  ? "ΙΣΤΟΡΙΚΟ"
                  : "ΚΑΤΑΛΟΓΟΣ"}
              </button>
            );
          })}
        </div>
      </div>

      <main className="p-4 print:hidden">
        {tab === "orders" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {["pending", "preparing", "ready"].map((s, idx) => {
              const columnOrders = orders.filter((o) => {
                if (o.status === "completed") return false;
                const stat = isKitchen
                  ? o.kitchen_status || "pending"
                  : o.status || "pending";
                if (isKitchen) {
                  const hasKitchenItems = o.items?.some(
                    (it) => it.station === "kitchen"
                  );
                  if (!hasKitchenItems) return false;
                }
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
        )}

        {tab === "history" && (userRole === "admin" || isKitchen) && (
          <div className="max-w-6xl mx-auto space-y-6 pb-20">
            <div
              className={`p-4 rounded-[2rem] shadow-sm flex flex-col md:flex-row gap-4 justify-between ${
                isKitchen
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-100"
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
                  className={`ml-2 px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all shadow-sm cursor-pointer outline-none border border-transparent ${
                    isKitchen ? "bg-gray-700 text-white" : "bg-white"
                  } ${
                    dateRange === "specific"
                      ? isKitchen
                        ? "text-orange-500 ring-2 ring-orange-500"
                        : "text-blue-600 ring-2 ring-blue-500"
                      : "text-gray-500"
                  }`}
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Αναζήτηση Τράπεζας..."
                  className={`flex-1 border-none px-4 py-3 rounded-2xl text-sm font-bold shadow-inner ${
                    isKitchen ? "bg-gray-900 text-white" : "bg-gray-50"
                  }`}
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`${
                  isKitchen ? "bg-orange-600" : "bg-blue-600"
                } text-white p-6 rounded-[2rem] shadow-lg flex flex-col justify-between`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                  Συνολικος Τζιρος
                </span>
                <span className="text-4xl font-black italic mt-2">
                  {totalRevenue.toFixed(2)}€
                </span>
              </div>
              <div
                className={`${
                  isKitchen
                    ? "bg-gray-800 text-white"
                    : "bg-white text-gray-800"
                } p-6 rounded-[2rem] shadow-sm flex flex-col justify-between border ${
                  isKitchen ? "border-gray-700" : "border-gray-100"
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Παραγγελιες
                </span>
                <span className="text-4xl font-black italic mt-2">
                  {totalOrdersCount}
                </span>
              </div>
              <div
                className={`${
                  isKitchen
                    ? "bg-gray-800 text-white"
                    : "bg-white text-gray-800"
                } p-6 rounded-[2rem] shadow-sm flex flex-col justify-between border ${
                  isKitchen ? "border-gray-700" : "border-gray-100"
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Μεση Αξια / Παραγγελια
                </span>
                <span className="text-4xl font-black italic mt-2">
                  {avgOrderValue.toFixed(2)}€
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`${
                  isKitchen
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-100"
                } p-6 rounded-[2rem] shadow-sm border`}
              >
                <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4 border-b pb-2">
                  Top 5 Προϊοντα
                </h3>
                {topProducts.length === 0 ? (
                  <p className="text-xs font-bold text-gray-400">
                    Δεν υπάρχουν δεδομένα.
                  </p>
                ) : (
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
                            className={`h-full rounded-xl transition-all duration-1000 ${
                              isKitchen ? "bg-orange-900" : "bg-blue-100"
                            }`}
                            style={{
                              width: `${(count / maxProductCount) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div
                className={`${
                  isKitchen
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-100"
                } p-6 rounded-[2rem] shadow-sm border`}
              >
                <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4 border-b pb-2">
                  Ωρες Αιχμης
                </h3>
                {peakHours.length === 0 ? (
                  <p className="text-xs font-bold text-gray-400">
                    Δεν υπάρχουν δεδομένα.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {peakHours.map(([hour, count]) => (
                      <div key={hour} className="relative">
                        <div
                          className={`flex justify-between text-xs font-black uppercase italic mb-1 z-10 relative px-2 ${
                            isKitchen ? "text-white" : "text-gray-800"
                          }`}
                        >
                          <span>{hour}</span>
                          <span>{count} παραγγελιες</span>
                        </div>
                        <div
                          className={`w-full h-8 rounded-xl overflow-hidden relative ${
                            isKitchen ? "bg-gray-900" : "bg-gray-50"
                          }`}
                        >
                          <div
                            className={`h-full rounded-xl transition-all duration-1000 ${
                              isKitchen ? "bg-orange-900" : "bg-orange-100"
                            }`}
                            style={{
                              width: `${(count / maxHourCount) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4">
              <div className="flex justify-between items-center mb-4 px-2">
                <h3
                  className={`text-lg font-black italic uppercase tracking-tighter ${
                    isKitchen ? "text-white" : "text-gray-800"
                  }`}
                >
                  Λιστα Παραγγελιων
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
                    ΔΙΑΓΡΑΦΗ ΕΠΙΛΕΓΜΕΝΩΝ ({selectedOrderIds.length})
                  </button>
                )}
              </div>
              {historyOrders.length === 0 ? (
                <div className="text-center text-gray-500 py-10 font-bold uppercase text-sm">
                  Δεν βρεθηκαν παραγγελιες
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {historyOrders.map((o) => {
                    // ΕΔΩ Η ΚΟΥΖΙΝΑ ΒΛΕΠΕΙ ΜΟΝΟ ΤΟ ΚΟΣΤΟΣ ΤΟΥ ΦΑΓΗΤΟΥ!
                    const orderTotal = isKitchen
                      ? o.items
                          ?.filter((it) => it.station === "kitchen")
                          .reduce((s, it) => s + it.price, 0)
                      : o.total_price;
                    return (
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
                        <div className="flex items-center gap-3">
                          {userRole === "admin" && (
                            <div
                              className={`w-5 h-5 rounded flex items-center justify-center border-2 ${
                                selectedOrderIds.includes(o.id)
                                  ? "bg-blue-500 border-blue-500 text-white"
                                  : "border-gray-200 text-transparent"
                              }`}
                            >
                              ✓
                            </div>
                          )}
                          <div>
                            <span
                              className={`font-black italic text-base ${
                                isKitchen ? "text-orange-400" : "text-blue-600"
                              }`}
                            >
                              #{o.table_number}
                            </span>
                            <p className="text-[9px] font-bold text-gray-400 uppercase">
                              {new Date(o.created_at).toLocaleTimeString(
                                "el-GR"
                              )}{" "}
                              • {o.payment_method}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`font-black text-lg tracking-tighter ${
                            isKitchen ? "text-white" : "text-gray-800"
                          }`}
                        >
                          {orderTotal?.toFixed(2)}€
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "tables" && userRole === "admin" && (
          <div className="max-w-6xl mx-auto pb-20">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {TABLES_LIST.map((table) => {
                const isOccupied = activeTables.includes(table);
                return (
                  <div
                    key={table}
                    onClick={() => setSelectedTableForQR(table)}
                    className={`aspect-square rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all shadow-sm border-2 cursor-pointer hover:scale-105 ${
                      isOccupied
                        ? "bg-red-50 border-red-200 hover:bg-red-100"
                        : "bg-white border-green-200 hover:bg-green-50"
                    }`}
                  >
                    <span
                      className={`text-2xl font-black italic ${
                        isOccupied ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {table}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {tab === "products" && userRole === "admin" && (
          <AdminProducts storeId={storeId} />
        )}
      </main>

      {/* Modal Λεπτομερειών */}
      {viewingOrder && (
        <div
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 print:hidden"
          onClick={() => setViewingOrder(null)}
        >
          <div
            className={`${
              isKitchen ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            } w-full max-w-md rounded-[3rem] p-8 shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-black italic text-2xl uppercase tracking-tighter mb-6">
              ΛΕΠΤΟΜΕΡΕΙΕΣ #{viewingOrder.table_number}
            </h2>
            {viewingOrder.general_note && (
              <div
                className={`mb-6 p-4 rounded-2xl ${
                  isKitchen
                    ? "bg-orange-900/50 text-orange-200"
                    : "bg-blue-50 text-blue-800"
                }`}
              >
                <p className="text-sm font-bold italic">
                  {viewingOrder.general_note}
                </p>
              </div>
            )}

            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
              {(isKitchen
                ? viewingOrder.items?.filter((i) => i.station === "kitchen")
                : viewingOrder.items
              )?.map((item, i) => (
                <div
                  key={i}
                  className={`border-b pb-3 ${
                    isKitchen ? "border-gray-700" : "border-gray-100"
                  }`}
                >
                  <div className="flex justify-between font-black uppercase italic">
                    <span>{item.name}</span>
                    <span
                      className={isKitchen ? "text-white" : "text-blue-600"}
                    >
                      {item.price?.toFixed(2)}€
                    </span>
                  </div>
                  {item.note && (
                    <div
                      className={`p-3 rounded-xl mt-2 text-xs font-bold italic ${
                        isKitchen
                          ? "bg-gray-700 text-yellow-400"
                          : "bg-yellow-50 text-yellow-800"
                      }`}
                    >
                      📝 {item.note}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ΕΠΑΝΑΦΟΡΑ ΣΥΝΟΛΟΥ */}
            <div
              className={`mt-6 pt-4 border-t-2 border-dashed flex justify-between items-center text-2xl font-black italic tracking-tighter ${
                isKitchen ? "border-gray-700" : "border-gray-100"
              }`}
            >
              <span>ΣΥΝΟΛΟ:</span>
              <span className={isKitchen ? "text-white" : "text-gray-900"}>
                {(isKitchen
                  ? viewingOrder.items
                      ?.filter((i) => i.station === "kitchen")
                      .reduce((s, it) => s + it.price, 0)
                  : viewingOrder.total_price
                )?.toFixed(2)}
                €
              </span>
            </div>

            <button
              onClick={() => setViewingOrder(null)}
              className="w-full mt-8 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs hover:bg-blue-700"
            >
              ΚΛΕΙΣΙΜΟ
            </button>
          </div>
        </div>
      )}

      {selectedTableForQR && userRole === "admin" && (
        <div
          className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 print:bg-white print:p-0"
          onClick={() => setSelectedTableForQR(null)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-3xl font-black italic uppercase mb-2">
              ΤΡΑΠΕΖΙ {selectedTableForQR}
            </h2>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
                window.location.origin +
                  "/?store=" +
                  storeId +
                  "&table=" +
                  selectedTableForQR
              )}`}
              alt="QR"
              className="w-64 h-64 mb-8"
            />
            <div className="w-full flex flex-col gap-3 print:hidden">
              <button
                onClick={() => downloadQR(selectedTableForQR)}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg"
              >
                ΛΗΨΗ ΕΙΚΟΝΑΣ (PNG)
              </button>
              <button
                onClick={() => setSelectedTableForQR(null)}
                className="w-full bg-red-50 text-red-500 py-4 rounded-2xl font-black uppercase text-xs"
              >
                ΑΚΥΡΟ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

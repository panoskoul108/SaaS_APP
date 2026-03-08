import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import AdminProducts from "./AdminProducts";
import { PrintTicket } from "./PrintTicket";
import Login from "./Login";
import PosProductModal from "./PosProductModal";
import OrderList from "./OrderList";
import HistoryPanel from "./HistoryPanel";

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

const removeAccents = (str) =>
  str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : str;
const CATEGORY_ORDER = [
  "ΠΡΟΤΕΙΝΟΜΕΝΑ",
  "ΚΑΦΕΔΕΣ",
  "ΑΝΑΨΥΚΤΙΚΑ",
  "ΡΟΦΗΜΑΤΑ",
  "ΠΡΩΙΝΟ",
  "ΜΠΥΡΕΣ",
  "ΣΝΑΚΣ",
  "ΣΥΝΟΔΕΥΤΙΚΑ",
  "ΣΑΛΑΤΕΣ",
  "ΖΥΜΑΡΙΚΑ",
  "ΠΙΤΣΕΣ",
  "ΑΛΜΥΡΕΣ ΚΡΕΠΕΣ",
  "ΓΛΥΚΕΣ ΚΡΕΠΕΣ",
  "ΓΛΥΚΑ",
];

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [storeId, setStoreId] = useState(null);
  const [storeName, setStoreName] = useState("");
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [tab, setTab] = useState("orders");
  const [isMuted, setIsMuted] = useState(false);
  const [backupMode, setBackupMode] = useState(false);
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(true);
  const [historySearch, setHistorySearch] = useState("");
  const [dateRange, setDateRange] = useState("today");
  const [specificDate, setSpecificDate] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [prevOrdersCount, setPrevOrdersCount] = useState(0);
  const [activePrintOrder, setActivePrintOrder] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [selectedTableForQR, setSelectedTableForQR] = useState(null);

  // POS STATE
  const [isPosOpen, setIsPosOpen] = useState(false);
  const [isPosCartOpen, setIsPosCartOpen] = useState(false);
  const [posCategory, setPosCategory] = useState("ΟΛΑ");
  const [posCart, setPosCart] = useState([]);
  const [posTable, setPosTable] = useState("ΠΑΚΕΤΟ");
  const [posPayment, setPosPayment] = useState("");
  const [posGeneralNote, setPosGeneralNote] = useState("");
  const [posActiveProduct, setPosActiveProduct] = useState(null);
  const [posAddonSelections, setPosAddonSelections] = useState({});
  const [posQuantity, setPosQuantity] = useState(1);
  const [posCurrentNote, setPosCurrentNote] = useState("");
  const [editingCartId, setEditingCartId] = useState(null);

  const currentHour = new Date().getHours();
  const isMorning = currentHour >= 6 && currentHour < 14;
  const isKitchen = userRole === "kitchen";

  const fetchData = async () => {
    if (!isAuthenticated || !storeId) return;
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });
    if (ordersData) setOrders(ordersData);
    const { data: reviewsData } = await supabase
      .from("reviews")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });
    if (reviewsData) setReviews(reviewsData);
    const { data: storeData } = await supabase
      .from("stores")
      .select("name, backup_mode, is_accepting_orders")
      .eq("id", storeId)
      .single();
    if (storeData) {
      setBackupMode(storeData.backup_mode);
      setStoreName(storeData.name);
      setIsAcceptingOrders(storeData.is_accepting_orders !== false);
    }
  };

  const fetchProducts = async () => {
    if (!isAuthenticated || !storeId) return;
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (data)
      setProducts(
        data.map((p) => ({
          ...p,
          name: removeAccents(p.name),
          category: removeAccents(p.category),
        }))
      );
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      fetchProducts();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, storeId]);

  useEffect(() => {
    const pendingCount = orders.filter((o) => {
      if (o.status === "completed") return false;
      return isKitchen
        ? (o.kitchen_status || "pending") === "pending" &&
            o.items?.some((i) => i.station === "kitchen")
        : (o.status || "pending") === "pending";
    }).length;
    if (pendingCount > prevOrdersCount && !isMuted)
      new Audio(NOTIFICATION_SOUND).play().catch(() => {});
    setPrevOrdersCount(pendingCount);
  }, [orders, isMuted, isKitchen, prevOrdersCount]);

  const updateStatus = async (id, newStatus, forKitchen = false) => {
    await supabase
      .from("orders")
      .update(
        forKitchen ? { kitchen_status: newStatus } : { status: newStatus }
      )
      .eq("id", id);
    fetchData();
  };

  const deleteOrders = async (ids) => {
    if (ids.length && window.confirm(`Διαγραφή ${ids.length} παραγγελιών;`)) {
      await supabase.from("orders").delete().in("id", ids);
      setSelectedOrderIds([]);
      fetchData();
    }
  };

  const toggleBackupMode = async () => {
    const s = !backupMode;
    await supabase.from("stores").update({ backup_mode: s }).eq("id", storeId);
    setBackupMode(s);
  };
  const toggleAcceptingOrders = async () => {
    const s = !isAcceptingOrders;
    await supabase
      .from("stores")
      .update({ is_accepting_orders: s })
      .eq("id", storeId);
    setIsAcceptingOrders(s);
  };

  const downloadQR = async (table) => {
    try {
      const qrData = encodeURIComponent(
        `${window.location.origin}/?store=${storeId}&table=${table}`
      );
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
        `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${qrData}`
      )}`;
      const res = await fetch(proxyUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `QR_${table}.png`;
      a.click();
    } catch {
      window.open(
        `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
          window.location.origin + "/?store=" + storeId + "&table=" + table
        )}`,
        "_blank"
      );
    }
  };

  // POS LOGIC
  const posVisibleProducts = products.filter((p) =>
    p.category === "ΠΡΩΙΝΟ" ? isMorning : true
  );
  const posCategories = [
    ...new Set(posVisibleProducts.map((p) => p.category)),
  ].sort((a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b));
  const posFilteredProducts =
    posCategory === "ΟΛΑ"
      ? posVisibleProducts
      : posVisibleProducts.filter((p) => p.category === posCategory);

  const handlePosProductClick = (p) => {
    const initial = {};
    p.addons?.forEach((g) => (initial[g.id] = []));
    setPosAddonSelections(initial);
    setPosQuantity(1);
    setPosCurrentNote("");
    setEditingCartId(null);
    setPosActiveProduct(p);
  };

  const handleEditCartItem = (i) => {
    const p = products.find((prod) => prod.id === i.id);
    if (p) {
      setPosActiveProduct(p);
      setPosAddonSelections(i.rawAddons || {});
      setPosCurrentNote(i.note || "");
      setPosQuantity(i.quantity || 1);
      setEditingCartId(i.cartId);
    }
  };

  const togglePosAddon = (gid, oidx, max) => {
    let curr = posAddonSelections[gid] || [];
    if (curr.includes(oidx)) curr = curr.filter((i) => i !== oidx);
    else if (curr.length < max) curr = [...curr, oidx];
    else if (max === 1) curr = [oidx];
    setPosAddonSelections({ ...posAddonSelections, [gid]: curr });
  };

  const confirmPosAddons = () => {
    let extra = 0,
      texts = [],
      valid = true;
    posActiveProduct.addons?.forEach((g) => {
      const s = posAddonSelections[g.id] || [];
      if (g.isRequired && !s.length) valid = false;
      if (s.length) {
        texts.push(s.map((i) => g.options[i].name).join(", "));
        s.forEach((i) => (extra += g.options[i].price));
      }
    });
    if (!valid) return alert("Συμπληρώστε τα υποχρεωτικά!");
    const item = {
      ...posActiveProduct,
      cartId: editingCartId || Date.now() + Math.random(),
      name: texts.length
        ? `${posActiveProduct.name} (${texts.join(" | ")})`
        : posActiveProduct.name,
      price: posActiveProduct.price + extra,
      note: removeAccents(posCurrentNote),
      rawAddons: posAddonSelections,
      quantity: posQuantity,
    };
    setPosCart(
      editingCartId
        ? posCart.map((i) => (i.cartId === editingCartId ? item : i))
        : [...posCart, item]
    );
    setPosActiveProduct(null);
    setEditingCartId(null);
  };

  const updatePosCartQuantity = (cartId, delta) => {
    setPosCart(
      posCart.map((item) =>
        item.cartId === cartId
          ? { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) }
          : item
      )
    );
  };

  const submitPosOrder = async () => {
    if (!posCart.length || !posTable || !posPayment) return;
    const total = posCart.reduce((s, i) => s + i.price * i.quantity, 0);
    await supabase
      .from("orders")
      .insert([
        {
          store_id: storeId,
          table_number: posTable,
          items: posCart,
          total_price: total,
          payment_method: posPayment,
          status: "pending",
          general_note: removeAccents(posGeneralNote),
        },
      ]);
    setPosCart([]);
    setPosTable("ΠΑΚΕΤΟ");
    setPosGeneralNote("");
    setPosPayment("");
    setIsPosOpen(false);
    setIsPosCartOpen(false);
    fetchData();
  };

  const downloadReportFile = () => {
    const periodMap = {
      today: "ΣΗΜΕΡΙΝΗ",
      week: "ΕΒΔΟΜΑΔΙΑΙΑ",
      month: "ΜΗΝΙΑΙΑ",
      all: "ΣΥΝΟΛΙΚΗ",
      specific: specificDate || "ΕΙΔΙΚΗ",
    };
    const reportText =
      `======================================\n         ΑΝΑΦΟΡΑ ΤΑΜΕΙΟΥ (Z)\n======================================\nΚΑΤΑΣΤΗΜΑ: ${
        storeName || `ΚΑΤΑΣΤΗΜΑ ${storeId}`
      }\nΗΜΕΡΟΜΗΝΙΑ ΕΞΑΓΩΓΗΣ: ${new Date().toLocaleString(
        "el-GR"
      )}\nΠΕΡΙΟΔΟΣ: ${
        periodMap[dateRange] || "ΑΓΝΩΣΤΗ"
      }\n--------------------------------------\nΣΥΝΟΛΙΚΟΣ ΤΖΙΡΟΣ : ${totalRevenue.toFixed(
        2
      )}€\nΜΕΤΡΗΤΑ          : ${cashTotal.toFixed(
        2
      )}€\nΚΑΡΤΑ            : ${cardTotal.toFixed(
        2
      )}€\n--------------------------------------\nΣΥΝΟΛΟ ΠΑΡΑΓΓΕΛΙΩΝ: ${totalOrdersCount}\nΜΕΣΗ ΑΞΙΑ / ΠΑΡ.  : ${avgOrderValue.toFixed(
        2
      )}€\n======================================`.trim();
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Z_Report_${new Date()
      .toLocaleDateString("el-GR")
      .replace(/\//g, "-")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // HISTORY CALCULATIONS
  const historyOrders = orders.filter((o) => {
    if (o.status !== "completed") return false;
    const date = new Date(o.created_at);
    const table = String(o.table_number || "").toLowerCase();
    const matchesSearch = table.includes(historySearch.toLowerCase());
    let matchesTime = true;
    const now = new Date();
    if (dateRange === "today")
      matchesTime = date.toDateString() === now.toDateString();
    else if (dateRange === "week")
      matchesTime = date >= new Date(now - 7 * 24 * 60 * 60 * 1000);
    else if (dateRange === "month")
      matchesTime =
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();
    else if (dateRange === "specific" && specificDate)
      matchesTime = date.toISOString().split("T")[0] === specificDate;
    return (
      matchesSearch &&
      matchesTime &&
      (!isKitchen || o.items?.some((it) => it.station === "kitchen"))
    );
  });

  const totalRevenue = historyOrders.reduce(
    (sum, o) =>
      sum +
      (isKitchen
        ? o.items
            ?.filter((it) => it.station === "kitchen")
            .reduce((s, it) => s + it.price * it.quantity, 0)
        : o.total_price),
    0
  );
  const totalOrdersCount = historyOrders.length;
  const avgOrderValue = totalOrdersCount ? totalRevenue / totalOrdersCount : 0;
  const cashTotal = historyOrders
    .filter((o) => o.payment_method === "ΜΕΤΡΗΤΑ")
    .reduce(
      (sum, o) =>
        sum +
        (isKitchen
          ? o.items
              ?.filter((it) => it.station === "kitchen")
              .reduce((s, it) => s + it.price * it.quantity, 0)
          : o.total_price),
      0
    );
  const cardTotal = totalRevenue - cashTotal;
  const activeTables = [
    ...new Set(
      orders.filter((o) => o.status !== "completed").map((o) => o.table_number)
    ),
  ];

  const productCounts = {};
  historyOrders.forEach((o) =>
    o.items?.forEach((it) => {
      if (!isKitchen || it.station === "kitchen")
        productCounts[it.name] = (productCounts[it.name] || 0) + it.quantity;
    })
  );
  const topProducts = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const hourCounts = {};
  historyOrders.forEach((o) => {
    const h = new Date(o.created_at).getHours() + ":00";
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  });
  const peakHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (!isAuthenticated)
    return (
      <Login
        onLoginSuccess={(r, s) => {
          setIsAuthenticated(true);
          setUserRole(r);
          setStoreId(s);
        }}
      />
    );
  if (isPrinting)
    return (
      <div className="bg-white">
        <PrintTicket order={activePrintOrder} />
      </div>
    );

  return (
    <div
      className={`min-h-screen font-sans ${
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
            className={`font-black italic text-xl ${
              isKitchen ? "text-white" : "text-gray-800"
            }`}
          >
            {storeName?.toUpperCase()}{" "}
            <span className={isKitchen ? "text-orange-500" : "text-blue-600"}>
              {userRole?.toUpperCase()}
            </span>
          </h1>
          <div className="flex gap-2 items-center">
            {!isKitchen && (
              <button
                onClick={() => setIsPosOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase shadow-lg"
              >
                + ΝΕΑ ΠΑΡΑΓΓΕΛΙΑ
              </button>
            )}
            {!isKitchen && (
              <button
                onClick={toggleAcceptingOrders}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all shadow-md ${
                  isAcceptingOrders
                    ? "bg-green-500 text-white"
                    : "bg-red-600 text-white animate-pulse"
                }`}
              >
                {isAcceptingOrders ? "🟢 ON" : "🔴 OFF"}
              </button>
            )}

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
              onClick={() => setIsAuthenticated(false)}
              className="text-xs font-black px-3 py-1 rounded-full border border-gray-200 text-gray-400"
            >
              ΕΞΟΔΟΣ
            </button>
          </div>
        </header>

        <div
          className={`flex border-b px-4 py-2 gap-2 sticky top-[65px] z-20 shadow-sm ${
            isKitchen ? "bg-gray-900 border-gray-800" : "bg-white"
          }`}
        >
          {["orders", "tables", "reviews", "history", "products"].map((t) => {
            if (userRole === "staff" && t !== "orders") return null;
            if (
              isKitchen &&
              (t === "tables" || t === "products" || t === "reviews")
            )
              return null;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${
                  tab === t ? "bg-black text-white" : "bg-gray-50 text-gray-400"
                }`}
              >
                {t.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      <main className="p-4 print:hidden">
        {tab === "orders" && (
          <OrderList
            orders={orders}
            isKitchen={isKitchen}
            userRole={userRole}
            updateStatus={updateStatus}
            deleteOrders={deleteOrders}
            setViewingOrder={setViewingOrder}
            setActivePrintOrder={setActivePrintOrder}
            setIsPrinting={setIsPrinting}
          />
        )}

        {tab === "history" && (
          <HistoryPanel
            isKitchen={isKitchen}
            userRole={userRole}
            dateRange={dateRange}
            setDateRange={setDateRange}
            specificDate={specificDate}
            setSpecificDate={setSpecificDate}
            historySearch={historySearch}
            setHistorySearch={setHistorySearch}
            totalRevenue={totalRevenue}
            totalOrdersCount={totalOrdersCount}
            avgOrderValue={avgOrderValue}
            cashTotal={cashTotal}
            cardTotal={cardTotal}
            topProducts={topProducts}
            peakHours={peakHours}
            historyOrders={historyOrders}
            selectedOrderIds={selectedOrderIds}
            setSelectedOrderIds={setSelectedOrderIds}
            deleteOrders={deleteOrders}
            downloadReportFile={downloadReportFile}
          />
        )}

        {tab === "tables" && userRole === "admin" && (
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {TABLES_LIST.map((t) => (
              <div
                key={t}
                onClick={() => setSelectedTableForQR(t)}
                className={`aspect-square rounded-2xl p-3 flex items-center justify-center border-2 cursor-pointer ${
                  activeTables.includes(t)
                    ? "bg-red-50 border-red-200 text-red-600"
                    : "bg-white border-green-200 text-green-600"
                } font-black text-2xl`}
              >
                {t}
              </div>
            ))}
          </div>
        )}

        {tab === "products" && userRole === "admin" && (
          <AdminProducts storeId={storeId} />
        )}
      </main>

      <PosProductModal
        posActiveProduct={posActiveProduct}
        setPosActiveProduct={setPosActiveProduct}
        editingCartId={editingCartId}
        setEditingCartId={setEditingCartId}
        posAddonSelections={posAddonSelections}
        togglePosAddon={togglePosAddon}
        posQuantity={posQuantity}
        setPosQuantity={setPosQuantity}
        posCurrentNote={posCurrentNote}
        setPosCurrentNote={setPosCurrentNote}
        confirmPosAddons={confirmPosAddons}
      />

      {isPosOpen && (
        <div className="fixed inset-0 bg-gray-100 lg:bg-black/80 z-[300] flex items-center justify-center lg:p-6 animate-fade-in">
          <div
            style={{ width: "98vw", height: "95vh" }}
            className="bg-gray-100 lg:rounded-[2rem] shadow-2xl flex flex-col lg:flex-row overflow-hidden"
          >
            <div
              style={{ width: "55%" }}
              className="flex flex-col bg-white border-r h-full"
            >
              <div className="p-4 bg-gray-50 flex justify-between items-center border-b">
                <h2 className="font-black text-xl uppercase italic">
                  ΚΑΤΑΛΟΓΟΣ TAMEIOY
                </h2>
                <button
                  onClick={() => setIsPosOpen(false)}
                  className="w-10 h-10 rounded-full border font-black"
                >
                  ✕
                </button>
              </div>
              <div className="flex overflow-x-auto gap-2 p-3 border-b no-scrollbar">
                <button
                  onClick={() => setPosCategory("ΟΛΑ")}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black ${
                    posCategory === "ΟΛΑ"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100"
                  }`}
                >
                  ΟΛΑ
                </button>
                {posCategories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setPosCategory(c)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black ${
                      posCategory === c
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-3 bg-gray-50">
                {posFilteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePosProductClick(p)}
                    className="bg-white p-4 border rounded-2xl flex flex-col justify-between items-start font-bold text-sm uppercase"
                  >
                    <span>{p.name}</span>
                    <span className="text-blue-600 text-lg">
                      {p.price.toFixed(2)}€
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div
              style={{ width: "45%" }}
              className="flex flex-col bg-gray-50 h-full"
            >
              <div className="p-4 bg-white border-b flex justify-between items-center">
                <h2 className="font-black text-xl">
                  ΚΑΛΑΘΙ ({posCart.length})
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                {posCart.map((i) => (
                  <div
                    key={i.cartId}
                    className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col gap-2"
                  >
                    <div className="flex justify-between font-black uppercase text-sm">
                      <span>{i.name}</span>
                      <span>{(i.price * i.quantity).toFixed(2)}€</span>
                    </div>
                    {i.note && (
                      <p className="text-[10px] text-gray-500 italic">
                        📝 {i.note}
                      </p>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="flex items-center bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => updatePosCartQuantity(i.cartId, -1)}
                          className="w-8 h-8 font-black"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-black">
                          {i.quantity}
                        </span>
                        <button
                          onClick={() => updatePosCartQuantity(i.cartId, 1)}
                          className="w-8 h-8 font-black text-blue-600"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCartItem(i)}
                          className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 text-lg flex items-center justify-center"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() =>
                            setPosCart(
                              posCart.filter((item) => item.cartId !== i.cartId)
                            )
                          }
                          className="w-10 h-10 rounded-xl bg-red-50 text-red-500 text-lg flex items-center justify-center"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-5 bg-white border-t space-y-3">
                <input
                  type="text"
                  placeholder="ΤΡΑΠΕΖΙ ή ΠΑΚΕΤΟ"
                  value={posTable}
                  onChange={(e) => setPosTable(e.target.value)}
                  className="w-full border-2 p-4 rounded-xl font-black uppercase"
                />
                <textarea
                  rows="1"
                  placeholder="Γενική Σημείωση..."
                  value={posGeneralNote}
                  onChange={(e) => setPosGeneralNote(e.target.value)}
                  className="w-full bg-gray-50 border p-4 rounded-xl font-bold italic text-sm resize-none"
                ></textarea>
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                  {["ΜΕΤΡΗΤΑ", "ΚΑΡΤΑ"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setPosPayment(m)}
                      className={`flex-1 py-4 rounded-lg font-black text-xs ${
                        posPayment === m
                          ? "bg-white shadow-sm text-blue-600"
                          : "text-gray-400"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <button
                  onClick={submitPosOrder}
                  disabled={!posCart.length || !posPayment}
                  className={`w-full p-5 rounded-2xl font-black uppercase text-white shadow-xl flex justify-between ${
                    !posCart.length || !posPayment
                      ? "bg-gray-200"
                      : "bg-green-600"
                  }`}
                >
                  <span>ΑΠΟΣΤΟΛΗ</span>
                  <span>
                    {posCart
                      .reduce((s, i) => s + i.price * i.quantity, 0)
                      .toFixed(2)}
                    €
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTableForQR && userRole === "admin" && (
        <div
          className="fixed inset-0 bg-black/80 z-[400] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedTableForQR(null)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl flex flex-col items-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedTableForQR(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-gray-100 rounded-full font-black text-gray-600"
            >
              ✕
            </button>
            <h2 className="text-3xl font-black italic uppercase mb-6 text-gray-800">
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
              className="w-64 h-64 mb-8 shadow-sm rounded-xl"
            />
            <button
              onClick={() => downloadQR(selectedTableForQR)}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase shadow-lg"
            >
              ΛΗΨΗ ΕΙΚΟΝΑΣ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

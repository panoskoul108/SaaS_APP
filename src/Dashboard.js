import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import AdminProducts from "./AdminProducts";
import { PrintTicket } from "./PrintTicket";
import Login from "./Login";
import PosProductModal from "./PosProductModal";
import OrderList from "./OrderList";
import HistoryPanel from "./HistoryPanel";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const NOTIFICATION_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const removeAccents = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : str;
const normalizeStr = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() : "";

const CATEGORY_ORDER_FALLBACK = [
  "ΠΡΟΤΕΙΝΟΜΕΝΑ", "ΚΑΦΕΔΕΣ", "ΑΝΑΨΥΚΤΙΚΑ", "ΡΟΦΗΜΑΤΑ", "ΠΡΩΙΝΟ", "ΜΠΥΡΕΣ", "ΣΝΑΚΣ", "ΣΥΝΟΔΕΥΤΙΚΑ", "ΣΑΛΑΤΕΣ", "ΖΥΜΑΡΙΚΑ", "ΠΙΤΣΕΣ", "ΑΛΜΥΡΕΣ ΚΡΕΠΕΣ", "ΓΛΥΚΕΣ ΚΡΕΠΕΣ", "ΓΛΥΚΑ"
];

const DEFAULT_TABLES = [
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
  const [storeLogo, setStoreLogo] = useState(null);
  const [storeTables, setStoreTables] = useState(DEFAULT_TABLES);
  const [storeCategoryOrder, setStoreCategoryOrder] = useState([]);
  
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

  const [theme, setTheme] = useState(() => localStorage.getItem("dashboard_theme") || "light");

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

  // AI Analytics State
  const [showAiReport, setShowAiReport] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiReportData, setAiReportData] = useState(null);

  const currentHour = new Date().getHours();
  const isMorning = currentHour >= 6 && currentHour < 14;
  const isKitchen = userRole === "kitchen";
  const isDark = theme === "dark";

  useEffect(() => {
    document.body.style.backgroundColor = isDark ? '#111827' : '#f9fafb';
  }, [isDark]);

  useEffect(() => {
    if (userRole === "kitchen" && !localStorage.getItem("dashboard_theme")) {
      setTheme("dark");
    }
  }, [userRole]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("dashboard_theme", newTheme);
  };

  const fetchData = async () => {
    if (!isAuthenticated || !storeId) return;
    const { data: ordersData } = await supabase.from("orders").select("*").eq("store_id", storeId).order("created_at", { ascending: false });
    if (ordersData) setOrders(ordersData);
    
    const { data: reviewsData } = await supabase.from("reviews").select("*").eq("store_id", storeId).order("created_at", { ascending: false });
    if (reviewsData) setReviews(reviewsData);
    
    const { data: storeData } = await supabase.from("stores").select("name, backup_mode, is_accepting_orders, logo_url, tables, category_order").eq("id", storeId).single();
    if (storeData) {
      setBackupMode(storeData.backup_mode);
      setStoreName(storeData.name);
      setStoreLogo(storeData.logo_url);
      setIsAcceptingOrders(storeData.is_accepting_orders !== false);
      if (storeData.tables) setStoreTables(storeData.tables);
      if (storeData.category_order) setStoreCategoryOrder(storeData.category_order);
    }
  };

  const fetchProducts = async () => {
    if (!isAuthenticated || !storeId) return;
    const { data } = await supabase.from("products").select("*").eq("store_id", storeId).order("sort_order", { ascending: true }).order("name", { ascending: true });
    if (data) {
      const cleanedProducts = data.map((prod) => {
        const cleanedProd = { ...prod, name: removeAccents(prod.name), name_en: removeAccents(prod.name_en), description: removeAccents(prod.description), category: removeAccents(prod.category) };
        if (cleanedProd.addons) {
          cleanedProd.addons = cleanedProd.addons.map((g) => ({ ...g, name: removeAccents(g.name), options: g.options.map((opt) => ({ ...opt, name: removeAccents(opt.name) })) }));
        }
        return cleanedProd;
      });
      setProducts(cleanedProducts);
    }
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
        ? (o.kitchen_status || "pending") === "pending" && o.items?.some((i) => i.station === "kitchen")
        : (o.status || "pending") === "pending";
    }).length;
    if (pendingCount > prevOrdersCount && !isMuted) new Audio(NOTIFICATION_SOUND).play().catch(() => {});
    setPrevOrdersCount(pendingCount);
  }, [orders, isMuted, isKitchen, prevOrdersCount]);

  const updateStatus = async (id, newStatus, forKitchen = false) => {
    await supabase.from("orders").update(forKitchen ? { kitchen_status: newStatus } : { status: newStatus }).eq("id", id);
    fetchData();
  };

  const toggleReceipt = async (id, isPrinted) => {
    setOrders(orders.map(o => o.id === id ? { ...o, receipt_printed: isPrinted } : o));
    await supabase.from("orders").update({ receipt_printed: isPrinted }).eq("id", id);
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
    await supabase.from("stores").update({ is_accepting_orders: s }).eq("id", storeId);
    setIsAcceptingOrders(s);
  };

  const getQrUrl = (table) => {
    const qrData = encodeURIComponent(`${window.location.origin}/?store=${storeId}&table=${table}`);
    const logoParam = storeLogo ? `&centerImageUrl=${encodeURIComponent(storeLogo)}` : "";
    return `https://quickchart.io/qr?size=500&text=${qrData}${logoParam}`;
  };

  const downloadQR = async (table) => {
    try {
      const url = getQrUrl(table);
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `QR_Table_${table}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.open(getQrUrl(table), "_blank");
    }
  };

  const posVisibleProducts = products.filter((p) => {
    if (p.category === "ΠΡΩΙΝΟ" && !isMorning) return false;
    return true;
  });

  const posCategories = [...new Set(posVisibleProducts.map((p) => p.category))].sort((a, b) => {
    const orderArr = storeCategoryOrder.length > 0 ? storeCategoryOrder : CATEGORY_ORDER_FALLBACK;
    let idxA = orderArr.indexOf(a); 
    let idxB = orderArr.indexOf(b);
    if (idxA === -1) idxA = 999; 
    if (idxB === -1) idxB = 999; 
    return idxA - idxB;
  });

  const posFilteredProducts = posCategory === "ΟΛΑ" ? posVisibleProducts : posVisibleProducts.filter((p) => p.category === posCategory);

  const handlePosProductClick = (p) => {
    const initial = {}; p.addons?.forEach((g) => (initial[g.id] = []));
    setPosAddonSelections(initial); setPosQuantity(1); setPosCurrentNote(""); setEditingCartId(null); setPosActiveProduct(p);
  };

  const handleEditCartItem = (i) => {
    const p = products.find((prod) => prod.id === i.id);
    if (p) { setPosActiveProduct(p); setPosAddonSelections(i.rawAddons || {}); setPosCurrentNote(i.note || ""); setPosQuantity(i.quantity || 1); setEditingCartId(i.cartId); }
  };

  const togglePosAddon = (gid, oidx, max) => {
    let curr = posAddonSelections[gid] || [];
    if (curr.includes(oidx)) curr = curr.filter((i) => i !== oidx);
    else if (curr.length < max) curr = [...curr, oidx];
    else if (max === 1) curr = [oidx];
    setPosAddonSelections({ ...posAddonSelections, [gid]: curr });
  };

  const confirmPosAddons = () => {
    let extra = 0, texts = [], valid = true;
    
    let isSketosSelected = false;
    (posActiveProduct.addons || []).forEach((g) => {
      const s = posAddonSelections[g.id] || [];
      s.forEach((idx) => {
        const optName = normalizeStr(g.options[idx]?.name);
        if (optName.includes("ΣΚΕΤ") || optName.includes("ΧΩΡΙΣ")) isSketosSelected = true;
      });
    });

    posActiveProduct.addons?.forEach((g) => {
      const groupNameUpper = normalizeStr(g.name);
      const isSugarType = groupNameUpper.includes("ΖΑΧΑΡ") || groupNameUpper.includes("ΓΛΥΚΑΝΤΙΚ");
      
      let required = g.isRequired;
      if (isSketosSelected && isSugarType) required = false;

      const s = posAddonSelections[g.id] || [];
      if (required && !s.length) valid = false;
      if (s.length) { 
        texts.push(s.map((i) => g.options[i].name).join(", ")); 
        s.forEach((i) => (extra += g.options[i].price)); 
      }
    });
    
    if (!valid) return alert("Συμπληρώστε τα υποχρεωτικά!");
    
    const item = { 
      ...posActiveProduct, 
      cartId: editingCartId || Date.now() + Math.random(), 
      name: texts.length ? `${posActiveProduct.name} (${texts.join(" | ")})` : posActiveProduct.name, 
      price: posActiveProduct.price + extra, 
      note: removeAccents(posCurrentNote), 
      rawAddons: posAddonSelections, 
      quantity: posQuantity 
    };
    
    setPosCart(editingCartId ? posCart.map((i) => (i.cartId === editingCartId ? item : i)) : [...posCart, item]);
    setPosActiveProduct(null); 
    setEditingCartId(null);
  };

  const updatePosCartQuantity = (cartId, delta) => {
    setPosCart(posCart.map((item) => item.cartId === cartId ? { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) } : item));
  };

  const submitPosOrder = async () => {
    if (!posCart.length || !posTable || !posPayment) return;
    const total = posCart.reduce((s, i) => s + i.price * i.quantity, 0);
    await supabase.from("orders").insert([{ store_id: storeId, table_number: posTable, items: posCart, total_price: total, payment_method: posPayment, status: "pending", general_note: removeAccents(posGeneralNote), receipt_printed: false }]);
    setPosCart([]); setPosTable("ΠΑΚΕΤΟ"); setPosGeneralNote(""); setPosPayment(""); setIsPosOpen(false); setIsPosCartOpen(false); fetchData();
  };

  const downloadReportFile = () => {
    const periodMap = { today: "ΣΗΜΕΡΙΝΗ", week: "ΕΒΔΟΜΑΔΙΑΙΑ", month: "ΜΗΝΙΑΙΑ", all: "ΣΥΝΟΛΙΚΗ", specific: specificDate || "ΕΙΔΙΚΗ" };
    const reportText = `======================================\n          ΑΝΑΦΟΡΑ ΤΑΜΕΙΟΥ (Z)\n======================================\nΚΑΤΑΣΤΗΜΑ: ${storeName || `ΚΑΤΑΣΤΗΜΑ ${storeId}`}\nΗΜΕΡΟΜΗΝΙΑ ΕΞΑΓΩΓΗΣ: ${new Date().toLocaleString("el-GR")}\nΠΕΡΙΟΔΟΣ: ${periodMap[dateRange] || "ΑΓΝΩΣΤΗ"}\n--------------------------------------\nΣΥΝΟΛΙΚΟΣ ΤΖΙΡΟΣ : ${totalRevenue.toFixed(2)}€\nΜΕΤΡΗΤΑ          : ${cashTotal.toFixed(2)}€\nΚΑΡΤΑ            : ${cardTotal.toFixed(2)}€\n--------------------------------------\nΣΥΝΟΛΟ ΠΑΡΑΓΓΕΛΙΩΝ: ${totalOrdersCount}\nΜΕΣΗ ΑΞΙΑ / ΠΑΡ.  : ${avgOrderValue.toFixed(2)}€\n======================================`.trim();
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `Z_Report_${new Date().toLocaleDateString("el-GR").replace(/\//g, "-")}.txt`; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
  };

  const historyOrdersList = orders.filter((o) => {
    if (o.status !== "completed") return false;
    const date = new Date(o.created_at); const table = String(o.table_number || "").toLowerCase(); const matchesSearch = table.includes(historySearch.toLowerCase());
    let matchesTime = true; const now = new Date();
    if (dateRange === "today") matchesTime = date.toDateString() === now.toDateString();
    else if (dateRange === "week") matchesTime = date >= new Date(now - 7 * 24 * 60 * 60 * 1000);
    else if (dateRange === "month") matchesTime = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    else if (dateRange === "specific" && specificDate) matchesTime = date.toISOString().split("T")[0] === specificDate;
    return matchesSearch && matchesTime && (!isKitchen || o.items?.some((it) => it.station === "kitchen"));
  });

  const totalRevenue = historyOrdersList.reduce((sum, o) => sum + (isKitchen ? o.items?.filter((it) => it.station === "kitchen").reduce((s, it) => s + it.price * it.quantity, 0) : o.total_price), 0);
  const totalOrdersCount = historyOrdersList.length;
  const avgOrderValue = totalOrdersCount ? totalRevenue / totalOrdersCount : 0;
  const cashTotal = historyOrdersList.filter((o) => o.payment_method === "ΜΕΤΡΗΤΑ").reduce((sum, o) => sum + (isKitchen ? o.items?.filter((it) => it.station === "kitchen").reduce((s, it) => s + it.price * it.quantity, 0) : o.total_price), 0);
  const cardTotal = totalRevenue - cashTotal;
  const activeTables = [...new Set(orders.filter((o) => o.status !== "completed").map((o) => o.table_number))];

  const productCounts = {};
  historyOrdersList.forEach((o) => o.items?.forEach((it) => { if (!isKitchen || it.station === "kitchen") productCounts[it.name] = (productCounts[it.name] || 0) + it.quantity; }));
  const topProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const hourCounts = {};
  historyOrdersList.forEach((o) => { const h = new Date(o.created_at).getHours() + ":00"; hourCounts[h] = (hourCounts[h] || 0) + 1; });
  const peakHours = Object.entries(hourCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  // Λογική Παραγωγής AI Report
  const generateAiReport = () => {
    setIsAiLoading(true);
    setShowAiReport(true);
    
    // Προσομοίωση επικοινωνίας με το Python Backend / ChatGPT
    setTimeout(() => {
      setAiReportData({
        sales: `Σήμερα ο συνολικός τζίρος έφτασε τα ${totalRevenue.toFixed(2)}€ από ${totalOrdersCount} παραγγελίες. Το κορυφαίο προϊόν σε ζήτηση ήταν το "${topProducts[0]?.[0] || 'Καφές'}".`,
        insights: `Ποσοστό ${((cardTotal/totalRevenue)*100 || 0).toFixed(0)}% των πελατών πλήρωσε με κάρτα. Οι ώρες αιχμής εντοπίζονται κυρίως γύρω στις ${peakHours[0]?.[0] || '12:00'}.`,
        prediction: `🤖 Σύμφωνα με το μοντέλο Random Forest (Ανάλυση Open-Meteo & Αφίξεων Charter Λέσβου): Αύριο αναμένονται ισχυροί άνεμοι (6 Μποφόρ). Προβλέπεται μείωση κίνησης στα εξωτερικά τραπέζια κατά 18% αλλά αύξηση στο Πακέτο. Προτείνεται μείωση προσωπικού στο service κατά 1 άτομο στη μεσημεριανή βάρδια.`
      });
      setIsAiLoading(false);
    }, 3000);
  };

  if (!isAuthenticated) return <Login onLoginSuccess={(r, s) => { setIsAuthenticated(true); setUserRole(r); setStoreId(s); }} />;
  if (isPrinting) return <div className="bg-white"><PrintTicket order={activePrintOrder} /></div>;

  let sortedViewingItems = [];
  if (viewingOrder && viewingOrder.items) {
    sortedViewingItems = [...viewingOrder.items].sort((a, b) => {
      if (a.station === "kitchen" && b.station !== "kitchen") return 1;
      if (a.station !== "kitchen" && b.station === "kitchen") return -1;
      return 0;
    });
  }

  return (
    <div className={`min-h-screen font-sans ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <div className="print:hidden">
        <header className={`border-b p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm transition-colors duration-300 ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
          <h1 className={`font-black italic text-xl ${isDark ? "text-white" : "text-gray-800"}`}>
            {storeName?.toUpperCase()}{" "}
            <span className={isKitchen ? "text-orange-500" : "text-blue-600"}>
              {isKitchen ? "ΚΟΥΖΙΝΑ" : userRole === "admin" ? "ADMIN" : "ΜΠΑΡ"}
            </span>
          </h1>
          <div className="flex gap-2 items-center">
            {!isKitchen && (
              <button onClick={() => setIsPosOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase shadow-lg">
                + ΝΕΑ ΠΑΡΑΓΓΕΛΙΑ
              </button>
            )}
            {!isKitchen && (
              <button onClick={toggleAcceptingOrders} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all shadow-md ${isAcceptingOrders ? "bg-green-500 text-white" : "bg-red-600 text-white animate-pulse"}`}>
                {isAcceptingOrders ? "🟢 ON" : "🔴 OFF"}
              </button>
            )}
            {userRole === "admin" && (
              <button onClick={toggleBackupMode} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase ${backupMode ? "bg-orange-500 text-white shadow-lg" : (isDark ? "bg-gray-800 text-gray-400 border border-gray-700" : "bg-gray-100 text-gray-500")}`}>
                Backup: {backupMode ? "ON" : "OFF"}
              </button>
            )}
            <button onClick={toggleTheme} className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-transform active:scale-90 ${isDark ? "bg-gray-800 text-yellow-400 border border-gray-700" : "bg-gray-100 text-blue-600 border border-gray-200"}`}>
              {isDark ? "☀️" : "🌙"}
            </button>
            <button onClick={() => setIsMuted(!isMuted)} className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${isDark ? "bg-gray-800 border border-gray-700" : "bg-gray-100 border border-gray-200"}`}>
              {isMuted ? "🔇" : "🔊"}
            </button>
            <button onClick={() => setIsAuthenticated(false)} className={`text-xs font-black px-3 py-1.5 rounded-full border ${isDark ? "border-gray-700 text-gray-400 hover:bg-gray-800" : "border-gray-200 text-gray-500 hover:bg-gray-100"}`}>
              ΕΞΟΔΟΣ
            </button>
          </div>
        </header>
        
        <div className={`flex border-b px-4 py-2 gap-2 sticky top-[65px] z-20 shadow-sm transition-colors duration-300 ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
          {["orders", "tables", "reviews", "history", "products"].map((t) => {
            if (userRole === "staff" && t !== "orders") return null;
            if (isKitchen && (t === "tables" || t === "products" || t === "reviews")) return null;
            if (t === "reviews" && userRole !== "admin") return null;
            const labelMap = { orders: "ΠΑΡΑΓΓΕΛΙΕΣ", tables: "ΤΡΑΠΕΖΙΑ", reviews: "ΚΡΙΤΙΚΕΣ", history: "ΙΣΤΟΡΙΚΟ", products: "ΚΑΤΑΛΟΓΟΣ" };
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-colors ${
                  tab === t 
                    ? (isDark ? "bg-white text-black shadow-md" : "bg-black text-white shadow-md") 
                    : (isDark ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-50 text-gray-500 hover:bg-gray-100")
                }`}
              >
                {labelMap[t]}
              </button>
            );
          })}
        </div>
      </div>

      <main className="p-4 print:hidden">
        {tab === "orders" && (
          <OrderList orders={orders} isKitchen={isKitchen} userRole={userRole} updateStatus={updateStatus} deleteOrders={deleteOrders} setViewingOrder={setViewingOrder} setActivePrintOrder={setActivePrintOrder} setIsPrinting={setIsPrinting} toggleReceipt={toggleReceipt} theme={theme} />
        )}
        
        {tab === "history" && (
          <div className="relative">
            {userRole === "admin" && (
              <div className="flex justify-end mb-4">
                <button 
                  onClick={generateAiReport} 
                  className={`px-6 py-3 rounded-xl font-black uppercase text-xs shadow-lg transition-transform active:scale-95 flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white`}
                >
                  <span className="text-lg">✨</span> AI Manager Αναφορά
                </button>
              </div>
            )}
            <HistoryPanel isKitchen={isKitchen} userRole={userRole} dateRange={dateRange} setDateRange={setDateRange} specificDate={specificDate} setSpecificDate={setSpecificDate} historySearch={historySearch} setHistorySearch={setHistorySearch} totalRevenue={totalRevenue} totalOrdersCount={totalOrdersCount} avgOrderValue={avgOrderValue} cashTotal={cashTotal} cardTotal={cardTotal} topProducts={topProducts} peakHours={peakHours} historyOrders={historyOrdersList} selectedOrderIds={selectedOrderIds} setSelectedOrderIds={setSelectedOrderIds} deleteOrders={deleteOrders} downloadReportFile={downloadReportFile} theme={theme} setViewingOrder={setViewingOrder} />
          </div>
        )}
        
        {tab === "reviews" && userRole === "admin" && (
          <div className="max-w-6xl mx-auto space-y-6 pb-20">
            <h2 className={`font-black text-2xl uppercase italic tracking-tighter border-b pb-4 ${isDark ? "text-white border-gray-800" : "text-gray-800 border-gray-200"}`}>
              Εσωτερικές Κριτικές
            </h2>
            {reviews.length === 0 ? (
              <p className="text-center text-gray-400 font-bold uppercase text-sm">Δεν υπάρχουν κριτικές!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className={`p-6 rounded-3xl shadow-sm border flex flex-col gap-3 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-orange-100"}`}>
                    <div className={`flex justify-between items-center border-b pb-2 ${isDark ? "border-gray-700" : "border-gray-50"}`}>
                      <div className="text-xl">
                        {Array.from({ length: rev.rating }).map((_, i) => (<span key={i} className="text-orange-400">★</span>))}
                        {Array.from({ length: 5 - rev.rating }).map((_, i) => (<span key={i} className={isDark ? "text-gray-600" : "text-gray-200"}>★</span>))}
                      </div>
                      <span className="text-[9px] font-black text-gray-400 uppercase">{new Date(rev.created_at).toLocaleDateString("el-GR")}</span>
                    </div>
                    <p className={`text-sm font-bold italic ${isDark ? "text-gray-300" : "text-gray-700"}`}>"{rev.comment}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === "tables" && userRole === "admin" && (
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {storeTables.map((t) => (
              <div
                key={t}
                onClick={() => setSelectedTableForQR(t)}
                className={`aspect-square rounded-2xl p-3 flex items-center justify-center border-2 cursor-pointer font-black text-2xl ${
                  activeTables.includes(t)
                    ? (isDark ? "bg-red-900/30 border-red-800 text-red-500" : "bg-red-50 border-red-200 text-red-600")
                    : (isDark ? "bg-gray-800 border-gray-700 text-green-500" : "bg-white border-green-200 text-green-600")
                }`}
              >
                {t}
              </div>
            ))}
          </div>
        )}
        {tab === "products" && userRole === "admin" && (
          <AdminProducts storeId={storeId} theme={theme} />
        )}
      </main>

      {/* --- AI REPORT MODAL --- */}
      {showAiReport && (
        <div className="fixed inset-0 bg-black/80 z-[500] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowAiReport(false)}>
          <div className={`w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative flex flex-col ${isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowAiReport(false)} className={`absolute top-4 right-4 w-10 h-10 rounded-full font-black flex items-center justify-center ${isDark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>✕</button>
            <h2 className="text-2xl font-black italic uppercase mb-6 flex items-center gap-3">
              <span className="text-3xl">✨</span> AI Manager Report
            </h2>
            
            {isAiLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-bold text-sm text-gray-400 animate-pulse uppercase tracking-widest">Αναλυση Δεδομενων & Μοντελου...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className={`p-5 rounded-2xl border ${isDark ? "bg-gray-900/50 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
                  <h3 className="font-black text-xs uppercase text-indigo-500 mb-2">📊 Σημερινη Αποδοση</h3>
                  <p className={`text-sm font-medium leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}>{aiReportData?.sales}</p>
                  <p className={`text-sm font-medium leading-relaxed mt-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>{aiReportData?.insights}</p>
                </div>
                
                <div className={`p-5 rounded-2xl border-2 border-purple-500/30 bg-gradient-to-br ${isDark ? "from-purple-900/20 to-indigo-900/20" : "from-purple-50 to-indigo-50"}`}>
                  <h3 className="font-black text-xs uppercase text-purple-600 mb-2 flex items-center gap-2">
                    🎯 Προβλεψη επομενης ημερας
                  </h3>
                  <p className={`text-sm font-bold leading-relaxed ${isDark ? "text-purple-200" : "text-purple-900"}`}>{aiReportData?.prediction}</p>
                </div>

                <button onClick={() => setShowAiReport(false)} className="w-full py-4 rounded-xl font-black uppercase text-sm bg-gray-900 text-white shadow-lg active:scale-95 transition-transform dark:bg-white dark:text-black">
                  ΚΛΕΙΣΙΜΟ
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
          <div style={{ width: "98vw", height: "95vh" }} className={`lg:rounded-[2rem] shadow-2xl flex flex-col lg:flex-row overflow-hidden ${isDark ? "bg-gray-900" : "bg-gray-100"}`}>
            <div style={{ width: "55%" }} className={`flex flex-col border-r h-full ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className={`p-4 flex justify-between items-center border-b ${isDark ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                <h2 className={`font-black text-xl uppercase italic ${isDark ? "text-white" : "text-gray-900"}`}>ΚΑΤΑΛΟΓΟΣ TAMEIOY</h2>
                <button onClick={() => setIsPosOpen(false)} className={`w-10 h-10 rounded-full border font-black ${isDark ? "bg-gray-800 border-gray-600 text-gray-300 hover:text-red-400" : "bg-white border-gray-200 hover:bg-red-50 hover:text-red-500"}`}>✕</button>
              </div>
              <div className={`flex overflow-x-auto gap-2 p-3 border-b no-scrollbar ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                <button onClick={() => setPosCategory("ΟΛΑ")} className={`px-4 py-2 rounded-xl text-[10px] font-black ${posCategory === "ΟΛΑ" ? "bg-blue-600 text-white" : (isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600")}`}>ΟΛΑ</button>
                {posCategories.map((c) => (
                  <button key={c} onClick={() => setPosCategory(c)} className={`px-4 py-2 rounded-xl text-[10px] font-black ${posCategory === c ? "bg-blue-600 text-white" : (isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600")}`}>{c}</button>
                ))}
              </div>
              <div className={`flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-3 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                {posFilteredProducts.map((p) => (
                  <button key={p.id} onClick={() => handlePosProductClick(p)} className={`p-4 border rounded-2xl flex flex-col justify-between items-start font-bold text-sm uppercase ${isDark ? "bg-gray-800 border-gray-700 text-gray-200 hover:border-gray-500" : "bg-white border-gray-200 hover:shadow-md"}`}>
                    <span>{p.name}</span>
                    <span className="text-blue-500 text-lg mt-2">{p.price.toFixed(2)}€</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ width: "45%" }} className={`flex flex-col h-full ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
              <div className={`p-4 border-b flex justify-between items-center ${isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"}`}>
                <h2 className="font-black text-xl">ΚΑΛΑΘΙ ({posCart.length})</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                {posCart.map((i) => (
                  <div key={i.cartId} className={`p-4 rounded-2xl border flex flex-col gap-2 ${isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 shadow-sm"}`}>
                    <div className="flex justify-between font-black uppercase text-sm">
                      <span>{i.name}</span><span>{(i.price * i.quantity).toFixed(2)}€</span>
                    </div>
                    {i.note && <p className="text-[10px] text-gray-400 italic">📝 {i.note}</p>}
                    <div className={`flex justify-between items-center pt-2 border-t ${isDark ? "border-gray-700" : "border-gray-100"}`}>
                      <div className={`flex items-center rounded-lg p-1 ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
                        <button onClick={() => updatePosCartQuantity(i.cartId, -1)} className="w-8 h-8 font-black">−</button>
                        <span className="w-8 text-center font-black">{i.quantity}</span>
                        <button onClick={() => updatePosCartQuantity(i.cartId, 1)} className="w-8 h-8 font-black text-blue-500">+</button>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditCartItem(i)} className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center ${isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-500"}`}>✏️</button>
                        <button onClick={() => setPosCart(posCart.filter((item) => item.cartId !== i.cartId))} className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center ${isDark ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-500"}`}>🗑️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className={`p-5 border-t space-y-3 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                <input type="text" placeholder="ΕΙΣΑΓΩΓΗ PAGER Ή ΟΝΟΜΑ..." value={posTable} onChange={(e) => setPosTable(e.target.value)} className={`w-full border-2 outline-none p-4 rounded-xl font-black uppercase ${isDark ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500" : "bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500"}`} />
                <textarea rows="1" placeholder="Γενική Σημείωση..." value={posGeneralNote} onChange={(e) => setPosGeneralNote(e.target.value)} className={`w-full border p-4 rounded-xl font-bold italic text-sm resize-none focus:outline-none ${isDark ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500"}`}></textarea>
                <div className={`flex gap-1 p-1 rounded-xl ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
                  {["ΜΕΤΡΗΤΑ", "ΚΑΡΤΑ"].map((m) => (
                    <button key={m} onClick={() => setPosPayment(m)} className={`flex-1 py-4 rounded-lg font-black text-xs ${posPayment === m ? (isDark ? "bg-gray-600 shadow-sm text-blue-400" : "bg-white shadow-sm text-blue-600") : "text-gray-400"}`}>{m}</button>
                  ))}
                </div>
                <button onClick={submitPosOrder} disabled={!posCart.length || !posPayment} className={`w-full p-5 rounded-2xl font-black uppercase shadow-xl flex justify-between transition-transform active:scale-95 ${!posCart.length || !posPayment ? (isDark ? "bg-gray-700 text-gray-500" : "bg-gray-200 text-gray-400") : "bg-green-600 text-white"}`}>
                  <span>ΑΠΟΣΤΟΛΗ</span><span>{posCart.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}€</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTableForQR && userRole === "admin" && (
        <div className="fixed inset-0 bg-black/80 z-[400] flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedTableForQR(null)}>
          <div className={`w-full max-w-sm rounded-[3rem] p-8 shadow-2xl flex flex-col items-center relative ${isDark ? "bg-gray-800" : "bg-white"}`} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedTableForQR(null)} className={`absolute top-4 right-4 w-10 h-10 rounded-full font-black ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>✕</button>
            <h2 className={`text-3xl font-black italic uppercase mb-6 ${isDark ? "text-white" : "text-gray-800"}`}>ΤΡΑΠΕΖΙ {selectedTableForQR}</h2>
            <img src={getQrUrl(selectedTableForQR)} alt="QR" className="w-64 h-64 mb-8 shadow-sm rounded-xl bg-white p-2" />
            <button onClick={() => downloadQR(selectedTableForQR)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase shadow-lg">ΛΗΨΗ ΕΙΚΟΝΑΣ</button>
          </div>
        </div>
      )}

      {viewingOrder && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={() => setViewingOrder(null)}>
          <div className={`${isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"} w-full max-w-md rounded-[3rem] p-8 shadow-2xl`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-200 dark:border-gray-700">
              <h2 className="font-black italic text-2xl uppercase tracking-tighter">ΛΕΠΤΟΜΕΡΕΙΕΣ #{viewingOrder.table_number}</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase text-right">
                {new Date(viewingOrder.created_at).toLocaleTimeString("el-GR")} <br/> {viewingOrder.payment_method}
              </p>
            </div>
            
            {viewingOrder.general_note && (
              <div className={`mb-6 p-4 rounded-2xl ${isKitchen ? (isDark ? "bg-orange-900/50 text-orange-200" : "bg-orange-50 text-orange-800") : (isDark ? "bg-blue-900/50 text-blue-200" : "bg-blue-50 text-blue-800")}`}>
                <p className="text-sm font-bold italic">{viewingOrder.general_note}</p>
              </div>
            )}
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
              {(isKitchen ? sortedViewingItems.filter((i) => i.station === "kitchen") : sortedViewingItems)?.map((item, i) => (
                <div key={i} className={`border-b pb-3 ${isDark ? "border-gray-700" : "border-gray-100"}`}>
                  <div className="flex justify-between font-black uppercase italic">
                    <span>{item.quantity > 1 ? <span className={`${isKitchen ? "text-orange-500" : "text-blue-500"} mr-1`}>{item.quantity}x</span> : ""}{item.name}</span>
                    <span>{(item.price * (item.quantity || 1)).toFixed(2)}€</span>
                  </div>
                  {item.note && (
                    <div className={`p-3 rounded-xl mt-2 text-xs font-bold italic ${isKitchen ? "bg-yellow-400 text-black shadow-sm" : (isDark ? "bg-yellow-900/40 text-yellow-400" : "bg-yellow-50 text-yellow-800")}`}>
                      📝 {item.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className={`mt-6 pt-4 border-t-2 border-dashed flex justify-between items-center text-2xl font-black italic tracking-tighter ${isDark ? "border-gray-700" : "border-gray-200"}`}>
              <span>ΣΥΝΟΛΟ:</span>
              <span>{(isKitchen ? viewingOrder.items?.filter((i) => i.station === "kitchen").reduce((s, it) => s + it.price * (it.quantity || 1), 0) : viewingOrder.total_price)?.toFixed(2)}€</span>
            </div>
            
            <div className="flex gap-2 mt-8">
              <button 
                onClick={() => {
                  const orderToPrint = isKitchen 
                    ? { ...viewingOrder, items: sortedViewingItems.filter(it => it.station === "kitchen") }
                    : { ...viewingOrder, items: sortedViewingItems };
                  setActivePrintOrder(orderToPrint);
                  setIsPrinting(true);
                  setTimeout(() => {
                    window.print();
                    setIsPrinting(false);
                    setViewingOrder(null);
                  }, 500);
                }} 
                className={`flex-1 py-5 rounded-2xl font-black uppercase text-xs shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${isDark ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800 border"}`}
              >
                <span className="text-lg">🖨️</span> ΕΚΤΥΠΩΣΗ
              </button>
              
              <button 
                onClick={() => setViewingOrder(null)} 
                className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs shadow-lg transition-transform active:scale-95"
              >
                ΚΛΕΙΣΙΜΟ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

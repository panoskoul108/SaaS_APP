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

// Συνάρτηση αφαίρεσης τόνων
const removeAccents = (str) => {
  if (!str) return str;
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

// Η ΙΔΑΝΙΚΗ ΣΕΙΡΑ ΤΩΝ ΚΑΤΗΓΟΡΙΩΝ ΣΤΟ POS
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

  // POS (Ταμείο) State
  const [isPosOpen, setIsPosOpen] = useState(false);
  const [isPosCartOpen, setIsPosCartOpen] = useState(false); // Για κινητά
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

  // --- ΛΟΓΙΚΗ ΓΙΑ ΤΗΝ ΩΡΑ (ΓΙΑ ΤΟ ΠΡΩΙΝΟ) ---
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  useEffect(() => {
    const interval = setInterval(
      () => setCurrentHour(new Date().getHours()),
      60000
    );
    return () => clearInterval(interval);
  }, []);
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

    if (data) {
      // Καθαρίζουμε τους τόνους
      const cleanedProducts = data.map((prod) => {
        const cleanedProd = {
          ...prod,
          name: removeAccents(prod.name),
          name_en: removeAccents(prod.name_en),
          description: removeAccents(prod.description),
          category: removeAccents(prod.category),
        };
        if (cleanedProd.addons) {
          cleanedProd.addons = cleanedProd.addons.map((g) => ({
            ...g,
            name: removeAccents(g.name),
            options: g.options.map((opt) => ({
              ...opt,
              name: removeAccents(opt.name),
            })),
          }));
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

  const toggleAcceptingOrders = async () => {
    const newStatus = !isAcceptingOrders;
    await supabase
      .from("stores")
      .update({ is_accepting_orders: newStatus })
      .eq("id", storeId);
    setIsAcceptingOrders(newStatus);
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

  // --- POS ΦΙΛΤΡΑ & ΚΑΤΗΓΟΡΙΕΣ ---
  const posVisibleProducts = products.filter((p) => {
    if (p.category === "ΠΡΩΙΝΟ" && !isMorning) return false;
    return true;
  });

  const posCategories = [
    ...new Set(posVisibleProducts.map((p) => p.category)),
  ].sort((a, b) => {
    let idxA = CATEGORY_ORDER.indexOf(a);
    let idxB = CATEGORY_ORDER.indexOf(b);
    if (idxA === -1) idxA = 999;
    if (idxB === -1) idxB = 999;
    return idxA - idxB;
  });

  const posFilteredProducts =
    posCategory === "ΟΛΑ"
      ? posVisibleProducts
      : posVisibleProducts.filter((p) => p.category === posCategory);

  const handlePosProductClick = (product) => {
    const initialSels = {};
    if (product.addons) {
      product.addons.forEach((g) => (initialSels[g.id] = []));
    }
    setPosAddonSelections(initialSels);
    setPosQuantity(1);
    setPosCurrentNote("");
    setEditingCartId(null);
    setPosActiveProduct(product);
  };

  const handleEditCartItem = (cartItem) => {
    const originalProduct = products.find((p) => p.id === cartItem.id);
    if (!originalProduct) return;

    setPosActiveProduct(originalProduct);
    setPosAddonSelections(cartItem.rawAddons || {});
    setPosCurrentNote(cartItem.note || "");
    setPosQuantity(cartItem.quantity || 1);
    setEditingCartId(cartItem.cartId);
  };

  const togglePosAddon = (groupId, optionIndex, maxSelections) => {
    let current = posAddonSelections[groupId] || [];
    if (current.includes(optionIndex)) {
      current = current.filter((i) => i !== optionIndex);
    } else {
      if (current.length >= maxSelections) {
        if (maxSelections === 1) current = [optionIndex];
        else return;
      } else {
        current = [...current, optionIndex];
      }
    }
    setPosAddonSelections({ ...posAddonSelections, [groupId]: current });
  };

  const confirmPosAddons = () => {
    let extraPrice = 0;
    let addonTexts = [];
    let isValid = true;

    (posActiveProduct.addons || []).forEach((g) => {
      const sels = posAddonSelections[g.id] || [];
      if (g.isRequired && sels.length === 0) isValid = false;
      if (sels.length > 0) {
        const names = sels.map((idx) => g.options[idx].name);
        addonTexts.push(`${names.join(", ")}`);
        sels.forEach((idx) => (extraPrice += g.options[idx].price));
      }
    });

    if (!isValid) {
      alert("Παρακαλώ συμπληρώστε όλες τις υποχρεωτικές επιλογές!");
      return;
    }

    const finalName =
      addonTexts.length > 0
        ? `${posActiveProduct.name} (${addonTexts.join(" | ")})`
        : posActiveProduct.name;

    const finalPrice = posActiveProduct.price + extraPrice;

    if (editingCartId) {
      const updatedItem = {
        ...posActiveProduct,
        cartId: editingCartId,
        name: finalName,
        price: finalPrice,
        note: removeAccents(posCurrentNote),
        rawAddons: posAddonSelections,
        quantity: posQuantity,
      };
      setPosCart(
        posCart.map((item) =>
          item.cartId === editingCartId ? updatedItem : item
        )
      );
    } else {
      const newItem = {
        ...posActiveProduct,
        cartId: Date.now() + Math.random(),
        name: finalName,
        price: finalPrice,
        note: removeAccents(posCurrentNote),
        rawAddons: posAddonSelections,
        quantity: posQuantity,
      };
      setPosCart([...posCart, newItem]);
    }

    setPosActiveProduct(null);
    setEditingCartId(null);
  };

  const updatePosCartQuantity = (cartId, delta) => {
    setPosCart(
      posCart.map((item) => {
        if (item.cartId === cartId) {
          const newQ = Math.max(1, (item.quantity || 1) + delta);
          return { ...item, quantity: newQ };
        }
        return item;
      })
    );
  };

  const removeFromPosCart = (cartId) => {
    setPosCart(posCart.filter((item) => item.cartId !== cartId));
    // Αν αδειάσει το καλάθι στο κινητό, κλείσε το modal του καλαθιού
    if (posCart.length === 1) setIsPosCartOpen(false);
  };

  const submitPosOrder = async () => {
    if (posCart.length === 0 || !posTable || !posPayment) return;

    const calculatedTotal = posCart.reduce(
      (s, i) => s + i.price * (i.quantity || 1),
      0
    );

    const newOrder = {
      store_id: storeId,
      table_number: posTable,
      items: posCart,
      total_price: calculatedTotal,
      payment_method: posPayment,
      status: "pending",
      general_note: removeAccents(posGeneralNote),
    };

    await supabase.from("orders").insert([newOrder]);

    setPosCart([]);
    setPosTable("ΠΑΚΕΤΟ");
    setPosGeneralNote("");
    setPosPayment("");
    setIsPosOpen(false);
    setIsPosCartOpen(false);
    fetchData();
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

  const totalRevenue = historyOrders.reduce((sum, o) => {
    if (isKitchen) {
      const kitchenSum =
        o.items
          ?.filter((it) => it.station === "kitchen")
          .reduce((s, it) => s + it.price * (it.quantity || 1), 0) || 0;
      return sum + kitchenSum;
    }
    return sum + (o.total_price || 0);
  }, 0);

  const cashTotal = historyOrders.reduce((sum, o) => {
    if (o.payment_method !== "ΜΕΤΡΗΤΑ") return sum;
    if (isKitchen) {
      return (
        sum +
        (o.items
          ?.filter((it) => it.station === "kitchen")
          .reduce((s, it) => s + it.price * (it.quantity || 1), 0) || 0)
      );
    }
    return sum + (o.total_price || 0);
  }, 0);

  const cardTotal = historyOrders.reduce((sum, o) => {
    if (o.payment_method === "ΚΑΡΤΑ") {
      if (isKitchen) {
        return (
          sum +
          (o.items
            ?.filter((it) => it.station === "kitchen")
            .reduce((s, it) => s + it.price * (it.quantity || 1), 0) || 0)
        );
      }
      return sum + (o.total_price || 0);
    }
    return sum;
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
      if (isKitchen && item.station !== "kitchen") return;
      productCounts[item.name] =
        (productCounts[item.name] || 0) + (item.quantity || 1);
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

  const downloadReportFile = () => {
    const periodMap = {
      today: "ΣΗΜΕΡΙΝΗ",
      week: "ΕΒΔΟΜΑΔΙΑΙΑ",
      month: "ΜΗΝΙΑΙΑ",
      all: "ΣΥΝΟΛΙΚΗ",
      specific: specificDate || "ΕΙΔΙΚΗ",
    };

    const reportText = `
======================================
         ΑΝΑΦΟΡΑ ΤΑΜΕΙΟΥ (Z)
======================================
ΚΑΤΑΣΤΗΜΑ: ${storeName || `ΚΑΤΑΣΤΗΜΑ ${storeId}`}
ΗΜΕΡΟΜΗΝΙΑ ΕΞΑΓΩΓΗΣ: ${new Date().toLocaleString("el-GR")}
ΠΕΡΙΟΔΟΣ: ${periodMap[dateRange] || "ΑΓΝΩΣΤΗ"}
--------------------------------------
ΣΥΝΟΛΙΚΟΣ ΤΖΙΡΟΣ : ${totalRevenue.toFixed(2)}€
ΜΕΤΡΗΤΑ          : ${cashTotal.toFixed(2)}€
ΚΑΡΤΑ            : ${cardTotal.toFixed(2)}€
--------------------------------------
ΣΥΝΟΛΟ ΠΑΡΑΓΓΕΛΙΩΝ: ${totalOrdersCount}
ΜΕΣΗ ΑΞΙΑ / ΠΑΡ.  : ${avgOrderValue.toFixed(2)}€
======================================
    `.trim();

    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    const dateStr = new Date().toLocaleDateString("el-GR").replace(/\//g, "-");
    link.download = `Z_Report_${dateStr}.txt`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
            <p className="text-xs font-bold mt-1">
              Δικαιούται δώρο με αυτή την παραγγελία!
            </p>
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
            <span className="font-black text-[9px] uppercase tracking-widest">
              ΣΗΜΕΙΩΣΗ:
            </span>
            <p className="text-xs font-bold italic">{order.general_note}</p>
          </div>
        )}

        {!isKitchen && hasKitchenItem && (
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

          {currentStatus === "ready" &&
            !isKitchen &&
            (hasKitchenItem && !kitchenIsReady ? (
              <button
                disabled
                className="w-full bg-orange-50 text-orange-600 py-4 rounded-xl font-black text-[10px] uppercase border-2 border-orange-200 cursor-not-allowed opacity-80"
              >
                ⏳ ΑΝΑΜΟΝΗ ΚΟΥΖΙΝΑΣ
              </button>
            ) : (
              <button
                onClick={() => updateStatus(order.id, "completed", false)}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-green-700 transition-colors"
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
    <div
      className={`min-h-screen font-sans print:bg-white ${
        isKitchen ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <div className="print:hidden">
        <header
          className={`border-b p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm overflow-x-auto no-scrollbar ${
            isKitchen ? "bg-gray-900 border-gray-800" : "bg-white"
          }`}
        >
          <h1
            className={`font-black italic text-xl tracking-tighter shrink-0 mr-4 ${
              isKitchen ? "text-white" : "text-gray-800"
            }`}
          >
            {storeName ? storeName.toUpperCase() : `ΜΑΓΑΖΙ ${storeId}`}{" "}
            <span className={isKitchen ? "text-orange-500" : "text-blue-600"}>
              {isKitchen ? "KITCHEN" : userRole === "admin" ? "ADMIN" : "STAFF"}
            </span>
          </h1>
          <div className="flex gap-2 items-center shrink-0">
            {!isKitchen && (
              <button
                onClick={() => setIsPosOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <span className="text-sm">+</span> ΝΕΑ ΠΑΡΑΓΓΕΛΙΑ
              </button>
            )}

            {!isKitchen && (
              <button
                onClick={toggleAcceptingOrders}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all shadow-md ${
                  isAcceptingOrders
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-red-600 text-white hover:bg-red-700 animate-pulse"
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
          {["orders", "tables", "reviews", "history", "products"].map((t) => {
            if (userRole === "staff" && t !== "orders") return null;
            if (
              isKitchen &&
              (t === "tables" || t === "products" || t === "reviews")
            )
              return null;
            if (t === "reviews" && userRole !== "admin") return null;

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
                  : t === "reviews"
                  ? "ΚΡΙΤΙΚΕΣ"
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

        {tab === "reviews" && userRole === "admin" && (
          <div className="max-w-6xl mx-auto space-y-6 pb-20">
            <h2 className="font-black text-2xl uppercase italic tracking-tighter text-gray-800 border-b pb-4">
              Εσωτερικες Κριτικες
            </h2>
            {reviews.length === 0 ? (
              <p className="text-center text-gray-400 font-bold mt-10 uppercase text-sm">
                Δεν υπαρχουν αρνητικες κριτικες! 🎉
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100 flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                      <div className="text-xl">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <span key={i} className="text-orange-400">
                            ★
                          </span>
                        ))}
                        {Array.from({ length: 5 - rev.rating }).map((_, i) => (
                          <span key={i} className="text-gray-200">
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        {new Date(rev.created_at).toLocaleDateString("el-GR")}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-gray-700 italic">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            )}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`p-4 rounded-[2rem] flex justify-between items-center shadow-sm border ${
                  isKitchen
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-green-50 border-green-200 text-green-800"
                }`}
              >
                <span className="font-black text-[10px] uppercase tracking-widest">
                  💵 ΜΕΤΡΗΤΑ
                </span>
                <span className="font-black text-2xl">
                  {cashTotal.toFixed(2)}€
                </span>
              </div>
              <div
                className={`p-4 rounded-[2rem] flex justify-between items-center shadow-sm border ${
                  isKitchen
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-blue-50 border-blue-200 text-blue-800"
                }`}
              >
                <span className="font-black text-[10px] uppercase tracking-widest">
                  💳 ΚΑΡΤΑ
                </span>
                <span className="font-black text-2xl">
                  {cardTotal.toFixed(2)}€
                </span>
              </div>

              <button
                onClick={downloadReportFile}
                className="bg-gray-900 text-white p-4 rounded-[2rem] shadow-lg font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
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
                    const orderTotal = isKitchen
                      ? o.items
                          ?.filter((it) => it.station === "kitchen")
                          .reduce(
                            (s, it) => s + it.price * (it.quantity || 1),
                            0
                          )
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

      {/* --- ΠΑΡΑΘΥΡΟ QUICK POS (ΝΕΑ ΠΑΡΑΓΓΕΛΙΑ) --- */}
      {isPosOpen && (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center md:p-4 print:hidden animate-fade-in">
          <div className="bg-gray-100 w-full h-full md:max-w-6xl md:h-[90vh] md:rounded-[2rem] flex flex-col md:flex-row overflow-hidden shadow-2xl animate-slide-up relative">
            {/* -- ΑΡΙΣΤΕΡΗ ΠΛΕΥΡΑ: ΠΡΟΪΟΝΤΑ -- */}
            <div
              className={`flex-1 flex-col bg-white h-full ${
                isPosCartOpen ? "hidden md:flex" : "flex"
              }`}
            >
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h2 className="font-black text-lg italic uppercase text-gray-800">
                  ΚΑΤΑΛΟΓΟΣ TAMEIOY
                </h2>
                <button
                  onClick={() => setIsPosOpen(false)}
                  className="w-10 h-10 bg-gray-200 rounded-full flex justify-center items-center font-bold text-gray-600 hover:bg-gray-300 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="flex overflow-x-auto gap-2 p-3 bg-white border-b border-gray-100 no-scrollbar shadow-sm z-10">
                <button
                  onClick={() => setPosCategory("ΟΛΑ")}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${
                    posCategory === "ΟΛΑ"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  ΟΛΑ
                </button>
                {posCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setPosCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${
                      posCategory === cat
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 bg-gray-50 pb-28 md:pb-4">
                {posFilteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePosProductClick(p)}
                    className="bg-white p-4 border border-gray-200 rounded-2xl flex flex-col justify-between items-start hover:border-blue-500 hover:shadow-md transition-all active:scale-95 min-h-[100px]"
                  >
                    <span className="font-bold text-sm text-left uppercase text-gray-800 leading-tight mb-2">
                      {p.name}
                    </span>
                    <span className="text-blue-600 font-black text-lg">
                      {p.price.toFixed(2)}€
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* -- ΔΕΞΙΑ ΠΛΕΥΡΑ: ΚΑΛΑΘΙ ΤΑΜΕΙΟΥ -- */}
            <div
              className={`w-full md:w-96 bg-gray-50 flex-col border-l border-gray-200 shadow-xl z-20 h-full ${
                isPosCartOpen ? "flex" : "hidden md:flex"
              }`}
            >
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm">
                <h2 className="font-black text-lg italic uppercase text-gray-800">
                  ΚΑΛΑΘΙ ({posCart.length})
                </h2>
                <div className="flex gap-2">
                  {/* Κουμπί για κλείσιμο του καλαθιού στα κινητά */}
                  <button
                    onClick={() => setIsPosCartOpen(false)}
                    className="md:hidden w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex justify-center items-center font-bold text-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                  {/* Κουμπί για κλείσιμο όλου του POS (μόνο στο Desktop φαίνεται εδώ) */}
                  <button
                    onClick={() => setIsPosOpen(false)}
                    className="hidden md:flex w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full justify-center items-center font-bold text-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                {posCart.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 font-black uppercase text-sm italic opacity-50">
                    ΤΟ ΚΑΛΑΘΙ ΕΙΝΑΙ ΑΔΕΙΟ
                  </div>
                ) : (
                  posCart.map((item) => (
                    <div
                      key={item.cartId}
                      className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                      <div className="flex justify-between items-start mb-2 pl-2">
                        <span className="font-black text-xs uppercase text-gray-800 pr-2 flex-1 leading-tight">
                          {item.name}
                        </span>
                        <span className="font-black text-blue-600 text-sm">
                          {(item.price * (item.quantity || 1)).toFixed(2)}€
                        </span>
                      </div>

                      {item.note && (
                        <div className="pl-2 mb-2">
                          <span className="text-[10px] text-gray-500 font-bold italic bg-gray-50 p-1.5 rounded-lg border border-gray-100 block">
                            📝 {item.note}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pl-2 pt-2 border-t border-gray-100 mt-1">
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() =>
                              updatePosCartQuantity(item.cartId, -1)
                            }
                            className="w-6 h-6 flex items-center justify-center font-black text-gray-600 active:scale-90 transition-transform"
                          >
                            −
                          </button>
                          <span className="font-black text-xs w-6 text-center">
                            {item.quantity || 1}
                          </span>
                          <button
                            onClick={() =>
                              updatePosCartQuantity(item.cartId, 1)
                            }
                            className="w-6 h-6 flex items-center justify-center font-black text-blue-600 active:scale-90 transition-transform"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditCartItem(item)}
                            className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => removeFromPosCart(item.cartId)}
                            className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-white border-t border-gray-200 space-y-3 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                <input
                  type="text"
                  placeholder="ΤΡΑΠΕΖΙ ή ΟΝΟΜΑ (ΠΑΚΕΤΟ)"
                  value={posTable}
                  onChange={(e) => setPosTable(e.target.value)}
                  className="w-full border-2 border-gray-200 p-3 rounded-xl font-black uppercase text-sm focus:outline-none focus:border-blue-500"
                />

                <textarea
                  rows="1"
                  placeholder="Γενική Σημείωση..."
                  value={posGeneralNote}
                  onChange={(e) => setPosGeneralNote(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold italic text-xs resize-none focus:outline-none focus:border-blue-500"
                ></textarea>

                <div className="flex flex-col bg-gray-50 p-2 rounded-xl border border-gray-100">
                  <span className="font-black text-[9px] uppercase text-gray-500 tracking-widest mb-1 text-center">
                    ΤΡΟΠΟΣ ΠΛΗΡΩΜΗΣ *
                  </span>
                  <div className="flex gap-1 bg-gray-200/50 p-1 rounded-lg">
                    <button
                      onClick={() => setPosPayment("ΜΕΤΡΗΤΑ")}
                      className={`flex-1 py-2 rounded-md font-black text-[10px] uppercase transition-all flex items-center justify-center gap-1 ${
                        posPayment === "ΜΕΤΡΗΤΑ"
                          ? "bg-white shadow-sm text-blue-600 scale-105"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      💵 ΜΕΤΡΗΤΑ
                    </button>
                    <button
                      onClick={() => setPosPayment("ΚΑΡΤΑ")}
                      className={`flex-1 py-2 rounded-md font-black text-[10px] uppercase transition-all flex items-center justify-center gap-1 ${
                        posPayment === "ΚΑΡΤΑ"
                          ? "bg-white shadow-sm text-blue-600 scale-105"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      💳 ΚΑΡΤΑ
                    </button>
                  </div>
                </div>

                <button
                  onClick={submitPosOrder}
                  disabled={posCart.length === 0 || !posTable || !posPayment}
                  className={`w-full p-4 rounded-xl font-black uppercase text-sm shadow-xl transition-all active:scale-95 flex justify-between items-center ${
                    posCart.length === 0 || !posTable || !posPayment
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  <span>{!posPayment ? "ΕΠΙΛΕΞΤΕ ΠΛΗΡΩΜΗ" : "ΑΠΟΣΤΟΛΗ"}</span>
                  <span className="text-lg">
                    {posCart
                      .reduce((s, i) => s + i.price * (i.quantity || 1), 0)
                      .toFixed(2)}
                    €
                  </span>
                </button>
              </div>
            </div>

            {/* ΠΛΩΤΟ ΚΟΥΜΠΙ ΚΑΛΑΘΙΟΥ ΓΙΑ ΤΑ ΚΙΝΗΤΑ */}
            {!isPosCartOpen && posCart.length > 0 && (
              <div className="md:hidden absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white/90 via-white/80 to-transparent backdrop-blur-sm z-40">
                <button
                  onClick={() => setIsPosCartOpen(true)}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-[2rem] shadow-2xl flex justify-between items-center transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-white text-black w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-inner">
                      {posCart.reduce((s, i) => s + (i.quantity || 1), 0)}
                    </div>
                    <span className="font-black uppercase text-xs tracking-widest">
                      ΠΡΟΒΟΛΗ ΚΑΛΑΘΙΟΥ
                    </span>
                  </div>
                  <span className="font-black text-lg">
                    {posCart
                      .reduce((s, i) => s + i.price * (i.quantity || 1), 0)
                      .toFixed(2)}
                    €
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL ΠΡΟΪΟΝΤΟΣ ΓΙΑ ΤΟ POS --- */}
      {posActiveProduct && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => {
            setPosActiveProduct(null);
            setEditingCartId(null);
          }}
        >
          <div
            className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4 border-b pb-4">
              <div className="flex flex-col pr-4">
                <h2 className="font-black text-xl uppercase italic text-gray-900">
                  {posActiveProduct.name}
                </h2>
                {editingCartId && (
                  <span className="text-[10px] text-blue-500 mt-1 font-black uppercase">
                    ΕΠΕΞΕΡΓΑΣΙΑ
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setPosActiveProduct(null);
                  setEditingCartId(null);
                }}
                className="w-10 h-10 bg-gray-100 rounded-full font-black text-gray-600 hover:bg-gray-200 shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 pr-2 no-scrollbar">
              {(posActiveProduct.addons || []).map((group) => (
                <div
                  key={group.id}
                  className="bg-gray-50 p-4 rounded-2xl border border-gray-100"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-black uppercase text-sm text-gray-800">
                      {group.name}
                    </h3>
                    <span className="text-[9px] font-bold text-gray-500 uppercase">
                      {group.isRequired ? "ΥΠΟΧΡΕΩΤΙΚΟ" : "ΠΡΟΑΙΡΕΤΙΚΟ"} (
                      {group.maxSelections > 1
                        ? `ΕΩΣ ${group.maxSelections}`
                        : "ΕΠΙΛΕΞΤΕ 1"}
                      )
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.options.map((opt, i) => {
                      const isSelected = (
                        posAddonSelections[group.id] || []
                      ).includes(i);
                      return (
                        <div
                          key={i}
                          onClick={() =>
                            togglePosAddon(group.id, i, group.maxSelections)
                          }
                          className={`flex justify-between items-center p-4 rounded-xl cursor-pointer border-2 transition-all ${
                            isSelected
                              ? "bg-blue-50 border-blue-500"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                            <span
                              className={`font-bold text-xs uppercase ${
                                isSelected ? "text-gray-900" : "text-gray-600"
                              }`}
                            >
                              {opt.name}
                            </span>
                          </div>
                          <span
                            className={`font-black text-xs ${
                              opt.price > 0 ? "text-blue-600" : "text-gray-400"
                            }`}
                          >
                            {opt.price > 0
                              ? `+${opt.price.toFixed(2)}€`
                              : "ΔΩΡΕΑΝ"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <span className="font-black uppercase text-sm text-gray-800">
                  ΠΟΣΟΤΗΤΑ
                </span>
                <div className="flex items-center gap-4 bg-white px-2 py-1 rounded-xl shadow-sm border border-gray-200">
                  <button
                    onClick={() => setPosQuantity(Math.max(1, posQuantity - 1))}
                    className="w-10 h-10 font-bold text-2xl text-gray-500 flex items-center justify-center"
                  >
                    {" "}
                    −{" "}
                  </button>
                  <span className="font-black text-lg w-6 text-center">
                    {posQuantity}
                  </span>
                  <button
                    onClick={() => setPosQuantity(posQuantity + 1)}
                    className="w-10 h-10 font-bold text-2xl text-blue-600 flex items-center justify-center"
                  >
                    {" "}
                    +{" "}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <span className="font-black text-gray-800 uppercase text-xs mb-2 block">
                  ΣΗΜΕΙΩΣΗ ΠΡΟΪΟΝΤΟΣ
                </span>
                <textarea
                  rows="2"
                  placeholder="Π.χ. Χωρίς ζάχαρη..."
                  value={posCurrentNote}
                  onChange={(e) => setPosCurrentNote(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-400 font-bold resize-none"
                ></textarea>
              </div>
            </div>

            <button
              onClick={confirmPosAddons}
              className="w-full mt-6 bg-blue-600 text-white py-5 rounded-xl font-black uppercase text-sm shadow-lg hover:bg-blue-700 active:scale-95 transition-transform flex justify-between px-6"
            >
              <span>{editingCartId ? "ΑΠΟΘΗΚΕΥΣΗ" : "ΠΡΟΣΘΗΚΗ"}</span>
              <span>
                {!editingCartId && posQuantity > 1 ? `x${posQuantity}` : ""}
              </span>
            </button>
          </div>
        </div>
      )}

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
                    <span>
                      {item.quantity > 1 ? `${item.quantity}x ` : ""}
                      {item.name}
                    </span>
                    <span
                      className={isKitchen ? "text-white" : "text-blue-600"}
                    >
                      {(item.price * (item.quantity || 1)).toFixed(2)}€
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
                      .reduce((s, it) => s + it.price * (it.quantity || 1), 0)
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

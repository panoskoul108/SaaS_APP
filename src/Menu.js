import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import OrderStatus from "./OrderStatus";

const SUPABASE_URL = "https://vgyzevaxkayyobopznyr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZneXpldmF4a2F5eW9ib3B6bnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNjI2MDksImV4cCI6MjA4NjYzODYwOX0.u-kO33BloFq4MU3sZsxN8QVcNTjOOZtsDT4srhbdsCw";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const TABLES_LIST = [
  ...Array.from({ length: 20 }, (_, i) => `A${i + 1}`),
  ...Array.from({ length: 6 }, (_, i) => `Γ${i + 1}`),
  ...Array.from({ length: 20 }, (_, i) => `Δ${i + 1}`),
  "ΠΑΚΕΤΟ",
];

// ΤΟ ΟΡΙΟ ΓΙΑ ΤΟ ΔΩΡΟ (Μπορείς να το αλλάξεις εδώ εύκολα)
const REWARD_THRESHOLD = 25;

// Η ΙΔΑΝΙΚΗ ΣΕΙΡΑ ΤΩΝ ΚΑΤΗΓΟΡΙΩΝ ΣΤΟ ΜΕΝΟΥ (Μπορείς να την αλλάξεις αν θέλεις)
const CATEGORY_ORDER = [
  "ΚΑΦΕΔΕΣ",
  "ΠΡΩΙΝΟ",
  "ΣΝΑΚΣ",
  "ΑΛΜΥΡΕΣ ΚΡΕΠΕΣ",
  "ΠΙΤΣΕΣ",
  "ΖΥΜΑΡΙΚΑ",
  "ΣΑΛΑΤΕΣ",
  "ΣΥΝΟΔΕΥΤΙΚΑ",
  "ΓΛΥΚΕΣ ΚΡΕΠΕΣ",
  "ΓΛΥΚΑ",
  "ΡΟΦΗΜΑΤΑ",
  "ΑΝΑΨΥΚΤΙΚΑ",
  "ΜΠΥΡΕΣ",
];

const DICT = {
  gr: {
    requiredTable: "ΑΠΑΙΤΕΙΤΑΙ ΤΡΑΠΕΖΙ",
    table: "ΤΡΑΠΕΖΙ",
    selectManual: "Λειτουργία Χειροκίνητης Επιλογής",
    btnSelectTable: "ΕΠΙΛΟΓΗ ΤΡΑΠΕΖΙΟΥ",
    rec: "ΠΡΟΤΕΙΝΟΜΕΝΑ",
    outOfStock: "Εξαντλήθηκε",
    unavail: "ΜΗ ΔΙΑΘΕΣΙΜΟ",
    add: "ΠΡΟΣΘΗΚΗ",
    req: "ΥΠΟΧΡΕΩΤΙΚΟ",
    opt: "ΠΡΟΑΙΡΕΤΙΚΟ",
    upTo: "ΕΩΣ",
    select1: "ΕΠΙΛΕΞΤΕ 1",
    free: "ΧΩΡΙΣ ΧΡΕΩΣΗ",
    addToCart: "ΠΡΟΣΘΗΚΗ",
    viewCart: "ΠΡΟΒΟΛΗ ΚΑΛΑΘΙΟΥ",
    yourOrder: "Η ΠΑΡΑΓΓΕΛΙΑ ΣΑΣ",
    note: "ΣΗΜΕΙΩΣΗ",
    itemNotePlaceholder: "Π.χ. Χωρίς ζάχαρη, έξτρα πάγο...",
    genNoteTitle: "ΓΕΝΙΚΗ ΣΗΜΕΙΩΣΗ (ΠΡΟΑΙΡΕΤΙΚΟ)",
    payMethod: "ΤΡΟΠΟΣ ΠΛΗΡΩΜΗΣ",
    cash: "ΜΕΤΡΗΤΑ",
    card: "ΚΑΡΤΑ",
    send: "ΑΠΟΣΤΟΛΗ",
    selPay: "ΕΠΙΛΕΞΤΕ ΠΛΗΡΩΜΗ",
    history: "ΠΡΟΗΓΟΥΜΕΝΕΣ ΠΑΡΑΓΓΕΛΙΕΣ",
    noHistory: "Δεν εχετε προηγουμενες παραγγελιες",
    reorder: "ΕΠΑΝΑΛΗΨΗ",
    hasOptions: "Επιδεχεται επιλογες",
    search: "Αναζήτηση προϊόντος...",
    qty: "ΠΟΣΟΤΗΤΑ",
    noResults: "Δεν βρέθηκαν προϊόντα.",
    pausedBanner: "ΠΑΡΟΣΩΡΙΝΗ ΠΑΥΣΗ ΠΑΡΑΓΓΕΛΙΩΝ ΛΟΓΩ ΦΟΡΤΟΥ",
    pausedCartMsg: "Δεν μπορούν να σταλούν νέες παραγγελίες αυτή τη στιγμή.",
    edit: "ΕΠΕΞΕΡΓΑΣΙΑ",
    save: "ΑΠΟΘΗΚΕΥΣΗ",
    loyaltyTitle: "ΔΩΡΟ ΜΕ ΠΑΡΑΓΓΕΛΙΑ",
    loyaltyReward: "ΣΥΓΧΑΡΗΤΗΡΙΑ! ΔΙΚΑΙΟΥΣΑΙ ΔΩΡΕΑΝ ΚΕΡΑΣΜΑ! 🎁",
  },
  en: {
    requiredTable: "TABLE REQUIRED",
    table: "TABLE",
    selectManual: "Manual Table Selection",
    btnSelectTable: "SELECT TABLE",
    rec: "RECOMMENDED",
    outOfStock: "Out of Stock",
    unavail: "UNAVAILABLE",
    add: "ADD",
    req: "REQUIRED",
    opt: "OPTIONAL",
    upTo: "UP TO",
    select1: "SELECT 1",
    free: "FREE",
    addToCart: "ADD TO CART",
    viewCart: "VIEW CART",
    yourOrder: "YOUR ORDER",
    note: "NOTE",
    itemNotePlaceholder: "E.g. No sugar, extra ice...",
    genNoteTitle: "GENERAL NOTE (OPTIONAL)",
    payMethod: "PAYMENT METHOD",
    cash: "CASH",
    card: "CARD",
    send: "SEND ORDER",
    selPay: "SELECT PAYMENT",
    history: "PREVIOUS ORDERS",
    noHistory: "You have no previous orders",
    reorder: "REORDER",
    hasOptions: "Options available",
    search: "Search products...",
    qty: "QUANTITY",
    noResults: "No products found.",
    pausedBanner: "ORDERS TEMPORARILY PAUSED DUE TO HIGH VOLUME",
    pausedCartMsg: "New orders cannot be sent at this time.",
    edit: "EDIT",
    save: "SAVE",
    loyaltyTitle: "GIFT WITH ORDER",
    loyaltyReward: "CONGRATULATIONS! YOU GET A FREE TREAT! 🎁",
  },
};

export default function Menu() {
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ΠΡΟΤΕΙΝΟΜΕΝΑ");
  const [cart, setCart] = useState([]);
  const [storeId] = useState(
    new URLSearchParams(window.location.search).get("store") || "1"
  );

  const urlTable = new URLSearchParams(window.location.search).get("table");
  const [tableNum, setTableNum] = useState(
    urlTable === "null" ? null : urlTable
  );

  const [lang, setLang] = useState("gr");
  const t = DICT[lang];

  const [custId] = useState(() => {
    let id = localStorage.getItem("loyalty_id");
    if (!id) {
      id = "cust_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("loyalty_id", id);
    }
    return id;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cartBounce, setCartBounce] = useState(false);

  const [backupMode, setBackupMode] = useState(false);
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(true);

  const [showTablePicker, setShowTablePicker] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [lastOrderId, setLastOrderId] = useState(
    localStorage.getItem("lastOrderId")
  );
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [generalNote, setGeneralNote] = useState("");

  const [activeProduct, setActiveProduct] = useState(null);
  const [addonSelections, setAddonSelections] = useState({});
  const [currentProductNote, setCurrentProductNote] = useState("");
  const [editingCartId, setEditingCartId] = useState(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [orderHistory, setOrderHistory] = useState(() => {
    const saved = localStorage.getItem(`status_order_history_${storeId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const categoryNavRef = useRef(null);

  const fetchData = async () => {
    const { data: s } = await supabase
      .from("stores")
      .select("*")
      .eq("id", storeId)
      .single();
    if (s) {
      setStore(s);
      setBackupMode(s.backup_mode);
      setIsAcceptingOrders(s.is_accepting_orders !== false);
    }
    const { data: p } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (p) setProducts(p);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    const channel = supabase
      .channel("menu_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => fetchData()
      )
      .subscribe();
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  const hasRecommended = products.some((p) => p.is_recommended);

  const rawCategories = [...new Set(products.map((p) => p.category))].sort(
    (a, b) => {
      let idxA = CATEGORY_ORDER.indexOf(a);
      let idxB = CATEGORY_ORDER.indexOf(b);
      if (idxA === -1) idxA = 999;
      if (idxB === -1) idxB = 999;
      return idxA - idxB;
    }
  );

  const baseCategories = hasRecommended
    ? ["ΠΡΟΤΕΙΝΟΜΕΝΑ", ...rawCategories]
    : rawCategories;

  useEffect(() => {
    if (
      baseCategories.length > 0 &&
      selectedCategory === "ΠΡΟΤΕΙΝΟΜΕΝΑ" &&
      !hasRecommended
    ) {
      setSelectedCategory(baseCategories[0]);
    }
  }, [baseCategories, hasRecommended, selectedCategory]);

  useEffect(() => {
    const handleScroll = () => {
      if (searchQuery) return;
      let currentActive = selectedCategory;
      for (const cat of baseCategories) {
        const el = document.getElementById(`category-${cat}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Το 220px είναι το ύψος των κολλημένων (sticky) μενού μαζί
          if (rect.top <= 220 && rect.bottom >= 220) {
            currentActive = cat;
          }
        }
      }
      if (currentActive !== selectedCategory) {
        setSelectedCategory(currentActive);
        const btn = document.getElementById(`btn-cat-${currentActive}`);
        if (btn && categoryNavRef.current) {
          categoryNavRef.current.scrollTo({
            left: btn.offsetLeft - 20,
            behavior: "smooth",
          });
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [baseCategories, selectedCategory, searchQuery]);

  const scrollToCategory = (cat) => {
    setSelectedCategory(cat);
    const el = document.getElementById(`category-${cat}`);
    if (el) {
      // Το -200 εξασφαλίζει ότι ο τίτλος δεν κρύβεται κάτω από τα sticky headers
      const y = el.getBoundingClientRect().top + window.scrollY - 200;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const getCategoryDisplayName = (cat) => {
    if (cat === "ΠΡΟΤΕΙΝΟΜΕΝΑ") return `⭐ ${t.rec}`;
    if (lang === "gr") return cat;
    const sampleProduct = products.find((p) => p.category === cat);
    return sampleProduct && sampleProduct.category_en
      ? sampleProduct.category_en
      : cat;
  };

  const handleProductClick = (product) => {
    const initialSels = {};
    if (product.addons) product.addons.forEach((g) => (initialSels[g.id] = []));
    setAddonSelections(initialSels);
    setQuantity(1);
    setCurrentProductNote("");
    setEditingCartId(null);
    setActiveProduct(product);
  };

  const handleEditCartItem = (cartItem) => {
    const originalProduct = products.find((p) => p.id === cartItem.id);
    if (!originalProduct) return;

    setActiveProduct(originalProduct);
    setAddonSelections(cartItem.rawAddons || {});
    setCurrentProductNote(cartItem.note || "");
    setQuantity(cartItem.quantity || 1);
    setEditingCartId(cartItem.cartId);
    setIsCartOpen(false);
  };

  const closeProductModal = () => {
    setActiveProduct(null);
    setEditingCartId(null);
    setCurrentProductNote("");
    setAddonSelections({});
    if (editingCartId) setIsCartOpen(true);
  };

  const toggleAddon = (groupId, optionIndex, maxSelections) => {
    let current = addonSelections[groupId] || [];
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
    setAddonSelections({ ...addonSelections, [groupId]: current });
  };

  const confirmAddons = () => {
    let extraPrice = 0;
    let addonTexts = [];
    let isValid = true;

    (activeProduct.addons || []).forEach((g) => {
      const sels = addonSelections[g.id] || [];
      if (g.isRequired && sels.length === 0) isValid = false;
      if (sels.length > 0) {
        const names = sels.map((idx) => g.options[idx].name);
        addonTexts.push(`${names.join(", ")}`);
        sels.forEach((idx) => (extraPrice += g.options[idx].price));
      }
    });

    if (!isValid) {
      return alert(
        lang === "gr"
          ? "Παρακαλώ συμπληρώστε όλες τις υποχρεωτικές επιλογές!"
          : "Please fill all required options!"
      );
    }

    const baseName = activeProduct.name;
    const finalName =
      addonTexts.length > 0
        ? `${baseName} (${addonTexts.join(" | ")})`
        : baseName;
    const finalPrice = activeProduct.price + extraPrice;

    if (editingCartId) {
      const updatedItem = {
        ...activeProduct,
        cartId: editingCartId,
        name: finalName,
        price: finalPrice,
        note: currentProductNote,
        rawAddons: addonSelections,
        quantity: quantity,
      };
      setCart(
        cart.map((item) => (item.cartId === editingCartId ? updatedItem : item))
      );
      setIsCartOpen(true);
    } else {
      const newItem = {
        ...activeProduct,
        cartId: Date.now() + Math.random(),
        name: finalName,
        price: finalPrice,
        note: currentProductNote,
        rawAddons: addonSelections,
        quantity: quantity,
      };
      setCart([...cart, newItem]);
      setCartBounce(true);
      setTimeout(() => setCartBounce(false), 300);
    }

    setActiveProduct(null);
    setEditingCartId(null);
    setCurrentProductNote("");
  };

  const updateCartItemQuantity = (cartId, delta) => {
    setCart(
      cart.map((item) => {
        if (item.cartId === cartId) {
          const newQ = Math.max(1, (item.quantity || 1) + delta);
          return { ...item, quantity: newQ };
        }
        return item;
      })
    );
  };

  const removeFromCart = (cartId) => {
    const newCart = cart.filter((item) => item.cartId !== cartId);
    setCart(newCart);
    if (newCart.length === 0) setIsCartOpen(false);
  };

  const currentCartTotal = cart.reduce(
    (s, i) => s + i.price * (i.quantity || 1),
    0
  );
  const isRewardOrder = currentCartTotal >= REWARD_THRESHOLD;
  const progressPercent = Math.min(
    (currentCartTotal / REWARD_THRESHOLD) * 100,
    100
  );
  const remainingAmount = Math.max(REWARD_THRESHOLD - currentCartTotal, 0);

  const sendOrder = async () => {
    if (!paymentMethod || cart.length === 0 || !tableNum || !isAcceptingOrders)
      return;

    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          store_id: storeId,
          table_number: tableNum,
          items: cart,
          total_price: currentCartTotal,
          payment_method: paymentMethod,
          status: "pending",
          general_note: generalNote,
          customer_id: custId,
          is_loyalty_reward: isRewardOrder,
        },
      ])
      .select();

    if (!error && data) {
      const newHistoryOrder = {
        id: data[0].id,
        date: new Date().toISOString(),
        items: cart,
        total: currentCartTotal,
      };
      const updatedHistory = [newHistoryOrder, ...orderHistory].slice(0, 10);
      setOrderHistory(updatedHistory);
      localStorage.setItem(
        `status_order_history_${storeId}`,
        JSON.stringify(updatedHistory)
      );
      localStorage.setItem("lastOrderId", data[0].id);
      setLastOrderId(data[0].id);
      setCart([]);
      setGeneralNote("");
      setPaymentMethod("");
      setIsCartOpen(false);
    }
  };

  const handleReorder = (pastOrder) => {
    setCart([
      ...cart,
      ...pastOrder.items.map((item, index) => ({
        ...item,
        cartId: Date.now() + Math.random() + index,
        quantity: item.quantity || 1,
      })),
    ]);
    setIsHistoryOpen(false);
    setIsCartOpen(true);
  };

  const getItemDisplayName = (item) => {
    const orig = products.find((p) => p.id === item.id);
    if (!orig) return item.name;

    const baseName = lang === "en" && orig.name_en ? orig.name_en : orig.name;
    let addonTexts = [];
    (orig.addons || []).forEach((g) => {
      const sels = item.rawAddons?.[g.id] || [];
      if (sels.length > 0) {
        const names = sels.map((idx) =>
          lang === "en" && g.options[idx].name_en
            ? g.options[idx].name_en
            : g.options[idx].name
        );
        addonTexts.push(names.join(", "));
      }
    });
    return addonTexts.length > 0
      ? `${baseName} (${addonTexts.join(" | ")})`
      : baseName;
  };

  if (lastOrderId && lastOrderId !== "null") {
    return (
      <OrderStatus
        orderId={lastOrderId}
        lang={lang}
        products={products}
        onBack={(clearTable) => {
          setLastOrderId(null);
          localStorage.removeItem("lastOrderId");
          if (clearTable) {
            setTableNum(null);
            if (window.history.replaceState)
              window.history.replaceState(
                {},
                document.title,
                window.location.pathname
              );
          }
        }}
      />
    );
  }

  const totalItemsCount = cart.reduce((s, i) => s + (i.quantity || 1), 0);

  const themeColor = store?.theme_color || "#2563EB";
  const placeholderImg =
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80";

  const removeAccents = (str) => {
    return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
  };

  const filteredProducts = searchQuery
    ? products.filter((p) => {
        const searchLow = removeAccents(searchQuery.toLowerCase());
        const matchGr = removeAccents(p.name.toLowerCase()).includes(searchLow);
        const matchEn = p.name_en
          ? removeAccents(p.name_en.toLowerCase()).includes(searchLow)
          : false;
        return matchGr || matchEn;
      })
    : [];

  const activeDispDesc = activeProduct
    ? lang === "en" && activeProduct.description_en
      ? activeProduct.description_en
      : activeProduct.description
    : "";

  return (
    <div className="min-h-screen bg-gray-50 pb-32 font-sans relative">
      <header className="fixed top-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md shadow-sm z-30 flex justify-between items-center transition-all duration-300">
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="w-10 h-10 bg-white/50 rounded-full flex items-center justify-center text-xl shadow-sm border border-gray-100/50 hover:bg-gray-100 transition-colors"
        >
          🕒
        </button>
        <div className="flex flex-col items-center">
          {store?.logo_url ? (
            <img
              src={store.logo_url}
              alt={store?.name}
              className="h-10 object-contain drop-shadow-sm"
            />
          ) : (
            <h1
              className="text-xl font-black italic uppercase tracking-tighter"
              style={{ color: themeColor }}
            >
              {store?.name}
            </h1>
          )}
          <div
            className="mt-1 px-3 py-1 rounded-full text-[9px] font-black uppercase italic shadow-sm text-white"
            style={{ backgroundColor: tableNum ? themeColor : "#EF4444" }}
          >
            {tableNum ? `${t.table} ${tableNum}` : t.requiredTable}
          </div>
        </div>
        <button
          onClick={() => setLang(lang === "gr" ? "en" : "gr")}
          className="w-10 h-10 bg-white/50 rounded-full flex items-center justify-center text-sm shadow-sm border border-gray-100/50 font-bold hover:bg-gray-100 transition-colors"
        >
          {lang === "gr" ? "🇬🇧" : "🇬🇷"}
        </button>
      </header>

      {!isAcceptingOrders && (
        <div className="fixed top-[88px] left-0 right-0 bg-red-500 text-white p-2 text-center font-black text-[10px] uppercase tracking-widest z-40 shadow-md">
          ⚠️ {t.pausedBanner}
        </div>
      )}

      {(!tableNum || tableNum === "") && backupMode === true && (
        <div
          className={`mx-4 mb-2 p-6 bg-white border-2 rounded-3xl text-center shadow-md animate-fade-in relative z-10 ${
            !isAcceptingOrders ? "mt-[120px]" : "mt-[88px]"
          }`}
          style={{ borderColor: themeColor }}
        >
          <p
            className="text-xs font-black uppercase mb-3"
            style={{ color: themeColor }}
          >
            {t.selectManual}
          </p>
          <button
            onClick={() => setShowTablePicker(true)}
            className="w-full text-white px-8 py-4 rounded-2xl font-black uppercase text-sm shadow-lg active:scale-95 transition-transform"
            style={{ backgroundColor: themeColor }}
          >
            {t.btnSelectTable}
          </button>
        </div>
      )}

      {showTablePicker && (
        <div className="fixed inset-0 bg-black/90 z-[200] p-6 overflow-y-auto flex flex-col items-center justify-start pt-20">
          <div className="flex justify-between items-center mb-8 text-white font-black italic uppercase text-lg w-full max-w-md">
            {t.btnSelectTable}{" "}
            <button
              onClick={() => setShowTablePicker(false)}
              className="text-3xl"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3 w-full max-w-md pb-20">
            {TABLES_LIST.map((table) => (
              <button
                key={table}
                onClick={() => {
                  setTableNum(table);
                  setShowTablePicker(false);
                }}
                className="bg-gray-800 text-white py-5 rounded-2xl font-black text-sm hover:bg-gray-700 active:scale-95 transition-transform"
              >
                {table}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className={`px-4 pt-4 pb-2 bg-gray-50 z-20 ${
          tableNum ? (!isAcceptingOrders ? "mt-[120px]" : "mt-[88px]") : ""
        }`}
      >
        <div
          className={`p-4 rounded-3xl border shadow-sm transition-colors duration-500 ${
            isRewardOrder
              ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white border-yellow-300 animate-pulse"
              : "bg-white border-gray-200"
          }`}
        >
          {isRewardOrder ? (
            <div className="text-center">
              <span className="text-2xl block mb-1">🎉</span>
              <h3 className="font-black text-sm uppercase tracking-widest drop-shadow-sm">
                {t.loyaltyReward}
              </h3>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-[10px] uppercase tracking-widest text-gray-500">
                  🎁 {t.loyaltyTitle}
                </span>
                <span className="font-black text-xs px-2 py-0.5 bg-gray-100 rounded-lg text-gray-600">
                  {currentCartTotal.toFixed(2)}€ / {REWARD_THRESHOLD}€
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: themeColor,
                  }}
                ></div>
              </div>
              <p className="text-[10px] font-bold text-gray-400 mt-2 text-center uppercase">
                {lang === "gr"
                  ? `Πρόσθεσε ${remainingAmount.toFixed(
                      2
                    )}€ ακόμα για δωρεάν κέρασμα!`
                  : `Add ${remainingAmount.toFixed(2)}€ more for a free treat!`}
              </p>
            </>
          )}
        </div>
      </div>

      {/* ΔΙΟΡΘΩΣΗ STICKY OFFSET ΑΝΑΖΗΤΗΣΗΣ */}
      <div
        className={`px-4 py-2 sticky z-20 bg-gray-50/90 backdrop-blur-md transition-all ${
          !isAcceptingOrders ? "top-[120px]" : "top-[88px]"
        }`}
      >
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
          <input
            type="text"
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 transition-all"
            style={{ focusRingColor: themeColor }}
          />
        </div>
      </div>

      {/* ΔΙΟΡΘΩΣΗ STICKY OFFSET ΚΑΤΗΓΟΡΙΩΝ */}
      {!searchQuery && (
        <div
          ref={categoryNavRef}
          className={`flex overflow-x-auto py-3 px-4 gap-3 bg-gray-50/90 backdrop-blur-md sticky z-20 no-scrollbar border-b border-gray-200/50 transition-all ${
            !isAcceptingOrders ? "top-[180px]" : "top-[148px]"
          }`}
        >
          {baseCategories.map((cat) => (
            <button
              key={cat}
              id={`btn-cat-${cat}`}
              onClick={() => scrollToCategory(cat)}
              className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wide transition-all whitespace-nowrap shadow-sm ${
                selectedCategory !== cat
                  ? "bg-white text-gray-600 border border-gray-200/50 hover:bg-gray-100"
                  : "scale-105"
              }`}
              style={
                selectedCategory === cat
                  ? { backgroundColor: themeColor, color: "#ffffff" }
                  : {}
              }
            >
              {getCategoryDisplayName(cat)}
            </button>
          ))}
        </div>
      )}

      <div className="p-4 space-y-8 animate-fade-in">
        {searchQuery ? (
          <div className="space-y-3">
            {filteredProducts.length === 0 ? (
              <p className="text-center text-gray-400 font-bold uppercase mt-10">
                {t.noResults}
              </p>
            ) : (
              filteredProducts.map((p) => {
                const dispName =
                  lang === "en" && p.name_en ? p.name_en : p.name;
                const dispDesc =
                  lang === "en" && p.description_en
                    ? p.description_en
                    : p.description;
                return (
                  <div
                    key={p.id}
                    onClick={() => p.is_available && handleProductClick(p)}
                    className={`flex bg-white rounded-2xl shadow-sm border border-gray-100/50 p-3 gap-4 transition-all cursor-pointer ${
                      !p.is_available
                        ? "opacity-50 grayscale"
                        : "hover:shadow-md hover:border-gray-200"
                    }`}
                  >
                    <div
                      className="w-24 h-24 rounded-xl bg-cover bg-center shrink-0 shadow-inner"
                      style={{
                        backgroundImage: `url(${
                          p.image_url || placeholderImg
                        })`,
                      }}
                    ></div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h3 className="font-black text-gray-900 text-sm leading-tight uppercase">
                          {dispName}
                        </h3>
                        {dispDesc && (
                          <p className="text-[10px] text-gray-500 mt-1 leading-snug line-clamp-2 font-medium">
                            {dispDesc}
                          </p>
                        )}
                        {p.addons && p.addons.length > 0 && (
                          <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">
                            {t.hasOptions}
                          </p>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span
                          className="font-black text-lg"
                          style={{ color: themeColor }}
                        >
                          {p.price.toFixed(2)}€
                        </span>
                        {p.is_available ? (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-lg shadow-md"
                            style={{ backgroundColor: themeColor }}
                          >
                            +
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-red-500 uppercase">
                            {t.outOfStock}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          baseCategories.map((cat) => {
            const sectionProducts =
              cat === "ΠΡΟΤΕΙΝΟΜΕΝΑ"
                ? products.filter((p) => p.is_recommended)
                : products.filter((p) => p.category === cat);
            if (sectionProducts.length === 0) return null;

            return (
              <div
                key={cat}
                id={`category-${cat}`}
                className="scroll-mt-[220px]"
              >
                <h2 className="font-black italic text-2xl mb-4 text-gray-800 tracking-tighter pl-1">
                  {getCategoryDisplayName(cat)}
                </h2>

                {cat === "ΠΡΟΤΕΙΝΟΜΕΝΑ" ? (
                  <div className="grid grid-cols-2 gap-4">
                    {sectionProducts.map((p) => {
                      const dispName =
                        lang === "en" && p.name_en ? p.name_en : p.name;
                      const dispDesc =
                        lang === "en" && p.description_en
                          ? p.description_en
                          : p.description;
                      return (
                        <div
                          key={p.id}
                          onClick={() =>
                            p.is_available && handleProductClick(p)
                          }
                          className={`bg-white rounded-3xl shadow-sm border border-gray-100/50 overflow-hidden flex flex-col transition-all cursor-pointer ${
                            !p.is_available
                              ? "opacity-50 grayscale"
                              : "hover:shadow-md hover:scale-[1.02]"
                          }`}
                        >
                          <div
                            className="h-36 w-full bg-cover bg-center relative"
                            style={{
                              backgroundImage: `url(${
                                p.image_url || placeholderImg
                              })`,
                            }}
                          ></div>
                          <div className="p-3 flex flex-col flex-1 justify-between">
                            <div>
                              <h3 className="font-black text-gray-900 text-[13px] uppercase leading-tight line-clamp-2">
                                {dispName}
                              </h3>
                              {dispDesc && (
                                <p className="text-[9px] text-gray-500 mt-1 leading-snug line-clamp-2 font-medium">
                                  {dispDesc}
                                </p>
                              )}
                              {p.addons && p.addons.length > 0 && (
                                <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">
                                  {t.hasOptions}
                                </p>
                              )}
                            </div>
                            <div className="flex justify-between items-center mt-3">
                              <p
                                className="font-black text-base"
                                style={{ color: themeColor }}
                              >
                                {p.price.toFixed(2)}€
                              </p>
                              {p.is_available ? (
                                <div
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black shadow-md"
                                  style={{ backgroundColor: themeColor }}
                                >
                                  +
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sectionProducts.map((p) => {
                      const dispName =
                        lang === "en" && p.name_en ? p.name_en : p.name;
                      const dispDesc =
                        lang === "en" && p.description_en
                          ? p.description_en
                          : p.description;
                      return (
                        <div
                          key={p.id}
                          onClick={() =>
                            p.is_available && handleProductClick(p)
                          }
                          className={`flex bg-white rounded-2xl shadow-sm border border-gray-100/50 p-3 gap-4 transition-all cursor-pointer ${
                            !p.is_available
                              ? "opacity-50 grayscale"
                              : "hover:shadow-md hover:border-gray-200"
                          }`}
                        >
                          <div
                            className="w-24 h-24 rounded-xl bg-cover bg-center shrink-0 shadow-inner"
                            style={{
                              backgroundImage: `url(${
                                p.image_url || placeholderImg
                              })`,
                            }}
                          ></div>
                          <div className="flex-1 flex flex-col justify-between py-1">
                            <div>
                              <h3 className="font-black text-gray-900 text-sm leading-tight uppercase">
                                {dispName}
                              </h3>
                              {dispDesc && (
                                <p className="text-[10px] text-gray-500 mt-1 leading-snug line-clamp-2 font-medium">
                                  {dispDesc}
                                </p>
                              )}
                              {p.addons && p.addons.length > 0 && (
                                <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">
                                  {t.hasOptions}
                                </p>
                              )}
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <span
                                className="font-black text-lg"
                                style={{ color: themeColor }}
                              >
                                {p.price.toFixed(2)}€
                              </span>
                              {p.is_available ? (
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-lg shadow-md"
                                  style={{ backgroundColor: themeColor }}
                                >
                                  +
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold text-red-500 uppercase">
                                  {t.outOfStock}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* --- MODAL ΠΡΟΪΟΝΤΟΣ --- */}
      {activeProduct && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex flex-col justify-end animate-fade-in"
          onClick={closeProductModal}
        >
          <div
            className="bg-white w-full rounded-t-[2.5rem] p-6 shadow-2xl animate-slide-up max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4">
              <div className="flex flex-col pr-4">
                <h2 className="font-black text-xl uppercase italic text-gray-900">
                  {lang === "en" && activeProduct.name_en
                    ? activeProduct.name_en
                    : activeProduct.name}
                </h2>
                {activeDispDesc && (
                  <p className="text-xs text-gray-500 mt-1 font-medium italic">
                    {activeDispDesc}
                  </p>
                )}
                {editingCartId && (
                  <span className="text-[10px] text-blue-500 mt-1 font-black uppercase">
                    {t.edit}
                  </span>
                )}
              </div>
              <button
                onClick={closeProductModal}
                className="bg-gray-100 w-10 h-10 rounded-full font-black flex items-center justify-center text-gray-600 hover:bg-gray-200 shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-6 pb-6 no-scrollbar">
              {/* ΕΠΙΛΟΓΕΣ (ADDONS) */}
              {(activeProduct.addons || []).map((group) => {
                const groupDispName =
                  lang === "en" && group.name_en ? group.name_en : group.name;
                return (
                  <div
                    key={group.id}
                    className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100"
                  >
                    <div className="flex justify-between items-end mb-3">
                      <h3 className="font-black text-gray-800 uppercase text-sm">
                        {groupDispName}
                      </h3>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-white px-2 py-1 rounded-lg shadow-sm border border-gray-100">
                        {group.isRequired ? t.req : t.opt}{" "}
                        {group.maxSelections > 1
                          ? `(${t.upTo} ${group.maxSelections})`
                          : `(${t.select1})`}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.options.map((opt, i) => {
                        const isSelected = (
                          addonSelections[group.id] || []
                        ).includes(i);
                        const optDispName =
                          lang === "en" && opt.name_en ? opt.name_en : opt.name;
                        return (
                          <div
                            key={i}
                            onClick={() =>
                              toggleAddon(group.id, i, group.maxSelections)
                            }
                            className={`flex justify-between items-center p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                              isSelected
                                ? "bg-blue-50/50"
                                : "border-gray-200/50 bg-white hover:border-gray-300"
                            }`}
                            style={
                              isSelected ? { borderColor: themeColor } : {}
                            }
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  isSelected ? "" : "border-gray-300"
                                }`}
                                style={
                                  isSelected
                                    ? {
                                        borderColor: themeColor,
                                        backgroundColor: themeColor,
                                      }
                                    : {}
                                }
                              >
                                {isSelected && (
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                              </div>
                              <span
                                className={`font-bold uppercase text-xs ${
                                  isSelected ? "text-gray-900" : "text-gray-600"
                                }`}
                              >
                                {optDispName}
                              </span>
                            </div>
                            <span
                              className="font-black text-sm"
                              style={
                                opt.price > 0
                                  ? { color: themeColor }
                                  : { color: "#9CA3AF" }
                              }
                            >
                              {opt.price > 0
                                ? `+${opt.price.toFixed(2)}€`
                                : t.free}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-between bg-gray-50/50 p-5 rounded-3xl border border-gray-100">
                <span className="font-black text-gray-800 uppercase text-sm">
                  {t.qty}
                </span>
                <div className="flex items-center gap-4 bg-white px-2 py-1 rounded-2xl border border-gray-200 shadow-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center text-2xl font-bold text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    −
                  </button>
                  <span className="font-black text-xl w-6 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center text-2xl font-bold text-gray-500 hover:text-gray-800 transition-colors"
                    style={{ color: themeColor }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
                <span className="font-black text-gray-800 uppercase text-sm mb-2 block tracking-tight">
                  {t.note}
                </span>
                <textarea
                  rows="2"
                  placeholder={t.itemNotePlaceholder}
                  value={currentProductNote}
                  onChange={(e) => setCurrentProductNote(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 font-bold resize-none shadow-sm"
                ></textarea>
              </div>
            </div>

            <button
              onClick={confirmAddons}
              className="w-full text-white py-5 rounded-2xl font-black uppercase text-sm tracking-widest mt-4 shadow-xl active:scale-95 transition-transform flex justify-between px-6"
              style={{ backgroundColor: themeColor }}
            >
              <span>{editingCartId ? t.save : t.addToCart}</span>
              <span>
                {!editingCartId && quantity > 1 ? `x${quantity}` : ""}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ΚΟΥΜΠΙ ΠΡΟΒΟΛΗΣ ΚΑΛΑΘΙΟΥ */}
      {cart.length > 0 && !isCartOpen && !activeProduct && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white/90 via-white/80 to-transparent backdrop-blur-sm z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className={`w-full text-white py-4 px-6 rounded-[2rem] shadow-2xl flex justify-between items-center transition-all duration-300 ${
              cartBounce ? "scale-105 shadow-blue-500/50" : "hover:scale-[1.02]"
            }`}
            style={{ backgroundColor: themeColor }}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white text-black w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-inner">
                {totalItemsCount}
              </div>
              <span className="font-black uppercase text-xs tracking-widest">
                {t.viewCart}
              </span>
            </div>
            <span className="font-black text-lg">
              {currentCartTotal.toFixed(2)}€
            </span>
          </button>
        </div>
      )}

      {/* MODAL ΚΑΛΑΘΙΟΥ */}
      {isCartOpen && (
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
                      {" "}
                      −{" "}
                    </button>
                    <span className="font-black text-sm w-6 text-center">
                      {item.quantity || 1}
                    </span>
                    <button
                      onClick={() => updateCartItemQuantity(item.cartId, 1)}
                      className="w-8 h-8 flex items-center justify-center font-black text-blue-600 active:scale-90 transition-transform"
                    >
                      {" "}
                      +{" "}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditCartItem(item)}
                      className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm active:scale-95 transition-transform border border-blue-100"
                    >
                      {" "}
                      ✏️{" "}
                    </button>
                    <button
                      onClick={() => removeFromCart(item.cartId)}
                      className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shadow-sm active:scale-95 transition-transform border border-red-100"
                    >
                      {" "}
                      🗑️{" "}
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
                  style={
                    paymentMethod === "ΜΕΤΡΗΤΑ" ? { color: themeColor } : {}
                  }
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
                  paymentMethod && tableNum
                    ? { backgroundColor: themeColor }
                    : {}
                }
              >
                <span className="uppercase text-sm tracking-widest">
                  {!tableNum
                    ? t.requiredTable
                    : paymentMethod
                    ? t.send
                    : t.selPay}
                </span>
                <span className="text-xl">{currentCartTotal.toFixed(2)}€</span>
              </button>
            )}
          </div>
        </div>
      )}

      {isHistoryOpen && (
        <div className="fixed inset-0 bg-gray-50 z-[200] flex flex-col animate-slide-up">
          <div className="bg-white p-4 flex justify-between items-center shadow-sm border-b">
            <h2 className="font-black uppercase text-lg text-gray-800">
              {t.history}
            </h2>
            <button
              onClick={() => setIsHistoryOpen(false)}
              className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center font-black text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {orderHistory.length === 0 ? (
              <div className="text-center text-gray-400 mt-10 font-bold text-sm uppercase">
                {t.noHistory}
              </div>
            ) : (
              orderHistory.map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100/50"
                >
                  <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {new Date(order.date).toLocaleString("el-GR")}
                    </span>
                    <span
                      className="font-black text-lg"
                      style={{ color: themeColor }}
                    >
                      {order.total.toFixed(2)}€
                    </span>
                  </div>
                  <ul className="mb-4 space-y-1">
                    {order.items.map((it, i) => (
                      <li
                        key={i}
                        className="text-xs font-bold text-gray-700 uppercase"
                      >
                        {it.quantity > 1 ? (
                          <span className="text-blue-500 mr-1">
                            {it.quantity}x
                          </span>
                        ) : (
                          "• "
                        )}
                        {getItemDisplayName(it)}{" "}
                        {it.note && (
                          <span className="text-gray-400 lowercase italic">
                            ({it.note})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleReorder(order)}
                    className="w-full text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-colors opacity-90 hover:opacity-100 active:scale-95"
                    style={{ backgroundColor: themeColor }}
                  >
                    {t.reorder}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

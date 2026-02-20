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
    addToCart: "ΠΡΟΣΘΗΚΗ ΣΤΟ ΚΑΛΑΘΙ",
    viewCart: "ΠΡΟΒΟΛΗ ΚΑΛΑΘΙΟΥ",
    yourOrder: "Η ΠΑΡΑΓΓΕΛΙΑ ΣΑΣ",
    note: "Σημείωση/σχόλιο",
    genNoteTitle: "ΓΕΝΙΚΗ ΣΗΜΕΙΩΣΗ (ΠΡΟΑΙΡΕΤΙΚΟ)",
    payMethod: "ΤΡΟΠΟΣ ΠΛΗΡΩΜΗΣ",
    cash: "ΜΕΤΡΗΤΑ",
    card: "ΚΑΡΤΑ",
    send: "ΑΠΟΣΤΟΛΗ",
    selPay: "ΕΠΙΛΕΞΤΕ ΠΛΗΡΩΜΗ",
    history: "ΠΡΟΗΓΟΥΜΕΝΕΣ ΠΑΡΑΓΓΕΛΙΕΣ",
    noHistory: "Δεν εχετε προηγουμενες παραγγελιες",
    reorder: "ΕΠΑΝΑΛΗΨΗ ΠΑΡΑΓΓΕΛΙΑΣ",
    hasOptions: "Επιδεχεται επιλογες",
    search: "Αναζήτηση προϊόντος...",
    qty: "ΠΟΣΟΤΗΤΑ",
    noResults: "Δεν βρέθηκαν προϊόντα.",
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
    note: "Note/comment",
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
  const [tableNum, setTableNum] = useState(
    new URLSearchParams(window.location.search).get("table")
  );
  const [lang, setLang] = useState("gr");
  const t = DICT[lang];

  const [searchQuery, setSearchQuery] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cartBounce, setCartBounce] = useState(false);

  const [backupMode, setBackupMode] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [lastOrderId, setLastOrderId] = useState(
    localStorage.getItem("lastOrderId")
  );
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [generalNote, setGeneralNote] = useState("");
  const [activeProduct, setActiveProduct] = useState(null);
  const [addonSelections, setAddonSelections] = useState({});
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
    }
    const { data: p } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .order("category");
    if (p) setProducts(p);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const hasRecommended = products.some((p) => p.is_recommended);
  const rawCategories = [...new Set(products.map((p) => p.category))];
  const baseCategories = hasRecommended
    ? ["ΠΡΟΤΕΙΝΟΜΕΝΑ", ...rawCategories]
    : rawCategories;

  useEffect(() => {
    const handleScroll = () => {
      if (searchQuery) return;
      let currentActive = selectedCategory;
      for (const cat of baseCategories) {
        const el = document.getElementById(`category-${cat}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
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
      const y = el.getBoundingClientRect().top + window.scrollY - 140;
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
    setActiveProduct(product);
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
        const names = sels.map((idx) =>
          lang === "en" && g.options[idx].name_en
            ? g.options[idx].name_en
            : g.options[idx].name
        );
        addonTexts.push(`${names.join(", ")}`);
        sels.forEach((idx) => (extraPrice += g.options[idx].price));
      }
    });
    if (!isValid)
      return alert(
        lang === "gr"
          ? "Παρακαλώ συμπληρώστε όλες τις υποχρεωτικές επιλογές!"
          : "Please fill all required options!"
      );

    const baseName =
      lang === "en" && activeProduct.name_en
        ? activeProduct.name_en
        : activeProduct.name;
    const finalName =
      addonTexts.length > 0
        ? `${baseName} (${addonTexts.join(" | ")})`
        : baseName;
    const finalPrice = activeProduct.price + extraPrice;

    const newItems = [];
    for (let i = 0; i < quantity; i++) {
      newItems.push({
        ...activeProduct,
        cartId: Date.now() + i,
        name: finalName,
        price: finalPrice,
        note: "",
      });
    }

    setCart([...cart, ...newItems]);
    setActiveProduct(null);

    setCartBounce(true);
    setTimeout(() => setCartBounce(false), 300);
  };

  const removeFromCart = (cartId) => {
    const newCart = cart.filter((item) => item.cartId !== cartId);
    setCart(newCart);
    if (newCart.length === 0) setIsCartOpen(false);
  };
  const updateNote = (cartId, note) =>
    setCart(
      cart.map((item) => (item.cartId === cartId ? { ...item, note } : item))
    );

  const sendOrder = async () => {
    if (!paymentMethod || cart.length === 0 || !tableNum) return;
    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          store_id: storeId,
          table_number: tableNum,
          items: cart,
          total_price: cart.reduce((s, i) => s + i.price, 0),
          payment_method: paymentMethod,
          status: "pending",
          general_note: generalNote,
        },
      ])
      .select();
    if (!error && data) {
      const newHistoryOrder = {
        id: data[0].id,
        date: new Date().toISOString(),
        items: cart,
        total: cart.reduce((s, i) => s + i.price, 0),
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
      setIsCartOpen(false);
    }
  };

  const handleReorder = (pastOrder) => {
    setCart([
      ...cart,
      ...pastOrder.items.map((item, index) => ({
        ...item,
        cartId: Date.now() + index,
      })),
    ]);
    setIsHistoryOpen(false);
    setIsCartOpen(true);
  };

  if (lastOrderId && lastOrderId !== "null") {
    return (
      <OrderStatus
        orderId={lastOrderId}
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

  const totalPrice = cart.reduce((s, i) => s + i.price, 0).toFixed(2);
  const themeColor = store?.theme_color || "#2563EB";
  const placeholderImg =
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80";

  const filteredProducts = searchQuery
    ? products.filter((p) => {
        const searchLow = searchQuery.toLowerCase();
        const matchGr = p.name.toLowerCase().includes(searchLow);
        const matchEn = p.name_en
          ? p.name_en.toLowerCase().includes(searchLow)
          : false;
        return matchGr || matchEn;
      })
    : [];

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

      <div className="h-[88px]"></div>

      {/* ΔΙΟΡΘΩΣΗ ΕΔΩ: relative z-10 για να πατιέται το κουμπί */}
      {(!tableNum || tableNum === "") && backupMode === true && (
        <div
          className="mx-4 mt-4 mb-2 p-6 bg-white border-2 rounded-3xl text-center shadow-md animate-fade-in relative z-10"
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

      {/* ΔΙΟΡΘΩΣΗ ΕΔΩ: flex-col items-center justify-start pt-20 για να φαίνονται όλα τα τραπέζια */}
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

      <div className="px-4 py-2 sticky top-[88px] z-20 bg-gray-50/90 backdrop-blur-md">
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

      {!searchQuery && (
        <div
          ref={categoryNavRef}
          className="flex overflow-x-auto py-3 px-4 gap-3 bg-gray-50/90 backdrop-blur-md sticky top-[148px] z-20 no-scrollbar border-b border-gray-200/50"
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
                        <h3 className="font-black text-gray-900 text-sm leading-tight">
                          {dispName}
                        </h3>
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
                className="scroll-mt-[200px]"
              >
                <h2 className="font-black italic text-2xl mb-4 text-gray-800 tracking-tighter pl-1">
                  {getCategoryDisplayName(cat)}
                </h2>

                {cat === "ΠΡΟΤΕΙΝΟΜΕΝΑ" ? (
                  <div className="grid grid-cols-2 gap-4">
                    {sectionProducts.map((p) => {
                      const dispName =
                        lang === "en" && p.name_en ? p.name_en : p.name;
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
                              <h3 className="font-black text-gray-900 text-sm leading-tight">
                                {dispName}
                              </h3>
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

      {activeProduct && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex flex-col justify-end animate-fade-in"
          onClick={() => setActiveProduct(null)}
        >
          <div
            className="bg-white w-full rounded-t-[2.5rem] p-6 shadow-2xl animate-slide-up max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
              <h2 className="font-black text-xl uppercase italic text-gray-900">
                {lang === "en" && activeProduct.name_en
                  ? activeProduct.name_en
                  : activeProduct.name}
              </h2>
              <button
                onClick={() => setActiveProduct(null)}
                className="bg-gray-100 w-10 h-10 rounded-full font-black flex items-center justify-center text-gray-600 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-6 pb-6 no-scrollbar">
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
            </div>

            <button
              onClick={confirmAddons}
              className="w-full text-white py-5 rounded-2xl font-black uppercase text-sm tracking-widest mt-4 shadow-xl active:scale-95 transition-transform flex justify-between px-6"
              style={{ backgroundColor: themeColor }}
            >
              <span>{t.addToCart}</span>
              <span>{quantity > 1 ? `x${quantity}` : ""}</span>
            </button>
          </div>
        </div>
      )}

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
                {cart.length}
              </div>
              <span className="font-black uppercase text-xs tracking-widest">
                {t.viewCart}
              </span>
            </div>
            <span className="font-black text-lg">{totalPrice}€</span>
          </button>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 bg-gray-50 z-[200] flex flex-col animate-slide-up">
          <div className="bg-white p-4 flex justify-between items-center shadow-sm border-b">
            <h2 className="font-black uppercase text-lg">{t.yourOrder}</h2>
            <button
              onClick={() => setIsCartOpen(false)}
              className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center font-black text-gray-600 hover:bg-gray-200"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {cart.map((item) => (
              <div
                key={item.cartId}
                className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100/50 flex flex-col gap-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black uppercase text-gray-800 text-sm pr-4">
                      {item.name}
                    </h4>
                    <p
                      className="font-black mt-1"
                      style={{ color: themeColor }}
                    >
                      {item.price.toFixed(2)}€
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.cartId)}
                    className="bg-red-50 text-red-500 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                  >
                    🗑️
                  </button>
                </div>
                <input
                  type="text"
                  placeholder={t.note}
                  value={item.note}
                  onChange={(e) => updateNote(item.cartId, e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200/80 rounded-xl px-4 py-3 text-sm focus:outline-none font-bold"
                />
              </div>
            ))}
          </div>
          <div className="bg-white p-6 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.08)] border-t border-gray-100">
            <div className="mb-5">
              <p className="font-black text-[10px] uppercase text-gray-400 mb-2 tracking-widest">
                {t.genNoteTitle}
              </p>
              <textarea
                rows="2"
                placeholder={t.note}
                value={generalNote}
                onChange={(e) => setGeneralNote(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200/80 rounded-2xl px-4 py-3 text-sm focus:outline-none font-bold resize-none"
              ></textarea>
            </div>
            <p className="font-black text-xs uppercase text-gray-400 mb-3 tracking-widest">
              {t.payMethod}
            </p>
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setPaymentMethod(t.cash)}
                className={`flex-1 py-4 rounded-2xl font-black text-[11px] border-2 uppercase transition-all flex flex-col items-center gap-1 shadow-sm ${
                  paymentMethod === t.cash
                    ? "bg-gray-50 scale-105"
                    : "border-gray-200/50 text-gray-400 bg-white"
                }`}
                style={
                  paymentMethod === t.cash
                    ? { borderColor: themeColor, color: themeColor }
                    : {}
                }
              >
                <span className="text-2xl">💵</span> {t.cash}
              </button>
              <button
                onClick={() => setPaymentMethod(t.card)}
                className={`flex-1 py-4 rounded-2xl font-black text-[11px] border-2 uppercase transition-all flex flex-col items-center gap-1 shadow-sm ${
                  paymentMethod === t.card
                    ? "bg-gray-50 scale-105"
                    : "border-gray-200/50 text-gray-400 bg-white"
                }`}
                style={
                  paymentMethod === t.card
                    ? { borderColor: themeColor, color: themeColor }
                    : {}
                }
              >
                <span className="text-2xl">💳</span> {t.card}
              </button>
            </div>
            <button
              onClick={sendOrder}
              disabled={!paymentMethod || !tableNum}
              className={`w-full py-5 rounded-2xl font-black flex justify-between px-6 items-center transition-all active:scale-95 ${
                paymentMethod && tableNum
                  ? "text-white shadow-xl"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
              style={
                paymentMethod && tableNum ? { backgroundColor: themeColor } : {}
              }
            >
              <span className="uppercase text-sm tracking-widest">
                {!tableNum
                  ? t.requiredTable
                  : paymentMethod
                  ? t.send
                  : t.selPay}
              </span>
              <span className="text-xl">{totalPrice}€</span>
            </button>
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
                        • {it.name}{" "}
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

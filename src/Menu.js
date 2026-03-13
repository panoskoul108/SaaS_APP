import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import OrderStatus from "./OrderStatus";
import CartModal from "./CartModal";
import ProductModal from "./ProductModal";
import CustomerHeader from "./CustomerHeader";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CATEGORY_ORDER_FALLBACK = [
  "ΠΡΟΤΕΙΝΟΜΕΝΑ", "ΚΑΦΕΔΕΣ", "ΑΝΑΨΥΚΤΙΚΑ", "ΡΟΦΗΜΑΤΑ", "ΠΡΩΙΝΟ", "ΜΠΥΡΕΣ", "ΣΝΑΚΣ",
  "ΣΥΝΟΔΕΥΤΙΚΑ", "ΣΑΛΑΤΕΣ", "ΖΥΜΑΡΙΚΑ", "ΠΙΤΣΕΣ", "ΑΛΜΥΡΕΣ ΚΡΕΠΕΣ", "ΓΛΥΚΕΣ ΚΡΕΠΕΣ", "ΓΛΥΚΑ", "ΠΟΤΑ"
];

const CATEGORY_TRANSLATIONS = {
  "ΠΡΟΤΕΙΝΟΜΕΝΑ": { en: "RECOMMENDED", tr: "ÖNERİLENLER" },
  "ΚΑΦΕΔΕΣ": { en: "COFFEES", tr: "KAHVELER" },
  "ΑΝΑΨΥΚΤΙΚΑ": { en: "SOFT DRINKS", tr: "İÇECEKLER" },
  "ΡΟΦΗΜΑΤΑ": { en: "BEVERAGES", tr: "SICAK İÇECEKLER" },
  "ΠΡΩΙΝΟ": { en: "BREAKFAST", tr: "KAHVALTI" },
  "ΜΠΥΡΕΣ": { en: "BEERS", tr: "BİRALAR" },
  "ΣΝΑΚΣ": { en: "SNACKS", tr: "ATIŞTIRMALIKLAR" },
  "ΣΥΝΟΔΕΥΤΙΚΑ": { en: "SIDE DISHES", tr: "YAN LEZZETLER" },
  "ΣΑΛΑΤΕΣ": { en: "SALADS", tr: "SALATALAR" },
  "ΖΥΜΑΡΙΚΑ": { en: "PASTA", tr: "MAKARNALAR" },
  "ΠΙΤΣΕΣ": { en: "PIZZAS", tr: "PİZZALAR" },
  "ΑΛΜΥΡΕΣ ΚΡΕΠΕΣ": { en: "SAVORY CREPES", tr: "TUZLU KREPLER" },
  "ΓΛΥΚΕΣ ΚΡΕΠΕΣ": { en: "SWEET CREPES", tr: "TATLI KREPLER" },
  "ΓΛΥΚΑ": { en: "DESSERTS", tr: "TATLILAR" },
  "ΠΟΤΑ": { en: "DRINKS", tr: "İÇKİLER" }
};

const DEFAULT_TABLES = [...Array.from({ length: 20 }, (_, i) => `A${i + 1}`), ...Array.from({ length: 6 }, (_, i) => `Γ${i + 1}`), ...Array.from({ length: 20 }, (_, i) => `Δ${i + 1}`), "ΠΑΚΕΤΟ"];

const REWARD_THRESHOLD = 40;

const normalizeStr = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() : "";

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; 
  const f1 = (lat1 * Math.PI) / 180;
  const f2 = (lat2 * Math.PI) / 180;
  const df = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(df / 2) * Math.sin(df / 2) + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getSmartImage = (product) => {
  if (product.image_url) return product.image_url;
  const name = (product.name || "").toUpperCase();
  const cat = (product.category || "").toUpperCase();
  if (name.includes("RED BULL") || name.includes("REDBULL")) return "https://images.unsplash.com/photo-1632168925528-9821ce705cc8?auto=format&fit=crop&w=400&q=80"; 
  if (name.includes("MONSTER")) return "https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=400&q=80"; 
  if (name.includes("COCA COLA") || name.includes("COLA") || name.includes("ΚΟΚΑ ΚΟΛΑ")) return "https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=400&q=80";
  if (name.includes("FANTA") || name.includes("SPRITE") || name.includes("7UP")) return "https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&w=400&q=80";
  if (name.includes("ΝΕΡΟ") || name.includes("WATER") || name.includes("ΑΥΡΑ") || name.includes("ΖΑΓΟΡΙ")) return "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80";
  if (name.includes("FREDDO") || name.includes("ΦΡΕΝΤΟ") || name.includes("ICE") || name.includes("FRAPPE") || name.includes("ΦΡΑΠΕ")) return "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80";
  if (name.includes("CLUB") || name.includes("SANDWICH") || name.includes("ΤΟΑΣΤ")) return "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80";
  if (name.includes("ΒΑΦΛ") || name.includes("WAFFLE")) return "https://images.unsplash.com/photo-1562376552-0d160a2f9fa4?auto=format&fit=crop&w=400&q=80";
  if (name.includes("ΣΟΚΟΛΑΤ") || name.includes("BUENO") || name.includes("NUTELLA") || cat.includes("ΓΛΥΚΕΣ ΚΡΕΠ")) return "https://images.unsplash.com/photo-1554522723-b2a47cb105e3?auto=format&fit=crop&w=400&q=80";
  if (cat.includes("ΚΡΕΠ") || name.includes("ΚΡΕΠ")) return "https://images.unsplash.com/photo-1613769049987-b31b641f25b1?auto=format&fit=crop&w=400&q=80";
  if (cat.includes("ΠΙΤΣ") || name.includes("ΠΙΤΣ") || name.includes("PIZZA")) return "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80";
  if (cat.includes("ΚΑΦΕ") || cat.includes("ΡΟΦΗΜ") || name.includes("ESPRESSO") || name.includes("CAPPUCCINO")) return "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80";
  if (cat.includes("ΜΠΥΡ") || name.includes("BEER") || name.includes("ΑΛΚΟΟΛ")) return "https://images.unsplash.com/photo-1586993451228-09818016e34b?auto=format&fit=crop&w=400&q=80";
  if (cat.includes("ΣΑΛΑΤ") || name.includes("SALAD")) return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80";
  if (cat.includes("ΑΝΑΨΥΚΤΙΚ") || name.includes("ΧΥΜΟ")) return "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80";
  if (cat.includes("ΓΛΥΚ") || cat.includes("ΠΑΓΩΤ") || name.includes("SWEET")) return "https://images.unsplash.com/photo-1551024506-0cb4a1cb1cce?auto=format&fit=crop&w=400&q=80";
  if (cat.includes("ΖΥΜΑΡΙΚ") || name.includes("ΜΑΚΑΡΟΝ") || name.includes("PASTA")) return "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=400&q=80";
  if (cat.includes("ΣΝΑΚ") || cat.includes("ΠΡΩΙΝΟ") || name.includes("CROISSANT")) return "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80";
  if (cat.includes("ΠΟΤΑ") || cat.includes("ΚΟΚΤΕΙΛ") || name.includes("COCKTAIL") || name.includes("DRINK")) return "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=400&q=80";
  return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80";
};

const removeAccents = (str) => {
  if (!str) return str;
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const normalizeForSearch = (str) => {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ς/g, "σ");
};

const DICT = {
  gr: {
    requiredTable: "ΕΠΙΛΕΞΤΕ ΤΡΑΠΕΖΙ", table: "ΤΡΑΠΕΖΙ", selectManual: "Λειτουργία Χειροκίνητης Επιλογής", btnSelectTable: "ΕΠΙΛΟΓΗ ΤΡΑΠΕΖΙΟΥ", rec: "ΠΡΟΤΕΙΝΟΜΕΝΑ", outOfStock: "Εξαντλήθηκε", unavail: "ΜΗ ΔΙΑΘΕΣΙΜΟ", add: "ΠΡΟΣΘΗΚΗ", req: "ΥΠΟΧΡΕΩΤΙΚΟ", opt: "ΠΡΟΑΙΡΕΤΙΚΟ", upTo: "ΕΩΣ", select1: "ΕΠΙΛΕΞΤΕ 1", free: "ΧΩΡΙΣ ΧΡΕΩΣΗ", addToCart: "ΠΡΟΣΘΗΚΗ", viewCart: "ΠΡΟΒΟΛΗ ΚΑΛΑΘΙΟΥ", yourOrder: "Η ΠΑΡΑΓΓΕΛΙΑ ΣΑΣ", note: "ΣΗΜΕΙΩΣΗ", itemNotePlaceholder: "Π.χ. Χωρίς ζάχαρη, έξτρα πάγο...", genNoteTitle: "ΓΕΝΙΚΗ ΣΗΜΕΙΩΣΗ (ΠΡΟΑΙΡΕΤΙΚΟ)", payMethod: "ΤΡΟΠΟΣ ΠΛΗΡΩΜΗΣ", cash: "ΜΕΤΡΗΤΑ", card: "ΚΑΡΤΑ", send: "ΑΠΟΣΤΟΛΗ", selPay: "ΕΠΙΛΕΞΤΕ ΠΛΗΡΩΜΗ", history: "ΠΡΟΗΓΟΥΜΕΝΕΣ ΠΑΡΑΓΓΕΛΙΕΣ", noHistory: "Δεν εχετε προηγουμενες παραγγελιες", reorder: "ΕΠΑΝΑΛΗΨΗ", hasOptions: "Επιδεχεται επιλογες", search: "Αναζήτηση προϊόντος...", qty: "ΠΟΣΟΤΗΤΑ", noResults: "Δεν βρέθηκαν προϊόντα.", pausedBanner: "ΠΡΟΣΩΡΙΝΗ ΠΑΥΣΗ ΠΑΡΑΓΓΕΛΙΩΝ ΛΟΓΩ ΦΟΡΤΟΥ", pausedCartMsg: "Δεν μπορούν να σταλούν νέες παραγγελίες αυτή τη στιγμή.", edit: "ΕΠΕΞΕΡΓΑΣΙΑ", save: "ΑΠΟΘΗΚΕΥΣΗ", loyaltyTitle: "ΔΩΡΟ ΜΕ ΠΑΡΑΓΓΕΛΙΑ", loyaltyReward: "ΔΙΚΑΙΟΥΣΑΙ ΔΩΡΕΑΝ ΚΕΡΑΣΜΑ! 🎁", privacyTitle: "Πολιτική Απορρήτου & Ασφάλεια", privacyLink: "Πολιτική Απορρήτου (GDPR)", locErrorSupport: "Η συσκευή σας δεν υποστηρίζει εντοπισμό τοποθεσίας.", locErrorDenied: "Παρακαλώ επιτρέψτε την πρόσβαση στην τοποθεσία (GPS) για να στείλετε παραγγελία.", locErrorFar: "Φαίνεται πως βρίσκεστε εκτός του καταστήματος! Η αποστολή παραγγελιών επιτρέπεται μόνο εντός του χώρου μας.", locFinding: "ΕΛΕΓΧΟΣ ΤΟΠΟΘΕΣΙΑΣ...",
    freqBought: "🔥 ΠΟΛΛΟΙ ΣΥΝΔΥΑΖΟΥΝ ΕΠΙΣΗΣ",
    bellCall: "ΚΛΗΣΗ", bellOrder: "🙋‍♂️ Θέλω να παραγγείλω", bellCard: "💳 Λογαριασμός (Κάρτα)", bellCash: "💵 Λογαριασμός (Μετρητά)", bellClean: "🧽 Καθάρισμα Τραπεζιού", bellSent: "Ο σερβιτόρος ειδοποιήθηκε!"
  },
  en: {
    requiredTable: "SELECT TABLE", table: "TABLE", selectManual: "Manual Table Selection", btnSelectTable: "SELECT TABLE", rec: "RECOMMENDED", outOfStock: "Out of Stock", unavail: "UNAVAILABLE", add: "ADD", req: "REQUIRED", opt: "OPTIONAL", upTo: "UP TO", select1: "SELECT 1", free: "FREE", addToCart: "ADD TO CART", viewCart: "VIEW CART", yourOrder: "YOUR ORDER", note: "NOTE", itemNotePlaceholder: "E.g. No sugar, extra ice...", genNoteTitle: "GENERAL NOTE (OPTIONAL)", payMethod: "PAYMENT METHOD", cash: "CASH", card: "CARD", send: "SEND ORDER", selPay: "SELECT PAYMENT", history: "PREVIOUS ORDERS", noHistory: "You have no previous orders", reorder: "REORDER", hasOptions: "Options available", search: "Search products...", qty: "QUANTITY", noResults: "No products found.", pausedBanner: "ORDERS TEMPORARILY PAUSED DUE TO HIGH VOLUME", pausedCartMsg: "New orders cannot be sent at this time.", edit: "EDIT", save: "SAVE", loyaltyTitle: "GIFT WITH ORDER", loyaltyReward: "YOU GET A FREE TREAT! 🎁", privacyTitle: "Privacy Policy & Security", privacyLink: "Privacy Policy (GDPR)", locErrorSupport: "Your device does not support location tracking.", locErrorDenied: "Please allow location access (GPS) to send your order.", locErrorFar: "It seems you are outside the store! Orders can only be sent from within our premises.", locFinding: "CHECKING LOCATION...",
    freqBought: "🔥 FREQUENTLY ADDED TOGETHER",
    bellCall: "CALL", bellOrder: "🙋‍♂️ Ready to order", bellCard: "💳 Bill (Card)", bellCash: "💵 Bill (Cash)", bellClean: "🧽 Clean Table", bellSent: "Waiter notified successfully!"
  },
  tr: {
    requiredTable: "MASA SEÇİN", table: "MASA", selectManual: "Manuel Masa Seçimi", btnSelectTable: "MASA SEÇ", rec: "ÖNERİLEN", outOfStock: "Tükendi", unavail: "MEVCUT DEĞİL", add: "EKLE", req: "ZORUNLU", opt: "İSTEĞE BAĞLI", upTo: "KADAR", select1: "1 SEÇİN", free: "ÜCRETSİZ", addToCart: "SEPETE EKLE", viewCart: "SEPETİ GÖR", yourOrder: "SİPARİŞİNİZ", note: "NOT", itemNotePlaceholder: "Örn. Şekersiz, ekstra buzlu...", genNoteTitle: "GENEL NOT (İSTEĞE BAĞLI)", payMethod: "ÖDEME YÖNTEMİ", cash: "NAKİT", card: "KART", send: "SİPARİŞİ GÖNDER", selPay: "ÖDEME SEÇ", history: "ÖNCEKİ SİPARİŞLER", noHistory: "Önceki siparişiniz yok", reorder: "TEKRAR SİPARİŞ VER", hasOptions: "Seçenekler mevcut", search: "Ürün ara...", qty: "MİKTAR", noResults: "Ürün bulunamadı.", pausedBanner: "YOĞUNLUK NEDENİYLE SİPARİŞLER DURDURULDU", pausedCartMsg: "Şu anda yeni sipariş gönderilemiyor.", edit: "DÜZENLE", save: "KAYDET", loyaltyTitle: "SİPARİŞLE HEDİYE", loyaltyReward: "ÜCRETSİZ İKRAM KAZANDINIZ! 🎁", privacyTitle: "Gizlilik Politikası", privacyLink: "Gizlilik Politikası (GDPR)", locErrorSupport: "Cihazınız konum izlemeyi desteklemiyor.", locErrorDenied: "Sipariş göndermek için lütfen konuma izin verin.", locErrorFar: "Mağazanın dışındasınız! Siparişler sadece mekanımızdan gönderilebilir.", locFinding: "KONUM KONTROL EDİLİYOR...",
    freqBought: "🔥 SIKLIKLA BİRLİKTE ALINANLAR",
    bellCall: "ÇAĞIR", bellOrder: "🙋‍♂️ Sipariş vermek istiyorum", bellCard: "💳 Hesap (Kart)", bellCash: "💵 Hesap (Nakit)", bellClean: "🧽 Masayı Temizle", bellSent: "Garsona haber verildi!"
  }
};

export default function Menu() {
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ΠΡΟΤΕΙΝΟΜΕΝΑ");
  const [cart, setCart] = useState([]);
  const [storeId] = useState(new URLSearchParams(window.location.search).get("store") || "1");
  const urlTable = new URLSearchParams(window.location.search).get("table");
  const [tableNum, setTableNum] = useState(urlTable === "null" ? null : urlTable);
  
  // STATE ΓΙΑ GRID / LIST VIEW
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("view_mode") || "list");
  const toggleViewMode = () => {
    const newMode = viewMode === "list" ? "grid" : "list";
    setViewMode(newMode);
    localStorage.setItem("view_mode", newMode);
  };

  const [lang, setLang] = useState(() => {
    const browserLang = navigator.language || navigator.userLanguage || "el";
    if (browserLang.toLowerCase().startsWith("el")) return "gr";
    if (browserLang.toLowerCase().startsWith("tr")) return "tr";
    return "en";
  });

  const cycleLanguage = () => {
    if (lang === "gr") setLang("en");
    else if (lang === "en") setLang("tr");
    else setLang("gr");
  };
  
  const t = DICT[lang];
  
  const [custId] = useState(() => {
    let id = localStorage.getItem("loyalty_id");
    if (!id) {
      id = "cust_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("loyalty_id", id);
    }
    return id;
  });

  const [theme, setTheme] = useState(() => localStorage.getItem("app_theme") || "light");
  
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("app_theme", newTheme);
  };
  
  const isDark = theme === "dark";

  useEffect(() => {
    document.body.style.backgroundColor = isDark ? '#111827' : '#f9fafb';
  }, [isDark]);

  const [searchQuery, setSearchQuery] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cartBounce, setCartBounce] = useState(false);
  const [backupMode, setBackupMode] = useState(false);
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(true);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [lastOrderId, setLastOrderId] = useState(localStorage.getItem("lastOrderId"));
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [generalNote, setGeneralNote] = useState("");
  const [activeProduct, setActiveProduct] = useState(null);
  const [addonSelections, setAddonSelections] = useState({});
  const [currentProductNote, setCurrentProductNote] = useState("");
  const [editingCartId, setEditingCartId] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showBellMenu, setShowBellMenu] = useState(false);

  const [orderHistory, setOrderHistory] = useState(() => {
    const saved = localStorage.getItem(`status_order_history_${storeId}`);
    return saved ? JSON.parse(saved) : [];
  });
  
  const categoryNavRef = useRef(null);
  const carouselRef = useRef(null);
  
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  useEffect(() => {
    const interval = setInterval(() => setCurrentHour(new Date().getHours()), 60000);
    return () => clearInterval(interval);
  }, []);

  const isMorning = currentHour >= 6 && currentHour < 14;

  const fetchData = async () => {
    const { data: s } = await supabase.from("stores").select("*").eq("id", storeId).single();
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
      
    if (p) {
      setProducts(p.map((prod) => {
        const cP = { 
          ...prod, 
          name: removeAccents(prod.name), 
          name_en: removeAccents(prod.name_en), 
          name_tr: removeAccents(prod.name_tr), 
          description: removeAccents(prod.description), 
          description_en: removeAccents(prod.description_en),
          description_tr: removeAccents(prod.description_tr),
          category: removeAccents(prod.category) 
        };
        if (cP.addons) {
          cP.addons = cP.addons.map((g) => ({ 
            ...g, 
            name: removeAccents(g.name), 
            name_en: removeAccents(g.name_en), 
            options: g.options.map((opt) => ({ 
              ...opt, 
              name: removeAccents(opt.name), 
              name_en: removeAccents(opt.name_en) 
            })) 
          }));
        }
        return cP;
      }));
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    const channel = supabase.channel("menu_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchData())
      .subscribe();
      
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  useEffect(() => {
    const autoScrollInterval = setInterval(() => {
      if (carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        const scrollAmount = 260; 
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          carouselRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
      }
    }, 3000);
    return () => clearInterval(autoScrollInterval);
  }, []);

  const visibleProducts = products.filter((p) => p.category === "ΠΡΩΙΝΟ" && !isMorning ? false : true);
  const hasRecommended = visibleProducts.some((p) => p.is_recommended);
  
  const rawCategories = [...new Set(visibleProducts.map((p) => p.category))].sort((a, b) => {
    const orderArr = store?.category_order || CATEGORY_ORDER_FALLBACK;
    let idxA = orderArr.indexOf(a); 
    let idxB = orderArr.indexOf(b);
    if (idxA === -1) idxA = 999; 
    if (idxB === -1) idxB = 999;
    return idxA - idxB;
  });
  
  const baseCategories = hasRecommended ? ["ΠΡΟΤΕΙΝΟΜΕΝΑ", ...rawCategories] : rawCategories;

  useEffect(() => {
    if (baseCategories.length > 0 && selectedCategory === "ΠΡΟΤΕΙΝΟΜΕΝΑ" && !hasRecommended) {
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
          if (rect.top <= 250 && rect.bottom >= 250) {
            currentActive = cat;
          }
        }
      }
      if (currentActive !== selectedCategory) {
        setSelectedCategory(currentActive);
        const btn = document.getElementById(`btn-cat-${currentActive}`);
        if (btn && categoryNavRef.current) {
          categoryNavRef.current.scrollTo({ left: btn.offsetLeft - 20, behavior: "smooth" });
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
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 230, behavior: "smooth" });
    }
  };

  const getCategoryDisplayName = (cat) => {
    if (cat === "ΠΡΟΤΕΙΝΟΜΕΝΑ") return `⭐ ${t.rec}`;
    if (lang === "gr") return cat;
    if (CATEGORY_TRANSLATIONS[cat] && CATEGORY_TRANSLATIONS[cat][lang]) {
      return CATEGORY_TRANSLATIONS[cat][lang];
    }
    const sampleProduct = visibleProducts.find((p) => p.category === cat);
    if (lang === "tr" && sampleProduct && sampleProduct.category_tr) return sampleProduct.category_tr;
    if (lang === "en" && sampleProduct && sampleProduct.category_en) return sampleProduct.category_en;
    return cat;
  };

  const handleProductClick = (product) => {
    const initialSels = {};
    if (product.addons) {
      product.addons.forEach((g) => (initialSels[g.id] = []));
    }
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
    let extraPrice = 0; let addonTexts = []; let isValid = true;
    
    let isSketosSelected = false;
    (activeProduct.addons || []).forEach((g) => {
      const sels = addonSelections[g.id] || [];
      sels.forEach((idx) => {
        const optName = normalizeStr(g.options[idx]?.name);
        if (optName.includes("ΣΚΕΤ") || optName.includes("ΧΩΡΙΣ")) isSketosSelected = true;
      });
    });

    (activeProduct.addons || []).forEach((g) => {
      const groupNameUpper = normalizeStr(g.name);
      const isSugarType = groupNameUpper.includes("ΖΑΧΑΡ") || groupNameUpper.includes("ΓΛΥΚΑΝΤΙΚ");
      
      let required = g.isRequired;
      if (isSketosSelected && isSugarType) required = false;

      const sels = addonSelections[g.id] || [];
      if (required && sels.length === 0) isValid = false;
      
      if (sels.length > 0) {
        const names = sels.map((idx) => {
          if (lang === "tr" && g.options[idx].name_tr) return g.options[idx].name_tr;
          if (lang === "en" && g.options[idx].name_en) return g.options[idx].name_en;
          return g.options[idx].name;
        });
        addonTexts.push(names.join(", "));
        sels.forEach((idx) => (extraPrice += g.options[idx].price));
      }
    });
    
    if (!isValid) return alert(lang === "gr" ? "Παρακαλώ συμπληρώστε όλες τις υποχρεωτικές επιλογές!" : "Please fill all required options!");
    
    const finalName = addonTexts.length > 0 ? `${activeProduct.name} (${addonTexts.join(" | ")})` : activeProduct.name;
    const finalPrice = activeProduct.price + extraPrice;
    const newItem = { 
      ...activeProduct, 
      cartId: editingCartId || Date.now() + Math.random(), 
      name: finalName, 
      price: finalPrice, 
      note: removeAccents(currentProductNote), 
      rawAddons: addonSelections, 
      quantity: quantity 
    };
    
    if (editingCartId) { 
      setCart(cart.map((item) => (item.cartId === editingCartId ? newItem : item))); 
      setIsCartOpen(true); 
    } else { 
      setCart([...cart, newItem]); 
      setCartBounce(true); 
      setTimeout(() => setCartBounce(false), 300); 
    }
    
    setActiveProduct(null); 
    setEditingCartId(null); 
    setCurrentProductNote("");
  };

  const updateCartItemQuantity = (cartId, delta) => {
    setCart(cart.map((item) => item.cartId === cartId ? { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) } : item));
  };

  const removeFromCart = (cartId) => {
    const newCart = cart.filter((item) => item.cartId !== cartId);
    setCart(newCart); 
    if (newCart.length === 0) setIsCartOpen(false);
  };

  const canOrder = store?.enable_ordering !== false;
  const canCallWaiter = store?.enable_call_waiter !== false;
  const themeColor = store?.theme_color || "#2563EB";
  const tablesList = store?.tables || DEFAULT_TABLES;

  const activeThreshold = store?.reward_threshold || REWARD_THRESHOLD;
  const currentCartTotal = cart.reduce((s, i) => s + i.price * (i.quantity || 1), 0);
  const isRewardOrder = currentCartTotal >= activeThreshold;
  const progressPercent = Math.min((currentCartTotal / activeThreshold) * 100, 100);
  const totalItemsCount = cart.reduce((s, i) => s + (i.quantity || 1), 0);

  const proceedToGeofencing = () => {
    if (!store?.lat || !store?.lng) {
      sendOrder();
      return;
    }
    if (!navigator.geolocation) return alert(t.locErrorSupport);
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const radius = store.radius || 100;
        const dist = getDistance(latitude, longitude, store.lat, store.lng);
        setIsLocating(false);
        if (dist <= radius) sendOrder();
        else alert(t.locErrorFar);
      },
      (error) => { 
        setIsLocating(false); 
        alert(t.locErrorDenied); 
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const sendOrder = async () => {
    if (!paymentMethod || cart.length === 0 || !tableNum || !isAcceptingOrders) return;
    
    const { data, error } = await supabase.from("orders").insert([{
      store_id: storeId, 
      table_number: tableNum, 
      items: cart, 
      total_price: currentCartTotal, 
      payment_method: paymentMethod, 
      status: "pending", 
      general_note: removeAccents(generalNote), 
      customer_id: custId, 
      is_loyalty_reward: isRewardOrder,
    }]).select();
    
    if (!error && data) {
      const newHistoryOrder = { id: data[0].id, date: new Date().toISOString(), items: cart, total: currentCartTotal, status: "pending" };
      const updatedHistory = [newHistoryOrder, ...orderHistory].slice(0, 10);
      setOrderHistory(updatedHistory); 
      localStorage.setItem(`status_order_history_${storeId}`, JSON.stringify(updatedHistory)); 
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
        quantity: item.quantity || 1 
      }))
    ]);
    setIsHistoryOpen(false); 
    setIsCartOpen(true);
  };

  const sendBellRequest = async (actionText) => {
    if (!tableNum) {
      alert(t.requiredTable);
      setShowTablePicker(true);
      setShowBellMenu(false);
      return;
    }
    
    const { error } = await supabase.from("orders").insert([{
      store_id: storeId, 
      table_number: tableNum, 
      items: [],
      total_price: 0, 
      payment_method: "ΚΛΗΣΗ ΣΕΡΒΙΤΟΡΟΥ",
      status: "pending", 
      general_note: `🛎️ ΚΛΗΣΗ ΓΙΑ: ${actionText}`,
      customer_id: custId
    }]);

    if (!error) {
      alert(t.bellSent);
      setShowBellMenu(false);
    }
  };

  const getItemDisplayName = (item) => {
    const orig = products.find((p) => p.id === item.id);
    if (!orig) return item.name;
    const baseName = lang === "tr" && orig.name_tr ? orig.name_tr : (lang === "en" && orig.name_en ? orig.name_en : orig.name);
    let addonTexts = [];
    (orig.addons || []).forEach((g) => {
      const sels = item.rawAddons?.[g.id] || [];
      if (sels.length > 0) {
        const names = sels.map((idx) => {
          if (lang === "tr" && g.options[idx].name_tr) return g.options[idx].name_tr;
          if (lang === "en" && g.options[idx].name_en) return g.options[idx].name_en;
          return g.options[idx].name;
        });
        addonTexts.push(names.join(", "));
      }
    });
    return addonTexts.length > 0 ? `${baseName} (${addonTexts.join(" | ")})` : baseName;
  };

  // ΕΝΙΑΙΑ ΣΥΝΑΡΤΗΣΗ ΣΧΕΔΙΑΣΜΟΥ ΠΡΟΪΟΝΤΩΝ
  const renderProductCard = (p) => {
    const dispName = lang === "tr" && p.name_tr ? p.name_tr : (lang === "en" && p.name_en ? p.name_en : p.name);
    const dispDesc = lang === "tr" && p.description_tr ? p.description_tr : (lang === "en" && p.description_en ? p.description_en : p.description);
    
    if (viewMode === "grid") {
      return (
        <div 
          key={p.id} 
          onClick={() => p.is_available && handleProductClick(p)} 
          className={`flex flex-col rounded-[1.25rem] shadow-sm border overflow-hidden transition-all ${p.is_available ? "cursor-pointer hover:shadow-md active:scale-95" : ""} ${!p.is_available ? "opacity-50 grayscale" : ""} ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}
        >
          <div className={`w-full h-32 relative shrink-0 ${isDark ? "bg-gray-700" : "bg-gray-200"}`}>
            <img src={getSmartImage(p)} alt={dispName} loading="lazy" className="w-full h-full object-cover" />
          </div>
          
          <div className="p-3 flex flex-col flex-1 justify-between">
            <div>
              <h3 className={`font-black text-xs leading-tight uppercase line-clamp-2 ${isDark ? "text-white" : "text-gray-900"}`}>{dispName}</h3>
              {canOrder && p.addons && p.addons.length > 0 && <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">{t.hasOptions}</p>}
            </div>
            <div className="flex justify-between items-center mt-3">
              <span className="font-black text-sm" style={{ color: themeColor }}>{p.price.toFixed(2)}€</span>
              {!p.is_available ? (
                <span className="text-[9px] font-bold text-red-500 uppercase">{t.outOfStock}</span>
              ) : canOrder ? (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md" style={{ backgroundColor: themeColor }}>+</div>
              ) : null}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div 
        key={p.id} 
        onClick={() => p.is_available && handleProductClick(p)} 
        className={`flex rounded-2xl shadow-sm border p-3 gap-4 transition-all ${p.is_available ? "cursor-pointer hover:shadow-md active:scale-[0.98]" : ""} ${!p.is_available ? "opacity-50 grayscale" : ""} ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100/50"}`}
      >
        <div className={`w-24 h-24 rounded-xl shrink-0 shadow-inner overflow-hidden relative ${isDark ? "bg-gray-700" : "bg-gray-200"}`}>
          <img src={getSmartImage(p)} alt={dispName} loading="lazy" className="w-full h-full object-cover" />
        </div>
        
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <h3 className={`font-black text-sm leading-tight uppercase ${isDark ? "text-white" : "text-gray-900"}`}>{dispName}</h3>
            {dispDesc && <p className="text-[10px] text-gray-500 mt-1 leading-snug line-clamp-2 font-medium">{dispDesc}</p>}
            {canOrder && p.addons && p.addons.length > 0 && <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">{t.hasOptions}</p>}
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="font-black text-lg" style={{ color: themeColor }}>{p.price.toFixed(2)}€</span>
            {!p.is_available ? (
              <span className="text-[10px] font-bold text-red-500 uppercase">{t.outOfStock}</span>
            ) : canOrder ? (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-lg shadow-md" style={{ backgroundColor: themeColor }}>+</div>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  if (lastOrderId && lastOrderId !== "null") {
    return (
      <OrderStatus 
        orderId={lastOrderId} lang={lang} products={products} theme={theme} 
        onBack={(clearTable) => { 
          setLastOrderId(null); 
          localStorage.removeItem("lastOrderId"); 
          if (clearTable) { setTableNum(null); if (window.history.replaceState) window.history.replaceState({}, document.title, window.location.pathname); } 
        }} 
      />
    );
  }

  const filteredProducts = searchQuery ? visibleProducts.filter((p) => {
    const searchNorm = normalizeForSearch(searchQuery);
    return normalizeForSearch(p.name).includes(searchNorm) || (p.name_en && normalizeForSearch(p.name_en).includes(searchNorm));
  }) : [];

  return (
    <div className={`min-h-screen flex flex-col pb-32 font-sans relative ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      
      <div className="sticky top-0 z-50 flex flex-col w-full">
        <CustomerHeader 
          storeLogo={store?.logo_url} storeName={store?.name} tableNum={tableNum} isDark={isDark} 
          toggleTheme={toggleTheme} lang={lang} toggleLanguage={cycleLanguage} storeThemeColor={themeColor} 
          t={t} canOrder={canOrder} setIsHistoryOpen={setIsHistoryOpen}
        />
        {!isAcceptingOrders && canOrder && (
          <div className="w-full bg-red-500 text-white p-2 text-center font-black text-[10px] uppercase tracking-widest shadow-md">
            ⚠️ {t.pausedBanner}
          </div>
        )}
      </div>

      <main className="flex-1 w-full max-w-5xl mx-auto">
        
        {(!tableNum || tableNum === "") && backupMode === true && canOrder && (
          <div className={`mx-4 mt-6 mb-2 p-6 border-2 rounded-3xl text-center shadow-md animate-fade-in relative z-10 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white"}`} style={{ borderColor: themeColor }}>
            <p className="text-xs font-black uppercase mb-3" style={{ color: themeColor }}>{t.selectManual}</p>
            <button onClick={() => setShowTablePicker(true)} className="w-full text-white px-8 py-4 rounded-2xl font-black uppercase text-sm shadow-lg active:scale-95 transition-transform" style={{ backgroundColor: themeColor }}>
              {t.btnSelectTable}
            </button>
          </div>
        )}

        {showTablePicker && (
          <div className="fixed inset-0 bg-black/90 z-[200] p-6 overflow-y-auto flex flex-col items-center justify-start pt-20">
            <div className="flex justify-between items-center mb-8 text-white font-black italic uppercase text-lg w-full max-w-md">
              {t.btnSelectTable} 
              <button onClick={() => setShowTablePicker(false)} className="text-3xl">✕</button>
            </div>
            <p className="text-gray-400 text-xs font-bold mb-4 uppercase w-full max-w-md">ΕΠΙΛΟΓΗ ΤΡΑΠΕΖΙΟΥ / ΠΑΚΕΤΟ:</p>
            <div className="grid grid-cols-4 gap-3 w-full max-w-md pb-20">
              {tablesList.map((table) => (
                <button key={table} onClick={() => { setTableNum(table); setShowTablePicker(false); }} className="bg-gray-800 text-white py-5 rounded-2xl font-black text-sm hover:bg-gray-700 active:scale-95 transition-transform">
                  {table}
                </button>
              ))}
            </div>
          </div>
        )}

        {canOrder && (
          <div className={`px-4 py-2 sticky z-30 transition-all ${!isAcceptingOrders ? "top-[112px]" : "top-[76px]"} ${isDark ? "bg-gray-900/90 backdrop-blur-md" : "bg-gray-50/90 backdrop-blur-md"}`}>
            <div className={`p-2.5 rounded-xl border shadow-sm transition-colors duration-500 ${isRewardOrder ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white border-yellow-300" : isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              {isRewardOrder ? (
                <div className="flex justify-center items-center gap-2">
                  <span className="text-xl">🎉</span>
                  <h3 className="font-black text-[10px] uppercase tracking-widest drop-shadow-sm">{t.loyaltyReward}</h3>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-black text-[9px] uppercase tracking-widest text-gray-500">🎁 {t.loyaltyTitle}</span>
                    <span className={`font-black text-[9px] px-1.5 py-0.5 rounded-md ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                      {currentCartTotal.toFixed(2)}€ / {activeThreshold}€
                    </span>
                  </div>
                  <div className={`w-full rounded-full h-1.5 overflow-hidden shadow-inner ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
                    <div className="h-1.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%`, backgroundColor: themeColor }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!backupMode && (
          <div className={`px-4 py-2 relative z-20 transition-all flex gap-2 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input 
                type="text" 
                placeholder={t.search} 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className={`w-full border rounded-2xl pl-11 pr-4 py-3 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"}`} 
                style={{ focusRingColor: themeColor }} 
              />
            </div>
            <button 
              onClick={toggleViewMode} 
              className={`w-12 h-[46px] rounded-2xl flex items-center justify-center text-xl shadow-sm border transition-all active:scale-95 ${isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-600'}`}
            >
              {viewMode === "list" ? "🔲" : "📄"}
            </button>
          </div>
        )}

        {!searchQuery && (
          <div ref={categoryNavRef} className={`flex overflow-x-auto py-3 px-4 gap-3 backdrop-blur-md sticky z-20 no-scrollbar border-b transition-all ${!isAcceptingOrders && canOrder ? "top-[172px]" : "top-[136px]"} ${isDark ? "bg-gray-900/90 border-gray-800" : "bg-gray-50/90 border-gray-200/50"}`}>
            {baseCategories.map((cat) => (
              <button 
                key={cat} id={`btn-cat-${cat}`} onClick={() => scrollToCategory(cat)} 
                className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wide transition-all whitespace-nowrap shadow-sm ${selectedCategory !== cat ? isDark ? "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700" : "bg-white text-gray-600 border border-gray-200/50 hover:bg-gray-100" : "scale-105"}`} 
                style={selectedCategory === cat ? { backgroundColor: themeColor, color: "#ffffff" } : {}}
              >
                {getCategoryDisplayName(cat)}
              </button>
            ))}
          </div>
        )}

        <div className="p-4 space-y-8 animate-fade-in">
          {searchQuery ? (
            <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3" : "space-y-3"}>
              {filteredProducts.length === 0 ? (
                <p className="text-center text-gray-400 font-bold uppercase mt-10 col-span-full">{t.noResults}</p>
              ) : (
                filteredProducts.map(renderProductCard)
              )}
            </div>
          ) : (
            baseCategories.map((cat) => {
              const sectionProducts = cat === "ΠΡΟΤΕΙΝΟΜΕΝΑ" ? visibleProducts.filter((p) => p.is_recommended) : visibleProducts.filter((p) => p.category === cat);
              if (sectionProducts.length === 0) return null;
              
              return (
                <div key={cat} id={`category-${cat}`} className="scroll-mt-[220px]">
                  <h2 className={`font-black italic text-2xl mb-4 tracking-tighter pl-1 ${isDark ? "text-gray-100" : "text-gray-800"}`}>
                    {getCategoryDisplayName(cat)}
                  </h2>
                  {cat === "ΠΡΟΤΕΙΝΟΜΕΝΑ" ? (
                    <div ref={carouselRef} className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 snap-x snap-mandatory no-scrollbar">
                      {sectionProducts.map((p) => {
                        const dispName = lang === "tr" && p.name_tr ? p.name_tr : (lang === "en" && p.name_en ? p.name_en : p.name);
                        const dispDesc = lang === "tr" && p.description_tr ? p.description_tr : (lang === "en" && p.description_en ? p.description_en : p.description);
                        return (
                          <div key={p.id} onClick={() => p.is_available && handleProductClick(p)} className={`min-w-[240px] max-w-[260px] snap-center shrink-0 rounded-3xl shadow-sm border overflow-hidden flex flex-col transition-all ${p.is_available ? "cursor-pointer hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]" : ""} ${!p.is_available ? "opacity-50 grayscale" : ""} ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                            <div className={`h-44 w-full relative ${isDark ? "bg-gray-700" : "bg-gray-200"}`}>
                              <img src={getSmartImage(p)} alt={dispName} loading="lazy" className="w-full h-full object-cover" />
                              <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-[9px] font-black px-2 py-1.5 rounded-lg shadow-sm uppercase tracking-widest">
                                ⭐ {t.rec}
                              </div>
                            </div>
                            
                            <div className="p-4 flex flex-col flex-1 justify-between">
                              <div>
                                <h3 className={`font-black text-[14px] uppercase leading-tight line-clamp-2 ${isDark ? "text-white" : "text-gray-900"}`}>{dispName}</h3>
                                {dispDesc && <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed line-clamp-2 font-medium">{dispDesc}</p>}
                                {canOrder && p.addons && p.addons.length > 0 && <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase">{t.hasOptions}</p>}
                              </div>
                              <div className="flex justify-between items-center mt-4">
                                <p className="font-black text-xl" style={{ color: themeColor }}>{p.price.toFixed(2)}€</p>
                                {!p.is_available ? (
                                  <span className="text-[10px] font-bold text-red-500 uppercase">{t.outOfStock}</span>
                                ) : canOrder ? (
                                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black shadow-md transition-transform active:scale-95" style={{ backgroundColor: themeColor }}>+</div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3" : "space-y-3"}>
                      {sectionProducts.map(renderProductCard)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      <ProductModal 
        theme={theme} activeProduct={activeProduct} lang={lang} t={t} editingCartId={editingCartId} 
        closeProductModal={closeProductModal} addonSelections={addonSelections} toggleAddon={toggleAddon} 
        themeColor={themeColor} quantity={quantity} setQuantity={setQuantity} currentProductNote={currentProductNote} 
        setCurrentProductNote={setCurrentProductNote} confirmAddons={confirmAddons} canOrder={canOrder}
      />

      {/* COMPACT FLOATING CART (ΚΥΛΙΝΔΡΟΣ / CAPSULE) */}
      {canOrder && cart.length > 0 && !isCartOpen && !activeProduct && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button 
            onClick={() => setIsCartOpen(true)} 
            className={`flex items-center gap-3 text-white py-3 px-6 rounded-[2rem] shadow-2xl transition-all duration-300 ${cartBounce ? "scale-110 shadow-blue-500/50" : "hover:scale-105 active:scale-95"}`} 
            style={{ backgroundColor: themeColor }}
          >
            <div className="bg-white text-black w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-sm">
              {totalItemsCount}
            </div>
            <span className="font-black text-base whitespace-nowrap">{currentCartTotal.toFixed(2)}€</span>
            <span className="text-lg">🛒</span>
          </button>
        </div>
      )}

      {canOrder && (
        <CartModal 
          theme={theme} isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} cart={cart} 
          updateCartItemQuantity={updateCartItemQuantity} handleEditCartItem={handleEditCartItem} 
          removeFromCart={removeFromCart} getItemDisplayName={getItemDisplayName} themeColor={themeColor} 
          t={t} lang={lang} products={products} handleProductClick={(p) => { setIsCartOpen(false); handleProductClick(p); }}
          getSmartImage={getSmartImage} generalNote={generalNote} setGeneralNote={setGeneralNote} 
          paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} isAcceptingOrders={isAcceptingOrders} 
          tableNum={tableNum} handleSendOrderClick={proceedToGeofencing} isLocating={isLocating} 
          openPrivacy={() => setShowPrivacyModal(true)} currentCartTotal={currentCartTotal} 
        />
      )}

      {canCallWaiter && !isCartOpen && !activeProduct && (
        <>
          <button
            onClick={() => setShowBellMenu(true)}
            className={`fixed bottom-6 right-6 w-14 h-14 bg-white border-2 border-gray-200 text-2xl rounded-full shadow-2xl flex items-center justify-center z-40 transition-transform hover:scale-105 active:scale-95`}
          >
            🛎️
          </button>

          {showBellMenu && (
            <div className="fixed inset-0 bg-black/80 z-[500] flex items-end justify-center animate-fade-in" onClick={() => setShowBellMenu(false)}>
              <div className={`w-full max-w-md p-6 rounded-t-[2.5rem] shadow-2xl flex flex-col gap-3 transform transition-transform translate-y-0 ${isDark ? "bg-gray-900 border-t border-gray-800" : "bg-white"}`} onClick={(e) => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4"></div>
                <h3 className={`text-center font-black uppercase tracking-widest text-sm mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{t.bellCall}</h3>
                <button onClick={() => sendBellRequest(t.bellOrder)} className={`py-4 rounded-2xl font-black text-sm uppercase shadow-sm border ${isDark ? "bg-gray-800 text-white border-gray-700" : "bg-gray-50 text-gray-900 border-gray-200"}`}>{t.bellOrder}</button>
                <div className="flex gap-3">
                  <button onClick={() => sendBellRequest(t.bellCard)} className={`flex-1 py-4 rounded-2xl font-black text-sm uppercase shadow-sm border ${isDark ? "bg-gray-800 text-white border-gray-700" : "bg-gray-50 text-gray-900 border-gray-200"}`}>{t.bellCard}</button>
                  <button onClick={() => sendBellRequest(t.bellCash)} className={`flex-1 py-4 rounded-2xl font-black text-sm uppercase shadow-sm border ${isDark ? "bg-gray-800 text-white border-gray-700" : "bg-gray-50 text-gray-900 border-gray-200"}`}>{t.bellCash}</button>
                </div>
                <button onClick={() => sendBellRequest(t.bellClean)} className={`py-4 rounded-2xl font-black text-sm uppercase shadow-sm border ${isDark ? "bg-gray-800 text-white border-gray-700" : "bg-gray-50 text-gray-900 border-gray-200"}`}>{t.bellClean}</button>
                <button onClick={() => setShowBellMenu(false)} className="mt-2 py-4 text-red-500 font-black uppercase text-sm">ΑΚΥΡΟ</button>
              </div>
            </div>
          )}
        </>
      )}

      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowPrivacyModal(false)}>
          <div className={`p-6 rounded-3xl max-w-sm w-full shadow-2xl ${isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`} onClick={e => e.stopPropagation()}>
             <h2 className="font-black text-lg mb-4 uppercase">{t.privacyTitle}</h2>
             <div className="space-y-3 text-sm font-medium opacity-90">
               <p>📍 <b>Τοποθεσία:</b> Ζητάμε την τοποθεσία σας μόνο για να επιβεβαιώσουμε ότι βρίσκεστε εντός του καταστήματος κατά την αποστολή της παραγγελίας.</p>
               <p>🛡️ <b>Δεδομένα:</b> Η διεύθυνση IP και οι συντεταγμένες καταγράφονται προσωρινά για την αποφυγή κακόβουλων παραγγελιών.</p>
               <p>🔒 <b>Προστασία:</b> Τα στοιχεία αυτά δεν κοινοποιούνται σε τρίτους και χρησιμοποιούνται αποκλειστικά για την ασφάλεια των συναλλαγών βάσει GDPR.</p>
             </div>
             <button onClick={() => setShowPrivacyModal(false)} className="mt-6 w-full py-3 text-white rounded-xl font-black uppercase text-sm" style={{ backgroundColor: themeColor }}>ΚΛΕΙΣΙΜΟ</button>
          </div>
        </div>
      )}

      {isHistoryOpen && canOrder && (
        <div className={`fixed inset-0 z-[200] flex flex-col animate-slide-up ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
          <div className={`p-4 flex justify-between items-center shadow-sm border-b ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
            <h2 className={`font-black uppercase text-lg ${isDark ? "text-white" : "text-gray-800"}`}>{t.history}</h2>
            <button onClick={() => setIsHistoryOpen(false)} className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-colors ${isDark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {orderHistory.length === 0 ? (
              <div className="text-center text-gray-400 mt-10 font-bold text-sm uppercase">{t.noHistory}</div>
            ) : (
              orderHistory.map((order) => (
                <div key={order.id} className={`p-5 rounded-3xl shadow-sm border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100/50"}`}>
                  <div className={`flex justify-between items-center mb-3 border-b pb-3 ${isDark ? "border-gray-700" : "border-gray-100"}`}>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(order.date).toLocaleString("el-GR")}</span>
                    <span className="font-black text-lg" style={{ color: themeColor }}>{order.total.toFixed(2)}€</span>
                  </div>
                  <ul className="mb-4 space-y-1">
                    {order.items.map((it, i) => (
                      <li key={i} className={`text-xs font-bold uppercase ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        {it.quantity > 1 ? <span className="text-blue-500 mr-1">{it.quantity}x</span> : "• "}
                        {getItemDisplayName(it)} 
                        {it.note && <span className="text-gray-400 lowercase italic">({it.note})</span>}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => handleReorder(order)} className="w-full text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-colors opacity-90 hover:opacity-100 active:scale-95" style={{ backgroundColor: themeColor }}>{t.reorder}</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

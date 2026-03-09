import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://vgyzevaxkayyobopznyr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZneXpldmF4a2F5eW9ib3B6bnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNjI2MDksImV4cCI6MjA4NjYzODYwOX0.u-kO33BloFq4MU3sZsxN8QVcNTjOOZtsDT4srhbdsCw";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const READY_SOUND =
  "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

const DICT = {
  gr: {
    reviewTitle: "Πως ηταν η εμπειρια σας;", reviewSubtitle: "Η γνωμη σας μας κανει καλυτερους", goodReviewTitle: "Χαιρομαστε πολυ! 😍", goodReviewSub: "Θα μας βοηθούσατε τεράστια με μια δημόσια κριτική.", btnGoogle: "ΑΞΙΟΛΟΓΗΣΗ ΣΤΟ GOOGLE", skipReturn: "ΠΑΡΑΛΕΙΨΗ & ΕΠΙΣΤΡΟΦΗ", badReviewTitle: "Λυπουμαστε πολυ 😔", badReviewSub: "Πείτε μας τι πήγε στραβά για να το διορθώσουμε αμέσως.", placeholder: "Γράψτε το σχόλιό σας εδώ...", btnSubmit: "ΑΠΟΣΤΟΛΗ ΣΧΟΛΙΟΥ", btnSubmitting: "ΑΠΟΣΤΟΛΗ...", skip: "ΠΑΡΑΛΕΙΨΗ", returnMenu: "ΕΠΙΣΤΡΟΦΗ ΣΤΟ ΜΕΝΟΥ", orderTitle: "Η ΠΑΡΑΓΓΕΛΙΑ ΣΑΣ", table: "ΤΡΑΠΕΖΙ", sent: "Εσταλη", preparing: "Ετοιμαζεται", ready: "Ετοιμη", bar: "ΜΠΑΡ", kitchen: "ΚΟΥΖΙΝΑ", statusSent: "ΕΣΤΑΛΗ 📝", statusReady: "ΕΤΟΙΜΑ ✅", statusPrep: "ΕΤΟΙΜΑΖΟΝΤΑΙ ⏳", statusReceived: "Η ΠΑΡΑΓΓΕΛΙΑ ΕΛΗΦΘΗ!", statusPrepMsg: "ΤΟ ΚΑΤΑΣΤΗΜΑ ΕΤΟΙΜΑΖΕΙ...", statusReadyMsg: "Η ΠΑΡΑΓΓΕΛΙΑ ΕΙΝΑΙ ΠΛΗΡΩΣ ΕΤΟΙΜΗ!", thanks: "ΕΥΧΑΡΙΣΤΟΥΜΕ ΠΟΛΥ ΓΙΑ ΤΗΝ ΠΡΟΤΙΜΗΣΗ", notify: "ΘΑ ΣΑΣ ΕΝΗΜΕΡΩΣΟΥΜΕ ΜΟΛΙΣ ΕΙΝΑΙ ΕΤΟΙΜΗ", summary: "Η ΠΑΡΑΓΓΕΛΙΑ ΣΑΣ", total: "ΣΥΝΟΛΟ", payment: "ΠΛΗΡΩΜΗ", newOrder: "ΝΕΑ ΠΑΡΑΓΓΕΛΙΑ",
  },
  en: {
    reviewTitle: "How was your experience?", reviewSubtitle: "Your feedback makes us better", goodReviewTitle: "We are thrilled! 😍", goodReviewSub: "A public review would help us immensely.", btnGoogle: "REVIEW ON GOOGLE", skipReturn: "SKIP & RETURN", badReviewTitle: "We are very sorry 😔", badReviewSub: "Please tell us what went wrong so we can fix it.", placeholder: "Write your comment here...", btnSubmit: "SUBMIT FEEDBACK", btnSubmitting: "SUBMITTING...", skip: "SKIP", returnMenu: "RETURN TO MENU", orderTitle: "YOUR ORDER", table: "TABLE", sent: "Sent", preparing: "Preparing", ready: "Ready", bar: "BAR", kitchen: "KITCHEN", statusSent: "SENT 📝", statusReady: "READY ✅", statusPrep: "PREPARING ⏳", statusReceived: "ORDER RECEIVED!", statusPrepMsg: "PREPARING YOUR ORDER...", statusReadyMsg: "YOUR ORDER IS FULLY READY!", thanks: "THANK YOU FOR YOUR PREFERENCE", notify: "WE WILL NOTIFY YOU WHEN IT's READY", summary: "ORDER SUMMARY", total: "TOTAL", payment: "PAYMENT", newOrder: "NEW ORDER",
  },
};

export default function OrderStatus({
  orderId,
  onBack,
  lang = "gr",
  products = [],
  theme = "light",
}) {
  const [order, setOrder] = useState(null);
  const [storeInfo, setStoreInfo] = useState(null);
  const [prevStatus, setPrevStatus] = useState("pending");

  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = DICT[lang] || DICT.gr;
  const isDark = theme === "dark";

  useEffect(() => {
    // --- ΔΙΟΡΘΩΣΗ SCROLL: ΠΑΕΙ ΤΕΡΜΑ ΠΑΝΩ ΜΟΛΙΣ ΑΝΟΙΞΕΙ ---
    window.scrollTo(0, 0);

    if (!orderId) return;

    let isMounted = true;

    const fetchInitial = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (data && isMounted) {
        setOrder(data);

        const { data: storeData } = await supabase
          .from("stores")
          .select("google_review_link")
          .eq("id", data.store_id)
          .single();

        if (storeData) setStoreInfo(storeData);

        if (data.status === "completed") {
          setShowReview(true);
        } else {
          setPrevStatus(data.status);
        }
      }
    };
    fetchInitial();

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (data && isMounted) {
        setOrder(data);

        if (data.status === "completed") {
          clearInterval(interval);
          setShowReview(true);
          return;
        }

        const hasKitchen = data.items?.some((i) => i.station === "kitchen");
        const hasBar = data.items?.some((i) => i.station !== "kitchen");
        const barStat = data.status || "pending";
        const kitStat = data.kitchen_status || "pending";

        let currentOverall = "pending";
        if (hasKitchen && hasBar) {
          if (barStat === "ready" && kitStat === "ready")
            currentOverall = "ready";
          else if (barStat !== "pending" || kitStat !== "pending")
            currentOverall = "preparing";
        } else if (hasKitchen) {
          currentOverall = kitStat;
        } else {
          currentOverall = barStat;
        }

        if (currentOverall === "ready" && prevStatus !== "ready") {
          const audio = new Audio(READY_SOUND);
          audio.play().catch((e) => console.log("Audio blocked by browser"));
        }

        setPrevStatus(currentOverall);
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orderId]);

  const submitFeedback = async () => {
    if (rating > 0 && rating <= 3 && feedback.trim() !== "") {
      setIsSubmitting(true);
      await supabase.from("reviews").insert([
        {
          store_id: order.store_id,
          order_id: order.id,
          rating: rating,
          comment: feedback,
        },
      ]);
    }
    onBack(true);
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

  if (!order) {
    return (
      <div
        className={`min-h-screen flex justify-center items-center ${
          isDark ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- ΟΘΟΝΗ ΑΞΙΟΛΟΓΗΣΗΣ (REVIEWS) ---
  if (showReview) {
    return (
      <div
        className={`min-h-screen flex flex-col justify-center items-center p-6 animate-fade-in font-sans ${
          isDark ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div
          className={`w-full max-w-md p-8 rounded-[2.5rem] shadow-xl text-center border ${
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
          }`}
        >
          <h2
            className={`text-2xl font-black italic uppercase mb-2 tracking-tighter ${
              isDark ? "text-white" : "text-gray-800"
            }`}
          >
            {t.reviewTitle}
          </h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">
            {t.reviewSubtitle}
          </p>

          <div className="flex gap-2 justify-center mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-5xl transition-all active:scale-90 ${
                  rating >= star
                    ? "text-yellow-400 drop-shadow-md"
                    : isDark
                    ? "text-gray-700"
                    : "text-gray-200"
                }`}
              >
                ★
              </button>
            ))}
          </div>

          {rating >= 4 && (
            <div className="animate-slide-up">
              <div
                className={`p-4 rounded-2xl mb-6 border ${
                  isDark
                    ? "bg-green-900/20 border-green-800"
                    : "bg-green-50 border-green-200"
                }`}
              >
                <p
                  className={`font-black text-sm uppercase ${
                    isDark ? "text-green-400" : "text-green-700"
                  }`}
                >
                  {t.goodReviewTitle}
                </p>
                <p
                  className={`text-xs font-bold mt-1 ${
                    isDark ? "text-green-500" : "text-green-600"
                  }`}
                >
                  {t.goodReviewSub}
                </p>
              </div>

              <a
                href={storeInfo?.google_review_link || "#"}
                target="_blank"
                rel="noreferrer"
                onClick={() => setTimeout(() => onBack(true), 1000)}
                className="block w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-sm shadow-lg mb-3 hover:bg-blue-700"
              >
                {t.btnGoogle}
              </a>

              <button
                onClick={() => onBack(true)}
                className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                  isDark
                    ? "text-gray-500 hover:text-gray-300"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {t.skipReturn}
              </button>
            </div>
          )}

          {rating > 0 && rating <= 3 && (
            <div className="animate-slide-up text-left">
              <div
                className={`p-4 rounded-2xl mb-4 text-center border ${
                  isDark
                    ? "bg-orange-900/20 border-orange-800"
                    : "bg-orange-50 border-orange-200"
                }`}
              >
                <p
                  className={`font-black text-sm uppercase ${
                    isDark ? "text-orange-400" : "text-orange-700"
                  }`}
                >
                  {t.badReviewTitle}
                </p>
                <p
                  className={`text-xs font-bold mt-1 ${
                    isDark ? "text-orange-500" : "text-orange-600"
                  }`}
                >
                  {t.badReviewSub}
                </p>
              </div>
              <textarea
                rows="3"
                placeholder={t.placeholder}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-400 font-bold resize-none mb-4 ${
                  isDark
                    ? "bg-gray-900 border-gray-700 text-white"
                    : "bg-gray-50 border-gray-200"
                }`}
              ></textarea>
              <button
                onClick={submitFeedback}
                disabled={feedback.trim() === "" || isSubmitting}
                className={`w-full py-4 rounded-2xl font-black uppercase text-sm shadow-lg mb-3 transition-colors ${
                  feedback.trim() === ""
                    ? isDark
                      ? "bg-gray-700 text-gray-500"
                      : "bg-gray-200 text-gray-400"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
              >
                {isSubmitting ? t.btnSubmitting : t.btnSubmit}
              </button>
              <div className="text-center">
                <button
                  onClick={() => onBack(true)}
                  className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                    isDark
                      ? "text-gray-500 hover:text-gray-300"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {t.skip}
                </button>
              </div>
            </div>
          )}

          {rating === 0 && (
            <button
              onClick={() => onBack(true)}
              className={`mt-4 text-[10px] font-black uppercase tracking-widest transition-colors ${
                isDark
                  ? "text-gray-500 hover:text-gray-300"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {t.returnMenu}
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- ΟΘΟΝΗ ΑΝΑΜΟΝΗΣ (ORDER STATUS) ---
  const hasKitchen = order.items?.some((i) => i.station === "kitchen");
  const hasBar = order.items?.some((i) => i.station !== "kitchen");

  const barStat = order.status || "pending";
  const kitStat = order.kitchen_status || "pending";

  let overallStatus = "pending";
  if (hasKitchen && hasBar) {
    if (barStat === "ready" && kitStat === "ready") overallStatus = "ready";
    else if (barStat !== "pending" || kitStat !== "pending")
      overallStatus = "preparing";
  } else if (hasKitchen) {
    overallStatus = kitStat;
  } else {
    overallStatus = barStat;
  }

  const isPrep = overallStatus === "preparing" || overallStatus === "ready";
  const isReady = overallStatus === "ready";

  return (
    <div
      className={`min-h-screen flex flex-col font-sans relative pb-28 animate-fade-in ${
        isDark ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <header
        className={`p-6 shadow-sm text-center sticky top-0 z-20 ${
          isDark
            ? "bg-gray-900/90 border-b border-gray-800 backdrop-blur-md"
            : "bg-white"
        }`}
      >
        <h1
          className={`text-xl font-black italic uppercase tracking-tighter ${
            isDark ? "text-white" : "text-gray-800"
          }`}
        >
          {t.orderTitle}
        </h1>
        <div
          className={`mt-2 inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase italic tracking-widest ${
            isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-600"
          }`}
        >
          {t.table} {order.table_number}
        </div>
      </header>

      <div className="p-6 flex-1 max-w-md mx-auto w-full">
        <div
          className={`p-8 rounded-[2.5rem] shadow-sm border mb-6 ${
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
          }`}
        >
          <div className="flex justify-between items-center relative mb-8">
            <div
              className={`absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 z-0 rounded-full ${
                isDark ? "bg-gray-700" : "bg-gray-100"
              }`}
            ></div>
            <div
              className="absolute top-1/2 left-0 h-1.5 bg-blue-600 -translate-y-1/2 z-0 rounded-full transition-all duration-700 ease-in-out"
              style={{
                width:
                  overallStatus === "pending"
                    ? "0%"
                    : overallStatus === "preparing"
                    ? "50%"
                    : "100%",
              }}
            ></div>

            {/* Step 1: Sent */}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-md transition-all duration-500 ${
                  overallStatus === "pending"
                    ? "bg-blue-600 text-white animate-pulse"
                    : "bg-blue-600 text-white"
                }`}
              >
                📝
              </div>
              <span
                className={`text-[9px] font-black uppercase tracking-widest ${
                  overallStatus === "pending"
                    ? "text-blue-600"
                    : "text-gray-400"
                }`}
              >
                {t.sent}
              </span>
            </div>

            {/* Step 2: Preparing */}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-md transition-all duration-500 ${
                  isPrep
                    ? overallStatus === "preparing"
                      ? "bg-blue-600 text-white animate-bounce"
                      : "bg-blue-600 text-white"
                    : isDark
                    ? "bg-gray-800 border-4 border-gray-700 text-gray-500"
                    : "bg-white border-4 border-gray-100 text-gray-300"
                }`}
              >
                🍳
              </div>
              <span
                className={`text-[9px] font-black uppercase tracking-widest ${
                  overallStatus === "preparing"
                    ? "text-blue-600"
                    : "text-gray-400"
                }`}
              >
                {t.preparing}
              </span>
            </div>

            {/* Step 3: Ready */}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-md transition-all duration-500 ${
                  isReady
                    ? "bg-green-500 text-white animate-pulse shadow-green-200"
                    : isDark
                    ? "bg-gray-800 border-4 border-gray-700 text-gray-500"
                    : "bg-white border-4 border-gray-100 text-gray-300"
                }`}
              >
                ✅
              </div>
              <span
                className={`text-[9px] font-black uppercase tracking-widest ${
                  overallStatus === "ready" ? "text-green-500" : "text-gray-400"
                }`}
              >
                {t.ready}
              </span>
            </div>
          </div>

          {/* ΠΛΑΙΣΙΑ BAR ΚΑΙ ΚΟΥΖΙΝΑΣ */}
          {hasKitchen && hasBar && !isReady && (
            <div className="flex gap-3 mb-6">
              <div
                className={`flex-1 p-3 rounded-2xl text-center border-2 ${
                  barStat === "pending"
                    ? isDark
                      ? "bg-blue-900/20 border-blue-800 text-blue-400"
                      : "bg-blue-50 border-blue-200 text-blue-700"
                    : barStat === "ready"
                    ? isDark
                      ? "bg-green-900/20 border-green-800 text-green-400"
                      : "bg-green-50 border-green-200 text-green-700"
                    : isDark
                    ? "bg-orange-900/20 border-orange-800 text-orange-400 animate-pulse"
                    : "bg-orange-50 border-orange-200 text-orange-700 animate-pulse"
                }`}
              >
                <div className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">
                  🍹 {t.bar}
                </div>
                <div className="text-xs font-black">
                  {barStat === "pending"
                    ? t.statusSent
                    : barStat === "ready"
                    ? t.statusReady
                    : t.statusPrep}
                </div>
              </div>

              <div
                className={`flex-1 p-3 rounded-2xl text-center border-2 ${
                  kitStat === "pending"
                    ? isDark
                      ? "bg-blue-900/20 border-blue-800 text-blue-400"
                      : "bg-blue-50 border-blue-200 text-blue-700"
                    : kitStat === "ready"
                    ? isDark
                      ? "bg-green-900/20 border-green-800 text-green-400"
                      : "bg-green-50 border-green-200 text-green-700"
                    : isDark
                    ? "bg-orange-900/20 border-orange-800 text-orange-400 animate-pulse"
                    : "bg-orange-50 border-orange-200 text-orange-700 animate-pulse"
                }`}
              >
                <div className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">
                  🍳 {t.kitchen}
                </div>
                <div className="text-xs font-black">
                  {kitStat === "pending"
                    ? t.statusSent
                    : kitStat === "ready"
                    ? t.statusReady
                    : t.statusPrep}
                </div>
              </div>
            </div>
          )}

          <div
            className={`text-center p-4 rounded-2xl ${
              isDark ? "bg-gray-900" : "bg-gray-50"
            }`}
          >
            <h2
              className={`text-lg font-black uppercase italic tracking-tighter ${
                isReady
                  ? isDark
                    ? "text-green-400"
                    : "text-green-600"
                  : isDark
                  ? "text-white"
                  : "text-gray-800"
              }`}
            >
              {overallStatus === "pending" && t.statusReceived}
              {overallStatus === "preparing" && t.statusPrepMsg}
              {overallStatus === "ready" && t.statusReadyMsg}
            </h2>
            <p className="text-gray-500 text-[10px] font-black uppercase mt-1 tracking-widest">
              {overallStatus === "ready" ? t.thanks : t.notify}
            </p>
          </div>
        </div>

        {/* SUMMARY ΚΑΡΤΑ */}
        <div
          className={`p-6 rounded-[2.5rem] shadow-sm border ${
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
          }`}
        >
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">
            {t.summary}
          </h3>
          <div className="space-y-3 mb-6">
            {order.items?.map((item, index) => (
              <div key={index} className="flex justify-between items-start">
                <div className="flex-1">
                  <span
                    className={`font-black uppercase text-sm ${
                      isDark ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {item.quantity > 1 ? `${item.quantity}x ` : ""}
                    {getItemDisplayName(item)}
                  </span>
                  {item.note && (
                    <p
                      className={`text-[10px] px-2 py-1 rounded-lg mt-1 font-bold inline-block italic ${
                        isDark
                          ? "bg-yellow-900/30 text-yellow-400"
                          : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      📝 {item.note}
                    </p>
                  )}
                </div>
                <span
                  className={`font-black ${
                    isDark ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  {(item.price * (item.quantity || 1))?.toFixed(2)}€
                </span>
              </div>
            ))}
          </div>
          <div
            className={`flex justify-between items-center pt-4 border-t border-dashed ${
              isDark ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <span className="font-black text-gray-400 text-xs uppercase tracking-widest">
              {t.total}
            </span>
            <span
              className={`font-black text-2xl italic tracking-tighter ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {order.total_price?.toFixed(2)}€
            </span>
          </div>
          <div className="mt-2 text-right">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
              {t.payment}:{" "}
              {order.payment_method === "ΜΕΤΡΗΤΑ" && lang === "en"
                ? "CASH"
                : order.payment_method === "ΚΑΡΤΑ" && lang === "en"
                ? "CARD"
                : order.payment_method}
            </span>
          </div>
        </div>
      </div>

      {/* ΚΟΥΜΠΙ ΝΕΑ ΠΑΡΑΓΓΕΛΙΑ */}
      <div
        className={`fixed bottom-0 left-0 right-0 p-4 backdrop-blur-md border-t z-30 ${
          isDark
            ? "bg-gray-900/90 border-gray-800"
            : "bg-white/90 border-gray-100"
        }`}
      >
        <button
          onClick={() => onBack(false)}
          className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-colors shadow-sm border ${
            isDark
              ? "bg-blue-900/30 text-blue-400 border-blue-900/50 hover:bg-blue-900/50"
              : "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
          }`}
        >
          {t.newOrder}
        </button>
      </div>
    </div>
  );
}

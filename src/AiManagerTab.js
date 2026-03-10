import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Σύνδεση με το 2ο Project (Restaurant Predictor)
const PREDICTOR_URL = "https://qrmontajnhxwqwagxazb.supabase.co";
const PREDICTOR_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFybW9udGFqbmh4d3F3YWd4YXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTA1NzksImV4cCI6MjA4Nzg2NjU3OX0.DwPO5o7b5G2fTppX4BGEPrpyKAe5RMWwFwLyWOINwtA";
const predictorSupabase = createClient(PREDICTOR_URL, PREDICTOR_KEY);

export default function AiManagerTab({ storeId, orders, isKitchen, theme }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiDateRange, setAiDateRange] = useState("week"); 
  const isDark = theme === "dark";

  // Υπολογισμοί εσόδων και προϊόντων (όπως τα είχαμε)
  const historyOrdersList = orders.filter((o) => {
    if (o.status !== "completed") return false;
    const date = new Date(o.created_at);
    let matchesTime = true; const now = new Date();
    if (aiDateRange === "today") matchesTime = date.toDateString() === now.toDateString();
    else if (aiDateRange === "week") matchesTime = date >= new Date(now - 7 * 24 * 60 * 60 * 1000);
    else if (aiDateRange === "month") matchesTime = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    return matchesTime && (!isKitchen || o.items?.some((it) => it.station === "kitchen"));
  });

  const totalRevenue = historyOrdersList.reduce((sum, o) => sum + (isKitchen ? o.items?.filter((it) => it.station === "kitchen").reduce((s, it) => s + it.price * it.quantity, 0) : o.total_price), 0);
  const totalOrdersCount = historyOrdersList.length;
  const avgOrderValue = totalOrdersCount ? totalRevenue / totalOrdersCount : 0;
  const cashTotal = historyOrdersList.filter((o) => o.payment_method === "ΜΕΤΡΗΤΑ").reduce((sum, o) => sum + (isKitchen ? o.items?.filter((it) => it.station === "kitchen").reduce((s, it) => s + it.price * it.quantity, 0) : o.total_price), 0);
  const cardTotal = totalRevenue - cashTotal;

  const productCounts = {};
  historyOrdersList.forEach((o) => o.items?.forEach((it) => { if (!isKitchen || it.station === "kitchen") productCounts[it.name] = (productCounts[it.name] || 0) + it.quantity; }));
  const topProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const hourCounts = {};
  historyOrdersList.forEach((o) => { const h = new Date(o.created_at).getHours() + ":00"; hourCounts[h] = (hourCounts[h] || 0) + 1; });
  const peakHours = Object.entries(hourCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  useEffect(() => {
    const fetchPredictions = async () => {
      setLoading(true);
      try {
        const getLocalYYYYMMDD = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const today = new Date();
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);

        const { data, error } = await predictorSupabase
          .from('daily_predictions')
          .select('*')
          .eq('restaurant_id', parseInt(storeId)) 
          .gte('target_date', getLocalYYYYMMDD(tomorrow))
          .lte('target_date', getLocalYYYYMMDD(nextWeek))
          .order('target_date', { ascending: true });

        if (error) console.error("Error AI DB:", error);
        if (data) setPredictions(data);
      } catch (err) { console.error("Error AI:", err); }
      setLoading(false);
    };
    if (storeId) fetchPredictions();
  }, [storeId]);

  const periodLabels = { today: "Σήμερα", week: "Αυτή την εβδομάδα", month: "Αυτόν τον μήνα", all: "Συνολικά" };
  const currentPeriodText = periodLabels[aiDateRange];
  const cardPercentage = totalRevenue > 0 ? ((cardTotal / totalRevenue) * 100).toFixed(0) : 0;
  const topProductName = topProducts.length > 0 ? topProducts[0][0] : 'Κανένα προϊόν';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fade-in">
      <div className={`flex justify-between items-center border-b pb-4 ${isDark ? "border-gray-800" : "border-gray-200"}`}>
        <div className="flex items-center gap-3">
          <span className="text-4xl">✨</span>
          <h2 className={`font-black text-2xl md:text-3xl uppercase italic tracking-tighter ${isDark ? "text-white" : "text-gray-900"}`}>AI Manager Pro</h2>
        </div>
        <select 
          value={aiDateRange} 
          onChange={(e) => setAiDateRange(e.target.value)}
          className={`px-4 py-2 rounded-xl font-bold text-sm outline-none cursor-pointer ${isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-800 shadow-sm"}`}
        >
          <option value="today">Σήμερα</option>
          <option value="week">Αυτή την Εβδομάδα</option>
          <option value="month">Αυτόν τον Μήνα</option>
          <option value="all">Συνολικά</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-6 rounded-3xl shadow-sm border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
          <h3 className="font-black text-sm uppercase text-indigo-500 mb-4 flex items-center gap-2">
            <span className="text-lg">📊</span> Ανάλυση Αποδοσης ({currentPeriodText})
          </h3>
          <p className={`text-sm font-medium leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}>
            Ο συνολικός τζίρος έφτασε τα <strong className="text-indigo-500">{totalRevenue.toFixed(2)}€</strong> από {totalOrdersCount} παραγγελίες (Μέση Αξία: {avgOrderValue.toFixed(2)}€). Το κορυφαίο προϊόν σε ζήτηση ήταν το <strong>"{topProductName}"</strong>.
          </p>
        </div>

        <div className={`p-6 rounded-3xl shadow-sm border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
          <h3 className="font-black text-sm uppercase text-purple-500 mb-4 flex items-center gap-2">
            <span className="text-lg">💡</span> Στρατηγικα Insights
          </h3>
          <p className={`text-sm font-medium leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}>
            Το <strong>{cardPercentage}%</strong> των πελατών πλήρωσε με κάρτα. Οι ώρες αιχμής εντοπίζονται γύρω στις {peakHours.length > 0 ? peakHours[0][0] : '-'}. 
            <br/><br/>
            <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded-md text-xs font-bold italic">
              {cardPercentage > 60 ? 'Tip: Υψηλή χρήση κάρτας, βεβαιώσου ότι το ρολό του τερματικού POS είναι γεμάτο.' : 'Tip: Αρκετά μετρητά, φρόντισε να υπάρχουν αρκετά ψιλά στο ταμείο.'}
            </span>
          </p>
        </div>
      </div>

      <h3 className={`font-black text-xl uppercase italic mt-10 mb-4 ${isDark ? "text-gray-100" : "text-gray-800"}`}>
        📅 Πρόβλεψη Κίνησης (Επόμενες 7 Ημέρες)
      </h3>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-sm text-gray-500 mt-4 uppercase tracking-widest animate-pulse">Σύνδεση με AI Μοντέλο...</p>
        </div>
      ) : predictions.length === 0 ? (
        <div className={`p-8 rounded-3xl text-center border-2 border-dashed ${isDark ? "bg-gray-800/50 border-gray-700 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
          <p className="font-bold text-sm uppercase">Δεν βρέθηκαν δεδομένα AI για τις επόμενες ημέρες.</p>
          <p className="text-xs mt-2">Ελέγξτε ότι ο πίνακας "daily_predictions" είναι σωστός στο project Predictor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {predictions.map((day) => {
            const dateObj = new Date(day.target_date);
            const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
            const daysGr = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
            const dayName = daysGr[dateObj.getDay()];

            return (
              <div key={day.id} className={`flex flex-col p-5 rounded-3xl border-2 transition-all hover:-translate-y-1 hover:shadow-lg ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-indigo-50"}`}>
                <div className={`flex justify-between items-center mb-4 border-b pb-3 ${isDark ? "border-gray-700" : "border-indigo-100/50"}`}>
                  <div>
                    <div className={`font-black text-lg ${isDark ? "text-white" : "text-gray-900"}`}>{dayName}</div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{dateStr}</div>
                  </div>
                  <div className="bg-indigo-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-black shadow-md">
                    {day.predicted_customers}
                  </div>
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className={`text-[11px] font-bold p-3 rounded-xl ${isDark ? "bg-gray-900 text-gray-300" : "bg-indigo-50 text-indigo-900"}`}>
                    ☁️ {day.reasoning || "Κανονικές συνθήκες"}
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Προτεινομενο Προσωπικο</p>
                    <div className="flex justify-between text-sm font-bold">
                      <span className={isDark ? "text-gray-300" : "text-gray-700"}>Σερβιτόροι:</span>
                      <span className={isDark ? "text-white" : "text-gray-900"}>{day.waiters_needed}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span className={isDark ? "text-gray-300" : "text-gray-700"}>Μάγειρες:</span>
                      <span className={isDark ? "text-white" : "text-gray-900"}>{day.cooks_needed}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span className={isDark ? "text-gray-300" : "text-gray-700"}>Βοηθοί:</span>
                      <span className={isDark ? "text-white" : "text-gray-900"}>{day.helpers_needed}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

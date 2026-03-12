import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function SuperAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [stores, setStores] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);

  useEffect(() => {
    if (isAuthenticated) fetchStores();
  }, [isAuthenticated]);
  const REWARD_THRESHOLD = 40;

  const fetchStores = async () => {
    const { data: storesData, error: storesError } = await supabase.from("stores").select("*").order("id", { ascending: true });
    const { data: pinsData, error: pinsError } = await supabase.from("staff_pins").select("*");

    if (storesError || pinsError) {
      console.error("Fetch error:", storesError || pinsError);
      alert("Σφάλμα κατά τη φόρτωση των δεδομένων.");
      return;
    }

    const mergedStores = storesData.map(store => {
      const storePins = pinsData.filter(p => p.store_id === store.id);
      return {
        ...store,
        admin_pin: storePins.find(p => p.role === 'admin')?.pin || "0000",
        staff_pin: storePins.find(p => p.role === 'staff')?.pin || "1111",
        kitchen_pin: storePins.find(p => p.role === 'kitchen')?.pin || "2222",
      };
    });

    setStores(mergedStores || []);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === "1999") setIsAuthenticated(true);
    else alert("Λάθος PIN");
  };

  const handleEditClick = (store) => {
    setEditForm({ ...store });
    setIsEditing(true);
  };

  const handleNewStoreClick = () => {
    setEditForm({
      name: "",
      admin_pin: "0000",
      staff_pin: "1111",
      kitchen_pin: "2222",
      theme_color: "#2563EB",
      logo_url: "",
      is_active: true,
      enable_ordering: true,
      enable_call_waiter: true,
      has_premium_ai: false,
      backup_mode: false,
      radius: 100,
      lat: null,
      lng: null,
      tables: ["A1", "A2", "A3", "A4", "ΠΑΚΕΤΟ"],
      reward_threshold: REWARD_THRESHOLD
    });
    setIsEditing(true);
  };

  const saveStore = async () => {
    try {
      const { admin_pin, staff_pin, kitchen_pin, ...storeDataToSave } = editForm;
      let currentStoreId = editForm.id;

      if (currentStoreId) {
        const { error } = await supabase.from("stores").update(storeDataToSave).eq("id", currentStoreId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("stores").insert([storeDataToSave]).select();
        if (error) throw error;
        currentStoreId = data[0].id; 
      }

      const { data: existingPins } = await supabase.from("staff_pins").select("id, role").eq("store_id", currentStoreId);
      
      const getPinId = (roleName) => {
        const found = existingPins?.find(p => p.role === roleName);
        return found ? found.id : undefined;
      };

      const pinsPayload = [
        { ...(getPinId("admin") && { id: getPinId("admin") }), store_id: currentStoreId, role: "admin", pin: admin_pin },
        { ...(getPinId("staff") && { id: getPinId("staff") }), store_id: currentStoreId, role: "staff", pin: staff_pin },
        { ...(getPinId("kitchen") && { id: getPinId("kitchen") }), store_id: currentStoreId, role: "kitchen", pin: kitchen_pin }
      ];
      
      const { error: pinsError } = await supabase.from("staff_pins").upsert(pinsPayload);
      if (pinsError) throw pinsError;

      alert("Οι αλλαγές αποθηκεύτηκαν επιτυχώς!");
      setIsEditing(false);
      setEditForm(null);
      fetchStores();
    } catch (error) {
      console.error("Save Error:", error);
      alert("Σφάλμα κατά την αποθήκευση: " + error.message);
    }
  };

  const toggleLock = async (store) => {
    const newStatus = store.is_active === false ? true : false;
    if (window.confirm(`Θέλετε να ${newStatus ? 'ΞΕΚΛΕΙΔΩΣΕΤΕ' : 'ΚΛΕΙΔΩΣΕΤΕ'} το κατάστημα "${store.name}";`)) {
      try {
        const { error } = await supabase.from("stores").update({ is_active: newStatus }).eq("id", store.id);
        if (error) throw error;
        fetchStores();
      } catch (error) {
        alert("Αποτυχία ενημέρωσης: " + error.message);
      }
    }
  };

  const getTierInfo = (store) => {
    if (store.has_premium_ai) return { name: "PREMIUM", price: 70, color: "bg-purple-500", text: "text-purple-900" };
    if (store.enable_ordering !== false) return { name: "PRO", price: 40, color: "bg-blue-500", text: "text-blue-900" };
    return { name: "BASIC", price: 20, color: "bg-gray-400", text: "text-gray-900" };
  };

  const handleTierChange = (tier) => {
    if (tier === "BASIC") {
      setEditForm({ ...editForm, enable_ordering: false, enable_call_waiter: false, has_premium_ai: false });
    } else if (tier === "PRO") {
      setEditForm({ ...editForm, enable_ordering: true, enable_call_waiter: true, has_premium_ai: false });
    } else if (tier === "PREMIUM") {
      setEditForm({ ...editForm, enable_ordering: true, enable_call_waiter: true, has_premium_ai: true });
    }
  };

  const activeStores = stores.filter(s => s.is_active !== false);
  const totalMRR = activeStores.reduce((sum, s) => sum + getTierInfo(s).price, 0);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
        <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full border border-gray-700 text-center animate-fade-in">
          <div className="text-5xl mb-6">👑</div>
          <h2 className="text-2xl font-black uppercase text-white mb-2 tracking-widest">Super Admin</h2>
          <p className="text-gray-400 text-xs font-bold uppercase mb-8">Κεντρο Ελεγχου SaaS</p>
          <input type="password" placeholder="Master PIN" className="w-full p-4 text-center text-2xl font-black rounded-2xl bg-gray-900 text-white border border-gray-700 outline-none focus:border-blue-500 transition-colors mb-6 tracking-[0.5em]" value={pin} onChange={(e) => setPin(e.target.value)} autoFocus />
          <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-transform active:scale-95 shadow-lg shadow-blue-500/20">
            Εισοδος
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans pb-24">
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👑</span>
            <div>
              <h1 className="font-black text-xl uppercase tracking-widest text-white">SmartPOS SaaS</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Master Control Panel</p>
            </div>
          </div>
          <button onClick={handleNewStoreClick} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-lg shadow-blue-500/20 transition-transform active:scale-95">
            + Νεος Πελατης
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-[2rem] border border-gray-700 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase text-gray-400 tracking-widest mb-1">Ενεργοι Πελατες</p>
              <p className="text-4xl font-black text-white">{activeStores.length}</p>
            </div>
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-3xl">🏪</div>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 rounded-[2rem] shadow-xl shadow-blue-500/20 flex items-center justify-between md:col-span-2">
            <div>
              <p className="text-xs font-black uppercase text-blue-200 tracking-widest mb-1">Μηνιαιος Τζιρος (MRR)</p>
              <p className="text-5xl font-black text-white">{totalMRR}€ <span className="text-lg font-bold text-blue-200">/ μήνα</span></p>
            </div>
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl">💶</div>
          </div>
        </div>

        <div className="space-y-4">
          {stores.map((store) => {
            const tier = getTierInfo(store);
            const isLocked = store.is_active === false;

            return (
              <div key={store.id} className={`p-6 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm border transition-all ${isLocked ? "bg-red-900/10 border-red-900/50 opacity-75" : "bg-gray-800 border-gray-700 hover:border-gray-600"}`}>
                <div className="flex items-center gap-5 w-full md:w-auto">
                  <div className={`w-20 h-20 shrink-0 rounded-2xl bg-cover bg-center shadow-inner flex items-center justify-center text-2xl border border-gray-700 ${isLocked ? "grayscale" : ""}`} style={store.logo_url ? { backgroundImage: `url(${store.logo_url})` } : { backgroundColor: store.theme_color || '#374151' }}>
                    {!store.logo_url && "🍽️"}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className={`font-black text-xl uppercase ${isLocked ? "text-red-400 line-through" : "text-white"}`}>{store.name}</h3>
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${tier.color} ${tier.text} shadow-sm`}>
                        {tier.name}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-gray-400 flex flex-wrap gap-3 mt-2">
                      <span className="bg-gray-900 px-2 py-1 rounded-md">ID: {store.id}</span>
                      <span className="bg-gray-900 px-2 py-1 rounded-md text-red-400">Admin: {store.admin_pin}</span>
                      <span className="bg-gray-900 px-2 py-1 rounded-md text-blue-400">Staff: {store.staff_pin}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto border-t border-gray-700 md:border-t-0 pt-4 md:pt-0">
                  <button onClick={() => toggleLock(store)} className={`flex-1 md:flex-none px-5 py-3 rounded-2xl font-black text-xs uppercase transition-colors shadow-sm ${isLocked ? "bg-green-500 text-white hover:bg-green-400" : "bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"}`}>
                    {isLocked ? "▶ Ενεργοποιηση" : "⏸ Κλειδωμα"}
                  </button>
                  <button onClick={() => handleEditClick(store)} className="flex-1 md:flex-none bg-gray-700 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase hover:bg-gray-600 transition-colors shadow-sm">
                    Ρυθμισεις
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {isEditing && editForm && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsEditing(false)}>
          <div className="bg-gray-800 p-8 rounded-[3rem] max-w-2xl w-full border border-gray-700 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsEditing(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white font-black text-2xl">✕</button>
            <h2 className="text-2xl font-black uppercase text-white mb-6 italic">{editForm.id ? "Επεξεργασια Πελατη" : "Νεος Πελατης"}</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-2">Ονομα Καταστηματος</label>
                  <input type="text" className="w-full bg-gray-900 border border-gray-700 text-white p-4 rounded-2xl font-bold outline-none focus:border-blue-500" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-2">Πακετο Συνδρομης</label>
                  <select className="w-full bg-gray-900 border border-gray-700 text-white p-4 rounded-2xl font-bold outline-none focus:border-blue-500" value={getTierInfo(editForm).name} onChange={(e) => handleTierChange(e.target.value)}>
                    <option value="BASIC">Basic (20€) - Μόνο Κατάλογος</option>
                    <option value="PRO">Pro (40€) - Παραγγελιοληψία</option>
                    <option value="PREMIUM">Premium (70€) - AI Manager</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-2">Λογοτυπο (URL Εικονας)</label>
                  <input type="text" className="w-full bg-gray-900 border border-gray-700 text-white p-4 rounded-2xl font-bold outline-none text-sm" value={editForm.logo_url || ""} onChange={(e) => setEditForm({...editForm, logo_url: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-2">Χρωμα (Hex)</label>
                  <div className="flex gap-3 h-[54px]">
                    <input type="color" className="h-full w-16 rounded-xl cursor-pointer bg-gray-900 border border-gray-700" value={editForm.theme_color} onChange={(e) => setEditForm({...editForm, theme_color: e.target.value})} />
                    <input type="text" className="flex-1 bg-gray-900 border border-gray-700 text-white p-3 rounded-xl font-bold outline-none uppercase" value={editForm.theme_color} onChange={(e) => setEditForm({...editForm, theme_color: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 p-5 rounded-3xl border border-gray-700">
                <p className="text-[10px] font-black uppercase text-gray-500 mb-4 tracking-widest border-b border-gray-800 pb-2">Κωδικοι Προσβασης (PINs)</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-red-400 mb-1">Admin</label>
                    <input type="text" maxLength="4" className="w-full bg-gray-800 text-white p-3 rounded-xl font-black text-center tracking-widest border border-gray-700 outline-none focus:border-red-400" value={editForm.admin_pin} onChange={(e) => setEditForm({...editForm, admin_pin: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-blue-400 mb-1">Staff</label>
                    <input type="text" maxLength="4" className="w-full bg-gray-800 text-white p-3 rounded-xl font-black text-center tracking-widest border border-gray-700 outline-none focus:border-blue-400" value={editForm.staff_pin} onChange={(e) => setEditForm({...editForm, staff_pin: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-orange-400 mb-1">Κουζίνα</label>
                    <input type="text" maxLength="4" className="w-full bg-gray-800 text-white p-3 rounded-xl font-black text-center tracking-widest border border-gray-700 outline-none focus:border-orange-400" value={editForm.kitchen_pin} onChange={(e) => setEditForm({...editForm, kitchen_pin: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 p-5 rounded-3xl border border-gray-700 space-y-4">
                 <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest border-b border-gray-800 pb-2">Ρυθμισεις Λειτουργιας & Overrides</p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">Τραπέζια (Κόμμα διαχωρισμός)</label>
                     <textarea className="w-full bg-gray-800 text-white p-3 rounded-xl font-bold border border-gray-700 outline-none text-sm resize-none" rows="2" value={(editForm.tables || []).join(", ")} onChange={(e) => setEditForm({...editForm, tables: e.target.value.split(",").map(t => t.trim()).filter(Boolean)})} />
                   </div>
                   <div>
                     <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">Όριο Πόντων Δώρου (€)</label>
                     <input type="number" className="w-full bg-gray-800 text-white p-3 rounded-xl font-bold border border-gray-700 outline-none" value={editForm.reward_threshold} onChange={(e) => setEditForm({...editForm, reward_threshold: parseInt(e.target.value)})} />
                   </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                   <div className="flex items-center justify-between bg-gray-800 p-3 rounded-xl border border-gray-700">
                      <span className="text-xs font-bold text-gray-300">Παραγγελιοληψία</span>
                      <input type="checkbox" className="w-5 h-5 accent-blue-500 cursor-pointer" checked={editForm.enable_ordering} onChange={(e) => setEditForm({...editForm, enable_ordering: e.target.checked})} />
                   </div>
                   <div className="flex items-center justify-between bg-gray-800 p-3 rounded-xl border border-gray-700">
                      <span className="text-xs font-bold text-gray-300">Κλήση Σερβιτόρου</span>
                      <input type="checkbox" className="w-5 h-5 accent-blue-500 cursor-pointer" checked={editForm.enable_call_waiter} onChange={(e) => setEditForm({...editForm, enable_call_waiter: e.target.checked})} />
                   </div>
                   <div className="flex items-center justify-between bg-gray-800 p-3 rounded-xl border border-gray-700">
                      <span className="text-xs font-bold text-gray-300">Premium AI Manager</span>
                      <input type="checkbox" className="w-5 h-5 accent-purple-500 cursor-pointer" checked={editForm.has_premium_ai} onChange={(e) => setEditForm({...editForm, has_premium_ai: e.target.checked})} />
                   </div>
                   <div className="flex items-center justify-between bg-gray-800 p-3 rounded-xl border border-gray-700">
                      <span className="text-xs font-bold text-gray-300">Ενεργό Κατάστημα</span>
                      <input type="checkbox" className="w-5 h-5 accent-green-500 cursor-pointer" checked={editForm.is_active !== false} onChange={(e) => setEditForm({...editForm, is_active: e.target.checked})} />
                   </div>
                 </div>

                 <div className="flex items-center justify-between bg-gray-800 p-3 rounded-xl border border-gray-700 mt-2">
                    <span className="text-xs font-bold text-gray-300">Backup Mode (Χειροκίνητη Επιλογή)</span>
                    <input type="checkbox" className="w-5 h-5 accent-blue-500 cursor-pointer" checked={editForm.backup_mode} onChange={(e) => setEditForm({...editForm, backup_mode: e.target.checked})} />
                 </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={saveStore} className="flex-[2] bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-transform active:scale-95 shadow-lg shadow-blue-500/20">
                  Αποθηκευση Πελατη
                </button>
                <button onClick={() => setIsEditing(false)} className="flex-1 bg-gray-700 text-white py-5 rounded-2xl font-black text-xs uppercase hover:bg-gray-600 transition-colors">
                  Ακυρωση
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Ο ΜΥΣΤΙΚΟΣ ΣΟΥ ΚΩΔΙΚΟΣ (Μπορείς να τον αλλάξεις)
const MASTER_PIN = "1999";

export default function SuperAdmin() {
  const [pin, setPin] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [stores, setStores] = useState([]);
  const [staffPins, setStaffPins] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // States για το Νέο Μαγαζί
  const [showNewStoreModal, setShowNewStoreModal] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreTables, setNewStoreTables] = useState("20");

  useEffect(() => {
    if (isAuthed) {
      fetchData();
    }
  }, [isAuthed]);

  const fetchData = async () => {
    const { data: storesData } = await supabase.from("stores").select("*").order("id", { ascending: false });
    if (storesData) setStores(storesData);

    const { data: pinsData } = await supabase.from("staff_pins").select("*");
    if (pinsData) setStaffPins(pinsData);
  };

  const updateStore = async (id, field, value) => {
    await supabase.from("stores").update({ [field]: value }).eq("id", id);
    fetchData();
  };

  // Ενημέρωση ή Δημιουργία PIN
  const handleUpdatePin = async (storeId, role, newPinValue) => {
    if (newPinValue.length !== 4) return alert("Το PIN πρέπει να είναι 4 ψηφία!");
    
    const existing = staffPins.find(p => p.store_id === storeId && p.role === role);
    
    if (existing) {
      await supabase.from("staff_pins").update({ pin: newPinValue }).eq("id", existing.id);
    } else {
      await supabase.from("staff_pins").insert([{ store_id: storeId, role: role, pin: newPinValue }]);
    }
    fetchData();
    alert(`Ο κωδικός για ${role.toUpperCase()} ενημερώθηκε!`);
  };

  // Δημιουργία Νέου Πελάτη
  const handleCreateStore = async () => {
    if (!newStoreName) return alert("Βάλε όνομα μαγαζιού!");

    const tablesArray = Array.from({ length: parseInt(newStoreTables) || 10 }, (_, i) => `T${i + 1}`);
    tablesArray.push("ΠΑΚΕΤΟ");

    const { data: newStore, error } = await supabase.from("stores").insert([{
      name: newStoreName,
      tables: tablesArray,
      is_accepting_orders: true,
      is_premium: false,
      enable_ordering: true,
      enable_call_waiter: true,
      bell_visibility: { admin: false, staff: true, kitchen: false },
      category_order: ["ΠΡΟΤΕΙΝΟΜΕΝΑ", "ΚΑΦΕΔΕΣ", "ΑΝΑΨΥΚΤΙΚΑ", "ΠΟΤΑ", "ΣΝΑΚΣ"]
    }]).select().single();

    if (error) {
      alert("Σφάλμα δημιουργίας: " + error.message);
      return;
    }

    if (newStore) {
      await supabase.from("staff_pins").insert([
        { store_id: newStore.id, role: 'admin', pin: '1111' },
        { store_id: newStore.id, role: 'staff', pin: '2222' },
        { store_id: newStore.id, role: 'kitchen', pin: '3333' }
      ]);
    }

    setShowNewStoreModal(false);
    setNewStoreName("");
    setNewStoreTables("20");
    fetchData();
    alert("Ο νέος πελάτης δημιουργήθηκε επιτυχώς!");
  };

  const getPinForRole = (storeId, role) => {
    const p = staffPins.find(x => x.store_id === storeId && x.role === role);
    return p ? p.pin : "";
  };

  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4 font-sans">
        <div className="p-8 bg-gray-800 rounded-[3rem] shadow-2xl text-center w-full max-w-sm border border-gray-700 animate-fade-in">
          <div className="text-6xl mb-6 drop-shadow-lg">👑</div>
          <h1 className="text-2xl font-black italic uppercase tracking-widest mb-2">CEO Login</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-8">SaaS Command Center</p>
          <input 
            type="password" 
            value={pin} 
            onChange={(e) => setPin(e.target.value)} 
            onKeyDown={(e) => { if (e.key === 'Enter' && pin === MASTER_PIN) setIsAuthed(true); }}
            className="w-full p-4 rounded-2xl bg-gray-900 border border-gray-600 text-white font-black text-center text-2xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-[0.5em]"
            placeholder="****"
            maxLength={4}
          />
          <button 
            onClick={() => { if (pin === MASTER_PIN) setIsAuthed(true); else alert("Λάθος Κωδικός"); }}
            className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-transform active:scale-95 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
          >
            ΕΙΣΟΔΟΣ
          </button>
        </div>
      </div>
    );
  }

  const filteredStores = stores.filter(s => s.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-gray-800 p-6 rounded-[2rem] shadow-lg border border-gray-700">
          <div>
            <h1 className="text-3xl font-black italic uppercase text-white tracking-tighter drop-shadow-md">SaaS Control Panel</h1>
            <div className="flex gap-4 mt-2">
              <span className="text-green-400 font-black text-xs uppercase bg-green-900/30 px-3 py-1.5 rounded-lg border border-green-800/50 shadow-inner">
                Ενεργά: {stores.filter(s => s.is_accepting_orders !== false).length}
              </span>
              <span className="text-red-400 font-black text-xs uppercase bg-red-900/30 px-3 py-1.5 rounded-lg border border-red-800/50 shadow-inner">
                Κλειδωμένα: {stores.filter(s => s.is_accepting_orders === false).length}
              </span>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={() => setShowNewStoreModal(true)} 
              className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:bg-blue-500 transition-transform active:scale-95"
            >
              + ΝΕΟΣ ΠΕΛΑΤΗΣ
            </button>
            <button onClick={() => setIsAuthed(false)} className="bg-gray-700 text-gray-300 px-6 py-4 rounded-2xl font-black uppercase text-xs hover:bg-gray-600 hover:text-white transition-colors border border-gray-600">
              ΕΞΟΔΟΣ
            </button>
          </div>
        </header>
        
        {/* SEARCH BAR */}
        <div className="mb-8 relative">
          <input 
            type="text" 
            placeholder="Αναζήτηση Μαγαζιού..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-96 p-4 pl-12 rounded-2xl border border-gray-700 bg-gray-800 text-white placeholder-gray-500 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-40">🔍</span>
        </div>

        {/* GRID ΜΑΓΑΖΙΩΝ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map(store => (
            <div key={store.id} className="bg-gray-800 p-6 rounded-[2.5rem] shadow-lg border border-gray-700 flex flex-col justify-between hover:shadow-2xl hover:border-gray-600 transition-all relative overflow-hidden group">
              
              {/* Χρωματική ένδειξη κλειδώματος */}
              {store.is_accepting_orders === false && (
                <div className="absolute top-0 left-0 w-full h-2 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
              )}
              {store.is_accepting_orders !== false && (
                <div className="absolute top-0 left-0 w-full h-1 bg-green-500/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              )}

              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight drop-shadow-sm">{store.name}</h2>
                    <p className="text-[10px] font-black text-gray-500 mt-1.5 tracking-widest bg-gray-900 inline-block px-2 py-1 rounded-md border border-gray-700">STORE ID: {store.id}</p>
                  </div>
                </div>
                
                <div className="space-y-3 bg-gray-900/50 p-4 rounded-3xl border border-gray-700/50 shadow-inner">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 border-b border-gray-700/50 pb-2 mb-2">Ρυθμισεις Πακετου</p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-300">Κατάσταση</span>
                    <button 
                      onClick={() => updateStore(store.id, "is_accepting_orders", !store.is_accepting_orders)} 
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-sm transition-all ${store.is_accepting_orders !== false ? "bg-green-600 text-white hover:bg-green-500" : "bg-red-600 text-white hover:bg-red-500 animate-pulse"}`}
                    >
                      {store.is_accepting_orders !== false ? "🟢 ACTIVE" : "🔴 LOCKED"}
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-300">Premium AI</span>
                    <button 
                      onClick={() => updateStore(store.id, "is_premium", !store.is_premium)} 
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors ${store.is_premium ? "bg-purple-900/50 text-purple-400 border border-purple-800/50" : "bg-gray-800 text-gray-500 border border-gray-700"}`}
                    >
                      {store.is_premium ? "ON" : "OFF"}
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-300">Self-Service Καλάθι</span>
                    <button 
                      onClick={() => updateStore(store.id, "enable_ordering", !store.enable_ordering)} 
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors ${store.enable_ordering !== false ? "bg-blue-900/50 text-blue-400 border border-blue-800/50" : "bg-gray-800 text-gray-500 border border-gray-700"}`}
                    >
                      {store.enable_ordering !== false ? "ON" : "OFF"}
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-300">Smart Bell</span>
                    <button 
                      onClick={() => updateStore(store.id, "enable_call_waiter", !store.enable_call_waiter)} 
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors ${store.enable_call_waiter !== false ? "bg-blue-900/50 text-blue-400 border border-blue-800/50" : "bg-gray-800 text-gray-500 border border-gray-700"}`}
                    >
                      {store.enable_call_waiter !== false ? "ON" : "OFF"}
                    </button>
                  </div>
                </div>

                {/* ΔΙΑΧΕΙΡΙΣΗ ΚΩΔΙΚΩΝ (PINS) */}
                <div className="mt-4 p-4 rounded-3xl border border-gray-700 bg-gray-800/50">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Κωδικοι Προσβασης (PIN)</p>
                  <div className="space-y-2.5">
                    {['admin', 'staff', 'kitchen'].map(role => (
                      <div key={role} className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-black uppercase w-16 ${role === 'admin' ? 'text-red-400' : role === 'kitchen' ? 'text-orange-400' : 'text-blue-400'}`}>
                          {role}
                        </span>
                        <input 
                          type="text" 
                          maxLength={4}
                          defaultValue={getPinForRole(store.id, role)}
                          onBlur={(e) => {
                            if(e.target.value !== getPinForRole(store.id, role)) {
                              handleUpdatePin(store.id, role, e.target.value);
                            }
                          }}
                          className="w-20 p-2 border border-gray-600 rounded-xl text-center font-black text-xs bg-gray-900 text-gray-200 focus:bg-gray-800 focus:border-blue-500 focus:text-white outline-none transition-colors shadow-inner"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-700 flex justify-between items-center gap-2">
                 <a href={`/?store=${store.id}&table=A1`} target="_blank" rel="noreferrer" className="flex-1 text-center text-[10px] font-black uppercase bg-gray-700 text-gray-300 px-4 py-3 rounded-xl hover:bg-gray-600 hover:text-white transition-colors border border-gray-600">
                   ПΡΟΒΟΛΗ MENU
                 </a>
                 <a href={`/?store=${store.id}&admin=true`} target="_blank" rel="noreferrer" className="flex-1 text-center text-[10px] font-black uppercase bg-blue-900/30 text-blue-400 px-4 py-3 rounded-xl border border-blue-800/50 hover:bg-blue-900/50 hover:text-blue-300 transition-colors">
                   TAMEIO
                 </a>
              </div>
            </div>
          ))}
        </div>

        {/* MODAL ΔΗΜΙΟΥΡΓΙΑΣ ΠΕΛΑΤΗ */}
        {showNewStoreModal && (
          <div className="fixed inset-0 bg-black/90 z-[500] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
            <div className="bg-gray-800 border border-gray-700 rounded-[3rem] p-8 shadow-2xl w-full max-w-md relative text-white">
              <button onClick={() => setShowNewStoreModal(false)} className="absolute top-6 right-6 w-10 h-10 bg-gray-700 rounded-full font-black text-gray-400 hover:bg-gray-600 hover:text-white transition-colors">✕</button>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-6 drop-shadow-md">Νεος Πελατης</h2>
              
              <div className="space-y-5 mb-8">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5 pl-2 tracking-widest">Ονομασια Μαγαζιου</label>
                  <input 
                    type="text" 
                    value={newStoreName} 
                    onChange={e => setNewStoreName(e.target.value)} 
                    placeholder="π.χ. To Kyma Beach Bar"
                    className="w-full p-4 rounded-2xl bg-gray-900 border-2 border-gray-700 text-white font-bold focus:border-blue-500 outline-none shadow-inner placeholder-gray-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5 pl-2 tracking-widest">Αριθμος Τραπεζιων / Ομπρελων</label>
                  <input 
                    type="number" 
                    value={newStoreTables} 
                    onChange={e => setNewStoreTables(e.target.value)} 
                    className="w-full p-4 rounded-2xl bg-gray-900 border-2 border-gray-700 text-white font-bold focus:border-blue-500 outline-none shadow-inner transition-colors"
                  />
                  <p className="text-[10px] font-bold text-gray-500 mt-2 pl-2">Θα δημιουργηθούν αυτόματα ως T1, T2, κλπ.</p>
                </div>
              </div>

              <button 
                onClick={handleCreateStore}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:bg-blue-500 transition-transform active:scale-95"
              >
                ΔΗΜΙΟΥΡΓΙΑ ΒΑΣΗΣ
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

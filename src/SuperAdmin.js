import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Ο ΜΥΣΤΙΚΟΣ ΣΟΥ ΚΩΔΙΚΟΣ ΓΙΑ ΤΟ SaaS (ΑΛΛΑΞΕ ΤΟΝ)
const MASTER_PIN = "1999"; 

export default function SuperAdmin() {
  const [pin, setPin] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [stores, setStores] = useState([]);

  useEffect(() => {
    if (isAuthed) fetchStores();
  }, [isAuthed]);

  const fetchStores = async () => {
    const { data } = await supabase.from("stores").select("*").order("id");
    if (data) setStores(data);
  };

  const updateStore = async (id, field, value) => {
    await supabase.from("stores").update({ [field]: value }).eq("id", id);
    fetchStores(); // Ανανέωση μετά την αλλαγή
  };

  // ΟΘΟΝΗ ΣΥΝΔΕΣΗΣ SUPER-ADMIN
  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="p-8 bg-gray-800 rounded-[3rem] shadow-2xl text-center w-full max-w-sm border border-gray-700">
          <div className="text-5xl mb-4">👑</div>
          <h1 className="text-2xl font-black italic uppercase tracking-widest mb-6">CEO Login</h1>
          <input 
            type="password" 
            value={pin} 
            onChange={(e) => setPin(e.target.value)} 
            className="w-full p-4 rounded-2xl text-black font-black text-center text-xl mb-4 focus:outline-none focus:ring-4 focus:ring-blue-500"
            placeholder="****"
            maxLength={4}
          />
          <button 
            onClick={() => { if (pin === MASTER_PIN) setIsAuthed(true); else alert("Λάθος Κωδικός"); }}
            className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-colors shadow-lg"
          >
            ΕΙΣΟΔΟΣ
          </button>
        </div>
      </div>
    );
  }

  // ΟΘΟΝΗ ΔΙΑΧΕΙΡΙΣΗΣ SaaS
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8 border-b border-gray-300 pb-4">
          <div>
            <h1 className="text-3xl font-black italic uppercase text-gray-900 tracking-tighter">SaaS Control Panel</h1>
            <p className="text-gray-500 font-bold text-sm uppercase mt-1">Ενεργα Μαγαζια: {stores.length}</p>
          </div>
          <button onClick={() => setIsAuthed(false)} className="bg-gray-800 text-white px-6 py-3 rounded-xl font-black uppercase text-xs">
            ΕΞΟΔΟΣ
          </button>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map(store => (
            <div key={store.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-200 flex flex-col justify-between hover:shadow-lg transition-shadow">
              
              <div>
                <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                  <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter">{store.name}</h2>
                  <span className="text-[10px] font-black px-2 py-1 bg-gray-100 text-gray-500 rounded-lg">ID: {store.id}</span>
                </div>
                
                <div className="space-y-4">
                  {/* ΚΛΕΙΔΩΜΑ ΜΑΓΑΖΙΟΥ (ΑΠΛΗΡΩΤΗ ΣΥΝΔΡΟΜΗ) */}
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                    <span className="text-xs font-black text-gray-700 uppercase">Κατασταση</span>
                    <button 
                      onClick={() => updateStore(store.id, "is_accepting_orders", !store.is_accepting_orders)} 
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-sm transition-colors ${store.is_accepting_orders !== false ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
                    >
                      {store.is_accepting_orders !== false ? "🟢 ACTIVE" : "🔴 LOCKED"}
                    </button>
                  </div>
                  
                  {/* PREMIUM ΠΑΚΕΤΟ */}
                  <div className="flex justify-between items-center p-1">
                    <span className="text-xs font-bold text-gray-600">Premium AI</span>
                    <button 
                      onClick={() => updateStore(store.id, "is_premium", !store.is_premium)} 
                      className={`px-3 py-1 rounded-md text-[10px] font-black uppercase ${store.is_premium ? "bg-purple-100 text-purple-700 border border-purple-200" : "bg-gray-100 text-gray-400 border border-gray-200"}`}
                    >
                      {store.is_premium ? "ON" : "OFF"}
                    </button>
                  </div>
                  
                  {/* SELF SERVICE ΚΑΛΑΘΙ */}
                  <div className="flex justify-between items-center p-1">
                    <span className="text-xs font-bold text-gray-600">Self-Service Καλάθι</span>
                    <button 
                      onClick={() => updateStore(store.id, "enable_ordering", !store.enable_ordering)} 
                      className={`px-3 py-1 rounded-md text-[10px] font-black uppercase ${store.enable_ordering !== false ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-gray-100 text-gray-400 border border-gray-200"}`}
                    >
                      {store.enable_ordering !== false ? "ON" : "OFF"}
                    </button>
                  </div>
                  
                  {/* SMART BELL */}
                  <div className="flex justify-between items-center p-1">
                    <span className="text-xs font-bold text-gray-600">Smart Bell (Κουδούνι)</span>
                    <button 
                      onClick={() => updateStore(store.id, "enable_call_waiter", !store.enable_call_waiter)} 
                      className={`px-3 py-1 rounded-md text-[10px] font-black uppercase ${store.enable_call_waiter !== false ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-gray-100 text-gray-400 border border-gray-200"}`}
                    >
                      {store.enable_call_waiter !== false ? "ON" : "OFF"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                 <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Direct Link Πελατων (QR):</p>
                 <a href={`/?store=${store.id}&table=A1`} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-500 break-all hover:underline">
                   {window.location.origin}/?store={store.id}
                 </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

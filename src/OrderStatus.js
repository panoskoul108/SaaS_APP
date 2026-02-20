import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://vgyzevaxkayyobopznyr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZneXpldmF4a2F5eW9ib3B6bnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNjI2MDksImV4cCI6MjA4NjYzODYwOX0.u-kO33BloFq4MU3sZsxN8QVcNTjOOZtsDT4srhbdsCw";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const READY_SOUND =
  "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

export default function OrderStatus({ orderId, onBack }) {
  const [order, setOrder] = useState(null);
  const [prevStatus, setPrevStatus] = useState("pending");

  useEffect(() => {
    if (!orderId) return;

    let isMounted = true; // Προστασία για να μην τρέχει αν αλλάξει η οθόνη

    const fetchInitial = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      if (data && isMounted) {
        if (data.status === "completed") {
          onBack(true); // Αν για κάποιο λόγο έχει ήδη ολοκληρωθεί, γύρνα πίσω αμέσως
        } else {
          setOrder(data);
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
        // Αν η παραγγελία ολοκληρώθηκε, σταματάμε τον timer και φεύγουμε αμέσως!
        if (data.status === "completed") {
          clearInterval(interval);
          onBack(true);
          return;
        }

        // Ήχος όταν γίνει έτοιμη
        if (data.status === "ready" && prevStatus !== "ready") {
          const audio = new Audio(READY_SOUND);
          audio.play().catch((e) => console.log("Audio blocked by browser"));
        }

        setPrevStatus(data.status);
        setOrder(data);
      }
    }, 3000);

    // Καθαρισμός όταν κλείνει η οθόνη
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
    // Εδώ βγάλαμε τα περιττά dependencies για να μην κολλάει ο timer
  }, [orderId]);

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const status = order.status;
  const isPrep = status === "preparing" || status === "ready";
  const isReady = status === "ready";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative pb-20 animate-fade-in">
      <header className="p-6 bg-white shadow-sm text-center sticky top-0 z-20">
        <h1 className="text-xl font-black italic uppercase tracking-tighter text-gray-800">
          Η ΠΑΡΑΓΓΕΛΙΑ ΣΑΣ
        </h1>
        <div className="mt-2 inline-block bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase italic tracking-widest">
          ΤΡΑΠΕΖΙ {order.table_number}
        </div>
      </header>

      <div className="p-6 flex-1 max-w-md mx-auto w-full">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 mb-6">
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-gray-100 -translate-y-1/2 z-0 rounded-full"></div>
            <div
              className="absolute top-1/2 left-0 h-1.5 bg-blue-600 -translate-y-1/2 z-0 rounded-full transition-all duration-700 ease-in-out"
              style={{
                width:
                  status === "pending"
                    ? "0%"
                    : status === "preparing"
                    ? "50%"
                    : "100%",
              }}
            ></div>

            <div className="relative z-10 flex flex-col items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-md transition-all duration-500 ${
                  status === "pending"
                    ? "bg-blue-600 text-white animate-pulse"
                    : "bg-blue-600 text-white"
                }`}
              >
                📝
              </div>
              <span
                className={`text-[9px] font-black uppercase tracking-widest ${
                  status === "pending" ? "text-blue-600" : "text-gray-400"
                }`}
              >
                Εσταλη
              </span>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-md transition-all duration-500 ${
                  isPrep
                    ? status === "preparing"
                      ? "bg-blue-600 text-white animate-bounce"
                      : "bg-blue-600 text-white"
                    : "bg-white border-4 border-gray-100 text-gray-300"
                }`}
              >
                🍳
              </div>
              <span
                className={`text-[9px] font-black uppercase tracking-widest ${
                  status === "preparing" ? "text-blue-600" : "text-gray-400"
                }`}
              >
                Ετοιμαζεται
              </span>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-md transition-all duration-500 ${
                  isReady
                    ? "bg-green-500 text-white animate-pulse shadow-green-200"
                    : "bg-white border-4 border-gray-100 text-gray-300"
                }`}
              >
                ✅
              </div>
              <span
                className={`text-[9px] font-black uppercase tracking-widest ${
                  status === "ready" ? "text-green-500" : "text-gray-400"
                }`}
              >
                Ετοιμη
              </span>
            </div>
          </div>

          <div className="mt-8 text-center bg-gray-50 p-4 rounded-2xl">
            <h2
              className={`text-lg font-black uppercase italic tracking-tighter ${
                isReady ? "text-green-600" : "text-gray-800"
              }`}
            >
              {status === "pending" && "Η ΠΑΡΑΓΓΕΛΙΑ ΕΛΗΦΘΗ!"}
              {status === "preparing" && "ΤΟ STATUS ΕΤΟΙΜΑΖΕΙ..."}
              {status === "ready" && "Η ΠΑΡΑΓΓΕΛΙΑ ΕΙΝΑΙ ΕΤΟΙΜΗ!"}
            </h2>
            <p className="text-gray-500 text-[10px] font-black uppercase mt-1 tracking-widest">
              {status === "ready"
                ? "ΠΑΡΑΚΑΛΩ ΠΕΡΑΣΤΕ ΑΠΟ ΤΟ ΤΑΜΕΙΟ"
                : "ΘΑ ΣΑΣ ΕΝΗΜΕΡΩΣΟΥΜΕ ΜΟΛΙΣ ΕΙΝΑΙ ΕΤΟΙΜΗ"}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 border-b pb-2">
            Η ΠΑΡΑΓΓΕΛΙΑ ΣΑΣ
          </h3>
          <div className="space-y-3 mb-6">
            {order.items?.map((item, index) => (
              <div key={index} className="flex justify-between items-start">
                <div className="flex-1">
                  <span className="font-black uppercase text-sm text-gray-800">
                    {item.name}
                  </span>
                  {item.note && (
                    <p className="text-[10px] bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg mt-1 font-bold inline-block italic">
                      📝 {item.note}
                    </p>
                  )}
                </div>
                <span className="font-black text-blue-600">
                  {item.price?.toFixed(2)}€
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-dashed border-gray-200">
            <span className="font-black text-gray-400 text-xs uppercase tracking-widest">
              ΣΥΝΟΛΟ
            </span>
            <span className="font-black text-2xl italic tracking-tighter text-gray-900">
              {order.total_price?.toFixed(2)}€
            </span>
          </div>
          <div className="mt-2 text-right">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
              ΠΛΗΡΩΜΗ: {order.payment_method}
            </span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-30">
        <button
          onClick={() => onBack(false)}
          className="w-full bg-gray-100 text-gray-500 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-colors"
        >
          ΝΕΑ ΠΑΡΑΓΓΕΛΙΑ / ΠΙΣΩ
        </button>
      </div>
    </div>
  );
}

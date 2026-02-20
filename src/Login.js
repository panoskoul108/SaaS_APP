import React, { useState } from "react";

export default function Login({ onLoginSuccess }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handlePress = (num) => {
    if (pin.length < 4) {
      setPin(pin + num);
      setError(false);
    }
  };
  const handleDelete = () => setPin(pin.slice(0, -1));

  const handleLogin = () => {
    // ΜΑΓΑΖΙ 1 (STATUS)
    if (pin === "9999") onLoginSuccess("admin", "1");
    else if (pin === "1234") onLoginSuccess("staff", "1");
    else if (pin === "5555")
      onLoginSuccess("kitchen", "1"); // ΝΕΟ: ΚΟΥΖΙΝΑ (Μόνο για το 1)
    // ΜΑΓΑΖΙ 2 (BRIKI)
    else if (pin === "8888") onLoginSuccess("admin", "2");
    else if (pin === "4321") onLoginSuccess("staff", "2");
    // ΛΑΘΟΣ PIN
    else {
      setError(true);
      setPin("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-[3rem] p-8 max-w-sm w-full shadow-2xl flex flex-col items-center animate-fade-in">
        <h1 className="font-black italic text-3xl tracking-tighter mb-2">
          STATUS <span className="text-blue-600">POS</span>
        </h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8">
          ΠΛΗΚΤΡΟΛΟΓΗΣΤΕ PIN ΕΙΣΟΔΟΥ
        </p>
        <div className="flex gap-4 mb-8 h-12">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                pin.length > i
                  ? "bg-blue-600 border-blue-600"
                  : error
                  ? "border-red-500 animate-pulse"
                  : "border-gray-200"
              }`}
            ></div>
          ))}
        </div>
        {error && (
          <p className="text-red-500 font-black text-[10px] uppercase tracking-widest mb-4 absolute mt-20">
            ΛΑΘΟΣ PIN. ΔΟΚΙΜΑΣΤΕ ΞΑΝΑ.
          </p>
        )}
        <div className="grid grid-cols-3 gap-4 w-full mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handlePress(num.toString())}
              className="bg-gray-50 text-gray-800 text-2xl font-black py-5 rounded-2xl hover:bg-gray-100 shadow-sm border border-gray-100"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleDelete}
            className="bg-red-50 text-red-500 text-xl font-black py-5 rounded-2xl hover:bg-red-100"
          >
            ⌫
          </button>
          <button
            onClick={() => handlePress("0")}
            className="bg-gray-50 text-gray-800 text-2xl font-black py-5 rounded-2xl hover:bg-gray-100 shadow-sm border border-gray-100"
          >
            0
          </button>
          <button
            onClick={handleLogin}
            disabled={pin.length < 4}
            className={`text-sm font-black py-5 rounded-2xl shadow-sm uppercase tracking-widest ${
              pin.length === 4
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-300"
            }`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

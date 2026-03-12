import React from "react";

export default function CustomerHeader({
  storeLogo,
  storeName,
  table,
  theme,
  toggleTheme,
  lang,
  toggleLanguage,
  storeThemeColor,
  isDark
}) {
  return (
    <header className={`sticky top-0 z-50 w-full transition-colors duration-300 backdrop-blur-2xl ${isDark ? 'bg-gray-900/80 border-b border-gray-800' : 'bg-white/80 border-b border-gray-200'} shadow-sm`}>
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* ΑΡΙΣΤΕΡΑ: Λογότυπο / Όνομα & Τραπέζι */}
        <div className="flex items-center gap-4">
          {storeLogo ? (
            <img src={storeLogo} alt={storeName} className="h-10 w-auto object-contain drop-shadow-sm" />
          ) : (
            <div className={`font-black italic text-xl tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {storeName || 'SMART MENU'}
            </div>
          )}
          
          {/* Έξυπνη Κάψουλα Τραπεζιού */}
          {table && (
            <div 
              className="px-3 py-1.5 rounded-2xl text-[11px] font-black uppercase text-white shadow-md flex items-center gap-1.5 transition-transform hover:scale-105"
              style={{ backgroundColor: storeThemeColor || '#2563EB' }}
            >
              <span className="text-sm">📍</span>
              <span>{table}</span>
            </div>
          )}
        </div>

        {/* ΔΕΞΙΑ: Εργαλεία (Γλώσσα & Σκοτεινό Θέμα) */}
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleLanguage}
            className={`w-10 h-10 flex items-center justify-center rounded-[1rem] text-sm font-black transition-transform active:scale-90 shadow-sm ${isDark ? 'bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700' : 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50'}`}
          >
            {lang === 'gr' ? '🇬🇧' : '🇬🇷'}
          </button>
          
          <button 
            onClick={toggleTheme}
            className={`w-10 h-10 flex items-center justify-center rounded-[1rem] text-lg transition-transform active:scale-90 shadow-sm ${isDark ? 'bg-gray-800 text-yellow-400 border border-gray-700 hover:bg-gray-700' : 'bg-white text-blue-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  );
}

import React from "react";

export default function CustomerHeader({
  storeLogo,
  storeName,
  tableNum,
  isDark,
  toggleTheme,
  lang,
  toggleLanguage,
  storeThemeColor,
  t,
  canOrder,
  setIsHistoryOpen
}) {
  return (
    <header className={`w-full transition-colors duration-300 backdrop-blur-2xl ${isDark ? 'bg-gray-900/85 border-b border-gray-800' : 'bg-white/85 border-b border-gray-200'} shadow-sm`}>
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between min-h-[4rem]">
        
        {/* ΑΡΙΣΤΕΡΑ: Ιστορικό Παραγγελιών */}
        <div className="flex-1 flex justify-start">
          {canOrder && (
            <button 
              onClick={() => setIsHistoryOpen(true)} 
              className={`w-10 h-10 rounded-[1rem] flex items-center justify-center text-xl transition-transform active:scale-90 shadow-sm ${isDark ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"}`}
            >
              🕒
            </button>
          )}
        </div>

        {/* ΚΕΝΤΡΟ: Λογότυπο / Όνομα & Τραπέζι */}
        <div className="flex-[2] flex flex-col items-center justify-center gap-1.5">
          {storeLogo ? (
            <img src={storeLogo} alt={storeName} className="h-10 w-auto object-contain drop-shadow-sm" />
          ) : (
            <div className={`font-black uppercase tracking-widest text-lg leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {storeName || 'MENU'}
            </div>
          )}
          
          {/* Έξυπνη Κάψουλα Τραπεζιού */}
          <div 
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm flex items-center gap-1.5 transition-transform ${!tableNum ? 'animate-pulse' : ''}`}
            style={{ 
              backgroundColor: tableNum ? storeThemeColor : (isDark ? '#374151' : '#E5E7EB'),
              color: tableNum ? '#ffffff' : (isDark ? '#9CA3AF' : '#6B7280')
            }}
          >
            {tableNum ? (
              <><span>📍</span><span>{t.table} {tableNum}</span></>
            ) : (
              <span>⚠️ {t.requiredTable}</span>
            )}
          </div>
        </div>

        {/* ΔΕΞΙΑ: Εργαλεία (Γλώσσα & Σκοτεινό Θέμα) */}
        <div className="flex-1 flex justify-end gap-2">
          <button 
            onClick={toggleTheme}
            className={`w-10 h-10 flex items-center justify-center rounded-[1rem] text-lg transition-transform active:scale-90 shadow-sm ${isDark ? 'bg-gray-800 text-yellow-400 border border-gray-700 hover:bg-gray-700' : 'bg-white text-blue-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          
          <button 
            onClick={toggleLanguage}
            className={`w-10 h-10 flex items-center justify-center rounded-[1rem] text-sm font-black transition-transform active:scale-90 shadow-sm ${isDark ? 'bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700' : 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50'}`}
          >
            {lang === 'gr' ? '🇬🇧' : '🇬🇷'}
          </button>
        </div>

      </div>
    </header>
  );
}

import React, { useState, useEffect } from 'react';
import posthog from 'posthog-js';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Ελέγχουμε αν ο χρήστης έχει ήδη απαντήσει στο παρελθόν
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    posthog.opt_in_capturing(); // Ενεργοποιεί το PostHog
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookie_consent', 'rejected');
    posthog.opt_out_capturing(); // Σταματάει το PostHog
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-[999] text-white flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
      <div className="text-xs font-medium text-gray-400 text-center md:text-left">
        <strong className="text-white text-sm">Πολιτική Απορρήτου & Cookies 🍪</strong><br/>
        Χρησιμοποιούμε cookies για την ανάλυση της επισκεψιμότητας και τη βελτίωση της εμπειρίας σας. Τα δεδομένα συλλέγονται ανώνυμα και δεν πωλούνται σε τρίτους.
      </div>
      <div className="flex gap-3 w-full md:w-auto shrink-0">
        <button 
          onClick={handleReject} 
          className="flex-1 md:flex-none px-6 py-3 rounded-2xl border border-gray-600 text-gray-300 font-bold text-xs uppercase hover:bg-gray-800 transition-colors"
        >
          Απορριψη
        </button>
        <button 
          onClick={handleAccept} 
          className="flex-1 md:flex-none px-6 py-3 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-transform active:scale-95"
        >
          Αποδοχη
        </button>
      </div>
    </div>
  );
}

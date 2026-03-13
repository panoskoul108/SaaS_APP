import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Menu from './Menu';
import Dashboard from './Dashboard';
import SuperAdmin from './SuperAdmin';
import LandingPage from './LandingPage'; 
import CookieBanner from './CookieBanner'; // Προσθήκη του Banner

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function App() {
  const params = new URLSearchParams(window.location.search);
  const storeId = params.get('store');
  
  const isAdmin = params.has('admin'); 
  const isBoss = params.has('boss');

  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(!!storeId); 

  useEffect(() => {
    if (!storeId) return;

    const checkStoreStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('is_active')
          .eq('id', storeId)
          .single();

        if (error) throw error;
        
        if (data && data.is_active === false) {
          setIsActive(false);
        }
      } catch (error) {
        console.error("Σφάλμα ελέγχου κατάστασης:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStoreStatus();
  }, [storeId]);

  // Μεταβλητή που θα κρατήσει το περιεχόμενο της τρέχουσας οθόνης
  let content = null;

  if (isBoss) {
    content = <SuperAdmin />;
  } else if (isLoading) {
    content = (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  } else if (!isActive) {
    content = (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-center font-sans">
        <div className="text-7xl mb-6">🔒</div>
        <h1 className="text-3xl font-black text-white uppercase tracking-widest mb-3">Προσωρινα Μη Διαθεσιμο</h1>
        <p className="text-gray-400 font-bold">Η πρόσβαση στο κατάστημα έχει ανασταλεί.</p>
      </div>
    );
  } else if (isAdmin) {
    content = <Dashboard />;
  } else if (storeId) {
    content = <Menu />;
  } else {
    content = <LandingPage />;
  }

  // Επιστρέφουμε πάντα το περιεχόμενο ΜΑΖΙ με το Cookie Banner
  return (
    <>
      {content}
      <CookieBanner />
    </>
  );
}

export default App;

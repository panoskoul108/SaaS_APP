import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Menu from './Menu';
import Dashboard from './Dashboard';
import SuperAdmin from './SuperAdmin';
import LandingPage from './LandingPage'; 

// Αρχικοποίηση Supabase στο κεντρικό αρχείο
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function App() {
  const params = new URLSearchParams(window.location.search);
  const storeId = params.get('store');
  
  const isAdmin = params.has('admin'); 
  const isBoss = params.has('boss');

  // State για τον έλεγχο κλειδώματος
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(!!storeId); // Φορτώνει μόνο αν υπάρχει storeId στο URL

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

  // 1. Πρόσβαση στο δικό σου Κέντρο Ελέγχου (Πάντα ανοιχτό, δεν επηρεάζεται από τα λουκέτα)
  if (isBoss) {
    return <SuperAdmin />;
  }

  // 2. Οθόνη Φόρτωσης (Για να μην αναβοσβήσει το μενού πριν κλειδώσει)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 3. Οθόνη Κλειδώματος (Αν το μαγαζί έχει απενεργοποιηθεί)
  if (!isActive) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-center font-sans">
        <div className="text-7xl mb-6">🔒</div>
        <h1 className="text-3xl font-black text-white uppercase tracking-widest mb-3">Προσωρινα Μη Διαθεσιμο</h1>
        <p className="text-gray-400 font-bold">Η πρόσβαση στο κατάστημα έχει ανασταλεί.</p>
      </div>
    );
  }

  // 4. Πρόσβαση στο Ταμείο
  if (isAdmin) {
    return <Dashboard />;
  }

  // 5. Πρόσβαση στον Κατάλογο του πελάτη
  if (storeId) {
    return <Menu />;
  }

  // 6. Η Βιτρίνα της Εταιρείας σου
  return <LandingPage />;
}

export default App;

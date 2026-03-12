import React from 'react';
import Menu from './Menu';
import Dashboard from './Dashboard';
import SuperAdmin from './SuperAdmin';
import LandingPage from './LandingPage'; 

function App() {
  const params = new URLSearchParams(window.location.search);
  const storeId = params.get('store');
  
  // Χρησιμοποιούμε το .has() για να πιάνει και το σκέτο ?admin και το ?boss
  const isAdmin = params.has('admin'); 
  const isBoss = params.has('boss');

  // 1. Πρόσβαση στο δικό σου Κέντρο Ελέγχου
  if (isBoss) {
    return <SuperAdmin />;
  }

  // 2. Πρόσβαση στο Ταμείο (Είτε με σκέτο ?admin είτε με ?admin&store=X)
  if (isAdmin) {
    return <Dashboard />;
  }

  // 3. Πρόσβαση στον Κατάλογο του πελάτη (Αν υπάρχει κωδικός μαγαζιού)
  if (storeId) {
    return <Menu />;
  }

  // 4. Η Βιτρίνα της Εταιρείας σου (Αν το link είναι σκέτο)
  return <LandingPage />;
}

export default App;

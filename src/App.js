import React from 'react';
import Menu from './Menu';
import Dashboard from './Dashboard';
import SuperAdmin from './SuperAdmin';
import LandingPage from './LandingPage'; // <-- Φορτώνουμε τη Βιτρίνα

function App() {
  // Διαβάζουμε το URL
  const params = new URLSearchParams(window.location.search);
  const storeId = params.get('store');
  const isAdmin = params.get('admin');
  const isBoss = params.get('boss');

  // 1. Αν γράψει /?boss=true -> Πάει στο Super Admin σου
  if (isBoss) {
    return <SuperAdmin />;
  }

  // 2. Αν γράψει /?admin=true&store=X -> Πάει στο Ταμείο του μαγαζιού
  if (isAdmin && storeId) {
    return <Dashboard />;
  }

  // 3. Αν γράψει /?store=X&table=Y -> Πάει στο Μενού του πελάτη
  if (storeId) {
    return <Menu />;
  }

  // 4. ΑΝ ΤΟ URL ΕΙΝΑΙ ΣΚΕΤΟ (π.χ. smartpos.gr) -> ΔΕΙΞΕ ΤΗ ΒΙΤΡΙΝΑ!
  return <LandingPage />;
}

export default App;

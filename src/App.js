import React, { useState, useEffect } from "react";
import Menu from "./Menu";
import Dashboard from "./Dashboard";

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [visits, setVisits] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("admin")) {
      setIsAdmin(true);
    }

    // Φόρτωση Loyalty από το κινητό του πελάτη
    const storeId = params.get("store") || "1";
    const saved = localStorage.getItem(`loyalty_visits_${storeId}`);
    if (saved) setVisits(parseInt(saved));
  }, []);

  return (
    <div>
      {isAdmin ? <Dashboard /> : <Menu visits={visits} setVisits={setVisits} />}
    </div>
  );
}

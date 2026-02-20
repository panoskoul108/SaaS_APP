import React, { useState, useEffect } from "react";
import Menu from "./Menu";
import Dashboard from "./Dashboard";

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Διαβάζει το URL και ελέγχει αν υπάρχει η παράμετρος admin
    const params = new URLSearchParams(window.location.search);

    // Αν το URL έχει ?admin τότε isAdmin = true
    if (params.has("admin")) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, []);

  return (
    <div>
      {/* Σωστή Λογική: 
         Αν isAdmin είναι true -> Dashboard
         Αν isAdmin είναι false -> Menu 
      */}
      {isAdmin === true ? <Dashboard /> : <Menu />}
    </div>
  );
}

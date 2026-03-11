import React, { useState, useEffect } from "react";
import Menu from "./Menu";
import Dashboard from "./Dashboard";
import SuperAdmin from "./SuperAdmin"; // Η νέα κρυφή σελίδα

export default function App() {
  const [route, setRoute] = useState("menu");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Ελέγχει ποιο περιβάλλον πρέπει να φορτώσει
    if (params.has("boss")) {
      setRoute("superadmin");
    } else if (params.has("admin")) {
      setRoute("dashboard");
    } else {
      setRoute("menu");
    }
  }, []);

  return (
    <div>
      {route === "superadmin" && <SuperAdmin />}
      {route === "dashboard" && <Dashboard />}
      {route === "menu" && <Menu />}
    </div>
  );
}

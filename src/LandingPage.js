import React from "react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="font-black text-2xl tracking-tighter flex items-center gap-2">
            <span className="text-blue-500">🍽️ Smart</span>POS
          </div>
          <div className="hidden md:flex gap-8 text-sm font-bold text-gray-300">
            <a href="#features" className="hover:text-white transition-colors">Λειτουργίες</a>
            <a href="#pricing" className="hover:text-white transition-colors">Πακέτα</a>
          </div>
          <a href="#demo" className="bg-blue-600 text-white px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-transform active:scale-95 shadow-lg shadow-blue-500/30">
            Live Demo
          </a>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-40 pb-20 px-6 relative">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block bg-blue-900/50 border border-blue-500/30 text-blue-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6">
            🚀 Το μελλον της εστιασης
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tighter">
            Ψηφιακό Μενού & Ταμείο <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Χωρίς Προμήθειες.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
            Αυξήστε τον τζίρο σας, μειώστε τους χρόνους αναμονής και προσφέρετε μια premium εμπειρία στους πελάτες σας με το πιο έξυπνο σύστημα παραγγελιοληψίας.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="#demo" className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-100 transition-transform active:scale-95 shadow-xl">
              Δοκιμαστε το Δωρεαν
            </a>
            <a href="#pricing" className="bg-gray-800 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest border border-gray-700 hover:bg-gray-700 transition-colors">
              Δειτε τα Πακετα
            </a>
          </div>
        </div>
      </section>

      {/* DEMO SANDBOX SECTION */}
      <section id="demo" className="py-24 bg-gray-800/50 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-4">Ζωντανό Περιβάλλον Δοκιμής</h2>
          <p className="text-gray-400 mb-12 max-w-xl mx-auto">Μπείτε στο εικονικό μας εστιατόριο (Sandbox) και δείτε πώς λειτουργεί το σύστημα, τόσο από την πλευρά του πελάτη όσο και του προσωπικού.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Demo Πελάτη */}
            <div className="bg-gray-900 p-8 rounded-[3rem] border border-gray-700 shadow-2xl flex flex-col items-center hover:border-blue-500/50 transition-colors">
              <div className="text-6xl mb-6">📱</div>
              <h3 className="text-2xl font-black uppercase italic mb-2">Οθονη Πελατη</h3>
              <p className="text-gray-400 text-sm mb-8 text-center">Σκανάρετε το QR ή πατήστε το κουμπί για να δείτε πώς παραγγέλνει ο πελάτης από το τραπέζι του.</p>
              <a href="/?store=4&table=Demo" target="_blank" rel="noreferrer" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-transform active:scale-95 text-center">
                Ανοιγμα Μενού
              </a>
            </div>

            {/* Demo Ταμείου */}
            <div className="bg-gray-900 p-8 rounded-[3rem] border border-gray-700 shadow-2xl flex flex-col items-center hover:border-purple-500/50 transition-colors">
              <div className="text-6xl mb-6">💻</div>
              <h3 className="text-2xl font-black uppercase italic mb-2">Οθονη Ταμειου</h3>
              <p className="text-gray-400 text-sm mb-8 text-center">Δείτε πώς εμφανίζονται οι παραγγελίες στο bar/κουζίνα. <br/><span className="text-purple-400 font-bold">PIN Δοκιμής: 1111</span></p>
              <a href="/?admin&store=4" target="_blank" rel="noreferrer" className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-purple-500 transition-transform active:scale-95 text-center">
                Ανοιγμα Ταμείου
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-4">Γιατί να μας επιλέξετε;</h2>
          <p className="text-gray-400">Όλα όσα χρειάζεται μια σύγχρονη επιχείρηση εστίασης.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800/50 p-8 rounded-3xl border border-gray-700">
            <div className="text-4xl mb-4">🌍</div>
            <h3 className="text-xl font-black uppercase mb-2">Πολυγλωσσικο</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Αυτόματη μετάφραση σε Αγγλικά και Τουρκικά για να εξυπηρετείτε τους τουρίστες χωρίς κανένα εμπόδιο.</p>
          </div>
          <div className="bg-gray-800/50 p-8 rounded-3xl border border-gray-700">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-black uppercase mb-2">Live Παραγγελιες</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Οι παραγγελίες των πελατών εμφανίζονται ακαριαία στην οθόνη του ταμείου με ηχητική ειδοποίηση.</p>
          </div>
          <div className="bg-gray-800/50 p-8 rounded-3xl border border-gray-700">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-black uppercase mb-2">Custom Brand</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Το ψηφιακό μενού παίρνει τα δικά σας χρώματα και το δικό σας λογότυπο για απόλυτη επαγγελματική εικόνα.</p>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 bg-gray-800/30 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-4">Απλά & Ξεκάθαρα Πακέτα</h2>
          <p className="text-gray-400 mb-16">Χωρίς κρυφές χρεώσεις, χωρίς ποσοστά επί των πωλήσεων.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            
            {/* Basic */}
            <div className="bg-gray-900 p-8 rounded-[3rem] border border-gray-700 shadow-xl">
              <h3 className="text-xl font-black uppercase text-gray-400 mb-2">Basic</h3>
              <div className="text-4xl font-black mb-6">30€<span className="text-base text-gray-500 font-medium">/μήνα</span></div>
              <ul className="space-y-4 mb-8 text-sm text-gray-300 font-medium">
                <li>✔️ Ψηφιακό Μενού (QR)</li>
                <li>✔️ Απεριόριστα Προϊόντα</li>
                <li>✔️ Πολυγλωσσικό Σύστημα</li>
                <li className="opacity-40 line-through">Σύστημα Παραγγελιοληψίας</li>
                <li className="opacity-40 line-through">Smart Bell (Κλήση Σερβιτόρου)</li>
              </ul>
              <button className="w-full bg-gray-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-700 transition-colors">Επικοινωνια</button>
            </div>

            {/* Pro */}
            <div className="bg-blue-600 p-8 rounded-[3rem] shadow-2xl shadow-blue-500/20 transform md:-translate-y-4 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Most Popular</div>
              <h3 className="text-xl font-black uppercase text-blue-200 mb-2">Pro</h3>
              <div className="text-4xl font-black mb-6 text-white">50€<span className="text-base text-blue-300 font-medium">/μήνα</span></div>
              <ul className="space-y-4 mb-8 text-sm text-white font-medium">
                <li>✔️ Όλα του Basic</li>
                <li>✔️ <b>Σύστημα Παραγγελιοληψίας</b></li>
                <li>✔️ Smart Bell (Κλήση)</li>
                <li>✔️ Ιστορικό Παραγγελιών</li>
                <li className="opacity-50 line-through text-blue-200">AI Premium Manager</li>
              </ul>
              <button className="w-full bg-white text-blue-600 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-100 transition-transform active:scale-95 shadow-lg">Ξεκινηστε Τωρα</button>
            </div>

            {/* Premium */}
            <div className="bg-gray-900 p-8 rounded-[3rem] border border-purple-500/30 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-3xl"></div>
              <h3 className="text-xl font-black uppercase text-purple-400 mb-2">Premium</h3>
              <div className="text-4xl font-black mb-6">80€<span className="text-base text-gray-500 font-medium">/μήνα</span></div>
              <ul className="space-y-4 mb-8 text-sm text-gray-300 font-medium">
                <li>✔️ Όλα του Pro</li>
                <li>✔️ <b>AI Manager</b></li>
                <li>✔️ Προβλέψεις Κίνησης (AI)</li>
                <li>✔️ Προτεραιότητα Υποστήριξης</li>
              </ul>
              <button className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-purple-500 transition-colors">Επικοινωνια</button>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-gray-800 text-center">
        <div className="font-black text-xl tracking-tighter mb-4 opacity-50">
          <span>🍽️ Smart</span>POS
        </div>
        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">© 2026 Smart POS Solutions. All rights reserved.</p>
      </footer>
    </div>
  );
}

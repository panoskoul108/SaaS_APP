import React from "react";

export default function LandingPage() {
  const myEmail = "info@smartpos.gr"; 

  // Το νέο Branding: SmartMenu by SmartPOS
  const BrandLogo = () => (
    <div className="flex items-center gap-2.5 hover:opacity-90 transition-opacity cursor-pointer">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-black text-xl tracking-tighter text-white">
          Smart<span className="text-blue-400">Menu</span>
        </span>
        <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">by SmartPOS</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <BrandLogo />
          <div className="hidden md:flex gap-8 text-sm font-bold text-gray-300">
            <a href="#features" className="hover:text-white transition-colors">Γιατί εμάς</a>
            <a href="#pricing" className="hover:text-white transition-colors">Πακέτα</a>
          </div>
          <a href="#demo" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-transform active:scale-95 shadow-lg shadow-blue-500/30">
            Live Demo
          </a>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-40 pb-20 px-6 relative">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block bg-blue-900/50 border border-blue-500/30 text-blue-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6">
            💫 Η Απολυτη Εμπειρια Πελατη
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tighter">
            Ψηφιακή παραγγελιοληψία με QR <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 text-4xl md:text-6xl">για καφέ & εστιατόρια — χωρίς εφαρμογή.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
            Αυξήστε τον τζίρο σας και μειώστε τους χρόνους αναμονής με το SmartMenu. Η πιο απλή και γρήγορη λύση για τον πελάτη σας.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="#demo" className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-100 transition-transform active:scale-95 shadow-xl">
              Δοκιμαστε το Demo
            </a>
            <a href="#pricing" className="bg-gray-800 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest border border-gray-700 hover:bg-gray-700 transition-colors">
              Δειτε την Προσφορα
            </a>
          </div>
        </div>
      </section>

      {/* NEW SECTION: ΠΛΕΟΝΕΚΤΗΜΑΤΑ (Section 6) */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-4">Γιατί SmartMenu;</h2>
          <p className="text-gray-400">Η δύναμη της ψηφιακής παραγγελίας στα χέρια σας.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-800/50 p-8 rounded-3xl border border-gray-700 hover:border-blue-500/50 transition-colors">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-lg font-black uppercase mb-2">Παραγγελία από κινητό</h3>
            <p className="text-gray-400 text-sm">Ο πελάτης παραγγέλνει άμεσα από το τραπέζι του χωρίς αναμονή.</p>
          </div>
          <div className="bg-gray-800/50 p-8 rounded-3xl border border-gray-700 hover:border-blue-500/50 transition-colors">
            <div className="text-4xl mb-4">🌍</div>
            <h3 className="text-lg font-black uppercase mb-2">Πολυγλωσσικό για τουρίστες</h3>
            <p className="text-gray-400 text-sm">Αυτόματη μετάφραση μενού για άψογη εξυπηρέτηση ξένων επισκεπτών.</p>
          </div>
          <div className="bg-gray-800/50 p-8 rounded-3xl border border-gray-700 hover:border-blue-500/50 transition-colors">
            <div className="text-4xl mb-4">🔔</div>
            <h3 className="text-lg font-black uppercase mb-2">Κλήση σερβιτόρου</h3>
            <p className="text-gray-400 text-sm">Ειδοποίηση του προσωπικού με το πάτημα ενός κουμπιού (Smart Bell).</p>
          </div>
          <div className="bg-gray-800/50 p-8 rounded-3xl border border-gray-700 hover:border-blue-500/50 transition-colors">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-lg font-black uppercase mb-2">Στήσιμο σε 10 λεπτά</h3>
            <p className="text-gray-400 text-sm">Εύκολη εισαγωγή προϊόντων και άμεση έναρξη λειτουργίας.</p>
          </div>
        </div>
      </section>

      {/* DEMO SANDBOX SECTION (Διατήρηση των demo) */}
      <section id="demo" className="py-24 bg-gray-800/50 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-4">Ζωντανό Περιβάλλον Δοκιμής</h2>
          <p className="text-gray-400 mb-12 max-w-xl mx-auto">Δείτε πώς λειτουργεί το σύστημα στην πράξη.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-gray-900 p-8 rounded-[3rem] border border-gray-700 shadow-2xl flex flex-col items-center">
              <div className="text-6xl mb-6">📱</div>
              <h3 className="text-2xl font-black uppercase italic mb-2">Οθονη Πελατη</h3>
              <p className="text-gray-400 text-sm mb-8 text-center">Δείτε το μενού όπως ο πελάτης σας.</p>
              <a href="/?store=4&table=Demo" target="_blank" rel="noreferrer" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-transform text-center block">
                Ανοιγμα Μενού
              </a>
            </div>

            <div className="bg-gray-900 p-8 rounded-[3rem] border border-gray-700 shadow-2xl flex flex-col items-center">
              <div className="text-6xl mb-6">💻</div>
              <h3 className="text-2xl font-black uppercase italic mb-2">Οθονη Ταμειου</h3>
              <p className="text-gray-400 text-sm mb-8 text-center">Διαχείριση παραγγελιών. <br/><span className="text-purple-400 font-bold">PIN: 6666</span></p>
              <a href="/?admin=true&store=4&pin=6666" target="_blank" rel="noreferrer" className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-purple-500 transition-transform text-center block">
                Ανοιγμα Ταμείου
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION (Section 3, 4, 7) */}
      <section id="pricing" className="py-24 bg-gray-800/30 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-4">Απλά & Ξεκάθαρα Πακέτα</h2>
          
          {/* Προσφορά για αρχή (Section 7) */}
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-black py-2 px-4 rounded-full inline-block mb-12 uppercase tracking-tighter animate-pulse">
            🎁 Προσφορά γνωριμίας: 1 μήνας ΔΩΡΕΑΝ ή Pro με 25€ τον πρώτο χρόνο!
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {/* Basic */}
            <div className="bg-gray-900 p-8 rounded-[3rem] border border-gray-700 shadow-xl flex flex-col">
              <h3 className="text-xl font-black uppercase text-gray-400 mb-2">Basic</h3>
              <div className="text-4xl font-black mb-6">15€<span className="text-base text-gray-500 font-medium">/μήνα</span></div>
              <ul className="space-y-4 mb-8 text-sm text-gray-300 font-medium flex-1">
                <li>✔️ QR Ψηφιακό Μενού</li>
                <li>✔️ Απεριόριστα προϊόντα</li>
                <li>✔️ Πολυγλωσσικό</li>
              </ul>
              <a href={`mailto:${myEmail}?subject=Ενδιαφέρον για το Basic`} className="w-full bg-gray-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-700 transition-colors text-center block">Επιλογη</a>
            </div>

            {/* Pro */}
            <div className="bg-blue-600 p-8 rounded-[3rem] shadow-2xl transform md:-translate-y-4 relative flex flex-col">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Most Popular</div>
              <h3 className="text-xl font-black uppercase text-blue-100 mb-2">Pro</h3>
              <div className="text-4xl font-black mb-6 text-white">35€<span className="text-base text-blue-200 font-medium">/μήνα</span></div>
              <ul className="space-y-4 mb-8 text-sm text-white font-medium flex-1">
                <li>✔️ Όλα του Basic</li>
                <li>✔️ <b>Παραγγελιοληψία</b></li>
                <li>✔️ Smart Bell (Κλήση)</li>
                <li>✔️ Ιστορικό παραγγελιών</li>
              </ul>
              <a href={`mailto:${myEmail}?subject=Ενδιαφέρον για το Pro`} className="w-full bg-white text-blue-600 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-100 transition-transform shadow-lg text-center block font-black">Επιλογη</a>
            </div>

            {/* Premium */}
            <div className="bg-gray-900 p-8 rounded-[3rem] border border-purple-500/30 shadow-xl flex flex-col">
              <h3 className="text-xl font-black uppercase text-purple-400 mb-2">Premium</h3>
              <div className="text-4xl font-black mb-6">55€<span className="text-base text-gray-500 font-medium">/μήνα</span></div>
              <ul className="space-y-4 mb-8 text-sm text-gray-300 font-medium flex-1">
                <li>✔️ Όλα του Pro</li>
                <li>✔️ <b>AI Analytics / Προβλέψεις</b></li>
                <li>✔️ Priority support</li>
              </ul>
              <a href={`mailto:${myEmail}?subject=Ενδιαφέρον για το Premium`} className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-purple-500 transition-colors text-center block">Επιλογη</a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER & LEGAL (Section 2) */}
      <footer className="py-12 border-t border-gray-800 text-center flex flex-col items-center px-6">
        <div className="mb-6 opacity-50 grayscale">
           <BrandLogo />
        </div>
        <p className="text-[11px] text-gray-500 max-w-lg mb-4 leading-relaxed">
          Το σύστημα δεν αντικαθιστά την ταμειακή μηχανή. Οι αποδείξεις εκδίδονται από την υπάρχουσα ταμειακή του καταστήματος.
        </p>
        <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">© 2026 SmartMenu by SmartPOS Solutions.</p>
      </footer>
    </div>
  );
}

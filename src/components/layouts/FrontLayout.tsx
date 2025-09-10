import { Outlet } from "react-router-dom";
import Navbar from "../FrontEnd/Navbar";
import Footer from './../FrontEnd/Footer';
import { useEffect } from "react";
import { ensureIdentity } from "../../lib/authBootstrap";

export default function FrontLayout() {
    useEffect(() => { ensureIdentity(); }, []);
  return (
    <div className="min-h-screen bg-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Front pages will render here */}
      <main className="min-h-screen">
        <Outlet />
      </main>

      <Footer/>
    </div>
  );
}

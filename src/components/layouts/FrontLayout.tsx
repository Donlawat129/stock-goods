import { Outlet } from "react-router-dom";
import Navbar from "../FrontEnd/Navbar";
import Footer from './../FrontEnd/Footer';

export default function FrontLayout() {
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

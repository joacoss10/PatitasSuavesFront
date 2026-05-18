import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/NavBar.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Turnos from "./pages/Turnos.jsx";
import PetShop from "./pages/PetShop.jsx";
import Register from "./pages/Register.jsx";
import MisPerros from "./pages/MisPerros.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";


export default function App() {
  const [rol, setRol] = useState(null);

  useEffect(() => {
    const userRol = localStorage.getItem("demo_user_role");
    setRol(userRol);

    // Escuchar cambios en el rol (login/logout)
    const handleRoleChange = () => {
      const newRol = localStorage.getItem("demo_user_role");
      setRol(newRol);
    };

    window.addEventListener("authChange", handleRoleChange);
    window.addEventListener("storage", handleRoleChange);

    return () => {
      window.removeEventListener("authChange", handleRoleChange);
      window.removeEventListener("storage", handleRoleChange);
    };
  }, []);

  // Si es Admin, mostrar AdminDashboard
  if (rol === "Admin") {
    return (
      <>
        <Navbar />
        <AdminDashboard />
      </>
    );
  }

  // Si es Cliente o no hay rol, mostrar interfaz normal
  return (
    <>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/turnos" element={<Turnos />} />
          <Route path="/mis-perros" element={<MisPerros />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/petshop" element={<PetShop />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </>
  );
}

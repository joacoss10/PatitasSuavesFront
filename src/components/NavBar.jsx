import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function NavBar() {
  const navigate = useNavigate();

  const [isLogged, setIsLogged] = useState(false);
  const [userName, setUserName] = useState("Usuario");
  const [rol, setRol] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  function syncAuth() {
    const token = localStorage.getItem("demo_token");
    const name = localStorage.getItem("demo_user_name");
    const email = localStorage.getItem("demo_user_email");
    const userRol = localStorage.getItem("demo_user_role");
    // Solo está logeado si tiene token, nombre y email
    const isActuallyLogged = !!(token && name && email);
    setIsLogged(isActuallyLogged);
    setUserName(name || "Usuario");
    setRol(userRol);
  }

  useEffect(() => {
    syncAuth();
    window.addEventListener("storage", syncAuth);
    window.addEventListener("authChange", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("authChange", syncAuth);
    };
  }, []);

  function logout() {
    localStorage.removeItem("demo_token");
    localStorage.removeItem("demo_user_name");
    localStorage.removeItem("demo_user_email");
    localStorage.removeItem("demo_user_id");
    localStorage.removeItem("demo_user_role");
    syncAuth();
    // Disparar evento para asegurar actualización
    window.dispatchEvent(new Event("authChange"));
    navigate("/");
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "rgba(255,255,255,0.9)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 14,
              background: "var(--brand)",
              display: "grid",
              placeItems: "center",
              color: "#fff",
              fontSize: 18,
            }}
          >
            🐾
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 900 }}>Patitas Suaves</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {rol === "Admin" ? "Vista Administrador" : "Peluquería Canina"}
            </div>
          </div>
        </Link>

        <div style={{ display: "flex", gap: 10 }}>
          {!isLogged ? (
            <>
              <button className="btn" onClick={() => navigate("/register")}>
                Registrarse
              </button>
              <button className="btn btnPrimary" onClick={() => navigate("/login")}>
                Iniciar sesión
              </button>
            </>
          ) : (
            <>
              {rol === "Cliente" && (
                <div style={{ position: "relative" }}>
                  <button 
                    className="btn" 
                    onClick={() => setMenuOpen(!menuOpen)}
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    Mi Perfil ▾
                  </button>
                  {menuOpen && (
                    <>
                      <div 
                        style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }} 
                        onClick={() => setMenuOpen(false)}
                      />
                      <div style={{
                        position: "absolute",
                        top: "calc(100% + 10px)",
                        right: 0,
                        background: "#fff",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        display: "grid",
                        minWidth: 180,
                        overflow: "hidden",
                        zIndex: 100
                      }}>
                        <button 
                          onClick={() => { navigate("/mis-perros", { state: { section: "perfil" } }); setMenuOpen(false); }}
                          style={{ background: "none", border: "none", padding: "12px 16px", textAlign: "left", cursor: "pointer", borderBottom: "1px solid #f0f0f0", fontSize: 14, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#f9f9f9"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                        >
                          👤 Mis Datos
                        </button>
                        <button 
                          onClick={() => { navigate("/mis-perros", { state: { section: "perros" } }); setMenuOpen(false); }}
                          style={{ background: "none", border: "none", padding: "12px 16px", textAlign: "left", cursor: "pointer", borderBottom: "1px solid #f0f0f0", fontSize: 14, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#f9f9f9"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                        >
                          🐶 Mis Perros
                        </button>
                        <button 
                          onClick={() => { navigate("/mis-perros", { state: { section: "turnos" } }); setMenuOpen(false); }}
                          style={{ background: "none", border: "none", padding: "12px 16px", textAlign: "left", cursor: "pointer", fontSize: 14, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#f9f9f9"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                        >
                          📅 Mis Turnos
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              <button className="btn btnPrimary" onClick={logout}>
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

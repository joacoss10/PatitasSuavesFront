import { useState, useEffect } from "react";
import { obtenerGaleria } from "../API/Service/Admin";

export default function Gallery() {
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarGaleria();
  }, []);

  const cargarGaleria = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await obtenerGaleria();
      if (data && data.error) {
        throw new Error(data.error);
      }
      setFotos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Error al cargar la galería");
      setFotos([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ marginTop: 14, textAlign: "center" }}>
        <p style={{ color: "var(--muted)" }}>Cargando galería...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>
              Nuestros peluditos 🐶
            </div>
            <div style={{ color: "var(--muted)", marginTop: 4 }}>
              Algunos perritos que ya pasaron por el salón.
            </div>
          </div>
          <span className="badge">Clientes</span>
        </div>
        <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 14, border: "1px solid #ffc9c9", background: "#fff1f1", color: "#b42323", fontWeight: 700, fontSize: 14, textAlign: "center" }}>
          {error}
        </div>
      </div>
    );
  }

  if (fotos.length === 0) {
    return (
      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>
              Nuestros peluditos 🐶
            </div>
            <div style={{ color: "var(--muted)", marginTop: 4 }}>
              Algunos perritos que ya pasaron por el salón.
            </div>
          </div>
          <span className="badge">Clientes</span>
        </div>
        <div style={{ marginTop: 14, textAlign: "center", color: "var(--muted)" }}>
          <p>Aún no hay fotos en la galería. ¡Vuelve pronto!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>
            Nuestros peluditos 🐶
          </div>
          <div style={{ color: "var(--muted)", marginTop: 4 }}>
            Algunos perritos que ya pasaron por el salón.
          </div>
        </div>
        <span className="badge">Clientes</span>
      </div>

      <div className="galleryGrid" style={{ marginTop: 14 }}>
        {fotos.map((foto) => (
          <div 
            key={foto.id} 
            className="galleryCard"
            style={{
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              transition: "all 0.3s ease",
              cursor: "pointer",
              backgroundColor: "var(--card-bg, #fff)",
              display: "flex",
              flexDirection: "column",
              height: "100%"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.15)";
              e.currentTarget.style.transform = "translateY(-4px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {/* Imagen - contenida dentro de la tarjeta */}
            <div style={{ 
              width: "100%", 
              height: 160, 
              overflow: "hidden", 
              background: "var(--background-secondary)",
              flexShrink: 0
            }}>
              <img
                src={foto.fotoUrl}
                alt={foto.nombrePerro}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                  transition: "transform 0.3s ease",
                  display: "block"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              />
            </div>

            {/* Contenido - debajo de la imagen */}
            <div style={{ padding: "14px 12px", flex: 1, display: "flex", flexDirection: "column" }}>
              {/* Nombre del perro */}
              <div style={{ 
                fontWeight: 800, 
                fontSize: 16, 
                color: "var(--text)",
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 6
              }}>
                <span style={{ fontSize: 18 }}>🐕</span>
                {foto.nombrePerro}
              </div>

              {/* Servicio */}
              <div style={{ 
                fontSize: 12, 
                color: "var(--brand)",
                fontWeight: 600,
                backgroundColor: "rgba(var(--brand-rgb), 0.1)",
                padding: "3px 6px",
                borderRadius: 6,
                display: "inline-block",
                marginBottom: 8
              }}>
                ✨ {foto.servicioRealizado}
              </div>

              {/* Comentarios */}
              {foto.comentarios && (
                <div style={{ 
                  fontSize: 12, 
                  color: "var(--muted)", 
                  lineHeight: 1.4,
                  fontStyle: "italic",
                  borderLeft: "3px solid var(--brand)",
                  paddingLeft: 8,
                  marginTop: "auto"
                }}>
                  "{foto.comentarios}"
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

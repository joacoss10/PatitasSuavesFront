import { Link } from "react-router-dom";
import Gallery from "../components/Gallery";


export default function Home() {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="card">
        <h1 style={{ margin: "10px 0 6px" }}>Bienvenido 🐶</h1>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          Sacá un turno en segundos. Guardá tus perros una sola vez y listo.
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <Link className="btn btnPrimary" to="/turnos">
            Pedir turno
          </Link>

          <Link className="btn" to="/petshop">
            PetShop
          </Link>
        </div>

      </div>

      <Gallery />

      <div className="card">
        <h2 style={{ margin: "10px 0 6px" }}>Quiénes somos 📍</h2>
        <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.5 }}>
          Somos una peluquería canina con local en xxxxx.
        </p>
      </div>

    </div>
    
  );
  
}

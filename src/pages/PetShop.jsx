export default function PetShop() {
  return (
    <div className="card">
      <div className="badge">Próximamente</div>
      <h2 style={{ margin: "10px 0 6px" }}>PetShop 🛒</h2>
      <p style={{ margin: 0, color: "var(--muted)" }}>
        Acá vamos a vender productos recomendados (demo).
      </p>

      <div style={{
        marginTop: 14,
        display: "grid",
        gap: 12,
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      }}>
        {[
          { t: "Shampoo hipoalergénico", d: "Ideal para piel sensible." },
          { t: "Snack dental", d: "Ayuda con el aliento y la higiene." },
          { t: "Cepillo deslanador", d: "Para mantener el pelo entre turnos." },
        ].map((p) => (
          <div key={p.t} style={{ border: "1px solid var(--border)", borderRadius: 16, padding: 12 }}>
            <div style={{ fontWeight: 900 }}>{p.t}</div>
            <div style={{ marginTop: 6, color: "var(--muted)" }}>{p.d}</div>
            <button className="btn" style={{ marginTop: 10 }}>Ver</button>
          </div>
        ))}
      </div>
    </div>
  );
}

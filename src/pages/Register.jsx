import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../API/Service/Register";

export default function Register() {
  const nav = useNavigate();
  const [nombre, setNombre] = useState("");
  const [mail, setMail] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [confirmarContrasenia, setConfirmarContrasenia] = useState("");
  const [celular, setCelular] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarContrasenia, setMostrarContrasenia] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validaciones del frontend
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (!mail.includes("@") || !mail.includes(".")) {
      setError("Ingresá un email válido.");
      return;
    }

    if (contrasenia.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres.");
      return;
    }

    if (contrasenia !== confirmarContrasenia) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (!celular.trim()) {
      setError("El celular es obligatorio.");
      return;
    }

    // Validar que el celular sea solo números
    if (!/^\d+$/.test(celular.replace(/\s/g, ""))) {
      setError("El celular debe contener solo números.");
      return;
    }

    // Validar que el celular tenga 10 dígitos
    if (celular.replace(/\s/g, "").length !== 10) {
      setError("El celular debe tener 10 dígitos.");
      return;
    }

    try {
      setLoading(true);
      const response = await register({ nombre, mail, contrasenia, celular });

      if (response && response.error) {
        setError(response.error);
        return;
      }

      setSuccess("Registro exitoso. Redirigiendo al login...");
      setTimeout(() => {
        nav("/login");
      }, 1500);
    } catch (err) {
      setError(err.message || "Error al registrarse. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (hasError) => ({
    padding: "10px 12px",
    borderRadius: 14,
    border: hasError ? "1px solid #ff6b6b" : "1px solid var(--border)",
    outline: "none",
  });

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Registrarse</h2>
        <p style={{ marginTop: 6, color: "var(--muted)" }}>
          Crea tu cuenta para acceder a nuestros servicios
        </p>

        <form onSubmit={submit} style={{ display: "grid", gap: 10, marginTop: 14 }}>
          {/* Nombre */}
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontWeight: 800, fontSize: 14 }}>Tu nombre</label>
            <input
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                setError("");
              }}
              placeholder="Ej: Tatiana"
              required
              style={inputStyle(false)}
            />
          </div>

          {/* Email */}
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontWeight: 800, fontSize: 14 }}>Email</label>
            <input
              type="email"
              value={mail}
              onChange={(e) => {
                setMail(e.target.value);
                setError("");
              }}
              placeholder="ejemplo@gmail.com"
              required
              style={inputStyle(error.includes("email"))}
            />
          </div>

          {/* Contraseña */}
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontWeight: 800, fontSize: 14 }}>Contraseña</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type={mostrarContrasenia ? "text" : "password"}
                value={contrasenia}
                onChange={(e) => {
                  setContrasenia(e.target.value);
                  setError("");
                }}
                placeholder="••••••••"
                required
                style={{
                  ...inputStyle(error.includes("contraseña")),
                  paddingRight: 40,
                  flex: 1,
                }}
              />
              <button
                type="button"
                onClick={() => setMostrarContrasenia(!mostrarContrasenia)}
                style={{
                  position: "absolute",
                  right: 10,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 18,
                  padding: 0,
                }}
              >
                {mostrarContrasenia ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {/* Confirmar Contraseña */}
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontWeight: 800, fontSize: 14 }}>Confirmar contraseña</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type={mostrarConfirmar ? "text" : "password"}
                value={confirmarContrasenia}
                onChange={(e) => {
                  setConfirmarContrasenia(e.target.value);
                  setError("");
                }}
                placeholder="••••••••"
                required
                style={{
                  ...inputStyle(error.includes("contraseña")),
                  paddingRight: 40,
                  flex: 1,
                }}
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                style={{
                  position: "absolute",
                  right: 10,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 18,
                  padding: 0,
                }}
              >
                {mostrarConfirmar ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {/* Celular */}
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontWeight: 800, fontSize: 14 }}>Celular</label>
            <input
              type="tel"
              value={celular}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*$/.test(val)) {
                  setCelular(val);
                  setError("");
                }
              }}
              placeholder="11 2345 6789"
              required
              style={inputStyle(error.includes("celular"))}
            />
          </div>

          {/* Mensaje de error */}
          {error && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid #ffc9c9",
                background: "#fff1f1",
                color: "#b42323",
                fontWeight: 700,
                fontSize: 14,
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}

          {/* Mensaje de éxito */}
          {success && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid #d3f9d8",
                background: "#f1fdf5",
                color: "#2f9e44",
                fontWeight: 700,
                fontSize: 14,
                textAlign: "center",
              }}
            >
              {success}
            </div>
          )}

          <button 
            className="btn btnPrimary" 
            type="submit"
            disabled={loading}
          >
            {loading ? "Registrando..." : "Crear cuenta"}
          </button>

          <button 
            className="btn" 
            type="button" 
            onClick={() => nav("/")}
            disabled={loading}
          >
            Volver
          </button>
        </form>
      </div>
    </div>
  );
}

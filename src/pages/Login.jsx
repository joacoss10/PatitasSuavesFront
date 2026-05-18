import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, obtenerCodigoRecuperacion, validarCodigoRecuperacion, cambiarContrasenia } from "../API/Service/Login";

export default function Login() {
  const nav = useNavigate();

  const [mail, setMail] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [mostrarContrasenia, setMostrarContrasenia] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hasCredError, setHasCredError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados para recuperación de contraseña
  const [view, setView] = useState("login"); // "login" | "recovery"
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: mail, 2: codigo, 3: nueva contraseña
  const [recoveryCode, setRecoveryCode] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setHasCredError(false);

    if (!mail.includes("@")) {
      setError("Ingresá un email válido.");
      return;
    }
    if (contrasenia.length < 4) {
      setError("La contraseña es muy corta.");
      return;
    }

    try {
      setLoading(true);
      const response = await login({ mail, contrasenia });
      
      if (response && response.error) {
        setHasCredError(true);
        setError(response.error);
        return;
      }

      // Disparar evento personalizado para que NavBar se actualice
      window.dispatchEvent(new Event("authChange"));
      
      // Chequear si hay un turno pendiente y redirigir a /turnos
      const pendingTurno = localStorage.getItem("turno_pending");
      if (pendingTurno) {
        nav("/turnos");
      } else {
        nav("/");
      }
    } catch (err) {
      
      setHasCredError(true);
      setError(err.error || "Email o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRecoveryRequest(e) {
    e.preventDefault();
    setError("");
    
    if (!mail.includes("@")) {
      setError("Ingresá un email válido.");
      return;
    }

    try {
      setLoading(true);
      await obtenerCodigoRecuperacion(mail);
      setRecoveryStep(2);
    } catch (err) {
      setError(err.message || "Error al solicitar el código.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCodeVerification(e) {
    e.preventDefault();
    setError("");
    if (!recoveryCode) {
      setError("Ingresá el código.");
      return;
    }

    try {
      setLoading(true);
      const response = await validarCodigoRecuperacion(mail, recoveryCode);
      if (response && response.token) {
        setTempToken(response.token);
        setRecoveryStep(3);
      } else {
        throw new Error("Código inválido o expirado.");
      }
    } catch (err) {
      setError(err.message || "Error al verificar código.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setError("");
    
    if (newPassword.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setLoading(true);
      await cambiarContrasenia(newPassword, tempToken);
      
      setSuccess("Contraseña actualizada correctamente. Iniciá sesión.");
      setView("login");
      
      // Limpiar estados
      setRecoveryStep(1);
      setMail("");
      setContrasenia("");
      setRecoveryCode("");
      setNewPassword("");
      setConfirmNewPassword("");
      setTempToken("");
      setShowNewPassword(false);
    } catch (err) {
      setError(err.message || "Error al cambiar contraseña.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (isError) => ({
    padding: "10px 12px",
    borderRadius: 14,
    border: isError ? "1px solid #ff6b6b" : "1px solid var(--border)",
    outline: "none",
  });

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{view === "login" ? "Iniciar sesión" : "Recuperar contraseña"}</h2>

        {view === "login" ? (
          <form onSubmit={submit} style={{ display: "grid", gap: 10, marginTop: 14 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontWeight: 800, fontSize: 14 }}>Email</label>
            <input
              type="email"
              value={mail}
              onChange={(e) => {
                setMail(e.target.value);
                setHasCredError(false);
                setError("");
              }}
              placeholder="tuemail@gmail.com"
              required
              style={inputStyle(hasCredError)}
            />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontWeight: 800, fontSize: 14 }}>Contraseña</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type={mostrarContrasenia ? "text" : "password"}
                value={contrasenia}
                onChange={(e) => {
                  setContrasenia(e.target.value);
                  setHasCredError(false);
                  setError("");
                }}
                placeholder="••••"
                required
                style={{
                  ...inputStyle(hasCredError),
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

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button 
              type="button" 
              onClick={() => { setView("recovery"); setRecoveryStep(1); setError(""); }}
              style={{ background: "none", border: "none", color: "var(--brand)", cursor: "pointer", fontSize: 13, textDecoration: "underline", padding: 0 }}
            >
              ¿Olvidaste la contraseña?
            </button>
          </div>

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

          <button className="btn btnPrimary" type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Entrar"}
          </button>

          <button className="btn" type="button" onClick={() => nav("/")} disabled={loading}>
            Volver
          </button>
        </form>
        ) : (
          <div style={{ marginTop: 14, display: "grid", gap: 14 }}>
            {recoveryStep === 1 ? (
              <>
                <p style={{ margin: 0, color: "var(--muted)" }}>
                  Ingresá tu email para recibir un código de recuperación.
                </p>
                <form onSubmit={handleRecoveryRequest} style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <label style={{ fontWeight: 800, fontSize: 14 }}>Email</label>
                    <input
                      type="email"
                      value={mail}
                      onChange={(e) => {
                        setMail(e.target.value);
                        setError("");
                      }}
                      placeholder="tuemail@gmail.com"
                      required
                      style={inputStyle(!!error)}
                    />
                  </div>
                  
                  {error && (
                    <div style={{ padding: "10px 12px", borderRadius: 14, border: "1px solid #ffc9c9", background: "#fff1f1", color: "#b42323", fontWeight: 700, fontSize: 14, textAlign: "center" }}>
                      {error}
                    </div>
                  )}

                  <button className="btn btnPrimary" type="submit" disabled={loading}>
                    {loading ? "Enviando..." : "Enviar código"}
                  </button>
                  <button className="btn" type="button" onClick={() => { setView("login"); setError(""); }} disabled={loading}>
                    Cancelar
                  </button>
                </form>
              </>
            ) : recoveryStep === 2 ? (
              <>
                <div style={{ background: "#e7f5ff", padding: 12, borderRadius: 10, color: "#004085", fontSize: 14, lineHeight: 1.5 }}>
                  ✅ Código enviado a <strong>{mail}</strong>.<br/>
                  ⏳ Tenés <strong>10 minutos</strong> desde que llegó.<br/>
                  ⚠️ Si no lo ves, revisá en <strong>Spam</strong>.
                </div>
                
                <form onSubmit={handleCodeVerification} style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <label style={{ fontWeight: 800, fontSize: 14 }}>Código de recuperación</label>
                    <input
                      type="text"
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      placeholder="Ingresá el código"
                      required
                      style={inputStyle(false)}
                    />
                  </div>

                  {error && (
                    <div style={{ padding: "10px 12px", borderRadius: 14, border: "1px solid #ffc9c9", background: "#fff1f1", color: "#b42323", fontWeight: 700, fontSize: 14, textAlign: "center" }}>
                      {error}
                    </div>
                  )}
                  
                  <button className="btn btnPrimary" type="submit" disabled={loading}>
                    {loading ? "Verificando..." : "Verificar código"}
                  </button>
                  <button className="btn" type="button" onClick={() => { setView("login"); setError(""); }}>
                    Volver al login
                  </button>
                </form>
              </>
            ) : (
              <>
                <p style={{ margin: 0, color: "var(--muted)" }}>
                  Ingresá tu nueva contraseña.
                </p>
                <form onSubmit={handlePasswordChange} style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <label style={{ fontWeight: 800, fontSize: 14 }}>Nueva Contraseña</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••"
                        required
                        style={{ ...inputStyle(false), paddingRight: 40, flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{ position: "absolute", right: 10, background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 0 }}
                      >
                        {showNewPassword ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 6 }}>
                    <label style={{ fontWeight: 800, fontSize: 14 }}>Repetir Contraseña</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="••••"
                        required
                        style={{ ...inputStyle(false), paddingRight: 40, flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{ position: "absolute", right: 10, background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 0 }}
                      >
                        {showNewPassword ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                  </div>
                  
                  {error && (
                    <div style={{ padding: "10px 12px", borderRadius: 14, border: "1px solid #ffc9c9", background: "#fff1f1", color: "#b42323", fontWeight: 700, fontSize: 14, textAlign: "center" }}>
                      {error}
                    </div>
                  )}

                  <button className="btn btnPrimary" type="submit" disabled={loading}>
                    {loading ? "Guardando..." : "Cambiar contraseña"}
                  </button>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

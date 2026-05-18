import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerAgenda, obtenerServicios } from "../API/Service/Turnos";
import { generarTurno } from "../API/Service/Turnos";
import { obtenerPerros, obtenerDatosCliente, modificarDatosCliente } from "../API/Service/Perros";

export default function Turnos() {
  const navigate = useNavigate();
  const [agenda, setAgenda] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mostrarModalAuth, setMostrarModalAuth] = useState(false);
  
  // Paso 1: Fecha y Hora
  const [step, setStep] = useState(1);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [hora, setHora] = useState(null);

  // Paso 2: Mascotas y Servicios
  const [misPerros, setMisPerros] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [seleccion, setSeleccion] = useState({}); // { idPerro: idServicio }
  const [loadingStep2, setLoadingStep2] = useState(false);
  const [notification, setNotification] = useState(null); // { message: "", type: "error" | "success" }
  const [resumen, setResumen] = useState(null);
  const [confirmation, setConfirmation] = useState(null); // { message: "", onConfirm: () => {} }
  
  // Datos del cliente para el resumen
  const [clienteData, setClienteData] = useState({ nombre: "", telefono: "", mail: "" });
  const [editandoTelefono, setEditandoTelefono] = useState(false);
  const [nuevoTelefono, setNuevoTelefono] = useState("");

  useEffect(() => {
    // Restaurar estado si venimos de un login o registro de perro
    const pendingTurnoJSON = localStorage.getItem("turno_pending");
    if (pendingTurnoJSON) {
      try {
        const { dia, hora, seleccion: seleccionGuardada } = JSON.parse(pendingTurnoJSON);
        const token = localStorage.getItem("demo_token");
        
        if (dia && hora) {
          setDiaSeleccionado(dia);
          setHora(hora);
          // Si el usuario ya está logueado, lo llevamos al paso 2 y limpiamos
          if (token) {
            setStep(2);
            if (seleccionGuardada) {
              setSeleccion(seleccionGuardada);
            }
            localStorage.removeItem("turno_pending");
          }
        } else {
          localStorage.removeItem("turno_pending"); // Datos inválidos
        }
      } catch (e) {
        console.error("Error al restaurar el turno pendiente:", e);
        localStorage.removeItem("turno_pending");
      }
    }
    cargarAgenda();
  }, []);

  // Cargar datos para el paso 2 cuando se activa
  useEffect(() => {
    if (step === 2) {
      cargarDatosPaso2();
    }
  }, [step]);

  async function cargarAgenda() {
    try {
      setLoading(true);
      const data = await obtenerAgenda();
      if (data && data.error) {
        throw new Error(data.error);
      }
      setAgenda(Array.isArray(data) ? data : []);
      // Solo setear default si no hay uno ya seleccionado (por restauración)
      if (Array.isArray(data) && data.length > 0 && !diaSeleccionado) {
        setDiaSeleccionado(data[0].fecha);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function cargarDatosPaso2() {
    try {
      setLoadingStep2(true);
      
      const [perrosRes, serviciosRes, clienteRes] = await Promise.all([
        obtenerPerros(),
        obtenerServicios(),
        obtenerDatosCliente()
      ]);

      if (perrosRes && perrosRes.error) throw new Error(perrosRes.error);
      if (serviciosRes && serviciosRes.error) throw new Error(serviciosRes.error);
      if (clienteRes && clienteRes.error) throw new Error(clienteRes.error);
      
      setClienteData(clienteRes || { nombre: "", telefono: "", mail: "" });
      setNuevoTelefono(clienteRes?.telefono ? String(clienteRes.telefono) : "");

      setMisPerros(Array.isArray(perrosRes) ? perrosRes : perrosRes.perros || []);
      
      // Normalizar servicios (pueden venir en distintas estructuras según el backend)
      let servs = [];
      if (Array.isArray(serviciosRes)) servs = serviciosRes;
      else if (serviciosRes?.servicios) servs = serviciosRes.servicios;
      else if (serviciosRes?.data) servs = serviciosRes.data;
      
      // Filtrar solo servicios activos
      setServicios(servs.filter(s => s.activo));
    } catch (err) {
      console.error(err);
      setNotification({ message: err.message, type: "error" });
    } finally {
      setLoadingStep2(false);
    }
  }

  const horariosDisponibles = agenda.find((d) => d.fecha === diaSeleccionado)?.horario || [];

  function siguientePaso() {
    const token = localStorage.getItem("demo_token");
    if (!token) {
      // Guardar selección antes de pedir login
      if (diaSeleccionado && hora) {
        localStorage.setItem("turno_pending", JSON.stringify({ dia: diaSeleccionado, hora }));
      }
      setMostrarModalAuth(true);
      return;
    }
    setStep(2);
  }

  function formatearFecha(fechaStr) {
    if (!fechaStr) return "";
    // Asumimos formato YYYY-MM-DD
    const [anio, mes, dia] = fechaStr.split("-");
    const date = new Date(Number(anio), Number(mes) - 1, Number(dia));
    const diaSemana = date.toLocaleDateString("es-ES", { weekday: "long" });
    // Retorna ej: "Lunes 10/02"
    return `${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)} ${dia}/${mes}`;
  }

  function verResumen() {
    const perrosSeleccionados = Object.keys(seleccion);
    if (perrosSeleccionados.length === 0) {
      setNotification({ message: "Por favor seleccioná al menos un servicio para una mascota.", type: "error" });
      return;
    }
    setResumen(true);
  }

  function calcularTotal() {
    let total = 0;
    for (const perroId in seleccion) {
      const servicioId = seleccion[perroId];
      const servicio = servicios.find(s => s.id.toString() === servicioId);
      if (servicio) {
        total += servicio.precio;
      }
    }
    return total;
  }

  async function guardarTelefono() {
    try {
      if (nuevoTelefono.length !== 10) {
        setNotification({ message: "El teléfono debe tener 10 números.", type: "error" });
        return;
      }

      const response = await modificarDatosCliente({
        nombre: clienteData.nombre,
        mail: clienteData.mail,
        telefono: nuevoTelefono
      });

      if (response && response.error) {
        throw new Error(response.error);
      }

      setClienteData(prev => ({ ...prev, telefono: nuevoTelefono }));
      setEditandoTelefono(false);
      setNotification({ message: "Teléfono actualizado correctamente", type: "success" });
    } catch (err) {
      setNotification({ message: err.message, type: "error" });
    }
  }

  async function confirmarReservaFinal() {
    const perrosSeleccionados = Object.keys(seleccion);
    if (perrosSeleccionados.length === 0) {
      setNotification({ message: "Por favor seleccioná al menos un servicio para una mascota.", type: "error" });
      return;
    }
    
    // Crear array de items para el DTO
    const items = [];
    for (const perroId in seleccion) {
      items.push({
        perroId: Number(perroId),
        servicioId: Number(seleccion[perroId])
      });
    }

    const token = localStorage.getItem("demo_token");

    // Preparar DTO
    const turnoDto = {
      fecha: diaSeleccionado,
      horaInicio: hora,
      items: items
    };

    try {
      const response = await generarTurno(turnoDto, token);
      
      if (response && response.error) {
        throw new Error(response.error);
      }

      setNotification({ 
        message: "Reserva realizada, pronto nos comunicaremos con usted para confirmar el turno. Recuerde que puede ver el estado de su turno en \"Mi perfil > Mis turnos\"", 
        type: "success",
        onClose: () => navigate("/")
      });
      // Limpiar storage tras éxito
      localStorage.removeItem("turno_pending");
    } catch (err) {
      console.error(err);
      setNotification({ message: err.message, type: "error" });
    }
  }

  if (loading) {
    return (
      <div className="card">
        <p style={{ textAlign: "center", color: "var(--muted)" }}>Cargando agenda...</p>
      </div>
    );
  }  

 
  if (error) {
    return (
      <div className="card" style={{ border: "1px solid #ffc9c9", background: "#fff1f1" }}>
        <p style={{ color: "#b42323", fontWeight: 700, margin: 0 }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="card">
        <div className="badge">Pedir turno</div>
        <h2 style={{ margin: "10px 0 6px" }}>
          {step === 1 ? "Elegí día y horario" : "Elegí mascota y servicio"}
        </h2>

        {step === 1 ? (
         agenda.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No hay turnos disponibles por el momento.</p>
        ) : (
          <div
            style={{
              marginTop: 14,
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              alignItems: "start",
            }}
          >
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 900 }}>Día</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {agenda.map((d) => (
                <button
                  key={d.fecha}
                  className="btn"
                  onClick={() => {
                    setDiaSeleccionado(d.fecha);
                    setHora(null);
                  }}
                  style={{
                    background: diaSeleccionado === d.fecha ? "var(--accent)" : "#fff",
                    borderColor: diaSeleccionado === d.fecha ? "#f0d48d" : "var(--border)",
                  }}
                >
                  {formatearFecha(d.fecha)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 900 }}>Horarios</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {horariosDisponibles.length > 0 ? (
                horariosDisponibles.map((h) => (
                  <button
                    key={h}
                    className="btn"
                    onClick={() => setHora(h)}
                    style={{
                      background: hora === h ? "var(--brand)" : "#fff",
                      color: hora === h ? "#fff" : "var(--text)",
                      borderColor: hora === h ? "var(--brand)" : "var(--border)",
                    }}
                  >
                    {h}
                  </button>
                ))
              ) : (
                <div style={{ gridColumn: "1 / -1", color: "var(--muted)", fontSize: 13 }}>
                  No hay horarios para este día.
                </div>
              )}
            </div>

            <button className="btn btnPrimary" disabled={!hora} onClick={siguientePaso}>
              Siguiente
            </button>
          </div>
          </div>
        )
        ) : (
          /* PASO 2 */
          <div style={{ marginTop: 14, display: "grid", gap: 14 }}>
            {/* Resumen amigable */}
            <div style={{ background: "#f0f8ff", border: "1px solid #cce5ff", padding: 12, borderRadius: 10 }}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: 15, color: "#004085" }}>📝 Tu Reserva</h3>
              <div style={{ display: "flex", gap: 14, fontSize: 14, color: "#004085" }}>
                <div>📅 <strong>Día:</strong> {formatearFecha(diaSeleccionado)}</div>
                <div>⏰ <strong>Hora:</strong> {hora} hs</div>
              </div>
              <button 
                onClick={() => setStep(1)}
                style={{ background: "none", border: "none", color: "#004085", textDecoration: "underline", cursor: "pointer", padding: 0, marginTop: 6, fontSize: 12 }}
              >
                Cambiar fecha
              </button>
            </div>

            {loadingStep2 ? (
              <p style={{ color: "var(--muted)" }}>Cargando tus mascotas...</p>
            ) : misPerros.length === 0 ? (
              <div style={{ textAlign: "center", padding: 20, border: "1px dashed var(--border)", borderRadius: 10 }}>
                <p>No tenés perros registrados.</p>
                <button className="btn" onClick={() => {
                  // Guardar estado antes de ir a registrar la mascota
                  if (diaSeleccionado && hora) {
                    localStorage.setItem("turno_pending", JSON.stringify({ dia: diaSeleccionado, hora, seleccion }));
                  }
                  navigate("/mis-perros", { state: { section: "perros", openForm: true } });
                }}>Registrar mascota</button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                <p style={{ margin: 0, fontSize: 14 }}>Seleccioná qué servicio querés para cada mascota (máximo 3 por turno):</p>
                
                {misPerros.map((perro) => (
                  <div key={perro.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", border: "1px solid var(--border)", borderRadius: 10, background: "#fafafa" }}>
                    <div style={{ fontWeight: 700 }}>🐶 {perro.nombre}</div>
                    <select
                      value={seleccion[perro.id] || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSeleccion(prev => {
                          // Validar máximo 3 perros
                          if (val && !prev[perro.id] && Object.keys(prev).length >= 3) {
                            setNotification({ message: "Solo se permiten un máximo de 3 perros por turno.", type: "error" });
                            return prev;
                          }

                          const next = { ...prev };
                          if (val) next[perro.id] = val;
                          else delete next[perro.id];
                          return next;
                        });
                      }}
                      style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", maxWidth: 200 }}
                    >
                      <option value="">-- Ninguno --</option>
                      {servicios.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.servicio || s.nombre} - ${s.precio?.toLocaleString("es-AR")}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                <button 
                  className="btn" 
                  onClick={() => {
                    // Guardar estado antes de ir a agregar otra mascota
                    if (diaSeleccionado && hora) {
                      localStorage.setItem("turno_pending", JSON.stringify({ dia: diaSeleccionado, hora, seleccion }));
                    }
                    navigate("/mis-perros", { state: { section: "perros", openForm: true } });
                  }}
                  style={{ marginTop: 10, border: "1px dashed var(--brand)", color: "var(--brand)", background: "white" }}
                >
                  + Agregar otra mascota
                </button>

                {!resumen && (
                  <button 
                    className="btn btnPrimary" 
                    onClick={verResumen}
                    disabled={Object.keys(seleccion).length === 0}
                    style={{ marginTop: 10 }}
                  >
                    Confirmar Reserva
                  </button>
                )}

                {/* Resumen del turno */}
                {resumen && (
                  <div style={{ marginTop: 20, padding: 15, border: "1px solid var(--border)", borderRadius: 10, background: "#f9f9f9" }}>
                    <h4 style={{ margin: "0 0 10px 0", fontWeight: "bold" }}>Resumen del Turno</h4>
                    <div style={{ marginBottom: 12, color: "#b42323", fontWeight: 700 }}>
                      ⚠️ Lea atentamente que sus datos sean correctos.
                    </div>
                    <p>
                      <strong>Fecha:</strong> {formatearFecha(diaSeleccionado)} - <strong>Hora:</strong> {hora} hs
                    </p>
                    
                    <div style={{ marginBottom: 10 }}>
                      <strong>Teléfono de contacto: </strong>
                      {editandoTelefono ? (
                        <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                          <input 
                            value={nuevoTelefono} 
                            onChange={e => {
                              const val = e.target.value;
                              if (/^\d*$/.test(val)) setNuevoTelefono(val);
                            }}
                            style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #ccc", width: 120 }}
                          />
                          <button onClick={guardarTelefono} style={{ background: "var(--brand)", color: "#fff", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontSize: 12 }}>Guardar</button>
                          <button onClick={() => { setEditandoTelefono(false); setNuevoTelefono(clienteData.telefono); }} style={{ background: "#ccc", color: "#fff", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontSize: 12 }}>✕</button>
                        </div>
                      ) : (
                        <>
                          <span>{clienteData.telefono || "No registrado"}</span>
                          <button onClick={() => setEditandoTelefono(true)} style={{ marginLeft: 8, background: "none", border: "none", color: "var(--brand)", textDecoration: "underline", cursor: "pointer", fontSize: 12 }}>Modificar</button>
                        </>
                      )}
                    </div>

                    {misPerros.map(perro => seleccion[perro.id] && (
                      <p key={perro.id}>
                        <strong>{perro.nombre}:</strong> {servicios.find(s => s.id.toString() === seleccion[perro.id])?.servicio}
                      </p>
                    ))}
                    <p>
                      <strong>Total:</strong> ${calcularTotal().toLocaleString("es-AR")}
                    </p>
                    <div style={{ margin: "16px 0", padding: 12, background: "#fff", border: "2px solid var(--brand)", borderRadius: 10, color: "black", fontWeight: 700, fontSize: 16, textAlign: "center" }}>
                      El turno se abona con transferencia o efectivo en el local el día del turno.
                    </div>
                    <button className="btn btnPrimary" onClick={confirmarReservaFinal} style={{ width: "100%" }}>
                    Confirmar Reserva
                  </button>
                  </div>
                )}
                <button 
                  className="btn" 
                  onClick={() => {
                    setConfirmation({
                      message: "¿Querés cancelar la reserva? Se perderán los datos seleccionados.",
                      onConfirm: () => {
                        localStorage.removeItem("turno_pending");
                        navigate("/");
                      }
                    });
                  }}
                  style={{ marginTop: 5, background: "transparent", border: "none", color: "#b42323", textDecoration: "underline" }}
                >
                  Cancelar operación
                </button>
              </div>
            )}
          </div>
        )}

        {mostrarModalAuth && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 20,
            }}
          >
            <div className="card" style={{ maxWidth: 400, width: "100%", animation: "fadeIn 0.2s" }}>
              <h3 style={{ marginTop: 0 }}>¡Ya casi estamos! 🐾</h3>
              <p style={{ color: "var(--muted)", lineHeight: 1.5 }}>
                Para terminar de reservar el turno, necesitamos que inicies sesión. <br />
                Es para saber a nombre de quién guardamos el lugar y poder avisarte cualquier cosa.
              </p>
              <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
                <button className="btn btnPrimary" onClick={() => navigate("/login")}>
                  Tengo cuenta (Iniciar sesión)
                </button>
                <button className="btn" onClick={() => navigate("/register")}>
                  Soy nuevo (Crear cuenta)
                </button>
                <button className="btn" style={{ border: "none", color: "var(--muted)" }} onClick={() => {
                  setMostrarModalAuth(false);
                  localStorage.removeItem("turno_pending"); // Limpiar al cancelar
                }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Notificación Personalizado */}
        {notification && (
          <div
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0,0,0,0.5)", zIndex: 2000,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 20
            }}
            onClick={() => {
              if (notification.onClose) notification.onClose();
              setNotification(null);
            }}
          >
            <div className="card" style={{ maxWidth: 350, width: "100%", textAlign: "center", animation: "fadeIn 0.2s" }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>
                {notification.type === "success" ? "✅" : "⚠️"}
              </div>
              <p style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 600, color: "var(--text)" }}>
                {notification.message}
              </p>
              <button className="btn btnPrimary" onClick={() => {
                if (notification.onClose) notification.onClose();
                setNotification(null);
              }} style={{ width: "100%" }}>
                Entendido
              </button>
            </div>
          </div>
        )}

        {/* Modal de Confirmación Personalizado */}
        {confirmation && (
          <div
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0,0,0,0.5)", zIndex: 2000,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 20
            }}
            onClick={() => setConfirmation(null)}
          >
            <div className="card" style={{ maxWidth: 350, width: "100%", textAlign: "center", animation: "fadeIn 0.2s" }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>❓</div>
              <p style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 600, color: "var(--text)" }}>
                {confirmation.message}
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btnPrimary" onClick={() => { confirmation.onConfirm(); setConfirmation(null); }} style={{ flex: 1 }}>
                  Sí, confirmar
                </button>
                <button className="btn" onClick={() => setConfirmation(null)} style={{ flex: 1, background: "#fff", border: "1px solid var(--border)", color: "var(--text)" }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

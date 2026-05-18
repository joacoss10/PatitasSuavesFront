import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { obtenerPerros, registrarPerro, eliminarPerro, obtenerDatosCliente, modificarDatosCliente, obtenerTurnosCliente, cancelarTurno } from "../API/Service/Perros";

const MAX_OBSERVACIONES = 200;

export default function MisPerros() {
  const nav = useNavigate();
  const location = useLocation();
  const [seccion, setSeccion] = useState("perfil");
  const [perros, setPerros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [notification, setNotification] = useState(null);

  // Estado del formulario
  const [nombre, setNombre] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [tamanio, setTamanio] = useState("Mediano");
  const [loadingForm, setLoadingForm] = useState(false);
  const [errorForm, setErrorForm] = useState("");
  const [successForm, setSuccessForm] = useState("");

  // Estado para Perfil
  const [perfilData, setPerfilData] = useState({ nombre: "", telefono: "", mail: "" });
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [editingPerfil, setEditingPerfil] = useState(false);

  // Estado para Turnos
  const [tabTurnos, setTabTurnos] = useState("proximos"); // proximos, pendientes, historial
  const [listaTurnos, setListaTurnos] = useState([]);
  const [loadingTurnos, setLoadingTurnos] = useState(false);

  // Detectar navegación desde el menú
  useEffect(() => {
    if (location.state?.section) {
      setSeccion(location.state.section);
    }
    if (location.state?.openForm) {
      setMostrarFormulario(true);
    }
  }, [location]);

  // Obtener perros al cargar el componente
  useEffect(() => {
    if (seccion === "perros") {
      cargarPerros();
    }
  }, [seccion]);

  useEffect(() => {
    if (seccion === "turnos") {
      cargarTurnos();
    }
  }, [seccion, tabTurnos]);

  // Cargar datos del perfil cuando se entra a la sección
  useEffect(() => {
    if (seccion === "perfil") {
      cargarPerfil();
    }
  }, [seccion]);

  async function cargarPerfil() {
    try {
      setLoadingPerfil(true);
      const data = await obtenerDatosCliente();
      if (data && data.error) throw new Error(data.error);
      setPerfilData({
        nombre: data.nombre || "",
        telefono: data.telefono ? String(data.telefono) : "",
        mail: data.mail || ""
      });
    } catch (err) {
      console.error("Error al cargar perfil:", err);
      setNotification({ message: "Error al cargar perfil: " + err.message, type: "error" });
    } finally {
      setLoadingPerfil(false);
    }
  }

  async function guardarPerfil() {
    try {
      if (perfilData.telefono.length !== 10) {
        setNotification({ message: "El teléfono debe tener 10 números.", type: "error" });
        return;
      }

      const response = await modificarDatosCliente({
        ...perfilData
      });
      if (response && response.error) throw new Error(response.error);
      setEditingPerfil(false);
      setNotification({ message: "Datos actualizados correctamente", type: "success" });
    } catch (err) {
      setNotification({ message: "Error al actualizar datos: " + err.message, type: "error" });
    }
  }

  async function cargarPerros() {
    try {
      setLoading(true);
      setError("");
      const response = await obtenerPerros();
      if (response && response.error) throw new Error(response.error);
      // El backend devuelve directamente un array de perros
      setPerros(Array.isArray(response) ? response : response.perros || []);
    } catch (err) {
      setError(err.message || "Error al cargar los perros");
    } finally {
      setLoading(false);
    }
  }

  async function cargarTurnos() {
    setLoadingTurnos(true);
    setListaTurnos([]);
    try {
      const token = localStorage.getItem("demo_token");
      if (!token) {
        setLoadingTurnos(false);
        return;
      }

      let resultados = [];

      if (tabTurnos === "proximos") {
        const data = await obtenerTurnosCliente("Confirmado");
        if (data && data.error) throw new Error(data.error);
        if (Array.isArray(data)) resultados = data;
      } else if (tabTurnos === "pendientes") {
        const data = await obtenerTurnosCliente("AConfirmar");
        if (data && data.error) throw new Error(data.error);
        if (Array.isArray(data)) resultados = data;
      } else if (tabTurnos === "historial") {
        const [cancelados, rechazados, realizados] = await Promise.all([
          obtenerTurnosCliente("Cancelado"),
          obtenerTurnosCliente("Rechazado"),
          obtenerTurnosCliente("Realizado")
        ]);
        
        if (cancelados && cancelados.error) throw new Error(cancelados.error);
        if (rechazados && rechazados.error) throw new Error(rechazados.error);
        if (realizados && realizados.error) throw new Error(realizados.error);

        const listaCancelados = Array.isArray(cancelados) ? cancelados : [];
        const listaRechazados = Array.isArray(rechazados) ? rechazados : [];
        const listaRealizados = Array.isArray(realizados) ? realizados : [];
        resultados = [...listaCancelados, ...listaRechazados, ...listaRealizados];
      }
      
      // Ordenar resultados
      resultados.sort((a, b) => {
        const fechaA = new Date(`${a.fecha}T${a.hora}`);
        const fechaB = new Date(`${b.fecha}T${b.hora}`);
        return tabTurnos === "historial" ? fechaB - fechaA : fechaA - fechaB;
      });

      setListaTurnos(resultados);
    } catch (err) {
      console.error("Error al cargar turnos:", err);
      setNotification({ message: "Error al cargar turnos: " + err.message, type: "error" });
    } finally {
      setLoadingTurnos(false);
    }
  }

  async function submitFormulario(e) {
    e.preventDefault();
    setErrorForm("");
    setSuccessForm("");

    if (!nombre.trim()) {
      setErrorForm("El nombre del perro es obligatorio.");
      return;
    }

    if (nombre.trim().length > 50) {
      setErrorForm("El nombre no puede exceder 50 caracteres.");
      return;
    }

    if (observaciones.trim().length > MAX_OBSERVACIONES) {
      setErrorForm(`Las observaciones no pueden exceder ${MAX_OBSERVACIONES} caracteres.`);
      return;
    }

    try {
      setLoadingForm(true);
      // Obtener token del usuario desde localStorage
      const token = localStorage.getItem("demo_token");

      if (!token) {
        setErrorForm("Sesión no válida. Por favor inicia sesión nuevamente.");
        return;
      }

      const response = await registrarPerro({
        nombre: nombre.trim(),
        observaciones: observaciones.trim(),
        tamanioPerro: tamanio,
      });

      if (response.error) {
        setErrorForm(response.error);
        setLoadingForm(false);
        return;
      }

      setSuccessForm("Perro registrado exitosamente.");
      
      // Recargar perros inmediatamente para mostrar el nuevo registro
      try {
        await cargarPerros();
      } catch (err) {
        console.error("Error al cargar perros:", err);
      }
      
      // Chequear si venimos del flujo de pedir turno
      const pendingTurno = localStorage.getItem("turno_pending");

      // Limpiar formulario y cerrarlo después de 1.5 segundos
      setTimeout(() => {
        setNombre("");
        setObservaciones("");
        setTamanio("Mediano");
        setErrorForm("");
        setSuccessForm("");
        setMostrarFormulario(false);
        setLoadingForm(false);

        // Si hay un turno pendiente, volver a la página de turnos
        if (pendingTurno) {
          nav("/turnos");
        }
      }, 1500);
    } catch (err) {
      setErrorForm(err.message || "Error al registrar el perro.");
    } finally {
      setLoadingForm(false);
    }
  }

  // Componente de tarjeta de perro
  const TarjetaPerro = ({ perro }) => {
    const [expandido, setExpandido] = useState(false);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [eliminando, setEliminando] = useState(false);
    const observacionesCortadas = perro.observaciones?.length > 100;
    const observacionesAMostrar = expandido
      ? perro.observaciones
      : perro.observaciones?.substring(0, 100) + (observacionesCortadas ? "..." : "");

    async function confirmarEliminar() {
      try {
        setEliminando(true);
        const response = await eliminarPerro(perro.id);
        if (response && response.error) throw new Error(response.error);
        setMostrarConfirmacion(false);
        // Recargar perros después de eliminar
        await cargarPerros();
      } catch (err) {
        setNotification({ message: "Error al eliminar perro: " + err.message, type: "error" });
      } finally {
        setEliminando(false);
      }
    }

    return (
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: 14,
          display: "grid",
          gap: 10,
          backgroundColor: "#fafafa",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16 }}>{perro.nombre}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              Tamaño: {perro.tamanioPerro}
            </div>
          </div>
          {!mostrarConfirmacion && (
            <button
              onClick={() => setMostrarConfirmacion(true)}
              style={{
                background: "#fff1f1",
                border: "1px solid #ffc9c9",
                color: "#b42323",
                padding: "6px 10px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 12,
                whiteSpace: "nowrap",
              }}
            >
              🗑️ Eliminar
            </button>
          )}
        </div>

        {mostrarConfirmacion && (
          <div
            style={{
              padding: 10,
              borderRadius: 12,
              border: "1px solid #ffc9c9",
              background: "#fff1f1",
              display: "grid",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "#b42323" }}>
              ¿Estás seguro de que queres eliminar a {perro.nombre}?
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={confirmarEliminar}
                disabled={eliminando}
                style={{
                  flex: 1,
                  background: "#b42323",
                  color: "#fff",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                {eliminando ? "Eliminando..." : "Sí, eliminar"}
              </button>
              <button
                onClick={() => setMostrarConfirmacion(false)}
                disabled={eliminando}
                style={{
                  flex: 1,
                  background: "#fff",
                  color: "#666",
                  border: "1px solid #e8e8e8",
                  padding: "8px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {perro.observaciones && (
          <div style={{ fontSize: 13, color: "#555", lineHeight: 1.4 }}>
            {observacionesAMostrar}
            {observacionesCortadas && (
              <button
                onClick={() => setExpandido(!expandido)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--brand)",
                  cursor: "pointer",
                  fontWeight: 600,
                  padding: 0,
                  marginLeft: 4,
                }}
              >
                {expandido ? "Ver menos" : "Ver más"}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const TarjetaTurno = ({ turno }) => {
    const mostrarPrecio = turno.estado !== "Cancelado" && turno.estado !== "Rechazado" && turno.precio;
    const permiteCancelar = turno.estado === "Confirmado" || turno.estado === "AConfirmar";
    const [confirmarCancelacion, setConfirmarCancelacion] = useState(false);
    const [cancelando, setCancelando] = useState(false);
    
    const getEstadoColor = (estado) => {
      switch(estado) {
        case "Confirmado": return "#2f9e44"; // Verde
        case "AConfirmar": return "#f59f00"; // Naranja
        case "Cancelado": 
        case "Rechazado": return "#e03131"; // Rojo
        default: return "#666";
      }
    };

    const formatearFecha = (fecha) => {
      if (!fecha) return "";
      const [anio, mes, dia] = fecha.split("-");
      return `${dia}/${mes}/${anio}`;
    };

    async function handleCancelar() {
      try {
        setCancelando(true);
        const response = await cancelarTurno(turno.Id || turno.id);
        if (response.error) {
          setNotification({ message: response.error, type: "error" });
          return;
        }
        
        setNotification({ message: "Turno cancelado correctamente.", type: "success" });
        cargarTurnos(); // Recargar la lista si se canceló o no existía
      } catch (err) {
        setNotification({ message: "Error al cancelar: " + err.message, type: "error" });
      } finally {
        setCancelando(false);
        setConfirmarCancelacion(false);
      }
    }

    return (
      <div style={{ 
        border: "1px solid var(--border)", 
        borderRadius: 14, 
        padding: 16, 
        background: "#fafafa", 
        display: "grid", 
        gap: 10 
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            📅 {formatearFecha(turno.fecha)} <span style={{ margin: "0 6px", color: "#ccc" }}>|</span> ⏰ {turno.hora} hs
          </div>
          <div style={{ 
            fontSize: 11, 
            padding: "4px 8px", 
            borderRadius: 6, 
            background: getEstadoColor(turno.estado), 
            color: "#fff",
            fontWeight: 600,
            textTransform: "uppercase"
          }}>
            {turno.estado === "AConfirmar" ? "A Confirmar" : turno.estado}
          </div>
        </div>
        
        <div style={{ borderTop: "1px solid #eee", paddingTop: 10, display: "grid", gap: 6 }}>
          {(turno.items || []).map((item, i) => (
            <div key={i} style={{ fontSize: 14 }}>
              🐶 <strong>{item.perro}</strong>: {item.servicio}
            </div>
          ))}
        </div>

        {mostrarPrecio && (
          <div style={{ textAlign: "right", fontWeight: 900, color: "#2f9e44", fontSize: 16 }}>
            ${turno.precio.toLocaleString("es-AR")}
          </div>
        )}

        {permiteCancelar && (
          <div style={{ marginTop: 6, paddingTop: 10, borderTop: "1px solid #eee" }}>
            {!confirmarCancelacion ? (
              <button 
                onClick={() => setConfirmarCancelacion(true)}
                style={{ color: "#e03131", background: "none", border: "none", cursor: "pointer", fontSize: 13, textDecoration: "underline", padding: 0 }}
              >
                Cancelar turno
              </button>
            ) : (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#e03131", fontWeight: 600 }}>¿Cancelar este turno?</span>
                <button 
                  onClick={handleCancelar}
                  disabled={cancelando}
                  style={{ background: "#e03131", color: "white", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}
                >
                  {cancelando ? "..." : "Sí, cancelar"}
                </button>
                <button 
                  onClick={() => setConfirmarCancelacion(false)}
                  style={{ background: "#eee", color: "#333", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}
                >
                  No
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gap: 14 }}>
      
      {seccion === "perfil" && (
        <div className="card">
          <h2 style={{ margin: "0 0 14px 0" }}>Mi Perfil 👤</h2>
          
          <div style={{ marginBottom: 20, padding: 14, background: "#f8f9fa", borderRadius: 10, border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Mis Datos</h3>
              {!editingPerfil ? (
                <button onClick={() => setEditingPerfil(true)} style={{ background: "none", border: "none", color: "var(--brand)", cursor: "pointer", fontWeight: 600 }}>
                  ✏️ Editar
                </button>
              ) : (
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={guardarPerfil} style={{ background: "var(--brand)", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 6, cursor: "pointer" }}>Guardar</button>
                  <button onClick={() => { setEditingPerfil(false); cargarPerfil(); }} style={{ background: "#fff", color: "#d32f2f", border: "1px solid #d32f2f", padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>Cancelar</button>
                </div>
              )}
            </div>
            
            {loadingPerfil ? (
              <p style={{ color: "var(--muted)" }}>Cargando datos...</p>
            ) : (
              <div style={{ display: "grid", gap: 10, fontSize: 14 }}>
                <div style={{ display: "grid", gap: 4 }}>
                  <strong>Nombre:</strong>
                  {editingPerfil ? (
                    <input 
                      value={perfilData.nombre} 
                      onChange={e => setPerfilData({...perfilData, nombre: e.target.value})}
                      style={{ padding: 6, borderRadius: 6, border: "1px solid #ccc" }}
                    />
                  ) : (
                    <span>{perfilData.nombre || "-"}</span>
                  )}
                </div>
                <div style={{ display: "grid", gap: 4 }}>
                  <strong>Teléfono:</strong>
                  {editingPerfil ? (
                    <input 
                      value={perfilData.telefono} 
                      onChange={e => {
                        const val = e.target.value;
                        if (/^\d*$/.test(val)) setPerfilData({...perfilData, telefono: val});
                      }}
                      style={{ padding: 6, borderRadius: 6, border: "1px solid #ccc" }}
                    />
                  ) : (
                    <span>{perfilData.telefono || "-"}</span>
                  )}
                </div>
                <div style={{ display: "grid", gap: 4 }}>
                  <strong>Email:</strong>
                  <span style={{ color: "var(--muted)" }}>{perfilData.mail}</span>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {seccion === "turnos" && (
        <>
          <button onClick={() => setSeccion("perfil")} style={{ justifySelf: "start", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--muted)" }}>
            ← Volver a mi perfil
          </button>
          <div className="card">
            <h2 style={{ margin: "0 0 6px 0" }}>Mis Turnos 📅</h2>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              Gestioná tus próximas visitas y revisá tu historial.
            </p>
            
            {/* Tabs de navegación */}
            <div style={{ display: "flex", gap: 10, marginTop: 16, borderBottom: "1px solid var(--border)", paddingBottom: 10, overflowX: "auto" }}>
              <button 
                onClick={() => setTabTurnos("proximos")}
                style={{ 
                  background: tabTurnos === "proximos" ? "var(--brand)" : "transparent",
                  color: tabTurnos === "proximos" ? "#fff" : "var(--text)",
                  border: "none", padding: "8px 14px", borderRadius: 20, cursor: "pointer", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap"
                }}
              >
                Próximos
              </button>
              <button 
                onClick={() => setTabTurnos("pendientes")}
                style={{ 
                  background: tabTurnos === "pendientes" ? "var(--brand)" : "transparent",
                  color: tabTurnos === "pendientes" ? "#fff" : "var(--text)",
                  border: "none", padding: "8px 14px", borderRadius: 20, cursor: "pointer", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap"
                }}
              >
                A Confirmar
              </button>
              <button 
                onClick={() => setTabTurnos("historial")}
                style={{ 
                  background: tabTurnos === "historial" ? "var(--brand)" : "transparent",
                  color: tabTurnos === "historial" ? "#fff" : "var(--text)",
                  border: "none", padding: "8px 14px", borderRadius: 20, cursor: "pointer", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap"
                }}
              >
                Historial (Cancelados/Rechazados)
              </button>
            </div>

            {/* Lista de turnos */}
            <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
              {loadingTurnos ? (
                <p style={{ color: "var(--muted)", textAlign: "center" }}>Cargando turnos...</p>
              ) : listaTurnos.length > 0 ? (
                listaTurnos.map((turno, idx) => (
                  <TarjetaTurno key={turno.Id || turno.id || idx} turno={turno} />
                ))
              ) : (
                <div style={{ padding: 30, textAlign: "center", border: "1px dashed var(--border)", borderRadius: 10, color: "var(--muted)" }}>
                  No hay turnos en esta sección.
                </div>
              )}
            </div>

          </div>
        </>
      )}

      {seccion === "perros" && (
        <>
          <button onClick={() => setSeccion("perfil")} style={{ justifySelf: "start", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--muted)" }}>
            ← Volver a mi perfil
          </button>

      {/* Header */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <h2 style={{ margin: "0 0 6px 0" }}>Mis Perros 🐾</h2>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              {loading ? "Actualizando listado..." : (perros.length === 0
                ? "Todavía no hay perros registrados."
                : `Tenes ${perros.length} perro${perros.length !== 1 ? "s" : ""} registrado${perros.length !== 1 ? "s" : ""}`)}
            </p>
          </div>
          <button
            className="btn btnPrimary"
            onClick={() => {
              if (mostrarFormulario && location.state?.openForm) {
                nav("/turnos");
              } else {
                setMostrarFormulario(!mostrarFormulario);
              }
            }}
            style={{ whiteSpace: "nowrap" }}
          >
            {mostrarFormulario ? "Cancelar" : "+ Agregar perro"}
          </button>
        </div>
      </div>

      {/* Formulario de registro */}
      {mostrarFormulario && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Registrar nuevo perro</h3>

          <form onSubmit={submitFormulario} style={{ display: "grid", gap: 12 }}>
            {/* Nombre */}
            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontWeight: 800, fontSize: 14 }}>Nombre del perro</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => {
                  if (e.target.value.length <= 50) {
                    setNombre(e.target.value);
                    setErrorForm("");
                  }
                }}
                placeholder="Ej: Carlitos"
                required
                style={{
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: errorForm.includes("nombre") ? "1px solid #ff6b6b" : "1px solid var(--border)",
                  outline: "none",
                }}
              />
              <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "right" }}>
                {nombre.length}/50
              </div>
            </div>

            {/* Tamaño */}
            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontWeight: 800, fontSize: 14 }}>Tamaño</label>
              <select
                value={tamanio}
                onChange={(e) => setTamanio(e.target.value)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  outline: "none",
                  fontSize: 14,
                }}
              >
                <option value="Chico">Chico</option>
                <option value="Mediano">Mediano</option>
                <option value="Grande">Grande</option>
              </select>
            </div>

            {/* Observaciones */}
            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontWeight: 800, fontSize: 14 }}>Observaciones</label>
              <textarea
                value={observaciones}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_OBSERVACIONES) {
                    setObservaciones(e.target.value);
                    setErrorForm("");
                  }
                }}
                placeholder="Ej: Se porta bien, le gusta jugar con otros perros y es muy amigable."
                style={{
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: errorForm.includes("observaciones") ? "1px solid #ff6b6b" : "1px solid var(--border)",
                  outline: "none",
                  resize: "vertical",
                  minHeight: 80,
                  fontFamily: "inherit",
                }}
              />
              <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "right" }}>
                {observaciones.length}/{MAX_OBSERVACIONES}
              </div>
            </div>

            {/* Error */}
            {errorForm && (
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
                {errorForm}
              </div>
            )}

            {/* Success */}
            {successForm && (
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
                {successForm}
              </div>
            )}

            <button
              className="btn btnPrimary"
              type="submit"
              disabled={loadingForm}
            >
              {loadingForm ? "Registrando..." : "Registrar perro"}
            </button>
          </form>
        </div>
      )}

      {/* Error general */}
      {error && (
        <div className="card" style={{ border: "1px solid #ffc9c9", background: "#fff1f1" }}>
          <p style={{ color: "#b42323", fontWeight: 700, margin: 0 }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="card">
          <p style={{ textAlign: "center", color: "var(--muted)" }}>Cargando perros...</p>
        </div>
      ) : (
        <>
      {/* Galería de perros */}
      {perros.length > 0 ? (
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
          {perros.map((perro, idx) => (
            <TarjetaPerro key={idx} perro={perro} />
          ))}
        </div>
      ) : !mostrarFormulario ? (
        <div className="card" style={{ textAlign: "center", padding: 20 }}>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            Todavía no tenes perros registrados. ¡Agrega uno para comenzar!
          </p>
        </div>
      ) : null}
            </>
          )}
        </>
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
          onClick={() => setNotification(null)}
        >
          <div className="card" style={{ maxWidth: 350, width: "100%", textAlign: "center", animation: "fadeIn 0.2s" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>
              {notification.type === "success" ? "✅" : "⚠️"}
            </div>
            <p style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 600, color: "var(--text)" }}>
              {notification.message}
            </p>
            <button className="btn btnPrimary" onClick={() => setNotification(null)} style={{ width: "100%" }}>
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

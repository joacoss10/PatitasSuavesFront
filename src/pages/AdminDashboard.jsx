import { useState, useEffect } from "react";
import { obtenerServicios, crearNuevoServicio, editarPrecioServicio, toggleServicioDisponible, obtenerEstadoDias, editarEstadoDia, obtenerRangosDia, crearDisponibilidad, borrarRango, obtenerTurnosPendientes, obtenerTurnosConfirmados, confirmarTurno, rechazarTurno, subirImagenGaleria } from "../API/Service/Admin";

export default function AdminDashboard() {
  const [seccionActiva, setSeccionActiva] = useState("proximos-turnos");
  const [servicios, setServicios] = useState([]);
  const [precioEdicion, setPrecioEdicion] = useState({});
  const [loadingServicios, setLoadingServicios] = useState(true);
  const [errorServicios, setErrorServicios] = useState("");
  const [notification, setNotification] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  
  // Estado para formulario de nuevo servicio
  const [mostrarFormularioNuevo, setMostrarFormularioNuevo] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [precioNuevo, setPrecioNuevo] = useState("");
  const [loadingForm, setLoadingForm] = useState(false);
  const [errorForm, setErrorForm] = useState("");
  const [successForm, setSuccessForm] = useState("");
  
  // Estado para disponibilidad por días de la semana
  const [disponibilidadDias, setDisponibilidadDias] = useState({});
  const [diasIds, setDiasIds] = useState({}); // Mapea nombre dia -> id
  const [loadingDias, setLoadingDias] = useState(true);
  const [errorDias, setErrorDias] = useState("");
    // Cargar estado de días al montar
    useEffect(() => {
      cargarEstadoDias();
    }, []);

    async function cargarEstadoDias() {
      setLoadingDias(true);
      setErrorDias("");
      try {
        // Cargar estados y rangos en paralelo
        const [estadosResponse, rangosResponse] = await Promise.all([obtenerEstadoDias(), obtenerRangosDia()]);
        
        // Mapear a estructura { lunes: { habilitado, id }, ... }
        const mapNombre = {
          Lunes: "lunes",
          Martes: "martes",
          Miercoles: "miercoles",
          Miércoles: "miercoles",
          Jueves: "jueves",
          Viernes: "viernes",
          Sabado: "sabado",
          Sábado: "sabado",
          Domingo: "domingo",
        };
        const dias = {};
        const ids = {};
        
        // Procesar Estados
        (Array.isArray(estadosResponse) ? estadosResponse : []).forEach((d) => {
          const key = mapNombre[d.dia?.trim()] || d.dia?.toLowerCase();
          if (key) {
            dias[key] = { habilitado: !!d.estado, rangos: [], id: d.id };
            ids[key] = d.id;
          }
        });

        // Procesar Rangos
        (Array.isArray(rangosResponse) ? rangosResponse : []).forEach((r) => {
          // El objeto 'dia' puede venir como string o como objeto {nombre: "Lunes", ...}
          const nombreDia = r.dia?.nombre || r.dia || "";
          const key = mapNombre[nombreDia.toString().trim()] || nombreDia.toString().toLowerCase();
          
          if (dias[key]) {
            dias[key].rangos.push({
              id: r.id,
              inicio: r.horaInicio ? r.horaInicio.substring(0, 5) : "09:00", // Recortar segundos si vienen
              fin: r.horaFin ? r.horaFin.substring(0, 5) : "18:00",
              turnos: r.turnosGenerados || []
            });
          }
        });

        setDisponibilidadDias(dias);
        setDiasIds(ids);
      } catch (err) {
        setErrorDias(err.message || "Error al cargar días");
      } finally {
        setLoadingDias(false);
      }
    }

  const [addingRango, setAddingRango] = useState(null); // Guarda el nombre del día que se está editando (ej: "lunes")
  const [newRangoTimes, setNewRangoTimes] = useState({ inicio: "09:00", fin: "13:00" });

  async function guardarNuevoRango(idDia) {
    try {
      const response = await crearDisponibilidad(idDia, {
        horaInicio: newRangoTimes.inicio,
        horaFin: newRangoTimes.fin
      });

      if (response.error) {
        setNotification({ message: "Error al crear rango: " + response.error, type: "error" });
        return;
      }

      setAddingRango(null);
      await cargarEstadoDias(); // Recargar para ver los cambios y los turnos generados
    } catch (err) {
      setNotification({ message: "Error al crear rango: " + err.message, type: "error" });
    }
  }

  function eliminarRango(idRango) {
    setConfirmation({
      message: "¿Estás seguro de eliminar este rango horario?",
      onConfirm: async () => {
        try {
          await borrarRango(idRango);
          await cargarEstadoDias();
        } catch (err) {
          setNotification({ message: "Error al eliminar rango: " + err.message, type: "error" });
        }
      }
    });
  }

  const [togglingServicioId, setTogglingServicioId] = useState(null);

  // Cargar servicios del backend
  useEffect(() => {
    cargarServicios();
  }, []);

  async function cargarServicios() {
    try {
      setLoadingServicios(true);
      setErrorServicios("");
      const response = await obtenerServicios();
      
      // Intentar extraer los servicios de varias formas posibles
      let serviciosData = [];
      if (Array.isArray(response)) {
        serviciosData = response;
      } else if (response?.servicios && Array.isArray(response.servicios)) {
        serviciosData = response.servicios;
      } else if (response?.data && Array.isArray(response.data)) {
        serviciosData = response.data;
      } else if (typeof response === 'object') {
        // Si es un objeto, intentar obtener la primera propiedad que sea un array
        const firstArray = Object.values(response).find(val => Array.isArray(val));
        if (firstArray) {
          serviciosData = firstArray;
        }
      }
      
      setServicios(serviciosData);
    } catch (err) {
      setErrorServicios(err.message || "Error al cargar servicios");
    } finally {
      setLoadingServicios(false);
    }
  }

  async function toggleServicio(id) {
    try {
      setTogglingServicioId(id);
      const response = await toggleServicioDisponible(id);
      if (response && response.error) {
        throw new Error(response.error);
      }
      // Actualizar localmente el flag 'activo' sin recargar la lista
      setServicios((prev) => prev.map((s) => (s.id === id ? { ...s, activo: !s.activo } : s)));
    } catch (err) {
      setNotification({ message: "Error al cambiar disponibilidad: " + (err.message || err), type: "error" });
    } finally {
      setTogglingServicioId(null);
    }
  }

  async function submitNuevoServicio(e) {
    e.preventDefault();
    setErrorForm("");
    setSuccessForm("");

    if (!nombreNuevo.trim()) {
      setErrorForm("El nombre del servicio es obligatorio.");
      return;
    }

    if (!precioNuevo || Number(precioNuevo) <= 0) {
      setErrorForm("El precio debe ser mayor a 0.");
      return;
    }

    try {
      setLoadingForm(true);
      const response = await crearNuevoServicio({
        nombre: nombreNuevo.trim(),
        precio: Number(precioNuevo),
      });

      if (response.error) {
        setErrorForm(response.error);
        return;
      }

      setSuccessForm("Servicio creado exitosamente.");
      
      // Limpiar formulario
      setNombreNuevo("");
      setPrecioNuevo("");
      
      // Recargar servicios
      await cargarServicios();
      
      // Cerrar formulario después de 1.5 segundos
      setTimeout(() => {
        setMostrarFormularioNuevo(false);
        setSuccessForm("");
      }, 1500);
    } catch (err) {
      setErrorForm(err.message || "Error al crear el servicio.");
    } finally {
      setLoadingForm(false);
    }
  }

  // Estado para Turnos Pendientes (Backend)
  const [turnosPendientes, setTurnosPendientes] = useState([]);
  const [loadingTurnos, setLoadingTurnos] = useState(false);
  const [errorTurnos, setErrorTurnos] = useState("");

  useEffect(() => {
    if (seccionActiva === "turnos-pendientes") {
      cargarTurnosPendientes();
    }
  }, [seccionActiva]);

  async function cargarTurnosPendientes() {
    setLoadingTurnos(true);
    setErrorTurnos("");
    try {
      const data = await obtenerTurnosPendientes();
      if (data && data.error) throw new Error(data.error);
      setTurnosPendientes(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorTurnos(err.message);
    } finally {
      setLoadingTurnos(false);
    }
  }

  // Estado para Turnos Confirmados (Próximos)
  const [proximosTurnos, setProximosTurnos] = useState([]);
  const [loadingProximos, setLoadingProximos] = useState(false);
  const [errorProximos, setErrorProximos] = useState("");

  useEffect(() => {
    if (seccionActiva === "proximos-turnos") {
      cargarProximosTurnos();
    }
  }, [seccionActiva]);

  async function cargarProximosTurnos() {
    setLoadingProximos(true);
    setErrorProximos("");
    try {
      const data = await obtenerTurnosConfirmados();
      if (data && data.error) throw new Error(data.error);
      setProximosTurnos(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorProximos(err.message);
    } finally {
      setLoadingProximos(false);
    }
  }

  // Estado para Galería
  const [nombrePerroGaleria, setNombrePerroGaleria] = useState("");
  const [servicioGaleria, setServicioGaleria] = useState("");
  const [comentariosGaleria, setComentariosGaleria] = useState("");
  const [imagenGaleria, setImagenGaleria] = useState(null);
  const [loadingGaleria, setLoadingGaleria] = useState(false);
  const [errorGaleria, setErrorGaleria] = useState("");
  const [successGaleria, setSuccessGaleria] = useState("");

  // Validar tamaño máximo de archivo (5MB)
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > MAX_IMAGE_SIZE) {
        setErrorGaleria(`Imagen muy pesada. El tamaño máximo permitido es de ${(MAX_IMAGE_SIZE / (1024 * 1024)).toFixed(0)}MB. Selecciona una imagen más pequeña.`);
        setImagenGaleria(null);
        e.target.value = ""; // Limpiar el input
      } else {
        setErrorGaleria("");
        setImagenGaleria(file);
      }
    }
  };

  async function submitGaleria(e) {
    e.preventDefault();
    setErrorGaleria("");
    setSuccessGaleria("");

    if (!nombrePerroGaleria.trim() || !servicioGaleria.trim() || !imagenGaleria) {
      setErrorGaleria("Por favor completá los campos obligatorios.");
      return;
    }

    try {
      setLoadingGaleria(true);
      const formData = new FormData();
      formData.append("nombrePerro", nombrePerroGaleria);
      formData.append("servicioRealizado", servicioGaleria);
      formData.append("comentarios", comentariosGaleria || "");
      formData.append("foto", imagenGaleria);

      const response = await subirImagenGaleria(formData);

      if (response && response.error) {
        throw new Error(response.error);
      }

      setSuccessGaleria("Imagen subida correctamente.");
      setNombrePerroGaleria("");
      setServicioGaleria("");
      setComentariosGaleria("");
      setImagenGaleria(null);
    } catch (err) {
      setErrorGaleria(err.message);
    } finally {
      setLoadingGaleria(false);
    }
  }

  // Acciones de botones
  function handleConfirmarTurno(id) {
    setConfirmation({
      message: "¿Estás seguro de que deseas confirmar este turno?",
      onConfirm: async () => {
        try {
          const response = await confirmarTurno(id);
          if (response && response.error) {
            throw new Error(response.error);
          }
          setNotification({ message: "Turno confirmado exitosamente", type: "success" });
          cargarTurnosPendientes();
        } catch (err) {
          setNotification({ message: "Error al confirmar turno: " + err.message, type: "error" });
        }
      }
    });
  }

  function handleRechazarTurno(id) {
    setConfirmation({
      message: "¿Estás seguro de que deseas rechazar este turno?",
      onConfirm: async () => {
        try {
          const response = await rechazarTurno(id);
          if (response && response.error) {
            throw new Error(response.error);
          }
          setNotification({ message: "Turno rechazado", type: "success" });
          cargarTurnosPendientes();
        } catch (err) {
          setNotification({ message: "Error al rechazar turno: " + err.message, type: "error" });
        }
      }
    });
  }

  const guardarPrecio = async (id, nuevoPrecio) => {
    if (!nuevoPrecio || Number(nuevoPrecio) <= 0) {
      setNotification({ message: "El precio debe ser mayor a 0.", type: "error" });
      return;
    }
    
    try {
      const resp = await editarPrecioServicio({
        idServicio: id,
        precio: Number(nuevoPrecio),
      });
      if (resp && resp.error) {
        throw new Error(resp.error);
      }
      // Actualizar solo el servicio en el estado local (mantener orden)
      setServicios((prev) => prev.map((s) => (s.id === id ? { ...s, precio: Number(nuevoPrecio) } : s)));
      setPrecioEdicion((prev) => ({ ...prev, [id]: false }));
    } catch (err) {
      setNotification({ message: "Error al guardar el precio: " + err.message, type: "error" });
    }
  };

  const TarjetaTurno = ({ turno, esPendiente }) => {
    const [expandido, setExpandido] = useState(false);

    // Usamos la estructura del backend (DTO) para ambos casos
    const items = (turno.item && turno.item.length > 0) ? turno.item : [{ nombrePerro: turno.perro, servicio: turno.servicio }];
    const clienteNombre = turno.nombreCliente || turno.cliente || "Cliente";
    const clienteCelular = turno.celularCliente;
    
    let fecha = turno.dia || turno.fecha;
    // Si la fecha viene como YYYY-MM-DD, la convertimos a DD/MM/YYYY
    if (fecha && typeof fecha === "string" && fecha.includes("-")) {
      const [anio, mes, dia] = fecha.split("-");
      if (anio.length === 4) fecha = `${dia}/${mes}/${anio}`;
    }

    const hora = turno.hora;
    const total = turno.total;

    return (
      <div
        onClick={() => setExpandido(!expandido)}
        style={{
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: 16,
          display: "grid",
          gap: 10,
          backgroundColor: "#fafafa",
          transition: "all 0.2s ease",
          cursor: "pointer",
          boxShadow: expandido ? "0 4px 12px rgba(0,0,0,0.1)" : "none"
        }}
      >
        <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, color: "black" }}> {clienteNombre}</div>
            {clienteCelular && (
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>📱 {clienteCelular}</div>
            )}
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>
              📅 {fecha} - ⏰ {hora} hs
            </div>
          </div>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            {expandido ? "🔼" : "🔽"}
          </span>
        </div>

        <div style={{ borderTop: "1px solid #eee", paddingTop: 8, display: "grid", gap: 8 }}>
          {items.map((it, idx) => (
            <div key={idx} style={{ fontSize: 14 }}>
              <div>
                🐶 <strong>{it.nombrePerro}</strong> {it.tamanio ? `(${it.tamanio})` : ""}: {it.servicio}
              </div>
              {expandido && it.notas && (
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2, fontStyle: "italic", paddingLeft: 10, borderLeft: "2px solid #eee" }}>
                  📝 Nota: {it.notas}
                </div>
              )}
            </div>
          ))}
        </div>

        {expandido && total !== undefined && (
          <div style={{ textAlign: "right", fontWeight: 900, fontSize: 16, color: "#2f9e44", marginTop: 4 }}>
            Total: ${total.toLocaleString("es-AR")}
          </div>
        )}

        {esPendiente && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => handleConfirmarTurno(turno.id)}
              style={{
                background: "var(--brand)",
                color: "#fff",
                border: "none",
                padding: "8px 12px",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              ✓ Confirmar
            </button>
            <button
              onClick={() => handleRechazarTurno(turno.id)}
              style={{
                background: "#fff1f1",
                color: "#b42323",
                border: "1px solid #ffc9c9",
                padding: "8px 12px",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              ✗ Rechazar
            </button>
          </div>
        )}
      </div>
    );
  };

  // Lógica de ordenamiento para visualización
  const ordenSemana = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
  const diasOrdenados = Object.entries(disponibilidadDias).sort(([keyA, valA], [keyB, valB]) => {
    // 1. Si uno está habilitado y el otro no, el habilitado va primero
    if (valA.habilitado !== valB.habilitado) {
      return valA.habilitado ? -1 : 1;
    }
    // 2. Si tienen el mismo estado, ordenar por día de la semana
    return ordenSemana.indexOf(keyA) - ordenSemana.indexOf(keyB);
  });

  return (
    <div style={{ padding: "20px", display: "grid", gap: 20 }}>
      {/* Menu Horizontal */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 10,
          borderBottom: "1px solid var(--border)",
          padding: "0 0 14px 0",
          overflowX: "auto",
        }}
      >
        <button
          onClick={() => setSeccionActiva("turnos-pendientes")}
          style={{
            background: seccionActiva === "turnos-pendientes" ? "var(--brand)" : "transparent",
            color: seccionActiva === "turnos-pendientes" ? "#fff" : "var(--text)",
            border: "none",
            padding: "10px 16px",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            transition: "all 0.2s ease",
            whiteSpace: "nowrap",
          }}
        >
          📋 Turnos Pendientes
        </button>

        <button
          onClick={() => setSeccionActiva("proximos-turnos")}
          style={{
            background: seccionActiva === "proximos-turnos" ? "var(--brand)" : "transparent",
            color: seccionActiva === "proximos-turnos" ? "#fff" : "var(--text)",
            border: "none",
            padding: "10px 16px",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            transition: "all 0.2s ease",
            whiteSpace: "nowrap",
          }}
        >
          📅 Próximos Turnos
        </button>

        <button
          onClick={() => setSeccionActiva("servicios")}
          style={{
            background: seccionActiva === "servicios" ? "var(--brand)" : "transparent",
            color: seccionActiva === "servicios" ? "#fff" : "var(--text)",
            border: "none",
            padding: "10px 16px",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            transition: "all 0.2s ease",
            whiteSpace: "nowrap",
          }}
        >
          💼 Servicios
        </button>

        <button
          onClick={() => {
            setSeccionActiva("disponibilidad");
            cargarEstadoDias();
          }}
          style={{
            background: seccionActiva === "disponibilidad" ? "var(--brand)" : "transparent",
            color: seccionActiva === "disponibilidad" ? "#fff" : "var(--text)",
            border: "none",
            padding: "10px 16px",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            transition: "all 0.2s ease",
            whiteSpace: "nowrap",
          }}
        >
          🕐 Disponibilidad
        </button>

        <button
          onClick={() => setSeccionActiva("galeria")}
          style={{
            background: seccionActiva === "galeria" ? "var(--brand)" : "transparent",
            color: seccionActiva === "galeria" ? "#fff" : "var(--text)",
            border: "none",
            padding: "10px 16px",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            transition: "all 0.2s ease",
            whiteSpace: "nowrap",
          }}
        >
          📷 Galería
        </button>
      </div>

      {/* Contenido Principal */}
      <div>
        {seccionActiva === "turnos-pendientes" && (
          <div style={{ display: "grid", gap: 14 }}>
            <h2 style={{ margin: 0 }}>📋 Turnos Pendientes</h2>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
              {loadingTurnos ? (
                <p style={{ color: "var(--muted)" }}>Cargando turnos pendientes...</p>
              ) : errorTurnos ? (
                <p style={{ color: "#b42323" }}>{errorTurnos}</p>
              ) : turnosPendientes.length > 0 ? (
                turnosPendientes.map((turno) => <TarjetaTurno key={turno.id} turno={turno} esPendiente={true} />)
              ) : (
                <div className="card" style={{ textAlign: "center", gridColumn: "1 / -1" }}>
                  <p style={{ color: "var(--muted)", margin: 0 }}>No hay turnos pendientes</p>
                </div>
              )}
            </div>
          </div>
        )}

        {seccionActiva === "proximos-turnos" && (
          <div style={{ display: "grid", gap: 14 }}>
            <h2 style={{ margin: 0 }}>📅 Próximos Turnos</h2>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
              {loadingProximos ? (
                <p style={{ color: "var(--muted)" }}>Cargando próximos turnos...</p>
              ) : errorProximos ? (
                <p style={{ color: "#b42323" }}>{errorProximos}</p>
              ) : proximosTurnos.length > 0 ? (
                proximosTurnos.map((turno) => <TarjetaTurno key={turno.id} turno={turno} esPendiente={false} />)
              ) : (
                <div className="card" style={{ textAlign: "center", gridColumn: "1 / -1" }}>
                  <p style={{ color: "var(--muted)", margin: 0 }}>No hay próximos turnos</p>
                </div>
              )}
            </div>
          </div>
        )}

        {seccionActiva === "servicios" && (
          <div style={{ display: "grid", gap: 14, maxWidth: 600 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <h2 style={{ margin: 0 }}>💼 Servicios ({servicios.length})</h2>
              <button
                className="btn btnPrimary"
                onClick={() => setMostrarFormularioNuevo(!mostrarFormularioNuevo)}
                style={{ whiteSpace: "nowrap" }}
              >
                {mostrarFormularioNuevo ? "Cancelar" : "+ Nuevo servicio"}
              </button>
            </div>
            
            {errorServicios && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: "1px solid #ffc9c9",
                  background: "#fff1f1",
                  color: "#b42323",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {errorServicios}
              </div>
            )}

            {mostrarFormularioNuevo && (
              <div className="card">
                <h3 style={{ marginTop: 0 }}>Crear nuevo servicio</h3>

                <form onSubmit={submitNuevoServicio} style={{ display: "grid", gap: 12 }}>
                  {/* Nombre */}
                  <div style={{ display: "grid", gap: 6 }}>
                    <label style={{ fontWeight: 800, fontSize: 14 }}>Nombre del servicio</label>
                    <input
                      type="text"
                      value={nombreNuevo}
                      onChange={(e) => {
                        setNombreNuevo(e.target.value);
                        setErrorForm("");
                      }}
                      placeholder="Ej: Baño + Corte"
                      required
                      style={{
                        padding: "10px 12px",
                        borderRadius: 14,
                        border: errorForm.includes("nombre") ? "1px solid #ff6b6b" : "1px solid var(--border)",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Precio */}
                  <div style={{ display: "grid", gap: 6 }}>
                    <label style={{ fontWeight: 800, fontSize: 14 }}>Precio</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 18, fontWeight: 700 }}>$</span>
                      <input
                        type="number"
                        value={precioNuevo}
                        onChange={(e) => {
                          setPrecioNuevo(e.target.value);
                          setErrorForm("");
                        }}
                        placeholder="0.00"
                        required
                        min="0"
                        step="0.01"
                        style={{
                          flex: 1,
                          padding: "10px 12px",
                          borderRadius: 14,
                          border: errorForm.includes("precio") ? "1px solid #ff6b6b" : "1px solid var(--border)",
                          outline: "none",
                          fontSize: 14,
                        }}
                      />
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
                    {loadingForm ? "Creando..." : "Crear servicio"}
                  </button>
                </form>
              </div>
            )}

            {loadingServicios ? (
              <div className="card" style={{ textAlign: "center" }}>
                <p style={{ color: "var(--muted)", margin: 0 }}>Cargando servicios...</p>
              </div>
            ) : (
              <div className="card" style={{ display: "grid", gap: 16 }}>
                {servicios.length > 0 ? (
                  servicios.map((servicio) => (
                    <div key={servicio.id} style={{ display: "grid", gap: 10, padding: 12, border: "1px solid var(--border)", borderRadius: 10, background: "#fafafa" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <label style={{ fontWeight: 800, fontSize: 14 }}>{servicio.servicio}</label>
                        <button
                          onClick={() => toggleServicio(servicio.id)}
                          disabled={togglingServicioId === servicio.id}
                          style={{
                            background: servicio.activo === true ? "#d3f9d8" : "#f0f0f0",
                            color: servicio.activo === true ? "#2f9e44" : "#666",
                            border: servicio.activo === true ? "1px solid #d3f9d8" : "1px solid #e8e8e8",
                            padding: "6px 12px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            cursor: togglingServicioId === servicio.id ? "wait" : "pointer",
                          }}
                        >
                          {togglingServicioId === servicio.id ? "..." : (servicio.activo === true ? "🟢 Habilitado" : "🔴 Deshabilitado")}
                        </button>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {precioEdicion[servicio.id] ? (
                          <>
                            <input
                              type="number"
                              defaultValue={servicio.precio}
                              style={{
                                flex: 1,
                                padding: "10px 12px",
                                borderRadius: 10,
                                border: "1px solid var(--border)",
                                outline: "none",
                                fontSize: 14,
                              }}
                              onBlur={(e) => guardarPrecio(servicio.id, e.target.value)}
                              autoFocus
                            />
                            <button
                              onClick={(e) => guardarPrecio(servicio.id, e.target.previousSibling.value)}
                              style={{
                                background: "var(--brand)",
                                color: "#fff",
                                border: "none",
                                padding: "10px 16px",
                                borderRadius: 10,
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: 13,
                                whiteSpace: "nowrap",
                              }}
                            >
                              ✓ Guardar
                            </button>
                          </>
                        ) : (
                          <>
                            <div
                              style={{
                                flex: 1,
                                padding: "10px 12px",
                                borderRadius: 10,
                                border: "1px solid var(--border)",
                                background: "#fff",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              $
                              <span style={{ fontWeight: 700, fontSize: 16 }}>
                                {servicio.precio.toLocaleString("es-AR")}
                              </span>
                            </div>
                            <button
                              onClick={() => setPrecioEdicion({ ...precioEdicion, [servicio.id]: true })}
                              style={{
                                background: "#fff",
                                color: "var(--brand)",
                                border: "1px solid var(--border)",
                                padding: "10px 16px",
                                borderRadius: 10,
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: 13,
                              }}
                            >
                              ✏️ Editar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "var(--muted)", margin: 0, textAlign: "center" }}>No hay servicios disponibles</p>
                )}
              </div>
            )}
          </div>
        )}

        {seccionActiva === "disponibilidad" && (
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <h2 style={{ margin: "0 0 6px 0" }}>🕐 Gestionar Disponibilidad</h2>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
                Configura qué días se trabaja y completa los rangos horarios. Cada rango genera turnos cada 90 minutos.
              </p>
            </div>

            {/* Fila de días con toggles */}
            <div className="card" style={{ display: "grid", gap: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 13 }}>Estado de días</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 10 }}>
                {loadingDias ? (
                  <div style={{ color: 'var(--muted)' }}>Cargando días...</div>
                ) : errorDias ? (
                  <div style={{ color: 'red' }}>{errorDias}</div>
                ) : diasOrdenados.map(([dia, config]) => {
                  const diasLabels = {
                    lunes: "Lunes",
                    martes: "Martes",
                    miercoles: "Miércoles",
                    jueves: "Jueves",
                    viernes: "Viernes",
                    sabado: "Sábado",
                    domingo: "Domingo",
                  };
                  return (
                    <button
                      key={dia}
                      onClick={async () => {
                        if (dia !== "domingo" && config.id) {
                          try {
                            const response = await editarEstadoDia(config.id);
                            if (response && response.error) throw new Error(response.error);
                            await cargarEstadoDias();
                          } catch (err) {
                            setNotification({ message: "Error al editar estado del día: " + (err.message || err), type: "error" });
                          }
                        }
                      }}
                      disabled={dia === "domingo"}
                      style={{
                        display: "grid",
                        gap: 6,
                        textAlign: "center",
                        padding: 12,
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        background: config.habilitado ? "#d3f9d8" : "#f0f0f0",
                        cursor: dia === "domingo" ? "not-allowed" : "pointer",
                        opacity: dia === "domingo" ? 0.5 : 1,
                        fontWeight: 600,
                        fontSize: 12,
                        color: config.habilitado ? "#2f9e44" : "#666",
                        transition: "all 0.2s",
                      }}
                    >
                      <div>{diasLabels[dia]}</div>
                      <div style={{ fontSize: 14 }}>
                        {config.habilitado ? "🟢" : "🔴"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Configuración de rangos por día */}
            <div className="card" style={{ display: "grid", gap: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 13 }}>Rangos horarios por día</div>

              {diasOrdenados.map(([dia, config]) => {
                const diasLabels = {
                  lunes: "Lunes",
                  martes: "Martes",
                  miercoles: "Miércoles",
                  jueves: "Jueves",
                  viernes: "Viernes",
                  sabado: "Sábado",
                  domingo: "Domingo",
                };

                return (
                  <div
                    key={dia}
                    style={{
                      display: "grid",
                      gap: 10,
                      padding: 12,
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      background: config.habilitado ? "#fafafa" : "#f5f5f5",
                      opacity: !config.habilitado ? 0.6 : 1,
                      pointerEvents: !config.habilitado ? "none" : "auto",
                    }}
                  >
                    <div style={{ fontWeight: 900, fontSize: 14 }}>{diasLabels[dia]}</div>

                    {!config.habilitado && (
                      <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
                        Día deshabilitado
                      </div>
                    )}

                    {config.habilitado && (
                      <>
                        {/* Rangos del día */}
                        {config.rangos.map((rango, idx) => {
                          const turnos = rango.turnos || [];

                          return (
                            <div
                              key={`${dia}-${idx}`}
                              style={{
                                display: "grid",
                                gap: 8,
                                padding: 10,
                                background: "#fff",
                                border: "1px solid #e8e8e8",
                                borderRadius: 8,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 8,
                                }}
                              >
                                <div style={{ fontWeight: 700, fontSize: 13 }}>
                                  {rango.inicio} - {rango.fin}
                                </div>
                                <button
                                  onClick={() => eliminarRango(rango.id)}
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    padding: "4px"
                                  }}
                                  title="Eliminar rango"
                                >
                                  🗑️
                                </button>
                              </div>

                              {/* Listado de turnos */}
                              <div style={{ display: "grid", gap: 6, paddingTop: 6, borderTop: "1px solid #e8e8e8" }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>
                                  Turnos generados ({turnos.length}):
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: 6 }}>
                                  {turnos.map((turno, tIdx) => (
                                    <div
                                      key={`${dia}-${idx}-${tIdx}`}
                                      style={{
                                        padding: "6px 8px",
                                        background: "var(--accent)",
                                        borderRadius: 6,
                                        fontSize: 11,
                                        textAlign: "center",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {turno}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Formulario o Botón para agregar rango */}
                        {addingRango === dia ? (
                          <div style={{ marginTop: 10, padding: 10, background: "#f9f9f9", borderRadius: 8, border: "1px dashed var(--brand)" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Nuevo rango horario</div>
                            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 10, display: "block", color: "var(--muted)" }}>Inicio</label>
                                <input 
                                  type="time" 
                                  value={newRangoTimes.inicio} 
                                  onChange={e => setNewRangoTimes({...newRangoTimes, inicio: e.target.value})}
                                  style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #ccc", fontSize: 12 }}
                                />
                              </div>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 10, display: "block", color: "var(--muted)" }}>Fin</label>
                                <input 
                                  type="time" 
                                  value={newRangoTimes.fin} 
                                  onChange={e => setNewRangoTimes({...newRangoTimes, fin: e.target.value})}
                                  style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #ccc", fontSize: 12 }}
                                />
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button 
                                onClick={() => guardarNuevoRango(config.id)}
                                style={{ flex: 1, background: "var(--brand)", color: "white", border: "none", borderRadius: 6, padding: "6px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                              >
                                Guardar
                              </button>
                              <button 
                                onClick={() => setAddingRango(null)}
                                style={{ flex: 1, background: "#fff", border: "1px solid #ccc", borderRadius: 6, padding: "6px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setAddingRango(dia);
                              setNewRangoTimes({ inicio: "09:00", fin: "13:00" });
                            }}
                            style={{
                              marginTop: 10,
                              width: "100%",
                              padding: "8px",
                              background: "#fff",
                              color: "var(--brand)",
                              border: "1px dashed var(--brand)",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                          >
                            + Agregar rango horario
                          </button>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {seccionActiva === "galeria" && (
          <div className="card" style={{ maxWidth: 600 }}>
            <h2 style={{ margin: "0 0 14px 0" }}>📷 Subir a Galería</h2>
            
            <form onSubmit={submitGaleria} style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontWeight: 800, fontSize: 14 }}>Nombre del perro</label>
                <input
                  value={nombrePerroGaleria}
                  onChange={(e) => setNombrePerroGaleria(e.target.value)}
                  placeholder="Ej: Rocky"
                  required
                  style={{ padding: "10px 12px", borderRadius: 14, border: "1px solid var(--border)", outline: "none" }}
                />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontWeight: 800, fontSize: 14 }}>Servicio Realizado</label>
                <input
                  value={servicioGaleria}
                  onChange={(e) => setServicioGaleria(e.target.value)}
                  placeholder="Ej: Baño y Corte"
                  required
                  style={{ padding: "10px 12px", borderRadius: 14, border: "1px solid var(--border)", outline: "none" }}
                />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontWeight: 800, fontSize: 14 }}>Comentarios (Opcional)</label>
                <textarea
                  value={comentariosGaleria}
                  onChange={(e) => setComentariosGaleria(e.target.value)}
                  placeholder="Ej: Se portó muy bien..."
                  style={{ padding: "10px 12px", borderRadius: 14, border: "1px solid var(--border)", outline: "none", minHeight: 80 }}
                />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontWeight: 800, fontSize: 14 }}>Imagen</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImagenChange}
                  required
                  style={{ padding: "10px 12px", borderRadius: 14, border: "1px solid var(--border)", outline: "none" }}
                />
              </div>

              {errorGaleria && (
                <div style={{ padding: "10px 12px", borderRadius: 14, border: "1px solid #ffc9c9", background: "#fff1f1", color: "#b42323", fontWeight: 700, fontSize: 14, textAlign: "center" }}>
                  {errorGaleria}
                </div>
              )}

              {successGaleria && (
                <div style={{ padding: "10px 12px", borderRadius: 14, border: "1px solid #d3f9d8", background: "#f1fdf5", color: "#2f9e44", fontWeight: 700, fontSize: 14, textAlign: "center" }}>
                  {successGaleria}
                </div>
              )}

              <button className="btn btnPrimary" type="submit" disabled={loadingGaleria}>
                {loadingGaleria ? "Subiendo..." : "Subir Imagen"}
              </button>
            </form>
          </div>
        )}
      </div>

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
  );
}
